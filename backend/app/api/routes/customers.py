from typing import Any, Optional
from datetime import datetime
from decimal import Decimal

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from sqlmodel import func, select, and_, or_
from sqlalchemy import case

from app.api.deps import CurrentUser, SessionDep
from app.models import Debt, Sale


router = APIRouter(prefix="/customers", tags=["customers"])


class CustomerSummary(BaseModel):
    """Customer summary with aggregated data"""
    name: str
    tel: str
    balance: float
    last_sale_date: Optional[str] = None


class CustomersPublic(BaseModel):
    """List of customers"""
    data: list[CustomerSummary]
    count: int


@router.get("/", response_model=CustomersPublic)
def get_customers(
    session: SessionDep,
    current_user: CurrentUser,
    search: Optional[str] = Query(None, description="Search by name or tel"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, le=1000),
) -> Any:
    """
    Get all customers with aggregated data from debts and sales.
    This endpoint aggregates customer information from both debts and sales tables,
    calculating total balances and finding the most recent sale date.
    """
    # Build base query to get unique customer names from debts
    # Use a subquery approach to get the most recent contact for each customer
    debt_customers_query = (
        select(
            Debt.customer_name,
            func.sum(Debt.balance).label("total_balance"),
            func.max(Debt.debt_date).label("last_debt_date")
        )
        .where(Debt.customer_name.isnot(None))
        .group_by(Debt.customer_name)
    )
    
    # Build query to get last sale date for each customer
    last_sale_query = (
        select(
            Sale.customer_name,
            func.max(Sale.sale_date).label("last_sale_date")
        )
        .where(Sale.customer_name.isnot(None))
        .group_by(Sale.customer_name)
    )
    
    # Execute queries
    debt_results = session.exec(debt_customers_query).all()
    sale_results = session.exec(last_sale_query).all()
    
    # Create a map of customer data
    customer_map: dict[str, CustomerSummary] = {}
    
    # Get contact information separately for each customer
    # This is more efficient than trying to aggregate it in the query
    debt_contacts_query = (
        select(
            Debt.customer_name,
            Debt.customer_contact
        )
        .where(
            and_(
                Debt.customer_name.isnot(None),
                Debt.customer_contact.isnot(None),
                Debt.customer_contact != ""
            )
        )
        .distinct()
    )
    debt_contacts = session.exec(debt_contacts_query).all()
    contact_map = {row.customer_name.lower().strip(): row.customer_contact for row in debt_contacts if row.customer_contact}
    
    # Process debt results
    for row in debt_results:
        customer_name = row.customer_name
        if not customer_name:
            continue
            
        key = customer_name.lower().strip()
        balance = float(row.total_balance or Decimal("0"))
        contact = contact_map.get(key, "")
        last_debt_date = row.last_debt_date
        
        customer_map[key] = CustomerSummary(
            name=customer_name,
            tel=contact,
            balance=balance,
            last_sale_date=last_debt_date.isoformat() if last_debt_date else None
        )
    
    # Process sale results to update last sale date and add customers not in debts
    sale_map = {row.customer_name.lower().strip(): row.last_sale_date for row in sale_results if row.customer_name}
    
    for key, last_sale_date in sale_map.items():
        if key in customer_map:
            # Update last sale date if it's more recent
            existing = customer_map[key]
            if last_sale_date and (
                not existing.last_sale_date or 
                last_sale_date > datetime.fromisoformat(existing.last_sale_date.replace("Z", "+00:00"))
            ):
                existing.last_sale_date = last_sale_date.isoformat()
        else:
            # Add customer from sales who doesn't have debts
            # Find the original customer name (case-sensitive)
            original_name = next(
                (row.customer_name for row in sale_results 
                 if row.customer_name and row.customer_name.lower().strip() == key),
                None
            )
            if original_name:
                customer_map[key] = CustomerSummary(
                    name=original_name,
                    tel="",
                    balance=0.0,
                    last_sale_date=last_sale_date.isoformat() if last_sale_date else None
                )
    
    # Convert to list and apply search filter
    customers = list(customer_map.values())
    
    # Apply search filter if provided
    if search:
        search_lower = search.lower().strip()
        customers = [
            c for c in customers
            if search_lower in c.name.lower() or search_lower in c.tel.lower()
        ]
    
    # Sort by name alphabetically
    customers.sort(key=lambda x: x.name.lower())
    
    # Apply pagination
    total_count = len(customers)
    customers = customers[skip:skip + limit]
    
    return CustomersPublic(data=customers, count=total_count)

