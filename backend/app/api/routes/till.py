import uuid
from typing import Any, Optional
from datetime import datetime, date, timezone
from decimal import Decimal

from fastapi import APIRouter, HTTPException, Query
from sqlmodel import func, select, and_, or_
from sqlalchemy.orm import selectinload
from sqlalchemy import cast, Date
from sqlalchemy.sql import ColumnElement

from app.api.deps import CurrentUser, SessionDep, AdminUser
from app.api.utils.till_utils import get_current_open_shift
from app.models import (
    TillShift, TillShiftCreate, TillShiftUpdate, TillShiftPublic, TillShiftsPublic,
    ShiftReconciliation, ShiftReconciliationCreate,
    PaymentMethodReconciliation, PaymentMethodReconciliationCreate,
    CashierVariance, CashierVarianceCreate, CashierVariancePublic, CashierVariancesPublic,
    Sale, PaymentMethod, User, SalePayment
)

router = APIRouter(prefix="/till", tags=["till"])


def get_last_closed_shift(session: SessionDep) -> Optional[TillShift]:
    """Get the last closed shift to determine next shift type"""
    statement = (
        select(TillShift)
        .where(TillShift.status.in_(["closed", "reconciled"]))
        .order_by(TillShift.closing_time.desc())
    )
    return session.exec(statement).first()


def calculate_system_counts(session: SessionDep, till_shift: TillShift) -> dict[str, Any]:
    """Calculate system counts for all payment methods from sales during the shift"""
    # Get all sales during this shift
    conditions: list[ColumnElement[bool]] = [
        Sale.sale_date >= till_shift.opening_time,  # type: ignore[arg-type]
        Sale.created_by_id == till_shift.opened_by_id  # type: ignore[arg-type]
    ]
    
    if till_shift.closing_time:
        conditions.append(Sale.sale_date <= till_shift.closing_time)  # type: ignore[arg-type]
    
    # Get all payment methods
    payment_methods = session.exec(select(PaymentMethod).where(PaymentMethod.is_active == True)).all()
    
    system_counts = {}
    for pm in payment_methods:
        # Get sales with this payment method (including multi-payment)
        pm_conditions = conditions.copy()
        
        # Check both primary payment method and SalePayment records
        pm_sales_statement = (
            select(func.sum(Sale.total_amount))
            .where(
                and_(*pm_conditions, Sale.payment_method_id == pm.id)
            )
        )
        primary_total = session.exec(pm_sales_statement).first() or Decimal(0)
        
        # Get multi-payment amounts
        multi_payment_statement = (
            select(func.sum(SalePayment.amount))
            .join(Sale, SalePayment.sale_id == Sale.id)
            .where(
                and_(*pm_conditions, SalePayment.payment_method_id == pm.id)
            )
        )
        multi_total = session.exec(multi_payment_statement).first() or Decimal(0)
        
        system_counts[str(pm.id)] = {
            "payment_method_id": pm.id,
            "payment_method_name": pm.name,
            "system_count": primary_total + multi_total
        }
    
    return system_counts


