"""
Category model for classifying transactions.
"""

from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Enum as SQLEnum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import enum

from app.db.base import Base


class CategoryType(enum.Enum):
    """Enum for transaction category types."""
    income = "income"
    expense = "expense"


class Category(Base):
    """
    Category model for organizing transactions.
    Users can create custom categories for income and expenses.
    
    Relationships:
        - user: Many-to-one with User
        - transactions: One-to-many with Transaction
        - budgets: One-to-many with Budget
    """
    
    __tablename__ = "categories"
    
    # Primary Key
    id = Column(Integer, primary_key=True, index=True)
    
    # Foreign Key
    user_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    
    # Category Information
    name = Column(String(100), nullable=False)
    type = Column(SQLEnum(CategoryType), nullable=False, index=True)
    icon = Column(String(50), nullable=True)  # Icon identifier for UI
    color = Column(String(7), nullable=True)  # Hex color code (e.g., #FF5733)
    
    # Status
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
    
    # Relationships
    user = relationship("User", back_populates="categories")
    # transactions = relationship("Transaction", back_populates="category", lazy="select")
    # budgets = relationship("Budget", back_populates="category", lazy="select")
    
    def __repr__(self):
        """String representation for debugging."""
        return f"<Category(id={self.id}, name={self.name}, type={self.type.value})>"