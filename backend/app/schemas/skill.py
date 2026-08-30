from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

class CategoryBase(BaseModel):
    name: str
    description: str
    icon: str
    image: Optional[str] = None
    translations: Optional[Dict[str, Dict[str, str]]] = Field(default_factory=dict)
    is_active: bool = True

class CategoryCreate(CategoryBase):
    pass

class Category(CategoryBase):
    id: str
    created_at: datetime

class SkillBase(BaseModel):
    category_id: str
    name: str
    description: str
    difficulty: str  # "Beginner", "Intermediate", "Advanced"
    estimated_duration: str
    prerequisites: List[str] = []
    career_options: List[str] = []
    translations: Optional[Dict[str, Dict[str, Any]]] = Field(default_factory=dict)
    is_active: bool = True

class SkillCreate(SkillBase):
    pass

class Skill(SkillBase):
    id: str
    created_at: datetime
