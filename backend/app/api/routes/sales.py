import uuid
from datetime import date, datetime, timezone
from decimal import Decimal
from typing import Any

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import Date, String, cast, desc, exists
from sqlalchemy.orm import selectinload
from sqlalchemy.sql import ColumnElement
from sqlmodel import and_, func, or_, select

from app.api.deps import AdminUser, CurrentUser, SessionDep
from app.core.logging_config import get_logger
from app.models import (
    Debt,
    PaymentMethod,
    PaymentMethodCreate,
    PaymentMethodPublic,
    PaymentMethodsPublic,
    PaymentMethodUpdate,
    Product,
    ProductPublic,
    Sale,
    SaleCreate,
    SalePayment,
    SalePaymentPublic,
    SalePublic,
    SalesPublic,
)

logger = get_logger(__name__)

router = APIRouter(prefix="/sales", tags=["sales"])


# ==================== PAYMENT METHODS ====================


@router.get("/payment-methods", response_model=PaymentMethodsPublic)
def read_payment_methods(
    session: SessionDep,
    current_user: CurrentUser,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, le=1000),
) -> Any:
    """
    Retrieve all available payment methods.
    Used for cashier to select payment method during sale.
    """
    count_statement = (
        select(func.count())
        .select_from(PaymentMethod)
        .where(PaymentMethod.is_active.is_(True))
    )
    count = session.exec(count_statement).one()

    statement = (
        select(PaymentMethod)
        .where(PaymentMethod.is_active.is_(True))
        .offset(skip)
        .limit(limit)
        .order_by(PaymentMethod.name)
    )

    payment_methods = session.exec(statement).all()

    return PaymentMethodsPublic(data=payment_methods, count=count)


@router.post("/payment-methods", response_model=PaymentMethodPublic)
def create_payment_method(
    *,
    session: SessionDep,
    admin_user: AdminUser,
    payment_method_in: PaymentMethodCreate,
) -> Any:
    """
    Create a new payment method (admin only).
    """
    # Check if payment method with same name already exists
    existing = session.exec(
        select(PaymentMethod).where(PaymentMethod.name == payment_method_in.name)
    ).first()

    if existing:
        raise HTTPException(
            status_code=400,
            detail=f"Payment method with name '{payment_method_in.name}' already exists",
        )

    payment_method = PaymentMethod(**payment_method_in.model_dump())
    session.add(payment_method)
    session.commit()
    session.refresh(payment_method)

    return payment_method


@router.patch(
    "/payment-methods/{payment_method_id}", response_model=PaymentMethodPublic
)
def update_payment_method(
    *,
    session: SessionDep,
    admin_user: AdminUser,
    payment_method_id: uuid.UUID,
    payment_method_in: PaymentMethodUpdate,
) -> Any:
    """
    Update a payment method (admin only).
    """
    payment_method = session.get(PaymentMethod, payment_method_id)
    if not payment_method:
        raise HTTPException(status_code=404, detail="Payment method not found")

    update_data = payment_method_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(payment_method, field, value)

    session.add(payment_method)
    session.commit()
    session.refresh(payment_method)

    return payment_method


# ==================== QUICK PRODUCT SEARCH FOR SALES ====================


@router.get("/search-products", response_model=list[ProductPublic])
def search_products_for_sale(
    session: SessionDep,
    current_user: CurrentUser,
    q: str = Query(..., min_length=1, description="Search query"),
    category_id: str | None = Query(None, description="Filter by category ID"),
    limit: int = Query(50, le=100, description="Maximum results to return"),
) -> Any:
    """
    Fast product search for sales cart.
    Searches by name or category.
    Only returns products with status 'Active' and stock > 0.
    """
    from app.models import ProductStatus

    # Build search pattern for case-insensitive search
    search_pattern = f"%{q}%"

    # Base query - only active products with stock
    conditions: list[ColumnElement[bool]] = [
        Product.name.ilike(search_pattern),
        Product.current_stock > 0,  # type: ignore[arg-type]
    ]

    # Add category filter if provided
    if category_id:
        conditions.append(Product.category_id == category_id)  # type: ignore[arg-type]

    statement = (
        select(Product)
        .join(Product.category)
        .join(Product.status)
        .where(
            and_(
                or_(Product.name.ilike(search_pattern)),
                Product.current_stock > 0,
                ProductStatus.name == "Active",
            )
        )
        .options(
            selectinload(Product.category),
            selectinload(Product.status),
            selectinload(Product.image),
        )
        .limit(limit)
    )

    # Add category filter if specified
    if category_id:
        statement = statement.where(Product.category_id == category_id)

    products = session.exec(statement).all()

    return products


