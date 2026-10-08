from fastapi import APIRouter, Depends, HTTPException, status
from typing import Dict, Any, List
from backend.app.api.deps import get_current_user
from backend.app.schemas.ai import (
    ChatMessageRequest,
    ChatSessionCreate,
    ChatSessionResponse,
    ChatMessageResponse,
    ChatResponse,
    CareerGuidanceRequest,
    CareerGuidanceResponse
)
from backend.app.services.ai_service import AIService
from backend.app.services.ai_safety_service import AISafetyService

router = APIRouter()

@router.post("/chat", response_model=ChatResponse)
async def chat_with_assistant(
    request: ChatMessageRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Send a message to the NariNexus AI Assistant.
    Retrieves history and context from JWT authenticated current_user.
    """
    user_id = current_user.get("id") or str(current_user.get("_id"))
    preferred_lang = current_user.get("preferred_language", "en")
    
    # 1. Apply Rate Limiting
    AISafetyService.apply_rate_limit(user_id)
    
    # 2. Clean and validate message
    message_content = AISafetyService.validate_input(request.message)
    message_content = AISafetyService.sanitize_input(message_content)

    # 3. Get or create session
    session_id = request.session_id
    if not session_id:
        # Create a new session with first user message preview as title
        title_preview = message_content[:30] + ("..." if len(message_content) > 30 else "")
        session = AIService.create_session(user_id=user_id, title=title_preview)
        session_id = session["session_id"]
    else:
        # Validate that the session exists and belongs to this user
        session = AIService.get_session(session_id=session_id, user_id=user_id)
        if not session:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Unauthorized access to chat session or session not found"
            )

    # 4. Add user message to history
    try:
        AIService.add_message(
            session_id=session_id,
            user_id=user_id,
            role="user",
            content=message_content
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to record message: {str(e)}"
        )

    # 5. Generate AI response (handles failure gracefully without 500ing)
    try:
        ai_response_content = AIService.generate_chat_response(
            user_id=user_id,
            message=message_content,
            session_id=session_id,
            preferred_language=preferred_lang
        )
    except Exception as e:
        ai_response_content = AISafetyService.safe_fallback("chatbot", preferred_lang)

    # 6. Apply responsible AI sanitization & data scrubbing on response
    ai_response_content = AISafetyService.sanitize_ai_response(ai_response_content)
    ai_response_content = AISafetyService.sensitive_data_filter(ai_response_content)

    # 7. Add model response to history
    try:
        AIService.add_message(
            session_id=session_id,
            user_id=user_id,
            role="model",
            content=ai_response_content
        )
    except Exception as e:
        pass

    return {
        "success": True,
        "response": ai_response_content,
        "session_id": session_id,
        "language": preferred_lang
    }

@router.post("/chat/sessions", response_model=Dict[str, Any])
async def create_new_chat_session(
    request: ChatSessionCreate,
    current_user: dict = Depends(get_current_user)
):
    """
    Explicitly create a new chat session for the current authenticated user.
    """
    user_id = current_user.get("id") or str(current_user.get("_id"))
    session = AIService.create_session(user_id=user_id, title=request.title)
    return {
        "success": True,
        "session": session
    }

@router.get("/chat/sessions", response_model=Dict[str, Any])
async def get_user_chat_sessions(
    current_user: dict = Depends(get_current_user)
):
    """
    Retrieve all chat sessions belonging to the current user.
    """
    user_id = current_user.get("id") or str(current_user.get("_id"))
    sessions = AIService.get_sessions(user_id=user_id)
    return {
        "success": True,
        "sessions": sessions
    }

@router.get("/chat/sessions/{session_id}/messages", response_model=Dict[str, Any])
async def get_chat_session_messages(
    session_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Retrieve all messages within a specific session, verified for current user isolation.
    """
    user_id = current_user.get("id") or str(current_user.get("_id"))
    
    # AIService.get_messages already validates that the session belongs to user_id
    messages = AIService.get_messages(session_id=session_id, user_id=user_id)
    session = AIService.get_session(session_id=session_id, user_id=user_id)
    if not session:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Unauthorized access to chat session or session not found"
        )
        
    return {
        "success": True,
        "messages": messages
    }

@router.post("/career-guidance", response_model=CareerGuidanceResponse)
async def get_career_guidance(
    request: CareerGuidanceRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Generate personalized career guidance, skill gap analysis, roadmaps, and
    entrepreneurship options based on the authenticated user's profile and learning history.
    """
    user_id = current_user.get("id") or str(current_user.get("_id"))
    preferred_lang = current_user.get("preferred_language", "en")
    
    # 1. Apply Rate Limiting
    AISafetyService.apply_rate_limit(user_id)
    
    # 2. Clean, Validate and Sanitize Goal Input
    clean_goal = None
    if request.goal:
        val_goal = AISafetyService.validate_input(request.goal)
        clean_goal = AISafetyService.sanitize_input(val_goal)
        
    # 3. Generate structured career guidance (either through live Gemini or multilingual fallback)
    try:
        guidance = AIService.generate_career_guidance(
            user_id=user_id,
            goal=clean_goal,
            preferred_language=preferred_lang
        )
        
        # 4. Apply safety validation & response scrubbing
        guidance = AISafetyService.validate_ai_response(guidance, "career_guidance", user_id=user_id)
        
        # Scrape sensitive elements if any
        if "general_advice" in guidance:
            guidance["general_advice"] = AISafetyService.sensitive_data_filter(guidance["general_advice"])
            guidance["general_advice"] = AISafetyService.sanitize_ai_response(guidance["general_advice"])
            
        return guidance
    except HTTPException as http_exc:
        raise http_exc
    except Exception as e:
        # Graceful recovery to safe fallback response
        fallback_data = AISafetyService.safe_fallback("career_guidance", preferred_lang)
        return fallback_data
