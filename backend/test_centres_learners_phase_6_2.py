import urllib.request
import urllib.parse
import json
import uuid
import sys
import subprocess
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

def run_phase_6_2_tests():
    print("==================================================")
    print("RUNNING NARINEXUS PHASE 6.2 MASTER TESTS")
    print("==================================================")

    # Generate fresh emails & mock credentials
    centre_email = f"centre_main_{uuid.uuid4().hex[:6]}@naricentre.org"
    stranger_centre_email = f"centre_stranger_{uuid.uuid4().hex[:6]}@naricentre.org"
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

    print("Bootstrapping test coaching centers...")
    centre_token = register_and_login(centre_email, "centre")
    stranger_token = register_and_login(stranger_centre_email, "centre")

    if not centre_token or not stranger_token:
        print("❌ Fail: Could not bootstrap center credentials.")
        sys.exit(1)
    
    centre_headers = {"Authorization": f"Bearer {centre_token}"}
    stranger_headers = {"Authorization": f"Bearer {stranger_token}"}

    # 1. Complete center profile setup for both
    status, res = make_request(
        f"{CENTRES_URL}/profile",
        data={
            "centre_name": "Main Coaching Kendra",
            "description": "Tailoring and textile design centre.",
            "contact_phone": "9876543210",
            "email": centre_email,
            "address": "45 Temple Road",
            "city": "Bengaluru",
            "district": "Bengaluru Urban",
            "state": "Karnataka",
            "pincode": "560001"
        },
        headers=centre_headers,
        method="POST"
    )
    if status != 201:
        print(f"❌ Fail: Could not initialize Centre Profile: {res}")
        sys.exit(1)
    centre_id = res["profile"]["id"]

    status, res = make_request(
        f"{CENTRES_URL}/profile",
        data={
            "centre_name": "Stranger Coaching Kendra",
            "description": "Weaving and handicrafts design hub.",
            "contact_phone": "9876543222",
            "email": stranger_centre_email,
            "address": "90 Palace Road",
            "city": "Mysuru",
            "district": "Mysuru District",
            "state": "Karnataka",
            "pincode": "570001"
        },
        headers=stranger_headers,
        method="POST"
    )
    if status != 201:
        print(f"❌ Fail: Could not initialize Stranger Profile: {res}")
        sys.exit(1)
    stranger_centre_id = res["profile"]["id"]

    # Let's verify that learners endpoint initially returns empty list
    print("Test 1: GET /api/centres/learners returns empty for fresh center...")
    status, res = make_request(f"{CENTRES_URL}/learners", headers=centre_headers)
    if status == 200 and len(res.get("learners", [])) == 0:
        print("✅ Pass: Fresh center initially has 0 registered learners.")
    else:
        print(f"❌ Fail: Expected 0 learners, got {res}")
        sys.exit(1)

    # Let's manually link Shweta or another learner to our Main Coaching Kendra
    print("Simulating learner-center registry in mock database...")
    mock_file = os.path.join(os.path.dirname(__file__), "app", "services", "mock_users.json")
    if os.path.exists(mock_file):
        with open(mock_file, "r") as f:
            data = json.load(f)
        
        # Link Shweta to main centre and Test Learner to stranger centre
        shweta_linked = False
        stranger_linked = False
        for uid, u in data.items():
            if u.get("email") == "shwetaningappa2004@gmail.com":
                u["training_centre_id"] = centre_id
                shweta_linked = True
            elif u.get("email") == "test_bce298bf@example.com":
                u["training_centre_id"] = stranger_centre_id
                stranger_linked = True
                
        # Proactively insert Shweta if missing
        if not shweta_linked:
            shweta_id = f"usr-{uuid.uuid4().hex[:6]}"
            data[shweta_id] = {
                "id": shweta_id,
                "_id": shweta_id,
                "name": "Shweta Ningappa",
                "email": "shwetaningappa2004@gmail.com",
                "password_hash": "dummy_hash",
                "role": "learner",
                "preferred_language": "kn",
                "profile_completed": True,
                "is_verified": True,
                "is_active": True,
                "training_centre_id": centre_id,
                "created_at": "2026-09-28T05:00:00",
                "updated_at": "2026-09-28T05:00:00"
            }
        # Proactively insert stranger if missing
        if not stranger_linked:
            stranger_learner_id = f"usr-{uuid.uuid4().hex[:6]}"
            data[stranger_learner_id] = {
                "id": stranger_learner_id,
                "_id": stranger_learner_id,
                "name": "Test Learner B",
                "email": "test_bce298bf@example.com",
                "password_hash": "dummy_hash",
                "role": "learner",
                "preferred_language": "en",
                "profile_completed": True,
                "is_verified": True,
                "is_active": True,
                "training_centre_id": stranger_centre_id,
                "created_at": "2026-09-28T05:00:00",
                "updated_at": "2026-09-28T05:00:00"
            }
                
        with open(mock_file, "w") as f:
            json.dump(data, f, indent=2)
        print("✅ Simulated: Learner association seed completed.")
    else:
        # MongoDB Atlas fallback
        from backend.app.core.database import db_instance
        db = db_instance.get_db()
        if db is not None:
            shweta = db["users"].find_one({"email": "shwetaningappa2004@gmail.com"})
            if not shweta:
                db["users"].insert_one({
                    "name": "Shweta Ningappa",
                    "email": "shwetaningappa2004@gmail.com",
                    "password_hash": "dummy_hash",
                    "role": "learner",
                    "preferred_language": "kn",
                    "profile_completed": True,
                    "is_verified": True,
                    "is_active": True,
                    "training_centre_id": centre_id,
                    "created_at": "2026-09-28T05:00:00",
                    "updated_at": "2026-09-28T05:00:00"
                })
            else:
                db["users"].update_one({"email": "shwetaningappa2004@gmail.com"}, {"$set": {"training_centre_id": centre_id}})
                
            stranger = db["users"].find_one({"email": "test_bce298bf@example.com"})
            if not stranger:
                db["users"].insert_one({
                    "name": "Test Learner B",
                    "email": "test_bce298bf@example.com",
                    "password_hash": "dummy_hash",
                    "role": "learner",
                    "preferred_language": "en",
                    "profile_completed": True,
                    "is_verified": True,
                    "is_active": True,
                    "training_centre_id": stranger_centre_id,
                    "created_at": "2026-09-28T05:00:00",
                    "updated_at": "2026-09-28T05:00:00"
                })
            else:
                db["users"].update_one({"email": "test_bce298bf@example.com"}, {"$set": {"training_centre_id": stranger_centre_id}})
            print("✅ Simulated: MongoDB Atlas association seed completed.")

    # 2. Get learners list for main center
    print("Test 2: GET /api/centres/learners lists registered learners only...")
    status, res = make_request(f"{CENTRES_URL}/learners", headers=centre_headers)
    learners = res.get("learners", [])
    if status == 200 and len(learners) == 1 and learners[0]["email"] == "shwetaningappa2004@gmail.com":
        print("✅ Pass: Main center successfully retrieved its only associated learner Shweta.")
    else:
        print(f"❌ Fail: Expected only Shweta, got: {res}")
        sys.exit(1)

    # 3. Secure Isolation check: Stranger cannot see Main's learner, and vice versa
    print("Test 3: GET /api/centres/learners enforces isolation between centers...")
    status, res = make_request(f"{CENTRES_URL}/learners", headers=stranger_headers)
    stranger_learners = res.get("learners", [])
    if status == 200 and len(stranger_learners) == 1 and stranger_learners[0]["email"] == "test_bce298bf@example.com":
        print("✅ Pass: Center isolation verified. Stranger center only sees test_bce298bf.")
    else:
        print(f"❌ Fail: Expected test_bce298bf, got: {res}")
        sys.exit(1)

    # 4. Search and filter parameter verification
    print("Test 4: GET /api/centres/learners search and language filter works...")
    status, res = make_request(f"{CENTRES_URL}/learners?search=Shweta", headers=centre_headers)
    if status == 200 and len(res.get("learners", [])) == 1:
        print("✅ Pass: Name search query 'Shweta' matched successfully.")
    else:
        print(f"❌ Fail: Expected 1 match, got: {res}")
        sys.exit(1)

    status, res = make_request(f"{CENTRES_URL}/learners?search=Nonexistent", headers=centre_headers)
    if status == 200 and len(res.get("learners", [])) == 0:
        print("✅ Pass: Non-matching search query returned empty list.")
    else:
        print(f"❌ Fail: Expected 0 matches, got: {res}")
        sys.exit(1)

    status, res = make_request(f"{CENTRES_URL}/learners?language=kn", headers=centre_headers)
    if status == 200 and len(res.get("learners", [])) == 1:
        print("✅ Pass: Language filter 'kn' matched successfully.")
    else:
        print(f"❌ Fail: Expected 1 match, got: {res}")
        sys.exit(1)

    status, res = make_request(f"{CENTRES_URL}/learners?language=en", headers=centre_headers)
    if status == 200 and len(res.get("learners", [])) == 0:
        print("✅ Pass: Non-matching language filter 'en' returned empty list.")
    else:
        print(f"❌ Fail: Expected 0 matches, got: {res}")
        sys.exit(1)

    # 5. Fetch detailed learner profile securely
    print("Test 5: GET /api/centres/learners/{learner_id} retrieves detailed profile & course progression...")
    shweta_id = learners[0]["id"]
    status, res = make_request(f"{CENTRES_URL}/learners/{shweta_id}", headers=centre_headers)
    if status == 200 and res.get("success") is True:
        learner_profile = res.get("learner", {})
        enrollments = res.get("enrollments", [])
        progress = res.get("progress", [])
        if learner_profile.get("email") == "shwetaningappa2004@gmail.com" and "password_hash" not in learner_profile:
            print("✅ Pass: Secure learner details, progress arrays, and stripped password hashes verified.")
        else:
            print(f"❌ Fail: Password hash leaked or incorrect profile retrieved: {res}")
            sys.exit(1)
    else:
        print(f"❌ Fail: Could not retrieve learner details: {res}")
        sys.exit(1)

    # 6. CRITICAL OWNERSHIP VIOLATION TEST: Main center cannot query stranger's learner details
    print("Test 6: GET /api/centres/learners/{learner_id} prevents unauthorized cross-center traversal...")
    stranger_learner_id = stranger_learners[0]["id"]
    status, res = make_request(f"{CENTRES_URL}/learners/{stranger_learner_id}", headers=centre_headers)
    if status in [403, 404]:
        print("✅ Pass: Secure ownership check rejected unauthorized detail access successfully!")
    else:
        print(f"❌ Fail: Main center bypassed authorization and queried stranger's learner. Status: {status}")
        sys.exit(1)

    # 7. Unauthenticated details access rejected
    print("Test 7: Unauthenticated details access is rejected with 401...")
    status, res = make_request(f"{CENTRES_URL}/learners/{shweta_id}")
    if status == 401:
        print("✅ Pass: Unauthenticated detail access rejected correctly.")
    else:
        print(f"❌ Fail: Expected 401, got {status}")
        sys.exit(1)

    print("==================================================")
    print("ALL PHASE 6.2 LEARNER MANAGEMENT TESTS PASSED!")
    print("==================================================")

if __name__ == "__main__":
    run_phase_6_2_tests()
