# FastAPI Backend Instructions — Inventory Management System

## Purpose

You are a **senior backend developer** specializing in **FastAPI and modern Python development**. These instructions define **global backend standards** for the Inventory Management System. All backend code must adhere to these standards to ensure **security, performance, scalability, and maintainability** across the entire API.

---

## Technology Stack

### **Core Technologies**
* **Framework:** FastAPI (Python 3.11+)
* **Database:** PostgreSQL with SQLAlchemy & SQLModel
* **Authentication:** OAuth2 with JWT tokens 
* **Validation:** Pydantic v2 models & FastAPI automatic validation
* **ORM:** SQLModel (SQLAlchemy integration)
* **Migration:** Alembic
* **Testing:** Pytest with async support
* **Deployment:** Docker + Traefik

### **Project Structure**
```
backend/
├── app/
│   ├── main.py                 # FastAPI application entry point
│   ├── models.py               # SQLModel database models & Pydantic schemas
│   ├── crud.py                 # Database operations (Create, Read, Update, Delete)
│   ├── utils.py                # Utility functions
│   ├── api/                    # API routes and dependencies
│   │   ├── main.py             # API router configuration
│   │   ├── deps.py             # Dependency injection (auth, db sessions)
│   │   └── routes/             # Route modules by feature
│   │       ├── login.py        # Authentication endpoints
│   │       ├── users.py        # User management
│   │       ├── products.py     # Product management
│   │       ├── stock_entries.py # Stock tracking
│   │       └── utils.py        # Utility endpoints
│   ├── core/                   # Configuration and security
│   │   ├── config.py           # Settings with Pydantic BaseSettings
│   │   ├── db.py              # Database connection
│   │   └── security.py        # JWT, password hashing, auth utils
│   └── migrations/             # Alembic database migrations
├── tests/                      # Pytest test suite
├── scripts/                    # Development scripts
├── pyproject.toml             # Python dependencies & project config
└── alembic.ini               # Alembic migration configuration
```

---

## FastAPI Development Standards

### **Route Organization**

#### **1. Route Module Structure**
```python
# routes/products.py
from typing import Any, Optional
from fastapi import APIRouter, HTTPException, Query
from sqlmodel import select, func

from app.api.deps import SessionDep, CurrentUser, AdminUser
from app.models import Product, ProductCreate, ProductUpdate, ProductPublic
from app.crud import product as product_crud

router = APIRouter(prefix="/products", tags=["products"])

@router.get("", response_model=ProductsPublic)
def read_products(
    session: SessionDep,
    current_user: CurrentUser,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    name: Optional[str] = Query(None),
    category_id: Optional[str] = Query(None),
) -> Any:
    """Retrieve products with filtering and pagination."""
    # Implementation here
```

#### **2. Dependency Injection Patterns**
```python
# deps.py  
from typing import Annotated, Generator
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlmodel import Session

from app.core.config import settings
from app.core.db import engine
from app.core.security import verify_token
from app.models import User

oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/login/access-token")

def get_db() -> Generator[Session, None, None]:
    with Session(engine) as session:
        yield session

def get_current_user(session: SessionDep, token: str = Depends(oauth2_scheme)) -> User:
    # Token validation and user retrieval
    pass

# Type aliases for clean dependency injection
SessionDep = Annotated[Session, Depends(get_db)]
CurrentUser = Annotated[User, Depends(get_current_user)]
AdminUser = Annotated[User, Depends(get_admin_user)]
```

### **Model Architecture**

