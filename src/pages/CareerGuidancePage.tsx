import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Sparkles, 
  Target, 
  CheckCircle, 
  AlertTriangle, 
  BookOpen, 
  Compass, 
  ChevronRight, 
  Briefcase, 
  Award, 
  Printer, 
  HelpCircle,
  TrendingUp,
  BrainCircuit
} from 'lucide-react';
import { useAuth } from '../services/authContext';

const UI_TRANSLATIONS: Record<string, any> = {
  en: {
    title: "AI Career Guidance & Pathway Engine",
    subtitle: "Discover suitable employment and entrepreneurship roadmaps personalized for you.",
    customGoalPlaceholder: "E.g., I want to start a custom stitching boutique from home...",
    customGoalLabel: "What is your current career goal? (Optional)",
    generateBtn: "Generate My Pathway",
    generating: "Analyzing your profile & designing your path...",
    careerPaths: "Suitable Employment Paths",
    entrepreneurship: "Entrepreneurship & Self-Employment",
    generalAdvice: "Advisor's General Advice",
    whySuitable: "Why this fits you",
    requiredSkills: "Skills Required",
    existingSkills: "Skills You Have",
    skillGaps: "Your Skill Gaps",
    recommendedLearning: "Recommended Learning Courses",
    nextSteps: "Actionable Next Steps",
    backToDashboard: "Back to Dashboard",
    noDataYet: "Click below to analyze your profile and generate your customized career roadmap!",
    roadmapStart: "START",
    roadmapEnd: "SUCCESS",
  },
  kn: {
    title: "AI ವೃತ್ತಿ ಮಾರ್ಗದರ್ಶನ ಮತ್ತು ಮಾರ್ಗಸೂಚಿ",
    subtitle: "ನಿಮಗಾಗಿ ವೈಯಕ್ತೀಕರಿಸಿದ ಸೂಕ್ತ ಉದ್ಯೋಗ ಮತ್ತು ಸ್ವಯಂ ಉದ್ಯೋಗದ ಮಾರ್ಗಸೂಚಿಗಳನ್ನು ಅನ್ವೇಷಿಸಿ.",
    customGoalPlaceholder: "ಉದಾಹರಣೆಗೆ, ನಾನು ಮನೆಯಿಂದಲೇ ಹೊಲಿಗೆ ಬೊಟಿಕ್ ಪ್ರಾರಂಭಿಸಲು ಬಯಸುತ್ತೇನೆ...",
    customGoalLabel: "ನಿಮ್ಮ ಪ್ರಸ್ತುತ ವೃತ್ತಿಜೀವನದ ಗುರಿ ಏನು? (ಐಚ್ಛಿಕ)",
    generateBtn: "ನನ್ನ ಮಾರ್ಗಸೂಚಿ ತಯಾರಿಸಿ",
    generating: "ನಿಮ್ಮ ಪ್ರೊಫೈಲ್ ಅನ್ನು ವಿಶ್ಲೇಷಿಸಲಾಗುತ್ತಿದೆ ಮತ್ತು ಮಾರ್ಗವನ್ನು ವಿನ್ಯಾಸಗೊಳಿಸಲಾಗುತ್ತಿದೆ...",
    careerPaths: "ಸೂಕ್ತ ಉದ್ಯೋಗ ಮಾರ್ಗಗಳು",
    entrepreneurship: "ಸ್ವಯಂ ಉದ್ಯೋಗ ಮತ್ತು ಉದ್ಯಮಶೀಲತೆ",
    generalAdvice: "ಸಲಹೆಗಾರರ ಸಾಮಾನ್ಯ ಸಲಹೆ",
    whySuitable: "ಇದು ನಿಮಗೆ ಏಕೆ ಸೂಕ್ತವಾಗಿದೆ",
    requiredSkills: "ಅಗತ್ಯವಿರುವ ಕೌಶಲ್ಯಗಳು",
    existingSkills: "ನೀವು ಹೊಂದಿರುವ ಕೌಶಲ್ಯಗಳು",
    skillGaps: "ನಿಮ್ಮ ಕೌಶಲ್ಯದ ಕೊರತೆಗಳು (Gaps)",
    recommendedLearning: "ಶಿಫಾರಸು ಮಾಡಲಾದ ಕೋರ್ಸ್‌ಗಳು",
    nextSteps: "ಪ್ರಾಯೋಗಿಕ ಮುಂದಿನ ಹಂತಗಳು",
    backToDashboard: "ಡ್ಯಾಶ್‌ಬೋರ್ಡ್‌ಗೆ ಹಿಂತಿರುಗಿ",
    noDataYet: "ನಿಮ್ಮ ಪ್ರೊಫೈಲ್ ಅನ್ನು ವಿಶ್ಲೇಷಿಸಲು ಮತ್ತು ನಿಮ್ಮ ಕಸ್ಟಮೈಸ್ ಮಾಡಿದ ವೃತ್ತಿ ಮಾರ್ಗಸೂಚಿಯನ್ನು ರಚಿಸಲು ಕೆಳಗೆ ಕ್ಲಿಕ್ ಮಾಡಿ!",
    roadmapStart: "ಪ್ರಾರಂಭ",
    roadmapEnd: "ಯಶಸ್ಸು",
  },
  hi: {
    title: "AI करियर मार्गदर्शन एवं मार्गदर्शिका",
    subtitle: "अपने लिए विशेष रूप से तैयार किए गए उपयुक्त रोजगार और स्वरोजगार के अवसरों की खोज करें।",
    customGoalPlaceholder: "जैसे, मैं घर से सिलाई बुटीक व्यवसाय शुरू करना चाहती हूँ...",
    customGoalLabel: "आपका वर्तमान करियर लक्ष्य क्या है? (वैकल्पिक)",
    generateBtn: "मेरा मार्गदर्शक रोडमैप बनाएं",
    generating: "आपके प्रोफाइल का विश्लेषण किया जा रहा है और रोडमैप तैयार हो रहा है...",
    careerPaths: "उपयुक्त रोजगार मार्ग (करियर पथ)",
    entrepreneurship: "स्वरोजगार एवं उद्यमिता के विकल्प",
    generalAdvice: "सलाहकार की सामान्य सलाह",
    whySuitable: "यह आपके लिए क्यों उपयुक्त है",
    requiredSkills: "आवश्यक कौशल",
    existingSkills: "कौशल जो आपके पास हैं",
    skillGaps: "आपके कौशल अंतराल (Gaps)",
    recommendedLearning: "अनुशंसित शिक्षण कोर्सेज",
    nextSteps: "व्यावहारिक अगले कदम",
    backToDashboard: "डैशबोर्ड पर वापस जाएं",
    noDataYet: "अपने प्रोफ़ाइल का विश्लेषण करने और अपने अनुकूलित करियर रोडमैप को उत्पन्न करने के लिए नीचे क्लिक करें!",
    roadmapStart: "शुरू",
    roadmapEnd: "सफलता",
  }
};

