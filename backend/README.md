# NariNexus — Backend Foundation

This is the Python FastAPI backend for **NariNexus**, an AI-enabled hybrid skill platform for women.

## 1. Directory Structure

```text
backend/
├── app/
│   ├── api/
│   │   ├── endpoints/
│   │   │   ├── health.py        # /api/health with dynamic DB ping checking
│   │   │   ├── auth.py          # /api/auth placeholder
│   │   │   └── modules.py       # Core placeholder endpoints for all 10 future modules
│   │   └── router.py            # Central router registry
│   ├── core/
│   │   ├── config.py            # Dynamic env loader and settings manager
│   │   └── database.py          # Reusable MongoDB connection module
│   ├── models/                  # Database representation structures
│   ├── schemas/
│   │   └── user.py              # Pydantic schemas for input validation
│   ├── services/                # Business logic layer
│   ├── utils/                   # General helper functions
│   └── main.py                  # Main application setup & lifespan
├── requirements.txt             # Required Python libraries
└── .env.example                 # Environment variables specification
```

## 2. API Endpoints Catalog

- **GET /api/health**: Verifies backend liveness and dynamic connection with MongoDB Atlas.
- **POST /api/auth/register**: Placeholder for credential generation (Phase 2).
- **POST /api/auth/login**: Placeholder for credential verification (Phase 2).
- **GET /api/users**: Profile and role administration.
- **GET /api/courses**: Core curriculum, lesson contents.
- **GET /api/centres**: Neighborhood coaching centers listing.
- **GET /api/enrollments**: Batch registries.
- **GET /api/progress**: Progression and multiplier checks.
- **GET /api/attendance**: Practical hands-on daily logs.
- **GET /api/rewards**: Gamified points counters.
- **GET /api/notifications**: Text alerts.
- **GET /api/ai**: Intelligent doubt solvers.
- **GET /api/admin/stats**: Administrative system dashboard metrics.
