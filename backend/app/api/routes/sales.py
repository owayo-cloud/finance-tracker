import uuid
from typing import Any, Optional
from datetime import datetime, date

from fastapi import APIRouter, HTTPException, Query
from sqlmodel import func, select, and_, or_
from sqlalchemy.orm import selectinload

from app.api.deps import AdminUser, CurrentUser, SessionDep
from app.models import (
    Sale, SaleCreate, SaleUpdate, SalePublic, SalesPublic,
    Product, PaymentMethod, PaymentMethodPublic, PaymentMethodsPublic,
    User, ProductPublic, ProductTag
)


router = APIRouter(prefix="/sales", tags=["sales"])


# ==================== PAYMENT METHODS ====================

@router.get("/payment-methods", response_model=PaymentMethodsPublic)
def read_payment_methods(
    session: SessionDep,
    current_user: CurrentUser,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, le=1000)
) -> Any:
    """
    Retrieve all available payment methods.
    Used for cashier to select payment method during sale.
    """
    count_statement = select(func.count()).select_from(PaymentMethod)
    count = session.exec(count_statement).one()
    
    statement = (
        select(PaymentMethod)
        .offset(skip)
        .limit(limit)
        .order_by(PaymentMethod.name)
    )
    
    payment_methods = session.exec(statement).all()
    
    return PaymentMethodsPublic(data=payment_methods, count=count)


# ==================== QUICK PRODUCT SEARCH FOR SALES ====================

@router.get("/search-products", response_model=list[ProductPublic])
def search_products_for_sale(
    session: SessionDep,
    current_user: CurrentUser,
    q: str = Query(..., min_length=1, description="Search query"),
    tag_id: Optional[str] = Query(None, description="Filter by tag ID"),
    limit: int = Query(50, le=100, description="Maximum results to return")
) -> Any:
    """
    Fast product search for sales cart.
    Searches by name or tag.
    Only returns products with status 'Active' and stock > 0.
    """
    from app.models import ProductCategory, ProductStatus
    
    # Build search pattern for case-insensitive search
    search_pattern = f"%{q}%"
    
    # Base query - only active products with stock
    conditions = [
        Product.name.ilike(search_pattern),
        Product.current_stock > 0
    ]
    
    # Add tag filter if provided
    if tag_id:
        conditions.append(Product.tag_id == tag_id)
    
    statement = (
        select(Product)
        .join(Product.category)
        .join(Product.tag)
        .join(Product.status)
        .where(
            and_(
                or_(Product.name.ilike(search_pattern)),
                Product.current_stock > 0,
                ProductStatus.name == "Active"
            )
        )
        .options(
            selectinload(Product.category),
            selectinload(Product.tag),
            selectinload(Product.status),
            selectinload(Product.image)
        )
        .limit(limit)
    )
    
    # Add tag filter if specified
    if tag_id:
        statement = statement.where(Product.tag_id == tag_id)
    
    products = session.exec(statement).all()
    
    return products


# ==================== SALES CRUD ====================

@router.post("", response_model=SalePublic)
def create_sale(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    sale_in: SaleCreate
) -> Any:
    """
    Create a new sale and update product stock.
    This is an atomic operation - both sale creation and stock update happen together.
    
    Business Rules:
    - Product must exist and be active
    - Product must have sufficient stock (real-time check)
    - Stock is automatically decremented
    - Sale amount is calculated from product selling price × quantity
    - Each sale is tracked to the cashier who created it
    """
    # Validate product exists
    product = session.get(Product, sale_in.product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Check if product is active
    from app.models import ProductStatus
    status = session.get(ProductStatus, product.status_id)
    if status and status.name != "Active":
        raise HTTPException(
            status_code=400,
            detail=f"Product '{product.name}' is not active. Current status: {status.name}"
        )
    
    # CRITICAL: Real-time stock validation
    if product.current_stock is None:
        raise HTTPException(
            status_code=400,
            detail=f"Product '{product.name}' has no stock information"
        )
    
    if product.current_stock < sale_in.quantity:
        raise HTTPException(
            status_code=400,
            detail=f"Insufficient stock for '{product.name}'. Available: {product.current_stock}, Requested: {sale_in.quantity}"
        )
    
    # Validate payment method
    payment_method = session.get(PaymentMethod, sale_in.payment_method_id)
    if not payment_method:
        raise HTTPException(status_code=404, detail="Payment method not found")
    
    # Calculate amount from selling price
    if product.selling_price is None:
        raise HTTPException(
            status_code=400,
            detail=f"Product '{product.name}' has no selling price set"
        )
    
    amount = float(product.selling_price) * sale_in.quantity
    
    # Create sale
    sale = Sale(
        **sale_in.model_dump(),
        amount=amount,
        created_by_id=current_user.id
    )
    
    # ATOMIC OPERATION: Update product stock
    product.current_stock -= sale_in.quantity
    
    # Save both operations in single transaction
    session.add(sale)
    session.add(product)
    
    try:
        session.commit()
        session.refresh(sale)
    except Exception as e:
        session.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to complete sale: {str(e)}"
        )
    
    return sale


