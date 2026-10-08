from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field
from datetime import datetime
import os
import json
import uuid

from backend.app.api.deps import get_current_user
from backend.app.core.database import db_instance
from backend.app.schemas.user import UserRole

import logging
logger = logging.getLogger("narinexus")

router = APIRouter()

# Paths to mock files for safe fallback counting & CRUD operations
from backend.app.services.user_service import load_mock_users, save_mock_users
from backend.app.services.centre_service import load_mock_centres, save_mock_centres
from backend.app.services.course_service import load_mock_data, save_mock_data, MOCK_COURSES_FILE
from backend.app.services.skill_service import MOCK_SKILLS_FILE, MOCK_CATEGORIES_FILE
from backend.app.services.opportunity_service import load_mock_opportunities
from backend.app.services.audit_service import AuditService

MOCK_OPPORTUNITIES_FILE = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "services", "mock_opportunities.json")
MOCK_APPLICATIONS_FILE = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "services", "mock_applications.json")

def load_mock_applications() -> List[Dict[str, Any]]:
    if not os.path.exists(MOCK_APPLICATIONS_FILE):
        return []
    try:
        with open(MOCK_APPLICATIONS_FILE, "r") as f:
            return json.load(f)
    except Exception:
        return []

def save_mock_applications(apps: List[Dict[str, Any]]):
    try:
        with open(MOCK_APPLICATIONS_FILE, "w") as f:
            json.dump(apps, f, indent=2)
    except Exception:
        pass

def save_mock_opportunities_raw(opps: List[Dict[str, Any]]):
    try:
        with open(MOCK_OPPORTUNITIES_FILE, "w") as f:
            json.dump(opps, f, indent=2)
    except Exception:
        pass


# --- Pydantic Schemas for Admin Input Validation ---

class StatusUpdatePayload(BaseModel):
    is_active: bool

class RoleUpdatePayload(BaseModel):
    role: str

class SkillAdminCreate(BaseModel):
    category_id: str = Field(..., min_length=2)
    name: str = Field(..., min_length=2)
    description: str = Field(..., min_length=5)
    difficulty: str = Field("Beginner", pattern="^(Beginner|Intermediate|Advanced)$")
    estimated_duration: str = Field(..., min_length=2)
    prerequisites: List[str] = []
    career_options: List[str] = []

class SkillAdminUpdate(BaseModel):
    category_id: Optional[str] = None
    name: Optional[str] = None
    description: Optional[str] = None
    difficulty: Optional[str] = None
    estimated_duration: Optional[str] = None
    prerequisites: Optional[List[str]] = None
    career_options: Optional[List[str]] = None
    is_active: Optional[bool] = None

class CourseAdminCreate(BaseModel):
    title: str = Field(..., min_length=3)
    description: str = Field(..., min_length=10)
    skill_id: str
    category_id: str
    thumbnail: str = "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=600&q=80"
    difficulty: str = Field("beginner", pattern="^(beginner|intermediate|advanced)$")
    duration: str
    learning_mode: str = Field("online", pattern="^(online|offline|hybrid)$")
    instructor: str

class CourseAdminUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    skill_id: Optional[str] = None
    category_id: Optional[str] = None
    thumbnail: Optional[str] = None
    difficulty: Optional[str] = None
    duration: Optional[str] = None
    learning_mode: Optional[str] = None
    instructor: Optional[str] = None
    is_active: Optional[bool] = None

class OpportunityAdminCreate(BaseModel):
    title: str = Field(..., min_length=3)
    organization: str = Field(..., min_length=2)
    description: str = Field(..., min_length=10)
    opportunity_type: str = Field("livelihood", pattern="^(livelihood|employment|entrepreneurship|gig)$")
    location: str
    required_skills: List[str] = []
    eligibility: str
    deadline: str
    compensation: Optional[str] = "Stipend / Grant"

class OpportunityAdminUpdate(BaseModel):
    title: Optional[str] = None
    organization: Optional[str] = None
    description: Optional[str] = None
    opportunity_type: Optional[str] = None
    location: Optional[str] = None
    required_skills: Optional[List[str]] = None
    eligibility: Optional[str] = None
    deadline: Optional[str] = None
    compensation: Optional[str] = None
    is_active: Optional[bool] = None

