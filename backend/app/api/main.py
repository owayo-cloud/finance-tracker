from fastapi import APIRouter

from app.api.routes import login, media, private, products, sales, stock_entries, users, utils, bulk_import, shift_reconciliation
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
api_router.include_router(media.router)


if settings.ENVIRONMENT == "local":
    api_router.include_router(private.router)
