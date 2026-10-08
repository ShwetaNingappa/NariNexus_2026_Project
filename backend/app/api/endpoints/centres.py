from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import Dict, Any, List, Optional
from backend.app.api.deps import get_current_user
from backend.app.services.centre_service import CentreService
from backend.app.schemas.centre import CentreProfileCreate, CentreProfileUpdate, CentreProfileResponse
from backend.app.schemas.course import CentreCourseCreate, CentreCourseUpdate
from backend.app.services.course_service import CourseService
from backend.app.services.audit_service import AuditService

router = APIRouter()

def get_approved_centre_profile(current_user: dict) -> dict:
    if current_user.get("role") != "centre":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Only training centres can access this endpoint."
        )
    profile = CentreService.get_profile_by_user_id(current_user["id"])
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No centre profile found. Please complete profile setup first."
        )
    if profile.get("verification_status") not in ["approved", "pending"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Your training centre profile must be pending or approved by platform administrators."
        )
    return profile

@router.get("/me", response_model=Dict[str, Any])
async def get_my_centre_profile(current_user: dict = Depends(get_current_user)):
    """
    Get the authenticated centre user's own profile details.
    """
    if current_user.get("role") != "centre":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Only training centres can access this profile."
        )
    
    profile = CentreService.get_profile_by_user_id(current_user["id"])
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No centre profile found for this user. Please complete registration profile setup."
        )
    
    return {
        "success": True,
        "profile": profile
    }

@router.post("/profile", response_model=Dict[str, Any], status_code=status.HTTP_201_CREATED)
async def create_centre_profile(
    profile_in: CentreProfileCreate,
    current_user: dict = Depends(get_current_user)
):
    """
    Create a new centre profile. Only allowed for users with 'centre' role.
    """
    if current_user.get("role") != "centre":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Only training centres can create profiles."
        )
    
    try:
        profile_data = profile_in.model_dump()
        profile = CentreService.create_profile(current_user["id"], profile_data)
        return {
            "success": True,
            "message": "Centre profile registered successfully.",
            "profile": profile
        }
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.put("/profile", response_model=Dict[str, Any])
async def update_centre_profile(
    profile_in: CentreProfileUpdate,
    current_user: dict = Depends(get_current_user)
):
    """
    Update the authenticated centre's own profile.
    """
    if current_user.get("role") != "centre":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Only training centres can update profiles."
        )
    
    try:
        update_data = profile_in.model_dump(exclude_unset=True)
        # Prevent manual overwrite of user_id or verification_status through profile update
        update_data.pop("user_id", None)
        update_data.pop("verification_status", None)
        
        updated = CentreService.update_profile(current_user["id"], update_data)
        if not updated:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No profile found to update."
            )
        return {
            "success": True,
            "message": "Centre profile updated successfully.",
            "profile": updated
        }
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.get("/dashboard", response_model=Dict[str, Any])
async def get_centre_dashboard_overview(current_user: dict = Depends(get_current_user)):
    """
    Get basic dashboard stats for the authenticated training centre.
    """
    if current_user.get("role") != "centre":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Only training centres can access the dashboard."
        )
    
    profile = CentreService.get_profile_by_user_id(current_user["id"])
    
    learners_count = 0
    courses_count = 0
    completions_count = 0
    recent_activity = []
    
    if profile:
        learners = CentreService.get_associated_learners(profile["id"])
        learners_count = len(learners)
        
        unique_courses = set()
        from backend.app.services.enrollment_service import EnrollmentService
        for l in learners:
            enrollments = EnrollmentService.get_learner_enrollments(l["id"])
            for e in enrollments:
                unique_courses.add(e.get("course_id"))
                if e.get("status") == "completed":
                    completions_count += 1
                
                # Add to recent activity if active/completed
                recent_activity.append({
                    "learner_name": l.get("name"),
                    "course_title": e.get("course_title"),
                    "status": e.get("status"),
                    "date": e.get("enrollment_date")
                })
        courses_count = len(unique_courses)
        
        # Sort recent activity by date descending and limit to top 5
        recent_activity.sort(key=lambda x: x.get("date", ""), reverse=True)
        recent_activity = recent_activity[:5]
        
    return {
        "success": True,
        "centre_name": profile.get("centre_name") if profile else current_user.get("name"),
        "status": profile.get("verification_status") if profile else "incomplete",
        "overview": {
            "learners_count": learners_count,
            "courses_count": courses_count,
            "completions_count": completions_count
        },
        "recent_activity": recent_activity
    }

