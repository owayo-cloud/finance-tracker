from typing import Any, Optional
from datetime import date, datetime, timedelta
from decimal import Decimal

from fastapi import APIRouter, Query
from pydantic import BaseModel
from sqlmodel import func, select, and_, or_
from sqlalchemy import cast, Date
from sqlalchemy.orm import selectinload

from app.api.deps import CurrentUser, SessionDep
from app.models import Sale, Expense, Product, ProductStatus, PaymentMethod, User


router = APIRouter(prefix="/analytics", tags=["analytics"])


# ==================== SALES ANALYTICS ====================

class PaymentMethodBreakdown(BaseModel):
    payment_method: str
    count: int
    amount: float


class CashierBreakdown(BaseModel):
    cashier_name: str
    count: int
    amount: float


class SalesSummary(BaseModel):
    total_sales: int
    total_amount: float
    total_items: int
    average_sale: float
    payment_method_breakdown: list[PaymentMethodBreakdown]
    cashier_breakdown: list[CashierBreakdown]


@router.get("/sales-summary", response_model=SalesSummary)
def get_sales_summary(
    session: SessionDep,
    current_user: CurrentUser,
    start_date: Optional[date] = Query(None, description="Start date for summary"),
    end_date: Optional[date] = Query(None, description="End date for summary"),
) -> Any:
    """
    Get sales summary with totals, averages, and breakdowns by payment method and cashier.
    """
    conditions = []
    
    # Apply date filters
    if start_date:
        conditions.append(cast(Sale.sale_date, Date) >= start_date)
    if end_date:
        conditions.append(cast(Sale.sale_date, Date) <= end_date)
    
    # Cashiers only see their own sales
    if not current_user.is_superuser:
        conditions.append(Sale.created_by_id == current_user.id)
    
    # Base query for totals
    base_query = select(Sale)
    if conditions:
        base_query = base_query.where(and_(*conditions))
    
    # Get all sales
    sales = session.exec(
        base_query.options(
            selectinload(Sale.payment_method),
            selectinload(Sale.created_by)
        )
    ).all()
    
    # Calculate totals
    total_sales = len(sales)
    total_amount = sum(float(sale.total_amount or Decimal("0")) for sale in sales)
    total_items = sum(sale.quantity for sale in sales)
    average_sale = total_amount / total_sales if total_sales > 0 else 0.0
    
    # Payment method breakdown
    payment_method_map: dict[str, dict[str, Any]] = {}
    for sale in sales:
        method_name = sale.payment_method.name if sale.payment_method else "Unknown"
        if method_name not in payment_method_map:
            payment_method_map[method_name] = {"count": 0, "amount": 0.0}
        payment_method_map[method_name]["count"] += 1
        payment_method_map[method_name]["amount"] += float(sale.total_amount or Decimal("0"))
    
    payment_method_breakdown = [
        PaymentMethodBreakdown(
            payment_method=method,
            count=data["count"],
            amount=data["amount"]
        )
        for method, data in payment_method_map.items()
    ]
    
    # Cashier breakdown
    cashier_map: dict[str, dict[str, Any]] = {}
    for sale in sales:
        cashier_name = (
            sale.created_by.full_name if sale.created_by and sale.created_by.full_name
            else sale.created_by.username if sale.created_by and sale.created_by.username
            else "Unknown"
        )
        if cashier_name not in cashier_map:
            cashier_map[cashier_name] = {"count": 0, "amount": 0.0}
        cashier_map[cashier_name]["count"] += 1
        cashier_map[cashier_name]["amount"] += float(sale.total_amount or Decimal("0"))
    
    cashier_breakdown = [
        CashierBreakdown(
            cashier_name=name,
            count=data["count"],
            amount=data["amount"]
        )
        for name, data in cashier_map.items()
    ]
    
    return SalesSummary(
        total_sales=total_sales,
        total_amount=total_amount,
        total_items=total_items,
        average_sale=average_sale,
        payment_method_breakdown=payment_method_breakdown,
        cashier_breakdown=cashier_breakdown
    )


