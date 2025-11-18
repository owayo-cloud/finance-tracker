import logging
import time
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.routing import APIRoute
from starlette.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware

from app.api.main import api_router
from app.core.config import settings
from app.core.logging_config import setup_logging, get_logger

# Setup logging
setup_logging(level=logging.INFO if settings.ENVIRONMENT == "local" else logging.WARNING)
logger = get_logger(__name__)


def custom_generate_unique_id(route: APIRoute) -> str:
    return f"{route.tags[0]}-{route.name}"


class LoggingMiddleware(BaseHTTPMiddleware):
    """Middleware to log HTTP requests and responses"""
    
    async def dispatch(self, request: Request, call_next):
        start_time = time.time()
        
        # Log request
        logger.info(
            f"→ {request.method} {request.url.path} | "
            f"Client: {request.client.host if request.client else 'unknown'}"
        )
        
        # Process request
        try:
            response = await call_next(request)
            process_time = time.time() - start_time
            
            # Log response
            status_color = (
                "\033[92m" if 200 <= response.status_code < 300
                else "\033[93m" if 300 <= response.status_code < 400
                else "\033[91m" if response.status_code >= 400
                else "\033[0m"
            )
            
            logger.info(
                f"← {request.method} {request.url.path} | "
                f"Status: {status_color}{response.status_code}\033[0m | "
                f"Time: {process_time:.3f}s"
            )
            
            return response
        except Exception as e:
            process_time = time.time() - start_time
            logger.error(
                f"✗ {request.method} {request.url.path} | "
                f"Error: {str(e)} | Time: {process_time:.3f}s",
                exc_info=True
            )
            raise


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager for startup and shutdown events"""
    # Startup
    logger.info("=" * 60)
    logger.info(f"🚀 Starting {settings.PROJECT_NAME}")
    logger.info(f"📍 Environment: {settings.ENVIRONMENT}")
    logger.info(f"🌐 API URL: {settings.API_V1_STR}")
    logger.info(f"🔗 Frontend: {settings.FRONTEND_HOST}")
    logger.info(f"🗄️  Database: {settings.POSTGRES_SERVER}:{settings.POSTGRES_PORT}/{settings.POSTGRES_DB}")
    logger.info("=" * 60)
    
    yield
    
    # Shutdown
    logger.info("=" * 60)
    logger.info(f"🛑 Shutting down {settings.PROJECT_NAME}")
    logger.info("=" * 60)


if settings.SENTRY_DSN and settings.ENVIRONMENT != "local":
    try:
        import sentry_sdk
        sentry_sdk.init(dsn=str(settings.SENTRY_DSN), enable_tracing=True)
        logger.info("✅ Sentry initialized")
    except ImportError:
        logger.warning("⚠️  Sentry SDK not installed, skipping Sentry initialization")

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    generate_unique_id_function=custom_generate_unique_id,
    lifespan=lifespan,
)

# Add logging middleware
app.add_middleware(LoggingMiddleware)

# Set all CORS enabled origins
if settings.all_cors_origins:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.all_cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    logger.info(f"✅ CORS enabled for origins: {settings.all_cors_origins}")

app.include_router(api_router, prefix=settings.API_V1_STR)
logger.info(f"✅ API router mounted at {settings.API_V1_STR}")
