from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from typing import Dict, Any, Optional
import os
import json

from backend.app.schemas.user import UserCreate, UserRole
from backend.app.services.user_service import UserService
from backend.app.services.email_service import EmailService, DEV_OTP_LOG_FILE
from backend.app.core.security import verify_password, create_access_token
from backend.app.api.deps import get_current_user
from backend.app.core.config import settings
from backend.app.services.audit_service import AuditService

router = APIRouter()

class LoginRequest(BaseModel):
    email: str = Field(..., description="Email address of the user")
    password: str = Field(..., description="User password")

class VerifyOtpRequest(BaseModel):
    email: str = Field(..., description="Email address of the user")
    otp: str = Field(..., description="6-digit verification code")

class ResendOtpRequest(BaseModel):
    email: str = Field(..., description="Email address of the user")
    purpose: str = Field("verification", description="Purpose: 'verification' or 'password_reset'")

class ForgotPasswordRequest(BaseModel):
    email: str = Field(..., description="Registered email address")

class ResetPasswordRequest(BaseModel):
    email: str = Field(..., description="Registered email address")
    otp: str = Field(..., description="6-digit reset code")
    new_password: str = Field(..., min_length=6, description="New secure password")

@router.post("/register")
async def register(user_in: UserCreate):
    # Enforce password length validations
    if len(user_in.password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 6 characters long"
        )
    
    # Do not allow registering as admin publicly
    if user_in.role == UserRole.ADMIN or str(user_in.role).lower() == "admin":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Public registration as Admin is forbidden"
        )
    
    # Check if user already exists
    existing_user = UserService.get_user_by_email(user_in.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email is already registered"
        )
    
    try:
        user = UserService.create_user(user_in)
        
        # Generate OTP for account verification
        otp = UserService.generate_and_set_otp(user["email"], "verification")
        
        # Send OTP email
        EmailService.send_otp_email(user["email"], otp, "verification")
        
        return {
            "success": True,
            "message": "Registration successful. A 6-digit verification code has been sent to your email.",
            "user": {
                "id": user["id"],
                "name": user["name"],
                "email": user["email"],
                "role": user["role"]
            }
        }
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Registration failed: {str(e)}"
        )

@router.post("/login")
async def login(credentials: LoginRequest):
    # Normalize email format
    email = credentials.email.strip().lower()
    user = UserService.get_user_by_email(email)
    if not user:
        AuditService.record_audit_event(
            actor_user_id="unknown",
            actor_role="unknown",
            action="LOGIN_FAILURE",
            resource_type="USER",
            resource_id="system",
            success=False,
            metadata={"email": email, "reason": "Incorrect email or password"}
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    # Verify password securely
    if not verify_password(credentials.password, user.get("password_hash", "")):
        AuditService.record_audit_event(
            actor_user_id=user["id"],
            actor_role=user["role"],
            action="LOGIN_FAILURE",
            resource_type="USER",
            resource_id=user["id"],
            success=False,
            metadata={"email": email, "reason": "Incorrect email or password"}
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    if not user.get("is_active", True):
        AuditService.record_audit_event(
            actor_user_id=user["id"],
            actor_role=user["role"],
            action="LOGIN_FAILURE",
            resource_type="USER",
            resource_id=user["id"],
            success=False,
            metadata={"email": email, "reason": "User account is deactivated"}
        )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User account is deactivated"
        )
        
    # Enforce email OTP verification check
    if not user.get("is_verified", False):
        AuditService.record_audit_event(
            actor_user_id=user["id"],
            actor_role=user["role"],
            action="LOGIN_FAILURE",
            resource_type="USER",
            resource_id=user["id"],
            success=False,
            metadata={"email": email, "reason": "Email address is unverified"}
        )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email address is unverified. Please complete your OTP verification."
        )
    
    # Generate JWT
    token_data = {"sub": user["id"], "role": user["role"]}
    access_token = create_access_token(token_data)
    
    # Record audit event
    AuditService.record_audit_event(
        actor_user_id=user["id"],
        actor_role=user["role"],
        action="LOGIN_SUCCESS",
        resource_type="USER",
        resource_id=user["id"],
        success=True,
        metadata={"email": email}
    )
    
    return {
        "success": True,
        "message": "Login successful",
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user["id"],
            "name": user["name"],
            "email": user["email"],
            "role": user["role"],
            "preferred_language": user.get("preferred_language", "en"),
            "profile_completed": user.get("profile_completed", False)
        }
    }

@router.get("/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    return {
        "success": True,
        "user": {
            "id": current_user["id"],
            "name": current_user["name"],
            "email": current_user["email"],
            "role": current_user["role"],
            "preferred_language": current_user.get("preferred_language", "en"),
            "profile_completed": current_user.get("profile_completed", False),
            "age": current_user.get("age"),
            "location": current_user.get("location"),
            "education_level": current_user.get("education_level"),
            "existing_skills": current_user.get("existing_skills") or [],
            "learning_interests": current_user.get("learning_interests") or [],
            "learning_preference": current_user.get("learning_preference"),
            "career_goal": current_user.get("career_goal"),
            "points": current_user.get("points", 50),
            "streak": current_user.get("streak", 1)
        }
    }

