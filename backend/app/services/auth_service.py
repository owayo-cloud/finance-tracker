from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from fastapi import HTTPException
from app.models.user import User
from app.models.refresh_token import RefreshToken
from app.schemas.auth import TokenResponse
from app.services.token_service import create_access_token, create_refresh_token
from app.core.security import verify_password, hash_password
from datetime import datetime, timedelta
from app.core.config import settings

async def register_user(db: AsyncSession, email: str, password: str, full_name: str):
    # Check if user already exists
    result = await db.execute(select(User).filter(User.email == email))
    existing_user = result.scalar_one_or_none()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create new user
    user = User(email=email, hashed_password=hash_password(password), name=full_name)
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user

async def authenticate_user(db: AsyncSession, email: str, password: str):
    result = await db.execute(select(User).filter(User.email == email))
    user = result.scalar_one_or_none()
    # Fixed: use hashed_password instead of password
    if not user or not verify_password(password, user.hashed_password):
        return None
    return user

async def create_tokens_for_user(db: AsyncSession, user: User):
    access_token = create_access_token({"sub": str(user.id)})
    refresh_token = create_refresh_token({"sub": str(user.id)})

    db_token = RefreshToken(
        user_id=user.id,
        token=refresh_token,
        expires_at=datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
    )
    db.add(db_token)
    await db.commit()
    
    #return token expiry in seconds
    return TokenResponse(
        access_token=access_token, 
        refresh_token=refresh_token,
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
        )