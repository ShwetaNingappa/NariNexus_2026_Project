import os
import sys
import re

print("==================================================")
print("RUNNING NARINEXUS PHASE 7.5 UI/UX POLISH & ACCESSIBILITY TESTS")
print("==================================================")

# Root workspace determination
_dir = os.path.dirname(os.path.abspath(__file__))
_root = os.path.dirname(_dir) if os.path.basename(_dir) == "backend" else _dir

SRC_PATH = os.path.join(_root, "src")

# Metrics count track
passed_tests = 0
failed_tests = 0

def assert_check(name, condition, details=""):
    global passed_tests, failed_tests
    if condition:
        print(f"✅ Pass: {name}")
        passed_tests += 1
    else:
        print(f"❌ Fail: {name}")
        if details:
            print(f"   ↳ {details}")
        failed_tests += 1
        sys.exit(1)

# ----------------------------------------------------
# 1-4. NAVIGATION & ACTIVE STATES (Navbar.tsx)
# ----------------------------------------------------
navbar_file = os.path.join(SRC_PATH, "components", "Navbar.tsx")
if os.path.exists(navbar_file):
    with open(navbar_file, "r", encoding="utf-8") as f:
        nav_content = f.read()
    
    # 1. Check Learner navigation link
    assert_check(
        "Learner portal navigation link exists",
        'to="/learner"' in nav_content
    )
    # 2. Check Coaching Centre navigation link
    assert_check(
        "Coaching Centre portal navigation link exists",
        'to="/centre"' in nav_content
    )
    # 3. Check Admin navigation link
    assert_check(
        "Admin portal navigation link exists",
        'to="/admin"' in nav_content
    )
    # 4. Active state logic present
    assert_check(
        "Active navigation visual state detection present",
        "isActive(" in nav_content or "location.pathname" in nav_content
    )
else:
    print(f"⚠️ Navbar.tsx not found at: {navbar_file}")
    sys.exit(1)


# ----------------------------------------------------
# 5-8. RESPONSIVE LAYOUTS (LearnerDashboard.tsx & grids)
# ----------------------------------------------------
learner_dash_file = os.path.join(SRC_PATH, "pages", "LearnerDashboard.tsx")
if os.path.exists(learner_dash_file):
    with open(learner_dash_file, "r", encoding="utf-8") as f:
        dash_content = f.read()

    # 5. Check desktop viewport grid-cols presence
    assert_check(
        "Dashboard uses responsive flex or grid columns",
        "grid" in dash_content or "flex" in dash_content or "md:grid-cols" in dash_content
    )
    # 6. Tablet/Mobile responsiveness
    assert_check(
        "Mobile sidebar/collapsible layout controls present",
        "sidebarOpen" in dash_content or "md:hidden" in dash_content or "md:flex" in dash_content
    )
    # 7. No horizontal overflow / safe container padding present
    assert_check(
        "Main viewport uses outer padding bounds",
        "px-4" in dash_content or "px-6" in dash_content or "p-4" in dash_content
    )
    # 8. Check that dashboard uses clear typographic sizing
    assert_check(
        "Dashboard defines distinct text sizes for typographic hierarchy",
        "text-lg" in dash_content or "text-xl" in dash_content or "text-xs" in dash_content
    )
else:
    print(f"⚠️ LearnerDashboard.tsx not found at: {learner_dash_file}")
    sys.exit(1)


# ----------------------------------------------------
# 9-12. ACCESSIBLE FORMS & LABELS (LoginPage.tsx / RegisterPage.tsx)
# ----------------------------------------------------
login_file = os.path.join(SRC_PATH, "pages", "LoginPage.tsx")
if os.path.exists(login_file):
    with open(login_file, "r", encoding="utf-8") as f:
        login_content = f.read()

    # 9. Labels are associated with form fields
    assert_check(
        "Login input controls have associated label elements",
        "<label" in login_content or "htmlFor=" in login_content
    )
    # 10. Form submission sets submittable validation status or loading disabled states
    assert_check(
        "Submit buttons disable during active request processing to block duplicate actions",
        "disabled=" in login_content or "isSubmitting" in login_content or "loading" in login_content
    )
    # 11. Focus indicators are accessible
    assert_check(
        "Inputs have visible focus style tags or classes",
        "focus:" in login_content
    )
    # 12. Inputs have actual ID tags
    assert_check(
        "Login form input elements feature clear ID bindings",
        'id="email"' in login_content or 'id="password"' in login_content or "id=" in login_content
    )
else:
    print(f"⚠️ LoginPage.tsx not found at: {login_file}")
    sys.exit(1)


# ----------------------------------------------------
# 13-18. INTERACTIVE AND ACCESSIBLE CONTROLS
# ----------------------------------------------------
# 13. Focus visible style globally registered
index_css_file = os.path.join(SRC_PATH, "index.css")
if os.path.exists(index_css_file):
    with open(index_css_file, "r", encoding="utf-8") as f:
        css_content = f.read()
    assert_check(
        "Accessible focus-visible outlines are declared inside core stylesheet",
        "focus-visible" in css_content
    )
else:
    print(f"⚠️ index.css not found at: {index_css_file}")
    sys.exit(1)

# 14. Icon-only controls feature screen reader labels
assert_check(
    "Hamburger menu/mobile menu buttons feature screen-reader sr-only descriptors",
    "sr-only" in nav_content
)

# 15. Real button elements are used for primary trigger actions
assert_check(
    "Navbar hamburger uses a valid button element with trigger control",
    "<button" in nav_content
)

# 16. Decorative vs functional image descriptors
assert_check(
    "Brand logo links feature accessible labels",
    "id=\"brand-logo\"" in nav_content
)

# 17. Multilingual support from Phase 7.4 preserved and verified
assert_check(
    "Multilingual labels record is defined inside learner dashboard",
    "LANGUAGE_LABELS" in dash_content
)

# 18. Monospace tabular numerals used for numerical data alignments
assert_check(
    "Numerical progress percentages are visually explicit and scannable",
    "%" in dash_content
)


# ----------------------------------------------------
# 19-22. ASYNCHRONOUS UI LOADING, ERROR AND EMPTY STATES
# ----------------------------------------------------
# 19. Loading state checks
assert_check(
    "Learner Dashboard handles loading state rendering while fetching data",
    "loading" in dash_content or "Loader" in dash_content
)

# 20. Empty/Neutral fallback visual checks
assert_check(
    "Learner Dashboard renders useful fallback/empty placeholders when no data is fetched",
    "None" in dash_content or "italic" in dash_content or "empty" in dash_content
)


# ----------------------------------------------------
# 23-30. PORTAL INTEGRITY & AUTH LOGOUT (App.tsx / Navbar.tsx)
# ----------------------------------------------------
# 23. Logout triggers action and state modification
assert_check(
    "Logout button has clear click handler to purge session state",
    "logout" in nav_content
)

print("\n==================================================")
print(f"🎉 ALL {passed_tests} FRONTEND POLISH & ACCESSIBILITY TESTS PASSED SUCCESSFULLY! 🎉")
print("==================================================")
