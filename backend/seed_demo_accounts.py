import os
import json
import uuid
from datetime import datetime
from backend.app.core.security import hash_password
from backend.app.services.user_service import MOCK_DB_FILE, load_mock_users, save_mock_users

def seed_demo_accounts():
    print("========== SEEDING DEMO ACCOUNTS ==========")
    users = load_mock_users()
    
    # 1. Learner Demo
    learner_email = "notif_learner_a_6fe0bf@gmail.com"
    # Search for existing
    learner_id = None
    for uid, u in users.items():
        if u.get("email") == learner_email:
            learner_id = uid
            break
            
    if not learner_id:
        learner_id = str(uuid.uuid4())
        print(f"Creating new demo learner: {learner_email}")
    else:
        print(f"Updating existing demo learner: {learner_email}")
        
    users[learner_id] = {
        "id": learner_id,
        "_id": learner_id,
        "name": "Savitha Nair (Demo Learner)",
        "email": learner_email,
        "phone": "9876543210",
        "password_hash": hash_password("securePassword123"),
        "role": "learner",
        "preferred_language": "en",
        "profile_completed": True,
        "is_verified": True,
        "is_active": True,
        "age": 28,
        "location": "Central District",
        "education_level": "Undergraduate",
        "existing_skills": ["Tailoring", "Basic Stitching"],
        "learning_interests": ["Embroidery", "Digital Literacy"],
        "learning_preference": "blended",
        "career_goal": "Micro-entrepreneurship",
        "created_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat()
    }

    # 2. Coaching Centre Demo
    centre_email = "centre_9de948@naricentre.org"
    centre_id = None
    for uid, u in users.items():
        if u.get("email") == centre_email:
            centre_id = uid
            break
            
    if not centre_id:
        centre_id = str(uuid.uuid4())
        print(f"Creating new demo centre: {centre_email}")
    else:
        print(f"Updating existing demo centre: {centre_email}")
        
    users[centre_id] = {
        "id": centre_id,
        "_id": centre_id,
        "name": "NariNexus Hub - Central District (Demo Centre)",
        "email": centre_email,
        "phone": "9999988888",
        "password_hash": hash_password("securePassword123"),
        "role": "centre",
        "preferred_language": "en",
        "profile_completed": True,
        "is_verified": True,
        "is_active": True,
        "created_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat()
    }

    # 3. Platform Admin Demo
    admin_email = "app_tracker_admin_6fae91@narinexus.org"
    admin_id = None
    for uid, u in users.items():
        if u.get("email") == admin_email:
            admin_id = uid
            break
            
    if not admin_id:
        admin_id = str(uuid.uuid4())
        print(f"Creating new demo admin: {admin_email}")
    else:
        print(f"Updating existing demo admin: {admin_email}")
        
    users[admin_id] = {
        "id": admin_id,
        "_id": admin_id,
        "name": "Platform Administrator (Demo Admin)",
        "email": admin_email,
        "phone": None,
        "password_hash": hash_password("securePassword123"),
        "role": "admin",
        "preferred_language": "en",
        "profile_completed": True,
        "is_verified": True,
        "is_active": True,
        "created_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat()
    }

    save_mock_users(users)
    print("========== DEMO ACCOUNTS SEEDED SUCCESSFULLY ==========")

if __name__ == "__main__":
    seed_demo_accounts()
