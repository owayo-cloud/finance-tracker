from typing import Any

from fastapi import APIRouter, HTTPException
from sqlmodel import func, select

from app.api.deps import AdminUser, CurrentUser, SessionDep
from app.crud import product as product_crud
from app.models import (
    Product, ProductCreate, ProductPublic, ProductsPublic, ProductUpdate,
    ProductCategory, ProductCategoryPublic, ProductCategoriesPublic,
    ProductStatus, ProductStatusPublic,
    ProductTag, ProductTagPublic, ProductTagsPublic
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


# ==================== PRODUCT TAGS ====================

@router.get("/tags", response_model=list[ProductTagPublic])
def read_tags(session: SessionDep) -> Any:
    """
    Retrieve product tags.
    """
    statement = select(ProductTag)
    tags = session.exec(statement).all()
    return tags


# ==================== PRODUCTS CRUD ====================

@router.get("/", response_model=ProductsPublic)
def read_products(
    session: SessionDep, current_user: CurrentUser, skip: int = 0, limit: int = 100
) -> Any:
    """
    Retrieve products.
    """
    count_statement = select(func.count()).select_from(Product)
    count = session.exec(count_statement).one()
    statement = select(Product).offset(skip).limit(limit)
    products = session.exec(statement).all()

    # If user is not an admin, create a list of ProductPublic without buying_price
    if not current_user.is_superuser:
        return ProductsPublic(data=products, count=count)

    # If user is an admin, include buying_price
    products_with_bp = []
    for product in products:
        product_dict = product.model_dump()
        product_dict["buying_price"] = product.buying_price
        products_with_bp.append(ProductPublic.model_validate(product_dict))

    return ProductsPublic(data=products_with_bp, count=count)


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
def read_product(session: SessionDep, current_user: CurrentUser, id: int) -> Any:
    """
    Get product by ID.
    """
    product = session.get(Product, id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    if not current_user.is_superuser:
        return product

    # Manually add buying_price for admin response
    product_dict = product.model_dump()
    product_dict["buying_price"] = product.buying_price
    return ProductPublic.model_validate(product_dict)


@router.patch("/{id}", response_model=ProductPublic)
def update_product(
    *, session: SessionDep, admin_user: AdminUser, id: int, product_in: ProductUpdate
) -> Any:
    """
    Update a product.
    """
    product = session.get(Product, id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    product = product_crud.update(db=session, db_obj=product, obj_in=product_in)
    return product


@router.delete("/{id}")
def delete_product(session: SessionDep, admin_user: AdminUser, id: int) -> dict[str, str]:
    """
    Delete a product.
    """
    product = session.get(Product, id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    product_crud.remove(db=session, id=id)
    return {"message": "Product deleted successfully"}
