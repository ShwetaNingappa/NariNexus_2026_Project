from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class ChatMessageRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=2000, description="The message from the user")
    session_id: Optional[str] = Field(None, description="Optional session ID to continue a conversation")

class ChatSessionCreate(BaseModel):
    title: Optional[str] = Field(None, max_length=100, description="Optional custom session title")

class ChatSessionResponse(BaseModel):
    session_id: str
    user_id: str
    title: str
    created_at: str

class ChatMessageResponse(BaseModel):
    message_id: str
    session_id: str
    role: str
    content: str
    timestamp: str

class ChatResponse(BaseModel):
    success: bool
    response: str
    session_id: str
    language: str

class CareerGuidanceRequest(BaseModel):
    goal: Optional[str] = Field(None, max_length=500, description="Optional custom career goal or guidance request prompt")

class CareerPathItem(BaseModel):
    title: str = Field(..., description="Name of the career path")
    description: str = Field(..., description="Detailed description of the career path")
    why_suitable: str = Field(..., description="Personalized reasoning of why this is suitable for the learner")
    required_skills: List[str] = Field(..., description="Skills required for this career path")
    existing_skills: List[str] = Field(..., description="Skills the learner already possesses")
    skill_gaps: List[str] = Field(..., description="Identified gaps the learner needs to bridge")
    recommended_learning: List[str] = Field(..., description="NariNexus or other courses/learning topics recommended")
    next_steps: List[str] = Field(..., description="Actionable next steps to take")

class EntrepreneurshipOption(BaseModel):
    title: str = Field(..., description="Name of the entrepreneurship option")
    description: str = Field(..., description="Detailed description of the small business option")
    why_suitable: str = Field(..., description="Personalized reasoning of why this fits the learner's background")
    required_skills: List[str] = Field(..., description="Required entrepreneurial/technical skills")
    existing_skills: List[str] = Field(..., description="Entrepreneurial/technical skills already possessed")
    skill_gaps: List[str] = Field(..., description="Identified technical/business skill gaps")
    recommended_learning: List[str] = Field(..., description="Courses/learning topics recommended")
    next_steps: List[str] = Field(..., description="Step-by-step starting guide for the small business")

class CareerGuidanceResponse(BaseModel):
    success: bool
    career_paths: List[CareerPathItem]
    entrepreneurship_options: List[EntrepreneurshipOption]
    general_advice: str
    language: str
