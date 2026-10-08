import urllib.request
import urllib.parse
import json
import uuid
import sys
import os

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

def run_phase_6_4_tests():
    print("==================================================")
    print("RUNNING NARINEXUS PHASE 6.4 PROGRESS MONITORING TESTS")
    print("==================================================")

    # Generate fresh emails & mock credentials
    centre_a_email = f"centre_prog_a_{uuid.uuid4().hex[:6]}@naricentre.org"
    centre_b_email = f"centre_prog_b_{uuid.uuid4().hex[:6]}@naricentre.org"
    learner_email = f"learner_prog_{uuid.uuid4().hex[:6]}@gmail.com"
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
    learner_token = register_and_login(learner_email, "learner")

    if not centre_a_token or not centre_b_token or not learner_token:
        print("❌ Fail: Could not bootstrap test accounts.")
        sys.exit(1)
    
    centre_a_headers = {"Authorization": f"Bearer {centre_a_token}"}
    centre_b_headers = {"Authorization": f"Bearer {centre_b_token}"}
    learner_headers = {"Authorization": f"Bearer {learner_token}"}

    # Complete profile setups for both centers
    print("Setting up training centre profiles...")
    status, res = make_request(
        f"{CENTRES_URL}/profile",
        data={
            "centre_name": "Progress Kendra A",
            "description": "Tailoring academy",
            "contact_phone": "9876543210",
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
            "centre_name": "Progress Kendra B",
            "description": "Digital learning studio",
            "contact_phone": "9876543211",
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

    # Get learner ID
    status, learner_profile_res = make_request(f"{API_BASE}/profile/me", headers=learner_headers)
    if status != 200:
        print(f"❌ Fail getting learner profile: {learner_profile_res}")
        sys.exit(1)
    
    # In NariNexus, the user is stored under keys like 'id' or we can extract the learner profile/ID
    # The profile API returns details, let's also find the user id
    # Since we can edit mock_users.json directly:
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
        print("✅ Simulated: Learner association seed completed in mock_users.json.")
    else:
        # MongoDB Atlas fallback
        try:
            sys.path.append(os.path.dirname(__file__))
            from app.core.database import db_instance
            db = db_instance.get_db()
            if db is not None:
                user_doc = db["users"].find_one({"email": learner_email})
                if user_doc:
                    learner_id = str(user_doc["_id"])
                    db["users"].update_one({"_id": user_doc["_id"]}, {"$set": {"training_centre_id": centre_a_profile_id}})
                    print("✅ Simulated: Learner association seed completed in MongoDB.")
        except Exception as e:
            print(f"⚠️ Warning: Could not connect to database to associate: {e}")

    # Fallback to profile check if not found in mock file
    if not learner_id:
        # We can extract the user ID from JWT token or similar, but the user is definitely in the db/mock file.
        # Let's get list from /api/centres/learners as Centre A
        status, l_list = make_request(f"{CENTRES_URL}/learners", headers=centre_a_headers)
        if status == 200 and l_list.get("learners"):
            learner_id = l_list["learners"][0]["id"]

    if not learner_id:
        print("❌ Fail: Could not find registered learner ID.")
        sys.exit(1)

    # Let's verify that the learner is indeed associated with Centre A
    status, learners_list_res = make_request(f"{CENTRES_URL}/learners", headers=centre_a_headers)
    if status != 200 or len(learners_list_res.get("learners", [])) == 0:
        print(f"❌ Fail: Learner not listed under Centre A. Response: {learners_list_res}")
        sys.exit(1)
    print("✅ Learner successfully associated with Centre A.")

    # Create a course for Centre A
    print("Creating custom course for Centre A...")
    status, course_res = make_request(
        f"{CENTRES_URL}/courses",
        data={
            "title": "Stitching Masterclass",
            "description": "Learn stitching from expert tutors.",
            "skill_id": "basic-stitching",
            "category_id": "tailoring-fashion",
            "difficulty": "beginner",
            "duration": "4 Weeks",
            "learning_mode": "offline",
            "instructor": "Shobha Devi",
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

    # Enroll learner in the course
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

    # Let's verify lessons for this course
    # Seed a custom lesson directly to mock_lessons.json if empty
    print("Seeding lesson for the custom course...")
    lesson_id = f"les-custom-{uuid.uuid4().hex[:6]}"
    mock_lessons_file = os.path.join(os.path.dirname(__file__), "app", "services", "mock_lessons.json")
    lesson_doc = {
        "id": lesson_id,
        "course_id": course_id,
        "title": "First Stitch Intro",
        "description": "Intro lesson",
        "lesson_number": 1,
        "content_type": "article",
        "content": "Stitch it up!",
        "duration": "10 Mins"
    }
    if os.path.exists(mock_lessons_file):
        with open(mock_lessons_file, "r") as f:
            data = json.load(f)
        data.append(lesson_doc)
        with open(mock_lessons_file, "w") as f:
            json.dump(data, f, indent=2)
        print("✅ Simulated: Seeding lesson in mock_lessons.json.")
    else:
        try:
            from app.core.database import db_instance
            db = db_instance.get_db()
            if db is not None:
                db["lessons"].insert_one(lesson_doc)
                print("✅ Simulated: Seeding lesson in MongoDB.")
        except Exception as e:
            print(f"⚠️ Warning: Could not connect to database to seed lesson: {e}")

    # Mark lesson complete for progress check
    print("Marking lesson complete for progress check...")
    status, complete_res = make_request(f"{API_BASE}/progress/lessons/{lesson_id}/complete", headers=learner_headers, method="POST")
    if status != 200:
        print(f"❌ Fail marking lesson complete: {complete_res}")
        sys.exit(1)

    # ----------------------------------------------------
    # TEST 1: Unauthenticated progress overview is rejected
    # ----------------------------------------------------
    print("Test 1: Unauthenticated GET /api/centres/progress is rejected...")
    status, res = make_request(f"{CENTRES_URL}/progress")
    if status == 401:
        print("✅ Pass: Unauthenticated request rejected with 401.")
    else:
        print(f"❌ Fail: Expected 401, got {status}: {res}")
        sys.exit(1)

    # ----------------------------------------------------
    # TEST 2: Learner role is forbidden from progress overview
    # ----------------------------------------------------
    print("Test 2: Learner access to GET /api/centres/progress is forbidden...")
    status, res = make_request(f"{CENTRES_URL}/progress", headers=learner_headers)
    if status == 403:
        print("✅ Pass: Learner request rejected with 403.")
    else:
        print(f"❌ Fail: Expected 403, got {status}: {res}")
        sys.exit(1)

    # ----------------------------------------------------
    # TEST 3: Centre A retrieves its progress overview
    # ----------------------------------------------------
    print("Test 3: Centre A retrieves progress overview successfully...")
    status, res = make_request(f"{CENTRES_URL}/progress", headers=centre_a_headers)
    if status == 200 and res.get("success"):
        overview = res.get("overview", [])
        if len(overview) > 0:
            print(f"✅ Pass: Successfully loaded progress overview containing {len(overview)} items.")
            item = overview[0]
            assert item["learner"]["id"] == learner_id, "Learner ID mismatch"
            assert item["course"]["id"] == course_id, "Course ID mismatch"
            assert item["progress_percentage"] > 0, "Progress percentage should be > 0"
        else:
            print("❌ Fail: Expected non-empty progress overview.")
            sys.exit(1)
    else:
        print(f"❌ Fail: Expected 200 OK, got {status}: {res}")
        sys.exit(1)

    # ----------------------------------------------------
    # TEST 4: Centre B (Stranger) retrieves empty progress overview (Isolation check)
    # ----------------------------------------------------
    print("Test 4: Centre B retrieves progress overview and is isolated...")
    status, res = make_request(f"{CENTRES_URL}/progress", headers=centre_b_headers)
    if status == 200 and len(res.get("overview", [])) == 0:
        print("✅ Pass: Center isolation verified. Centre B sees 0 progress overview entries.")
    else:
        print(f"❌ Fail: Centre B saw Centre A's data or request failed with {status}: {res}")
        sys.exit(1)

    # ----------------------------------------------------
    # TEST 5: Centre A gets detailed breakdown of its learner
    # ----------------------------------------------------
    print("Test 5: Centre A retrieves detailed learner breakdown...")
    status, res = make_request(f"{CENTRES_URL}/progress/learners/{learner_id}", headers=centre_a_headers)
    if status == 200 and res.get("success"):
        assert res["learner"]["id"] == learner_id, "Learner ID mismatch in breakdown"
        courses = res.get("courses", [])
        assert len(courses) > 0, "Expected enrolled courses breakdown"
        course_item = courses[0]
        assert course_item["course_id"] == course_id, "Course ID mismatch in breakdown"
        assert len(course_item["lessons"]) > 0, "Expected lesson list breakdown"
        assert course_item["lessons"][0]["completed"] is True, "First lesson should show as completed"
        print("✅ Pass: Successfully loaded detailed lesson-by-lesson breakdown.")
    else:
        print(f"❌ Fail: Expected 200 OK, got {status}: {res}")
        sys.exit(1)

    # ----------------------------------------------------
    # TEST 6: Centre B (Stranger) is blocked from accessing Centre A's learner breakdown
    # ----------------------------------------------------
    print("Test 6: Centre B attempts to retrieve Centre A's learner progress and is blocked...")
    status, res = make_request(f"{CENTRES_URL}/progress/learners/{learner_id}", headers=centre_b_headers)
    if status in [403, 404]:
        print(f"✅ Pass: Centre B rejected with {status} for accessing stranger learner details.")
    else:
        print(f"❌ Fail: Expected 403/404, got {status}: {res}")
        sys.exit(1)

    # ----------------------------------------------------
    # TEST 7: Centre A gets detailed aggregated course metrics
    # ----------------------------------------------------
    print("Test 7: Centre A retrieves custom course progress aggregation metrics...")
    status, res = make_request(f"{CENTRES_URL}/progress/courses/{course_id}", headers=centre_a_headers)
    if status == 200 and res.get("success"):
        assert res["course"]["id"] == course_id, "Course ID mismatch in aggregation"
        agg = res.get("progress_aggregation", {})
        assert agg["total_learners_completed"] + agg["total_learners_in_progress"] + agg["total_learners_inactive"] > 0, "Expected aggregated stats"
        breakdown = res.get("learner_breakdown", [])
        assert len(breakdown) > 0, "Expected list of enrolled learners in the course"
        assert breakdown[0]["learner_id"] == learner_id, "Enrolled learner ID mismatch in breakdown"
        print("✅ Pass: Aggregated course progress metrics and breakdown retrieved successfully.")
    else:
        print(f"❌ Fail: Expected 200 OK, got {status}: {res}")
        sys.exit(1)

    # ----------------------------------------------------
    # TEST 8: Centre B (Stranger) is blocked from Centre A's course progress metrics
    # ----------------------------------------------------
    print("Test 8: Centre B attempts to retrieve Centre A's course progress metrics and is blocked...")
    status, res = make_request(f"{CENTRES_URL}/progress/courses/{course_id}", headers=centre_b_headers)
    if status in [403, 404]:
        print(f"✅ Pass: Centre B rejected with {status} for accessing stranger course progress details.")
    else:
        print(f"❌ Fail: Expected 403/404, got {status}: {res}")
        sys.exit(1)

    print("==================================================")
    print("ALL PHASE 6.4 PROGRESS MONITORING TESTS PASSED!")
    print("==================================================")

if __name__ == "__main__":
    run_phase_6_4_tests()