# ==================== STOCK ANALYTICS ====================

class StockItem(BaseModel):
    id: str
    name: str
    category: str
    current_stock: int
    buying_price: float
    selling_price: float
    inventory_value: float
    reorder_level: int
    status: str


class StockSummary(BaseModel):
    total_products: int
    total_inventory_value: float
    low_stock_count: int
    out_of_stock_count: int
    products: list[StockItem]


@router.get("/stock-summary", response_model=StockSummary)
def get_stock_summary(
    session: SessionDep,
    current_user: CurrentUser,
) -> Any:
    """
    Get stock inventory summary with total value, low stock counts, and product details.
    """
    # Get all products with relationships
    products = session.exec(
        select(Product)
        .options(
            selectinload(Product.category),
            selectinload(Product.status)
        )
    ).all()
    
    total_inventory_value = 0.0
    low_stock_count = 0
    out_of_stock_count = 0
    stock_items = []
    
    for product in products:
        stock = product.current_stock or 0
        buying_price = float(product.buying_price or Decimal("0"))
        selling_price = float(product.selling_price or Decimal("0"))
        inventory_value = stock * buying_price
        total_inventory_value += inventory_value
        
        if stock == 0:
            out_of_stock_count += 1
        elif product.reorder_level and stock <= product.reorder_level:
            low_stock_count += 1
        
        stock_items.append(StockItem(
            id=str(product.id),
            name=product.name,
            category=product.category.name if product.category else "Uncategorized",
            current_stock=stock,
            buying_price=buying_price,
            selling_price=selling_price,
            inventory_value=inventory_value,
            reorder_level=product.reorder_level or 0,
            status=product.status.name if product.status else "Unknown"
        ))
    
    return StockSummary(
        total_products=len(products),
        total_inventory_value=total_inventory_value,
        low_stock_count=low_stock_count,
        out_of_stock_count=out_of_stock_count,
        products=stock_items
    )


# ==================== BALANCE SHEET ====================

class BalanceSheetAssets(BaseModel):
    inventory: float
    cash_and_receivables: float
    total: float


class BalanceSheetLiabilities(BaseModel):
    expenses: float
    total: float


class BalanceSheet(BaseModel):
    assets: BalanceSheetAssets
    liabilities: BalanceSheetLiabilities
    equity: float


@router.get("/balance-sheet", response_model=BalanceSheet)
def get_balance_sheet(
    session: SessionDep,
    current_user: CurrentUser,
    start_date: Optional[date] = Query(None, description="Start date for balance sheet"),
    end_date: Optional[date] = Query(None, description="End date for balance sheet"),
) -> Any:
    """
    Get balance sheet with assets, liabilities, and equity calculations.
    """
    # Get inventory value from stock summary
    stock_summary = get_stock_summary(session, current_user)
    inventory_value = stock_summary.total_inventory_value
    
    # Get sales total (cash and receivables)
    sales_summary = get_sales_summary(session, current_user, start_date, end_date)
    cash_and_receivables = sales_summary.total_amount
    
    # Get expenses total
    expense_conditions = []
    if start_date:
        expense_conditions.append(cast(Expense.expense_date, Date) >= start_date)
    if end_date:
        expense_conditions.append(cast(Expense.expense_date, Date) <= end_date)
    
    expense_query: Any = select(func.sum(Expense.amount))
    if expense_conditions:
        expense_query = expense_query.where(and_(*expense_conditions))
    
    expense_total = session.exec(expense_query).one() or Decimal("0")
    total_expenses = float(expense_total)
    
    # Calculate totals
    total_assets = inventory_value + cash_and_receivables
    total_liabilities = total_expenses
    equity = total_assets - total_liabilities
    
    return BalanceSheet(
        assets=BalanceSheetAssets(
            inventory=inventory_value,
            cash_and_receivables=cash_and_receivables,
            total=total_assets
        ),
        liabilities=BalanceSheetLiabilities(
            expenses=total_expenses,
            total=total_liabilities
        ),
        equity=equity
    )


