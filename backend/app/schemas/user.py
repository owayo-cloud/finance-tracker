"""
Pydantic schemas for User model.
Handles user creation, login, and response serialization.
"""

from datetime import datetime
from pydantic import BaseModel, EmailStr


# Shared properties
class UserBase(BaseModel):
    name: str
    email: EmailStr


# Schema for user creation (request body)
class UserCreate(UserBase):
    password: str


# Schema for login
class UserLogin(BaseModel):
    email: EmailStr
    password: str


# Schema for reading user data (response)
class UserResponse(UserBase):
    id: int
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True  # Allows ORM object conversion
