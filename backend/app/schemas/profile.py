from pydantic import BaseModel, Field
from typing import Optional, List

class ProfileUpdate(BaseModel):
    preferred_language: Optional[str] = None
    age: Optional[int] = Field(None, ge=1, le=120)
    location: Optional[str] = None
    education_level: Optional[str] = None
    existing_skills: Optional[List[str]] = None
    learning_interests: Optional[List[str]] = None
    learning_preference: Optional[str] = None
    career_goal: Optional[str] = None

class ProfileResponse(BaseModel):
    preferred_language: str
    age: Optional[int] = None
    location: Optional[str] = None
    education_level: Optional[str] = None
    existing_skills: List[str] = []
    learning_interests: List[str] = []
    learning_preference: Optional[str] = None
    career_goal: Optional[str] = None
    profile_completed: bool
    completion_percentage: int
