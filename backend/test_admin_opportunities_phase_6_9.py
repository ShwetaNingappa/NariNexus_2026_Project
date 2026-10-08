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

def run_phase_6_9_tests():
    print("==================================================")
    print("RUNNING NARINEXUS PHASE 6.9 OPPORTUNITIES TESTS")
    print("==================================================")

    admin_email = f"opp_admin_{uuid.uuid4().hex[:6]}@narinexus.org"
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

    # 1. Reject Learner from opportunity creation
    print("Test 1: Learner access to Livelihood Opportunity creation is blocked...")
    status, res = make_request(
        f"{ADMIN_URL}/opportunities",
        data={"title": "Unauthorized Job", "organization": "Scam Inc", "description": "Breaching boundaries", "opportunity_type": "livelihood", "location": "Bengaluru", "eligibility": "None", "deadline": "2026-12-31"},
        headers=learner_headers,
        method="POST"
    )
    if status == 403:
        print("✅ Pass: Learner rejected with 403.")
    else:
        print(f"❌ Fail: Expected 403, got {status}: {res}")
        sys.exit(1)

    # 2. Admin successfully creates opportunity
    print("Test 2: Admin successfully creates local livelihood opportunity...")
    opp_title = f"Cotton Weaving Apprentice {uuid.uuid4().hex[:4]}"
    status, res = make_request(
        f"{ADMIN_URL}/opportunities",
        data={
            "title": opp_title,
            "organization": "Sudarshan Handlooms",
            "description": "Learn to operate traditional looms and weaves under local master artisans in Dharwad.",
            "opportunity_type": "livelihood",
            "location": "Dharwad, Karnataka",
            "required_skills": ["Handicrafts", "Weaving"],
            "eligibility": "Basic weaving experience preferred",
            "deadline": "2026-11-30",
            "compensation": "Stipend of 5,000 INR / month"
        },
        headers=admin_headers,
        method="POST"
    )
    if status == 201 and "opportunity" in res:
        print("✅ Pass: Livelihood opportunity created successfully.")
        opp_id = res["opportunity"]["id"]
    else:
        print(f"❌ Fail: Expected 201, got {status}: {res}")
        sys.exit(1)

    # 3. List opportunities and verify item exists
    print("Test 3: Admin lists opportunities and verifies newly created item exists...")
    status, res = make_request(f"{ADMIN_URL}/opportunities", headers=admin_headers)
    found_opp = any(o.get("id") == opp_id for o in res)
    if status == 200 and found_opp:
        print("✅ Pass: Livelihood opportunity registered cleanly in board.")
    else:
        print(f"❌ Fail: Opportunity missing from list. Status {status}")
        sys.exit(1)

    # 4. Admin edits opportunity
    print("Test 4: Admin updates opportunity description & metadata...")
    status, res = make_request(
        f"{ADMIN_URL}/opportunities/{opp_id}",
        data={"compensation": "Stipend of 6,500 INR / month", "deadline": "2026-12-15"},
        headers=admin_headers,
        method="PUT"
    )
    if status == 200:
        print("✅ Pass: Opportunity metadata updated successfully.")
    else:
        print(f"❌ Fail: Expected 200, got {status}: {res}")
        sys.exit(1)

    print("==================================================")
    print("ALL PHASE 6.9 TESTS PASSED SUCCESSFULLY!")
    print("==================================================")

    # Prior Phase regression
    print("Running regression: Phase 6.8 Global Catalog...")
    res_reg = subprocess.run(["python3", "-u", "backend/test_admin_catalog_phase_6_8.py"], capture_output=True, text=True)
    if res_reg.returncode == 0:
        print("✅ Regression PASSED: backend/test_admin_catalog_phase_6_8.py")
    else:
        print("❌ Regression FAILED: backend/test_admin_catalog_phase_6_8.py")
        print(res_reg.stdout)
        print(res_reg.stderr)
        sys.exit(1)

if __name__ == "__main__":
    run_phase_6_9_tests()
