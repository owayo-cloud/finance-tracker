import uuid
from datetime import datetime, timezone
from decimal import Decimal
from typing import Any

from fastapi import APIRouter, HTTPException
from sqlalchemy import and_, desc, func, or_
from sqlalchemy.sql import ColumnElement
from sqlmodel import select

from app.api.deps import AdminUser, CurrentUser, SessionDep
from app.crud import grn as grn_crud
from app.crud import supplier as supplier_crud
from app.crud import transporter as transporter_crud
from app.models import (
    GRN,
    GRNCreate,
    GRNItem,
    GRNPublic,
    GRNPublicWithItems,
    GRNsPublic,
    GRNUpdate,
    Supplier,
    SupplierCreate,
    SupplierDebt,
    SupplierPublic,
    SuppliersPublic,
    SupplierUpdate,
    Transporter,
    TransporterCreate,
    TransporterPublic,
    TransportersPublic,
    TransporterUpdate,
)
from app.utils.sqlalchemy_helpers import qload, qload_chain

router = APIRouter(prefix="/grn", tags=["grn"])


# ==================== SUPPLIER ROUTES ====================


@router.get("/suppliers", response_model=SuppliersPublic)
def read_suppliers(
    session: SessionDep,
    current_user: CurrentUser,
    skip: int = 0,
    limit: int = 100,
    search: str | None = None,
    is_active: bool | None = None,
) -> Any:
    """
    Retrieve suppliers with optional filtering.
    """
    # Build query
    statement = select(Supplier)

    # Apply filters
    filters: list[ColumnElement[bool]] = []
    if search:
        search_filter = or_(
            Supplier.name.ilike(f"%{search}%"),
            Supplier.contact_person.ilike(f"%{search}%"),
        )
        filters.append(search_filter)

    if is_active is not None:
        filters.append(Supplier.is_active == is_active)  # type: ignore[arg-type]

    if filters:
        statement = statement.where(and_(*filters))

    # Get count
    count_statement = select(func.count()).select_from(statement.subquery())
    count = session.exec(count_statement).one()

    # Apply pagination and ordering
    statement = statement.order_by(Supplier.name).offset(skip).limit(limit)
    suppliers = session.exec(statement).all()

    # Calculate outstanding debt for each supplier
    suppliers_with_debt = []
    for supplier in suppliers:
        # Calculate total outstanding debt (sum of balances where status != "paid")
        debt_statement = (
            select(func.sum(SupplierDebt.balance))
            .where(SupplierDebt.supplier_id == supplier.id)
            .where(SupplierDebt.status != "paid")
        )
        total_debt = session.exec(debt_statement).one()
        outstanding_debt = total_debt if total_debt is not None else Decimal("0")

        # Create SupplierPublic with outstanding_debt
        supplier_dict = supplier.model_dump()
        supplier_dict["outstanding_debt"] = outstanding_debt
        supplier_public = SupplierPublic(**supplier_dict)
        suppliers_with_debt.append(supplier_public)

    return SuppliersPublic(data=suppliers_with_debt, count=count)


@router.post("/suppliers", response_model=SupplierPublic)
def create_supplier(
    session: SessionDep,
    current_user: AdminUser,
    supplier_in: SupplierCreate,
) -> Any:
    """
    Create new supplier (Admin only).
    """
    # Check for duplicate name
    existing = supplier_crud.get_by_name(db=session, name=supplier_in.name)
    if existing:
        raise HTTPException(
            status_code=400,
            detail=f"Supplier with name '{supplier_in.name}' already exists.",
        )

    supplier = supplier_crud.create(db=session, obj_in=supplier_in)
    return supplier


@router.get("/suppliers/{supplier_id}", response_model=SupplierPublic)
def read_supplier(
    session: SessionDep,
    current_user: CurrentUser,
    supplier_id: uuid.UUID,
) -> Any:
    """
    Get supplier by ID.
    """
    supplier = session.get(Supplier, supplier_id)
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")
    return supplier


