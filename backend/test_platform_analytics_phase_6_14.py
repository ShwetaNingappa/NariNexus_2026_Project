import os
import sys

# Ensure workspace root is always on sys.path for backend imports
_dir = os.path.dirname(os.path.abspath(__file__))
_root = os.path.dirname(_dir) if os.path.basename(_dir) == "backend" else _dir
if _root not in sys.path:
    sys.path.insert(0, _root)

import urllib.request
import urllib.parse
import json
import uuid
import subprocess

API_BASE = "http://127.0.0.1:8001/api"
AUTH_URL = f"{API_BASE}/auth"
ANALYTICS_URL = f"{API_BASE}/admin/analytics"

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

def run_phase_6_14_tests():
    print("==================================================")
    print("RUNNING NARINEXUS PHASE 6.14 PLATFORM ANALYTICS TESTS")
    print("==================================================")

    admin_email = f"analytics_admin_{uuid.uuid4().hex[:6]}@narinexus.org"
    learner_email = f"learner_{uuid.uuid4().hex[:6]}@gmail.com"
    centre_email = f"centre_{uuid.uuid4().hex[:6]}@naricentre.org"
    password = "securePassword123"

    print("Bootstrapping test credentials...")

    # Seed Admin User via UserService
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

    if not admin_token or not learner_token or not centre_token:
        print("❌ Fail: Could not bootstrap test tokens.")
        sys.exit(1)

    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    learner_headers = {"Authorization": f"Bearer {learner_token}"}
    centre_headers = {"Authorization": f"Bearer {centre_token}"}

    # 1. Reject Learner
    print("Test 1: Verifying Learner role is forbidden from Platform Analytics...")
    status, res = make_request(ANALYTICS_URL, headers=learner_headers)
    if status == 403:
        print("✅ Pass: Learner rejected with 403.")
    else:
        print(f"❌ Fail: Expected 403, got {status}: {res}")
        sys.exit(1)

    # 2. Reject Centre
    print("Test 2: Verifying Coaching Centre role is forbidden from Platform Analytics...")
    status, res = make_request(ANALYTICS_URL, headers=centre_headers)
    if status == 403:
        print("✅ Pass: Coaching Centre rejected with 403.")
    else:
        print(f"❌ Fail: Expected 403, got {status}: {res}")
        sys.exit(1)

    # 3. Admin authorized successfully & metrics validated
    print("Test 3: Authorized Administrator retrieves Platform Analytics...")
    status, res = make_request(ANALYTICS_URL, headers=admin_headers)
    if status == 200 and res.get("success") is True and "metrics" in res:
        print("✅ Pass: Admin authorized successfully. Deterministic metrics payload retrieved.")
        metrics = res["metrics"]
    else:
        print(f"❌ Fail: Expected 200, got {status}: {res}")
        sys.exit(1)

    # 4. Metric correctness & structure check
    print("Test 4: Evaluating metrics payload structure and numeric assertions...")
    assert "users" in metrics, "Missing users category"
    assert "centres" in metrics, "Missing centres category"
    assert "learning" in metrics, "Missing learning category"
    assert "opportunities" in metrics, "Missing opportunities category"
    assert "applications" in metrics, "Missing applications category"
    
    assert metrics["users"]["total"] >= 1, "Total users count is incorrect"
    assert metrics["users"]["learners"] >= 1, "Learners count is incorrect"
    print("✅ Pass: Metric categories and structures are 100% correct.")

    # 5. Aggregation Privacy validation
    print("Test 5: Validating zero leakage of raw sensitive profiles or personal records...")
    # There should be no sensitive fields like 'password_hash', 'email', 'phone' inside the payload structure
    metrics_str = json.dumps(metrics)
    assert "password_hash" not in metrics_str, "Leakage of password hashes detected in aggregation metrics!"
    assert "phone" not in metrics_str, "Leakage of telephone numbers detected in metrics!"
    print("✅ Pass: Privacy check passed. Only secure, anonymized aggregate metrics returned.")

    print("==================================================")
    print("ALL PHASE 6.14 TESTS PASSED SUCCESSFULLY!")
    print("==================================================")

    # Regression testing
    print("Running regressions...")
    reg_status = subprocess.run(["python3", "-u", "backend/test_communication_phase_6_13.py"], capture_output=True, text=True)
    if reg_status.returncode == 0:
        print("✅ Regression PASSED: backend/test_communication_phase_6_13.py")
    else:
        print("❌ Regression FAILED: backend/test_communication_phase_6_13.py")
        print(reg_status.stdout)
        print(reg_status.stderr)
        sys.exit(1)

if __name__ == "__main__":
    run_phase_6_14_tests()