@router.get("", response_model=SalesPublic)
def read_sales(
    session: SessionDep,
    current_user: CurrentUser,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, le=1000),
    product_id: Optional[str] = Query(None, description="Filter by product ID"),
    payment_method_id: Optional[str] = Query(None, description="Filter by payment method"),
    start_date: Optional[date] = Query(None, description="Filter sales from this date"),
    end_date: Optional[date] = Query(None, description="Filter sales until this date"),
    tag_id: Optional[str] = Query(None, description="Filter by product tag")
) -> Any:
    """
    Retrieve sales with optional filtering.
    Admins see all sales, cashiers see only their own sales.
    """
    # Count query
    count_statement = select(func.count()).select_from(Sale)
    
    # Base query
    statement = (
        select(Sale)
        .options(
            selectinload(Sale.product),
            selectinload(Sale.payment_method),
            selectinload(Sale.created_by)
        )
        .offset(skip)
        .limit(limit)
        .order_by(Sale.sale_date.desc())
    )
    
    # Apply filters
    conditions = []
    
    # Cashiers only see their own sales (unless admin/superuser)
    if not current_user.is_superuser:
        conditions.append(Sale.created_by_id == current_user.id)
        count_statement = count_statement.where(Sale.created_by_id == current_user.id)
    
    if product_id:
        conditions.append(Sale.product_id == product_id)
    
    if payment_method_id:
        conditions.append(Sale.payment_method_id == payment_method_id)
    
    if start_date:
        conditions.append(Sale.sale_date >= start_date)
    
    if end_date:
        conditions.append(Sale.sale_date <= end_date)
    
    # Tag filter requires joining with Product
    if tag_id:
        statement = statement.join(Product, Sale.product_id == Product.id)
        conditions.append(Product.tag_id == tag_id)
    
    if conditions:
        statement = statement.where(and_(*conditions))
        count_statement = count_statement.where(and_(*conditions))
    
    count = session.exec(count_statement).one()
    sales = session.exec(statement).all()
    
    return SalesPublic(data=sales, count=count)


@router.get("/today-summary", response_model=dict)
def get_today_sales_summary(
    session: SessionDep,
    current_user: CurrentUser
) -> Any:
    """
    Get today's sales summary for the current cashier.
    Returns total sales, total amount, and breakdown by payment method.
    """
    from sqlalchemy import cast, Date
    
    today = date.today()
    
    # Filter by current user unless admin
    conditions = [cast(Sale.sale_date, Date) == today]
    
    if not current_user.is_superuser:
        conditions.append(Sale.created_by_id == current_user.id)
    
    # Total sales and amount
    total_statement = (
        select(
            func.count(Sale.id).label('total_sales'),
            func.sum(Sale.amount).label('total_amount'),
            func.sum(Sale.quantity).label('total_items')
        )
        .where(and_(*conditions))
    )
    
    result = session.exec(total_statement).first()
    
    # Breakdown by payment method
    payment_breakdown_statement = (
        select(
            PaymentMethod.name,
            func.count(Sale.id).label('count'),
            func.sum(Sale.amount).label('amount')
        )
        .join(PaymentMethod, Sale.payment_method_id == PaymentMethod.id)
        .where(and_(*conditions))
        .group_by(PaymentMethod.name)
    )
    
    payment_breakdown = session.exec(payment_breakdown_statement).all()
    
    return {
        "date": today.isoformat(),
        "total_sales": result[0] or 0 if result else 0,
        "total_amount": float(result[1] or 0) if result else 0.0,
        "total_items": result[2] or 0 if result else 0,
        "payment_breakdown": [
            {
                "payment_method": row[0],
                "count": row[1],
                "amount": float(row[2] or 0)
            }
            for row in payment_breakdown
        ]
    }


@router.get("/{sale_id}", response_model=SalePublic)
def read_sale(
    session: SessionDep,
    current_user: CurrentUser,
    sale_id: uuid.UUID
) -> Any:
    """
    Get sale by ID.
    Cashiers can only view their own sales.
    """
    sale = session.get(Sale, sale_id)
    if not sale:
        raise HTTPException(status_code=404, detail="Sale not found")
    
    # Cashiers can only view their own sales
    if not current_user.is_superuser and sale.created_by_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to view this sale")
    
    return sale


@router.delete("/{sale_id}")
def delete_sale(
    session: SessionDep,
    admin_user: AdminUser,
    sale_id: uuid.UUID
) -> Any:
    """
    Delete a sale (admin only).
    Note: This also restores the product stock.
    """
    sale = session.get(Sale, sale_id)
    if not sale:
        raise HTTPException(status_code=404, detail="Sale not found")
    
    # Restore product stock
    product = session.get(Product, sale.product_id)
    if product:
        product.current_stock = (product.current_stock or 0) + sale.quantity
        session.add(product)
    
    session.delete(sale)
    session.commit()
    
    return {"message": "Sale deleted successfully", "id": sale_id}
