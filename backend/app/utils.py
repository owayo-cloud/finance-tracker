import logging
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any

import emails  # type: ignore
import jwt
from jinja2 import Template
from jwt.exceptions import InvalidTokenError

from app.core import security
from app.core.config import settings

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@dataclass
class EmailData:
    html_content: str
    subject: str


def render_email_template(*, template_name: str, context: dict[str, Any]) -> str:
    template_str = (
        Path(__file__).parent / "email-templates" / "build" / template_name
    ).read_text()
    html_content = Template(template_str).render(context)
    return html_content


def send_email(
    *,
    email_to: str,
    subject: str = "",
    html_content: str = "",
) -> None:
    assert settings.emails_enabled, "no provided configuration for email variables"
    message = emails.Message(
        subject=subject,
        html=html_content,
        mail_from=(settings.EMAILS_FROM_NAME, settings.EMAILS_FROM_EMAIL),
    )
    smtp_options = {"host": settings.SMTP_HOST, "port": settings.SMTP_PORT}
    if settings.SMTP_TLS:
        smtp_options["tls"] = True
    elif settings.SMTP_SSL:
        smtp_options["ssl"] = True
    if settings.SMTP_USER:
        smtp_options["user"] = settings.SMTP_USER
    if settings.SMTP_PASSWORD:
        smtp_options["password"] = settings.SMTP_PASSWORD
    response = message.send(to=email_to, smtp=smtp_options)
    logger.info(f"send email result: {response}")


def generate_test_email(email_to: str) -> EmailData:
    project_name = settings.PROJECT_NAME
    subject = f"{project_name} - Test email"
    html_content = render_email_template(
        template_name="test_email.html",
        context={"project_name": settings.PROJECT_NAME, "email": email_to},
    )
    return EmailData(html_content=html_content, subject=subject)


def generate_reset_password_email(email_to: str, email: str, token: str) -> EmailData:
    project_name = settings.PROJECT_NAME
    subject = f"{project_name} - Password recovery for user {email}"
    link = f"{settings.FRONTEND_HOST}/reset-password?token={token}"
    html_content = render_email_template(
        template_name="reset_password.html",
        context={
            "project_name": settings.PROJECT_NAME,
            "username": email,
            "email": email_to,
            "valid_hours": settings.EMAIL_RESET_TOKEN_EXPIRE_HOURS,
            "link": link,
        },
    )
    return EmailData(html_content=html_content, subject=subject)


def generate_new_account_email(
    email_to: str, username: str, password: str
) -> EmailData:
    project_name = settings.PROJECT_NAME
    subject = f"{project_name} - New account for user {username}"
    html_content = render_email_template(
        template_name="new_account.html",
        context={
            "project_name": settings.PROJECT_NAME,
            "username": username,
            "password": password,
            "email": email_to,
            "link": settings.FRONTEND_HOST,
        },
    )
    return EmailData(html_content=html_content, subject=subject)


def generate_debt_reminder_email(
    email_to: str,
    username: str,
    supplier_name: str,
    total_overdue: str,
    currency: str,
    debt_count: int,
    debts: list[dict[str, Any]],
) -> EmailData:
    project_name = settings.PROJECT_NAME
    subject = f"{project_name} - Overdue Payments: {supplier_name}"
    link = f"{settings.FRONTEND_HOST}/supplier-debts"
    html_content = render_email_template(
        template_name="debt_reminder.html",
        context={
            "project_name": settings.PROJECT_NAME,
            "username": username,
            "supplier_name": supplier_name,
            "total_overdue": total_overdue,
            "currency": currency,
            "debt_count": debt_count,
            "debts": debts,
            "link": link,
        },
    )
    return EmailData(html_content=html_content, subject=subject)


def generate_reorder_alert_email(
    email_to: str,
    username: str,
    products: list[dict[str, Any]],
    product_count: int,
) -> EmailData:
    project_name = settings.PROJECT_NAME
    subject = f"{project_name} - Reorder Alert: {product_count} Product(s) Low in Stock"
    link = f"{settings.FRONTEND_HOST}/products"
    html_content = render_email_template(
        template_name="reorder_alert.html",
        context={
            "project_name": settings.PROJECT_NAME,
            "username": username,
            "products": products,
            "product_count": product_count,
            "link": link,
        },
    )
    return EmailData(html_content=html_content, subject=subject)


def generate_low_stock_notification_email(
    email_to: str,
    username: str,
    product_name: str,
    current_stock: int,
    reorder_level: int,
    product_category: str | None = None,
    product_id: str | None = None,
) -> EmailData:
    project_name = settings.PROJECT_NAME
    subject = f"{project_name} - Low Stock Alert: {product_name}"
    link = f"{settings.FRONTEND_HOST}/products/{product_id}" if product_id else f"{settings.FRONTEND_HOST}/products"
    html_content = render_email_template(
        template_name="low_stock_notification.html",
        context={
            "project_name": settings.PROJECT_NAME,
            "username": username,
            "product_name": product_name,
            "current_stock": current_stock,
            "reorder_level": reorder_level,
            "product_category": product_category,
            "link": link,
        },
    )
    return EmailData(html_content=html_content, subject=subject)


def generate_password_reset_token(email: str) -> str:
    delta = timedelta(hours=settings.EMAIL_RESET_TOKEN_EXPIRE_HOURS)
    now = datetime.now(timezone.utc)
    expires = now + delta
    exp = expires.timestamp()
    encoded_jwt = jwt.encode(
        {"exp": exp, "nbf": now, "sub": email},
        settings.SECRET_KEY,
        algorithm=security.ALGORITHM,
    )
    return encoded_jwt


def verify_password_reset_token(token: str) -> str | None:
    try:
        decoded_token = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[security.ALGORITHM]
        )
        return str(decoded_token["sub"])
    except InvalidTokenError:
        return None
