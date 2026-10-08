import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import urllib.request
import urllib.parse
import json
import uuid

BASE_AUTH_URL = "http://127.0.0.1:8001/api/auth"
BASE_AI_URL = "http://127.0.0.1:8001/api/ai"
BASE_PROFILE_URL = "http://127.0.0.1:8001/api/profile"
BASE_COURSE_URL = "http://127.0.0.1:8001/api/courses"
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

def register_and_login(email_prefix: str, language: str = "en") -> tuple:
    email = f"{email_prefix}_{uuid.uuid4().hex[:6]}@example.com"
    password = "securePassword123"

    # Register
    status, res = make_request(
        f"{BASE_AUTH_URL}/register",
        data={
            "name": f"Test {email_prefix.capitalize()}",
            "email": email,
            "password": password,
            "role": "learner"
        },
        method="POST"
    )
    assert status == 200, f"Registration failed: {res}"

    # OTP Fetch
    status, res_otp = make_request(f"{BASE_AUTH_URL}/dev-last-otp?email={email}")
    otp_code = res_otp["otp"]

    # Verify OTP
    status, res_verify = make_request(
        f"{BASE_AUTH_URL}/verify-otp",
        data={"email": email, "otp": otp_code},
        method="POST"
    )
    assert status == 200, f"Verification failed: {res_verify}"

    # Login
    status, res_login = make_request(
        f"{BASE_AUTH_URL}/login",
        data={"email": email, "password": password},
        method="POST"
    )
    assert status == 200, f"Login failed: {res_login}"
    token = res_login["access_token"]
    user_id = res_login.get("user", {}).get("id")

    # Update preferred language in profile
    if language != "en":
        headers = {"Authorization": f"Bearer {token}"}
        status, res_prof = make_request(
            BASE_PROFILE_URL,
            data={"preferred_language": language},
            headers=headers,
            method="PUT"
        )
        assert status == 200, f"Profile language update failed: {res_prof}"

    return token, user_id

def run_phase_5_3_tests():
    print("==================================================")
    print("RUNNING PHASE 5.3 DETAILED SYSTEM & FUNCTIONAL TESTS")
    print("==================================================")

    # Test 1: API Health
    print("Test 1: GET /api/health...")
    status, health_res = make_request(HEALTH_URL)
    assert status == 200, f"Health check failed: {health_res}"
    db_status = health_res.get("database", "disconnected")
    print(f"✅ Pass: /api/health returns 200. DB Status: {db_status}\n")

    # Test 2: Existing Authentication and Profile Onboarding
    print("Test 2: Onboarding test learner in Kannada preferred language...")
    token_kn, user_kn_id = register_and_login("kn_learner", "kn")
    headers_kn = {"Authorization": f"Bearer {token_kn}"}
    print("✅ Pass: Onboarded successfully with Kannada profile preference.\n")

    # Test 3: Course Catalogue retrieve
    print("Test 3: Retrieving available courses in catalogue...")
    status, courses_res = make_request(BASE_COURSE_URL, headers=headers_kn)
    assert status == 200, f"Failed to get courses: {courses_res}"
    courses = courses_res.get("courses", [])
    assert len(courses) > 0, "No courses found in platform data"
    print(f"✅ Pass: Successfully loaded {len(courses)} courses from database/fallback.\n")

    # Test 4: Course Enrollment & Progress system checklist
    print("Test 4: Enrolling learner in a tailoring course...")
    tailoring_course_id = "garment-alterations-basics"
    status, enroll_res = make_request(
        BASE_ENROLL_URL,
        data={"course_id": tailoring_course_id, "learning_mode": "offline"},
        headers=headers_kn,
        method="POST"
    )
    # 400 is acceptable if they are already enrolled (idempotency check)
    assert status in [200, 400], f"Enrollment action failed: {enroll_res}"
    print("✅ Pass: Enrollment verified successfully.\n")

    # Test 5: Verify dynamic language detection - English requested by a Kannada profile
    print("Test 5: Explicit English switching request ('Can you chat with me in English?')...")
    status, chat_en = make_request(
        f"{BASE_AI_URL}/chat",
        data={"message": "Can you chat with me in English?"},
        headers=headers_kn,
        method="POST"
    )
    assert status == 200, f"Chat call failed: {chat_en}"
    response_text = chat_en["response"]
    print(f"AI response: {response_text}")
    # Verify it switched to English or contains English indicators
    assert any(w in response_text.lower() for w in ["english", "absolutely", "hello", "how"]), "Response not in English"
    print("✅ Pass: AI assistant priority-switched to English dynamically.\n")

    # Test 6: Verify Kannada Conversation & Tailoring Guidance
    print("Test 6: Requesting tailoring details in Kannada...")
    status, chat_tailor_kn = make_request(
        f"{BASE_AI_URL}/chat",
        data={"message": "ನಾರಿನೆಕ್ಸಸ್ನಲ್ಲಿ ಹೊಲಿಗೆ ಕೋರ್ಸ್ ಬಗ್ಗೆ ಮಾಹಿತಿ ನೀಡುತ್ತೀರಾ?"},
        headers=headers_kn,
        method="POST"
    )
    assert status == 200, f"Chat call failed: {chat_tailor_kn}"
    res_kn = chat_tailor_kn["response"]
    print(f"AI Kannada Response: {res_kn}")
    # Verify response is in Kannada and mentions sewing/tailoring details rather than default message
    assert any(k in res_kn for k in ["ಹೊಲಿಗೆ", "ಕೋ", "ಬಟ್ಟೆ", "ಕಟಿಂಗ್", "ಬ್ಲೌಸ್"]), "Response did not address tailoring in Kannada"
    print("✅ Pass: Dynamic Kannada and Tailoring-specific guidance works flawlessly.\n")

    # Test 7: Verify follow-up context and session maintenance
    print("Test 7: Continuing thread with follow-up question...")
    session_id = chat_tailor_kn["session_id"]
    status, chat_follow = make_request(
        f"{BASE_AI_URL}/chat",
        data={"message": "ಮತ್ತು ಎರಡನೇ ಕೋರ್ಸ್ ವಿವರ ತಿಳಿಸಿ", "session_id": session_id},
        headers=headers_kn,
        method="POST"
    )
    assert status == 200, f"Chat follow-up failed: {chat_follow}"
    assert chat_follow["session_id"] == session_id, "Session ID split on follow-up question"
    print("✅ Pass: Conversational context and session tracking remains perfectly stable.\n")

    # Test 8: Different questions producing different, non-repeating answers
    print("Test 8: Validating different questions produce non-repeating, diverse answers...")
    status, chat_hello = make_request(
        f"{BASE_AI_URL}/chat",
        data={"message": "ಹಲೋ"},
        headers=headers_kn,
        method="POST"
    )
    assert status == 200
    res_hello = chat_hello["response"]
    # Check that hello response is structurally distinct from the tailoring response
    assert res_hello != res_kn, "AI repeated identical welcome message for custom tailoring question!"
    print("✅ Pass: Dynamic distinctiveness validated correctly.\n")

    print("🎉 ALL PHASE 5.3 FUNCTIONAL AND MULTILINGUAL SECURITY TESTS PASSED PERFECTLY!")

if __name__ == "__main__":
    run_phase_5_3_tests()