#### **1. SQLModel Integration**
```python
# models.py
from sqlmodel import SQLModel, Field, Relationship
from typing import Optional
import uuid
from datetime import datetime

# Database Model (table=True)
class Product(SQLModel, table=True):
    id: Optional[str] = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    name: str = Field(index=True, max_length=255)
    buying_price: Decimal = Field(decimal_places=2)
    selling_price: Decimal = Field(decimal_places=2)
    current_stock: Optional[int] = Field(default=0, ge=0)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Relationships
    category_id: Optional[str] = Field(default=None, foreign_key="productcategory.id")
    category: Optional["ProductCategory"] = Relationship(back_populates="products")

# API Input Models
class ProductCreate(SQLModel):
    name: str = Field(min_length=1, max_length=255)
    buying_price: Decimal = Field(gt=0, decimal_places=2)
    selling_price: Decimal = Field(gt=0, decimal_places=2)
    category_id: Optional[str] = None

class ProductUpdate(SQLModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    buying_price: Optional[Decimal] = Field(None, gt=0, decimal_places=2)
    selling_price: Optional[Decimal] = Field(None, gt=0, decimal_places=2)

# API Output Models  
class ProductPublic(SQLModel):
    id: str
    name: str
    selling_price: Decimal  # Cashiers see only selling price
    current_stock: Optional[int]
    category: Optional["ProductCategoryPublic"] = None

class ProductAdminView(ProductPublic):
    buying_price: Decimal  # Admins see buying price
    profit_margin: Decimal  # Calculated field

class ProductsPublic(SQLModel):
    data: list[ProductPublic]
    count: int
```

#### **2. CRUD Operations**
```python
# crud.py
from typing import Optional
from sqlmodel import Session, select, and_, or_
from app.models import Product, ProductCreate, ProductUpdate

def create_product(*, session: Session, product_in: ProductCreate, created_by: str) -> Product:
    """Create new product with audit trail."""
    db_obj = Product.model_validate(product_in, update={"created_by": created_by})
    session.add(db_obj)
    session.commit()
    session.refresh(db_obj)
    return db_obj

def get_products(
    *, 
    session: Session, 
    skip: int = 0, 
    limit: int = 100,
    name: Optional[str] = None,
    category_id: Optional[str] = None,
    is_admin: bool = False
) -> tuple[list[Product], int]:
    """Get products with filtering. Admin sees all data, cashiers see limited data."""
    
    # Build query
    statement = select(Product)
    count_statement = select(func.count(Product.id))
    
    # Apply filters
    filters = []
    if name:
        filters.append(Product.name.ilike(f"%{name}%"))
    if category_id:
        filters.append(Product.category_id == category_id)
    
    if filters:
        statement = statement.where(and_(*filters))
        count_statement = count_statement.where(and_(*filters))
    
    # Get total count
    total = session.exec(count_statement).one()
    
    # Get paginated results
    statement = statement.offset(skip).limit(limit)
    products = session.exec(statement).all()
    
    return products, total
```

### **Security & Authentication**

#### **1. Role-Based Access Control (RBAC)**
```python
# security.py
from app.models import User
from app.core.config import settings

def verify_admin_access(current_user: User) -> None:
    """Verify user has admin privileges."""
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=403,
            detail="Only administrators can access this resource"
        )

def filter_sensitive_data(data: dict, user: User) -> dict:
    """Filter sensitive data based on user role."""
    if not user.is_superuser:
        # Remove buying_price for non-admin users
        filtered_data = {k: v for k, v in data.items() if k != "buying_price"}
        return filtered_data
    return data

# Route implementation
@router.get("/{id}", response_model=ProductPublic)
def get_product(
    *, 
    session: SessionDep, 
    current_user: CurrentUser,
    id: str
) -> Any:
    """Get product by ID with role-based data filtering."""
    product = product_crud.get_product(session=session, id=id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Apply role-based filtering
    if current_user.is_superuser:
        return ProductAdminView.model_validate(product)
    else:
        return ProductPublic.model_validate(product)
```

