import uuid
from datetime import datetime, timezone
from decimal import Decimal

from pydantic import EmailStr, field_validator, model_validator
from sqlmodel import Field, Relationship, SQLModel, Column
from sqlalchemy import JSON

from typing import Optional, TYPE_CHECKING

if TYPE_CHECKING:
    from uuid import UUID


# Shared properties
class UserBase(SQLModel):
    email: EmailStr = Field(unique=True, index=True, max_length=255)
    is_active: bool = True
    is_superuser: bool = False
    full_name: Optional[str] = Field(default=None, max_length=255)


# Properties to receive via API on creation
class UserCreate(UserBase):
    password: str = Field(min_length=8, max_length=40)


class UserRegister(SQLModel):
    email: EmailStr = Field(max_length=255)
    password: str = Field(min_length=8, max_length=40)
    full_name: Optional[str] = Field(default=None, max_length=255)


# Properties to receive via API on update, all are optional
class UserUpdate(UserBase):
    email: Optional[EmailStr] = Field(default=None, max_length=255)  # type: ignore
    password: Optional[str] = Field(default=None, min_length=8, max_length=40)


class UserUpdateMe(SQLModel):
    full_name: Optional[str] = Field(default=None, max_length=255)
    email: Optional[EmailStr] = Field(default=None, max_length=255)


class UpdatePassword(SQLModel):
    current_password: str = Field(min_length=8, max_length=40)
    new_password: str = Field(min_length=8, max_length=40)


