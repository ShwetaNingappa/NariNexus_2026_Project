from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class LessonProgressResponse(BaseModel):
    id: str
    learner_id: str
    course_id: str
    lesson_id: str
    completed: bool
    completed_at: datetime
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True

class CourseProgressResponse(BaseModel):
    course_id: str
    total_lessons: int
    completed_lessons: int
    progress_percentage: int
    completed_lesson_ids: List[str]

class MyProgressResponseItem(BaseModel):
    course_id: str
    course_title: str
    completed_lessons: int
    total_lessons: int
    progress_percentage: int
    learning_mode: str
    status: str
    enrollment_id: str