class ApplicationStatusUpdatePayload(BaseModel):
    status: str = Field(..., pattern="^(Applied|Under Review|Shortlisted|Accepted|Rejected|Withdrawn)$")


# --- Auth Helper ---
def require_admin(current_user: dict = Depends(get_current_user)):
    if current_user.get("role") != UserRole.ADMIN and current_user.get("role") != "admin":
        AuditService.record_audit_event(
            actor_user_id=current_user.get("id") or str(current_user.get("_id")),
            actor_role=current_user.get("role"),
            action="UNAUTHORIZED_ACCESS_ATTEMPT",
            resource_type="ADMIN_API",
            resource_id="system",
            success=False,
            metadata={"detail": "Attempted to call require_admin checkpoint."}
        )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Only system administrators can access this endpoint."
        )
    return current_user


# ==========================================
# PHASE 6.6 — OVERVIEW
# ==========================================

@router.get("/overview", response_model=Dict[str, Any])
async def get_admin_overview(_: dict = Depends(require_admin)):
    try:
        db = db_instance.get_db()
        if db is not None:
            total_users = db["users"].count_documents({})
            total_learners = db["users"].count_documents({"role": "learner"})
            total_training_centres = db["centres"].count_documents({})
            total_courses = db["courses"].count_documents({})
            total_skills = db["skills"].count_documents({})
            total_opportunities = db["opportunities"].count_documents({})
        else:
            users = load_mock_users()
            total_users = len(users)
            total_learners = len([u for u in users.values() if u.get("role") == "learner"])
            total_training_centres = len(load_mock_centres())
            total_courses = len(load_mock_data(MOCK_COURSES_FILE))
            total_skills = len(load_mock_data(MOCK_SKILLS_FILE))
            total_opportunities = len(load_mock_opportunities())
            
        return {
            "success": True,
            "data": {
                "total_users": total_users,
                "total_learners": total_learners,
                "total_training_centres": total_training_centres,
                "total_courses": total_courses,
                "total_skills": total_skills,
                "total_opportunities": total_opportunities
            }
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database aggregation failed: {str(e)}"
        )


# ==========================================
# PHASE 6.7 — USER & ROLE MANAGEMENT
# ==========================================

