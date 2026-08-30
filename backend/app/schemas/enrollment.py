from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class EnrollmentBase(BaseModel):
    course_id: str
    learning_mode: str  # "online", "offline", "hybrid"

class EnrollmentCreate(EnrollmentBase):
    pass

class Enrollment(EnrollmentBase):
    id: str
    learner_id: str
    enrollment_date: datetime
    status: str  # "active", "completed", "cancelled"
    created_at: datetime
    updated_at: datetime
