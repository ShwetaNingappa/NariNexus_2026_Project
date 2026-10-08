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
    # Enhanced location fields for approximate distance calculation
    village: Optional[str] = Field("", max_length=100)
    city: Optional[str] = Field("", max_length=100)
    district: Optional[str] = Field("", max_length=100)
    state: Optional[str] = Field("", max_length=100)
    pincode: Optional[str] = Field("", pattern=r"^([0-9]{6})?$")
    latitude: Optional[float] = None
    longitude: Optional[float] = None

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
    # Enhanced optional location fields
    village: Optional[str] = ""
    city: Optional[str] = ""
    district: Optional[str] = ""
    state: Optional[str] = ""
    pincode: Optional[str] = ""
    latitude: Optional[float] = None
    longitude: Optional[float] = None
