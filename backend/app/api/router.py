from fastapi import APIRouter
from backend.app.api.endpoints.health import router as health_router
from backend.app.api.endpoints.auth import router as auth_router
from backend.app.api.endpoints.profile import router as profile_router
from backend.app.api.endpoints.catalog import router as catalog_router
from backend.app.api.endpoints.courses import router as real_courses_router
from backend.app.api.endpoints.enrollments import router as real_enrollments_router
from backend.app.api.endpoints.modules import (
    users_router,
    centres_router,
    progress_router,
    attendance_router,
    rewards_router,
    notifications_router,
    ai_router,
    admin_router,
)

api_router = APIRouter()

# Register routes with appropriate prefixes and tags
api_router.include_router(health_router, tags=["Health"])
api_router.include_router(auth_router, prefix="/auth", tags=["Authentication"])
api_router.include_router(profile_router, prefix="/profile", tags=["Profile"])
api_router.include_router(catalog_router, prefix="", tags=["Skill Catalogue"])
api_router.include_router(real_courses_router, prefix="", tags=["Courses"])
api_router.include_router(users_router, prefix="/users", tags=["Users"])
api_router.include_router(centres_router, prefix="/centres", tags=["Coaching Centres"])
api_router.include_router(real_enrollments_router, prefix="", tags=["Enrollments"])
api_router.include_router(progress_router, prefix="/progress", tags=["Progress Tracking"])
api_router.include_router(attendance_router, prefix="/attendance", tags=["Attendance"])
api_router.include_router(rewards_router, prefix="/rewards", tags=["Rewards & Gamification"])
api_router.include_router(notifications_router, prefix="/notifications", tags=["Notifications"])
api_router.include_router(ai_router, prefix="/ai", tags=["AI Layer"])
api_router.include_router(admin_router, prefix="/admin", tags=["Administrator"])
