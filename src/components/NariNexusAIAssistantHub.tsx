import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight, BookOpen, Compass, Target, Search, BrainCircuit, Lightbulb } from 'lucide-react';
import { useAuth } from '../services/authContext';

interface SkillRecommendation {
  id: string;
  name: string;
  description: string;
}

interface CourseRecommendation {
  id: string;
  title: string;
  description: string;
}

const LOCALIZATION: Record<string, Record<string, string>> = {
  en: {
    title: "NariNexus AI Assistant",
    greet: "How can I help you today",
    inputPlaceholder: "Ask anything (e.g., 'how to start tailor shop', 'safe mobile payments')...",
    askBtn: "Ask AI",
    quickActionsTitle: "Quick AI Shortcuts",
    actionSkills: "Find Skills For Me",
    actionCourses: "Recommend Courses",
    actionCareer: "Explore Career Paths",
    actionOpps: "Livelihoods & Opportunities",
    insightsTitle: "Your Personalized AI Insights",
    insightsSkillsHeader: "Matching Skills:",
    insightsCoursesHeader: "Targeted Courses:",
    insightsCareerHeader: "Your Current Career Goal:",
    insightsCareerEmpty: "Define your goal in your profile context.",
    loading: "Fetching live AI insights...",
    error: "AI insights temporarily unavailable. Ask the assistant below!",
    seeAll: "See full suggestions"
  },
  kn: {
    title: "ನಾರಿನೆಕ್ಸಸ್ AI ಸಹಾಯಕಿ",
    greet: "ಇಂದು ನಾನು ನಿಮಗೆ ಹೇಗೆ ಸಹಾಯ ಮಾಡಲಿ",
    inputPlaceholder: "ಏನನ್ನಾದರೂ ಕೇಳಿ (ಉದಾ: 'ಹೊಲಿಗೆ ಉದ್ಯಮ ಹೇಗೆ ಪ್ರಾರಂಭಿಸಬೇಕು', 'ಡಿಜಿಟಲ್ ಬ್ಯಾಂಕಿಂಗ್')...",
    askBtn: "ಕೇಳಿ",
    quickActionsTitle: "ತ್ವರಿತ AI ಶಾರ್ಟ್‌ಕಟ್‌ಗಳು",
    actionSkills: "ನನ್ನ ಕೌಶಲ್ಯಗಳನ್ನು ಹುಡುಕಿ",
    actionCourses: "ಕೋರ್ಸ್‌ಗಳನ್ನು ಶಿಫಾರಸು ಮಾಡಿ",
    actionCareer: "ವೃತ್ತಿ ಮಾರ್ಗಗಳನ್ನು ಅನ್ವೇಷಿಸಿ",
    actionOpps: "ಆಜೀವಿಕೆ ಮತ್ತು ಅವಕಾಶಗಳು",
    insightsTitle: "ನಿಮ್ಮ ವೈಯಕ್ತೀಕರಿಸಿದ AI ಒಳನೋಟಗಳು",
    insightsSkillsHeader: "ಸೂಕ್ತವಾದ ಕೌಶಲ್ಯಗಳು:",
    insightsCoursesHeader: "ಶಿಫಾರಸು ಮಾಡಿದ ಕೋರ್ಸ್‌ಗಳು:",
    insightsCareerHeader: "ನಿಮ್ಮ ಪ್ರಸ್ತುತ ವೃತ್ತಿ ಗುರಿ:",
    insightsCareerEmpty: "ನಿಮ್ಮ ಪ್ರೊಫೈಲ್‌ನಲ್ಲಿ ವೃತ್ತಿ ಗುರಿ ನಿಗದಿಪಡಿಸಿ.",
    loading: "AI ಒಳನೋಟಗಳನ್ನು ಲೋಡ್ ಮಾಡಲಾಗುತ್ತಿದೆ...",
    error: "AI ಒಳನೋಟಗಳು ತಾತ್ಕಾಲಿಕವಾಗಿ ಲಭ್ಯವಿಲ್ಲ. ಸಹಾಯಕಿ ಜೊತೆ ಚಾಟ್ ಮಾಡಿ!",
    seeAll: "ಪೂರ್ಣ ಸಲಹೆಗಳನ್ನು ನೋಡಿ"
  },
  hi: {
    title: "नारीनेक्सस AI असिस्टेंट",
    greet: "आज मैं आपकी क्या सहायता कर सकती हूँ",
    inputPlaceholder: "कुछ भी पूछें (जैसे, 'सिलाई बुटीक कैसे शुरू करें', 'सुरक्षित ऑनलाइन भुगतान')...",
    askBtn: "पूछें",
    quickActionsTitle: "त्वरित AI शॉर्टकट्स",
    actionSkills: "मेरे लिए कौशल खोजें",
    actionCourses: "कोर्स की सिफारिश करें",
    actionCareer: "करियर पथ तलाशें",
    actionOpps: "आजीविका और अवसर",
    insightsTitle: "आपकी व्यक्तिगत AI इनसाइट्स",
    insightsSkillsHeader: "अनुकूल कौशल:",
    insightsCoursesHeader: "अनुशंसित कोर्सेज:",
    insightsCareerHeader: "आपका वर्तमान करियर लक्ष्य:",
    insightsCareerEmpty: "अपनी प्रोफ़ाइल में अपना करियर लक्ष्य सेट करें।",
    loading: "AI इनसाइट्स लोड हो रहे हैं...",
    error: "AI इनसाइट्स अस्थायी रूप से उपलब्ध नहीं हैं। नीचे असिस्टेंट से बात करें!",
    seeAll: "सभी सुझाव देखें"
  }
};

