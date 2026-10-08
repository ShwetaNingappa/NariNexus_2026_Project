from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Dict, Any
from backend.app.api.deps import get_current_user
from backend.app.services.notification_service import NotificationService

router = APIRouter()

@router.get("", response_model=List[Dict[str, Any]])
async def list_my_notifications(current_user: dict = Depends(get_current_user)):
    """
    Retrieves notifications for the authenticated user. Strictly isolated server-side.
    """
    user_id = str(current_user.get("id") or current_user.get("_id"))
    return NotificationService.get_notifications_for_user(user_id)

@router.get("/unread-count", response_model=Dict[str, Any])
async def get_my_unread_count(current_user: dict = Depends(get_current_user)):
    """
    Retrieves the count of unread notifications for the authenticated user. Strictly isolated.
    """
    user_id = str(current_user.get("id") or current_user.get("_id"))
    count = NotificationService.get_unread_count(user_id)
    return {"success": True, "unread_count": count}

@router.put("/{notification_id}/read", response_model=Dict[str, Any])
async def mark_notification_as_read(notification_id: str, current_user: dict = Depends(get_current_user)):
    """
    Marks a single specified notification as read.
    Validates ownership of notification before performing update (strict cross-tenant isolation).
    """
    user_id = str(current_user.get("id") or current_user.get("_id"))
    success = NotificationService.mark_as_read(user_id, notification_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found or access denied."
        )
    return {"success": True, "message": "Notification marked as read successfully."}

@router.put("/read-all", response_model=Dict[str, Any])
async def mark_all_notifications_as_read(current_user: dict = Depends(get_current_user)):
    """
    Marks all notifications for the authenticated user as read.
    """
    user_id = str(current_user.get("id") or current_user.get("_id"))
    NotificationService.mark_all_as_read(user_id)
    return {"success": True, "message": "All notifications marked as read."}