@router.get("/users", response_model=Dict[str, Any])
async def list_users(
    search: Optional[str] = None,
    role: Optional[str] = None,
    active: Optional[bool] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    _: dict = Depends(require_admin)
):
    db = db_instance.get_db()
    try:
        users_list = []
        if db is not None:
            query = {}
            if search:
                import re
                safe_search = re.escape(str(search).strip())
                query["$or"] = [
                    {"name": {"$regex": safe_search, "$options": "i"}},
                    {"email": {"$regex": safe_search, "$options": "i"}}
                ]
            if role:
                query["role"] = role
            if active is not None:
                query["is_active"] = active

            total = db["users"].count_documents(query)
            cursor = db["users"].find(query).skip((page - 1) * limit).limit(limit)
            for u in cursor:
                # Scrub sensitive authentication details
                scrubbed = dict(u)
                scrubbed["id"] = str(scrubbed.pop("_id"))
                scrubbed.pop("password_hash", None)
                scrubbed.pop("otp_hash", None)
                scrubbed.pop("otp_expiry", None)
                users_list.append(scrubbed)
        else:
            all_users = load_mock_users()
            filtered = list(all_users.values())
            
            if search:
                s = search.lower()
                filtered = [u for u in filtered if s in u.get("name", "").lower() or s in u.get("email", "").lower()]
            if role:
                filtered = [u for u in filtered if u.get("role") == role]
            if active is not None:
                filtered = [u for u in filtered if u.get("is_active", True) == active]

            total = len(filtered)
            start_idx = (page - 1) * limit
            sliced = filtered[start_idx:start_idx + limit]
            
            for u in sliced:
                scrubbed = dict(u)
                scrubbed.pop("password_hash", None)
                scrubbed.pop("otp_hash", None)
                scrubbed.pop("otp_expiry", None)
                users_list.append(scrubbed)

        return {
            "success": True,
            "users": users_list,
            "total": total,
            "page": page,
            "limit": limit
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to query users: {str(e)}")

@router.put("/users/{user_id}/status", response_model=Dict[str, Any])
async def update_user_status(user_id: str, payload: StatusUpdatePayload, current_user: dict = Depends(require_admin)):
    db = db_instance.get_db()
    
    # 1. Protection against Lockout
    if user_id == str(current_user.get("id") or current_user.get("_id")):
        if not payload.is_active:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="You cannot deactivate your own root administrator account.")

    try:
        if db is not None:
            from bson import ObjectId
            # Guard against deactivating the last active administrator
            if not payload.is_active:
                target_user = db["users"].find_one({"_id": ObjectId(user_id) if len(user_id) == 24 else user_id})
                if target_user and target_user.get("role") == "admin":
                    active_admins = db["users"].count_documents({"role": "admin", "is_active": True})
                    if active_admins <= 1:
                        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Safety Lockout Lock: Cannot deactivate the last active administrator.")

            res = db["users"].update_one(
                {"_id": ObjectId(user_id) if len(user_id) == 24 else user_id},
                {"$set": {"is_active": payload.is_active, "updated_at": datetime.utcnow()}}
            )
            success = res.modified_count > 0 or res.matched_count > 0
        else:
            users = load_mock_users()
            if user_id not in users:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
            
            if not payload.is_active and users[user_id].get("role") == "admin":
                active_admins = len([u for u in users.values() if u.get("role") == "admin" and u.get("is_active", True)])
                if active_admins <= 1:
                    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Safety Lockout Lock: Cannot deactivate the last active administrator.")

            users[user_id]["is_active"] = payload.is_active
            users[user_id]["updated_at"] = datetime.utcnow().isoformat()
            save_mock_users(users)
            success = True

        if not success:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

        # Record audit event
        AuditService.record_audit_event(
            actor_user_id=current_user.get("id") or str(current_user.get("_id")),
            actor_role=current_user.get("role"),
            action="ADMIN_USER_STATUS_CHANGED",
            resource_type="USER",
            resource_id=user_id,
            success=True,
            metadata={"is_active": payload.is_active}
        )

        return {"success": True, "message": "User active status updated successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/users/{user_id}/role", response_model=Dict[str, Any])
