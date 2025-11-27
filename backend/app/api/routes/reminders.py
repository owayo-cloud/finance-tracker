"""
Reminder Settings & Logs API Routes

Handles email reminder configuration for supplier debts and reorder alerts.
Admins can configure when and how often to receive email reminders.
"""

import uuid
from datetime import datetime, timezone
from typing import Any

from fastapi import APIRouter, HTTPException
from sqlalchemy import desc
from sqlmodel import func, select

from app.api.deps import CurrentUser, SessionDep
from app.models import (
    Message,
    ReminderLog,
    ReminderLogsPublic,
    ReminderSetting,
    ReminderSettingCreate,
    ReminderSettingPublic,
    ReminderSettingsPublic,
    ReminderSettingUpdate,
)

router = APIRouter()


@router.get("/settings", response_model=ReminderSettingsPublic)
def list_reminder_settings(
    session: SessionDep,
    current_user: CurrentUser,
) -> Any:
    """
    Get current user's reminder configurations.

    **Access**: Admin only (for now)
    """
    if not current_user.is_superuser and current_user.role != "admin":
        raise HTTPException(
            status_code=403,
            detail="Only admin users can manage reminder settings",
        )

    statement = (
        select(ReminderSetting)
        .where(ReminderSetting.user_id == current_user.id)
        .order_by(ReminderSetting.reminder_type)
    )
    settings = session.exec(statement).all()

    return ReminderSettingsPublic(data=settings, count=len(settings))


@router.post("/settings", response_model=ReminderSettingPublic)
def create_reminder_setting(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    setting_in: ReminderSettingCreate,
) -> Any:
    """
    Create or update reminder setting.

    **Access**: Admin only
    """
    if not current_user.is_superuser and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admin can create reminders")

    # Check if setting for this type already exists
    existing_statement = (
        select(ReminderSetting)
        .where(ReminderSetting.user_id == current_user.id)
        .where(ReminderSetting.reminder_type == setting_in.reminder_type)
    )
    existing_setting = session.exec(existing_statement).first()

    if existing_setting:
        # Update existing setting
        update_data = setting_in.model_dump(exclude_unset=True, exclude={"user_id"})
        existing_setting.sqlmodel_update(update_data)
        existing_setting.updated_at = datetime.now(timezone.utc)
        session.add(existing_setting)
        session.commit()
        session.refresh(existing_setting)
        return existing_setting

    # Create new setting
    setting = ReminderSetting.model_validate(
        setting_in,
        update={"user_id": current_user.id},
    )
    session.add(setting)
    session.commit()
    session.refresh(setting)

    return setting


@router.get("/settings/{setting_id}", response_model=ReminderSettingPublic)
def get_reminder_setting(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    setting_id: uuid.UUID,
) -> Any:
    """
    Get single reminder setting.

    **Access**: Admin only (own settings)
    """
    if not current_user.is_superuser and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")

    statement = (
        select(ReminderSetting)
        .where(ReminderSetting.id == setting_id)
        .where(ReminderSetting.user_id == current_user.id)
    )
    setting = session.exec(statement).first()

    if not setting:
        raise HTTPException(
            status_code=404,
            detail="Reminder setting not found or does not belong to current user",
        )

    return setting


@router.patch("/settings/{setting_id}", response_model=ReminderSettingPublic)
def update_reminder_setting(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    setting_id: uuid.UUID,
    setting_in: ReminderSettingUpdate,
) -> Any:
    """
    Update reminder setting.

    **Access**: Admin only (own settings)
    """
    if not current_user.is_superuser and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")

    statement = (
        select(ReminderSetting)
        .where(ReminderSetting.id == setting_id)
        .where(ReminderSetting.user_id == current_user.id)
    )
    setting = session.exec(statement).first()

    if not setting:
        raise HTTPException(status_code=404, detail="Reminder setting not found")

    update_data = setting_in.model_dump(exclude_unset=True)
    setting.sqlmodel_update(update_data)
    setting.updated_at = datetime.now(timezone.utc)

    session.add(setting)
    session.commit()
    session.refresh(setting)

    return setting


