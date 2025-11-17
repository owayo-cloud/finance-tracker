from typing import Any, Optional
import uuid

from fastapi import APIRouter, HTTPException
from sqlmodel import func, select, and_
from sqlalchemy.orm import selectinload

from app.api.deps import AdminUser, CurrentUser, SessionDep
from app.crud import product as product_crud
from app.models import (
    Product, ProductCreate, ProductPublic, ProductsPublic, ProductUpdate,
    ProductCategory, ProductCategoriesPublic,
    ProductStatus, ProductStatusPublic,
)


router = APIRouter(prefix="/products", tags=["products"])


# ==================== PRODUCT CATEGORIES ====================

@router.get("/categories", response_model=ProductCategoriesPublic)
def read_categories(session: SessionDep) -> Any:
    """
    Retrieve product categories.
    """
    count_statement = select(func.count()).select_from(ProductCategory)
    count = session.exec(count_statement).one()
    statement = select(ProductCategory)
    categories = session.exec(statement).all()
    return ProductCategoriesPublic(data=categories, count=count)


# ==================== PRODUCT STATUSES ====================

@router.get("/statuses", response_model=list[ProductStatusPublic])
def read_statuses(session: SessionDep) -> Any:
    """
    Retrieve product statuses.
    """
    statement = select(ProductStatus)
    statuses = session.exec(statement).all()
    return statuses


# ==================== PRODUCTS CRUD ====================

@router.get("/", response_model=ProductsPublic)
def read_products(
    session: SessionDep,
    skip: int = 0,
    limit: int = 100,
    name: Optional[str] = None,
    category_id: Optional[str] = None,
    status_id: Optional[str] = None,
) -> Any:
    """
    Retrieve products with optional filtering.

    Args:
        skip: Number of products to skip (pagination)
        limit: Number of products to return (max 100)
        name: Filter by product name (partial match, case-insensitive)
        category_id: Filter by category ID
        status_id: Filter by status ID
    """
    # Build base query
    statement = select(Product).options(
        selectinload(Product.category),
        selectinload(Product.status),
        selectinload(Product.image)
    )

    # Build count query
    count_statement = select(func.count()).select_from(Product)

    # Apply filters
    conditions = []

    if name:
        name_condition = Product.name.ilike(f"%{name}%")
        conditions.append(name_condition)

    if category_id:
        try:
            category_uuid = uuid.UUID(category_id)
            category_condition = Product.category_id == category_uuid
            conditions.append(category_condition)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid category_id format")

    if status_id:
        try:
            status_uuid = uuid.UUID(status_id)
            status_condition = Product.status_id == status_uuid
            conditions.append(status_condition)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid status_id format")

    # Apply conditions to both queries
    if conditions:
        combined_conditions = and_(*conditions)
        statement = statement.where(combined_conditions)
        count_statement = count_statement.where(combined_conditions)

    # Execute count query
    count = session.exec(count_statement).one()

    # Execute products query with pagination
    statement = statement.offset(skip).limit(limit)
    products = session.exec(statement).all()

    return ProductsPublic(data=products, count=count)


@router.post("/", response_model=ProductPublic)
def create_product(
    *, session: SessionDep, admin_user: AdminUser, product_in: ProductCreate
) -> Any:
    """
    Create new product.
    """
    product = product_crud.create(
        db=session, obj_in=product_in, created_by_id=admin_user.id
    )
    return product


@router.get("/{id}", response_model=ProductPublic)
def read_product(session: SessionDep, current_user: CurrentUser, id: uuid.UUID) -> Any:
    """
    Get product by ID.
    """
    statement = (
        select(Product)
        .where(Product.id == id)
        .options(
            selectinload(Product.category),
            selectinload(Product.status),
            selectinload(Product.tag),
            selectinload(Product.image)
        )
    )
    product = session.exec(statement).first()
    
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    return product


@router.patch("/{id}", response_model=ProductPublic)
def update_product(
    *, session: SessionDep, admin_user: AdminUser, id: uuid.UUID, product_in: ProductUpdate
) -> Any:
    """
    Update a product.
    """
    statement = (
        select(Product)
        .where(Product.id == id)
        .options(
            selectinload(Product.category),
            selectinload(Product.status),
            selectinload(Product.image)
        )
    )
    product = session.exec(statement).first()
    
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    product = product_crud.update(db=session, db_obj=product, obj_in=product_in)
    return product


@router.delete("/{id}")
def delete_product(session: SessionDep, admin_user: AdminUser, id: uuid.UUID) -> dict[str, str]:
    """
    Delete a product.
    """
    product = session.get(Product, id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    product_crud.remove(db=session, id=id)
    return {"message": "Product deleted successfully"}
