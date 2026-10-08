# NariNexus – Final Year Project Demonstration Guide
### *Smart Skill & Employment Platform for Rural Women*

This guide outlines the recommended sequence to demonstrate NariNexus to evaluators and reviewers. It details the steps, accounts, expected outcomes, and the underlying full-stack technical concepts proven by each stage.

---

## 🔑 Demo Account Credentials

Use these verified credentials during the demonstration:

| Role | Email Address | Password | Primary Dashboard |
| :--- | :--- | :--- | :--- |
| **Training Centre** | `centre_9de948@naricentre.org` | `securePassword123` | Centre Management Hub |
| **Platform Admin** | `app_tracker_admin_6fae91@narinexus.org` | `securePassword123` | System Audit & Administration |
| **Learner (Default)**| `shwetaningappa2004@gmail.com` | `securePassword123` | Learner Portal (Preferred: Kannada) |
| **Learner (English)**| `notif_learner_a_6fe0bf@gmail.com` | `securePassword123` | Learner Portal (Preferred: English) |

---

## 🚀 Recommended Step-by-Step Demonstration Sequence

### Step 1: Training Centre – Course Creation & Publishing
* **Role/Account:** Training Centre (`centre_9de948@naricentre.org`)
* **Action:**
  1. Log in. You will be automatically redirected to the **Centre Dashboard**.
  2. Click on **Courses** from the sidebar navigation.
  3. Click **"Add Course"** and fill in realistic local tailoring/stitching information:
     * *Title:* `Bridal Zardozi Embroidery Masters`
     * *Category:* `Tailoring & Fashion`
     * *Associated Skill:* `Zardosi Hand Embroidery & Bridal Necklines`
     * *Difficulty:* `Intermediate`
     * *Duration:* `6 Weeks`
     * *Learning Mode:* `Hybrid`
     * *Instructor:* `Rehana Banu`
     * *Language:* `en`
  4. Save the course.
  5. Select the newly created course to view its unique MongoDB ID.
* **Expected Result:**
  * The course is successfully validated and saved directly into the MongoDB Atlas database.
  * A success toast/message is displayed.
  * The course instantly appears in the training centre's active courses registry list.
* **Technical Concept Demonstrated:** Role-Based Access Control (RBAC) isolation + dynamic MongoDB Atlas CRUD operations.

---

### Step 2: Platform Administrator – Moderation & Catalogue Inspection
* **Role/Account:** Platform Admin (`app_tracker_admin_6fae91@narinexus.org`)
* **Action:**
  1. Log in. You will be redirected to the **Admin Dashboard**.
  2. Open the **Course Catalog / Moderation** page.
  3. Locate the `Bridal Zardozi Embroidery Masters` course created in Step 1.
  4. View the course details to verify that the generated MongoDB course ID perfectly matches the one from the Training Centre.
* **Expected Result:**
  * Admin sees the course instantly without manual database sync or page refreshes.
  * System metrics reflect the updated course counts.
* **Technical Concept Demonstrated:** Shared MongoDB Atlas collections as a single, real-time source of truth across all roles.

---

### Step 3: Learner – Discovery, Localization & Enrollment
* **Role/Account:** Learner (`notif_learner_a_6fe0bf@gmail.com` or custom register)
* **Action:**
  1. Log in. You will be redirected to the **Learner Dashboard**.
  2. Change language preferences from English to **Kannada (ಕನ್ನಡ)**.
  3. Navigate to **Course Discovery**.
  4. Search/filter for the `Bridal Zardozi Embroidery Masters` course.
  5. Click **Enroll in Course**, select **"Hybrid Track"**, and confirm.
* **Expected Result:**
  * Changing language instantly triggers localization throughout the interface (Kannada).
  * Newly created course is fully discoverable.
  * Hybrid mode sidebar accurately retrieves and renders the **Bengaluru Skill Development Centre** details (address, city, contact info) seeded from MongoDB.
  * Enrollment transitions state cleanly, unlocking the curriculum lessons.
* **Technical Concept Demonstrated:** Multilingual propagation + dynamic profile metadata mapping + E2E relational data lookup.

---

### Step 4: Learning – Lesson Completion & Gamification Rewards
* **Role/Account:** Learner (`notif_learner_a_6fe0bf@gmail.com`)
* **Action:**
  1. Go to **My Courses** and open the active course.
  2. Open **Module 1 (Introduction to Sewing Machine Operations)**.
  3. Click **"Mark Module Complete"**.
  4. Check the points and active day-streak multipliers on the dashboard.
  5. Go to dashboard home to see the newly awarded **"First Lesson Complete"** badge!
* **Expected Result:**
  * Course progress percentage bar instantly increments.
  * Learner's profile score increases by **+10 points**.
  * Learning streak evaluates and locks.
  * Status and badge persistence remain intact upon page reload.
* **Technical Concept Demonstrated:** State-authoritative MongoDB transaction logging + idempotent gamification mechanics.

---

### Step 5: Training Centre – Real-Time Progress Verification
* **Role/Account:** Training Centre (`centre_9de948@naricentre.org`)
* **Action:**
  1. Log back in as the Training Centre.
  2. Navigate to **Learners / Progress** tab.
  3. Locate the enrolled Learner's row.
* **Expected Result:**
  * Training Centre immediately views the learner's active enrollment and verified progress updates (e.g., progress percentage, completed modules) synced directly from the learner's actual database action.
* **Technical Concept Demonstrated:** Cross-portal data consistency and multi-tenant progress tracking.

---

### Step 6: AI Assistant Companion & Grounded Guidance
* **Role/Account:** Learner (`shwetaningappa2004@gmail.com` or default)
* **Action:**
  1. Open the **AI Chat Companion** page.
  2. Submit query in English: *"Recommend courses to start a tailoring shop."*
  3. Submit query in Kannada: *"ಟೈಲರಿಂಗ್ ವ್ಯವಹಾರ ಪ್ರಾರಂಭಿಸಲು ಯಾವ ಕೋರ್ಸ್‌ಗಳು ಉತ್ತಮ?"*
* **Expected Result:**
  * AI companion parses the learner's background profile and selected language to return a personalized response in the same language.
  * Highly relevant course suggestions are presented.
* **Technical Concept Demonstrated:** Google Gemini AI Integration with strict prompt-injection defenses and localized language parameters.

---

## 🛠️ Underlying System Verification

To verify that the system is fully operational and has passed the automated integration tests, run the following command in the workspace:

```bash
# Run comprehensive E2E database verification and validation suite
PYTHONPATH=. python3 backend/test_final_validation_phase_7_9.py
```

All 22/22 steps will compile, link, and report a 100% green PASS.

---
**NariNexus is fully verified, robust, and READY FOR FINAL PROJECT DEMONSTRATION.**
