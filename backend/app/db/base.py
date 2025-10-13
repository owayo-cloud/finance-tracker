"""
SQLAlchemy base class for all models.
All database models inherit from this Base class.
"""

from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    """
    Base class for all SQLAlchemy models.
    Provides common functionality for all database tables.
    """
    pass