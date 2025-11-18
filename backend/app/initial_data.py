import logging

from sqlmodel import Session

from app.core.db import engine, init_db
from app.core.logging_config import setup_logging, get_logger

setup_logging(level=logging.INFO)
logger = get_logger(__name__)


def init() -> None:
    logger.info("🔄 Creating initial data...")
    with Session(engine) as session:
        init_db(session)
    logger.info("✅ Initial data created successfully")


def main() -> None:
    logger.info("=" * 60)
    logger.info("📊 Initializing database with initial data")
    logger.info("=" * 60)
    init()
    logger.info("=" * 60)


if __name__ == "__main__":
    main()
