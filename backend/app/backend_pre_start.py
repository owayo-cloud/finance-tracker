import logging

from sqlalchemy import Engine
from sqlmodel import Session, select
from tenacity import after_log, before_log, retry, stop_after_attempt, wait_fixed

from app.core.db import engine
from app.core.logging_config import setup_logging, get_logger

setup_logging(level=logging.INFO)
logger = get_logger(__name__)

max_tries = 60 * 5  # 5 minutes
wait_seconds = 1


@retry(
    stop=stop_after_attempt(max_tries),
    wait=wait_fixed(wait_seconds),
    before=before_log(logger, logging.INFO),
    after=after_log(logger, logging.WARN),
)
def init(db_engine: Engine) -> None:
    try:
        logger.info("🔄 Checking database connection...")
        with Session(db_engine) as session:
            # Try to create session to check if DB is awake
            session.exec(select(1))
        logger.info("✅ Database connection successful")
    except Exception as e:
        logger.error(f"❌ Database connection failed: {e}")
        raise e


def main() -> None:
    logger.info("=" * 60)
    logger.info("🚀 Initializing backend service")
    logger.info("=" * 60)
    init(engine)
    logger.info("✅ Backend service initialized successfully")
    logger.info("Service finished initializing")


if __name__ == "__main__":
    main()
