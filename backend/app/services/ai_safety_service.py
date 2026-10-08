import re
import time
import logging
from typing import Dict, Any, List, Optional
from fastapi import HTTPException, status
from backend.app.services.course_service import CourseService
from backend.app.services.skill_service import SkillService
from backend.app.services.enrollment_service import EnrollmentService
from backend.app.services.progress_service import ProgressService
from backend.app.core.database import db_instance

logger = logging.getLogger("narinexus.ai.safety")

# In-memory rate limiting dictionary: maps user_id -> List of timestamps
_ai_request_timestamps: Dict[str, List[float]] = {}

class AISafetyService:
    """
    Reusable AI Safety, Guard, and Response Validation Layer for NariNexus.
    Secures input validation, prompt injection defense, sensitive-data scrubbers,
    recommendation sanity checks, and fail-safe multiligual recovery.
    """

    @classmethod
    def _apply_file_rate_limit(cls, user_id: str, limit: int, window_seconds: int, now: float):
        global _ai_request_timestamps
        timestamps = _ai_request_timestamps.get(user_id, [])
        timestamps = [t for t in timestamps if now - t < window_seconds]
        
        try:
            with open("/tmp/rate_limit_debug.log", "a") as f:
                f.write(f"In-memory: user_id={user_id}, existing_count={len(timestamps)}, current_list={timestamps}\n")
        except Exception:
            pass
            
        if len(timestamps) >= limit:
            logger.warning(f"Rate limit exceeded for user={user_id}. Attempted request count={len(timestamps)}")
            try:
                with open("/tmp/rate_limit_debug.log", "a") as f:
                    f.write(f"In-memory Limit Exceeded for {user_id}! Raising 429...\n")
            except Exception:
                pass
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="You are sending too many requests. Please wait a few seconds and try again."
            )
            
        timestamps.append(now)
        _ai_request_timestamps[user_id] = timestamps

    @classmethod
    def apply_rate_limit(cls, user_id: str, limit: int = 5, window_seconds: int = 120):
        """
        Lightweight persistent sliding window rate limiter to prevent request flooding on AI endpoints.
        """
        try:
            with open("/tmp/rate_limit_debug.log", "a") as f:
                f.write(f"apply_rate_limit called: user_id={user_id}, limit={limit}, window_seconds={window_seconds}\n")
        except Exception:
            pass
            
        if not user_id:
            try:
                with open("/tmp/rate_limit_debug.log", "a") as f:
                    f.write("user_id is empty, skipping rate limit!\n")
            except Exception:
                pass
            return
            
        now = time.time()
        db = db_instance.get_db()
        
        if db is not None:
            try:
                # Find or initialize user rate limit doc
                record = db["rate_limits"].find_one({"user_id": user_id})
                timestamps = record.get("timestamps", []) if record else []
                # Filter out older timestamps
                timestamps = [t for t in timestamps if now - t < window_seconds]
                
                try:
                    with open("/tmp/rate_limit_debug.log", "a") as f:
                        f.write(f"MongoDB connected. Existing timestamps count={len(timestamps)}\n")
                except Exception:
                    pass
                
                if len(timestamps) >= limit:
                    logger.warning(f"Rate limit exceeded for user={user_id}. Attempted request count={len(timestamps)}")
                    try:
                        with open("/tmp/rate_limit_debug.log", "a") as f:
                            f.write("Rate limit exceeded! Raising HTTPException 429...\n")
                    except Exception:
                        pass
                    raise HTTPException(
                        status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                        detail="You are sending too many requests. Please wait a few seconds and try again."
                    )
                
                timestamps.append(now)
                db["rate_limits"].update_one(
                    {"user_id": user_id},
                    {"$set": {"timestamps": timestamps, "updated_at": now}},
                    upsert=True
                )
                return
            except HTTPException:
                raise
            except Exception as e:
                logger.error(f"MongoDB rate limiting failed: {str(e)}. Executing JSON fallback.")
                try:
                    with open("/tmp/rate_limit_debug.log", "a") as f:
                        f.write(f"MongoDB failed: {str(e)}. Falling through to memory fallback...\n")
                except Exception:
                    pass
                # Fall through to JSON file rate limit
                
        try:
            with open("/tmp/rate_limit_debug.log", "a") as f:
                f.write("Executing in-memory fallback...\n")
        except Exception:
            pass
        cls._apply_file_rate_limit(user_id, limit, window_seconds, now)

    @classmethod
    def validate_input(cls, message: str) -> str:
        """
        Validates basic datatype, structure, and length limits of the user's AI query.
        """
        if not isinstance(message, str):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid input format. Question must be a text string."
            )
        
        cleaned = message.strip()
        if not cleaned:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Message content cannot be empty."
            )
            
        if len(cleaned) > 2000:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Message exceeds length limit of 2000 characters."
            )
        return cleaned

    @classmethod
    def sanitize_input(cls, message: str) -> str:
        """
        Detects prompt injection attempts (instructions override, secrets extraction, etc.)
        and blocks or sanitizes malicious triggers.
        """
        lower_msg = message.lower()
        
        # 1. Prohibited prompt injection attack indicators
        # Support flexible combinations
        if "ignore" in lower_msg and "instruction" in lower_msg:
            logger.warning("Prompt injection pattern: ignore + instruction")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Problematic request detected. Please focus your question on skills, courses, or micro-business options on NariNexus."
            )

        if "system" in lower_msg and ("prompt" in lower_msg or "instruction" in lower_msg):
            logger.warning("Prompt injection pattern: system + prompt/instruction")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Problematic request detected. Please focus your question on skills, courses, or micro-business options on NariNexus."
            )

        if "reveal" in lower_msg and ("prompt" in lower_msg or "instruction" in lower_msg or "system" in lower_msg):
            logger.warning("Prompt injection pattern: reveal + prompt/instruction/system")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Problematic request detected. Please focus your question on skills, courses, or micro-business options on NariNexus."
            )

        # Keywords check with flexibility (both underscores and spaces)
        injection_keywords = [
            "api_key", "api key", "gemini_api_key", "gemini api key",
            "database_password", "database password", "db_password", "db password",
            "mongodb_password", "mongodb password", "secret_key", "secret key"
        ]
        for kw in injection_keywords:
            if kw in lower_msg:
                logger.warning(f"Prompt injection pattern detected: '{kw}'")
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Problematic request detected. Please focus your question on skills, courses, or micro-business options on NariNexus."
                )
        
        # 2. Prevent dangerous executable injections or tags
        cleaned = re.sub(r"<script.*?>.*?</script>", "", message, flags=re.IGNORECASE)
        cleaned = re.sub(r"javascript:", "", cleaned, flags=re.IGNORECASE)
        return cleaned.strip()

    @classmethod
    def sensitive_data_filter(cls, text: str) -> str:
        """
        Detects and redacts any accidential sensitive information (JWT, API Keys, connection strings)
        from both prompts and AI models response text.
        """
        if not text:
            return text
            
        # Redact potential JWT structures (eyJ...)
        jwt_pattern = r"ey[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*"
        text = re.sub(jwt_pattern, "[REDACTED_JWT_TOKEN]", text)

        # Redact raw MongoDB connection credentials
        db_pattern = r"mongodb\+srv://[^:\s]+:[^@\s]+@[^\s]+"
        text = re.sub(db_pattern, "[REDACTED_DB_CONNECTION]", text)

        # Redact key/secret patterns
        secret_patterns = [
            r"(?i)(api[-_]key|secret[-_]key|password|passphrase|mongodb[-_]pass|db[-_]pass)\s*[:=]\s*[^\s'\"]+"
        ]
        for pattern in secret_patterns:
            text = re.sub(pattern, r"\1: [REDACTED]", text)

        return text

    @classmethod
    def validate_ai_response(cls, response_dict: Dict[str, Any], feature_type: str, user_id: str = None) -> Dict[str, Any]:
        """
        Validates response keys, types, structure, and ensures recommendations map to REAL
        platform entries, respects completed course exclusions, and mitigates deceptive job claims.
        """
        if not isinstance(response_dict, dict):
            logger.error(f"Response validation failed: expected dict, got {type(response_dict)}")
            return cls.safe_fallback(feature_type, "en") # type: ignore

        # 1. Neutralize guaranteed employment or vacant positions claims
        response_dict = cls._neutralize_employment_claims(response_dict)

        # 2. Perform catalog checks and filters for specific structures
        if feature_type == "skill_recommendation":
            skills = response_dict.get("recommended_skills", [])
            valid_skills = []
            
            # Fetch all real skill models
            real_skills = SkillService.get_skills()
            real_names = {s.get("name").lower(): s.get("name") for s in real_skills}
            real_ids = {s.get("id"): s.get("name") for s in real_skills}
            
            for sk in skills:
                name = sk.get("name", "")
                skill_id = sk.get("id", "")
                
                # Check if it corresponds to a real skill
                if skill_id in real_ids:
                    sk["name"] = real_ids[skill_id]
                    valid_skills.append(sk)
                elif name.lower() in real_names:
                    # Resolve to actual ID and correct casing
                    matched_name = real_names[name.lower()]
                    matched_id = [s.get("id") for s in real_skills if s.get("name") == matched_name][0]
                    sk["id"] = matched_id
                    sk["name"] = matched_name
                    valid_skills.append(sk)
                else:
                    logger.info(f"Filtered out non-existent AI recommended skill: {name} (id: {skill_id})")
                    
            response_dict["recommended_skills"] = valid_skills

        elif feature_type == "course_recommendation":
            courses = response_dict.get("recommended_courses", [])
            valid_courses = []
            
            # Retrieve user completions to ensure exclusion rules are strictly preserved
            completed_ids = set()
            if user_id:
                try:
                    enrollments = EnrollmentService.get_learner_enrollments(user_id)
                    for e in enrollments:
                        course_id = e.get("course_id")
                        progress = ProgressService.get_course_progress(user_id, course_id)
                        if progress.get("progress_percentage", 0) >= 100 or e.get("status") == "completed":
                            completed_ids.add(course_id)
                except Exception as err:
                    logger.warning(f"Failed to query completed courses during validation: {str(err)}")

            # Fetch all real course models
            real_courses = CourseService.get_courses()
            real_ids = {c.get("id"): c for c in real_courses}
            real_titles = {c.get("title").lower(): c for c in real_courses}

            for cs in courses:
                cid = cs.get("id", "")
                title = cs.get("title", "")
                
                matched_course = None
                if cid in real_ids:
                    matched_course = real_ids[cid]
                elif title.lower() in real_titles:
                    matched_course = real_titles[title.lower()]
                
                if matched_course:
                    # Block completed courses
                    if matched_course.get("id") in completed_ids:
                        logger.info(f"Filtered out already completed course: {matched_course.get('id')}")
                        continue
                        
                    cs["id"] = matched_course.get("id")
                    cs["title"] = matched_course.get("title")
                    cs["description"] = matched_course.get("description")
                    valid_courses.append(cs)
                else:
                    logger.info(f"Filtered out non-existent AI recommended course: {title} (id: {cid})")

            response_dict["recommended_courses"] = valid_courses

        elif feature_type == "career_guidance":
            # For career paths, ensure recommended_learning matches real course IDs/Titles where possible
            real_courses = CourseService.get_courses()
            real_titles = [c.get("title") for c in real_courses]
            
            paths = response_dict.get("career_paths", [])
            for path in paths:
                learn_items = path.get("recommended_learning", [])
                valid_items = []
                for item in learn_items:
                    # Match or fallback to a close real course title
                    best_match = item
                    for real_title in real_titles:
                        if real_title.lower() in item.lower() or item.lower() in real_title.lower():
                            best_match = real_title
                            break
                    valid_items.append(best_match)
                path["recommended_learning"] = valid_items

            options = response_dict.get("entrepreneurship_options", [])
            for opt in options:
                learn_items = opt.get("recommended_learning", [])
                valid_items = []
                for item in learn_items:
                    best_match = item
                    for real_title in real_titles:
                        if real_title.lower() in item.lower() or item.lower() in real_title.lower():
                            best_match = real_title
                            break
                    valid_items.append(best_match)
                opt["recommended_learning"] = valid_items

        return response_dict

    @classmethod
    def sanitize_ai_response(cls, text: str) -> str:
        """
        Cleans plain text response output of chatbot from unexpected script tags or guaranteed claims.
        """
        if not text:
            return text
            
        # Clean up tags
        cleaned = re.sub(r"<script.*?>.*?</script>", "", text, flags=re.IGNORECASE)
        
        # Neutralize extreme job / income guarantees
        guarantees = [
            (r"(?i)you are guaranteed a job", "possible career pathway matching your profile"),
            (r"(?i)we guarantee a salary of (\d+)", "average estimated local income is around \\1"),
            (r"(?i)will definitely get a job", "can find excellent career opportunities"),
            (r"(?i)you are guaranteed to earn", "can explore potential earnings of"),
            (r"(?i)guaranteed job", "suggested job role"),
            (r"(?i)guaranteed salary", "potential average earnings range")
        ]
        
        for pattern, replacement in guarantees:
            cleaned = re.sub(pattern, replacement, cleaned)
            
        return cleaned

    @classmethod
    def _neutralize_employment_claims(cls, data: Any) -> Any:
        """
        Recursively neutralizes absolute employment guarantees or claims inside AI outputs.
        """
        if isinstance(data, dict):
            new_dict = {}
            for k, v in data.items():
                if isinstance(v, str):
                    # Replace absolute phrases with responsible career counseling terms
                    txt = re.sub(r"(?i)you will definitely get this job", "this is a possible career path matching your skills", v)
                    txt = re.sub(r"(?i)we guarantee employment", "we provide customized skills guidance to help you prepare", txt)
                    txt = re.sub(r"(?i)guaranteed job", "suggested job role", txt)
                    txt = re.sub(r"(?i)guaranteed salary", "potential average earnings range", txt)
                    txt = re.sub(r"(?i)will definitely get a job", "is a promising learning and work direction", txt)
                    txt = re.sub(r"(?i)ನಿಮಗೆ ಖಂಡಿತವಾಗಿಯೂ ಈ ಕೆಲಸ ಸಿಗುತ್ತದೆ", "ಇದು ನಿಮ್ಮ ಕೌಶಲ್ಯಗಳಿಗೆ ಹೊಂದುವ ಸಂಭಾವ್ಯ ವೃತ್ತಿ ಮಾರ್ಗವಾಗಿದೆ", txt)
                    txt = re.sub(r"(?i)ನಿಮಗೆ ಕೆಲಸದ ಖಾತರಿ ನೀಡುತ್ತೇವೆ", "ನಾವು ನಿಮಗೆ ಕಲಿಯಲು ಸಹಾಯ ಮಾಡುತ್ತೇವೆ", txt)
                    txt = re.sub(r"(?i)आपको निश्चित रूप से यह नौकरी मिलेगी", "यह आपकी रुचि के अनुकूल एक संभावित करियर पथ है", txt)
                    new_dict[k] = txt
                else:
                    new_dict[k] = cls._neutralize_employment_claims(v)
            return new_dict
        elif isinstance(data, list):
            return [cls._neutralize_employment_claims(item) for item in data]
        return data

    @classmethod
    def safe_fallback(cls, feature_type: str, lang: str = "en") -> Any:
        """
        Returns structured/unstructured fail-safe recovery responses matching the preferred language.
        """
        lang = lang.lower().strip()
        
        if feature_type == "chatbot":
            if lang == "kn":
                return "ಕ್ಷಮಿಸಿ, AI ಮಾರ್ಗದರ್ಶನ ಪ್ರಸ್ತುತ ಲಭ್ಯವಿಲ್ಲ. ದಯವಿಟ್ಟು ನಂತರ ಪ್ರಯತ್ನಿಸಿ."
            elif lang == "hi":
                return "क्षमा करें, AI मार्गदर्शन वर्तमान में उपलब्ध नहीं है। कृपया बाद में पुनः प्रयास करें।"
            else:
                return "AI guidance is temporarily unavailable. Please try again later."
                
        elif feature_type == "skill_recommendation":
            # Real deterministic skill fallbacks
            if lang == "kn":
                return {
                    "success": True,
                    "recommended_skills": [
                        {"id": "computer-literacy", "name": "ಡಿಜಿಟಲ್ ಸಾಕ್ಷರತೆ", "reason": "ಕಂಪ್ಯೂಟರ್ ತರಬೇತಿಯು ಸ್ವಯಂ ಉದ್ಯೋಗಕ್ಕೆ ಮೂಲಭೂತ ಅವಶ್ಯಕತೆಯಾಗಿದೆ."},
                        {"id": "basic-stitching", "name": "ಮೂಲ ಹೊಲಿಗೆ", "reason": "ಸ್ಥಳೀಯ ಬಟ್ಟೆ ಉದ್ಯಮ ಮತ್ತು ಸ್ವಯಂ ಉದ್ಯೋಗಕ್ಕೆ ಉತ್ತಮ ಬೇಡಿಕೆಯಿದೆ."}
                    ],
                    "language": "kn"
                }
            elif lang == "hi":
                return {
                    "success": True,
                    "recommended_skills": [
                        {"id": "computer-literacy", "name": "डिजिटल साक्षरता", "reason": "कंप्यूटर साक्षरता छोटे व्यापार शुरू करने के लिए अत्यंत महत्वपूर्ण है।"},
                        {"id": "basic-stitching", "name": "बुनियादी सिलाई", "reason": "स्थानीय स्तर पर गारमेंट व्यवसाय शुरू करने के लिए उपयुक्त कौशल है।"}
                    ],
                    "language": "hi"
                }
            else:
                return {
                    "success": True,
                    "recommended_skills": [
                        {"id": "computer-literacy", "name": "Digital Literacy", "reason": "Foundational computing skills are highly recommended for modern workspaces."},
                        {"id": "basic-stitching", "name": "Basic Stitching", "reason": "Highly stable local work demand in apparel and design."}
                    ],
                    "language": "en"
                }
                
        elif feature_type == "course_recommendation":
            # Real course fallbacks matching real catalog
            if lang == "kn":
                return {
                    "success": True,
                    "recommended_courses": [
                        {"id": "computer-basics-entrepreneurs", "title": "ಮಹಿಳಾ ಉದ್ಯಮಿಗಳಿಗಾಗಿ ಮೂಲ ಕಂಪ್ಯೂಟರ್ ಶಿಕ್ಷಣ", "reason": "ಮೂಲ ಕಂಪ್ಯೂಟರ್ ಬಳಕೆಯನ್ನು ಕಲಿಯಲು ಅತ್ಯುತ್ತಮ ಆರಂಭಿಕ ಕೋರ್ಸ್."},
                        {"id": "garment-alterations-basics", "title": "ಬಟ್ಟೆ ಮಾರ್ಪಾಡುಗಳು ಮತ್ತು ಮೂಲ ಹೊಲಿಗೆ ಕಲೆ", "reason": "ಮೂಲ ಕಟಿಂಗ್ ಮತ್ತು ಹೊಲಿಗೆ ಕೌಶಲ್ಯಗಳನ್ನು ಕಲಿಸುವ ಕೋರ್ಸ್."}
                    ],
                    "language": "kn"
                }
            elif lang == "hi":
                return {
                    "success": True,
                    "recommended_courses": [
                        {"id": "computer-basics-entrepreneurs", "title": "Computer Basics for Women Entrepreneurs", "reason": "कंप्यूटर साक्षरता और डिजिटल कौशल शुरू करने के लिए सर्वश्रेष्ठ बुनियादी कोर्स।"},
                        {"id": "garment-alterations-basics", "title": "Garment Alterations & Needlework Basics", "reason": "सिलाई और सिलाई मशीन संचालन के लिए उपयुक्त आधारभूत कोर्स।"}
                    ],
                    "language": "hi"
                }
            else:
                return {
                    "success": True,
                    "recommended_courses": [
                        {"id": "computer-basics-entrepreneurs", "title": "Computer Basics for Women Entrepreneurs", "reason": "Perfect starting point for mastering core digital operations."},
                        {"id": "garment-alterations-basics", "title": "Garment Alterations & Needlework Basics", "reason": "Build highly stable practical skills with immediate local earning potential."}
                    ],
                    "language": "en"
                }

        elif feature_type == "career_guidance":
            # Guaranteed robust rule-based pathways
            if lang == "kn":
                return {
                    "success": True,
                    "career_paths": [{
                        "title": "ಸ್ಥಳೀಯ ಸಣ್ಣ ಉದ್ಯಮ ಸಹಾಯಕಿ",
                        "description": "ಸ್ಥಳೀಯ ಅಂಗಡಿಗಳು ಅಥವಾ ಕೃಷಿ ಉದ್ಯಮಗಳಲ್ಲಿ ದಾಖಲೆ ನಿರ್ವಹಣೆ.",
                        "why_suitable": "ವೃತ್ತಿಜೀವನವನ್ನು ಆರಂಭಿಸಲು ಅತ್ಯುತ್ತಮ ಪ್ರಾಯೋಗಿಕ ಅವಕಾಶ.",
                        "required_skills": ["ಸಂವಹನ ಕೌಶಲ್ಯ", "ದಾಖಲೆ ನಿರ್ವಹಣೆ"],
                        "existing_skills": [],
                        "skill_gaps": ["ಮೂಲ ಕಂಪ್ಯೂಟರ್ ಕೌಶಲ್ಯ"],
                        "recommended_learning": ["Computer Basics for Women Entrepreneurs"],
                        "next_steps": ["ನಾರಿನೆಕ್ಸಸ್‌ನಲ್ಲಿ ಕಂಪ್ಯೂಟರ್ ಕೋರ್ಸ್ ಸೇರಿ"]
                    }],
                    "entrepreneurship_options": [{
                        "title": "ಮನೆ ಆಧಾರಿತ ಸಣ್ಣ ಹೊಲಿಗೆ ಮಳಿಗೆ",
                        "description": "ಮನೆಯಲ್ಲೇ ಸಣ್ಣ ಬಟ್ಟೆ ಬದಲಾವಣೆ ಮತ್ತು ಹೊಲಿಗೆ ಕಾರ್ಯ ನಡೆಸುವುದು.",
                        "why_suitable": "ಕನಿಷ್ಠ ಹೂಡಿಕೆಯೊಂದಿಗೆ ಮನೆಯಿಂದಲೇ ಆದಾಯ ಗಳಿಸುವ ಅತ್ಯುತ್ತಮ ಮಾರ್ಗ.",
                        "required_skills": ["ಹೊಲಿಗೆ ಯಂತ್ರ ಕಾರ್ಯಾಚರಣೆ"],
                        "existing_skills": [],
                        "skill_gaps": ["ವೃತ್ತಿಪರ ಬ್ಲೌಸ್ ಹೊಲಿಗೆ"],
                        "recommended_learning": ["Professional Blouse Pattern Cutting & Stitching"],
                        "next_steps": ["ಮೂಲ ಹೊಲಿಗೆ ಅಭ್ಯಾಸ ಮಾಡಿ", "ಸ್ಥಳೀಯ ಉಚಿತ ಕರಪತ್ರಗಳನ್ನು ಹಂಚಿ"]
                    }],
                    "general_advice": "ನಿಮ್ಮ ಕೌಶಲ್ಯ ಪ್ರೊಫೈಲ್ ಅನ್ನು ಪೂರ್ಣಗೊಳಿಸಿ. ಇದು ನಿಮಗೆ ಹೆಚ್ಚು ಸೂಕ್ತವಾದ ವೃತ್ತಿ ಸಲಹೆ ನೀಡಲು ಸಹಾಯ ಮಾಡುತ್ತದೆ.",
                    "language": "kn"
                }
            elif lang == "hi":
                return {
                    "success": True,
                    "career_paths": [{
                        "title": "स्थानीय लघु व्यवसाय सहायक",
                        "description": "स्थानीय दुकानों या सहकारी समितियों में बहीखाता और बिलिंग कार्य का प्रबंधन।",
                        "why_suitable": "यह एक व्यावहारिक शुरुआत है जिसके लिए विशेष डिग्री की आवश्यकता नहीं होती।",
                        "required_skills": ["व्यवसाय नियोजन", "बुनियादी रिकॉर्ड रखना"],
                        "existing_skills": [],
                        "skill_gaps": ["कम्प्यूटर साक्षरता"],
                        "recommended_learning": ["Computer Basics for Women Entrepreneurs"],
                        "next_steps": ["कंप्यूटर बेसिक्स कोर्स से सीखने की शुरुआत करें"]
                    }],
                    "entrepreneurship_options": [{
                        "title": "गृह आधारित बुटीक और सिलाई व्यवसाय",
                        "description": "घर पर सिलाई मशीन लगाकर कपड़े सुधारने और डिजाइनिंग का काम शुरू करना।",
                        "why_suitable": "स्वरोजगार के द्वारा घर से कमाने का एक सुरक्षित विकल्प।",
                        "required_skills": ["सिलाई मशीन संचालन", "माप और कटाई"],
                        "existing_skills": [],
                        "skill_gaps": ["व्यावसायिक बहीखाता"],
                        "recommended_learning": ["Simple Bookkeeping & Financial Health for Small Business"],
                        "next_steps": ["पड़ोसियों के साधारण कपड़े सुधार कर शुरुआत करें"]
                    }],
                    "general_advice": "बेहतर मार्गदर्शन के लिए कृपया प्रोफाइल सेक्शन में अपनी पूरी जानकारी भरें।",
                    "language": "hi"
                }
            else:
                return {
                    "success": True,
                    "career_paths": [{
                        "title": "Micro-Business Assistant",
                        "description": "Manage billing, document filing, and administrative support for local retail shops.",
                        "why_suitable": "A practical first step requiring no previous office background.",
                        "required_skills": ["Communication", "Organized Records keeping"],
                        "existing_skills": [],
                        "skill_gaps": ["Computer Basics"],
                        "recommended_learning": ["Computer Basics for Women Entrepreneurs"],
                        "next_steps": ["Begin with foundational computing courses on NariNexus"]
                    }],
                    "entrepreneurship_options": [{
                        "title": "Home-Based Tailoring Boutique",
                        "description": "Establish a small scale bespoke tailoring shop from the comfort of your home.",
                        "why_suitable": "Enables micro-earnings with low overhead and capital investment.",
                        "required_skills": ["Basic Needlework", "Stitching basics"],
                        "existing_skills": [],
                        "skill_gaps": ["Simple Bookkeeping"],
                        "recommended_learning": ["Simple Bookkeeping & Financial Health for Small Business"],
                        "next_steps": ["Set up a clean, dedicated corner at home and test your skills locally"]
                    }],
                    "general_advice": "Completing more courses and filling out your profile will help tailor this roadmap further.",
                    "language": "en"
                }
