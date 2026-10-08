import sys
import os
from datetime import datetime

# Insert workspace root to sys.path
_dir = os.path.dirname(os.path.abspath(__file__))
_root = os.path.dirname(os.path.dirname(_dir))
if _root not in sys.path:
    sys.path.insert(0, _root)

from backend.app.core.database import db_instance, Database

def run_cleanup(confirm=False):
    print("==================================================")
    print("      NARINEXUS SECURE DATABASE CLEANUP TOOL      ")
    print("==================================================")
    
    Database.connect()
    db = db_instance.get_db()
    if db is None:
        print("Error: Could not connect to MongoDB Atlas.")
        sys.exit(1)

    # Identifiers to preserve
    PRESERVED_ADMIN_EMAIL = "app_tracker_admin_6fae91@narinexus.org"
    PRESERVED_EVALUATOR_EMAIL = "shwetaningappa2004@gmail.com"

    # 1. Audit Phase
    print("\n--- PHASE 1: SYSTEM CENSUS AUDIT ---")
    
    total_users = db["users"].count_documents({})
    preserved_users_count = db["users"].count_documents({"email": {"$in": [PRESERVED_ADMIN_EMAIL, PRESERVED_EVALUATOR_EMAIL]}})
    deletable_users_count = total_users - preserved_users_count
    
    total_centres = db["centres"].count_documents({})
    total_courses = db["courses"].count_documents({})
    total_lessons = db["lessons"].count_documents({})
    total_enrollments = db["enrollments"].count_documents({})
    total_progress = db["progress"].count_documents({})
    total_chats = db["chat_messages"].count_documents({}) + db["chat_sessions"].count_documents({})
    total_audits = db["audit_logs"].count_documents({})
    total_limits = db["rate_limits"].count_documents({})
    
    # Taxonomies (Should ALWAYS be preserved)
    categories_count = db["categories"].count_documents({})
    skills_count = db["skills"].count_documents({})

    print(f"Users: {total_users} total ({preserved_users_count} preserved, {deletable_users_count} to be removed)")
    print(f"Centres: {total_centres} to be removed")
    print(f"Courses: {total_courses} to be removed")
    print(f"Lessons: {total_lessons} to be removed")
    print(f"Enrollments: {total_enrollments} to be removed")
    print(f"Progress: {total_progress} to be removed")
    print(f"AI Chats: {total_chats} to be removed")
    print(f"Audit Logs: {total_audits} to be removed")
    print(f"Rate Limit Records: {total_limits} to be removed")
    print(f"Course Categories (PRESERVED SYSTEM METADATA): {categories_count}")
    print(f"Skills Registry (PRESERVED SYSTEM METADATA): {skills_count}")

    if not confirm:
        print("\n[PREVIEW MODE] To apply these changes, run with: python3 backend/app/scripts/clean_database.py --confirm")
        return

    print("\n--- PHASE 2: DELETING TEST/DEMO RECORDS ---")
    
    # A. Delete users (excluding the preserved admin and user email)
    u_res = db["users"].delete_many({"email": {"$not": {"$in": [PRESERVED_ADMIN_EMAIL, PRESERVED_EVALUATOR_EMAIL]}}})
    print(f"✓ Removed {u_res.deleted_count} test/demo users.")

    # B. Delete other dynamic transaction collections
    c_res = db["centres"].delete_many({})
    print(f"✓ Removed {c_res.deleted_count} test/demo coaching centre profiles.")

    co_res = db["courses"].delete_many({})
    print(f"✓ Removed {co_res.deleted_count} test/demo courses.")

    l_res = db["lessons"].delete_many({})
    print(f"✓ Removed {l_res.deleted_count} test/demo lessons.")

    e_res = db["enrollments"].delete_many({})
    print(f"✓ Removed {e_res.deleted_count} test/demo enrollments.")

    p_res = db["progress"].delete_many({})
    print(f"✓ Removed {p_res.deleted_count} test/demo progress metrics.")

    cm_res = db["chat_messages"].delete_many({})
    cs_res = db["chat_sessions"].delete_many({})
    print(f"✓ Removed {cm_res.deleted_count + cs_res.deleted_count} test AI chat sessions.")

    au_res = db["audit_logs"].delete_many({})
    print(f"✓ Removed {au_res.deleted_count} development audit logs.")

    rl_res = db["rate_limits"].delete_many({})
    print(f"✓ Removed {rl_res.deleted_count} rate limit sessions.")

    # C. Verify preservation status
    print("\n--- PHASE 3: VERIFICATION POST-CLEANUP ---")
    remaining_admin = db["users"].find_one({"email": PRESERVED_ADMIN_EMAIL})
    remaining_evaluator = db["users"].find_one({"email": PRESERVED_EVALUATOR_EMAIL})
    
    if remaining_admin:
        print(f"✅ CONFIRMED: Admin user '{PRESERVED_ADMIN_EMAIL}' is preserved successfully.")
    else:
        print(f"❌ ERROR: Admin user '{PRESERVED_ADMIN_EMAIL}' was not found.")

    if remaining_evaluator:
        print(f"✅ CONFIRMED: Evaluator user '{PRESERVED_EVALUATOR_EMAIL}' is preserved successfully.")

    print(f"Remaining Users: {db['users'].count_documents({})}")
    print(f"Remaining Categories: {db['categories'].count_documents({})}")
    print(f"Remaining Skills: {db['skills'].count_documents({})}")
    print("\n==================================================")
    print("     NARINEXUS DATABASE CLEANUP SUCCESSFUL!       ")
    print("==================================================")

if __name__ == "__main__":
    confirm = "--confirm" in sys.argv
    run_cleanup(confirm=confirm)