@router.put("/suppliers/{supplier_id}", response_model=SupplierPublic)
def update_supplier(
    session: SessionDep,
    current_user: AdminUser,
    supplier_id: uuid.UUID,
    supplier_in: SupplierUpdate,
) -> Any:
    """
    Update supplier (Admin only).
    """
    supplier = session.get(Supplier, supplier_id)
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")

    # Check for duplicate name if changing name
    if supplier_in.name and supplier_in.name != supplier.name:
        existing = supplier_crud.get_by_name(db=session, name=supplier_in.name)
        if existing:
            raise HTTPException(
                status_code=400,
                detail=f"Supplier with name '{supplier_in.name}' already exists.",
            )

    supplier = supplier_crud.update(db=session, db_obj=supplier, obj_in=supplier_in)
    return supplier


@router.delete("/suppliers/{supplier_id}")
def delete_supplier(
    session: SessionDep,
    current_user: AdminUser,
    supplier_id: uuid.UUID,
) -> Any:
    """
    Delete supplier (Admin only).
    """
    supplier = session.get(Supplier, supplier_id)
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")

    # Check if supplier has GRNs
    grn_count = session.exec(
        select(func.count()).select_from(GRN).where(GRN.supplier_id == supplier_id)
    ).one()

    if grn_count > 0:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot delete supplier. {grn_count} GRN(s) are associated with this supplier.",
        )

    session.delete(supplier)
    session.commit()
    return {"message": "Supplier deleted successfully"}


# ==================== TRANSPORTER ROUTES ====================


@router.get("/transporters", response_model=TransportersPublic)
def read_transporters(
    session: SessionDep,
    current_user: CurrentUser,
    skip: int = 0,
    limit: int = 100,
    search: str | None = None,
    is_active: bool | None = None,
) -> Any:
    """
    Retrieve transporters with optional filtering.
    """
    # Build query
    statement = select(Transporter)

    # Apply filters
    filters: list[ColumnElement[bool]] = []
    if search:
        search_filter = or_(
            Transporter.name.ilike(f"%{search}%"),
            Transporter.contact_person.ilike(f"%{search}%"),
        )
        filters.append(search_filter)

    if is_active is not None:
        filters.append(Transporter.is_active == is_active)  # type: ignore[arg-type]

    if filters:
        statement = statement.where(and_(*filters))

    # Get count
    count_statement = select(func.count()).select_from(statement.subquery())
    count = session.exec(count_statement).one()

    # Apply pagination and ordering
    statement = statement.order_by(Transporter.name).offset(skip).limit(limit)
    transporters = session.exec(statement).all()

    return TransportersPublic(data=transporters, count=count)


@router.post("/transporters", response_model=TransporterPublic)
def create_transporter(
    session: SessionDep,
    current_user: AdminUser,
    transporter_in: TransporterCreate,
) -> Any:
    """
    Create new transporter (Admin only).
    """
    # Check for duplicate name
    existing = transporter_crud.get_by_name(db=session, name=transporter_in.name)
    if existing:
        raise HTTPException(
            status_code=400,
            detail=f"Transporter with name '{transporter_in.name}' already exists.",
        )

    transporter = transporter_crud.create(db=session, obj_in=transporter_in)
    return transporter


@router.get("/transporters/{transporter_id}", response_model=TransporterPublic)
def read_transporter(
    session: SessionDep,
    current_user: CurrentUser,
    transporter_id: uuid.UUID,
) -> Any:
    """
    Get transporter by ID.
    """
    transporter = session.get(Transporter, transporter_id)
    if not transporter:
        raise HTTPException(status_code=404, detail="Transporter not found")
    return transporter


@router.put("/transporters/{transporter_id}", response_model=TransporterPublic)
def update_transporter(
    session: SessionDep,
    current_user: AdminUser,
    transporter_id: uuid.UUID,
    transporter_in: TransporterUpdate,
) -> Any:
    """
    Update transporter (Admin only).
    """
    transporter = session.get(Transporter, transporter_id)
    if not transporter:
        raise HTTPException(status_code=404, detail="Transporter not found")

    # Check for duplicate name if changing name
    if transporter_in.name and transporter_in.name != transporter.name:
        existing = transporter_crud.get_by_name(db=session, name=transporter_in.name)
        if existing:
            raise HTTPException(
                status_code=400,
                detail=f"Transporter with name '{transporter_in.name}' already exists.",
            )

    transporter = transporter_crud.update(
        db=session, db_obj=transporter, obj_in=transporter_in
    )
    return transporter


