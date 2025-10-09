from fastapi import FastAPI
from .routers import transactions, users
from .database import Base, engine

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Finance Tracker API")

app.include_router(users.router)
app.include_router(transactions.router)

@app.get("/")
def root():
    return {"message": "Finance Tracker API running"}