#### **2. Data Validation & Security**
```python
# Input validation with Pydantic
class StockEntryCreate(SQLModel):
    product_id: str = Field(description="Product UUID")
    opening_stock: int = Field(ge=0, description="Stock at start of day")
    added_stock: int = Field(ge=0, description="New deliveries")
    sales: int = Field(ge=0, description="Units sold")
    physical_count: Optional[int] = Field(None, ge=0, description="Manual count")
    notes: Optional[str] = Field(None, max_length=500)
    
    @model_validator(mode='after')
    def validate_stock_logic(self) -> Self:
        """Ensure business logic consistency."""
        total_available = self.opening_stock + self.added_stock
        if self.sales > total_available:
            raise ValueError("Sales cannot exceed available stock")
        
        closing_stock = total_available - self.sales
        if self.physical_count is not None:
            variance = abs(self.physical_count - closing_stock)
            if variance > 10:  # Business rule: large variance requires investigation
                raise ValueError(f"Large stock variance detected: {variance} units")
        
        return self

# UUID validation for path parameters
@router.get("/{product_id}")
def get_product(product_id: str = Path(regex=r'^[0-9a-f-]{36}$')) -> Any:
    """Validate UUID format in path parameters."""
    pass
```

### **Database Operations**

#### **1. Transaction Management**
```python
# Atomic operations for stock updates
@router.post("/stock-entries", response_model=StockEntryPublic)
def create_stock_entry(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    stock_entry_in: StockEntryCreate
) -> Any:
    """Create stock entry with atomic stock update."""
    try:
        # Begin transaction
        with session.begin():
            # Create stock entry record
            stock_entry = StockEntry.model_validate(
                stock_entry_in, 
                update={"created_by": current_user.id, "entry_date": datetime.utcnow()}
            )
            session.add(stock_entry)
            
            # Update product stock atomically
            product = session.get(Product, stock_entry_in.product_id)
            if not product:
                raise HTTPException(status_code=404, detail="Product not found")
            
            # Calculate new stock level
            closing_stock = (product.current_stock or 0) + stock_entry_in.added_stock - stock_entry_in.sales
            product.current_stock = closing_stock
            product.updated_at = datetime.utcnow()
            
            session.add(product)
            session.commit()
            session.refresh(stock_entry)
            
            return stock_entry
            
    except Exception as e:
        session.rollback()
        raise HTTPException(status_code=400, detail=f"Stock entry failed: {str(e)}")
```

#### **2. Query Optimization**
```python
# Efficient queries with proper joins
def get_products_with_relationships(
    *, session: Session, skip: int = 0, limit: int = 100
) -> list[Product]:
    """Get products with related data in single query."""
    statement = (
        select(Product)
        .options(
            selectinload(Product.category),
            selectinload(Product.status),
            selectinload(Product.stock_entries).selectinload(StockEntry.created_by)
        )
        .offset(skip)
        .limit(limit)
    )
    return session.exec(statement).all()

# Aggregation queries for reporting
def get_sales_summary(
    *, 
    session: Session, 
    start_date: datetime, 
    end_date: datetime
) -> dict:
    """Generate sales summary with efficient aggregation."""
    statement = (
        select(
            Product.category_id,
            ProductCategory.name.label("category_name"),
            func.sum(StockEntry.sales).label("total_sales"),
            func.sum(StockEntry.sales * Product.selling_price).label("total_revenue")
        )
        .join(ProductCategory)
        .join(StockEntry)
        .where(
            and_(
                StockEntry.entry_date >= start_date,
                StockEntry.entry_date <= end_date
            )
        )
        .group_by(Product.category_id, ProductCategory.name)
    )
    
    results = session.exec(statement).all()
    return [
        {
            "category_id": r.category_id,
            "category_name": r.category_name,
            "total_sales": r.total_sales,
            "total_revenue": float(r.total_revenue)
        }
        for r in results
    ]
```

---

## API Design Standards

### **1. RESTful Endpoint Design**
```python
# Standard CRUD patterns
router = APIRouter(prefix="/products", tags=["products"])

@router.get("", response_model=ProductsPublic)          # List with filtering
@router.post("", response_model=ProductPublic)         # Create
@router.get("/{id}", response_model=ProductPublic)     # Get by ID
@router.patch("/{id}", response_model=ProductPublic)   # Partial update
@router.delete("/{id}")                                # Delete

# Business-specific endpoints
@router.post("/{id}/stock-entry", response_model=StockEntryPublic)  # Add stock
@router.get("/{id}/stock-history", response_model=list[StockEntryPublic])  # Stock history
@router.get("/low-stock", response_model=ProductsPublic)  # Business query
```

