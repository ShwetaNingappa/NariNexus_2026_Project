import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Sparkles, 
  ArrowLeft, 
  CheckCircle, 
  BookOpen, 
  Target, 
  MapPin, 
  Briefcase, 
  Play, 
  Loader2, 
  AlertCircle, 
  Layers, 
  HeartHandshake, 
  ArrowRight,
  TrendingUp,
  Award,
  Globe
} from 'lucide-react';
import { useAuth } from '../services/authContext';

interface Opportunity {
  id: string;
  title: string;
  type: string;
  description: string;
  required_skills: string[];
  preferred_skills: string[];
  location: string;
  remote_mode: string;
  earning_info: string;
  organization: string;
  application_info: string;
  status: string;
  recommendation_score?: number;
}

interface ActionStep {
  id: string;
  title: string;
  description: string;
  status: 'not_started' | 'in_progress' | 'completed';
  suggested_action: string;
}

interface ActionPlan {
  opportunity_id?: string;
  opportunity_title?: string;
  goal: string;
  steps: ActionStep[];
  updated_at: string;
}

interface MatchAnalysis {
  opportunity_id: string;
  matching_skills: string[];
  missing_skills: string[];
  missing_preferred: string[];
  recommended_courses: string[];
  ai_match_explanation: string;
}