@router.delete("/transporters/{transporter_id}")
def delete_transporter(
    session: SessionDep,
    current_user: AdminUser,
    transporter_id: uuid.UUID,
) -> Any:
    """
    Delete transporter (Admin only).
    """
    transporter = session.get(Transporter, transporter_id)
    if not transporter:
        raise HTTPException(status_code=404, detail="Transporter not found")

    # Check if transporter has GRNs
    grn_count = session.exec(
        select(func.count())
        .select_from(GRN)
        .where(GRN.transporter_id == transporter_id)
    ).one()

    if grn_count > 0:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot delete transporter. {grn_count} GRN(s) are associated with this transporter.",
        )

    session.delete(transporter)
    session.commit()
    return {"message": "Transporter deleted successfully"}


# ==================== GRN ROUTES ====================


@router.get("/", response_model=GRNsPublic)
def read_grns(
    session: SessionDep,
    current_user: CurrentUser,
    skip: int = 0,
    limit: int = 100,
    search: str | None = None,
    supplier_id: uuid.UUID | None = None,
    is_approved: bool | None = None,
    start_date: datetime | None = None,
    end_date: datetime | None = None,
) -> Any:
    """
    Retrieve GRNs with optional filtering.
    """
    # Build query with eager loading
    statement = select(GRN).options(
        qload(GRN.supplier),
        qload(GRN.transporter),
    )

    # Apply filters
    filters: list[ColumnElement[bool]] = []
    if search:
        search_filter = or_(
            GRN.grn_number.ilike(f"%{search}%"),
            GRN.delivery_number.ilike(f"%{search}%"),
            GRN.consignment_number.ilike(f"%{search}%"),
        )
        filters.append(search_filter)

    if supplier_id:
        filters.append(GRN.supplier_id == supplier_id)  # type: ignore[arg-type]

    if is_approved is not None:
        filters.append(GRN.is_approved == is_approved)  # type: ignore[arg-type]

    if start_date:
        filters.append(GRN.goods_receipt_date >= start_date)  # type: ignore[arg-type]

    if end_date:
        filters.append(GRN.goods_receipt_date <= end_date)  # type: ignore[arg-type]

    if filters:
        statement = statement.where(and_(*filters))

    # Get count
    count_statement = select(func.count()).select_from(statement.subquery())
    count = session.exec(count_statement).one()

    # Apply pagination and ordering (newest first)
    statement = statement.order_by(desc(GRN.created_at)).offset(skip).limit(limit)
    grns = session.exec(statement).all()

    # Add computed fields
    grns_public = []
    for grn in grns:
        grn_dict = GRNPublic.model_validate(grn).model_dump()
        grn_dict["supplier_name"] = grn.supplier.name if grn.supplier else None
        grn_dict["transporter_name"] = grn.transporter.name if grn.transporter else None
        grn_dict["items_count"] = len(grn.items) if grn.items else 0
        grns_public.append(GRNPublic(**grn_dict))

    return GRNsPublic(data=grns_public, count=count)