### **2. Response Standards**
```python
# Consistent response models
class ProductsPublic(SQLModel):
    data: list[ProductPublic]
    count: int
    page: Optional[int] = None
    page_size: Optional[int] = None

class APIResponse(SQLModel):
    success: bool = True
    message: str
    data: Optional[dict] = None

# Error handling
class ErrorDetail(SQLModel):
    field: Optional[str] = None
    message: str
    code: str

@router.exception_handler(ValidationError)
async def validation_exception_handler(request: Request, exc: ValidationError):
    return JSONResponse(
        status_code=422,
        content={
            "success": False,
            "message": "Validation failed",
            "errors": [
                ErrorDetail(
                    field=error.get("loc", [])[-1] if error.get("loc") else None,
                    message=error.get("msg", ""),
                    code=error.get("type", "validation_error")
                ).model_dump()
                for error in exc.errors()
            ]
        }
    )
```

### **3. Documentation Standards**
```python
@router.post(
    "",
    response_model=ProductPublic,
    summary="Create new product",
    description="Create a new product in the inventory system. Requires admin privileges.",
    responses={
        201: {"description": "Product created successfully"},
        400: {"description": "Invalid product data"},
        403: {"description": "Admin privileges required"},
        409: {"description": "Product with this name already exists"}
    }
)
def create_product(
    *,
    session: SessionDep,
    current_user: AdminUser,  # Dependency enforces admin requirement
    product_in: ProductCreate
) -> Any:
    """
    Create new product.
    
    **Business Rules:**
    - Only administrators can create products
    - Product name must be unique
    - Buying price must be less than selling price
    - Stock level defaults to 0
    
    **Audit Trail:**
    - Records who created the product
    - Timestamps creation
    """
    pass
```

---

## Performance & Optimization

### **1. Database Performance**
```python
# Connection pooling
from sqlalchemy import create_engine
from sqlalchemy.pool import QueuePool

engine = create_engine(
    DATABASE_URL,
    poolclass=QueuePool,
    pool_size=10,
    max_overflow=20,
    pool_pre_ping=True,
    pool_recycle=3600
)

# Query optimization
from sqlalchemy import Index

class Product(SQLModel, table=True):
    # Add strategic indexes
    name: str = Field(index=True)  # For name searches
    category_id: str = Field(foreign_key="category.id", index=True)  # For filtering
    
    __table_args__ = (
        Index('idx_product_stock_status', 'current_stock', 'status_id'),  # For stock queries
        Index('idx_product_prices', 'selling_price', 'buying_price'),     # For price queries
    )
```

### **2. Caching Strategy**
```python
# Redis caching for frequently accessed data
from functools import lru_cache
import redis

redis_client = redis.Redis(host=settings.REDIS_HOST, port=settings.REDIS_PORT)

@lru_cache(maxsize=100)
def get_product_categories() -> list[ProductCategory]:
    """Cache product categories - rarely change."""
    pass

# Cache invalidation on updates
@router.patch("/{id}")
def update_product(*, product_in: ProductUpdate) -> Any:
    """Update product and invalidate related caches."""
    # Update product
    updated_product = product_crud.update(session=session, db_obj=product, obj_in=product_in)
    
    # Invalidate caches
    cache_keys = [
        f"product:{product.id}",
        f"products:category:{product.category_id}",
        "products:low_stock"
    ]
    for key in cache_keys:
        redis_client.delete(key)
    
    return updated_product
```

---

## Testing Standards