# ==================== SALES CRUD ====================


@router.post("", response_model=SalePublic)
def create_sale(
    *, session: SessionDep, current_user: CurrentUser, sale_in: SaleCreate
) -> Any:
    """
    Create a new sale and update product stock.
    This is an atomic operation - both sale creation and stock update happen together.

    Business Rules:
    - Till must be open (POS lock)
    - Product must exist and be active
    - Product must have sufficient stock (real-time check)
    - Stock is automatically decremented
    - Sale amount is calculated from product selling price × quantity
    - Each sale is tracked to the cashier who created it (current_user)
    """
    # POS LOCK: Check if till is open
    from app.api.utils.till_utils import get_current_open_shift

    open_shift = get_current_open_shift(session)
    if not open_shift:
        raise HTTPException(
            status_code=403,
            detail="POS is locked. Please open a till before making sales.",
        )

    # Verify current_user is valid and active
    if not current_user or not current_user.is_active:
        raise HTTPException(
            status_code=403, detail="User is not active or not authenticated"
        )

    # ROLE-BASED ACCESS CONTROL: Auditors cannot create sales
    if current_user.is_auditor:
        raise HTTPException(
            status_code=403,
            detail="Auditors have read-only access. Sales creation is not allowed.",
        )

    # Validate product exists and lock row to prevent race conditions
    product = session.exec(
        select(Product).where(Product.id == sale_in.product_id).with_for_update()
    ).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    # Check if product is active
    from app.models import ProductStatus

    status = session.get(ProductStatus, product.status_id)
    if status and status.name != "Active":
        raise HTTPException(
            status_code=400,
            detail=f"Product '{product.name}' is not active. Current status: {status.name}",
        )

    # CRITICAL: Real-time stock validation
    if product.current_stock is None:
        raise HTTPException(
            status_code=400, detail=f"Product '{product.name}' has no stock information"
        )

    if product.current_stock < sale_in.quantity:
        raise HTTPException(
            status_code=400,
            detail=f"Insufficient stock for '{product.name}'. Available: {product.current_stock}, Requested: {sale_in.quantity}",
        )

    # Validate payment method
    payment_method = session.get(PaymentMethod, sale_in.payment_method_id)
    if not payment_method:
        raise HTTPException(status_code=404, detail="Payment method not found")

    # Calculate total_amount from selling price and quantity
    if product.selling_price is None:
        raise HTTPException(
            status_code=400, detail=f"Product '{product.name}' has no selling price set"
        )

    # Use the total_amount from sale_in if provided, otherwise calculate it
    if sale_in.total_amount is None or sale_in.total_amount == 0:
        calculated_total = float(product.selling_price) * sale_in.quantity
    else:
        calculated_total = float(sale_in.total_amount)

    # Create sale
    # IMPORTANT: created_by_id must be the currently authenticated user (from JWT token)
    # This ensures the sale is correctly attributed to the person who made it
    sale = Sale(
        **sale_in.model_dump(),
        total_amount=Decimal(str(calculated_total)),
        created_by_id=current_user.id,  # This is the authenticated user from the JWT token
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
            status_code=500, detail=f"Failed to complete sale: {str(e)}"
        )

    return sale


# ==================== MULTIPLE PAYMENT METHODS SALE ====================


class PaymentData(BaseModel):
    """Individual payment data"""

    payment_method_id: str
    amount: float
    reference_number: str | None = None


class MultiPaymentSaleCreate(BaseModel):
    """Create a sale with multiple payment methods"""

    product_id: str
    quantity: int
    unit_price: float
    total_amount: float
    customer_name: str | None = None
    notes: str | None = None
    payments: list[PaymentData]