@router.delete("/settings/{setting_id}", response_model=Message)
def delete_reminder_setting(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    setting_id: uuid.UUID,
) -> Any:
    """
    Delete reminder setting.

    **Access**: Admin only (own settings)
    """
    if not current_user.is_superuser and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")

    statement = (
        select(ReminderSetting)
        .where(ReminderSetting.id == setting_id)
        .where(ReminderSetting.user_id == current_user.id)
    )
    setting = session.exec(statement).first()

    if not setting:
        raise HTTPException(status_code=404, detail="Reminder setting not found")

    session.delete(setting)
    session.commit()

    return Message(message="Reminder setting deleted successfully")


@router.get("/logs", response_model=ReminderLogsPublic)
def list_reminder_logs(
    session: SessionDep,
    current_user: CurrentUser,
    skip: int = 0,
    limit: int = 100,
    status: str | None = None,
) -> Any:
    """
    View sent email history.

    **Access**: Admin only (own logs)
    """
    if not current_user.is_superuser and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")

    statement = (
        select(ReminderLog)
        .where(ReminderLog.user_id == current_user.id)
        .order_by(desc(ReminderLog.created_at))
    )

    if status:
        statement = statement.where(ReminderLog.status == status)

    # Get total count
    count_statement = select(func.count()).select_from(statement.subquery())
    total_count = session.exec(count_statement).one()

    # Apply pagination
    statement = statement.offset(skip).limit(limit)
    logs = session.exec(statement).all()

    return ReminderLogsPublic(data=logs, count=total_count)


@router.get("/statistics", response_model=dict[str, Any])
def get_reminder_statistics(
    session: SessionDep,
    current_user: CurrentUser,
) -> Any:
    """
    Get reminder statistics (sent count, failed count, etc.).

    **Access**: Admin only
    """
    if not current_user.is_superuser and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")

    # Total sent
    sent_statement = (
        select(func.count())
        .select_from(ReminderLog)
        .where(ReminderLog.user_id == current_user.id)
        .where(ReminderLog.status == "sent")
    )
    sent_count = session.exec(sent_statement).one() or 0

    # Total failed
    failed_statement = (
        select(func.count())
        .select_from(ReminderLog)
        .where(ReminderLog.user_id == current_user.id)
        .where(ReminderLog.status == "failed")
    )
    failed_count = session.exec(failed_statement).one() or 0

    # Last sent
    last_sent_statement = (
        select(ReminderLog)
        .where(ReminderLog.user_id == current_user.id)
        .where(ReminderLog.status == "sent")
        .order_by(desc(ReminderLog.created_at))
        .limit(1)
    )
    last_sent = session.exec(last_sent_statement).first()

    # Active settings count
    active_settings_statement = (
        select(func.count())
        .select_from(ReminderSetting)
        .where(ReminderSetting.user_id == current_user.id)
        .where(ReminderSetting.is_enabled.is_(True))
    )
    active_settings_count = session.exec(active_settings_statement).one() or 0

    return {
        "total_sent": sent_count,
        "total_failed": failed_count,
        "last_sent_at": last_sent.created_at if last_sent else None,
        "active_settings_count": active_settings_count,
        "success_rate": (
            round(sent_count / (sent_count + failed_count) * 100, 2)
            if (sent_count + failed_count) > 0
            else 0
        ),
    }


@router.get("/types", response_model=dict[str, list[str]])
def get_reminder_types() -> Any:
    """
    Get available reminder types and frequencies.
    """
    return {
        "reminder_types": [
            "supplier_debt_upcoming",
            "supplier_debt_due",
            "supplier_debt_overdue",
            "reorder_level",
            "low_stock_critical",
        ],
        "frequencies": ["daily", "weekly", "monthly", "custom"],
    }
