import uuid
from typing import Any, Optional
from datetime import datetime, timezone
from decimal import Decimal

from fastapi import APIRouter, HTTPException, Query
from sqlmodel import func, select, and_, or_, col
from sqlalchemy.orm import selectinload
from sqlalchemy import desc

from app.api.deps import AdminUser, CurrentUser, SessionDep
from app.core.logging_config import get_logger
from app.models import (
    Debt, DebtCreate, DebtUpdate, DebtPublic, DebtsPublic,
    DebtPayment, DebtPaymentCreate, DebtPaymentPublic, DebtPaymentsPublic,
    PaymentMethod, Sale
)

logger = get_logger(__name__)

router = APIRouter(prefix="/debts", tags=["debts"])


# ==================== DEBT CRUD ====================

@router.get("/", response_model=DebtsPublic)
def read_debts(
    session: SessionDep,
    current_user: CurrentUser,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, le=1000),
    customer_name: Optional[str] = None,
    status: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
) -> Any:
    """
    Retrieve debts with optional filters.
    """
    from sqlalchemy.sql import ColumnElement
    conditions: list[ColumnElement[bool]] = []
    
    if customer_name:
        conditions.append(Debt.customer_name.ilike(f"%{customer_name}%"))
    
    if status:
        # Support multiple statuses separated by comma
        status_list = [s.strip() for s in status.split(",") if s.strip()]
        if len(status_list) == 1:
            conditions.append(Debt.status == status_list[0])  # type: ignore[arg-type]
        elif len(status_list) > 1:
            # Use col() for proper SQLAlchemy column reference
            conditions.append(col(Debt.status).in_(status_list))
    
    if start_date:
        try:
            start_dt = datetime.fromisoformat(start_date.replace("Z", "+00:00"))
            conditions.append(Debt.debt_date >= start_dt)  # type: ignore[arg-type]
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid start_date format")
    
    if end_date:
        try:
            end_dt = datetime.fromisoformat(end_date.replace("Z", "+00:00"))
            conditions.append(Debt.debt_date <= end_dt)  # type: ignore[arg-type]
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid end_date format")
    
    count_statement = select(func.count()).select_from(Debt)
    if conditions:
        count_statement = count_statement.where(and_(*conditions))
    count = session.exec(count_statement).one()
    
    statement = (
        select(Debt)
        .options(
            selectinload(Debt.sale).selectinload(Sale.product)  # Load sale and product relationships
        )
    )
    if conditions:
        statement = statement.where(and_(*conditions))
    statement = statement.order_by(desc(Debt.debt_date)).offset(skip).limit(limit)
    
    debts = session.exec(statement).all()
    
    return DebtsPublic(data=debts, count=count)


@router.post("/", response_model=DebtPublic)
def create_debt(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    debt_in: DebtCreate
) -> Any:
    """
    Create a new debt record.
    Can be linked to a sale via sale_id.
    """
    try:
        # Validate sale_id if provided
        if debt_in.sale_id:
            sale = session.get(Sale, debt_in.sale_id)
            if not sale:
                raise HTTPException(status_code=404, detail="Sale not found")
        
        # Calculate balance (backend always recalculates to ensure accuracy)
        balance = debt_in.amount - debt_in.amount_paid
        
        # Determine status
        if balance <= 0:
            status = "paid"
        elif debt_in.amount_paid > 0:
            status = "partial"
        else:
            status = "pending"
        
        # Check if due_date is in the past and balance > 0
        if debt_in.due_date and balance > 0:
            due_dt = debt_in.due_date
            if isinstance(due_dt, str):
                due_dt = datetime.fromisoformat(due_dt.replace("Z", "+00:00"))
            if due_dt < datetime.now(timezone.utc):
                status = "overdue"
        
        # Create debt object with calculated balance and status
        # DebtCreate no longer includes balance/status, so we can use model_dump() directly
        debt = Debt(
            customer_name=debt_in.customer_name,
            customer_contact=debt_in.customer_contact,
            sale_id=debt_in.sale_id,
            amount=debt_in.amount,
            amount_paid=debt_in.amount_paid,
            balance=balance,
            debt_date=debt_in.debt_date or datetime.now(timezone.utc),
            due_date=debt_in.due_date,
            status=status,
            notes=debt_in.notes,
            created_by_id=current_user.id
        )
        
        session.add(debt)
        session.commit()
        session.refresh(debt)
        
        return debt
    except ValueError as e:
        # Handle validation errors from the model
        logger.warning(f"Validation error creating debt: {str(e)}")
        raise HTTPException(status_code=422, detail=f"Validation error: {str(e)}")
    except Exception as e:
        # Handle any other errors
        logger.error(f"Error creating debt: {type(e).__name__}: {str(e)}", exc_info=True)
        session.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to create debt: {str(e)}")


@router.get("/{debt_id}", response_model=DebtPublic)
def read_debt(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    debt_id: uuid.UUID
) -> Any:
    """
    Get a specific debt by ID.
    """
    debt = session.get(Debt, debt_id)
    if not debt:
        raise HTTPException(status_code=404, detail="Debt not found")
    
    return debt


