import uuid
from datetime import date, datetime, timezone
from decimal import Decimal
from typing import Any

from fastapi import APIRouter, HTTPException, Query
from sqlalchemy import Date, cast, desc
from sqlalchemy.orm import selectinload
from sqlalchemy.sql import ColumnElement
from sqlmodel import and_, col, func, select

from app.api.deps import CurrentUser, SessionDep
from app.api.utils.till_utils import get_current_open_shift
from app.models import (
    CashierVariance,
    CashierVariancePublic,
    CashierVariancesPublic,
    PaymentMethod,
    PaymentMethodReconciliation,
    Sale,
    SalePayment,
    ShiftReconciliation,
    TillShift,
    TillShiftCreate,
    TillShiftPublic,
    TillShiftsPublic,
)

router = APIRouter(prefix="/till", tags=["till"])


def get_last_closed_shift(session: SessionDep) -> TillShift | None:
    """Get the last closed shift to determine next shift type"""
    statement = (
        select(TillShift)
        .where(col(TillShift.status).in_(["closed", "reconciled"]))
        .order_by(desc(col(TillShift.closing_time)))
    )
    return session.exec(statement).first()


def calculate_system_counts(
    session: SessionDep, till_shift: TillShift
) -> dict[str, Any]:
    """Calculate system counts for all payment methods from sales during the shift"""
    # Get all sales during this shift
    conditions: list[ColumnElement[bool]] = [
        col(Sale.sale_date) >= till_shift.opening_time,
        col(Sale.created_by_id) == till_shift.opened_by_id,
    ]

    if till_shift.closing_time:
        conditions.append(col(Sale.sale_date) <= till_shift.closing_time)

    # Get all payment methods
    payment_methods = session.exec(
        select(PaymentMethod).where(PaymentMethod.is_active.is_(True))
    ).all()

    system_counts: dict[str, dict[str, Any]] = {}
    for pm in payment_methods:
        # Get sales with this payment method (including multi-payment)
        pm_conditions = conditions.copy()

        # Check both primary payment method and SalePayment records
        primary_total = session.exec(
            select(func.sum(Sale.total_amount)).where(
                and_(*pm_conditions, col(Sale.payment_method_id) == pm.id)
            )
        ).first() or Decimal(0)

        # Get multi-payment amounts
        multi_total = session.exec(
            select(func.sum(SalePayment.amount))
            .join(Sale, col(SalePayment.sale_id) == col(Sale.id))
            .where(and_(*pm_conditions, col(SalePayment.payment_method_id) == pm.id))
        ).first() or Decimal(0)

        system_counts[str(pm.id)] = {
            "payment_method_id": pm.id,
            "payment_method_name": pm.name,
            "system_count": primary_total + multi_total,
        }

    return system_counts


@router.post("/open", response_model=TillShiftPublic)
def open_till(
    *, session: SessionDep, current_user: CurrentUser, till_in: TillShiftCreate
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
            detail=f"A till is already open. Shift ID: {open_shift.id}, Opened by: {open_shift.opened_by.email if open_shift.opened_by else 'Unknown'}",
        )

    # Validate shift type
    shift_type = till_in.shift_type.lower()
    if shift_type not in ["day", "night"]:
        raise HTTPException(
            status_code=400, detail="Shift type must be 'day' or 'night'"
        )

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
                detail=f"Expected shift type '{expected_shift}' (alternating from last shift). Last shift was '{last_shift.shift_type}'",
            )

        # Validate opening balance if previous shift not reconciled
        if last_shift.status != "reconciled":
            if not till_in.opening_balance or till_in.opening_balance <= 0:
                raise HTTPException(
                    status_code=400,
                    detail=f"Opening balance is required because the previous shift (ID: {last_shift.id}) has not been reconciled yet. Previous cashier left {last_shift.closing_cash_float or 0}.",
                )
            # Warn if opening balance doesn't match closing balance
            if last_shift.closing_cash_float:
                expected_balance = last_shift.closing_cash_float
                if abs(float(till_in.opening_balance) - float(expected_balance)) > 0.01:
                    # Allow but could log warning - amounts might differ due to rounding
                    pass

    # Create new till shift
    till_shift = TillShift(
        shift_type=shift_type,
        opening_cash_float=till_in.opening_cash_float,
        opening_balance=till_in.opening_balance,  # Balance left by previous cashier (optional)
        opened_by_id=current_user.id,
        status="open",
        notes=till_in.notes,
    )

    session.add(till_shift)
    session.commit()
    session.refresh(till_shift)

    # Load relationships
    session.refresh(till_shift.opened_by)

    result = TillShiftPublic(
        **till_shift.model_dump(),
        opened_by_name=till_shift.opened_by.full_name or till_shift.opened_by.email,
    )

    return result