# Database model, database table inferred from class name
class User(UserBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    hashed_password: str
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
    # Relationships
    products: list["Product"] = Relationship(back_populates="created_by")
    stock_entries: list["StockEntry"] = Relationship(back_populates="created_by")
    sales: list["Sale"] = Relationship(back_populates="created_by")
    expenses: list["Expense"] = Relationship(back_populates="created_by")
    debts: list["Debt"] = Relationship(back_populates="created_by")
    debt_payments: list["DebtPayment"] = Relationship(back_populates="created_by")
    shift_reconciliations: list["ShiftReconciliation"] = Relationship(back_populates="created_by")


# Properties to return via API, id is always required
class UserPublic(UserBase):
    id: uuid.UUID


class UsersPublic(SQLModel):
    data: list[UserPublic]
    count: int


# ==================== MEDIA MODELS ====================

class MediaBase(SQLModel):
    file_path: str = Field(max_length=500)
    file_name: str = Field(max_length=255)
    mime_type: Optional[str] = Field(default=None, max_length=100)
    size: int


class MediaCreate(MediaBase):
    pass


class MediaUpdate(SQLModel):
    file_name: Optional[str] = Field(default=None, max_length=255)
    mime_type: Optional[str] = None


class Media(MediaBase, table=True):
    __tablename__ = "media"
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
    # Relationships
    products: list["Product"] = Relationship(back_populates="image")
    

class MediaPublic(MediaBase):
    id: uuid.UUID
    created_at: datetime
    url: Optional[str] = None  # Added for serving the image
    
    model_config = {"from_attributes": True}
    

# ==================== CATEGORY MODELS ====================

class ProductCategoryBase(SQLModel):
    name: str = Field(max_length=255, unique=True, index=True)
    description: Optional[str] = Field(default=None, max_length=500)
    

class ProductCategoryCreate(ProductCategoryBase):
    pass


class ProductCategoryUpdate(SQLModel):
    name: Optional[str] = Field(default=None, max_length=255)
    description: Optional[str] = Field(default=None, max_length=500)
    

class ProductCategory(ProductCategoryBase, table=True):
    __tablename__ = "product_category"
    """
    Categories: Bottles, Cans, Wines, Others
    (Or more specific: Whisky, Vodka, Wine, Champagne, Cognac, Brandy, Liqueur
    Beers, Ciders, Beers-infusions, Tequila, Rum, Gin, Soft-Drinks, Smokes)
    """
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
    # Relationships
    products: list["Product"] = Relationship(back_populates="category")
    
class ProductCategoryPublic(ProductCategoryBase):
    id: uuid.UUID
    created_at: datetime
    
    model_config = {"from_attributes": True}


class ProductCategoriesPublic(SQLModel):
    data: list[ProductCategoryPublic]
    count: int
    

# ==================== PRODUCT STATUS MODELS ====================
class ProductStatusBase(SQLModel):
    name: str = Field(max_length=100, unique=True, index=True)
    description: Optional[str] = Field(default=None, max_length=500)
    

class ProductStatusCreate(ProductStatusBase):
    pass


class ProductStatusUpdate(SQLModel):
    name: Optional[str] = Field(default=None, max_length=100)
    description: Optional[str] = Field(default=None, max_length=500)
    

class ProductStatus(ProductStatusBase, table=True):
    __tablename__ = "product_status"
    """
    Statuses: Active, Inactive, Out of Stock, Discontinued, Coming Soon
    """
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
    # Relationships
    products: list["Product"] = Relationship(back_populates="status")


class ProductStatusPublic(ProductStatusBase):
    id: uuid.UUID
    
    model_config = {"from_attributes": True}
    
    
# ==================== PRODUCT MODELS ====================

class ProductBase(SQLModel):
    name: str = Field(max_length=255, index=True)
    description: Optional[str] = Field(default=None, max_length=1000)
    buying_price: Decimal = Field(decimal_places=2, gt=0)
    selling_price: Decimal = Field(decimal_places=2, gt=0)
    current_stock: int = Field(default=0, ge=0)
    reorder_level: Optional[int] = Field(default=None, ge=0)
    category_id: uuid.UUID = Field(foreign_key="product_category.id")
    status_id: uuid.UUID = Field(foreign_key="product_status.id")
    image_id: Optional[uuid.UUID] = Field(default=None, foreign_key="media.id")
    
    @model_validator(mode="after")
    def validate_selling_price(self) -> "ProductBase":
        """Ensure selling price is greater than buying price"""
        if self.selling_price <= self.buying_price:
            raise ValueError("Selling price must be greater than buying price")
        return self

class ProductCreate(ProductBase):
    pass


class ProductUpdate(SQLModel):
    name: Optional[str] = Field(default=None, max_length=255)
    description: Optional[str] = Field(default=None, max_length=1000)
    buying_price: Optional[Decimal] = Field(default=None, decimal_places=2, gt=0)
    selling_price: Optional[Decimal] = Field(default=None, decimal_places=2, gt=0)
    current_stock: Optional[int] = Field(default=None, ge=0)
    reorder_level: Optional[int] = Field(default=None, ge=0)
    category_id: Optional[uuid.UUID] = Field(default=None, foreign_key="product_category.id")
    status_id: Optional[uuid.UUID] = Field(default=None, foreign_key="product_status.id")
    image_id: Optional[uuid.UUID] = Field(default=None, foreign_key="media.id")

class Product(ProductBase, table=True):
    __tablename__ = "product"
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    created_by_id: uuid.UUID = Field(foreign_key="user.id")
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    deleted_at: Optional[datetime] = None
    
    # Relationships
    category: ProductCategory = Relationship(back_populates="products")
    status: ProductStatus = Relationship(back_populates="products")
    created_by: User = Relationship(back_populates="products")
    image: Optional[Media] = Relationship(back_populates="products")
    stock_entries: list["StockEntry"] = Relationship(back_populates="product")
    sales: list["Sale"] = Relationship(back_populates="product")

class ProductPublic(ProductBase):
    id: uuid.UUID
    created_at: datetime
    category: ProductCategoryPublic
    status: ProductStatusPublic
    image: Optional[MediaPublic]
    
    model_config = {"from_attributes": True}

class ProductsPublic(SQLModel):
    data: list[ProductPublic]
    count: int


# ==================== STOCK ENTRY MODELS ====================

class StockEntryBase(SQLModel):
    product_id: uuid.UUID = Field(foreign_key="product.id")
    entry_date: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), index=True)
    opening_stock: int = Field(ge=0)  # Stock at beginning of day (read-only for cashiers)
    added_stock: int = Field(default=0, ge=0)  # Incoming stock/goods received
    total_stock: int = Field(ge=0)  # Opening + Added (computed)
    sales: int = Field(default=0, ge=0)  # Number of units sold
    closing_stock: int = Field(ge=0)  # Stock at end of day (computed: total - sales)
    physical_count: Optional[int] = Field(default=None, ge=0)  # Manual count at shift end
    variance: Optional[int] = Field(default=None)  # physical_count - closing_stock (can be negative)
    amount: Optional[Decimal] = Field(default=None, decimal_places=2)  # Total sales amount
    notes: Optional[str] = Field(default=None, max_length=1000)
    
    @model_validator(mode="after")
    def validate_stock_calculations(self) -> "StockEntryBase":
        """Ensure stock calculations are correct"""
        expected_total = self.opening_stock + self.added_stock
        if self.total_stock != expected_total:
            raise ValueError(
                f"Total stock ({self.total_stock}) must equal opening_stock ({self.opening_stock}) + added_stock ({self.added_stock}) = {expected_total}"
            )
        expected_closing = self.total_stock - self.sales
        if self.closing_stock != expected_closing:
            raise ValueError(
                f"Closing stock ({self.closing_stock}) must equal total_stock ({self.total_stock}) - sales ({self.sales}) = {expected_closing}"
            )
        if self.physical_count is not None and self.variance is not None:
            expected_variance = self.physical_count - self.closing_stock
            if self.variance != expected_variance:
                raise ValueError(
                    f"Variance ({self.variance}) must equal physical_count ({self.physical_count}) - closing_stock ({self.closing_stock}) = {expected_variance}"
                )
        return self