@router.patch("/{debt_id}", response_model=DebtPublic)
def update_debt(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    debt_id: uuid.UUID,
    debt_in: DebtUpdate
) -> Any:
    """
    Update a debt record.
    """
    debt = session.get(Debt, debt_id)
    if not debt:
        raise HTTPException(status_code=404, detail="Debt not found")
    
    update_data = debt_in.model_dump(exclude_unset=True)
    
    # Recalculate balance if amount or amount_paid changed
    if "amount" in update_data or "amount_paid" in update_data:
        new_amount = Decimal(str(update_data.get("amount", debt.amount)))
        new_amount_paid = Decimal(str(update_data.get("amount_paid", debt.amount_paid)))
        update_data["balance"] = new_amount - new_amount_paid
        
        # Update status
        if update_data["balance"] <= 0:
            update_data["status"] = "paid"
        elif new_amount_paid > 0:
            update_data["status"] = "partial"
        else:
            update_data["status"] = "pending"
        
        # Check if overdue
        due_date = update_data.get("due_date", debt.due_date)
        if due_date and update_data["balance"] > 0:
            due_dt = due_date
            if isinstance(due_dt, str):
                due_dt = datetime.fromisoformat(due_dt.replace("Z", "+00:00"))
            if due_dt < datetime.now(timezone.utc):
                update_data["status"] = "overdue"
    
    for field, value in update_data.items():
        setattr(debt, field, value)
    
    debt.updated_at = datetime.now(timezone.utc)
    session.add(debt)
    session.commit()
    session.refresh(debt)
    
    return debt


@router.delete("/{debt_id}")
def delete_debt(
    *,
    session: SessionDep,
    admin_user: AdminUser,
    debt_id: uuid.UUID
) -> Any:
    """
    Delete a debt record (admin only).
    """
    debt = session.get(Debt, debt_id)
    if not debt:
        raise HTTPException(status_code=404, detail="Debt not found")
    
    session.delete(debt)
    session.commit()
    
    return {"message": "Debt deleted successfully"}


# ==================== DEBT PAYMENTS ====================

@router.post("/{debt_id}/payments", response_model=DebtPaymentPublic)
def create_debt_payment(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    debt_id: uuid.UUID,
    payment_in: DebtPaymentCreate
) -> Any:
    """
    Record a payment against a debt.
    This automatically updates the debt's amount_paid and balance.
    """
    debt = session.get(Debt, debt_id)
    if not debt:
        raise HTTPException(status_code=404, detail="Debt not found")
    
    # Validate payment method
    payment_method = session.get(PaymentMethod, payment_in.payment_method_id)
    if not payment_method:
        raise HTTPException(status_code=404, detail="Payment method not found")
    
    # Validate payment amount doesn't exceed balance
    if payment_in.amount > debt.balance:
        raise HTTPException(
            status_code=400,
            detail=f"Payment amount ({payment_in.amount}) exceeds debt balance ({debt.balance})"
        )
    
    # Create payment record
    payment = DebtPayment(
        **payment_in.model_dump(),
        debt_id=debt_id,
        created_by_id=current_user.id
    )
    session.add(payment)
    
    # Update debt
    debt.amount_paid += payment_in.amount
    debt.balance = debt.amount - debt.amount_paid
    
    # Update status
    if debt.balance <= 0:
        debt.status = "paid"
    elif debt.amount_paid > 0:
        debt.status = "partial"
    
    # Check if overdue
    if debt.due_date and debt.balance > 0:
        due_dt = debt.due_date
        if isinstance(due_dt, str):
            due_dt = datetime.fromisoformat(due_dt.replace("Z", "+00:00"))
        if due_dt < datetime.now(timezone.utc):
            debt.status = "overdue"
    
    debt.updated_at = datetime.now(timezone.utc)
    session.add(debt)
    session.commit()
    session.refresh(payment)
    session.refresh(debt)
    
    # Load relationships
    payment = session.exec(
        select(DebtPayment)
        .where(DebtPayment.id == payment.id)
        .options(
            selectinload(DebtPayment.payment_method),
            selectinload(DebtPayment.debt)
        )
    ).first()
    
    return payment


@router.get("/{debt_id}/payments", response_model=DebtPaymentsPublic)
def read_debt_payments(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    debt_id: uuid.UUID,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, le=1000)
) -> Any:
    """
    Get all payments for a specific debt.
    """
    debt = session.get(Debt, debt_id)
    if not debt:
        raise HTTPException(status_code=404, detail="Debt not found")
    
    count_statement = select(func.count()).select_from(DebtPayment).where(
        DebtPayment.debt_id == debt_id
    )
    count = session.exec(count_statement).one()
    
    statement = (
        select(DebtPayment)
        .where(DebtPayment.debt_id == debt_id)
        .options(
            selectinload(DebtPayment.payment_method)
        )
        .order_by(desc(DebtPayment.payment_date))
        .offset(skip)
        .limit(limit)
    )
    
    payments = session.exec(statement).all()
    
    return DebtPaymentsPublic(data=payments, count=count)


@router.get("/customers/{customer_name}/balance")
def get_customer_balance(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    customer_name: str
) -> Any:
    """
    Get total outstanding balance for a customer.
    """
    statement = select(func.sum(Debt.balance)).where(
        and_(
            Debt.customer_name == customer_name,
            Debt.balance > 0
        )
    )
    total_balance = session.exec(statement).one() or Decimal("0")
    
    return {
        "customer_name": customer_name,
        "total_balance": float(total_balance),
        "currency": "KES"
    }