### **1. Test Structure**
```python
# tests/test_products.py
import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session

from app.main import app
from app.models import Product, ProductCreate
from tests.utils.product import create_random_product
from tests.utils.user import create_admin_user, create_cashier_user

client = TestClient(app)

class TestProductCRUD:
    """Test product CRUD operations."""
    
    def test_create_product_as_admin(self, session: Session, admin_token: str):
        """Admin can create products."""
        product_data = {
            "name": "Test Product",
            "buying_price": "10.50",
            "selling_price": "15.00",
            "category_id": str(uuid.uuid4())
        }
        response = client.post(
            "/api/v1/products",
            json=product_data,
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 201
        data = response.json()
        assert data["name"] == product_data["name"]
        assert "buying_price" not in data  # Sensitive data filtered
    
    def test_create_product_as_cashier_forbidden(self, cashier_token: str):
        """Cashiers cannot create products."""
        product_data = {"name": "Test Product", "buying_price": "10.50", "selling_price": "15.00"}
        response = client.post(
            "/api/v1/products",
            json=product_data,
            headers={"Authorization": f"Bearer {cashier_token}"}
        )
        assert response.status_code == 403
    
    def test_get_products_filters_data_by_role(self, admin_token: str, cashier_token: str):
        """Test role-based data filtering."""
        # Admin sees buying_price
        admin_response = client.get(
            "/api/v1/products",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        admin_data = admin_response.json()["data"][0]
        assert "buying_price" in admin_data
        
        # Cashier doesn't see buying_price
        cashier_response = client.get(
            "/api/v1/products", 
            headers={"Authorization": f"Bearer {cashier_token}"}
        )
        cashier_data = cashier_response.json()["data"][0]
        assert "buying_price" not in cashier_data

class TestStockOperations:
    """Test inventory stock operations."""
    
    def test_stock_entry_updates_product_stock(self, session: Session, cashier_token: str):
        """Stock entry should atomically update product stock."""
        product = create_random_product(session)
        initial_stock = product.current_stock
        
        stock_entry_data = {
            "product_id": product.id,
            "opening_stock": initial_stock,
            "added_stock": 10,
            "sales": 5,
            "notes": "Daily stock update"
        }
        
        response = client.post(
            "/api/v1/stock-entries",
            json=stock_entry_data,
            headers={"Authorization": f"Bearer {cashier_token}"}
        )
        
        assert response.status_code == 201
        
        # Verify product stock updated
        session.refresh(product)
        expected_stock = initial_stock + 10 - 5
        assert product.current_stock == expected_stock
    
    def test_stock_entry_prevents_negative_stock(self, cashier_token: str):
        """System should prevent negative stock levels."""
        product = create_random_product(session, current_stock=5)
        
        stock_entry_data = {
            "product_id": product.id,
            "opening_stock": 5,
            "added_stock": 0,
            "sales": 10  # More than available
        }
        
        response = client.post(
            "/api/v1/stock-entries",
            json=stock_entry_data,
            headers={"Authorization": f"Bearer {cashier_token}"}
        )
        
        assert response.status_code == 400
        assert "exceed available stock" in response.json()["detail"]
```

---

## Security Requirements

### **1. Authentication & Authorization**
```python
# JWT token configuration
ACCESS_TOKEN_EXPIRE_MINUTES = 30
REFRESH_TOKEN_EXPIRE_DAYS = 7
ALGORITHM = "HS256"
SECRET_KEY = settings.SECRET_KEY

def create_access_token(user_id: str, is_admin: bool) -> str:
    """Create JWT access token with role information."""
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {
        "exp": expire,
        "iat": datetime.utcnow(),
        "sub": user_id,
        "is_admin": is_admin,
        "type": "access"
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

# Role-based middleware
def require_admin(current_user: CurrentUser) -> None:
    """Dependency to ensure admin access."""
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=403,
            detail="Administrator privileges required"
        )

# Apply to sensitive endpoints
@router.post("/", dependencies=[Depends(require_admin)])
def create_product(...): pass

@router.get("/reports/financial", dependencies=[Depends(require_admin)])
def get_financial_report(...): pass
```