export default function NariNexusAIAssistantHub() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const lang = user?.preferred_language || 'en';
  const t = LOCALIZATION[lang] || LOCALIZATION['en'];

  const [query, setQuery] = useState('');
  const [skills, setSkills] = useState<SkillRecommendation[]>([]);
  const [courses, setCourses] = useState<CourseRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function fetchInsights() {
      const token = localStorage.getItem('narinexus_token');
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        setError(false);
        
        // Parallel fetching of recommendations
        const [skillsRes, coursesRes] = await Promise.all([
          fetch('/api/skills/recommendations', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('/api/courses/recommendations', { headers: { Authorization: `Bearer ${token}` } })
        ]);

        if (skillsRes.ok) {
          const skillsData = await skillsRes.json();
          if (skillsData.success && Array.isArray(skillsData.skills)) {
            setSkills(skillsData.skills.slice(0, 2));
          }
        }
        
        if (coursesRes.ok) {
          const coursesData = await coursesRes.json();
          if (coursesData.success && Array.isArray(coursesData.courses)) {
            setCourses(coursesData.courses.slice(0, 2));
          }
        }
      } catch (err) {
        console.warn("Failed to fetch AI insights for hub:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    }

    fetchInsights();
  }, []);

  const handleAsk = () => {
    if (!query.trim()) return;
    navigate('/learner/chat', { state: { initialMessage: query.trim() } });
  };

  const triggerQuickAction = (message: string) => {
    navigate('/learner/chat', { state: { initialMessage: message } });
  };

  return (
    <div className="bg-white border border-primary-gold/15 rounded-3xl shadow-sm overflow-hidden" id="ai-assistant-hub">
      {/* Brand Header */}
      <div className="bg-gradient-to-r from-[#FFFDF9] via-white to-[#FFFDF9] px-6 py-5 border-b border-primary-gold/10 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-deep-gold to-primary-gold text-white shadow-sm shrink-0">
            <Sparkles className="h-5 w-5 text-white animate-pulse" />
          </span>
          <div>
            <h3 className="font-serif text-sm sm:text-base font-extrabold text-[#2D241A] uppercase tracking-wide">
              {t.title}
            </h3>
            <p className="text-[10px] sm:text-[11px] text-[#7D7061] font-semibold">
              {t.greet}, {user?.name || 'Savitha'}!
            </p>
          </div>
        </div>
        <div className="inline-flex items-center space-x-1 px-2.5 py-1 bg-sage-green/15 text-green-800 text-[9px] font-black uppercase tracking-wider border border-green-200/45 rounded-full">
          <span>Active &amp; Secure</span>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Ask AI Box */}
        <div className="space-y-2">
          <div className="relative flex items-center">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAsk();
              }}
              placeholder={t.inputPlaceholder}
              className="w-full bg-cream/35 border border-primary-gold/15 hover:border-primary-gold/30 focus:border-deep-rose focus:ring-1 focus:ring-deep-rose rounded-xl pl-11 pr-28 py-3.5 text-xs font-bold text-[#3D2D1E] placeholder-[#7D7061]/50 focus:outline-none transition"
            />
            <Search className="absolute left-4 h-4 w-4 text-[#7D7061]/50" />
            <button
              onClick={handleAsk}
              disabled={!query.trim()}
              className="absolute right-2 px-4 py-2 bg-deep-rose hover:bg-deep-rose/95 disabled:bg-[#7D7061]/35 text-white text-[11px] font-extrabold uppercase tracking-widest rounded-lg transition shadow-sm cursor-pointer"
            >
              {t.askBtn}
            </button>
          </div>
        </div>

        {/* Quick Actions Shortcuts */}
        <div className="space-y-2.5">
          <h4 className="text-[10px] font-extrabold tracking-wider text-deep-gold uppercase flex items-center gap-1.5">
            <Lightbulb className="h-4 w-4" />
            <span>{t.quickActionsTitle}</span>
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <button
              onClick={() => triggerQuickAction(
                lang === 'kn' 
                  ? "ನನ್ನ ಪ್ರೊಫೈಲ್ ಪ್ರಕಾರ ಹೊಲಿಗೆ ಅಥವಾ ಇತರ ಕೌಶಲ್ಯಗಳನ್ನು ಸೂಚಿಸಿ." 
                  : lang === 'hi' 
                  ? "मेरे प्रोफाइल के अनुसार सिलाई या कंप्यूटर कौशल सुझाएं।" 
                  : "Recommend tailoring or digital skills based on my profile interest."
              )}
              className="p-3 bg-cream/20 hover:bg-[#FFF9F2] border border-primary-gold/15 hover:border-primary-gold/35 rounded-xl text-left text-xs font-bold text-[#4A3E31] transition-all flex items-center justify-between group cursor-pointer"
            >
              <span>{t.actionSkills}</span>
              <ArrowRight className="h-4 w-4 text-deep-rose opacity-0 group-hover:opacity-100 transition-all shrink-0 ml-1" />
            </button>

            <button
              onClick={() => triggerQuickAction(
                lang === 'kn' 
                  ? "ನಾರಿನೆಕ್ಸಸ್‌ನಲ್ಲಿ ನನಗೆ ಯಾವ ಕೋರ್ಸ್‌ಗಳು ಶಿಫಾರಸು ಮಾಡಲಾಗಿದೆ?" 
                  : lang === 'hi' 
                  ? "नारीनेक्सस पर मेरे लिए कौन से कोर्सेज अनुशंसित हैं?" 
                  : "What course recommendations do you have for me on NariNexus?"
              )}
              className="p-3 bg-cream/20 hover:bg-[#FFF9F2] border border-primary-gold/15 hover:border-primary-gold/35 rounded-xl text-left text-xs font-bold text-[#4A3E31] transition-all flex items-center justify-between group cursor-pointer"
            >
              <span>{t.actionCourses}</span>
              <ArrowRight className="h-4 w-4 text-deep-rose opacity-0 group-hover:opacity-100 transition-all shrink-0 ml-1" />
            </button>

            <button
              onClick={() => navigate('/learner/career-guidance')}
              className="p-3 bg-cream/20 hover:bg-[#FFF9F2] border border-primary-gold/15 hover:border-primary-gold/35 rounded-xl text-left text-xs font-bold text-[#4A3E31] transition-all flex items-center justify-between group cursor-pointer"
            >
              <span>{t.actionCareer}</span>
              <BrainCircuit className="h-4.5 w-4.5 text-deep-gold shrink-0 ml-1" />
            </button>

            <button
              onClick={() => navigate('/learner/opportunities')}
              className="p-3 bg-cream/20 hover:bg-[#FFF9F2] border border-primary-gold/15 hover:border-primary-gold/35 rounded-xl text-left text-xs font-bold text-[#4A3E31] transition-all flex items-center justify-between group cursor-pointer"
            >
              <span>{t.actionOpps}</span>
              <ArrowRight className="h-4 w-4 text-deep-rose opacity-0 group-hover:opacity-100 transition-all shrink-0 ml-1" />
            </button>
          </div>
        </div>

        {/* Personalized AI Insights */}
        <div className="pt-4 border-t border-primary-gold/10 space-y-3">
          <h4 className="text-[10px] font-extrabold tracking-wider text-deep-gold uppercase">
            {t.insightsTitle}
          </h4>

          {loading ? (
            <div className="py-4 text-center">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary-gold border-t-transparent mx-auto mb-2" />
              <span className="text-[10px] text-[#7D7061] font-semibold">{t.loading}</span>
            </div>
          ) : error ? (
            <div className="p-3 bg-red-50 text-red-800 border border-red-100 rounded-xl text-[11px] font-semibold">
              {t.error}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Skills Insight */}
              <div className="p-3 bg-[#FFFDF9] border border-primary-gold/10 rounded-xl space-y-1.5 flex flex-col justify-between">
                <div>
                  <span className="text-[9px] uppercase font-extrabold text-[#6B8E6F] block tracking-wider">
                    {t.insightsSkillsHeader}
                  </span>
                  {skills.length > 0 ? (
                    <div className="space-y-1 mt-1">
                      {skills.map((s) => (
                        <span key={s.id} className="block text-[11px] font-bold text-[#2D241A] truncate">
                          💡 {s.name}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-[10px] text-[#7D7061]/60 italic font-semibold block mt-1">
                      No matching skills found.
                    </span>
                  )}
                </div>
                <button
                  onClick={() => navigate('/learner/skills')}
                  className="text-[10px] font-bold text-deep-rose hover:underline text-left mt-2 flex items-center gap-0.5 cursor-pointer"
                >
                  <span>{t.seeAll}</span>
                  <ArrowRight className="h-3 w-3" />
                </button>
              </div>

              {/* Courses Insight */}
              <div className="p-3 bg-[#FFFDF9] border border-primary-gold/10 rounded-xl space-y-1.5 flex flex-col justify-between">
                <div>
                  <span className="text-[9px] uppercase font-extrabold text-[#6B8E6F] block tracking-wider">
                    {t.insightsCoursesHeader}
                  </span>
                  {courses.length > 0 ? (
                    <div className="space-y-1 mt-1">
                      {courses.map((c) => (
                        <span key={c.id} className="block text-[11px] font-bold text-[#2D241A] truncate">
                          🎓 {c.title}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-[10px] text-[#7D7061]/60 italic font-semibold block mt-1">
                      No matching courses found.
                    </span>
                  )}
                </div>
                <button
                  onClick={() => navigate('/learner/courses')}
                  className="text-[10px] font-bold text-deep-rose hover:underline text-left mt-2 flex items-center gap-0.5 cursor-pointer"
                >
                  <span>{t.seeAll}</span>
                  <ArrowRight className="h-3 w-3" />
                </button>
              </div>

              {/* Career Goal Insight */}
              <div className="p-3 bg-[#FFFDF9] border border-primary-gold/10 rounded-xl space-y-1.5 flex flex-col justify-between">
                <div>
                  <span className="text-[9px] uppercase font-extrabold text-[#6B8E6F] block tracking-wider">
                    {t.insightsCareerHeader}
                  </span>
                  <p className="text-[11px] font-bold text-[#2D241A] mt-1 line-clamp-2">
                    🎯 {user?.career_goal || t.insightsCareerEmpty}
                  </p>
                </div>
                <button
                  onClick={() => navigate('/learner/career-guidance')}
                  className="text-[10px] font-bold text-deep-rose hover:underline text-left mt-2 flex items-center gap-0.5 cursor-pointer"
                >
                  <span>{t.actionCareer}</span>
                  <ArrowRight className="h-3 w-3" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
