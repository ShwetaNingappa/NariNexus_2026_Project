import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, 
  Building2, 
  BookOpen, 
  TrendingUp, 
  ShieldCheck, 
  ArrowLeft,
  Menu,
  X,
  RefreshCw,
  HeartHandshake,
  LogOut,
  AlertCircle,
  GraduationCap,
  Sparkles,
  Layers,
  Briefcase,
  Search,
  Plus,
  Edit2,
  Trash2,
  CheckCircle,
  Clock,
  ExternalLink,
  ChevronRight,
  UserCheck,
  Award
} from 'lucide-react';
import { useAuth } from '../services/authContext';
import { api } from '../services/api';

interface OverviewData {
  total_users: number;
  total_learners: number;
  total_training_centres: number;
  total_courses: number;
  total_skills: number;
  total_opportunities: number;
}

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  is_active?: boolean;
  preferred_language?: string;
  created_at?: string;
}

interface Skill {
  id: string;
  category_id: string;
  name: string;
  description: string;
  difficulty: string;
  estimated_duration: string;
  prerequisites?: string[];
  career_options?: string[];
  is_active: boolean;
}

interface Course {
  id: string;
  title: string;
  description: string;
  skill_id: string;
  category_id: string;
  thumbnail: string;
  difficulty: string;
  duration: string;
  learning_mode: string;
  instructor: string;
  is_active: boolean;
}

interface Opportunity {
  id: string;
  title: string;
  organization: string;
  description: string;
  opportunity_type: string;
  location: string;
  required_skills: string[];
  eligibility: string;
  deadline: string;
  compensation?: string;
  is_active: boolean;
}

interface TrackingApplication {
  id: string;
  opportunity_id: string;
  opportunity_title: string;
  learner_id: string;
  learner_name: string;
  status: string;
  applied_at: string;
}