@router.post("/open", response_model=TillShiftPublic)
def open_till(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    till_in: TillShiftCreate
) -> Any:
    """
    Open a new till shift.
    - Cashiers must open till before making sales
    - Shift type alternates (Day/Night)
    - Only one till can be open at a time
    """
    # Check if there's already an open shift
    open_shift = get_current_open_shift(session)
    if open_shift:
        raise HTTPException(
            status_code=400,
            detail=f"A till is already open. Shift ID: {open_shift.id}, Opened by: {open_shift.opened_by.email if open_shift.opened_by else 'Unknown'}"
        )
    
    # Validate shift type
    shift_type = till_in.shift_type.lower()
    if shift_type not in ["day", "night"]:
        raise HTTPException(status_code=400, detail="Shift type must be 'day' or 'night'")
    
    # Determine shift type based on last closed shift
    last_shift = get_last_closed_shift(session)
    if last_shift:
        # Alternate: if last was day, next is night, and vice versa
        if last_shift.shift_type.lower() == "day":
            expected_shift = "night"
        else:
            expected_shift = "day"
        
        if shift_type != expected_shift:
            raise HTTPException(
                status_code=400,
                detail=f"Expected shift type '{expected_shift}' (alternating from last shift). Last shift was '{last_shift.shift_type}'"
            )
    
    # Create new till shift
    till_shift = TillShift(
        shift_type=shift_type,
        opening_cash_float=till_in.opening_cash_float,
        opening_balance=till_in.opening_balance,  # Balance left by previous cashier (optional)
        opened_by_id=current_user.id,
        status="open",
        notes=till_in.notes
    )
    
    session.add(till_shift)
    session.commit()
    session.refresh(till_shift)
    
    # Load relationships
    session.refresh(till_shift.opened_by)
    
    result = TillShiftPublic(
        **till_shift.model_dump(),
        opened_by_name=till_shift.opened_by.full_name or till_shift.opened_by.email
    )
    
    return result


@router.get("/current", response_model=TillShiftPublic)
def get_current_till(
    *,
    session: SessionDep,
    current_user: CurrentUser
) -> Any:
    """Get the currently open till shift"""
    till_shift = get_current_open_shift(session)
    if not till_shift:
        raise HTTPException(status_code=404, detail="No till is currently open")
    
    # Load relationships
    session.refresh(till_shift.opened_by)
    if till_shift.closed_by_id:
        session.refresh(till_shift.closed_by)
    
    result = TillShiftPublic(
        **till_shift.model_dump(),
        opened_by_name=till_shift.opened_by.full_name or till_shift.opened_by.email,
        closed_by_name=till_shift.closed_by.full_name or till_shift.closed_by.email if till_shift.closed_by else None
    )
    
    return result


@router.get("/status", response_model=dict)
def get_till_status(
    *,
    session: SessionDep,
    current_user: CurrentUser
) -> Any:
    """Check if till is open (for POS lock)"""
    till_shift = get_current_open_shift(session)
    
    return {
        "is_open": till_shift is not None,
        "till_id": str(till_shift.id) if till_shift else None,
        "opened_by": till_shift.opened_by.email if till_shift and till_shift.opened_by else None,
        "opening_time": till_shift.opening_time.isoformat() if till_shift else None
    }


@router.post("/close", response_model=TillShiftPublic)
def close_till(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    closing_cash_float: Decimal = Query(..., description="Closing cash float amount")
) -> Any:
    """
    Close the current till shift.
    - Only the cashier who opened it can close it (unless admin)
    - Calculates system counts automatically
    """
    till_shift = get_current_open_shift(session)
    if not till_shift:
        raise HTTPException(status_code=404, detail="No till is currently open")
    
    # Check authorization: only opener or admin can close
    if not current_user.is_superuser and till_shift.opened_by_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="Only the cashier who opened this till can close it"
        )
    
    # Update till shift
    till_shift.closing_time = datetime.now(timezone.utc)
    till_shift.closing_cash_float = closing_cash_float
    till_shift.closed_by_id = current_user.id
    till_shift.status = "closed"
    
    session.add(till_shift)
    session.commit()
    session.refresh(till_shift)
    
    # Load relationships
    session.refresh(till_shift.opened_by)
    session.refresh(till_shift.closed_by)
    
    result = TillShiftPublic(
        **till_shift.model_dump(),
        opened_by_name=till_shift.opened_by.full_name or till_shift.opened_by.email,
        closed_by_name=till_shift.closed_by.full_name or till_shift.closed_by.email if till_shift.closed_by else None
    )
    
    return result


