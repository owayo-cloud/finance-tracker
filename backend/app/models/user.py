"""
User model representing application users.
"""

from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.db.base import Base


class User(Base):
    """
    User model for authentication and authorization.
    
    Relationships:
        - accounts: One-to-many with Account
        - categories: One-to-many with Category
        - transactions: One-to-many with Transaction
        - budgets: One-to-many with Budget
        - refresh_tokens: One-to-many with RefreshToken
    """
    
    __tablename__ = "users"
    
    # Primary Key
    id = Column(Integer, primary_key=True, index=True)
    
    # User Information
    name = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    
    # Account Status
    is_active = Column(Boolean, default=True, nullable=False)
    is_deleted = Column(Boolean, default=False, index=True, nullable=False)
    
    # Timestamps
    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False
    )
    
    # Relationships (will be uncommented as we create other models)
    # accounts = relationship("Account", back_populates="user", lazy="select")
    # categories = relationship("Category", back_populates="user", lazy="select")
    # transactions = relationship("Transaction", back_populates="user", lazy="select")
    # budgets = relationship("Budget", back_populates="user", lazy="select")
    # refresh_tokens = relationship("RefreshToken", back_populates="user", lazy="select")
    
    def __repr__(self):
        """String representation for debugging."""
        return f"<User(id={self.id}, email={self.email}, name={self.name})>"