import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import urllib.request
import urllib.parse
import json
import uuid
import subprocess

BASE_AUTH_URL = "http://127.0.0.1:8001/api/auth"
BASE_ENROLL_URL = "http://127.0.0.1:8001/api/enrollments"
HEALTH_URL = "http://127.0.0.1:8001/api/health"

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

def register_and_login(email_prefix: str, role: str) -> str:
    email = f"{email_prefix}_{uuid.uuid4().hex[:6]}@example.com"
    password = "securePassword123"

    # Register admin as a learner first
    reg_role = "learner" if role == "admin" else role

    status, res = make_request(
        f"{BASE_AUTH_URL}/register",
        data={"name": f"Test {role.capitalize()}", "email": email, "password": password, "role": reg_role},
        method="POST"
    )
    assert status == 200, f"Registration failed for {role}: {res}"

    status, res_otp = make_request(f"{BASE_AUTH_URL}/dev-last-otp?email={email}")
    otp_code = res_otp["otp"]

    status, res_verify = make_request(
        f"{BASE_AUTH_URL}/verify-otp",
        data={"email": email, "otp": otp_code},
        method="POST"
    )
    assert status == 200, f"Verification failed for {role}: {res_verify}"

    # Upgrade learner to admin if needed
    if role == "admin":
        from backend.app.core.database import db_instance
        from backend.app.services.user_service import UserService, load_mock_users, save_mock_users
        
        db_instance.connect()
        db = db_instance.get_db()
        if db is not None:
            db["users"].update_one({"email": email}, {"$set": {"role": "admin"}})
        else:
            users = load_mock_users()
            for uid, u in users.items():
                if u.get("email") == email:
                    u["role"] = "admin"
                    break
            save_mock_users(users)

    status, res_login = make_request(
        f"{BASE_AUTH_URL}/login",
        data={"email": email, "password": password},
        method="POST"
    )
    assert status == 200, f"Login failed for {role}: {res_login}"
    return res_login["access_token"]

