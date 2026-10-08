import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  Building2, 
  Users, 
  Calendar, 
  GraduationCap, 
  CheckSquare, 
  PlusCircle, 
  Settings, 
  ArrowLeft,
  Menu,
  X,
  FileCheck,
  HeartHandshake,
  LogOut,
  AlertTriangle,
  LayoutDashboard,
  BarChart3,
  TrendingUp
} from 'lucide-react';
import { useAuth } from '../services/authContext';
import { api } from '../services/api';

export default function CentreDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Profile status tracking
  const [profile, setProfile] = useState<any>(null);
  const [profileLoaded, setProfileLoaded] = useState(false);

  // Dashboard statistics data
  const [dashboardData, setDashboardData] = useState<any>({
    overview: { learners_count: 0, courses_count: 0, completions_count: 0 },
    recent_activity: []
  });

  useEffect(() => {
    async function loadDashboard() {
      try {
        const response = await api.get('/api/centres/dashboard');
        if (response.data && response.data.success) {
          setDashboardData(response.data);
        }
      } catch (err) {
        console.log('Failed to load dashboard statistics.');
      }
    }

    async function loadProfile() {
      try {
        const response = await api.get('/api/centres/me');
        if (response.data && response.data.success && response.data.profile) {
          setProfile(response.data.profile);
        }
      } catch (err) {
        console.log('No profile exists yet or failed to load profile state.');
      } finally {
        setProfileLoaded(true);
      }
    }

    loadProfile();
    loadDashboard();
  }, []);

  const userInitials = user?.name
    ? user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().substring(0, 2)
    : 'KC';

  const isCurrentPath = (path: string) => location.pathname === path;

  return (
    <div className="flex h-screen bg-cream overflow-hidden text-[#3D2D1E]" id="centre-dashboard">
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
            <h1 className="font-serif text-lg font-bold text-[#2D241A] uppercase tracking-wider">Coaching Centre Management</h1>
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

        {/* Panels */}
        <main className="p-6 space-y-6">

          {/* Profile Warning banner */}
          {profileLoaded && !profile && (
            <div className="p-5 rounded-2xl border border-primary-gold/30 bg-soft-yellow/30 text-[#4A3E31] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-sm animate-fadeIn">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-deep-gold font-bold">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="text-xs uppercase tracking-wider">Profile Setup Required</span>
                </div>
                <p className="text-[11px] font-semibold leading-relaxed">
                  Your official Coaching Centre profile is empty. You must complete your profile registration details to submit your training centre for admin verification.
                </p>
              </div>
              <Link 
                to="/centre/profile"
                className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-deep-gold to-[#C8870A] text-white text-xs font-bold uppercase tracking-widest px-5 py-2.5 shadow-sm active:scale-95 transition shrink-0"
              >
                Complete Profile Now →
              </Link>
            </div>
          )}
          
          {/* Welcome section */}
          <section className="rounded-2xl bg-white border border-primary-gold/15 p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-sm">
            <div className="space-y-2">
              {profile ? (
                profile.verification_status === 'verified' ? (
                  <span className="inline-block px-3.5 py-1 rounded-full bg-sage-green text-green-800 text-[9px] font-extrabold uppercase tracking-wider border border-green-200/50">VERIFIED PROVIDER</span>
                ) : profile.verification_status === 'rejected' ? (
                  <span className="inline-block px-3.5 py-1 rounded-full bg-soft-rose text-deep-rose text-[9px] font-extrabold uppercase tracking-wider border border-deep-rose/20">VERIFICATION REJECTED</span>
                ) : (
                  <span className="inline-block px-3.5 py-1 rounded-full bg-soft-yellow text-amber-800 text-[9px] font-extrabold uppercase tracking-wider border border-primary-gold/15">PENDING VERIFICATION</span>
                )
              ) : (
                <span className="inline-block px-3.5 py-1 rounded-full bg-soft-rose text-deep-rose text-[9px] font-extrabold uppercase tracking-wider border border-deep-rose/20">INCOMPLETE PROFILE</span>
              )}
              
              <h2 className="font-serif text-2xl font-extrabold text-[#2D241A]">{profile?.centre_name || user?.name || 'Kiran Mahila Kendra'} Portal</h2>
              <p className="text-xs text-[#7D7061] font-semibold">Review and manage active modules, verify candidates, and track center status.</p>
            </div>

            <div className="flex items-center gap-4 w-full md:w-auto">
              <Link 
                to="/centre/profile"
                className="inline-flex items-center justify-center w-full md:w-auto rounded-full bg-gradient-to-r from-deep-gold to-[#C8870A] hover:from-[#C8870A] hover:to-deep-gold text-xs font-bold uppercase tracking-widest text-white px-6 py-3.5 shadow-sm hover:shadow-md hover:scale-[1.01] active:scale-95 transition-all cursor-pointer text-center"
              >
                View Centre Profile
              </Link>
            </div>
          </section>

          {/* Centre Overview Stats */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="p-5 bg-white rounded-2xl border border-primary-gold/10 shadow-sm text-center">
              <span className="text-[10px] uppercase font-bold text-[#7D7061] tracking-widest block">Learners</span>
              <span className="text-3xl font-extrabold text-[#2D241A] mt-2 block">{dashboardData.overview?.learners_count ?? 0}</span>
            </div>
            <div className="p-5 bg-white rounded-2xl border border-primary-gold/10 shadow-sm text-center">
              <span className="text-[10px] uppercase font-bold text-[#7D7061] tracking-widest block">Courses</span>
              <span className="text-3xl font-extrabold text-[#2D241A] mt-2 block">{dashboardData.overview?.courses_count ?? 0}</span>
            </div>
            <div className="p-5 bg-white rounded-2xl border border-primary-gold/10 shadow-sm text-center">
              <span className="text-[10px] uppercase font-bold text-[#7D7061] tracking-widest block">Completions</span>
              <span className="text-3xl font-extrabold text-[#2D241A] mt-2 block">{dashboardData.overview?.completions_count ?? 0}</span>
            </div>
          </div>

          {/* Main sections */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Active Batches or learning statistics empty state */}
            <div className="rounded-2xl border border-primary-gold/15 bg-white p-6 shadow-sm flex flex-col md:col-span-2 justify-center items-center text-center min-h-[250px]">
              <Building2 className="h-12 w-12 text-primary-gold/40 mb-4 animate-pulse" />
              <h3 className="font-serif text-base font-bold text-[#2D241A] uppercase tracking-wider mb-2">Centre Overview Status</h3>
              <p className="text-xs text-[#7D7061] max-w-md leading-relaxed font-semibold">
                Centre learning statistics will appear here as learners and courses are connected to your centre.
              </p>
            </div>

            {/* Recent Activity */}
            <div className="rounded-2xl border border-primary-gold/15 bg-white p-6 shadow-sm flex flex-col justify-center items-center text-center min-h-[250px]">
              <span className="text-[10px] uppercase tracking-widest font-extrabold text-deep-gold mb-3 block">Recent Activity</span>
              <p className="text-xs text-[#7D7061]/75 font-semibold italic">
                No activity available yet.
              </p>
            </div>

          </div>

        </main>
      </div>
    </div>
  );
}
