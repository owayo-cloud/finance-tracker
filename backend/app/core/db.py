from sqlmodel import Session, create_engine, select

from app import crud
from app.core.config import settings
from app.models import User, UserCreate, ProductTag, ProductCategory, ProductStatus

engine = create_engine(str(settings.SQLALCHEMY_DATABASE_URI))


# make sure all SQLModel models are imported (app.models) before initializing DB
# otherwise, SQLModel might fail to initialize relationships properly
# for more details: https://github.com/fastapi/full-stack-fastapi-template/issues/28


def init_db(session: Session) -> None:
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
        user_in = UserCreate(
            email=settings.FIRST_SUPERUSER,
            password=settings.FIRST_SUPERUSER_PASSWORD,
            is_superuser=True,
        )
        user = crud.create_user(session=session, user_create=user_in)

    _seed_product_categories(session)
    _seed_product_statuses(session)
    _seed_product_tags(session)


def _seed_product_tags(session: Session) -> None:
    import logging

    logger = logging.getLogger(__name__)

    tags = [
        {"name": "Whisky", "description": "Whisky and whiskey products"},
        {"name": "Vodka", "description": "Vodka products"},
        {"name": "Wine", "description": "Wine products"},
        {"name": "Champagne", "description": "Champagne and sparkling wine"},
        {"name": "Cognac & Brandy", "description": "Cognac and brandy products"},
        {"name": "Beers", "description": "Beer products"},
        {"name": "Ciders", "description": "Cider products"},
        {"name": "Beers-infusions", "description": "Beer infusions and flavored beers"},
        {"name": "Tequila", "description": "Tequila products"},
        {"name": "Rum", "description": "Rum products"},
        {"name": "Gin", "description": "Gin products"},
        {
            "name": "Soft-Drinks",
            "description": "Soft drinks and non-alcoholic beverages",
        },
        {"name": "Smokes", "description": "Cigarettes and tobacco products"},
    ]

    for tag_data in tags:
        statement = select(ProductTag).where(ProductTag.name == tag_data["name"])
        existing_tag = session.exec(statement).first()

        if not existing_tag:
            tag = ProductTag(**tag_data)
            session.add(tag)
            logger.info(f"Created product tag: {tag_data['name']}")

    session.commit()
    logger.info("Product tags seeded successfully")


def _seed_product_categories(session: Session) -> None:
    import logging

    logger = logging.getLogger(__name__)

    categories = [
        {"name": "Bottles", "description": "Bottled spirits and liquors"},
        {"name": "Cans", "description": "Canned beverages and beers"},
        {"name": "Wines", "description": "Wine products"},
        {"name": "Others", "description": "Other products and miscellaneous items"},
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
    import logging

    logger = logging.getLogger(__name__)

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
