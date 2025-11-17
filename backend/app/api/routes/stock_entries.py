import uuid
from typing import Any

from fastapi import APIRouter, HTTPException, Query
from sqlmodel import func, select, or_
from sqlalchemy.orm import selectinload

from app.api.deps import AdminUser, CurrentUser, SessionDep
from app.models import (
    Product, StockEntry, StockEntryCreate, StockEntryPublic, 
    StockEntriesPublic, StockEntryUpdate, ProductPublic
)


router = APIRouter(prefix="/stock-entries", tags=["stock-entries"])


# ==================== FAST PRODUCT SEARCH ====================

@router.get("/search-products", response_model=list[ProductPublic])
def search_products_for_stock_entry(
    session: SessionDep,
    current_user: CurrentUser,
    q: str = Query(..., min_length=1, description="Search query"),
    limit: int = Query(50, le=100, description="Maximum results to return")
) -> Any:
    """
    Blazingly fast product search for stock entry.
    Searches by name or category name.
    Returns products with all relationships loaded.
    """
    from app.models import ProductCategory
    
    # Build search pattern for case-insensitive search
    search_pattern = f"%{q}%"
    
    statement = (
        select(Product)
        .join(Product.category)
        .join(Product.status)
        .where(
            or_(
                Product.name.ilike(search_pattern),
                ProductCategory.name.ilike(search_pattern)
            )
        )
        .options(
            selectinload(Product.category),
            selectinload(Product.status),
            selectinload(Product.image)
        )
        .limit(limit)
    )
    
    products = session.exec(statement).all()
    return products


# ==================== STOCK ENTRIES CRUD ====================

@router.get("/", response_model=StockEntriesPublic)
def read_stock_entries(
    session: SessionDep,
    current_user: CurrentUser,
    skip: int = 0,
    limit: int = 100,
    product_id: uuid.UUID | None = None
) -> Any:
    """
    Retrieve stock entries.
    Optionally filter by product_id.
    """
    count_statement = select(func.count()).select_from(StockEntry)
    if product_id:
        count_statement = count_statement.where(StockEntry.product_id == product_id)
    
    count = session.exec(count_statement).one()
    
    statement = (
        select(StockEntry)
        .options(
            selectinload(StockEntry.product).selectinload(Product.category),
            selectinload(StockEntry.product).selectinload(Product.status),
            selectinload(StockEntry.product).selectinload(Product.tag),
            selectinload(StockEntry.product).selectinload(Product.image),
        )
        .offset(skip)
        .limit(limit)
        .order_by(StockEntry.entry_date.desc())
    )
    
    if product_id:
        statement = statement.where(StockEntry.product_id == product_id)
    
    entries = session.exec(statement).all()
    return StockEntriesPublic(data=entries, count=count)


@router.post("/", response_model=StockEntryPublic)
def create_stock_entry(
    *, session: SessionDep, admin_user: AdminUser, entry_in: StockEntryCreate
) -> Any:
    """
    Create new stock entry.
    """
    # Validate product exists
    product = session.get(Product, entry_in.product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Create stock entry
    db_obj = StockEntry.model_validate(
        entry_in, update={"created_by_id": admin_user.id}
    )
    session.add(db_obj)
    session.commit()
    session.refresh(db_obj)
    
    # Load relationships for response
    statement = (
        select(StockEntry)
        .where(StockEntry.id == db_obj.id)
        .options(
            selectinload(StockEntry.product).selectinload(Product.category),
            selectinload(StockEntry.product).selectinload(Product.status),
            selectinload(StockEntry.product).selectinload(Product.tag),
            selectinload(StockEntry.product).selectinload(Product.image),
        )
    )
    refreshed_obj = session.exec(statement).one()
    
    # Update product current_stock based on closing_stock
    product.current_stock = entry_in.closing_stock
    session.add(product)
    session.commit()
    
    return refreshed_obj


@router.get("/{id}", response_model=StockEntryPublic)
def read_stock_entry(
    session: SessionDep, current_user: CurrentUser, id: uuid.UUID
) -> Any:
    """
    Get stock entry by ID.
    """
    statement = (
        select(StockEntry)
        .where(StockEntry.id == id)
        .options(
            selectinload(StockEntry.product).selectinload(Product.category),
            selectinload(StockEntry.product).selectinload(Product.status),
            selectinload(StockEntry.product).selectinload(Product.tag),
            selectinload(StockEntry.product).selectinload(Product.image),
        )
    )
    entry = session.exec(statement).first()
    
    if not entry:
        raise HTTPException(status_code=404, detail="Stock entry not found")
    
    return entry


@router.patch("/{id}", response_model=StockEntryPublic)
def update_stock_entry(
    *,
    session: SessionDep,
    admin_user: AdminUser,
    id: uuid.UUID,
    entry_in: StockEntryUpdate
) -> Any:
    """
    Update a stock entry.
    """
    entry = session.get(StockEntry, id)
    if not entry:
        raise HTTPException(status_code=404, detail="Stock entry not found")
    
    # Update entry
    entry_data = entry_in.model_dump(exclude_unset=True)
    entry.sqlmodel_update(entry_data)
    session.add(entry)
    session.commit()
    session.refresh(entry)
    
    # Load relationships for response
    statement = (
        select(StockEntry)
        .where(StockEntry.id == entry.id)
        .options(
            selectinload(StockEntry.product).selectinload(Product.category),
            selectinload(StockEntry.product).selectinload(Product.status),
            selectinload(StockEntry.product).selectinload(Product.tag),
            selectinload(StockEntry.product).selectinload(Product.image),
        )
    )
    refreshed_obj = session.exec(statement).one()
    
    # Update product current_stock if closing_stock was updated
    if entry_in.closing_stock is not None:
        product = session.get(Product, entry.product_id)
        if product:
            product.current_stock = entry_in.closing_stock
            session.add(product)
            session.commit()
    
    return refreshed_obj


@router.delete("/{id}")
def delete_stock_entry(
    session: SessionDep, admin_user: AdminUser, id: uuid.UUID
) -> dict[str, str]:
    """
    Delete a stock entry.
    """
    entry = session.get(StockEntry, id)
    if not entry:
        raise HTTPException(status_code=404, detail="Stock entry not found")
    
    session.delete(entry)
    session.commit()
    return {"message": "Stock entry deleted successfully"}
