from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from enum import Enum

class UserRole(str, Enum):
    LEARNER = "learner"
    CENTRE = "centre"
    ADMIN = "admin"

class UserBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: str = Field(..., pattern=r"^[\w\.-]+@[\w\.-]+\.\w+$")
    phone: Optional[str] = None
    role: UserRole = UserRole.LEARNER
    preferred_language: str = Field("en", description="Preferred/native language")
    profile_completed: bool = False

class UserCreate(UserBase):
    password: str = Field(..., min_length=6, description="Plaintext password to be hashed")

class UserUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    preferred_language: Optional[str] = None
    profile_completed: Optional[bool] = None

class UserResponse(UserBase):
    id: str = Field(..., alias="_id")
    created_at: datetime
    updated_at: datetime

    class Config:
        populate_by_name = True
        json_encoders = {
            datetime: lambda dt: dt.isoformat()
        }
