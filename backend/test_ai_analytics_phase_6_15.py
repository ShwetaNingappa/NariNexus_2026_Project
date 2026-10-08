import urllib.request
import urllib.parse
import json
import uuid
import sys
import subprocess
import os
import time

API_BASE = "http://127.0.0.1:8001/api"
AUTH_URL = f"{API_BASE}/auth"
AI_ANALYTICS_URL = f"{API_BASE}/admin/analytics/ai-insights"

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

def run_phase_6_15_tests():
    print("==================================================")
    print("RUNNING NARINEXUS PHASE 6.15 AI ANALYTICS TESTS")
    print("==================================================")

    admin_email = f"ai_analytics_admin_{uuid.uuid4().hex[:6]}@narinexus.org"
    learner_email = f"learner_{uuid.uuid4().hex[:6]}@gmail.com"
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

    # Normal registration/login for Learners
    def register_and_login_public(email, role):
        reg_status, reg_res = make_request(
            f"{AUTH_URL}/register",
            data={"name": f"Test {role.capitalize()}", "email": email, "password": password, "role": role},
            method="POST"
        )
        if reg_status != 200:
            print(f"❌ Fail registering user {email}: {reg_res}")
            return None

        # OTP extraction and verification with robust polling retry for filesystem write sync
        otp_log_file = os.path.join(os.path.dirname(__file__), "app", "services", "dev_otp_log.json")
        otp_val = "123456"
        import time
        for poll_attempt in range(6):
            if os.path.exists(otp_log_file):
                try:
                    with open(otp_log_file, "r") as f:
                        log_data = json.load(f)
                        val = log_data.get(email)
                        if val:
                            if isinstance(val, dict):
                                otp_val = val.get("otp", "123456")
                            else:
                                otp_val = val
                            break
                except Exception:
                    pass
            if poll_attempt < 5:
                time.sleep(0.2)

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

    if not admin_token or not learner_token:
        print("❌ Fail: Could not bootstrap test tokens.")
        sys.exit(1)

    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    learner_headers = {"Authorization": f"Bearer {learner_token}"}

    # 1. Reject Learner
    print("Test 1: Verifying Learner role is forbidden from AI Analytics Insights...")
    status, res = make_request(AI_ANALYTICS_URL, headers=learner_headers)
    if status == 403:
        print("✅ Pass: Learner rejected with 403.")
    else:
        print(f"❌ Fail: Expected 403, got {status}: {res}")
        sys.exit(1)

    # 2. Admin authorized successfully & metrics validated
    print("Test 2: Authorized Administrator retrieves AI Insights...")
    status, res = make_request(AI_ANALYTICS_URL, headers=admin_headers)
    if status == 200 and res.get("success") is True and "insights" in res:
        print("✅ Pass: Admin authorized successfully. AI Insights retrieved.")
        insights_text = res["insights"]
    else:
        print(f"❌ Fail: Expected 200, got {status}: {res}")
        sys.exit(1)

    # 3. Multilingual safety validation
    print("Test 3: Checking multilingual behavior for Kannada 'kn' insights...")
    status, res = make_request(f"{AI_ANALYTICS_URL}?lang=kn", headers=admin_headers)
    if status == 200 and res.get("success") is True and res.get("language") == "kn":
        print("✅ Pass: Multilingual Kannada insights retrieved cleanly.")
    else:
        print(f"❌ Fail: Expected Kannada insights, got status {status}: {res}")
        sys.exit(1)

    # 4. Safe failure fallback validation
    print("Test 4: Verifying Gemini direct SDK call with safe fallback handler...")
    from backend.app.services.ai_analytics_service import AIAnalyticsService
    
    # Try calling AI service with dummy/empty metric dictionary. Should trigger safe fallback
    fallback_res = AIAnalyticsService.generate_analytics_insights({}, lang="en")
    assert fallback_res.get("success") is True, "Fallback insights failed"
    assert "Safe Deterministic Fallback" in fallback_res.get("source", ""), "Fallback did not use correct source marker"
    print("✅ Pass: AI Service safely falls back to local precalculated insights on null data or provider failure.")

    # 5. Rate limiting safety gate check
    print("Test 5: Testing lightweight rate limiter blocks flood requests...")
    # Send 5 rapid requests. Rate limit is set to 3 requests per 10 seconds.
    blocked = False
    for _ in range(5):
        status, res = make_request(AI_ANALYTICS_URL, headers=admin_headers)
        if status == 429:
            blocked = True
            break
            
    if blocked:
        print("✅ Pass: Rate limiter correctly blocked rapid requests with 429 Too Many Requests.")
    else:
        print("❌ Fail: Rate limiter failed to trigger under flood requests!")
        sys.exit(1)

    print("==================================================")
    print("ALL PHASE 6.15 TESTS PASSED SUCCESSFULLY!")
    print("==================================================")

    # Prior Phase regressions
    print("Running regressions...")
    reg_status = subprocess.run(["python3", "-u", "backend/test_platform_analytics_phase_6_14.py"], capture_output=True, text=True)
    if reg_status.returncode == 0:
        print("✅ Regression PASSED: backend/test_platform_analytics_phase_6_14.py")
    else:
        print("❌ Regression FAILED: backend/test_platform_analytics_phase_6_14.py")
        print(reg_status.stdout)
        print(reg_status.stderr)
        sys.exit(1)

if __name__ == "__main__":
    run_phase_6_15_tests()
