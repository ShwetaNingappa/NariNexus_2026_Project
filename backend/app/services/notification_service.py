import os
import json
import uuid
from datetime import datetime
from typing import List, Dict, Any, Optional
from backend.app.core.database import db_instance
from backend.app.services.communication_service import CommunicationService
from backend.app.services.user_service import UserService

MOCK_NOTIFICATIONS_FILE = os.path.join(os.path.dirname(__file__), "mock_notifications.json")

def load_mock_notifications() -> List[Dict[str, Any]]:
    if not os.path.exists(MOCK_NOTIFICATIONS_FILE):
        return []
    try:
        with open(MOCK_NOTIFICATIONS_FILE, "r") as f:
            return json.load(f)
    except Exception:
        return []

def save_mock_notifications(notifications: List[Dict[str, Any]]):
    try:
        with open(MOCK_NOTIFICATIONS_FILE, "w") as f:
            json.dump(notifications, f, indent=2)
    except Exception:
        pass

class NotificationService:
    @classmethod
    def create_notification(
        cls,
        recipient_id: str,
        title: str,
        message: str,
        type: str = "system_notification",
        action_link: Optional[str] = None
    ) -> Optional[Dict[str, Any]]:
        """
        Creates a notification for the specified recipient user.
        Fires an email trigger via CommunicationService if recipient is registered.
        Completely failure-safe: notification creation errors will not crash main transactions.
        """
        try:
            notification_doc = {
                "recipient_id": recipient_id,
                "title": title,
                "message": message,
                "type": type,
                "action_link": action_link,
                "is_read": False,
                "created_at": datetime.utcnow().isoformat()
            }
            
            db = db_instance.get_db()
            if db is not None:
                # Store in MongoDB
                res = db["notifications"].insert_one(notification_doc)
                notification_doc["id"] = str(res.inserted_id)
                if "_id" in notification_doc:
                    del notification_doc["_id"]
            else:
                # Store in mock file
                notifications = load_mock_notifications()
                notif_id = f"notif-{uuid.uuid4().hex[:6]}"
                notification_doc["id"] = notif_id
                notifications.append(notification_doc)
                save_mock_notifications(notifications)

            # Trigger notification email communication
            user = UserService.get_user_by_id(recipient_id)
            if user and user.get("email"):
                email_body = f"""
                <html>
                <body style="font-family: Arial, sans-serif; color: #3D2D1E; background-color: #FFFDF9; padding: 20px;">
                    <div style="max-width: 600px; margin: 0 auto; border: 1px solid #E6D2B5; border-radius: 12px; padding: 30px; background-color: #FFFFFF;">
                        <h2 style="color: #C83D68; font-family: serif; text-align: center;">NariNexus Alerts</h2>
                        <hr style="border: 0; border-top: 1px solid #F5E6D3; margin: 20px 0;" />
                        <h3>{title}</h3>
                        <p>{message}</p>
                        {f'<p><a href="{action_link}" style="display: inline-block; background-color: #C83D68; color: white; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-weight: bold;">View Details</a></p>' if action_link else ''}
                        <hr style="border: 0; border-top: 1px solid #F5E6D3; margin: 20px 0;" />
                        <p style="font-size: 11px; color: #7D7061;">This is a notification-triggered email from your NariNexus profile.</p>
                    </div>
                </body>
                </html>
                """
                # Send email as a failure-safe background trigger
                CommunicationService.send_transactional_email(
                    to_email=user["email"],
                    subject=f"NariNexus: {title}",
                    html_content=email_body
                )

            return notification_doc
        except Exception as e:
            # Safe boundary: Notification failure never halts main business process
            import logging
            logging.getLogger("narinexus.notifications").error(f"Failure-safe Notification creation caught error: {str(e)}")
            return None

    @classmethod
    def get_notifications_for_user(cls, user_id: str, only_unread: bool = False) -> List[Dict[str, Any]]:
        """
        Retrieves user notifications with mandatory server-side user isolation checks.
        """
        db = db_instance.get_db()
        if db is not None:
            query = {"recipient_id": user_id}
            if only_unread:
                query["is_read"] = False
            notifs = list(db["notifications"].find(query).sort("created_at", -1))
            for n in notifs:
                n["id"] = str(n.get("id") or n.get("_id"))
                if "_id" in n:
                    del n["_id"]
            return notifs
        else:
            notifs = load_mock_notifications()
            user_notifs = [n for n in notifs if n.get("recipient_id") == user_id]
            if only_unread:
                user_notifs = [n for n in user_notifs if not n.get("is_read")]
            # Sort by created_at descending
            user_notifs.sort(key=lambda x: x.get("created_at", ""), reverse=True)
            return user_notifs

    @classmethod
    def get_unread_count(cls, user_id: str) -> int:
        """
        Get unread count with strict user isolation.
        """
        db = db_instance.get_db()
        if db is not None:
            return db["notifications"].count_documents({"recipient_id": user_id, "is_read": False})
        else:
            notifs = load_mock_notifications()
            return sum(1 for n in notifs if n.get("recipient_id") == user_id and not n.get("is_read"))

    @classmethod
    def mark_as_read(cls, user_id: str, notification_id: str) -> bool:
        """
        Marks a specific notification as read. Verifies that the recipient owns the notification (strict isolation).
        """
        db = db_instance.get_db()
        if db is not None:
            from bson import ObjectId
            target_id = ObjectId(notification_id) if len(notification_id) == 24 else notification_id
            # Enforce matching recipient_id to prevent any cross-tenant reading
            res = db["notifications"].update_one(
                {"_id": target_id, "recipient_id": user_id},
                {"$set": {"is_read": True}}
            )
            return res.modified_count > 0 or res.matched_count > 0
        else:
            notifs = load_mock_notifications()
            success = False
            for n in notifs:
                if n.get("id") == notification_id and n.get("recipient_id") == user_id:
                    n["is_read"] = True
                    success = True
                    break
            if success:
                save_mock_notifications(notifs)
            return success

    @classmethod
    def mark_all_as_read(cls, user_id: str) -> bool:
        """
        Marks all notifications of the user as read. Strictly isolated.
        """
        db = db_instance.get_db()
        if db is not None:
            res = db["notifications"].update_many(
                {"recipient_id": user_id, "is_read": False},
                {"$set": {"is_read": True}}
            )
            return True
        else:
            notifs = load_mock_notifications()
            updated = False
            for n in notifs:
                if n.get("recipient_id") == user_id and not n.get("is_read"):
                    n["is_read"] = True
                    updated = True
            if updated:
                save_mock_notifications(notifs)
            return True
