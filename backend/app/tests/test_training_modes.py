import sys
import os
import unittest
import re
from datetime import datetime

sys.path.append('.')

from backend.app.core.database import db_instance
from backend.app.schemas.course import VideoSchema, extract_youtube_video_id, CentreCourseCreate, CentreCourseUpdate
from backend.app.services.course_service import CourseService
from backend.app.services.enrollment_service import EnrollmentService
from backend.app.api.endpoints.courses import enrich_course_with_centre_delivery

class TestCourseTrainingModes(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        db_instance.connect()
        cls.db = db_instance.get_db()
        if cls.db is None:
            raise RuntimeError("Database connection failed!")
        
    def test_01_youtube_video_id_extraction(self):
        print("Running Test: youtube video id extraction...")
        # Supported formats
        self.assertEqual(extract_youtube_video_id("https://www.youtube.com/watch?v=NVQVz4O6E6I"), "NVQVz4O6E6I")
        self.assertEqual(extract_youtube_video_id("https://youtu.be/NVQVz4O6E6I"), "NVQVz4O6E6I")
        self.assertEqual(extract_youtube_video_id("https://www.youtube.com/embed/NVQVz4O6E6I"), "NVQVz4O6E6I")
        self.assertEqual(extract_youtube_video_id("https://youtube.com/shorts/NVQVz4O6E6I?feature=share"), "NVQVz4O6E6I")
        
        # Invalid / Unparseable
        self.assertIsNone(extract_youtube_video_id("https://example.com"))
        self.assertIsNone(extract_youtube_video_id("https://vimeo.com/12345678"))
        print("✅ Passed: youtube video id extraction")

    def test_02_pydantic_youtube_validation(self):
        print("Running Test: pydantic youtube validation...")
        # Valid URL
        video = VideoSchema(title="Intro", youtube_url="https://www.youtube.com/watch?v=NVQVz4O6E6I")
        self.assertEqual(video.youtube_url, "https://www.youtube.com/watch?v=NVQVz4O6E6I")
        
        # Invalid URL
        with self.assertRaises(ValueError):
            VideoSchema(title="Intro", youtube_url="https://unsafe-iframe.com/hack")
        print("✅ Passed: pydantic youtube validation")

    def test_03_online_course_contains_video(self):
        print("Running Test: online course contains youtube video...")
        course = CourseService.get_course_by_id("digital-literacy-women")
        self.assertIsNotNone(course)
        self.assertEqual(course["learning_mode"], "online")
        
        lessons = CourseService.get_lessons_for_course("digital-literacy-women")
        self.assertTrue(len(lessons) >= 1)
        # Check if the first lesson has a video content
        video_lessons = [l for l in lessons if l.get("content_type") == "video"]
        self.assertTrue(len(video_lessons) >= 1)
        self.assertTrue("youtube.com" in video_lessons[0].get("content") or "youtu.be" in video_lessons[0].get("content"))
        print("✅ Passed: online course contains youtube video")

    def test_04_offline_course_contains_location(self):
        print("Running Test: offline course contains location...")
        course = CourseService.get_course_by_id("advanced-dress-designing")
        self.assertIsNotNone(course)
        self.assertEqual(course["learning_mode"], "offline")
        
        enriched = enrich_course_with_centre_delivery(course, None)
        self.assertIsNotNone(enriched.get("offline_training"))
        self.assertEqual(enriched["offline_training"]["city"], "Mysuru")
        self.assertEqual(enriched["offline_training"]["pincode"], "570017")
        print("✅ Passed: offline course contains location")

    def test_05_map_url_generation(self):
        print("Running Test: map url generation...")
        course = CourseService.get_course_by_id("advanced-dress-designing")
        enriched = enrich_course_with_centre_delivery(course, None)
        
        off = enriched.get("offline_training")
        self.assertIsNotNone(off)
        lat = off.get("latitude")
        lon = off.get("longitude")
        self.assertIsNotNone(lat)
        self.assertIsNotNone(lon)
        
        # Verify map URL format can be built
        map_url = f"https://www.google.com/maps/search/?api=1&query={lat},{lon}"
        self.assertTrue(re.match(r"https://www\.google\.com/maps/search/\?api=1&query=[0-9\.-]+,[0-9\.-]+", map_url))
        print("✅ Passed: map url generation")

    def test_06_hybrid_course_contains_both(self):
        print("Running Test: hybrid course contains both online & offline info...")
        course = CourseService.get_course_by_id("basic-tailoring-stitching")
        self.assertIsNotNone(course)
        self.assertEqual(course["learning_mode"], "hybrid")
        
        enriched = enrich_course_with_centre_delivery(course, None)
        self.assertEqual(enriched["training_mode"], "hybrid")
        
        # Test online part (lessons)
        lessons = CourseService.get_lessons_for_course("basic-tailoring-stitching")
        video_lessons = [l for l in lessons if l.get("content_type") == "video"]
        self.assertTrue(len(video_lessons) >= 1)
        
        # Test offline part (location)
        self.assertIsNotNone(enriched.get("offline_training"))
        self.assertEqual(enriched["offline_training"]["city"], "Bengaluru")
        print("✅ Passed: hybrid course contains both online & offline info")

    def test_07_centre_course_creations(self):
        print("Running Test: training centre course creations (online/offline/hybrid)...")
        # Validate that we can model dump and validate different modes
        
        online_payload = {
            "title": "Test Online Skill Program",
            "description": "This is a detailed course description that meets length requirements.",
            "skill_id": "computer-literacy",
            "category_id": "digital-skills",
            "learning_mode": "online",
            "instructor": "Rupa K.",
            "duration": "2 Weeks",
            "online_training": {
                "videos": [
                    {"title": "Lesson 1", "youtube_url": "https://www.youtube.com/watch?v=NVQVz4O6E6I"}
                ]
            }
        }
        create_online = CentreCourseCreate(**online_payload)
        self.assertEqual(create_online.learning_mode, "online")
        self.assertEqual(len(create_online.online_training.videos), 1)

        offline_payload = {
            "title": "Test Offline Stitching Program",
            "description": "This is a detailed course description that meets length requirements.",
            "skill_id": "basic-stitching",
            "category_id": "tailoring-fashion",
            "learning_mode": "offline",
            "instructor": "Shobha D.",
            "duration": "4 Weeks",
            "offline_training": {
                "centre_name": "Test Centre",
                "city": "Bengaluru",
                "latitude": 12.9716,
                "longitude": 77.5946
            }
        }
        create_offline = CentreCourseCreate(**offline_payload)
        self.assertEqual(create_offline.learning_mode, "offline")
        self.assertEqual(create_offline.offline_training.city, "Bengaluru")
        print("✅ Passed: training centre course creations")

    def test_08_existing_functionalities(self):
        print("Running Test: checking existing enrollments and progress modules safety...")
        # Verify enrollment and progress retrieval doesn't crash on seeded database
        enrollments = EnrollmentService.get_learner_enrollments("dummy-learner")
        self.assertEqual(enrollments, [])
        print("✅ Passed: existing functionalities safety")

if __name__ == "__main__":
    suite = unittest.TestLoader().loadTestsFromTestCase(TestCourseTrainingModes)
    result = unittest.TextTestRunner(verbosity=2).run(suite)
    if not result.wasSuccessful():
        sys.exit(1)
    print("\n🎉 ALL BACKEND AND DATABASE TESTS PASSED SUCCESSFULLY!")
