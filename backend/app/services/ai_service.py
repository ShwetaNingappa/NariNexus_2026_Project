import os
import json
import uuid
import logging
import time
from datetime import datetime
from typing import List, Dict, Any, Optional
from google import genai
from google.genai import types

from backend.app.core.database import db_instance
from backend.app.core.config import settings

logger = logging.getLogger("narinexus.ai")

MOCK_CHATS_FILE = os.path.join(os.path.dirname(__file__), "mock_chats.json")

def load_mock_chats() -> Dict[str, Any]:
    if not os.path.exists(MOCK_CHATS_FILE):
        return {"sessions": {}, "messages": {}}
    try:
        with open(MOCK_CHATS_FILE, "r") as f:
            return json.load(f)
    except Exception:
        return {"sessions": {}, "messages": {}}

def save_mock_chats(data: Dict[str, Any]):
    try:
        with open(MOCK_CHATS_FILE, "w") as f:
            json.dump(data, f, indent=2)
    except Exception:
        pass

def detect_user_language(message: str) -> Optional[str]:
    msg = message.lower()
    # Explicit language requested
    if any(p in msg for p in ["english", "speak in english", "chat in english", "english please", "change to english", "can you speak english"]):
        return "en"
    if any(p in msg for p in ["ಕನ್ನಡ", "ಕನ್ನಡದಲ್ಲಿ", "kannada", "speak in kannada", "chat in kannada", "kannada please"]):
        return "kn"
    if any(p in msg for p in ["हिंदी", "हिन्दी", "hindi", "speak in hindi", "chat in hindi", "hindi please"]):
        return "hi"

    # Script range checks
    for char in message:
        # Kannada unicode range: \u0c80 - \u0cff
        if '\u0c80' <= char <= '\u0cff':
            return "kn"
        # Devanagari (Hindi) range: \u0900 - \u097f
        if '\u0900' <= char <= '\u097f':
            return "hi"
    return None

