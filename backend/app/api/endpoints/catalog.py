from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import Dict, Any, List, Optional
from backend.app.api.deps import get_current_user
from backend.app.services.skill_service import SkillService

router = APIRouter()

@router.get("/categories", response_model=Dict[str, Any])
async def get_categories(current_user: dict = Depends(get_current_user)):
    """
    Retrieve all active skill categories.
    Respects the current user's preferred language if translations exist.
    """
    lang = current_user.get("preferred_language", "en")
    categories = SkillService.get_categories(lang=lang)
    return {
        "success": True,
        "categories": categories
    }

@router.get("/categories/{id}", response_model=Dict[str, Any])
async def get_category(id: str, current_user: dict = Depends(get_current_user)):
    """
    Retrieve details of a single category by its ID.
    """
    lang = current_user.get("preferred_language", "en")
    category = SkillService.get_category_by_id(id, lang=lang)
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Category with ID {id} not found"
        )
    return {
        "success": True,
        "category": category
    }

@router.get("/skills", response_model=Dict[str, Any])
async def get_skills(
    category: Optional[str] = Query(None, description="Filter by category ID"),
    difficulty: Optional[str] = Query(None, description="Filter by difficulty (Beginner, Intermediate, Advanced)"),
    search: Optional[str] = Query(None, description="Search term matching skill name or description"),
    current_user: dict = Depends(get_current_user)
):
    """
    Retrieve all active skills, supporting filters for category, difficulty, and backend search.
    """
    lang = current_user.get("preferred_language", "en")
    skills = SkillService.get_skills(
        category_id=category,
        difficulty=difficulty,
        search_query=search,
        lang=lang
    )
    return {
        "success": True,
        "skills": skills
    }

@router.get("/skills/recommendations", response_model=Dict[str, Any])
async def get_recommended_skills(current_user: dict = Depends(get_current_user)):
    """
    Retrieve rule-based personalized skill recommendations matching the learner's profile interests, career goals, etc.
    """
    lang = current_user.get("preferred_language", "en")
    recommended = SkillService.get_rule_based_recommendations(profile=current_user, lang=lang)
    return {
        "success": True,
        "skills": recommended
    }

@router.get("/skills/{id}", response_model=Dict[str, Any])
async def get_skill(id: str, current_user: dict = Depends(get_current_user)):
    """
    Retrieve a single skill by ID.
    """
    lang = current_user.get("preferred_language", "en")
    skill = SkillService.get_skill_by_id(id, lang=lang)
    if not skill:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Skill with ID {id} not found"
        )
    return {
        "success": True,
        "skill": skill
    }

@router.get("/categories/{id}/skills", response_model=Dict[str, Any])
async def get_category_skills(
    id: str,
    difficulty: Optional[str] = Query(None, description="Filter by difficulty"),
    search: Optional[str] = Query(None, description="Search query inside this category"),
    current_user: dict = Depends(get_current_user)
):
    """
    Retrieve all active skills inside a specific category, supporting difficulty and search filtering.
    """
    lang = current_user.get("preferred_language", "en")
    # Verify first that category exists
    category = SkillService.get_category_by_id(id, lang=lang)
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Category with ID {id} not found"
        )
    
    skills = SkillService.get_skills(
        category_id=id,
        difficulty=difficulty,
        search_query=search,
        lang=lang
    )
    return {
        "success": True,
        "category": category,
        "skills": skills
    }