@router.get("/current", response_model=TillShiftPublic)
def get_current_till(*, session: SessionDep, current_user: CurrentUser) -> Any:
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
        closed_by_name=till_shift.closed_by.full_name or till_shift.closed_by.email
        if till_shift.closed_by
        else None,
    )

    return result


@router.get("/status", response_model=dict)
def get_till_status(*, session: SessionDep, current_user: CurrentUser) -> Any:
    """Check if till is open (for POS lock)"""
    till_shift = get_current_open_shift(session)

    return {
        "is_open": till_shift is not None,
        "till_id": str(till_shift.id) if till_shift else None,
        "opened_by": till_shift.opened_by.email
        if till_shift and till_shift.opened_by
        else None,
        "opening_time": till_shift.opening_time.isoformat() if till_shift else None,
    }


@router.post("/close", response_model=TillShiftPublic)
def close_till(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    closing_cash_float: Decimal = Query(..., description="Closing cash float amount"),
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
            status_code=403, detail="Only the cashier who opened this till can close it"
        )

    # Validate closing cash float
    if closing_cash_float < 0:
        raise HTTPException(
            status_code=400, detail="Closing cash float cannot be negative"
        )

    # Calculate shift duration
    shift_duration = datetime.now(timezone.utc) - till_shift.opening_time
    duration_hours = shift_duration.total_seconds() / 3600

    # Warn if shift is very short or very long (optional validation)
    if duration_hours < 0.5:  # Less than 30 minutes
        # Allow but could log warning
        pass
    elif duration_hours > 24:  # More than 24 hours
        raise HTTPException(
            status_code=400,
            detail=f"Shift duration exceeds 24 hours ({duration_hours:.1f} hours). Please verify before closing.",
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
        closed_by_name=till_shift.closed_by.full_name or till_shift.closed_by.email
        if till_shift.closed_by
        else None,
    )

    return result


@router.get("/system-counts", response_model=dict)
def get_system_counts(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    shift_id: uuid.UUID | None = Query(None, description="Specific shift ID (for closed shifts)"),
) -> Any:
    """
    Get system counts (auto-calculated) for a shift.
    - If shift_id is provided, returns counts for that closed shift (for reconciliation)
    - Otherwise, returns counts for the currently open shift
    Returns amounts by payment method based on recorded sales.
    """
    if shift_id:
        # Get specific closed shift for reconciliation
        till_shift = session.get(TillShift, shift_id)
        if not till_shift:
            raise HTTPException(status_code=404, detail="Shift not found")
        if till_shift.status == "open":
            raise HTTPException(
                status_code=400,
                detail="Cannot get system counts for open shift. Use current shift endpoint instead.",
            )
        # Check authorization
        if not current_user.is_superuser and till_shift.opened_by_id != current_user.id:
            raise HTTPException(
                status_code=403,
                detail="You can only view system counts for your own shifts",
            )
    else:
        # Get current open shift
        till_shift = get_current_open_shift(session)
        if not till_shift:
            raise HTTPException(status_code=404, detail="No till is currently open")

    system_counts = calculate_system_counts(session, till_shift)

    return {
        "till_shift_id": str(till_shift.id),
        "opening_time": till_shift.opening_time.isoformat(),
        "closing_time": till_shift.closing_time.isoformat()
        if till_shift.closing_time
        else None,
        "payment_methods": list(system_counts.values()),
    }