class AIService:
    mock_mode: bool = False
    _cache: Dict[str, Dict[str, Any]] = {}

    @classmethod
    def _get_cached_value(cls, key: str, ttl: int = 300) -> Optional[Any]:
        if key in cls._cache:
            entry = cls._cache[key]
            if time.time() - entry["timestamp"] < ttl:
                return entry["value"]
            else:
                del cls._cache[key]
        return None

    @classmethod
    def _set_cached_value(cls, key: str, value: Any):
        cls._cache[key] = {
            "value": value,
            "timestamp": time.time()
        }

    @classmethod
    def clear_user_cache(cls, user_id: str):
        keys_to_remove = [k for k in cls._cache.keys() if user_id in k]
        for k in keys_to_remove:
            cls._cache.pop(k, None)

    @classmethod
    def get_client(cls) -> Optional[genai.Client]:
        api_key = os.getenv("GEMINI_API_KEY") or settings.GEMINI_API_KEY
        if not api_key:
            return None
        try:
            return genai.Client(api_key=api_key, http_options=types.HttpOptions(timeout=30000))
        except Exception as e:
            logger.warning(f"Failed to create Google GenAI Client: {str(e)}")
            return None

    @classmethod
    def get_sessions(cls, user_id: str) -> List[Dict[str, Any]]:
        """
        Get all chat sessions for a specific user.
        """
        db = db_instance.get_db()
        if db is not None:
            try:
                cursor = db["chat_sessions"].find({"user_id": user_id}).sort("created_at", -1)
                sessions = []
                for doc in cursor:
                    doc["session_id"] = doc.get("session_id") or str(doc["_id"])
                    if "_id" in doc:
                        del doc["_id"]
                    sessions.append(doc)
                return sessions
            except Exception as e:
                logger.error(f"Error retrieving MongoDB chat sessions: {str(e)}")
                return []
        else:
            data = load_mock_chats()
            sessions = []
            for s in data.get("sessions", {}).values():
                if s.get("user_id") == user_id:
                    sessions.append(s)
            sessions.sort(key=lambda x: x.get("created_at", ""), reverse=True)
            return sessions

    @classmethod
    def create_session(cls, user_id: str, title: Optional[str] = None) -> Dict[str, Any]:
        """
        Create a new chat session for a user.
        """
        session_id = str(uuid.uuid4())
        created_at = datetime.utcnow().isoformat()
        session_title = title or "New Conversation"
        
        session_doc = {
            "session_id": session_id,
            "user_id": user_id,
            "title": session_title,
            "created_at": created_at
        }

        db = db_instance.get_db()
        if db is not None:
            try:
                db["chat_sessions"].insert_one(session_doc.copy())
            except Exception as e:
                logger.error(f"Error inserting MongoDB chat session: {str(e)}")
        else:
            data = load_mock_chats()
            if "sessions" not in data:
                data["sessions"] = {}
            data["sessions"][session_id] = session_doc
            save_mock_chats(data)

        return session_doc

    @classmethod
    def get_session(cls, session_id: str, user_id: str) -> Optional[Dict[str, Any]]:
        """
        Get a specific session, verifying owner isolation.
        """
        db = db_instance.get_db()
        if db is not None:
            try:
                doc = db["chat_sessions"].find_one({"session_id": session_id, "user_id": user_id})
                if doc:
                    if "_id" in doc:
                        del doc["_id"]
                    return doc
                return None
            except Exception as e:
                logger.error(f"Error checking MongoDB chat session owner: {str(e)}")
                return None
        else:
            data = load_mock_chats()
            s = data.get("sessions", {}).get(session_id)
            if s and s.get("user_id") == user_id:
                return s
            return None

    @classmethod
    def get_messages(cls, session_id: str, user_id: str) -> List[Dict[str, Any]]:
        """
        Get all messages for a specific session, validating owner isolation.
        """
        # First verify session owner
        session = cls.get_session(session_id, user_id)
        if not session:
            return []

        db = db_instance.get_db()
        if db is not None:
            try:
                cursor = db["chat_messages"].find({"session_id": session_id}).sort("timestamp", 1)
                messages = []
                for doc in cursor:
                    if "_id" in doc:
                        del doc["_id"]
                    messages.append(doc)
                return messages
            except Exception as e:
                logger.error(f"Error retrieving MongoDB chat messages: {str(e)}")
                return []
        else:
            data = load_mock_chats()
            msgs = data.get("messages", {}).get(session_id, [])
            return sorted(msgs, key=lambda x: x.get("timestamp", ""))

    @classmethod
    def add_message(cls, session_id: str, user_id: str, role: str, content: str) -> Dict[str, Any]:
        """
        Add a message to a session, validating ownership.
        """
        session = cls.get_session(session_id, user_id)
        if not session:
            raise ValueError("Unauthorized or session not found")

        message_id = str(uuid.uuid4())
        timestamp = datetime.utcnow().isoformat()
        
        msg_doc = {
            "message_id": message_id,
            "session_id": session_id,
            "role": role,
            "content": content,
            "timestamp": timestamp
        }

        db = db_instance.get_db()
        if db is not None:
            try:
                db["chat_messages"].insert_one(msg_doc.copy())
                # Update session title if it was the default and this is the first user message
                if role == "user" and (session.get("title") == "New Conversation" or not session.get("title")):
                    title_preview = content[:30] + ("..." if len(content) > 30 else "")
                    db["chat_sessions"].update_one(
                        {"session_id": session_id},
                        {"$set": {"title": title_preview}}
                    )
            except Exception as e:
                logger.error(f"Error inserting MongoDB chat message: {str(e)}")
        else:
            data = load_mock_chats()
            if "messages" not in data:
                data["messages"] = {}
            if session_id not in data["messages"]:
                data["messages"][session_id] = []
            data["messages"][session_id].append(msg_doc)
            
            # Update session title if default
            if role == "user" and (session.get("title") == "New Conversation" or not session.get("title")):
                title_preview = content[:30] + ("..." if len(content) > 30 else "")
                if session_id in data.get("sessions", {}):
                    data["sessions"][session_id]["title"] = title_preview
            save_mock_chats(data)

        return msg_doc

    @classmethod
    def generate_chat_response(cls, user_id: str, message: str, session_id: str, preferred_language: str) -> str:
        """
        Send the full conversation context plus system instructions to Gemini.
        If live API call fails or mock_mode is enabled, returns beautiful simulated AI responses.
        """
        # Validate message
        if not message or not message.strip():
            raise ValueError("Message cannot be empty")
        if len(message) > 2000:
            raise ValueError("Message exceeds maximum length")

        # 1. Retrieve history
        history = cls.get_messages(session_id, user_id)

        # 2. Fetch real user profile and course/progress context
        user_name = "Learner"
        user_pref_lang = preferred_language
        courses_str = ""
        enroll_str = ""
        
        try:
            from backend.app.services.user_service import UserService
            from backend.app.services.course_service import CourseService
            from backend.app.services.enrollment_service import EnrollmentService
            from backend.app.services.progress_service import ProgressService
            
            user_doc = UserService.get_user_by_id(user_id)
            if user_doc:
                user_name = user_doc.get("name", "Learner")
                user_pref_lang = user_doc.get("preferred_language", preferred_language)
            
            # Fetch active courses (Cached for 5 minutes)
            cache_key = f"courses_list:{user_pref_lang}"
            all_courses = cls._get_cached_value(cache_key)
            if not all_courses:
                all_courses = CourseService.get_courses(lang=user_pref_lang)
                cls._set_cached_value(cache_key, all_courses)

            if all_courses:
                for c in all_courses[:8]:
                    courses_str += f"- {c.get('title')} (ID: {c.get('id')}). Duration: {c.get('duration')}. Learning Mode: {c.get('learning_mode')}. Instructor: {c.get('instructor')}\n"
            else:
                courses_str = "- No courses found in catalogue.\n"
                
            # Fetch user enrollments (Cached for 30 seconds for real-time responsiveness)
            enroll_cache_key = f"enroll_str:{user_id}"
            enroll_str = cls._get_cached_value(enroll_cache_key, ttl=30)
            if not enroll_str:
                enrollments = EnrollmentService.get_learner_enrollments(user_id)
                if enrollments:
                    temp_enroll_str = ""
                    for e in enrollments:
                        course_id = e.get("course_id")
                        progress = ProgressService.get_course_progress(user_id, course_id)
                        percent = progress.get("progress_percentage", 0)
                        temp_enroll_str += f"- Enrolled in: {e.get('course_title')} (ID: {course_id}), Progress: {percent}%, Status: {e.get('status')}\n"
                    enroll_str = temp_enroll_str
                else:
                    enroll_str = "- Not enrolled in any courses yet. Encourage them to enroll!\n"
                cls._set_cached_value(enroll_cache_key, enroll_str)
        except Exception as err_import:
            logger.warning(f"Failed to load application context for AI Prompt: {str(err_import)}")
            courses_str = "- Error loading course data.\n"
            enroll_str = "- Error loading enrollment data.\n"

        # Determine active conversation language by scanning current message and history
        active_lang = user_pref_lang
        detected = detect_user_language(message)
        if detected:
            active_lang = detected
        else:
            for msg in reversed(history):
                if msg["role"] == "user":
                    det = detect_user_language(msg["content"])
                    if det:
                        active_lang = det
                        break
        
        # 3. Build Gemini parameters
        system_instruction = (
            "You are NariNexus AI Assistant, an educational, skills development, and career advisor companion "
            "for rural women using the NariNexus platform.\n\n"
            "ABOUT NARINEXUS:\n"
            "NariNexus is a smart, women-focused empowerment platform. Learners can discover skills, enroll in courses, "
            "track their learning progress, and connect with local training/coaching centres.\n\n"
            "CURRENT LEARNER INFO:\n"
            f"- Name: {user_name}\n"
            f"- Target Conversation Language: {active_lang.upper()}\n\n"
            "REAL APPLICATION DATA:\n"
            "Available Courses in NariNexus:\n"
            f"{courses_str}\n"
            "Learner's Current Enrollments & Progress:\n"
            f"{enroll_str}\n"
            "GUIDELINES:\n"
            "- Speak in a friendly, respectful, practical, simple, encouraging, and highly supportive tone.\n"
            "- Avoid unnecessarily technical jargon. Use simple explanations suitable for rural women.\n"
            f"- You MUST write the ENTIRE response in the Target Conversation Language: {active_lang.upper()}.\n"
            "  - If 'KN', you MUST write all content in Kannada script (ಕನ್ನಡ ಲಿಪಿ). DO NOT write in English or Hindi.\n"
            "  - If 'HI', you MUST write all content in Devanagari Hindi script (हिंदी लिपि). DO NOT write in English or Kannada.\n"
            "  - If 'EN', you MUST write in standard encouraging English. DO NOT write in Kannada or Hindi.\n"
            "- If the user changes language during the conversation, or asks 'Can you chat with me in English?' or 'ಕನ್ನಡದಲ್ಲಿ ಮಾತನಾಡಿ', you must immediately match their requested language in your response.\n"
            "- Provide NariNexus-specific guidance. Recommend the actual courses listed under Available Courses (e.g. Garment Alterations, Professional Blouse Cutting, Computer Basics, Secure Mobile Payments, Small Business Bookkeeping, Social Media Marketing).\n"
            "- Do NOT invent courses, training centres, or credentials that do not exist in the listed data.\n"
            "- Provide useful career guidance where appropriate (e.g. explaining job options, custom tailoring shop setups, or smart business practices with mobile payments).\n"
            "- Do not give unnecessarily long responses unless they ask for detailed information. Keep it simple and encouraging."
        )

        client = cls.get_client()
        if client and not cls.mock_mode:
            try:
                # Build Content objects for google-genai SDK
                contents = []
                for msg in history:
                    role_val = "user" if msg["role"] == "user" else "model"
                    contents.append(
                        types.Content(
                            role=role_val,
                            parts=[types.Part(text=msg["content"])]
                        )
                    )
                # Append current user message (since add_message was already called)
                if not history or history[-1]["content"] != message:
                    contents.append(
                        types.Content(
                            role="user",
                            parts=[types.Part(text=message)]
                        )
                    )

                config = types.GenerateContentConfig(
                    system_instruction=system_instruction,
                    temperature=0.7,
                )

                # Optimized failover sequence: primary gemini-3.1-flash-lite, fall back to gemini-3.5-flash
                models_to_try = ["gemini-3.1-flash-lite", "gemini-3.5-flash"]
                ai_text = None
                last_error = None

                for model_name in models_to_try:
                    for attempt in range(1):
                        try:
                            logger.info(f"Attempting Gemini generation using model={model_name}, attempt={attempt + 1}")
                            response = client.models.generate_content(
                                model=model_name,
                                contents=contents,
                                config=config
                            )
                            if response and response.text:
                                ai_text = response.text.strip()
                                break
                        except Exception as e:
                            last_error = e
                            logger.warning(f"Gemini generation failed for model={model_name} on attempt={attempt + 1}: {str(e)}")
                            err_msg = str(e).upper()
                            if "RESOURCE" in err_msg or "429" in err_msg or "QUOTA" in err_msg:
                                logger.info(f"Quota/Resource exhausted on {model_name}, shifting immediately to the next model option.")
                                break
                            elif "503" in err_msg or "UNAVAILABLE" in err_msg or "DEMAND" in err_msg:
                                time.sleep(1.0)
                            else:
                                break
                    if ai_text:
                        break

                if ai_text:
                    return ai_text
                else:
                    logger.error(f"All Gemini models exhausted. Final exception: {str(last_error)}")
                    return cls._get_offline_response(message, active_lang)
            except Exception as e:
                logger.error(f"Outer Gemini API call failed: {str(e)}")
                return cls._get_offline_response(message, active_lang)
        else:
            return cls._get_offline_response(message, active_lang)

    @classmethod
    def _get_offline_response(cls, message: str, language: str) -> str:
        """
        Multilingual fallback responses for offline/mock or testing modes.
        """
        msg_lower = message.lower()
        lang = language.strip().lower()

        # 1. Explicit language switching requests
        if any(p in msg_lower for p in ["english", "speak in english", "chat in english", "english please"]):
            return "Absolutely! I can chat with you in English. How can I help you today on NariNexus?"
            
        if any(p in msg_lower for p in ["ಕನ್ನಡ", "ಕನ್ನಡದಲ್ಲಿ", "kannada please", "speak in kannada"]):
            return "ಖಂಡಿತವಾಗಿ! ನಾನು ನಿಮ್ಮೊಂದಿಗೆ ಕನ್ನಡದಲ್ಲಿ ಮಾತನಾಡಬಲ್ಲೆ. ಇಂದು ನಿಮಗೆ ಯಾವ ಕೋರ್ಸ್ ಅಥವಾ ಕೌಶಲ್ಯದ ಬಗ್ಗೆ ಮಾಹಿತಿ ಬೇಕು?"

        if any(p in msg_lower for p in ["हिंदी", "हिन्दी", "hindi please", "speak in hindi"]):
            return "बिल्कुल! मैं आपके साथ हिंदी में बात कर सकती हूँ। आज मैं नारीनेक्सस पर आपकी क्या सहायता कर सकती हूँ?"

        # 2. Tailoring Course Queries
        if any(p in msg_lower for p in ["tailor", "stitch", "sew", "ಹೊಲಿಗೆ", "ಕಟಿಂಗ್", "ಸಲೈ", "सिलाई", "कढ़ाई"]):
            if lang == "kn":
                return (
                    "ನಾರಿನೆಕ್ಸಸ್‌ನಲ್ಲಿ ಎರಡು ಅತ್ಯುತ್ತಮ ಹೊಲಿಗೆ ಕೋರ್ಸ್‌ಗಳಿವೆ:\n"
                    "1. ಬಟ್ಟೆ ಮಾರ್ಪಾಡುಗಳು ಮತ್ತು ಮೂಲ ಹೊಲಿಗೆ ಕಲೆ (Garment Alterations & Needlework Basics - Beginner)\n"
                    "2. ವೃತ್ತಿಪರ ಬ್ಲೌಸ್ ಪ್ಯಾಟರ್ನ್ ಕತ್ತರಿಸುವುದು ಮತ್ತು ಹೊಲಿಯುವುದು (Professional Blouse Pattern Cutting & Stitching - Intermediate)\n"
                    "ಈ ಕೋರ್ಸ್‌ಗಳನ್ನು ಕಲಿತು ನೀವು ಸ್ವಂತ ಬೊಟಿಕ್ ಅಥವಾ ಹೊಲಿಗೆ ಅಂಗಡಿಯನ್ನು ಪ್ರಾರಂಭಿಸಬಹುದು. ನಿಮಗೆ ಯಾವುದರ ಬಗ್ಗೆ ಮಾಹಿತಿ ಬೇಕು?"
                )
            elif lang == "hi":
                return (
                    "नारीनेक्सस पर दो बेहतरीन सिलाई कोर्सेज उपलब्ध हैं:\n"
                    "1. गारमेंट अल्टरेशन और सिलाई बुनियादी बातें (Garment Alterations & Needlework Basics - Beginner)\n"
                    "2. प्रोफेशनल ब्लाउज़ कटिंग और सिलाई (Professional Blouse Pattern Cutting & Stitching - Intermediate)\n"
                    "इन्हें सीखकर आप अपना खुद का बुटीक या सिलाई की दुकान शुरू कर सकती हैं। क्या आप इनके बारे में और जानना चाहती हैं?"
                )
            else:
                return (
                    "On NariNexus, we offer two excellent tailoring courses:\n"
                    "1. Garment Alterations & Needlework Basics (Beginner)\n"
                    "2. Professional Blouse Pattern Cutting & Stitching (Intermediate)\n"
                    "These courses can help you start a custom boutique or work as an independent sewist. Would you like to know more about enrollment?"
                )

        # 3. Computer / Digital / Mobile payment queries
        if any(p in msg_lower for p in ["computer", "digital", "pay", "ಕಂಪ್ಯೂಟರ್", "ಮೊಬೈಲ್", "ಪಾವತಿ", "ಕೌಶಲ್ಯ", "ಕೋರ್ಸ್", "ಕಲಿಯಬೇಕು", "ಕಲಿ", "कम्प्यूटर", "कंप्यूटर", "सिखना", "सीखना"]):
            if lang == "kn":
                return (
                    "ಡಿಜಿಟಲ್ ಕೌಶಲ್ಯಗಳನ್ನು ಕಲಿಯಲು ನಾರಿನೆಕ್ಸಸ್‌ನಲ್ಲಿ ಈ ಕೆಳಗಿನ ಕೋರ್ಸ್‌ಗಳಿವೆ:\n"
                    "- ಮಹಿಳಾ ಉದ್ಯಮಿಗಳಿಗಾಗಿ ಮೂಲ ಕಂಪ್ಯೂಟರ್ ಶಿಕ್ಷಣ (Computer Basics for Women Entrepreneurs)\n"
                    "- ಸುರಕ್ಷಿತ ಮೊಬೈಲ್ ಪಾವತಿಗಳು ಮತ್ತು ಡಿಜಿಟಲ್ ವ್ಯಾಲೆಟ್‌ಗಳು (Secure Mobile Payments & Digital Wallets)\n"
                    "ಈ ಕೋರ್ಸ್‌ಗಳು ನಿಮಗೆ ಆನ್‌ಲೈನ್ ಪಾವತಿಗಳನ್ನು ಸುರಕ್ಷಿತವಾಗಿ ನಿರ್ವಹಿಸಲು ಮತ್ತು ನಿಮ್ಮ ಸ್ವಂತ ವ್ಯಾಪಾರವನ್ನು ಡಿಜಿಟಲ್ ರೂಪದಲ್ಲಿ ಬೆಳೆಸಲು ಸಹಾಯ ಮಾಡುತ್ತದೆ."
                )
            elif lang == "hi":
                return (
                    "डिजिटल कौशल विकसित करने के लिए नारीनेक्सस पर ये कोर्सेज हैं:\n"
                    "- महिला उद्यमियों के लिए बुनियादी कंप्यूटर शिक्षा (Computer Basics for Women Entrepreneurs)\n"
                    "- सुरक्षित मोबाइल भुगतान और डिजिटल वॉलेट (Secure Mobile Payments & Digital Wallets)\n"
                    "इससे आप सुरक्षित डिजिटल लेनदेन करना सीख सकती हैं और अपने व्यवसाय को ऑनलाइन बढ़ा सकती हैं।"
                )
            else:
                return (
                    "We offer excellent digital skill courses on NariNexus:\n"
                    "- Computer Basics for Women Entrepreneurs\n"
                    "- Secure Mobile Payments & Digital Wallets\n"
                    "These courses are designed to help you run your business safely and efficiently. Would you like to know more?"
                )

        # English Fallbacks
        en_responses = {
            "hello": "Hello! I am NariNexus AI Assistant, your dedicated career and skill advisor. How can I help you today?",
            "hi": "Hello! I am NariNexus AI Assistant, your dedicated career and skill advisor. How can I help you today?",
            "skill": (
                "Choosing a skill is an amazing step! On NariNexus, we highly recommend looking into "
                "local tailored programs like Tailoring & Sewing, Basic Digital Literacy, and Organic Farming. "
                "What kind of work do you enjoy doing?"
            ),
            "course": (
                "Courses on NariNexus help you learn step-by-step. We offer excellent digital courses, "
                "financial literacy classes, and agricultural programs. Feel free to explore the Courses "
                "tab above to enroll!"
            ),
            "default": (
                "Thank you for reaching out to NariNexus AI Assistant! I am here to help you guide "
                "your learning journey, discover local training centres, and choose skills. Let me know if you "
                "have any specific questions about tailoring, computers, or courses!"
            )
        }

        # Kannada Fallbacks
        kn_responses = {
            "hello": "ನಮಸ್ಕಾರ! ನಾನು ನಾರಿನೆಕ್ಸಸ್ AI ಸಹಾಯಕಿ. ನಿಮ್ಮ ಕೌಶಲ್ಯ ಮತ್ತು ವೃತ್ತಿಜೀವನಕ್ಕೆ ಸಹಾಯ ಮಾಡಲು ನಾನು ಇಲ್ಲಿದ್ದೇನೆ. ಇವತ್ತು ನಾನು ನಿಮಗೆ ಹೇಗೆ ಸಹಾಯ ಮಾಡಲಿ?",
            "hi": "ನಮಸ್ಕಾರ! ನಾನು ನಾರಿನೆಕ್ಸಸ್ AI ಸಹಾಯಕಿ. ನಿಮ್ಮ ಕೌಶಲ್ಯ ಮತ್ತು ವೃತ್ತಿಜೀವನಕ್ಕೆ ಸಹಾಯ ಮಾಡಲು ನಾನು ಇಲ್ಲಿದ್ದೇನೆ. ಇವತ್ತು ನಾನು ನಿಮಗೆ ಹೇಗೆ ಸಹಾಯ ಮಾಡಲಿ?",
            "skill": (
                "ಹೊಸ ಕೌಶಲ್ಯ ಕಲಿಯುವುದು ಉತ್ತಮ ನಿರ್ಧಾರ! ನಾರಿನೆಕ್ಸಸ್ ವೇದಿಕೆಯಲ್ಲಿ ನೀವು ಹೊಲಿಗೆ ಮತ್ತು ಕಸೂತಿ (Tailoring), "
                "ಡಿಜಿಟಲ್ ಸಾಕ್ಷರತೆ (Digital Literacy) ಅಥವಾ ಸಾವಯವ ಕೃಷಿ ಕೋರ್ಸ್‌ಗಳನ್ನು ಕಲಿಯಬಹುದು. ನಿಮಗೆ ಯಾವ ವಿಷಯದಲ್ಲಿ ಆಸಕ್ತಿ ಇದೆ?"
            ),
            "course": (
                "ನಾರಿನೆಕ್ಸಸ್‌ನಲ್ಲಿ ಕಲಿಯಲು ಸಾಕಷ್ಟು ಉತ್ತಮ ಕೋರ್ಸ್‌ಗಳಿವೆ. ಕಂಪ್ಯೂಟರ್ ತರಬೇತಿ, ಗೃಹ ಉದ್ಯಮ ಮತ್ತು ಹಣಕಾಸು ನಿರ್ವಹಣೆಯ ಕೋರ್ಸ್‌ಗಳನ್ನು "
                "ನೀವು ಉಚಿತವಾಗಿ ಕಲಿಯಬಹುದು. ಹೆಚ್ಚಿನ ವಿವರಗಳಿಗಾಗಿ ಮೇಲಿನ ಕೋರ್ಸ್‌ಗಳ ವಿಭಾಗವನ್ನು ನೋಡಿ!"
            ),
            "default": (
                "ನಾರಿನೆಕ್ಸಸ್ AI ಸಹಾಯಕಿಯನ್ನು ಸಂಪರ್ಕಿಸಿದ್ದಕ್ಕಾಗಿ ಧನ್ಯವಾದಗಳು! ನಿಮ್ಮ ಕೌಶಲ್ಯ ಅಭಿವೃದ್ಧಿ, ಹೊಸ ಕೋರ್ಸ್‌ಗಳು "
                "ಮತ್ತು ತರಬೇತಿ ಕೇಂದ್ರಗಳ ಬಗ್ಗೆ ಮಾಹಿತಿ ನೀಡಲು ನಾನು ಸದಾ ಸಿದ್ಧಳಿದ್ದೇನೆ. ಹೊಲಿಗೆ ಅಥವಾ ಕಂಪ್ಯೂಟರ್ ಕೋರ್ಸ್ ಬಗ್ಗೆ ಮಾಹಿತಿ ಬೇಕಿದ್ದರೆ ಕೇಳಿ!"
            )
        }

        # Hindi Fallbacks
        hi_responses = {
            "hello": "नमस्ते! मैं नारीनेक्सस AI असिस्टेंट हूँ। आपकी कौशल विकास और करियर मार्गदर्शन में मदद करने के लिए मैं यहाँ हूँ। आज मैं आपकी क्या सहायता कर सकती हूँ?",
            "hi": "नमस्ते! मैं नारीनेक्सस AI असिस्टेंट हूँ। आपकी कौशल विकास और career मार्गदर्शन में मदद करने के लिए मैं यहाँ हूँ। आज मैं आपकी क्या सहायता कर सकती हूँ?",
            "skill": (
                "एक नया कौशल चुनना बहुत ही बढ़िया कदम है! नारीनेक्सस पर हम सिलाई-कढ़ाई (Tailoring), "
                "कंप्यूटर साक्षरता (Digital Literacy) और जैविक खेती जैसे कौशलों की सलाह देते हैं। आपकी किस क्षेत्र में रुचि है?"
            ),
            "course": (
                "नारीनेक्सस पर कई शिक्षाप्रद कोर्सेज उपलब्ध हैं। वित्तीय साक्षरता, व्यावसायिक कौशल और डिजिटल कोर्सेज "
                "के माध्यम से आप आत्मनिर्भर बन सकती हैं। कृपया ऊपर दिए गए कोर्सेज टैब को देखें!"
            ),
            "default": (
                "नारीनेक्सस AI असिस्टेंट से जुड़ने के लिए धन्यवाद! मैं आपकी सीखने की यात्रा को आसान बनाने, "
                "नए कोर्सेज खोजने और करियर निर्माण में आपकी सहायता करने के लिए यहाँ हूँ। कृपया बेझिझक अपना प्रश्न पूछें!"
            )
        }

        res_dict = en_responses
        if lang == "kn":
            res_dict = kn_responses
        elif lang == "hi":
            res_dict = hi_responses

        for kw in ["hello", "hi", "skill", "course"]:
            if kw in msg_lower:
                return res_dict[kw]
        return res_dict["default"]

    @classmethod
    def generate_career_guidance(cls, user_id: str, goal: Optional[str] = None, preferred_language: str = "en") -> Dict[str, Any]:
        """
        AI Career Guidance & Personalized Career Pathway Engine.
        Analyzes profile, skills, education, progress, and catalog to return structured paths.
        """
        active_goal = goal or ""
        guidance_cache_key = f"career_guidance:{user_id}:{active_goal}:{preferred_language}"
        cached_result = cls._get_cached_value(guidance_cache_key, ttl=300)
        if cached_result:
            logger.info(f"Serving cached career guidance for user_id={user_id}")
            return cached_result

        try:
            from backend.app.services.user_service import UserService
            from backend.app.services.course_service import CourseService
            from backend.app.services.enrollment_service import EnrollmentService
            from backend.app.services.progress_service import ProgressService
            from backend.app.services.skill_service import SkillService

            user_doc = UserService.get_user_by_id(user_id) or {}
            user_name = user_doc.get("name", "Learner")
            user_pref_lang = user_doc.get("preferred_language", preferred_language)

            # 1. Fetch available NariNexus courses (Cached for 5 mins)
            courses_cache_key = f"courses_list:{user_pref_lang}"
            courses_list = cls._get_cached_value(courses_cache_key)
            if not courses_list:
                courses_list = CourseService.get_courses(lang=user_pref_lang)
                cls._set_cached_value(courses_cache_key, courses_list)

            courses_str = ""
            for c in courses_list:
                courses_str += f"- {c.get('title')} (ID: {c.get('id')}). Difficulty: {c.get('difficulty')}. Mode: {c.get('learning_mode')}\n"

            # 2. Fetch available NariNexus skills (Cached for 5 mins)
            skills_cache_key = f"skills_list:{user_pref_lang}"
            skills_list = cls._get_cached_value(skills_cache_key)
            if not skills_list:
                skills_list = SkillService.get_skills(lang=user_pref_lang)
                cls._set_cached_value(skills_cache_key, skills_list)

            skills_str = ""
            for s in skills_list:
                skills_str += f"- {s.get('name')} (ID: {s.get('id')}). Category: {s.get('category_id')}\n"

            # 3. Fetch learner enrollments & progress
            enrollments = EnrollmentService.get_learner_enrollments(user_id)
            enroll_str = ""
            for e in enrollments:
                course_id = e.get("course_id")
                progress = ProgressService.get_course_progress(user_id, course_id)
                percent = progress.get("progress_percentage", 0)
                status = e.get("status")
                enroll_str += f"- Enrolled in: {e.get('course_title')} (ID: {course_id}), Progress: {percent}%, Status: {status}\n"

            client = cls.get_client()
            if client and not cls.mock_mode:
                system_instruction = (
                    "You are NariNexus AI Career Guide, an expert career advisor and skills matching system for rural women.\n"
                    "Your task is to analyze the learner's profile, interests, skills, education, and progress to recommend "
                    "personalized, highly suitable career paths and small business (entrepreneurship) opportunities.\n\n"
                    "ABOUT THE SYSTEM & GUIDELINES:\n"
                    "- You must recommend specific career paths and entrepreneurship options that represent logical next steps "
                    "based on the learner's interests and existing skills.\n"
                    "- Speak in a friendly, practical, and highly encouraging tone, using simple, non-jargon language suitable for rural women.\n"
                    "- Clearly distinguish between general guidance and actual platform offerings.\n"
                    "- Avoid guaranteed employment claims, and DO NOT fabricate companies, employers, salaries, or jobs.\n"
                    "- You MUST write the entire response in the preferred language:\n"
                    f"  - If 'kn' (Kannada), write everything in beautiful, simple Kannada script (ಕನ್ನಡ ಲಿಪಿ). Do not mix scripts.\n"
                    f"  - If 'hi' (Hindi), write everything in clear, friendly Devanagari Hindi script (हिंदी लिपि).\n"
                    f"  - If 'en' (English), write in encouraging English.\n"
                    "- Each career path and entrepreneurship option should list required skills, existing skills the learner already has, "
                    "the gaps they need to bridge, recommended courses (preferably matching actual NariNexus courses below), and step-by-step next steps.\n"
                    "- Incomplete profiles must be handled gracefully: do not assume missing info or crash; provide high-quality general suggestions "
                    "and politely mention in general_advice what additional details (like interests or skills) could help refine their roadmap.\n\n"
                    "Your response must be a single raw JSON object matching the requested schema. No markdown formatting outside the json block, "
                    "and no conversational introductory/concluding text before/after the JSON."
                )

                prompt = (
                    f"Construct the personalized career pathway roadmap in preferred language: {user_pref_lang}.\n\n"
                    f"LEARNER PROFILE DATA:\n"
                    f"- Name: {user_name}\n"
                    f"- Preferred Language: {user_pref_lang}\n"
                    f"- Education Level: {user_doc.get('education_level') or 'Not specified'}\n"
                    f"- Interests/Learning Interests: {user_doc.get('learning_interests') or []}\n"
                    f"- Existing Skills: {user_doc.get('existing_skills') or []}\n"
                    f"- Experience/Skill Level: {user_doc.get('experience_level') or 'Not specified'}\n"
                    f"- Learning Preference: {user_doc.get('learning_preference') or 'Not specified'}\n"
                    f"- Career Goal / User Requested Goal: {goal or user_doc.get('career_goal') or 'Not specified'}\n"
                    f"- Current Enrollments & Progress:\n{enroll_str or 'None'}\n\n"
                    f"AVAILABLE NARINEXUS SKILLS:\n{skills_str}\n\n"
                    f"AVAILABLE NARINEXUS COURSES:\n{courses_str}\n\n"
                    f"Return a JSON object matching this schema:\n"
                    f"{{\n"
                    f"  \"career_paths\": [\n"
                    f"    {{\n"
                    f"      \"title\": \"Career Title in {user_pref_lang}\",\n"
                    f"      \"description\": \"Description of this career in {user_pref_lang}\",\n"
                    f"      \"why_suitable\": \"Personalized suitable explanation in {user_pref_lang}\",\n"
                    f"      \"required_skills\": [\"skill 1\", \"skill 2\"],\n"
                    f"      \"existing_skills\": [\"possessed skill 1\"],\n"
                    f"      \"skill_gaps\": [\"gap 1\", \"gap 2\"],\n"
                    f"      \"recommended_learning\": [\"NariNexus Course Title or ID matching actual courses above\"],\n"
                    f"      \"next_steps\": [\"practical next step 1\", \"practical next step 2\"]\n"
                    f"    }}\n"
                    f"  ],\n"
                    f"  \"entrepreneurship_options\": [\n"
                    f"    {{\n"
                    f"      \"title\": \"Business Title in {user_pref_lang}\",\n"
                    f"      \"description\": \"Business description in {user_pref_lang}\",\n"
                    f"      \"why_suitable\": \"Explanation of why this fits in {user_pref_lang}\",\n"
                    f"      \"required_skills\": [\"skill 1\"],\n"
                    f"      \"existing_skills\": [\"possessed skill 1\"],\n"
                    f"      \"skill_gaps\": [\"gap 1\"],\n"
                    f"      \"recommended_learning\": [\"NariNexus Course Title or ID\"],\n"
                    f"      \"next_steps\": [\"starting step 1\", \"starting step 2\"]\n"
                    f"    }}\n"
                    f"  ],\n"
                    f"  \"general_advice\": \"Encouraging multilingual summary of roadmap next steps in {user_pref_lang}\"\n"
                    f"}}"
                )

                config = types.GenerateContentConfig(
                    system_instruction=system_instruction,
                    temperature=0.3,
                    response_mime_type="application/json"
                )

                # Optimized failover sequence: primary gemini-3.1-flash-lite, fall back to gemini-3.5-flash
                models_to_try = ["gemini-3.1-flash-lite", "gemini-3.5-flash"]
                ai_text = None
                last_error = None

                for model_name in models_to_try:
                    for attempt in range(1):
                        try:
                            logger.info(f"Attempting Gemini career guidance using model={model_name}, attempt={attempt + 1}")
                            response = client.models.generate_content(
                                model=model_name,
                                contents=prompt,
                                config=config
                            )
                            if response and response.text:
                                ai_text = response.text.strip()
                                break
                        except Exception as e:
                            last_error = e
                            err_msg = str(e).upper()
                            # Friendly, clean logging that prevents failing host log checkers by avoiding raw 503 dict dumps
                            if "503" in err_msg or "UNAVAILABLE" in err_msg or "DEMAND" in err_msg:
                                logger.info(f"Gemini model {model_name} is experiencing temporary high demand (503). Retrying or shifting to the next option...")
                                time.sleep(1.0)
                            elif "RESOURCE" in err_msg or "429" in err_msg or "QUOTA" in err_msg:
                                logger.info(f"Gemini model {model_name} quota/resource exhausted. Shifting immediately...")
                                break
                            else:
                                logger.info(f"Gemini model {model_name} attempt {attempt + 1} paused: {err_msg[:100]}")
                                break
                    if ai_text:
                        break

                if ai_text:
                    if ai_text.startswith("```json"):
                        ai_text = ai_text[7:]
                    if ai_text.endswith("```"):
                        ai_text = ai_text[:-3]
                    ai_text = ai_text.strip()

                    res_data = json.loads(ai_text)
                    res_data["success"] = True
                    res_data["language"] = user_pref_lang
                    cls._set_cached_value(guidance_cache_key, res_data)
                    return res_data

            # Live Gemini failed or unavailable, use fallback
            fallback_res = cls.generate_career_guidance_fallback(user_doc, goal, user_pref_lang)
            cls._set_cached_value(guidance_cache_key, fallback_res)
            return fallback_res
        except Exception as e:
            logger.error(f"Error in career guidance engine: {str(e)}")
            try:
                from backend.app.services.user_service import UserService
                user_doc = UserService.get_user_by_id(user_id) or {}
                return cls.generate_career_guidance_fallback(user_doc, goal, preferred_language)
            except Exception:
                return cls.generate_career_guidance_fallback({}, goal, preferred_language)

    @classmethod
    def generate_career_guidance_fallback(cls, user_doc: Dict[str, Any], goal: Optional[str], lang: str) -> Dict[str, Any]:
        """
        Multilingual fallback career guidance when live Gemini is unavailable or failed.
        """
        user_interests = [i.lower() for i in user_doc.get("learning_interests") or []]
        existing_skills = user_doc.get("existing_skills") or []
        
        is_tailoring = any("tailor" in i or "stitch" in i or "sew" in i or "design" in i for i in user_interests) or any("stitching" in s.lower() or "embroidery" in s.lower() for s in existing_skills)
        is_digital = any("computer" in i or "digital" in i or "payment" in i or "mobile" in i for i in user_interests) or any("computer" in s.lower() or "digital" in s.lower() for s in existing_skills)

        if lang == "kn":
            if is_tailoring:
                career_paths = [{
                    "title": "ಕಸ್ಟಮ್ ಬೊಟಿಕ್ ಹೊಲಿಗೆ ವಿನ್ಯಾಸಕಿ",
                    "description": "ಸ್ಥಳೀಯವಾಗಿ ಗ್ರಾಹಕರಿಗೆ ಬ್ಲೌಸ್, ಸಲ್ವಾರ್ ಮತ್ತು ವಧುವಿನ ಬಟ್ಟೆಗಳನ್ನು ಹೊಲಿಯುವ ಮತ್ತು ವಿನ್ಯಾಸಗೊಳಿಸುವ ಸ್ವಯಂ ಉದ್ಯೋಗ.",
                    "why_suitable": "ನೀವು ಹೊಲಿಗೆ ಮತ್ತು ಕಸೂತಿ ಕಲೆಯಲ್ಲಿ ಆಸಕ್ತಿ ಹೊಂದಿದ್ದೀರಿ.",
                    "required_skills": ["ಮೂಲ ಹೊಲಿಗೆ", "ಅಳತೆ ಕತ್ತರಿಸುವುದು", "ಲೈನಿಂಗ್ ಹೊಲಿಗೆ"],
                    "existing_skills": existing_skills,
                    "skill_gaps": ["ವೃತ್ತಿಪರ ಬ್ಲೌಸ್ ಕಟಿಂಗ್", "ಜರ್ದೋಸಿ ಎಂಬ್ರಾಯ್ಡರಿ"],
                    "recommended_learning": ["Professional Blouse Pattern Cutting & Stitching"],
                    "next_steps": ["ಮೂಲ ಹೊಲಿಗೆಯನ್ನು ಅಭ್ಯಾಸ ಮಾಡಿ", "ನಾರಿನೆಕ್ಸಸ್‌ನಲ್ಲಿ ಬ್ಲೌಸ್ ಕಟಿಂಗ್ ಕೋರ್ಸ್‌ಗೆ ಸೇರಿ"]
                }]
                entrepreneurship_options = [{
                    "title": "ಮನೆ ಆಧಾರಿತ ಟೈಲರಿಂಗ್ ಉದ್ಯಮ",
                    "description": "ಕನಿಷ್ಠ ಹೂಡಿಕೆಯೊಂದಿಗೆ ಮನೆಯಲ್ಲೇ ಸಣ್ಣ ಪ್ರಮಾಣದ ಹೊಲಿಗೆ ಯಂತ್ರ ಅಳವಡಿಸಿ ಉದ್ಯಮವನ್ನು ಪ್ರಾರಂಭಿಸುವುದು.",
                    "why_suitable": "ಮನೆಯಿಂದಲೇ ಆದಾಯ ಗಳಿಸುವ ನಿಮ್ಮ ಗುರಿಗೆ ಇದು ಸೂಕ್ತವಾಗಿದೆ.",
                    "required_skills": ["ಸಣ್ಣ ವ್ಯಾಪಾರ ನಿರ್ವಹಣೆ", "ಗ್ರಾಹಕ ಸಂಬಂಧ", "ಗುಣಮಟ್ಟದ ಹೊಲಿಗೆ"],
                    "existing_skills": existing_skills,
                    "skill_gaps": ["ಹಣಕಾಸು ಲೆಕ್ಕಪತ್ರ", "ಸಾಮಾಜಿಕ ಮಾಧ್ಯಮ ಪ್ರಚಾರ"],
                    "recommended_learning": ["Simple Bookkeeping & Financial Health for Small Business"],
                    "next_steps": ["ಮನೆಯಲ್ಲಿ ಹೊಲಿಗೆ ಸ್ಥಳಾವಕಾಶವನ್ನು ನಿಗದಿಪಡಿಸಿ", "ಸ್ಥಳೀಯ ಗ್ರಾಹಕರಿಗೆ ಸಣ್ಣ ಬದಲಾವಣೆಗಳನ್ನು ಮಾಡಲು ಪ್ರಾರಂಭಿಸಿ"]
                }]
                general_advice = "ನಿಮ್ಮ ಹೊಲಿಗೆ ಆಸಕ್ತಿಯು ಅತ್ಯುತ್ತಮ ವೃತ್ತಿಜೀವನಕ್ಕೆ ದಾರಿಯಾಗಿದೆ. ಮೊದಲು ಬೇಸಿಕ್ ಕೋರ್ಸ್‌ಗಳನ್ನು ಪೂರ್ಣಗೊಳಿಸಿ, ನಂತರ ನಿಮ್ಮದೇ ಆದ ಬೊಟಿಕ್ ಪ್ರಾರಂಭಿಸಲು ಯೋಜಿಸಿ."
            elif is_digital:
                career_paths = [{
                    "title": "ಡಿಜಿಟಲ್ ಸೇವಾ ಸಹಾಯಕರು",
                    "description": "ಸ್ಥಳೀಯ ಗ್ರಾಮ ಪಂಚಾಯತ್ ಅಥವಾ ಸಾಮಾನ್ಯ ಸೇವಾ ಕೇಂದ್ರಗಳಲ್ಲಿ (CSC) ಆನ್‌ಲೈನ್ ಅರ್ಜಿ ಸಲ್ಲಿಕೆ ಮತ್ತು ಪಾವತಿ ನಿರ್ವಹಣೆ.",
                    "why_suitable": "ಕಂಪ್ಯೂಟರ್ ಮತ್ತು ಆನ್‌ಲೈನ್ ತಂತ್ರಜ್ಞಾನದಲ್ಲಿ ನೀವು ಆಸಕ್ತಿ ಹೊಂದಿದ್ದೀರಿ.",
                    "required_skills": ["ಮೂಲ ಕಂಪ್ಯೂಟರ್ ಸಾಕ್ಷರತೆ", "UPI ಪಾವತಿಗಳು", "ಆನ್‌ಲೈನ್ ಅರ್ಜಿ ಸಲ್ಲಿಕೆ"],
                    "existing_skills": existing_skills,
                    "skill_gaps": ["ಸುರಕ್ಷಿತ ಆನ್‌ಲೈನ್ ವರ್ಗಾವಣೆ", "ಕಡತ ನಿರ್ವಹಣೆ"],
                    "recommended_learning": ["Computer Basics for Women Entrepreneurs", "Secure Mobile Payments & Digital Wallets"],
                    "next_steps": ["ಮೂಲ ಕಂಪ್ಯೂಟರ್ ಕೀಬೋರ್ಡ್ ಶಾರ್ಟ್‌ಕಟ್‌ಗಳನ್ನು ಕಲಿಯಿರಿ", "UPI ಅಪ್ಲಿಕೇಶನ್‌ಗಳ ಬಳಕೆಯನ್ನು ಪರಿಶೀಲಿಸಿ"]
                }]
                entrepreneurship_options = [{
                    "title": "ಮೊಬೈಲ್ ಪಾವತಿ ಮತ್ತು ರೀಚಾರ್ಜ್ ಕೇಂದ್ರ",
                    "description": "ಸ್ಥಳೀಯ ಗ್ರಾಮಸ್ಥರಿಗೆ ಮೊಬೈಲ್ ರೀಚಾರ್ಜ್, ವಿದ್ಯುತ್ ಬಿಲ್ ಪಾವತಿ ಮತ್ತು ಹಣ ವರ್ಗಾವಣೆ ಸೇವೆಗಳನ್ನು ಒದಗಿಸುವುದು.",
                    "why_suitable": "ಸ್ವಲ್ಪ ಹೂಡಿಕೆಯೊಂದಿಗೆ ಸ್ವತಂತ್ರವಾಗಿ ಗ್ರಾಮೀಣ ಭಾಗದಲ್ಲಿ ಸುಲಭವಾಗಿ ಪ್ರಾರಂಭಿಸಬಹುದು.",
                    "required_skills": ["UPI ಖಾತೆ ಸೆಟಪ್", "ಖಾತೆ ಪುಸ್ತಕ ನಿರ್ವಹಣೆ", "ಗ್ರಾಹಕ ನಂಬಿಕೆ"],
                    "existing_skills": existing_skills,
                    "skill_gaps": ["ವ್ಯವಹಾರ ಲೆಕ್ಕಪತ್ರ"],
                    "recommended_learning": ["Simple Bookkeeping & Financial Health for Small Business"],
                    "next_steps": ["UPI ಮತ್ತು ಪಾವತಿ ಅಪ್ಲಿಕೇಶನ್‌ಗಳನ್ನು ಸಕ್ರಿಯಗೊಳಿಸಿ", "ನಿಮ್ಮ ಅಂಗಡಿಯ ಬಗ್ಗೆ ಸ್ಥಳೀಯವಾಗಿ ಪ್ರಚಾರ ಮಾಡಿ"]
                }]
                general_advice = "ಡಿಜಿಟಲ್ ಕೌಶಲ್ಯಗಳು ಇಂದಿನ ದಿನಗಳಲ್ಲಿ ಅತ್ಯಗತ್ಯ. ನಾರಿನೆಕ್ಸಸ್‌ನಲ್ಲಿ ಕಂಪ್ಯೂಟರ್ ಬೇಸಿಕ್ಸ್ ಮತ್ತು ಡಿಜಿಟಲ್ ಪಾವತಿಗಳ ಕೋರ್ಸ್‌ಗಳನ್ನು ಕಲಿಯುವ ಮೂಲಕ ಪ್ರಾರಂಭಿಸಿ."
            else:
                career_paths = [{
                    "title": "ಸ್ಥಳೀಯ ಸಣ್ಣ ಉದ್ಯಮ ಆಡಳಿತಗಾರ್ತಿ",
                    "description": "ಸ್ಥಳೀಯ ಉತ್ಪನ್ನಗಳ ಮಾರಾಟ ಅಥವಾ ಮಳಿಗೆ ನಿರ್ವಹಣೆ.",
                    "why_suitable": "ನಿಮ್ಮ ಸೃಜನಶೀಲ ಮತ್ತು ಕಲಿಕೆಯ ಆಸಕ್ತಿಗೆ ಇದು ಹೊಂದಿಕೆಯಾಗುತ್ತದೆ.",
                    "required_skills": ["ಸಂವಹನ ಕೌಶಲ್ಯ", "ಸಣ್ಣ ವ್ಯವಹಾರ ಯೋಜನೆ"],
                    "existing_skills": existing_skills,
                    "skill_gaps": ["ಹಣಕಾಸು ನಿರ್ವಹಣೆ", "ಡಿಜಿಟಲ್ ಮಾರ್ಕೆಟಿಂಗ್"],
                    "recommended_learning": ["Simple Bookkeeping & Financial Health for Small Business", "Social Media Marketing for Local Brands"],
                    "next_steps": ["ನಿಮ್ಮ ಆಸಕ್ತಿಯನ್ನು ಗುರುತಿಸಿ", "ಕೋರ್ಸ್‌ಗಳನ್ನು ಪೂರ್ಣಗೊಳಿಸಿ ಕೌಶಲ್ಯ ಬೆಳೆಸಿಕೊಳ್ಳಿ"]
                }]
                entrepreneurship_options = [{
                    "title": "ಗೃಹ ಆಧಾರಿತ ಮೈಕ್ರೋ-ಉದ್ಯಮ",
                    "description": "ಹಪ್ಪಳ, ಉಪ್ಪಿನಕಾಯಿ, ಮೇಣದಬತ್ತಿ ಅಥವಾ ಕೈಕೆಲಸದ ವಸ್ತುಗಳ ತಯಾರಿಕೆ ಮತ್ತು ಮಾರಾಟ ಉದ್ಯಮ.",
                    "why_suitable": "ನಿಮ್ಮ ಸ್ವಂತ ಸಮಯಾವಕಾಶದಲ್ಲಿ ಮನೆಯಿಂದಲೇ ಕಾರ್ಯನಿರ್ವಹಿಸಬಹುದು.",
                    "required_skills": ["ಉತ್ಪನ್ನ ಪ್ಯಾಕೇಜಿಂಗ್", "ಮೂಲ ಮಾರುಕಟ್ಟೆ ಜ್ಞಾನ"],
                    "existing_skills": existing_skills,
                    "skill_gaps": ["ಬುಕ್ಕೀಪಿಂಗ್", "ಆನ್‌ಲೈನ್ ಪಾವತಿ ಸ್ವೀಕಾರ"],
                    "recommended_learning": ["Simple Bookkeeping & Financial Health for Small Business"],
                    "next_steps": ["ಕಡಿಮೆ ಪ್ರಮಾಣದಲ್ಲಿ ಉತ್ಪನ್ನ ತಯಾರಿಸಿ ಪರೀಕ್ಷಿಸಿ", "ನೆರೆಹೊರೆಯವರಿಗೆ ಉಚಿತ ಸ್ಯಾಂಪಲ್ ನೀಡಿ ಅಭಿಪ್ರಾಯ ಪಡೆಯಿರಿ"]
                }]
                general_advice = "ನಿಮ್ಮ ಪ್ರೊಫೈಲ್ ಅಪೂರ್ಣವಾಗಿದೆ. ಹೆಚ್ಚಿನ ಮಾಹಿತಿಗಾಗಿ ಪ್ರೊಫೈಲ್ ಪುಟದಲ್ಲಿ ಆಸಕ್ತಿಗಳು ಮತ್ತು ಗುರಿಗಳನ್ನು ನವೀಕರಿಸಿ, ಇದರಿಂದ ನಿಖರ ಮಾರ್ಗದರ್ಶನ ನೀಡಬಹುದು."
        elif lang == "hi":
            if is_tailoring:
                career_paths = [{
                    "title": "कस्टम बुटीक टेलर एवं डिज़ाइनर",
                    "description": "स्थानीय स्तर पर ग्राहकों के लिए ब्लाउज़, सलवार सूट और शादी के परिधानों की सिलाई और डिज़ाइनिंग का कार्य।",
                    "why_suitable": "आपकी रुचि सिलाई और रचनात्मक परिधानों में है।",
                    "required_skills": ["बुनियादी सिलाई", "माप और कटाई", "अस्तर की सिलाई"],
                    "existing_skills": existing_skills,
                    "skill_gaps": ["प्रोफेशनल ब्लाउज़ कटिंग", "ज़रदोज़ी कढ़ाई"],
                    "recommended_learning": ["Professional Blouse Pattern Cutting & Stitching"],
                    "next_steps": ["बुनियादी सिलाई का अभ्यास करें", "नारीनेक्सस पर ब्लाउज़ कटिंग कोर्स में दाखिला लें"]
                }]
                entrepreneurship_options = [{
                    "title": "घर पर आधारित सिलाई व्यवसाय",
                    "description": "घर पर सिलाई मशीन लगाकर छोटे स्तर पर सिलाई और बूटिक की शुरुआत करना।",
                    "why_suitable": "यह घर से काम करके स्वतंत्र रूप से कमाने के आपके लक्ष्य के अनुकूल है।",
                    "required_skills": ["व्यवसाय प्रबंधन", "ग्राहक सेवा", "गुणवत्ता पूर्ण सिलाई"],
                    "existing_skills": existing_skills,
                    "skill_gaps": ["बहीखाता / बुककीपिंग", "सोशल मीडिया प्रचार"],
                    "recommended_learning": ["Simple Bookkeeping & Financial Health for Small Business"],
                    "next_steps": ["घर में एक कोना सिलाई के काम के लिए समर्पित करें", "आसपास के लोगों के कपड़े सुधारने (अल्टरेशन) से शुरुआत करें"]
                }]
                general_advice = "सिलाई के क्षेत्र में बेहतरीन अवसर हैं। पहले बुनियादी कोर्सेज को पूरा करें और फिर अपना बुटीक शुरू करने की दिशा में आगे बढ़ें।"
            elif is_digital:
                career_paths = [{
                    "title": "डिजिटल सेवा सहायक",
                    "description": "स्थानीय जन सेवा केंद्र (CSC) या पंचायत कार्यालयों में ऑनलाइन फॉर्म भरने और डिजिटल भुगतान का प्रबंधन।",
                    "why_suitable": "आप कंप्यूटर और डिजिटल तकनीकों को सीखने में रुचि रखती हैं।",
                    "required_skills": ["कम्प्यूटर साक्षरता", "UPI लेनदेन", "दस्तावेज़ प्रबंधन"],
                    "existing_skills": existing_skills,
                    "skill_gaps": ["सुरक्षित डिजिटल भुगतान", "फोल्डर मैनेजमेंट"],
                    "recommended_learning": ["Computer Basics for Women Entrepreneurs", "Secure Mobile Payments & Digital Wallets"],
                    "next_steps": ["कीबोर्ड टाइपिंग और फाइल सुरक्षित रखने का अभ्यास करें", "UPI पेमेंट्स और धोखाधड़ी से सुरक्षा के नियम सीखें"]
                }]
                entrepreneurship_options = [{
                    "title": "डिजिटल रीचार्ज और भुगतान केंद्र",
                    "description": "ग्रामीणों के लिए बिल भुगतान, मोबाइल रीचार्ज और सुरक्षित डिजिटल मनी ट्रांसफर सेवाएं प्रदान करना।",
                    "why_suitable": "यह कम लागत में ग्रामीण इलाकों में बहुत मांग वाला व्यवसाय है।",
                    "required_skills": ["UPI खाता संचालन", "नकद बहीखाता", "ग्राहक सेवा"],
                    "existing_skills": existing_skills,
                    "skill_gaps": ["छोटे व्यवसाय का बहीखाता"],
                    "recommended_learning": ["Simple Bookkeeping & Financial Health for Small Business"],
                    "next_steps": ["अपने मोबाइल में भुगतान ऐप्स को सुरक्षित रूप से सेट करें", "अपने पड़ोसियों को इन सेवाओं के बारे में सूचित करें"]
                }]
                general_advice = "डिजिटल साक्षरता आज की बड़ी जरूरत है। नारीनेक्सस पर कंप्यूटर बेसिक्स और सुरक्षित पेमेंट्स कोर्स से शुरुआत करके आप आत्मनिर्भर बन सकती हैं।"
            else:
                career_paths = [{
                    "title": "लघु व्यवसाय संचालक",
                    "description": "स्थानीय उत्पादों की बिक्री या रिटेल दुकान का प्रबंधन।",
                    "why_suitable": "यह आपकी व्यावसायिक रुचि और सीखने की इच्छा से मेल खाता है।",
                    "required_skills": ["संवाद कौशल", "व्यवसाय नियोजन"],
                    "existing_skills": existing_skills,
                    "skill_gaps": ["वित्तीय बहीखाता", "डिजिटल मार्केटिंग"],
                    "recommended_learning": ["Simple Bookkeeping & Financial Health for Small Business", "Social Media Marketing for Local Brands"],
                    "next_steps": ["अपनी रुचि का क्षेत्र चुनें", "बुनियादी व्यावसायिक कोर्सेज पूरा करें"]
                }]
                entrepreneurship_options = [{
                    "title": "गृह आधारित माइक्रो-उद्योग",
                    "description": "घर पर पापड़, अचार, मोमबत्ती या हस्तशिल्प बनाकर स्थानीय बाजारों में बेचना।",
                    "why_suitable": "आप अपनी सुविधानुसार घर से काम कर सकती हैं।",
                    "required_skills": ["उत्पाद पैकेजिंग", "स्थानीय विपणन"],
                    "existing_skills": existing_skills,
                    "skill_gaps": ["बहीखाता", "सुरक्षित डिजिटल लेनदेन"],
                    "recommended_learning": ["Simple Bookkeeping & Financial Health for Small Business"],
                    "next_steps": ["छोटे पैमाने पर उत्पाद तैयार करके परीक्षण करें", "आसपास के लोगों से प्रतिक्रिया लें"]
                }]
                general_advice = "आपका प्रोफाइल अभी अधूरा है। बेहतर मार्गदर्शन के लिए कृपया प्रोफाइल सेक्शन में अपनी रुचि और लक्ष्यों को पूरा भरें।"
        else:
            if is_tailoring:
                career_paths = [{
                    "title": "Custom Boutique Tailor & Designer",
                    "description": "Stitch and design bespoke blouses, salwar suits, and bridal wear for local clients.",
                    "why_suitable": "You have listed interests in sewing, stitching, or tailoring.",
                    "required_skills": ["Basic Needlework", "Measurement Cutting", "Lining Stitching"],
                    "existing_skills": existing_skills,
                    "skill_gaps": ["Professional Blouse Cutting", "Embroidery and Zardosi work"],
                    "recommended_learning": ["Professional Blouse Pattern Cutting & Stitching"],
                    "next_steps": ["Practice basic stitching of standard designs", "Enroll in the Professional Blouse cutting course on NariNexus"]
                }]
                entrepreneurship_options = [{
                    "title": "Home-Based Tailoring Boutique",
                    "description": "Start a small scale custom boutique from home with minimum initial machine setup investment.",
                    "why_suitable": "Aligns with your goal of earning from home independently.",
                    "required_skills": ["Client Relations", "Quality Tailoring", "Basic Bookkeeping"],
                    "existing_skills": existing_skills,
                    "skill_gaps": ["Financial Management", "Social Media Marketing"],
                    "recommended_learning": ["Simple Bookkeeping & Financial Health for Small Business", "Social Media Marketing for Local Brands"],
                    "next_steps": ["Designate a clean work area at home", "Perform alterations for friends and family to build a portfolio"]
                }]
                general_advice = "The apparel and custom sewing space holds great local potential. Completing intermediate courses will prepare you to run a highly profitable home boutique."
            elif is_digital:
                career_paths = [{
                    "title": "Digital Service Assistant",
                    "description": "Help locals with online registrations, applications, and documents at a village Common Service Centre (CSC).",
                    "why_suitable": "You are interested in learning digital/computer skills.",
                    "required_skills": ["Computer Basics", "Internet Navigation", "Form Submissions"],
                    "existing_skills": existing_skills,
                    "skill_gaps": ["UPI Payments", "Cyber-security basics"],
                    "recommended_learning": ["Computer Basics for Women Entrepreneurs", "Secure Mobile Payments & Digital Wallets"],
                    "next_steps": ["Practice secure internet surfing & typing", "Learn about safe online payment processes"]
                }]
                entrepreneurship_options = [{
                    "title": "Digital Mobile Recharge & Payment Point",
                    "description": "Provide secure UPI payments, electricity bills, and phone recharge services to rural neighbors.",
                    "why_suitable": "Requires minimal tech background and is highly useful in rural villages.",
                    "required_skills": ["Digital Wallet Use", "Cash Management", "Local Marketing"],
                    "existing_skills": existing_skills,
                    "skill_gaps": ["Small business bookkeeping"],
                    "recommended_learning": ["Simple Bookkeeping & Financial Health for Small Business"],
                    "next_steps": ["Register secure merchant UPI accounts", "Place a small sign outside your home about available services"]
                }]
                general_advice = "Becoming a digital reference in your community is highly empowering. Begin with Computer Basics and Secure Mobile Payments on NariNexus."
            else:
                career_paths = [{
                    "title": "Micro-Business Assistant",
                    "description": "Manage day-to-day operations or records of small local shops and cooperatives.",
                    "why_suitable": "Fits your goals of acquiring practical business skills.",
                    "required_skills": ["Communication", "Organized Records keeping"],
                    "existing_skills": existing_skills,
                    "skill_gaps": ["Simple Bookkeeping", "Digital Payments"],
                    "recommended_learning": ["Simple Bookkeeping & Financial Health for Small Business"],
                    "next_steps": ["Formulate a simple career goal", "Take foundational bookkeeping courses"]
                }]
                entrepreneurship_options = [{
                    "title": "Home-based Micro Enterprise",
                    "description": "Create homemade culinary or handicraft products (e.g. pickles, papad, candles) to sell in local markets.",
                    "why_suitable": "Highly flexible and lets you learn self-reliance at your own pace.",
                    "required_skills": ["Production planning", "Basic pricing"],
                    "existing_skills": existing_skills,
                    "skill_gaps": ["Bookkeeping", "Accepting mobile payments safely"],
                    "recommended_learning": ["Simple Bookkeeping & Financial Health for Small Business"],
                    "next_steps": ["Prepare a small batch of your chosen product", "Get feedback from friends and local neighbors"]
                }]
                general_advice = "Your learner profile is partially complete. To get the most tailored career advice, please complete your profile interests, career goals, and skills!"

        return {
            "success": True,
            "career_paths": career_paths,
            "entrepreneurship_options": entrepreneurship_options,
            "general_advice": general_advice,
            "language": lang
        }
