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

def run_phase_6_3_tests():
    print("==================================================")
    print("RUNNING NARINEXUS PHASE 6.3 MASTER TESTS")
    print("==================================================")

    # Generate fresh emails & mock credentials
    centre_a_email = f"centre_course_a_{uuid.uuid4().hex[:6]}@naricentre.org"
    centre_b_email = f"centre_course_b_{uuid.uuid4().hex[:6]}@naricentre.org"
    learner_email = f"learner_course_{uuid.uuid4().hex[:6]}@gmail.com"
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
            "centre_name": "Coaching Kendra A",
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
            "centre_name": "Coaching Kendra B",
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

    # Test 1: Unauthenticated Courses Listing
    print("Test 1: Unauthenticated GET /api/centres/courses is rejected...")
    status, res = make_request(f"{CENTRES_URL}/courses")
    if status == 401:
        print("✅ Pass: Unauthenticated list request rejected with 401.")
    else:
        print(f"❌ Fail: Expected 401, got {status}: {res}")
        sys.exit(1)

    # Test 2: Learner access course list
    print("Test 2: Learner access to GET /api/centres/courses is forbidden...")
    status, res = make_request(f"{CENTRES_URL}/courses", headers=learner_headers)
    if status == 403:
        print("✅ Pass: Learner list request rejected with 403.")
    else:
        print(f"❌ Fail: Expected 403, got {status}: {res}")
        sys.exit(1)

    # Test 3: Create course with invalid skill ID
    print("Test 3: Creating course with invalid skill_id returns 400 Bad Request...")
    invalid_course_payload = {
        "title": "Boutique Stitching & Fashion",
        "description": "Learn professional lining stitching for modern dresses and salwar.",
        "skill_id": "nonexistent-skill-id-12345",
        "category_id": "tailoring-fashion",
        "difficulty": "intermediate",
        "duration": "6 Weeks",
        "learning_mode": "hybrid",
        "instructor": "Shobha Sen",
        "prerequisites": ["None"],
        "career_outcomes": ["Boutique Tailor"],
        "language": "en",
        "status": "active"
    }
    status, res = make_request(f"{CENTRES_URL}/courses", data=invalid_course_payload, headers=centre_a_headers, method="POST")
    if status == 400:
        print("✅ Pass: Invalid skill ID creation rejected successfully.")
    else:
        print(f"❌ Fail: Expected 400, got {status}: {res}")
        sys.exit(1)

    # Test 4: Course Creation with valid skill ID
    print("Test 4: Creating course with valid skill_id for Centre A succeeds...")
    valid_course_payload = dict(invalid_course_payload)
    valid_course_payload["skill_id"] = "basic-stitching"  # existing valid skill
    status, res = make_request(f"{CENTRES_URL}/courses", data=valid_course_payload, headers=centre_a_headers, method="POST")
    if status == 201 and res.get("success") is True:
        print("✅ Pass: Centre A course created successfully.")
        centre_a_course = res["course"]
        course_id = centre_a_course["id"]
    else:
        print(f"❌ Fail: Expected 201, got {status}: {res}")
        sys.exit(1)

    # Test 5: Centre A gets its course list
    print("Test 5: Centre A retrieves its course list...")
    status, res = make_request(f"{CENTRES_URL}/courses", headers=centre_a_headers)
    courses = res.get("courses", [])
    if status == 200 and len(courses) == 1 and courses[0]["id"] == course_id:
        print("✅ Pass: Centre A successfully lists its created course.")
    else:
        print(f"❌ Fail: Expected list of length 1, got status {status}: {res}")
        sys.exit(1)

    # Test 6: Centre B gets its course list (enforce isolation)
    print("Test 6: Centre B retrieves its course list and is isolated from Centre A...")
    status, res = make_request(f"{CENTRES_URL}/courses", headers=centre_b_headers)
    courses_b = res.get("courses", [])
    if status == 200 and len(courses_b) == 0:
        print("✅ Pass: Isolation verified. Centre B does not see Centre A's course.")
    else:
        print(f"❌ Fail: Expected 0 courses for Centre B, got: {res}")
        sys.exit(1)

    # Test 7: Centre A updates course details
    print("Test 7: Centre A updates its own course details...")
    update_payload = {
        "title": "Boutique Stitching & Fashion (Updated)",
        "duration": "8 Weeks"
    }
    status, res = make_request(f"{CENTRES_URL}/courses/{course_id}", data=update_payload, headers=centre_a_headers, method="PUT")
    if status == 200 and res.get("course", {}).get("title") == "Boutique Stitching & Fashion (Updated)":
        print("✅ Pass: Centre A course updated successfully.")
    else:
        print(f"❌ Fail: Expected 200 with updated fields, got {status}: {res}")
        sys.exit(1)

    # Test 8: Centre B attempts to update Centre A's course (secure check)
    print("Test 8: Centre B attempts to update Centre A's course and is rejected...")
    status, res = make_request(f"{CENTRES_URL}/courses/{course_id}", data=update_payload, headers=centre_b_headers, method="PUT")
    if status == 404:
        print("✅ Pass: Centre B rejected with 404 for unauthorized course modification.")
    else:
        print(f"❌ Fail: Expected 404, got {status}: {res}")
        sys.exit(1)

    # Test 9: Centre B attempts to deactivate Centre A's course (secure status check)
    print("Test 9: Centre B attempts to deactivate Centre A's course and is rejected...")
    status, res = make_request(f"{CENTRES_URL}/courses/{course_id}/status", data={"status": "inactive"}, headers=centre_b_headers, method="PATCH")
    if status == 404:
        print("✅ Pass: Centre B rejected with 404 for unauthorized status change.")
    else:
        print(f"❌ Fail: Expected 404, got {status}: {res}")
        sys.exit(1)

    # Test 10: Centre A deactivates its own course
    print("Test 10: Centre A deactivates its course...")
    status, res = make_request(f"{CENTRES_URL}/courses/{course_id}/status", data={"status": "inactive"}, headers=centre_a_headers, method="PATCH")
    if status == 200 and res.get("course", {}).get("status") == "inactive" and res.get("course", {}).get("is_active") is False:
        print("✅ Pass: Course deactivated successfully and is_active flag synchronized.")
    else:
        print(f"❌ Fail: Expected status inactive and is_active False, got {status}: {res}")
        sys.exit(1)

    # Test 11: Centre A activates its own course
    print("Test 11: Centre A activates its course back...")
    status, res = make_request(f"{CENTRES_URL}/courses/{course_id}/status", data={"status": "active"}, headers=centre_a_headers, method="PATCH")
    if status == 200 and res.get("course", {}).get("status") == "active" and res.get("course", {}).get("is_active") is True:
        print("✅ Pass: Course activated back successfully.")
    else:
        print(f"❌ Fail: Expected status active and is_active True, got {status}: {res}")
        sys.exit(1)

    print("==================================================")
    print("ALL PHASE 6.3 COURSE MANAGEMENT TESTS PASSED!")
    print("==================================================")

if __name__ == "__main__":
    run_phase_6_3_tests()
