from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import List, Dict, Any
from backend.app.api.deps import get_current_user
from backend.app.services.enrollment_service import EnrollmentService

router = APIRouter()

class EnrollRequest(BaseModel):
    course_id: str
    learning_mode: str

@router.post("/enrollments", response_model=Dict[str, Any])
async def create_enrollment(req: EnrollRequest, current_user: dict = Depends(get_current_user)):
    """
    Enroll the authenticated learner in a specific course.
    Only learners can enroll.
    """
    if current_user.get("role") != "learner":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only authenticated learners can enroll in courses"
        )
    
    try:
        enrollment = EnrollmentService.create_enrollment(
            learner_id=current_user["id"],
            course_id=req.course_id,
            learning_mode=req.learning_mode
        )
        return {
            "success": True,
            "enrollment": enrollment
        }
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.get("/enrollments/course/{course_id}", response_model=Dict[str, Any])
async def check_enrollment_status(course_id: str, current_user: dict = Depends(get_current_user)):
    """
    Check the current enrollment status of the authenticated learner for a specific course.
    """
    if current_user.get("role") != "learner":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only authenticated learners can access enrollment status"
        )
        
    enroll = EnrollmentService.get_enrollment_by_course_and_learner(course_id, current_user["id"])
    if not enroll:
        return {
            "success": True,
            "status": "not_enrolled"
        }
        
    return {
        "success": True,
        "enrolled": True,
        "status": enroll["status"],
        "learning_mode": enroll["learning_mode"],
        "enrollment_id": enroll["id"]
    }

@router.get("/enrollments/me", response_model=List[Dict[str, Any]])
async def get_my_enrollments(current_user: dict = Depends(get_current_user)):
    """
    Retrieve all course enrollments for the authenticated learner.
    """
    if current_user.get("role") != "learner":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only authenticated learners can retrieve their enrollments"
        )
        
    enrollments = EnrollmentService.get_learner_enrollments(current_user["id"])
    return enrollments

@router.delete("/enrollments/{enrollment_id}", response_model=Dict[str, Any])
async def cancel_enrollment(enrollment_id: str, current_user: dict = Depends(get_current_user)):
    """
    Cancel an existing active enrollment.
    """
    if current_user.get("role") != "learner":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only authenticated learners can cancel their enrollments"
        )
        
    try:
        cancelled = EnrollmentService.cancel_enrollment(enrollment_id, current_user["id"])
        return {
            "success": True,
            "enrollment": cancelled
        }
    except ValueError as e:
        msg = str(e)
        if "Permission denied" in msg:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=msg
            )
        elif "not found" in msg.lower():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=msg
            )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=msg
        )