@router.post("/reconcile", response_model=dict)
def reconcile_shift(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    physical_counts: dict[str, Any],  # {payment_method_id: amount}
    notes: str | None = None,
    shift_id: uuid.UUID | None = Query(None, description="Specific shift ID to reconcile"),
) -> Any:
    """
    Reconcile a closed shift.
    - Creates shift reconciliation record
    - Records payment method reconciliations
    - Calculates variances
    - Creates cashier variance record if any variance exists
    - Validates variance thresholds and creates alerts if needed
    """
    # Get the shift to reconcile
    if shift_id:
        till_shift = session.get(TillShift, shift_id)
        if not till_shift:
            raise HTTPException(status_code=404, detail="Shift not found")
        if till_shift.status == "open":
            raise HTTPException(
                status_code=400, detail="Cannot reconcile an open shift. Close it first."
            )
        if till_shift.status == "reconciled":
            raise HTTPException(
                status_code=400, detail="This shift has already been reconciled"
            )
    else:
        # Get the most recently closed shift
        till_shift = get_last_closed_shift(session)
        if not till_shift:
            raise HTTPException(
                status_code=400, detail="No closed shift available for reconciliation"
            )
        if till_shift.status == "reconciled":
            raise HTTPException(
                status_code=400, detail="The last closed shift has already been reconciled"
            )

    # Check authorization
    if not current_user.is_superuser and till_shift.opened_by_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="Only the cashier who opened this shift can reconcile it",
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
        notes=notes,
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
            variance=variance,
        )
        session.add(pm_reconciliation)
        payment_reconciliations.append(pm_reconciliation)

    # Determine variance type and create cashier variance record
    if total_variance == 0:
        variance_type = "none"
    else:
        variance_type = "shortage" if total_variance < 0 else "overage"
    
    # Variance threshold check (configurable - default 100)
    VARIANCE_THRESHOLD = Decimal("100.00")  # Could be moved to settings
    variance_amount = abs(total_variance)
    is_significant_variance = variance_amount >= VARIANCE_THRESHOLD
    
    # Add threshold info to notes if significant
    final_notes = notes or ""
    if is_significant_variance:
        threshold_note = f"\n[ALERT: Variance exceeds threshold of {VARIANCE_THRESHOLD}]"
        final_notes = final_notes + threshold_note if final_notes else threshold_note
    
    cashier_variance = CashierVariance(
        till_shift_id=till_shift.id,
        cashier_id=till_shift.opened_by_id,
        total_variance=variance_amount,
        variance_type=variance_type,
        notes=final_notes,
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
        "variance_type": "shortage"
        if total_variance < 0
        else "overage"
        if total_variance > 0
        else "none",
    }


@router.get("/variances", response_model=CashierVariancesPublic)
def get_cashier_variances(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, le=1000),
    cashier_id: uuid.UUID | None = Query(None, description="Filter by cashier ID"),
    start_date: date | None = Query(None, description="Filter from this date"),
    end_date: date | None = Query(None, description="Filter until this date"),
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
            selectinload(CashierVariance.cashier),  # type: ignore[arg-type]
            selectinload(CashierVariance.till_shift),  # type: ignore[arg-type]
        )
        .offset(skip)
        .limit(limit)
        .order_by(desc(col(CashierVariance.created_at)))
    )

    conditions: list[ColumnElement[bool]] = []

    if cashier_id:
        conditions.append(col(CashierVariance.cashier_id) == cashier_id)

    if start_date:
        conditions.append(cast(col(CashierVariance.created_at), Date) >= start_date)

    if end_date:
        conditions.append(cast(col(CashierVariance.created_at), Date) <= end_date)

    if conditions:
        statement = statement.where(and_(*conditions))
        count_statement = count_statement.where(and_(*conditions))

    count = session.exec(count_statement).one()
    variances = session.exec(statement).all()

    # Calculate totals
    shortage_statement: Any = select(func.sum(CashierVariance.total_variance)).where(
        CashierVariance.variance_type == "shortage"
    )
    if conditions:
        shortage_statement = shortage_statement.where(and_(*conditions))

    overage_statement: Any = select(func.sum(CashierVariance.total_variance)).where(
        CashierVariance.variance_type == "overage"
    )
    if conditions:
        overage_statement = overage_statement.where(and_(*conditions))

    total_shortage = session.exec(shortage_statement).first() or Decimal(0)
    total_overage = session.exec(overage_statement).first() or Decimal(0)

    variance_publics = []
    for v in variances:
        session.refresh(v.cashier)
        session.refresh(v.till_shift)
        variance_publics.append(
            CashierVariancePublic(
                **v.model_dump(),
                cashier_name=v.cashier.full_name or v.cashier.email,
                shift_type=v.till_shift.shift_type if v.till_shift else None,
            )
        )

    return CashierVariancesPublic(
        data=variance_publics,
        count=count,
        total_shortage=total_shortage,
        total_overage=total_overage,
    )


