from sqlalchemy.sql import func
from sqlalchemy import Column, Integer,Boolean, Numeric, String, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
import enum
from app.db.base import Base


class TransactionType(str, enum.Enum):
    income = "income"
    expense = "expense"

class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    account_id = Column(Integer, ForeignKey("accounts.id", ondelete="CASCADE"))
    category_id = Column(Integer, ForeignKey("categories.id", ondelete="SET NULL"))
    amount = Column(Numeric(12, 2), nullable=False)
    type = Column(Enum(TransactionType), nullable=False)
    note = Column(String(255))
    date = Column(DateTime, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="transactions")
    account = relationship("Account", back_populates="transactions")
    category = relationship("Category", back_populates="transactions")
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
    type = Column(Enum(CategoryType), nullable=False, index=True)
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
    transactions = relationship("Transaction", back_populates="category", lazy="select")
    budgets = relationship("Budget", back_populates="category", lazy="select")
    
    def __repr__(self):
        """String representation for debugging."""
        return f"<Category(id={self.id}, name={self.name}, type={self.type.value})>"


class Budget(Base):
    """
    Represents a user's budget for a specific category or account.
    """
    __tablename__ = "budgets"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    category_id = Column(Integer, ForeignKey("categories.id", ondelete="CASCADE"), nullable=False)
    amount = Column(Numeric(12, 2), nullable=False)
    spent = Column(Numeric(12, 2), default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    user = relationship("User", back_populates="budgets")
    category = relationship("Category", back_populates="budgets")



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
    type = Column(Enum(AccountType), nullable=False, default=AccountType.wallet)
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
    transactions = relationship("Transaction", back_populates="account", lazy="select")
    
    def __repr__(self):
        """String representation for debugging."""
        return f"<Account(id={self.id}, name={self.name}, balance={self.balance}, type={self.type.value})>"


class RefreshToken(Base):
    """
    RefreshToken model for secure token management.
    Stores refresh tokens to allow token revocation and tracking.
    
    Relationships:
        - user: Many-to-one with User
    """
    
    __tablename__ = "refresh_tokens"
    
    # Primary Key
    id = Column(Integer, primary_key=True, index=True)
    
    # Foreign Key
    user_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    
    # Token Information
    token = Column(String(500), unique=True, index=True, nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=False, index=True)
    is_revoked = Column(Boolean, default=False, nullable=False)
    
    # Timestamps
    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )
    
    # Relationships
    user = relationship("User", back_populates="refresh_tokens")
    
    def __repr__(self):
        """String representation for debugging."""
        return f"<RefreshToken(id={self.id}, user_id={self.user_id}, revoked={self.is_revoked})>"

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
    
    # Relationships
    accounts = relationship("Account", back_populates="user", lazy="select")
    categories = relationship("Category", back_populates="user", lazy="select")
    transactions = relationship("Transaction", back_populates="user", lazy="select")
    budgets = relationship("Budget", back_populates="user", lazy="select")
    refresh_tokens = relationship("RefreshToken", back_populates="user", lazy="select", cascade="all, delete-orphan")
    
    def __repr__(self):
        """String representation for debugging."""
        return f"<User(id={self.id}, email={self.email}, name={self.name})>"