"""
Supplier Debt Management API Routes

Handles supplier payables tracking, payment recording, installment management,
and aging reports for goods purchased on credit.
"""
import uuid
from datetime import datetime, timezone
from decimal import Decimal
from typing import Any

from fastapi import APIRouter, HTTPException, Query
from sqlmodel import Session, func, select

from app import crud
from app.api.deps import CurrentUser, SessionDep
from app.models import (
    Message,
    Notification,
    NotificationCreate,
    Supplier,
    SupplierDebt,
    SupplierDebtCreate,
    SupplierDebtInstallment,
    SupplierDebtInstallmentCreate,
    SupplierDebtInstallmentsPublic,
    SupplierDebtPayment,
    SupplierDebtPaymentCreate,
    SupplierDebtPaymentPublic,
    SupplierDebtPaymentsPublic,
    SupplierDebtPublic,
    SupplierDebtPublicWithDetails,
    SupplierDebtsPublic,
    SupplierDebtUpdate,
    User,
)

router = APIRouter()


@router.get("/", response_model=SupplierDebtsPublic)
def list_supplier_debts(
    session: SessionDep,
    current_user: CurrentUser,
    skip: int = 0,
    limit: int = 100,
    supplier_id: uuid.UUID | None = None,
    status: str | None = None,
    is_overdue: bool | None = None,
    start_date: datetime | None = None,
    end_date: datetime | None = None,
) -> Any:
    """
    List supplier debts with filtering.
    
    **Access**: Admin, Auditor (read-only)
    """
    # Check authorization
    if not current_user.is_superuser and current_user.role not in ["admin", "auditor"]:
        raise HTTPException(
            status_code=403,
            detail="Only admin and auditor users can view supplier debts",
        )
    
    # Build query
    statement = select(SupplierDebt)
    
    # Apply filters
    if supplier_id:
        statement = statement.where(SupplierDebt.supplier_id == supplier_id)
    if status:
        statement = statement.where(SupplierDebt.status == status)
    if is_overdue is not None:
        statement = statement.where(SupplierDebt.is_overdue == is_overdue)
    if start_date:
        statement = statement.where(SupplierDebt.due_date >= start_date)
    if end_date:
        statement = statement.where(SupplierDebt.due_date <= end_date)
    
    # Order by due date (overdue first)
    statement = statement.order_by(SupplierDebt.due_date.asc())
    
    # Get total count
    count_statement = select(func.count()).select_from(statement.subquery())
    total_count = session.exec(count_statement).one()
    
    # Apply pagination
    statement = statement.offset(skip).limit(limit)
    debts = session.exec(statement).all()
    
    return SupplierDebtsPublic(data=debts, count=total_count)


@router.post("/", response_model=SupplierDebtPublic)
def create_supplier_debt(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    debt_in: SupplierDebtCreate,
) -> Any:
    """
    Manually create supplier debt (rare use case - usually auto-created from GRN).
    
    **Access**: Admin only
    """
    if not current_user.is_superuser and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admin can create debts")
    
    # Validate supplier exists
    supplier = session.get(Supplier, debt_in.supplier_id)
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")
    
    # Check credit limit
    new_credit_used = supplier.current_credit_used + debt_in.total_amount
    if new_credit_used > supplier.credit_limit:
        raise HTTPException(
            status_code=400,
            detail=f"Credit limit exceeded. Limit: {supplier.credit_limit}, "
            f"Current: {supplier.current_credit_used}, "
            f"New debt: {debt_in.total_amount}",
        )
    
    # Create debt
    debt = SupplierDebt.model_validate(
        debt_in,
        update={"created_by_id": current_user.id},
    )
    session.add(debt)
    
    # Update supplier credit used
    supplier.current_credit_used = new_credit_used
    session.add(supplier)
    
    session.commit()
    session.refresh(debt)
    
    # Create notification for admin users
    crud.create_notification_for_admins(
        session=session,
        notification_type="supplier_debt_created",
        title=f"New Supplier Debt Created",
        message=f"Debt of {debt.currency} {debt.total_amount} created for supplier {supplier.name}",
        priority="info",
        link_url=f"/supplier-debts/{debt.id}",
    )
    
    return debt


