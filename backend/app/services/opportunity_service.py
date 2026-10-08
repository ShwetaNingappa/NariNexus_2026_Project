import os
import json
import logging
import time
from datetime import datetime
from typing import List, Dict, Any, Optional
from google.genai import types

from backend.app.core.database import db_instance
from backend.app.services.ai_service import AIService
from backend.app.services.ai_safety_service import AISafetyService
from backend.app.services.user_service import UserService

logger = logging.getLogger("narinexus.opportunities")

MOCK_OPPORTUNITIES_FILE = os.path.join(os.path.dirname(__file__), "mock_opportunities.json")
MOCK_ACTION_PLANS_FILE = os.path.join(os.path.dirname(__file__), "mock_action_plans.json")

def load_mock_opportunities() -> List[Dict[str, Any]]:
    if not os.path.exists(MOCK_OPPORTUNITIES_FILE):
        return []
    try:
        with open(MOCK_OPPORTUNITIES_FILE, "r") as f:
            return json.load(f)
    except Exception as e:
        logger.error(f"Error loading mock opportunities: {str(e)}")
        return []

def load_action_plans() -> Dict[str, Any]:
    if not os.path.exists(MOCK_ACTION_PLANS_FILE):
        return {}
    try:
        with open(MOCK_ACTION_PLANS_FILE, "r") as f:
            return json.load(f)
    except Exception:
        return {}

def save_action_plans(plans: Dict[str, Any]):
    try:
        with open(MOCK_ACTION_PLANS_FILE, "w") as f:
            json.dump(plans, f, indent=2)
    except Exception as e:
        logger.error(f"Failed to save mock action plans: {str(e)}")

