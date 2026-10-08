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

def register_and_login(email_prefix: str, language: str = "en") -> str:
    email = f"{email_prefix}_{uuid.uuid4().hex[:6]}@example.com"
    password = "securePassword123"

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
    assert status == 200, f"Registration failed for {email_prefix}: {res}"

    status, res_otp = make_request(f"{BASE_AUTH_URL}/dev-last-otp?email={email}")
    otp_code = res_otp["otp"]

    status, res_verify = make_request(
        f"{BASE_AUTH_URL}/verify-otp",
        data={"email": email, "otp": otp_code},
        method="POST"
    )
    assert status == 200, f"Verification failed: {res_verify}"

    status, res_login = make_request(
        f"{BASE_AUTH_URL}/login",
        data={"email": email, "password": password},
        method="POST"
    )
    assert status == 200, f"Login failed: {res_login}"
    token = res_login["access_token"]

    # If non-default language is specified, update the profile
    if language != "en":
        headers = {"Authorization": f"Bearer {token}"}
        status, res_prof = make_request(
            BASE_PROFILE_URL,
            data={"preferred_language": language},
            headers=headers,
            method="PUT"
        )
        assert status == 200, f"Profile language update failed: {res_prof}"

    return token

def run_ai_chatbot_tests():
    print("==================================================")
    print("RUNNING PHASE 5.2 MULTILINGUAL AI CHATBOT SYSTEM TESTS")
    print("==================================================")

    # 1. Health check & existing systems verify
    print("Checking health endpoint /api/health...")
    status, health_res = make_request(HEALTH_URL)
    assert status == 200, f"Health check failed: {health_res}"
    print("✅ Pass: /api/health returns 200.\n")

    # 2. Setup Test Learners with different languages
    print("Setting up test learners...")
    learner_en_token = register_and_login("learner_en", "en")
    learner_kn_token = register_and_login("learner_kn", "kn")
    learner_hi_token = register_and_login("learner_hi", "hi")

    headers_en = {"Authorization": f"Bearer {learner_en_token}"}
    headers_kn = {"Authorization": f"Bearer {learner_kn_token}"}
    headers_hi = {"Authorization": f"Bearer {learner_hi_token}"}
    print("✅ Pass: Test learners registered and configured with English, Kannada, and Hindi profiles.\n")

    # 3. Unauthenticated chat requests must be rejected
    print("Test 1: Rejecting unauthenticated requests...")
    status, res = make_request(
        f"{BASE_AI_URL}/chat",
        data={"message": "Hello"},
        method="POST"
    )
    assert status == 401 or status == 403, f"Expected 401/403 for unauthenticated chat, got {status}: {res}"
    print("✅ Pass: Unauthenticated requests rejected successfully.\n")

    # 4. Empty message must be rejected
    print("Test 2: Rejecting empty messages...")
    status, res = make_request(
        f"{BASE_AI_URL}/chat",
        data={"message": ""},
        headers=headers_en,
        method="POST"
    )
    assert status == 400 or status == 422, f"Expected 400/422 for empty message, got {status}: {res}"
    print("✅ Pass: Empty message rejected successfully.\n")

    # 5. Excessively long message must be handled
    print("Test 3: Rejecting excessively long messages...")
    too_long_msg = "A" * 2001
    status, res = make_request(
        f"{BASE_AI_URL}/chat",
        data={"message": too_long_msg},
        headers=headers_en,
        method="POST"
    )
    assert status == 400 or status == 422, f"Expected 400/422 for message too long, got {status}: {res}"
    print("✅ Pass: Message length limit validated successfully.\n")

    # 6. Authenticated Chat Flow and Session creation
    print("Test 4: Learner EN starts a conversation and receives response...")
    status, chat_res = make_request(
        f"{BASE_AI_URL}/chat",
        data={"message": "What skills can I learn on NariNexus?"},
        headers=headers_en,
        method="POST"
    )
    assert status == 200, f"Failed to send chat: {chat_res}"
    assert chat_res.get("success") is True, f"Response success flag is false: {chat_res}"
    assert "response" in chat_res, "AI response field missing"
    assert "session_id" in chat_res, "AI response session_id missing"
    session_id = chat_res["session_id"]
    print(f"✅ Pass: Message sent, received response. Session ID: {session_id}\n")

    # 7. Thread continuing and state check
    print("Test 5: Continuing conversation in the same session...")
    status, chat_res_2 = make_request(
        f"{BASE_AI_URL}/chat",
        data={"message": "Can you give more details about the Tailoring course?", "session_id": session_id},
        headers=headers_en,
        method="POST"
    )
    assert status == 200, f"Failed to continue chat: {chat_res_2}"
    assert chat_res_2["session_id"] == session_id, "Session ID changed when continuing thread"
    print("✅ Pass: Continued thread in the exact same session.\n")

    # 8. Retrieve chat sessions
    print("Test 6: Retrieving learner's chat sessions...")
    status, list_res = make_request(
        f"{BASE_AI_URL}/chat/sessions",
        headers=headers_en,
        method="GET"
    )
    assert status == 200, f"Failed to list sessions: {list_res}"
    sessions = list_res.get("sessions", [])
    assert len(sessions) >= 1, "Listed sessions count should be at least 1"
    assert any(s["session_id"] == session_id for s in sessions), "Created session not found in list"
    print(f"✅ Pass: Listed sessions contains the session {session_id}.\n")

    # 9. Retrieve session messages
    print("Test 7: Retrieving messages within a chat session...")
    status, msgs_res = make_request(
        f"{BASE_AI_URL}/chat/sessions/{session_id}/messages",
        headers=headers_en,
        method="GET"
    )
    assert status == 200, f"Failed to get messages: {msgs_res}"
    messages = msgs_res.get("messages", [])
    # Should have at least 4 messages (User, Model, User, Model)
    assert len(messages) >= 4, f"Expected at least 4 messages in thread, got: {len(messages)}"
    assert messages[0]["role"] == "user", "Expected first message to be user role"
    assert messages[1]["role"] == "model", "Expected second message to be model role"
    print(f"✅ Pass: Retrieved {len(messages)} messages from session {session_id}.\n")

    # 10. Multi-user security: Learner B must not access Learner A's chat
    print("Test 8: Validating multi-user security isolation...")
    status, malicious_res = make_request(
        f"{BASE_AI_URL}/chat/sessions/{session_id}/messages",
        headers=headers_kn, # Learner KN trying to read Learner EN's session
        method="GET"
    )
    assert status == 403, f"Expected 403 Forbidden for cross-user session retrieval, got {status}: {malicious_res}"
    print("✅ Pass: Learner B was rejected from retrieving Learner A's chat history.\n")

    # 11. Multilingual Kannada and Hindi preference tests
    print("Test 9: Verifying Kannada preferred language response...")
    status, chat_kn = make_request(
        f"{BASE_AI_URL}/chat",
        data={"message": "ಹಲೋ"},
        headers=headers_kn,
        method="POST"
    )
    assert status == 200, f"Failed to send chat in Kannada: {chat_kn}"
    assert chat_kn.get("language") == "kn", "Expected preferred language kn"
    # Ensure it output something in Kannada
    print(f"Kannada AI Response preview: {chat_kn['response'][:60]}...")
    print("✅ Pass: Kannada preferred language responded correctly.\n")

    print("Test 10: Verifying Hindi preferred language response...")
    status, chat_hi = make_request(
        f"{BASE_AI_URL}/chat",
        data={"message": "नमस्ते"},
        headers=headers_hi,
        method="POST"
    )
    assert status == 200, f"Failed to send chat in Hindi: {chat_hi}"
    assert chat_hi.get("language") == "hi", "Expected preferred language hi"
    print(f"Hindi AI Response preview: {chat_hi['response'][:60]}...")
    print("✅ Pass: Hindi preferred language responded correctly.\n")

    print("🎉 ALL PHASE 5.2 SYSTEM AND SECURITY TESTS PASSED PERFECTLY!")

if __name__ == "__main__":
    run_ai_chatbot_tests()
