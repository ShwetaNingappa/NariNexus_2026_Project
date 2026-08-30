from fastapi import APIRouter, Depends, HTTPException, status
from typing import Dict, Any, List
from backend.app.api.deps import get_current_user
from backend.app.services.user_service import UserService
from backend.app.schemas.profile import ProfileUpdate, ProfileResponse

router = APIRouter()

def calculate_profile_completion(user: dict) -> int:
    points = 0
    total_points = 8
    
    if user.get("preferred_language"):
        points += 1
    if user.get("age"):
        points += 1
    if user.get("location"):
        points += 1
    if user.get("education_level"):
        points += 1
    if user.get("existing_skills") is not None:
        points += 1
    if user.get("learning_interests") and len(user.get("learning_interests")) > 0:
        points += 1
    if user.get("learning_preference"):
        points += 1
    if user.get("career_goal"):
        points += 1
        
    return int((points / total_points) * 100)

@router.get("", response_model=Dict[str, Any])
async def get_profile(current_user: dict = Depends(get_current_user)):
    """
    Retrieve the current authenticated user's profile.
    """
    completion_pct = calculate_profile_completion(current_user)
    
    # Return profile data
    return {
        "success": True,
        "profile": {
            "preferred_language": current_user.get("preferred_language", "en"),
            "age": current_user.get("age"),
            "location": current_user.get("location"),
            "education_level": current_user.get("education_level"),
            "existing_skills": current_user.get("existing_skills") or [],
            "learning_interests": current_user.get("learning_interests") or [],
            "learning_preference": current_user.get("learning_preference"),
            "career_goal": current_user.get("career_goal"),
            "profile_completed": current_user.get("profile_completed", False),
            "completion_percentage": completion_pct
        }
    }

@router.get("/me", response_model=Dict[str, Any])
async def get_profile_me_alias(current_user: dict = Depends(get_current_user)):
    """
    Alias endpoint for get_profile.
    """
    return await get_profile(current_user)

@router.put("", response_model=Dict[str, Any])
async def update_profile(
    profile_in: ProfileUpdate, 
    current_user: dict = Depends(get_current_user)
):
    """
    Update the current authenticated user's profile.
    """
    user_id = current_user["id"]
    
    # Convert incoming data to a dict of non-None values
    update_data = profile_in.model_dump(exclude_unset=True)
    
    # Merge values temporarily to compute completion state
    temp_user = {**current_user, **update_data}
    completion_pct = calculate_profile_completion(temp_user)
    
    # Set profile_completed automatically if all steps are done
    if completion_pct == 100:
        update_data["profile_completed"] = True
    else:
        update_data["profile_completed"] = False
        
    # Update fields in the user record
    success = UserService.update_user_fields(user_id, update_data)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update user profile"
        )
        
    # Get the updated user state
    updated_user = UserService.get_user_by_id(user_id) or temp_user
    final_completion_pct = calculate_profile_completion(updated_user)
    
    return {
        "success": True,
        "message": "Profile updated successfully",
        "profile": {
            "preferred_language": updated_user.get("preferred_language", "en"),
            "age": updated_user.get("age"),
            "location": updated_user.get("location"),
            "education_level": updated_user.get("education_level"),
            "existing_skills": updated_user.get("existing_skills") or [],
            "learning_interests": updated_user.get("learning_interests") or [],
            "learning_preference": updated_user.get("learning_preference"),
            "career_goal": updated_user.get("career_goal"),
            "profile_completed": updated_user.get("profile_completed", False),
            "completion_percentage": final_completion_pct
        }
    }