const LOCALIZATION: Record<string, Record<string, string>> = {
  en: {
    heading: "Opportunities & Career Action Planner",
    subheading: "Discover tailored work, evaluate skill gaps, and track your immediate steps to independent earning.",
    recommendedTab: "Recommended For You",
    allTab: "All Opportunities",
    emptyOpps: "No opportunities available right now.",
    reqSkills: "Required Skills",
    prefSkills: "Preferred Skills",
    matchBtn: "Analyze Skill Match",
    createPlanBtn: "Create Action Plan",
    earningLabel: "Potential Earnings:",
    locationLabel: "Location:",
    typeLabel: "Employment Type:",
    agencyLabel: "Organization:",
    appInfoLabel: "How to Apply:",
    matchAnalysisTitle: "AI Match & Gap Analysis",
    matchSkillsTitle: "Your Matching Skills",
    missingSkillsTitle: "Skills Needed (Gaps)",
    recommendedCoursesTitle: "Recommended Courses on NariNexus",
    matchingGlow: "Excellent Match!",
    partialGlow: "Good potential. Boost your preparation!",
    actionPlanTitle: "My Career Action Plan Tracker",
    actionPlanSub: "Step-by-step progress towards your goal.",
    stepNotStarted: "Not Started",
    stepInProgress: "In Progress",
    stepCompleted: "Completed",
    completeMsg: "Great work! You are building local livelihood readiness.",
    errorMsg: "Failed to connect to NariNexus service. Please try again in a few seconds.",
    loadingMsg: "Analyzing skill matches & preparing your personal route...",
    goalLabel: "Active Target Goal:",
    viewCourseBtn: "Start Learning",
    updateSuccess: "Step status updated!",
    isolationError: "Security Alert: Authorization mismatch."
  },
  kn: {
    heading: "ಅವಕಾಶಗಳು ಮತ್ತು ವೃತ್ತಿ ಕ್ರಿಯಾ ಯೋಜನೆ",
    subheading: "ನಿಮ್ಮ ಕೌಶಲ್ಯಗಳಿಗೆ ಹೊಂದುವ ಉದ್ಯೋಗಾವಕಾಶಗಳನ್ನು ಅನ್ವೇಷಿಸಿ, ಕೊರತೆಗಳನ್ನು ಕಂಡುಹಿಡಿಯಿರಿ ಮತ್ತು ಯಶಸ್ಸಿನ ಹೆಜ್ಜೆಗಳನ್ನು ಟ್ರ್ಯಾಕ್ ಮಾಡಿ.",
    recommendedTab: "ನಿಮಗಾಗಿ ಶಿಫಾರಸು ಮಾಡಲಾದವು",
    allTab: "ಎಲ್ಲಾ ಅವಕಾಶಗಳು",
    emptyOpps: "ಪ್ರಸ್ತುತ ಯಾವುದೇ ಅವಕಾಶಗಳು ಲಭ್ಯವಿಲ್ಲ.",
    reqSkills: "ಅಗತ್ಯವಿರುವ ಕೌಶಲ್ಯಗಳು",
    prefSkills: "ಹೆಚ್ಚುವರಿ ಕೌಶಲ್ಯಗಳು",
    matchBtn: "ಕೌಶಲ್ಯ ಹೊಂದಾಣಿಕೆ ಪರಿಶೀಲಿಸಿ",
    createPlanBtn: "ಕ್ರಿಯಾ ಯೋಜನೆ ರಚಿಸಿ",
    earningLabel: "ಸಂಭಾವ್ಯ ಆದಾಯ:",
    locationLabel: "ಸ್ಥಳ:",
    typeLabel: "ಕೆಲಸದ ಪ್ರಕಾರ:",
    agencyLabel: "ಸಂಸ್ಥೆ:",
    appInfoLabel: "ಅರ್ಜಿ ಸಲ್ಲಿಸುವುದು ಹೇಗೆ:",
    matchAnalysisTitle: "AI ಹೊಂದಾಣಿಕೆ ಮತ್ತು ಕೊರತೆ ವಿಶ್ಲೇಷಣೆ",
    matchSkillsTitle: "ನಿಮ್ಮಲ್ಲಿರುವ ಕೌಶಲ್ಯಗಳು",
    missingSkillsTitle: "ಕಲಿಯಬೇಕಾದ ಕೌಶಲ್ಯಗಳು (ಕೊರತೆ)",
    recommendedCoursesTitle: "ನಾರಿನೆಕ್ಸಸ್ ಶಿಫಾರಸು ಮಾಡಿದ ಕೋರ್ಸ್‌ಗಳು",
    matchingGlow: "ಅತ್ಯುತ್ತಮ ಹೊಂದಾಣಿಕೆ!",
    partialGlow: "ಉತ್ತಮ ಸಾಮರ್ಥ್ಯವಿದೆ. ಸಿದ್ಧತೆ ಹೆಚ್ಚಿಸಿಕೊಳ್ಳಿ!",
    actionPlanTitle: "ನನ್ನ ವೈಯಕ್ತಿಕ ಕ್ರಿಯಾ ಯೋಜನೆ ಟ್ರ್ಯಾಕರ್",
    actionPlanSub: "ನಿಮ್ಮ ಗುರಿಯತ್ತ ಹೆಜ್ಜೆ-ಹೆಜ್ಜೆಯ ಪ್ರಗತಿ.",
    stepNotStarted: "ಪ್ರಾರಂಭಿಸಿಲ್ಲ",
    stepInProgress: "ಪ್ರಗತಿಯಲ್ಲಿದೆ",
    stepCompleted: "ಪೂರ್ಣಗೊಂಡಿದೆ",
    completeMsg: "ಅದ್ಭುತ ಕೆಲಸ! ನೀವು ಸ್ವಾವಲಂಬನೆಯ ಹಾದಿಯಲ್ಲಿದ್ದೀರಿ.",
    errorMsg: "ನಾರಿನೆಕ್ಸಸ್ ಸೇವೆಗೆ ಸಂಪರ್ಕಿಸಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ. ದಯವಿಟ್ಟು ಕೆಲವು ಸೆಕೆಂಡುಗಳ ನಂತರ ಪ್ರಯತ್ನಿಸಿ.",
    loadingMsg: "ಕೌಶಲ್ಯ ಹೊಂದಾಣಿಕೆಯನ್ನು ವಿಶ್ಲೇಷಿಸಲಾಗುತ್ತಿದೆ...",
    goalLabel: "ಸಕ್ರಿಯ ಗುರಿ:",
    viewCourseBtn: "ಕಲಿಯಲು ಪ್ರಾರಂಭಿಸಿ",
    updateSuccess: "ಹಂತದ ಸ್ಥಿತಿ ನವೀಕರಿಸಲಾಗಿದೆ!",
    isolationError: "ಭದ್ರತಾ ಎಚ್ಚರಿಕೆ: ದೃಢೀಕರಣ ದೋಷ."
  },
  hi: {
    heading: "अवसर एवं करियर कार्य योजना",
    subheading: "अपने अनुकूल काम खोजें, कौशल अंतराल का मूल्यांकन करें और आत्मनिर्भर आय की दिशा में अपने कदमों को ट्रैक करें।",
    recommendedTab: "आपके लिए अनुशंसित",
    allTab: "सभी अवसर",
    emptyOpps: "वर्तमान में कोई अवसर उपलब्ध नहीं हैं।",
    reqSkills: "आवश्यक कौशल",
    prefSkills: "पसंदीदा कौशल",
    matchBtn: "कौशल मिलान जांचें",
    createPlanBtn: "कार्य योजना तैयार करें",
    earningLabel: "संभावित आय:",
    locationLabel: "स्थान:",
    typeLabel: "रोजगार का प्रकार:",
    agencyLabel: "संगठन:",
    appInfoLabel: "आवेदन कैसे करें:",
    matchAnalysisTitle: "AI मिलान और अंतराल विश्लेषण",
    matchSkillsTitle: "आपके मेल खाते कौशल",
    missingSkillsTitle: "आवश्यक कौशल (अंतराल)",
    recommendedCoursesTitle: "नारीनेक्सस पर अनुशंसित कोर्सेज",
    matchingGlow: "उत्कृष्ट मिलान!",
    partialGlow: "अच्छा सामर्थ्य है। अपनी तैयारी को और बढ़ाएं!",
    actionPlanTitle: "मेरी व्यक्तिगत कार्य योजना ट्रैकर",
    actionPlanSub: "आपके लक्ष्य की ओर चरण-दर-चरण प्रगति।",
    stepNotStarted: "शुरू नहीं हुआ",
    stepInProgress: "प्रगति पर है",
    stepCompleted: "पूर्ण हुआ",
    completeMsg: "बहुत बढ़िया! आप स्थानीय आजीविका की दिशा में अग्रसर हैं।",
    errorMsg: "नारीनेक्सस सेवा से जुड़ने में विफल। कृपया कुछ सेकंड बाद पुनः प्रयास करें।",
    loadingMsg: "कौशल मिलान का विश्लेषण किया जा रहा है...",
    goalLabel: "सक्रिय लक्ष्य:",
    viewCourseBtn: "सीखना शुरू करें",
    updateSuccess: "चरण की स्थिति अपडेट की गई!",
    isolationError: "सुरक्षा चेतावनी: प्राधिकरण विसंगति।"
  }
};

