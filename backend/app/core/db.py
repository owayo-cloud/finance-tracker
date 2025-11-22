import logging

from sqlmodel import Session, create_engine, select

from app import crud
from app.core.config import settings
from app.core.logging_config import get_logger
from app.models import User, UserCreate, ProductCategory, ProductStatus

logger = get_logger(__name__)

engine = create_engine(str(settings.SQLALCHEMY_DATABASE_URI))
logger.info(f"Database engine created: {settings.POSTGRES_SERVER}:{settings.POSTGRES_PORT}/{settings.POSTGRES_DB}")


# make sure all SQLModel models are imported (app.models) before initializing DB
# otherwise, SQLModel might fail to initialize relationships properly
# for more details: https://github.com/fastapi/full-stack-fastapi-template/issues/28


def init_db(session: Session) -> None:
    """Initialize database with initial data"""
    logger.info("Initializing database...")
    
    # Tables should be created with Alembic migrations
    # But if you don't want to use migrations, create
    # the tables un-commenting the next lines
    # from sqlmodel import SQLModel

    # This works because the models are already imported and registered from app.models
    # SQLModel.metadata.create_all(engine)

    user = session.exec(
        select(User).where(User.email == settings.FIRST_SUPERUSER)
    ).first()
    if not user:
        logger.info(f"Creating first superuser: {settings.FIRST_SUPERUSER}")
        user_in = UserCreate(
            email=settings.FIRST_SUPERUSER,
            password=settings.FIRST_SUPERUSER_PASSWORD,
            is_superuser=True,
        )
        user = crud.create_user(session=session, user_create=user_in)
        logger.info(f"Superuser created successfully")
    else:
        logger.info(f"Superuser already exists: {settings.FIRST_SUPERUSER}")

    _seed_product_categories(session)
    _seed_product_statuses(session)
    logger.info("Database initialization complete")

def _seed_product_categories(session: Session) -> None:

    categories = [
        {"name": "Whisky", "description": "Whisky and whiskey products"},
        {"name": "Vodka", "description": "Vodka products"},
        {"name": "Wine", "description": "Wine products"},
        {"name": "Champagne", "description": "Champagne and sparkling wines"},
        {"name": "Cognac", "description": "Cognac products"},
        {"name": "Brandy", "description": "Brandy products"},
        {"name": "Beers", "description": "Beer products"},
        {"name": "Ciders", "description": "Cider products"},
        {"name": "Beers-infusions", "description": "Beer infusions and flavored beers"},
        {"name": "Tequila", "description": "Tequila products"},
        {"name": "Rum", "description": "Rum products"},
        {"name": "Liqueur", "description": "Liqueur products"},
        {"name": "Gin", "description": "Gin products"},
        {"name": "Soft-Drinks", "description": "Non-alcoholic beverages"},
        {"name": "Smokes", "description": "Tobacco products"},
    ]

    for category_data in categories:
        statement = select(ProductCategory).where(
            ProductCategory.name == category_data["name"]
        )
        existing_category = session.exec(statement).first()

        if not existing_category:
            category = ProductCategory(**category_data)
            session.add(category)
            logger.info(f"Created product category: {category_data['name']}")

    session.commit()
    logger.info("Product categories seeded successfully")


def _seed_product_statuses(session: Session) -> None:

    statuses = [
        {"name": "Active", "description": "Product is active and available for sale"},
        {
            "name": "Inactive",
            "description": "Product is temporarily inactive",
        },
        {
            "name": "Out of Stock",
            "description": "Product is currently out of stock",
        },
        {
            "name": "Discontinued",
            "description": "Product has been discontinued",
        },
        {
            "name": "Coming Soon",
            "description": "Product will be available soon",
        },
    ]

    for status_data in statuses:
        statement = select(ProductStatus).where(
            ProductStatus.name == status_data["name"]
        )
        existing_status = session.exec(statement).first()

        if not existing_status:
            status = ProductStatus(**status_data)
            session.add(status)
            logger.info(f"Created product status: {status_data['name']}")

    session.commit()
    logger.info("Product statuses seeded successfully")
