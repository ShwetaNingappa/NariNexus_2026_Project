import re
from pydantic import BaseModel, Field, field_validator
from typing import Optional, List, Dict, Any
from datetime import datetime

def extract_youtube_video_id(url: str) -> Optional[str]:
    if not url:
        return None
    url_str = str(url).strip()
    match = re.search(r'(?:youtube\.com/watch\?v=|youtu\.be/|youtube\.com/embed/|youtube\.com/shorts/)([a-zA-Z0-9_-]{11})', url_str)
    if match:
        return match.group(1)
    return None

class VideoSchema(BaseModel):
    title: str = Field(..., min_length=1)
    youtube_url: str
    description: Optional[str] = None
    order: Optional[int] = None

    @field_validator("youtube_url")
    @classmethod
    def validate_youtube(cls, v: str) -> str:
        video_id = extract_youtube_video_id(v)
        if not video_id:
            raise ValueError("Invalid YouTube URL. Supported formats: watch?v=ID, youtu.be/ID, embed/ID")
        return v

class OnlineTrainingSchema(BaseModel):
    videos: List[VideoSchema] = []

class OfflineTrainingSchema(BaseModel):
    centre_name: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    district: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None

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
    online_training: Optional[OnlineTrainingSchema] = None
    offline_training: Optional[OfflineTrainingSchema] = None

class CourseCreate(CourseBase):
    pass

class Course(CourseBase):
    id: str
    created_at: datetime
    updated_at: datetime

class CentreCourseCreate(BaseModel):
    title: str = Field(..., min_length=3, max_length=100)
    description: str = Field(..., min_length=10)
    skill_id: str
    category_id: str
    thumbnail: Optional[str] = "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=600&q=80"
    difficulty: str  # "beginner", "intermediate", "advanced"
    duration: str
    learning_mode: str  # "online", "offline", "hybrid"
    instructor: str
    prerequisites: List[str] = []
    career_outcomes: List[str] = []
    language: str = "en"
    status: str = "active"  # "active", "inactive", "draft"
    online_training: Optional[OnlineTrainingSchema] = None
    offline_training: Optional[OfflineTrainingSchema] = None

class CentreCourseUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=3, max_length=100)
    description: Optional[str] = Field(None, min_length=10)
    skill_id: Optional[str] = None
    category_id: Optional[str] = None
    thumbnail: Optional[str] = None
    difficulty: Optional[str] = None  # "beginner", "intermediate", "advanced"
    duration: Optional[str] = None
    learning_mode: Optional[str] = None  # "online", "offline", "hybrid"
    instructor: Optional[str] = None
    prerequisites: Optional[List[str]] = None
    career_outcomes: Optional[List[str]] = None
    status: Optional[str] = None  # "active", "inactive", "draft"
    online_training: Optional[OnlineTrainingSchema] = None
    offline_training: Optional[OfflineTrainingSchema] = None

class MongoCourse(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    title: str
    description: str
    category: str
    center_id: str
    is_online: bool

    class Config:
        populate_by_name = True
        allow_population_by_field_name = True
        json_schema_extra = {
            "example": {
                "title": "Computer Basics for Women",
                "description": "Essential computer literacy training.",
                "category": "Digital Literacy",
                "center_id": "6ac3ba68b8213d3e4f7de83a",
                "is_online": True
            }
        }
