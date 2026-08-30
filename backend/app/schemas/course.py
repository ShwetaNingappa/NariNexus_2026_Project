from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

class LessonBase(BaseModel):
    title: str
    description: str
    lesson_number: int
    content_type: str  # "video", "article", "document", "quiz"
    content: str
    duration: str
    is_preview: bool = False

class LessonCreate(LessonBase):
    course_id: str

class Lesson(LessonBase):
    id: str
    course_id: str
    created_at: datetime

class CourseBase(BaseModel):
    title: str
    description: str
    skill_id: str
    category_id: str
    thumbnail: str
    difficulty: str  # "beginner", "intermediate", "advanced"
    duration: str
    learning_mode: str  # "online", "offline", "hybrid"
    instructor: str
    prerequisites: List[str] = []
    career_outcomes: List[str] = []
    language: str = "en"
    translations: Optional[Dict[str, Dict[str, Any]]] = Field(default_factory=dict)
    is_active: bool = True

class CourseCreate(CourseBase):
    pass

class Course(CourseBase):
    id: str
    created_at: datetime
    updated_at: datetime
