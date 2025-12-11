import json
import logging
import os

# Set required environment variables for OpenAPI generation
# These are only used during schema generation, not at runtime
os.environ.setdefault("PROJECT_NAME", "Finance Tracker")
os.environ.setdefault("POSTGRES_SERVER", "localhost")
os.environ.setdefault("POSTGRES_USER", "postgres")
os.environ.setdefault("POSTGRES_PASSWORD", "postgres")
os.environ.setdefault("FIRST_SUPERUSER", "admin@example.com")
os.environ.setdefault("FIRST_SUPERUSER_PASSWORD", "changethis")
os.environ.setdefault("SECRET_KEY", "just-for-generate-client-secret-key-for-generating-client")

from app.main import app

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def generate_openapi_schema() -> None:
    """Generate and write OpenAPI schema json file for the frontend."""
    # Generate OpenAPI schema
    openapi_schema = app.openapi()

    # Save to frontend directory
    with open("../frontend/openapi.json", "w", encoding="utf-8") as f:
        json.dump(openapi_schema, f, indent=2)

    logger.info("OpenAPI schema generated successfully!")


if __name__ == "__main__":
    generate_openapi_schema()