class StockEntryCreate(StockEntryBase):
    pass

class StockEntryUpdate(SQLModel):
    added_stock: Optional[int] = Field(default=None, ge=0)
    sales: Optional[int] = Field(default=None, ge=0)
    closing_stock: Optional[int] = Field(default=None, ge=0)
    physical_count: Optional[int] = Field(default=None, ge=0)
    variance: Optional[int] = None
    amount: Optional[Decimal] = Field(default=None, decimal_places=2)
    notes: Optional[str] = None

class StockEntry(StockEntryBase, table=True):
    __tablename__ = "stock_entry"
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    created_by_id: uuid.UUID = Field(foreign_key="user.id")
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
    # Relationships
    product: Product = Relationship(back_populates="stock_entries")
    created_by: User = Relationship(back_populates="stock_entries")

class StockEntryPublic(StockEntryBase):
    id: uuid.UUID
    created_at: datetime
    product: ProductPublic
    
    model_config = {"from_attributes": True}

class StockEntriesPublic(SQLModel):
    data: list[StockEntryPublic]
    count: int

# ==================== TOKEN MODELS ====================
    
# JSON payload containing access token
class Token(SQLModel):
    access_token: str
    token_type: str = "bearer"


# Contents of JWT token
class TokenPayload(SQLModel):
    sub: Optional[str] = None


class NewPassword(SQLModel):
    token: str
    new_password: str = Field(min_length=8, max_length=40)


# ==================== STOCK REPORT MODELS ====================

class DailyStockReport(SQLModel):
    """Model for daily stock summary report"""
    date: datetime
    category: str
    total_opening_stock: int
    total_added_stock: int
    total_sales: int
    total_closing_stock: int
    total_amount: Decimal

class ProductStockSummary(SQLModel):
    """Model for individual product stock summary"""
    product_id: uuid.UUID
    product_name: str
    category: str
    current_stock: int
    reorder_level: Optional[int]
    needs_reorder: bool
    buying_price: Decimal
    selling_price: Decimal
    image_url: Optional[str]

# Generic message
class Message(SQLModel):
    message: str


# ==================== PAYMENT METHOD MODELS ====================

class PaymentMethodBase(SQLModel):
    name: str = Field(max_length=100, unique=True, index=True)  # Cash, M-Pesa, Bank Transfer, Credit
    description: Optional[str] = Field(default=None, max_length=500)
    is_active: bool = True


class PaymentMethodCreate(PaymentMethodBase):
    pass


class PaymentMethodUpdate(SQLModel):
    name: Optional[str] = Field(default=None, max_length=100)
    description: Optional[str] = None
    is_active: Optional[bool] = None


class PaymentMethod(PaymentMethodBase, table=True):
    __tablename__ = "payment_method"
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
    # Relationships
    sales: list["Sale"] = Relationship(back_populates="payment_method")
    debt_payments: list["DebtPayment"] = Relationship(back_populates="payment_method")


