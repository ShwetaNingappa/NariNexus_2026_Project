import os
import json
import uuid
import bcrypt
from datetime import datetime
from pymongo import MongoClient

# Define the database configs similar to settings
MONGODB_URI = os.getenv("MONGODB_URI")
DATABASE_NAME = os.getenv("DATABASE_NAME", "narinexus")

# Hashed password for 'securePassword123'
PASSWORD_PLAIN = "securePassword123"
PASSWORD_HASH = bcrypt.hashpw(b"securePassword123", bcrypt.gensalt()).decode()

DEMO_USERS = [
    {
        "id": "demo-learner-id-001",
        "name": "Demo Learner",
        "email": "notif_learner_a_6fe0bf@gmail.com",
        "role": "learner",
        "preferred_language": "en",
        "profile_completed": True,
        "is_verified": True,
        "is_active": True,
    },
    {
        "id": "demo-centre-id-001",
        "name": "Demo Coaching Centre",
        "email": "centre_9de948@naricentre.org",
        "role": "centre",
        "preferred_language": "en",
        "profile_completed": True,
        "is_verified": True,
        "is_active": True,
    },
    {
        "id": "demo-admin-id-001",
        "name": "Platform Administrator",
        "email": "app_tracker_admin_6fae91@narinexus.org",
        "role": "admin",
        "preferred_language": "en",
        "profile_completed": True,
        "is_verified": True,
        "is_active": True,
    }
]

# 1. Update mock_users.json
MOCK_DB_FILE = "/backend/app/services/mock_users.json"
if os.path.exists(MOCK_DB_FILE):
    print(f"Loading {MOCK_DB_FILE}...")
    with open(MOCK_DB_FILE, "r") as f:
        users = json.load(f)
    
    # Update or insert demo users
    for demo in DEMO_USERS:
        # Check if already present
        found_key = None
        for k, u in users.items():
            if u.get("email") == demo["email"]:
                found_key = k
                break
        
        user_doc = {
            "name": demo["name"],
            "email": demo["email"],
            "phone": None,
            "password_hash": PASSWORD_HASH,
            "role": demo["role"],
            "preferred_language": demo["preferred_language"],
            "profile_completed": demo["profile_completed"],
            "is_verified": demo["is_verified"],
            "is_active": demo["is_active"],
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        }
        
        if found_key:
            print(f"Updating existing demo user in JSON fallback: {demo['email']}")
            users[found_key].update(user_doc)
            # Retain ID and sub fields
            user_doc["id"] = found_key
            user_doc["_id"] = found_key
        else:
            print(f"Creating new demo user in JSON fallback: {demo['email']}")
            uid = demo["id"]
            user_doc["id"] = uid
            user_doc["_id"] = uid
            users[uid] = user_doc

    # Update shwetaningappa2004@gmail.com if present, or create it with PASSWORD_HASH
    shweta_found_key = None
    for k, u in users.items():
        if u.get("email") == "shwetaningappa2004@gmail.com":
            shweta_found_key = k
            break
            
    shweta_doc = {
        "name": "Shweta Ningappa",
        "email": "shwetaningappa2004@gmail.com",
        "phone": None,
        "password_hash": PASSWORD_HASH,
        "role": "learner",
        "preferred_language": "kn",
        "profile_completed": True,
        "is_verified": True,
        "is_active": True,
        "updated_at": datetime.utcnow().isoformat()
    }
    
    if shweta_found_key:
        print("Updating shwetaningappa2004@gmail.com password in JSON fallback to securePassword123")
        users[shweta_found_key].update(shweta_doc)
    else:
        print("Seeding shwetaningappa2004@gmail.com in JSON fallback with securePassword123")
        uid = "usr-c888bd"
        shweta_doc["id"] = uid
        shweta_doc["_id"] = uid
        shweta_doc["created_at"] = datetime.utcnow().isoformat()
        users[uid] = shweta_doc

    with open(MOCK_DB_FILE, "w") as f:
        json.dump(users, f, indent=2)
    print("Successfully wrote changes to mock_users.json")
else:
    print(f"Warning: {MOCK_DB_FILE} not found!")

# 2. Update MongoDB Atlas if MONGODB_URI is provided
if MONGODB_URI:
    try:
        print("Connecting to MongoDB Atlas...")
        client = MongoClient(MONGODB_URI, serverSelectionTimeoutMS=5000)
        client.admin.command('ping')
        db = client[DATABASE_NAME]
        print("Successfully connected to MongoDB Atlas.")
        
        for demo in DEMO_USERS:
            user_doc = {
                "name": demo["name"],
                "email": demo["email"].strip().lower(),
                "phone": None,
                "password_hash": PASSWORD_HASH,
                "role": demo["role"],
                "preferred_language": demo["preferred_language"],
                "profile_completed": demo["profile_completed"],
                "is_verified": demo["is_verified"],
                "is_active": demo["is_active"],
                "updated_at": datetime.utcnow()
            }
            
            # Upsert into users collection
            res = db["users"].update_one(
                {"email": demo["email"].strip().lower()},
                {"$set": user_doc, "$setOnInsert": {"created_at": datetime.utcnow()}},
                upsert=True
            )
            print(f"Upserted {demo['email']} into MongoDB Atlas (matched: {res.matched_count}, modified: {res.modified_count})")
            
        # Update shweta in Mongo
        shweta_doc = {
            "name": "Shweta Ningappa",
            "email": "shwetaningappa2004@gmail.com",
            "phone": None,
            "password_hash": PASSWORD_HASH,
            "role": "learner",
            "preferred_language": "kn",
            "profile_completed": True,
            "is_verified": True,
            "is_active": True,
            "updated_at": datetime.utcnow()
        }
        res = db["users"].update_one(
            {"email": "shwetaningappa2004@gmail.com"},
            {"$set": shweta_doc, "$setOnInsert": {"created_at": datetime.utcnow()}},
            upsert=True
        )
        print(f"Upserted shwetaningappa2004@gmail.com into MongoDB Atlas (matched: {res.matched_count}, modified: {res.modified_count})")
        
    except Exception as e:
        print(f"Skipping MongoDB updates due to error: {e}")
