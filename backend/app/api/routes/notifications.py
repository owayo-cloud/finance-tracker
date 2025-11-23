"""
Notification Management API Routes

Handles in-app notifications (bell icon 🔔) for users.
Notifications provide real-time updates about supplier debts, reorder alerts,
GRN approvals, and other system events.
"""
import uuid
from datetime import datetime, timezone
from typing import Any

from fastapi import APIRouter, HTTPException
from sqlmodel import func, select

from app import crud
from app.api.deps import CurrentUser, SessionDep
from app.models import (
    Message,
    Notification,
    NotificationPublic,
    NotificationsPublic,
    NotificationUpdate,
)

router = APIRouter()


@router.get("/", response_model=NotificationsPublic)
def list_notifications(
    session: SessionDep,
    current_user: CurrentUser,
    skip: int = 0,
    limit: int = 50,
    is_read: bool | None = None,
    notification_type: str | None = None,
    priority: str | None = None,
) -> Any:
    """
    List current user's notifications with filtering.
    
    Returns notifications paginated with unread count.
    """
    # Build query for user's notifications
    statement = select(Notification).where(Notification.user_id == current_user.id)
    
    # Apply filters
    if is_read is not None:
        statement = statement.where(Notification.is_read == is_read)
    if notification_type:
        statement = statement.where(Notification.notification_type == notification_type)
    if priority:
        statement = statement.where(Notification.priority == priority)
    
    # Order by created_at desc (newest first)
    statement = statement.order_by(Notification.created_at.desc())
    
    # Get total count
    count_statement = select(func.count()).select_from(statement.subquery())
    total_count = session.exec(count_statement).one()
    
    # Get unread count
    unread_statement = (
        select(func.count())
        .select_from(Notification)
        .where(Notification.user_id == current_user.id)
        .where(Notification.is_read == False)
    )
    unread_count = session.exec(unread_statement).one()
    
    # Apply pagination
    statement = statement.offset(skip).limit(limit)
    notifications = session.exec(statement).all()
    
    return NotificationsPublic(
        data=notifications,
        count=total_count,
        unread_count=unread_count,
    )


@router.get("/unread-count", response_model=dict[str, int])
def get_unread_count(
    session: SessionDep,
    current_user: CurrentUser,
) -> Any:
    """
    Get count of unread notifications for current user.
    
    Used for badge display on notification bell icon.
    """
    statement = (
        select(func.count())
        .select_from(Notification)
        .where(Notification.user_id == current_user.id)
        .where(Notification.is_read == False)
    )
    count = session.exec(statement).one()
    
    return {"unread_count": count}


@router.patch("/{notification_id}/read", response_model=NotificationPublic)
def mark_as_read(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    notification_id: uuid.UUID,
) -> Any:
    """
    Mark notification as read.
    
    User can only mark their own notifications as read.
    """
    notification = crud.mark_notification_read(
        session=session,
        notification_id=notification_id,
        user_id=current_user.id,
    )
    
    if not notification:
        raise HTTPException(
            status_code=404,
            detail="Notification not found or does not belong to current user",
        )
    
    return notification


@router.patch("/mark-all-read", response_model=Message)
def mark_all_as_read(
    *,
    session: SessionDep,
    current_user: CurrentUser,
) -> Any:
    """
    Mark all notifications as read for current user.
    """
    statement = (
        select(Notification)
        .where(Notification.user_id == current_user.id)
        .where(Notification.is_read == False)
    )
    unread_notifications = session.exec(statement).all()
    
    count = 0
    for notification in unread_notifications:
        notification.is_read = True
        notification.read_at = datetime.now(timezone.utc)
        session.add(notification)
        count += 1
    
    session.commit()
    
    return Message(message=f"Marked {count} notifications as read")


@router.delete("/{notification_id}", response_model=Message)
def delete_notification(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    notification_id: uuid.UUID,
) -> Any:
    """
    Delete a notification.
    
    User can only delete their own notifications.
    """
    statement = (
        select(Notification)
        .where(Notification.id == notification_id)
        .where(Notification.user_id == current_user.id)
    )
    notification = session.exec(statement).first()
    
    if not notification:
        raise HTTPException(
            status_code=404,
            detail="Notification not found or does not belong to current user",
        )
    
    session.delete(notification)
    session.commit()
    
    return Message(message="Notification deleted successfully")


@router.get("/types", response_model=dict[str, list[str]])
def get_notification_types() -> Any:
    """
    Get list of available notification types for filtering.
    """
    return {
        "notification_types": [
            "supplier_debt_created",
            "supplier_debt_overdue",
            "supplier_debt_payment",
            "reorder_alert",
            "grn_approval_needed",
            "grn_approved",
            "grn_rejected",
            "low_stock",
            "system_alert",
        ],
        "priorities": ["info", "warning", "critical"],
    }