class PaymentMethodPublic(PaymentMethodBase):
    id: uuid.UUID


class PaymentMethodsPublic(SQLModel):
    data: list[PaymentMethodPublic]
    count: int


# ==================== SALES MODELS ====================

class SaleBase(SQLModel):
    product_id: uuid.UUID = Field(foreign_key="product.id")
    quantity: int = Field(gt=0)
    unit_price: Decimal = Field(decimal_places=2, gt=0)
    total_amount: Decimal = Field(decimal_places=2, gt=0)  # quantity * unit_price
    payment_method_id: uuid.UUID = Field(foreign_key="payment_method.id")
    customer_name: Optional[str] = Field(default=None, max_length=255)  # For credit sales
    notes: Optional[str] = Field(default=None, max_length=1000)
    
    @model_validator(mode="after")
    def validate_total_amount(self) -> "SaleBase":
        """Ensure total_amount matches quantity * unit_price (with small tolerance for rounding)"""
        expected_total = self.quantity * self.unit_price
        tolerance = Decimal("0.01")  # Allow 1 cent tolerance for rounding
        if abs(self.total_amount - expected_total) > tolerance:
            raise ValueError(
                f"Total amount ({self.total_amount}) must equal quantity ({self.quantity}) × unit_price ({self.unit_price}) = {expected_total}"
            )
        return self


class SaleCreate(SaleBase):
    pass


class SaleUpdate(SQLModel):
    quantity: Optional[int] = Field(default=None, gt=0)
    unit_price: Optional[Decimal] = Field(default=None, decimal_places=2, gt=0)
    total_amount: Optional[Decimal] = Field(default=None, decimal_places=2, gt=0)
    payment_method_id: Optional[uuid.UUID] = None  # FIXED
    customer_name: Optional[str] = None
    notes: Optional[str] = None


class Sale(SaleBase, table=True):
    __tablename__ = "sale"
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    sale_date: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), index=True)
    created_by_id: uuid.UUID = Field(foreign_key="user.id")
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    voided: bool = False  # For cancelling sales instead of deleting
    void_reason: Optional[str] = Field(default=None, max_length=500)
    
    # Relationships
    product: Product = Relationship(back_populates="sales")
    payment_method: PaymentMethod = Relationship(back_populates="sales")  # Primary payment method (for backward compatibility)
    created_by: User = Relationship(back_populates="sales")
    payments: list["SalePayment"] = Relationship(back_populates="sale")  # Multiple payment methods


class SalePublic(SaleBase):
    id: uuid.UUID
    sale_date: datetime
    product: ProductPublic
    payment_method: PaymentMethodPublic
    voided: bool


class SalesPublic(SQLModel):
    data: list[SalePublic]
    count: int


# ==================== SALE PAYMENT MODELS (Multiple Payment Methods) ====================

class SalePaymentBase(SQLModel):
    sale_id: uuid.UUID = Field(foreign_key="sale.id")
    payment_method_id: uuid.UUID = Field(foreign_key="payment_method.id")
    amount: Decimal = Field(decimal_places=2, gt=0)
    reference_number: Optional[str] = Field(default=None, max_length=255)  # For MPESA, PDQ, Bank transfers


class SalePaymentCreate(SalePaymentBase):
    pass


class SalePayment(SalePaymentBase, table=True):
    __tablename__ = "sale_payment"
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
    # Relationships
    sale: "Sale" = Relationship(back_populates="payments")
    payment_method: PaymentMethod = Relationship()


class SalePaymentPublic(SalePaymentBase):
    id: uuid.UUID
    payment_method: PaymentMethodPublic
    created_at: datetime


# ==================== EXPENSE CATEGORY MODELS ====================

class ExpenseCategoryBase(SQLModel):
    name: str = Field(max_length=255, unique=True, index=True)
    description: Optional[str] = Field(default=None, max_length=500)


class ExpenseCategoryCreate(ExpenseCategoryBase):
    pass


class ExpenseCategoryUpdate(SQLModel):
    name: Optional[str] = Field(default=None, max_length=255)
    description: Optional[str] = None


