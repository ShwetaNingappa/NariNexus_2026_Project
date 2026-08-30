# NariNexus — Women Empowerment Platform

**AI-Enabled Multilingual Hybrid Skill Development & Women Empowerment Platform**

---

## 1. PROJECT VISION

NariNexus is a social-impact digital platform built to empower women and girls in acquiring practical and digital competencies, bypassing literacy and digital navigation barriers, and directly bridging acquired skill sets with neighborhood income and employment circles.

---

## 2. THE PROBLEM Statement

1. **Language & Literacy Barriers:** High-quality vocational learning materials are typically written in English or standard formal dialects, creating entry barriers for candidate circles with low digital literacy.
2. **Offline Skill Gaps:** Craftsmanship, textile work, food processing, and electrical tasks cannot be learned on-device. Prior systems lacked robust listings of physical, neighborhood lab spaces.
3. **Lack of Local Market Links:** Traditional institutions certify learners but fail to connect candidate lists with local businesses, boutiques, or micro-retail hubs.

---

## 3. THE PROPOSED SOLUTION

NariNexus solves these structural constraints by introducing a **hybrid learning model** combining:
- **Multilingual Delivery:** Support for 15+ regional native languages.
- **Physical Coaching Batches:** Interactive class slots at neighborhood coaching hubs.
- **Direct Market Linking:** Direct pipelines matching credentials with local employers.
- **Gamified Motivators:** Multipliers, badges, and learning streaks.

---

## 4. CORE PLATFORM ROLES

1. **Learner:** Learns digital and practical skills in native regional dialects, attends physical lab centers, keeps daily streaks, and matches with local earnings circles.
2. **Coaching Centre:** Verified NGO or training center. Creates classes, registers active batches, grades attendance, and posts practical competency reviews.
3. **Administrator:** Supervises center verification files, moderates platform activity, modifies points structures, and tracks system analytics.

---

## 5. TECHNICAL STACK

- **Frontend:** React.js, Vite, Tailwind CSS v4, Lucide Icons, Axios, React Router.
- **Backend:** Python, FastAPI, Uvicorn, Pydantic, PyMongo Driver.
- **Database:** MongoDB Atlas.
- **Future AI Layer:** Google Gemini API (Multilingual translation, career helper, doubt resolver).

---

## 6. CURRENT PHASE: Phase 1 — Foundation & Project Setup

In Phase 1, the structural foundation is fully implemented:
- Clean modular frontend pages (Landing page, About, Login, Register, Learner, Centre, and Admin dashboards).
- Modular FastAPI routing backbone (`/api/health`, `/api/auth`, `/api/users`, etc.).
- Robust MongoDB Atlas client integration with connection timeout fallback.
- Client-side relative Axios service pooling and proxy settings to connect React → FastAPI → MongoDB Atlas.

---

## 7. LOCAL SETUP & RUNNING INSTRUCTIONS

### Prerequisites
- Node.js (v18+)
- Python (v3.10+)

### Step 1: Install Backend Dependencies
```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### Step 2: Configure Environment Variables
Create a `.env` file in the `backend/` directory based on `backend/.env.example`:
```env
APP_NAME=NariNexus
ENVIRONMENT=development
PORT=8000
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
DATABASE_NAME=narinexus
```

### Step 3: Run the Application (React + FastAPI)
From the project root:
- Run the dev server:
```bash
npm run dev
```
This runs the Vite server on port `3000` (externally accessible proxy) and launches the FastAPI server on port `8000` internally.

---

## 8. ACADEMIC EVALUATION & VIVA GUIDE

This project separates responsibilities cleanly:
- `backend/app/main.py`: Application entrypoint, CORS configuration, and exception handlers.
- `backend/app/core/database.py`: Handles MongoClient initialization, ping commands, and connection errors.
- `backend/app/api/router.py`: Aggregates and prefixes routers under `/api`.
- `frontend/src/App.tsx`: Controls HashRouter mappings for sandboxed frame environments.
