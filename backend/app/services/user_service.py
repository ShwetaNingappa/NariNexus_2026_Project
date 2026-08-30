import os
import json
import uuid
from datetime import datetime
from typing import Optional, Dict, Any
from backend.app.core.database import db_instance
from backend.app.core.security import hash_password
from backend.app.schemas.user import UserCreate

MOCK_DB_FILE = os.path.join(os.path.dirname(__file__), "mock_users.json")

def load_mock_users() -> Dict[str, Any]:
    """
    Load mock users from local file.
    """
    if not os.path.exists(MOCK_DB_FILE):
        return {}
    try:
        with open(MOCK_DB_FILE, "r") as f:
            return json.load(f)
    except Exception:
        return {}

def save_mock_users(users: Dict[str, Any]):
    """
    Save mock users to local file.
    """
    try:
        with open(MOCK_DB_FILE, "w") as f:
            json.dump(users, f, indent=2)
    except Exception:
        pass

class UserService:
    @staticmethod
    def _serialize_user(user: Dict[str, Any]) -> Dict[str, Any]:
        """
        Convert ObjectId or string ID for JSON compatibility.
        """
        if not user:
            return user
        serialized = dict(user)
        if "_id" in serialized:
            serialized["id"] = str(serialized["_id"])
        elif "id" in serialized:
            serialized["_id"] = serialized["id"]
        
        # Convert datetime objects to ISO strings if present
        for key in ["created_at", "updated_at"]:
            if key in serialized and isinstance(serialized[key], datetime):
                serialized[key] = serialized[key].isoformat()
                
        return serialized

    @classmethod
    def get_user_by_email(cls, email: str) -> Optional[Dict[str, Any]]:
        """
        Retrieve a user by their email address. Supports real MongoDB and mock file fallback.
        """
        db = db_instance.get_db()
        email_clean = email.strip().lower()
        if db is not None:
            user = db["users"].find_one({"email": email_clean})
            return cls._serialize_user(user) if user else None
        else:
            users = load_mock_users()
            for u in users.values():
                if u.get("email") == email_clean:
                    return cls._serialize_user(u)
            return None

    @classmethod
    def get_user_by_id(cls, user_id: str) -> Optional[Dict[str, Any]]:
        """
        Retrieve a user by their ID. Supports real MongoDB and mock file fallback.
        """
        db = db_instance.get_db()
        if db is not None:
            from bson import ObjectId
            try:
                user = db["users"].find_one({"_id": ObjectId(user_id)})
                return cls._serialize_user(user) if user else None
            except Exception:
                return None
        else:
            users = load_mock_users()
            user = users.get(user_id)
            return cls._serialize_user(user) if user else None

    @classmethod
    def create_user(cls, user_create: UserCreate) -> Dict[str, Any]:
        """
        Create a new user with hashed password. Supports real MongoDB and mock file fallback.
        """
        email = user_create.email.strip().lower()
        if cls.get_user_by_email(email) is not None:
            raise ValueError("Email already registered")
            
        role_val = user_create.role.value if hasattr(user_create.role, 'value') else user_create.role
        
        user_doc = {
            "name": user_create.name.strip(),
            "email": email,
            "phone": user_create.phone,
            "password_hash": hash_password(user_create.password),
            "role": role_val,
            "preferred_language": user_create.preferred_language,
            "profile_completed": user_create.profile_completed,
            "is_verified": False,
            "is_active": True,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        
        db = db_instance.get_db()
        if db is not None:
            result = db["users"].insert_one(user_doc)
            user_doc["_id"] = result.inserted_id
            return cls._serialize_user(user_doc)
        else:
            users = load_mock_users()
            user_id = str(uuid.uuid4())
            user_doc["id"] = user_id
            user_doc["_id"] = user_id
            # Format dates for local JSON
            user_doc["created_at"] = datetime.utcnow().isoformat()
            user_doc["updated_at"] = datetime.utcnow().isoformat()
            users[user_id] = user_doc
            save_mock_users(users)
            return cls._serialize_user(user_doc)

    @classmethod
    def update_user_fields(cls, user_id: str, fields: Dict[str, Any]) -> bool:
        """
        Updates specific fields of a user. Supports real MongoDB and mock file fallback.
        """
        db = db_instance.get_db()
        if db is not None:
            from bson import ObjectId
            try:
                # Convert ISO string values if we receive datetime objects
                mongo_fields = {}
                for k, v in fields.items():
                    mongo_fields[k] = v
                result = db["users"].update_one(
                    {"_id": ObjectId(user_id) if len(user_id) == 24 else user_id},
                    {"$set": mongo_fields}
                )
                return result.modified_count > 0 or result.matched_count > 0
            except Exception:
                try:
                    result = db["users"].update_one(
                        {"_id": user_id},
                        {"$set": fields}
                    )
                    return result.modified_count > 0 or result.matched_count > 0
                except Exception:
                    return False
        else:
            users = load_mock_users()
            if user_id in users:
                for k, v in fields.items():
                    if isinstance(v, datetime):
                        users[user_id][k] = v.isoformat()
                    else:
                        users[user_id][k] = v
                save_mock_users(users)
                return True
            return False

    @classmethod
    def generate_and_set_otp(cls, email: str, purpose: str = "verification") -> Optional[str]:
        """
        Generates a 6-digit OTP, hashes it, saves metadata to user profile, and returns the plain OTP.
        """
        import random
        from datetime import datetime, timedelta
        
        user = cls.get_user_by_email(email)
        if not user:
            return None
            
        otp = f"{random.randint(100000, 999999)}"
        otp_expiry = datetime.utcnow() + timedelta(minutes=10)
        hashed_otp = hash_password(otp)
        
        fields_to_update = {
            "otp_hash": hashed_otp,
            "otp_expiry": otp_expiry,
            "otp_attempts": 0,
            "otp_purpose": purpose,
            "otp_sent_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        
        cls.update_user_fields(user["id"], fields_to_update)
        return otp

    @classmethod
    def verify_user_otp(cls, email: str, plain_otp: str, purpose: str) -> Dict[str, Any]:
        """
        Verifies a user's OTP and invalidates it. Unlocks the corresponding purpose on success.
        """
        from datetime import datetime
        from backend.app.core.security import verify_password
        
        user = cls.get_user_by_email(email)
        if not user:
            return {"success": False, "message": "User not found"}
            
        otp_hash = user.get("otp_hash")
        otp_expiry_raw = user.get("otp_expiry")
        otp_attempts = user.get("otp_attempts", 0)
        otp_purpose = user.get("otp_purpose")
        
        if not otp_hash or not otp_expiry_raw:
            return {"success": False, "message": "No verification request found or OTP already used."}
            
        # Parse otp_expiry (since fallback stores it as ISO string)
        if isinstance(otp_expiry_raw, str):
            try:
                # Remove Z or replace offset for ISO parsing if needed
                clean_time = otp_expiry_raw.replace("Z", "+00:00")
                otp_expiry = datetime.fromisoformat(clean_time).replace(tzinfo=None)
            except Exception:
                otp_expiry = datetime.utcnow()
        else:
            otp_expiry = otp_expiry_raw
            
        # 1. Check expiration
        if datetime.utcnow() > otp_expiry:
            cls.update_user_fields(user["id"], {
                "otp_hash": None,
                "otp_expiry": None,
                "otp_purpose": None,
                "otp_attempts": 0
            })
            return {"success": False, "message": "Verification code has expired. Please request a new one."}
            
        # 2. Check purpose match
        if otp_purpose != purpose:
            return {"success": False, "message": f"Verification code was not issued for {purpose}."}
            
        # 3. Check attempts limit (max 5)
        if otp_attempts >= 5:
            cls.update_user_fields(user["id"], {
                "otp_hash": None,
                "otp_expiry": None,
                "otp_purpose": None,
                "otp_attempts": 0
            })
            return {"success": False, "message": "Too many failed attempts. Code has been invalidated. Please request a new code."}
            
        # 4. Verify OTP string
        is_valid = verify_password(plain_otp, otp_hash)
        if not is_valid:
            new_attempts = otp_attempts + 1
            if new_attempts >= 5:
                cls.update_user_fields(user["id"], {
                    "otp_hash": None,
                    "otp_expiry": None,
                    "otp_purpose": None,
                    "otp_attempts": 0
                })
                return {"success": False, "message": "Incorrect code. Max attempts exceeded. Code has been invalidated."}
            else:
                cls.update_user_fields(user["id"], {
                    "otp_attempts": new_attempts
                })
                return {"success": False, "message": f"Incorrect verification code. Attempts remaining: {5 - new_attempts}."}
                
        # 5. Success! Invalidate OTP
        updates = {
            "otp_hash": None,
            "otp_expiry": None,
            "otp_purpose": None,
            "otp_attempts": 0,
            "updated_at": datetime.utcnow()
        }
        if purpose == "verification":
            updates["is_verified"] = True
            
        cls.update_user_fields(user["id"], updates)
        return {"success": True, "message": "Verification successful."}

    @classmethod
    def reset_password_with_otp(cls, email: str, plain_otp: str, new_password: str) -> Dict[str, Any]:
        """
        Resets user password after verifying OTP.
        """
        # First verify the OTP
        verify_res = cls.verify_user_otp(email, plain_otp, "password_reset")
        if not verify_res["success"]:
            return verify_res
            
        user = cls.get_user_by_email(email)
        if not user:
            return {"success": False, "message": "User not found"}
            
        new_hash = hash_password(new_password)
        cls.update_user_fields(user["id"], {
            "password_hash": new_hash,
            "updated_at": datetime.utcnow()
        })
        return {"success": True, "message": "Password updated successfully."}
