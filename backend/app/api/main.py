from fastapi import APIRouter

from app.api.routes import (
    analytics,
    bulk_import,
    customers,
    debts,
    expenses,
    grn,
    login,
    media,
    notifications,
    private,
    products,
    reminders,
    sales,
    shift_reconciliation,
    stock_entries,
    supplier_debts,
    till,
    users,
    utils,
)
from app.core.config import settings

api_router = APIRouter()
api_router.include_router(login.router)
api_router.include_router(users.router)
api_router.include_router(utils.router)
api_router.include_router(products.router)
api_router.include_router(bulk_import.router)
api_router.include_router(stock_entries.router)
api_router.include_router(sales.router)
api_router.include_router(shift_reconciliation.router)
api_router.include_router(expenses.router)
api_router.include_router(debts.router)
api_router.include_router(customers.router)
api_router.include_router(analytics.router)
api_router.include_router(grn.router)
api_router.include_router(supplier_debts.router, prefix="/supplier-debts", tags=["supplier-debts"])
api_router.include_router(notifications.router, prefix="/notifications", tags=["notifications"])
api_router.include_router(reminders.router, prefix="/reminders", tags=["reminders"])
api_router.include_router(media.router)
api_router.include_router(till.router)



if settings.ENVIRONMENT == "local":
    api_router.include_router(private.router)
