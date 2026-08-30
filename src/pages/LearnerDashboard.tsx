import React, { useState } from 'react';
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
  Building
} from 'lucide-react';
import { useAuth } from '../services/authContext';

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
          
          <button className="w-full flex items-center space-x-3 rounded-xl bg-soft-yellow/80 px-4 py-3 text-xs font-bold uppercase tracking-wider text-[#4A3E31] text-left border border-primary-gold/20 shadow-sm cursor-pointer">
            <GraduationCap className="h-4.5 w-4.5 text-deep-gold" />
            <span>My Courses</span>
          </button>
          
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

          {/* Grid Layout of Cards / Placeholder Sections */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Placeholder: Recommended Skills */}
            <div className="rounded-2xl border border-primary-gold/15 bg-white p-6 shadow-sm flex flex-col">
              <span className="text-[9px] uppercase tracking-widest font-extrabold text-[#6B8E6F]">INTELLIGENT MATCHING</span>
              <h3 className="mt-1 font-serif text-base font-bold text-[#2D241A] uppercase tracking-wider border-b border-primary-gold/10 pb-3 flex items-center gap-1.5">
                <BrainCircuit className="h-4 w-4 text-[#6B8E6F]" />
                Recommended Skills
              </h3>
              <div className="mt-4 space-y-3.5 flex-grow text-xs text-[#7D7061] font-semibold leading-relaxed">
                <p>Based on your interest in <strong className="text-deep-rose">{(user?.learning_interests && user.learning_interests[0]) || 'skills'}</strong>, NariNexus recommends the following starter circles:</p>
                <div className="p-3 bg-cream/40 border border-primary-gold/10 rounded-xl space-y-1">
                  <span className="font-extrabold text-[#2D241A] block">1. Micro-Business Foundations</span>
                  <span className="text-[10px] text-[#7D7061]">Includes pricing strategies, invoice logs, and sales tracking.</span>
                </div>
                <div className="p-3 bg-cream/40 border border-primary-gold/10 rounded-xl space-y-1">
                  <span className="font-extrabold text-[#2D241A] block">2. Native Handloom &amp; Weaving</span>
                  <span className="text-[10px] text-[#7D7061]">Learn direct thread designs from regional master craftswomen.</span>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-primary-gold/10">
                <Link
                  to="/learner/skills"
                  className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-light-pink border border-soft-rose/30 hover:border-primary-pink py-2 text-xs font-bold text-deep-rose transition-all text-center"
                >
                  <span>Explore Skills Catalogue</span>
                </Link>
              </div>
            </div>

            {/* Placeholder: My Courses & Learning Progress */}
            <div className="rounded-2xl border border-primary-gold/15 bg-white p-6 shadow-sm flex flex-col">
              <span className="text-[9px] uppercase tracking-widest font-extrabold text-deep-rose">PROGRESS MONITOR</span>
              <h3 className="mt-1 font-serif text-base font-bold text-[#2D241A] uppercase tracking-wider border-b border-primary-gold/10 pb-3 flex items-center gap-1.5">
                <BookOpen className="h-4 w-4 text-deep-rose" />
                My Courses &amp; Progress
              </h3>
              
              <div className="mt-4 space-y-4 flex-grow">
                {/* Course 1 */}
                <div className="p-4 bg-cream/40 border border-primary-gold/10 rounded-xl">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-[#2D241A]">Tailoring &amp; Textile Design</span>
                    <span className="text-deep-rose font-bold bg-light-pink px-2.5 py-1 rounded-full text-[9px] uppercase tracking-widest border border-soft-rose/30">Hybrid</span>
                  </div>
                  <div className="mt-3.5 w-full bg-white border border-primary-gold/10 h-2 rounded-full overflow-hidden">
                    <div className="bg-gradient-to-r from-deep-rose to-primary-pink h-full" style={{ width: '40%' }} />
                  </div>
                  <div className="flex justify-between text-[10px] text-[#7D7061] mt-2 font-medium">
                    <span className="font-semibold text-deep-rose">40% Completed</span>
                    <span className="font-semibold text-[#2D241A]">Next offline batch soon</span>
                  </div>
                </div>

                {/* Course 2 */}
                <div className="p-4 bg-cream/40 border border-primary-gold/10 rounded-xl">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-[#2D241A]">Basic Financial Bookkeeping</span>
                    <span className="text-deep-gold font-bold bg-soft-yellow px-2.5 py-1 rounded-full text-[9px] uppercase tracking-widest border border-primary-gold/20">Online</span>
                  </div>
                  <div className="mt-3.5 w-full bg-white border border-primary-gold/10 h-2 rounded-full overflow-hidden">
                    <div className="bg-gradient-to-r from-primary-gold to-deep-gold h-full" style={{ width: '10%' }} />
                  </div>
                  <div className="flex justify-between text-[10px] text-[#7D7061] mt-2 font-medium">
                    <span className="font-semibold text-deep-gold">10% Completed</span>
                    <span className="font-semibold text-[#2D241A]">Ready for self-paced study</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Placeholder: Points & Streak */}
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
                      <span className="font-bold text-[#2D241A] block">1 Day Streak</span>
                      <span className="text-[9px] text-[#7D7061]">Keep learning to multiply points!</span>
                    </div>
                  </div>
                  <span className="text-xs font-black text-deep-rose">x1.0</span>
                </div>

                <div className="flex items-center justify-between p-3 border border-primary-gold/10 rounded-xl bg-cream/20 font-semibold">
                  <div className="flex items-center space-x-2">
                    <span className="text-xl">⭐</span>
                    <div>
                      <span className="font-bold text-[#2D241A] block">50 Platform Points</span>
                      <span className="text-[9px] text-[#7D7061]">Awarded for profile completion.</span>
                    </div>
                  </div>
                  <span className="text-xs font-black text-[#8FBC8F]">+50</span>
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

            {/* Placeholder: AI Learning Assistant */}
            <div className="rounded-2xl border border-primary-gold/15 bg-white p-6 shadow-sm flex flex-col md:col-span-2 lg:col-span-1">
              <span className="text-[9px] uppercase tracking-widest font-extrabold text-[#4A3E31]">INTELLIGENT COMPANIONS</span>
              <h3 className="mt-1 font-serif text-base font-bold text-[#2D241A] uppercase tracking-wider border-b border-primary-gold/10 pb-3 flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-deep-gold animate-bounce" />
                AI Learning Assistant
              </h3>
              <div className="mt-4 space-y-4 flex-grow text-xs text-[#7D7061] font-semibold leading-relaxed">
                <div className="p-4 bg-[#FFF9F2] rounded-xl border border-primary-gold/15 flex items-start space-x-3">
                  <span className="text-lg">🤖</span>
                  <div className="space-y-1">
                    <span className="font-bold text-[#2D241A] block uppercase text-[9px] tracking-widest text-deep-gold">Assistant Prompt</span>
                    <span className="text-[11px] block text-[#7D7061] leading-relaxed">
                      "Namaste! I am your NariNexus AI companion. In a future update, you can ask me questions about courses, tailoring techniques, or shop setups in your preferred language."
                    </span>
                  </div>
                </div>
              </div>
            </div>

          </div>

        </main>
      </div>
    </div>
  );
}