@router.get("/summary", response_model=dict[str, Any])
def get_summary(
    *,
    session: SessionDep,
    current_user: CurrentUser,
) -> Any:
    """
    Dashboard summary (total outstanding, overdue count, etc.).
    
    **Access**: Admin only
    """
    if not current_user.is_superuser and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admin can view summary")
    
    # Total debts, amount, balance
    total_statement = select(
        func.count(SupplierDebt.id),
        func.sum(SupplierDebt.total_amount),
        func.sum(SupplierDebt.balance)
    ).where(SupplierDebt.status != "paid")
    total_result = session.exec(total_statement).one()
    total_debts = total_result[0] or 0
    total_amount = total_result[1] or Decimal(0)
    total_balance = total_result[2] or Decimal(0)
    
    # Overdue count and amount
    overdue_statement = (
        select(func.count(SupplierDebt.id), func.sum(SupplierDebt.balance))
        .where(SupplierDebt.is_overdue == True)
        .where(SupplierDebt.status != "paid")
    )
    overdue_result = session.exec(overdue_statement).one()
    overdue_debts = overdue_result[0] or 0
    overdue_amount = overdue_result[1] or Decimal(0)
    
    return {
        "total_debts": total_debts,
        "total_amount": float(total_amount),
        "total_balance": float(total_balance),
        "overdue_debts": overdue_debts,
        "overdue_amount": float(overdue_amount),
        "generated_at": datetime.now(timezone.utc),
    }


@router.get("/aging-report", response_model=list[dict[str, Any]])
def get_aging_report(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    supplier_id: uuid.UUID | None = None,
) -> Any:
    """
    Generate aging report (30/60/90 days buckets).
    
    **Access**: Admin only
    """
    if not current_user.is_superuser and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admin can view aging reports")
    
    now = datetime.now(timezone.utc)
    
    # Build query
    statement = select(SupplierDebt).where(SupplierDebt.status != "paid")
    if supplier_id:
        statement = statement.where(SupplierDebt.supplier_id == supplier_id)
    
    debts = session.exec(statement).all()
    
    # Calculate aging buckets
    buckets = [
        {"age_bucket": "Current (Not Due)", "min_days": None, "max_days": 0, "total_balance": Decimal(0), "debt_count": 0},
        {"age_bucket": "1-30 Days Overdue", "min_days": 1, "max_days": 30, "total_balance": Decimal(0), "debt_count": 0},
        {"age_bucket": "31-60 Days Overdue", "min_days": 31, "max_days": 60, "total_balance": Decimal(0), "debt_count": 0},
        {"age_bucket": "61-90 Days Overdue", "min_days": 61, "max_days": 90, "total_balance": Decimal(0), "debt_count": 0},
        {"age_bucket": "Over 90 Days", "min_days": 91, "max_days": None, "total_balance": Decimal(0), "debt_count": 0},
    ]
    
    for debt in debts:
        days_overdue = (now - debt.due_date).days if debt.due_date < now else -1
        
        if days_overdue < 0:
            bucket_idx = 0  # Current
        elif days_overdue <= 30:
            bucket_idx = 1
        elif days_overdue <= 60:
            bucket_idx = 2
        elif days_overdue <= 90:
            bucket_idx = 3
        else:
            bucket_idx = 4
        
        buckets[bucket_idx]["total_balance"] += debt.balance
        buckets[bucket_idx]["debt_count"] += 1
    
    # Convert Decimal to float
    for bucket in buckets:
        bucket["total_balance"] = float(bucket["total_balance"])
    
    return buckets


