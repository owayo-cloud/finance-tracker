import uuid
from datetime import date, datetime
from decimal import Decimal
from typing import Any

from fastapi import APIRouter, HTTPException, Query
from sqlalchemy.sql import ColumnElement
from sqlmodel import and_, desc, func, select

from app.api.deps import AdminUser, CurrentUser, SessionDep
from app.models import (
    Expense,
    ExpenseCategoriesPublic,
    ExpenseCategory,
    ExpenseCategoryCreate,
    ExpenseCategoryPublic,
    ExpenseCategoryUpdate,
    ExpenseCreate,
    ExpensePublic,
    ExpensesPublic,
    ExpenseUpdate,
)
from app.utils.sqlalchemy_helpers import qload

router = APIRouter(prefix="/expenses", tags=["expenses"])


# ==================== EXPENSE CATEGORIES ====================


@router.get("/categories", response_model=ExpenseCategoriesPublic)
def read_expense_categories(
    session: SessionDep,
    current_user: CurrentUser,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, le=1000),
) -> Any:
    """
    Retrieve all expense categories.
    """
    count_statement = select(func.count()).select_from(ExpenseCategory)
    count = session.exec(count_statement).one()

    statement = (
        select(ExpenseCategory).offset(skip).limit(limit).order_by(ExpenseCategory.name)
    )

    categories = session.exec(statement).all()

    return ExpenseCategoriesPublic(data=categories, count=count)


@router.post("/categories", response_model=ExpenseCategoryPublic)
def create_expense_category(
    *, session: SessionDep, admin_user: AdminUser, category_in: ExpenseCategoryCreate
) -> Any:
    """
    Create a new expense category (admin only).
    """
    # Check if category with same name already exists
    existing = session.exec(
        select(ExpenseCategory).where(ExpenseCategory.name == category_in.name)
    ).first()

    if existing:
        raise HTTPException(
            status_code=400,
            detail=f"Expense category with name '{category_in.name}' already exists",
        )

    category = ExpenseCategory(**category_in.model_dump())
    session.add(category)
    session.commit()
    session.refresh(category)

    return category


@router.get("/categories/{category_id}", response_model=ExpenseCategoryPublic)
def read_expense_category(
    *, session: SessionDep, current_user: CurrentUser, category_id: uuid.UUID
) -> Any:
    """
    Get a specific expense category by ID.
    """
    category = session.get(ExpenseCategory, category_id)
    if not category:
        raise HTTPException(status_code=404, detail="Expense category not found")
    return category


@router.put("/categories/{category_id}", response_model=ExpenseCategoryPublic)
def update_expense_category(
    *,
    session: SessionDep,
    admin_user: AdminUser,
    category_id: uuid.UUID,
    category_in: ExpenseCategoryUpdate,
) -> Any:
    """
    Update an expense category (admin only).
    """
    category = session.get(ExpenseCategory, category_id)
    if not category:
        raise HTTPException(status_code=404, detail="Expense category not found")

    # Check if name is being changed and if new name already exists
    if category_in.name and category_in.name != category.name:
        existing = session.exec(
            select(ExpenseCategory).where(ExpenseCategory.name == category_in.name)
        ).first()
        if existing:
            raise HTTPException(
                status_code=400,
                detail=f"Expense category with name '{category_in.name}' already exists",
            )

    category_data = category_in.model_dump(exclude_unset=True)
    for field, value in category_data.items():
        setattr(category, field, value)

    category.updated_at = datetime.now(category.created_at.tzinfo)
    session.add(category)
    session.commit()
    session.refresh(category)

    return category


@router.delete("/categories/{category_id}")
def delete_expense_category(
    *, session: SessionDep, admin_user: AdminUser, category_id: uuid.UUID
) -> Any:
    """
    Delete an expense category (admin only).
    """
    category = session.get(ExpenseCategory, category_id)
    if not category:
        raise HTTPException(status_code=404, detail="Expense category not found")

    # Check if category has expenses
    expense_count = session.exec(
        select(func.count())
        .select_from(Expense)
        .where(Expense.category_id == category_id)
    ).one()

    if expense_count > 0:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot delete category with {expense_count} expense(s). Please reassign or delete expenses first.",
        )

    session.delete(category)
    session.commit()
    return {"message": "Expense category deleted successfully"}


# ==================== EXPENSES CRUD ====================


@router.get("/", response_model=ExpensesPublic)
def read_expenses(
    session: SessionDep,
    current_user: CurrentUser,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, le=1000),
    category_id: uuid.UUID | None = Query(None),
    start_date: date | None = Query(None),
    end_date: date | None = Query(None),
    search: str | None = Query(None),
) -> Any:
    """
    Retrieve expenses with optional filtering.

    Args:
        skip: Number of expenses to skip (pagination)
        limit: Number of expenses to return (max 1000)
        category_id: Filter by category ID
        start_date: Filter expenses from this date onwards
        end_date: Filter expenses up to this date
        search: Search in description (partial match, case-insensitive)
    """
    # Build base query
    statement = select(Expense).options(
        qload(Expense.category),
        qload(Expense.created_by),
    )

    # Build count query
    count_statement = select(func.count()).select_from(Expense)

    # Apply filters
    conditions: list[ColumnElement[bool]] = []

    if category_id:
        conditions.append(Expense.category_id == category_id)  # type: ignore[arg-type]

    if start_date:
        conditions.append(
            Expense.expense_date
            >= datetime.combine(start_date, datetime.min.time()).replace(
                tzinfo=datetime.now().astimezone().tzinfo
            )
        )  # type: ignore[arg-type]

    if end_date:
        conditions.append(
            Expense.expense_date
            <= datetime.combine(end_date, datetime.max.time()).replace(
                tzinfo=datetime.now().astimezone().tzinfo
            )
        )  # type: ignore[arg-type]

    if search:
        search_condition = Expense.description.ilike(f"%{search}%")
        conditions.append(search_condition)

    # Apply conditions to both queries
    if conditions:
        combined_conditions = and_(*conditions)
        statement = statement.where(combined_conditions)
        count_statement = count_statement.where(combined_conditions)

    # Execute count query
    count = session.exec(count_statement).one()

    # Execute expenses query with pagination and ordering
    statement = statement.order_by(desc(Expense.expense_date), desc(Expense.created_at))
    statement = statement.offset(skip).limit(limit)
    expenses = session.exec(statement).all()

    return ExpensesPublic(data=expenses, count=count)


