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
NOTIFICATIONS_URL = f"{API_BASE}/notifications"

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

def run_phase_6_11_tests():
    print("==================================================")
    print("RUNNING NARINEXUS PHASE 6.11 NOTIFICATIONS TESTS")
    print("==================================================")

    # 1. Bootstrap two distinct users (Learner A and Learner B)
    learner_a_email = f"notif_learner_a_{uuid.uuid4().hex[:6]}@gmail.com"
    learner_b_email = f"notif_learner_b_{uuid.uuid4().hex[:6]}@gmail.com"
    password = "securePassword123"

    print("Bootstrapping test learners...")

    def register_and_login_public(email, name):
        reg_status, reg_res = make_request(
            f"{AUTH_URL}/register",
            data={"name": name, "email": email, "password": password, "role": "learner"},
            method="POST"
        )
        if reg_status != 200:
            print(f"❌ Fail registering user {email}: {reg_res}")
            return None

        # Dev OTP Extraction
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
            
        return log_res["access_token"], log_res["user"]["id"]

    a_res = register_and_login_public(learner_a_email, "Learner A")
    b_res = register_and_login_public(learner_b_email, "Learner B")

    if not a_res or not b_res:
        print("❌ Fail: Could not bootstrap test user tokens.")
        sys.exit(1)

    a_token, a_uid = a_res
    b_token, b_uid = b_res

    a_headers = {"Authorization": f"Bearer {a_token}"}
    b_headers = {"Authorization": f"Bearer {b_token}"}

    # 2. Test 1: Unauthenticated request rejected
    print("Test 1: Unauthenticated GET /api/notifications is rejected...")
    status, res = make_request(NOTIFICATIONS_URL)
    if status == 401:
        print("✅ Pass: Unauthenticated request correctly blocked.")
    else:
        print(f"❌ Fail: Expected 401, got {status}: {res}")
        sys.exit(1)

    # 3. Test 2: Notification creation & retrieval
    print("Test 2: Spawning and verifying notification creation for Learner A...")
    from backend.app.services.notification_service import NotificationService
    
    # Create notification for Learner A
    notif = NotificationService.create_notification(
        recipient_id=a_uid,
        title="Test Notification Title",
        message="This is a test notification message for testing read/unread counts.",
        type="system_notification"
    )
    if notif and "id" in notif:
        print("✅ Pass: Safe notification creation succeeded.")
        notif_id = notif["id"]
    else:
        print(f"❌ Fail: Could not create notification. Got: {notif}")
        sys.exit(1)

    # Fetch Learner A notifications
    status, res = make_request(NOTIFICATIONS_URL, headers=a_headers)
    found_notif = any(n.get("id") == notif_id for n in res)
    if status == 200 and found_notif:
        print("✅ Pass: Learner A successfully retrieved their own notification.")
    else:
        print(f"❌ Fail: Expected 200 and notification to be retrieved, got status {status}: {res}")
        sys.exit(1)

    # 4. Test 3: Unread Count check
    print("Test 3: Checking unread count matches...")
    status, res = make_request(f"{NOTIFICATIONS_URL}/unread-count", headers=a_headers)
    if status == 200 and res.get("unread_count") == 1:
        print("✅ Pass: Unread count correct.")
    else:
        print(f"❌ Fail: Expected unread_count=1, got status {status}: {res}")
        sys.exit(1)

    # 5. Test 4: Strict Server-side User Isolation
    print("Test 4: Enforcing cross-tenant user isolation (Learner B fetching A)...")
    # Learner B fetches their notifications. Should NOT see Learner A's notification
    status, res = make_request(NOTIFICATIONS_URL, headers=b_headers)
    found_a_notif = any(n.get("id") == notif_id for n in res)
    if status == 200 and not found_a_notif:
        print("✅ Pass: Learner B cannot view Learner A's private notification.")
    else:
        print(f"❌ Fail: Cross-tenant data leak detected! Learner B retrieved A's notification: {res}")
        sys.exit(1)

    # Learner B tries to mark Learner A's notification as read. Should be rejected (404)
    status, res = make_request(f"{NOTIFICATIONS_URL}/{notif_id}/read", headers=b_headers, method="PUT")
    if status == 404:
        print("✅ Pass: Learner B blocked from marking Learner A's notification as read.")
    else:
        print(f"❌ Fail: Expected 404, got {status}: {res}")
        sys.exit(1)

    # 6. Test 5: Read State and count updates
    print("Test 5: Learner A marking their own notification as read...")
    status, res = make_request(f"{NOTIFICATIONS_URL}/{notif_id}/read", headers=a_headers, method="PUT")
    if status == 200 and res.get("success") is True:
        print("✅ Pass: Notification successfully marked as read.")
    else:
        print(f"❌ Fail: Expected 200, got {status}: {res}")
        sys.exit(1)

    # Check unread count is now 0
    status, res = make_request(f"{NOTIFICATIONS_URL}/unread-count", headers=a_headers)
    if status == 200 and res.get("unread_count") == 0:
        print("✅ Pass: Unread count updated to 0 successfully.")
    else:
        print(f"❌ Fail: Expected unread_count=0, got status {status}: {res}")
        sys.exit(1)

    # 7. Test 6: Invalid IDs handling
    print("Test 6: Safe failure check with invalid notification ID...")
    status, res = make_request(f"{NOTIFICATIONS_URL}/invalid-notif-id-123/read", headers=a_headers, method="PUT")
    if status == 404:
        print("✅ Pass: Invalid ID safely rejected.")
    else:
        print(f"❌ Fail: Expected 404 for invalid ID, got {status}")
        sys.exit(1)

    print("==================================================")
    print("ALL PHASE 6.11 TESTS PASSED SUCCESSFULLY!")
    print("==================================================")

    # Prior Phase regressions (Phase 6.10, Phase 6.9, etc.)
    print("Running prior phase regressions...")
    regressions = [
        ("Phase 6.10 Application Tracking", "backend/test_admin_applications_phase_6_10.py")
    ]
    for name, path in regressions:
        print(f"Running regression check: {name} ({path})...")
        res = subprocess.run(["python3", "-u", path], capture_output=True, text=True)
        if res.returncode == 0:
            print(f"✅ Regression PASSED: {path}")
        else:
            print(f"❌ Regression FAILED: {path}")
            print(res.stdout)
            print(res.stderr)
            sys.exit(1)

if __name__ == "__main__":
    run_phase_6_11_tests()
