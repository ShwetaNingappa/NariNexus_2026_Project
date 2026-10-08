import os
import json
import uuid
import logging
from datetime import datetime
from typing import Optional, Dict, Any, List
from backend.app.core.database import db_instance

logger = logging.getLogger("narinexus")
MOCK_AUDIT_LOGS_FILE = os.path.join(os.path.dirname(__file__), "mock_audit_logs.json")

def load_mock_audit_logs() -> List[Dict[str, Any]]:
    """
    Load mock audit logs from local JSON fallback file.
    """
    if not os.path.exists(MOCK_AUDIT_LOGS_FILE):
        return []
    try:
        with open(MOCK_AUDIT_LOGS_FILE, "r") as f:
            return json.load(f)
    except Exception:
        return []

def save_mock_audit_logs(logs: List[Dict[str, Any]]):
    """
    Save mock audit logs to local JSON fallback file.
    """
    try:
        with open(MOCK_AUDIT_LOGS_FILE, "w") as f:
            json.dump(logs, f, indent=2)
    except Exception:
        pass

class AuditService:
    @staticmethod
    def _clean_metadata(metadata: Optional[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Sanitize audit metadata to prevent accidental leak of sensitive credentials.
        """
        if not metadata:
            return {}
        cleaned = dict(metadata)
        
        # Blacklist of sensitive field names
        sensitive_keys = {
            "password", "password_hash", "new_password", "old_password",
            "otp", "otp_hash", "token", "access_token", "secret", "jwt",
            "api_key", "gemini_key", "smtp_password", "credentials"
        }
        
        for key in list(cleaned.keys()):
            if key.lower() in sensitive_keys:
                cleaned[key] = "[REDACTED]"
            elif isinstance(cleaned[key], dict):
                cleaned[key] = AuditService._clean_metadata(cleaned[key])
                
        return cleaned

    @classmethod
    def record_audit_event(
        cls,
        actor_user_id: Optional[str],
        actor_role: Optional[str],
        action: str,
        resource_type: Optional[str],
        resource_id: Optional[str],
        success: bool,
        metadata: Optional[Dict[str, Any]] = None
    ) -> bool:
        """
        Record a platform-wide audit event for accountability and security review.
        Guarantees that audit storage failures do not crash the caller's transaction.
        """
        try:
            timestamp_str = datetime.utcnow().isoformat()
            event_id = uuid.uuid4().hex
            
            cleaned_metadata = cls._clean_metadata(metadata)
            
            event_doc = {
                "id": event_id,
                "_id": event_id,
                "actor_user_id": actor_user_id or "system",
                "actor_role": actor_role or "system",
                "action": action,
                "resource_type": resource_type or "system",
                "resource_id": resource_id or "system",
                "timestamp": timestamp_str,
                "success": success,
                "metadata": cleaned_metadata
            }
            
            db = db_instance.get_db()
            if db is not None:
                db["audit_logs"].insert_one(event_doc)
                logger.info(f"Audit event successfully recorded in MongoDB Atlas: {action}")
            else:
                logs = load_mock_audit_logs()
                logs.append(event_doc)
                save_mock_audit_logs(logs)
                logger.info(f"Audit event successfully recorded in local fallback storage: {action}")
            return True
        except Exception as e:
            logger.error(f"Audit logging failed: {str(e)}. The business operation was not interrupted.")
            return False

    @classmethod
    def get_audit_logs(
        cls,
        action: Optional[str] = None,
        actor_user_id: Optional[str] = None,
        resource_type: Optional[str] = None,
        success: Optional[bool] = None,
        page: int = 1,
        page_size: int = 20
    ) -> Dict[str, Any]:
        """
        Retrieve paginated audit logs filtered by operational attributes (ADMIN ONLY).
        """
        db = db_instance.get_db()
        skip_count = (page - 1) * page_size
        
        if db is not None:
            query = {}
            if action:
                query["action"] = action
            if actor_user_id:
                query["actor_user_id"] = actor_user_id
            if resource_type:
                query["resource_type"] = resource_type
            if success is not None:
                query["success"] = success
                
            total_count = db["audit_logs"].count_documents(query)
            cursor = db["audit_logs"].find(query).sort("timestamp", -1).skip(skip_count).limit(page_size)
            logs = []
            for doc in cursor:
                doc["id"] = str(doc.get("_id") or doc.get("id"))
                doc.pop("_id", None)
                logs.append(doc)
        else:
            all_logs = load_mock_audit_logs()
            filtered_logs = []
            for log in all_logs:
                if action and log.get("action") != action:
                    continue
                if actor_user_id and log.get("actor_user_id") != actor_user_id:
                    continue
                if resource_type and log.get("resource_type") != resource_type:
                    continue
                if success is not None and log.get("success") != success:
                    continue
                filtered_logs.append(log)
                
            # Sort descending by timestamp
            filtered_logs.sort(key=lambda x: x.get("timestamp", ""), reverse=True)
            total_count = len(filtered_logs)
            logs = filtered_logs[skip_count : skip_count + page_size]
            
        return {
            "success": True,
            "total": total_count,
            "page": page,
            "page_size": page_size,
            "logs": logs
        }
