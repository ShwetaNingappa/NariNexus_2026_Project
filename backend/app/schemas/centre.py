from pydantic import BaseModel, Field, model_validator
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum
import re

class VerificationStatus(str, Enum):
    PENDING = "pending"
    VERIFIED = "verified"
    REJECTED = "rejected"

class YouTubeVideo(BaseModel):
    title: str = Field(..., min_length=2, max_length=150)
    youtube_url: str = Field(..., min_length=10, max_length=300)
    description: Optional[str] = Field("", max_length=1000)
    duration: Optional[str] = Field("10 mins", max_length=100)
    order: Optional[int] = Field(1, ge=1)

class OnlineTraining(BaseModel):
    videos: List[YouTubeVideo] = Field(default_factory=list)

class OfflineTraining(BaseModel):
    address: str = Field(..., min_length=5, max_length=300)
    village: Optional[str] = Field("", max_length=100)
    city: str = Field(..., min_length=2, max_length=100)
    district: str = Field(..., min_length=2, max_length=100)
    state: str = Field(..., min_length=2, max_length=100)
    pincode: str = Field(..., pattern=r"^[0-9]{6}$")
    latitude: Optional[float] = Field(None)
    longitude: Optional[float] = Field(None)
    available_days: str = Field(..., min_length=2, max_length=100)
    start_time: str = Field(..., min_length=2, max_length=50)
    end_time: str = Field(..., min_length=2, max_length=50)

class CentreProfileBase(BaseModel):
    centre_name: str = Field(..., min_length=2, max_length=150)
    description: str = Field(..., min_length=10, max_length=1000)
    contact_phone: str = Field(..., pattern=r"^[0-9+\-\s]{10,15}$")
    email: str = Field(..., pattern=r"^[\w\.-]+@[\w\.-]+\.\w+$")
    address: str = Field(..., min_length=5, max_length=300)
    city: str = Field(..., min_length=2, max_length=100)
    district: str = Field(..., min_length=2, max_length=100)
    state: str = Field(..., min_length=2, max_length=100)
    pincode: str = Field(..., pattern=r"^[0-9]{6}$")
    location: Optional[str] = Field(None, description="Coordinates or google maps link")
    facilities: Optional[List[str]] = Field(default_factory=list)
    logo: Optional[str] = None
    cover_image: Optional[str] = None
    training_mode: str = Field("online", pattern="^(online|offline|hybrid)$")
    online_training: Optional[OnlineTraining] = None
    offline_training: Optional[OfflineTraining] = None

class CentreProfileCreate(CentreProfileBase):
    @model_validator(mode="after")
    def validate_training_mode_details(self) -> "CentreProfileCreate":
        mode = self.training_mode
        online = self.online_training
        offline = self.offline_training

        def is_valid_youtube(url: str) -> bool:
            if not url:
                return False
            # Safe YouTube URL matching patterns
            pattern = r"^(https?://)?(www\.)?(youtube\.com|youtu\.be|youtube-nocookie\.com)/.+$"
            return bool(re.match(pattern, url))

        if mode == "online" or mode == "hybrid":
            if not online or not online.videos or len(online.videos) == 0:
                raise ValueError("At least one YouTube video is required for online/hybrid training.")
            for idx, video in enumerate(online.videos):
                if not is_valid_youtube(video.youtube_url):
                    raise ValueError(f"Video {idx+1} has an invalid YouTube URL. Only trusted YouTube links are accepted.")

        if mode == "offline" or mode == "hybrid":
            if not offline:
                raise ValueError("Offline training details are required for offline/hybrid training.")
            if not offline.address or not offline.city or not offline.district or not offline.state or not offline.pincode:
                raise ValueError("Complete location details (address, city, district, state, pin) are required for offline/hybrid training.")
            if not offline.available_days or not offline.start_time or not offline.end_time:
                raise ValueError("Schedule information (available days and timings) is required for offline/hybrid training.")

        return self

class CentreProfileUpdate(BaseModel):
    centre_name: Optional[str] = Field(None, min_length=2, max_length=150)
    description: Optional[str] = Field(None, min_length=10, max_length=1000)
    contact_phone: Optional[str] = Field(None, pattern=r"^[0-9+\-\s]{10,15}$")
    email: Optional[str] = Field(None, pattern=r"^[\w\.-]+@[\w\.-]+\.\w+$")
    address: Optional[str] = Field(None, min_length=5, max_length=300)
    city: Optional[str] = Field(None, min_length=2, max_length=100)
    district: Optional[str] = Field(None, min_length=2, max_length=100)
    state: Optional[str] = Field(None, min_length=2, max_length=100)
    pincode: Optional[str] = Field(None, pattern=r"^[0-9]{6}$")
    location: Optional[str] = None
    facilities: Optional[List[str]] = None
    logo: Optional[str] = None
    cover_image: Optional[str] = None
    training_mode: Optional[str] = Field(None, pattern="^(online|offline|hybrid)$")
    online_training: Optional[OnlineTraining] = None
    offline_training: Optional[OfflineTraining] = None

    @model_validator(mode="after")
    def validate_training_mode_details_update(self) -> "CentreProfileUpdate":
        mode = self.training_mode
        if mode is None:
            return self
            
        online = self.online_training
        offline = self.offline_training

        def is_valid_youtube(url: str) -> bool:
            if not url:
                return False
            pattern = r"^(https?://)?(www\.)?(youtube\.com|youtu\.be|youtube-nocookie\.com)/.+$"
            return bool(re.match(pattern, url))

        if mode == "online" or mode == "hybrid":
            if not online or not online.videos or len(online.videos) == 0:
                raise ValueError("At least one YouTube video is required for online/hybrid training.")
            for idx, video in enumerate(online.videos):
                if not is_valid_youtube(video.youtube_url):
                    raise ValueError(f"Video {idx+1} has an invalid YouTube URL. Only trusted YouTube links are accepted.")

        if mode == "offline" or mode == "hybrid":
            if not offline:
                raise ValueError("Offline training details are required for offline/hybrid training.")
            if not offline.address or not offline.city or not offline.district or not offline.state or not offline.pincode:
                raise ValueError("Complete location details (address, city, district, state, pin) are required for offline/hybrid training.")
            if not offline.available_days or not offline.start_time or not offline.end_time:
                raise ValueError("Schedule information (available days and timings) is required for offline/hybrid training.")

        return self

class CentreProfileResponse(CentreProfileBase):
    id: str = Field(..., alias="_id")
    user_id: str
    verification_status: VerificationStatus = VerificationStatus.PENDING
    created_at: datetime
    updated_at: datetime

    class Config:
        populate_by_name = True
        json_encoders = {
            datetime: lambda dt: dt.isoformat()
        }