# ==================== DASHBOARD STATISTICS ====================

class DashboardStats(BaseModel):
    current_month_revenue: float
    previous_month_revenue: float
    today_revenue: float
    yesterday_revenue: float
    current_month_expenses: float
    previous_month_expenses: float
    revenue_change_percent: float
    daily_income_change_percent: float
    expense_change_percent: float
    net_profit: float
    previous_net_profit: float
    net_profit_change_percent: float


@router.get("/dashboard-stats", response_model=DashboardStats)
def get_dashboard_stats(
    session: SessionDep,
    current_user: CurrentUser,
) -> Any:
    """
    Get dashboard statistics including revenue, expenses, and percentage changes.
    """
    today = date.today()
    first_day_of_month = date(today.year, today.month, 1)
    
    # Previous month dates
    if today.month == 1:
        first_day_of_last_month = date(today.year - 1, 12, 1)
        last_day_of_last_month = date(today.year - 1, 12, 31)
    else:
        first_day_of_last_month = date(today.year, today.month - 1, 1)
        last_day_of_last_month = date(today.year, today.month, 1) - timedelta(days=1)
    
    yesterday = date.today() - timedelta(days=1)
    
    # Get current month sales summary
    current_month_sales = get_sales_summary(session, current_user, first_day_of_month, today)
    current_month_revenue = current_month_sales.total_amount
    
    # Get previous month sales summary
    previous_month_sales = get_sales_summary(session, current_user, first_day_of_last_month, last_day_of_last_month)
    previous_month_revenue = previous_month_sales.total_amount
    
    # Get today's sales summary
    today_sales = get_sales_summary(session, current_user, today, today)
    today_revenue = today_sales.total_amount
    
    # Get yesterday's sales summary
    yesterday_sales = get_sales_summary(session, current_user, yesterday, yesterday)
    yesterday_revenue = yesterday_sales.total_amount
    
    # Get current month expenses
    current_expense_query: Any = select(func.sum(Expense.amount)).where(
        and_(
            cast(Expense.expense_date, Date) >= first_day_of_month,
            cast(Expense.expense_date, Date) <= today
        )
    )
    current_expense_total = session.exec(current_expense_query).one() or Decimal("0")
    current_month_expenses = float(current_expense_total)
    
    # Get previous month expenses
    previous_expense_query: Any = select(func.sum(Expense.amount)).where(
        and_(
            cast(Expense.expense_date, Date) >= first_day_of_last_month,
            cast(Expense.expense_date, Date) <= last_day_of_last_month
        )
    )
    previous_expense_total = session.exec(previous_expense_query).one() or Decimal("0")
    previous_month_expenses = float(previous_expense_total)
    
    # Calculate percentage changes
    def calculate_percentage_change(current: float, previous: float) -> float:
        if previous == 0:
            return 100.0 if current > 0 else 0.0
        return ((current - previous) / previous) * 100.0
    
    revenue_change_percent = calculate_percentage_change(current_month_revenue, previous_month_revenue)
    daily_income_change_percent = calculate_percentage_change(today_revenue, yesterday_revenue)
    expense_change_percent = calculate_percentage_change(current_month_expenses, previous_month_expenses)
    
    # Calculate net profit
    net_profit = current_month_revenue - current_month_expenses
    previous_net_profit = previous_month_revenue - previous_month_expenses
    net_profit_change_percent = calculate_percentage_change(net_profit, previous_net_profit)
    
    return DashboardStats(
        current_month_revenue=current_month_revenue,
        previous_month_revenue=previous_month_revenue,
        today_revenue=today_revenue,
        yesterday_revenue=yesterday_revenue,
        current_month_expenses=current_month_expenses,
        previous_month_expenses=previous_month_expenses,
        revenue_change_percent=revenue_change_percent,
        daily_income_change_percent=daily_income_change_percent,
        expense_change_percent=expense_change_percent,
        net_profit=net_profit,
        previous_net_profit=previous_net_profit,
        net_profit_change_percent=net_profit_change_percent
    )

