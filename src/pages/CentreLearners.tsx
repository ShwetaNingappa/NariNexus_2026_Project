import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  Building2, 
  Users, 
  Calendar, 
  GraduationCap, 
  CheckSquare, 
  Settings, 
  ArrowLeft,
  Menu,
  X,
  HeartHandshake,
  LogOut,
  AlertTriangle,
  LayoutDashboard,
  Search,
  Filter,
  Mail,
  Phone,
  MapPin,
  BookOpen,
  Award,
  ChevronRight,
  TrendingUp,
  Clock,
  Sparkles,
  ChevronLeft,
  BarChart3
} from 'lucide-react';
import { useAuth } from '../services/authContext';
import { api } from '../services/api';

export default function CentreLearners() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Search & Filter State
  const [search, setSearch] = useState('');
  const [language, setLanguage] = useState('');
  const [education, setEducation] = useState('');
  const [preference, setPreference] = useState('');

  // Profile status tracking
  const [profile, setProfile] = useState<any>(null);
  const [profileLoaded, setProfileLoaded] = useState(false);

  // Learners list state
  const [learners, setLearners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Active Learner Details State
  const [activeLearnerId, setActiveLearnerId] = useState<string | null>(null);
  const [learnerDetails, setLearnerDetails] = useState<any>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);

  // Load profile and learners list
  useEffect(() => {
    async function loadProfileAndLearners() {
      try {
        setLoading(true);
        setError(null);
        let hasProfile = false;

        try {
          const profileRes = await api.get('/api/centres/me');
          if (profileRes.data && profileRes.data.success && profileRes.data.profile) {
            setProfile(profileRes.data.profile);
            hasProfile = true;
          }
        } catch (profileErr: any) {
          if (profileErr.response?.status === 404) {
            setProfile(null);
          } else {
            throw profileErr;
          }
        }

        if (hasProfile) {
          try {
            const learnersRes = await api.get('/api/centres/learners', {
              params: {
                search: search || undefined,
                language: language || undefined,
                education: education || undefined,
                preference: preference || undefined
              }
            });

            if (learnersRes.data && learnersRes.data.success) {
              setLearners(learnersRes.data.learners);
            }
          } catch (learnersErr: any) {
            if (learnersErr.response?.status === 404) {
              setLearners([]);
            } else {
              throw learnersErr;
            }
          }
        } else {
          setLearners([]);
        }
        setError(null);
      } catch (err: any) {
        console.error('Error loading centre and learners:', err);
        setError(err.response?.data?.detail || 'Failed to load learners database.');
      } finally {
        setProfileLoaded(true);
        setLoading(false);
      }
    }

    loadProfileAndLearners();
  }, [search, language, education, preference]);

  // Load specific learner details when clicked
  useEffect(() => {
    if (!activeLearnerId) {
      setLearnerDetails(null);
      return;
    }

    async function loadLearnerDetails() {
      try {
        setDetailsLoading(true);
        setDetailsError(null);
        const res = await api.get(`/api/centres/learners/${activeLearnerId}`);
        if (res.data && res.data.success) {
          setLearnerDetails(res.data);
        }
      } catch (err: any) {
        console.error('Error loading learner details:', err);
        setDetailsError(err.response?.data?.detail || 'Failed to load candidate file securely.');
      } finally {
        setDetailsLoading(false);
      }
    }

    loadLearnerDetails();
  }, [activeLearnerId]);

  const userInitials = user?.name
    ? user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().substring(0, 2)
    : 'KC';

  const isCurrentPath = (path: string) => location.pathname === path;

  // Render language label nicely
  const getLanguageLabel = (langCode: string) => {
    switch (langCode) {
      case 'kn': return 'ಕನ್ನಡ (Kannada)';
      case 'hi': return 'हिन्दी (Hindi)';
      case 'en': return 'English';
      default: return langCode;
    }
  };

  return (
    <div className="flex h-screen bg-cream overflow-hidden text-[#3D2D1E]" id="centre-learners-page">
      {/* Sidebar for Desktop */}
      <aside className={`fixed inset-y-0 left-0 z-30 w-64 border-r border-primary-gold/15 bg-white transition-transform transform md:translate-x-0 md:static md:inset-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex h-16 items-center justify-between px-6 border-b border-primary-gold/10">
          <Link to="/" className="flex items-center space-x-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-deep-rose to-primary-pink text-xs font-bold text-white shadow-sm">
              <HeartHandshake className="h-4 w-4 text-white" />
            </span>
            <span className="font-serif text-base font-extrabold tracking-wider text-[#2D241A] ml-1">NariNexus</span>
          </Link>
          <button onClick={() => setSidebarOpen(false)} className="p-1 md:hidden text-[#7D7061] hover:text-[#2D241A] transition">
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="p-4 space-y-1.5" aria-label="Sidebar Navigation">
          <Link to="/" className="flex items-center space-x-3 rounded-xl px-4 py-3 text-xs font-bold uppercase tracking-wider text-[#7D7061] hover:bg-cream hover:text-deep-rose transition border border-transparent">
            <ArrowLeft className="h-4 w-4" />
            <span>Platform Home</span>
          </Link>
          <div className="my-3 border-t border-primary-gold/10" />
          <span className="px-4 text-[9px] uppercase tracking-widest font-extrabold text-[#C8870A]">Coaching Hub</span>
          
          <Link 
            to="/centre/dashboard" 
            className={`w-full flex items-center space-x-3 rounded-xl px-4 py-3 text-xs font-bold uppercase tracking-wider transition ${
              isCurrentPath('/centre') || isCurrentPath('/centre/dashboard')
                ? 'bg-soft-yellow/80 text-[#4A3E31] border border-primary-gold/20 shadow-sm' 
                : 'text-[#7D7061] hover:bg-cream hover:text-[#2D241A] border border-transparent'
            }`}
          >
            <LayoutDashboard className="h-4.5 w-4.5 text-deep-gold" />
            <span>Dashboard</span>
          </Link>

          <Link 
            to="/centre/learners" 
            className={`w-full flex items-center space-x-3 rounded-xl px-4 py-3 text-xs font-bold uppercase tracking-wider transition ${
              isCurrentPath('/centre/learners')
                ? 'bg-soft-yellow/80 text-[#4A3E31] border border-primary-gold/20 shadow-sm' 
                : 'text-[#7D7061] hover:bg-cream hover:text-[#2D241A] border border-transparent'
            }`}
          >
            <Users className="h-4.5 w-4.5 text-deep-gold" />
            <span>Manage Learners</span>
          </Link>

          <Link 
            to="/centre/profile" 
            className={`w-full flex items-center space-x-3 rounded-xl px-4 py-3 text-xs font-bold uppercase tracking-wider transition ${
              isCurrentPath('/centre/profile')
                ? 'bg-soft-yellow/80 text-[#4A3E31] border border-primary-gold/20 shadow-sm' 
                : 'text-[#7D7061] hover:bg-cream hover:text-[#2D241A] border border-transparent'
            }`}
          >
            <Building2 className="h-4.5 w-4.5 text-deep-gold" />
            <span>Center Profile</span>
          </Link>

          <Link 
            to="/centre/courses" 
            className={`w-full flex items-center space-x-3 rounded-xl px-4 py-3 text-xs font-bold uppercase tracking-wider transition ${
              isCurrentPath('/centre/courses')
                ? 'bg-soft-yellow/80 text-[#4A3E31] border border-primary-gold/20 shadow-sm' 
                : 'text-[#7D7061] hover:bg-cream hover:text-[#2D241A] border border-transparent'
            }`}
          >
            <GraduationCap className="h-4.5 w-4.5 text-deep-gold" />
            <span>Manage Courses</span>
          </Link>

          <Link 
            to="/centre/progress" 
            className={`w-full flex items-center space-x-3 rounded-xl px-4 py-3 text-xs font-bold uppercase tracking-wider transition ${
              isCurrentPath('/centre/progress')
                ? 'bg-soft-yellow/80 text-[#4A3E31] border border-primary-gold/20 shadow-sm' 
                : 'text-[#7D7061] hover:bg-cream hover:text-[#2D241A] border border-transparent'
            }`}
          >
            <BarChart3 className="h-4.5 w-4.5 text-deep-gold" />
            <span>Progress Monitoring</span>
          </Link>

          <Link 
            to="/centre/analytics" 
            className={`w-full flex items-center space-x-3 rounded-xl px-4 py-3 text-xs font-bold uppercase tracking-wider transition ${
              isCurrentPath('/centre/analytics')
                ? 'bg-soft-yellow/80 text-[#4A3E31] border border-primary-gold/20 shadow-sm' 
                : 'text-[#7D7061] hover:bg-cream hover:text-[#2D241A] border border-transparent'
            }`}
          >
            <TrendingUp className="h-4.5 w-4.5 text-deep-gold" />
            <span>Analytics Summary</span>
          </Link>
          <button disabled className="w-full flex items-center space-x-3 rounded-xl px-4 py-3 text-xs font-bold uppercase tracking-wider text-[#7D7061]/55 cursor-not-allowed border border-transparent text-left">
            <Calendar className="h-4.5 w-4.5 text-deep-gold/50" />
            <span>Active Batches (Soon)</span>
          </button>
          <button disabled className="w-full flex items-center space-x-3 rounded-xl px-4 py-3 text-xs font-bold uppercase tracking-wider text-[#7D7061]/55 cursor-not-allowed border border-transparent text-left">
            <CheckSquare className="h-4.5 w-4.5 text-[#6B8E6F]/50" />
            <span>Attendance (Soon)</span>
          </button>
          
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
        
        {/* Topbar */}
        <header className="h-16 border-b border-primary-gold/10 bg-white px-6 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center space-x-4">
            <button onClick={() => setSidebarOpen(true)} className="p-2 md:hidden text-[#7D7061] hover:bg-cream rounded-xl">
              <Menu className="h-5 w-5" />
            </button>
            <h1 className="font-serif text-lg font-bold text-[#2D241A] uppercase tracking-wider">Candidate Registry</h1>
          </div>

          <div className="flex items-center space-x-2.5">
            <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-deep-gold to-primary-gold flex items-center justify-center font-bold text-white border border-primary-gold/30 text-sm shadow-sm">
              {userInitials}
            </div>
            <div className="hidden sm:block text-left">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-[#2D241A]">{profile?.centre_name || user?.name || 'Kiran Mahila Kendra'}</span>
              <span className="block text-[9px] uppercase font-bold tracking-widest text-deep-rose">Regd. Center #{user?.id?.slice(0, 5) || '104'}</span>
            </div>
          </div>
        </header>

        {/* Content Panels */}
        <main className="p-6 h-full flex flex-col gap-6 overflow-hidden">
          {profileLoaded && !profile ? (
            <div className="flex-grow flex items-center justify-center p-8 bg-white border border-primary-gold/15 rounded-2xl shadow-sm">
              <div className="max-w-md text-center space-y-4">
                <AlertTriangle className="h-12 w-12 mx-auto text-deep-gold" />
                <h3 className="font-serif text-lg font-bold text-[#2D241A] uppercase tracking-wider">Profile Setup Required</h3>
                <p className="text-xs text-[#7D7061] leading-relaxed font-semibold">
                  You must complete your Coaching Centre profile registration details before you can access candidate records or manage registered learners.
                </p>
                <Link 
                  to="/centre/profile"
                  className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-deep-gold to-[#C8870A] hover:from-[#C8870A] hover:to-deep-gold text-white text-xs font-bold uppercase tracking-widest px-5 py-3 shadow-md hover:shadow-lg transition cursor-pointer"
                >
                  Complete Profile Setup Now →
                </Link>
              </div>
            </div>
          ) : (
            <div className="flex-grow flex flex-col lg:flex-row gap-6 h-full overflow-hidden">
              {/* LEFT ZONE: Learners List with Search & Filtering */}
          <div className={`flex flex-col flex-1 bg-white rounded-2xl border border-primary-gold/15 overflow-hidden ${activeLearnerId ? 'hidden lg:flex max-w-sm xl:max-w-md' : 'w-full'}`}>
            
            {/* Search Header */}
            <div className="p-4 border-b border-primary-gold/10 space-y-3">
              <div className="relative">
                <Search className="absolute left-3.5 top-3 h-4 w-4 text-[#7D7061]" />
                <input 
                  type="text" 
                  placeholder="Search by name, email, or phone..." 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-primary-gold/20 text-xs font-semibold focus:outline-none focus:border-deep-rose transition bg-cream/30"
                />
              </div>

              {/* Filters row */}
              <div className="grid grid-cols-3 gap-2">
                <select 
                  value={language} 
                  onChange={(e) => setLanguage(e.target.value)}
                  className="px-2 py-2 rounded-lg border border-primary-gold/20 text-[10px] font-bold bg-white text-[#7D7061]"
                >
                  <option value="">Language</option>
                  <option value="en">English</option>
                  <option value="kn">Kannada</option>
                  <option value="hi">Hindi</option>
                </select>

                <select 
                  value={education} 
                  onChange={(e) => setEducation(e.target.value)}
                  className="px-2 py-2 rounded-lg border border-primary-gold/20 text-[10px] font-bold bg-white text-[#7D7061]"
                >
                  <option value="">Education</option>
                  <option value="No formal education">No Formal</option>
                  <option value="Primary">Primary</option>
                  <option value="Secondary">Secondary</option>
                  <option value="Higher Secondary">Higher Sec</option>
                  <option value="Diploma">Diploma</option>
                  <option value="Undergraduate">Graduate</option>
                </select>

                <select 
                  value={preference} 
                  onChange={(e) => setPreference(e.target.value)}
                  className="px-2 py-2 rounded-lg border border-primary-gold/20 text-[10px] font-bold bg-white text-[#7D7061]"
                >
                  <option value="">Preference</option>
                  <option value="Online">Online</option>
                  <option value="Offline">Offline</option>
                  <option value="Hybrid">Hybrid</option>
                </select>
              </div>
            </div>

            {/* List Body */}
            <div className="flex-grow overflow-y-auto divide-y divide-primary-gold/10">
              {loading ? (
                <div className="p-8 text-center text-[#7D7061] text-xs font-semibold">
                  <div className="h-6 w-6 border-2 border-deep-rose border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  Loading candidate files...
                </div>
              ) : error ? (
                <div className="p-8 text-center text-deep-rose text-xs font-semibold">
                  <AlertTriangle className="h-6 w-6 mx-auto mb-2 text-deep-rose/80" />
                  {error}
                </div>
              ) : learners.length === 0 ? (
                <div className="p-12 text-center text-[#7D7061] text-xs font-medium space-y-2">
                  <Users className="h-8 w-8 mx-auto mb-2 text-primary-gold/30" />
                  <p className="font-bold">No candidates found.</p>
                  <p className="text-[11px] text-[#7D7061]/80 leading-relaxed px-4">
                    Verify that learners are registered with your training centre code in their profile settings.
                  </p>
                </div>
              ) : (
                learners.map((learner) => (
                  <button
                    key={learner.id}
                    onClick={() => setActiveLearnerId(learner.id)}
                    className={`w-full text-left p-4 hover:bg-cream/40 transition flex items-center justify-between border-l-2 ${
                      activeLearnerId === learner.id 
                        ? 'bg-cream/70 border-deep-rose' 
                        : 'border-transparent'
                    }`}
                  >
                    <div className="space-y-1.5 min-w-0 pr-2">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-serif text-sm font-bold text-[#2D241A] truncate">{learner.name}</h4>
                        {learner.profile_completed && (
                          <span className="text-[9px] font-bold text-green-700 bg-sage-green/30 px-1.5 py-0.5 rounded">Completed</span>
                        )}
                      </div>
                      
                      {/* Zero-Pill Meta: unboxed text with delimiters */}
                      <div className="flex items-center gap-1.5 text-[10px] text-[#7D7061] font-semibold truncate">
                        <span>Age {learner.age || 'N/A'}</span>
                        <span aria-hidden="true" className="text-primary-gold/40">·</span>
                        <span>{learner.location || 'Unknown'}</span>
                        <span aria-hidden="true" className="text-primary-gold/40">·</span>
                        <span className="font-mono text-[9px]">{getLanguageLabel(learner.preferred_language)}</span>
                      </div>
                    </div>
                    <ChevronRight className={`h-4.5 w-4.5 text-primary-gold/50 flex-shrink-0 transition-transform ${activeLearnerId === learner.id ? 'translate-x-1 text-deep-rose' : ''}`} />
                  </button>
                ))
              )}
            </div>
          </div>

          {/* RIGHT ZONE: Candidate Dossier (Details View) */}
          <div className={`flex-[2] bg-white rounded-2xl border border-primary-gold/15 overflow-hidden flex flex-col ${!activeLearnerId ? 'hidden lg:flex items-center justify-center text-center p-8 bg-cream/10 border-dashed' : 'w-full animate-fadeIn'}`}>
            {!activeLearnerId ? (
              <div className="space-y-3 max-w-sm">
                <Users className="h-12 w-12 mx-auto text-primary-gold/25" />
                <h3 className="font-serif text-base font-bold text-[#2D241A] uppercase tracking-wider">Candidate Dossier</h3>
                <p className="text-xs text-[#7D7061] leading-relaxed font-semibold">
                  Select a candidate from the registry on the left to inspect profile details, credentials, and learning progress securely.
                </p>
              </div>
            ) : detailsLoading ? (
              <div className="flex-grow flex flex-col items-center justify-center p-12 text-[#7D7061] text-xs font-semibold">
                <div className="h-8 w-8 border-2 border-deep-rose border-t-transparent rounded-full animate-spin mb-3" />
                Retrieving candidate secure file...
              </div>
            ) : detailsError ? (
              <div className="flex-grow flex flex-col items-center justify-center p-8 text-center text-deep-rose text-xs font-semibold">
                <AlertTriangle className="h-8 w-8 mb-3 text-deep-rose/85" />
                {detailsError}
                <button 
                  onClick={() => setActiveLearnerId(null)}
                  className="mt-4 px-4 py-2 bg-cream text-[#3D2D1E] rounded-lg font-bold border border-primary-gold/20"
                >
                  Close Dossier
                </button>
              </div>
            ) : !learnerDetails ? null : (
              <div className="flex-grow flex flex-col h-full overflow-hidden">
                {/* Dossier Header */}
                <div className="p-5 border-b border-primary-gold/10 bg-cream/20 flex items-center justify-between">
                  <div className="flex items-center space-x-3.5">
                    <button 
                      onClick={() => setActiveLearnerId(null)}
                      className="p-1.5 hover:bg-cream rounded-xl text-[#7D7061] hover:text-[#2D241A] transition lg:hidden"
                    >
                      <ArrowLeft className="h-5 w-5" />
                    </button>
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2.5">
                        <h2 className="font-serif text-lg font-extrabold text-[#2D241A]">{learnerDetails.learner.name}</h2>
                        <span className="text-[9px] uppercase font-bold tracking-widest text-deep-rose bg-soft-rose/30 px-2 py-0.5 rounded">Candidate File</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] text-[#7D7061] font-bold uppercase tracking-wider">
                        <span>{learnerDetails.learner.email}</span>
                        <span aria-hidden="true" className="text-primary-gold/40">·</span>
                        <span>{learnerDetails.learner.phone || 'No Phone'}</span>
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => setActiveLearnerId(null)}
                    className="hidden lg:flex p-1.5 hover:bg-cream rounded-xl text-[#7D7061] hover:text-[#2D241A] transition"
                  >
                    <X className="h-4.5 w-4.5" />
                  </button>
                </div>

                {/* Dossier Scrollable Content */}
                <div className="flex-grow overflow-y-auto p-6 space-y-6">
                  
                  {/* Grid layout for profile blocks */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    
                    {/* Block 1: Demographics & Preferences */}
                    <div className="p-5 rounded-2xl bg-cream/15 border border-primary-gold/10 space-y-3.5">
                      <div className="flex items-center space-x-2 text-deep-gold">
                        <MapPin className="h-4 w-4" />
                        <h3 className="text-xs uppercase font-extrabold tracking-widest">Demographics & Context</h3>
                      </div>
                      <div className="space-y-2 text-xs font-semibold">
                        <div className="flex justify-between py-1 border-b border-primary-gold/5">
                          <span className="text-[#7D7061]">Age:</span>
                          <span className="text-[#2D241A]">{learnerDetails.learner.age || 'N/A'} Years</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-primary-gold/5">
                          <span className="text-[#7D7061]">Location:</span>
                          <span className="text-[#2D241A]">{learnerDetails.learner.location || 'Unknown'}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-primary-gold/5">
                          <span className="text-[#7D7061]">Education Level:</span>
                          <span className="text-[#2D241A]">{learnerDetails.learner.education_level || 'No Formal Education'}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-primary-gold/5">
                          <span className="text-[#7D7061]">Dialect Intelligence:</span>
                          <span className="text-[#2D241A] font-mono text-[11px]">{getLanguageLabel(learnerDetails.learner.preferred_language)}</span>
                        </div>
                        <div className="flex justify-between py-1">
                          <span className="text-[#7D7061]">Learning Preference:</span>
                          <span className="text-deep-rose font-bold">{learnerDetails.learner.learning_preference || 'Hybrid'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Block 2: Competency & Goals */}
                    <div className="p-5 rounded-2xl bg-cream/15 border border-primary-gold/10 space-y-3.5">
                      <div className="flex items-center space-x-2 text-deep-gold">
                        <Award className="h-4 w-4" />
                        <h3 className="text-xs uppercase font-extrabold tracking-widest">Competency & Intent</h3>
                      </div>
                      <div className="space-y-3 text-xs">
                        <div className="space-y-1">
                          <span className="text-[10px] uppercase font-bold text-[#7D7061] tracking-wider block">Primary Career Goal:</span>
                          <p className="font-bold text-[#2D241A] leading-relaxed">
                            {learnerDetails.learner.career_goal || 'Improve existing skills'}
                          </p>
                        </div>
                        <div className="space-y-1.5">
                          <span className="text-[10px] uppercase font-bold text-[#7D7061] tracking-wider block">Existing Skills:</span>
                          <div className="flex flex-wrap gap-1.5 text-[10px] font-bold text-[#7D7061]">
                            {learnerDetails.learner.existing_skills && learnerDetails.learner.existing_skills.length > 0 ? (
                              learnerDetails.learner.existing_skills.map((s: string, idx: number) => (
                                <span key={idx} className="bg-cream border border-primary-gold/15 px-2 py-0.5 rounded">{s}</span>
                              ))
                            ) : (
                              <span className="italic text-[#7D7061]/70">No skills registered yet</span>
                            )}
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <span className="text-[10px] uppercase font-bold text-[#7D7061] tracking-wider block">Learning Targets:</span>
                          <div className="flex flex-wrap gap-1.5 text-[10px] font-bold text-deep-rose">
                            {learnerDetails.learner.learning_interests && learnerDetails.learner.learning_interests.length > 0 ? (
                              learnerDetails.learner.learning_interests.map((s: string, idx: number) => (
                                <span key={idx} className="bg-soft-rose/20 border border-deep-rose/10 px-2 py-0.5 rounded">{s}</span>
                              ))
                            ) : (
                              <span className="italic text-[#7D7061]/70">No targets specified</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                  </div>

                  {/* Block 3: Full-width Course Progression */}
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2 text-deep-gold">
                      <BookOpen className="h-4 w-4" />
                      <h3 className="text-xs uppercase font-extrabold tracking-widest">Course Progression & Credentials</h3>
                    </div>

                    {learnerDetails.progress && learnerDetails.progress.length > 0 ? (
                      <div className="space-y-4">
                        {learnerDetails.progress.map((prog: any, idx: number) => (
                          <div key={idx} className="p-5 rounded-2xl bg-white border border-primary-gold/15 space-y-4 shadow-sm hover:shadow-md transition">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
                              <div className="space-y-0.5">
                                <h4 className="font-serif text-sm font-bold text-[#2D241A]">{prog.course_title}</h4>
                                <div className="flex items-center gap-1.5 text-[10px] text-[#7D7061] font-semibold">
                                  <span>{prog.learning_mode?.toUpperCase()} mode</span>
                                  <span aria-hidden="true" className="text-primary-gold/40">·</span>
                                  <span>Lessons: {prog.completed_lessons} / {prog.total_lessons}</span>
                                </div>
                              </div>
                              <span className={`inline-block self-start sm:self-center px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                                prog.status === 'completed' 
                                  ? 'bg-sage-green/30 text-green-800' 
                                  : 'bg-soft-yellow/40 text-amber-800'
                              }`}>
                                {prog.status}
                              </span>
                            </div>

                            {/* Progress bar */}
                            <div className="space-y-1">
                              <div className="flex justify-between text-[10px] font-bold text-[#7D7061]">
                                <span>Curriculum Progress</span>
                                <span className="font-mono">{prog.progress_percentage}%</span>
                              </div>
                              <div className="h-2 w-full bg-cream rounded-full overflow-hidden border border-primary-gold/5">
                                <div 
                                  className="h-full bg-gradient-to-r from-deep-rose to-primary-pink rounded-full transition-all duration-500"
                                  style={{ width: `${prog.progress_percentage}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-8 text-center bg-cream/10 border border-dashed border-primary-gold/20 rounded-2xl">
                        <Clock className="h-8 w-8 mx-auto mb-2 text-primary-gold/30" />
                        <h4 className="text-xs font-bold text-[#2D241A]">No Active Course Enrolments</h4>
                        <p className="text-[11px] text-[#7D7061] leading-relaxed max-w-xs mx-auto mt-1">
                          This candidate has completed onboarding but has not actively enrolled in any training centre curriculum yet.
                        </p>
                      </div>
                    )}
                  </div>

                </div>
              </div>
            )}
          </div>

            </div>
          )}
        </main>
      </div>
    </div>
  );
}
