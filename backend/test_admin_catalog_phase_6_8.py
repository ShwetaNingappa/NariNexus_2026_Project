import urllib.request
import urllib.parse
import json
import uuid
import sys
import subprocess
import os

API_BASE = "http://127.0.0.1:8001/api"
AUTH_URL = f"{API_BASE}/auth"
ADMIN_URL = f"{API_BASE}/admin"

def make_request(url, data=None, headers=None, method='GET'):
    if headers is None:
        headers = {}
    
    req_data = None
    if data is not None:
        req_data = json.dumps(data).encode('utf-8')
        headers['Content-Type'] = 'application/json'
    
    req = urllib.request.Request(url, data=req_data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as response:
            status_code = response.getcode()
            body = response.read().decode('utf-8')
            return status_code, json.loads(body)
    except urllib.error.HTTPError as e:
        status_code = e.getcode()
        body = e.read().decode('utf-8')
        try:
            return status_code, json.loads(body)
        except Exception:
            return status_code, body
    except Exception as e:
        return 500, str(e)

def run_phase_6_8_tests():
    print("==================================================")
    print("RUNNING NARINEXUS PHASE 6.8 GLOBAL CATALOG TESTS")
    print("==================================================")

    admin_email = f"catalog_admin_{uuid.uuid4().hex[:6]}@narinexus.org"
    learner_email = f"learner_{uuid.uuid4().hex[:6]}@gmail.com"
    password = "securePassword123"

    print("Bootstrapping test credentials...")

    # Seeding Admin User via UserService directly
    from backend.app.schemas.user import UserCreate, UserRole
    from backend.app.services.user_service import UserService
    
    print("Seeding verified administrator account...")
    admin_in = UserCreate(
        name="Platform Administrator",
        email=admin_email,
        password=password,
        role=UserRole.ADMIN,
        preferred_language="en",
        profile_completed=True
    )
    admin_user = UserService.create_user(admin_in)
    UserService.update_user_fields(admin_user["id"], {"is_verified": True})

    def register_and_login_public(email, role):
        reg_status, reg_res = make_request(
            f"{AUTH_URL}/register",
            data={"name": f"Test {role.capitalize()}", "email": email, "password": password, "role": role},
            method="POST"
        )
        if reg_status != 200:
            print(f"❌ Fail registering user {email}: {reg_res}")
            return None

        otp_log_file = os.path.join(os.path.dirname(__file__), "app", "services", "dev_otp_log.json")
        otp_val = "123456"
        if os.path.exists(otp_log_file):
            try:
                with open(otp_log_file, "r") as f:
                    log_data = json.load(f)
                    otp_val = log_data.get(email, "123456")
                    if isinstance(otp_val, dict):
                        otp_val = otp_val.get("otp", "123456")
            except Exception:
                pass

        otp_status, otp_res = make_request(
            f"{AUTH_URL}/verify-otp",
            data={"email": email, "otp": otp_val, "purpose": "verification"},
            method="POST"
        )
        if otp_status != 200:
            print(f"❌ Fail OTP verify {email}: {otp_res}")
            return None

        log_status, log_res = make_request(
            f"{AUTH_URL}/login",
            data={"email": email, "password": password},
            method="POST"
        )
        if log_status != 200 or "access_token" not in log_res:
            print(f"❌ Fail login for {email}: {log_res}")
            return None
            
        return log_res["access_token"]

    admin_login_status, admin_login_res = make_request(
        f"{AUTH_URL}/login",
        data={"email": admin_email, "password": password},
        method="POST"
    )
    if admin_login_status != 200 or "access_token" not in admin_login_res:
        print(f"❌ Fail admin login: {admin_login_res}")
        sys.exit(1)

    admin_token = admin_login_res["access_token"]
    learner_token = register_and_login_public(learner_email, "learner")

    if not admin_token or not learner_token:
        print("❌ Fail: Could not bootstrap test tokens.")
        sys.exit(1)

    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    learner_headers = {"Authorization": f"Bearer {learner_token}"}

    # 1. Reject Learner from skill creation
    print("Test 1: Learner access to Skill creation is blocked...")
    status, res = make_request(
        f"{ADMIN_URL}/skills",
        data={"category_id": "digital-skills", "name": "Hack Skill", "description": "Breaching database limits", "difficulty": "Advanced", "estimated_duration": "1 Week"},
        headers=learner_headers,
        method="POST"
    )
    if status == 403:
        print("✅ Pass: Learner rejected with 403.")
    else:
        print(f"❌ Fail: Expected 403, got {status}: {res}")
        sys.exit(1)

    # 2. Admin successfully creates skill
    print("Test 2: Admin successfully registers global skill in catalog...")
    skill_name = f"Tailoring Expert {uuid.uuid4().hex[:4]}"
    status, res = make_request(
        f"{ADMIN_URL}/skills",
        data={"category_id": "handicrafts", "name": skill_name, "description": "Mastering intermediate and advanced cutting patterns.", "difficulty": "Intermediate", "estimated_duration": "4 Weeks"},
        headers=admin_headers,
        method="POST"
    )
    if status == 201 and "skill" in res:
        print("✅ Pass: Global skill created successfully.")
        skill_id = res["skill"]["id"]
    else:
        print(f"❌ Fail: Expected 201, got {status}: {res}")
        sys.exit(1)

    # 3. List skills and verify item exists
    print("Test 3: Admin lists skills and verifies newly registered item exists...")
    status, res = make_request(f"{ADMIN_URL}/skills", headers=admin_headers)
    found_skill = any(s.get("id") == skill_id for s in res)
    if status == 200 and found_skill:
        print("✅ Pass: Skill registered cleanly in platform-level catalog.")
    else:
        print(f"❌ Fail: Skill missing from list. Status {status}")
        sys.exit(1)

    # 4. Admin edits skill
    print("Test 4: Admin updates global skill description...")
    status, res = make_request(
        f"{ADMIN_URL}/skills/{skill_id}",
        data={"description": "Updated cutting patterns with local South Indian artisan embroideries."},
        headers=admin_headers,
        method="PUT"
    )
    if status == 200:
        print("✅ Pass: Skill modified successfully.")
    else:
        print(f"❌ Fail: Expected 200, got {status}: {res}")
        sys.exit(1)

    # 5. Admin creates global course under newly created skill
    print("Test 5: Admin registers new published course catalog item...")
    course_title = f"Professional Kurti Pattern-making {uuid.uuid4().hex[:4]}"
    status, res = make_request(
        f"{ADMIN_URL}/courses",
        data={
            "title": course_title,
            "description": "Learn to draft, mark, and sew beautiful tailored kurtis with local artisans.",
            "skill_id": skill_id,
            "category_id": "handicrafts",
            "thumbnail": "https://images.unsplash.com/photo-1544816155-12df9643f363",
            "difficulty": "intermediate",
            "duration": "12 hours",
            "learning_mode": "offline",
            "instructor": "Smita Hegde"
        },
        headers=admin_headers,
        method="POST"
    )
    if status == 201 and "course" in res:
        print("✅ Pass: Course published successfully.")
        course_id = res["course"]["id"]
    else:
        print(f"❌ Fail: Expected 201, got {status}: {res}")
        sys.exit(1)

    # 6. List courses and edit active status
    print("Test 6: Admin updates course catalog metadata & toggles status...")
    status, res = make_request(
        f"{ADMIN_URL}/courses/{course_id}",
        data={"is_active": False, "duration": "16 hours"},
        headers=admin_headers,
        method="PUT"
    )
    if status == 200:
        print("✅ Pass: Course modified successfully.")
    else:
        print(f"❌ Fail: Expected 200, got {status}: {res}")
        sys.exit(1)

    print("==================================================")
    print("ALL PHASE 6.8 TESTS PASSED SUCCESSFULLY!")
    print("==================================================")

    # Prior Phase regression
    print("Running regression: Phase 6.7 Admin Users & Roles...")
    res_reg = subprocess.run(["python3", "-u", "backend/test_admin_users_phase_6_7.py"], capture_output=True, text=True)
    if res_reg.returncode == 0:
        print("✅ Regression PASSED: backend/test_admin_users_phase_6_7.py")
    else:
        print("❌ Regression FAILED: backend/test_admin_users_phase_6_7.py")
        print(res_reg.stdout)
        print(res_reg.stderr)
        sys.exit(1)

if __name__ == "__main__":
    run_phase_6_8_tests()