@router.get("/learners", response_model=Dict[str, Any])
async def get_associated_learners_list(
    search: Optional[str] = Query(None, description="Search by name, email, or phone"),
    language: Optional[str] = Query(None, description="Filter by preferred language"),
    education: Optional[str] = Query(None, description="Filter by education level"),
    preference: Optional[str] = Query(None, description="Filter by learning preference"),
    current_user: dict = Depends(get_current_user)
):
    """
    Get all learners registered with the authenticated training centre.
    """
    profile = get_approved_centre_profile(current_user)
    
    learners = CentreService.get_associated_learners(profile["id"])
    
    filtered_learners = []
    for l in learners:
        if search:
            q = search.strip().lower()
            name_match = q in l.get("name", "").lower()
            email_match = q in l.get("email", "").lower()
            phone_match = q in l.get("phone", "").lower() if l.get("phone") else False
            if not (name_match or email_match or phone_match):
                continue
        
        if language and l.get("preferred_language") != language:
            continue
            
        if education and l.get("education_level") != education:
            continue
            
        if preference and l.get("learning_preference") != preference:
            continue
            
        # Strip sensitive credentials before returning list
        l_copy = dict(l)
        l_copy.pop("password_hash", None)
        l_copy.pop("otp_hash", None)
        filtered_learners.append(l_copy)
        
    return {
        "success": True,
        "learners": filtered_learners
    }

@router.get("/learners/{learner_id}", response_model=Dict[str, Any])
async def get_learner_details(
    learner_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Get detailed profile, course enrollments, and learning progress of a specific learner associated with this centre.
    """
    profile = get_approved_centre_profile(current_user)
    
    from backend.app.services.user_service import UserService
    learner = UserService.get_user_by_id(learner_id)
    if not learner or learner.get("role") != "learner":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Learner not found."
        )
        
    if learner.get("training_centre_id") != profile["id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. This learner is not registered with your training centre."
        )
        
    from backend.app.services.enrollment_service import EnrollmentService
    from backend.app.services.progress_service import ProgressService
    
    enrollments = EnrollmentService.get_learner_enrollments(learner_id)
    progress_summary = ProgressService.get_my_learning_progress(learner_id)
    
    learner_data = dict(learner)
    learner_data.pop("password_hash", None)
    learner_data.pop("otp_hash", None)
    
    return {
        "success": True,
        "learner": learner_data,
        "enrollments": enrollments,
        "progress": progress_summary
    }

@router.get("/courses", response_model=Dict[str, Any])
async def get_my_centre_courses(
    current_user: dict = Depends(get_current_user)
):
    """
    Get all courses created by/associated with the authenticated training centre.
    """
    if current_user.get("role") != "centre":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Only training centres can access course management."
        )
    
    profile = CentreService.get_profile_by_user_id(current_user["id"])
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No centre profile found. Please complete profile setup first."
        )
        
    courses = CourseService.get_courses_by_centre(profile["id"])
    return {
        "success": True,
        "courses": courses
    }

@router.get("/courses/{course_id}", response_model=Dict[str, Any])
async def get_my_centre_course_details(
    course_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Get details of a specific course owned by this training centre.
    """
    if current_user.get("role") != "centre":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Only training centres can access course details."
        )
    
    profile = CentreService.get_profile_by_user_id(current_user["id"])
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No centre profile found."
        )
        
    course = CourseService.get_course_by_id_and_centre(course_id, profile["id"])
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found or access denied."
        )
        
    return {
        "success": True,
        "course": course
    }

