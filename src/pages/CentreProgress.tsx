import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  Building2, 
  Users, 
  Calendar, 
  GraduationCap, 
  CheckSquare, 
  ArrowLeft,
  Menu,
  X,
  HeartHandshake,
  LogOut,
  AlertTriangle,
  LayoutDashboard,
  Search,
  Filter,
  BookOpen,
  Award,
  ChevronRight,
  Clock,
  Sparkles,
  BarChart3,
  TrendingUp,
  CheckCircle,
  HelpCircle,
  FolderKanban,
  User,
  Activity,
  CalendarCheck
} from 'lucide-react';
import { useAuth } from '../services/authContext';
import { api } from '../services/api';

export default function CentreProgress() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Active Monitoring Tab: 'learners' or 'courses'
  const [activeTab, setActiveTab] = useState<'learners' | 'courses'>('learners');

  // Search & filter parameters
  const [searchQuery, setSearchQuery] = useState('');
  const [langFilter, setLangFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Loaded profiles & overviews
  const [profile, setProfile] = useState<any>(null);
  const [profileLoaded, setProfileLoaded] = useState(false);
  
  // Progress Data
  const [overviewData, setOverviewData] = useState<any[]>([]);
  const [allCourses, setAllCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Active details modal/dossier states
  const [selectedLearnerId, setSelectedLearnerId] = useState<string | null>(null);
  const [learnerDetails, setLearnerDetails] = useState<any>(null);
  const [learnerLoading, setLearnerLoading] = useState(false);

  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [courseDetails, setCourseDetails] = useState<any>(null);
  const [courseLoading, setCourseLoading] = useState(false);

  // Fetch Centre Profile & Basic Progress Lists
  useEffect(() => {
    async function loadCentreContext() {
      try {
        setLoading(true);
        setError(null);

        // 1. Fetch Profile
        try {
          const profileRes = await api.get('/api/centres/me');
          if (profileRes.data?.success) {
            setProfile(profileRes.data.profile);
          }
        } catch (err: any) {
          if (err.response?.status === 404) {
            setProfile(null);
          } else {
            console.error('Error loading centre profile:', err);
          }
        } finally {
          setProfileLoaded(true);
        }

        // 2. Fetch Progress Overview List
        const progressRes = await api.get('/api/centres/progress');
        if (progressRes.data?.success) {
          setOverviewData(progressRes.data.overview || []);
        }

        // 3. Fetch Courses list for Course Aggregation tab
        const coursesRes = await api.get('/api/centres/courses');
        if (coursesRes.data?.success) {
          setAllCourses(coursesRes.data.courses || []);
        }

      } catch (err: any) {
        console.error('Error loading progress monitoring context:', err);
        setError(err.response?.data?.detail || 'Failed to initialize progress monitoring database.');
      } finally {
        setLoading(false);
      }
    }

    loadCentreContext();
  }, []);

  // Fetch detailed learner breakdown when clicked
  useEffect(() => {
    if (!selectedLearnerId) {
      setLearnerDetails(null);
      return;
    }

    async function loadLearnerDetailBreakdown() {
      try {
        setLearnerLoading(true);
        const res = await api.get(`/api/centres/progress/learners/${selectedLearnerId}`);
        if (res.data?.success) {
          setLearnerDetails(res.data);
        }
      } catch (err: any) {
        console.error('Error loading learner breakdown:', err);
      } finally {
        setLearnerLoading(false);
      }
    }

    loadLearnerDetailBreakdown();
  }, [selectedLearnerId]);

  // Fetch detailed course aggregation when clicked
  useEffect(() => {
    if (!selectedCourseId) {
      setCourseDetails(null);
      return;
    }

    async function loadCourseAggDetail() {
      try {
        setCourseLoading(true);
        const res = await api.get(`/api/centres/progress/courses/${selectedCourseId}`);
        if (res.data?.success) {
          setCourseDetails(res.data);
        }
      } catch (err: any) {
        console.error('Error loading course progress details:', err);
      } finally {
        setCourseLoading(false);
      }
    }

    loadCourseAggDetail();
  }, [selectedCourseId]);

  const userInitials = user?.name
    ? user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().substring(0, 2)
    : 'KC';

  const isCurrentPath = (path: string) => location.pathname === path;

  // Nice Language labels helper
  const getLanguageLabel = (langCode: string) => {
    switch (langCode) {
      case 'kn': return 'ಕನ್ನಡ (Kannada)';
      case 'hi': return 'हिन्दी (Hindi)';
      case 'en': return 'English';
      default: return langCode || 'English';
    }
  };

  // Format Date helper
  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'No activity yet';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  // Statistics Computations
  const totalActiveEnrolled = overviewData.length;
  const completedCount = overviewData.filter(o => o.completion_status === 'completed' || o.progress_percentage === 100).length;
  const averageProgress = totalActiveEnrolled > 0 
    ? Math.round(overviewData.reduce((acc, curr) => acc + (curr.progress_percentage || 0), 0) / totalActiveEnrolled)
    : 0;

  // Filtered Overview Data (Learners List)
  const filteredOverview = overviewData.filter(item => {
    const matchesSearch = searchQuery === '' || 
      item.learner?.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
      item.course?.title?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesLang = langFilter === '' || item.learner?.preferred_language === langFilter;
    const matchesStatus = statusFilter === '' || item.completion_status === statusFilter;

    return matchesSearch && matchesLang && matchesStatus;
  });

  return (
    <div className="flex h-screen bg-cream overflow-hidden text-[#3D2D1E]" id="centre-progress-dashboard">
      
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
            <h1 className="font-serif text-lg font-bold text-[#2D241A] uppercase tracking-wider flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-deep-gold" />
              <span>Progress Monitoring</span>
            </h1>
          </div>

          <div className="flex items-center space-x-2.5">
            <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-deep-gold to-primary-gold flex items-center justify-center font-bold text-white border border-primary-gold/30 text-sm shadow-sm">
              {userInitials}
            </div>
            <div className="hidden sm:block text-left">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-[#2D241A]">{profile?.centre_name || user?.name || 'Kiran Mahila Kendra'}</span>
              <span className="block text-[9px] uppercase font-bold tracking-widest text-deep-rose">Center Monitor</span>
            </div>
          </div>
        </header>

        {/* Content Panel */}
        <main className="p-6 h-full flex flex-col gap-6 overflow-hidden">
          {profileLoaded && !profile ? (
            <div className="flex-grow flex items-center justify-center p-8 bg-white border border-primary-gold/15 rounded-2xl shadow-sm">
              <div className="max-w-md text-center space-y-4">
                <AlertTriangle className="h-12 w-12 mx-auto text-deep-gold" />
                <h3 className="font-serif text-lg font-bold text-[#2D241A] uppercase tracking-wider">Profile Setup Required</h3>
                <p className="text-xs text-[#7D7061] leading-relaxed font-semibold">
                  You must complete your Coaching Centre profile registration details before you can access progress metrics or monitor registered candidate portfolios.
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
            <div className="space-y-6 flex-grow flex flex-col overflow-y-auto pr-1">
              
              {/* Aggregated Overview Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <div className="p-5 bg-white rounded-2xl border border-primary-gold/15 shadow-sm hover:shadow-md transition">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-[#7D7061] tracking-widest">Active Candidates</span>
                    <Users className="h-4.5 w-4.5 text-deep-gold" />
                  </div>
                  <span className="text-3xl font-extrabold text-[#2D241A] mt-2.5 block">{totalActiveEnrolled}</span>
                  <span className="text-[10px] text-[#7D7061] font-semibold mt-1 block">Candidates linked and enrolled in courses</span>
                </div>

                <div className="p-5 bg-white rounded-2xl border border-primary-gold/15 shadow-sm hover:shadow-md transition">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-[#7D7061] tracking-widest">Average Progress</span>
                    <TrendingUp className="h-4.5 w-4.5 text-green-600" />
                  </div>
                  <span className="text-3xl font-extrabold text-[#2D241A] mt-2.5 block">{averageProgress}%</span>
                  <div className="w-full bg-cream h-1.5 rounded-full overflow-hidden mt-2.5 border border-primary-gold/5">
                    <div className="h-full bg-green-600 rounded-full" style={{ width: `${averageProgress}%` }} />
                  </div>
                </div>

                <div className="p-5 bg-white rounded-2xl border border-primary-gold/15 shadow-sm hover:shadow-md transition">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-[#7D7061] tracking-widest">Total Completions</span>
                    <CheckCircle className="h-4.5 w-4.5 text-sage-green text-green-700" />
                  </div>
                  <span className="text-3xl font-extrabold text-[#2D241A] mt-2.5 block">{completedCount}</span>
                  <span className="text-[10px] text-[#7D7061] font-semibold mt-1 block">Courses completed at 100% curriculum</span>
                </div>
              </div>

              {/* Segmented Control for Tab selection */}
              <div className="flex items-center justify-between gap-4 border-b border-primary-gold/10 pb-4">
                <div className="flex items-center gap-1 p-1 bg-white border border-primary-gold/15 rounded-xl shadow-sm">
                  <button 
                    onClick={() => { setActiveTab('learners'); setSelectedCourseId(null); }}
                    className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer ${activeTab === 'learners' ? 'bg-soft-yellow/80 text-[#3D2D1E] shadow-sm' : 'text-[#7D7061] hover:text-[#2D241A]'}`}
                  >
                    Candidate Progress
                  </button>
                  <button 
                    onClick={() => { setActiveTab('courses'); setSelectedLearnerId(null); }}
                    className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer ${activeTab === 'courses' ? 'bg-soft-yellow/80 text-[#3D2D1E] shadow-sm' : 'text-[#7D7061] hover:text-[#2D241A]'}`}
                  >
                    Course Aggregation
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[9px] uppercase font-bold tracking-widest text-[#7D7061] hidden sm:inline">Monitoring Live Data</span>
                  <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                </div>
              </div>

              {/* TAB 1: LEARNERS PROGRESS OVERVIEW */}
              {activeTab === 'learners' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                  
                  {/* Left checklist catalog */}
                  <div className="lg:col-span-2 bg-white rounded-2xl border border-primary-gold/15 overflow-hidden flex flex-col">
                    <div className="p-4 border-b border-primary-gold/10 flex flex-col sm:flex-row gap-3 items-center justify-between">
                      <div className="relative w-full sm:max-w-xs">
                        <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-[#7D7061]" />
                        <input 
                          type="text" 
                          placeholder="Search candidate name or course..." 
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full pl-10 pr-4 py-2 rounded-xl border border-primary-gold/20 text-xs font-semibold focus:outline-none focus:border-deep-rose transition bg-cream/20"
                        />
                      </div>

                      <div className="flex gap-2 w-full sm:w-auto">
                        <select 
                          value={langFilter} 
                          onChange={(e) => setLangFilter(e.target.value)}
                          className="px-2 py-2 rounded-lg border border-primary-gold/20 text-[10px] font-bold bg-white text-[#7D7061] flex-1 sm:flex-initial"
                        >
                          <option value="">Language</option>
                          <option value="en">English</option>
                          <option value="kn">Kannada</option>
                          <option value="hi">Hindi</option>
                        </select>
                        <select 
                          value={statusFilter} 
                          onChange={(e) => setStatusFilter(e.target.value)}
                          className="px-2 py-2 rounded-lg border border-primary-gold/20 text-[10px] font-bold bg-white text-[#7D7061] flex-1 sm:flex-initial"
                        >
                          <option value="">Status</option>
                          <option value="in-progress">In Progress</option>
                          <option value="completed">Completed</option>
                        </select>
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-cream/35 border-b border-primary-gold/10 text-[10px] font-bold uppercase tracking-wider text-[#7D7061]">
                            <th className="p-4">Candidate</th>
                            <th className="p-4">Enrolled Course</th>
                            <th className="p-4">Curriculum Progress</th>
                            <th className="p-4">Last Activity</th>
                            <th className="p-4">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-primary-gold/10">
                          {loading ? (
                            <tr>
                              <td colSpan={5} className="p-8 text-center text-[#7D7061] font-semibold">
                                <div className="h-6 w-6 border-2 border-deep-rose border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                                Loading progress tracking lists...
                              </td>
                            </tr>
                          ) : filteredOverview.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="p-12 text-center text-[#7D7061] font-medium space-y-2">
                                <Users className="h-8 w-8 mx-auto mb-2 text-primary-gold/30" />
                                <p className="font-bold">No active progress files matching search.</p>
                                <p className="text-[11px] text-[#7D7061]/80 leading-relaxed px-4">
                                  Verify candidates are registered with your center and enrolled in structured active courses.
                                </p>
                              </td>
                            </tr>
                          ) : (
                            filteredOverview.map((item) => (
                              <tr 
                                key={item.id} 
                                className={`hover:bg-cream/15 transition ${selectedLearnerId === item.learner.id ? 'bg-cream/40' : ''}`}
                              >
                                <td className="p-4">
                                  <div className="font-serif font-bold text-[#2D241A]">{item.learner.name}</div>
                                  <div className="text-[10px] text-[#7D7061] font-semibold mt-0.5">{getLanguageLabel(item.learner.preferred_language)}</div>
                                </td>
                                <td className="p-4">
                                  <div className="font-bold text-[#2D241A]">{item.course.title}</div>
                                  <div className="text-[9px] uppercase font-bold text-deep-rose mt-0.5 tracking-wider">Custom Course</div>
                                </td>
                                <td className="p-4">
                                  <div className="flex items-center gap-2">
                                    <div className="flex-grow min-w-24 max-w-32 bg-cream h-2 rounded-full overflow-hidden border border-primary-gold/5">
                                      <div 
                                        className="h-full bg-gradient-to-r from-deep-rose to-primary-pink rounded-full" 
                                        style={{ width: `${item.progress_percentage}%` }} 
                                      />
                                    </div>
                                    <span className="font-mono text-[10px] font-bold text-[#3D2D1E] shrink-0">{item.progress_percentage}%</span>
                                  </div>
                                  <div className="text-[10px] text-[#7D7061] font-semibold mt-1">
                                    Lessons: {item.completed_lessons} / {item.total_lessons}
                                  </div>
                                </td>
                                <td className="p-4 text-[11px] font-medium text-[#7D7061]">
                                  {formatDate(item.last_activity)}
                                </td>
                                <td className="p-4">
                                  <button 
                                    onClick={() => setSelectedLearnerId(item.learner.id)}
                                    className="px-3 py-1.5 rounded-lg border border-primary-gold/25 hover:bg-cream transition text-[10px] font-bold uppercase tracking-wider text-[#2D241A] flex items-center gap-1 cursor-pointer"
                                  >
                                    <span>Details</span>
                                    <ChevronRight className="h-3.5 w-3.5" />
                                  </button>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Right candidate dossier checklist */}
                  <div className="bg-white rounded-2xl border border-primary-gold/15 overflow-hidden p-5 space-y-5 min-h-[400px]">
                    {!selectedLearnerId ? (
                      <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-3">
                        <Users className="h-12 w-12 text-primary-gold/25 mx-auto" />
                        <h4 className="font-serif text-sm font-bold text-[#2D241A] uppercase tracking-wider">Candidate Progress Dossier</h4>
                        <p className="text-xs text-[#7D7061] leading-relaxed font-semibold">
                          Click "Details" on any candidate row to retrieve their file and view their comprehensive lesson completion checklist.
                        </p>
                      </div>
                    ) : learnerLoading ? (
                      <div className="h-full flex flex-col items-center justify-center p-12 text-center text-[#7D7061] text-xs font-semibold">
                        <div className="h-8 w-8 border-2 border-deep-rose border-t-transparent rounded-full animate-spin mb-3" />
                        Retrieving secure candidate history...
                      </div>
                    ) : !learnerDetails ? null : (
                      <div className="space-y-6">
                        
                        {/* Dossier Header */}
                        <div className="border-b border-primary-gold/10 pb-4 flex justify-between items-start">
                          <div className="space-y-1">
                            <h3 className="font-serif text-base font-extrabold text-[#2D241A]">{learnerDetails.learner.name}</h3>
                            <div className="text-[10px] uppercase font-bold text-deep-rose tracking-wider">
                              Candidate Record
                            </div>
                            <div className="text-[10px] text-[#7D7061] font-semibold mt-1.5 space-y-0.5">
                              <div>Email: {learnerDetails.learner.email}</div>
                              <div>Phone: {learnerDetails.learner.phone || 'No Phone Registered'}</div>
                              <div>Location: {learnerDetails.learner.location || 'Rural Region'}</div>
                            </div>
                          </div>
                          <button 
                            onClick={() => setSelectedLearnerId(null)}
                            className="p-1 hover:bg-cream rounded-lg text-[#7D7061] hover:text-[#2D241A] transition"
                          >
                            <X className="h-4.5 w-4.5" />
                          </button>
                        </div>

                        {/* Courses Progress with Lesson Checklists */}
                        <div className="space-y-6 max-h-[500px] overflow-y-auto pr-1">
                          <h4 className="text-xs uppercase font-extrabold tracking-wider text-deep-gold flex items-center gap-1.5">
                            <BookOpen className="h-4 w-4" />
                            <span>Curriculum Checklists</span>
                          </h4>

                          {learnerDetails.courses && learnerDetails.courses.length > 0 ? (
                            learnerDetails.courses.map((courseItem: any) => (
                              <div key={courseItem.course_id} className="p-4 rounded-xl bg-cream/15 border border-primary-gold/10 space-y-4">
                                <div className="flex justify-between items-start gap-2 border-b border-primary-gold/5 pb-2">
                                  <div>
                                    <h5 className="font-serif text-xs font-bold text-[#2D241A]">{courseItem.course_title}</h5>
                                    <span className="text-[9px] text-[#7D7061] font-semibold">Enrolled on: {formatDate(courseItem.enrollment_date)}</span>
                                  </div>
                                  <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${courseItem.status === 'completed' ? 'bg-sage-green/30 text-green-800' : 'bg-soft-yellow/40 text-amber-800'}`}>
                                    {courseItem.status}
                                  </span>
                                </div>

                                <div className="space-y-1">
                                  <div className="flex justify-between text-[10px] font-bold text-[#7D7061]">
                                    <span>Syllabus Completion</span>
                                    <span>{courseItem.progress_percentage}%</span>
                                  </div>
                                  <div className="h-1.5 w-full bg-cream rounded-full overflow-hidden border border-primary-gold/5">
                                    <div className="h-full bg-deep-rose rounded-full" style={{ width: `${courseItem.progress_percentage}%` }} />
                                  </div>
                                </div>

                                <div className="space-y-2.5 pt-2">
                                  <span className="text-[10px] uppercase font-bold text-[#7D7061] tracking-wider block">Lesson Breakdown:</span>
                                  
                                  <div className="space-y-2 divide-y divide-primary-gold/5">
                                    {courseItem.lessons && courseItem.lessons.length > 0 ? (
                                      courseItem.lessons.map((lesson: any) => (
                                        <div key={lesson.lesson_id} className="flex items-start justify-between gap-3 pt-2 text-[11px] font-semibold text-[#3D2D1E]">
                                          <div className="flex items-start gap-2">
                                            <span className="font-mono text-[9px] text-deep-rose bg-soft-rose/10 px-1 py-0.5 rounded font-bold shrink-0 mt-0.5">#{lesson.lesson_number}</span>
                                            <span className="leading-tight">{lesson.title}</span>
                                          </div>
                                          
                                          {lesson.completed ? (
                                            <div className="text-right shrink-0">
                                              <span className="text-green-700 font-bold flex items-center gap-1 text-[10px]">
                                                <CheckCircle className="h-3.5 w-3.5" />
                                                <span>Done</span>
                                              </span>
                                              <span className="block text-[8px] text-[#7D7061] font-semibold mt-0.5">{formatDate(lesson.completed_at)}</span>
                                            </div>
                                          ) : (
                                            <span className="text-[#7D7061]/65 font-bold flex items-center gap-1 text-[10px] shrink-0">
                                              <Clock className="h-3.5 w-3.5 text-[#7D7061]/50" />
                                              <span>Pending</span>
                                            </span>
                                          )}
                                        </div>
                                      ))
                                    ) : (
                                      <div className="text-[11px] text-[#7D7061] italic p-2 text-center">No structured lessons found in this course module.</div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="text-xs text-[#7D7061] italic text-center p-4">This candidate is not enrolled in any customized center courses.</div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 2: COURSE PROGRESS AGGREGATION VIEW */}
              {activeTab === 'courses' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                  
                  {/* Left courses list */}
                  <div className="lg:col-span-2 bg-white rounded-2xl border border-primary-gold/15 overflow-hidden flex flex-col">
                    <div className="p-4 border-b border-primary-gold/10">
                      <h3 className="font-serif text-sm font-bold text-[#2D241A] uppercase tracking-wider">Courses Performance Registry</h3>
                      <p className="text-[11px] text-[#7D7061] mt-1 font-semibold">Select a course to inspect aggregated progress parameters and connected candidates.</p>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-cream/35 border-b border-primary-gold/10 text-[10px] font-bold uppercase tracking-wider text-[#7D7061]">
                            <th className="p-4">Course Details</th>
                            <th className="p-4">Syllabus Mode</th>
                            <th className="p-4">Instructor</th>
                            <th className="p-4">Status</th>
                            <th className="p-4">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-primary-gold/10">
                          {loading ? (
                            <tr>
                              <td colSpan={5} className="p-8 text-center text-[#7D7061] font-semibold">
                                <div className="h-6 w-6 border-2 border-deep-rose border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                                Loading center courses context...
                              </td>
                            </tr>
                          ) : allCourses.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="p-12 text-center text-[#7D7061] font-medium space-y-2">
                                <GraduationCap className="h-8 w-8 mx-auto mb-2 text-primary-gold/30" />
                                <p className="font-bold">No custom courses designed yet.</p>
                                <p className="text-[11px] text-[#7D7061]/80 leading-relaxed px-4">
                                  Go to "Manage Courses" to design, structure, and publish custom courses.
                                </p>
                              </td>
                            </tr>
                          ) : (
                            allCourses.map((c) => (
                              <tr 
                                key={c.id} 
                                className={`hover:bg-cream/15 transition ${selectedCourseId === c.id ? 'bg-cream/40' : ''}`}
                              >
                                <td className="p-4">
                                  <div className="font-serif font-bold text-[#2D241A]">{c.title}</div>
                                  <div className="text-[10px] text-[#7D7061] font-semibold mt-0.5">Duration: {c.duration || '4 Weeks'}</div>
                                </td>
                                <td className="p-4 uppercase font-bold text-[10px] text-deep-gold">
                                  {c.learning_mode || 'online'}
                                </td>
                                <td className="p-4 font-semibold text-[#2D241A]">
                                  {c.instructor}
                                </td>
                                <td className="p-4">
                                  <span className={`inline-block px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded ${c.status === 'active' ? 'bg-sage-green/30 text-green-800' : 'bg-soft-rose text-deep-rose'}`}>
                                    {c.status || 'active'}
                                  </span>
                                </td>
                                <td className="p-4">
                                  <button 
                                    onClick={() => setSelectedCourseId(c.id)}
                                    className="px-3 py-1.5 rounded-lg border border-primary-gold/25 hover:bg-cream transition text-[10px] font-bold uppercase tracking-wider text-[#2D241A] flex items-center gap-1 cursor-pointer"
                                  >
                                    <span>Metrics</span>
                                    <ChevronRight className="h-3.5 w-3.5" />
                                  </button>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Right course progress aggregation dossier */}
                  <div className="bg-white rounded-2xl border border-primary-gold/15 overflow-hidden p-5 space-y-5 min-h-[400px]">
                    {!selectedCourseId ? (
                      <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-3">
                        <GraduationCap className="h-12 w-12 text-primary-gold/25 mx-auto" />
                        <h4 className="font-serif text-sm font-bold text-[#2D241A] uppercase tracking-wider">Course Performance Dossier</h4>
                        <p className="text-xs text-[#7D7061] leading-relaxed font-semibold">
                          Click "Metrics" on any course row to inspect overall student performance registers, average completion, and linked candidate lists.
                        </p>
                      </div>
                    ) : courseLoading ? (
                      <div className="h-full flex flex-col items-center justify-center p-12 text-center text-[#7D7061] text-xs font-semibold">
                        <div className="h-8 w-8 border-2 border-deep-rose border-t-transparent rounded-full animate-spin mb-3" />
                        Aggregating syllabus metrics...
                      </div>
                    ) : !courseDetails ? null : (
                      <div className="space-y-6 animate-fadeIn">
                        
                        {/* Course Dossier Header */}
                        <div className="border-b border-primary-gold/10 pb-4 flex justify-between items-start">
                          <div className="space-y-1">
                            <h3 className="font-serif text-base font-extrabold text-[#2D241A]">{courseDetails.course.title}</h3>
                            <div className="text-[10px] uppercase font-bold text-deep-rose tracking-wider">
                              Syllabus Statistics
                            </div>
                            <div className="text-[10px] text-[#7D7061] font-semibold mt-1.5">
                              Syllabus Code: #{courseDetails.course.id?.slice(0, 8)}
                            </div>
                          </div>
                          <button 
                            onClick={() => setSelectedCourseId(null)}
                            className="p-1 hover:bg-cream rounded-lg text-[#7D7061] hover:text-[#2D241A] transition"
                          >
                            <X className="h-4.5 w-4.5" />
                          </button>
                        </div>

                        {/* Statistics Grid */}
                        <div className="grid grid-cols-2 gap-3.5">
                          <div className="p-3 bg-cream/15 border border-primary-gold/10 rounded-xl text-center">
                            <span className="text-[8px] uppercase tracking-widest font-extrabold text-[#7D7061] block">Average Progress</span>
                            <span className="text-xl font-black text-[#2D241A] mt-1 block">{courseDetails.progress_aggregation.average_progress_percentage}%</span>
                          </div>
                          <div className="p-3 bg-cream/15 border border-primary-gold/10 rounded-xl text-center">
                            <span className="text-[8px] uppercase tracking-widest font-extrabold text-[#7D7061] block">Total Enrolled</span>
                            <span className="text-xl font-black text-[#2D241A] mt-1 block">{courseDetails.course.total_active_enrolled_learners}</span>
                          </div>
                          <div className="p-3 bg-sage-green/10 border border-green-200/50 rounded-xl text-center">
                            <span className="text-[8px] uppercase tracking-widest font-extrabold text-green-800 block">Completed</span>
                            <span className="text-xl font-black text-green-700 mt-1 block">{courseDetails.progress_aggregation.total_learners_completed}</span>
                          </div>
                          <div className="p-3 bg-soft-yellow/15 border border-primary-gold/10 rounded-xl text-center">
                            <span className="text-[8px] uppercase tracking-widest font-extrabold text-amber-800 block">In Progress</span>
                            <span className="text-xl font-black text-amber-700 mt-1 block">{courseDetails.progress_aggregation.total_learners_in_progress}</span>
                          </div>
                        </div>

                        {/* Candidates breakdown */}
                        <div className="space-y-4">
                          <h4 className="text-xs uppercase font-extrabold tracking-wider text-deep-gold flex items-center gap-1.5">
                            <Users className="h-4 w-4" />
                            <span>Enrolled Candidate Lists</span>
                          </h4>

                          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                            {courseDetails.learner_breakdown && courseDetails.learner_breakdown.length > 0 ? (
                              courseDetails.learner_breakdown.map((l_item: any) => (
                                <div key={l_item.learner_id} className="p-3.5 rounded-xl border border-primary-gold/10 space-y-3 bg-white hover:border-deep-rose/30 transition">
                                  <div className="flex justify-between items-start gap-1">
                                    <div>
                                      <div className="font-serif font-bold text-xs text-[#2D241A]">{l_item.learner_name}</div>
                                      <span className="text-[9px] text-[#7D7061] font-semibold">{getLanguageLabel(l_item.preferred_language)}</span>
                                    </div>
                                    <span className={`text-[8px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded ${
                                      l_item.completion_status === 'completed' 
                                        ? 'bg-sage-green/20 text-green-700' 
                                        : l_item.completion_status === 'in-progress'
                                          ? 'bg-soft-yellow/30 text-amber-800'
                                          : 'bg-cream text-[#7D7061]'
                                    }`}>
                                      {l_item.completion_status || l_item.status}
                                    </span>
                                  </div>

                                  <div className="space-y-1">
                                    <div className="flex justify-between text-[9px] font-bold text-[#7D7061]">
                                      <span>Progress</span>
                                      <span>{l_item.progress_percentage}%</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-cream rounded-full overflow-hidden border border-primary-gold/5">
                                      <div 
                                        className="h-full bg-deep-rose rounded-full" 
                                        style={{ width: `${l_item.progress_percentage}%` }} 
                                      />
                                    </div>
                                  </div>

                                  <div className="text-[9px] text-[#7D7061] font-semibold flex items-center justify-between">
                                    <span>Lessons Completed: {l_item.completed_lessons} / {l_item.total_lessons}</span>
                                    <span>Active: {formatDate(l_item.last_activity)}</span>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div className="text-xs text-[#7D7061] italic text-center p-4">No candidates from your centre have enrolled in this course yet.</div>
                            )}
                          </div>
                        </div>

                      </div>
                    )}
                  </div>

                </div>
              )}

            </div>
          )}
        </main>
      </div>
    </div>
  );
}
