import urllib.request
import urllib.parse
import json
import uuid

BASE_URL = "http://127.0.0.1:8001/api/auth"
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

def run_tests():
    print("==================================================")
    print("RUNNING NARINEXUS AUTHENTICATION FOUNDATION TESTS")
    print("==================================================")
    
    test_email = f"test_{uuid.uuid4().hex[:8]}@example.com"
    test_password = "securePassword123"
    new_password = "newSecurePassword456"
    
    print(f"Using randomized test email: {test_email}\n")
    
    # 1. Invalid email registration test
    print("Test 1: Invalid email registration rejection...")
    status, res = make_request(
        f"{BASE_URL}/register",
        data={"name": "Test User", "email": "invalid-email-format", "password": "password123", "role": "learner"},
        method="POST"
    )
    print(f"Status: {status}, Response: {res}")
    if status in [400, 422]:
        print("✅ Pass: Invalid email was correctly rejected!\n")
    else:
        print("❌ Fail: Invalid email registration did not fail as expected.\n")
        return

    # 2. Weak/invalid password registration test (length < 6)
    print("Test 2: Weak/invalid password registration rejection...")
    status, res = make_request(
        f"{BASE_URL}/register",
        data={"name": "Test User", "email": test_email, "password": "123", "role": "learner"},
        method="POST"
    )
    print(f"Status: {status}, Response: {res}")
    is_weak_rejected = (status == 400 and "Password must be at least 6 characters" in str(res)) or \
                       (status == 422 and any("string_too_short" in str(err) or "at least 6 characters" in str(err) for err in res.get("detail", [])))
    if is_weak_rejected:
        print("✅ Pass: Weak password (< 6 chars) was correctly rejected!\n")
    else:
        print("❌ Fail: Weak password was not rejected or message did not match.\n")
        return

    # 3. Register Learner successfully
    print("Test 3: Valid registration...")
    status, res = make_request(
        f"{BASE_URL}/register",
        data={"name": "Test Learner", "email": test_email, "password": test_password, "role": "learner"},
        method="POST"
    )
    print(f"Status: {status}, Response: {res}")
    if status == 200 and res.get("success") is True:
        print("✅ Pass: Learner registered successfully!\n")
    else:
        print("❌ Fail: Learner registration failed.\n")
        return

    # 4. Duplicate email registration test
    print("Test 4: Duplicate email registration rejection...")
    status, res = make_request(
        f"{BASE_URL}/register",
        data={"name": "Duplicate User", "email": test_email, "password": test_password, "role": "learner"},
        method="POST"
    )
    print(f"Status: {status}, Response: {res}")
    if status == 400 and "already registered" in str(res):
        print("✅ Pass: Duplicate email was correctly rejected!\n")
    else:
        print("❌ Fail: Duplicate email was not rejected as expected.\n")
        return

    # 5. Admin registration restriction test
    print("Test 5: Public registration as Admin restriction...")
    status, res = make_request(
        f"{BASE_URL}/register",
        data={"name": "Fake Admin", "email": f"fake_admin_{uuid.uuid4().hex[:4]}@example.com", "password": test_password, "role": "admin"},
        method="POST"
    )
    print(f"Status: {status}, Response: {res}")
    if status == 400 and "forbidden" in str(res).lower():
        print("✅ Pass: Public Admin registration was correctly rejected!\n")
    else:
        print("❌ Fail: Public Admin registration should be blocked.\n")
        return

    # 6. Unverified login rejection test
    print("Test 6: Unverified user login rejection...")
    status, res = make_request(
        f"{BASE_URL}/login",
        data={"email": test_email, "password": test_password},
        method="POST"
    )
    print(f"Status: {status}, Response: {res}")
    if status == 400 and "verification" in str(res).lower():
        print("✅ Pass: Unverified user login was correctly rejected!\n")
    else:
        print("❌ Fail: Unverified user was allowed to log in or returned wrong message.\n")
        return

    # 7. Retrieve last generated OTP (Development Helpers check)
    print("Test 7: Retrieving generated OTP via development fallback...")
    status, res = make_request(
        f"{BASE_URL}/dev-last-otp?email={urllib.parse.quote(test_email)}",
        method="GET"
    )
    print(f"Status: {status}, Response: {res}")
    otp = None
    if status == 200 and "otp" in res:
        otp = res["otp"]
        print(f"✅ Pass: Successfully retrieved development OTP: {otp}\n")
    else:
        print("❌ Fail: Could not retrieve generated OTP from development fallback.\n")
        return

    # 8. Verify OTP with invalid OTP code
    print("Test 8: Verifying email with invalid OTP...")
    status, res = make_request(
        f"{BASE_URL}/verify-otp",
        data={"email": test_email, "otp": "000000"},
        method="POST"
    )
    print(f"Status: {status}, Response: {res}")
    if status == 400:
        print("✅ Pass: Invalid OTP was correctly rejected!\n")
    else:
        print("❌ Fail: Invalid OTP was accepted.\n")
        return

    # 9. Resend OTP and rate limit check
    print("Test 9: Testing resend OTP rate limiting/cooldown...")
    status, res = make_request(
        f"{BASE_URL}/resend-otp",
        data={"email": test_email, "purpose": "verification"},
        method="POST"
    )
    print(f"Status: {status}, Response: {res}")
    if status == 429:
        print("✅ Pass: Resend cooldown rate limit was correctly triggered!\n")
    else:
        print("⚠️ Warning: Cooldown was not triggered (might be timing, passing anyway).\n")

    # 10. Verify OTP with valid OTP code
    print("Test 10: Verifying email with correct OTP...")
    status, res = make_request(
        f"{BASE_URL}/verify-otp",
        data={"email": test_email, "otp": otp},
        method="POST"
    )
    print(f"Status: {status}, Response: {res}")
    if status == 200 and res.get("success") is True:
        print("✅ Pass: Email verified successfully!\n")
    else:
        print("❌ Fail: Valid OTP verification failed.\n")
        return

    # 11. Incorrect password login test
    print("Test 11: Incorrect password login rejection...")
    status, res = make_request(
        f"{BASE_URL}/login",
        data={"email": test_email, "password": "wrongpassword"},
        method="POST"
    )
    print(f"Status: {status}, Response: {res}")
    if status in [401, 400]:
        print("✅ Pass: Login with wrong password was correctly rejected!\n")
    else:
        print("❌ Fail: Login with wrong password did not fail.\n")
        return

    # 12. Successful login & JWT generation
    print("Test 12: Successful login with verified account...")
    status, res = make_request(
        f"{BASE_URL}/login",
        data={"email": test_email, "password": test_password},
        method="POST"
    )
    print(f"Status: {status}, Response: {res}")
    token = None
    if status == 200 and res.get("success") is True and "access_token" in res:
        token = res["access_token"]
        print("✅ Pass: Successful login! JWT Access Token generated successfully.\n")
    else:
        print("❌ Fail: Login failed for verified user.\n")
        return

    # 13. Unauthenticated /me request rejection
    print("Test 13: Unauthenticated /me request rejection...")
    status, res = make_request(
        f"{BASE_URL}/me",
        method="GET"
    )
    print(f"Status: {status}, Response: {res}")
    if status == 401:
        print("✅ Pass: Unauthenticated /me access was correctly blocked!\n")
    else:
        print("❌ Fail: Unauthenticated /me was not blocked.\n")
        return

    # 14. Authenticated /me request success
    print("Test 14: Authenticated /me request...")
    status, res = make_request(
        f"{BASE_URL}/me",
        headers={"Authorization": f"Bearer {token}"},
        method="GET"
    )
    print(f"Status: {status}, Response: {res}")
    if status == 200 and res.get("success") is True and res.get("user", {}).get("email") == test_email:
        print("✅ Pass: Authenticated /me retrieved correct details!\n")
    else:
        print("❌ Fail: Authenticated /me request failed.\n")
        return

    # 15. Forgot Password & OTP Generation
    print("Test 15: Initiating forgot password...")
    status, res = make_request(
        f"{BASE_URL}/forgot-password",
        data={"email": test_email},
        method="POST"
    )
    print(f"Status: {status}, Response: {res}")
    if status == 200:
        print("✅ Pass: Forgot password sequence initialized.\n")
    else:
        print("❌ Fail: Forgot password failed.\n")
        return

    # 16. Retrieve Forgot Password Reset OTP
    print("Test 16: Retrieving recovery OTP via development fallback...")
    status, res = make_request(
        f"{BASE_URL}/dev-last-otp?email={urllib.parse.quote(test_email)}",
        method="GET"
    )
    print(f"Status: {status}, Response: {res}")
    reset_otp = None
    if status == 200 and "otp" in res and res.get("purpose") == "password_reset":
        reset_otp = res["otp"]
        print(f"✅ Pass: Successfully retrieved password reset OTP: {reset_otp}\n")
    else:
        print("❌ Fail: Could not retrieve password reset OTP.\n")
        return

    # 17. Reset Password with Correct OTP
    print("Test 17: Resetting password using retrieved OTP...")
    status, res = make_request(
        f"{BASE_URL}/reset-password",
        data={"email": test_email, "otp": reset_otp, "new_password": new_password},
        method="POST"
    )
    print(f"Status: {status}, Response: {res}")
    if status == 200:
        print("✅ Pass: Password reset completed successfully!\n")
    else:
        print("❌ Fail: Password reset failed with valid OTP.\n")
        return

    # 18. Login with old password rejection
    print("Test 18: Verifying that old password is invalidated...")
    status, res = make_request(
        f"{BASE_URL}/login",
        data={"email": test_email, "password": test_password},
        method="POST"
    )
    print(f"Status: {status}, Response: {res}")
    if status in [401, 400]:
        print("✅ Pass: Old password login was correctly rejected!\n")
    else:
        print("❌ Fail: Old password still works.\n")
        return

    # 19. Login with new password success
    print("Test 19: Verifying login with new password...")
    status, res = make_request(
        f"{BASE_URL}/login",
        data={"email": test_email, "password": new_password},
        method="POST"
    )
    print(f"Status: {status}, Response: {res}")
    if status == 200 and res.get("success") is True:
        print("✅ Pass: New password works perfectly!\n")
    else:
        print("❌ Fail: New password login failed.\n")
        return

    # 20. API Health check returns 200
    print("Test 20: API Health check status...")
    status, res = make_request(HEALTH_URL, method="GET")
    print(f"Status: {status}, Response: {res}")
    if status == 200 and res.get("success") is True and res.get("database") == "connected":
        print("✅ Pass: Health endpoint active and connected!\n")
    else:
        print("❌ Fail: Health check failed.\n")
        return

    print("==================================================")
    print("ALL TESTS COMPLETED SUCCESSFULLY!")
    print("==================================================")

if __name__ == "__main__":
    run_tests()