class OpportunityService:

    @classmethod
    def get_opportunities(cls) -> List[Dict[str, Any]]:
        """
        Retrieves all available demo platform opportunities.
        """
        return load_mock_opportunities()

    @classmethod
    def get_opportunity_by_id(cls, opp_id: str) -> Optional[Dict[str, Any]]:
        """
        Retrieves a single opportunity by its ID.
        """
        opps = load_mock_opportunities()
        for o in opps:
            if o.get("id") == opp_id:
                return o
        return None

    @classmethod
    def get_recommended_opportunities(cls, user_id: str) -> List[Dict[str, Any]]:
        """
        Filters and ranks demo opportunities based on learner interests and skills.
        """
        user = UserService.get_user_by_id(user_id)
        if not user:
            return []
        
        opps = load_mock_opportunities()
        user_interests = [i.lower() for i in user.get("learning_interests") or []]
        existing_skills = [s.lower() for s in user.get("existing_skills") or []]
        
        is_tailoring = any("tailor" in i or "stitch" in i or "sew" in i or "design" in i for i in user_interests) or any("stitching" in s or "embroidery" in s for s in existing_skills)
        is_digital = any("computer" in i or "digital" in i or "payment" in i or "mobile" in i for i in user_interests) or any("computer" in s or "digital" in s for s in existing_skills)

        recommended = []
        for opp in opps:
            title_lower = opp.get("title", "").lower()
            desc_lower = opp.get("description", "").lower()
            
            score = 0
            if is_tailoring and any(kw in title_lower or kw in desc_lower for kw in ["tailor", "stitch", "sewing", "craft", "artisan"]):
                score += 3
            if is_digital and any(kw in title_lower or kw in desc_lower for kw in ["digital", "computer", "billing", "bookkeeper", "payments"]):
                score += 3
                
            # Count skill matches
            for req in opp.get("required_skills", []):
                if req.lower() in existing_skills:
                    score += 1
                    
            opp_copy = dict(opp)
            opp_copy["recommendation_score"] = score
            recommended.append(opp_copy)
            
        # Sort by recommendation score descending
        recommended.sort(key=lambda x: x.get("recommendation_score", 0), reverse=True)
        return recommended

    @classmethod
    def get_opportunity_match_analysis(cls, user_id: str, opp_id: str) -> Dict[str, Any]:
        """
        Performs secure, deterministic validation of skills versus opportunity requirements,
        paired with a multilingual AI context explanation.
        """
        user = UserService.get_user_by_id(user_id)
        if not user:
            return {"success": False, "message": "User not found"}
            
        opp = cls.get_opportunity_by_id(opp_id)
        if not opp:
            return {"success": False, "message": "Opportunity not found"}

        lang = user.get("preferred_language") or "en"
        
        # 1. Deterministic validation (Truth coming from Database, NOT Gemini hallucination)
        existing_skills = [s.strip() for s in user.get("existing_skills") or []]
        existing_skills_lower = [s.lower() for s in existing_skills]
        
        required_skills = opp.get("required_skills") or []
        preferred_skills = opp.get("preferred_skills") or []
        
        matching_skills = [s for s in required_skills if s.lower() in existing_skills_lower]
        missing_skills = [s for s in required_skills if s.lower() not in existing_skills_lower]
        missing_preferred = [s for s in preferred_skills if s.lower() not in existing_skills_lower]
        
        # Determine recommended course titles from platform (using real existing titles)
        recommended_courses = []
        is_tailoring_opp = any(kw in opp.get("title", "").lower() or kw in opp.get("description", "").lower() for kw in ["tailor", "stitch", "sew", "needle", "apparel"])
        is_digital_opp = any(kw in opp.get("title", "").lower() or kw in opp.get("description", "").lower() for kw in ["digital", "computer", "recharge", "payments", "bookkeeper"])
        
        if is_tailoring_opp:
            recommended_courses = ["Professional Blouse Pattern Cutting & Stitching", "Garment Alterations & Needlework Basics"]
        elif is_digital_opp:
            recommended_courses = ["Computer Basics for Women Entrepreneurs", "Secure Mobile Payments & Digital Wallets"]
        else:
            recommended_courses = ["Simple Bookkeeping & Financial Health for Small Business"]

        # 2. Dynamic AI contextual explanation with safe Gemini connection
        client = AIService.get_client()
        explanation = ""
        
        if client and not AIService.mock_mode:
            try:
                system_instruction = (
                    "You are NariNexus Career Counselor, an empathetic advisor empowering rural women in India. "
                    "Analyze how the learner's existing skills align with the specified opportunity. "
                    "Formulate a brief, encouraging, highly contextual match explanation in the requested language. "
                    "CRITICAL: Do NOT guarantee a job or specific earnings. Speak only of possibility and learning readiness. "
                    "Keep the response professional, concise, and focused on her success."
                )
                
                prompt = (
                    f"OPPORTUNITY:\n"
                    f"- Title: {opp.get('title')}\n"
                    f"- Description: {opp.get('description')}\n"
                    f"- Requirements: {', '.join(required_skills)}\n\n"
                    f"LEARNER PROFILE:\n"
                    f"- Existing Skills: {', '.join(existing_skills or ['None'])}\n"
                    f"- Preferred Language: {lang}\n\n"
                    f"Provide an explanation of why she matches this opportunity (or what she should learn next) in {lang}. "
                    f"Make sure to use empathetic language. Limit the explanation to 3 sentences."
                )
                
                # Optimized failover sequence: primary gemini-3.1-flash-lite, fall back to gemini-3.5-flash
                models_to_try = ["gemini-3.1-flash-lite", "gemini-3.5-flash"]
                response = None
                last_error = None
                for model_name in models_to_try:
                    try:
                        logger.info(f"Attempting opportunity match analysis with model={model_name}")
                        response = client.models.generate_content(
                            model=model_name,
                            contents=prompt,
                            config=types.GenerateContentConfig(
                                system_instruction=system_instruction,
                                temperature=0.4
                            )
                        )
                        if response and response.text:
                            break
                    except Exception as e:
                        last_error = e
                        logger.warning(f"Model {model_name} failed for match analysis: {str(e)}")
                
                if response and response.text:
                    explanation = response.text.strip()
                elif last_error:
                    raise last_error
            except Exception as e:
                logger.warning(f"Failed to generate Gemini matching explanation: {str(e)}")

        if not explanation:
            # Multi-lingual Safe Fallback
            if lang == "kn":
                if is_tailoring_opp:
                    explanation = f"ನಿಮ್ಮ ಹೊಲಿಗೆ ಕಲೆಯ ಆಸಕ್ತಿ ಮತ್ತು ಕೌಶಲ್ಯಗಳು ಈ ಅವಕಾಶಕ್ಕೆ ಉತ್ತಮವಾಗಿ ಹೊಂದಿಕೆಯಾಗುತ್ತವೆ. ಕೌಶಲ್ಯ ಕೊರತೆಗಳನ್ನು ನೀಗಿಸಲು ಹೊಲಿಗೆ ಕೋರ್ಸ್‌ಗಳನ್ನು ಪೂರ್ಣಗೊಳಿಸಿ."
                else:
                    explanation = f"ನಿಮ್ಮ ಕಂಪ್ಯೂಟರ್ ಜ್ಞಾನವು ಈ ಕಾರ್ಯಕ್ಕೆ ಸೂಕ್ತವಾಗಿದೆ. ನಾರಿನೆಕ್ಸಸ್ ಡಿಜಿಟಲ್ ಕೋರ್ಸ್ ಕಲಿಯುವ ಮೂಲಕ ನಿಮ್ಮ ಸಿದ್ಧತೆಯನ್ನು ಹೆಚ್ಚಿಸಿಕೊಳ್ಳಿ."
            elif lang == "hi":
                if is_tailoring_opp:
                    explanation = f"आपके सिलाई कौशल और अनुभव इस अवसर के लिए आदर्श हैं। अपने हुनर को और बढ़ाने के लिए आप अनुशंसित बुटीक कोर्स को पूरा कर सकती हैं।"
                else:
                    explanation = f"यह भूमिका आपकी कंप्यूटर और डिजिटल रूचि से मेल खाती है। आप मोबाइल भुगतान और कंप्यूटर कोर्सेज की मदद से इसके लिए तैयार हो सकती हैं।"
            else:
                if is_tailoring_opp:
                    explanation = f"Your manual needlework and stitching interests align well with this cottage apparel role. Shoring up missing pattern cutting skills will maximize your readiness."
                else:
                    explanation = f"This digital service role is a promising direction for your computer skill goals. Complete the recommended basic internet and payment modules to prepare."

        # Pass through Phase 5.7 Response validation and scrubbing
        explanation = AISafetyService.sensitive_data_filter(explanation)
        explanation = AISafetyService._neutralize_employment_claims({"text": explanation})["text"]

        return {
            "success": True,
            "opportunity_id": opp_id,
            "matching_skills": matching_skills,
            "missing_skills": missing_skills,
            "missing_preferred": missing_preferred,
            "recommended_courses": recommended_courses,
            "ai_match_explanation": explanation,
            "language": lang
        }

    @classmethod
    def get_or_create_action_plan(cls, user_id: str, opp_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Retrieves the learner's active career action plan, or generates a personalized
        step-by-step path based on her profile and career goals.
        """
        user = UserService.get_user_by_id(user_id)
        if not user:
            return {"success": False, "message": "User not found"}

        lang = user.get("preferred_language") or "en"
        plans = load_action_plans()
        
        # Clean expired/empty entries or load existing
        user_plan = plans.get(user_id)
        if user_plan:
            # If requesting a specific opportunity, check if it matches, or update it
            if opp_id and user_plan.get("opportunity_id") != opp_id:
                user_plan = None # Force regeneration for new target opportunity
                
        if user_plan:
            return {
                "success": True,
                "action_plan": user_plan,
                "language": lang
            }

        # Otherwise, generate a personalized Action Plan
        goal = user.get("career_goal") or ""
        is_tailoring = "tailor" in goal.lower() or "stitch" in goal.lower() or "sew" in goal.lower() or "shop" in goal.lower()
        is_digital = "computer" in goal.lower() or "digital" in goal.lower() or "office" in goal.lower() or "earn from home" in goal.lower()

        opp_title = ""
        if opp_id:
            opp = cls.get_opportunity_by_id(opp_id)
            if opp:
                opp_title = opp.get("title", "")
                is_tailoring = "tailor" in opp_title.lower() or "stitch" in opp_title.lower()
                is_digital = "computer" in opp_title.lower() or "digital" in opp_title.lower()

        # Let's generate action plan steps (typically 4-5 incremental steps)
        steps = []
        client = AIService.get_client()
        
        if client and not AIService.mock_mode:
            try:
                system_instruction = (
                    "You are NariNexus Career Planner. Generate a clear, structured step-by-step career action plan. "
                    "CRITICAL: Do NOT promise income, jobs, or automatic certification. "
                    "Ensure steps focus on learning, practicing, and building confidence. "
                    "Return a JSON array of objects, each with: "
                    "'id' (string 'step-1', 'step-2', etc.), "
                    "'title' (string step heading), "
                    "'description' (brief actionable detail), "
                    "'suggested_action' (concrete immediate action to take). "
                    "Translate all fields fully into the requested language."
                )
                
                prompt = (
                    f"Generate a customized 4-step action plan for a rural Indian woman. "
                    f"Her goal is: '{goal or 'Start earning independently from home'}'\n"
                    f"Target Opportunity: '{opp_title or 'General Local Entrepreneurship'}'\n"
                    f"Preferred Language: {lang}\n\n"
                    f"Return ONLY valid JSON array with keys: id, title, description, suggested_action."
                )
                
                # Optimized failover sequence: primary gemini-3.1-flash-lite, fall back to gemini-3.5-flash
                models_to_try = ["gemini-3.1-flash-lite", "gemini-3.5-flash"]
                response = None
                last_error = None
                for model_name in models_to_try:
                    try:
                        logger.info(f"Attempting opportunity action plan with model={model_name}")
                        response = client.models.generate_content(
                            model=model_name,
                            contents=prompt,
                            config=types.GenerateContentConfig(
                                system_instruction=system_instruction,
                                temperature=0.3,
                                response_mime_type="application/json"
                            )
                        )
                        if response and response.text:
                            break
                    except Exception as e:
                        last_error = e
                        logger.warning(f"Model {model_name} failed for action plan: {str(e)}")
                
                if response and response.text:
                    ai_text = response.text.strip()
                    if ai_text.startswith("```json"):
                        ai_text = ai_text[7:]
                    if ai_text.endswith("```"):
                        ai_text = ai_text[:-3]
                    ai_text = ai_text.strip()
                    
                    raw_steps = json.loads(ai_text)
                    if isinstance(raw_steps, list):
                        for idx, step in enumerate(raw_steps):
                            steps.append({
                                "id": step.get("id") or f"step-{idx+1}",
                                "title": step.get("title") or f"Step {idx+1}",
                                "description": step.get("description") or "",
                                "status": "not_started",
                                "suggested_action": step.get("suggested_action") or ""
                            })
            except Exception as e:
                logger.warning(f"Gemini Action Plan failed, using safe fallback: {str(e)}")

        if not steps:
            # Fallback action plans based on language
            if lang == "kn":
                if is_tailoring:
                    steps = [
                        {"id": "step-1", "title": "ಟೈಲರಿಂಗ್ ಬೇಸಿಕ್ಸ್ ಕೋರ್ಸ್ ಪೂರ್ಣಗೊಳಿಸಿ", "description": "ನಾರಿನೆಕ್ಸಸ್‌ನಲ್ಲಿ ಬಟ್ಟೆ ಮಾರ್ಪಾಡು ಮತ್ತು ಮೂಲ ಹೊಲಿಗೆ ಕಲೆ ಕೋರ್ಸ್ ಕಲಿಯಿರಿ.", "status": "not_started", "suggested_action": "ಕೋಲಿಂಗ್ ಹೊಲಿಗೆ ಪಟ್ಟಿ ಪರೀಕ್ಷಿಸಿ"},
                        {"id": "step-2", "title": "ಬ್ಲೌಸ್ ವಿನ್ಯಾಸ ಕಟಿಂಗ್ ಅಭ್ಯಾಸ ಮಾಡಿ", "description": "ಸುಧಾರಿತ ಕಟಿಂಗ್ ತಂತ್ರಗಳನ್ನು ಕಲಿಯಲು ವೃತ್ತಿಪರ ಬ್ಲೌಸ್ ಕಟಿಂಗ್ ಕೋರ್ಸ್‌ಗೆ ದಾಖಲಾಗಿ.", "status": "not_started", "suggested_action": "ವಾರಕ್ಕೆ 2 ಮಾದರಿ ಕತ್ತರಿಸುವುದನ್ನು ಅಭ್ಯಾಸ ಮಾಡಿ"},
                        {"id": "step-3", "title": "ಮನೆ ವ್ಯಾಪಾರ ಬಂಡವಾಳ ಲೆಕ್ಕ ಕಲಿಯಿರಿ", "description": "ಸಣ್ಣ ಉದ್ಯಮಗಳ ಬಂಡವಾಳ ಮತ್ತು ಸರಳ ಬುಕ್ಕೀಪಿಂಗ್ ತರಬೇತಿಯನ್ನು ಪೂರ್ಣಗೊಳಿಸಿ.", "status": "not_started", "suggested_action": "ನಿಮ್ಮ ದಿನನಿತ್ಯದ ಬಜೆಟ್ ಲೆಕ್ಕವನ್ನು ಬರೆಯಿರಿ"},
                        {"id": "step-4", "title": "ಸ್ಥಳೀಯವಾಗಿ ಮಾದರಿ ಪ್ರದರ್ಶಿಸಿ", "description": "ನಿಮ್ಮ ನೆರೆಹೊರೆಯವರಿಗೆ ಹೊಲಿಗೆ ಉಚಿತ ಸ್ಯಾಂಪಲ್ ವಿನ್ಯಾಸ ತೋರಿಸಿ ಪ್ರಚಾರ ಮಾಡಿ.", "status": "not_started", "suggested_action": "ಮನೆಯ ಮುಂದೆ ಸಣ್ಣ ಬೋರ್ಡ್ ಹಾಕಿ"}
                    ]
                else:
                    steps = [
                        {"id": "step-1", "title": "ಮೂಲ ಕಂಪ್ಯೂಟರ್ ಕೌಶಲ್ಯ ಕಲಿಯಿರಿ", "description": "ನಾರಿನೆಕ್ಸಸ್‌ನಲ್ಲಿ ಮಹಿಳಾ ಉದ್ಯಮಿಗಳಿಗಾಗಿ ಮೂಲ ಕಂಪ್ಯೂಟರ್ ಶಿಕ್ಷಣ ಕೋರ್ಸ್‌ಗೆ ಸೇರಿ.", "status": "not_started", "suggested_action": "ದಿನಕ್ಕೆ 1 ಅಧ್ಯಾಯ ಕಲಿಯಿರಿ"},
                        {"id": "step-2", "title": "ಸುರಕ್ಷಿತ ಡಿಜಿಟಲ್ ಪಾವತಿ ಅಳವಡಿಸಿ", "description": "ಮೊಬೈಲ್ ವಾಲೆಟ್‌ಗಳು ಮತ್ತು ಯುಪಿಐ ಸುರಕ್ಷಿತ ಬಳಕೆ ತರಬೇತಿಯನ್ನು ಮುಗಿಸಿ.", "status": "not_started", "suggested_action": "ಡೆಮೊ ಹಣ ವರ್ಗಾವಣೆ ಅಭ್ಯಾಸ ಮಾಡಿ"},
                        {"id": "step-3", "title": "ಸಣ್ಣ ಉದ್ಯಮ ಬುಕೀಪಿಂಗ್ ಕಲಿಯಿರಿ", "description": "ಲೆಕ್ಕ ಪುಸ್ತಕ ಬರೆಯುವ ವಿಧಾನ ಮತ್ತು ಆರ್ಥಿಕ ನಂಬಿಕೆ ಹೆಚ್ಚಿಸುವ ಕೋರ್ಸ್ ಮುಗಿಸಿ.", "status": "not_started", "suggested_action": "ನಮೂನೆ ಲೆಕ್ಕಪತ್ರ ಪಟ್ಟಿಯನ್ನು ಪರಿಶೀಲಿಸಿ"},
                        {"id": "step-4", "title": "ಸ್ಥಳೀಯ ಕೇಂದ್ರಕ್ಕೆ ಭೇಟಿ ನೀಡಿ", "description": "ಗ್ರಾಮ ಪಂಚಾಯತ್ ಸಾಮಾನ್ಯ ಸೇವಾ ಕೇಂದ್ರದಲ್ಲಿ ಸಹಾಯಕ ಹುದ್ದೆಗೆ ವಿಚಾರಿಸಿ.", "status": "not_started", "suggested_action": "ನಿಮ್ಮ ಕೌಶಲ್ಯ ಪತ್ರವನ್ನು ಕೊಆರ್ಡಿನೇಟರ್‌ಗೆ ಸಲ್ಲಿಸಿ"}
                    ]
            elif lang == "hi":
                if is_tailoring:
                    steps = [
                        {"id": "step-1", "title": "सिलाई बुनियादी कोर्स पूरा करें", "description": "नारीनेक्सस पर गारमेंट अल्टरेशन और नीडलवर्क कोर्स से बुनियादी सिलाई की शुरुआत करें।", "status": "not_started", "suggested_action": "हर सिलाई पैटर्न का २ बार अभ्यास करें"},
                        {"id": "step-2", "title": "ब्लाउज कटिंग में विशेषज्ञता हासिल करें", "description": "प्रोफेशनल ब्लाउज कटिंग कोर्स से जटिल डिजाइनों और सिलाई की बारीकियों को सीखें।", "status": "not_started", "suggested_action": "कागज़ पर ब्लाउज डिजाइन काटने का अभ्यास करें"},
                        {"id": "step-3", "title": "छोटे व्यवसाय बहीखाता को समझें", "description": "छोटे व्यवसायों के लिए बुककीपिंग और वित्तीय नियंत्रण कोर्स पूरा करें।", "status": "not_started", "suggested_action": "एक सरल बहीखाता डायरी बनाएं"},
                        {"id": "step-4", "title": "घर पर सिलाई बुटीक सेटअप करें", "description": "अपने पड़ोसियों और मित्रों को अपनी सिलाई सेवाएं प्रदान करें और प्रचार शुरू करें।", "status": "not_started", "suggested_action": "अपने सिलाई कार्यों का फोटो पोर्टफोलियो बनाएं"}
                    ]
                else:
                    steps = [
                        {"id": "step-1", "title": "बेसिक कंप्यूटर साक्षरता विकसित करें", "description": "नारीनेक्सस पर महिला उद्यमियों के लिए कंप्यूटर बेसिक्स कोर्स पूरा करें।", "status": "not_started", "suggested_action": "कंप्यूटर कीबोर्ड शॉर्टकट्स का अभ्यास करें"},
                        {"id": "step-2", "title": "सुरक्षित ऑनलाइन भुगतान सीखें", "description": "डिजिटल वॉलेट्स और सुरक्षित यूपीआई पेमेंट्स के तरीकों को अच्छी तरह समझें।", "status": "not_started", "suggested_action": "धोखाधड़ी से सुरक्षा सम्बन्धी नियम पढ़ें"},
                        {"id": "step-3", "title": "व्यापार रिकॉर्ड बुक तैयार करना सीखें", "description": "छोटे व्यवसायों के लिए बहीखाता और बिल बुक तैयार करने की विधि समझें।", "status": "not_started", "suggested_action": "दैनिक खर्चों को डिजिटली रिकॉर्ड करना शुरू करें"},
                        {"id": "step-4", "title": "निकटतम सामान्य सेवा केंद्र से जुड़ें", "description": "अपने नजदीकी नारीनेक्सस कोऑर्डिनेटर या सेवा केंद्र से संभावित कार्यों की चर्चा करें।", "status": "not_started", "suggested_action": "अपना क्रेडेंशियल प्रोफाइल सबमिट करें"}
                    ]
            else:
                if is_tailoring:
                    steps = [
                        {"id": "step-1", "title": "Master Stitching Fundamentals", "description": "Enroll in the Garment Alterations & Needlework Basics course on NariNexus.", "status": "not_started", "suggested_action": "Practice stitching straight lines & standard seams daily"},
                        {"id": "step-2", "title": "Acquire Custom Pattern Cutting Skills", "description": "Complete the Professional Blouse Pattern Cutting module to learn customized fitting.", "status": "not_started", "suggested_action": "Create 2 mock paper cut-outs weekly"},
                        {"id": "step-3", "title": "Learn Financial Bookkeeping", "description": "Complete the Bookkeeping & Financial Health module for small businesses.", "status": "not_started", "suggested_action": "Prepare a mock business ledger"},
                        {"id": "step-4", "title": "Set Up Home Design Studio", "description": "Organize a dedicated sewing station and perform custom alterations to gain referrals.", "status": "not_started", "suggested_action": "Take photos of completed custom stitches to build a mini-portfolio"}
                    ]
                else:
                    steps = [
                        {"id": "step-1", "title": "Acquire Foundational Computer Skills", "description": "Complete the Computer Basics for Women Entrepreneurs course on NariNexus.", "status": "not_started", "suggested_action": "Practice basic typing and system navigation 30 minutes a day"},
                        {"id": "step-2", "title": "Implement Secure Digital Payments", "description": "Enroll in the Secure Mobile Payments & Digital Wallets course to understand secure transactions.", "status": "not_started", "suggested_action": "Test receiving a transaction in merchant demo mode"},
                        {"id": "step-3", "title": "Understand Micro-Enterprise Records", "description": "Master simple bookkeeping practices for maintaining transparent local client ledgers.", "status": "not_started", "suggested_action": "Create a practice Excel or paper-ledger catalog"},
                        {"id": "step-4", "title": "Inquire at Local Village Center", "description": "Connect with your nearest Common Service Centre coordinator for apprentice assistant listings.", "status": "not_started", "suggested_action": "Present your completed course certificates"}
                    ]

        # Neutralize any deceptive absolute claims in fallback or AI-generated steps
        steps = AISafetyService._neutralize_employment_claims(steps)

        # 3. Save to action plans store
        new_plan = {
            "opportunity_id": opp_id,
            "opportunity_title": opp_title,
            "goal": goal or "Independent Micro-business / Employment",
            "steps": steps,
            "updated_at": datetime.utcnow().isoformat()
        }
        plans[user_id] = new_plan
        save_action_plans(plans)

        return {
            "success": True,
            "action_plan": new_plan,
            "language": lang
        }

    @classmethod
    def update_action_plan_step(cls, user_id: str, step_id: str, status: str) -> Dict[str, Any]:
        """
        Updates the completion status of a specific action step. Ensures strict learner isolation.
        """
        if status not in ["not_started", "in_progress", "completed"]:
            return {"success": False, "message": "Invalid step status"}

        plans = load_action_plans()
        user_plan = plans.get(user_id)
        if not user_plan:
            return {"success": False, "message": "Action plan not found for user"}

        updated = False
        for step in user_plan.get("steps", []):
            if step.get("id") == step_id:
                step["status"] = status
                updated = True
                break

        if not updated:
            return {"success": False, "message": "Step not found in action plan"}

        user_plan["updated_at"] = datetime.utcnow().isoformat()
        plans[user_id] = user_plan
        save_action_plans(plans)

        return {
            "success": True,
            "action_plan": user_plan
        }