@router.post("/courses", response_model=Dict[str, Any], status_code=status.HTTP_201_CREATED)
async def create_my_centre_course(
    course_in: CentreCourseCreate,
    current_user: dict = Depends(get_current_user)
):
    """
    Create a new course owned by this training centre.
    """
    if current_user.get("role") != "centre":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Only training centres can create courses."
        )
    
    profile = CentreService.get_profile_by_user_id(current_user["id"])
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No centre profile found. Please complete profile setup first."
        )
        
    try:
        course_data = course_in.model_dump()
        new_course = CourseService.create_course_by_centre(profile["id"], course_data)
        
        # Record audit event
        AuditService.record_audit_event(
            actor_user_id=current_user.get("id") or str(current_user.get("_id")),
            actor_role=current_user.get("role"),
            action="CENTRE_COURSE_CREATED",
            resource_type="COURSE",
            resource_id=new_course.get("id") if new_course else "unknown",
            success=True,
            metadata={"title": course_in.title}
        )
        
        return {
            "success": True,
            "message": "Course created successfully.",
            "course": new_course
        }
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.put("/courses/{course_id}", response_model=Dict[str, Any])
async def update_my_centre_course(
    course_id: str,
    course_in: CentreCourseUpdate,
    current_user: dict = Depends(get_current_user)
):
    """
    Update details of a course owned by this training centre.
    """
    if current_user.get("role") != "centre":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Only training centres can update courses."
        )
    
    profile = CentreService.get_profile_by_user_id(current_user["id"])
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No centre profile found."
        )
        
    try:
        update_data = course_in.model_dump(exclude_unset=True)
        updated = CourseService.update_course_by_centre(course_id, profile["id"], update_data)
        if not updated:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Course not found or access denied."
            )
            
        # Record audit event
        AuditService.record_audit_event(
            actor_user_id=current_user.get("id") or str(current_user.get("_id")),
            actor_role=current_user.get("role"),
            action="CENTRE_COURSE_UPDATED",
            resource_type="COURSE",
            resource_id=course_id,
            success=True,
            metadata=update_data
        )
            
        return {
            "success": True,
            "message": "Course updated successfully.",
            "course": updated
        }
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.patch("/courses/{course_id}/status", response_model=Dict[str, Any])
async def toggle_my_centre_course_status(
    course_id: str,
    status_in: Dict[str, str],
    current_user: dict = Depends(get_current_user)
):
    """
    Deactivate, activate, or draft a course owned by this training centre.
    """
    if current_user.get("role") != "centre":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Only training centres can update course status."
        )
    
    profile = CentreService.get_profile_by_user_id(current_user["id"])
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No centre profile found."
        )
        
    status_val = status_in.get("status")
    if not status_val or status_val not in ["active", "inactive", "draft"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Status must be 'active', 'inactive', or 'draft'."
        )
        
    try:
        updated = CourseService.toggle_course_status_by_centre(course_id, profile["id"], status_val)
        if not updated:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Course not found or access denied."
            )
            
        # Record audit event
        AuditService.record_audit_event(
            actor_user_id=current_user.get("id") or str(current_user.get("_id")),
            actor_role=current_user.get("role"),
            action="CENTRE_COURSE_STATUS_CHANGED",
            resource_type="COURSE",
            resource_id=course_id,
            success=True,
            metadata={"status": status_val}
        )
            
        return {
            "success": True,
            "message": f"Course status updated to '{status_val}' successfully.",
            "course": updated
        }
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("/progress", response_model=Dict[str, Any])
async def get_centre_progress_overview_endpoint(
    current_user: dict = Depends(get_current_user)
):
    """
    Get aggregated progress information for all learners associated with the authenticated training centre.
    """
    if current_user.get("role") != "centre":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Only training centres can access progress monitoring."
        )
    
    profile = CentreService.get_profile_by_user_id(current_user["id"])
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No centre profile found for this user. Please complete registration first."
        )
        
    from backend.app.services.progress_service import ProgressService
    overview = ProgressService.get_centre_progress_overview(profile["id"])
    
    return {
        "success": True,
        "overview": overview
    }

@router.get("/progress/learners/{learner_id}", response_model=Dict[str, Any])
async def get_learner_progress_breakdown_endpoint(
    learner_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Get detailed learning progress breakdown (including lesson-by-lesson) of a specific learner associated with this centre.
    """
    if current_user.get("role") != "centre":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Only training centres can access progress monitoring."
        )
    
    profile = CentreService.get_profile_by_user_id(current_user["id"])
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_444_NOT_FOUND if hasattr(status, "HTTP_444_NOT_FOUND") else 404,
            detail="No centre profile found."
        )
        
    from backend.app.services.progress_service import ProgressService
    try:
        breakdown = ProgressService.get_learner_progress_breakdown(learner_id, profile["id"])
        return {
            "success": True,
            **breakdown
        }
    except ValueError as e:
        msg = str(e)
        if "Access denied" in msg or "permission" in msg:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=msg
            )
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=msg
        )

@router.get("/progress/courses/{course_id}", response_model=Dict[str, Any])
async def get_course_progress_details_endpoint(
    course_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Get course-wise aggregated progress and learner breakdown for a specific course owned by this centre.
    """
    if current_user.get("role") != "centre":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Only training centres can access progress monitoring."
        )
    
    profile = CentreService.get_profile_by_user_id(current_user["id"])
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No centre profile found."
        )
        
    from backend.app.services.progress_service import ProgressService
    try:
        details = ProgressService.get_course_progress_details(course_id, profile["id"])
        return {
            "success": True,
            **details
        }
    except ValueError as e:
        msg = str(e)
        if "Access denied" in msg or "permission" in msg:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=msg
            )
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=msg
        )

@router.get("/analytics", response_model=Dict[str, Any])
async def get_centre_analytics_endpoint(current_user: dict = Depends(get_current_user)):
    """
    Get aggregated secure analytics for the authenticated training centre.
    """
    if current_user.get("role") != "centre":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Only training centres can access analytics."
        )
    
    profile = CentreService.get_profile_by_user_id(current_user["id"])
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No centre profile found for this user. Please complete registration first."
        )
        
    from backend.app.services.progress_service import ProgressService
    try:
        analytics = ProgressService.get_centre_analytics(profile["id"])
        return {
            "success": True,
            "analytics": analytics
        }
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.get("", response_model=Dict[str, Any])
async def discover_verified_centres(
    city: Optional[str] = Query(None, description="Filter centres by city"),
    district: Optional[str] = Query(None, description="Filter centres by district"),
    state: Optional[str] = Query(None, description="Filter centres by state")
):
    """
    Public read-only discovery endpoint. Returns only verified training centres.
    """
    centres = CentreService.list_verified_centres(city=city, district=district, state=state)
    return {
        "success": True,
        "centres": centres
    }