@router.post("/multi-payment", response_model=SalePublic)
def create_sale_with_multiple_payments(
    *, session: SessionDep, current_user: CurrentUser, sale_in: MultiPaymentSaleCreate
) -> Any:
    """
    Create a sale with multiple payment methods.
    This allows splitting a single sale across multiple payment methods (e.g., cash + MPESA).

    Business Rules:
    - Till must be open (POS lock)
    - Product must exist and be active
    - Product must have sufficient stock
    - Sum of all payment amounts must equal total_amount
    - Each payment can have an optional reference number
    - Sale is attributed to the currently authenticated user (current_user)
    """
    # POS LOCK: Check if till is open
    from app.api.utils.till_utils import get_current_open_shift

    open_shift = get_current_open_shift(session)
    if not open_shift:
        raise HTTPException(
            status_code=403,
            detail="POS is locked. Please open a till before making sales.",
        )

    # Verify current_user is valid and active
    if not current_user or not current_user.is_active:
        raise HTTPException(
            status_code=403, detail="User is not active or not authenticated"
        )

    # ROLE-BASED ACCESS CONTROL: Auditors cannot create sales
    if current_user.is_auditor:
        raise HTTPException(
            status_code=403,
            detail="Auditors have read-only access. Sales creation is not allowed.",
        )

    # Validate product exists and lock row to prevent race conditions
    product = session.exec(
        select(Product).where(Product.id == sale_in.product_id).with_for_update()
    ).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    # Check if product is active
    from app.models import ProductStatus

    status = session.get(ProductStatus, product.status_id)
    if status and status.name != "Active":
        raise HTTPException(
            status_code=400,
            detail=f"Product '{product.name}' is not active. Current status: {status.name}",
        )

    # CRITICAL: Real-time stock validation (with row lock)
    if product.current_stock is None:
        raise HTTPException(
            status_code=400, detail=f"Product '{product.name}' has no stock information"
        )

    if product.current_stock < sale_in.quantity:
        raise HTTPException(
            status_code=400,
            detail=f"Insufficient stock for '{product.name}'. Available: {product.current_stock}, Requested: {sale_in.quantity}",
        )

    # Validate payments
    # If customer is provided, allow empty payments (full amount becomes debt)
    # Otherwise, require at least one payment method
    if not sale_in.customer_name:
        if not sale_in.payments or len(sale_in.payments) == 0:
            raise HTTPException(
                status_code=400,
                detail="At least one payment method is required when no customer is selected",
            )

    total_payment_amount = Decimal(0)
    primary_payment_method_id = None

    # Process payments if any are provided
    if sale_in.payments and len(sale_in.payments) > 0:
        for payment_data in sale_in.payments:
            try:
                payment_method_id = uuid.UUID(payment_data.payment_method_id)
            except (ValueError, AttributeError):
                raise HTTPException(
                    status_code=400,
                    detail=f"Invalid payment method ID: {payment_data.payment_method_id}",
                )

            amount = Decimal(str(payment_data.amount))

            # Validate payment method exists
            payment_method = session.get(PaymentMethod, payment_method_id)
            if not payment_method:
                raise HTTPException(
                    status_code=404,
                    detail=f"Payment method {payment_method_id} not found",
                )

            if not payment_method.is_active:
                raise HTTPException(
                    status_code=400,
                    detail=f"Payment method '{payment_method.name}' is not active",
                )

            if amount <= 0:
                raise HTTPException(
                    status_code=400, detail="Payment amount must be greater than 0"
                )

            total_payment_amount += amount

            # Use first payment method as primary (for backward compatibility)
            if primary_payment_method_id is None:
                primary_payment_method_id = payment_method_id

    # Validate total payment amount
    # Convert sale_in.total_amount to Decimal for comparison
    sale_total_amount = Decimal(str(sale_in.total_amount))
    payment_difference = total_payment_amount - sale_total_amount

    # If customer is provided, allow partial or zero payment (debt will be created)
    # Otherwise, require full payment
    if sale_in.customer_name:
        # Customer provided: allow zero or partial payment (entire amount can be debt)
        # No minimum payment required
        pass
    else:
        # No customer: require full payment
        if payment_difference < -Decimal("0.01"):  # Underpayment not allowed
            raise HTTPException(
                status_code=400,
                detail=f"Total payment amount ({total_payment_amount}) is less than sale total ({sale_total_amount}). Underpayment: {abs(payment_difference)}",
            )
    # Overpayment validation: Allow reasonable overpayment (up to 20% of total) for change
    # But flag excessive overpayments as potential errors
    if payment_difference > Decimal("0.01"):  # Overpayment
        overpayment_percentage = (payment_difference / sale_total_amount) * 100
        if overpayment_percentage > 20:  # More than 20% overpayment
            raise HTTPException(
                status_code=400,
                detail=f"Excessive overpayment detected: {payment_difference} ({overpayment_percentage:.1f}% of total). Please verify the payment amount.",
            )

    # Calculate total_amount from selling price if not provided
    if sale_in.total_amount is None or sale_in.total_amount == 0:
        if product.selling_price is None:
            raise HTTPException(
                status_code=400,
                detail=f"Product '{product.name}' has no selling price set",
            )
        calculated_total = Decimal(str(product.selling_price)) * Decimal(
            str(sale_in.quantity)
        )
    else:
        calculated_total = sale_total_amount

    # Handle payment_method_id for sales with no payments (credit sales)
    # If no payments provided but customer exists, we need a payment method for the sale record
    # Try to find a "Credit" payment method, or use the first active payment method as fallback
    final_payment_method_id = primary_payment_method_id
    if final_payment_method_id is None and sale_in.customer_name:
        # Look for a "Credit" payment method
        credit_method = session.exec(
            select(PaymentMethod)
            .where(PaymentMethod.name.ilike("%credit%"))
            .where(PaymentMethod.is_active.is_(True))
            .limit(1)
        ).first()

        if credit_method:
            final_payment_method_id = credit_method.id
        else:
            # Fallback: use first active payment method
            fallback_method = session.exec(
                select(PaymentMethod).where(PaymentMethod.is_active.is_(True)).limit(1)
            ).first()
            if fallback_method:
                final_payment_method_id = fallback_method.id

    # If still no payment method found, raise error (shouldn't happen if payment methods exist)
    if final_payment_method_id is None:
        raise HTTPException(
            status_code=400,
            detail="No payment method available. Please configure at least one active payment method in the system.",
        )

    # Create sale with primary payment method (for backward compatibility)
    # IMPORTANT: created_by_id must be the currently authenticated user (from JWT token)
    # This ensures the sale is correctly attributed to the person who made it
    sale = Sale(
        product_id=sale_in.product_id,
        quantity=sale_in.quantity,
        unit_price=Decimal(str(sale_in.unit_price)),
        total_amount=calculated_total,
        payment_method_id=final_payment_method_id,
        customer_name=sale_in.customer_name,
        notes=sale_in.notes,
        created_by_id=current_user.id,  # This is the authenticated user from the JWT token
    )

    # ATOMIC OPERATION: Update product stock
    product.current_stock -= sale_in.quantity

    # Save sale first
    session.add(sale)
    session.add(product)

    try:
        session.flush()  # Flush to get sale.id without committing
        session.refresh(sale)

        # Create payment records (only if payments were provided)
        if sale_in.payments and len(sale_in.payments) > 0:
            for payment_data in sale_in.payments:
                try:
                    payment_method_id = uuid.UUID(payment_data.payment_method_id)
                except (ValueError, AttributeError):
                    raise HTTPException(
                        status_code=400,
                        detail=f"Invalid payment method ID: {payment_data.payment_method_id}",
                    )

                amount = Decimal(str(payment_data.amount))
                reference_number = payment_data.reference_number

                sale_payment = SalePayment(
                    sale_id=sale.id,
                    payment_method_id=payment_method_id,
                    amount=amount,
                    reference_number=reference_number,
                )
                session.add(sale_payment)

        session.commit()
        session.refresh(sale)

        # Create debt if customer is provided and payment is less than total
        if sale.customer_name and total_payment_amount < calculated_total:
            debt_amount = calculated_total - total_payment_amount

            # Get customer contact from sale if available
            customer_contact = None
            if sale_in.customer_name:
                # Try to find existing debt for this customer to get contact
                existing_debt = session.exec(
                    select(Debt)
                    .where(Debt.customer_name == sale_in.customer_name)
                    .where(Debt.customer_contact.isnot(None))
                    .limit(1)
                ).first()
                if existing_debt:
                    customer_contact = existing_debt.customer_contact

            # Create debt record
            debt = Debt(
                customer_name=sale.customer_name,
                customer_contact=customer_contact,
                sale_id=sale.id,
                amount=debt_amount,
                amount_paid=Decimal("0"),
                balance=debt_amount,
                debt_date=datetime.now(timezone.utc),
                status="pending",
                notes=f"Credit from sale #{sale.id}",
                created_by_id=current_user.id,
            )

            session.add(debt)
            try:
                session.commit()
            except Exception as e:
                session.rollback()
                # Don't fail the sale if debt creation fails, just log it
                logger.warning(f"Failed to create debt record: {str(e)}")

    except Exception as e:
        session.rollback()
        raise HTTPException(
            status_code=500, detail=f"Failed to complete sale: {str(e)}"
        )

    return sale


