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
    username: Optional[str] = Field(default=None, unique=True, index=True, max_length=100)
    is_active: bool = True
    is_superuser: bool = False
    is_auditor: bool = False
    full_name: Optional[str] = Field(default=None, max_length=255)


# Properties to receive via API on creation
class UserCreate(UserBase):
    password: str = Field(min_length=8, max_length=40)


class UserRegister(SQLModel):
    email: EmailStr = Field(max_length=255)
    username: Optional[str] = Field(default=None, max_length=100)
    password: str = Field(min_length=8, max_length=40)
    full_name: Optional[str] = Field(default=None, max_length=255)


# Properties to receive via API on update, all are optional
class UserUpdate(SQLModel):
    email: Optional[EmailStr] = Field(default=None, max_length=255)  # type: ignore
    username: Optional[str] = Field(default=None, max_length=100)
    is_active: Optional[bool] = None
    is_superuser: Optional[bool] = None
    is_auditor: Optional[bool] = None
    full_name: Optional[str] = Field(default=None, max_length=255)
    password: Optional[str] = Field(default=None, min_length=8, max_length=40)


class UserUpdateMe(SQLModel):
    full_name: Optional[str] = Field(default=None, max_length=255)
    email: Optional[EmailStr] = Field(default=None, max_length=255)
    username: Optional[str] = Field(default=None, max_length=100)


class UpdatePassword(SQLModel):
    current_password: str = Field(min_length=8, max_length=40)
    new_password: str = Field(min_length=8, max_length=40)


