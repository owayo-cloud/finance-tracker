# 💰 Finance Tracker Backend (FastAPI)

This is the backend service for the **Finance Tracker** project — a personal finance management system built with **FastAPI**, **PostgreSQL**, and **SQLAlchemy (async)**.  
It provides secure **user authentication** using **JWT access and refresh tokens**.

---

## 🚀 Features Implemented So Far

- ✅ User registration with hashed passwords (using `bcrypt`)
- ✅ User login with email & password verification
- ✅ JWT **access** and **refresh token** generation
- ✅ Refresh tokens stored in the database with expiry & revocation support
- ✅ Async database integration using SQLAlchemy with PostgreSQL
- ✅ Pydantic schemas for request/response validation
- ✅ CORS middleware for frontend API access
- ✅ Configuration managed via `.env` and `settings.py`

---

## 🧱 Project Structure

finance-tracker/
│
├── backend/
│ ├── app/
│ │ ├── core/
│ │ │ ├── config.py # App settings & environment variables
│ │ │ ├── security.py # Password hashing & verification
│ │ ├── models/
│ │ │ ├── user.py # User model
│ │ │ ├── refresh_token.py # Refresh token model
│ │ ├── routers/
│ │ │ ├── auth.py # Auth routes (login, register)
│ │ ├── schemas/
│ │ │ ├── auth.py # Pydantic models (Login, Register, Token)
│ │ ├── services/
│ │ │ ├── auth_service.py # Auth service logic
│ │ │ ├── token_service.py # JWT creation logic
│ │ ├── main.py # FastAPI app entrypoint
│ │ └── db/
│ │ ├── session.py # Async SQLAlchemy session
│ │ ├── base.py # Base metadata
│ └── requirements.txt
│
└── README.md



---

## ⚙️ Setup Instructions

### 1️⃣ Clone the Repository
```bash
git clone https://github.com/owayo-cloud/finance-tracker.git
cd finance-tracker/backend 

### 1️⃣ Create a virtual environment

python -m venv .venv
source .venv/bin/activate   # (Linux/Mac)
# or
.venv\Scripts\activate      # (Windows)

### install dependencies
pip install -r requirements.txt

setup database
cd backend
Run Database Migrations

(If using Alembic or manual creation)

alembic upgrade head


Or create tables directly from SQLAlchemy if not using Alembic:

# inside a Python shell
from app.db.session import engine
from app.db.base import Base
await Base.metadata.create_all(bind=engine)

6️⃣ Start the Development Server
uvicorn app.main:app --reload

# Docker Setup
- setup postgres
docker run --name postgres -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=secret -p 5432:5432 -v ~/postgres_data:/data/db -d postgres:15-alpine
 - startup postgres
docker start postgres
 - stop postgres
docker stop postgres
 - create financedb
docker exec -it postgres createdb --username=postgres --owner=postgres financedb
 - access docker shell db
docker exec -it postgres psql -U postgres financedb


