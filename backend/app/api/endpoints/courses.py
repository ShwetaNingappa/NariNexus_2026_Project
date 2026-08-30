from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import Dict, Any, List, Optional
from backend.app.api.deps import get_current_user
from backend.app.services.course_service import CourseService

router = APIRouter()

@router.get("/courses", response_model=Dict[str, Any])
async def get_courses(
    category_id: Optional[str] = Query(None, description="Filter courses by category ID"),
    skill_id: Optional[str] = Query(None, description="Filter courses by skill ID"),
    difficulty: Optional[str] = Query(None, description="Filter courses by difficulty (beginner, intermediate, advanced)"),
    learning_mode: Optional[str] = Query(None, description="Filter courses by learning mode (online, offline, hybrid)"),
    search: Optional[str] = Query(None, description="Search courses matching title, description, or instructor"),
    current_user: dict = Depends(get_current_user)
):
    """
    Retrieve all active courses with optional filters and backend search query.
    """
    lang = current_user.get("preferred_language", "en")
    courses = CourseService.get_courses(
        category_id=category_id,
        skill_id=skill_id,
        difficulty=difficulty,
        learning_mode=learning_mode,
        search_query=search,
        lang=lang
    )
    return {
        "success": True,
        "courses": courses
    }

@router.get("/courses/recommendations", response_model=Dict[str, Any])
async def get_recommended_courses(current_user: dict = Depends(get_current_user)):
    """
    Retrieve rule-based personalized course recommendations matching learner's profile parameters.
    """
    lang = current_user.get("preferred_language", "en")
    recommended = CourseService.get_personalized_recommendations(profile=current_user, lang=lang)
    return {
        "success": True,
        "courses": recommended
    }

@router.get("/courses/{id}", response_model=Dict[str, Any])
async def get_course(id: str, current_user: dict = Depends(get_current_user)):
    """
    Retrieve a single course by its ID.
    """
    lang = current_user.get("preferred_language", "en")
    course = CourseService.get_course_by_id(id, lang=lang)
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Course with ID {id} not found"
        )
    return {
        "success": True,
        "course": course
    }

@router.get("/skills/{skill_id}/courses", response_model=Dict[str, Any])
async def get_skill_courses(skill_id: str, current_user: dict = Depends(get_current_user)):
    """
    Retrieve all courses associated with a specific skill.
    """
    lang = current_user.get("preferred_language", "en")
    courses = CourseService.get_courses(skill_id=skill_id, lang=lang)
    return {
        "success": True,
        "courses": courses
    }

@router.get("/courses/{id}/lessons", response_model=Dict[str, Any])
async def get_course_lessons(id: str, current_user: dict = Depends(get_current_user)):
    """
    Retrieve all lessons associated with a specific course.
    """
    course = CourseService.get_course_by_id(id)
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Course with ID {id} not found"
        )
    lessons = CourseService.get_lessons_for_course(id)
    return {
        "success": True,
        "lessons": lessons
    }

@router.get("/courses/{id}/lessons/{lesson_id}", response_model=Dict[str, Any])
async def get_course_lesson_by_id(id: str, lesson_id: str, current_user: dict = Depends(get_current_user)):
    """
    Retrieve a single lesson by its ID inside a specific course.
    """
    lesson = CourseService.get_lesson_by_id(id, lesson_id)
    if not lesson:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Lesson with ID {lesson_id} not found in course {id}"
        )
        
    # Restrict non-preview lessons for learner role if they are not actively enrolled
    if current_user.get("role") == "learner" and not lesson.get("is_preview", False):
        from backend.app.services.enrollment_service import EnrollmentService
        enroll = EnrollmentService.get_enrollment_by_course_and_learner(id, current_user["id"])
        if not enroll or enroll.get("status") != "active":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="This lesson module is locked. Please enroll in the course to unlock full access."
            )
            
    return {
        "success": True,
        "lesson": lesson
    }
