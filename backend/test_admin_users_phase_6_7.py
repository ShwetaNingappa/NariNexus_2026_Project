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

def run_phase_6_7_tests():
    print("==================================================")
    print("RUNNING NARINEXUS PHASE 6.7 ADMIN USERS & ROLES TESTS")
    print("==================================================")

    # Generate emails
    admin_email = f"system_admin_{uuid.uuid4().hex[:6]}@narinexus.org"
    learner_email = f"learner_{uuid.uuid4().hex[:6]}@gmail.com"
    centre_email = f"centre_{uuid.uuid4().hex[:6]}@naricentre.org"
    target_subject_email = f"subject_{uuid.uuid4().hex[:6]}@gmail.com"
    password = "securePassword123"

    print("Bootstrapping test users with distinct roles...")

    # Seeding Admin User via UserService directly (since public registration of admins is blocked)
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

    # Normal registration/login for Learners and Centres
    def register_and_login_public(email, role):
        reg_status, reg_res = make_request(
            f"{AUTH_URL}/register",
            data={"name": f"Test {role.capitalize()}", "email": email, "password": password, "role": role},
            method="POST"
        )
        if reg_status != 200:
            print(f"❌ Fail registering user {email}: {reg_res}")
            return None

        # OTP extraction and verification
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
            print(f"❌ Fail OTP verification for {email}: {otp_res}")
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
    centre_token = register_and_login_public(centre_email, "centre")
    subject_token = register_and_login_public(target_subject_email, "learner")

    if not admin_token or not learner_token or not centre_token or not subject_token:
        print("❌ Fail: Could not bootstrap test tokens.")
        sys.exit(1)

    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    learner_headers = {"Authorization": f"Bearer {learner_token}"}
    centre_headers = {"Authorization": f"Bearer {centre_token}"}

    # 1. Unauthenticated rejection
    print("Test 1: Unauthenticated GET /api/admin/users is rejected...")
    status, res = make_request(f"{ADMIN_URL}/users")
    if status == 401:
        print("✅ Pass: Unauthenticated request rejected.")
    else:
        print(f"❌ Fail: Expected 401, got {status}")
        sys.exit(1)

    # 2. Learner role rejection
    print("Test 2: Learner role is forbidden from user directory endpoint...")
    status, res = make_request(f"{ADMIN_URL}/users", headers=learner_headers)
    if status == 403:
        print("✅ Pass: Learner rejected successfully.")
    else:
        print(f"❌ Fail: Expected 403, got {status}")
        sys.exit(1)

    # 3. Training Centre role rejection
    print("Test 3: Training Centre role is forbidden from user directory endpoint...")
    status, res = make_request(f"{ADMIN_URL}/users", headers=centre_headers)
    if status == 403:
        print("✅ Pass: Training Centre rejected successfully.")
    else:
        print(f"❌ Fail: Expected 403, got {status}")
        sys.exit(1)

    # 4. Admin authorized access
    print("Test 4: Admin authorized successfully to retrieve directory...")
    status, res = make_request(f"{ADMIN_URL}/users", headers=admin_headers)
    if status == 200 and res.get("success") is True:
        print("✅ Pass: Admin authorized successfully.")
    else:
        print(f"❌ Fail: Expected 200, got {status}: {res}")
        sys.exit(1)

    # 5. Search and filter correctness
    print("Test 5: Validating search/filter and pagination logic on directory...")
    import time
    for attempt in range(4):
        status, res = make_request(f"{ADMIN_URL}/users?search={target_subject_email}", headers=admin_headers)
        if status == 200 and len(res.get("users", [])) == 1:
            print("✅ Pass: Directory search query matched exactly on attempt", attempt + 1)
            subject_id = res["users"][0]["id"]
            break
        elif attempt < 3:
            time.sleep(0.5)
        else:
            print(f"❌ Fail: Search query did not locate the subject after {attempt+1} attempts. Got: {res}")
            sys.exit(1)

    # 6. Safety check: sensitive passwords / OTPs not exposed
    print("Test 6: Privacy check: verifying password hashes and OTP values are not exposed in payload...")
    for u in res.get("users", []):
        if "password_hash" in u or "otp_hash" in u or "otp" in u:
            print(f"❌ Fail: Privacy violation, sensitive auth fields leaked: {u}")
            sys.exit(1)
    print("✅ Pass: Zero credentials exposed in directory payloads.")

    # 7. Status Toggle & Lockout Protection
    print("Test 7: Attempting user status toggles & safety lockout checks...")
    # Deactivate the learner subject
    status, res = make_request(f"{ADMIN_URL}/users/{subject_id}/status", data={"is_active": False}, headers=admin_headers, method="PUT")
    if status == 200:
        print("✅ Pass: Successfully deactivated non-admin user.")
    else:
        print(f"❌ Fail: Could not deactivate learner: {res}")
        sys.exit(1)

    # Verify deactivation persisted
    status, res = make_request(f"{ADMIN_URL}/users?search={target_subject_email}", headers=admin_headers)
    if status == 200 and res["users"][0]["is_active"] is False:
        print("✅ Pass: Deactivation persisted safely.")
    else:
        print(f"❌ Fail: Deactivation did not persist: {res}")
        sys.exit(1)

    # Admin deactivating themselves should be rejected
    status, res = make_request(f"{ADMIN_URL}/users", headers=admin_headers)
    admin_user_id = None
    for u in res.get("users", []):
        if u.get("email") == admin_email:
            admin_user_id = u.get("id")
            break
            
    if admin_user_id:
        status, res = make_request(f"{ADMIN_URL}/users/{admin_user_id}/status", data={"is_active": False}, headers=admin_headers, method="PUT")
        if status == 400:
            print("✅ Pass: Safety Lockout Check prevented admin from deactivating their own account.")
        else:
            print(f"❌ Fail: Admin successfully self-deactivated! Status: {status}")
            sys.exit(1)

    # 8. Role Management & Safety checks
    print("Test 8: Testing role modifications and lockout protections...")
    # Change subject role to centre
    status, res = make_request(f"{ADMIN_URL}/users/{subject_id}/role", data={"role": "centre"}, headers=admin_headers, method="PUT")
    if status == 200:
        print("✅ Pass: Safely changed user role.")
    else:
        print(f"❌ Fail: Failed to modify role: {res}")
        sys.exit(1)

    # Invalid role check
    status, res = make_request(f"{ADMIN_URL}/users/{subject_id}/role", data={"role": "god_mode"}, headers=admin_headers, method="PUT")
    if status in [400, 422]:
        print("✅ Pass: Invalid role assignment rejected.")
    else:
        print(f"❌ Fail: Invalid role allowed! Status: {status}")
        sys.exit(1)

    print("==================================================")
    print("ALL PHASE 6.7 TESTS PASSED SUCCESSFULLY!")
    print("==================================================")

    # Prior Phase regressions
    print("Running prior phase regression checks...")
    regressions = [
        ("Phase 6.6 Admin Overview", "backend/test_admin_portal_phase_6_6.py")
    ]
    for name, path in regressions:
        print(f"Running regression: {name} ({path})...")
        res = subprocess.run(["python3", "-u", path], capture_output=True, text=True)
        if res.returncode == 0:
            print(f"✅ Regression PASSED: {path}")
        else:
            print(f"❌ Regression FAILED: {path}")
            print(res.stdout)
            print(res.stderr)
            sys.exit(1)

if __name__ == "__main__":
    run_phase_6_7_tests()