@router.get("/system-counts", response_model=dict)
def get_system_counts(
    *,
    session: SessionDep,
    current_user: CurrentUser
) -> Any:
    """
    Get system counts (auto-calculated) for the current open shift.
    Returns amounts by payment method based on recorded sales.
    """
    till_shift = get_current_open_shift(session)
    if not till_shift:
        raise HTTPException(status_code=404, detail="No till is currently open")
    
    system_counts = calculate_system_counts(session, till_shift)
    
    return {
        "till_shift_id": str(till_shift.id),
        "opening_time": till_shift.opening_time.isoformat(),
        "closing_time": till_shift.closing_time.isoformat() if till_shift.closing_time else None,
        "payment_methods": list(system_counts.values())
    }


@router.post("/reconcile", response_model=dict)
def reconcile_shift(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    physical_counts: dict,  # {payment_method_id: amount}
    notes: Optional[str] = None
) -> Any:
    """
    Reconcile a closed shift.
    - Creates shift reconciliation record
    - Records payment method reconciliations
    - Calculates variances
    - Creates cashier variance record if any variance exists
    """
    # Get the most recently closed shift
    till_shift = get_last_closed_shift(session)
    if not till_shift or till_shift.status == "reconciled":
        raise HTTPException(
            status_code=400,
            detail="No closed shift available for reconciliation or shift already reconciled"
        )
    
    # Check authorization
    if not current_user.is_superuser and till_shift.opened_by_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="Only the cashier who opened this shift can reconcile it"
        )
    
    # Calculate system counts
    system_counts = calculate_system_counts(session, till_shift)
    
    # Create shift reconciliation
    reconciliation = ShiftReconciliation(
        shift_date=till_shift.opening_time,
        opening_cash_float=till_shift.opening_cash_float,
        closing_cash_float=till_shift.closing_cash_float or Decimal(0),
        created_by_id=current_user.id,
        till_shift_id=till_shift.id,
        status="completed",
        notes=notes
    )
    session.add(reconciliation)
    session.flush()
    session.refresh(reconciliation)
    
    # Process payment method reconciliations
    total_variance = Decimal(0)
    payment_reconciliations = []
    
    for pm_id_str, physical_amount in physical_counts.items():
        try:
            pm_id = uuid.UUID(pm_id_str)
        except ValueError:
            continue
        
        system_data = system_counts.get(pm_id_str, {})
        system_amount = system_data.get("system_count", Decimal(0))
        physical_decimal = Decimal(str(physical_amount))
        variance = physical_decimal - system_amount
        total_variance += variance
        
        pm_reconciliation = PaymentMethodReconciliation(
            shift_reconciliation_id=reconciliation.id,
            payment_method_id=pm_id,
            system_count=system_amount,
            physical_count=physical_decimal,
            variance=variance
        )
        session.add(pm_reconciliation)
        payment_reconciliations.append(pm_reconciliation)
    
    # Create cashier variance record if there's any variance
    if total_variance != 0:
        variance_type = "shortage" if total_variance < 0 else "overage"
        cashier_variance = CashierVariance(
            till_shift_id=till_shift.id,
            cashier_id=till_shift.opened_by_id,
            total_variance=abs(total_variance),
            variance_type=variance_type,
            notes=notes
        )
        session.add(cashier_variance)
    else:
        # Record zero variance
        cashier_variance = CashierVariance(
            till_shift_id=till_shift.id,
            cashier_id=till_shift.opened_by_id,
            total_variance=Decimal(0),
            variance_type="none",
            notes=notes
        )
        session.add(cashier_variance)
    
    # Mark shift as reconciled
    till_shift.status = "reconciled"
    session.add(till_shift)
    
    session.commit()
    
    return {
        "message": "Shift reconciled successfully",
        "reconciliation_id": str(reconciliation.id),
        "total_variance": float(total_variance),
        "variance_type": "shortage" if total_variance < 0 else "overage" if total_variance > 0 else "none"
    }