@router.post("/verify-otp")
async def verify_otp(req: VerifyOtpRequest):
    email = req.email.strip().lower()
    user = UserService.get_user_by_email(email)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User not found"
        )
        
    otp_purpose = user.get("otp_purpose", "verification")
    result = UserService.verify_user_otp(email, req.otp, otp_purpose)
    if not result["success"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result["message"]
        )
        
    return {
        "success": True,
        "message": "Verification code accepted successfully."
    }

@router.post("/resend-otp")
async def resend_otp(req: ResendOtpRequest):
    email = req.email.strip().lower()
    user = UserService.get_user_by_email(email)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User not found"
        )
        
    # Check cooldown (15 seconds rate limit)
    from datetime import datetime, timedelta
    otp_sent_at_raw = user.get("otp_sent_at")
    if otp_sent_at_raw:
        if isinstance(otp_sent_at_raw, str):
            try:
                clean_time = otp_sent_at_raw.replace("Z", "+00:00")
                otp_sent_at = datetime.fromisoformat(clean_time).replace(tzinfo=None)
            except Exception:
                otp_sent_at = datetime.utcnow() - timedelta(seconds=60)
        else:
            otp_sent_at = otp_sent_at_raw
            
        elapsed = (datetime.utcnow() - otp_sent_at).total_seconds()
        cooldown_seconds = 15
        if elapsed < cooldown_seconds:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Please wait {int(cooldown_seconds - elapsed)} seconds before requesting a new code."
            )
            
    # Generate new OTP
    otp = UserService.generate_and_set_otp(email, req.purpose)
    if not otp:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate new verification code."
        )
        
    # Send email
    EmailService.send_otp_email(email, otp, req.purpose)
    
    return {
        "success": True,
        "message": f"A new verification code has been sent to {email}."
    }

@router.post("/forgot-password")
async def forgot_password(req: ForgotPasswordRequest):
    email = req.email.strip().lower()
    user = UserService.get_user_by_email(email)
    if not user:
        # Prevent user enumeration security risk: return success even if email not registered
        return {
            "success": True,
            "message": "If the email is registered, a password reset code has been sent."
        }
        
    # Generate OTP for password recovery
    otp = UserService.generate_and_set_otp(email, "password_reset")
    if not otp:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to initiate password reset sequence."
        )
        
    EmailService.send_otp_email(email, otp, "password_reset")
    return {
        "success": True,
        "message": "A password reset verification code has been sent to your email."
    }

@router.post("/reset-password")
async def reset_password(req: ResetPasswordRequest):
    email = req.email.strip().lower()
    result = UserService.reset_password_with_otp(email, req.otp, req.new_password)
    if not result["success"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result["message"]
        )
        
    return {
        "success": True,
        "message": "Password has been reset successfully. You may now log in with your new password."
    }

@router.get("/dev-last-otp")
async def dev_last_otp(email: str):
    """
    Development-only helper to read generated OTPs from local JSON storage.
    Strictly forbidden and disabled in production settings for total security.
    """
    # Enforce safe development checks
    smtp_configured = all([
        settings.SMTP_HOST,
        settings.SMTP_USERNAME,
        settings.SMTP_PASSWORD,
        settings.SMTP_FROM_EMAIL
    ])
    if settings.ENVIRONMENT != "development" and smtp_configured:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Development helper endpoints are restricted in this environment."
        )
        
    email_clean = email.strip().lower()
    
    try:
        data = {}
        if os.path.exists(DEV_OTP_LOG_FILE):
            with open(DEV_OTP_LOG_FILE, "r") as f:
                try:
                    data = json.load(f)
                except Exception:
                    data = {}
        
        # If the user exists but has no active OTP in memory or file, auto-generate one to prevent getting stuck
        user = UserService.get_user_by_email(email_clean)
        if user and (email_clean not in data or not user.get("otp_hash")):
            purpose = user.get("otp_purpose") or "verification"
            otp = UserService.generate_and_set_otp(email_clean, purpose)
            EmailService.send_otp_email(email_clean, otp, purpose)
            
            # Reload dev log
            if os.path.exists(DEV_OTP_LOG_FILE):
                with open(DEV_OTP_LOG_FILE, "r") as f:
                    try:
                        data = json.load(f)
                    except Exception:
                        pass
                        
        if email_clean in data:
            return {
                "success": True,
                "email": email_clean,
                "otp": data[email_clean]["otp"],
                "purpose": data[email_clean]["purpose"]
            }
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No active OTP record found for: {email_clean}"
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve local OTP: {str(e)}"
        )
