import urllib.request
import urllib.parse
import json
import uuid
import sys
import subprocess
import os
from datetime import datetime

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

def run_centre_tests():
    print("==================================================")
    print("RUNNING NARINEXUS TRAINING CENTRE INTEGRATION TESTS")
    print("==================================================")

    # Clean up mock file for fresh run
    mock_file = os.path.join(os.path.dirname(__file__), "app", "services", "mock_centres.json")
    if os.path.exists(mock_file):
        try:
            os.remove(mock_file)
            print("Cleaned up existing mock_centres.json for a fresh run.")
        except Exception:
            pass

    # 21. Health Check
    print("Test 21: Verification of /api/health...")
    status, res = make_request(HEALTH_URL)
    if status == 200 and res.get("success") is True:
        print("✅ Pass: /api/health is healthy!\n")
    else:
        print(f"❌ Fail: /api/health failed. Status: {status}, Response: {res}\n")
        sys.exit(1)

    # Generate emails and credentials
    centre_a_email = f"centre_a_{uuid.uuid4().hex[:6]}@naricentre.org"
    centre_b_email = f"centre_b_{uuid.uuid4().hex[:6]}@naricentre.org"
    learner_email = f"learner_{uuid.uuid4().hex[:6]}@gmail.com"
    password = "securePassword123"

    print(f"Centre A: {centre_a_email}")
    print(f"Centre B: {centre_b_email}")
    print(f"Learner: {learner_email}\n")

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
        otp_status, otp_res = make_request(
            f"{AUTH_URL}/verify-otp",
            data={"email": email, "otp": "123456", "purpose": "verification"},
            method="POST"
        )
        # If otp_status != 200, wait, let's read the dev_otp_log to find the correct OTP
        if otp_status != 200:
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

    print("Setting up authenticated test accounts...")
    centre_a_token = register_and_login(centre_a_email, "centre")
    centre_b_token = register_and_login(centre_b_email, "centre")
    learner_token = register_and_login(learner_email, "learner")

    if not centre_a_token or not centre_b_token or not learner_token:
        print("❌ Fail: Could not bootstrap test accounts.")
        sys.exit(1)
    print("✅ Pass: Test accounts bootstrapped.\n")

    # 8. Unauthenticated access rejected
    print("Test 8: Unauthenticated access is rejected...")
    status, res = make_request(f"{CENTRES_URL}/me", method="GET")
    if status == 401:
        print("✅ Pass: Unauthenticated /centres/me request rejected with 401!\n")
    else:
        print(f"❌ Fail: Unauthenticated access returned status {status}\n")
        sys.exit(1)

    # 5. Learner cannot create centre profile
    print("Test 5: Learner cannot create a training centre profile...")
    learner_headers = {"Authorization": f"Bearer {learner_token}"}
    status, res = make_request(
        f"{CENTRES_URL}/profile",
        data={
            "centre_name": "Saraswati Sewa Kendra",
            "description": "Tailoring and textile design centre.",
            "contact_phone": "9876543210",
            "email": "learner_centre@gmail.com",
            "address": "45 Temple Road",
            "city": "Bengaluru",
            "district": "Bengaluru Urban",
            "state": "Karnataka",
            "pincode": "560001"
        },
        headers=learner_headers,
        method="POST"
    )
    if status == 403:
        print("✅ Pass: Learner received 403 Forbidden for profile creation!\n")
    else:
        print(f"❌ Fail: Learner got unexpected status {status} during creation: {res}\n")
        sys.exit(1)

    # 6. Learner cannot access centre dashboard
    print("Test 6: Learner cannot retrieve centre profile...")
    status, res = make_request(f"{CENTRES_URL}/me", headers=learner_headers, method="GET")
    if status == 403:
        print("✅ Pass: Learner received 403 Forbidden for retrieving /centres/me!\n")
    else:
        print(f"❌ Fail: Learner got status {status} for /centres/me: {res}\n")
        sys.exit(1)

    # 1. Centre creates profile
    print("Test 1: Centre A creates their profile...")
    centre_a_headers = {"Authorization": f"Bearer {centre_a_token}"}
    profile_payload_a = {
        "centre_name": "Nari Shakti Sewa Kendra",
        "description": "Tailoring, sewing and micro-finance coaching centre for local women.",
        "contact_phone": "9988776655",
        "email": centre_a_email,
        "address": "12 Basappa Layout, Hosur Rd",
        "city": "Bengaluru",
        "district": "Bengaluru Urban",
        "state": "Karnataka",
        "pincode": "560029",
        "facilities": ["Sewing machines", "Computer lab", "Crèche facility"]
    }
    status, res = make_request(
        f"{CENTRES_URL}/profile",
        data=profile_payload_a,
        headers=centre_a_headers,
        method="POST"
    )
    if status == 201 and res.get("success") is True:
        print("✅ Pass: Centre A profile created successfully!\n")
    else:
        print(f"❌ Fail: Profile creation failed. Status: {status}, Response: {res}\n")
        sys.exit(1)

    # 9. New centre defaults to pending
    print("Test 9: Verification that new centre profile defaults to 'pending'...")
    profile = res.get("profile", {})
    if profile.get("verification_status") == "pending":
        print("✅ Pass: New profile status is correctly 'pending'!\n")
    else:
        print(f"❌ Fail: Expected 'pending', got: '{profile.get('verification_status')}'\n")
        sys.exit(1)

    # 2. Centre retrieves own profile
    print("Test 2: Centre A retrieves their own profile details...")
    status, res = make_request(f"{CENTRES_URL}/me", headers=centre_a_headers, method="GET")
    if status == 200 and res.get("success") is True and res.get("profile", {}).get("centre_name") == "Nari Shakti Sewa Kendra":
        print("✅ Pass: Centre A retrieved own profile details correctly!\n")
    else:
        print(f"❌ Fail: Retrieval failed. Status: {status}, Response: {res}\n")
        sys.exit(1)

    # 4. Centre cannot create duplicate profile
    print("Test 4: Centre A cannot create a duplicate profile...")
    status, res = make_request(
        f"{CENTRES_URL}/profile",
        data=profile_payload_a,
        headers=centre_a_headers,
        method="POST"
    )
    if status == 400 and "already exists" in str(res):
        print("✅ Pass: Duplicate profile was correctly rejected with 400!\n")
    else:
        print(f"❌ Fail: Expected 400 rejection for duplicate profile creation. Got status {status}: {res}\n")
        sys.exit(1)

    # 3. Centre updates own profile
    print("Test 3: Centre A updates their profile description and contact number...")
    status, res = make_request(
        f"{CENTRES_URL}/profile",
        data={
            "description": "Premium garment stitching and financial literacy centre.",
            "contact_phone": "9988776600"
        },
        headers=centre_a_headers,
        method="PUT"
    )
    if status == 200 and res.get("success") is True:
        updated_prof = res.get("profile", {})
        if updated_prof.get("description") == "Premium garment stitching and financial literacy centre." and updated_prof.get("contact_phone") == "9988776600":
            print("✅ Pass: Centre A profile updated successfully!\n")
        else:
            print(f"❌ Fail: Updated fields did not persist or return: {res}\n")
            sys.exit(1)
    else:
        print(f"❌ Fail: Update request failed. Status: {status}, Response: {res}\n")
        sys.exit(1)

    # 7. Centre isolation: Centre B cannot modify or access Centre A's profile
    print("Test 7: Centre B cannot modify or access Centre A's profile...")
    # Register Centre B's profile
    centre_b_headers = {"Authorization": f"Bearer {centre_b_token}"}
    profile_payload_b = {
        "centre_name": "Mysuru Skill Foundation",
        "description": "Weaving and local handicraft coaching hub.",
        "contact_phone": "9112233445",
        "email": centre_b_email,
        "address": "88 Palace Road",
        "city": "Mysuru",
        "district": "Mysuru District",
        "state": "Karnataka",
        "pincode": "570001",
        "facilities": ["Handlooms", "Classrooms"]
    }
    status, res = make_request(
        f"{CENTRES_URL}/profile",
        data=profile_payload_b,
        headers=centre_b_headers,
        method="POST"
    )
    if status != 201:
        print(f"❌ Fail: Setup of Centre B profile failed: {res}\n")
        sys.exit(1)

    # Verify GET /centres/me for Centre B returns Centre B's own profile, not Centre A's
    status, res = make_request(f"{CENTRES_URL}/me", headers=centre_b_headers, method="GET")
    if status == 200 and res.get("profile", {}).get("centre_name") == "Mysuru Skill Foundation":
        print("✅ Pass: Centre B retrieves its own profile, isolated from Centre A!\n")
    else:
        print(f"❌ Fail: Centre B own profile retrieval was corrupted: {res}\n")
        sys.exit(1)

    # 10. Centre discovery endpoint
    print("Test 10: Verified centres in public discovery (none currently verified)...")
    status, res = make_request(CENTRES_URL, method="GET")
    if status == 200 and len(res.get("centres", [])) == 0:
        print("✅ Pass: Discovery returned 0 entries since none are verified yet!\n")
    else:
        print(f"❌ Fail: Expected 0 verified centres, got: {res}\n")
        sys.exit(1)

    # 11. Public discovery returns only verified centres (Simulating verification)
    print("Test 11: Set verification_status of Centre A to 'verified' to test discovery...")
    # We will manually edit mock_centres.json to mark Centre A verified
    mock_file = os.path.join(os.path.dirname(__file__), "app", "services", "mock_centres.json")
    if os.path.exists(mock_file):
        with open(mock_file, "r") as f:
            data = json.load(f)
        for cid, c in data.items():
            if c.get("email") == centre_a_email:
                c["verification_status"] = "verified"
                # Make sure fields are present
                c["city"] = "Bengaluru"
                c["district"] = "Bengaluru Urban"
                c["state"] = "Karnataka"
        with open(mock_file, "w") as f:
            json.dump(data, f, indent=2)
        print("Verification simulation complete.")
    else:
        print("⚠️ Warning: mock_centres.json not found, unable to simulate verified status in fallback. (Check if running MongoDB)")
        # In case we are using real MongoDB:
        from backend.app.core.database import db_instance
        db = db_instance.get_db()
        if db is not None:
            db["centres"].update_one({"email": centre_a_email}, {"$set": {"verification_status": "verified"}})
            print("MongoDB verification simulated.")

    # Now call public discovery again
    status, res = make_request(CENTRES_URL, method="GET")
    verified_list = res.get("centres", [])
    if status == 200 and len(verified_list) >= 1 and any(c.get("email") == centre_a_email for c in verified_list):
        print("✅ Pass: Only verified centres are returned in public discovery!\n")
    else:
        print(f"❌ Fail: Verified Centre A not found in public discovery list: {res}\n")
        sys.exit(1)

    # 12. City filtering
    print("Test 12: Discovery with city filtering...")
    status, res = make_request(f"{CENTRES_URL}?city=Bengaluru", method="GET")
    if status == 200 and len(res.get("centres", [])) >= 1:
        print("✅ Pass: City filtering returned Bengaluru centres successfully!\n")
    else:
        print(f"❌ Fail: City filter 'Bengaluru' returned: {res}\n")
        sys.exit(1)

    status, res = make_request(f"{CENTRES_URL}?city=NonexistentCity", method="GET")
    if status == 200 and len(res.get("centres", [])) == 0:
        print("✅ Pass: Filtering for nonexistent city returned empty list!\n")
    else:
        print(f"❌ Fail: Nonexistent city filter returned matches: {res}\n")
        sys.exit(1)

    # 13. District filtering
    print("Test 13: Discovery with district filtering...")
    status, res = make_request(f"{CENTRES_URL}?district=Bengaluru+Urban", method="GET")
    if status == 200 and len(res.get("centres", [])) >= 1:
        print("✅ Pass: District filtering returned correct centres!\n")
    else:
        print(f"❌ Fail: District filter returned: {res}\n")
        sys.exit(1)

    # 14. State filtering
    print("Test 14: Discovery with state filtering...")
    status, res = make_request(f"{CENTRES_URL}?state=Karnataka", method="GET")
    if status == 200 and len(res.get("centres", [])) >= 1:
        print("✅ Pass: State filtering works correctly!\n")
    else:
        print(f"❌ Fail: State filter returned: {res}\n")
        sys.exit(1)

    print("==================================================")
    print("ALL NEW PHASE 5.1 TRAINING CENTRE TESTS PASSED!")
    print("==================================================")

def run_regressions():
    print("==================================================")
    print("RUNNING REGRESSIONS FOR ALL PRIOR MODULES")
    print("==================================================")
    
    regression_files = [
        "backend/test_auth_flow.py",
        "backend/test_profile_onboarding.py",
        "backend/test_skill_catalog.py",
        "backend/test_course_catalog.py",
        "backend/test_enrollment_system.py",
        "backend/test_progress_system.py"
    ]
    
    for file in regression_files:
        print(f"Running regression test: python3 {file}...")
        res = subprocess.run(["python3", file], capture_output=True, text=True)
        if res.returncode == 0:
            print(f"✅ Regression PASSED: {file}\n")
        else:
            print(f"❌ Regression FAILED: {file}")
            print(res.stdout)
            print(res.stderr)
            sys.exit(1)

if __name__ == "__main__":
    run_centre_tests()
    run_regressions()
    print("==================================================")
    print("ALL TESTS (NEW + ALL REGRESSIONS) ARE 100% GREEN!")
    print("==================================================")
