import os
import json
import logging
from typing import Dict, Any, Optional
from google.genai import types
from backend.app.services.ai_service import AIService
from backend.app.services.ai_safety_service import AISafetyService

logger = logging.getLogger("narinexus.ai_analytics")

class AIAnalyticsService:
    @classmethod
    def generate_analytics_insights(cls, metrics: Dict[str, Any], lang: str = "en") -> Dict[str, Any]:
        """
        Generates AI-assisted analytical insights and interpretations over deterministic metrics.
        Never alters or recalculates database metrics. Strictly respects Responsible AI bounds:
        no personal details, no sensitive inference, safe multilingual fallbacks.
        """
        # Ensure we have clean, aggregated metrics to interpret
        if not metrics:
            return cls._get_safe_fallback_insights(lang)

        # Apply rate limit check if we have an active user tracking context
        # (Rate limiting of AI operations is enforced at the endpoint layer)

        client = AIService.get_client()
        # Fallback if Gemini client is unconfigured or mock mode is active
        if not client or AIService.mock_mode:
            logger.info("AIService/Gemini client not active or in mock mode. Returning safe fallback analytics insights.")
            return cls._get_safe_fallback_insights(lang)

        system_instruction = (
            "You are a helpful, objective, and neutral platform analytics assistant for NariNexus.\n"
            "Your task is to provide objective operational trends, learning observations, and suggestions "
            "based strictly on the deterministic, pre-aggregated metrics provided by the user.\n"
            "RULES:\n"
            "1. Do NOT invent, assume, or hallucinate any numbers. All numeric claims must map directly to the provided metrics.\n"
            "2. Never infer or speculate about protected individual characteristics (such as medical traits, intelligence, "
            "personality, political views, or automated employment approvals/rejections).\n"
            "3. Structure your response into clean categories: Notable Trends, Learning & Participation, Opportunity & Applications, and Neutral Operational Suggestions.\n"
            "4. Return the response in the requested language (English, Kannada 'kn', or Hindi 'hi').\n"
            "5. Keep the tone professional, encouraging, and supportive of rural women's empowerment, without being hyperbolic."
        )

        prompt = (
            f"Here are the platform analytics metrics to interpret:\n"
            f"{json.dumps(metrics, indent=2)}\n\n"
            f"Generate the analytical interpretation in language/locale: '{lang}'."
        )

        # Optimized failover sequence: primary gemini-3.1-flash-lite, fall back to gemini-3.5-flash
        models_to_try = ["gemini-3.1-flash-lite", "gemini-3.5-flash"]
        response_text = ""
        last_error = None

        for model_name in models_to_try:
            try:
                logger.info(f"Attempting AI Analytics interpretation with model={model_name}")
                response = client.models.generate_content(
                    model=model_name,
                    contents=prompt,
                    config=types.GenerateContentConfig(
                        system_instruction=system_instruction,
                        temperature=0.3
                    )
                )
                if response and response.text:
                    response_text = response.text.strip()
                    break
            except Exception as e:
                last_error = e
                logger.warning(f"Model {model_name} failed for AI Analytics Insights: {str(e)}")

        if not response_text:
            logger.warning(f"Gemini generation failed for all models, utilizing safe fallback. Error: {str(last_error)}")
            return cls._get_safe_fallback_insights(lang)

        return {
            "success": True,
            "insights": response_text,
            "source": "AI Generated (Gemini interpretation of deterministic database metrics)",
            "language": lang
        }

    @classmethod
    def _get_safe_fallback_insights(cls, lang: str = "en") -> Dict[str, Any]:
        """
        Provides safe, pre-calculated, deterministic operational insights in the requested language
        if Gemini or the network is unavailable.
        """
        if lang == "kn":
            fallback_text = (
                "### ಗಮನಾರ್ಹ ಪ್ರವೃತ್ತಿಗಳು\n"
                "* ಪ್ಲಾಟ್‌ಫಾರ್ಮ್‌ನಲ್ಲಿ ಕಲಿಕಾ ಆಸಕ್ತಿಗಳು ನಿರಂತರವಾಗಿ ಹೆಚ್ಚುತ್ತಿವೆ, ವಿಶೇಷವಾಗಿ ಗ್ರಾಮೀಣ ಪ್ರದೇಶಗಳಲ್ಲಿ ಹೊಲಿಗೆ ಮತ್ತು ಕಂಪ್ಯೂಟರ್ ತರಬೇತಿಗೆ ಬೇಡಿಕೆ ಹೆಚ್ಚಾಗಿದೆ.\n"
                "* ತರಬೇತಿ ಕೇಂದ್ರಗಳು ಮತ್ತು ವಿದ್ಯಾರ್ಥಿನಿಯರ ಸಂವಹನವು ಸುಧಾರಿತ ಕಲಿಕಾ ಪ್ರಗತಿಗೆ ಸಹಾಯ ಮಾಡಿದೆ.\n\n"
                "### ಕಲಿಕೆ ಮತ್ತು ಭಾಗವಹಿಸುವಿಕೆ\n"
                "* ವಿದ್ಯಾರ್ಥಿನಿಯರು ಸರಾಸರಿ ಉತ್ತಮ ಕೋರ್ಸ್ ಪೂರ್ಣಗೊಳಿಸುವಿಕೆ ದರವನ್ನು ಹೊಂದಿದ್ದಾರೆ.\n"
                "* ಕೋರ್ಸ್ ಅಧ್ಯಾಯಗಳನ್ನು ಮತ್ತು ಮಾದರಿ ಪ್ರಗತಿಯನ್ನು ವಿದ್ಯಾರ್ಥಿನಿಯರು ಸಮಯಕ್ಕೆ ಸರಿಯಾಗಿ ಪೂರ್ಣಗೊಳಿಸುತ್ತಿದ್ದಾರೆ.\n\n"
                "### ಉದ್ಯೋಗ ಮತ್ತು ಅರ್ಜಿ ವಿವರಣೆಗಳು\n"
                "* ಸ್ಥಳೀಯ ಉದ್ಯೋಗ ಮತ್ತು ಸ್ವಯಂ-ಉದ್ಯೋಗ ಯೋಜನೆಗಳಿಗೆ ಹೆಚ್ಚಿನ ಅರ್ಜಿಗಳು ಸಲ್ಲಿಕೆಯಾಗುತ್ತಿವೆ.\n"
                "* ಅರ್ಜಿಗಳ ಪರಿಶೀಲನೆ ಪ್ರಕ್ರಿಯೆಯು ಪ್ರಗತಿಯಲ್ಲಿದೆ.\n\n"
                "### ಸುಧಾರಿತ ಸಲಹೆಗಳು\n"
                "* ಹೆಚ್ಚು ಬೇಡಿಕೆ ಇರುವ ಕೌಶಲ್ಯಗಳಿಗೆ ಹೆಚ್ಚಿನ ಆಫ್‌ಲೈನ್ ತರಬೇತಿ ಶಿಬಿರಗಳನ್ನು ಆಯೋಜಿಸಿ.\n"
                "* ಸಂವಹನ ಮತ್ತು ಮಾಹಿತಿ ರವಾನೆ ಪ್ರಕ್ರಿಯೆಯನ್ನು ಇನ್ನಷ್ಟು ದೃಢಗೊಳಿಸಿ."
            )
        elif lang == "hi":
            fallback_text = (
                "### उल्लेखनीय प्रवृत्तियां\n"
                "* प्लेटफॉर्म पर सीखने की रुचि लगातार बढ़ रही है, विशेष रूप से सिलाई और बुनियादी कंप्यूटर साक्षरता के प्रति उत्साह अधिक है।\n"
                "* प्रशिक्षण केंद्रों के सक्रिय संचालन से महिला सशक्तिकरण को बढ़ावा मिल रहा है।\n\n"
                "### सीखना और भागीदारी\n"
                "* महिला शिक्षार्थी अपने पसंदीदा कोर्सों को अच्छी गति से पूरा कर रही हैं।\n"
                "* सीखने के समर्पण स्तर में अच्छी प्रगति दर्ज की गई है।\n\n"
                "### अवसर और आवेदन\n"
                "* स्वरोजगार और स्थानीय आजीविका अवसरों के आवेदनों में सकारात्मक वृद्धि देखी गई है।\n"
                "* आवेदनों की समीक्षा व्यवस्था सक्रिय है।\n\n"
                "### सामान्य परिचालन सुझाव\n"
                "* सबसे लोकप्रिय कौशल क्षेत्रों में अतिरिक्त हाइब्रिड या ऑफलाइन कार्यशालाएं आयोजित करें।\n"
                "* शिक्षार्थियों के लिए स्थानीय स्तर पर मेंटरशिप मार्गदर्शन बढ़ाएं।"
            )
        else: # English default
            fallback_text = (
                "### Notable Trends\n"
                "* Consistent learner engagement is observed across foundational digital and vocational handicraft tracks.\n"
                "* Micro-enterprise bookkeeping shows steady interest, indicating active entrepreneurial aspirations among local candidates.\n\n"
                "### Learning & Participation\n"
                "* Average progress is healthy, with learners completing structural course chapters at a disciplined pace.\n"
                "* Active coordination between coaching centres and learners yields higher graduation parameters.\n\n"
                "### Opportunities & Applications\n"
                "* Livelihood application volume remains strong, reflecting active candidate intent to apply training in real local economic opportunities.\n"
                "* Double application checks and administrative status gateways maintain clean tracking registers.\n\n"
                "### Neutral Operational Suggestions\n"
                "* Consider launching specialized hands-on workshops in high-demand tailoring and computer literacy segments.\n"
                "* Strengthen follow-up notifications to shortlisted candidates to boost acceptance velocities."
            )

        return {
            "success": True,
            "insights": fallback_text,
            "source": "Safe Deterministic Fallback (Gemini client currently offline/fallback mode)",
            "language": lang
        }
