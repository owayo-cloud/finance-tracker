import uuid
from typing import Any, Optional
from datetime import datetime, date
from decimal import Decimal

from fastapi import APIRouter, HTTPException, Query
from sqlmodel import func, select, and_
from sqlalchemy.orm import selectinload

from app.api.deps import AdminUser, CurrentUser, SessionDep
from app.models import (
    ShiftReconciliation, ShiftReconciliationCreate, ShiftReconciliationUpdate,
    ShiftReconciliationPublic, ShiftReconciliationsPublic,
    Sale, PaymentMethod, User
)

router = APIRouter(prefix="/shift-reconciliation", tags=["shift-reconciliation"])


@router.post("", response_model=ShiftReconciliationPublic)
def create_shift_reconciliation(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    shift_in: ShiftReconciliationCreate
) -> Any:
    """
    Create a new shift reconciliation.
    Cashiers can create their own shift reconciliations.
    """
    shift = ShiftReconciliation(
        **shift_in.model_dump(),
        created_by_id=current_user.id
    )
    session.add(shift)
    session.commit()
    session.refresh(shift)
    
    return shift


@router.get("", response_model=ShiftReconciliationsPublic)
def read_shift_reconciliations(
    session: SessionDep,
    current_user: CurrentUser,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, le=1000),
    start_date: Optional[date] = Query(None, description="Filter from this date"),
    end_date: Optional[date] = Query(None, description="Filter until this date"),
) -> Any:
    """
    Retrieve shift reconciliations.
    Admins see all, cashiers see only their own.
    """
    count_statement = select(func.count()).select_from(ShiftReconciliation)
    statement = (
        select(ShiftReconciliation)
        .options(selectinload(ShiftReconciliation.created_by))
        .offset(skip)
        .limit(limit)
        .order_by(ShiftReconciliation.shift_date.desc())
    )
    
    conditions = []
    
    # Cashiers only see their own reconciliations
    if not current_user.is_superuser:
        conditions.append(ShiftReconciliation.created_by_id == current_user.id)
        count_statement = count_statement.where(ShiftReconciliation.created_by_id == current_user.id)
    
    if start_date:
        conditions.append(ShiftReconciliation.shift_date >= start_date)
    
    if end_date:
        conditions.append(ShiftReconciliation.shift_date <= end_date)
    
    if conditions:
        statement = statement.where(and_(*conditions))
        count_statement = count_statement.where(and_(*conditions))
    
    count = session.exec(count_statement).one()
    shifts = session.exec(statement).all()
    
    return ShiftReconciliationsPublic(data=shifts, count=count)


@router.get("/{shift_id}", response_model=ShiftReconciliationPublic)
def read_shift_reconciliation(
    session: SessionDep,
    current_user: CurrentUser,
    shift_id: uuid.UUID
) -> Any:
    """
    Get shift reconciliation by ID.
    Cashiers can only view their own.
    """
    shift = session.get(ShiftReconciliation, shift_id)
    if not shift:
        raise HTTPException(status_code=404, detail="Shift reconciliation not found")
    
    # Cashiers can only view their own
    if not current_user.is_superuser and shift.created_by_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to view this shift reconciliation")
    
    return shift


@router.patch("/{shift_id}", response_model=ShiftReconciliationPublic)
def update_shift_reconciliation(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    shift_id: uuid.UUID,
    shift_in: ShiftReconciliationUpdate
) -> Any:
    """
    Update a shift reconciliation.
    Cashiers can only update their own.
    """
    shift = session.get(ShiftReconciliation, shift_id)
    if not shift:
        raise HTTPException(status_code=404, detail="Shift reconciliation not found")
    
    # Cashiers can only update their own
    if not current_user.is_superuser and shift.created_by_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to update this shift reconciliation")
    
    update_data = shift_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(shift, field, value)
    
    session.add(shift)
    session.commit()
    session.refresh(shift)
    
    return shift


@router.get("/current/cash-summary", response_model=dict)
def get_current_cash_summary(
    session: SessionDep,
    current_user: CurrentUser,
    start_date: Optional[date] = Query(None, description="Start date (defaults to today)"),
    end_date: Optional[date] = Query(None, description="End date (defaults to today)"),
) -> Any:
    """
    Get cash sales summary for shift reconciliation.
    Returns cash totals for the specified date range.
    """
    from sqlalchemy import cast, Date
    
    # Default to today if not specified
    if not start_date:
        start_date = date.today()
    if not end_date:
        end_date = date.today()
    
    # Find cash payment method
    cash_pm = session.exec(
        select(PaymentMethod).where(
            PaymentMethod.name.ilike("%cash%"),
            PaymentMethod.is_active == True
        )
    ).first()
    
    if not cash_pm:
        return {
            "cash_sales": 0.0,
            "total_sales": 0.0,
            "cash_transactions": 0,
            "total_transactions": 0
        }
    
    # Build conditions
    conditions = [
        cast(Sale.sale_date, Date) >= start_date,
        cast(Sale.sale_date, Date) <= end_date
    ]
    
    # Cashiers only see their own sales
    if not current_user.is_superuser:
        conditions.append(Sale.created_by_id == current_user.id)
    
    # Cash sales
    cash_conditions = conditions + [Sale.payment_method_id == cash_pm.id]
    cash_statement = (
        select(
            func.count(Sale.id).label('count'),
            func.sum(Sale.total_amount).label('total')
        )
        .where(and_(*cash_conditions))
    )
    cash_result = session.exec(cash_statement).first()
    
    # All sales
    all_sales_statement = (
        select(
            func.count(Sale.id).label('count'),
            func.sum(Sale.total_amount).label('total')
        )
        .where(and_(*conditions))
    )
    all_sales_result = session.exec(all_sales_statement).first()
    
    return {
        "cash_sales": float(cash_result[1] or 0) if cash_result else 0.0,
        "total_sales": float(all_sales_result[1] or 0) if all_sales_result else 0.0,
        "cash_transactions": cash_result[0] or 0 if cash_result else 0,
        "total_transactions": all_sales_result[0] or 0 if all_sales_result else 0
    }