class ExpenseCategory(ExpenseCategoryBase, table=True):
    __tablename__ = "expense_category"
    """
    Categories: Utilities, Supplies, Maintenance, Salaries, Rent, Other
    """
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
    # Relationships
    expenses: list["Expense"] = Relationship(back_populates="category")


class ExpenseCategoryPublic(ExpenseCategoryBase):
    id: uuid.UUID


# ==================== EXPENSE MODELS ====================

class ExpenseBase(SQLModel):
    category_id: uuid.UUID = Field(foreign_key="expense_category.id")
    amount: Decimal = Field(decimal_places=2, gt=0)
    description: str = Field(max_length=1000)
    expense_date: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), index=True)
    notes: Optional[str] = Field(default=None, max_length=1000)


class ExpenseCreate(ExpenseBase):
    pass


class ExpenseUpdate(SQLModel):
    category_id: Optional[uuid.UUID] = None  # FIXED
    amount: Optional[Decimal] = Field(default=None, decimal_places=2, gt=0)
    description: Optional[str] = Field(default=None, max_length=1000)
    expense_date: Optional[datetime] = None
    notes: Optional[str] = None


class Expense(ExpenseBase, table=True):
    __tablename__ = "expense"
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    created_by_id: uuid.UUID = Field(foreign_key="user.id")
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
    # Relationships
    category: ExpenseCategory = Relationship(back_populates="expenses")
    created_by: User = Relationship(back_populates="expenses")


class ExpensePublic(ExpenseBase):
    id: uuid.UUID
    category: ExpenseCategoryPublic


class ExpensesPublic(SQLModel):
    data: list[ExpensePublic]
    count: int


# ==================== DEBT/CREDIT MODELS ====================

class DebtBase(SQLModel):
    customer_name: str = Field(max_length=255, index=True)
    customer_contact: Optional[str] = Field(default=None, max_length=100)
    sale_id: Optional[uuid.UUID] = Field(default=None, foreign_key="sale.id")  # FIXED: Link to original sale
    amount: Decimal = Field(decimal_places=2, gt=0)
    amount_paid: Decimal = Field(default=Decimal(0), decimal_places=2, ge=0)
    balance: Decimal = Field(decimal_places=2, ge=0)  # amount - amount_paid (computed)
    debt_date: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), index=True)
    due_date: Optional[datetime] = None
    status: str = Field(default="pending", max_length=50)  # pending, partial, paid, overdue
    notes: Optional[str] = Field(default=None, max_length=1000)
    
    @model_validator(mode="after")
    def validate_debt_amounts(self) -> "DebtBase":
        """Ensure amount_paid doesn't exceed amount and balance is correct"""
        if self.amount_paid > self.amount:
            raise ValueError("Amount paid cannot exceed total debt amount")
        expected_balance = self.amount - self.amount_paid
        if abs(self.balance - expected_balance) > Decimal("0.01"):
            raise ValueError(
                f"Balance ({self.balance}) must equal amount ({self.amount}) - amount_paid ({self.amount_paid}) = {expected_balance}"
            )
        return self


class DebtCreate(DebtBase):
    pass


class DebtUpdate(SQLModel):
    customer_name: Optional[str] = Field(default=None, max_length=255)
    customer_contact: Optional[str] = None
    amount: Optional[Decimal] = Field(default=None, decimal_places=2, gt=0)
    amount_paid: Optional[Decimal] = Field(default=None, decimal_places=2, ge=0)
    due_date: Optional[datetime] = None
    status: Optional[str] = None
    notes: Optional[str] = None


class Debt(DebtBase, table=True):
    __tablename__ = "debt"
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    created_by_id: uuid.UUID = Field(foreign_key="user.id")
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
    # Relationships
    created_by: User = Relationship(back_populates="debts")
    payments: list["DebtPayment"] = Relationship(back_populates="debt", cascade_delete=True)


class DebtPublic(DebtBase):
    id: uuid.UUID


class DebtsPublic(SQLModel):
    data: list[DebtPublic]
    count: int


# ==================== DEBT PAYMENT MODELS ====================

class DebtPaymentBase(SQLModel):
    debt_id: uuid.UUID = Field(foreign_key="debt.id")
    amount: Decimal = Field(decimal_places=2, gt=0)
    payment_method_id: uuid.UUID = Field(foreign_key="payment_method.id")
    payment_date: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), index=True)
    notes: Optional[str] = Field(default=None, max_length=1000)