@router.get("/{sale_id}/payments", response_model=list[SalePaymentPublic])
def read_sale_payments(
    session: SessionDep, current_user: CurrentUser, sale_id: uuid.UUID
) -> Any:
    """
    Get all payment methods used for a specific sale.
    """
    sale = session.get(Sale, sale_id)
    if not sale:
        raise HTTPException(status_code=404, detail="Sale not found")

    # Cashiers can only view their own sales
    if not current_user.is_superuser and sale.created_by_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to view this sale")

    statement = (
        select(SalePayment)
        .where(SalePayment.sale_id == sale_id)
        .options(selectinload(SalePayment.payment_method))
    )

    payments = session.exec(statement).all()
    return payments


@router.get("", response_model=SalesPublic)
def read_sales(
    session: SessionDep,
    current_user: CurrentUser,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, le=1000),
    product_id: str | None = Query(None, description="Filter by product ID"),
    payment_method_id: str | None = Query(None, description="Filter by payment method"),
    start_date: date | None = Query(None, description="Filter sales from this date"),
    end_date: date | None = Query(None, description="Filter sales until this date"),
    category_id: str | None = Query(None, description="Filter by product category"),
    cashier_name: str | None = Query(None, description="Filter by cashier name (searches full_name and username)"),
    search: str | None = Query(None, description="Search by receipt number (last 6 chars) or notes"),
    exclude_with_debt: bool = Query(False, description="Exclude sales that have associated debts (for receipts view)"),
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
            selectinload(Sale.created_by),
        )
        .offset(skip)
        .limit(limit)
        .order_by(desc(Sale.sale_date))
    )

    # Apply filters
    conditions: list[ColumnElement[bool]] = []

    # Cashiers only see their own sales (unless admin/superuser or auditor)
    # Auditors can see all sales for auditing purposes
    if not current_user.is_superuser and not current_user.is_auditor:
        conditions.append(Sale.created_by_id == current_user.id)  # type: ignore[arg-type]
        count_statement = count_statement.where(Sale.created_by_id == current_user.id)

    if product_id:
        conditions.append(Sale.product_id == product_id)  # type: ignore[arg-type]

    if payment_method_id:
        conditions.append(Sale.payment_method_id == payment_method_id)  # type: ignore[arg-type]

    if start_date:
        # Cast datetime to date for comparison to properly match dates
        conditions.append(cast(Sale.sale_date, Date) >= start_date)  # type: ignore[arg-type]

    if end_date:
        # Cast datetime to date for comparison to include entire day
        conditions.append(cast(Sale.sale_date, Date) <= end_date)  # type: ignore[arg-type]

    # Category filter requires joining with Product
    needs_product_join = category_id is not None
    needs_user_join = cashier_name is not None

    if needs_product_join:
        statement = statement.join(Product, Sale.product_id == Product.id)
        conditions.append(Product.category_id == category_id)  # type: ignore[arg-type]

    # Cashier filter - filter by cashier name (searches full_name and username)
    if cashier_name:
        from app.models import User
        cashier_search_term = cashier_name.strip().lower()
        # Join with User table to search by name (only if not already joined)
        # User is already loaded via selectinload, but we need to join for filtering
        if not needs_user_join or "User" not in str(statement):
            statement = statement.join(User, Sale.created_by_id == User.id)  # type: ignore[arg-type]
        # Search in both full_name and username
        cashier_conditions = or_(
            cast(User.full_name, String).ilike(f"%{cashier_search_term}%"),  # type: ignore[attr-defined]
            cast(User.username, String).ilike(f"%{cashier_search_term}%"),  # type: ignore[attr-defined]
        )
        conditions.append(cashier_conditions)  # type: ignore[arg-type]

    # Search filter - search in notes (receipt number search done after fetch)
    if search:
        search_term = search.strip()
        if search_term:
            # Search in notes using ILIKE for case-insensitive search
            conditions.append(
                or_(
                    cast(Sale.notes, String).ilike(f"%{search_term}%"),  # type: ignore[attr-defined]
                )
            )

    # Exclude sales with associated debts (for receipts view - debt sales should appear in invoices)
    if exclude_with_debt:
        # Exclude sales that have associated debts using NOT EXISTS
        debt_exists = exists().where(
            and_(
                Debt.sale_id == Sale.id,
                Debt.sale_id.isnot(None)
            )
        )
        conditions.append(~debt_exists)  # type: ignore[arg-type]
        count_statement = count_statement.where(~debt_exists)  # type: ignore[arg-type]

    if conditions:
        statement = statement.where(and_(*conditions))
        count_statement = count_statement.where(and_(*conditions))

    count = session.exec(count_statement).one()
    sales = session.exec(statement).all()

    # Apply receipt number search filter if provided (search by last 6 chars of ID)
    # This is done after fetch because UUID string conversion is easier in Python
    if search:
        search_term = search.strip().lower()
        if search_term:
            filtered_sales = []
            for sale in sales:
                # Check notes (already filtered in SQL above)
                notes_match = sale.notes and search_term in sale.notes.lower()
                # Also check receipt number (last 6 chars of UUID as string)
                receipt_no = str(sale.id)[-6:].lower()
                receipt_match = search_term in receipt_no
                if notes_match or receipt_match:
                    filtered_sales.append(sale)
            sales = filtered_sales
            # Update count to reflect filtered results
            count = len(sales)

    return SalesPublic(data=sales, count=count)