@router.post("/", response_model=GRNPublicWithItems)
def create_grn(
    session: SessionDep,
    current_user: CurrentUser,
    grn_in: GRNCreate,
) -> Any:
    """
    Create new GRN with optional credit purchase support.

    If payment_type is "Credit", validates supplier credit limit
    and can optionally create supplier debt after approval.
    """
    # Verify supplier exists
    supplier = session.get(Supplier, grn_in.supplier_id)
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")

    # Credit limit validation for credit purchases
    if grn_in.payment_type == "Credit":
        total_amount = grn_in.total_amount
        new_credit_used = supplier.current_credit_used + total_amount

        if new_credit_used > supplier.credit_limit:
            raise HTTPException(
                status_code=400,
                detail=f"Credit limit exceeded for supplier {supplier.name}. "
                f"Limit: {supplier.credit_limit}, "
                f"Current used: {supplier.current_credit_used}, "
                f"This purchase: {total_amount}, "
                f"Would be: {new_credit_used}",
            )

    # Verify transporter if provided
    if grn_in.transporter_id:
        transporter = session.get(Transporter, grn_in.transporter_id)
        if not transporter:
            raise HTTPException(status_code=404, detail="Transporter not found")

    # Verify all products exist
    for item in grn_in.items:
        from app.models import Product

        product = session.get(Product, item.product_id)
        if not product:
            raise HTTPException(
                status_code=404, detail=f"Product with ID {item.product_id} not found"
            )

    # Create GRN
    grn = grn_crud.create(db=session, obj_in=grn_in, created_by_id=current_user.id)

    # Create notification for admin if requires approval
    if grn.requires_approval:
        from app import crud

        crud.create_notification_for_admins(
            session=session,
            notification_type="grn_approval_needed",
            title="GRN Requires Approval",
            message=f"GRN #{grn.grn_number} from {supplier.name} requires approval (Credit: {grn.total_amount})",
            priority="warning",
            link_url=f"/grn/{grn.id}",
        )

    # Convert to GRNPublicWithItems
    grn_dict = GRNPublicWithItems.model_validate(grn).model_dump()
    grn_dict["supplier_name"] = grn.supplier.name if grn.supplier else None
    grn_dict["transporter_name"] = grn.transporter.name if grn.transporter else None
    grn_dict["items_count"] = len(grn.items) if grn.items else 0

    return GRNPublicWithItems(**grn_dict)


@router.get("/{grn_id}", response_model=GRNPublicWithItems)
def read_grn(
    session: SessionDep,
    current_user: CurrentUser,
    grn_id: uuid.UUID,
) -> Any:
    """
    Get GRN by ID with items.
    """
    statement = (
        select(GRN)
        .where(GRN.id == grn_id)
        .options(
            qload(GRN.supplier),
            qload(GRN.transporter),
            qload_chain(GRN.items, GRNItem.product),
        )
    )
    grn = session.exec(statement).first()

    if not grn:
        raise HTTPException(status_code=404, detail="GRN not found")

    # Add computed fields
    grn_dict = GRNPublicWithItems.model_validate(grn).model_dump()
    grn_dict["supplier_name"] = grn.supplier.name if grn.supplier else None
    grn_dict["transporter_name"] = grn.transporter.name if grn.transporter else None
    grn_dict["items_count"] = len(grn.items) if grn.items else 0

    return GRNPublicWithItems(**grn_dict)


@router.put("/{grn_id}", response_model=GRNPublicWithItems)
def update_grn(
    session: SessionDep,
    current_user: AdminUser,
    grn_id: uuid.UUID,
    grn_in: GRNUpdate,
) -> Any:
    """
    Update GRN (Admin only).
    """
    grn = session.get(GRN, grn_id)
    if not grn:
        raise HTTPException(status_code=404, detail="GRN not found")

    # If approving, set approved_by
    if grn_in.is_approved and not grn.is_approved:
        grn_in.approved_by_id = current_user.id

    grn = grn_crud.update(db=session, db_obj=grn, obj_in=grn_in)

    # Add computed fields
    grn_dict = GRNPublicWithItems.model_validate(grn).model_dump()
    grn_dict["supplier_name"] = grn.supplier.name if grn.supplier else None
    grn_dict["transporter_name"] = grn.transporter.name if grn.transporter else None
    grn_dict["items_count"] = len(grn.items) if grn.items else 0

    return GRNPublicWithItems(**grn_dict)


@router.delete("/{grn_id}")
def delete_grn(
    session: SessionDep,
    current_user: AdminUser,
    grn_id: uuid.UUID,
) -> Any:
    """
    Delete GRN (Admin only). Can only delete if not approved.
    """
    grn = session.get(GRN, grn_id)
    if not grn:
        raise HTTPException(status_code=404, detail="GRN not found")

    if grn.is_approved:
        raise HTTPException(
            status_code=400,
            detail="Cannot delete approved GRN. Reverse the approval first.",
        )

    session.delete(grn)
    session.commit()
    return {"message": "GRN deleted successfully"}