class DebtPaymentCreate(DebtPaymentBase):
    pass


class DebtPaymentUpdate(SQLModel):
    amount: Optional[Decimal] = Field(default=None, decimal_places=2, gt=0)
    payment_method_id: Optional[uuid.UUID] = None  # FIXED
    payment_date: Optional[datetime] = None
    notes: Optional[str] = None


class DebtPayment(DebtPaymentBase, table=True):
    __tablename__ = "debt_payment"
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    created_by_id: uuid.UUID = Field(foreign_key="user.id")
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
    # Relationships
    debt: Debt = Relationship(back_populates="payments")
    payment_method: PaymentMethod = Relationship(back_populates="debt_payments")
    created_by: User = Relationship(back_populates="debt_payments")


class DebtPaymentPublic(DebtPaymentBase):
    id: uuid.UUID
    payment_method: PaymentMethodPublic


# ==================== SHIFT RECONCILIATION MODELS ====================

class ShiftReconciliationBase(SQLModel):
    shift_date: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), index=True)
    opening_cash_float: Decimal = Field(default=Decimal(0), decimal_places=2, ge=0)
    closing_cash_float: Decimal = Field(default=Decimal(0), decimal_places=2, ge=0)
    
    # Sales summaries by category
    total_bottles_sold: int = Field(default=0, ge=0)
    total_cans_sold: int = Field(default=0, ge=0)
    total_wines_sold: int = Field(default=0, ge=0)
    total_others_sold: int = Field(default=0, ge=0)
    
    # Payment method summaries
    total_cash: Decimal = Field(default=Decimal(0), decimal_places=2, ge=0)
    total_mpesa: Decimal = Field(default=Decimal(0), decimal_places=2, ge=0)
    total_other_payments: Decimal = Field(default=Decimal(0), decimal_places=2, ge=0)
    total_credit: Decimal = Field(default=Decimal(0), decimal_places=2, ge=0)
    
    # Totals
    total_sales_amount: Decimal = Field(default=Decimal(0), decimal_places=2, ge=0)
    total_transactions: int = Field(default=0, ge=0)
    
    # Variance tracking
    expected_cash: Decimal = Field(default=Decimal(0), decimal_places=2, ge=0)
    actual_cash: Decimal = Field(default=Decimal(0), decimal_places=2, ge=0)
    cash_variance: Decimal = Field(default=Decimal(0), decimal_places=2)  # Can be negative
    
    # Stock variance count
    items_with_variance: int = Field(default=0, ge=0)
    
    notes: Optional[str] = Field(default=None, max_length=2000)
    status: str = Field(default="in_progress", max_length=50)  # in_progress, completed, reviewed


class ShiftReconciliationCreate(ShiftReconciliationBase):
    pass


class ShiftReconciliationUpdate(SQLModel):
    closing_cash_float: Optional[Decimal] = Field(default=None, decimal_places=2, ge=0)
    actual_cash: Optional[Decimal] = Field(default=None, decimal_places=2, ge=0)
    notes: Optional[str] = None
    status: Optional[str] = None


class ShiftReconciliation(ShiftReconciliationBase, table=True):
    __tablename__ = "shift_reconciliation"
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    created_by_id: uuid.UUID = Field(foreign_key="user.id")
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
    # Relationships
    created_by: User = Relationship(back_populates="shift_reconciliations")


class ShiftReconciliationPublic(ShiftReconciliationBase):
    id: uuid.UUID
    created_at: datetime


class ShiftReconciliationsPublic(SQLModel):
    data: list[ShiftReconciliationPublic]
    count: int


# ==================== BULK IMPORT MODELS ====================

class ValidationError(SQLModel):
    """Validation error for a specific field in an import row."""
    field: str
    message: str
    severity: str = "error"  # error, warning


class ImportRowStatus(str):
    """Status of an individual import row."""
    VALID = "valid"
    ERROR = "error"
    WARNING = "warning"
    DUPLICATE = "duplicate"


