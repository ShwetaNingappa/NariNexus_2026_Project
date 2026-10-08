import os
import json
import logging
from typing import List, Dict, Any, Optional
from backend.app.core.database import db_instance

# Reusing loader functions from existing services
from backend.app.services.user_service import load_mock_users
from backend.app.services.centre_service import load_mock_centres
from backend.app.services.course_service import load_mock_data, MOCK_COURSES_FILE
from backend.app.services.enrollment_service import load_mock_enrollments
from backend.app.services.opportunity_service import load_mock_opportunities
from backend.app.api.endpoints.admin import load_mock_applications

logger = logging.getLogger("narinexus.analytics")

class AnalyticsService:
    @classmethod
    def get_platform_metrics(cls) -> Dict[str, Any]:
        """
        Calculates deterministic platform-wide analytical metrics for authorized system admins.
        Fully supports MongoDB database aggregation as well as local fallback JSON storage.
        """
        db = db_instance.get_db()
        if db is not None:
            return cls._get_mongo_metrics(db)
        else:
            return cls._get_mock_metrics()

    @classmethod
    def _get_mongo_metrics(cls, db) -> Dict[str, Any]:
        try:
            # 1. Users
            total_users = db["users"].count_documents({})
            learners = db["users"].count_documents({"role": "learner"})
            centres = db["users"].count_documents({"role": "centre"})
            admins = db["users"].count_documents({"role": "admin"})

            # 2. Centres
            total_centres = db["centres"].count_documents({})
            active_centres = db["centres"].count_documents({"is_active": True})
            
            # Learner distribution per centre
            distribution = []
            centres_cursor = db["centres"].find({})
            for c in centres_cursor:
                c_id = str(c.get("id") or c.get("_id"))
                count = db["users"].count_documents({"role": "learner", "training_centre_id": c_id})
                distribution.append({
                    "centre_id": c_id,
                    "centre_name": c.get("name", "Unknown Centre"),
                    "learner_count": count
                })

            # 3. Learning
            total_courses = db["courses"].count_documents({})
            total_enrollments = db["enrollments"].count_documents({})
            completed_enrollments = db["enrollments"].count_documents({"progress": 100})
            
            avg_progress = 0.0
            if total_enrollments > 0:
                pipeline = [{"$group": {"_id": None, "avg_prog": {"$avg": "$progress"}}}]
                agg = list(db["enrollments"].aggregate(pipeline))
                if agg and agg[0].get("avg_prog") is not None:
                    avg_progress = round(float(agg[0]["avg_prog"]), 1)

            completion_rate = 0.0
            if total_enrollments > 0:
                completion_rate = round((completed_enrollments / total_enrollments) * 100, 1)

            # 4. Opportunities & Applications
            total_opportunities = db["opportunities"].count_documents({})
            active_opportunities = db["opportunities"].count_documents({"is_active": True})
            total_applications = db["applications"].count_documents({})

            # Status distribution of applications
            statuses = ["Applied", "Under Review", "Shortlisted", "Accepted", "Rejected", "Withdrawn"]
            status_distribution = {}
            for s in statuses:
                status_distribution[s] = db["applications"].count_documents({"status": s})

            return {
                "users": {
                    "total": total_users,
                    "learners": learners,
                    "centres": centres,
                    "admins": admins
                },
                "centres": {
                    "total": total_centres,
                    "active": active_centres,
                    "learner_distribution": distribution
                },
                "learning": {
                    "total_courses": total_courses,
                    "total_enrollments": total_enrollments,
                    "completed_enrollments": completed_enrollments,
                    "average_progress": avg_progress,
                    "completion_rate": completion_rate
                },
                "opportunities": {
                    "total_opportunities": total_opportunities,
                    "active_opportunities": active_opportunities,
                    "total_applications": total_applications
                },
                "applications": {
                    "status_distribution": status_distribution,
                    "total": total_applications
                }
            }
        except Exception as e:
            logger.error(f"Error executing Mongo metrics aggregation: {str(e)}")
            return cls._get_mock_metrics()

    @classmethod
    def _get_mock_metrics(cls) -> Dict[str, Any]:
        """
        Calculates identical metrics deterministically from local mock files.
        """
        users = load_mock_users()
        centres_data = load_mock_centres()
        courses = load_mock_data(MOCK_COURSES_FILE)
        enrollments = load_mock_enrollments()
        opportunities = load_mock_opportunities()
        applications = load_mock_applications()

        # 1. Users
        total_users = len(users)
        learners = sum(1 for u in users.values() if u.get("role") == "learner")
        centres = sum(1 for u in users.values() if u.get("role") == "centre")
        admins = sum(1 for u in users.values() if u.get("role") == "admin")

        # 2. Centres
        total_centres = len(centres_data)
        centres_list = list(centres_data.values()) if isinstance(centres_data, dict) else (centres_data or [])
        active_centres = sum(1 for c in centres_list if c.get("is_active", True))
        
        distribution = []
        for c in centres_list:
            c_id = str(c.get("id") or c.get("_id") or "")
            count = sum(1 for u in users.values() if u.get("role") == "learner" and u.get("training_centre_id") == c_id)
            distribution.append({
                "centre_id": c_id,
                "centre_name": c.get("name", "Unknown Centre"),
                "learner_count": count
            })

        # 3. Learning
        total_courses = len(courses)
        total_enrollments = len(enrollments)
        completed_enrollments = sum(1 for e in enrollments if e.get("progress") == 100)
        
        avg_progress = 0.0
        if total_enrollments > 0:
            total_prog = sum(e.get("progress", 0) for e in enrollments)
            avg_progress = round(total_prog / total_enrollments, 1)

        completion_rate = 0.0
        if total_enrollments > 0:
            completion_rate = round((completed_enrollments / total_enrollments) * 100, 1)

        # 4. Opportunities
        total_opportunities = len(opportunities)
        active_opportunities = sum(1 for o in opportunities if o.get("is_active", True))
        total_applications = len(applications)

        # Applications status
        statuses = ["Applied", "Under Review", "Shortlisted", "Accepted", "Rejected", "Withdrawn"]
        status_distribution = {}
        for s in statuses:
            status_distribution[s] = sum(1 for a in applications if a.get("status") == s)

        return {
            "users": {
                "total": total_users,
                "learners": learners,
                "centres": centres,
                "admins": admins
            },
            "centres": {
                "total": total_centres,
                "active": active_centres,
                "learner_distribution": distribution
            },
            "learning": {
                "total_courses": total_courses,
                "total_enrollments": total_enrollments,
                "completed_enrollments": completed_enrollments,
                "average_progress": avg_progress,
                "completion_rate": completion_rate
            },
            "opportunities": {
                "total_opportunities": total_opportunities,
                "active_opportunities": active_opportunities,
                "total_applications": total_applications
            },
            "applications": {
                "status_distribution": status_distribution,
                "total": total_applications
            }
        }
