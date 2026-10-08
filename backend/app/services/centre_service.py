import os
import json
import uuid
from datetime import datetime
from typing import Optional, List, Dict, Any
from backend.app.core.database import db_instance

MOCK_CENTRES_FILE = os.path.join(os.path.dirname(__file__), "mock_centres.json")

def load_mock_centres() -> Dict[str, Any]:
    """
    Load mock training centres from local JSON file.
    """
    if not os.path.exists(MOCK_CENTRES_FILE):
        return {}
    try:
        with open(MOCK_CENTRES_FILE, "r") as f:
            return json.load(f)
    except Exception:
        return {}

def save_mock_centres(centres: Dict[str, Any]):
    """
    Save mock training centres to local JSON file.
    """
    try:
        with open(MOCK_CENTRES_FILE, "w") as f:
            json.dump(centres, f, indent=2)
    except Exception:
        pass

class CentreService:
    @staticmethod
    def _serialize_centre(centre: Dict[str, Any]) -> Dict[str, Any]:
        """
        Convert ObjectId or string ID for JSON compatibility.
        """
        if not centre:
            return centre
        serialized = dict(centre)
        if "_id" in serialized:
            serialized["id"] = str(serialized["_id"])
            serialized["_id"] = str(serialized["_id"])
        elif "id" in serialized:
            serialized["_id"] = str(serialized["id"])
        
        # Convert datetime objects to ISO strings if present
        for key in ["created_at", "updated_at"]:
            if key in serialized and isinstance(serialized[key], datetime):
                serialized[key] = serialized[key].isoformat()
                
        return serialized

    @classmethod
    def get_profile_by_user_id(cls, user_id: str) -> Optional[Dict[str, Any]]:
        """
        Retrieve a centre profile by user_id.
        """
        db = db_instance.get_db()
        if db is not None:
            centre = db["centres"].find_one({"user_id": user_id})
            return cls._serialize_centre(centre) if centre else None
        else:
            centres = load_mock_centres()
            for c in centres.values():
                if c.get("user_id") == user_id:
                    return cls._serialize_centre(c)
            return None

    @classmethod
    def get_profile_by_id(cls, centre_id: str) -> Optional[Dict[str, Any]]:
        """
        Retrieve a centre profile by centre_id.
        """
        db = db_instance.get_db()
        if db is not None:
            from bson import ObjectId
            try:
                centre = db["centres"].find_one({"_id": ObjectId(centre_id)})
                return cls._serialize_centre(centre) if centre else None
            except Exception:
                try:
                    centre = db["centres"].find_one({"_id": centre_id})
                    return cls._serialize_centre(centre) if centre else None
                except Exception:
                    return None
        else:
            centres = load_mock_centres()
            centre = centres.get(centre_id)
            return cls._serialize_centre(centre) if centre else None

    @classmethod
    def create_profile(cls, user_id: str, profile_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Create a new centre profile. Prevents duplicates for the same user_id.
        """
        existing = cls.get_profile_by_user_id(user_id)
        if existing:
            raise ValueError("Centre profile already exists for this user")

        doc = {
            "user_id": user_id,
            "centre_name": profile_data.get("centre_name"),
            "description": profile_data.get("description"),
            "contact_phone": profile_data.get("contact_phone"),
            "email": profile_data.get("email"),
            "address": profile_data.get("address"),
            "city": profile_data.get("city"),
            "district": profile_data.get("district"),
            "state": profile_data.get("state"),
            "pincode": profile_data.get("pincode"),
            "location": profile_data.get("location"),
            "facilities": profile_data.get("facilities", []),
            "logo": profile_data.get("logo"),
            "cover_image": profile_data.get("cover_image"),
            "training_mode": profile_data.get("training_mode", "online"),
            "online_training": profile_data.get("online_training"),
            "offline_training": profile_data.get("offline_training"),
            "verification_status": "pending",
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }

        db = db_instance.get_db()
        if db is not None:
            result = db["centres"].insert_one(doc)
            doc["_id"] = result.inserted_id
            return cls._serialize_centre(doc)
        else:
            centres = load_mock_centres()
            centre_id = str(uuid.uuid4())
            doc["id"] = centre_id
            doc["_id"] = centre_id
            doc["created_at"] = datetime.utcnow().isoformat()
            doc["updated_at"] = datetime.utcnow().isoformat()
            centres[centre_id] = doc
            save_mock_centres(centres)
            return cls._serialize_centre(doc)

    @classmethod
    def update_profile(cls, user_id: str, update_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Update an existing centre profile. Only the owner (matching user_id) can update it.
        """
        profile = cls.get_profile_by_user_id(user_id)
        if not profile:
            raise ValueError("No centre profile found for this user")

        centre_id = profile["id"]
        update_data["updated_at"] = datetime.utcnow()

        db = db_instance.get_db()
        if db is not None:
            from bson import ObjectId
            try:
                db["centres"].update_one(
                    {"_id": ObjectId(centre_id) if len(centre_id) == 24 else centre_id},
                    {"$set": update_data}
                )
            except Exception:
                db["centres"].update_one(
                    {"_id": centre_id},
                    {"$set": update_data}
                )
            return cls.get_profile_by_user_id(user_id)
        else:
            centres = load_mock_centres()
            if centre_id in centres:
                for k, v in update_data.items():
                    if isinstance(v, datetime):
                        centres[centre_id][k] = v.isoformat()
                    else:
                        centres[centre_id][k] = v
                save_mock_centres(centres)
                return cls._serialize_centre(centres[centre_id])
            return None

    @classmethod
    def list_verified_centres(
        cls, 
        city: Optional[str] = None, 
        district: Optional[str] = None, 
        state: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Return a list of verified centres, with optional filtering on city, district, state.
        """
        query = {"verification_status": "verified"}
        import re
        if city:
            safe_city = re.escape(city.strip())
            query["city"] = {"$regex": f"^{safe_city}$", "$options": "i"}
        if district:
            safe_district = re.escape(district.strip())
            query["district"] = {"$regex": f"^{safe_district}$", "$options": "i"}
        if state:
            safe_state = re.escape(state.strip())
            query["state"] = {"$regex": f"^{safe_state}$", "$options": "i"}

        db = db_instance.get_db()
        if db is not None:
            cursor = db["centres"].find(query)
            return [cls._serialize_centre(c) for c in cursor]
        else:
            centres = load_mock_centres()
            results = []
            for c in centres.values():
                if c.get("verification_status") != "verified":
                    continue
                if city and c.get("city", "").strip().lower() != city.strip().lower():
                    continue
                if district and c.get("district", "").strip().lower() != district.strip().lower():
                    continue
                if state and c.get("state", "").strip().lower() != state.strip().lower():
                    continue
                results.append(cls._serialize_centre(c))
            return results

    @classmethod
    def get_associated_learners(cls, centre_id: str) -> List[Dict[str, Any]]:
        """
        Get all learners associated with a specific training centre.
        """
        db = db_instance.get_db()
        learners = []
        if db is not None:
            # MongoDB
            cursor = db["users"].find({
                "role": "learner",
                "training_centre_id": centre_id
            })
            for u in cursor:
                u_serialized = dict(u)
                if "_id" in u_serialized:
                    u_serialized["id"] = str(u_serialized["_id"])
                    del u_serialized["_id"]
                learners.append(u_serialized)
        else:
            # Fallback mock JSON
            from backend.app.services.user_service import load_mock_users
            users = load_mock_users()
            for u in users.values():
                if u.get("role") == "learner" and u.get("training_centre_id") == centre_id:
                    u_serialized = dict(u)
                    if "_id" in u_serialized:
                        u_serialized["id"] = str(u_serialized["_id"])
                        del u_serialized["_id"]
                    learners.append(u_serialized)
        return learners

