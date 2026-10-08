from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class NotificationBase(BaseModel):
    recipient_id: str = Field(..., description="Recipient user ID")
    title: str = Field(..., min_length=2, max_length=150)
    message: str = Field(..., min_length=5)
    type: str = Field("system_notification", description="Type of notification")
    action_link: Optional[str] = None
    is_read: bool = False

class NotificationCreate(NotificationBase):
    pass

class NotificationResponse(NotificationBase):
    id: str = Field(..., alias="_id")
    created_at: datetime

    class Config:
        populate_by_name = True
        json_encoders = {
            datetime: lambda dt: dt.isoformat()
        }