@router.get("/today-summary", response_model=dict)
def get_today_sales_summary(session: SessionDep, current_user: CurrentUser) -> Any:
    """
    Get today's sales summary for the current cashier.
    Returns total sales, total amount, and breakdown by payment method.
    """
    from sqlalchemy import Date, cast

    today = date.today()

    # Filter by current user unless admin
    conditions: list[ColumnElement[bool]] = [cast(Sale.sale_date, Date) == today]  # type: ignore[arg-type]

    if not current_user.is_superuser:
        conditions.append(Sale.created_by_id == current_user.id)  # type: ignore[arg-type]

    # Total sales and amount
    total_statement = select(
        func.count(Sale.id).label("total_sales"),
        func.sum(Sale.total_amount).label("total_amount"),
        func.sum(Sale.quantity).label("total_items"),
    ).where(and_(*conditions))

    result = session.exec(total_statement).first()

    # Breakdown by payment method
    payment_breakdown_statement = (
        select(
            PaymentMethod.name,
            func.count(Sale.id).label("count"),
            func.sum(Sale.total_amount).label("amount"),
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
            {"payment_method": row[0], "count": row[1], "amount": float(row[2] or 0)}
            for row in payment_breakdown
        ],
    }


@router.get("/{sale_id}", response_model=SalePublic)
def read_sale(
    session: SessionDep, current_user: CurrentUser, sale_id: uuid.UUID
) -> Any:
    """
    Get sale by ID.
    Cashiers can only view their own sales.
    """
    statement = (
        select(Sale)
        .where(Sale.id == sale_id)
        .options(
            selectinload(Sale.product),
            selectinload(Sale.payment_method),
            selectinload(Sale.created_by),  # Load the user who created the sale
        )
    )
    sale = session.exec(statement).first()
    if not sale:
        raise HTTPException(status_code=404, detail="Sale not found")

    # Cashiers can only view their own sales
    if not current_user.is_superuser and sale.created_by_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to view this sale")

    # Refresh the created_by user to ensure we have the latest data
    if sale.created_by:
        session.refresh(sale.created_by)

    return sale


@router.delete("/{sale_id}")
def delete_sale(session: SessionDep, admin_user: AdminUser, sale_id: uuid.UUID) -> Any:
    """
    Delete a sale (admin only).
    Note: This also restores the product stock.
    """
    sale = session.get(Sale, sale_id)
    if not sale:
        raise HTTPException(status_code=404, detail="Sale not found")

    # Restore product stock with row lock to prevent race conditions
    product = session.exec(
        select(Product).where(Product.id == sale.product_id).with_for_update()
    ).first()

    if product:
        product.current_stock = (product.current_stock or 0) + sale.quantity
        session.add(product)

    session.delete(sale)

    try:
        session.commit()
    except Exception as e:
        session.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to delete sale: {str(e)}")

    return {"message": "Sale deleted successfully", "id": sale_id}
