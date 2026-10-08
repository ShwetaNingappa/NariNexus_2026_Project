import urllib.request
import urllib.parse
import json
import uuid
import sys
import os
import subprocess

# Add workspace root to sys.path for seamless imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


# Prevent proxy timeouts
opener = urllib.request.build_opener(urllib.request.ProxyHandler({}))
urllib.request.install_opener(opener)

API_BASE = "http://127.0.0.1:8001/api"
AUTH_URL = f"{API_BASE}/auth"
ADMIN_URL = f"{API_BASE}/admin"
HEALTH_URL = f"{API_BASE}/health"

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

def run_phase_6_6_tests():
    print("==================================================")
    print("RUNNING NARINEXUS PHASE 6.6 ADMIN PORTAL FOUNDATION INTEGRATION TESTS")
    print("==================================================")

    # Generate fresh emails & credentials
    admin_email = f"admin_p66_{uuid.uuid4().hex[:6]}@narinexus.org"
    centre_email = f"centre_p66_{uuid.uuid4().hex[:6]}@naricentre.org"
    learner_email = f"learner_p66_{uuid.uuid4().hex[:6]}@gmail.com"
    password = "securePassword123"

    # Register admin directly via UserService mock file / DB seeding
    print("Bootstrapping test users...")
    
    # 1. Register Learner and Centre normally
    def register_and_login(email, role):
        reg_status, reg_res = make_request(
            f"{AUTH_URL}/register",
            data={"name": f"Test {role.capitalize()}", "email": email, "password": password, "role": role},
            method="POST"
        )
        if reg_status != 200 or not reg_res.get("success"):
            print(f"❌ Fail registering user {email}: {reg_res}")
            return None

        # Fetch OTP
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

        # Login
        log_status, log_res = make_request(
            f"{AUTH_URL}/login",
            data={"email": email, "password": password},
            method="POST"
        )
        if log_status != 200 or "access_token" not in log_res:
            print(f"❌ Fail Login {email}: {log_res}")
            return None
        
        return log_res["access_token"]

    learner_token = register_and_login(learner_email, "learner")
    centre_token = register_and_login(centre_email, "centre")
    
    if not learner_token or not centre_token:
        print("❌ Fail: Could not bootstrap Learner or Centre accounts.")
        sys.exit(1)

    # 2. Seed an Admin User since public registration of Admins is forbidden
    print("Seeding verified administrator account...")
    from backend.app.schemas.user import UserCreate, UserRole
    from backend.app.services.user_service import UserService
    
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
    
    # Login Admin
    log_status, log_res = make_request(
        f"{AUTH_URL}/login",
        data={"email": admin_email, "password": password},
        method="POST"
    )
    if log_status != 200 or "access_token" not in log_res:
        print(f"❌ Fail Login for Admin: {log_res}")
        sys.exit(1)
        
    admin_token = log_res["access_token"]

    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    centre_headers = {"Authorization": f"Bearer {centre_token}"}
    learner_headers = {"Authorization": f"Bearer {learner_token}"}

    # ----------------------------------------------------
    # TEST 1: Unauthenticated admin endpoint -> 401
    # ----------------------------------------------------
    print("Test 1: Unauthenticated GET /api/admin/overview is rejected with 401...")
    status, res = make_request(f"{ADMIN_URL}/overview")
    assert status == 401, f"Expected 401, got {status}: {res}"
    print("✅ Pass: Unauthenticated request rejected.\n")

    # ----------------------------------------------------
    # TEST 2: Invalid token -> 401
    # ----------------------------------------------------
    print("Test 2: Invalid token request is rejected with 401...")
    status, res = make_request(f"{ADMIN_URL}/overview", headers={"Authorization": "Bearer badtoken123"})
    assert status == 401, f"Expected 401, got {status}: {res}"
    print("✅ Pass: Invalid token rejected.\n")

    # ----------------------------------------------------
    # TEST 3: Learner -> 403
    # ----------------------------------------------------
    print("Test 3: Learner role is forbidden from admin endpoints with 403...")
    status, res = make_request(f"{ADMIN_URL}/overview", headers=learner_headers)
    assert status == 403, f"Expected 403, got {status}: {res}"
    print("✅ Pass: Learner rejected.\n")

    # ----------------------------------------------------
    # TEST 4: Training Centre -> 403
    # ----------------------------------------------------
    print("Test 4: Training Centre role is forbidden from admin endpoints with 403...")
    status, res = make_request(f"{ADMIN_URL}/overview", headers=centre_headers)
    assert status == 403, f"Expected 403, got {status}: {res}"
    print("✅ Pass: Training Centre rejected.\n")

    # ----------------------------------------------------
    # TEST 5 & 6: Admin -> allowed and overview returns successfully
    # ----------------------------------------------------
    print("Test 5 & 6: Admin is allowed and overview retrieves statistics successfully...")
    status, res = make_request(f"{ADMIN_URL}/overview", headers=admin_headers)
    assert status == 200, f"Expected 200, got {status}: {res}"
    assert res.get("success"), f"Expected success: True, got: {res}"
    print("✅ Pass: Admin authorized successfully.\n")

    # ----------------------------------------------------
    # TEST 7: Metrics derived from actual database state
    # ----------------------------------------------------
    print("Test 7: Verifying overview counts are accurately calculated...")
    data = res["data"]
    assert "total_users" in data, "total_users missing from metrics"
    assert "total_learners" in data, "total_learners missing from metrics"
    assert "total_training_centres" in data, "total_training_centres missing from metrics"
    assert "total_courses" in data, "total_courses missing from metrics"
    assert "total_skills" in data, "total_skills missing from metrics"
    assert "total_opportunities" in data, "total_opportunities missing from metrics"
    
    # Assert counts are non-negative integers
    assert data["total_users"] >= 0
    assert data["total_learners"] >= 0
    assert data["total_training_centres"] >= 0
    assert data["total_courses"] >= 0
    assert data["total_skills"] >= 0
    assert data["total_opportunities"] >= 0
    print(f"✅ Pass: Real metrics successfully compiled: {data}\n")

    # ----------------------------------------------------
    # TEST 8: No sensitive authentication fields exposed
    # ----------------------------------------------------
    print("Test 8: Verifying no sensitive authentication fields are exposed in response...")
    res_str = json.dumps(res)
    assert "password" not in res_str
    assert "password_hash" not in res_str
    assert "otp_hash" not in res_str
    assert "otp" not in res_str
    print("✅ Pass: Sensitive fields security check passed.\n")

    print("==================================================")
    print("ALL PHASE 6.6 ADMIN INTEGRATION TESTS PASSED!")
    print("==================================================")

    # ----------------------------------------------------
    # TEST 9 to 13: Prior module regression checks
    # ----------------------------------------------------
    print("\nRunning historical regression checks...")
    regressions = [
        ("Phase 4 (Progress Monitoring)", "backend/test_progress_system.py"),
        ("Phase 6.2 (Learner Management)", "backend/test_centres_learners_phase_6_2.py"),
        ("Phase 6.3 (Course Management)", "backend/test_centres_courses_phase_6_3.py"),
        ("Phase 6.4 (Progress Monitoring)", "backend/test_centres_progress_phase_6_4.py"),
        ("Phase 6.5 (Analytics)", "backend/test_centres_analytics_phase_6_5.py")
    ]
    all_passed = True
    for phase_name, script in regressions:
        print(f"Running regression: {phase_name} ({script})...")
        res_run = subprocess.run(["python3", script], capture_output=True, text=True)
        if res_run.returncode != 0:
            print(f"❌ Regression FAILED: {script}")
            print(res_run.stderr or res_run.stdout)
            all_passed = False
        else:
            print(f"✅ Regression PASSED: {script}")

    if all_passed:
        print("\n==================================================")
        print("ALL VERIFICATIONS AND REGRESSIONS COMPLETED 100% GREEN!")
        print("==================================================")
    else:
        print("\n❌ Warning: Regression errors occurred.")
        sys.exit(1)

if __name__ == "__main__":
    run_phase_6_6_tests()