@router.get("/summary/{shift_id}", response_model=dict)
def get_shift_summary(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    shift_id: uuid.UUID,
) -> Any:
    """
    Get comprehensive summary for a specific shift.
    Includes sales totals, payment method breakdown, duration, and variance info.
    """
    till_shift = session.get(TillShift, shift_id)
    if not till_shift:
        raise HTTPException(status_code=404, detail="Shift not found")

    # Check authorization
    if not current_user.is_superuser and till_shift.opened_by_id != current_user.id:
        raise HTTPException(
            status_code=403, detail="You can only view summaries for your own shifts"
        )

    # Calculate system counts
    system_counts = calculate_system_counts(session, till_shift)

    # Get sales during shift
    conditions: list[ColumnElement[bool]] = [
        col(Sale.sale_date) >= till_shift.opening_time,
        col(Sale.created_by_id) == till_shift.opened_by_id,
    ]
    if till_shift.closing_time:
        conditions.append(col(Sale.sale_date) <= till_shift.closing_time)

    sales = session.exec(select(Sale).where(and_(*conditions))).all()

    # Calculate totals
    total_sales = sum(Decimal(str(sale.total_amount or 0)) for sale in sales)
    total_items = sum(sale.quantity or 0 for sale in sales)

    # Calculate duration
    if till_shift.closing_time:
        duration_seconds = (till_shift.closing_time - till_shift.opening_time).total_seconds()
        duration_hours = duration_seconds / 3600
    else:
        duration_seconds = (datetime.now(timezone.utc) - till_shift.opening_time).total_seconds()
        duration_hours = duration_seconds / 3600

    # Get variance if reconciled
    variance_info = None
    if till_shift.status == "reconciled":
        variance = session.exec(
            select(CashierVariance).where(CashierVariance.till_shift_id == till_shift.id)
        ).first()
        if variance:
            variance_info = {
                "total_variance": float(variance.total_variance),
                "variance_type": variance.variance_type,
            }

    return {
        "shift_id": str(till_shift.id),
        "shift_type": till_shift.shift_type,
        "status": till_shift.status,
        "opened_by": till_shift.opened_by.full_name or till_shift.opened_by.email if till_shift.opened_by else None,
        "opening_time": till_shift.opening_time.isoformat(),
        "closing_time": till_shift.closing_time.isoformat() if till_shift.closing_time else None,
        "duration_hours": round(duration_hours, 2),
        "opening_cash_float": float(till_shift.opening_cash_float),
        "opening_balance": float(till_shift.opening_balance) if till_shift.opening_balance else 0,
        "closing_cash_float": float(till_shift.closing_cash_float) if till_shift.closing_cash_float else None,
        "total_sales": float(total_sales),
        "total_transactions": len(sales),
        "total_items_sold": total_items,
        "payment_methods": list(system_counts.values()),
        "variance": variance_info,
    }


@router.get("", response_model=TillShiftsPublic)
def get_till_shifts(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, le=1000),
    status: str | None = Query(
        None, description="Filter by status: open, closed, reconciled"
    ),
) -> Any:
    """Get list of till shifts"""
    count_statement = select(func.count()).select_from(TillShift)
    statement = (
        select(TillShift)
        .options(
            selectinload(TillShift.opened_by),  # type: ignore[arg-type]
            selectinload(TillShift.closed_by),  # type: ignore[arg-type]
        )
        .offset(skip)
        .limit(limit)
        .order_by(desc(col(TillShift.opening_time)))
    )

    conditions: list[ColumnElement[bool]] = []

    # Cashiers see only their own shifts
    if not current_user.is_superuser:
        conditions.append(TillShift.opened_by_id == current_user.id)  # type: ignore[arg-type]
        count_statement = count_statement.where(
            TillShift.opened_by_id == current_user.id
        )

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
        shift_publics.append(
            TillShiftPublic(
                **shift.model_dump(),
                opened_by_name=shift.opened_by.full_name or shift.opened_by.email,
                closed_by_name=shift.closed_by.full_name or shift.closed_by.email
                if shift.closed_by
                else None,
            )
        )

    return TillShiftsPublic(data=shift_publics, count=count)
