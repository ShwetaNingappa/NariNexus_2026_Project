import urllib.request
import urllib.parse
import json
import uuid
import sys
import os
import subprocess

# Install proxy bypass opener to prevent timeouts in container environments
opener = urllib.request.build_opener(urllib.request.ProxyHandler({}))
urllib.request.install_opener(opener)

API_BASE = "http://127.0.0.1:8001/api"
AUTH_URL = f"{API_BASE}/auth"
CENTRES_URL = f"{API_BASE}/centres"
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

def run_phase_6_5_tests():
    print("==================================================")
    print("RUNNING NARINEXUS PHASE 6.5 ANALYTICS INTEGRATION TESTS")
    print("==================================================")

    # Generate fresh emails & mock credentials
    centre_a_email = f"centre_an_a_{uuid.uuid4().hex[:6]}@naricentre.org"
    centre_b_email = f"centre_an_b_{uuid.uuid4().hex[:6]}@naricentre.org"
    centre_empty_email = f"centre_an_emp_{uuid.uuid4().hex[:6]}@naricentre.org"
    learner_email = f"learner_an_{uuid.uuid4().hex[:6]}@gmail.com"
    password = "securePassword123"

    # Helper function to register, verify OTP, and login
    def register_and_login(email, role):
        # Register user
        reg_status, reg_res = make_request(
            f"{AUTH_URL}/register",
            data={"name": f"Test {role.capitalize()}", "email": email, "password": password, "role": role},
            method="POST"
        )
        if reg_status != 200 or not reg_res.get("success"):
            print(f"❌ Fail registering user {email}: {reg_res}")
            return None

        # Verify OTP
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

    print("Bootstrapping test coaching centers & learner...")
    centre_a_token = register_and_login(centre_a_email, "centre")
    centre_b_token = register_and_login(centre_b_email, "centre")
    centre_empty_token = register_and_login(centre_empty_email, "centre")
    learner_token = register_and_login(learner_email, "learner")

    if not centre_a_token or not centre_b_token or not centre_empty_token or not learner_token:
        print("❌ Fail: Could not bootstrap test accounts.")
        sys.exit(1)
    
    centre_a_headers = {"Authorization": f"Bearer {centre_a_token}"}
    centre_b_headers = {"Authorization": f"Bearer {centre_b_token}"}
    centre_empty_headers = {"Authorization": f"Bearer {centre_empty_token}"}
    learner_headers = {"Authorization": f"Bearer {learner_token}"}

    # Complete profile setups for centers
    print("Setting up training centre profiles...")
    status, res = make_request(
        f"{CENTRES_URL}/profile",
        data={
            "centre_name": "Analytics Kendra A",
            "description": "Premium tailoring academy",
            "contact_phone": "9876543220",
            "email": centre_a_email,
            "address": "12 Lane A",
            "city": "Bengaluru",
            "district": "Bengaluru Urban",
            "state": "Karnataka",
            "pincode": "560001"
        },
        headers=centre_a_headers,
        method="POST"
    )
    if status != 201:
        print(f"❌ Fail initializing Centre A profile: {res}")
        sys.exit(1)
    centre_a_profile_id = res["profile"]["id"]

    status, res = make_request(
        f"{CENTRES_URL}/profile",
        data={
            "centre_name": "Analytics Kendra B",
            "description": "Tech training academy",
            "contact_phone": "9876543221",
            "email": centre_b_email,
            "address": "45 Lane B",
            "city": "Mysuru",
            "district": "Mysuru District",
            "state": "Karnataka",
            "pincode": "570001"
        },
        headers=centre_b_headers,
        method="POST"
    )
    if status != 201:
        print(f"❌ Fail initializing Centre B profile: {res}")
        sys.exit(1)
    centre_b_profile_id = res["profile"]["id"]

    status, res = make_request(
        f"{CENTRES_URL}/profile",
        data={
            "centre_name": "Analytics Kendra Empty",
            "description": "Empty center academy",
            "contact_phone": "9876543222",
            "email": centre_empty_email,
            "address": "90 Lane Empty",
            "city": "Mysuru",
            "district": "Mysuru District",
            "state": "Karnataka",
            "pincode": "570001"
        },
        headers=centre_empty_headers,
        method="POST"
    )
    if status != 201:
        print(f"❌ Fail initializing Centre Empty profile: {res}")
        sys.exit(1)
    centre_empty_profile_id = res["profile"]["id"]

    # Associate learner with Centre A
    print("Associating learner with Centre A...")
    learner_id = None
    mock_file = os.path.join(os.path.dirname(__file__), "app", "services", "mock_users.json")
    if os.path.exists(mock_file):
        with open(mock_file, "r") as f:
            data = json.load(f)
        for uid, u in data.items():
            if u.get("email") == learner_email:
                u["training_centre_id"] = centre_a_profile_id
                learner_id = uid
        with open(mock_file, "w") as f:
            json.dump(data, f, indent=2)
    else:
        try:
            sys.path.append(os.path.dirname(__file__))
            from app.core.database import db_instance
            db = db_instance.get_db()
            if db is not None:
                user_doc = db["users"].find_one({"email": learner_email})
                if user_doc:
                    learner_id = str(user_doc["_id"])
                    db["users"].update_one({"_id": user_doc["_id"]}, {"$set": {"training_centre_id": centre_a_profile_id}})
        except Exception:
            pass

    if not learner_id:
        status, l_list = make_request(f"{CENTRES_URL}/learners", headers=centre_a_headers)
        if status == 200 and l_list.get("learners"):
            learner_id = l_list["learners"][0]["id"]

    if not learner_id:
        print("❌ Fail: Could not find registered learner ID.")
        sys.exit(1)

    # Create a course for Centre A
    print("Creating course for Centre A...")
    status, course_res = make_request(
        f"{CENTRES_URL}/courses",
        data={
            "title": "Tailoring Analytics basics",
            "description": "Learn tailoring with stats details.",
            "skill_id": "basic-stitching",
            "category_id": "tailoring-fashion",
            "difficulty": "beginner",
            "duration": "4 Weeks",
            "learning_mode": "offline",
            "instructor": "Kiran Devi",
            "prerequisites": ["None"],
            "career_outcomes": ["Tailor"],
            "language": "en",
            "status": "active"
        },
        headers=centre_a_headers,
        method="POST"
    )
    if status != 201:
        print(f"❌ Fail creating Centre A course: {course_res}")
        sys.exit(1)
    course_id = course_res["course"]["id"]

    # Enroll learner in Centre A's course
    print("Enrolling learner in Centre A's course...")
    status, enroll_res = make_request(
        f"{API_BASE}/enrollments",
        data={"course_id": course_id, "learning_mode": "offline"},
        headers=learner_headers,
        method="POST"
    )
    if status not in [200, 201]:
        print(f"❌ Fail enrolling learner in course: {enroll_res}")
        sys.exit(1)

    # Seed a custom lesson directly to mock_lessons.json if empty
    print("Seeding lesson for the custom course...")
    lesson_id = f"les-an-{uuid.uuid4().hex[:6]}"
    mock_lessons_file = os.path.join(os.path.dirname(__file__), "app", "services", "mock_lessons.json")
    lesson_doc = {
        "id": lesson_id,
        "course_id": course_id,
        "title": "Analytics Intro Lesson",
        "description": "Intro lesson",
        "lesson_number": 1,
        "content_type": "article",
        "content": "Learn analytics!",
        "duration": "10 Mins"
      }
    if os.path.exists(mock_lessons_file):
        with open(mock_lessons_file, "r") as f:
            data = json.load(f)
        data.append(lesson_doc)
        with open(mock_lessons_file, "w") as f:
            json.dump(data, f, indent=2)
    else:
        try:
            from app.core.database import db_instance
            db = db_instance.get_db()
            if db is not None:
                db["lessons"].insert_one(lesson_doc)
        except Exception:
            pass

    # Mark lesson complete for progress metrics checks
    print("Marking lesson complete for progress metrics...")
    status, complete_res = make_request(f"{API_BASE}/progress/lessons/{lesson_id}/complete", headers=learner_headers, method="POST")
    if status != 200:
        print(f"❌ Fail marking lesson complete: {complete_res}")
        sys.exit(1)

    # ----------------------------------------------------
    # TEST 1: Unauthenticated request is rejected (401)
    # ----------------------------------------------------
    print("Test 1: Unauthenticated GET /api/centres/analytics is rejected with 401...")
    status, res = make_request(f"{CENTRES_URL}/analytics")
    assert status == 401, f"Expected 401, got {status}: {res}"
    print("✅ Pass: Unauthenticated request rejected.\n")

    # ----------------------------------------------------
    # TEST 2: Learner request is rejected (403)
    # ----------------------------------------------------
    print("Test 2: Learner access to GET /api/centres/analytics is forbidden with 403...")
    status, res = make_request(f"{CENTRES_URL}/analytics", headers=learner_headers)
    assert status == 403, f"Expected 403, got {status}: {res}"
    print("✅ Pass: Learner role is forbidden.\n")

    # ----------------------------------------------------
    # TEST 3 & 4: Centre A and B can retrieve own analytics
    # ----------------------------------------------------
    print("Test 3 & 4: Centre A and Centre B retrieve their own analytics successfully...")
    status_a, res_a = make_request(f"{CENTRES_URL}/analytics", headers=centre_a_headers)
    assert status_a == 200 and res_a.get("success"), f"Failed for Centre A: {res_a}"
    
    status_b, res_b = make_request(f"{CENTRES_URL}/analytics", headers=centre_b_headers)
    assert status_b == 200 and res_b.get("success"), f"Failed for Centre B: {res_b}"
    print("✅ Pass: Both centers retrieved their analytics successfully.\n")

    # ----------------------------------------------------
    # TEST 5 & 6: Isolation checks
    # ----------------------------------------------------
    print("Test 5 & 6: Verifying multi-tenant analytics isolation...")
    # Centre A's analytics
    analytics_a = res_a["analytics"]
    assert analytics_a["learners"]["total"] == 1, f"Expected Centre A total learners = 1, got {analytics_a}"
    assert analytics_a["courses"]["total"] == 1, f"Expected Centre A total courses = 1, got {analytics_a}"
    assert analytics_a["learning"]["total_enrollments"] == 1, f"Expected Centre A enrollments = 1, got {analytics_a}"
    assert analytics_a["learning"]["average_progress"] == 100, f"Expected Centre A average progress = 100%, got {analytics_a}"

    # Centre B's analytics should NOT contain Centre A's data
    analytics_b = res_b["analytics"]
    assert analytics_b["learners"]["total"] == 0, f"Expected Centre B total learners = 0, got {analytics_b}"
    assert analytics_b["courses"]["total"] == 0, f"Expected Centre B total courses = 0, got {analytics_b}"
    assert analytics_b["learning"]["total_enrollments"] == 0, f"Expected Centre B enrollments = 0, got {analytics_b}"
    print("✅ Pass: Strict multi-tenant isolation verified (No data leakage between Centre A and Centre B).\n")

    # ----------------------------------------------------
    # TEST 7: Centre ID manipulation prevention (Derived from user identity)
    # ----------------------------------------------------
    print("Test 7: Attempting parameter manipulation to access another center's analytics...")
    # The endpoint does not accept a query or body parameter like `centre_id`. It derives identity from JWT.
    # We prove this because Centre B authenticated request returns Centre B analytics even if someone tried to forge parameters:
    status_forged, res_forged = make_request(f"{CENTRES_URL}/analytics?centre_id={centre_a_profile_id}", headers=centre_b_headers)
    assert status_forged == 200
    assert res_forged["analytics"]["learners"]["total"] == 0, "Security fail! Centre B retrieved Centre A's analytics using manipulation query parameter!"
    print("✅ Pass: Query parameter manipulation rejected; identity safely derived from authenticated user context.\n")

    # ----------------------------------------------------
    # TEST 8 to 14: Correctness of metrics
    # ----------------------------------------------------
    print("Test 8 to 14: Verifying correct calculation of counts, percentages, and completion rates...")
    metrics = analytics_a["learners"]
    assert metrics["total"] == 1, "Learner total count incorrect"
    assert metrics["active"] == 1, "Active learner count incorrect"
    assert metrics["completed"] == 1, "Completed learner count incorrect"
    assert metrics["no_progress"] == 0, "No progress learner count incorrect"

    learning_metrics = analytics_a["learning"]
    assert learning_metrics["total_enrollments"] == 1, "Total enrollments incorrect"
    assert learning_metrics["completed_enrollments"] == 1, "Completed enrollments incorrect"
    assert learning_metrics["in_progress_enrollments"] == 0, "In progress incorrect"
    assert learning_metrics["not_started_enrollments"] == 0, "Not started incorrect"
    assert learning_metrics["average_progress"] == 100, "Average progress incorrect"
    assert learning_metrics["overall_completion_rate"] == 100.0, "Overall completion rate incorrect"
    print("✅ Pass: All core mathematical metrics correctly calculated on real data.\n")

    # ----------------------------------------------------
    # TEST 15 to 17: Course-level analytics
    # ----------------------------------------------------
    print("Test 15 to 17: Verifying course-level analytics list correctness...")
    course_list = analytics_a["course_analytics"]
    assert len(course_list) == 1, "Course list should contain 1 course"
    c_analytics = course_list[0]
    assert c_analytics["id"] == course_id, "Course ID mismatch"
    assert c_analytics["total_learners"] == 1, "Course enrolled count incorrect"
    assert c_analytics["completed_learners"] == 1, "Course completion count incorrect"
    assert c_analytics["average_progress"] == 100, "Course average progress incorrect"
    print("✅ Pass: Course-level metrics are accurate.\n")

    # ----------------------------------------------------
    # TEST 18 & 19: Empty state / Zero data centers
    # ----------------------------------------------------
    print("Test 18 & 19: Verifying empty centers return safe, clean zeroes...")
    status_emp, res_emp = make_request(f"{CENTRES_URL}/analytics", headers=centre_empty_headers)
    assert status_emp == 200
    analytics_emp = res_emp["analytics"]
    assert analytics_emp["learners"]["total"] == 0, "Expected empty total learners = 0"
    assert analytics_emp["courses"]["total"] == 0, "Expected empty total courses = 0"
    assert analytics_emp["learning"]["total_enrollments"] == 0, "Expected empty total enrollments = 0"
    assert analytics_emp["learning"]["average_progress"] == 0, "Expected empty average progress = 0"
    assert analytics_emp["learning"]["overall_completion_rate"] == 0.0, "Expected empty completion rate = 0"
    print("✅ Pass: Empty center analytics are safe and zeroed-out.\n")

    print("==================================================")
    print("ALL PHASE 6.5 ANALYTICS METRIC & SECURITY TESTS PASSED!")
    print("==================================================")

    print("\nRunning prior phase regression checks...")
    regressions = [
        ("Phase 4 (Progress Monitoring)", "backend/test_progress_system.py"),
        ("Phase 6.2 (Learner Management)", "backend/test_centres_learners_phase_6_2.py"),
        ("Phase 6.3 (Course Management)", "backend/test_centres_courses_phase_6_3.py"),
        ("Phase 6.4 (Progress Monitoring)", "backend/test_centres_progress_phase_6_4.py")
    ]
    all_passed = True
    for phase_name, script in regressions:
        print(f"Running regression check: {phase_name} ({script})...")
        res = subprocess.run(["python3", script], capture_output=True, text=True)
        if res.returncode != 0:
            print(f"❌ Regression FAILED: {script}")
            print(res.stderr or res.stdout)
            all_passed = False
        else:
            print(f"✅ Regression PASSED: {script}")

    if all_passed:
        print("\n==================================================")
        print("ALL VERIFICATIONS AND REGRESSIONS COMPLETED 100% GREEN!")
        print("==================================================")
    else:
        print("\n❌ Warning: Regression errors occurred. Check logs above.")
        sys.exit(1)

if __name__ == "__main__":
    run_phase_6_5_tests()
