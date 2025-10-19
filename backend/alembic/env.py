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
from app.models.models import *
# Alembic Config object
config = context.config

# Load .env database URL dynamically, but only override the alembic.ini
# value when we actually have a non-empty value from our settings. This
# avoids replacing a valid URL in alembic.ini with an empty string which
# would cause SQLAlchemy to fail parsing the URL.
db_url_from_settings = settings.DATABASE_URL_SYNC or settings.DATABASE_URL
if db_url_from_settings:
    config.set_main_option("sqlalchemy.url", db_url_from_settings)

# Interpret config file for Python logging.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

engine = create_engine(db_url_from_settings)
target_metadata = Base.metadata.create_all(engine)


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
