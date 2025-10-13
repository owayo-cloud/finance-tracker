import sys
import os

sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from logging.config import fileConfig
from sqlalchemy import engine_from_config, pool
from sqlalchemy import create_engine
from sqlalchemy.ext.asyncio import create_async_engine
from alembic import context
from app.db.base import Base
from app.core.config import settings

# Import all models here so Alembic can detect them
from app.models.user import User
from app.models.account import Account
from app.models.transaction import Transaction
from app.models.category import Category
from app.models.budget import Budget
from app.models.refresh_token import RefreshToken

# Alembic Config object
config = context.config

# Load .env database URL dynamically
config.set_main_option("sqlalchemy.url", settings.DATABASE_URL_SYNC)

# Interpret config file for Python logging.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata


def run_migrations_offline():
    """Run migrations in 'offline' mode."""
    url = config.get_main_option("sqlalchemy.url")
    context.configure(url=url, target_metadata=target_metadata, literal_binds=True, dialect_opts={"paramstyle": "named"})
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online():
    """Run migrations in 'online' mode."""
    connectable = create_engine(config.get_main_option("sqlalchemy.url"))
    with connectable.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata)
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
