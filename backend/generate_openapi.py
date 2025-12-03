import json
import logging

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
