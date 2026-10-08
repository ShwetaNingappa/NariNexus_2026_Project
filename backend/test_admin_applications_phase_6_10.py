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
OPPORTUNITIES_URL = f"{API_BASE}/opportunities"

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

def run_phase_6_10_tests():
    print("==================================================")
    print("RUNNING NARINEXUS PHASE 6.10 APPLICATIONS TESTS")
    print("==================================================")

    admin_email = f"app_tracker_admin_{uuid.uuid4().hex[:6]}@narinexus.org"
    learner_email = f"candidate_learner_{uuid.uuid4().hex[:6]}@gmail.com"
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

    # 1. Admin creates opportunity to apply to
    print("Test 1: Admin registers dynamic opportunity...")
    opp_title = f"Embroidery Assistant {uuid.uuid4().hex[:4]}"
    status, res = make_request(
        f"{ADMIN_URL}/opportunities",
        data={
            "title": opp_title,
            "organization": "Sudarshan Handlooms",
            "description": "Traditional embroidery design roles for local candidates.",
            "opportunity_type": "livelihood",
            "location": "Dharwad, Karnataka",
            "required_skills": ["Handicrafts", "Embroidery"],
            "eligibility": "Basic course completion",
            "deadline": "2026-11-30",
            "compensation": "Stipend of 4,000 INR / month"
        },
        headers=admin_headers,
        method="POST"
    )
    if status == 201:
        opp_id = res["opportunity"]["id"]
        print("✅ Pass: Dynamic opportunity registered.")
    else:
        print(f"❌ Fail: Could not register opportunity: {res}")
        sys.exit(1)

    # 2. Candidate Learner applies to opportunity
    print("Test 2: Candidate Learner submits application to registered opportunity...")
    status, res = make_request(f"{OPPORTUNITIES_URL}/{opp_id}/apply", headers=learner_headers, method="POST")
    if status == 200 and res.get("success") is True:
        print("✅ Pass: Application submitted successfully.")
        app_id = res["application"]["id"]
    else:
        print(f"❌ Fail: Expected 200, got {status}: {res}")
        sys.exit(1)

    # 3. Double application check
    print("Test 3: Prevent duplicate submissions to same opportunity...")
    status, res = make_request(f"{OPPORTUNITIES_URL}/{opp_id}/apply", headers=learner_headers, method="POST")
    if status == 400:
        print("✅ Pass: Double application rejected safely.")
    else:
        print(f"❌ Fail: Double application permitted! Status: {status}")
        sys.exit(1)

    # 4. Admin lists applications
    print("Test 4: Admin lists and searches applications registry...")
    status, res = make_request(f"{ADMIN_URL}/applications", headers=admin_headers)
    found_app = any(a.get("id") == app_id for a in res)
    if status == 200 and found_app:
        print("✅ Pass: Application is visible to platform admin.")
    else:
        print(f"❌ Fail: Newly created application missing from list: {res}")
        sys.exit(1)

    # 5. Admin updates application status
    print("Test 5: Admin updates application tracking status to 'Shortlisted'...")
    status, res = make_request(
        f"{ADMIN_URL}/applications/{app_id}/status",
        data={"status": "Shortlisted"},
        headers=admin_headers,
        method="PUT"
    )
    if status == 200:
        print("✅ Pass: Application tracking status successfully updated.")
    else:
        print(f"❌ Fail: Status update failed with {status}: {res}")
        sys.exit(1)

    # Verify updated status
    status, res = make_request(f"{ADMIN_URL}/applications?status=Shortlisted", headers=admin_headers)
    found_shortlisted = any(a.get("id") == app_id for a in res)
    if status == 200 and found_shortlisted:
        print("✅ Pass: Status upgrade verified as persisted.")
    else:
        print(f"❌ Fail: Updated status check failed: {res}")
        sys.exit(1)

    print("==================================================")
    print("ALL PHASE 6.10 TESTS PASSED SUCCESSFULLY!")
    print("==================================================")

    # Prior Phase regressions
    print("Running regression: Phase 6.9 Opportunities...")
    res_reg = subprocess.run(["python3", "-u", "backend/test_admin_opportunities_phase_6_9.py"], capture_output=True, text=True)
    if res_reg.returncode == 0:
        print("✅ Regression PASSED: backend/test_admin_opportunities_phase_6_9.py")
    else:
        print("❌ Regression FAILED: backend/test_admin_opportunities_phase_6_9.py")
        print(res_reg.stdout)
        print(res_reg.stderr)
        sys.exit(1)

if __name__ == "__main__":
    run_phase_6_10_tests()
