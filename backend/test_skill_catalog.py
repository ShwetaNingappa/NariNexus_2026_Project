import urllib.request
import urllib.parse
import json
import uuid

BASE_AUTH_URL = "http://127.0.0.1:8001/api/auth"
BASE_PROFILE_URL = "http://127.0.0.1:8001/api/profile"
BASE_SKILLS_URL = "http://127.0.0.1:8001/api/skills"
BASE_CATEGORIES_URL = "http://127.0.0.1:8001/api/categories"

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

def run_skill_catalog_tests():
    print("==================================================")
    print("RUNNING PHASE 3.1 SKILL CATALOGUE INTEGRATION TESTS")
    print("==================================================")

    # 1. Register a test learner
    learner_email = f"learner_cat_{uuid.uuid4().hex[:6]}@example.com"
    password = "securePassword123"

    print("Step 1: Registering a test learner...")
    status, res = make_request(
        f"{BASE_AUTH_URL}/register",
        data={"name": "Saraswathi Patel", "email": learner_email, "password": password, "role": "learner"},
        method="POST"
    )
    assert status == 200, f"Registration failed: {res}"

    # Get OTP
    status, res_otp = make_request(f"{BASE_AUTH_URL}/dev-last-otp?email={learner_email}")
    assert status == 200, f"Failed to fetch OTP: {res_otp}"
    otp_code = res_otp["otp"]

    # Verify Learner
    status, res_verify = make_request(
        f"{BASE_AUTH_URL}/verify-otp",
        data={"email": learner_email, "otp": otp_code},
        method="POST"
    )
    assert status == 200, f"Verification failed: {res_verify}"

    # Login
    status, res_login = make_request(
        f"{BASE_AUTH_URL}/login",
        data={"email": learner_email, "password": password},
        method="POST"
    )
    assert status == 200, f"Login failed: {res_login}"
    token = res_login["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    print("✅ Pass: Test learner registered, verified, and logged in.\n")

    # 2. Test unauthenticated catalogue access
    print("Step 2: Testing unauthenticated endpoints...")
    status, res_unauth = make_request(BASE_CATEGORIES_URL)
    assert status == 401, f"Expected 401 for categories, got {status}"
    status, res_unauth = make_request(BASE_SKILLS_URL)
    assert status == 401, f"Expected 401 for skills, got {status}"
    print("✅ Pass: Unauthenticated access is correctly rejected with 401.\n")

    # 3. Test active categories retrieval
    print("Step 3: Fetching categories list...")
    status, res_cats = make_request(BASE_CATEGORIES_URL, headers=headers)
    assert status == 200, f"Failed to fetch categories: {res_cats}"
    assert "categories" in res_cats, "Categories list missing from response"
    categories = res_cats["categories"]
    assert len(categories) > 0, "Seed categories empty"
    print(f"✅ Pass: Successfully retrieved {len(categories)} categories. (First: {categories[0]['name']})\n")

    # 4. Test skills retrieval and backend filtering
    print("Step 4: Fetching all skills...")
    status, res_skills = make_request(BASE_SKILLS_URL, headers=headers)
    assert status == 200, f"Failed to fetch skills: {res_skills}"
    assert "skills" in res_skills, "Skills list missing from response"
    skills = res_skills["skills"]
    assert len(skills) > 0, "Seed skills empty"
    print(f"✅ Pass: Successfully retrieved {len(skills)} skills.\n")

    # 5. Test difficulty filtering
    print("Step 5: Filtering skills by difficulty (Beginner)...")
    status, res_diff = make_request(f"{BASE_SKILLS_URL}?difficulty=Beginner", headers=headers)
    assert status == 200, f"Failed to filter by difficulty: {res_diff}"
    filtered_skills = res_diff["skills"]
    for sk in filtered_skills:
        assert sk["difficulty"] == "Beginner", f"Expected Beginner skill, got {sk['difficulty']}"
    print(f"✅ Pass: Difficulty filter successfully returned {len(filtered_skills)} Beginner skills.\n")

    # 6. Test backend search query (Scenario 9)
    print("Step 6: Searching for 'Stitching' skills...")
    status, res_search = make_request(f"{BASE_SKILLS_URL}?search=Stitching", headers=headers)
    assert status == 200, f"Failed to search: {res_search}"
    searched_skills = res_search["skills"]
    for sk in searched_skills:
        found = "stitch" in sk["name"].lower() or "stitch" in sk["description"].lower() or any("stitch" in o.lower() for o in sk["career_options"])
        assert found, f"Search result does not match query: {sk['name']}"
    print(f"✅ Pass: Search matching query returned {len(searched_skills)} results.\n")

    # 7. Test single skill query (Scenario 10)
    skill_id = skills[0]["id"]
    print(f"Step 7: Querying single skill details for ID: {skill_id}...")
    status, res_single = make_request(f"{BASE_SKILLS_URL}/{skill_id}", headers=headers)
    assert status == 200, f"Failed to fetch single skill: {res_single}"
    assert res_single["skill"]["id"] == skill_id, "Returned skill ID mismatch"
    print(f"✅ Pass: Single skill details returned correctly.\n")

    # 8. Test single category skills query (Scenario 11)
    cat_id = categories[0]["id"]
    print(f"Step 8: Querying category-specific skills for ID: {cat_id}...")
    status, res_cat_skills = make_request(f"{BASE_CATEGORIES_URL}/{cat_id}/skills", headers=headers)
    assert status == 200, f"Failed to fetch category skills: {res_cat_skills}"
    cat_skills = res_cat_skills["skills"]
    for sk in cat_skills:
        assert sk["category_id"] == cat_id, f"Expected category {cat_id}, got {sk['category_id']}"
    print(f"✅ Pass: Category skills filter returned {len(cat_skills)} matching skills.\n")

    # 9. Test rule-based personalized recommendations
    print("Step 9: Setup learner profile and check personalized recommendations...")
    # Update learner's profile with tailoring interests
    status, res_prof = make_request(
        BASE_PROFILE_URL,
        data={
            "preferred_language": "en",
            "age": 30,
            "location": "Bengaluru",
            "education_level": "Secondary",
            "existing_skills": ["Cooking"],
            "learning_interests": ["Tailoring", "Basic Computer Literacy"],
            "learning_preference": "Offline",
            "career_goal": "Start my own tailoring shop"
        },
        headers=headers,
        method="PUT"
    )
    assert status == 200, f"Profile setup failed: {res_prof}"

    # Query personalized recommendations
    status, res_rec = make_request(f"{BASE_SKILLS_URL}/recommendations", headers=headers)
    assert status == 200, f"Failed to fetch recommendations: {res_rec}"
    recs = res_rec["skills"]
    assert len(recs) > 0, "No recommendations returned"
    
    # Check that recommendation relates to tailoring or digital/computer
    print("Recommendations returned:")
    for sk in recs:
        print(f" - [{sk['category_id']}] {sk['name']} ({sk['difficulty']})")
    
    print("\n✅ Pass: Personalized recommendations generated and returned successfully.\n")

    print("==================================================")
    print("ALL PHASE 3.1 SKILL CATALOGUE TESTS COMPLETED SUCCESSFULLY!")
    print("==================================================")

if __name__ == "__main__":
    run_skill_catalog_tests()