class ImportRow(SQLModel):
    """Represents a single row in the bulk import."""
    row_number: int
    data: dict  # Raw data from uploaded file
    mapped_data: Optional[dict] = None  # Data after column mapping
    errors: list[ValidationError] = []
    warnings: list[str] = []
    is_duplicate: bool = False
    duplicate_product_id: Optional[uuid.UUID] = None
    status: str = ImportRowStatus.VALID  # valid, error, warning, duplicate


class BulkImportSessionBase(SQLModel):
    """Base model for bulk import session."""
    filename: str = Field(max_length=255)
    total_rows: int = Field(ge=0)
    valid_rows: int = Field(default=0, ge=0)
    error_rows: int = Field(default=0, ge=0)
    duplicate_rows: int = Field(default=0, ge=0)
    imported_rows: int = Field(default=0, ge=0)
    status: str = Field(default="uploaded", max_length=50)  # uploaded, mapped, validated, importing, completed, failed
    column_mapping: Optional[dict] = None  # Maps uploaded columns to system fields
    import_options: Optional[dict] = None  # Tags, status, notes etc.
    duplicate_action: str = Field(default="skip", max_length=20)  # skip, update, create
    

class BulkImportSessionCreate(SQLModel):
    filename: str = Field(max_length=255)
    total_rows: int = Field(ge=0)
    

class BulkImportSessionUpdate(SQLModel):
    column_mapping: Optional[dict] = None
    import_options: Optional[dict] = None
    duplicate_action: Optional[str] = None
    status: Optional[str] = None
    valid_rows: Optional[int] = None
    error_rows: Optional[int] = None
    duplicate_rows: Optional[int] = None
    imported_rows: Optional[int] = None


class BulkImportSession(BulkImportSessionBase, table=True):
    """Database model for bulk import session."""
    __tablename__ = "bulk_import_session"
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    created_by_id: uuid.UUID = Field(foreign_key="user.id")
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    completed_at: Optional[datetime] = None
    
    # Override dict fields to use JSON column type
    column_mapping: Optional[dict] = Field(default=None, sa_column=Column(JSON))
    import_options: Optional[dict] = Field(default=None, sa_column=Column(JSON))
    

class BulkImportSessionPublic(BulkImportSessionBase):
    id: uuid.UUID
    created_at: datetime
    completed_at: Optional[datetime] = None
    columns: Optional[list[str]] = None  # CSV column headers
    auto_mapping: Optional[dict] = None  # Auto-detected column mappings
    
    model_config = {"from_attributes": True}


class ColumnMappingRequest(SQLModel):
    """Request model for column mapping."""
    session_id: uuid.UUID
    column_mapping: dict  # e.g., {"Product Name": "name", "Selling Price": "selling_price"}
    default_category_id: Optional[uuid.UUID] = None
    default_status_id: Optional[uuid.UUID] = None


class ColumnMappingResponse(SQLModel):
    """Response after column mapping with validation results."""
    session_id: uuid.UUID
    total_rows: int
    valid_rows: int
    error_rows: int
    duplicate_rows: int
    preview_rows: list[ImportRow]  # First 5 rows with validation results


class BulkImportValidationResponse(SQLModel):
    """Response for validation endpoint."""
    session_id: uuid.UUID
    rows: list[ImportRow]
    total_count: int
    valid_count: int
    error_count: int
    duplicate_count: int


class FixRowRequest(SQLModel):
    """Request to fix a specific row."""
    session_id: uuid.UUID
    row_number: int
    updated_data: dict


class BulkImportFinalRequest(SQLModel):
    """Final import request with options."""
    session_id: uuid.UUID
    skip_errors: bool = True
    duplicate_action: str = "skip"  # skip, update, create
    tags: list[str] = []
    notes: Optional[str] = None


class BulkImportProgress(SQLModel):
    """Progress update during import."""
    session_id: uuid.UUID
    status: str  # importing, completed, failed
    progress: int  # 0-100
    imported_count: int
    failed_count: int
    current_row: Optional[int] = None
    error_message: Optional[str] = None


class BulkImportResult(SQLModel):
    """Final result of bulk import."""
    import_id: uuid.UUID
    session_id: uuid.UUID
    success_count: int
    error_count: int
    duplicate_count: int
    total_processed: int
    duration_seconds: float
    imported_product_ids: list[uuid.UUID] = []
    errors: list[dict] = []  # Detailed error information