@router.get("/{debt_id}", response_model=SupplierDebtPublicWithDetails)
def get_supplier_debt(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    debt_id: uuid.UUID,
) -> Any:
    """
    Get single supplier debt with full details (installments, payments).
    
    **Access**: Admin only (auditor can also view)
    """
    if not current_user.is_superuser and current_user.role not in ["admin", "auditor"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    debt = session.get(SupplierDebt, debt_id)
    if not debt:
        raise HTTPException(status_code=404, detail="Supplier debt not found")
    
    return debt


@router.patch("/{debt_id}", response_model=SupplierDebtPublic)
def update_supplier_debt(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    debt_id: uuid.UUID,
    debt_in: SupplierDebtUpdate,
) -> Any:
    """
    Update supplier debt (notes, status override).
    
    **Access**: Admin only
    """
    if not current_user.is_superuser and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admin can update debts")
    
    debt = session.get(SupplierDebt, debt_id)
    if not debt:
        raise HTTPException(status_code=404, detail="Supplier debt not found")
    
    update_data = debt_in.model_dump(exclude_unset=True)
    debt.sqlmodel_update(update_data)
    debt.updated_at = datetime.now(timezone.utc)
    
    session.add(debt)
    session.commit()
    session.refresh(debt)
    
    return debt


@router.post("/{debt_id}/payments", response_model=SupplierDebtPaymentPublic)
def record_payment(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    debt_id: uuid.UUID,
    payment_in: SupplierDebtPaymentCreate,
) -> Any:
    """
    Record payment to supplier.
    
    Applies payment to specified installment or oldest unpaid installment.
    Updates debt balance, status, and supplier credit_used.
    
    **Access**: Admin only
    """
    if not current_user.is_superuser and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admin can record payments")
    
    debt = session.get(SupplierDebt, debt_id)
    if not debt:
        raise HTTPException(status_code=404, detail="Supplier debt not found")
    
    if debt.status == "paid":
        raise HTTPException(status_code=400, detail="Debt is already fully paid")
    
    if payment_in.payment_amount <= 0:
        raise HTTPException(status_code=400, detail="Payment amount must be positive")
    
    if payment_in.payment_amount > debt.balance:
        raise HTTPException(
            status_code=400,
            detail=f"Payment amount ({payment_in.payment_amount}) "
            f"exceeds debt balance ({debt.balance})",
        )
    
    # Determine target installment
    target_installment = None
    if payment_in.installment_id:
        target_installment = session.get(
            SupplierDebtInstallment, payment_in.installment_id
        )
        if not target_installment or target_installment.supplier_debt_id != debt_id:
            raise HTTPException(status_code=404, detail="Installment not found")
    else:
        # Find oldest unpaid installment
        statement = (
            select(SupplierDebtInstallment)
            .where(SupplierDebtInstallment.supplier_debt_id == debt_id)
            .where(SupplierDebtInstallment.status != "paid")
            .order_by(SupplierDebtInstallment.due_date.asc())
        )
        target_installment = session.exec(statement).first()
    
    # Create payment record
    payment = SupplierDebtPayment.model_validate(
        payment_in,
        update={
            "created_by_id": current_user.id,
            "supplier_debt_id": debt_id,
            "installment_id": target_installment.id if target_installment else None,
        },
    )
    session.add(payment)
    
    # Update debt
    debt.amount_paid += payment_in.payment_amount
    debt.balance = debt.total_amount - debt.amount_paid
    
    if debt.balance == 0:
        debt.status = "paid"
    elif debt.amount_paid > 0:
        debt.status = "partial"
    
    debt.updated_at = datetime.now(timezone.utc)
    session.add(debt)
    
    # Update installment if specified
    if target_installment:
        target_installment.amount_paid += payment_in.payment_amount
        target_installment.balance = (
            target_installment.installment_amount - target_installment.amount_paid
        )
        
        if target_installment.balance == 0:
            target_installment.status = "paid"
        elif target_installment.amount_paid > 0:
            target_installment.status = "partial"
        
        target_installment.updated_at = datetime.now(timezone.utc)
        session.add(target_installment)
    
    # Update supplier credit used
    supplier = session.get(Supplier, debt.supplier_id)
    if supplier:
        supplier.current_credit_used -= payment_in.payment_amount
        supplier.current_credit_used = max(Decimal(0), supplier.current_credit_used)
        session.add(supplier)
    
    session.commit()
    session.refresh(payment)
    
    # Create notification
    crud.create_notification_for_admins(
        session=session,
        notification_type="supplier_debt_payment",
        title=f"Payment Recorded",
        message=f"Payment of {debt.currency} {payment_in.payment_amount} recorded for {supplier.name if supplier else 'supplier'}",
        priority="info",
        link_url=f"/supplier-debts/{debt.id}",
    )
    
    return payment


@router.get("/{debt_id}/installments", response_model=SupplierDebtInstallmentsPublic)
def list_installments(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    debt_id: uuid.UUID,
) -> Any:
    """
    List installments for a debt.
    
    **Access**: Admin, Auditor
    """
    if not current_user.is_superuser and current_user.role not in ["admin", "auditor"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    debt = session.get(SupplierDebt, debt_id)
    if not debt:
        raise HTTPException(status_code=404, detail="Supplier debt not found")
    
    statement = (
        select(SupplierDebtInstallment)
        .where(SupplierDebtInstallment.supplier_debt_id == debt_id)
        .order_by(SupplierDebtInstallment.due_date.asc())
    )
    installments = session.exec(statement).all()
    
    return SupplierDebtInstallmentsPublic(
        data=installments, count=len(installments)
    )


@router.post("/{debt_id}/installments", response_model=SupplierDebtInstallmentsPublic)
def create_installments(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    debt_id: uuid.UUID,
    installments_in: list[SupplierDebtInstallmentCreate],
) -> Any:
    """
    Add installment schedule to debt.
    
    **Access**: Admin only
    """
    if not current_user.is_superuser and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admin can create installments")
    
    debt = session.get(SupplierDebt, debt_id)
    if not debt:
        raise HTTPException(status_code=404, detail="Supplier debt not found")
    
    # Validate total installment amount matches debt total
    total_installment_amount = sum(i.installment_amount for i in installments_in)
    if total_installment_amount != debt.total_amount:
        raise HTTPException(
            status_code=400,
            detail=f"Total installment amount ({total_installment_amount}) "
            f"must equal debt total ({debt.total_amount})",
        )
    
    # Create installments
    created_installments = []
    for idx, installment_in in enumerate(installments_in, start=1):
        installment = SupplierDebtInstallment.model_validate(
            installment_in,
            update={
                "supplier_debt_id": debt_id,
                "installment_number": idx,
            },
        )
        session.add(installment)
        created_installments.append(installment)
    
    session.commit()
    for installment in created_installments:
        session.refresh(installment)
    
    return SupplierDebtInstallmentsPublic(
        data=created_installments, count=len(created_installments)
    )