def run_enrollment_tests():
    print("==================================================")
    print("RUNNING PHASE 4.1 ENROLLMENT SYSTEM INTEGRATION TESTS")
    print("==================================================")

    # Pre-test: Health Check
    print("Checking health endpoint /api/health...")
    status, health_res = make_request(HEALTH_URL)
    assert status == 200, f"Health check failed: {health_res}"
    print("✅ Pass: /api/health returns 200.\n")

    # Setup User Roles
    print("Setting up test users...")
    learner_token_a = register_and_login("learner_a", "learner")
    learner_token_b = register_and_login("learner_b", "learner")
    centre_token = register_and_login("centre", "centre")
    admin_token = register_and_login("admin", "admin")
    
    headers_a = {"Authorization": f"Bearer {learner_token_a}"}
    headers_b = {"Authorization": f"Bearer {learner_token_b}"}
    headers_centre = {"Authorization": f"Bearer {centre_token}"}
    headers_admin = {"Authorization": f"Bearer {admin_token}"}
    print("✅ Pass: Learner A, Learner B, Centre, and Admin registered and logged in.\n")

    # 1. Unauthenticated request rejected
    print("Test 1: Unauthenticated request rejected...")
    status, res = make_request(BASE_ENROLL_URL, data={"course_id": "computer-basics-entrepreneurs", "learning_mode": "online"}, method="POST")
    assert status == 401, f"Expected 401, got {status}: {res}"
    print("✅ Pass: Unauthenticated request is rejected.\n")

    # 2. Centre & Admin cannot enroll
    print("Test 2: Centre and Admin users cannot enroll...")
    status, res = make_request(
        BASE_ENROLL_URL, 
        data={"course_id": "computer-basics-entrepreneurs", "learning_mode": "online"}, 
        headers=headers_centre,
        method="POST"
    )
    assert status == 403, f"Expected 403 for Centre, got {status}: {res}"

    status, res = make_request(
        BASE_ENROLL_URL, 
        data={"course_id": "computer-basics-entrepreneurs", "learning_mode": "online"}, 
        headers=headers_admin,
        method="POST"
    )
    assert status == 403, f"Expected 403 for Admin, got {status}: {res}"
    print("✅ Pass: Non-learner roles are forbidden from enrolling.\n")

    # 3. Invalid course or learning mode rejected
    print("Test 3: Rejecting invalid course ID and invalid learning modes...")
    status, res = make_request(
        BASE_ENROLL_URL, 
        data={"course_id": "non-existent-course-id", "learning_mode": "online"}, 
        headers=headers_a,
        method="POST"
    )
    assert status == 400 or status == 404, f"Expected 400 or 404, got {status}: {res}"

    status, res = make_request(
        BASE_ENROLL_URL, 
        data={"course_id": "computer-basics-entrepreneurs", "learning_mode": "invalid-mode"}, 
        headers=headers_a,
        method="POST"
    )
    assert status == 400, f"Expected 400 for invalid mode, got {status}: {res}"
    print("✅ Pass: Invalid course and learning mode validation rejected correctly.\n")

    # 4. Successful Enrollment
    print("Test 4: Learner A enrolling in course 'computer-basics-entrepreneurs'...")
    status, res = make_request(
        BASE_ENROLL_URL, 
        data={"course_id": "computer-basics-entrepreneurs", "learning_mode": "online"}, 
        headers=headers_a,
        method="POST"
    )
    assert status == 200, f"Failed to enroll: {res}"
    assert res["success"] is True, "Expected success to be True"
    enrollment = res["enrollment"]
    assert enrollment["course_id"] == "computer-basics-entrepreneurs"
    assert enrollment["learning_mode"] == "online"
    assert enrollment["status"] == "active"
    enrollment_id = enrollment["id"]
    print("✅ Pass: Enrollment successfully created and persisted.\n")

    # 5. Prevent duplicate active enrollment
    print("Test 5: Prevent duplicate active enrollment...")
    status, res = make_request(
        BASE_ENROLL_URL, 
        data={"course_id": "computer-basics-entrepreneurs", "learning_mode": "online"}, 
        headers=headers_a,
        method="POST"
    )
    assert status == 400, f"Expected 400 for duplicate enrollment, got {status}: {res}"
    print("✅ Pass: Duplicate active enrollment is correctly rejected.\n")

    # 6. Check course enrollment status
    print("Test 6: Checking course enrollment status...")
    # For Learner A (enrolled)
    status, res_a = make_request(f"{BASE_ENROLL_URL}/course/computer-basics-entrepreneurs", headers=headers_a)
    assert status == 200, f"Failed check: {res_a}"
    assert res_a["enrolled"] is True
    assert res_a["status"] == "active"
    assert res_a["learning_mode"] == "online"
    assert res_a["enrollment_id"] == enrollment_id

    # For Learner B (not enrolled)
    status, res_b = make_request(f"{BASE_ENROLL_URL}/course/computer-basics-entrepreneurs", headers=headers_b)
    assert status == 200, f"Failed check: {res_b}"
    assert res_b["status"] == "not_enrolled"
    print("✅ Pass: Course enrollment status check queries return perfectly tailored results.\n")

    # 7. My Enrollments List
    print("Test 7: Fetching all active enrollments for learner...")
    status, res_list = make_request(f"{BASE_ENROLL_URL}/me", headers=headers_a)
    assert status == 200, f"Failed fetching my enrollments: {res_list}"
    assert len(res_list) >= 1, "Expected list of length >= 1"
    my_enroll = res_list[0]
    assert my_enroll["course_id"] == "computer-basics-entrepreneurs"
    assert "course_title" in my_enroll, "Course title should be enriched"
    print(f"✅ Pass: My enrollments list returns correctly enriched course information: {my_enroll['course_title']}.\n")

    # 8. Learner cannot modify/cancel another learner's enrollment
    print("Test 8: Ensure Learner B cannot cancel Learner A's enrollment...")
    status, res_cancel_b = make_request(f"{BASE_ENROLL_URL}/{enrollment_id}", headers=headers_b, method="DELETE")
    assert status == 403, f"Expected 403 for unauthorized cancellation, got {status}: {res_cancel_b}"
    print("✅ Pass: Cross-user enrollment modification attempts are forbidden.\n")

    # 9. Successful Cancellation
    print("Test 9: Learner A cancels their active enrollment...")
    status, res_cancel_a = make_request(f"{BASE_ENROLL_URL}/{enrollment_id}", headers=headers_a, method="DELETE")
    assert status == 200, f"Failed to cancel: {res_cancel_a}"
    assert res_cancel_a["success"] is True
    assert res_cancel_a["enrollment"]["status"] == "cancelled"
    
    # Check course enrollment status again
    status, res_check = make_request(f"{BASE_ENROLL_URL}/course/computer-basics-entrepreneurs", headers=headers_a)
    assert status == 200
    assert res_check["status"] == "cancelled"
    print("✅ Pass: Active enrollment successfully changed to 'cancelled' state and verified.\n")

    print("==================================================")
    print("ALL NEW PHASE 4.1 ENROLLMENT TESTS PASSED!")
    print("==================================================")

    print("\nRunning full regression test suite...")
    
    # List of previous tests to execute
    regression_tests = [
        "backend/test_auth_flow.py",
        "backend/test_profile_onboarding.py",
        "backend/test_skill_catalog.py",
        "backend/test_course_catalog.py"
    ]
    
    all_passed = True
    for test_file in regression_tests:
        print(f"Running regression: python3 {test_file}...")
        res = subprocess.run(["python3", test_file], capture_output=True, text=True)
        if res.returncode != 0:
            print(f"❌ Regression FAILED: {test_file}")
            print(res.stderr)
            print(res.stdout)
            all_passed = False
        else:
            print(f"✅ Regression PASSED: {test_file}")
            
    if all_passed:
        print("\n==================================================")
        print("ALL REGRESSION AND INTEGRATION TESTS ARE 100% GREEN!")
        print("==================================================")
    else:
        print("\n❌ Warning: One or more regression suites failed. Verify stacktraces.")
        sys.exit(1)

if __name__ == "__main__":
    run_enrollment_tests()
