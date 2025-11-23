"""Utility functions for till/shift management"""
from typing import Optional
from sqlmodel import Session, select
from app.models import TillShift


def get_current_open_shift(session: Session) -> Optional[TillShift]:
    """Get the currently open till shift"""
    statement = (
        select(TillShift)
        .where(TillShift.status == "open")
        .order_by(TillShift.opening_time.desc())
    )
    return session.exec(statement).first()

