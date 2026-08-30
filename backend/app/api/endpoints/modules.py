from fastapi import APIRouter

users_router = APIRouter()
@users_router.get("/")
def get_users():
    return {"message": "Users list placeholder (Phase 2)"}

courses_router = APIRouter()
@courses_router.get("/")
def get_courses():
    return {"message": "Courses list placeholder (Phase 2)"}

centres_router = APIRouter()
@centres_router.get("/")
def get_centres():
    return {"message": "Coaching Centres list placeholder (Phase 2)"}

enrollments_router = APIRouter()
@enrollments_router.get("/")
def get_enrollments():
    return {"message": "Enrollments placeholder (Phase 2)"}

progress_router = APIRouter()
@progress_router.get("/")
def get_progress():
    return {"message": "Progress tracker placeholder (Phase 2)"}

attendance_router = APIRouter()
@attendance_router.get("/")
def get_attendance():
    return {"message": "Attendance logs placeholder (Phase 2)"}

rewards_router = APIRouter()
@rewards_router.get("/")
def get_rewards():
    return {"message": "Rewards & gamification placeholder (Phase 2)"}

notifications_router = APIRouter()
@notifications_router.get("/")
def get_notifications():
    return {"message": "Notifications placeholder (Phase 2)"}

ai_router = APIRouter()
@ai_router.get("/")
def get_ai_status():
    return {"message": "Gemini AI assistant placeholder (Phase 2)"}

admin_router = APIRouter()
@admin_router.get("/stats")
def get_admin_stats():
    return {"message": "Admin operations analytics placeholder (Phase 2)"}
