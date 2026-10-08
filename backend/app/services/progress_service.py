import os
import json
import uuid
from datetime import datetime
from typing import List, Dict, Any, Optional
from backend.app.core.database import db_instance
from backend.app.services.course_service import CourseService
from backend.app.services.enrollment_service import EnrollmentService

MOCK_PROGRESS_FILE = os.path.join(os.path.dirname(__file__), "mock_progress.json")

def load_mock_progress() -> List[Dict[str, Any]]:
    if not os.path.exists(MOCK_PROGRESS_FILE):
        return []
    try:
        with open(MOCK_PROGRESS_FILE, "r") as f:
            return json.load(f)
    except Exception:
        return []

def save_mock_progress(progress_list: List[Dict[str, Any]]):
    try:
        with open(MOCK_PROGRESS_FILE, "w") as f:
            json.dump(progress_list, f, indent=2)
    except Exception:
        pass

class ProgressService:
    @staticmethod
    def _serialize_progress(progress: Dict[str, Any]) -> Dict[str, Any]:
        if not progress:
            return progress
        serialized = dict(progress)
        
        # Convert _id to id string
        if "_id" in serialized:
            serialized["id"] = str(serialized["_id"])
            del serialized["_id"]
        elif "id" in serialized:
            serialized["id"] = str(serialized["id"])
            
        # Format dates
        for key in ["completed_at", "created_at", "updated_at"]:
            if key in serialized:
                val = serialized[key]
                if isinstance(val, datetime):
                    serialized[key] = val.isoformat()
                elif isinstance(val, str):
                    serialized[key] = val
                    
        return serialized

    @classmethod
    def find_lesson_by_id_only(cls, lesson_id: str) -> Optional[Dict[str, Any]]:
        """
        Locates a lesson by its unique ID across any course.
        """
        db = db_instance.get_db()
        if db is not None:
            lesson = db["lessons"].find_one({"id": lesson_id})
            if lesson:
                lesson["id"] = str(lesson.get("id") or lesson.get("_id"))
                if "_id" in lesson:
                    del lesson["_id"]
                return lesson
        else:
            # Fallback JSON scan
            from backend.app.services.course_service import MOCK_LESSONS_FILE, load_mock_data
            all_lessons = load_mock_data(MOCK_LESSONS_FILE)
            for l in all_lessons:
                if l.get("id") == lesson_id:
                    return l
        return None

    @classmethod
    def get_lesson_completion(cls, learner_id: str, lesson_id: str) -> Optional[Dict[str, Any]]:
        db = db_instance.get_db()
        if db is not None:
            progress = db["progress"].find_one({
                "learner_id": learner_id,
                "lesson_id": lesson_id,
                "completed": True
            })
            return cls._serialize_progress(progress) if progress else None
        else:
            progress_list = load_mock_progress()
            for p in progress_list:
                if p.get("learner_id") == learner_id and p.get("lesson_id") == lesson_id and p.get("completed"):
                    return cls._serialize_progress(p)
            return None

    @classmethod
    def mark_lesson_complete(cls, learner_id: str, lesson_id: str) -> Dict[str, Any]:
        # 1. Locate the lesson
        lesson = cls.find_lesson_by_id_only(lesson_id)
        if not lesson:
            raise ValueError(f"Lesson not found with ID: {lesson_id}")
            
        course_id = lesson["course_id"]
        
        # 2. Check active or completed enrollment
        enrollment = EnrollmentService.get_enrollment_by_course_and_learner(course_id, learner_id)
        if not enrollment or enrollment.get("status") not in ["active", "completed"]:
            raise ValueError("Learner is not actively enrolled in the course for this lesson")

        # 3. Check if already completed (idempotent check)
        existing = cls.get_lesson_completion(learner_id, lesson_id)
        if existing:
            return existing

        new_id = uuid.uuid4().hex
        now = datetime.utcnow()

        progress_doc = {
            "id": new_id,
            "learner_id": learner_id,
            "course_id": course_id,
            "lesson_id": lesson_id,
            "completed": True,
            "completed_at": now if db_instance.get_db() is not None else now.isoformat(),
            "created_at": now if db_instance.get_db() is not None else now.isoformat(),
            "updated_at": now if db_instance.get_db() is not None else now.isoformat()
        }

        db = db_instance.get_db()
        if db is not None:
            db["progress"].insert_one(progress_doc)
            # Update learner points, streaks and badges dynamically on real action
            try:
                from bson import ObjectId
                user = db["users"].find_one({"_id": ObjectId(learner_id) if len(learner_id) == 24 else learner_id})
                if user:
                    current_points = user.get("points", 50)
                    current_streak = user.get("streak", 1)
                    last_active_str = user.get("last_activity_date")
                    
                    today_str = datetime.utcnow().date().isoformat()
                    new_streak = current_streak
                    
                    if last_active_str:
                        try:
                            last_active = datetime.fromisoformat(last_active_str).date()
                            today = datetime.utcnow().date()
                            delta = (today - last_active).days
                            if delta == 1:
                                new_streak = current_streak + 1
                            elif delta > 1:
                                new_streak = 1
                        except Exception:
                            new_streak = 1
                    else:
                        new_streak = 1
                    
                    # Award 10 points per lesson complete action
                    new_points = current_points + 10
                    
                    badges = user.get("badges", [])
                    if "First Lesson Complete" not in badges:
                        badges.append("First Lesson Complete")
                        
                    db["users"].update_one(
                        {"_id": user["_id"]},
                        {"$set": {
                            "points": new_points,
                            "streak": new_streak,
                            "last_activity_date": today_str,
                            "badges": badges
                        }}
                    )
            except Exception as e_gam:
                print(f"Warning: Gamification state sync skipped: {e_gam}")
        else:
            progress_list = load_mock_progress()
            progress_list.append(progress_doc)
            save_mock_progress(progress_list)

        # 4. Perform dynamic evaluation of course completion status
        cls.recalculate_and_update_course_completion(learner_id, course_id)

        return cls._serialize_progress(progress_doc)

    @classmethod
    def uncomplete_lesson(cls, learner_id: str, lesson_id: str) -> bool:
        # 1. Locate the lesson
        lesson = cls.find_lesson_by_id_only(lesson_id)
        if not lesson:
            raise ValueError(f"Lesson not found with ID: {lesson_id}")
            
        course_id = lesson["course_id"]
        
        # 2. Check active or completed enrollment
        enrollment = EnrollmentService.get_enrollment_by_course_and_learner(course_id, learner_id)
        if not enrollment or enrollment.get("status") not in ["active", "completed"]:
            raise ValueError("Learner is not actively enrolled in the course for this lesson")

        db = db_instance.get_db()
        removed = False
        if db is not None:
            res = db["progress"].delete_many({
                "learner_id": learner_id,
                "lesson_id": lesson_id
            })
            removed = res.deleted_count > 0
        else:
            progress_list = load_mock_progress()
            initial_len = len(progress_list)
            progress_list = [p for p in progress_list if not (p.get("learner_id") == learner_id and p.get("lesson_id") == lesson_id)]
            removed = len(progress_list) < initial_len
            if removed:
                save_mock_progress(progress_list)

        # 3. Recalculate status (e.g. if was completed, transition back to active) and deduct points
        if removed:
            cls.recalculate_and_update_course_completion(learner_id, course_id)
            if db is not None:
                try:
                    from bson import ObjectId
                    user = db["users"].find_one({"_id": ObjectId(learner_id) if len(learner_id) == 24 else learner_id})
                    if user:
                        current_points = user.get("points", 50)
                        new_points = max(0, current_points - 10)
                        db["users"].update_one(
                            {"_id": user["_id"]},
                            {"$set": {"points": new_points}}
                        )
                except Exception as e_gam:
                    print(f"Warning: Gamification state deduction skipped: {e_gam}")

        return removed

    @classmethod
    def get_course_progress(cls, learner_id: str, course_id: str) -> Dict[str, Any]:
        # Get all lessons for the course
        lessons = CourseService.get_lessons_for_course(course_id)
        total_lessons = len(lessons)
        
        if total_lessons == 0:
            return {
                "course_id": course_id,
                "total_lessons": 0,
                "completed_lessons": 0,
                "progress_percentage": 0,
                "completed_lesson_ids": []
            }

        # Get completed lessons for this learner & course
        db = db_instance.get_db()
        completed_ids = []
        if db is not None:
            progress_records = list(db["progress"].find({
                "learner_id": learner_id,
                "course_id": course_id,
                "completed": True
            }))
            completed_ids = [p["lesson_id"] for p in progress_records]
        else:
            progress_list = load_mock_progress()
            completed_ids = [
                p["lesson_id"] for p in progress_list
                if p.get("learner_id") == learner_id and p.get("course_id") == course_id and p.get("completed")
            ]

        # Intersect with actual lessons to prevent phantom count
        lesson_ids_set = {l["id"] for l in lessons}
        valid_completed_ids = [lid for lid in completed_ids if lid in lesson_ids_set]
        completed_count = len(valid_completed_ids)

        progress_percentage = int((completed_count / total_lessons) * 100)

        return {
            "course_id": course_id,
            "total_lessons": total_lessons,
            "completed_lessons": completed_count,
            "progress_percentage": progress_percentage,
            "completed_lesson_ids": valid_completed_ids
        }

    @classmethod
    def get_my_learning_progress(cls, learner_id: str) -> List[Dict[str, Any]]:
        # Fetch learner enrollments
        enrollments = EnrollmentService.get_learner_enrollments(learner_id)
        
        progress_summary = []
        for enroll in enrollments:
            # We want to show progress of actively tracked courses (active & completed)
            if enroll.get("status") not in ["active", "completed"]:
                continue
                
            course_id = enroll["course_id"]
            progress_info = cls.get_course_progress(learner_id, course_id)
            
            progress_summary.append({
                "course_id": course_id,
                "course_title": enroll.get("course_title", "Unknown Course"),
                "completed_lessons": progress_info["completed_lessons"],
                "total_lessons": progress_info["total_lessons"],
                "progress_percentage": progress_info["progress_percentage"],
                "learning_mode": enroll.get("learning_mode", "online"),
                "status": enroll.get("status", "active"),
                "enrollment_id": enroll.get("enrollment_id")
            })
            
        return progress_summary

    @classmethod
    def recalculate_and_update_course_completion(cls, learner_id: str, course_id: str):
        """
        Dynamic enrollment state evaluator. Runs at the end of every state alteration transaction.
        """
        progress_info = cls.get_course_progress(learner_id, course_id)
        total = progress_info["total_lessons"]
        completed = progress_info["completed_lessons"]

        enrollment = EnrollmentService.get_enrollment_by_course_and_learner(course_id, learner_id)
        if enrollment:
            current_status = enrollment.get("status")
            if total > 0 and completed == total:
                if current_status != "completed":
                    EnrollmentService.update_enrollment_status(enrollment["id"], "completed")
            else:
                if current_status == "completed":
                    EnrollmentService.update_enrollment_status(enrollment["id"], "active")

    @classmethod
    def get_centre_progress_overview(cls, centre_id: str) -> List[Dict[str, Any]]:
        """
        Get progress information for all authorized learners registered with the authenticated training centre.
        """
        from backend.app.services.centre_service import CentreService
        
        learners = CentreService.get_associated_learners(centre_id)
        overview = []
        
        for learner in learners:
            learner_id = learner["id"]
            enrollments = EnrollmentService.get_learner_enrollments(learner_id)
            
            for enroll in enrollments:
                course_id = enroll["course_id"]
                prog_info = cls.get_course_progress(learner_id, course_id)
                
                # Find last activity (latest completed lesson's completed_at, or enrollment_date)
                last_activity = enroll.get("enrollment_date")
                db = db_instance.get_db()
                if db is not None:
                    latest_progress = db["progress"].find_one(
                        {"learner_id": learner_id, "course_id": course_id, "completed": True},
                        sort=[("completed_at", -1)]
                    )
                    if latest_progress and "completed_at" in latest_progress:
                        if isinstance(latest_progress["completed_at"], datetime):
                            last_activity = latest_progress["completed_at"].isoformat()
                        else:
                            last_activity = str(latest_progress["completed_at"])
                else:
                    progress_list = load_mock_progress()
                    learner_course_progs = [
                        p for p in progress_list
                        if p.get("learner_id") == learner_id and p.get("course_id") == course_id and p.get("completed")
                    ]
                    if learner_course_progs:
                        learner_course_progs.sort(key=lambda x: x.get("completed_at", ""), reverse=True)
                        last_activity = learner_course_progs[0].get("completed_at")

                overview.append({
                    "id": f"{learner_id}-{course_id}",
                    "learner": {
                        "id": learner_id,
                        "name": learner["name"],
                        "preferred_language": learner.get("preferred_language", "en")
                    },
                    "course": {
                        "id": course_id,
                        "title": enroll["course_title"]
                    },
                    "progress_percentage": prog_info["progress_percentage"],
                    "completed_lessons": prog_info["completed_lessons"],
                    "total_lessons": prog_info["total_lessons"],
                    "status": enroll["status"],
                    "last_activity": last_activity,
                    "completion_status": "completed" if prog_info["progress_percentage"] == 100 else "in-progress"
                })
                
        return overview

    @classmethod
    def get_learner_progress_breakdown(cls, learner_id: str, centre_id: str) -> Dict[str, Any]:
        """
        Get secure detailed profile, course enrollments, and lesson-by-lesson progress breakdown of a specific learner associated with this centre.
        """
        from backend.app.services.user_service import UserService
        
        learner = UserService.get_user_by_id(learner_id)
        if not learner or learner.get("role") != "learner":
            raise ValueError("Learner not found.")
            
        if learner.get("training_centre_id") != centre_id:
            raise ValueError("Access denied. This learner is not registered with your training centre.")
            
        enrollments = EnrollmentService.get_learner_enrollments(learner_id)
        detailed_courses = []
        
        for enroll in enrollments:
            course_id = enroll["course_id"]
            prog_info = cls.get_course_progress(learner_id, course_id)
            
            # Fetch all lessons for the course to show lesson-by-lesson breakdown
            lessons = CourseService.get_lessons_for_course(course_id)
            lesson_breakdown = []
            
            for lesson in lessons:
                comp_rec = cls.get_lesson_completion(learner_id, lesson["id"])
                completed = comp_rec is not None
                completed_at = comp_rec.get("completed_at") if completed else None
                
                lesson_breakdown.append({
                    "lesson_id": lesson["id"],
                    "title": lesson["title"],
                    "lesson_number": lesson.get("lesson_number", 1),
                    "duration": lesson.get("duration", ""),
                    "completed": completed,
                    "completed_at": completed_at
                })
                
            detailed_courses.append({
                "course_id": course_id,
                "course_title": enroll.get("course_title"),
                "status": enroll["status"],
                "progress_percentage": prog_info["progress_percentage"],
                "completed_lessons": prog_info["completed_lessons"],
                "total_lessons": prog_info["total_lessons"],
                "remaining_lessons": prog_info["total_lessons"] - prog_info["completed_lessons"],
                "enrollment_date": enroll.get("enrollment_date"),
                "lessons": lesson_breakdown
            })
            
        # Strip out sensitive credentials or details
        learner_data = {
            "id": learner_id,
            "name": learner["name"],
            "email": learner["email"],
            "phone": learner.get("phone"),
            "age": learner.get("age"),
            "location": learner.get("location"),
            "preferred_language": learner.get("preferred_language", "en"),
            "education_level": learner.get("education_level"),
            "learning_preference": learner.get("learning_preference"),
            "career_goal": learner.get("career_goal"),
            "existing_skills": learner.get("existing_skills", []),
            "learning_interests": learner.get("learning_interests", [])
        }
        
        return {
            "learner": learner_data,
            "courses": detailed_courses
        }

    @classmethod
    def get_course_progress_details(cls, course_id: str, centre_id: str) -> Dict[str, Any]:
        """
        Get aggregated progress details for a specific course, including statistics and individual learner breakdown.
        """
        from backend.app.services.centre_service import CentreService
        from backend.app.services.enrollment_service import load_mock_enrollments
        
        course = CourseService.get_course_by_id(course_id)
        if not course:
            raise ValueError("Course not found.")
            
        # Ensure course belongs to this centre or is public-domain, and centre is authorized to monitor its own learners in it.
        # But if the course specifically has a centre_id, check ownership:
        if course.get("centre_id") and course.get("centre_id") != centre_id:
            raise ValueError("Access denied. This course belongs to another training centre.")
            
        learners = CentreService.get_associated_learners(centre_id)
        learner_ids = {l["id"] for l in learners}
        
        course_enrolls = []
        db = db_instance.get_db()
        if db is not None:
            db_enrolls = list(db["enrollments"].find({"course_id": course_id}))
            for e in db_enrolls:
                e_serialized = EnrollmentService._serialize_enrollment(e)
                if e_serialized["learner_id"] in learner_ids:
                    course_enrolls.append(e_serialized)
        else:
            all_enrolls = load_mock_enrollments()
            for e in all_enrolls:
                if e.get("course_id") == course_id and e.get("learner_id") in learner_ids:
                    course_enrolls.append(EnrollmentService._serialize_enrollment(e))
                    
        total_enrolled = len(course_enrolls)
        total_completed = 0
        total_in_progress = 0
        total_inactive = 0
        sum_progress = 0
        
        learner_breakdown = []
        for enroll in course_enrolls:
            learner_id = enroll["learner_id"]
            learner_obj = next((l for l in learners if l["id"] == learner_id), None)
            if not learner_obj:
                continue
                
            prog_info = cls.get_course_progress(learner_id, course_id)
            percent = prog_info["progress_percentage"]
            sum_progress += percent
            
            if percent == 100 or enroll["status"] == "completed":
                total_completed += 1
                completion_status = "completed"
            elif percent > 0:
                total_in_progress += 1
                completion_status = "in-progress"
            else:
                total_inactive += 1
                completion_status = "inactive"
                
            # Last activity date
            last_activity = enroll.get("enrollment_date")
            if db is not None:
                latest_progress = db["progress"].find_one(
                    {"learner_id": learner_id, "course_id": course_id, "completed": True},
                    sort=[("completed_at", -1)]
                )
                if latest_progress and "completed_at" in latest_progress:
                    if isinstance(latest_progress["completed_at"], datetime):
                        last_activity = latest_progress["completed_at"].isoformat()
                    else:
                        last_activity = str(latest_progress["completed_at"])
            else:
                progress_list = load_mock_progress()
                learner_course_progs = [
                    p for p in progress_list
                    if p.get("learner_id") == learner_id and p.get("course_id") == course_id and p.get("completed")
                ]
                if learner_course_progs:
                    learner_course_progs.sort(key=lambda x: x.get("completed_at", ""), reverse=True)
                    last_activity = learner_course_progs[0].get("completed_at")
                    
            learner_breakdown.append({
                "learner_id": learner_id,
                "learner_name": learner_obj["name"],
                "preferred_language": learner_obj.get("preferred_language", "en"),
                "progress_percentage": percent,
                "completed_lessons": prog_info["completed_lessons"],
                "total_lessons": prog_info["total_lessons"],
                "status": enroll["status"],
                "last_activity": last_activity,
                "completion_status": completion_status
            })
            
        avg_progress = int(sum_progress / total_enrolled) if total_enrolled > 0 else 0
        
        return {
            "course": {
                "id": course_id,
                "title": course["title"],
                "category_id": course.get("category_id"),
                "skill_id": course.get("skill_id"),
                "total_active_enrolled_learners": total_enrolled
            },
            "progress_aggregation": {
                "average_progress_percentage": avg_progress,
                "total_learners_completed": total_completed,
                "total_learners_in_progress": total_in_progress,
                "total_learners_inactive": total_inactive
            },
            "learner_breakdown": learner_breakdown
        }

    @classmethod
    def get_centre_analytics(cls, centre_id: str) -> Dict[str, Any]:
        """
        Calculate deterministic and secure multi-tenant analytics for a training centre.
        """
        from backend.app.services.centre_service import CentreService
        from backend.app.services.course_service import CourseService

        # 1. Associated learners and courses
        learners = CentreService.get_associated_learners(centre_id)
        learner_ids = {l["id"] for l in learners}
        courses = CourseService.get_courses_by_centre(centre_id)

        # 2. Gather progress across all enrollments of associated learners
        enrollment_progress = []
        for learner in learners:
            learner_id = learner["id"]
            enrolls = EnrollmentService.get_learner_enrollments(learner_id)
            for e in enrolls:
                course_id = e["course_id"]
                prog_info = cls.get_course_progress(learner_id, course_id)
                enrollment_progress.append({
                    "learner_id": learner_id,
                    "course_id": course_id,
                    "progress_percentage": prog_info["progress_percentage"],
                    "completed_lessons": prog_info["completed_lessons"],
                    "total_lessons": prog_info["total_lessons"],
                    "enrollment_date": e.get("enrollment_date"),
                    "status": e.get("status")
                })

        # 3. Calculate learner metrics
        total_learners = len(learners)
        active_learner_ids = set()
        completed_learner_ids = set()
        no_progress_learner_ids = set(learner_ids)

        for ep in enrollment_progress:
            l_id = ep["learner_id"]
            percent = ep["progress_percentage"]
            if percent > 0:
                active_learner_ids.add(l_id)
                if l_id in no_progress_learner_ids:
                    no_progress_learner_ids.remove(l_id)
            if percent == 100:
                completed_learner_ids.add(l_id)

        # 4. Calculate course metrics
        total_courses = len(courses)
        active_courses_count = len([c for c in courses if c.get("status") == "active"])
        courses_with_enrollments_ids = {ep["course_id"] for ep in enrollment_progress}
        courses_with_enrollments_count = len(courses_with_enrollments_ids.intersection({c["id"] for c in courses}))
        completed_enrollments_count = len([ep for ep in enrollment_progress if ep["progress_percentage"] == 100])

        # 5. Calculate learning/enrollment metrics
        total_enrollments = len(enrollment_progress)
        in_progress_enrollments_count = len([ep for ep in enrollment_progress if 0 < ep["progress_percentage"] < 100])
        not_started_enrollments_count = len([ep for ep in enrollment_progress if ep["progress_percentage"] == 0])
        avg_progress = int(sum(ep["progress_percentage"] for ep in enrollment_progress) / total_enrollments) if total_enrollments > 0 else 0
        overall_completion_rate = round((completed_enrollments_count / total_enrollments) * 100, 1) if total_enrollments > 0 else 0.0

        # 6. Progress Distribution
        dist_0_25 = len([ep for ep in enrollment_progress if ep["progress_percentage"] <= 25])
        dist_26_50 = len([ep for ep in enrollment_progress if 26 <= ep["progress_percentage"] <= 50])
        dist_51_75 = len([ep for ep in enrollment_progress if 51 <= ep["progress_percentage"] <= 75])
        dist_76_99 = len([ep for ep in enrollment_progress if 76 <= ep["progress_percentage"] <= 99])
        dist_100 = len([ep for ep in enrollment_progress if ep["progress_percentage"] == 100])

        # 7. Course-level Performance Analytics
        course_analytics = []
        for course in courses:
            c_id = course["id"]
            course_eps = [ep for ep in enrollment_progress if ep["course_id"] == c_id]
            total_eps = len(course_eps)
            completed_eps = len([ep for ep in course_eps if ep["progress_percentage"] == 100])
            in_progress_eps = len([ep for ep in course_eps if 0 < ep["progress_percentage"] < 100])
            not_started_eps = len([ep for ep in course_eps if ep["progress_percentage"] == 0])
            avg_prog = int(sum(ep["progress_percentage"] for ep in course_eps) / total_eps) if total_eps > 0 else 0
            comp_rate = round((completed_eps / total_eps) * 100, 1) if total_eps > 0 else 0.0
            
            course_analytics.append({
                "id": c_id,
                "title": course["title"],
                "category_id": course.get("category_id"),
                "total_learners": total_eps,
                "completed_learners": completed_eps,
                "in_progress_learners": in_progress_eps,
                "not_started_learners": not_started_eps,
                "average_progress": avg_prog,
                "completion_rate": comp_rate
            })

        # 8. Learner-level Performance Analytics
        learner_analytics = []
        for learner in learners:
            l_id = learner["id"]
            learner_eps = [ep for ep in enrollment_progress if ep["learner_id"] == l_id]
            total_eps = len(learner_eps)
            completed_eps = len([ep for ep in learner_eps if ep["progress_percentage"] == 100])
            avg_prog = int(sum(ep["progress_percentage"] for ep in learner_eps) / total_eps) if total_eps > 0 else 0
            
            started_eps = [ep for ep in learner_eps if ep["progress_percentage"] > 0]
            if total_eps == 0:
                status = "not-started"
            elif len(started_eps) == 0:
                status = "not-started"
            elif completed_eps == total_eps:
                status = "completed"
            else:
                status = "active"
                
            learner_analytics.append({
                "id": l_id,
                "name": learner["name"],
                "email": learner["email"],
                "preferred_language": learner.get("preferred_language", "en"),
                "courses_enrolled_count": total_eps,
                "courses_completed_count": completed_eps,
                "average_progress": avg_prog,
                "learning_status": status
            })

        # 9. Time-Based Activity Trends (Enrollments and completions by month)
        all_enrollments_by_date = {}
        all_completions_by_date = {}

        for ep in enrollment_progress:
            ed = ep.get("enrollment_date")
            if ed:
                try:
                    date_str = str(ed)[:7] # Take "YYYY-MM"
                    all_enrollments_by_date[date_str] = all_enrollments_by_date.get(date_str, 0) + 1
                except Exception:
                    pass

        # Retrieve completions from DB or Mock Progress
        db = db_instance.get_db()
        if db is not None:
            progress_records = list(db["progress"].find({
                "learner_id": {"$in": list(learner_ids)},
                "completed": True
            }))
        else:
            progress_records = [
                p for p in load_mock_progress()
                if p.get("learner_id") in learner_ids and p.get("completed")
            ]

        for p in progress_records:
            cat = p.get("completed_at")
            if cat:
                try:
                    date_str = str(cat)[:7] # Take "YYYY-MM"
                    all_completions_by_date[date_str] = all_completions_by_date.get(date_str, 0) + 1
                except Exception:
                    pass

        months = sorted(list(set(all_enrollments_by_date.keys()).union(set(all_completions_by_date.keys()))))
        activity_trends = []
        for m in months:
            activity_trends.append({
                "month": m,
                "enrollments_count": all_enrollments_by_date.get(m, 0),
                "completions_count": all_completions_by_date.get(m, 0)
            })

        return {
            "learners": {
                "total": total_learners,
                "active": len(active_learner_ids),
                "completed": len(completed_learner_ids),
                "no_progress": len(no_progress_learner_ids)
            },
            "courses": {
                "total": total_courses,
                "active": active_courses_count,
                "with_enrollments": courses_with_enrollments_count,
                "completed_enrollments": completed_enrollments_count
            },
            "learning": {
                "total_enrollments": total_enrollments,
                "completed_enrollments": completed_enrollments_count,
                "in_progress_enrollments": in_progress_enrollments_count,
                "not_started_enrollments": not_started_enrollments_count,
                "average_progress": avg_progress,
                "overall_completion_rate": overall_completion_rate
            },
            "progress_distribution": {
                "0-25": dist_0_25,
                "26-50": dist_26_50,
                "51-75": dist_51_75,
                "76-99": dist_76_99,
                "100": dist_100
            },
            "course_analytics": course_analytics,
            "learner_analytics": learner_analytics,
            "activity_trends": activity_trends
        }


