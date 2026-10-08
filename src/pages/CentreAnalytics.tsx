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
  TrendingUp,
  BarChart3,
  BookOpen,
  Award,
  ChevronRight,
  Sparkles,
  Activity,
  CheckCircle,
  RefreshCw,
  Clock,
  User,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../services/authContext';
import { api } from '../services/api';

export default function CentreAnalytics() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Loaded profiles, overviews and analytics data
  const [profile, setProfile] = useState<any>(null);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Tab selections or page filters
  const [filterCourse, setFilterCourse] = useState<string>('');
  const [filterLanguage, setFilterLanguage] = useState<string>('');

  const loadCentreAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);

      // 1. Fetch Profile
      let activeProfile = null;
      try {
        const profileRes = await api.get('/api/centres/me');
        if (profileRes.data?.success) {
          activeProfile = profileRes.data.profile;
          setProfile(activeProfile);
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

      // 2. Fetch Aggregated Analytics (Only if profile is successfully registered)
      if (activeProfile) {
        const analyticsRes = await api.get('/api/centres/analytics');
        if (analyticsRes.data?.success) {
          setAnalyticsData(analyticsRes.data.analytics);
        } else {
          setError('Failed to calculate analytics summaries.');
        }
      }

    } catch (err: any) {
      console.error('Error loading analytics context:', err);
      setError(err.response?.data?.detail || 'Failed to initialize the training centre analytics dashboard.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCentreAnalytics();
  }, []);

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

  // Helper for empty list states
  const hasNoData = !analyticsData || analyticsData.learners?.total === 0;

  // Filtered lists
  const coursesList = analyticsData?.course_analytics || [];
  const learnersList = analyticsData?.learner_analytics || [];

  const filteredCourses = coursesList.filter((c: any) => {
    return !filterCourse || c.id === filterCourse;
  });

  const filteredLearners = learnersList.filter((l: any) => {
    const matchesLang = !filterLanguage || l.preferred_language === filterLanguage;
    return matchesLang;
  });

  return (
    <div className="flex h-screen bg-cream overflow-hidden text-[#3D2D1E]" id="centre-analytics-dashboard">
      
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
              <TrendingUp className="h-5 w-5 text-deep-gold" />
              <span>Analytics Summaries</span>
            </h1>
          </div>

          <div className="flex items-center space-x-2.5">
            <button 
              onClick={loadCentreAnalytics} 
              className="p-2 text-[#7D7061] hover:text-[#2D241A] hover:bg-cream rounded-xl transition"
              title="Refresh Analytics Data"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
            <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-deep-gold to-primary-gold flex items-center justify-center font-bold text-white border border-primary-gold/30 text-sm shadow-sm">
              {userInitials}
            </div>
            <div className="hidden sm:block text-left">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-[#2D241A]">{profile?.centre_name || user?.name || 'Kiran Mahila Kendra'}</span>
              <span className="block text-[9px] uppercase font-bold tracking-widest text-deep-rose">Center Insights</span>
            </div>
          </div>
        </header>

        {/* Content Panel */}
        <main className="p-6 h-full flex flex-col gap-6">
          
          {loading ? (
            <div className="flex-grow flex flex-col items-center justify-center p-12 bg-white rounded-2xl border border-primary-gold/15 shadow-sm min-h-[400px]">
              <RefreshCw className="h-10 w-10 text-deep-gold animate-spin mb-4" />
              <p className="text-xs text-[#7D7061] font-semibold uppercase tracking-widest">Aggregating real-time center analytics...</p>
            </div>
          ) : error ? (
            <div className="flex-grow flex items-center justify-center p-8 bg-white border border-primary-gold/15 rounded-2xl shadow-sm min-h-[400px]">
              <div className="max-w-md text-center space-y-4">
                <AlertCircle className="h-12 w-12 mx-auto text-deep-rose" />
                <h3 className="font-serif text-lg font-bold text-[#2D241A] uppercase tracking-wider">Analytics Query Failed</h3>
                <p className="text-xs text-[#7D7061] leading-relaxed font-semibold">
                  {error}
                </p>
                <button 
                  onClick={loadCentreAnalytics}
                  className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-deep-rose to-primary-pink text-white text-xs font-bold uppercase tracking-widest px-6 py-3 shadow-md hover:shadow-lg transition cursor-pointer"
                >
                  Retry Aggregation Process
                </button>
              </div>
            </div>
          ) : profileLoaded && !profile ? (
            <div className="flex-grow flex items-center justify-center p-8 bg-white border border-primary-gold/15 rounded-2xl shadow-sm min-h-[400px]">
              <div className="max-w-md text-center space-y-4">
                <AlertTriangle className="h-12 w-12 mx-auto text-deep-gold" />
                <h3 className="font-serif text-lg font-bold text-[#2D241A] uppercase tracking-wider">Profile Setup Required</h3>
                <p className="text-xs text-[#7D7061] leading-relaxed font-semibold">
                  You must complete your Coaching Centre profile details before you can access aggregated analytics summaries or monitor candidate metrics.
                </p>
                <Link 
                  to="/centre/profile"
                  className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-deep-gold to-[#C8870A] hover:from-[#C8870A] hover:to-deep-gold text-white text-xs font-bold uppercase tracking-widest px-5 py-3 shadow-md hover:shadow-lg transition cursor-pointer"
                >
                  Complete Profile Setup Now →
                </Link>
              </div>
            </div>
          ) : hasNoData ? (
            <div className="flex-grow flex items-center justify-center p-8 bg-white border border-primary-gold/15 rounded-2xl shadow-sm min-h-[400px]">
              <div className="max-w-md text-center space-y-4">
                <TrendingUp className="h-12 w-12 mx-auto text-primary-gold/40" />
                <h3 className="font-serif text-lg font-bold text-[#2D241A] uppercase tracking-wider">No Activity Logged</h3>
                <p className="text-xs text-[#7D7061] leading-relaxed font-semibold">
                  Your center currently has no registered learners or active course publishing records. Once learners register with your center and enroll in courses, comprehensive analytical charts will appear here.
                </p>
                <Link 
                  to="/centre/learners"
                  className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-deep-gold to-[#C8870A] hover:from-[#C8870A] hover:to-deep-gold text-white text-xs font-bold uppercase tracking-widest px-5 py-3 shadow-sm transition"
                >
                  Register Candidates
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-6 flex-grow flex flex-col overflow-y-auto pr-1">
              
              {/* Aggregated Statistical Scoreboard Group */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Candidates Card */}
                <div className="p-5 bg-white rounded-2xl border border-primary-gold/15 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-primary-gold/10 pb-2">
                    <span className="text-[10px] uppercase font-bold text-[#7D7061] tracking-widest">Learner Segments</span>
                    <Users className="h-4.5 w-4.5 text-deep-gold" />
                  </div>
                  <div className="flex items-baseline space-x-2">
                    <span className="text-3xl font-extrabold text-[#2D241A] font-mono tabular-nums">{analyticsData.learners?.total}</span>
                    <span className="text-[10px] text-[#7D7061] font-bold uppercase">Total Legitimate Candidates</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 pt-2 text-center text-xs">
                    <div className="p-2 bg-cream/40 rounded-lg">
                      <span className="block font-bold text-[#2D241A] font-mono tabular-nums">{analyticsData.learners?.active}</span>
                      <span className="text-[8px] uppercase font-extrabold text-green-700">Active</span>
                    </div>
                    <div className="p-2 bg-cream/40 rounded-lg">
                      <span className="block font-bold text-[#2D241A] font-mono tabular-nums">{analyticsData.learners?.completed}</span>
                      <span className="text-[8px] uppercase font-extrabold text-deep-rose">Graduated</span>
                    </div>
                    <div className="p-2 bg-cream/40 rounded-lg">
                      <span className="block font-bold text-[#2D241A] font-mono tabular-nums">{analyticsData.learners?.no_progress}</span>
                      <span className="text-[8px] uppercase font-extrabold text-[#7D7061]">Idle</span>
                    </div>
                  </div>
                </div>

                {/* Courses Card */}
                <div className="p-5 bg-white rounded-2xl border border-primary-gold/15 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-primary-gold/10 pb-2">
                    <span className="text-[10px] uppercase font-bold text-[#7D7061] tracking-widest">Course Catalog</span>
                    <GraduationCap className="h-4.5 w-4.5 text-deep-gold" />
                  </div>
                  <div className="flex items-baseline space-x-2">
                    <span className="text-3xl font-extrabold text-[#2D241A] font-mono tabular-nums">{analyticsData.courses?.total}</span>
                    <span className="text-[10px] text-[#7D7061] font-bold uppercase">Center-Owned Courses</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 pt-2 text-center text-xs">
                    <div className="p-2 bg-cream/40 rounded-lg">
                      <span className="block font-bold text-[#2D241A] font-mono tabular-nums">{analyticsData.courses?.active}</span>
                      <span className="text-[8px] uppercase font-extrabold text-green-700">Published</span>
                    </div>
                    <div className="p-2 bg-cream/40 rounded-lg">
                      <span className="block font-bold text-[#2D241A] font-mono tabular-nums">{analyticsData.courses?.with_enrollments}</span>
                      <span className="text-[8px] uppercase font-extrabold text-deep-gold">Subscribed</span>
                    </div>
                    <div className="p-2 bg-cream/40 rounded-lg">
                      <span className="block font-bold text-[#2D241A] font-mono tabular-nums">{analyticsData.courses?.completed_enrollments}</span>
                      <span className="text-[8px] uppercase font-extrabold text-[#7D7061]">Completions</span>
                    </div>
                  </div>
                </div>

                {/* Overall Efficiency Card */}
                <div className="p-5 bg-white rounded-2xl border border-primary-gold/15 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-primary-gold/10 pb-2">
                    <span className="text-[10px] uppercase font-bold text-[#7D7061] tracking-widest">Consolidated Learning</span>
                    <TrendingUp className="h-4.5 w-4.5 text-green-600" />
                  </div>
                  <div className="flex items-baseline space-x-2">
                    <span className="text-3xl font-extrabold text-[#2D241A] font-mono tabular-nums">{analyticsData.learning?.overall_completion_rate}%</span>
                    <span className="text-[10px] text-[#7D7061] font-bold uppercase">Overall Completion Rate</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-2 text-center text-xs">
                    <div className="p-2 bg-cream/40 rounded-lg">
                      <span className="block font-bold text-[#2D241A] font-mono tabular-nums">{analyticsData.learning?.average_progress}%</span>
                      <span className="text-[8px] uppercase font-extrabold text-[#7D7061]">Avg Progress</span>
                    </div>
                    <div className="p-2 bg-cream/40 rounded-lg">
                      <span className="block font-bold text-[#2D241A] font-mono tabular-nums">{analyticsData.learning?.total_enrollments}</span>
                      <span className="text-[8px] uppercase font-extrabold text-deep-rose">Enrollments</span>
                    </div>
                  </div>
                </div>

              </div>

              {/* Progress Distribution & Trend Visualizations Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* SVG Progress Distribution Histogram */}
                <div className="p-5 bg-white rounded-2xl border border-primary-gold/15 shadow-sm space-y-4 flex flex-col justify-between">
                  <div>
                    <h3 className="text-xs uppercase font-extrabold tracking-widest text-[#2D241A] mb-1">Progress Distribution</h3>
                    <p className="text-[11px] text-[#7D7061] font-semibold">Distribution of active candidates across course progress brackets.</p>
                  </div>
                  
                  <div className="py-2 flex items-end justify-between h-44 gap-4 px-4 border-b border-primary-gold/10">
                    {[
                      { range: '0–25%', count: analyticsData.progress_distribution?.['0-25'] || 0, color: '#C8870A' },
                      { range: '26–50%', count: analyticsData.progress_distribution?.['26-50'] || 0, color: '#F39C12' },
                      { range: '51–75%', count: analyticsData.progress_distribution?.['51-75'] || 0, color: '#3498DB' },
                      { range: '76–99%', count: analyticsData.progress_distribution?.['76-99'] || 0, color: '#2ECC71' },
                      { range: '100%', count: analyticsData.progress_distribution?.['100'] || 0, color: '#27AE60' }
                    ].map((bracket, idx) => {
                      const maxVal = Math.max(
                        analyticsData.progress_distribution?.['0-25'] || 1,
                        analyticsData.progress_distribution?.['26-50'] || 1,
                        analyticsData.progress_distribution?.['51-75'] || 1,
                        analyticsData.progress_distribution?.['76-99'] || 1,
                        analyticsData.progress_distribution?.['100'] || 1
                      );
                      const heightPercent = maxVal > 0 ? (bracket.count / maxVal) * 80 + 5 : 5;
                      return (
                        <div key={idx} className="flex-1 flex flex-col items-center group relative">
                          <span className="text-[10px] font-bold text-[#2D241A] mb-1 transition-opacity opacity-75 group-hover:opacity-100 font-mono tabular-nums">{bracket.count}</span>
                          <div 
                            className="w-full rounded-t-lg transition-all duration-300 hover:brightness-95 shadow-sm"
                            style={{ height: `${heightPercent}%`, backgroundColor: bracket.color }}
                          />
                          <span className="text-[8px] uppercase tracking-wider font-bold text-[#7D7061] mt-2 whitespace-nowrap">{bracket.range}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* SVG Activity Trend Line Combo Chart */}
                <div className="p-5 bg-white rounded-2xl border border-primary-gold/15 shadow-sm space-y-4 flex flex-col justify-between">
                  <div>
                    <h3 className="text-xs uppercase font-extrabold tracking-widest text-[#2D241A] mb-1">Coaching Hub Trends</h3>
                    <p className="text-[11px] text-[#7D7061] font-semibold">Historical monthly trajectory of learner registrations & completions.</p>
                  </div>
                  
                  {analyticsData.activity_trends?.length === 0 ? (
                    <div className="h-44 flex flex-col items-center justify-center text-center text-xs text-[#7D7061]/50 border border-dashed border-primary-gold/10 rounded-xl">
                      <Clock className="h-6 w-6 mb-2 text-[#7D7061]/35 animate-pulse" />
                      <span>Historical trend metrics loading...</span>
                    </div>
                  ) : (
                    <div className="py-2 flex items-end justify-between h-44 gap-3 px-4 border-b border-primary-gold/10 overflow-x-auto">
                      {analyticsData.activity_trends?.map((trend: any, idx: number) => {
                        const maxEnroll = Math.max(...analyticsData.activity_trends.map((t: any) => t.enrollments_count || 1));
                        const maxComp = Math.max(...analyticsData.activity_trends.map((t: any) => t.completions_count || 1));
                        const maxAll = Math.max(maxEnroll, maxComp, 1);
                        
                        const enrollHeight = (trend.enrollments_count / maxAll) * 75 + 5;
                        const compHeight = (trend.completions_count / maxAll) * 75 + 5;

                        // Nice month label formatting (e.g. "2026-09" -> "Sep 26")
                        const monthLabel = () => {
                          if (!trend.month) return 'Unknown';
                          const [year, month] = trend.month.split('-');
                          const dateObj = new Date(parseInt(year), parseInt(month) - 1, 1);
                          return dateObj.toLocaleDateString('en-IN', { month: 'short' }) + ' ' + year.substring(2);
                        };

                        return (
                          <div key={idx} className="flex-1 flex flex-col items-center group relative min-w-[40px]">
                            <div className="flex gap-1.5 justify-center items-end h-full w-full">
                              <div className="flex flex-col items-center flex-1">
                                <span className="text-[8px] font-mono tabular-nums text-green-700 font-bold opacity-0 group-hover:opacity-100 transition-opacity absolute -top-4">{trend.enrollments_count}</span>
                                <div className="w-2.5 bg-green-600/70 hover:bg-green-600 rounded-t-sm transition-all shadow-sm" style={{ height: `${enrollHeight}px` }} />
                              </div>
                              <div className="flex flex-col items-center flex-1">
                                <span className="text-[8px] font-mono tabular-nums text-deep-rose font-bold opacity-0 group-hover:opacity-100 transition-opacity absolute -top-4">{trend.completions_count}</span>
                                <div className="w-2.5 bg-deep-rose/70 hover:bg-deep-rose rounded-t-sm transition-all shadow-sm" style={{ height: `${compHeight}px` }} />
                              </div>
                            </div>
                            <span className="text-[8px] font-bold text-[#7D7061] mt-2 whitespace-nowrap">{monthLabel()}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <div className="flex items-center justify-center space-x-6 text-[10px] font-extrabold uppercase tracking-wider text-[#7D7061] pt-2 border-t border-primary-gold/5">
                    <div className="flex items-center space-x-2">
                      <div className="h-2 w-4 bg-green-600/70 rounded-sm" />
                      <span>Candidate Subscriptions</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="h-2 w-4 bg-deep-rose/70 rounded-sm" />
                      <span>Curriculum Completions</span>
                    </div>
                  </div>
                </div>

              </div>

              {/* Course-level Performance Analytics Summary Table */}
              <div className="p-5 bg-white rounded-2xl border border-primary-gold/15 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-primary-gold/10 pb-3">
                  <div>
                    <h3 className="text-xs uppercase font-extrabold tracking-widest text-[#2D241A] mb-1">Course-Wise Dynamic Metrics</h3>
                    <p className="text-[11px] text-[#7D7061] font-semibold">Dynamic metrics calculated across published centre-specific catalogs.</p>
                  </div>
                  <div>
                    <select 
                      value={filterCourse}
                      onChange={(e) => setFilterCourse(e.target.value)}
                      className="px-3 py-1.5 rounded-lg border border-primary-gold/20 text-[10px] font-bold bg-white text-[#7D7061]"
                    >
                      <option value="">All Center Courses</option>
                      {coursesList.map((c: any) => (
                        <option key={c.id} value={c.id}>{c.title}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-primary-gold/10 text-[9px] uppercase tracking-wider font-extrabold text-[#7D7061] bg-cream/35">
                        <th className="py-2.5 px-3">Course Title</th>
                        <th className="py-2.5 px-3 text-center">Candidates Enrolled</th>
                        <th className="py-2.5 px-3 text-center">Avg Progress</th>
                        <th className="py-2.5 px-3 text-center">Graduates (100%)</th>
                        <th className="py-2.5 px-3 text-center">In Progress</th>
                        <th className="py-2.5 px-3 text-center">Not Started</th>
                        <th className="py-2.5 px-3 text-center">Completion Rate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredCourses.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-8 text-center text-[#7D7061]/50 font-semibold italic">
                            No course matched the selected filter.
                          </td>
                        </tr>
                      ) : (
                        filteredCourses.map((c: any, idx: number) => (
                          <tr key={idx} className="border-b border-primary-gold/5 hover:bg-cream/15 transition-colors">
                            <td className="py-3 px-3 font-serif font-bold text-[#2D241A]">{c.title}</td>
                            <td className="py-3 px-3 text-center font-mono font-bold tabular-nums">{c.total_learners}</td>
                            <td className="py-3 px-3 text-center">
                              <span className="font-mono font-semibold tabular-nums text-green-700">{c.average_progress}%</span>
                              <div className="w-16 bg-cream border border-primary-gold/10 h-1.5 rounded-full overflow-hidden mx-auto mt-1">
                                <div className="h-full bg-green-600" style={{ width: `${c.average_progress}%` }} />
                              </div>
                            </td>
                            <td className="py-3 px-3 text-center font-mono tabular-nums text-green-600 font-bold">{c.completed_learners}</td>
                            <td className="py-3 px-3 text-center font-mono tabular-nums text-amber-600 font-semibold">{c.in_progress_learners}</td>
                            <td className="py-3 px-3 text-center font-mono tabular-nums text-[#7D7061]">{c.not_started_learners}</td>
                            <td className="py-3 px-3 text-center font-mono font-extrabold tabular-nums text-deep-rose">{c.completion_rate}%</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Learner-level Performance Analytics Summary Table */}
              <div className="p-5 bg-white rounded-2xl border border-primary-gold/15 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-primary-gold/10 pb-3">
                  <div>
                    <h3 className="text-xs uppercase font-extrabold tracking-widest text-[#2D241A] mb-1">Candidate Progression Portfolio</h3>
                    <p className="text-[11px] text-[#7D7061] font-semibold">Secure individual tracking portfolios of associated learners and status metrics.</p>
                  </div>
                  <div>
                    <select 
                      value={filterLanguage}
                      onChange={(e) => setFilterLanguage(e.target.value)}
                      className="px-3 py-1.5 rounded-lg border border-primary-gold/20 text-[10px] font-bold bg-white text-[#7D7061]"
                    >
                      <option value="">All Languages</option>
                      <option value="en">English</option>
                      <option value="kn">Kannada</option>
                      <option value="hi">Hindi</option>
                    </select>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-primary-gold/10 text-[9px] uppercase tracking-wider font-extrabold text-[#7D7061] bg-cream/35">
                        <th className="py-2.5 px-3">Candidate Name</th>
                        <th className="py-2.5 px-3">Secure Email</th>
                        <th className="py-2.5 px-3 text-center">Pref Language</th>
                        <th className="py-2.5 px-3 text-center">Enrolled Courses</th>
                        <th className="py-2.5 px-3 text-center">Completed Courses</th>
                        <th className="py-2.5 px-3 text-center">Avg Progress Percentage</th>
                        <th className="py-2.5 px-3 text-center">Tracking Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredLearners.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-8 text-center text-[#7D7061]/50 font-semibold italic">
                            No candidate matched the language filters.
                          </td>
                        </tr>
                      ) : (
                        filteredLearners.map((l: any, idx: number) => (
                          <tr key={idx} className="border-b border-primary-gold/5 hover:bg-cream/15 transition-colors">
                            <td className="py-3 px-3 font-semibold text-[#2D241A] flex items-center gap-2">
                              <div className="h-6 w-6 bg-cream text-deep-gold font-bold text-[10px] rounded-full flex items-center justify-center border border-primary-gold/20 shadow-sm">
                                {l.name?.slice(0, 1)}
                              </div>
                              <span>{l.name}</span>
                            </td>
                            <td className="py-3 px-3 text-[#7D7061] font-mono select-all truncate max-w-[150px]">{l.email}</td>
                            <td className="py-3 px-3 text-center font-bold text-[10px] text-[#7D7061]">{getLanguageLabel(l.preferred_language)}</td>
                            <td className="py-3 px-3 text-center font-mono tabular-nums">{l.courses_enrolled_count}</td>
                            <td className="py-3 px-3 text-center font-mono tabular-nums">{l.courses_completed_count}</td>
                            <td className="py-3 px-3 text-center">
                              <span className="font-mono font-bold tabular-nums text-green-700">{l.average_progress}%</span>
                              <div className="w-16 bg-cream border border-primary-gold/10 h-1 rounded-full overflow-hidden mx-auto mt-1">
                                <div className="h-full bg-green-600" style={{ width: `${l.average_progress}%` }} />
                              </div>
                            </td>
                            <td className="py-3 px-3 text-center">
                              {l.learning_status === 'completed' ? (
                                <span className="inline-block px-2 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-200 text-[9px] font-extrabold uppercase">Graduated</span>
                              ) : l.learning_status === 'active' ? (
                                <span className="inline-block px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[9px] font-extrabold uppercase">Active</span>
                              ) : (
                                <span className="inline-block px-2 py-0.5 rounded-full bg-slate-50 text-[#7D7061] border border-slate-200 text-[9px] font-extrabold uppercase">Not Started</span>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

        </main>
      </div>
    </div>
  );
}
