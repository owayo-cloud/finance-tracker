import logging

from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.db import engine

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


session = Session(engine)
try:
    # Check categories
    result = session.execute(text("SELECT name FROM product_category"))
    categories = result.fetchall()
    logger.info("Categories: %s", [r[0] for r in categories])

    # Check statuses
    result = session.execute(text("SELECT name FROM product_status"))
    statuses = result.fetchall()
    logger.info("Statuses: %s", [r[0] for r in statuses])

    # Check products
    result = session.execute(text("SELECT COUNT(*) FROM product"))
    product_count = result.fetchone()
    logger.info("Products count: %s", product_count[0])

except Exception as e:
    logger.exception("Error while checking products: %s", e)
finally:
    session.close()
