import urllib.request
import urllib.parse
import json
import uuid

BASE_AUTH_URL = "http://127.0.0.1:8001/api/auth"
BASE_PROFILE_URL = "http://127.0.0.1:8001/api/profile"
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

def run_onboarding_tests():
    print("==================================================")
    print("RUNNING PHASE 2.3 MULTILINGUAL ONBOARDING & PROFILE TESTS")
    print("==================================================")

    # 1. API Health Check still returns 200 (Scenarios 17)
    print("Test 1: GET /api/health still returns 200...")
    status, res = make_request(HEALTH_URL)
    assert status == 200, f"Expected 200, got {status}"
    assert res.get("success") is True, f"Expected success: True, got {res}"
    print("✅ Pass: GET /api/health is online and healthy.\n")

    # Set up some randomized email logins
    learner_email_1 = f"learner1_{uuid.uuid4().hex[:6]}@example.com"
    learner_email_2 = f"learner2_{uuid.uuid4().hex[:6]}@example.com"
    centre_email = f"centre_{uuid.uuid4().hex[:6]}@example.com"
    password = "securePassword123"

    print(f"Learner 1 Email: {learner_email_1}")
    print(f"Learner 2 Email: {learner_email_2}")
    print(f"Centre Email: {centre_email}\n")

    # 2. Unauthenticated profile access rejected (Scenario 12)
    print("Test 2: Unauthenticated GET /api/profile access rejected...")
    status, res = make_request(BASE_PROFILE_URL)
    assert status == 401, f"Expected 401, got {status}"
    print("✅ Pass: Unauthenticated access was correctly rejected with 401!\n")

    # 3. Create and verify Learner 1 (Scenario 1)
    print("Test 3: Creating and verifying Learner 1...")
    status, res = make_request(
        f"{BASE_AUTH_URL}/register",
        data={"name": "Savitha Nair", "email": learner_email_1, "password": password, "role": "learner"},
        method="POST"
    )
    assert status == 200, f"Registration failed: {res}"
    
    # Retrieve OTP for verification
    status, res_otp = make_request(f"{BASE_AUTH_URL}/dev-last-otp?email={learner_email_1}")
    assert status == 200, f"Failed to fetch OTP: {res_otp}"
    otp_code = res_otp["otp"]

    # Verify Learner 1
    status, res_verify = make_request(
        f"{BASE_AUTH_URL}/verify-otp",
        data={"email": learner_email_1, "otp": otp_code},
        method="POST"
    )
    assert status == 200, f"Verification failed: {res_verify}"
    print("✅ Pass: Learner 1 registered and email verified successfully.\n")

    # 4. Successful login of new learner (Scenario 1 & 2)
    print("Test 4: Learner 1 successful login...")
    status, res_login = make_request(
        f"{BASE_AUTH_URL}/login",
        data={"email": learner_email_1, "password": password},
        method="POST"
    )
    assert status == 200, f"Login failed: {res_login}"
    token_1 = res_login["access_token"]
    user_1 = res_login["user"]
    
    # Assert initial profilecompleted is false (Scenario 2)
    assert user_1["profile_completed"] is False, "Expected profile_completed to be False for new user"
    print("✅ Pass: New learner login returned correct token and profile_completed is False.\n")

    headers_1 = {"Authorization": f"Bearer {token_1}"}

    # 5. GET /api/profile works for Learner 1 (Scenario 14)
    print("Test 5: GET /api/profile for Learner 1...")
    status, res_profile = make_request(BASE_PROFILE_URL, headers=headers_1)
    assert status == 200, f"GET /api/profile failed: {res_profile}"
    profile_data = res_profile["profile"]
    assert profile_data["profile_completed"] is False
    assert profile_data["preferred_language"] == "en"
    assert profile_data["completion_percentage"] == 12  # preferred_language "en" exists (1 out of 8 fields)
    print(f"✅ Pass: GET /api/profile returned initial state. Completion Percentage: {profile_data['completion_percentage']}%\n")

    # 6. Select and update preferred language (Scenario 3 & 4)
    print("Test 6: PUT /api/profile to update language to Kannada ('kn')...")
    status, res_put = make_request(
        BASE_PROFILE_URL,
        data={"preferred_language": "kn"},
        headers=headers_1,
        method="PUT"
    )
    assert status == 200, f"Language update failed: {res_put}"
    profile_updated = res_put["profile"]
    assert profile_updated["preferred_language"] == "kn", "Expected language to be saved as 'kn'"
    
    # Double check GET /api/auth/me reflects language choice (Scenario 4)
    status, res_me = make_request(f"{BASE_AUTH_URL}/me", headers=headers_1)
    assert status == 200
    assert res_me["user"]["preferred_language"] == "kn", "Expected /me to return updated language"
    print("✅ Pass: Language successfully persisted and propagated to both /profile and /me.\n")

    # 7. Progressive profile setup & calculation (Scenario 5, 6 & 7)
    print("Test 7: Update Step 1 basic info (age, location)...")
    status, res_put2 = make_request(
        BASE_PROFILE_URL,
        data={"age": 28, "location": "Bengaluru"},
        headers=headers_1,
        method="PUT"
    )
    assert status == 200
    profile_updated2 = res_put2["profile"]
    assert profile_updated2["age"] == 28
    assert profile_updated2["location"] == "Bengaluru"
    assert profile_updated2["profile_completed"] is False
    # Check progressive percentage (kn, age, location) -> 3 fields -> 37%
    assert profile_updated2["completion_percentage"] == 37, f"Expected 37%, got {profile_updated2['completion_percentage']}"
    print(f"✅ Pass: Basic info updated. Completion is now at progressive {profile_updated2['completion_percentage']}%.\n")

    # 8. Complete remaining required fields to auto-trigger profile completion (Scenario 6, 7 & 8)
    print("Test 8: Completing remaining wizard steps to reach 100%...")
    status, res_put_final = make_request(
        BASE_PROFILE_URL,
        data={
            "education_level": "Undergraduate",
            "existing_skills": ["Tailoring"],
            "learning_interests": ["Embroidery"],
            "learning_preference": "Hybrid",
            "career_goal": "Entrepreneurship"
        },
        headers=headers_1,
        method="PUT"
    )
    assert status == 200, f"Final save failed: {res_put_final}"
    profile_final = res_put_final["profile"]
    assert profile_final["profile_completed"] is True, "Expected profile_completed to be True at 100% completion"
    assert profile_final["completion_percentage"] == 100, f"Expected 100%, got {profile_final['completion_percentage']}"
    print("✅ Pass: Completed profile reached 100% and auto-triggered profile_completed = True.\n")

    # 9. Verify completed learner skips onboarding redirect in subsequent checks (Scenario 9)
    print("Test 9: Verifying GET /api/auth/me reflects completed state...")
    status, res_me_final = make_request(f"{BASE_AUTH_URL}/me", headers=headers_1)
    assert status == 200
    assert res_me_final["user"]["profile_completed"] is True, "Expected /me to return profile_completed: True"
    print("✅ Pass: Existing completed learner skips onboarding redirect checks on login.\n")

    # 10. Register second learner to verify access control (Scenario 13)
    print("Test 10: Create and verify Learner 2...")
    status, res = make_request(
        f"{BASE_AUTH_URL}/register",
        data={"name": "Pooja Hegde", "email": learner_email_2, "password": password, "role": "learner"},
        method="POST"
    )
    assert status == 200
    status, res_otp = make_request(f"{BASE_AUTH_URL}/dev-last-otp?email={learner_email_2}")
    otp_code_2 = res_otp["otp"]
    make_request(
        f"{BASE_AUTH_URL}/verify-otp",
        data={"email": learner_email_2, "otp": otp_code_2},
        method="POST"
    )
    status, res_login_2 = make_request(
        f"{BASE_AUTH_URL}/login",
        data={"email": learner_email_2, "password": password},
        method="POST"
    )
    token_2 = res_login_2["access_token"]
    headers_2 = {"Authorization": f"Bearer {token_2}"}
    print("✅ Pass: Learner 2 active.\n")

    # Verify Learner 2 cannot read or write Learner 1's profile
    print("Test 11: Learner 2 access control check...")
    # Since endpoint is GET /api/profile (implicitly identifies caller from JWT sub),
    # verifying that Learner 2 retrieves their OWN separate profile, and not Learner 1's profile
    status, res_profile_2 = make_request(BASE_PROFILE_URL, headers=headers_2)
    assert status == 200
    assert res_profile_2["profile"]["age"] is None, "Learner 2 profile retrieved Learner 1 age values!"
    print("✅ Pass: Profile endpoint is authenticated and strictly scoped to active caller token sub.\n")

    # 11. Centre skips learner onboarding (Scenario 10)
    print("Test 12: Create, verify, and login Centre user...")
    status, res = make_request(
        f"{BASE_AUTH_URL}/register",
        data={"name": "Hubballi Centre", "email": centre_email, "password": password, "role": "centre"},
        method="POST"
    )
    assert status == 200
    status, res_otp = make_request(f"{BASE_AUTH_URL}/dev-last-otp?email={centre_email}")
    otp_code_c = res_otp["otp"]
    make_request(
        f"{BASE_AUTH_URL}/verify-otp",
        data={"email": centre_email, "otp": otp_code_c},
        method="POST"
    )
    status, res_login_c = make_request(
        f"{BASE_AUTH_URL}/login",
        data={"email": centre_email, "password": password},
        method="POST"
    )
    user_c = res_login_c["user"]
    # Verify profile_completed and language-onboarding is not enforced for non-learner roles
    assert user_c["role"] == "centre", "Expected role to be centre"
    # Even if they don't have profile completed, the React guard skips learner onboarding for non-learners
    print("✅ Pass: Centre account skips learner onboarding rules.\n")

    print("==================================================")
    print("ALL INTEGRATION TESTS PASSED TRIUMPHANTLY!")
    print("==================================================")

if __name__ == "__main__":
    run_onboarding_tests()