export default function OpportunitiesPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const lang = user?.preferred_language || 'en';
  const t = LOCALIZATION[lang] || LOCALIZATION['en'];

  const [activeTab, setActiveTab] = useState<'recommended' | 'all'>('recommended');
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [selectedOpp, setSelectedOpp] = useState<Opportunity | null>(null);
  const [matchAnalysis, setMatchAnalysis] = useState<MatchAnalysis | null>(null);
  const [actionPlan, setActionPlan] = useState<ActionPlan | null>(null);
  
  const [loadingOpps, setLoadingOpps] = useState(true);
  const [loadingMatch, setLoadingMatch] = useState(false);
  const [loadingPlan, setLoadingPlan] = useState(false);
  const [updatingStep, setUpdatingStep] = useState<string | null>(null);
  
  const [error, setError] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Load opportunities on mount
  useEffect(() => {
    fetchOpportunities();
    fetchGeneralActionPlan();
  }, [activeTab]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const fetchOpportunities = async () => {
    const token = localStorage.getItem('narinexus_token');
    if (!token) {
      navigate('/login');
      return;
    }
    try {
      setLoadingOpps(true);
      setError(null);
      const url = activeTab === 'recommended' ? '/api/opportunities/recommended' : '/api/opportunities';
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setOpportunities(data);
        if (data.length > 0 && !selectedOpp) {
          setSelectedOpp(data[0]);
        }
      } else {
        setError(t.errorMsg);
      }
    } catch (err) {
      console.error(err);
      setError(t.errorMsg);
    } finally {
      setLoadingOpps(false);
    }
  };

  const fetchGeneralActionPlan = async () => {
    const token = localStorage.getItem('narinexus_token');
    if (!token) return;
    try {
      const res = await fetch('/api/opportunities/action-plan', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.action_plan) {
          setActionPlan(data.action_plan);
        }
      }
    } catch (err) {
      console.warn("Failed to load general action plan", err);
    }
  };

  const handleAnalyzeMatch = async (oppId: string) => {
    const token = localStorage.getItem('narinexus_token');
    if (!token) return;
    try {
      setLoadingMatch(true);
      setError(null);
      const res = await fetch(`/api/opportunities/${oppId}/match`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.status === 429) {
        setError("Rate limit exceeded. Please wait a few seconds before requesting matching again.");
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setMatchAnalysis(data);
      } else {
        setError(t.errorMsg);
      }
    } catch (err) {
      console.error(err);
      setError(t.errorMsg);
    } finally {
      setLoadingMatch(false);
    }
  };

  const handleCreateActionPlan = async (oppId: string) => {
    const token = localStorage.getItem('narinexus_token');
    if (!token) return;
    try {
      setLoadingPlan(true);
      setError(null);
      const res = await fetch(`/api/opportunities/${oppId}/action-plan`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.status === 429) {
        setError("Rate limit exceeded. Please wait a few seconds before creating plans.");
        return;
      }
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.action_plan) {
          setActionPlan(data.action_plan);
          showToast(t.updateSuccess);
        }
      } else {
        setError(t.errorMsg);
      }
    } catch (err) {
      console.error(err);
      setError(t.errorMsg);
    } finally {
      setLoadingPlan(false);
    }
  };

  const handleUpdateStepStatus = async (stepId: string, newStatus: string) => {
    const token = localStorage.getItem('narinexus_token');
    if (!token) return;
    try {
      setUpdatingStep(stepId);
      const res = await fetch(`/api/opportunities/action-plan/steps/${stepId}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.action_plan) {
          setActionPlan(data.action_plan);
          showToast(t.updateSuccess);
        }
      } else {
        showToast(t.isolationError);
      }
    } catch (err) {
      console.error(err);
      showToast(t.errorMsg);
    } finally {
      setUpdatingStep(null);
    }
  };

  // Calculate Action Plan Completion percentage
  const getPlanProgressPercent = () => {
    if (!actionPlan || !actionPlan.steps || actionPlan.steps.length === 0) return 0;
    const completed = actionPlan.steps.filter(s => s.status === 'completed').length;
    return Math.round((completed / actionPlan.steps.length) * 100);
  };

  return (
    <div className="min-h-screen bg-cream text-[#3D2D1E] pb-16">
      {/* Toast Alert */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#2D241A] text-white px-5 py-3 rounded-xl shadow-lg border border-primary-gold/25 flex items-center gap-2 text-xs font-bold animate-bounce">
          <CheckCircle className="h-4 w-4 text-green-400" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Hero Header Banner */}
      <div className="bg-white border-b border-primary-gold/15 py-8 px-6 sm:px-12">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <Link to="/learner" className="inline-flex items-center gap-1.5 text-xs font-bold text-[#7D7061] hover:text-deep-rose transition">
              <ArrowLeft className="h-4.5 w-4.5" />
              <span>Back to Dashboard</span>
            </Link>
            <h1 className="font-serif text-2xl sm:text-3xl font-extrabold text-[#2D241A] tracking-tight uppercase flex items-center gap-2.5">
              <Sparkles className="h-7 w-7 text-deep-gold animate-pulse shrink-0" />
              <span>{t.heading}</span>
            </h1>
            <p className="text-xs sm:text-sm text-[#7D7061] font-medium max-w-2xl leading-relaxed">
              {t.subheading}
            </p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-sage-green/15 text-green-800 border border-green-200/50 rounded-2xl self-start md:self-auto text-xs font-black uppercase tracking-wider">
            <Globe className="h-4.5 w-4.5 text-deep-gold animate-spin-slow" />
            <span>Multilingual AI Shield Enabled</span>
          </div>
        </div>
      </div>

      {/* Main Responsive Grid Layout */}
      <div className="max-w-7xl mx-auto px-6 sm:px-12 mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Listings & Selector (40%) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Navigation Tabs */}
          <div className="bg-white border border-primary-gold/15 rounded-2xl p-1.5 flex gap-1.5">
            <button
              onClick={() => { setActiveTab('recommended'); setMatchAnalysis(null); }}
              className={`flex-1 py-3 text-center rounded-xl text-xs font-black uppercase tracking-wider transition ${activeTab === 'recommended' ? 'bg-deep-rose text-white shadow-sm' : 'hover:bg-cream text-[#7D7061]'}`}
            >
              {t.recommendedTab}
            </button>
            <button
              onClick={() => { setActiveTab('all'); setMatchAnalysis(null); }}
              className={`flex-1 py-3 text-center rounded-xl text-xs font-black uppercase tracking-wider transition ${activeTab === 'all' ? 'bg-deep-rose text-white shadow-sm' : 'hover:bg-cream text-[#7D7061]'}`}
            >
              {t.allTab}
            </button>
          </div>

          {/* Opportunities Cards Stack */}
          {loadingOpps ? (
            <div className="bg-white border border-primary-gold/10 rounded-2xl p-12 text-center">
              <Loader2 className="h-8 w-8 text-primary-gold animate-spin mx-auto mb-3" />
              <p className="text-xs font-extrabold text-[#7D7061] tracking-wide uppercase">Searching opportunities...</p>
            </div>
          ) : opportunities.length === 0 ? (
            <div className="bg-white border border-primary-gold/10 rounded-2xl p-12 text-center">
              <Briefcase className="h-10 w-10 text-primary-gold/45 mx-auto mb-3" />
              <p className="text-xs font-bold text-[#7D7061]">{t.emptyOpps}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {opportunities.map((opp) => (
                <div
                  key={opp.id}
                  onClick={() => { setSelectedOpp(opp); setMatchAnalysis(null); }}
                  className={`bg-white border rounded-2xl p-5 cursor-pointer transition-all hover:shadow-md ${selectedOpp?.id === opp.id ? 'border-deep-rose ring-1 ring-deep-rose bg-[#FFFDF9]' : 'border-primary-gold/15 hover:border-primary-gold/30'}`}
                >
                  <div className="flex justify-between items-start gap-3">
                    <div>
                      <span className="text-[9px] uppercase font-black px-2 py-0.5 bg-cream text-deep-rose rounded-md border border-primary-gold/10">
                        {opp.type}
                      </span>
                      <h3 className="font-serif text-sm font-extrabold text-[#2D241A] mt-2 leading-snug">
                        {opp.title}
                      </h3>
                      <p className="text-[10px] text-[#7D7061] font-bold mt-1">
                        🏢 {opp.organization}
                      </p>
                    </div>
                    {opp.recommendation_score !== undefined && opp.recommendation_score > 0 && (
                      <span className="text-[9px] font-extrabold uppercase px-2 py-1 bg-sage-green/20 text-green-800 rounded-lg shrink-0 border border-green-200">
                        🎯 {opp.recommendation_score * 30}% AI MATCH
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-4 mt-4 pt-3 border-t border-primary-gold/10 text-[10px] text-[#7D7061] font-bold">
                    <span className="flex items-center gap-1">
                      <TrendingUp className="h-3.5 w-3.5 text-deep-gold" />
                      {opp.earning_info}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5 text-deep-rose" />
                      {opp.remote_mode}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Selected Detail & Planner (60%) */}
        <div className="lg:col-span-7 space-y-6">
          
          {selectedOpp ? (
            <div className="bg-white border border-primary-gold/15 rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
              
              {/* Header Title & Earn Info */}
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] uppercase font-black px-3 py-1 bg-deep-rose/10 text-deep-rose border border-deep-rose/25 rounded-full">
                    {selectedOpp.type}
                  </span>
                  <span className="text-[10px] uppercase font-black px-3 py-1 bg-cream border border-primary-gold/15 text-[#7D7061] rounded-full">
                    📍 {selectedOpp.location}
                  </span>
                </div>
                
                <h2 className="font-serif text-lg sm:text-xl font-extrabold text-[#2D241A] leading-snug">
                  {selectedOpp.title}
                </h2>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[#FFFDF9] border border-primary-gold/10 rounded-2xl p-4">
                  <div className="text-xs font-bold text-[#7D7061]">
                    <span>{t.earningLabel} </span>
                    <span className="block text-sm text-deep-rose font-black mt-1">
                      {selectedOpp.earning_info}
                    </span>
                  </div>
                  <div className="text-xs font-bold text-[#7D7061]">
                    <span>{t.agencyLabel} </span>
                    <span className="block text-sm text-[#2D241A] font-black mt-1">
                      {selectedOpp.organization}
                    </span>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <h4 className="text-[10px] font-extrabold tracking-wider text-deep-gold uppercase">Description</h4>
                <p className="text-xs text-[#4A3E31] leading-relaxed font-semibold">
                  {selectedOpp.description}
                </p>
              </div>

              {/* Required & Preferred Skills Matrix */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="text-[10px] font-extrabold tracking-wider text-deep-gold uppercase">{t.reqSkills}</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedOpp.required_skills.map((skill, idx) => (
                      <span key={idx} className="text-[10px] font-black bg-cream border border-primary-gold/15 px-2.5 py-1 rounded-full text-[#4A3E31]">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <h4 className="text-[10px] font-extrabold tracking-wider text-deep-gold uppercase">{t.prefSkills}</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedOpp.preferred_skills.map((skill, idx) => (
                      <span key={idx} className="text-[10px] font-black bg-[#FFF9F2] border border-primary-gold/10 px-2.5 py-1 rounded-full text-[#7D7061]">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Secure Evaluation Actions Panel */}
              <div className="pt-4 border-t border-primary-gold/10 flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => handleAnalyzeMatch(selectedOpp.id)}
                  disabled={loadingMatch}
                  className="flex-1 py-3 bg-deep-rose hover:bg-deep-rose/95 disabled:bg-deep-rose/65 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-sm transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  {loadingMatch ? (
                    <>
                      <Loader2 className="h-4.5 w-4.5 animate-spin" />
                      <span>{t.loadingMsg}</span>
                    </>
                  ) : (
                    <>
                      <Target className="h-4.5 w-4.5" />
                      <span>{t.matchBtn}</span>
                    </>
                  )}
                </button>
                <button
                  onClick={() => handleCreateActionPlan(selectedOpp.id)}
                  disabled={loadingPlan}
                  className="flex-1 py-3 bg-white hover:bg-cream text-deep-rose border border-deep-rose/25 rounded-xl text-xs font-black uppercase tracking-wider transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  {loadingPlan ? (
                    <Loader2 className="h-4.5 w-4.5 animate-spin" />
                  ) : (
                    <Layers className="h-4.5 w-4.5" />
                  )}
                  <span>{t.createPlanBtn}</span>
                </button>
              </div>

              {/* Match and Gap Evaluation Outputs */}
              {matchAnalysis && (
                <div className="pt-6 border-t border-primary-gold/10 space-y-5 animate-fade-in">
                  <div className="flex items-center justify-between border-b border-primary-gold/10 pb-2">
                    <h3 className="font-serif text-sm font-black uppercase text-[#2D241A] tracking-wider">
                      {t.matchAnalysisTitle}
                    </h3>
                    <span className={`text-[9px] font-extrabold uppercase px-2.5 py-1 rounded-full ${matchAnalysis.matching_skills.length >= 2 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                      {matchAnalysis.matching_skills.length >= 2 ? t.matchingGlow : t.partialGlow}
                    </span>
                  </div>

                  {/* AI match text */}
                  <div className="bg-[#FFFDF9] border border-primary-gold/15 p-4 rounded-2xl relative">
                    <span className="absolute -top-2 left-4 px-2 py-0.5 bg-deep-rose text-white text-[8px] font-black uppercase rounded-md tracking-widest">
                      AI Counselor
                    </span>
                    <p className="text-xs font-bold leading-relaxed text-[#4A3E31] pt-1">
                      {matchAnalysis.ai_match_explanation}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Matching Skills */}
                    <div className="bg-sage-green/5 border border-green-200/40 p-4 rounded-2xl space-y-2">
                      <span className="text-[9px] uppercase font-extrabold text-green-800 tracking-wider">
                        ✅ {t.matchSkillsTitle}
                      </span>
                      {matchAnalysis.matching_skills.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {matchAnalysis.matching_skills.map((s, idx) => (
                            <span key={idx} className="text-[10px] font-black bg-white text-green-800 border border-green-200 px-2.5 py-0.5 rounded-full">
                              {s}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[11px] font-bold text-[#7D7061]/70 italic">None yet. Start with our foundational courses!</p>
                      )}
                    </div>

                    {/* Missing Skills (Gaps) */}
                    <div className="bg-soft-rose/5 border border-red-200/40 p-4 rounded-2xl space-y-2">
                      <span className="text-[9px] uppercase font-extrabold text-red-800 tracking-wider">
                        ⚠️ {t.missingSkillsTitle}
                      </span>
                      {matchAnalysis.missing_skills.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {matchAnalysis.missing_skills.map((s, idx) => (
                            <span key={idx} className="text-[10px] font-black bg-white text-red-800 border border-red-200 px-2.5 py-0.5 rounded-full">
                              {s}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[11px] font-bold text-green-700 italic">No missing required skills!</p>
                      )}
                    </div>
                  </div>

                  {/* Recommended Courses Mapping */}
                  <div className="space-y-3">
                    <h4 className="text-[10px] font-extrabold tracking-wider text-deep-gold uppercase flex items-center gap-1.5">
                      <BookOpen className="h-4 w-4" />
                      <span>{t.recommendedCoursesTitle}</span>
                    </h4>
                    <div className="space-y-2">
                      {matchAnalysis.recommended_courses.map((courseTitle, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3.5 bg-cream/20 hover:bg-cream/45 border border-primary-gold/15 rounded-xl transition">
                          <div>
                            <p className="text-xs font-black text-[#2D241A]">{courseTitle}</p>
                            <p className="text-[9px] uppercase tracking-wider text-deep-rose font-bold mt-0.5">Platform Course</p>
                          </div>
                          <button
                            onClick={() => navigate('/learner/courses')}
                            className="inline-flex items-center gap-1 text-[10px] font-extrabold text-deep-rose hover:underline"
                          >
                            <span>{t.viewCourseBtn}</span>
                            <ArrowRight className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              )}

              {/* Secure App Instructions Footer */}
              <div className="bg-[#FFFDF9] border border-primary-gold/10 p-4 rounded-2xl text-[11px] text-[#7D7061] leading-relaxed font-semibold">
                <span className="font-extrabold text-[#2D241A] uppercase tracking-wider block mb-1">
                  {t.appInfoLabel}
                </span>
                {selectedOpp.application_info}
              </div>

            </div>
          ) : (
            <div className="bg-white border border-primary-gold/10 rounded-2xl p-12 text-center">
              <Briefcase className="h-12 w-12 text-primary-gold/45 mx-auto mb-3" />
              <p className="text-xs font-bold text-[#7D7061]">{t.emptyOpps}</p>
            </div>
          )}

          {/* Action Plan steps checklist tracker */}
          {actionPlan && (
            <div className="bg-[#FFFDF9] border border-primary-gold/15 rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
              <div className="border-b border-primary-gold/10 pb-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h3 className="font-serif text-base font-extrabold text-[#2D241A] tracking-wider uppercase flex items-center gap-2">
                      <Award className="h-5 w-5 text-deep-gold" />
                      <span>{t.actionPlanTitle}</span>
                    </h3>
                    <p className="text-[11px] text-[#7D7061] font-semibold">{t.actionPlanSub}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-black text-deep-rose bg-deep-rose/10 px-2.5 py-1 rounded-full">
                      {getPlanProgressPercent()}% Completed
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-cream h-2.5 rounded-full mt-4 overflow-hidden border border-primary-gold/10">
                  <div 
                    className="bg-gradient-to-r from-deep-rose to-primary-gold h-full rounded-full transition-all duration-500"
                    style={{ width: `${getPlanProgressPercent()}%` }}
                  />
                </div>
              </div>

              {/* Action Plan Goal Metadata info block */}
              <div className="bg-white border border-primary-gold/10 rounded-xl p-3.5 text-xs text-[#4A3E31]">
                <span className="font-extrabold text-[#2D241A] text-[9px] uppercase tracking-widest block mb-0.5">
                  {t.goalLabel}
                </span>
                <span className="font-bold">
                  {actionPlan.opportunity_title ? `${actionPlan.opportunity_title} roadmap (${actionPlan.goal})` : actionPlan.goal}
                </span>
              </div>

              {/* Steps Vertical List */}
              <div className="space-y-4">
                {actionPlan.steps.map((step, idx) => (
                  <div 
                    key={step.id} 
                    className={`bg-white border rounded-2xl p-4 sm:p-5 flex items-start gap-4 transition-all hover:shadow-sm ${step.status === 'completed' ? 'border-sage-green/45 bg-green-50/10' : 'border-primary-gold/15'}`}
                  >
                    <div className="shrink-0 mt-0.5">
                      {updatingStep === step.id ? (
                        <Loader2 className="h-5 w-5 animate-spin text-deep-rose" />
                      ) : (
                        <button
                          onClick={() => handleUpdateStepStatus(step.id, step.status === 'completed' ? 'not_started' : 'completed')}
                          className={`h-5 w-5 rounded-full border flex items-center justify-center transition cursor-pointer ${step.status === 'completed' ? 'bg-sage-green border-sage-green text-white' : 'border-primary-gold/30 hover:border-deep-rose'}`}
                        >
                          {step.status === 'completed' && <CheckCircle className="h-4.5 w-4.5 text-white" />}
                        </button>
                      )}
                    </div>

                    <div className="flex-1 space-y-1.5">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <h4 className={`text-xs font-black uppercase tracking-wide ${step.status === 'completed' ? 'text-green-800 line-through decoration-green-800/40' : 'text-[#2D241A]'}`}>
                          Step {idx + 1}: {step.title}
                        </h4>
                        
                        {/* Selector tag buttons for intermediate status */}
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleUpdateStepStatus(step.id, 'not_started')}
                            className={`text-[9px] font-bold px-2 py-0.5 rounded-md border transition ${step.status === 'not_started' ? 'bg-[#7D7061]/15 text-[#2D241A] border-[#7D7061]/25' : 'bg-transparent text-[#7D7061] border-transparent hover:bg-cream'}`}
                          >
                            {t.stepNotStarted}
                          </button>
                          <button
                            onClick={() => handleUpdateStepStatus(step.id, 'in_progress')}
                            className={`text-[9px] font-bold px-2 py-0.5 rounded-md border transition ${step.status === 'in_progress' ? 'bg-deep-rose/15 text-deep-rose border-deep-rose/25' : 'bg-transparent text-[#7D7061] border-transparent hover:bg-cream'}`}
                          >
                            {t.stepInProgress}
                          </button>
                          <button
                            onClick={() => handleUpdateStepStatus(step.id, 'completed')}
                            className={`text-[9px] font-bold px-2 py-0.5 rounded-md border transition ${step.status === 'completed' ? 'bg-sage-green/15 text-green-800 border-green-200' : 'bg-transparent text-[#7D7061] border-transparent hover:bg-cream'}`}
                          >
                            {t.stepCompleted}
                          </button>
                        </div>
                      </div>

                      <p className="text-xs text-[#7D7061] leading-relaxed font-semibold">
                        {step.description}
                      </p>

                      <div className="bg-[#FFFDF9] border border-primary-gold/10 rounded-xl p-3 text-[11px] text-[#4A3E31] font-semibold flex items-start gap-1.5">
                        <TrendingUp className="h-4 w-4 text-deep-rose shrink-0 mt-0.5" />
                        <span>💡 <strong className="text-[#2D241A]">Suggested Action:</strong> {step.suggested_action}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {getPlanProgressPercent() === 100 && (
                <div className="bg-sage-green/10 border border-green-200 p-4 rounded-2xl flex items-center gap-3 animate-pulse">
                  <CheckCircle className="h-6 w-6 text-green-600 shrink-0" />
                  <span className="text-xs font-black uppercase text-green-800 tracking-wide">
                    {t.completeMsg}
                  </span>
                </div>
              )}

            </div>
          )}

        </div>

      </div>
    </div>
  );
}
