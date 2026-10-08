from fastapi import APIRouter, Depends, HTTPException, status
from typing import Dict, Any, List, Optional
from pydantic import BaseModel
from datetime import datetime
import uuid

from backend.app.api.deps import get_current_user
from backend.app.services.opportunity_service import OpportunityService
from backend.app.services.ai_safety_service import AISafetyService
from backend.app.core.database import db_instance

router = APIRouter()


class StepStatusUpdate(BaseModel):
    status: str

@router.get("", response_model=List[Dict[str, Any]])
async def list_opportunities(current_user: dict = Depends(get_current_user)):
    """
    List all platform demonstration opportunities.
    """
    return OpportunityService.get_opportunities()

@router.get("/recommended", response_model=List[Dict[str, Any]])
async def get_recommended_opportunities(current_user: dict = Depends(get_current_user)):
    """
    Get ranked opportunities matching the user's interests.
    """
    user_id = current_user.get("id") or str(current_user.get("_id"))
    return OpportunityService.get_recommended_opportunities(user_id)

@router.get("/action-plan", response_model=Dict[str, Any])
async def get_or_create_general_action_plan(current_user: dict = Depends(get_current_user)):
    """
    Retrieve or create the general career development action plan for this user.
    """
    user_id = current_user.get("id") or str(current_user.get("_id"))
    # Apply rate limiting for AI operations
    AISafetyService.apply_rate_limit(user_id)
    return OpportunityService.get_or_create_action_plan(user_id)

@router.get("/{opp_id}", response_model=Dict[str, Any])
async def get_opportunity_details(opp_id: str, current_user: dict = Depends(get_current_user)):
    """
    Retrieve details of a single opportunity.
    """
    opp = OpportunityService.get_opportunity_by_id(opp_id)
    if not opp:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Opportunity not found"
        )
    return opp

@router.get("/{opp_id}/match", response_model=Dict[str, Any])
async def get_opportunity_match_analysis(opp_id: str, current_user: dict = Depends(get_current_user)):
    """
    Evaluate deterministic and AI-powered skill matches and gaps for the specified opportunity.
    """
    user_id = current_user.get("id") or str(current_user.get("_id"))
    # Apply rate limiting for AI operations
    AISafetyService.apply_rate_limit(user_id)
    analysis = OpportunityService.get_opportunity_match_analysis(user_id, opp_id)
    if not analysis.get("success"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=analysis.get("message", "Could not analyze match")
        )
    return analysis

@router.post("/{opp_id}/action-plan", response_model=Dict[str, Any])
async def create_opportunity_action_plan(opp_id: str, current_user: dict = Depends(get_current_user)):
    """
    Force create/tailor an AI action plan specifically targeting this opportunity.
    """
    user_id = current_user.get("id") or str(current_user.get("_id"))
    # Apply rate limiting for AI operations
    AISafetyService.apply_rate_limit(user_id)
    res = OpportunityService.get_or_create_action_plan(user_id, opp_id)
    if not res.get("success"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=res.get("message", "Could not generate action plan")
        )
    return res

@router.patch("/action-plan/steps/{step_id}", response_model=Dict[str, Any])
async def update_action_plan_step(
    step_id: str, 
    payload: StepStatusUpdate,
    current_user: dict = Depends(get_current_user)
):
    """
    Update the status of an action step. Enforces user isolation.
    """
    user_id = current_user.get("id") or str(current_user.get("_id"))
    res = OpportunityService.update_action_plan_step(user_id, step_id, payload.status)
    if not res.get("success"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=res.get("message", "Could not update step status")
        )
    return res

@router.post("/{opp_id}/apply", response_model=Dict[str, Any])
async def apply_to_opportunity(opp_id: str, current_user: dict = Depends(get_current_user)):
    """
    Allow candidate learners to submit applications to listed opportunities.
    """
    user_id = str(current_user.get("id") or current_user.get("_id"))
    opp = OpportunityService.get_opportunity_by_id(opp_id)
    if not opp:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Opportunity not found"
        )
        
    db = db_instance.get_db()
    app_doc = {
        "opportunity_id": opp_id,
        "opportunity_title": opp.get("title", "Livelihood Opportunity"),
        "learner_id": user_id,
        "learner_name": current_user.get("name", "Candidate Learner"),
        "status": "Applied",
        "applied_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat()
    }
    
    if db is not None:
        # Prevent double application
        existing = db["applications"].find_one({"opportunity_id": opp_id, "learner_id": user_id})
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="You have already submitted an application to this opportunity."
            )
        res = db["applications"].insert_one(app_doc)
        app_doc["id"] = str(res.inserted_id)
        if "_id" in app_doc:
            del app_doc["_id"]
    else:
        # Mock file logic
        import json
        import os
        mock_apps_file = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "services", "mock_applications.json")
        apps = []
        if os.path.exists(mock_apps_file):
            try:
                with open(mock_apps_file, "r") as f:
                    apps = json.load(f)
            except Exception:
                pass
                
        # Check double application
        for a in apps:
            if a.get("opportunity_id") == opp_id and a.get("learner_id") == user_id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="You have already submitted an application to this opportunity."
                )
                
        app_id = f"app-{uuid.uuid4().hex[:6]}"
        app_doc["id"] = app_id
        apps.append(app_doc)
        try:
            with open(mock_apps_file, "w") as f:
                json.dump(apps, f, indent=2)
        except Exception:
            pass
            
    # Trigger a confirmation notification and alert communication safely
    try:
        from backend.app.services.notification_service import NotificationService
        NotificationService.create_notification(
            recipient_id=user_id,
            title="Application Submitted Successfully",
            message=f"You have successfully submitted your application for the opportunity: '{opp.get('title', 'Livelihood Opportunity')}'. We will review your application soon.",
            type="opportunity_update"
        )
    except Exception as e:
        import logging
        logging.getLogger("narinexus.opportunities").warning(f"Failed to create application confirmation notification: {str(e)}")
            
    return {
        "success": True,
        "message": "Application submitted successfully.",
        "application": app_doc
    }