# Database model, database table inferred from class name
class User(UserBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    hashed_password: str
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
    # Notification preferences
    notification_preferences: Optional[dict] = Field(
        default={"email": True, "in_app": True}, 
        sa_column=Column(JSON)
    )
    receives_supplier_debt_alerts: bool = Field(default=False)
    receives_reorder_alerts: bool = Field(default=False)
    receives_grn_approval_requests: bool = Field(default=False)
    
    # Relationships
    products: list["Product"] = Relationship(back_populates="created_by")
    stock_entries: list["StockEntry"] = Relationship(back_populates="created_by")
    sales: list["Sale"] = Relationship(back_populates="created_by")
    expenses: list["Expense"] = Relationship(back_populates="created_by")
    debts: list["Debt"] = Relationship(back_populates="created_by")
    debt_payments: list["DebtPayment"] = Relationship(back_populates="created_by")
    shift_reconciliations: list["ShiftReconciliation"] = Relationship(back_populates="created_by")
    grns: list["GRN"] = Relationship(
        back_populates="created_by",
        sa_relationship_kwargs={
            "foreign_keys": "[GRN.created_by_id]",
            "primaryjoin": "GRN.created_by_id == User.id"
        }
    )
    supplier_debts: list["SupplierDebt"] = Relationship(back_populates="created_by")
    supplier_debt_payments: list["SupplierDebtPayment"] = Relationship(back_populates="created_by")
    notifications: list["Notification"] = Relationship(back_populates="user")
    reminder_settings: list["ReminderSetting"] = Relationship(back_populates="user")
    reminder_logs: list["ReminderLog"] = Relationship(back_populates="user")



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
    reorder_quantity: Optional[Decimal] = Field(default=None, decimal_places=2, ge=0)
    enable_reorder_alerts: bool = Field(default=False)
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
    reorder_quantity: Optional[Decimal] = Field(default=None, decimal_places=2, ge=0)
    enable_reorder_alerts: Optional[bool] = None
    category_id: Optional[uuid.UUID] = Field(default=None, foreign_key="product_category.id")
    status_id: Optional[uuid.UUID] = Field(default=None, foreign_key="product_status.id")
    image_id: Optional[uuid.UUID] = Field(default=None, foreign_key="media.id")
    
    @model_validator(mode="after")
    def validate_selling_price(self) -> "ProductUpdate":
        """Ensure selling price is greater than buying price when both are provided"""
        # Only validate if both prices are being updated
        if self.selling_price is not None and self.buying_price is not None:
            if self.selling_price <= self.buying_price:
                raise ValueError("Selling price must be greater than buying price")
        return self

class Product(ProductBase, table=True):
    __tablename__ = "product"
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    created_by_id: uuid.UUID = Field(foreign_key="user.id")
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    deleted_at: Optional[datetime] = None
    
    # Reorder alert tracking
    last_reorder_alert_sent: Optional[datetime] = None
    consecutive_reorder_alerts: int = Field(default=0)
    max_consecutive_alerts: int = Field(default=5)
    
    # Relationships
    category: ProductCategory = Relationship(back_populates="products")
    status: ProductStatus = Relationship(back_populates="products")
    created_by: User = Relationship(back_populates="products")
    image: Optional[Media] = Relationship(back_populates="products")
    stock_entries: list["StockEntry"] = Relationship(back_populates="product")
    sales: list["Sale"] = Relationship(back_populates="product")
    supplier_reorder_levels: list["SupplierProductReorder"] = Relationship(back_populates="product")

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
    supplier_debt_payments: list["SupplierDebtPayment"] = Relationship(back_populates="payment_method")


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
    created_by: UserPublic
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


class ExpenseCategoriesPublic(SQLModel):
    data: list[ExpenseCategoryPublic]
    count: int


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
    created_by: UserPublic
    created_at: datetime
    updated_at: datetime


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


class DebtPaymentsPublic(SQLModel):
    data: list[DebtPaymentPublic]
    count: int


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


# ==================== SUPPLIER MODELS ====================

class SupplierBase(SQLModel):
    name: str = Field(max_length=255, index=True)
    contact_person: Optional[str] = Field(default=None, max_length=255)
    email: Optional[EmailStr] = None
    phone: Optional[str] = Field(default=None, max_length=50)
    address: Optional[str] = Field(default=None, max_length=500)
    credit_limit: Decimal = Field(default=Decimal(0), decimal_places=2, ge=0)
    current_credit_used: Decimal = Field(default=Decimal(0), decimal_places=2, ge=0)
    is_active: bool = Field(default=True)


class SupplierCreate(SupplierBase):
    pass


class SupplierUpdate(SQLModel):
    name: Optional[str] = Field(default=None, max_length=255)
    contact_person: Optional[str] = Field(default=None, max_length=255)
    email: Optional[EmailStr] = None
    phone: Optional[str] = Field(default=None, max_length=50)
    address: Optional[str] = Field(default=None, max_length=500)
    is_active: Optional[bool] = None


class Supplier(SupplierBase, table=True):
    __tablename__ = "supplier"
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
    # Relationships
    grns: list["GRN"] = Relationship(back_populates="supplier")
    supplier_debts: list["SupplierDebt"] = Relationship(back_populates="supplier")
    product_reorder_levels: list["SupplierProductReorder"] = Relationship(back_populates="supplier")


class SupplierPublic(SupplierBase):
    id: uuid.UUID


class SuppliersPublic(SQLModel):
    data: list[SupplierPublic]
    count: int


# ==================== TRANSPORTER MODELS ====================

class TransporterBase(SQLModel):
    name: str = Field(max_length=255, index=True)
    contact_person: Optional[str] = Field(default=None, max_length=255)
    phone: Optional[str] = Field(default=None, max_length=50)
    vehicle_registration: Optional[str] = Field(default=None, max_length=100)
    is_active: bool = Field(default=True)


class TransporterCreate(TransporterBase):
    pass


class TransporterUpdate(SQLModel):
    name: Optional[str] = Field(default=None, max_length=255)
    contact_person: Optional[str] = Field(default=None, max_length=255)
    phone: Optional[str] = Field(default=None, max_length=50)
    vehicle_registration: Optional[str] = Field(default=None, max_length=100)
    is_active: Optional[bool] = None


class Transporter(TransporterBase, table=True):
    __tablename__ = "transporter"
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
    # Relationships
    grns: list["GRN"] = Relationship(back_populates="transporter")


class TransporterPublic(TransporterBase):
    id: uuid.UUID


class TransportersPublic(SQLModel):
    data: list[TransporterPublic]
    count: int


# ==================== GRN (GOODS RECEIVED NOTE) MODELS ====================

class GRNBase(SQLModel):
    supplier_id: uuid.UUID = Field(foreign_key="supplier.id")
    transporter_id: Optional[uuid.UUID] = Field(default=None, foreign_key="transporter.id")
    
    # Transaction details
    transaction_date: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    goods_receipt_date: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
    # Shipping and delivery
    shipping_address: Optional[str] = Field(default=None, max_length=500)
    delivery_number: Optional[str] = Field(default=None, max_length=100)
    delivery_date: Optional[datetime] = None
    consignment_number: Optional[str] = Field(default=None, max_length=100)
    consignment_date: Optional[datetime] = None
    batch_number: Optional[str] = Field(default=None, max_length=100)
    
    # Transporter details
    driver_name: Optional[str] = Field(default=None, max_length=255)
    vehicle_reg_number: Optional[str] = Field(default=None, max_length=100)
    
    # Department and section
    department: Optional[str] = Field(default=None, max_length=255)
    section: Optional[str] = Field(default=None, max_length=255)
    
    # Currency and totals
    currency: str = Field(default="KES", max_length=10)
    total_amount: Decimal = Field(default=Decimal(0), decimal_places=2, ge=0)
    
    # Status
    is_approved: bool = Field(default=False)
    approved_at: Optional[datetime] = None
    approved_by_id: Optional[uuid.UUID] = Field(default=None, foreign_key="user.id")
    
    # Credit/Payment fields
    payment_type: str = Field(default="Cash", max_length=20)  # Cash, Credit
    credit_terms: Optional[str] = Field(default=None, max_length=50)  # "Net 30", "Net 60", etc.
    requires_approval: bool = Field(default=False)
    creates_debt: bool = Field(default=False)
    
    notes: Optional[str] = Field(default=None, max_length=2000)


class GRNCreate(GRNBase):
    items: list["GRNItemCreate"] = []  # List of items to receive


class GRNUpdate(SQLModel):
    supplier_id: Optional[uuid.UUID] = None
    transporter_id: Optional[uuid.UUID] = None
    transaction_date: Optional[datetime] = None
    goods_receipt_date: Optional[datetime] = None
    shipping_address: Optional[str] = None
    delivery_number: Optional[str] = None
    delivery_date: Optional[datetime] = None
    consignment_number: Optional[str] = None
    consignment_date: Optional[datetime] = None
    batch_number: Optional[str] = None
    driver_name: Optional[str] = None
    vehicle_reg_number: Optional[str] = None
    department: Optional[str] = None
    section: Optional[str] = None
    currency: Optional[str] = None
    total_amount: Optional[Decimal] = None
    is_approved: Optional[bool] = None
    notes: Optional[str] = None


class GRN(GRNBase, table=True):
    __tablename__ = "grn"
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    grn_number: str = Field(index=True, max_length=50)  # Auto-generated GRN number
    created_by_id: uuid.UUID = Field(foreign_key="user.id")
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
    # Relationships
    supplier: Supplier = Relationship(back_populates="grns")
    transporter: Optional[Transporter] = Relationship(back_populates="grns")
    created_by: "User" = Relationship(
        back_populates="grns",
        sa_relationship_kwargs={
            "foreign_keys": "[GRN.created_by_id]",
            "primaryjoin": "GRN.created_by_id == User.id"
        }
    )
    approved_by: Optional["User"] = Relationship(
        sa_relationship_kwargs={
            "foreign_keys": "[GRN.approved_by_id]",
            "primaryjoin": "GRN.approved_by_id == User.id"
        }
    )
    items: list["GRNItem"] = Relationship(back_populates="grn", sa_relationship_kwargs={"cascade": "all, delete-orphan"})
    supplier_debt: Optional["SupplierDebt"] = Relationship(back_populates="grn")


class GRNPublic(GRNBase):
    id: uuid.UUID
    grn_number: str
    created_at: datetime
    supplier_name: Optional[str] = None  # Computed field
    transporter_name: Optional[str] = None  # Computed field
    items_count: int = 0  # Computed field


class GRNPublicWithItems(GRNPublic):
    items: list["GRNItemPublic"] = []


class GRNsPublic(SQLModel):
    data: list[GRNPublic]
    count: int


# ==================== GRN ITEM MODELS ====================

class GRNItemBase(SQLModel):
    grn_id: uuid.UUID = Field(foreign_key="grn.id")
    product_id: uuid.UUID = Field(foreign_key="product.id")
    
    # Quantities
    order_quantity: Decimal = Field(default=Decimal(0), decimal_places=2, ge=0)
    pending_quantity: Decimal = Field(default=Decimal(0), decimal_places=2, ge=0)
    received_quantity: Decimal = Field(decimal_places=2, ge=0)
    
    # Optional fields from UI
    lpo_number: Optional[str] = Field(default=None, max_length=100)  # Local Purchase Order
    ledger_account: Optional[str] = Field(default=None, max_length=100)
    is_promo: bool = Field(default=False)
    
    # Pricing (optional for now)
    unit_price: Optional[Decimal] = Field(default=None, decimal_places=2, ge=0)
    total_price: Optional[Decimal] = Field(default=None, decimal_places=2, ge=0)
    
    notes: Optional[str] = Field(default=None, max_length=500)


class GRNItemCreate(GRNItemBase):
    grn_id: Optional[uuid.UUID] = None  # Will be set when creating GRN


class GRNItemUpdate(SQLModel):
    order_quantity: Optional[Decimal] = None
    pending_quantity: Optional[Decimal] = None
    received_quantity: Optional[Decimal] = None
    lpo_number: Optional[str] = None
    ledger_account: Optional[str] = None
    is_promo: Optional[bool] = None
    unit_price: Optional[Decimal] = None
    total_price: Optional[Decimal] = None
    notes: Optional[str] = None


class GRNItem(GRNItemBase, table=True):
    __tablename__ = "grn_item"
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
    # Relationships
    grn: GRN = Relationship(back_populates="items")
    product: Product = Relationship()


class GRNItemPublic(GRNItemBase):
    id: uuid.UUID
    product_name: Optional[str] = None  # Computed field
    product_code: Optional[str] = None  # Computed field


class GRNItemsPublic(SQLModel):
    data: list[GRNItemPublic]
    count: int


# ==================== SUPPLIER DEBT MODELS ====================

class SupplierDebtBase(SQLModel):
    supplier_id: uuid.UUID = Field(foreign_key="supplier.id")
    grn_id: uuid.UUID = Field(foreign_key="grn.id")
    
    # Financial details
    total_amount: Decimal = Field(decimal_places=2, gt=0)
    amount_paid: Decimal = Field(default=Decimal(0), decimal_places=2, ge=0)
    balance: Decimal = Field(decimal_places=2, ge=0)
    
    # Payment terms
    payment_terms: str = Field(max_length=50)  # "Net 30", "Net 60", "Net 90", "COD", "Custom"
    credit_period_days: Optional[int] = Field(default=None, ge=0)  # Calculated from payment terms
    invoice_number: Optional[str] = Field(default=None, max_length=100)
    invoice_date: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    due_date: datetime
    
    # Status tracking
    status: str = Field(default="pending", max_length=20)  # pending, partial, paid, overdue
    is_overdue: bool = Field(default=False)
    days_overdue: int = Field(default=0)
    
    # Metadata
    currency: str = Field(default="KES", max_length=10)
    notes: Optional[str] = Field(default=None, max_length=2000)
    
    @model_validator(mode="after")
    def validate_supplier_debt_amounts(self) -> "SupplierDebtBase":
        """Ensure amount_paid doesn't exceed amount and balance is correct"""
        if self.amount_paid > self.total_amount:
            raise ValueError("Amount paid cannot exceed total debt amount")
        expected_balance = self.total_amount - self.amount_paid
        if abs(self.balance - expected_balance) > Decimal("0.01"):
            raise ValueError(
                f"Balance ({self.balance}) must equal total_amount ({self.total_amount}) - amount_paid ({self.amount_paid}) = {expected_balance}"
            )
        return self


class SupplierDebtCreate(SQLModel):
    supplier_id: uuid.UUID
    grn_id: uuid.UUID
    total_amount: Decimal = Field(decimal_places=2, gt=0)
    payment_terms: str = Field(max_length=50)
    credit_period_days: Optional[int] = None
    invoice_number: Optional[str] = None
    invoice_date: Optional[datetime] = None
    due_date: Optional[datetime] = None
    currency: str = Field(default="KES", max_length=10)
    notes: Optional[str] = None


class SupplierDebtUpdate(SQLModel):
    payment_terms: Optional[str] = None
    invoice_number: Optional[str] = None
    due_date: Optional[datetime] = None
    status: Optional[str] = None
    notes: Optional[str] = None


class SupplierDebt(SupplierDebtBase, table=True):
    __tablename__ = "supplier_debt"
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    created_by_id: uuid.UUID = Field(foreign_key="user.id")
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
    # Relationships
    supplier: "Supplier" = Relationship(back_populates="supplier_debts")
    grn: "GRN" = Relationship(back_populates="supplier_debt")
    created_by: "User" = Relationship(back_populates="supplier_debts")
    payments: list["SupplierDebtPayment"] = Relationship(back_populates="supplier_debt", cascade_delete=True)
    installments: list["SupplierDebtInstallment"] = Relationship(back_populates="supplier_debt", cascade_delete=True)


class SupplierDebtPublic(SupplierDebtBase):
    id: uuid.UUID
    created_at: datetime
    supplier_name: Optional[str] = None  # Computed field
    grn_number: Optional[str] = None  # Computed field


class SupplierDebtsPublic(SQLModel):
    data: list[SupplierDebtPublic]
    count: int


class SupplierDebtPublicWithDetails(SupplierDebtPublic):
    installments: list["SupplierDebtInstallmentPublic"] = []
    payments: list["SupplierDebtPaymentPublic"] = []


# ==================== SUPPLIER DEBT INSTALLMENT MODELS ====================

class SupplierDebtInstallmentBase(SQLModel):
    supplier_debt_id: uuid.UUID = Field(foreign_key="supplier_debt.id")
    installment_number: int = Field(gt=0)
    installment_amount: Decimal = Field(decimal_places=2, gt=0)
    due_date: datetime
    amount_paid: Decimal = Field(default=Decimal(0), decimal_places=2, ge=0)
    balance: Decimal = Field(decimal_places=2, ge=0)
    status: str = Field(default="pending", max_length=20)  # pending, partial, paid, overdue
    notes: Optional[str] = Field(default=None, max_length=1000)
    
    @model_validator(mode="after")
    def validate_installment_amounts(self) -> "SupplierDebtInstallmentBase":
        """Ensure amount_paid doesn't exceed installment amount and balance is correct"""
        if self.amount_paid > self.installment_amount:
            raise ValueError("Amount paid cannot exceed installment amount")
        expected_balance = self.installment_amount - self.amount_paid
        if abs(self.balance - expected_balance) > Decimal("0.01"):
            raise ValueError(
                f"Balance ({self.balance}) must equal installment_amount ({self.installment_amount}) - amount_paid ({self.amount_paid})"
            )
        return self


class SupplierDebtInstallmentCreate(SQLModel):
    supplier_debt_id: uuid.UUID
    installment_number: int
    installment_amount: Decimal = Field(decimal_places=2, gt=0)
    due_date: datetime
    notes: Optional[str] = None


class SupplierDebtInstallmentUpdate(SQLModel):
    installment_amount: Optional[Decimal] = None
    due_date: Optional[datetime] = None
    status: Optional[str] = None
    notes: Optional[str] = None


class SupplierDebtInstallment(SupplierDebtInstallmentBase, table=True):
    __tablename__ = "supplier_debt_installment"
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
    # Relationships
    supplier_debt: SupplierDebt = Relationship(back_populates="installments")
    payments: list["SupplierDebtPayment"] = Relationship(back_populates="installment")


class SupplierDebtInstallmentPublic(SupplierDebtInstallmentBase):
    id: uuid.UUID


class SupplierDebtInstallmentsPublic(SQLModel):
    data: list[SupplierDebtInstallmentPublic]
    count: int


# ==================== SUPPLIER DEBT PAYMENT MODELS ====================

class SupplierDebtPaymentBase(SQLModel):
    supplier_debt_id: uuid.UUID = Field(foreign_key="supplier_debt.id")
    installment_id: Optional[uuid.UUID] = Field(default=None, foreign_key="supplier_debt_installment.id")
    payment_amount: Decimal = Field(decimal_places=2, gt=0)
    payment_date: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    payment_method_id: uuid.UUID = Field(foreign_key="payment_method.id")
    payment_reference: Optional[str] = Field(default=None, max_length=200)
    notes: Optional[str] = Field(default=None, max_length=1000)


class SupplierDebtPaymentCreate(SupplierDebtPaymentBase):
    pass


class SupplierDebtPaymentUpdate(SQLModel):
    payment_amount: Optional[Decimal] = None
    payment_date: Optional[datetime] = None
    payment_reference: Optional[str] = None
    notes: Optional[str] = None


class SupplierDebtPayment(SupplierDebtPaymentBase, table=True):
    __tablename__ = "supplier_debt_payment"
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    created_by_id: uuid.UUID = Field(foreign_key="user.id")
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
    # Relationships
    supplier_debt: SupplierDebt = Relationship(back_populates="payments")
    installment: Optional[SupplierDebtInstallment] = Relationship(back_populates="payments")
    payment_method: "PaymentMethod" = Relationship(back_populates="supplier_debt_payments")
    created_by: User = Relationship(back_populates="supplier_debt_payments")


class SupplierDebtPaymentPublic(SupplierDebtPaymentBase):
    id: uuid.UUID
    payment_method: "PaymentMethodPublic"


class SupplierDebtPaymentsPublic(SQLModel):
    data: list[SupplierDebtPaymentPublic]
    count: int


# ==================== NOTIFICATION MODELS ====================

class NotificationBase(SQLModel):
    user_id: uuid.UUID = Field(foreign_key="user.id")
    notification_type: str = Field(max_length=50)  # low_stock, debt_overdue, grn_approval, payment_received, etc.
    title: str = Field(max_length=200)
    message: str = Field(max_length=2000)
    priority: str = Field(default="info", max_length=20)  # info, warning, critical
    is_read: bool = Field(default=False)
    read_at: Optional[datetime] = None
    link_url: Optional[str] = Field(default=None, max_length=500)
    link_text: Optional[str] = Field(default=None, max_length=100)
    extra_data: Optional[dict] = Field(default=None, sa_column=Column(JSON))
    expires_at: Optional[datetime] = None
    
    @field_validator('priority')
    @classmethod
    def validate_priority(cls, v: str) -> str:
        allowed = ['info', 'warning', 'critical']
        if v not in allowed:
            raise ValueError(f'Priority must be one of {allowed}')
        return v


class NotificationCreate(SQLModel):
    user_id: uuid.UUID
    notification_type: str = Field(max_length=50)
    title: str = Field(max_length=200)
    message: str = Field(max_length=2000)
    priority: str = Field(default="info", max_length=20)
    link_url: Optional[str] = None
    link_text: Optional[str] = None
    extra_data: Optional[dict] = None


class NotificationUpdate(SQLModel):
    is_read: Optional[bool] = None
    read_at: Optional[datetime] = None


class Notification(NotificationBase, table=True):
    __tablename__ = "notification"
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
    # Relationships
    user: User = Relationship(back_populates="notifications")


class NotificationPublic(NotificationBase):
    id: uuid.UUID
    created_at: datetime


class NotificationsPublic(SQLModel):
    data: list[NotificationPublic]
    count: int
    unread_count: int = 0


# ==================== REMINDER SETTING MODELS ====================

class ReminderSettingBase(SQLModel):
    user_id: uuid.UUID = Field(foreign_key="user.id")
    reminder_type: str = Field(max_length=50)  # supplier_debt_upcoming, supplier_debt_due, supplier_debt_overdue, reorder_level, etc.
    is_enabled: bool = Field(default=True)
    frequency: str = Field(max_length=20)  # daily, weekly, monthly, custom
    send_time: str = Field(default="09:00:00", max_length=8)  # HH:MM:SS format
    send_days: Optional[dict] = Field(default=None, sa_column=Column(JSON))  # For weekly: {"days": ["Monday", "Friday"]}
    filter_criteria: Optional[dict] = Field(default=None, sa_column=Column(JSON))  # e.g., {"min_amount": 1000}
    last_sent_at: Optional[datetime] = None
    next_send_at: Optional[datetime] = None


class ReminderSettingCreate(SQLModel):
    user_id: uuid.UUID
    reminder_type: str = Field(max_length=50)
    is_enabled: bool = Field(default=True)
    frequency: str = Field(max_length=20)
    send_time: str = Field(default="09:00:00", max_length=8)
    send_days: Optional[dict] = None
    filter_criteria: Optional[dict] = None


class ReminderSettingUpdate(SQLModel):
    is_enabled: Optional[bool] = None
    frequency: Optional[str] = None
    send_time: Optional[str] = None
    send_days: Optional[dict] = None
    filter_criteria: Optional[dict] = None


class ReminderSetting(ReminderSettingBase, table=True):
    __tablename__ = "reminder_setting"
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
    # Relationships
    user: User = Relationship(back_populates="reminder_settings")
    logs: list["ReminderLog"] = Relationship(back_populates="reminder_setting")


class ReminderSettingPublic(ReminderSettingBase):
    id: uuid.UUID


class ReminderSettingsPublic(SQLModel):
    data: list[ReminderSettingPublic]
    count: int


# ==================== REMINDER LOG MODELS ====================

class ReminderLogBase(SQLModel):
    reminder_setting_id: Optional[uuid.UUID] = Field(default=None, foreign_key="reminder_setting.id")
    user_id: uuid.UUID = Field(foreign_key="user.id")
    sent_to_email: str = Field(max_length=255)
    sent_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    status: str = Field(max_length=20)  # sent, failed, pending
    error_message: Optional[str] = Field(default=None, max_length=2000)
    items_included: int = Field(default=0)
    subject_line: Optional[str] = Field(default=None, max_length=500)
    extra_data: Optional[dict] = Field(default=None, sa_column=Column(JSON))


class ReminderLogCreate(SQLModel):
    reminder_setting_id: Optional[uuid.UUID] = None
    user_id: uuid.UUID
    sent_to_email: str
    status: str
    error_message: Optional[str] = None
    items_included: int = 0
    subject_line: Optional[str] = None
    extra_data: Optional[dict] = None


class ReminderLog(ReminderLogBase, table=True):
    __tablename__ = "reminder_log"
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
    # Relationships
    reminder_setting: Optional[ReminderSetting] = Relationship(back_populates="logs")
    user: User = Relationship(back_populates="reminder_logs")


class ReminderLogPublic(ReminderLogBase):
    id: uuid.UUID
    created_at: datetime


class ReminderLogsPublic(SQLModel):
    data: list[ReminderLogPublic]
    count: int


# ==================== SUPPLIER PRODUCT REORDER MODELS ====================

class SupplierProductReorderBase(SQLModel):
    supplier_id: uuid.UUID = Field(foreign_key="supplier.id")
    product_id: uuid.UUID = Field(foreign_key="product.id")
    reorder_level: Decimal = Field(decimal_places=2, gt=0)
    reorder_quantity: Decimal = Field(decimal_places=2, gt=0)
    priority: int = Field(default=1, ge=1)  # 1=primary, 2=secondary, etc.
    is_active: bool = Field(default=True)


class SupplierProductReorderCreate(SupplierProductReorderBase):
    pass


class SupplierProductReorderUpdate(SQLModel):
    reorder_level: Optional[Decimal] = None
    reorder_quantity: Optional[Decimal] = None
    priority: Optional[int] = None
    is_active: Optional[bool] = None


class SupplierProductReorder(SupplierProductReorderBase, table=True):
    __tablename__ = "supplier_product_reorder"
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
    # Relationships
    supplier: "Supplier" = Relationship(back_populates="product_reorder_levels")
    product: "Product" = Relationship(back_populates="supplier_reorder_levels")


class SupplierProductReorderPublic(SupplierProductReorderBase):
    id: uuid.UUID
    supplier_name: Optional[str] = None  # Computed field
    product_name: Optional[str] = None  # Computed field


class SupplierProductReordersPublic(SQLModel):
    data: list[SupplierProductReorderPublic]
    count: int