export default function AdminDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'skills' | 'courses' | 'opportunities' | 'applications' | 'analytics'>('overview');

  // Overview metrics state
  const [metrics, setMetrics] = useState<OverviewData | null>(null);
  const [loadingOverview, setLoadingOverview] = useState(true);
  const [errorOverview, setErrorOverview] = useState<string | null>(null);

  // Platform Analytics & AI Insights state
  const [analyticsMetrics, setAnalyticsMetrics] = useState<any | null>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [errorAnalytics, setErrorAnalytics] = useState<string | null>(null);
  const [aiInsights, setAiInsights] = useState<string | null>(null);
  const [loadingAI, setLoadingAI] = useState(false);
  const [aiLang, setAiLang] = useState<string>('en');

  // Users management state
  const [usersList, setUsersList] = useState<UserProfile[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [usersSearch, setUsersSearch] = useState('');
  const [usersRoleFilter, setUsersRoleFilter] = useState('');
  const [usersStatusFilter, setUsersStatusFilter] = useState('');
  const [userActionMessage, setUserActionMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Skills state
  const [skillsList, setSkillsList] = useState<Skill[]>([]);
  const [loadingSkills, setLoadingSkills] = useState(false);
  const [showSkillModal, setShowSkillModal] = useState(false);
  const [editingSkill, setEditingSkill] = useState<Skill | null>(null);
  const [skillForm, setSkillForm] = useState({
    name: '',
    description: '',
    category_id: 'digital-skills',
    difficulty: 'Beginner',
    estimated_duration: '',
    prerequisites: '',
    career_options: ''
  });

  // Courses state
  const [coursesList, setCoursesList] = useState<Course[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [courseForm, setCourseForm] = useState({
    title: '',
    description: '',
    skill_id: '',
    category_id: 'digital-skills',
    thumbnail: 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=600&q=80',
    difficulty: 'beginner',
    duration: '',
    learning_mode: 'online',
    instructor: ''
  });

  // Opportunities state
  const [oppsList, setOppsList] = useState<Opportunity[]>([]);
  const [loadingOpps, setLoadingOpps] = useState(false);
  const [showOppModal, setShowOppModal] = useState(false);
  const [editingOpp, setEditingOpp] = useState<Opportunity | null>(null);
  const [oppForm, setOppForm] = useState({
    title: '',
    organization: '',
    description: '',
    opportunity_type: 'livelihood',
    location: '',
    required_skills: '',
    eligibility: '',
    deadline: '',
    compensation: 'Stipend / Grant'
  });

  // Applications tracking state
  const [appsList, setAppsList] = useState<TrackingApplication[]>([]);
  const [loadingApps, setLoadingApps] = useState(false);
  const [appStatusFilter, setAppStatusFilter] = useState('');
  const [appOppFilter, setAppOppFilter] = useState('');

  // General Notification Banner
  const [notification, setNotification] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const triggerNotification = (text: string, type: 'success' | 'error' = 'success') => {
    setNotification({ text, type });
    setTimeout(() => setNotification(null), 4500);
  };

  // --- Fetch Methods ---

  const fetchOverviewMetrics = async () => {
    try {
      setLoadingOverview(true);
      setErrorOverview(null);
      const res = await api.get('/api/admin/overview');
      if (res.data?.success) {
        setMetrics(res.data.data);
      } else {
        setErrorOverview('Failed to fetch platform metrics.');
      }
    } catch (err: any) {
      console.error('Error loading admin overview metrics:', err);
      setErrorOverview(
        err.response?.data?.detail || 
        'Authorization failed or connection refused while fetching admin metrics.'
      );
    } finally {
      setLoadingOverview(false);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);
      let query = `?search=${encodeURIComponent(usersSearch)}`;
      if (usersRoleFilter) query += `&role=${usersRoleFilter}`;
      if (usersStatusFilter !== '') query += `&active=${usersStatusFilter === 'active'}`;
      
      const res = await api.get(`/api/admin/users${query}`);
      if (res.data?.success) {
        setUsersList(res.data.users);
      }
    } catch (err: any) {
      console.error('Failed to load users:', err);
      triggerNotification(err.response?.data?.detail || 'Failed to fetch users list.', 'error');
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchSkills = async () => {
    try {
      setLoadingSkills(true);
      const res = await api.get('/api/admin/skills');
      setSkillsList(res.data || []);
    } catch (err: any) {
      console.error('Failed to load skills:', err);
    } finally {
      setLoadingSkills(false);
    }
  };

  const fetchCourses = async () => {
    try {
      setLoadingCourses(true);
      const res = await api.get('/api/admin/courses');
      setCoursesList(res.data || []);
    } catch (err: any) {
      console.error('Failed to load courses:', err);
    } finally {
      setLoadingCourses(false);
    }
  };

  const fetchOpportunities = async () => {
    try {
      setLoadingOpps(true);
      const res = await api.get('/api/admin/opportunities');
      setOppsList(res.data || []);
    } catch (err: any) {
      console.error('Failed to load opportunities:', err);
    } finally {
      setLoadingOpps(false);
    }
  };

  const fetchApplications = async () => {
    try {
      setLoadingApps(true);
      let query = '';
      if (appStatusFilter || appOppFilter) {
        const params = new URLSearchParams();
        if (appStatusFilter) params.append('status', appStatusFilter);
        if (appOppFilter) params.append('opportunity_id', appOppFilter);
        query = `?${params.toString()}`;
      }
      const res = await api.get(`/api/admin/applications${query}`);
      setAppsList(res.data || []);
    } catch (err: any) {
      console.error('Failed to load applications:', err);
    } finally {
      setLoadingApps(false);
    }
  };

  const fetchPlatformAnalytics = async () => {
    try {
      setLoadingAnalytics(true);
      setErrorAnalytics(null);
      const res = await api.get('/api/admin/analytics');
      if (res.data?.success) {
        setAnalyticsMetrics(res.data.metrics);
      } else {
        setErrorAnalytics('Could not retrieve platfrom analytics.');
      }
    } catch (err: any) {
      console.error('Failed to load platform metrics:', err);
      setErrorAnalytics(err.response?.data?.detail || 'Unauthorized or connection error.');
    } finally {
      setLoadingAnalytics(false);
    }
  };

  const fetchAIInsights = async (lang: string = 'en') => {
    try {
      setLoadingAI(true);
      setAiInsights(null);
      const res = await api.get(`/api/admin/analytics/ai-insights?lang=${lang}`);
      if (res.data?.success) {
        setAiInsights(res.data.insights);
      }
    } catch (err: any) {
      console.error('Failed to load AI Insights:', err);
      setAiInsights('Could not load AI Insights at this moment. Safely displaying local fallback context.');
    } finally {
      setLoadingAI(false);
    }
  };

  // Hook tab loading changes
  useEffect(() => {
    fetchOverviewMetrics();
    if (activeTab === 'users') fetchUsers();
    if (activeTab === 'skills') fetchSkills();
    if (activeTab === 'courses') {
      fetchCourses();
      fetchSkills();
    }
    if (activeTab === 'opportunities') fetchOpportunities();
    if (activeTab === 'applications') {
      fetchApplications();
      fetchOpportunities();
    }
    if (activeTab === 'analytics') {
      fetchPlatformAnalytics();
      fetchAIInsights(aiLang);
    }
  }, [activeTab, aiLang]);

  useEffect(() => {
    if (activeTab === 'users') {
      const delayDebounce = setTimeout(() => {
        fetchUsers();
      }, 300);
      return () => clearTimeout(delayDebounce);
    }
  }, [usersSearch, usersRoleFilter, usersStatusFilter]);

  // --- Mutate Methods ---

  const toggleUserStatus = async (targetUser: UserProfile) => {
    const nextStatus = !(targetUser.is_active !== false);
    const actionLabel = nextStatus ? 'activate' : 'deactivate';
    
    if (!window.confirm(`Are you absolutely sure you want to ${actionLabel} the account of ${targetUser.name}?`)) {
      return;
    }

    try {
      const res = await api.put(`/api/admin/users/${targetUser.id}/status`, { is_active: nextStatus });
      if (res.data?.success) {
        triggerNotification(`User ${targetUser.name} has been successfully ${nextStatus ? 'activated' : 'deactivated'}.`);
        fetchUsers();
        fetchOverviewMetrics();
      }
    } catch (err: any) {
      console.error(err);
      triggerNotification(err.response?.data?.detail || `Failed to change user active status.`, 'error');
    }
  };

  const changeUserRole = async (targetUser: UserProfile, newRole: string) => {
    if (!window.confirm(`Are you absolutely sure you want to change ${targetUser.name}'s system role to ${newRole.toUpperCase()}?`)) {
      return;
    }

    try {
      const res = await api.put(`/api/admin/users/${targetUser.id}/role`, { role: newRole });
      if (res.data?.success) {
        triggerNotification(`Successfully upgraded ${targetUser.name} to ${newRole.toUpperCase()}.`);
        fetchUsers();
        fetchOverviewMetrics();
      }
    } catch (err: any) {
      console.error(err);
      triggerNotification(err.response?.data?.detail || `Failed to modify user role.`, 'error');
    }
  };

  // Skill Admin Mutations
  const handleSaveSkill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!skillForm.name || !skillForm.description || !skillForm.estimated_duration) {
      alert('Please fill out all required fields.');
      return;
    }

    const payload = {
      ...skillForm,
      prerequisites: skillForm.prerequisites.split(',').map(s => s.trim()).filter(Boolean),
      career_options: skillForm.career_options.split(',').map(s => s.trim()).filter(Boolean)
    };

    try {
      if (editingSkill) {
        await api.put(`/api/admin/skills/${editingSkill.id}`, payload);
        triggerNotification('Skill updated successfully.');
      } else {
        await api.post('/api/admin/skills', payload);
        triggerNotification('Created new global skill catalog item.');
      }
      setShowSkillModal(false);
      setEditingSkill(null);
      fetchSkills();
      fetchOverviewMetrics();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to save skill.');
    }
  };

  const toggleSkillActive = async (target: Skill) => {
    try {
      await api.put(`/api/admin/skills/${target.id}`, { is_active: !target.is_active });
      triggerNotification(`Skill status updated.`);
      fetchSkills();
    } catch (err: any) {
      triggerNotification('Failed to toggle active status.', 'error');
    }
  };

  // Course Admin Mutations
  const handleSaveCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseForm.title || !courseForm.description || !courseForm.skill_id || !courseForm.duration || !courseForm.instructor) {
      alert('Please fill out all required fields.');
      return;
    }

    try {
      if (editingCourse) {
        await api.put(`/api/admin/courses/${editingCourse.id}`, courseForm);
        triggerNotification('Course item modified successfully.');
      } else {
        await api.post('/api/admin/courses', courseForm);
        triggerNotification('Successfully added new course to platform list.');
      }
      setShowCourseModal(false);
      setEditingCourse(null);
      fetchCourses();
      fetchOverviewMetrics();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to save course.');
    }
  };

  const toggleCourseActive = async (target: Course) => {
    try {
      await api.put(`/api/admin/courses/${target.id}`, { is_active: !target.is_active });
      triggerNotification(`Course status modified.`);
      fetchCourses();
    } catch (err: any) {
      triggerNotification('Failed to toggle course active status.', 'error');
    }
  };

  // Opportunity Admin Mutations
  const handleSaveOpp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!oppForm.title || !oppForm.organization || !oppForm.description || !oppForm.location || !oppForm.eligibility || !oppForm.deadline) {
      alert('Please fill out all required fields.');
      return;
    }

    const payload = {
      ...oppForm,
      required_skills: oppForm.required_skills.split(',').map(s => s.trim()).filter(Boolean)
    };

    try {
      if (editingOpp) {
        await api.put(`/api/admin/opportunities/${editingOpp.id}`, payload);
        triggerNotification('Opportunity updated successfully.');
      } else {
        await api.post('/api/admin/opportunities', payload);
        triggerNotification('Successfully posted new livelihood opportunity.');
      }
      setShowOppModal(false);
      setEditingOpp(null);
      fetchOpportunities();
      fetchOverviewMetrics();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to save opportunity.');
    }
  };

  const toggleOppActive = async (target: Opportunity) => {
    try {
      await api.put(`/api/admin/opportunities/${target.id}`, { is_active: !target.is_active });
      triggerNotification('Opportunity status updated.');
      fetchOpportunities();
    } catch (err: any) {
      triggerNotification('Failed to update opportunity status.', 'error');
    }
  };

  // Application Mutations
  const handleUpdateAppStatus = async (appId: string, status: string) => {
    try {
      await api.put(`/api/admin/applications/${appId}/status`, { status });
      triggerNotification(`Application status successfully updated to ${status}.`);
      fetchApplications();
    } catch (err: any) {
      triggerNotification(err.response?.data?.detail || 'Failed to modify tracking application status.', 'error');
    }
  };


  const userInitials = user?.name
    ? user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().substring(0, 2)
    : 'AD';

  return (
    <div className="flex h-screen bg-cream overflow-hidden text-[#3D2D1E]" id="admin-dashboard">
      
      {/* Toast notifications */}
      {notification && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center space-x-2 rounded-xl px-5 py-3.5 shadow-lg border text-xs font-bold uppercase tracking-wider transition-all transform duration-300 ${notification.type === 'success' ? 'bg-[#EAF5EC] text-[#2E7D32] border-[#2E7D32]/20' : 'bg-soft-rose text-deep-rose border-soft-rose/30'}`}>
          <CheckCircle className="h-4 w-4 shrink-0" />
          <span>{notification.text}</span>
        </div>
      )}

      {/* Sidebar Navigation */}
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

        <nav className="p-4 space-y-1" aria-label="Sidebar Navigation">
          <Link to="/" className="flex items-center space-x-3 rounded-xl px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-[#7D7061] hover:bg-cream hover:text-deep-rose transition border border-transparent">
            <ArrowLeft className="h-4 w-4" />
            <span>Platform Home</span>
          </Link>
          <div className="my-2 border-t border-primary-gold/10" />
          
          <span className="px-4 text-[9px] uppercase tracking-widest font-extrabold text-[#C8870A]">Admin Portal</span>
          
          <button 
            onClick={() => setActiveTab('overview')}
            className={`w-full flex items-center space-x-3 rounded-xl px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-left border transition ${activeTab === 'overview' ? 'bg-soft-yellow/80 text-[#4A3E31] border-primary-gold/20 shadow-sm font-extrabold' : 'text-[#7D7061] border-transparent hover:bg-cream hover:text-[#2D241A]'}`}
          >
            <TrendingUp className="h-4.5 w-4.5 text-deep-gold" />
            <span>Admin Overview</span>
          </button>

          <button 
            onClick={() => setActiveTab('users')}
            className={`w-full flex items-center space-x-3 rounded-xl px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-left border transition ${activeTab === 'users' ? 'bg-soft-yellow/80 text-[#4A3E31] border-primary-gold/20 shadow-sm font-extrabold' : 'text-[#7D7061] border-transparent hover:bg-cream hover:text-[#2D241A]'}`}
          >
            <Users className="h-4.5 w-4.5 text-deep-gold" />
            <span>Users &amp; Roles</span>
          </button>

          <button 
            onClick={() => setActiveTab('skills')}
            className={`w-full flex items-center space-x-3 rounded-xl px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-left border transition ${activeTab === 'skills' ? 'bg-soft-yellow/80 text-[#4A3E31] border-primary-gold/20 shadow-sm font-extrabold' : 'text-[#7D7061] border-transparent hover:bg-cream hover:text-[#2D241A]'}`}
          >
            <Layers className="h-4.5 w-4.5 text-[#6B8E6F]" />
            <span>Skills Catalog</span>
          </button>

          <button 
            onClick={() => setActiveTab('courses')}
            className={`w-full flex items-center space-x-3 rounded-xl px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-left border transition ${activeTab === 'courses' ? 'bg-soft-yellow/80 text-[#4A3E31] border-primary-gold/20 shadow-sm font-extrabold' : 'text-[#7D7061] border-transparent hover:bg-cream hover:text-[#2D241A]'}`}
          >
            <GraduationCap className="h-4.5 w-4.5 text-deep-rose" />
            <span>Course Catalog</span>
          </button>

          <button 
            onClick={() => setActiveTab('opportunities')}
            className={`w-full flex items-center space-x-3 rounded-xl px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-left border transition ${activeTab === 'opportunities' ? 'bg-soft-yellow/80 text-[#4A3E31] border-primary-gold/20 shadow-sm font-extrabold' : 'text-[#7D7061] border-transparent hover:bg-cream hover:text-[#2D241A]'}`}
          >
            <Briefcase className="h-4.5 w-4.5 text-deep-gold" />
            <span>Opportunities</span>
          </button>

          <button 
            onClick={() => setActiveTab('applications')}
            className={`w-full flex items-center space-x-3 rounded-xl px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-left border transition ${activeTab === 'applications' ? 'bg-soft-yellow/80 text-[#4A3E31] border-primary-gold/20 shadow-sm font-extrabold' : 'text-[#7D7061] border-transparent hover:bg-cream hover:text-[#2D241A]'}`}
          >
            <UserCheck className="h-4.5 w-4.5 text-deep-rose" />
            <span>Applications</span>
          </button>

          <button 
            onClick={() => setActiveTab('analytics')}
            className={`w-full flex items-center space-x-3 rounded-xl px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-left border transition ${activeTab === 'analytics' ? 'bg-soft-yellow/80 text-[#4A3E31] border-primary-gold/20 shadow-sm font-extrabold' : 'text-[#7D7061] border-transparent hover:bg-cream hover:text-[#2D241A]'}`}
          >
            <TrendingUp className="h-4.5 w-4.5 text-deep-gold" />
            <span>Platform Analytics</span>
          </button>

          <div className="my-2 border-t border-primary-gold/10" />
          
          <button 
            onClick={logout} 
            className="w-full flex items-center space-x-3 rounded-xl px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-deep-rose hover:bg-soft-rose/20 transition text-left border border-transparent cursor-pointer"
          >
            <LogOut className="h-4.5 w-4.5" />
            <span>Logout</span>
          </button>
        </nav>
      </aside>

      {/* Main Content Area */}
      <div className="flex-grow flex flex-col overflow-y-auto">
        
        {/* Header Contract */}
        <header className="h-16 border-b border-primary-gold/10 bg-white px-6 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center space-x-4">
            <button onClick={() => setSidebarOpen(true)} className="p-2 md:hidden text-[#7D7061] hover:bg-cream rounded-xl">
              <Menu className="h-5 w-5" />
            </button>
            <h1 className="font-serif text-lg font-bold text-[#2D241A] uppercase tracking-wider">
              {activeTab === 'overview' && 'Global Administration overview'}
              {activeTab === 'users' && 'Candidate & Staff Role Directory'}
              {activeTab === 'skills' && 'Global Skills Framework Catalog'}
              {activeTab === 'courses' && 'Global Published Course Curriculums'}
              {activeTab === 'opportunities' && 'Local Livelihood Opportunities Board'}
              {activeTab === 'applications' && 'Opportunity Applications Registry'}
            </h1>
          </div>

          <div className="flex items-center space-x-2.5">
            <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-deep-rose to-primary-pink flex items-center justify-center font-bold text-white border border-soft-rose/30 text-sm shadow-sm">
              {userInitials}
            </div>
            <div className="hidden sm:block text-left">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-[#2D241A]">{user?.name || 'System Admin'}</span>
              <span className="block text-[9px] uppercase font-bold tracking-widest text-[#6B8E6F]">Root Access</span>
            </div>
          </div>
        </header>

        {/* Dash Container */}
        <main className="p-6 flex-grow flex flex-col gap-6">

          {/* ========================================================================================== */}
          {/* TAB 1: OVERVIEW */}
          {/* ========================================================================================== */}
          {activeTab === 'overview' && (
            <div className="space-y-6 flex-grow flex flex-col">
              {/* Hero Banner */}
              <section className="rounded-2xl bg-white border border-primary-gold/15 p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-sm">
                <div className="space-y-2">
                  <span className="inline-block px-3.5 py-1 rounded-full bg-soft-yellow text-deep-gold text-[9px] font-extrabold uppercase tracking-wider border border-primary-gold/20">SYSTEM OPERATIONS</span>
                  <h2 className="font-serif text-2xl font-extrabold text-[#2D241A]">Operations Control Center</h2>
                  <p className="text-xs text-[#7D7061] font-semibold">Supervise active coaching hubs, evaluate registered course curriculums, and verify system integrity.</p>
                </div>
              </section>

              {loadingOverview ? (
                <div className="flex-grow flex flex-col items-center justify-center p-12 bg-white rounded-2xl border border-primary-gold/15 shadow-sm min-h-[300px]">
                  <RefreshCw className="h-10 w-10 text-deep-gold animate-spin mb-4" />
                  <p className="text-xs text-[#7D7061] font-semibold uppercase tracking-widest">Aggregating real-time database indexes...</p>
                </div>
              ) : errorOverview ? (
                <div className="flex-grow flex items-center justify-center p-8 bg-white border border-primary-gold/15 rounded-2xl shadow-sm min-h-[300px]">
                  <div className="max-w-md text-center space-y-4">
                    <AlertCircle className="h-12 w-12 mx-auto text-deep-rose" />
                    <h3 className="font-serif text-lg font-bold text-[#2D241A] uppercase tracking-wider">Metrics Compilation Failed</h3>
                    <p className="text-xs text-[#7D7061] leading-relaxed font-semibold">{errorOverview}</p>
                    <button onClick={fetchOverviewMetrics} className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-deep-rose to-primary-pink text-white text-xs font-bold uppercase tracking-widest px-6 py-3 shadow-md hover:shadow-lg transition cursor-pointer">Retry API Compilation</button>
                  </div>
                </div>
              ) : metrics && (
                <div className="space-y-6">
                  {/* Scoreboard Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                    <div className="p-5 bg-white rounded-2xl border border-primary-gold/15 shadow-sm space-y-2">
                      <span className="text-[10px] uppercase font-bold text-[#7D7061] tracking-widest">Global Accounts</span>
                      <div className="flex items-baseline space-x-2">
                        <span className="text-3xl font-extrabold text-[#2D241A] font-mono">{metrics.total_users}</span>
                      </div>
                      <p className="text-[10px] text-[#7D7061] font-semibold">Includes admins, coaching hubs, and candidates.</p>
                    </div>

                    <div className="p-5 bg-white rounded-2xl border border-primary-gold/15 shadow-sm space-y-2">
                      <span className="text-[10px] uppercase font-bold text-[#7D7061] tracking-widest">Candidates List</span>
                      <div className="flex items-baseline space-x-2">
                        <span className="text-3xl font-extrabold text-[#2D241A] font-mono">{metrics.total_learners}</span>
                      </div>
                      <p className="text-[10px] text-[#7D7061] font-semibold">Active learners pursuing vocational skills.</p>
                    </div>

                    <div className="p-5 bg-white rounded-2xl border border-primary-gold/15 shadow-sm space-y-2">
                      <span className="text-[10px] uppercase font-bold text-[#7D7061] tracking-widest">Coaching Centres</span>
                      <div className="flex items-baseline space-x-2">
                        <span className="text-3xl font-extrabold text-[#2D241A] font-mono">{metrics.total_training_centres}</span>
                      </div>
                      <p className="text-[10px] text-[#7D7061] font-semibold">Verified neighborhood classroom hubs.</p>
                    </div>

                    <div className="p-5 bg-white rounded-2xl border border-primary-gold/15 shadow-sm space-y-2">
                      <span className="text-[10px] uppercase font-bold text-[#7D7061] tracking-widest">Published Courses</span>
                      <div className="flex items-baseline space-x-2">
                        <span className="text-3xl font-extrabold text-[#2D241A] font-mono">{metrics.total_courses}</span>
                      </div>
                      <p className="text-[10px] text-[#7D7061] font-semibold">Vocational courses inside local language curricula.</p>
                    </div>

                    <div className="p-5 bg-white rounded-2xl border border-primary-gold/15 shadow-sm space-y-2">
                      <span className="text-[10px] uppercase font-bold text-[#7D7061] tracking-widest">Competency Domains</span>
                      <div className="flex items-baseline space-x-2">
                        <span className="text-3xl font-extrabold text-[#2D241A] font-mono">{metrics.total_skills}</span>
                      </div>
                      <p className="text-[10px] text-[#7D7061] font-semibold">Mapped categories for textile, tech, and craft.</p>
                    </div>

                    <div className="p-5 bg-white rounded-2xl border border-primary-gold/15 shadow-sm space-y-2">
                      <span className="text-[10px] uppercase font-bold text-[#7D7061] tracking-widest">Market Opportunities</span>
                      <div className="flex items-baseline space-x-2">
                        <span className="text-3xl font-extrabold text-[#2D241A] font-mono">{metrics.total_opportunities}</span>
                      </div>
                      <p className="text-[10px] text-[#7D7061] font-semibold">Active local boutique work and boutique orders.</p>
                    </div>
                  </div>

                  {/* Security Checks Panel */}
                  <div className="p-6 bg-white rounded-2xl border border-primary-gold/15 shadow-sm space-y-4">
                    <span className="text-[9px] uppercase tracking-widest font-extrabold text-deep-gold">CHECKS &amp; GATEWAYS</span>
                    <h3 className="font-serif text-base font-bold text-[#2D241A] uppercase tracking-wider border-b border-primary-gold/10 pb-3">Global Security Audit</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-[#7D7061]">
                      <div className="p-4 bg-soft-yellow/50 rounded-xl border border-primary-gold/20 flex items-start space-x-3">
                        <ShieldCheck className="h-5 w-5 text-deep-gold shrink-0 mt-0.5" />
                        <div className="space-y-1">
                          <span className="font-bold text-[#2D241A] block uppercase text-[10px] tracking-widest">Boundary Enforcement</span>
                          <span className="text-[11px] block leading-relaxed font-semibold">Strict server-side JWT authentication checks and role-based endpoints validated on every fetch request.</span>
                        </div>
                      </div>
                      <div className="p-4 bg-cream/40 border border-primary-gold/10 rounded-xl flex items-start space-x-3">
                        <Sparkles className="h-5 w-5 text-deep-rose shrink-0 mt-0.5" />
                        <div className="space-y-1">
                          <span className="font-bold text-[#2D241A] block uppercase text-[10px] tracking-widest">Multi-Tenant Isolation</span>
                          <span className="text-[11px] block leading-relaxed font-semibold">Verified database sandboxing guarantees that coaching centers operate fully independently without any data leakage.</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================================================== */}
          {/* TAB 2: USERS & ROLES */}
          {/* ========================================================================================== */}
          {activeTab === 'users' && (
            <div className="space-y-6">
              {/* Controls bar */}
              <div className="bg-white border border-primary-gold/15 p-4 rounded-xl flex flex-col md:flex-row gap-4 items-center justify-between shadow-sm">
                <div className="relative w-full md:max-w-xs">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#7D7061]" />
                  <input 
                    type="text" 
                    placeholder="Search name or email..." 
                    value={usersSearch}
                    onChange={(e) => setUsersSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 border border-primary-gold/20 rounded-lg text-xs font-semibold focus:outline-none focus:border-deep-rose"
                  />
                </div>
                <div className="flex w-full md:w-auto items-center gap-4">
                  <select 
                    value={usersRoleFilter} 
                    onChange={(e) => setUsersRoleFilter(e.target.value)}
                    className="border border-primary-gold/20 rounded-lg text-xs font-semibold px-3 py-2 focus:outline-none focus:border-deep-rose"
                  >
                    <option value="">All Roles</option>
                    <option value="learner">Candidate Learner</option>
                    <option value="centre">Coaching Hub</option>
                    <option value="admin">Platform Admin</option>
                  </select>
                  <select 
                    value={usersStatusFilter} 
                    onChange={(e) => setUsersStatusFilter(e.target.value)}
                    className="border border-primary-gold/20 rounded-lg text-xs font-semibold px-3 py-2 focus:outline-none focus:border-deep-rose"
                  >
                    <option value="">All Statuses</option>
                    <option value="active">Active Accounts Only</option>
                    <option value="inactive">Inactive Accounts Only</option>
                  </select>
                </div>
              </div>

              {loadingUsers ? (
                <div className="text-center py-12 bg-white rounded-xl border border-primary-gold/15 shadow-sm">
                  <RefreshCw className="h-8 w-8 text-deep-gold animate-spin mx-auto mb-2" />
                  <p className="text-xs font-bold text-[#7D7061] uppercase tracking-wider">Syncing Account Directory...</p>
                </div>
              ) : usersList.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl border border-primary-gold/15 shadow-sm text-xs font-bold text-[#7D7061] uppercase tracking-wider">
                  No matching registered accounts found.
                </div>
              ) : (
                <div className="bg-white border border-primary-gold/15 rounded-xl shadow-sm overflow-hidden">
                  <table className="w-full border-collapse text-left">
                    <thead>
                      <tr className="bg-cream/40 border-b border-primary-gold/10 text-[10px] uppercase tracking-wider font-extrabold text-[#7D7061]">
                        <th className="px-6 py-4">Account Holder</th>
                        <th className="px-6 py-4">Registered Role</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-primary-gold/10 text-xs">
                      {usersList.map((targetUser) => (
                        <tr key={targetUser.id} className="hover:bg-cream/10">
                          <td className="px-6 py-4">
                            <div className="font-bold text-[#2D241A]">{targetUser.name}</div>
                            <div className="text-[10px] text-[#7D7061] font-semibold">{targetUser.email}</div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-block px-2.5 py-1 rounded-full text-[9px] font-extrabold uppercase tracking-wider border ${targetUser.role === 'admin' ? 'bg-[#FFF3E0] text-[#E65100] border-[#E65100]/20' : targetUser.role === 'centre' ? 'bg-soft-rose text-deep-rose border-soft-rose/30' : 'bg-[#E8F5E9] text-[#2E7D32] border-[#2E7D32]/20'}`}>
                              {targetUser.role}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`font-bold uppercase tracking-wider text-[10px] ${targetUser.is_active !== false ? 'text-[#2E7D32]' : 'text-deep-rose'}`}>
                              {targetUser.is_active !== false ? 'Active' : 'Deactivated'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right space-x-2">
                            {/* Toggle active status */}
                            <button 
                              onClick={() => toggleUserStatus(targetUser)}
                              className={`px-3 py-1.5 rounded-lg text-[9px] font-extrabold uppercase tracking-wider border transition cursor-pointer ${targetUser.is_active !== false ? 'bg-white border-soft-rose/50 text-deep-rose hover:bg-soft-rose/10' : 'bg-white border-[#2E7D32]/30 text-[#2E7D32] hover:bg-[#EAF5EC]'}`}
                            >
                              {targetUser.is_active !== false ? 'Deactivate' : 'Activate'}
                            </button>

                            {/* Dropdown role actions */}
                            <select
                              value={targetUser.role}
                              onChange={(e) => changeUserRole(targetUser, e.target.value)}
                              className="px-2.5 py-1.5 rounded-lg text-[9px] font-extrabold uppercase tracking-wider bg-white border border-primary-gold/20 text-[#7D7061] focus:outline-none"
                            >
                              <option value="learner">To Learner</option>
                              <option value="centre">To Centre</option>
                              <option value="admin">To Admin</option>
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ========================================================================================== */}
          {/* TAB 3: SKILLS CATALOG */}
          {/* ========================================================================================== */}
          {activeTab === 'skills' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-deep-gold">Global Skill Domains</span>
                <button 
                  onClick={() => {
                    setEditingSkill(null);
                    setSkillForm({ name: '', description: '', category_id: 'digital-skills', difficulty: 'Beginner', estimated_duration: '', prerequisites: '', career_options: '' });
                    setShowSkillModal(true);
                  }}
                  className="inline-flex items-center space-x-1 bg-gradient-to-r from-deep-rose to-primary-pink text-white rounded-full px-5 py-2.5 text-xs font-bold uppercase tracking-wider cursor-pointer shadow-sm hover:shadow-md transition"
                >
                  <Plus className="h-4 w-4" />
                  <span>Create New Skill</span>
                </button>
              </div>

              {loadingSkills ? (
                <div className="text-center py-12 bg-white rounded-xl border border-primary-gold/15 shadow-sm">
                  <RefreshCw className="h-8 w-8 text-deep-gold animate-spin mx-auto mb-2" />
                  <p className="text-xs font-bold text-[#7D7061] uppercase tracking-wider">Syncing Skills Catalogue...</p>
                </div>
              ) : skillsList.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl border border-primary-gold/15 shadow-sm text-xs font-bold text-[#7D7061] uppercase tracking-wider">
                  No registered skills in catalog.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {skillsList.map((skill) => (
                    <div key={skill.id} className="p-5 bg-white border border-primary-gold/15 rounded-2xl shadow-sm space-y-4">
                      <div className="flex items-start justify-between border-b border-primary-gold/10 pb-3">
                        <div>
                          <span className="text-[9px] uppercase tracking-widest font-extrabold text-[#C8870A]">{skill.category_id}</span>
                          <h4 className="font-serif text-base font-extrabold text-[#2D241A]">{skill.name}</h4>
                        </div>
                        <span className={`inline-block px-2.5 py-1 rounded-full text-[9px] font-extrabold uppercase tracking-wider border ${skill.is_active !== false ? 'bg-[#E8F5E9] text-[#2E7D32] border-[#2E7D32]/20' : 'bg-soft-rose text-deep-rose border-soft-rose/30'}`}>
                          {skill.is_active !== false ? 'Active' : 'Deactivated'}
                        </span>
                      </div>
                      <p className="text-xs text-[#7D7061] font-semibold leading-relaxed line-clamp-3">{skill.description}</p>
                      <div className="flex items-center gap-4 text-[10px] font-extrabold text-[#7D7061] uppercase border-t border-primary-gold/5 pt-3">
                        <span>Difficulty: {skill.difficulty}</span>
                        <span>Duration: {skill.estimated_duration}</span>
                      </div>
                      <div className="flex items-center justify-end space-x-2 pt-1">
                        <button 
                          onClick={() => toggleSkillActive(skill)}
                          className="px-3 py-1.5 rounded-lg border border-primary-gold/20 text-[9px] font-extrabold uppercase tracking-wider text-[#7D7061] hover:bg-cream/40 transition cursor-pointer"
                        >
                          Toggle Status
                        </button>
                        <button 
                          onClick={() => {
                            setEditingSkill(skill);
                            setSkillForm({
                              name: skill.name,
                              description: skill.description,
                              category_id: skill.category_id,
                              difficulty: skill.difficulty,
                              estimated_duration: skill.estimated_duration,
                              prerequisites: skill.prerequisites?.join(', ') || '',
                              career_options: skill.career_options?.join(', ') || ''
                            });
                            setShowSkillModal(true);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-soft-yellow/50 border border-primary-gold/20 text-[9px] font-extrabold uppercase tracking-wider text-[#4A3E31] hover:bg-soft-yellow/80 transition cursor-pointer flex items-center space-x-1"
                        >
                          <Edit2 className="h-3 w-3" />
                          <span>Edit</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Create/Edit Skill Modal */}
              {showSkillModal && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                  <div className="bg-white border border-primary-gold/15 rounded-2xl p-6 w-full max-w-lg shadow-xl relative animate-fadeIn">
                    <button onClick={() => setShowSkillModal(false)} className="absolute top-4 right-4 p-1 rounded-lg hover:bg-cream transition">
                      <X className="h-5 w-5 text-[#7D7061]" />
                    </button>
                    <h3 className="font-serif text-lg font-bold text-[#2D241A] uppercase tracking-wider border-b border-primary-gold/10 pb-3 mb-4">
                      {editingSkill ? 'Modify Skill details' : 'Register New Competency Domain'}
                    </h3>
                    <form onSubmit={handleSaveSkill} className="space-y-4 text-xs font-semibold">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[#7D7061] uppercase text-[9px]">Skill Name *</label>
                          <input type="text" value={skillForm.name} onChange={(e) => setSkillForm({...skillForm, name: e.target.value})} className="w-full border border-primary-gold/20 rounded-lg p-2 focus:outline-none focus:border-deep-rose" required />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[#7D7061] uppercase text-[9px]">Category ID *</label>
                          <select value={skillForm.category_id} onChange={(e) => setSkillForm({...skillForm, category_id: e.target.value})} className="w-full border border-primary-gold/20 rounded-lg p-2 focus:outline-none focus:border-deep-rose">
                            <option value="digital-skills">Digital Skills</option>
                            <option value="handicrafts">Handicrafts</option>
                            <option value="beauty-wellness">Beauty &amp; Wellness</option>
                            <option value="food-catering">Food &amp; Catering</option>
                            <option value="entrepreneurship">Entrepreneurship</option>
                          </select>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[#7D7061] uppercase text-[9px]">Description *</label>
                        <textarea rows={3} value={skillForm.description} onChange={(e) => setSkillForm({...skillForm, description: e.target.value})} className="w-full border border-primary-gold/20 rounded-lg p-2 focus:outline-none focus:border-deep-rose" required />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[#7D7061] uppercase text-[9px]">Difficulty *</label>
                          <select value={skillForm.difficulty} onChange={(e) => setSkillForm({...skillForm, difficulty: e.target.value})} className="w-full border border-primary-gold/20 rounded-lg p-2 focus:outline-none focus:border-deep-rose">
                            <option value="Beginner">Beginner</option>
                            <option value="Intermediate">Intermediate</option>
                            <option value="Advanced">Advanced</option>
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[#7D7061] uppercase text-[9px]">Estimated Duration (e.g. 8 Weeks) *</label>
                          <input type="text" value={skillForm.estimated_duration} onChange={(e) => setSkillForm({...skillForm, estimated_duration: e.target.value})} className="w-full border border-primary-gold/20 rounded-lg p-2 focus:outline-none focus:border-deep-rose" required />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[#7D7061] uppercase text-[9px]">Prerequisites (Comma-separated)</label>
                        <input type="text" placeholder="e.g. Literacy, None" value={skillForm.prerequisites} onChange={(e) => setSkillForm({...skillForm, prerequisites: e.target.value})} className="w-full border border-primary-gold/20 rounded-lg p-2 focus:outline-none focus:border-deep-rose" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[#7D7061] uppercase text-[9px]">Career Pathways (Comma-separated)</label>
                        <input type="text" placeholder="e.g. Boutique Supervisor, Assistant Weaver" value={skillForm.career_options} onChange={(e) => setSkillForm({...skillForm, career_options: e.target.value})} className="w-full border border-primary-gold/20 rounded-lg p-2 focus:outline-none focus:border-deep-rose" />
                      </div>
                      <div className="pt-2 flex items-center justify-end space-x-3 border-t border-primary-gold/10">
                        <button type="button" onClick={() => setShowSkillModal(false)} className="px-5 py-2 rounded-full border border-primary-gold/20 text-[#7D7061] uppercase text-[10px] tracking-wider cursor-pointer hover:bg-cream/40 transition">Cancel</button>
                        <button type="submit" className="px-6 py-2 rounded-full bg-gradient-to-r from-deep-rose to-primary-pink text-white uppercase text-[10px] tracking-widest cursor-pointer shadow-md hover:shadow-lg transition">Save Competency Item</button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================================================== */}
          {/* TAB 4: COURSE CATALOG */}
          {/* ========================================================================================== */}
          {activeTab === 'courses' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-deep-gold">Published Course Curriculums</span>
                <button 
                  onClick={() => {
                    setEditingCourse(null);
                    setCourseForm({ title: '', description: '', skill_id: skillsList[0]?.id || '', category_id: 'digital-skills', thumbnail: 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=600&q=80', difficulty: 'beginner', duration: '', learning_mode: 'online', instructor: '' });
                    setShowCourseModal(true);
                  }}
                  className="inline-flex items-center space-x-1 bg-gradient-to-r from-deep-rose to-primary-pink text-white rounded-full px-5 py-2.5 text-xs font-bold uppercase tracking-wider cursor-pointer shadow-sm hover:shadow-md transition"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add New Course</span>
                </button>
              </div>

              {loadingCourses ? (
                <div className="text-center py-12 bg-white rounded-xl border border-primary-gold/15 shadow-sm">
                  <RefreshCw className="h-8 w-8 text-deep-gold animate-spin mx-auto mb-2" />
                  <p className="text-xs font-bold text-[#7D7061] uppercase tracking-wider">Syncing Course Catalog...</p>
                </div>
              ) : coursesList.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl border border-primary-gold/15 shadow-sm text-xs font-bold text-[#7D7061] uppercase tracking-wider">
                  No courses found in platform catalog.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {coursesList.map((course) => (
                    <div key={course.id} className="p-5 bg-white border border-primary-gold/15 rounded-2xl shadow-sm flex flex-col md:flex-row gap-4 items-start">
                      <img src={course.thumbnail} alt={course.title} className="w-24 h-24 rounded-xl object-cover shrink-0 border border-primary-gold/10" />
                      <div className="flex-grow space-y-2">
                        <div className="flex items-start justify-between">
                          <div className="text-left">
                            <span className="text-[9px] uppercase tracking-widest font-extrabold text-[#C8870A]">
                              {course.centre_name || 'System Catalog'} · {course.difficulty}
                            </span>
                            <h4 className="font-serif text-base font-extrabold text-[#2D241A] leading-tight">{course.title}</h4>
                          </div>
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[8px] font-extrabold uppercase tracking-wider border ${course.is_active !== false ? 'bg-[#E8F5E9] text-[#2E7D32] border-[#2E7D32]/20' : 'bg-soft-rose text-deep-rose border-soft-rose/30'}`}>
                            {course.is_active !== false ? 'Active' : 'Deactivated'}
                          </span>
                        </div>
                        <p className="text-xs text-[#7D7061] font-semibold leading-relaxed line-clamp-2 text-left">{course.description}</p>
                        
                        {/* Training Delivery Details Display for Admin */}
                        <div className="p-3 rounded-xl bg-cream/35 border border-primary-gold/10 space-y-1.5 text-left text-[11px] font-semibold text-[#5D5041]">
                          <div className="flex items-center justify-between">
                            <span className="text-[9px] font-bold uppercase tracking-wider text-[#7D7061]">Training Mode</span>
                            <span className="px-2 py-0.5 rounded bg-deep-gold/10 text-deep-gold text-[8px] font-extrabold uppercase">
                              {course.training_mode || course.learning_mode || 'online'}
                            </span>
                          </div>
                          
                          {(course.training_mode === 'online' || course.training_mode === 'hybrid' || course.learning_mode === 'online' || course.learning_mode === 'hybrid') && (
                            <div className="flex items-center gap-1.5 text-[10px]">
                              <span>🎥</span>
                              <span>{course.online_training?.videos?.length || 0} YouTube videos</span>
                            </div>
                          )}
                          
                          {(course.training_mode === 'offline' || course.training_mode === 'hybrid' || course.learning_mode === 'offline' || course.learning_mode === 'hybrid') && (
                            <div className="space-y-1 pt-1 border-t border-primary-gold/5">
                              <div className="flex items-center gap-1.5 text-[10px]">
                                <span>📍</span>
                                <span>{course.offline_training?.city || course.city || 'Mysuru'}, {course.offline_training?.state || course.state || 'Karnataka'}</span>
                              </div>
                              <div className="flex items-center gap-1.5 text-[9px] text-[#7D7061]">
                                <span>📅</span>
                                <span>{course.offline_training?.available_days || 'Mon–Fri'} ({course.offline_training?.start_time || '10:00 AM'} – {course.offline_training?.end_time || '1:00 PM'})</span>
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-3 text-[10px] font-extrabold text-[#7D7061] uppercase pt-1 text-left">
                          <span>Instructor: {course.instructor}</span>
                          <span>Duration: {course.duration}</span>
                        </div>
                        <div className="flex items-center justify-end space-x-2 pt-2 border-t border-primary-gold/5">
                          <button 
                            onClick={() => toggleCourseActive(course)}
                            className="px-2.5 py-1.5 rounded-lg border border-primary-gold/20 text-[9px] font-extrabold uppercase tracking-wider text-[#7D7061] hover:bg-cream/40 transition cursor-pointer"
                          >
                            Toggle Status
                          </button>
                          <button 
                            onClick={() => {
                              setEditingCourse(course);
                              setCourseForm({
                                title: course.title,
                                description: course.description,
                                skill_id: course.skill_id,
                                category_id: course.category_id,
                                thumbnail: course.thumbnail,
                                difficulty: course.difficulty,
                                duration: course.duration,
                                learning_mode: course.learning_mode,
                                instructor: course.instructor
                              });
                              setShowCourseModal(true);
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-soft-yellow/50 border border-primary-gold/20 text-[9px] font-extrabold uppercase tracking-wider text-[#4A3E31] hover:bg-soft-yellow/80 transition cursor-pointer flex items-center space-x-1"
                          >
                            <Edit2 className="h-3 w-3" />
                            <span>Edit</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Create/Edit Course Modal */}
              {showCourseModal && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                  <div className="bg-white border border-primary-gold/15 rounded-2xl p-6 w-full max-w-lg shadow-xl relative animate-fadeIn">
                    <button onClick={() => setShowCourseModal(false)} className="absolute top-4 right-4 p-1 rounded-lg hover:bg-cream transition">
                      <X className="h-5 w-5 text-[#7D7061]" />
                    </button>
                    <h3 className="font-serif text-lg font-bold text-[#2D241A] uppercase tracking-wider border-b border-primary-gold/10 pb-3 mb-4">
                      {editingCourse ? 'Edit Platform Course Details' : 'Publish New Vocational Course'}
                    </h3>
                    <form onSubmit={handleSaveCourse} className="space-y-4 text-xs font-semibold">
                      <div className="space-y-1">
                        <label className="text-[#7D7061] uppercase text-[9px]">Course Title *</label>
                        <input type="text" value={courseForm.title} onChange={(e) => setCourseForm({...courseForm, title: e.target.value})} className="w-full border border-primary-gold/20 rounded-lg p-2 focus:outline-none focus:border-deep-rose" required />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[#7D7061] uppercase text-[9px]">Description *</label>
                        <textarea rows={2} value={courseForm.description} onChange={(e) => setCourseForm({...courseForm, description: e.target.value})} className="w-full border border-primary-gold/20 rounded-lg p-2 focus:outline-none focus:border-deep-rose" required />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[#7D7061] uppercase text-[9px]">Competency Association *</label>
                          <select value={courseForm.skill_id} onChange={(e) => setCourseForm({...courseForm, skill_id: e.target.value})} className="w-full border border-primary-gold/20 rounded-lg p-2 focus:outline-none focus:border-deep-rose" required>
                            <option value="">Select Associated Skill</option>
                            {skillsList.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[#7D7061] uppercase text-[9px]">Category ID *</label>
                          <select value={courseForm.category_id} onChange={(e) => setCourseForm({...courseForm, category_id: e.target.value})} className="w-full border border-primary-gold/20 rounded-lg p-2 focus:outline-none focus:border-deep-rose">
                            <option value="digital-skills">Digital Skills</option>
                            <option value="handicrafts">Handicrafts</option>
                            <option value="beauty-wellness">Beauty &amp; Wellness</option>
                            <option value="food-catering">Food &amp; Catering</option>
                            <option value="entrepreneurship">Entrepreneurship</option>
                          </select>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-1">
                          <label className="text-[#7D7061] uppercase text-[9px]">Difficulty *</label>
                          <select value={courseForm.difficulty} onChange={(e) => setCourseForm({...courseForm, difficulty: e.target.value})} className="w-full border border-primary-gold/20 rounded-lg p-2 focus:outline-none focus:border-deep-rose">
                            <option value="beginner">Beginner</option>
                            <option value="intermediate">Intermediate</option>
                            <option value="advanced">Advanced</option>
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[#7D7061] uppercase text-[9px]">Duration *</label>
                          <input type="text" placeholder="e.g. 10 hours" value={courseForm.duration} onChange={(e) => setCourseForm({...courseForm, duration: e.target.value})} className="w-full border border-primary-gold/20 rounded-lg p-2 focus:outline-none focus:border-deep-rose" required />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[#7D7061] uppercase text-[9px]">Learning Mode *</label>
                          <select value={courseForm.learning_mode} onChange={(e) => setCourseForm({...courseForm, learning_mode: e.target.value})} className="w-full border border-primary-gold/20 rounded-lg p-2 focus:outline-none focus:border-deep-rose">
                            <option value="online">Online</option>
                            <option value="offline">Offline</option>
                            <option value="hybrid">Hybrid</option>
                          </select>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[#7D7061] uppercase text-[9px]">Instructor / Publisher *</label>
                          <input type="text" value={courseForm.instructor} onChange={(e) => setCourseForm({...courseForm, instructor: e.target.value})} className="w-full border border-primary-gold/20 rounded-lg p-2 focus:outline-none focus:border-deep-rose" required />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[#7D7061] uppercase text-[9px]">Thumbnail URL *</label>
                          <input type="text" value={courseForm.thumbnail} onChange={(e) => setCourseForm({...courseForm, thumbnail: e.target.value})} className="w-full border border-primary-gold/20 rounded-lg p-2 focus:outline-none focus:border-deep-rose" required />
                        </div>
                      </div>
                      <div className="pt-2 flex items-center justify-end space-x-3 border-t border-primary-gold/10">
                        <button type="button" onClick={() => setShowCourseModal(false)} className="px-5 py-2 rounded-full border border-primary-gold/20 text-[#7D7061] uppercase text-[10px] tracking-wider cursor-pointer hover:bg-cream/40 transition">Cancel</button>
                        <button type="submit" className="px-6 py-2 rounded-full bg-gradient-to-r from-deep-rose to-primary-pink text-white uppercase text-[10px] tracking-widest cursor-pointer shadow-md hover:shadow-lg transition">Publish Course</button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================================================== */}
          {/* TAB 5: OPPORTUNITIES */}
          {/* ========================================================================================== */}
          {activeTab === 'opportunities' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-deep-gold">Livelihood Opportunities Board</span>
                <button 
                  onClick={() => {
                    setEditingOpp(null);
                    setOppForm({ title: '', organization: '', description: '', opportunity_type: 'livelihood', location: '', required_skills: '', eligibility: '', deadline: '', compensation: 'Stipend / Grant' });
                    setShowOppModal(true);
                  }}
                  className="inline-flex items-center space-x-1 bg-gradient-to-r from-deep-rose to-primary-pink text-white rounded-full px-5 py-2.5 text-xs font-bold uppercase tracking-wider cursor-pointer shadow-sm hover:shadow-md transition"
                >
                  <Plus className="h-4 w-4" />
                  <span>Create Livelihood Opportunity</span>
                </button>
              </div>

              {loadingOpps ? (
                <div className="text-center py-12 bg-white rounded-xl border border-primary-gold/15 shadow-sm">
                  <RefreshCw className="h-8 w-8 text-deep-gold animate-spin mx-auto mb-2" />
                  <p className="text-xs font-bold text-[#7D7061] uppercase tracking-wider">Syncing Opportunities Board...</p>
                </div>
              ) : oppsList.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl border border-primary-gold/15 shadow-sm text-xs font-bold text-[#7D7061] uppercase tracking-wider">
                  No active opportunities registered.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {oppsList.map((opp) => (
                    <div key={opp.id} className="p-5 bg-white border border-primary-gold/15 rounded-2xl shadow-sm space-y-4">
                      <div className="flex items-start justify-between border-b border-primary-gold/10 pb-3">
                        <div>
                          <span className="text-[9px] uppercase tracking-widest font-extrabold text-[#C8870A]">{opp.opportunity_type} · {opp.location}</span>
                          <h4 className="font-serif text-base font-extrabold text-[#2D241A]">{opp.title}</h4>
                          <span className="text-[10px] text-[#7D7061] font-bold block">Employer: {opp.organization}</span>
                        </div>
                        <span className={`inline-block px-2.5 py-1 rounded-full text-[9px] font-extrabold uppercase tracking-wider border ${opp.is_active !== false ? 'bg-[#E8F5E9] text-[#2E7D32] border-[#2E7D32]/20' : 'bg-soft-rose text-deep-rose border-soft-rose/30'}`}>
                          {opp.is_active !== false ? 'Active' : 'Deactivated'}
                        </span>
                      </div>
                      <p className="text-xs text-[#7D7061] font-semibold leading-relaxed line-clamp-3">{opp.description}</p>
                      <div className="text-[10px] space-y-1 font-semibold text-[#7D7061] uppercase border-t border-primary-gold/5 pt-3">
                        <div><span className="font-extrabold text-[#2D241A]">Compensation:</span> {opp.compensation}</div>
                        <div><span className="font-extrabold text-[#2D241A]">Required skills:</span> {opp.required_skills?.join(', ') || 'None'}</div>
                        <div><span className="font-extrabold text-[#2D241A]">Eligibility:</span> {opp.eligibility}</div>
                        <div><span className="font-extrabold text-[#2D241A]">Deadline:</span> {opp.deadline}</div>
                      </div>
                      <div className="flex items-center justify-end space-x-2 pt-1">
                        <button 
                          onClick={() => toggleOppActive(opp)}
                          className="px-3 py-1.5 rounded-lg border border-primary-gold/20 text-[9px] font-extrabold uppercase tracking-wider text-[#7D7061] hover:bg-cream/40 transition cursor-pointer"
                        >
                          Toggle Status
                        </button>
                        <button 
                          onClick={() => {
                            setEditingOpp(opp);
                            setOppForm({
                              title: opp.title,
                              organization: opp.organization,
                              description: opp.description,
                              opportunity_type: opp.opportunity_type,
                              location: opp.location,
                              required_skills: opp.required_skills?.join(', ') || '',
                              eligibility: opp.eligibility,
                              deadline: opp.deadline,
                              compensation: opp.compensation || ''
                            });
                            setShowOppModal(true);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-soft-yellow/50 border border-primary-gold/20 text-[9px] font-extrabold uppercase tracking-wider text-[#4A3E31] hover:bg-soft-yellow/80 transition cursor-pointer flex items-center space-x-1"
                        >
                          <Edit2 className="h-3 w-3" />
                          <span>Edit</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Create/Edit Opportunity Modal */}
              {showOppModal && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                  <div className="bg-white border border-primary-gold/15 rounded-2xl p-6 w-full max-w-lg shadow-xl relative animate-fadeIn">
                    <button onClick={() => setShowOppModal(false)} className="absolute top-4 right-4 p-1 rounded-lg hover:bg-cream transition">
                      <X className="h-5 w-5 text-[#7D7061]" />
                    </button>
                    <h3 className="font-serif text-lg font-bold text-[#2D241A] uppercase tracking-wider border-b border-primary-gold/10 pb-3 mb-4">
                      {editingOpp ? 'Edit Opportunity Details' : 'Publish Livelihood Opportunity'}
                    </h3>
                    <form onSubmit={handleSaveOpp} className="space-y-4 text-xs font-semibold">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[#7D7061] uppercase text-[9px]">Opportunity Title *</label>
                          <input type="text" value={oppForm.title} onChange={(e) => setOppForm({...oppForm, title: e.target.value})} className="w-full border border-primary-gold/20 rounded-lg p-2 focus:outline-none focus:border-deep-rose" required />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[#7D7061] uppercase text-[9px]">Employer / Organization Name *</label>
                          <input type="text" value={oppForm.organization} onChange={(e) => setOppForm({...oppForm, organization: e.target.value})} className="w-full border border-primary-gold/20 rounded-lg p-2 focus:outline-none focus:border-deep-rose" required />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[#7D7061] uppercase text-[9px]">Description *</label>
                        <textarea rows={3} value={oppForm.description} onChange={(e) => setOppForm({...oppForm, description: e.target.value})} className="w-full border border-primary-gold/20 rounded-lg p-2 focus:outline-none focus:border-deep-rose" required />
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-1">
                          <label className="text-[#7D7061] uppercase text-[9px]">Type *</label>
                          <select value={oppForm.opportunity_type} onChange={(e) => setOppForm({...oppForm, opportunity_type: e.target.value})} className="w-full border border-primary-gold/20 rounded-lg p-2 focus:outline-none focus:border-deep-rose">
                            <option value="livelihood">Livelihood</option>
                            <option value="employment">Employment</option>
                            <option value="entrepreneurship">Entrepreneurship</option>
                            <option value="gig">Local Gig</option>
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[#7D7061] uppercase text-[9px]">Location *</label>
                          <input type="text" value={oppForm.location} onChange={(e) => setOppForm({...oppForm, location: e.target.value})} className="w-full border border-primary-gold/20 rounded-lg p-2 focus:outline-none focus:border-deep-rose" required />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[#7D7061] uppercase text-[9px]">Compensation</label>
                          <input type="text" value={oppForm.compensation} onChange={(e) => setOppForm({...oppForm, compensation: e.target.value})} className="w-full border border-primary-gold/20 rounded-lg p-2 focus:outline-none focus:border-deep-rose" />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[#7D7061] uppercase text-[9px]">Required Skills (Comma-separated list)</label>
                        <input type="text" placeholder="e.g. Sewing, Bookkeeping" value={oppForm.required_skills} onChange={(e) => setOppForm({...oppForm, required_skills: e.target.value})} className="w-full border border-primary-gold/20 rounded-lg p-2 focus:outline-none focus:border-deep-rose" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[#7D7061] uppercase text-[9px]">Eligibility Critera *</label>
                          <input type="text" placeholder="e.g. Basic tailoring completed" value={oppForm.eligibility} onChange={(e) => setOppForm({...oppForm, eligibility: e.target.value})} className="w-full border border-primary-gold/20 rounded-lg p-2 focus:outline-none focus:border-deep-rose" required />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[#7D7061] uppercase text-[9px]">Deadline (e.g. 2026-12-31) *</label>
                          <input type="text" value={oppForm.deadline} onChange={(e) => setOppForm({...oppForm, deadline: e.target.value})} className="w-full border border-primary-gold/20 rounded-lg p-2 focus:outline-none focus:border-deep-rose" required />
                        </div>
                      </div>
                      <div className="pt-2 flex items-center justify-end space-x-3 border-t border-primary-gold/10">
                        <button type="button" onClick={() => setShowOppModal(false)} className="px-5 py-2 rounded-full border border-primary-gold/20 text-[#7D7061] uppercase text-[10px] tracking-wider cursor-pointer hover:bg-cream/40 transition">Cancel</button>
                        <button type="submit" className="px-6 py-2 rounded-full bg-gradient-to-r from-deep-rose to-primary-pink text-white uppercase text-[10px] tracking-widest cursor-pointer shadow-md hover:shadow-lg transition">Publish Opportunity</button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================================================== */}
          {/* TAB 6: APPLICATIONS TRACKING */}
          {/* ========================================================================================== */}
          {activeTab === 'applications' && (
            <div className="space-y-6">
              <div className="bg-white border border-primary-gold/15 p-4 rounded-xl flex flex-col md:flex-row gap-4 items-center justify-between shadow-sm">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-deep-gold">Tracking Filters</span>
                <div className="flex w-full md:w-auto items-center gap-4">
                  <select 
                    value={appStatusFilter} 
                    onChange={(e) => setAppStatusFilter(e.target.value)}
                    className="border border-primary-gold/20 rounded-lg text-xs font-semibold px-3 py-2 focus:outline-none focus:border-deep-rose"
                  >
                    <option value="">All Statuses</option>
                    <option value="Applied">Applied</option>
                    <option value="Under Review">Under Review</option>
                    <option value="Shortlisted">Shortlisted</option>
                    <option value="Accepted">Accepted</option>
                    <option value="Rejected">Rejected</option>
                    <option value="Withdrawn">Withdrawn</option>
                  </select>
                  <select 
                    value={appOppFilter} 
                    onChange={(e) => setAppOppFilter(e.target.value)}
                    className="border border-primary-gold/20 rounded-lg text-xs font-semibold px-3 py-2 focus:outline-none focus:border-deep-rose"
                  >
                    <option value="">All Opportunities</option>
                    {oppsList.map(o => <option key={o.id} value={o.id}>{o.title}</option>)}
                  </select>
                </div>
              </div>

              {loadingApps ? (
                <div className="text-center py-12 bg-white rounded-xl border border-primary-gold/15 shadow-sm">
                  <RefreshCw className="h-8 w-8 text-deep-gold animate-spin mx-auto mb-2" />
                  <p className="text-xs font-bold text-[#7D7061] uppercase tracking-wider">Syncing Applications Registry...</p>
                </div>
              ) : appsList.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl border border-primary-gold/15 shadow-sm text-xs font-bold text-[#7D7061] uppercase tracking-wider">
                  No submissions recorded for opportunities.
                </div>
              ) : (
                <div className="bg-white border border-primary-gold/15 rounded-xl shadow-sm overflow-hidden">
                  <table className="w-full border-collapse text-left">
                    <thead>
                      <tr className="bg-cream/40 border-b border-primary-gold/10 text-[10px] uppercase tracking-wider font-extrabold text-[#7D7061]">
                        <th className="px-6 py-4">Candidate Name</th>
                        <th className="px-6 py-4">Applied Opportunity</th>
                        <th className="px-6 py-4">Timeline / Date</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-primary-gold/10 text-xs">
                      {appsList.map((app) => (
                        <tr key={app.id} className="hover:bg-cream/10">
                          <td className="px-6 py-4 font-bold text-[#2D241A]">{app.learner_name}</td>
                          <td className="px-6 py-4">
                            <div className="font-bold text-[#2D241A]">{app.opportunity_title}</div>
                            <div className="text-[10px] text-[#7D7061] font-semibold">ID: {app.opportunity_id}</div>
                          </td>
                          <td className="px-6 py-4 text-[#7D7061] font-semibold">{app.applied_at ? new Date(app.applied_at).toLocaleDateString() : 'N/A'}</td>
                          <td className="px-6 py-4">
                            <span className={`inline-block px-2.5 py-1 rounded-full text-[9px] font-extrabold uppercase tracking-wider border ${app.status === 'Accepted' ? 'bg-[#E8F5E9] text-[#2E7D32] border-[#2E7D32]/20' : app.status === 'Rejected' ? 'bg-soft-rose text-deep-rose border-soft-rose/30' : 'bg-soft-yellow/80 text-[#5D4037] border-[#5D4037]/20'}`}>
                              {app.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <select
                              value={app.status}
                              onChange={(e) => handleUpdateAppStatus(app.id, e.target.value)}
                              className="px-2 py-1 border border-primary-gold/20 rounded-lg text-[9px] font-bold uppercase tracking-wider text-[#7D7061]"
                            >
                              <option value="Applied">Applied</option>
                              <option value="Under Review">Under Review</option>
                              <option value="Shortlisted">Shortlisted</option>
                              <option value="Accepted">Accepted</option>
                              <option value="Rejected">Rejected</option>
                              <option value="Withdrawn">Withdrawn</option>
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ========================================================================================== */}
          {/* TAB 7: PLATFORM ANALYTICS & AI INSIGHTS */}
          {/* ========================================================================================== */}
          {activeTab === 'analytics' && (
            <div className="space-y-6 flex-grow flex flex-col">
              {/* Header section with Language Selector */}
              <section className="rounded-2xl bg-white border border-primary-gold/15 p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-sm">
                <div className="space-y-2">
                  <span className="inline-block px-3.5 py-1 rounded-full bg-soft-yellow text-deep-gold text-[9px] font-extrabold uppercase tracking-wider border border-primary-gold/20">DETERMINISTIC ANALYTICS CONTROL</span>
                  <h2 className="font-serif text-2xl font-extrabold text-[#2D241A]">Platform-Wide Metrics</h2>
                  <p className="text-xs text-[#7D7061] font-semibold">Real-time database statistics and AI-assisted explanatory interpretations.</p>
                </div>
                
                <div className="flex items-center gap-3 self-stretch md:self-auto bg-cream/40 border border-primary-gold/10 p-2.5 rounded-xl">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#7D7061] shrink-0">AI Language:</span>
                  <select 
                    value={aiLang} 
                    onChange={(e) => {
                      setAiLang(e.target.value);
                      fetchAIInsights(e.target.value);
                    }}
                    className="border border-primary-gold/20 bg-white rounded-lg text-xs font-semibold px-3 py-1.5 focus:outline-none focus:border-deep-rose"
                  >
                    <option value="en">English</option>
                    <option value="kn">ಕನ್ನಡ (Kannada)</option>
                    <option value="hi">हिंदी (Hindi)</option>
                  </select>
                  <button 
                    onClick={() => {
                      fetchPlatformAnalytics();
                      fetchAIInsights(aiLang);
                    }}
                    title="Refresh Data"
                    className="p-1.5 hover:bg-cream rounded-lg text-deep-gold transition cursor-pointer"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </button>
                </div>
              </section>

              {loadingAnalytics ? (
                <div className="flex-grow flex flex-col items-center justify-center p-12 bg-white rounded-2xl border border-primary-gold/15 shadow-sm min-h-[300px]">
                  <RefreshCw className="h-10 w-10 text-deep-gold animate-spin mb-4" />
                  <p className="text-xs text-[#7D7061] font-bold uppercase tracking-widest">Aggregating Platform Database Statistics...</p>
                </div>
              ) : errorAnalytics ? (
                <div className="flex-grow flex items-center justify-center p-8 bg-white border border-primary-gold/15 rounded-2xl shadow-sm min-h-[300px]">
                  <div className="max-w-md text-center space-y-4">
                    <AlertCircle className="h-12 w-12 mx-auto text-deep-rose" />
                    <h3 className="font-serif text-lg font-bold text-[#2D241A] uppercase tracking-wider">Analytics Query Failed</h3>
                    <p className="text-xs text-[#7D7061] leading-relaxed font-semibold">{errorAnalytics}</p>
                    <button onClick={fetchPlatformAnalytics} className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-deep-rose to-primary-pink text-white text-xs font-bold uppercase tracking-widest px-6 py-3 shadow-md hover:shadow-lg transition cursor-pointer">Retry Loading Analytics</button>
                  </div>
                </div>
              ) : analyticsMetrics && (
                <div className="space-y-6">
                  {/* Verified Database Metrics Cards */}
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#7D7061] block border-b border-primary-gold/10 pb-2">✓ Verified Database Statistics</span>
                  
                  {/* Cards Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* User Distribution */}
                    <div className="p-5 bg-white rounded-2xl border border-primary-gold/15 shadow-sm space-y-3">
                      <span className="text-[9px] uppercase font-bold text-[#7D7061] tracking-widest">Registered Accounts</span>
                      <div className="text-3xl font-extrabold text-[#2D241A] font-mono">{analyticsMetrics.users.total}</div>
                      <div className="space-y-1 pt-1.5 border-t border-primary-gold/5 text-[11px] text-[#7D7061] font-semibold">
                        <div className="flex justify-between"><span>Learners:</span> <span className="font-bold text-[#2D241A]">{analyticsMetrics.users.learners}</span></div>
                        <div className="flex justify-between"><span>Hubs:</span> <span className="font-bold text-[#2D241A]">{analyticsMetrics.users.centres}</span></div>
                        <div className="flex justify-between"><span>Admins:</span> <span className="font-bold text-[#2D241A]">{analyticsMetrics.users.admins}</span></div>
                      </div>
                    </div>

                    {/* Learning progress */}
                    <div className="p-5 bg-white rounded-2xl border border-primary-gold/15 shadow-sm space-y-3">
                      <span className="text-[9px] uppercase font-bold text-[#7D7061] tracking-widest">Vocational Training</span>
                      <div className="text-3xl font-extrabold text-[#2D241A] font-mono">{analyticsMetrics.learning.total_enrollments}</div>
                      <div className="space-y-1 pt-1.5 border-t border-primary-gold/5 text-[11px] text-[#7D7061] font-semibold">
                        <div className="flex justify-between"><span>Total Courses:</span> <span className="font-bold text-[#2D241A]">{analyticsMetrics.learning.total_courses}</span></div>
                        <div className="flex justify-between"><span>Completed:</span> <span className="font-bold text-[#2D241A]">{analyticsMetrics.learning.completed_enrollments}</span></div>
                        <div className="flex justify-between"><span>Completion Rate:</span> <span className="font-bold text-deep-rose">{analyticsMetrics.learning.completion_rate}%</span></div>
                      </div>
                    </div>

                    {/* Opportunities */}
                    <div className="p-5 bg-white rounded-2xl border border-primary-gold/15 shadow-sm space-y-3">
                      <span className="text-[9px] uppercase font-bold text-[#7D7061] tracking-widest">Livelihoods Base</span>
                      <div className="text-3xl font-extrabold text-[#2D241A] font-mono">{analyticsMetrics.opportunities.total_opportunities}</div>
                      <div className="space-y-1 pt-1.5 border-t border-primary-gold/5 text-[11px] text-[#7D7061] font-semibold">
                        <div className="flex justify-between"><span>Active listings:</span> <span className="font-bold text-[#2D241A]">{analyticsMetrics.opportunities.active_opportunities}</span></div>
                        <div className="flex justify-between"><span>Total Applications:</span> <span className="font-bold text-[#2D241A]">{analyticsMetrics.opportunities.total_applications}</span></div>
                        <div className="flex justify-between"><span>App Ratio:</span> <span className="font-bold text-[#2D241A]">{(analyticsMetrics.opportunities.total_opportunities > 0 ? (analyticsMetrics.opportunities.total_applications / analyticsMetrics.opportunities.total_opportunities).toFixed(1) : 0)} / listing</span></div>
                      </div>
                    </div>

                    {/* Training centres active */}
                    <div className="p-5 bg-white rounded-2xl border border-primary-gold/15 shadow-sm space-y-3">
                      <span className="text-[9px] uppercase font-bold text-[#7D7061] tracking-widest">Coaching Hubs</span>
                      <div className="text-3xl font-extrabold text-[#2D241A] font-mono">{analyticsMetrics.centres.total}</div>
                      <div className="space-y-1 pt-1.5 border-t border-primary-gold/5 text-[11px] text-[#7D7061] font-semibold">
                        <div className="flex justify-between"><span>Active Classrooms:</span> <span className="font-bold text-[#2D241A]">{analyticsMetrics.centres.active}</span></div>
                        <div className="flex justify-between"><span>Average Progress:</span> <span className="font-bold text-deep-gold">{analyticsMetrics.learning.average_progress}%</span></div>
                        <div className="flex justify-between"><span>Operational rate:</span> <span className="font-bold text-[#2D241A]">{analyticsMetrics.centres.total > 0 ? Math.round((analyticsMetrics.centres.active / analyticsMetrics.centres.total) * 100) : 0}%</span></div>
                      </div>
                    </div>
                  </div>

                  {/* Distribution Visualizations */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Application Status Distribution */}
                    <div className="p-6 bg-white rounded-2xl border border-primary-gold/15 shadow-sm space-y-4">
                      <h4 className="font-serif text-sm font-bold text-[#2D241A] uppercase tracking-wider">Application Status Distribution</h4>
                      <div className="space-y-3 pt-2">
                        {Object.entries(analyticsMetrics.applications.status_distribution).map(([statusName, count]: any) => {
                          const percentage = analyticsMetrics.applications.total > 0 
                            ? Math.round((count / analyticsMetrics.applications.total) * 100) 
                            : 0;
                          return (
                            <div key={statusName} className="space-y-1 text-xs">
                              <div className="flex justify-between font-semibold text-[#7D7061]">
                                <span>{statusName}</span>
                                <span>{count} ({percentage}%)</span>
                              </div>
                              <div className="w-full bg-cream rounded-full h-2">
                                <div 
                                  className="bg-deep-rose h-2 rounded-full transition-all duration-500" 
                                  style={{ width: `${percentage}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Learner Distribution per Centre */}
                    <div className="p-6 bg-white rounded-2xl border border-primary-gold/15 shadow-sm space-y-4">
                      <h4 className="font-serif text-sm font-bold text-[#2D241A] uppercase tracking-wider">Coaching Hub Registration Distribution</h4>
                      <div className="space-y-3 pt-2 max-h-[250px] overflow-y-auto divide-y divide-primary-gold/5">
                        {analyticsMetrics.centres.learner_distribution.length === 0 ? (
                          <div className="text-center py-6 text-xs font-semibold text-[#7D7061] uppercase">No centres registered.</div>
                        ) : analyticsMetrics.centres.learner_distribution.map((dist: any) => (
                          <div key={dist.centre_id} className="flex justify-between items-center py-2.5 text-xs">
                            <span className="font-semibold text-[#2D241A]">{dist.centre_name}</span>
                            <span className="inline-block px-3 py-1 rounded-full bg-cream text-[#2D241A] font-extrabold font-mono">{dist.learner_count} learners</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* AI Interpretations (Phase 6.15) */}
                  <div className="border border-primary-pink/25 bg-gradient-to-br from-white to-primary-pink/5 rounded-2xl p-6 shadow-sm space-y-4">
                    <div className="flex items-center justify-between border-b border-primary-pink/15 pb-3">
                      <div className="flex items-center space-x-2">
                        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-deep-rose to-primary-pink text-xs font-bold text-white shadow-sm">
                          <Sparkles className="h-4 w-4 text-white" />
                        </span>
                        <h3 className="font-serif text-base font-extrabold text-[#2D241A]">AI-Generated Interpretations &amp; Suggestions</h3>
                      </div>
                      <span className="inline-flex items-center gap-1.5 text-[8px] font-extrabold uppercase tracking-widest text-deep-rose bg-soft-rose/30 px-2.5 py-1 rounded-full border border-deep-rose/10">
                        ⚠️ Responsible AI Context
                      </span>
                    </div>

                    <p className="text-[11px] text-[#7D7061] font-semibold leading-relaxed">
                      <strong>Note:</strong> This interpretation layer is generated automatically via Gemini AI. It acts strictly as an analytical guide to highlight platform trends and is completely separate from the verified factual database metrics displayed above. No sensitive inferences or consequential individual decisions are automated.
                    </p>

                    {loadingAI ? (
                      <div className="py-8 flex flex-col items-center justify-center space-y-3">
                        <RefreshCw className="h-6 w-6 text-deep-rose animate-spin" />
                        <span className="text-[10px] font-extrabold uppercase tracking-widest text-deep-rose">Gemini deep researching platform metrics...</span>
                      </div>
                    ) : aiInsights ? (
                      <div className="text-xs text-[#2D241A] leading-relaxed whitespace-pre-line space-y-2 bg-white/50 border border-primary-gold/10 p-4 rounded-xl font-medium prose max-w-none">
                        {aiInsights}
                      </div>
                    ) : (
                      <div className="text-xs font-bold text-[#7D7061] uppercase tracking-wider py-4 text-center">No insights could be loaded. Try refreshing or changing languages.</div>
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
