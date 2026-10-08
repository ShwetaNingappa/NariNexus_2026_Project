import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import urllib.request
# Install proxy bypass opener to prevent timeouts in container environments
opener = urllib.request.build_opener(urllib.request.ProxyHandler({}))
urllib.request.install_opener(opener)
import urllib.parse
import json
import uuid
import subprocess

BASE_AUTH_URL = "http://127.0.0.1:8001/api/auth"
BASE_ENROLL_URL = "http://127.0.0.1:8001/api/enrollments"
BASE_PROGRESS_URL = "http://127.0.0.1:8001/api/progress"
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

    status, res = make_request(
        f"{BASE_AUTH_URL}/register",
        data={"name": f"Test {role.capitalize()}", "email": email, "password": password, "role": "learner"},
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

    status, res_login = make_request(
        f"{BASE_AUTH_URL}/login",
        data={"email": email, "password": password},
        method="POST"
    )
    assert status == 200, f"Login failed: {res_login}"
    return res_login["access_token"]

def run_progress_tests():
    print("==================================================")
    print("RUNNING PHASE 4.2 LEARNING PROGRESS INTEGRATION TESTS")
    print("==================================================")

    # 17. Health Check
    print("Checking health endpoint /api/health...")
    status, health_res = make_request(HEALTH_URL)
    assert status == 200, f"Health check failed: {health_res}"
    print("✅ Pass: /api/health returns 200.\n")

    # Setup Test Learners
    print("Setting up test learners...")
    learner_a_token = register_and_login("progress_a", "learner")
    learner_b_token = register_and_login("progress_b", "learner")
    
    headers_a = {"Authorization": f"Bearer {learner_a_token}"}
    headers_b = {"Authorization": f"Bearer {learner_b_token}"}
    print("✅ Pass: Learner A and Learner B registered & authenticated.\n")

    # Enroll Learner A in course 'secure-mobile-payments'
    print("Enrolling Learner A in 'secure-mobile-payments'...")
    status, res = make_request(
        BASE_ENROLL_URL,
        data={"course_id": "secure-mobile-payments", "learning_mode": "online"},
        headers=headers_a,
        method="POST"
    )
    assert status == 200, f"Failed to enroll: {res}"
    print("✅ Pass: Learner A enrolled.\n")

    # 7. Unenrolled learner cannot complete lesson
    print("Test 7: Unenrolled learner cannot complete lesson...")
    status, res = make_request(
        f"{BASE_PROGRESS_URL}/lessons/les-upi-setup/complete",
        headers=headers_b, # Learner B is not enrolled in 'secure-mobile-payments'
        method="POST"
    )
    assert status == 400 or status == 403, f"Expected error for unenrolled user, got {status}: {res}"
    print("✅ Pass: Unenrolled learner is rejected.\n")

    # 9. Lesson from another course rejected
    print("Test 9: Lesson from another course rejected...")
    # 'les-os-intro' belongs to 'computer-basics-entrepreneurs', but Learner A is only enrolled in 'secure-mobile-payments'
    status, res = make_request(
        f"{BASE_PROGRESS_URL}/lessons/les-os-intro/complete",
        headers=headers_a,
        method="POST"
    )
    assert status == 400, f"Expected 400 for lesson from non-enrolled course, got {status}: {res}"
    print("✅ Pass: Lesson from non-enrolled course is rejected.\n")

    # 1. Enrolled learner completes lesson
    print("Test 1: Enrolled learner completes lesson...")
    status, res = make_request(
        f"{BASE_PROGRESS_URL}/lessons/les-upi-setup/complete",
        headers=headers_a,
        method="POST"
    )
    assert status == 200, f"Failed to complete lesson: {res}"
    assert res["success"] is True
    assert res["progress"]["lesson_id"] == "les-upi-setup"
    assert res["progress"]["completed"] is True
    print("✅ Pass: Enrolled learner can mark lesson complete.\n")

    # 2. Completion persisted
    print("Test 2: Verification of persisted completion status...")
    status, res_course_p = make_request(
        f"{BASE_PROGRESS_URL}/courses/secure-mobile-payments",
        headers=headers_a
    )
    assert status == 200, f"Failed to get course progress: {res_course_p}"
    assert "les-upi-setup" in res_course_p["completed_lesson_ids"]
    assert res_course_p["completed_lessons"] == 1
    print("✅ Pass: Completion record persisted and correctly fetched.\n")

    # 3. Duplicate completion is idempotent
    print("Test 3: Duplicate completion is idempotent...")
    status, res_dup = make_request(
        f"{BASE_PROGRESS_URL}/lessons/les-upi-setup/complete",
        headers=headers_a,
        method="POST"
    )
    assert status == 200, f"Expected 200 for duplicate complete, got {status}: {res_dup}"
    # Verify course progress is still exactly 1
    status, res_check_dup = make_request(f"{BASE_PROGRESS_URL}/courses/secure-mobile-payments", headers=headers_a)
    assert res_check_dup["completed_lessons"] == 1, f"Expected completed_lessons=1, got {res_check_dup}"
    print("✅ Pass: Idempotency is verified.\n")

    # 4. Course progress calculated correctly
    print("Test 4: Course progress calculated correctly...")
    # 'secure-mobile-payments' has 3 lessons: 'les-upi-setup', 'les-pay-transfer', 'les-anti-fraud'
    status, res_course_check = make_request(f"{BASE_PROGRESS_URL}/courses/secure-mobile-payments", headers=headers_a)
    assert res_course_check["total_lessons"] == 3
    assert res_course_check["completed_lessons"] == 1
    assert res_course_check["progress_percentage"] == 33 # 1/3 is 33%
    print("✅ Pass: Course progress parameters calculated dynamically.\n")

    # 5. My progress endpoint
    print("Test 5: My progress endpoint listing enrolled courses...")
    status, res_me = make_request(f"{BASE_PROGRESS_URL}/me", headers=headers_a)
    assert status == 200, f"Failed progress me: {res_me}"
    assert len(res_me) == 1
    course_item = res_me[0]
    assert course_item["course_id"] == "secure-mobile-payments"
    assert course_item["completed_lessons"] == 1
    assert course_item["total_lessons"] == 3
    assert course_item["progress_percentage"] == 33
    print("✅ Pass: /me progress summary returns correctly structured items.\n")

    # 8. Learner cannot access another learner's progress
    print("Test 8: Learner B cannot access Learner A's progress...")
    # Because learner_id is fetched purely from JWT, Learner B querying /me gets their own empty list
    status, res_me_b = make_request(f"{BASE_PROGRESS_URL}/me", headers=headers_b)
    assert status == 200
    assert len(res_me_b) == 0, f"Expected 0 progress cards, got {res_me_b}"
    print("✅ Pass: Cross-user progress access is secure and sandboxed.\n")

    # 10. Course becomes completed after final lesson
    # 11. Enrollment status becomes completed
    print("Test 10 & 11: Course and Enrollment become completed after final lesson...")
    # Let's complete the remaining two lessons
    status, res_l2 = make_request(f"{BASE_PROGRESS_URL}/lessons/les-pay-transfer/complete", headers=headers_a, method="POST")
    assert status == 200, f"Failed L2 complete: {res_l2}"
    
    status, res_l3 = make_request(f"{BASE_PROGRESS_URL}/lessons/les-anti-fraud/complete", headers=headers_a, method="POST")
    assert status == 200, f"Failed L3 complete: {res_l3}"

    # Verify course progress is 100%
    status, res_100 = make_request(f"{BASE_PROGRESS_URL}/courses/secure-mobile-payments", headers=headers_a)
    assert res_100["progress_percentage"] == 100
    assert res_100["completed_lessons"] == 3

    # Check enrollment status has transitioned to 'completed'
    status, res_enroll_check = make_request(f"{BASE_ENROLL_URL}/course/secure-mobile-payments", headers=headers_a)
    assert status == 200
    assert res_enroll_check["status"] == "completed", f"Expected enrollment status='completed', got {res_enroll_check}"
    print("✅ Pass: Enrollment status successfully upgraded to 'completed' after final lesson.\n")

    # Test Undoing completion
    print("Test uncomplete/revert lesson progress...")
    status, res_uncomplete = make_request(f"{BASE_PROGRESS_URL}/lessons/les-anti-fraud/complete", headers=headers_a, method="DELETE")
    assert status == 200, f"Failed uncomplete: {res_uncomplete}"

    # Verify course progress goes back down to 66%
    status, res_revert = make_request(f"{BASE_PROGRESS_URL}/courses/secure-mobile-payments", headers=headers_a)
    assert res_revert["progress_percentage"] == 66
    assert res_revert["completed_lessons"] == 2

    # Check enrollment status reverted back to 'active'
    status, res_revert_enroll = make_request(f"{BASE_ENROLL_URL}/course/secure-mobile-payments", headers=headers_a)
    assert res_revert_enroll["status"] == "active", f"Expected enrollment status to revert to 'active', got {res_revert_enroll}"
    print("✅ Pass: Lesson uncompletion properly decreases percentage and resets enrollment to active.\n")

    print("==================================================")
    print("ALL NEW PHASE 4.2 PROGRESS ENDPOINTS PASSED!")
    print("==================================================")

    print("\nRunning regressions for prior modules...")
    regression_tests = [
        "backend/test_auth_flow.py",
        "backend/test_profile_onboarding.py",
        "backend/test_skill_catalog.py",
        "backend/test_course_catalog.py",
        "backend/test_enrollment_system.py"
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

    # Check frontend lint and build
    print("\nChecking frontend linter...")
    res_lint = subprocess.run(["npm", "run", "lint"], capture_output=True, text=True)
    if res_lint.returncode != 0:
        print("❌ Frontend Lint FAILED")
        print(res_lint.stdout or res_lint.stderr)
        all_passed = False
    else:
        print("✅ Frontend Lint PASSED")

    print("\nChecking frontend compilation/build...")
    res_build = subprocess.run(["npm", "run", "build"], capture_output=True, text=True)
    if res_build.returncode != 0:
        print("❌ Frontend Build FAILED")
        print(res_build.stdout or res_build.stderr)
        all_passed = False
    else:
        print("✅ Frontend Build PASSED")

    if all_passed:
        print("\n==================================================")
        print("ALL REGRESSION AND NEW INTEGRATION TESTS ARE 100% GREEN!")
        print("==================================================")
    else:
        print("\n❌ Warning: Regression errors or lint failures occurred. Check logs above.")
        sys.exit(1)

if __name__ == "__main__":
    run_progress_tests()