@router.post("/", response_model=ExpensePublic)
def create_expense(
    *, session: SessionDep, current_user: CurrentUser, expense_in: ExpenseCreate
) -> Any:
    """
    Create a new expense.
    """
    # Verify category exists
    category = session.get(ExpenseCategory, expense_in.category_id)
    if not category:
        raise HTTPException(status_code=404, detail="Expense category not found")

    expense = Expense(**expense_in.model_dump(), created_by_id=current_user.id)
    session.add(expense)
    session.commit()
    session.refresh(expense)

    # Load relationships
    expense = session.exec(
        select(Expense)
        .options(qload(Expense.category), qload(Expense.created_by))
        .where(Expense.id == expense.id)
    ).first()

    return expense


@router.get("/{expense_id}", response_model=ExpensePublic)
def read_expense(
    *, session: SessionDep, current_user: CurrentUser, expense_id: uuid.UUID
) -> Any:
    """
    Get a specific expense by ID.
    """
    expense = session.exec(
        select(Expense)
        .options(qload(Expense.category), qload(Expense.created_by))
        .where(Expense.id == expense_id)
    ).first()

    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")

    return expense


@router.put("/{expense_id}", response_model=ExpensePublic)
def update_expense(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    expense_id: uuid.UUID,
    expense_in: ExpenseUpdate,
) -> Any:
    """
    Update an expense.
    Only admins can update any expense, others can only update their own expenses.
    """
    expense = session.get(Expense, expense_id)
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")

    # Check permissions - only admins can update others' expenses
    if not current_user.is_superuser and expense.created_by_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")

    # Verify category exists if being updated
    if expense_in.category_id:
        category = session.get(ExpenseCategory, expense_in.category_id)
        if not category:
            raise HTTPException(status_code=404, detail="Expense category not found")

    expense_data = expense_in.model_dump(exclude_unset=True)
    for field, value in expense_data.items():
        setattr(expense, field, value)

    expense.updated_at = datetime.now(expense.created_at.tzinfo)
    session.add(expense)
    session.commit()
    session.refresh(expense)

    # Load relationships
    expense = session.exec(
        select(Expense)
        .options(qload(Expense.category), qload(Expense.created_by))
        .where(Expense.id == expense.id)
    ).first()

    return expense


@router.delete("/{expense_id}")
def delete_expense(
    *, session: SessionDep, admin_user: AdminUser, expense_id: uuid.UUID
) -> Any:
    """
    Delete an expense (admin only).
    """
    expense = session.get(Expense, expense_id)
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")

    session.delete(expense)
    session.commit()
    return {"message": "Expense deleted successfully"}


# ==================== EXPENSE STATISTICS ====================


@router.get("/stats/summary")
def get_expense_summary(
    session: SessionDep,
    current_user: CurrentUser,
    start_date: date | None = Query(None),
    end_date: date | None = Query(None),
    category_id: uuid.UUID | None = Query(None),
) -> Any:
    """
    Get expense summary statistics.
    """
    # Build base query
    statement = select(Expense)

    # Apply filters
    conditions: list[ColumnElement[bool]] = []

    if category_id:
        conditions.append(Expense.category_id == category_id)  # type: ignore[arg-type]

    if start_date:
        conditions.append(
            Expense.expense_date
            >= datetime.combine(start_date, datetime.min.time()).replace(
                tzinfo=datetime.now().astimezone().tzinfo
            )
        )  # type: ignore[arg-type]

    if end_date:
        conditions.append(
            Expense.expense_date
            <= datetime.combine(end_date, datetime.max.time()).replace(
                tzinfo=datetime.now().astimezone().tzinfo
            )
        )  # type: ignore[arg-type]

    if conditions:
        combined_conditions = and_(*conditions)
        statement = statement.where(combined_conditions)

    expenses = session.exec(statement).all()

    total_amount = sum(exp.amount for exp in expenses)
    count = len(expenses)

    # Calculate by category
    category_totals = {}
    for exp in expenses:
        category_name = exp.category.name if exp.category else "Unknown"
        if category_name not in category_totals:
            category_totals[category_name] = Decimal(0)
        category_totals[category_name] += exp.amount

    return {
        "total_amount": total_amount,
        "count": count,
        "average_amount": total_amount / count if count > 0 else Decimal(0),
        "category_totals": {k: float(v) for k, v in category_totals.items()},
    }