@router.get("/variances", response_model=CashierVariancesPublic)
def get_cashier_variances(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, le=1000),
    cashier_id: Optional[uuid.UUID] = Query(None, description="Filter by cashier ID"),
    start_date: Optional[date] = Query(None, description="Filter from this date"),
    end_date: Optional[date] = Query(None, description="Filter until this date")
) -> Any:
    """
    Get cashier variance report.
    Shows all variances (shortages and overages) by cashier.
    """
    # Only admins can see all variances
    if not current_user.is_superuser:
        # Cashiers see only their own
        cashier_id = current_user.id
    
    count_statement = select(func.count()).select_from(CashierVariance)
    statement = (
        select(CashierVariance)
        .options(
            selectinload(CashierVariance.cashier),
            selectinload(CashierVariance.till_shift)
        )
        .offset(skip)
        .limit(limit)
        .order_by(CashierVariance.created_at.desc())
    )
    
    conditions: list[ColumnElement[bool]] = []
    
    if cashier_id:
        conditions.append(CashierVariance.cashier_id == cashier_id)
        count_statement = count_statement.where(CashierVariance.cashier_id == cashier_id)
    
    if start_date:
        conditions.append(cast(CashierVariance.created_at, Date) >= start_date)
    
    if end_date:
        conditions.append(cast(CashierVariance.created_at, Date) <= end_date)
    
    if conditions:
        statement = statement.where(and_(*conditions))
        count_statement = count_statement.where(and_(*conditions))
    
    count = session.exec(count_statement).one()
    variances = session.exec(statement).all()
    
    # Calculate totals
    shortage_statement = (
        select(func.sum(CashierVariance.total_variance))
        .where(CashierVariance.variance_type == "shortage")
    )
    if conditions:
        shortage_statement = shortage_statement.where(and_(*conditions))
    
    overage_statement = (
        select(func.sum(CashierVariance.total_variance))
        .where(CashierVariance.variance_type == "overage")
    )
    if conditions:
        overage_statement = overage_statement.where(and_(*conditions))
    
    total_shortage = session.exec(shortage_statement).first() or Decimal(0)
    total_overage = session.exec(overage_statement).first() or Decimal(0)
    
    variance_publics = []
    for v in variances:
        session.refresh(v.cashier)
        session.refresh(v.till_shift)
        variance_publics.append(CashierVariancePublic(
            **v.model_dump(),
            cashier_name=v.cashier.full_name or v.cashier.email,
            shift_type=v.till_shift.shift_type if v.till_shift else None
        ))
    
    return CashierVariancesPublic(
        data=variance_publics,
        count=count,
        total_shortage=total_shortage,
        total_overage=total_overage
    )


@router.get("", response_model=TillShiftsPublic)
def get_till_shifts(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, le=1000),
    status: Optional[str] = Query(None, description="Filter by status: open, closed, reconciled")
) -> Any:
    """Get list of till shifts"""
    count_statement = select(func.count()).select_from(TillShift)
    statement = (
        select(TillShift)
        .options(
            selectinload(TillShift.opened_by),
            selectinload(TillShift.closed_by)
        )
        .offset(skip)
        .limit(limit)
        .order_by(TillShift.opening_time.desc())
    )
    
    conditions: list[ColumnElement[bool]] = []
    
    # Cashiers see only their own shifts
    if not current_user.is_superuser:
        conditions.append(TillShift.opened_by_id == current_user.id)  # type: ignore[arg-type]
        count_statement = count_statement.where(TillShift.opened_by_id == current_user.id)
    
    if status:
        conditions.append(TillShift.status == status)  # type: ignore[arg-type]
        count_statement = count_statement.where(TillShift.status == status)
    
    if conditions:
        statement = statement.where(and_(*conditions))
        count_statement = count_statement.where(and_(*conditions))
    
    count = session.exec(count_statement).one()
    shifts = session.exec(statement).all()
    
    shift_publics = []
    for shift in shifts:
        session.refresh(shift.opened_by)
        if shift.closed_by_id:
            session.refresh(shift.closed_by)
        shift_publics.append(TillShiftPublic(
            **shift.model_dump(),
            opened_by_name=shift.opened_by.full_name or shift.opened_by.email,
            closed_by_name=shift.closed_by.full_name or shift.closed_by.email if shift.closed_by else None
        ))
    
    return TillShiftsPublic(data=shift_publics, count=count)