export default function CareerGuidancePage() {
  const { user } = useAuth();
  const lang = user?.preferred_language || 'en';
  const t = UI_TRANSLATIONS[lang] || UI_TRANSLATIONS['en'];

  const [goal, setGoal] = useState('');
  const [loading, setLoading] = useState(false);
  const [guidance, setGuidance] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Pre-fill goal from user profile if available
  useEffect(() => {
    if (user?.career_goal) {
      setGoal(user.career_goal);
    }
  }, [user]);

  const generatePathway = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('narinexus_token');
      const response = await fetch('/api/ai/career-guidance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ goal: goal.trim() || undefined })
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate career guidance roadmap');
      }

      const data = await response.json();
      setGuidance(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-cream text-[#3D2D1E] pb-12 print:bg-white print:text-black">
      {/* Top Banner */}
      <header className="bg-white border-b border-primary-gold/15 h-16 flex items-center justify-between px-6 sticky top-0 z-20 shadow-sm print:hidden">
        <div className="flex items-center space-x-3">
          <Link to="/learner" className="p-2 hover:bg-cream rounded-xl transition text-[#7D7061] hover:text-deep-rose">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <span className="font-serif text-sm font-extrabold tracking-wider">NariNexus AI Career Advisor</span>
        </div>
        <div className="flex items-center space-x-3">
          {guidance && (
            <button 
              onClick={handlePrint}
              className="flex items-center space-x-1.5 bg-cream/80 hover:bg-cream border border-primary-gold/10 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              <Printer className="h-4 w-4" />
              <span>Print Roadmap</span>
            </button>
          )}
          <Link 
            to="/learner" 
            className="bg-deep-rose hover:bg-deep-rose/95 text-white text-xs font-bold px-4 py-1.5 rounded-xl transition shadow-sm"
          >
            {t.backToDashboard}
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 mt-8 space-y-8">
        {/* Title Block */}
        <section className="text-center space-y-2.5 print:text-left print:mt-0">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 bg-gradient-to-r from-deep-rose/10 to-primary-gold/10 text-deep-rose text-[10px] font-extrabold uppercase tracking-widest border border-primary-gold/15 rounded-full print:hidden">
            <Sparkles className="h-3.5 w-3.5 animate-pulse text-deep-gold" />
            <span>AI Career Pathway Engine</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-extrabold text-[#2D241A] tracking-tight">{t.title}</h1>
          <p className="text-xs sm:text-sm text-[#7D7061] max-w-2xl mx-auto leading-relaxed font-semibold">{t.subtitle}</p>
        </section>

        {/* Goal Modifier Form */}
        <section className="bg-white border border-primary-gold/15 rounded-2xl p-6 shadow-sm print:hidden">
          <div className="space-y-4">
            <div className="flex items-center space-x-2 text-deep-gold font-bold">
              <Target className="h-5 w-5" />
              <label htmlFor="goal-input" className="text-sm font-serif">{t.customGoalLabel}</label>
            </div>
            <textarea
              id="goal-input"
              rows={2}
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder={t.customGoalPlaceholder}
              className="w-full text-xs p-3.5 border border-primary-gold/15 rounded-xl bg-[#FFFDF9] focus:outline-none focus:ring-1 focus:ring-deep-rose font-medium text-[#2D241A] placeholder-[#7D7061]/50"
            />
            <div className="flex justify-end pt-2">
              <button
                onClick={generatePathway}
                disabled={loading}
                className="w-full sm:w-auto bg-deep-rose hover:bg-deep-rose/95 disabled:bg-deep-rose/60 text-white font-bold text-xs uppercase tracking-wider px-6 py-3 rounded-xl transition shadow-md flex items-center justify-center space-x-2 cursor-pointer"
              >
                {loading ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    <span>{t.generating}</span>
                  </>
                ) : (
                  <>
                    <BrainCircuit className="h-4.5 w-4.5 text-white animate-pulse" />
                    <span>{t.generateBtn}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </section>

        {/* Loading / Generating State Card */}
        {loading && (
          <div className="bg-[#FFFDF9] border border-dashed border-primary-gold/25 rounded-2xl p-12 text-center shadow-inner space-y-4">
            <div className="relative w-16 h-16 mx-auto">
              <div className="absolute inset-0 rounded-full border-4 border-primary-gold/10" />
              <div className="absolute inset-0 rounded-full border-4 border-deep-rose border-t-transparent animate-spin" />
              <Sparkles className="absolute inset-0 m-auto h-6 w-6 text-deep-gold animate-bounce" />
            </div>
            <div className="space-y-2">
              <h3 className="text-sm font-serif font-bold text-[#2D241A]">{t.generating}</h3>
              <p className="text-[11px] text-[#7D7061] italic font-semibold">"Aligning your skills catalogue with local micro-business opportunities..."</p>
            </div>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 border border-red-200/60 rounded-xl p-4 flex items-start space-x-3 text-red-800">
            <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
            <div className="text-xs space-y-1 font-semibold">
              <p className="font-bold">Error Occurred</p>
              <p>{error}</p>
            </div>
          </div>
        )}

        {/* Dynamic AI Results View */}
        {guidance && !loading && (
          <div className="space-y-8 animate-fade-in">
            {/* General Advice Banner */}
            <section className="bg-gradient-to-tr from-[#FFFDF9] to-white border border-primary-gold/15 rounded-2xl p-6 shadow-sm relative overflow-hidden">
              <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-primary-gold/5 rounded-full" />
              <div className="space-y-3 relative z-10">
                <h3 className="font-serif text-sm font-extrabold text-[#2D241A] uppercase tracking-wider flex items-center space-x-2 border-b border-primary-gold/10 pb-2.5">
                  <Compass className="h-5 w-5 text-deep-gold" />
                  <span>{t.generalAdvice}</span>
                </h3>
                <p className="text-xs sm:text-sm text-[#4A3E31] leading-relaxed font-semibold whitespace-pre-wrap">
                  {guidance.general_advice}
                </p>
              </div>
            </section>

            {/* Employment Pathways */}
            <section className="space-y-4">
              <div className="flex items-center space-x-2 pb-2 border-b border-primary-gold/10">
                <Briefcase className="h-5 w-5 text-deep-rose" />
                <h2 className="font-serif text-lg font-extrabold text-[#2D241A] uppercase tracking-wide">{t.careerPaths}</h2>
              </div>

              <div className="grid grid-cols-1 gap-6">
                {guidance.career_paths?.map((path: any, index: number) => (
                  <div key={index} className="bg-white border border-primary-gold/15 rounded-2xl p-6 shadow-sm space-y-6">
                    {/* Header */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-start">
                        <h3 className="font-serif text-base font-extrabold text-deep-rose">{path.title}</h3>
                        <span className="text-[10px] bg-soft-yellow/60 text-deep-gold border border-primary-gold/20 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">Employment</span>
                      </div>
                      <p className="text-xs text-[#2D241A] font-semibold leading-relaxed">{path.description}</p>
                    </div>

                    {/* Why Suitable */}
                    <div className="bg-[#FFFDF9] p-4 rounded-xl border border-primary-gold/10">
                      <h4 className="text-[10px] uppercase font-extrabold tracking-widest text-[#7D7061] mb-1">{t.whySuitable}</h4>
                      <p className="text-xs text-[#4A3E31] font-semibold">{path.why_suitable}</p>
                    </div>

                    {/* Skill Gap Analysis Box */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
                      <div className="bg-green-50/40 p-4 rounded-xl border border-green-200/25 space-y-2">
                        <span className="text-[9px] font-black uppercase tracking-widest text-green-700 flex items-center">
                          <CheckCircle className="h-3.5 w-3.5 mr-1.5 text-green-600" />
                          {t.existingSkills}
                        </span>
                        {path.existing_skills?.length > 0 ? (
                          <ul className="text-xs font-semibold text-green-900 space-y-1 list-disc list-inside">
                            {path.existing_skills.map((s: string, idx: number) => (
                              <li key={idx} className="truncate">{s}</li>
                            ))}
                          </ul>
                        ) : (
                          <span className="text-[10px] text-green-600/60 italic font-medium">None detected yet</span>
                        )}
                      </div>

                      <div className="bg-orange-50/40 p-4 rounded-xl border border-orange-200/25 space-y-2">
                        <span className="text-[9px] font-black uppercase tracking-widest text-orange-700 flex items-center">
                          <Compass className="h-3.5 w-3.5 mr-1.5 text-orange-600" />
                          {t.requiredSkills}
                        </span>
                        <ul className="text-xs font-semibold text-orange-900 space-y-1 list-disc list-inside">
                          {path.required_skills?.map((s: string, idx: number) => (
                            <li key={idx} className="truncate">{s}</li>
                          ))}
                        </ul>
                      </div>

                      <div className="bg-red-50/40 p-4 rounded-xl border border-red-200/25 space-y-2">
                        <span className="text-[9px] font-black uppercase tracking-widest text-red-700 flex items-center">
                          <AlertTriangle className="h-3.5 w-3.5 mr-1.5 text-red-600 animate-pulse" />
                          {t.skillGaps}
                        </span>
                        <ul className="text-xs font-semibold text-red-900 space-y-1 list-disc list-inside">
                          {path.skill_gaps?.map((s: string, idx: number) => (
                            <li key={idx} className="truncate">{s}</li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Learning Roadmap timeline */}
                    <div className="space-y-3.5 pt-2">
                      <span className="text-[9px] font-extrabold uppercase tracking-widest text-[#7D7061] block">{t.recommendedLearning}</span>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[9px] bg-deep-rose/10 text-deep-rose font-black px-2.5 py-1 rounded-md uppercase tracking-wider">{t.roadmapStart}</span>
                        <ChevronRight className="h-4 w-4 text-[#7D7061]/40 shrink-0" />
                        {path.recommended_learning?.map((item: string, idx: number) => (
                          <React.Fragment key={idx}>
                            <div className="flex items-center space-x-1.5 bg-[#FFF9F2] border border-primary-gold/15 rounded-xl px-4 py-2 text-xs font-bold text-[#2D241A]">
                              <BookOpen className="h-4 w-4 text-deep-gold shrink-0" />
                              <span>{item}</span>
                            </div>
                            <ChevronRight className="h-4 w-4 text-[#7D7061]/40 shrink-0" />
                          </React.Fragment>
                        ))}
                        <span className="text-[9px] bg-[#8FBC8F]/20 text-[#2E8B57] font-black px-2.5 py-1 rounded-md uppercase tracking-wider">{t.roadmapEnd}</span>
                      </div>
                    </div>

                    {/* Next Steps Checklist */}
                    <div className="space-y-3 border-t border-[#FFF9F2] pt-4">
                      <span className="text-[9px] font-extrabold uppercase tracking-widest text-[#7D7061] block">{t.nextSteps}</span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-semibold">
                        {path.next_steps?.map((step: string, idx: number) => (
                          <div key={idx} className="flex items-start space-x-2.5 p-2.5 bg-cream/20 rounded-xl border border-primary-gold/5">
                            <span className="text-deep-gold text-xs shrink-0 mt-0.5">📌</span>
                            <span className="text-[#4A3E31] leading-relaxed">{step}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Entrepreneurship Pathways */}
            <section className="space-y-4">
              <div className="flex items-center space-x-2 pb-2 border-b border-primary-gold/10">
                <Award className="h-5 w-5 text-deep-gold" />
                <h2 className="font-serif text-lg font-extrabold text-[#2D241A] uppercase tracking-wide">{t.entrepreneurship}</h2>
              </div>

              <div className="grid grid-cols-1 gap-6">
                {guidance.entrepreneurship_options?.map((option: any, index: number) => (
                  <div key={index} className="bg-white border border-primary-gold/15 rounded-2xl p-6 shadow-sm space-y-6">
                    {/* Header */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-start">
                        <h3 className="font-serif text-base font-extrabold text-deep-gold">{option.title}</h3>
                        <span className="text-[10px] bg-[#8FBC8F]/20 text-green-700 border border-green-200/20 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">Self-Employment</span>
                      </div>
                      <p className="text-xs text-[#2D241A] font-semibold leading-relaxed">{option.description}</p>
                    </div>

                    {/* Why Suitable */}
                    <div className="bg-[#FFFDF9] p-4 rounded-xl border border-primary-gold/10">
                      <h4 className="text-[10px] uppercase font-extrabold tracking-widest text-[#7D7061] mb-1">{t.whySuitable}</h4>
                      <p className="text-xs text-[#4A3E31] font-semibold">{option.why_suitable}</p>
                    </div>

                    {/* Skill Gap Analysis Box */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
                      <div className="bg-green-50/40 p-4 rounded-xl border border-green-200/25 space-y-2">
                        <span className="text-[9px] font-black uppercase tracking-widest text-green-700 flex items-center">
                          <CheckCircle className="h-3.5 w-3.5 mr-1.5 text-green-600" />
                          {t.existingSkills}
                        </span>
                        {option.existing_skills?.length > 0 ? (
                          <ul className="text-xs font-semibold text-green-900 space-y-1 list-disc list-inside">
                            {option.existing_skills.map((s: string, idx: number) => (
                              <li key={idx} className="truncate">{s}</li>
                            ))}
                          </ul>
                        ) : (
                          <span className="text-[10px] text-green-600/60 italic font-medium">None detected yet</span>
                        )}
                      </div>

                      <div className="bg-orange-50/40 p-4 rounded-xl border border-orange-200/25 space-y-2">
                        <span className="text-[9px] font-black uppercase tracking-widest text-orange-700 flex items-center">
                          <Compass className="h-3.5 w-3.5 mr-1.5 text-orange-600" />
                          {t.requiredSkills}
                        </span>
                        <ul className="text-xs font-semibold text-orange-900 space-y-1 list-disc list-inside">
                          {option.required_skills?.map((s: string, idx: number) => (
                            <li key={idx} className="truncate">{s}</li>
                          ))}
                        </ul>
                      </div>

                      <div className="bg-red-50/40 p-4 rounded-xl border border-red-200/25 space-y-2">
                        <span className="text-[9px] font-black uppercase tracking-widest text-red-700 flex items-center">
                          <AlertTriangle className="h-3.5 w-3.5 mr-1.5 text-red-600 animate-pulse" />
                          {t.skillGaps}
                        </span>
                        <ul className="text-xs font-semibold text-red-900 space-y-1 list-disc list-inside">
                          {option.skill_gaps?.map((s: string, idx: number) => (
                            <li key={idx} className="truncate">{s}</li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Learning Roadmap timeline */}
                    <div className="space-y-3.5 pt-2">
                      <span className="text-[9px] font-extrabold uppercase tracking-widest text-[#7D7061] block">{t.recommendedLearning}</span>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[9px] bg-deep-rose/10 text-deep-rose font-black px-2.5 py-1 rounded-md uppercase tracking-wider">{t.roadmapStart}</span>
                        <ChevronRight className="h-4 w-4 text-[#7D7061]/40 shrink-0" />
                        {option.recommended_learning?.map((item: string, idx: number) => (
                          <React.Fragment key={idx}>
                            <div className="flex items-center space-x-1.5 bg-[#FFF9F2] border border-primary-gold/15 rounded-xl px-4 py-2 text-xs font-bold text-[#2D241A]">
                              <BookOpen className="h-4 w-4 text-deep-gold shrink-0" />
                              <span>{item}</span>
                            </div>
                            <ChevronRight className="h-4 w-4 text-[#7D7061]/40 shrink-0" />
                          </React.Fragment>
                        ))}
                        <span className="text-[9px] bg-[#8FBC8F]/20 text-[#2E8B57] font-black px-2.5 py-1 rounded-md uppercase tracking-wider">{t.roadmapEnd}</span>
                      </div>
                    </div>

                    {/* Next Steps Checklist */}
                    <div className="space-y-3 border-t border-[#FFF9F2] pt-4">
                      <span className="text-[9px] font-extrabold uppercase tracking-widest text-[#7D7061] block">{t.nextSteps}</span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-semibold">
                        {option.next_steps?.map((step: string, idx: number) => (
                          <div key={idx} className="flex items-start space-x-2.5 p-2.5 bg-cream/20 rounded-xl border border-primary-gold/5">
                            <span className="text-green-700 text-xs shrink-0 mt-0.5">🌱</span>
                            <span className="text-[#4A3E31] leading-relaxed">{step}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {/* Placeholder / Empty State */}
        {!guidance && !loading && (
          <div className="bg-[#FFFDF9] border border-dashed border-primary-gold/20 rounded-2xl p-12 text-center shadow-inner space-y-4">
            <TrendingUp className="h-10 w-10 text-deep-gold/40 mx-auto" />
            <div className="space-y-1.5">
              <h3 className="text-sm font-serif font-bold text-[#2D241A]">{t.noDataYet}</h3>
              <p className="text-[11px] text-[#7D7061] max-w-md mx-auto leading-relaxed font-semibold">
                Our AI guide will map your skills and interests to concrete local pathways. Try it out now!
              </p>
            </div>
            <button
              onClick={generatePathway}
              className="bg-deep-rose hover:bg-deep-rose/95 text-white font-bold text-xs uppercase tracking-wider px-6 py-3 rounded-xl transition shadow-md cursor-pointer"
            >
              Analyze &amp; Advise Me
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
