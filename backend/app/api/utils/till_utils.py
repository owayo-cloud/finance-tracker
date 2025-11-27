"""Utility functions for till/shift management"""

from sqlalchemy import desc
from sqlmodel import Session, col, select

from app.models import TillShift


def get_current_open_shift(session: Session) -> TillShift | None:
    """Get the currently open till shift"""
    statement = (
        select(TillShift)
        .where(TillShift.status == "open")
        .order_by(desc(col(TillShift.opening_time)))
    )
    return session.exec(statement).first()
