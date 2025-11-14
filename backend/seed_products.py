import logging
from sqlmodel import Session
from app.core.db import engine
from app.models import ProductCategory, ProductStatus

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def create_product_categories():
    """Create default product categories"""
    with Session(engine) as session:
        # Check if categories already exist
        existing_categories = session.query(ProductCategory).all()
        if existing_categories:
            logger.info("Product categories already exist, skipping...")
            return
        
        categories = [
            {"name": "Bottles", "description": "Spirits, liquor, and bottled beverages"},
            {"name": "Cans", "description": "Beer, soft drinks, and canned beverages"},
            {"name": "Wines", "description": "Red, white, rosé, and sparkling wines"},
            {"name": "Others", "description": "Mixers, snacks, and accessories"}
        ]
        
        for cat_data in categories:
            category = ProductCategory(**cat_data)
            session.add(category)
        
        session.commit()
        logger.info("Created product categories")

def create_product_statuses():
    """Create default product statuses"""
    with Session(engine) as session:
        # Check if statuses already exist
        existing_statuses = session.query(ProductStatus).all()
        if existing_statuses:
            logger.info("Product statuses already exist, skipping...")
            return
        
        statuses = [
            {"name": "Active", "description": "Available for sale"},
            {"name": "Inactive", "description": "Temporarily unavailable"},
            {"name": "Out of Stock", "description": "No inventory available"},
            {"name": "Discontinued", "description": "No longer sold"},
            {"name": "Coming Soon", "description": "Will be available soon"}
        ]
        
        for status_data in statuses:
            status = ProductStatus(**status_data)
            session.add(status)
        
        session.commit()
        logger.info("Created product statuses")

def main():
    logger.info("Creating product dependencies...")
    create_product_categories()
    create_product_statuses()
    logger.info("Product dependencies created successfully!")

if __name__ == "__main__":
    main()