async def update_user_role(user_id: str, payload: RoleUpdatePayload, current_user: dict = Depends(require_admin)):
    if payload.role not in ["learner", "centre", "admin"]:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid role specification.")

    db = db_instance.get_db()
    
    # 1. Lockout Check
    if user_id == str(current_user.get("id") or current_user.get("_id")):
        if payload.role != "admin":
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="You cannot demote yourself from the root administrator role.")

    try:
        if db is not None:
            from bson import ObjectId
            # Safety check: Cannot demote the last administrator
            target_user = db["users"].find_one({"_id": ObjectId(user_id) if len(user_id) == 24 else user_id})
            if target_user and target_user.get("role") == "admin" and payload.role != "admin":
                active_admins = db["users"].count_documents({"role": "admin", "is_active": True})
                if active_admins <= 1:
                    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Safety Lockout Lock: Cannot demote the last active administrator.")

            res = db["users"].update_one(
                {"_id": ObjectId(user_id) if len(user_id) == 24 else user_id},
                {"$set": {"role": payload.role, "updated_at": datetime.utcnow()}}
            )
            success = res.modified_count > 0 or res.matched_count > 0
        else:
            users = load_mock_users()
            if user_id not in users:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
            
            if users[user_id].get("role") == "admin" and payload.role != "admin":
                active_admins = len([u for u in users.values() if u.get("role") == "admin" and u.get("is_active", True)])
                if active_admins <= 1:
                    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Safety Lockout Lock: Cannot demote the last active administrator.")

            users[user_id]["role"] = payload.role
            users[user_id]["updated_at"] = datetime.utcnow().isoformat()
            save_mock_users(users)
            success = True

        if not success:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

        # Record audit event
        AuditService.record_audit_event(
            actor_user_id=current_user.get("id") or str(current_user.get("_id")),
            actor_role=current_user.get("role"),
            action="ADMIN_USER_ROLE_CHANGED",
            resource_type="USER",
            resource_id=user_id,
            success=True,
            metadata={"role": payload.role}
        )

        return {"success": True, "message": "User role updated successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ==========================================
# PHASE 6.8 — SKILL CATALOG MANAGEMENT
# ==========================================

@router.get("/skills", response_model=List[Dict[str, Any]])
async def list_skills_admin(_: dict = Depends(require_admin)):
    db = db_instance.get_db()
    if db is not None:
        skills = list(db["skills"].find({}))
        for s in skills:
            s["id"] = str(s.get("id") or s.get("_id"))
            if "_id" in s:
                del s["_id"]
        return skills
    else:
        return load_mock_data(MOCK_SKILLS_FILE)

@router.post("/skills", response_model=Dict[str, Any], status_code=201)
async def create_skill(payload: SkillAdminCreate, current_user: dict = Depends(require_admin)):
    db = db_instance.get_db()
    skill_dict = payload.model_dump()
    skill_id = str(uuid.uuid4())[:8]
    skill_dict["id"] = skill_id
    skill_dict["is_active"] = True
    
    if db is not None:
        skill_dict["created_at"] = datetime.utcnow()
        db["skills"].insert_one(skill_dict)
        skill_dict["id"] = str(skill_dict.pop("_id"))
    else:
        skill_dict["created_at"] = datetime.utcnow().isoformat()
        skills = load_mock_data(MOCK_SKILLS_FILE)
        skills.append(skill_dict)
        save_mock_data(MOCK_SKILLS_FILE, skills)
        
    # Record audit event
    AuditService.record_audit_event(
        actor_user_id=current_user.get("id") or str(current_user.get("_id")),
        actor_role=current_user.get("role"),
        action="ADMIN_SKILL_CREATED",
        resource_type="SKILL",
        resource_id=skill_id,
        success=True,
        metadata={"name": payload.name}
    )
        
    return {"success": True, "skill": skill_dict}

@router.put("/skills/{skill_id}", response_model=Dict[str, Any])
async def update_skill_admin(skill_id: str, payload: SkillAdminUpdate, current_user: dict = Depends(require_admin)):
    db = db_instance.get_db()
    update_data = {k: v for k, v in payload.model_dump().items() if v is not None}
    
    if db is not None:
        res = db["skills"].update_one({"id": skill_id}, {"$set": update_data})
        success = res.modified_count > 0 or res.matched_count > 0
    else:
        skills = load_mock_data(MOCK_SKILLS_FILE)
        success = False
        for s in skills:
            if s.get("id") == skill_id:
                s.update(update_data)
                success = True
                break
        if success:
            save_mock_data(MOCK_SKILLS_FILE, skills)
            
    if not success:
        raise HTTPException(status_code=404, detail="Skill not found")
        
    # Record audit event
    AuditService.record_audit_event(
        actor_user_id=current_user.get("id") or str(current_user.get("_id")),
        actor_role=current_user.get("role"),
        action="ADMIN_SKILL_UPDATED",
        resource_type="SKILL",
        resource_id=skill_id,
        success=True,
        metadata=update_data
    )
        
    return {"success": True, "message": "Skill updated successfully"}


# ==========================================
# PHASE 6.8 — COURSE CATALOG MANAGEMENT
# ==========================================

@router.get("/courses", response_model=List[Dict[str, Any]])
async def list_courses_admin(_: dict = Depends(require_admin)):
    db = db_instance.get_db()
    courses = []
    if db is not None:
        courses = list(db["courses"].find({}))
        for c in courses:
            c["id"] = str(c.get("id") or c.get("_id"))
            if "_id" in c:
                del c["_id"]
    else:
        courses = load_mock_data(MOCK_COURSES_FILE)

    # Dynamically enrich every course record with parent Centre profile training mode & delivery config
    enriched_courses = []
    for c in courses:
        c_copy = dict(c)
        centre_id = c_copy.get("centre_id")
        
        c_copy["training_mode"] = c_copy.get("learning_mode") or "online"
        c_copy["online_training"] = None
        c_copy["offline_training"] = None
        c_copy["centre_name"] = "NariNexus Skill Centre"
        c_copy["centre_verification_status"] = "pending"
        
        if centre_id:
            from backend.app.services.centre_service import CentreService
            centre_profile = CentreService.get_profile_by_id(centre_id)
            if centre_profile:
                c_copy["centre_name"] = centre_profile.get("centre_name", "NariNexus Skill Centre")
                c_copy["centre_verification_status"] = centre_profile.get("verification_status", "pending")
                
                p_mode = centre_profile.get("training_mode")
                if p_mode:
                    c_copy["training_mode"] = p_mode
                    
                c_copy["online_training"] = centre_profile.get("online_training")
                c_copy["offline_training"] = centre_profile.get("offline_training")
                
        enriched_courses.append(c_copy)

    return enriched_courses

@router.post("/courses", response_model=Dict[str, Any], status_code=201)
async def create_course_admin(payload: CourseAdminCreate, current_user: dict = Depends(require_admin)):
    db = db_instance.get_db()
    course_dict = payload.model_dump()
    course_id = str(uuid.uuid4())[:8]
    course_dict["id"] = course_id
    course_dict["is_active"] = True
    
    if db is not None:
        course_dict["created_at"] = datetime.utcnow()
        course_dict["updated_at"] = datetime.utcnow()
        db["courses"].insert_one(course_dict)
        course_dict["id"] = str(course_dict.pop("_id"))
    else:
        course_dict["created_at"] = datetime.utcnow().isoformat()
        course_dict["updated_at"] = datetime.utcnow().isoformat()
        courses = load_mock_data(MOCK_COURSES_FILE)
        courses.append(course_dict)
        save_mock_data(MOCK_COURSES_FILE, courses)
        
    # Record audit event
    AuditService.record_audit_event(
        actor_user_id=current_user.get("id") or str(current_user.get("_id")),
        actor_role=current_user.get("role"),
        action="ADMIN_COURSE_CREATED",
        resource_type="COURSE",
        resource_id=course_id,
        success=True,
        metadata={"title": payload.title}
    )
        
    return {"success": True, "course": course_dict}

@router.put("/courses/{course_id}", response_model=Dict[str, Any])
async def update_course_admin(course_id: str, payload: CourseAdminUpdate, current_user: dict = Depends(require_admin)):
    db = db_instance.get_db()
    update_data = {k: v for k, v in payload.model_dump().items() if v is not None}
    
    if db is not None:
        update_data["updated_at"] = datetime.utcnow()
        res = db["courses"].update_one({"id": course_id}, {"$set": update_data})
        success = res.modified_count > 0 or res.matched_count > 0
    else:
        courses = load_mock_data(MOCK_COURSES_FILE)
        success = False
        for c in courses:
            if c.get("id") == course_id:
                update_data["updated_at"] = datetime.utcnow().isoformat()
                c.update(update_data)
                success = True
                break
        if success:
            save_mock_data(MOCK_COURSES_FILE, courses)
            
    if not success:
        raise HTTPException(status_code=404, detail="Course not found")
        
    # Record audit event
    action_name = "ADMIN_COURSE_STATUS_CHANGED" if "is_active" in update_data else "ADMIN_COURSE_UPDATED"
    AuditService.record_audit_event(
        actor_user_id=current_user.get("id") or str(current_user.get("_id")),
        actor_role=current_user.get("role"),
        action=action_name,
        resource_type="COURSE",
        resource_id=course_id,
        success=True,
        metadata=update_data
    )
        
    return {"success": True, "message": "Course updated successfully"}


# ==========================================
# PHASE 6.9 — OPPORTUNITY MANAGEMENT
# ==========================================

@router.get("/opportunities", response_model=List[Dict[str, Any]])
async def list_opportunities_admin(_: dict = Depends(require_admin)):
    db = db_instance.get_db()
    if db is not None:
        opps = list(db["opportunities"].find({}))
        for o in opps:
            o["id"] = str(o.get("id") or o.get("_id"))
            if "_id" in o:
                del o["_id"]
        return opps
    else:
        return load_mock_opportunities()

@router.post("/opportunities", response_model=Dict[str, Any], status_code=201)
async def create_opportunity_admin(payload: OpportunityAdminCreate, current_user: dict = Depends(require_admin)):
    db = db_instance.get_db()
    opp_dict = payload.model_dump()
    opp_id = str(uuid.uuid4())[:8]
    opp_dict["id"] = opp_id
    opp_dict["is_active"] = True
    
    if db is not None:
        opp_dict["created_at"] = datetime.utcnow()
        opp_dict["updated_at"] = datetime.utcnow()
        db["opportunities"].insert_one(opp_dict)
        opp_dict["id"] = str(opp_dict.pop("_id"))
    else:
        opp_dict["created_at"] = datetime.utcnow().isoformat()
        opp_dict["updated_at"] = datetime.utcnow().isoformat()
        opps = load_mock_opportunities()
        opps.append(opp_dict)
        save_mock_opportunities_raw(opps)
        
    # Record audit event
    AuditService.record_audit_event(
        actor_user_id=current_user.get("id") or str(current_user.get("_id")),
        actor_role=current_user.get("role"),
        action="ADMIN_OPPORTUNITY_CREATED",
        resource_type="OPPORTUNITY",
        resource_id=opp_id,
        success=True,
        metadata={"title": payload.title, "organization": payload.organization}
    )
        
    return {"success": True, "opportunity": opp_dict}

@router.put("/opportunities/{opp_id}", response_model=Dict[str, Any])
async def update_opportunity_admin(opp_id: str, payload: OpportunityAdminUpdate, current_user: dict = Depends(require_admin)):
    db = db_instance.get_db()
    update_data = {k: v for k, v in payload.model_dump().items() if v is not None}
    
    if db is not None:
        update_data["updated_at"] = datetime.utcnow()
        res = db["opportunities"].update_one({"id": opp_id}, {"$set": update_data})
        success = res.modified_count > 0 or res.matched_count > 0
    else:
        opps = load_mock_opportunities()
        success = False
        for o in opps:
            if o.get("id") == opp_id:
                update_data["updated_at"] = datetime.utcnow().isoformat()
                o.update(update_data)
                success = True
                break
        if success:
            save_mock_opportunities_raw(opps)
            
    if not success:
        raise HTTPException(status_code=404, detail="Opportunity not found")
        
    # Record audit event
    action_name = "ADMIN_OPPORTUNITY_STATUS_CHANGED" if "is_active" in update_data else "ADMIN_OPPORTUNITY_UPDATED"
    AuditService.record_audit_event(
        actor_user_id=current_user.get("id") or str(current_user.get("_id")),
        actor_role=current_user.get("role"),
        action=action_name,
        resource_type="OPPORTUNITY",
        resource_id=opp_id,
        success=True,
        metadata=update_data
    )
        
    return {"success": True, "message": "Opportunity updated successfully"}


# ==========================================
# PHASE 6.10 — OPPORTUNITY APPLICATION TRACKING
# ==========================================

@router.get("/applications", response_model=List[Dict[str, Any]])
async def list_applications_admin(
    opportunity_id: Optional[str] = None,
    status: Optional[str] = None,
    _: dict = Depends(require_admin)
):
    db = db_instance.get_db()
    if db is not None:
        query = {}
        if opportunity_id:
            query["opportunity_id"] = opportunity_id
        if status:
            query["status"] = status
            
        apps = list(db["applications"].find(query))
        for a in apps:
            a["id"] = str(a.get("id") or a.get("_id"))
            if "_id" in a:
                del a["_id"]
        return apps
    else:
        apps = load_mock_applications()
        if opportunity_id:
            apps = [a for a in apps if a.get("opportunity_id") == opportunity_id]
        if status:
            apps = [a for a in apps if a.get("status") == status]
        return apps

@router.put("/applications/{app_id}/status", response_model=Dict[str, Any])
async def update_application_status_admin(app_id: str, payload: ApplicationStatusUpdatePayload, current_user: dict = Depends(require_admin)):
    import traceback
    try:
        learner_id = None
        opportunity_title = "Livelihood Opportunity"
        db = db_instance.get_db()
        
        if db is not None:
            from bson import ObjectId
            app_doc = db["applications"].find_one({"_id": ObjectId(app_id) if len(app_id) == 24 else app_id})
            if app_doc:
                learner_id = app_doc.get("learner_id")
                opportunity_title = app_doc.get("opportunity_title", "Livelihood Opportunity")
                
            res = db["applications"].update_one(
                {"_id": ObjectId(app_id) if len(app_id) == 24 else app_id},
                {"$set": {"status": payload.status, "updated_at": datetime.utcnow()}}
            )
            success = res.modified_count > 0 or res.matched_count > 0
        else:
            apps = load_mock_applications()
            success = False
            for a in apps:
                if a.get("id") == app_id:
                    learner_id = a.get("learner_id")
                    opportunity_title = a.get("opportunity_title", "Livelihood Opportunity")
                    a["status"] = payload.status
                    a["updated_at"] = datetime.utcnow().isoformat()
                    success = True
                    break
            if success:
                save_mock_applications(apps)
                
        if not success:
            raise HTTPException(status_code=404, detail="Tracking application not found")
            
        # Trigger isolated notifications and transactional communication alerts failure-safely
        if learner_id:
            try:
                from backend.app.services.notification_service import NotificationService
                NotificationService.create_notification(
                    recipient_id=learner_id,
                    title="Application Status Updated",
                    message=f"Your application for '{opportunity_title}' has been updated to: {payload.status}.",
                    type="application_status_update"
                )
            except Exception as e:
                logger.warning(f"Failed to trigger application status update notification: {str(e)}")
                
        # Record audit event
        AuditService.record_audit_event(
            actor_user_id=current_user.get("id") or str(current_user.get("_id")),
            actor_role=current_user.get("role"),
            action="ADMIN_APPLICATION_STATUS_CHANGED",
            resource_type="APPLICATION",
            resource_id=app_id,
            success=True,
            metadata={"status": payload.status, "opportunity_title": opportunity_title}
        )
                
        return {"success": True, "message": "Application status updated successfully"}
    except Exception as e:
        traceback.print_exc()
        raise e


# ==========================================
# PHASE 6.14 — PLATFORM ANALYTICS (DETERMINISTIC)
# ==========================================

@router.get("/analytics", response_model=Dict[str, Any])
async def get_platform_analytics(_: dict = Depends(require_admin)):
    """
    Retrieve platform-wide deterministic analytics and statistics. Authorized Admins only.
    """
    import traceback
    try:
        from backend.app.services.analytics_service import AnalyticsService
        metrics = AnalyticsService.get_platform_metrics()
        return {"success": True, "metrics": metrics}
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


# ==========================================
# PHASE 6.15 — AI ANALYTICS INSIGHTS
# ==========================================

@router.get("/analytics/ai-insights", response_model=Dict[str, Any])
async def get_ai_analytics_insights(lang: str = "en", current_user: dict = Depends(require_admin)):
    """
    Retrieves safe, AI-assisted explanatory interpretations over the deterministic analytics metrics.
    Strictly isolated and secured with AISafety rate limits, injection sanitizer, and fallback recovery.
    """
    from backend.app.services.analytics_service import AnalyticsService
    from backend.app.services.ai_analytics_service import AIAnalyticsService
    from backend.app.services.ai_safety_service import AISafetyService

    user_id = str(current_user.get("id") or current_user.get("_id"))
    
    # Apply lightweight sliding window rate limiter
    AISafetyService.apply_rate_limit(user_id, limit=3, window_seconds=10)

    # Clean, deterministic metrics remain the source of truth
    metrics = AnalyticsService.get_platform_metrics()

    # Retrieve safe, anonymized interpretation
    insights = AIAnalyticsService.generate_analytics_insights(metrics, lang=lang)
    return insights


# ==========================================
# PHASE 7.2 — AUDIT LOG RETRIEVAL
# ==========================================

@router.get("/audit-logs", response_model=Dict[str, Any])
async def get_platform_audit_logs(
    action: Optional[str] = Query(None, description="Filter by action name"),
    actor_user_id: Optional[str] = Query(None, description="Filter by actor user ID"),
    resource_type: Optional[str] = Query(None, description="Filter by resource type"),
    success: Optional[bool] = Query(None, description="Filter by success status"),
    page: int = Query(1, ge=1, description="Page number for pagination"),
    page_size: int = Query(20, ge=1, le=100, description="Page size for pagination"),
    _: dict = Depends(require_admin)
):
    """
    Retrieve platform-wide paginated and filtered audit logs. Strictly ADMIN ONLY.
    """
    try:
        logs_data = AuditService.get_audit_logs(
            action=action,
            actor_user_id=actor_user_id,
            resource_type=resource_type,
            success=success,
            page=page,
            page_size=page_size
        )
        return logs_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve audit logs: {str(e)}")


# ==========================================
# PHASE 9 — TRAINING CENTRE APPROVAL SYSTEM
# ==========================================

@router.get("/centres/pending", response_model=Dict[str, Any])
async def list_pending_centres(_: dict = Depends(require_admin)):
    """
    List all training/coaching centres currently waiting for Admin approval.
    """
    db = db_instance.get_db()
    if db is not None:
        pending_centres = list(db["centres"].find({"verification_status": "pending"}))
        for c in pending_centres:
            c["id"] = str(c.get("id") or c.get("_id"))
            if "_id" in c:
                del c["_id"]
            if "created_at" in c and isinstance(c["created_at"], datetime):
                c["created_at"] = c["created_at"].isoformat()
            if "updated_at" in c and isinstance(c["updated_at"], datetime):
                c["updated_at"] = c["updated_at"].isoformat()
        return {"success": True, "centres": pending_centres}
    else:
        # Fallback
        centres = load_mock_centres()
        pending = [c for c in centres if c.get("verification_status") == "pending"]
        return {"success": True, "centres": pending}

@router.post("/centres/{centre_id}/approve", response_model=Dict[str, Any])
async def approve_centre(centre_id: str, _: dict = Depends(require_admin)):
    """
    Approve a training/coaching centre and unlock their access to Centre Portal.
    """
    db = db_instance.get_db()
    if db is not None:
        from bson import ObjectId
        query = {"id": centre_id}
        try:
            if len(centre_id) == 24:
                query = {"$or": [{"id": centre_id}, {"_id": ObjectId(centre_id)}]}
        except Exception:
            pass
            
        result = db["centres"].update_one(query, {"$set": {"verification_status": "approved", "updated_at": datetime.utcnow()}})
        if result.modified_count == 0:
            # Maybe already approved or not found, double check existence
            centre = db["centres"].find_one(query)
            if not centre:
                raise HTTPException(status_code=404, detail="Coaching centre profile not found.")
        
        return {"success": True, "message": "Coaching centre approved successfully."}
    else:
        centres = load_mock_centres()
        found = False
        for c in centres:
            if c.get("id") == centre_id:
                c["verification_status"] = "approved"
                found = True
                break
        if not found:
            raise HTTPException(status_code=404, detail="Coaching centre profile not found in mock fallback.")
        save_mock_centres(centres)
        return {"success": True, "message": "Coaching centre approved in fallback storage."}

@router.post("/centres/{centre_id}/reject", response_model=Dict[str, Any])
async def reject_centre(centre_id: str, _: dict = Depends(require_admin)):
    """
    Reject a training/coaching centre.
    """
    db = db_instance.get_db()
    if db is not None:
        from bson import ObjectId
        query = {"id": centre_id}
        try:
            if len(centre_id) == 24:
                query = {"$or": [{"id": centre_id}, {"_id": ObjectId(centre_id)}]}
        except Exception:
            pass
            
        result = db["centres"].update_one(query, {"$set": {"verification_status": "rejected", "updated_at": datetime.utcnow()}})
        if result.modified_count == 0:
            centre = db["centres"].find_one(query)
            if not centre:
                raise HTTPException(status_code=404, detail="Coaching centre profile not found.")
        return {"success": True, "message": "Coaching centre rejected successfully."}
    else:
        centres = load_mock_centres()
        found = False
        for c in centres:
            if c.get("id") == centre_id:
                c["verification_status"] = "rejected"
                found = True
                break
        if not found:
            raise HTTPException(status_code=404, detail="Coaching centre profile not found in mock fallback.")
        save_mock_centres(centres)
        return {"success": True, "message": "Coaching centre rejected."}

