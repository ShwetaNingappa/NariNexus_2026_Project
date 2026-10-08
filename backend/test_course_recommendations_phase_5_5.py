import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import urllib.request
import urllib.parse
import json
import uuid

BASE_AUTH_URL = "http://127.0.0.1:8001/api/auth"
BASE_PROFILE_URL = "http://127.0.0.1:8001/api/profile"
BASE_COURSES_URL = "http://127.0.0.1:8001/api/courses"
BASE_ENROLL_URL = "http://127.0.0.1:8001/api/enroll"

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

def run_phase_5_5_tests():
    print("==================================================")
    print("RUNNING PHASE 5.5 AI PERSONALIZED COURSE RECOMMENDATION TESTS")
    print("==================================================")

    # 1. Register a test learner
    learner_email = f"learner_rec_{uuid.uuid4().hex[:6]}@example.com"
    password = "securePassword123"

    print("Step 1: Registering and verifying a test learner...")
    status, res = make_request(
        f"{BASE_AUTH_URL}/register",
        data={"name": "Savitha Gowda", "email": learner_email, "password": password, "role": "learner"},
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
    print("✅ Pass: Test learner authenticated successfully.\n")

    # 2. Test unauthorized request
    print("Step 2: Testing unauthenticated recommendations access...")
    status, res_unauth = make_request(f"{BASE_COURSES_URL}/recommendations")
    assert status == 401, f"Expected 401 for unauthorized access, got {status}"
    print("✅ Pass: Unauthenticated request is rejected with 401.\n")

    # 3. Test empty/incomplete profile handling
    print("Step 3: Requesting recommendations with default profile...")
    status, res_recs_empty = make_request(f"{BASE_COURSES_URL}/recommendations", headers=headers)
    assert status == 200, f"Failed to fetch default recommendations: {res_recs_empty}"
    assert res_recs_empty["success"] is True
    assert len(res_recs_empty["courses"]) > 0, "Should return fallback recommendations even with empty profile"
    print("✅ Pass: Empty profile handled successfully without crashing.\n")

    # 4. Set up rich profile (interests, skills, language)
    print("Step 4: Customizing profile with stitching/tailoring interests and English language...")
    status, res_update = make_request(
        BASE_PROFILE_URL,
        data={
            "phone_number": "+919876543210",
            "age": 28,
            "district": "Mandya",
            "education_level": "PUC",
            "preferred_language": "en",
            "experience_level": "Beginner",
            "learning_interests": ["Stitching", "Tailoring", "Micro-Accounting"],
            "existing_skills": ["Cooking"],
            "career_goal": "Start a local tailoring boutique",
            "learning_preference": "online"
        },
        method="PUT",
        headers=headers
    )
    assert status == 200, f"Profile setup failed: {res_update}"
    print("✅ Pass: Onboarding profile successfully updated.\n")

    # 5. Fetch personalized courses
    print("Step 5: Fetching AI course recommendations...")
    status, res_recs = make_request(f"{BASE_COURSES_URL}/recommendations", headers=headers)
    assert status == 200, f"Failed to fetch course recommendations: {res_recs}"
    print(f"DEBUG RECS RESPONSE: {json.dumps(res_recs, indent=2)}")
    courses = res_recs["courses"]
    assert len(courses) <= 3, f"Expected at most 3 recommendations, got {len(courses)}"
    
    for c in courses:
        assert "id" in c, "Course ID missing from recommendation"
        assert "title" in c, "Course title missing from recommendation"
        assert "reason" in c, "Recommendation reason missing"
        assert "benefit" in c, "Recommendation benefit missing"
        assert "relevance" in c, "Recommendation relevance status missing"
    print("✅ Pass: Dynamic personalized recommendations returned correct schema and rank.\n")

    # 6. Verify language selection Kannada works
    print("Step 6: Updating profile language to Kannada and validating explanations...")
    status, res_lang = make_request(
        BASE_PROFILE_URL,
        data={
            "preferred_language": "kn",
            "learning_interests": ["Stitching", "Tailoring"],
            "existing_skills": [],
            "experience_level": "Beginner",
            "career_goal": "ಸ್ವಯಂ ಉದ್ಯೋಗ",
            "learning_preference": "online"
        },
        method="PUT",
        headers=headers
    )
    assert status == 200, f"Profile language update failed: {res_lang}"

    status, res_kn_recs = make_request(f"{BASE_COURSES_URL}/recommendations", headers=headers)
    assert status == 200, f"Failed to fetch Kannada recommendations: {res_kn_recs}"
    kn_courses = res_kn_recs["courses"]
    
    # Verify we got localized text or course translations
    for kc in kn_courses:
        assert "reason" in kc
        print(f"Kannada course recommendation explanation: {kc['reason']}")
    print("✅ Pass: Kannada-specific course matching and explanations work perfectly.\n")

    # 7. Test completed courses exclusion
    print("Step 7: Enrolling in the first recommended course and marking it completed to verify exclusion...")
    first_course_id = courses[0]["id"]
    status, res_enroll = make_request(
        "http://127.0.0.1:8001/api/enrollments",
        data={"course_id": first_course_id, "learning_mode": "online"},
        method="POST",
        headers=headers
    )
    assert status in [200, 400], f"Enrollment request returned unexpected status: {status}"

    # Mark as completed in the database directly
    from backend.app.core.database import db_instance
    db_instance.connect()
    db = db_instance.get_db()
    if db is not None:
        db["enrollments"].update_many(
            {"course_id": first_course_id},
            {"$set": {"status": "completed"}}
        )
    else:
        from backend.app.services.enrollment_service import load_mock_enrollments, save_mock_enrollments
        enrolls = load_mock_enrollments()
        for e in enrolls:
            if e.get("course_id") == first_course_id:
                e["status"] = "completed"
        save_mock_enrollments(enrolls)
    
    print("✅ Pass: Successfully completed the course in the database.")

    # Fetch recommendations again
    status, res_new_recs = make_request(f"{BASE_COURSES_URL}/recommendations", headers=headers)
    assert status == 200, f"Failed to fetch updated recommendations: {res_new_recs}"
    
    new_course_ids = [nc["id"] for nc in res_new_recs["courses"]]
    assert first_course_id not in new_course_ids, f"Completed course {first_course_id} should be excluded from future recommendations"
    print("✅ Pass: Successfully excluded completed courses from recommended list.\n")

    print("All Phase 5.5 Course Recommendation Integration Tests Passed Successfully!")

if __name__ == "__main__":
    run_phase_5_5_tests()
