import urllib.request
import urllib.parse
import json
import uuid

BASE_AUTH_URL = "http://127.0.0.1:8001/api/auth"
BASE_PROFILE_URL = "http://127.0.0.1:8001/api/profile"
BASE_COURSES_URL = "http://127.0.0.1:8001/api/courses"
BASE_SKILLS_URL = "http://127.0.0.1:8001/api/skills"

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

def run_course_catalog_tests():
    print("==================================================")
    print("RUNNING PHASE 3.2 COURSE CATALOGUE INTEGRATION TESTS")
    print("==================================================")

    # 1. Register a test learner
    learner_email = f"learner_course_{uuid.uuid4().hex[:6]}@example.com"
    password = "securePassword123"

    print("Step 1: Registering and verifying a test learner...")
    status, res = make_request(
        f"{BASE_AUTH_URL}/register",
        data={"name": "Anita Deshmukh", "email": learner_email, "password": password, "role": "learner"},
        method="POST"
    )
    assert status == 200, f"Registration failed: {res}"

    status, res_otp = make_request(f"{BASE_AUTH_URL}/dev-last-otp?email={learner_email}")
    otp_code = res_otp["otp"]

    status, res_verify = make_request(
        f"{BASE_AUTH_URL}/verify-otp",
        data={"email": learner_email, "otp": otp_code},
        method="POST"
    )
    assert status == 200, f"Verification failed: {res_verify}"

    status, res_login = make_request(
        f"{BASE_AUTH_URL}/login",
        data={"email": learner_email, "password": password},
        method="POST"
    )
    assert status == 200, f"Login failed: {res_login}"
    token = res_login["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    print("✅ Pass: Test learner registered, verified, and logged in successfully.\n")

    # 2. Test unauthorized access
    print("Step 2: Testing unauthorized courses endpoints...")
    status, res_unauth = make_request(BASE_COURSES_URL)
    assert status == 401, f"Expected 401 for unauthorized courses, got {status}"
    status, res_unauth = make_request(f"{BASE_COURSES_URL}/computer-basics-entrepreneurs")
    assert status == 401, f"Expected 401 for unauthorized course detail, got {status}"
    print("✅ Pass: Unauthenticated access is correctly rejected with 401.\n")

    # 3. Test retrieving all courses (Course list API)
    print("Step 3: Fetching all courses...")
    status, res_courses = make_request(BASE_COURSES_URL, headers=headers)
    assert status == 200, f"Failed to fetch courses: {res_courses}"
    assert "courses" in res_courses, "Courses list missing from response"
    courses = res_courses["courses"]
    assert len(courses) > 0, "No seeded courses found"
    print(f"✅ Pass: Successfully fetched {len(courses)} courses from database.\n")

    # 4. Test course search filtering
    print("Step 4: Testing backend search matching 'digital'...")
    status, res_search = make_request(f"{BASE_COURSES_URL}?search=digital", headers=headers)
    assert status == 200, f"Search failed: {res_search}"
    searched = res_search["courses"]
    for c in searched:
        found = "digital" in c["title"].lower() or "digital" in c["description"].lower() or any("digital" in outcome.lower() for outcome in c["career_outcomes"])
        assert found, f"Course did not match search query 'digital': {c['title']}"
    print(f"✅ Pass: Backend search successfully returned {len(searched)} matching courses.\n")

    # 5. Test difficulty filtering
    print("Step 5: Testing difficulty filtering (beginner)...")
    status, res_diff = make_request(f"{BASE_COURSES_URL}?difficulty=beginner", headers=headers)
    assert status == 200, f"Difficulty filter failed: {res_diff}"
    beginner_courses = res_diff["courses"]
    for c in beginner_courses:
        assert c["difficulty"] == "beginner", f"Expected beginner course, got {c['difficulty']}"
    print(f"✅ Pass: Difficulty filter successfully returned {len(beginner_courses)} beginner courses.\n")

    # 6. Test learning mode filtering
    print("Step 6: Testing learning mode filtering (online)...")
    status, res_mode = make_request(f"{BASE_COURSES_URL}?learning_mode=online", headers=headers)
    assert status == 200, f"Learning mode filter failed: {res_mode}"
    online_courses = res_mode["courses"]
    for c in online_courses:
        assert c["learning_mode"] == "online", f"Expected online course, got {c['learning_mode']}"
    print(f"✅ Pass: Learning mode filter successfully returned {len(online_courses)} online courses.\n")

    # 7. Test single course detail
    course_id = courses[0]["id"]
    print(f"Step 7: Testing course details retrieval for course ID: {course_id}...")
    status, res_detail = make_request(f"{BASE_COURSES_URL}/{course_id}", headers=headers)
    assert status == 200, f"Failed to fetch course details: {res_detail}"
    assert res_detail["course"]["id"] == course_id, "Returned course ID mismatch"
    print(f"✅ Pass: Single course details retrieved correctly.\n")

    # 8. Test skill to course relationship API (GET /api/skills/{skill_id}/courses)
    skill_id = "computer-literacy"
    print(f"Step 8: Fetching courses for skill ID: {skill_id}...")
    status, res_skill_courses = make_request(f"{BASE_SKILLS_URL}/{skill_id}/courses", headers=headers)
    assert status == 200, f"Failed to fetch skill courses: {res_skill_courses}"
    scourses = res_skill_courses["courses"]
    for c in scourses:
        assert c["skill_id"] == skill_id, f"Expected skill {skill_id}, got {c['skill_id']}"
    print(f"✅ Pass: Skill to Course connection returned {len(scourses)} matching courses.\n")

    # 9. Test course to lessons API (GET /api/courses/{id}/lessons)
    course_id_with_lessons = "computer-basics-entrepreneurs"
    print(f"Step 9: Fetching lessons list for course ID: {course_id_with_lessons}...")
    status, res_lessons = make_request(f"{BASE_COURSES_URL}/{course_id_with_lessons}/lessons", headers=headers)
    assert status == 200, f"Failed to fetch lessons: {res_lessons}"
    lessons = res_lessons["lessons"]
    assert len(lessons) > 0, "No lessons found for seeded course"
    print(f"✅ Pass: Successfully fetched {len(lessons)} sequential lessons. First: {lessons[0]['title']}\n")

    # 10. Test single lesson detail
    lesson_id = lessons[0]["id"]
    print(f"Step 10: Fetching single lesson detail for lesson ID: {lesson_id}...")
    status, res_les_detail = make_request(f"{BASE_COURSES_URL}/{course_id_with_lessons}/lessons/{lesson_id}", headers=headers)
    assert status == 200, f"Failed to fetch lesson detail: {res_les_detail}"
    assert res_les_detail["lesson"]["id"] == lesson_id, "Returned lesson ID mismatch"
    assert "content" in res_les_detail["lesson"], "Lesson content missing"
    print(f"✅ Pass: Single lesson details retrieved correctly.\n")

    # 11. Test personalized course recommendations
    print("Step 11: Set up learner profile interests and testing personalized recommendations...")
    # Setup profile with tailored interests
    status, res_prof = make_request(
        BASE_PROFILE_URL,
        data={
            "preferred_language": "en",
            "age": 28,
            "location": "Mysuru",
            "education_level": "Primary",
            "existing_skills": ["None"],
            "learning_interests": ["Digital Skills", "Tailoring"],
            "learning_preference": "online",
            "career_goal": "Start my own digital boutique shop"
        },
        headers=headers,
        method="PUT"
    )
    assert status == 200, f"Profile setup failed: {res_prof}"

    # Query personalized recommendations
    status, res_rec = make_request(f"{BASE_COURSES_URL}/recommendations", headers=headers)
    assert status == 200, f"Failed to fetch recommendations: {res_rec}"
    recs = res_rec["courses"]
    assert len(recs) > 0, "No course recommendations returned"
    print("Course recommendations returned:")
    for c in recs:
        print(f" - [{c['learning_mode']}] {c['title']} ({c['difficulty']})")
    
    print("\n✅ Pass: Personalized course recommendations generated successfully based on profile matching.\n")

    print("==================================================")
    print("ALL PHASE 3.2 COURSE CATALOGUE TESTS PASSED SUCCESSFULLY!")
    print("==================================================")

if __name__ == "__main__":
    run_course_catalog_tests()
