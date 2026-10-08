from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Dict, Any
from backend.app.api.deps import get_current_user
from backend.app.services.progress_service import ProgressService

router = APIRouter()

@router.post("/lessons/{lesson_id}/complete", response_model=Dict[str, Any])
async def mark_lesson_complete(lesson_id: str, current_user: dict = Depends(get_current_user)):
    """
    Mark a lesson as completed for the authenticated learner.
    """
    if current_user.get("role") != "learner":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only learners can track course progress"
        )
    try:
        progress = ProgressService.mark_lesson_complete(current_user["id"], lesson_id)
        return {
            "success": True,
            "progress": progress
        }
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.delete("/lessons/{lesson_id}/complete", response_model=Dict[str, Any])
async def uncomplete_lesson(lesson_id: str, current_user: dict = Depends(get_current_user)):
    """
    Unmark a lesson as completed for the authenticated learner.
    """
    if current_user.get("role") != "learner":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only learners can track course progress"
        )
    try:
        success = ProgressService.uncomplete_lesson(current_user["id"], lesson_id)
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Lesson completion record not found or already uncompleted"
            )
        return {
            "success": True,
            "message": "Lesson progress reverted successfully"
        }
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.get("/courses/{course_id}", response_model=Dict[str, Any])
async def get_course_progress(course_id: str, current_user: dict = Depends(get_current_user)):
    """
    Retrieve dynamic course progress parameters for a specific course.
    """
    if current_user.get("role") != "learner":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only learners can view progress reports"
        )
    
    progress_info = ProgressService.get_course_progress(current_user["id"], course_id)
    return progress_info

@router.get("/me", response_model=List[Dict[str, Any]])
async def get_my_progress(current_user: dict = Depends(get_current_user)):
    """
    Retrieve progress list for all enrolled courses of the authenticated learner.
    """
    if current_user.get("role") != "learner":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only learners can view their overall progress"
        )
    
    progress_list = ProgressService.get_my_learning_progress(current_user["id"])
    return progress_list