@router.post("/{grn_id}/approve", response_model=GRNPublicWithItems)
def approve_grn(
    *,
    session: SessionDep,
    current_user: AdminUser,
    grn_id: uuid.UUID,
) -> Any:
    """
    Approve GRN and optionally create supplier debt for credit purchases.

    **Access**: Admin only

    **Business Logic:**
    - If payment_type is "Credit" and creates_debt is True:
      - Creates SupplierDebt record
      - Updates supplier's current_credit_used
      - Creates notification for admins
    - Updates product stock levels (existing logic)
    - Marks GRN as approved
    """
    statement = (
        select(GRN)
        .where(GRN.id == grn_id)
        .options(
            qload(GRN.supplier),
            qload_chain(GRN.items, GRNItem.product),
        )
    )
    grn = session.exec(statement).first()

    if not grn:
        raise HTTPException(status_code=404, detail="GRN not found")

    if grn.is_approved:
        raise HTTPException(status_code=400, detail="GRN is already approved")

    # Mark as approved
    grn.is_approved = True
    grn.approved_by_id = current_user.id
    grn.approved_at = datetime.now(timezone.utc)
    session.add(grn)

    # Create supplier debt if credit purchase
    if grn.payment_type == "Credit" and grn.creates_debt:
        # Calculate due date based on credit terms
        from datetime import timedelta

        from app import crud
        from app.models import SupplierDebt, SupplierDebtCreate

        invoice_date = grn.received_date or datetime.now(timezone.utc)

        # Parse credit terms (e.g., "Net 30" = 30 days)
        credit_period_days = 30  # Default
        if grn.credit_terms:
            if "Net" in grn.credit_terms:
                try:
                    credit_period_days = int(grn.credit_terms.split()[-1])
                except (ValueError, IndexError):
                    pass

        due_date = invoice_date + timedelta(days=credit_period_days)

        # Create debt
        debt_in = SupplierDebtCreate(
            supplier_id=grn.supplier_id,
            grn_id=grn.id,
            total_amount=grn.total_amount,
            payment_terms=grn.credit_terms or "Net 30",
            credit_period_days=credit_period_days,
            invoice_date=invoice_date,
            due_date=due_date,
            currency=grn.currency or "KES",
            notes=f"Auto-created from GRN #{grn.grn_number}",
        )

        debt = SupplierDebt.model_validate(
            debt_in,
            update={"created_by_id": current_user.id},
        )
        session.add(debt)

        # Update supplier credit used
        supplier = grn.supplier
        if supplier:
            supplier.current_credit_used += grn.total_amount
            session.add(supplier)

        # Create notification
        crud.create_notification_for_admins(
            session=session,
            notification_type="supplier_debt_created",
            title="Supplier Debt Created",
            message=f"Debt of {grn.currency or 'KES'} {grn.total_amount} created for {supplier.name if supplier else 'supplier'} (GRN #{grn.grn_number})",
            priority="info",
            link_url=f"/supplier-debts/{debt.id}",
        )

    # Update product stock levels (existing logic would go here)
    # For now, we'll just commit the approval

    session.commit()
    session.refresh(grn)

    # Create approval notification
    from app import crud

    crud.create_notification_for_admins(
        session=session,
        notification_type="grn_approved",
        title="GRN Approved",
        message=f"GRN #{grn.grn_number} from {grn.supplier.name if grn.supplier else 'supplier'} has been approved",
        priority="info",
        link_url=f"/grn/{grn.id}",
    )

    # Convert to response
    grn_dict = GRNPublicWithItems.model_validate(grn).model_dump()
    grn_dict["supplier_name"] = grn.supplier.name if grn.supplier else None
    grn_dict["transporter_name"] = grn.transporter.name if grn.transporter else None
    grn_dict["items_count"] = len(grn.items) if grn.items else 0

    return GRNPublicWithItems(**grn_dict)