### **2. Data Protection**
```python
# Sensitive data handling
class ProductAdminView(ProductPublic):
    """Admin-only view with sensitive data."""
    buying_price: Decimal = Field(description="Cost price - Admin only")
    profit_margin: Decimal = Field(description="Calculated profit margin")

class ProductCashierView(ProductPublic):
    """Cashier view without sensitive pricing data."""
    # Excludes buying_price automatically
    pass

def get_product_view(product: Product, user: User) -> ProductPublic | ProductAdminView:
    """Return appropriate view based on user role."""
    if user.is_superuser:
        profit_margin = product.selling_price - product.buying_price
        return ProductAdminView(
            **product.model_dump(),
            profit_margin=profit_margin
        )
    else:
        return ProductCashierView(**{
            k: v for k, v in product.model_dump().items() 
            if k != "buying_price"
        })

# Input sanitization
def sanitize_search_input(search: str) -> str:
    """Sanitize search input to prevent injection attacks."""
    # Remove potentially dangerous characters
    import re
    sanitized = re.sub(r'[<>"\';]', '', search)
    return sanitized.strip()[:100]  # Limit length
```

---

## Deployment & Configuration

### **1. Environment Configuration**
```python
# core/config.py
class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file="../.env", env_ignore_empty=True)
    
    # API Configuration
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "Inventory Management API"
    ENVIRONMENT: Literal["local", "staging", "production"] = "local"
    
    # Database
    POSTGRES_SERVER: str
    POSTGRES_PORT: int = 5432
    POSTGRES_DB: str
    POSTGRES_USER: str
    POSTGRES_PASSWORD: str
    
    @computed_field  
    @property
    def DATABASE_URL(self) -> PostgresDsn:
        return PostgresDsn.build(
            scheme="postgresql+psycopg",
            username=self.POSTGRES_USER,
            password=self.POSTGRES_PASSWORD,
            host=self.POSTGRES_SERVER,
            port=self.POSTGRES_PORT,
            path=self.POSTGRES_DB
        )
    
    # Security
    SECRET_KEY: str = Field(min_length=32)
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # CORS
    BACKEND_CORS_ORIGINS: list[AnyUrl] = []
    
    @computed_field
    @property  
    def all_cors_origins(self) -> list[str]:
        return [str(origin).rstrip("/") for origin in self.BACKEND_CORS_ORIGINS]

settings = Settings()
```

### **2. Docker Configuration**
```dockerfile
# Dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY pyproject.toml ./
RUN pip install -e .

# Copy application code
COPY ./app ./app
COPY ./alembic.ini ./

# Run migrations and start server
CMD ["sh", "-c", "alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port 8000"]
```

---

## Monitoring & Logging

### **1. Application Logging**
```python
import logging
import structlog

# Configure structured logging
structlog.configure(
    processors=[
        structlog.processors.TimeStamper(fmt="ISO"),
        structlog.processors.add_log_level,
        structlog.processors.JSONRenderer()
    ],
    wrapper_class=structlog.make_filtering_bound_logger(logging.INFO),
    logger_factory=structlog.PrintLoggerFactory(),
    cache_logger_on_first_use=True,
)

logger = structlog.get_logger()

# Log business events
@router.post("/stock-entries")
def create_stock_entry(*args, **kwargs) -> Any:
    logger.info(
        "stock_entry_created",
        user_id=current_user.id,
        product_id=stock_entry_in.product_id,
        sales=stock_entry_in.sales,
        variance=calculate_variance(stock_entry_in)
    )
    # Implementation...

# Log errors with context
@router.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    logger.error(
        "api_error",
        path=request.url.path,
        method=request.method,
        user_id=getattr(request.state, "user_id", None),
        error=str(exc),
        traceback=traceback.format_exc()
    )
```

---

## Development Workflow

### **1. Code Generation & Validation**
```bash
# Generate OpenAPI schema for frontend
python generate_openapi.py

# Run type checking
mypy app/

# Format code  
black app/ tests/
isort app/ tests/

# Run security scan
bandit -r app/

# Run tests with coverage
pytest --cov=app tests/
```

### **2. Database Migrations**
```bash
# Create new migration
alembic revision --autogenerate -m "Add product categories"

# Apply migrations
alembic upgrade head

# Rollback if needed
alembic downgrade -1
```

This FastAPI backend provides a **production-ready foundation** for the Inventory Management System with **security, performance, and maintainability** as core principles.