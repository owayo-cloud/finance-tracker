from fastapi import FastAPI
from app.core.config import settings
from app.db.session import async_engine
from app.db.base import Base

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION
)

# Create all tables
async def init_models():
    async with async_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

@app.on_event("startup")
async def startup_event():
    await init_models()

@app.get("/")
async def root():
    return {"message": "Welcome to the Finance Tracker API"}
