import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  BookOpen, 
  Flame, 
  Award, 
  Sparkles, 
  Bell, 
  MapPin, 
  GraduationCap, 
  Compass, 
  CheckCircle,
  Menu,
  X,
  ArrowLeft,
  HeartHandshake,
  LogOut,
  Globe,
  Star,
  Bookmark,
  Target,
  FileCheck,
  BrainCircuit,
  Building,
  Briefcase
} from 'lucide-react';
import { useAuth } from '../services/authContext';
import RecommendedSkills from '../components/RecommendedSkills';
import RecommendedCourses from '../components/RecommendedCourses';
import NariNexusAIAssistantHub from '../components/NariNexusAIAssistantHub';

const LANGUAGE_LABELS: Record<string, string> = {
  en: 'English',
  kn: 'ಕನ್ನಡ (Kannada)',
  hi: 'हिन्दी (Hindi)',
  te: 'తెలుగు (Telugu)',
  ta: 'தமிழ் (Tamil)',
};

export default function LearnerDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();

  // Phase 4.2 Dynamic dashboard course progress state
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [progressMap, setProgressMap] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      const token = localStorage.getItem('narinexus_token');
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        // Fetch active enrollments
        const enrollRes = await fetch('/api/enrollments/me', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (enrollRes.ok) {
          const enrollData = await enrollRes.json();
          setEnrollments(enrollData);
        }

        // Fetch progress summary map
        const progRes = await fetch('/api/progress/me', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (progRes.ok) {
          const progData = await progRes.json();
          const map: Record<string, any> = {};
          progData.forEach((p: any) => {
            map[p.course_id] = p;
          });
          setProgressMap(map);
        }
      } catch (err) {
        console.error("Failed to load dashboard progress:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  const userInitials = user?.name
    ? user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().substring(0, 2)
    : 'LN';

  // Format arrays for beautiful rendering
  const renderList = (items: string[] | null | undefined) => {
    if (!items || items.length === 0) {
      return <span className="text-[11px] text-[#7D7061]/50 italic">None specified</span>;
    }
    return (
      <div className="flex flex-wrap gap-1.5 mt-1">
        {items.map((item, idx) => (
          <span 
            key={idx} 
            className="text-[10px] font-bold bg-[#FFF9F2] text-deep-rose border border-primary-gold/15 px-2 py-0.5 rounded-full"
          >
            {item}
          </span>
        ))}
      </div>
    );
  };

  const getAICardGlow = () => {
    const lang = user?.preferred_language || 'en';
    if (lang === 'kn') {
      return {
        prompt: "ನಮಸ್ಕಾರ! ನಾನು ನಿಮ್ಮ ನಾರಿನೆಕ್ಸಸ್ AI ಸಹಾಯಕಿ. ಕೌಶಲ್ಯಗಳು, ಉದ್ಯಮ ಯೋಜನೆಗಳು ಮತ್ತು ಬ್ಯಾಂಕಿಂಗ್ ಬಗ್ಗೆ ನನ್ನನ್ನು ಕೇಳಿ!",
        btn: "AI ಸಹಾಯಕಿ ಜೊತೆ ಚಾಟ್ ಮಾಡಿ"
      };
    } else if (lang === 'hi') {
      return {
        prompt: "नमस्ते! मैं आपकी नारीनेक्सस AI असिस्टेंट हूँ। मुझसे कोर्सेज, करियर और व्यवसाय शुरू करने के बारे में पूछें!",
        btn: "AI असिस्टेंट के साथ चैट करें"
      };
    } else {
      return {
        prompt: "Namaste! I am your NariNexus AI Companion. Ask me anything about tailoring courses, starting a micro-business, or computer literacy!",
        btn: "Chat with AI Companion"
      };
    }
  };
  const aiCardInfo = getAICardGlow();

  return (
    <div className="flex h-screen bg-cream overflow-hidden text-[#3D2D1E]" id="learner-dashboard">
      
      {/* Sidebar for Desktop */}
      <aside className={`fixed inset-y-0 left-0 z-30 w-64 border-r border-primary-gold/15 bg-white transition-transform transform md:translate-x-0 md:static md:inset-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex h-16 items-center justify-between px-6 border-b border-primary-gold/10">
          <Link to="/" className="flex items-center space-x-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-deep-rose to-primary-pink text-xs font-bold text-white shadow-sm">
              <HeartHandshake className="h-4 w-4 text-white" />
            </span>
            <span className="font-serif text-base font-extrabold tracking-wider text-[#2D241A] ml-1">NariNexus</span>
          </Link>
          <button onClick={() => setSidebarOpen(false)} className="p-1 md:hidden text-[#7D7061] hover:text-[#2D241A] transition cursor-pointer">
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="p-4 space-y-1.5" aria-label="Sidebar Navigation">
          <Link to="/" className="flex items-center space-x-3 rounded-xl px-4 py-3 text-xs font-bold uppercase tracking-wider text-[#7D7061] hover:bg-cream hover:text-deep-rose transition border border-transparent">
            <ArrowLeft className="h-4 w-4" />
            <span>Platform Home</span>
          </Link>
          <div className="my-3 border-t border-primary-gold/10" />
          <span className="px-4 text-[9px] uppercase tracking-widest font-extrabold text-deep-gold">Learner Hub</span>
          
          <Link to="/learner/my-courses" className="w-full flex items-center space-x-3 rounded-xl bg-soft-yellow/80 px-4 py-3 text-xs font-bold uppercase tracking-wider text-[#4A3E31] text-left border border-primary-gold/20 shadow-sm">
            <GraduationCap className="h-4.5 w-4.5 text-deep-gold" />
            <span>My Courses</span>
          </Link>
          
          <Link to="/learner/chat" className="w-full flex items-center space-x-3 rounded-xl px-4 py-3 text-xs font-bold uppercase tracking-wider text-[#7D7061] hover:bg-cream hover:text-deep-rose transition border border-transparent">
            <Sparkles className="h-4.5 w-4.5 text-deep-gold animate-pulse" />
            <span>AI Assistant</span>
          </Link>
          
          <Link to="/learner/career-guidance" className="w-full flex items-center space-x-3 rounded-xl px-4 py-3 text-xs font-bold uppercase tracking-wider text-[#7D7061] hover:bg-cream hover:text-deep-rose transition border border-transparent">
            <Target className="h-4.5 w-4.5 text-deep-gold" />
            <span>AI Career Guide</span>
          </Link>
          
          <Link to="/learner/opportunities" className="w-full flex items-center space-x-3 rounded-xl px-4 py-3 text-xs font-bold uppercase tracking-wider text-[#7D7061] hover:bg-cream hover:text-deep-rose transition border border-transparent">
            <Briefcase className="h-4.5 w-4.5 text-deep-gold" />
            <span>AI Opportunities &amp; Planner</span>
          </Link>
          
          <button className="w-full flex items-center space-x-3 rounded-xl px-4 py-3 text-xs font-bold uppercase tracking-wider text-[#7D7061] hover:bg-cream hover:text-[#2D241A] transition text-left border border-transparent cursor-pointer">
            <Flame className="h-4.5 w-4.5 text-deep-rose" />
            <span>Streaks &amp; Points</span>
          </button>
          
          <button className="w-full flex items-center space-x-3 rounded-xl px-4 py-3 text-xs font-bold uppercase tracking-wider text-[#7D7061] hover:bg-cream hover:text-[#2D241A] transition text-left border border-transparent cursor-pointer">
            <MapPin className="h-4.5 w-4.5 text-deep-gold" />
            <span>Offline Classes</span>
          </button>
          
          <Link to="/learner/skills" className="w-full flex items-center space-x-3 rounded-xl px-4 py-3 text-xs font-bold uppercase tracking-wider text-[#7D7061] hover:bg-cream hover:text-[#2D241A] transition text-left border border-transparent">
            <Compass className="h-4.5 w-4.5 text-[#6B8E6F]" />
            <span>Skills Catalogue</span>
          </Link>

          <Link to="/learner/courses" className="w-full flex items-center space-x-3 rounded-xl px-4 py-3 text-xs font-bold uppercase tracking-wider text-[#7D7061] hover:bg-cream hover:text-[#2D241A] transition text-left border border-transparent">
            <BookOpen className="h-4.5 w-4.5 text-deep-gold" />
            <span>Courses Catalogue</span>
          </Link>

          <div className="my-3 border-t border-primary-gold/10" />
          
          <button 
            onClick={logout} 
            className="w-full flex items-center space-x-3 rounded-xl px-4 py-3 text-xs font-bold uppercase tracking-wider text-deep-rose hover:bg-soft-rose/20 transition text-left border border-transparent cursor-pointer"
          >
            <LogOut className="h-4.5 w-4.5" />
            <span>Logout</span>
          </button>
        </nav>
      </aside>

      {/* Main Content Area */}
      <div className="flex-grow flex flex-col overflow-y-auto">
        
        {/* Dashboard Topbar */}
        <header className="h-16 border-b border-primary-gold/10 bg-white px-6 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center space-x-4">
            <button onClick={() => setSidebarOpen(true)} className="p-2 md:hidden text-[#7D7061] hover:bg-cream rounded-xl cursor-pointer">
              <Menu className="h-5 w-5" />
            </button>
            <h1 className="font-serif text-lg font-bold text-[#2D241A] uppercase tracking-wider">Learner Dashboard</h1>
          </div>

          <div className="flex items-center space-x-4">
            {/* Notifications Alert */}
            <button className="relative p-2 rounded-xl border border-primary-gold/10 text-[#7D7061] hover:bg-cream cursor-pointer" aria-label="View notifications">
              <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-deep-rose rounded-full animate-ping" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-deep-rose rounded-full" />
              <Bell className="h-4.5 w-4.5" />
            </button>

            {/* Profile Avatar */}
            <div className="flex items-center space-x-2.5">
              <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-deep-gold to-primary-gold flex items-center justify-center font-bold text-white border border-primary-gold/30 text-sm shadow-sm">
                {userInitials}
              </div>
              <div className="hidden sm:block text-left">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-[#2D241A]">{user?.name || 'Savitha Nair'}</span>
                <span className="block text-[9px] uppercase font-bold tracking-widest text-deep-rose">Verified Learner</span>
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Panels */}
        <main className="p-6 space-y-6">
          
          {/* Welcome / Metrics Hero */}
          <section className="rounded-2xl bg-white border border-primary-gold/15 p-6 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 shadow-sm">
            <div className="space-y-2">
              <div className="inline-flex items-center space-x-1 px-3 py-1 bg-sage-green/20 text-green-800 text-[9px] font-extrabold uppercase tracking-wider border border-green-200/50 rounded-full">
                <Sparkles className="h-3 w-3 text-green-700 animate-pulse" />
                <span>NariNexus Learner Community</span>
              </div>
              <h2 className="font-serif text-2xl font-extrabold text-[#2D241A]">
                Welcome, {user?.name || 'Savitha'}!
              </h2>
              <p className="text-xs text-[#7D7061] font-semibold">
                You have successfully completed your onboarding. Below is your personalized dashboard profile.
              </p>
            </div>

            {/* Profile Progress / Completion Metric */}
            <div className="flex items-center gap-4 w-full lg:w-auto">
              <div className="text-center p-3.5 bg-[#FFF4C7]/40 rounded-xl border border-[#C8870A]/10 min-w-[120px] flex-1 lg:flex-initial">
                <span className="text-[9px] uppercase font-bold text-[#7D7061] tracking-widest block">PROFILE STATUS</span>
                <div className="flex items-center justify-center text-deep-rose mt-1.5 font-bold">
                  <CheckCircle className="h-4 w-4 mr-1.5 text-[#8FBC8F]" />
                  <span className="text-xs tracking-wider text-[#2D241A]">Completed (100%)</span>
                </div>
              </div>
              <div className="text-center p-3.5 bg-sage-green/20 rounded-xl border border-green-200/10 min-w-[120px] flex-1 lg:flex-initial">
                <span className="text-[9px] uppercase font-bold text-[#7D7061] tracking-widest block">MY LANGUAGE</span>
                <div className="flex items-center justify-center text-[#6B8E6F] mt-1.5 font-bold">
                  <Globe className="h-4 w-4 mr-1.5 text-deep-gold" />
                  <span className="text-xs tracking-wider text-[#2D241A]">
                    {user?.preferred_language ? (LANGUAGE_LABELS[user.preferred_language] || user.preferred_language.toUpperCase()) : 'English'}
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* Learner Profile Information Panel */}
          <section className="bg-[#FFFDF9] border border-primary-gold/15 rounded-2xl p-6 shadow-sm">
            <div className="border-b border-primary-gold/10 pb-3 mb-4 flex items-center justify-between">
              <h3 className="font-serif text-base font-extrabold text-[#2D241A] tracking-wider uppercase">My Learner Profile Card</h3>
              <span className="text-[10px] bg-deep-rose/10 text-deep-rose border border-deep-rose/20 px-3 py-1 rounded-full font-bold uppercase tracking-widest">Active Profile</span>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 pt-2">
              <div className="space-y-1 bg-white p-3.5 rounded-xl border border-primary-gold/10">
                <span className="text-[9px] uppercase font-extrabold tracking-widest text-[#7D7061] block">Age &amp; Location</span>
                <p className="text-xs font-bold text-[#2D241A] mt-1">
                  {user?.age ? `${user.age} Years Old` : 'Not specified'}
                </p>
                <p className="text-[10px] text-deep-gold font-bold">
                  📍 {user?.location || 'Not specified'}
                </p>
              </div>

              <div className="space-y-1 bg-white p-3.5 rounded-xl border border-primary-gold/10">
                <span className="text-[9px] uppercase font-extrabold tracking-widest text-[#7D7061] block">Education Level</span>
                <p className="text-xs font-bold text-[#2D241A] mt-1 flex items-center">
                  <Bookmark className="h-3.5 w-3.5 mr-1.5 text-deep-rose" />
                  {user?.education_level || 'Not specified'}
                </p>
              </div>

              <div className="space-y-1 bg-white p-3.5 rounded-xl border border-primary-gold/10">
                <span className="text-[9px] uppercase font-extrabold tracking-widest text-[#7D7061] block">Learning Preference</span>
                <p className="text-xs font-bold text-[#2D241A] mt-1 flex items-center">
                  <Compass className="h-3.5 w-3.5 mr-1.5 text-deep-gold" />
                  {user?.learning_preference || 'Not specified'}
                </p>
              </div>

              <div className="space-y-1 bg-white p-3.5 rounded-xl border border-primary-gold/10">
                <span className="text-[9px] uppercase font-extrabold tracking-widest text-[#7D7061] block">Career Goal</span>
                <p className="text-xs font-bold text-[#2D241A] mt-1 flex items-center">
                  <Target className="h-3.5 w-3.5 mr-1.5 text-[#6B8E6F]" />
                  {user?.career_goal || 'Not specified'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-6 pt-4 border-t border-primary-gold/10">
              <div className="space-y-1.5">
                <span className="text-[9px] uppercase font-extrabold tracking-widest text-[#7D7061] block flex items-center gap-1">
                  <Star className="h-3.5 w-3.5 text-deep-gold" />
                  My Existing Skills
                </span>
                {renderList(user?.existing_skills)}
              </div>
              
              <div className="space-y-1.5">
                <span className="text-[9px] uppercase font-extrabold tracking-widest text-[#7D7061] block flex items-center gap-1">
                  <Award className="h-3.5 w-3.5 text-deep-rose" />
                  Interests / Skills I Want To Learn
                </span>
                {renderList(user?.learning_interests)}
              </div>
            </div>
          </section>

          {/* Unified AI Assistant Hub */}
          <NariNexusAIAssistantHub />

          {/* New Phase 5.4 AI Recommended Skills Section */}
          <section className="bg-cream/20 border border-primary-gold/10 rounded-3xl p-6 sm:p-8">
            <RecommendedSkills />
          </section>

          {/* New Phase 5.5 AI Recommended Courses Section */}
          <section className="bg-cream/20 border border-primary-gold/10 rounded-3xl p-6 sm:p-8">
            <RecommendedCourses />
          </section>

          {/* Grid Layout of Cards / Placeholder Sections */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

            {/* Real Enrolled Courses & Learning Progress */}
            <div className="rounded-2xl border border-primary-gold/15 bg-white p-6 shadow-sm flex flex-col">
              <span className="text-[9px] uppercase tracking-widest font-extrabold text-deep-rose">PROGRESS MONITOR</span>
              <h3 className="mt-1 font-serif text-base font-bold text-[#2D241A] uppercase tracking-wider border-b border-primary-gold/10 pb-3 flex items-center gap-1.5">
                <BookOpen className="h-4 w-4 text-deep-rose" />
                My Courses &amp; Progress
              </h3>
              
              <div className="mt-4 space-y-4 flex-grow">
                {loading ? (
                  <div className="py-6 text-center">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary-gold border-t-transparent mx-auto mb-2" />
                    <span className="text-[10px] text-[#7D7061]">Retrieving progress...</span>
                  </div>
                ) : enrollments.length === 0 ? (
                  <div className="py-8 text-center text-xs text-[#7D7061] font-semibold leading-relaxed">
                    <p>You have not enrolled in any skill courses yet.</p>
                    <Link to="/learner/courses" className="text-deep-rose font-bold hover:underline mt-2 block">
                      Explore Course Catalogue →
                    </Link>
                  </div>
                ) : (
                  enrollments.slice(0, 2).map((enroll) => {
                    const prog = progressMap[enroll.course_id] || {
                      progress_percentage: 0,
                      completed_lessons: 0,
                      total_lessons: 0
                    };
                    return (
                      <div key={enroll.enrollment_id} className="p-4 bg-cream/40 border border-primary-gold/10 rounded-xl">
                        <div className="flex justify-between items-center text-xs mb-1.5">
                          <span className="font-bold text-[#2D241A] truncate max-w-[150px]">{enroll.course_title}</span>
                          <span className={`font-bold px-2.5 py-0.5 rounded-full text-[9px] uppercase tracking-widest border ${
                            enroll.learning_mode === 'online'
                              ? 'bg-soft-yellow/55 text-deep-gold border-primary-gold/20'
                              : 'bg-light-pink text-deep-rose border-soft-rose/30'
                          }`}>
                            {enroll.learning_mode}
                          </span>
                        </div>
                        <div className="mt-3 w-full bg-white border border-primary-gold/10 h-2 rounded-full overflow-hidden">
                          <div 
                            className="bg-gradient-to-r from-deep-rose to-primary-pink h-full transition-all duration-300" 
                            style={{ width: `${prog.progress_percentage}%` }} 
                          />
                        </div>
                        <div className="flex justify-between text-[10px] text-[#7D7061] mt-2 font-medium">
                          <span className="font-semibold text-deep-rose">{prog.progress_percentage}% Completed</span>
                          <span className="font-semibold text-[#2D241A]">{prog.completed_lessons} / {prog.total_lessons || 1} Modules</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="mt-5 pt-3 border-t border-primary-gold/10">
                <Link
                  to="/learner/my-courses"
                  className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-light-pink border border-soft-rose/30 hover:border-primary-pink py-2 text-xs font-bold text-deep-rose transition-all text-center"
                >
                  <span>Go to My Course Tracks</span>
                </Link>
              </div>
            </div>

            {/* Dynamic: Points & Streak */}
            <div className="rounded-2xl border border-primary-gold/15 bg-white p-6 shadow-sm flex flex-col">
              <span className="text-[9px] uppercase tracking-widest font-extrabold text-deep-gold">GAMIFICATION HUBS</span>
              <h3 className="mt-1 font-serif text-base font-bold text-[#2D241A] uppercase tracking-wider border-b border-primary-gold/10 pb-3 flex items-center gap-1.5">
                <Flame className="h-4.5 w-4.5 text-deep-gold" />
                Points &amp; Streak Multiplier
              </h3>
              
              <div className="mt-4 space-y-3.5 flex-grow text-xs">
                <div className="flex items-center justify-between p-3 border border-primary-gold/10 rounded-xl bg-cream/20 font-semibold">
                  <div className="flex items-center space-x-2">
                    <span className="text-xl">🔥</span>
                    <div>
                      <span className="font-bold text-[#2D241A] block">{(user as any)?.streak || 1} Day Streak</span>
                      <span className="text-[9px] text-[#7D7061]">Keep learning to multiply points!</span>
                    </div>
                  </div>
                  <span className="text-xs font-black text-deep-rose">x{(1.0 + (((user as any)?.streak || 1) - 1) * 0.1).toFixed(1)}</span>
                </div>

                <div className="flex items-center justify-between p-3 border border-primary-gold/10 rounded-xl bg-cream/20 font-semibold">
                  <div className="flex items-center space-x-2">
                    <span className="text-xl">⭐</span>
                    <div>
                      <span className="font-bold text-[#2D241A] block">{(user as any)?.points || 50} Platform Points</span>
                      <span className="text-[9px] text-[#7D7061]">Awarded for profile and study milestones.</span>
                    </div>
                  </div>
                  <span className="text-xs font-black text-[#8FBC8F]">+{(user as any)?.points || 50}</span>
                </div>
              </div>
            </div>

            {/* Placeholder: Nearby Training Centres */}
            <div className="rounded-2xl border border-primary-gold/15 bg-white p-6 shadow-sm flex flex-col">
              <span className="text-[9px] uppercase tracking-widest font-extrabold text-[#7D7061]">COMMUNITY REGIONS</span>
              <h3 className="mt-1 font-serif text-base font-bold text-[#2D241A] uppercase tracking-wider border-b border-primary-gold/10 pb-3 flex items-center gap-1.5">
                <Building className="h-4 w-4 text-[#7D7061]" />
                Nearby Training Centres
              </h3>
              <div className="mt-4 space-y-3 flex-grow text-xs text-[#7D7061] font-semibold">
                <p>Coaching centres registered within <strong className="text-deep-gold">{user?.location || 'your region'}</strong>:</p>
                <div className="p-3 border border-dashed border-primary-gold/20 rounded-xl">
                  <span className="font-bold text-[#2D241A] block">📍 NariNexus Hub - Central District</span>
                  <span className="text-[10px] block text-deep-gold mt-1">Approx. 2.4 km away</span>
                </div>
                <div className="p-3 border border-dashed border-primary-gold/20 rounded-xl">
                  <span className="font-bold text-[#2D241A] block">📍 Shanthi Women's Skill Academy</span>
                  <span className="text-[10px] block text-[#8FBC8F] mt-1">Approx. 4.1 km away</span>
                </div>
              </div>
            </div>

            {/* Interactive: AI Learning Assistant */}
            <div className="rounded-2xl border border-primary-gold/15 bg-white p-6 shadow-sm flex flex-col md:col-span-2 lg:col-span-1">
              <span className="text-[9px] uppercase tracking-widest font-extrabold text-deep-gold">INTELLIGENT COMPANIONS</span>
              <h3 className="mt-1 font-serif text-base font-bold text-[#2D241A] uppercase tracking-wider border-b border-primary-gold/10 pb-3 flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-deep-gold animate-bounce" />
                AI Learning Assistant
              </h3>
              <div className="mt-4 space-y-4 flex-grow text-xs text-[#7D7061] font-semibold leading-relaxed">
                <div className="p-4 bg-[#FFF9F2] rounded-xl border border-primary-gold/15 flex items-start space-x-3">
                  <span className="text-lg">🤖</span>
                  <div className="space-y-1">
                    <span className="font-bold text-[#2D241A] block uppercase text-[9px] tracking-widest text-deep-gold">NariNexus Assistant</span>
                    <span className="text-[11px] block text-[#7D7061] leading-relaxed">
                      "{aiCardInfo.prompt}"
                    </span>
                  </div>
                </div>
              </div>
              <div className="mt-5 pt-3 border-t border-primary-gold/10">
                <Link
                  to="/learner/chat"
                  className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-deep-rose hover:bg-deep-rose/95 text-white py-2.5 text-xs font-bold uppercase tracking-wider transition-all text-center shadow-sm"
                >
                  <Sparkles className="h-3.5 w-3.5 text-white" />
                  <span>{aiCardInfo.btn}</span>
                </Link>
              </div>
            </div>

            {/* Real: AI Career Guidance & Pathway Engine */}
            <div className="rounded-2xl border border-primary-gold/15 bg-white p-6 shadow-sm flex flex-col md:col-span-2 lg:col-span-1">
              <span className="text-[9px] uppercase tracking-widest font-extrabold text-deep-gold">PERSONALIZED ROADMAPS</span>
              <h3 className="mt-1 font-serif text-base font-bold text-[#2D241A] uppercase tracking-wider border-b border-primary-gold/10 pb-3 flex items-center gap-1.5">
                <BrainCircuit className="h-4.5 w-4.5 text-deep-rose animate-pulse" />
                AI Career Pathway Guide
              </h3>
              <div className="mt-4 space-y-4 flex-grow text-xs text-[#7D7061] font-semibold leading-relaxed">
                <div className="p-4 bg-[#FFF9F2] rounded-xl border border-primary-gold/15 flex items-start space-x-3">
                  <span className="text-lg">🎯</span>
                  <div className="space-y-1">
                    <span className="font-bold text-[#2D241A] block uppercase text-[9px] tracking-widest text-deep-gold">Career Guide</span>
                    <span className="text-[11px] block text-[#7D7061] leading-relaxed">
                      {user?.preferred_language === 'kn' 
                        ? 'ನಿಮ್ಮ ಕೌಶಲ್ಯಗಳು ಮತ್ತು ಆಸಕ್ತಿಗಳಿಗೆ ಹೊಂದುವ ಉದ್ಯೋಗ ಮತ್ತು ಸ್ವಯಂ ಉದ್ಯೋಗದ ಮಾರ್ಗಸೂಚಿಗಳನ್ನು ರಚಿಸಿ.'
                        : user?.preferred_language === 'hi'
                        ? 'अपनी पसंद और कौशल के अनुसार रोजगार और स्वरोजगार के बेहतरीन रोडमैप खोजें।'
                        : 'Explore suitable employment & self-employment pathways tailored to your specific profile interests.'}
                    </span>
                  </div>
                </div>
              </div>
              <div className="mt-5 pt-3 border-t border-primary-gold/10">
                <Link
                  to="/learner/career-guidance"
                  className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-deep-rose to-primary-pink hover:opacity-95 text-white py-2.5 text-xs font-bold uppercase tracking-wider transition-all text-center shadow-sm"
                >
                  <BrainCircuit className="h-3.5 w-3.5 text-white" />
                  <span>{user?.preferred_language === 'kn' ? 'ಮಾರ್ಗಸೂಚಿ ರಚಿಸಿ' : user?.preferred_language === 'hi' ? 'रोडमैप शुरू करें' : 'Get Career Roadmap'}</span>
                </Link>
              </div>
            </div>

          </div>

        </main>
      </div>
    </div>
  );
}
