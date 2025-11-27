import logging
import time
from collections.abc import Callable
from contextlib import asynccontextmanager
from typing import Any, cast

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.routing import APIRoute
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.middleware.cors import CORSMiddleware
from starlette.responses import Response

from app.api.main import api_router
from app.core.config import settings
from app.core.logging_config import get_logger, setup_logging

# Setup logging
setup_logging(
    level=logging.INFO if settings.ENVIRONMENT == "local" else logging.WARNING
)
logger = get_logger(__name__)


def custom_generate_unique_id(route: APIRoute) -> str:
    return f"{route.tags[0]}-{route.name}"


class LoggingMiddleware(BaseHTTPMiddleware):
    """Middleware to log HTTP requests and responses"""

    async def dispatch(
        self, request: Request, call_next: Callable[[Request], Any]
    ) -> Response:
        start_time = time.time()

        # Log request
        logger.info(
            f"-> {request.method} {request.url.path} | "
            f"Client: {request.client.host if request.client else 'unknown'}"
        )

        # Process request
        try:
            response = await call_next(request)
            process_time = time.time() - start_time

            # Log response
            status_color = (
                "\033[92m"
                if 200 <= response.status_code < 300
                else "\033[93m"
                if 300 <= response.status_code < 400
                else "\033[91m"
                if response.status_code >= 400
                else "\033[0m"
            )

            logger.info(
                f"<- {request.method} {request.url.path} | "
                f"Status: {status_color}{response.status_code}\033[0m | "
                f"Time: {process_time:.3f}s"
            )

            return cast(Response, response)
        except Exception as e:
            process_time = time.time() - start_time
            logger.error(
                f"X {request.method} {request.url.path} | "
                f"Error: {str(e)} | Time: {process_time:.3f}s",
                exc_info=True,
            )
            raise


@asynccontextmanager
async def lifespan(app: FastAPI) -> Any:
    """Lifespan context manager for startup and shutdown events"""
    # Startup
    logger.info("=" * 60)
    logger.info(f"Starting {settings.PROJECT_NAME}")
    logger.info(f"Environment: {settings.ENVIRONMENT}")
    logger.info(f"API URL: {settings.API_V1_STR}")
    logger.info(f"Frontend: {settings.FRONTEND_HOST}")
    logger.info(
        f"Database: {settings.POSTGRES_SERVER}:{settings.POSTGRES_PORT}/{settings.POSTGRES_DB}"
    )
    logger.info("=" * 60)

    yield

    # Shutdown
    logger.info("=" * 60)
    logger.info(f"Shutting down {settings.PROJECT_NAME}")
    logger.info("=" * 60)


if settings.SENTRY_DSN and settings.ENVIRONMENT != "local":
    try:
        import sentry_sdk  # type: ignore[import]

        sentry_sdk.init(dsn=str(settings.SENTRY_DSN), enable_tracing=True)
        logger.info("Sentry initialized")
    except ImportError:
        logger.warning("Sentry SDK not installed, skipping Sentry initialization")

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    generate_unique_id_function=custom_generate_unique_id,
    lifespan=lifespan,
)

# Always enable CORS - use configured origins or allow all in local development
cors_origins = (
    settings.all_cors_origins
    if settings.all_cors_origins
    else (["*"] if settings.ENVIRONMENT == "local" else [])
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins if cors_origins else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.add_middleware(LoggingMiddleware)


# Add global exception handler to ensure CORS headers on errors
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Ensure CORS headers are included in error responses"""
    logger.error(f"Global exception handler: {exc}", exc_info=True)
    origin = request.headers.get("origin")
    cors_headers = {}
    if origin and (
        origin in settings.all_cors_origins or settings.ENVIRONMENT == "local"
    ):
        cors_headers = {
            "Access-Control-Allow-Origin": origin,
            "Access-Control-Allow-Credentials": "true",
            "Access-Control-Allow-Methods": "*",
            "Access-Control-Allow-Headers": "*",
        }
    elif settings.ENVIRONMENT == "local":
        cors_headers = {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "*",
            "Access-Control-Allow-Headers": "*",
        }

    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"},
        headers=cors_headers,
    )


app.include_router(api_router, prefix=settings.API_V1_STR)
logger.info(f"API router mounted at {settings.API_V1_STR}")
