from datetime import timedelta
import datetime
from time import timezone
from typing import Annotated, Any

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import HTMLResponse
from fastapi.security import OAuth2PasswordRequestForm

from app import crud
from app.api.deps import CurrentUser, SessionDep, get_current_active_superuser
from app.core import security
from app.core.config import settings
from app.core.security import create_refresh_token, get_password_hash
from app.models import User, Message, NewPassword, RefreshToken, RefreshTokenRequest, Token, UserPublic
from app.utils import (
    generate_password_reset_token,
    generate_reset_password_email,
    send_email,
    verify_password_reset_token,
)

router = APIRouter(tags=["login"])


@router.post("/login/access-token")
def login_access_token(
    session: SessionDep, form_data: Annotated[OAuth2PasswordRequestForm, Depends()]
) -> Token:
    """
    OAuth2 compatible token login, get an access token for future requests.
    Supports login with email or username (case insensitive for username).
    """
    user = crud.authenticate(
        session=session, email=form_data.username, password=form_data.password
    )
    if not user:
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    elif not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = security.create_access_token(
        user.id, expires_delta=access_token_expires
    )

    # create refresh token
    refresh_token_value = create_refresh_token()
    refresh_token_expires = datetime.now(timezone.utc) + timedelta(
        days=settings.REFRESH_TOKEN_EXPIRE_DAYS
    )

    refresh_token = RefreshToken(
        user_id=user.id,
        token=refresh_token_value,
        expires_at=refresh_token_expires,
    )
    session.add(refresh_token)
    session.commit()

    return Token(
        access_token=access_token,
        refresh_token=refresh_token_value,
    )


@router.post("/login/refresh-token")
def refresh_token(session: SessionDep, body: RefreshTokenRequest) -> Token:
    """
    Refresh access token using refresh token
    """

    refresh_token = (
        session.query(RefreshToken)
        .filter(
            RefreshToken.token == body.refresh_token,
            not RefreshToken.revoked,
            RefreshToken.expires_at > datetime.now(timezone.utc),
        )
        .first()
    )
    if not refresh_token:
        raise HTTPException(status_code=400, detail="Invalid or expired refresh token")

    # Get user
    user = session.get(User, refresh_token.user_id)
    if not user or user.is_active:
        raise HTTPException(status_code=404, detail="User not found or inactive")

    # Create new access token
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = security.create_access_token(
        user.id, expires_delta=access_token_expires
    )

    return Token(
        access_token=access_token,
        refresh_token=body.refresh_token,
    )


@router.post("/login/revoke-refresh-token")
def revoke_refresh_token(
    session: SessionDep, body: RefreshTokenRequest, current_user: CurrentUser
) -> Message:
    """
    Revoke a refresh token (logout)
    """
    refresh_token = (
        session.query(RefreshToken)
        .filter(
            RefreshToken.token == body.refresh_token,
            RefreshToken.user_id == current_user.id,
        )
        .first()
    )
    if refresh_token:
        refresh_token.revoked = True
        session.add(refresh_token)
        session.commit()

    return Message(message="Refresh token revoked successfully")


@router.post("/login/test-token", response_model=UserPublic)
def test_token(current_user: CurrentUser) -> Any:
    """
    Test access token
    """
    return current_user


@router.post("/password-recovery/{email}")
def recover_password(email: str, session: SessionDep) -> Message:
    """
    Password Recovery
    """
    user = crud.get_user_by_email(session=session, email=email)

    if not user:
        raise HTTPException(
            status_code=404,
            detail="The user with this email does not exist in the system.",
        )
    password_reset_token = generate_password_reset_token(email=email)
    email_data = generate_reset_password_email(
        email_to=user.email, email=email, token=password_reset_token
    )
    send_email(
        email_to=user.email,
        subject=email_data.subject,
        html_content=email_data.html_content,
    )
    return Message(message="Password recovery email sent")


@router.post("/reset-password/")
def reset_password(session: SessionDep, body: NewPassword) -> Message:
    """
    Reset password
    """
    email = verify_password_reset_token(token=body.token)
    if not email:
        raise HTTPException(status_code=400, detail="Invalid token")
    user = crud.get_user_by_email(session=session, email=email)
    if not user:
        raise HTTPException(
            status_code=404,
            detail="The user with this email does not exist in the system.",
        )
    elif not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    hashed_password = get_password_hash(password=body.new_password)
    user.hashed_password = hashed_password
    session.add(user)
    session.commit()
    return Message(message="Password updated successfully")


@router.post(
    "/password-recovery-html-content/{email}",
    dependencies=[Depends(get_current_active_superuser)],
    response_class=HTMLResponse,
)
def recover_password_html_content(email: str, session: SessionDep) -> Any:
    """
    HTML Content for Password Recovery
    """
    user = crud.get_user_by_email(session=session, email=email)

    if not user:
        raise HTTPException(
            status_code=404,
            detail="The user with this username does not exist in the system.",
        )
    password_reset_token = generate_password_reset_token(email=email)
    email_data = generate_reset_password_email(
        email_to=user.email, email=email, token=password_reset_token
    )

    return HTMLResponse(
        content=email_data.html_content, headers={"subject:": email_data.subject}
    )
