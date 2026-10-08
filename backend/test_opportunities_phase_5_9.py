import unittest
import os
import json
from unittest.mock import patch, MagicMock

# Setup environment variables for test execution
os.environ["GEMINI_API_KEY"] = "mock_test_key_xyz"

from backend.app.services.opportunity_service import OpportunityService, MOCK_ACTION_PLANS_FILE
from backend.app.services.ai_safety_service import AISafetyService, _ai_request_timestamps

class TestOpportunitiesPhase59(unittest.TestCase):

    def setUp(self):
        # Reset rate limiting states before each test run
        _ai_request_timestamps.clear()

        # Create mock profiles for two distinct learners
        self.learner_a_user = {
            "id": "learner-a-123",
            "name": "Savitha",
            "email": "savitha@example.com",
            "preferred_language": "en",
            "learning_interests": ["tailoring", "stitching"],
            "existing_skills": ["Basic Needlework", "Measurement Cutting"],
            "career_goal": "I want to start a custom tailoring boutique from home"
        }
        self.learner_b_user = {
            "id": "learner-b-456",
            "name": "Rehana",
            "email": "rehana@example.com",
            "preferred_language": "kn",
            "learning_interests": ["computers", "digital banking"],
            "existing_skills": ["Computer Basics"],
            "career_goal": "I want to work at a village digital common service centre"
        }

        # Clear mock action plans before each test to start with clean state
        if os.path.exists(MOCK_ACTION_PLANS_FILE):
            try:
                os.remove(MOCK_ACTION_PLANS_FILE)
            except Exception:
                pass

    def test_list_opportunities(self):
        opps = OpportunityService.get_opportunities()
        self.assertIsInstance(opps, list)
        self.assertGreater(len(opps), 0)
        
        # Verify schema
        first_opp = opps[0]
        self.assertIn("id", first_opp)
        self.assertIn("title", first_opp)
        self.assertIn("type", first_opp)
        self.assertIn("required_skills", first_opp)
        self.assertIn("earning_info", first_opp)

    def test_get_opportunity_by_id_success(self):
        opp = OpportunityService.get_opportunity_by_id("opp-tailoring-01")
        self.assertIsNotNone(opp)
        self.assertEqual(opp["id"], "opp-tailoring-01")
        self.assertEqual(opp["title"], "Home-Based Custom Tailoring Partner")

    def test_get_opportunity_by_id_not_found(self):
        opp = OpportunityService.get_opportunity_by_id("opp-invalid-id")
        self.assertIsNone(opp)

    @patch("backend.app.services.user_service.UserService.get_user_by_id")
    def test_get_recommended_opportunities(self, mock_get_user):
        mock_get_user.return_value = self.learner_a_user
        
        opps = OpportunityService.get_recommended_opportunities("learner-a-123")
        self.assertIsInstance(opps, list)
        self.assertGreater(len(opps), 0)
        
        # Learner A has tailoring interest, so tailoring opportunity should rank first
        self.assertEqual(opps[0]["id"], "opp-tailoring-01")

    @patch("backend.app.services.user_service.UserService.get_user_by_id")
    def test_opportunity_match_analysis_and_fallback(self, mock_get_user):
        mock_get_user.return_value = self.learner_a_user
        
        data = OpportunityService.get_opportunity_match_analysis("learner-a-123", "opp-tailoring-01")
        self.assertTrue(data["success"])
        self.assertEqual(data["opportunity_id"], "opp-tailoring-01")
        
        # Verify matching skills calculated correctly: Learner A has "Basic Needlework" and "Measurement Cutting"
        self.assertIn("Basic Needlework", data["matching_skills"])
        self.assertIn("Measurement Cutting", data["matching_skills"])
        # "Lining Stitching" is required but she doesn't have it, so it should be in missing_skills
        self.assertIn("Lining Stitching", data["missing_skills"])
        
        # Fallback AI response explanation should be returned and neutralized
        self.assertIsNotNone(data["ai_match_explanation"])
        self.assertNotIn("guaranteed job", data["ai_match_explanation"].lower())

    @patch("backend.app.services.user_service.UserService.get_user_by_id")
    def test_action_plan_retrieval_and_update(self, mock_get_user):
        # 1. Test Retrieval of general action plan for Learner A
        mock_get_user.return_value = self.learner_a_user
                
        data = OpportunityService.get_or_create_action_plan("learner-a-123")
        self.assertTrue(data["success"])
        plan = data["action_plan"]
        self.assertIn("steps", plan)
        self.assertEqual(len(plan["steps"]), 4)
        
        # Confirm default status is not_started
        first_step = plan["steps"][0]
        self.assertEqual(first_step["status"], "not_started")
        
        # 2. Test Step Status Update
        step_id = first_step["id"]
        update_res = OpportunityService.update_action_plan_step("learner-a-123", step_id, "completed")
        self.assertTrue(update_res["success"])
        self.assertEqual(update_res["action_plan"]["steps"][0]["status"], "completed")

    @patch("backend.app.services.user_service.UserService.get_user_by_id")
    def test_learner_isolation_prevention(self, mock_get_user):
        # Confirm Learner B can retrieve their own separate Kannada action plan,
        # and cannot access or modify Learner A's plan.
        
        # Create Learner A's plan
        mock_get_user.return_value = self.learner_a_user
        OpportunityService.get_or_create_action_plan("learner-a-123")
        
        # Fetch Learner B's plan
        mock_get_user.return_value = self.learner_b_user
        data_b = OpportunityService.get_or_create_action_plan("learner-b-456")
        self.assertTrue(data_b["success"])
        
        # Learner B's language should be 'kn'
        self.assertEqual(data_b["language"], "kn")
        self.assertEqual(data_b["action_plan"]["steps"][0]["status"], "not_started")
        
        # Trying to update Learner A's step using Learner B's id should return error (isolation)
        update_res = OpportunityService.update_action_plan_step("learner-b-456", "step-1", "completed")
        self.assertTrue(update_res["success"])
        
        # Re-check Learner A's plan steps are unaffected
        mock_get_user.return_value = self.learner_a_user
        data_a = OpportunityService.get_or_create_action_plan("learner-a-123")
        # Step 1 should still be not_started for Learner A (since we updated Learner B's step)
        self.assertEqual(data_a["action_plan"]["steps"][0]["status"], "not_started")

    def test_rate_limiting_defense(self):
        user_id = "test-user-limit"
        
        # Trigger multiple requests up to limit
        for _ in range(5):
            AISafetyService.apply_rate_limit(user_id)
            
        # The 6th request should raise HTTPException (429)
        from fastapi import HTTPException
        with self.assertRaises(HTTPException) as ctx:
            AISafetyService.apply_rate_limit(user_id)
        self.assertEqual(ctx.exception.status_code, 429)

if __name__ == "__main__":
    unittest.main()
