"""
Account model representing user financial accounts.
"""

from sqlalchemy import Column, Integer, String, Numeric, Boolean, DateTime, ForeignKey, Enum as SQLEnum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import enum

from app.db.base import Base


class AccountType(enum.Enum):
    """Enum for different account types."""
    wallet = "wallet"
    bank = "bank"
    credit_card = "credit_card"
    cash = "cash"


class Account(Base):
    """
    Account model for managing different financial accounts.
    Users can have multiple accounts (bank accounts, wallets, credit cards, etc.)
    
    Relationships:
        - user: Many-to-one with User
        - transactions: One-to-many with Transaction
    """
    
    __tablename__ = "accounts"
    
    # Primary Key
    id = Column(Integer, primary_key=True, index=True)
    
    # Foreign Key
    user_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    
    # Account Information
    name = Column(String(100), nullable=False)
    type = Column(SQLEnum(AccountType), nullable=False, default=AccountType.wallet)
    balance = Column(Numeric(15, 2), nullable=False, default=0.00)
    currency = Column(String(3), nullable=False, default="USD")  # ISO 4217 currency codes
    
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
    user = relationship("User", back_populates="accounts")
    # transactions = relationship("Transaction", back_populates="account", lazy="select")
    
    def __repr__(self):
        """String representation for debugging."""
        return f"<Account(id={self.id}, name={self.name}, balance={self.balance}, type={self.type.value})>"