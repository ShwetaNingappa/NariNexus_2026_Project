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
  Plus,
  BookOpen,
  Award,
  ChevronRight,
  Clock,
  Sparkles,
  Edit2,
  Trash2,
  ToggleLeft,
  ToggleRight,
  User,
  Globe,
  BarChart3,
  TrendingUp
} from 'lucide-react';
import { useAuth } from '../services/authContext';
import { api } from '../services/api';

export default function CentreCourses() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Search & Filter State
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Course registry state
  const [courses, setCourses] = useState<any[]>([]);
  const [skills, setSkills] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Active Course Details State
  const [activeCourseId, setActiveCourseId] = useState<string | null>(null);
  const [courseDetails, setCourseDetails] = useState<any>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);

  // Form Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Course Form Inputs
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formSkillId, setFormSkillId] = useState('');
  const [formCategoryId, setFormCategoryId] = useState('');
  const [formDifficulty, setFormDifficulty] = useState('beginner');
  const [formDuration, setFormDuration] = useState('4 Weeks');
  const [formLearningMode, setFormLearningMode] = useState('online');
  const [formInstructor, setFormInstructor] = useState('');
  const [formLanguage, setFormLanguage] = useState('en');
  const [formStatus, setFormStatus] = useState('active');

  // New Training Mode Fields
  const [formVideos, setFormVideos] = useState<Array<{ title: string, youtube_url: string, description: string, order: number }>>([]);
  const [formAddress, setFormAddress] = useState('');
  const [formCity, setFormCity] = useState('');
  const [formDistrict, setFormDistrict] = useState('');
  const [formState, setFormState] = useState('');
  const [formPincode, setFormPincode] = useState('');
  const [formLatitude, setFormLatitude] = useState('');
  const [formLongitude, setFormLongitude] = useState('');

  // Load static catalog lists and center profile
  useEffect(() => {
    async function loadCatalog() {
      try {
        const [skillsRes, catsRes] = await Promise.all([
          api.get('/api/skills'),
          api.get('/api/categories')
        ]);

        if (skillsRes.data?.success) setSkills(skillsRes.data.skills);
        if (catsRes.data?.success) setCategories(catsRes.data.categories);
      } catch (err) {
        console.error('Error loading core catalogs:', err);
      }

      try {
        const profileRes = await api.get('/api/centres/me');
        if (profileRes.data?.success) setProfile(profileRes.data.profile);
      } catch (err: any) {
        if (err.response?.status === 404) {
          setProfile(null);
        } else {
          console.error('Error loading centre profile:', err);
        }
      } finally {
        setProfileLoaded(true);
      }
    }
    loadCatalog();
  }, []);

  // Fetch courses list
  const loadCourses = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/api/centres/courses');
      if (res.data && res.data.success) {
        setCourses(res.data.courses || []);
      }
    } catch (err: any) {
      if (err.response?.status === 404) {
        setCourses([]);
      } else {
        console.error('Error loading courses:', err);
        setError(err.response?.data?.detail || 'Failed to load courses database.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCourses();
  }, []);

  // Fetch course details when selected
  useEffect(() => {
    if (!activeCourseId) {
      setCourseDetails(null);
      return;
    }

    async function loadCourseDetails() {
      try {
        setDetailsLoading(true);
        setDetailsError(null);
        const res = await api.get(`/api/centres/courses/${activeCourseId}`);
        if (res.data && res.data.success) {
          setCourseDetails(res.data.course);
        }
      } catch (err: any) {
        console.error('Error loading course details:', err);
        setDetailsError(err.response?.data?.detail || 'Failed to fetch course details.');
      } finally {
        setDetailsLoading(false);
      }
    }

    loadCourseDetails();
  }, [activeCourseId]);

  const userInitials = user?.name
    ? user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().substring(0, 2)
    : 'KC';

  const isCurrentPath = (path: string) => location.pathname === path;

  // Toggle active/inactive state of a course
  const handleToggleStatus = async (courseId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'active' ? 'inactive' : 'active';
    try {
      const res = await api.patch(`/api/centres/courses/${courseId}/status`, { status: nextStatus });
      if (res.data?.success) {
        // Refresh local listings and active details
        setCourses(prev => prev.map(c => c.id === courseId ? { ...c, status: nextStatus, is_active: nextStatus === 'active' } : c));
        if (activeCourseId === courseId) {
          setCourseDetails(prev => ({ ...prev, status: nextStatus, is_active: nextStatus === 'active' }));
        }
      }
    } catch (err: any) {
      console.error('Failed to change course status:', err);
      alert(err.response?.data?.detail || 'Could not toggle course status.');
    }
  };

  // Open creation modal
  const openCreateModal = () => {
    setEditingCourseId(null);
    setFormTitle('');
    setFormDescription('');
    setFormSkillId(skills[0]?.id || '');
    setFormCategoryId(categories[0]?.id || '');
    setFormDifficulty('beginner');
    setFormDuration('4 Weeks');
    setFormLearningMode('online');
    setFormInstructor(user?.name || '');
    setFormLanguage('en');
    setFormStatus('active');
    setFormVideos([]);
    setFormAddress('');
    setFormCity('');
    setFormDistrict('');
    setFormState('');
    setFormPincode('');
    setFormLatitude('');
    setFormLongitude('');
    setFormError(null);
    setModalOpen(true);
  };

  // Open edit modal
  const openEditModal = (course: any) => {
    setEditingCourseId(course.id);
    setFormTitle(course.title || '');
    setFormDescription(course.description || '');
    setFormSkillId(course.skill_id || '');
    setFormCategoryId(course.category_id || '');
    setFormDifficulty(course.difficulty || 'beginner');
    setFormDuration(course.duration || '4 Weeks');
    setFormLearningMode(course.learning_mode || 'online');
    setFormInstructor(course.instructor || '');
    setFormLanguage(course.language || 'en');
    setFormStatus(course.status || 'active');
    setFormVideos(course.online_training?.videos || []);
    setFormAddress(course.offline_training?.address || '');
    setFormCity(course.offline_training?.city || '');
    setFormDistrict(course.offline_training?.district || '');
    setFormState(course.offline_training?.state || '');
    setFormPincode(course.offline_training?.pincode || '');
    setFormLatitude(course.offline_training?.latitude !== undefined && course.offline_training?.latitude !== null ? String(course.offline_training.latitude) : '');
    setFormLongitude(course.offline_training?.longitude !== undefined && course.offline_training?.longitude !== null ? String(course.offline_training.longitude) : '');
    setFormError(null);
    setModalOpen(true);
  };

  const isValidYouTubeUrl = (url: string) => {
    return /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/.test(url);
  };

  // Handle form submission (both create and update)
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      setFormError('Course Title is required.');
      return;
    }
    if (formDescription.length < 10) {
      setFormError('Description must be at least 10 characters long.');
      return;
    }
    if (!formSkillId) {
      setFormError('Please select an associated skill.');
      return;
    }
    if (!formCategoryId) {
      setFormError('Please select an associated category.');
      return;
    }

    const payload: any = {
      title: formTitle,
      description: formDescription,
      skill_id: formSkillId,
      category_id: formCategoryId,
      thumbnail: "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=600&q=80",
      difficulty: formDifficulty,
      duration: formDuration,
      learning_mode: formLearningMode,
      instructor: formInstructor,
      prerequisites: ["None"],
      career_outcomes: ["Local Livelihood Practitioner"],
      language: formLanguage,
      status: formStatus
    };

    if (formLearningMode === 'online' || formLearningMode === 'hybrid') {
      payload.online_training = {
        videos: formVideos.map((v, idx) => ({
          title: v.title,
          youtube_url: v.youtube_url,
          description: v.description || "",
          order: v.order || (idx + 1)
        }))
      };
    }

    if (formLearningMode === 'offline' || formLearningMode === 'hybrid') {
      payload.offline_training = {
        centre_name: profile?.centre_name || "NariNexus Women Skill Centre",
        address: formAddress,
        city: formCity,
        district: formDistrict,
        state: formState,
        pincode: formPincode,
        latitude: formLatitude ? parseFloat(formLatitude) : null,
        longitude: formLongitude ? parseFloat(formLongitude) : null
      };
    }

    try {
      setFormSubmitting(true);
      setFormError(null);

      if (editingCourseId) {
        // Update Course
        const res = await api.put(`/api/centres/courses/${editingCourseId}`, payload);
        if (res.data?.success) {
          setCourses(prev => prev.map(c => c.id === editingCourseId ? res.data.course : c));
          if (activeCourseId === editingCourseId) {
            setCourseDetails(res.data.course);
          }
          setModalOpen(false);
        }
      } else {
        // Create Course
        const res = await api.post('/api/centres/courses', payload);
        if (res.data?.success) {
          setCourses(prev => [...prev, res.data.course]);
          setActiveCourseId(res.data.course.id);
          setModalOpen(false);
        }
      }
    } catch (err: any) {
      console.error('Failed to save course:', err);
      setFormError(err.response?.data?.detail || 'An error occurred while saving the course file.');
    } finally {
      setFormSubmitting(false);
    }
  };

  // UI labels helper
  const getSkillLabel = (skillId: string) => {
    return skills.find(s => s.id === skillId)?.name || skillId;
  };

  const getCategoryLabel = (catId: string) => {
    return categories.find(c => c.id === catId)?.name || catId;
  };

  // Filtering Logic (Local)
  const filteredCourses = courses.filter(course => {
    const searchMatch = !search || 
      course.title?.toLowerCase().includes(search.toLowerCase()) || 
      course.description?.toLowerCase().includes(search.toLowerCase()) ||
      course.instructor?.toLowerCase().includes(search.toLowerCase());
    
    const statusMatch = !statusFilter || course.status === statusFilter;

    return searchMatch && statusMatch;
  });

  return (
    <div className="flex h-screen bg-cream overflow-hidden text-[#3D2D1E]" id="centre-courses-page">
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

      {/* Main Content Pane */}
      <div className="flex-grow flex flex-col overflow-y-auto">
        {/* Topbar */}
        <header className="h-16 border-b border-primary-gold/10 bg-white px-6 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center space-x-4">
            <button onClick={() => setSidebarOpen(true)} className="p-2 md:hidden text-[#7D7061] hover:bg-cream rounded-xl">
              <Menu className="h-5 w-5" />
            </button>
            <h1 className="font-serif text-lg font-bold text-[#2D241A] uppercase tracking-wider">Course Curriculum Management</h1>
          </div>

          <div className="flex items-center space-x-2.5">
            <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-deep-gold to-primary-gold flex items-center justify-center font-bold text-white border border-primary-gold/30 text-sm shadow-sm">
              {userInitials}
            </div>
            <div className="hidden sm:block text-left">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-[#2D241A]">{profile?.centre_name || user?.name}</span>
              <span className="block text-[9px] uppercase font-bold tracking-widest text-deep-rose">Center Partner</span>
            </div>
          </div>
        </header>

        {/* Dashboard Grid Content */}
        <main className="p-6 h-full flex flex-col gap-6 overflow-hidden">
          {profileLoaded && !profile ? (
            <div className="flex-grow flex items-center justify-center p-8 bg-white border border-primary-gold/15 rounded-2xl shadow-sm">
              <div className="max-w-md text-center space-y-4">
                <AlertTriangle className="h-12 w-12 mx-auto text-deep-gold" />
                <h3 className="font-serif text-lg font-bold text-[#2D241A] uppercase tracking-wider">Profile Setup Required</h3>
                <p className="text-xs text-[#7D7061] leading-relaxed font-semibold">
                  You must complete your Coaching Centre profile registration details before you can create, edit, or manage custom courses for candidates.
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
              {/* LEFT ZONE: Course Catalog Registry */}
          <div className={`flex flex-col flex-1 bg-white rounded-2xl border border-primary-gold/15 overflow-hidden ${activeCourseId ? 'hidden lg:flex max-w-sm xl:max-w-md' : 'w-full'}`}>
            
            {/* Filtering Header */}
            <div className="p-4 border-b border-primary-gold/10 space-y-3">
              <div className="relative">
                <Search className="absolute left-3.5 top-3 h-4 w-4 text-[#7D7061]" />
                <input 
                  type="text" 
                  placeholder="Search by course title, instructor..." 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-primary-gold/20 text-xs font-semibold focus:outline-none focus:border-deep-rose transition bg-cream/30"
                />
              </div>

              <div className="flex items-center justify-between gap-3">
                <select 
                  value={statusFilter} 
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 rounded-lg border border-primary-gold/20 text-[10px] font-bold bg-white text-[#7D7061] flex-1"
                >
                  <option value="">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="draft">Draft</option>
                </select>

                <button 
                  onClick={openCreateModal}
                  className="px-3 py-2 bg-gradient-to-r from-deep-rose to-primary-pink hover:opacity-90 rounded-xl text-white text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 transition shadow-sm cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Create Course</span>
                </button>
              </div>
            </div>

            {/* List Body */}
            <div className="flex-grow overflow-y-auto divide-y divide-primary-gold/10">
              {loading ? (
                <div className="p-8 text-center text-[#7D7061] text-xs font-semibold">
                  <div className="h-6 w-6 border-2 border-deep-rose border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  Loading courses curriculum...
                </div>
              ) : error ? (
                <div className="p-8 text-center text-deep-rose text-xs font-semibold">
                  <AlertTriangle className="h-6 w-6 mx-auto mb-2 text-deep-rose/80" />
                  {error}
                </div>
              ) : filteredCourses.length === 0 ? (
                <div className="p-12 text-center text-[#7D7061] text-xs font-medium space-y-2">
                  <BookOpen className="h-8 w-8 mx-auto mb-2 text-primary-gold/30" />
                  <p className="font-bold">No courses offering yet.</p>
                  <p className="text-[11px] text-[#7D7061]/80 leading-relaxed px-4">
                    Get started by designing and creating your first professional training course curriculum.
                  </p>
                  <button 
                    onClick={openCreateModal}
                    className="mt-3 px-4 py-2 bg-cream hover:bg-soft-yellow/40 text-[#3D2D1E] rounded-lg font-bold border border-primary-gold/20 text-[10px]"
                  >
                    Add Your First Course
                  </button>
                </div>
              ) : (
                filteredCourses.map((course) => (
                  <button
                    key={course.id}
                    onClick={() => setActiveCourseId(course.id)}
                    className={`w-full text-left p-4 hover:bg-cream/40 transition flex items-center justify-between border-l-2 ${
                      activeCourseId === course.id 
                        ? 'bg-cream/70 border-deep-rose' 
                        : 'border-transparent'
                    }`}
                  >
                    <div className="space-y-1.5 min-w-0 pr-2">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-serif text-sm font-bold text-[#2D241A] truncate">{course.title}</h4>
                      </div>
                      
                      {/* Zero-Pill Meta styling */}
                      <div className="flex items-center gap-1.5 text-[10px] text-[#7D7061] font-semibold truncate">
                        <span className="font-mono text-[9px] capitalize text-deep-gold">{course.difficulty}</span>
                        <span aria-hidden="true" className="text-primary-gold/40">·</span>
                        <span>{course.duration || 'Flexible'}</span>
                        <span aria-hidden="true" className="text-primary-gold/40">·</span>
                        <span className="font-bold">{course.learning_mode?.toUpperCase()}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2.5 flex-shrink-0">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                        course.status === 'active' 
                          ? 'bg-sage-green/30 text-green-800' 
                          : course.status === 'inactive'
                          ? 'bg-deep-rose/10 text-deep-rose'
                          : 'bg-soft-yellow/40 text-amber-800'
                      }`}>
                        {course.status || (course.is_active ? 'active' : 'inactive')}
                      </span>
                      <ChevronRight className={`h-4.5 w-4.5 text-primary-gold/50 transition-transform ${activeCourseId === course.id ? 'translate-x-1 text-deep-rose' : ''}`} />
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* RIGHT ZONE: Course Details View */}
          <div className={`flex-[2] bg-white rounded-2xl border border-primary-gold/15 overflow-hidden flex flex-col ${!activeCourseId ? 'hidden lg:flex items-center justify-center text-center p-8 bg-cream/10 border-dashed' : 'w-full animate-fadeIn'}`}>
            {!activeCourseId ? (
              <div className="space-y-3 max-w-sm">
                <GraduationCap className="h-12 w-12 mx-auto text-primary-gold/25" />
                <h3 className="font-serif text-base font-bold text-[#2D241A] uppercase tracking-wider">Course File</h3>
                <p className="text-xs text-[#7D7061] leading-relaxed font-semibold">
                  Select an active or draft course from your list to verify, edit curriculum parameters, or toggle platform publication.
                </p>
              </div>
            ) : detailsLoading ? (
              <div className="flex-grow flex flex-col items-center justify-center p-12 text-[#7D7061] text-xs font-semibold">
                <div className="h-8 w-8 border-2 border-deep-rose border-t-transparent rounded-full animate-spin mb-3" />
                Retrieving course dossier...
              </div>
            ) : detailsError ? (
              <div className="flex-grow flex flex-col items-center justify-center p-8 text-center text-deep-rose text-xs font-semibold">
                <AlertTriangle className="h-8 w-8 mb-3 text-deep-rose/85" />
                {detailsError}
                <button 
                  onClick={() => setActiveCourseId(null)}
                  className="mt-4 px-4 py-2 bg-cream text-[#3D2D1E] rounded-lg font-bold border border-primary-gold/20"
                >
                  Close Dossier
                </button>
              </div>
            ) : !courseDetails ? null : (
              <div className="flex-grow flex flex-col h-full overflow-hidden">
                {/* Header */}
                <div className="p-5 border-b border-primary-gold/10 bg-cream/20 flex items-center justify-between">
                  <div className="flex items-center space-x-3.5 min-w-0">
                    <button 
                      onClick={() => setActiveCourseId(null)}
                      className="p-1.5 hover:bg-cream rounded-xl text-[#7D7061] hover:text-[#2D241A] transition lg:hidden animate-bounce"
                    >
                      <ArrowLeft className="h-5 w-5" />
                    </button>
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center space-x-2.5 min-w-0">
                        <h2 className="font-serif text-base sm:text-lg font-extrabold text-[#2D241A] truncate">{courseDetails.title}</h2>
                        <span className={`flex-shrink-0 text-[9px] uppercase font-bold tracking-widest bg-soft-rose/30 px-2 py-0.5 rounded ${
                          courseDetails.status === 'active' 
                            ? 'bg-sage-green/30 text-green-800' 
                            : 'bg-deep-rose/10 text-deep-rose'
                        }`}>{courseDetails.status || 'Active'}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] text-[#7D7061] font-bold uppercase tracking-wider">
                        <span>Instructor: {courseDetails.instructor}</span>
                        <span aria-hidden="true" className="text-primary-gold/40">·</span>
                        <span>Language: {courseDetails.language?.toUpperCase()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 flex-shrink-0">
                    <button 
                      onClick={() => openEditModal(courseDetails)}
                      className="p-2 hover:bg-cream rounded-xl text-deep-gold hover:text-[#2D241A] transition flex items-center gap-1.5 text-xs font-bold cursor-pointer"
                      title="Edit Course"
                    >
                      <Edit2 className="h-4.5 w-4.5" />
                      <span className="hidden sm:inline">Edit</span>
                    </button>
                    <button 
                      onClick={() => handleToggleStatus(courseDetails.id, courseDetails.status)}
                      className={`p-2 rounded-xl transition flex items-center gap-1.5 text-xs font-bold cursor-pointer ${
                        courseDetails.status === 'active' 
                          ? 'text-deep-rose hover:bg-soft-rose/15' 
                          : 'text-green-700 hover:bg-sage-green/20'
                      }`}
                      title={courseDetails.status === 'active' ? 'Deactivate' : 'Activate'}
                    >
                      {courseDetails.status === 'active' ? (
                        <>
                          <ToggleRight className="h-5 w-5 text-green-600" />
                          <span className="hidden sm:inline">Published</span>
                        </>
                      ) : (
                        <>
                          <ToggleLeft className="h-5 w-5 text-[#7D7061]" />
                          <span className="hidden sm:inline">Draft</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Body details scroll */}
                <div className="flex-grow overflow-y-auto p-6 space-y-6">
                  
                  {/* Row blocks */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    
                    {/* Block 1: Curricular Context */}
                    <div className="p-5 rounded-2xl bg-cream/15 border border-primary-gold/10 space-y-3.5">
                      <div className="flex items-center space-x-2 text-deep-gold">
                        <Award className="h-4 w-4" />
                        <h3 className="text-xs uppercase font-extrabold tracking-widest">Platform Syllabus</h3>
                      </div>
                      <div className="space-y-2 text-xs font-semibold">
                        <div className="flex justify-between py-1 border-b border-primary-gold/5">
                          <span className="text-[#7D7061]">Core Category:</span>
                          <span className="text-[#2D241A] font-bold">{getCategoryLabel(courseDetails.category_id)}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-primary-gold/5">
                          <span className="text-[#7D7061]">Skill Target:</span>
                          <span className="text-[#2D241A] font-bold">{getSkillLabel(courseDetails.skill_id)}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-primary-gold/5">
                          <span className="text-[#7D7061]">Estimated Duration:</span>
                          <span className="text-[#2D241A]">{courseDetails.duration || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-primary-gold/5">
                          <span className="text-[#7D7061]">Difficulty Level:</span>
                          <span className="text-deep-gold capitalize font-bold">{courseDetails.difficulty}</span>
                        </div>
                        <div className="flex justify-between py-1">
                          <span className="text-[#7D7061]">Mode of Education:</span>
                          <span className="text-deep-rose font-bold uppercase">{courseDetails.learning_mode}</span>
                        </div>
                      </div>
                    </div>

                    {/* Block 2: Meta Profile */}
                    <div className="p-5 rounded-2xl bg-cream/15 border border-primary-gold/10 space-y-3.5">
                      <div className="flex items-center space-x-2 text-deep-gold">
                        <Globe className="h-4 w-4" />
                        <h3 className="text-xs uppercase font-extrabold tracking-widest">Course Delivery</h3>
                      </div>
                      <div className="space-y-3 text-xs font-semibold text-[#3D2D1E]">
                        <div className="space-y-1">
                          <span className="text-[10px] uppercase font-bold text-[#7D7061] tracking-wider block">Lead Instructor / Expert:</span>
                          <p className="font-bold text-[#2D241A] leading-relaxed flex items-center gap-1.5">
                            <User className="h-4 w-4 text-[#7D7061]" />
                            {courseDetails.instructor || 'Unassigned Partner'}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <span className="text-[10px] uppercase font-bold text-[#7D7061] tracking-wider block">Instructional Language:</span>
                          <p className="font-bold text-[#2D241A] leading-relaxed">
                            {courseDetails.language === 'en' ? 'English' : courseDetails.language === 'kn' ? 'ಕನ್ನಡ (Kannada)' : 'हिन्दी (Hindi)'}
                          </p>
                        </div>
                      </div>
                    </div>

                  </div>

                  {/* Course Description */}
                  <div className="p-5 rounded-2xl bg-white border border-primary-gold/15 space-y-3 shadow-sm">
                    <h3 className="text-xs uppercase font-extrabold tracking-widest text-[#2D241A]">Syllabus Description</h3>
                    <p className="text-xs text-[#7D7061] leading-relaxed font-semibold">
                      {courseDetails.description}
                    </p>
                  </div>

                </div>
              </div>
            )}
          </div>

            </div>
          )}
        </main>
      </div>

      {/* Course Create / Edit Modal Form */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn" role="dialog" aria-modal="true">
          <div className="bg-white rounded-2xl border border-primary-gold/15 w-full max-w-lg overflow-hidden flex flex-col shadow-2xl max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-primary-gold/10 bg-cream/15 flex items-center justify-between">
              <h3 className="font-serif text-base font-bold text-[#2D241A] uppercase tracking-wider">
                {editingCourseId ? 'Modify Course details' : 'Publish New Course'}
              </h3>
              <button 
                onClick={() => setModalOpen(false)}
                className="p-1 hover:bg-cream rounded-xl text-[#7D7061] hover:text-[#2D241A] transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmitForm} className="p-6 overflow-y-auto space-y-4 text-xs font-semibold">
              {formError && (
                <div className="p-3 bg-soft-rose/20 text-deep-rose border border-deep-rose/10 rounded-xl text-[11px] font-bold flex items-center gap-2">
                  <AlertTriangle className="h-4.5 w-4.5 flex-shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Title Input */}
              <div className="space-y-1.5">
                <label className="block text-[#2D241A] uppercase text-[10px] tracking-wider font-extrabold">Course Title*</label>
                <input 
                  type="text" 
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. Basic Sewing Alterations & Needlework"
                  className="w-full px-4 py-2.5 rounded-xl border border-primary-gold/20 focus:outline-none focus:border-deep-rose bg-cream/20 text-[#3D2D1E] font-bold"
                  required
                />
              </div>

              {/* Description Input */}
              <div className="space-y-1.5">
                <label className="block text-[#2D241A] uppercase text-[10px] tracking-wider font-extrabold">Description* (Min. 10 chars)</label>
                <textarea 
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Provide an overview of the modules, practical assignments, and outcomes..."
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-xl border border-primary-gold/20 focus:outline-none focus:border-deep-rose bg-cream/20 text-[#3D2D1E] font-medium"
                  required
                />
              </div>

              {/* Skill & Category Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-[#2D241A] uppercase text-[10px] tracking-wider font-extrabold">Category Group*</label>
                  <select 
                    value={formCategoryId}
                    onChange={(e) => setFormCategoryId(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-primary-gold/20 bg-cream/10 text-xs font-bold text-[#3D2D1E]"
                    required
                  >
                    <option value="" disabled>Select Category</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[#2D241A] uppercase text-[10px] tracking-wider font-extrabold">Skill Target*</label>
                  <select 
                    value={formSkillId}
                    onChange={(e) => setFormSkillId(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-primary-gold/20 bg-cream/10 text-xs font-bold text-[#3D2D1E]"
                    required
                  >
                    <option value="" disabled>Select Skill</option>
                    {skills.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Grid 2: Level, Duration, Learning Mode */}
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-[#2D241A] uppercase text-[10px] tracking-wider font-extrabold">Difficulty Level</label>
                  <select 
                    value={formDifficulty}
                    onChange={(e) => setFormDifficulty(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-primary-gold/20 bg-cream/10 text-[#3D2D1E]"
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[#2D241A] uppercase text-[10px] tracking-wider font-extrabold">Duration</label>
                  <input 
                    type="text" 
                    value={formDuration}
                    onChange={(e) => setFormDuration(e.target.value)}
                    placeholder="e.g. 4 Weeks"
                    className="w-full px-3 py-2 rounded-xl border border-primary-gold/20 bg-cream/10 text-[#3D2D1E]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[#2D241A] uppercase text-[10px] tracking-wider font-extrabold">Mode</label>
                  <select 
                    value={formLearningMode}
                    onChange={(e) => setFormLearningMode(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-primary-gold/20 bg-cream/10 text-[#3D2D1E]"
                  >
                    <option value="online">Online</option>
                    <option value="offline">Offline</option>
                    <option value="hybrid">Hybrid</option>
                  </select>
                </div>
              </div>

              {/* Expert / Instructor Input */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-[#2D241A] uppercase text-[10px] tracking-wider font-extrabold">Lead Instructor*</label>
                  <input 
                    type="text" 
                    value={formInstructor}
                    onChange={(e) => setFormInstructor(e.target.value)}
                    placeholder="Instructor name"
                    className="w-full px-4 py-2 rounded-xl border border-primary-gold/20 bg-cream/10 text-[#3D2D1E]"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[#2D241A] uppercase text-[10px] tracking-wider font-extrabold">Language</label>
                  <select 
                    value={formLanguage}
                    onChange={(e) => setFormLanguage(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-primary-gold/20 bg-cream/10 text-[#3D2D1E]"
                  >
                    <option value="en">English</option>
                    <option value="kn">Kannada</option>
                    <option value="hi">Hindi</option>
                  </select>
                </div>
              </div>

              {/* Online Section (YouTube Videos) */}
              {(formLearningMode === 'online' || formLearningMode === 'hybrid') && (
                <div className="space-y-3.5 border border-dashed border-primary-gold/30 rounded-2xl p-4.5 bg-cream/10 text-left">
                  <div className="flex justify-between items-center">
                    <label className="block text-emerald-800 uppercase text-[10px] tracking-wider font-extrabold flex items-center gap-1.5">
                      <span>🎥</span> YouTube Videos ({formVideos.length})
                    </label>
                  </div>
                  
                  {/* Videos List */}
                  {formVideos.length > 0 && (
                    <div className="space-y-2.5 max-h-48 overflow-y-auto mb-3">
                      {formVideos.map((video, idx) => (
                        <div key={idx} className="flex justify-between items-start gap-2 bg-white border border-primary-gold/10 p-2.5 rounded-xl shadow-xs">
                          <div className="min-w-0 flex-1">
                            <p className="font-bold text-[11px] text-[#2D241A] truncate">{video.title}</p>
                            <p className="font-mono text-[9px] text-[#7D7061] truncate">{video.youtube_url}</p>
                          </div>
                          <button 
                            type="button"
                            onClick={() => {
                              setFormVideos(prev => prev.filter((_, i) => i !== idx));
                            }}
                            className="text-deep-rose hover:text-red-700 text-[10px] font-bold shrink-0 cursor-pointer"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add Video Mini-Form */}
                  <div className="bg-white border border-primary-gold/10 rounded-xl p-3 space-y-2.5">
                    <p className="font-serif text-[10px] uppercase font-bold text-deep-gold tracking-wide">Add Video Lesson</p>
                    <div className="space-y-1">
                      <input 
                        type="text" 
                        id="new-video-title"
                        placeholder="Video Lesson Title (e.g. Lesson 1: Intro)"
                        className="w-full px-3 py-1.5 border border-primary-gold/15 rounded-lg text-[10px] font-bold focus:outline-none focus:border-deep-rose bg-[#FCF9F5]"
                      />
                    </div>
                    <div className="space-y-1">
                      <input 
                        type="text" 
                        id="new-video-url"
                        placeholder="YouTube Video URL (e.g. https://www.youtube.com/watch?v=...)"
                        className="w-full px-3 py-1.5 border border-primary-gold/15 rounded-lg text-[10px] font-bold focus:outline-none focus:border-deep-rose bg-[#FCF9F5]"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const titleEl = document.getElementById('new-video-title') as HTMLInputElement;
                        const urlEl = document.getElementById('new-video-url') as HTMLInputElement;
                        const title = titleEl?.value.trim();
                        const url = urlEl?.value.trim();
                        if (!title || !url) {
                          alert("Please fill both Video Title and YouTube URL.");
                          return;
                        }
                        if (!isValidYouTubeUrl(url)) {
                          alert("Please provide a valid YouTube URL (e.g. https://www.youtube.com/watch?v=...)");
                          return;
                        }
                        setFormVideos(prev => [...prev, { title, youtube_url: url, description: "", order: prev.length + 1 }]);
                        if (titleEl) titleEl.value = "";
                        if (urlEl) urlEl.value = "";
                      }}
                      className="px-3.5 py-1.5 bg-cream hover:bg-cream/80 text-[#3D2D1E] rounded-lg font-bold border border-primary-gold/20 text-[10px] transition cursor-pointer block w-full text-center"
                    >
                      + Add Lesson Video
                    </button>
                  </div>
                </div>
              )}

              {/* Offline Section (Training Centre Location) */}
              {(formLearningMode === 'offline' || formLearningMode === 'hybrid') && (
                <div className="space-y-3.5 border border-dashed border-primary-gold/30 rounded-2xl p-4.5 bg-cream/10 text-left">
                  <label className="block text-amber-900 uppercase text-[10px] tracking-wider font-extrabold flex items-center gap-1.5">
                    <span>📍</span> Offline Training Centre Location
                  </label>
                  
                  <div className="space-y-1.5">
                    <label className="block text-[#7D7061] text-[9px] uppercase tracking-wide">Physical Address*</label>
                    <input 
                      type="text" 
                      value={formAddress}
                      onChange={(e) => setFormAddress(e.target.value)}
                      placeholder="e.g. 12, Women Skill Development Road, Yelahanka"
                      className="w-full px-3 py-2 rounded-xl border border-primary-gold/15 focus:outline-none focus:border-deep-rose bg-white text-[#3D2D1E]"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="block text-[#7D7061] text-[9px] uppercase tracking-wide">City*</label>
                      <input 
                        type="text" 
                        value={formCity}
                        onChange={(e) => setFormCity(e.target.value)}
                        placeholder="e.g. Bengaluru"
                        className="w-full px-3 py-2 rounded-xl border border-primary-gold/15 focus:outline-none focus:border-deep-rose bg-white text-[#3D2D1E]"
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-[#7D7061] text-[9px] uppercase tracking-wide">District*</label>
                      <input 
                        type="text" 
                        value={formDistrict}
                        onChange={(e) => setFormDistrict(e.target.value)}
                        placeholder="e.g. Bengaluru Urban"
                        className="w-full px-3 py-2 rounded-xl border border-primary-gold/15 focus:outline-none focus:border-deep-rose bg-white text-[#3D2D1E]"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-1.5 col-span-2">
                      <label className="block text-[#7D7061] text-[9px] uppercase tracking-wide">State*</label>
                      <input 
                        type="text" 
                        value={formState}
                        onChange={(e) => setFormState(e.target.value)}
                        placeholder="e.g. Karnataka"
                        className="w-full px-3 py-2 rounded-xl border border-primary-gold/15 focus:outline-none focus:border-deep-rose bg-white text-[#3D2D1E]"
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-[#7D7061] text-[9px] uppercase tracking-wide">Pincode*</label>
                      <input 
                        type="text" 
                        value={formPincode}
                        onChange={(e) => setFormPincode(e.target.value)}
                        placeholder="e.g. 560064"
                        className="w-full px-3 py-2 rounded-xl border border-primary-gold/15 focus:outline-none focus:border-deep-rose bg-white text-[#3D2D1E]"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="block text-[#7D7061] text-[9px] uppercase tracking-wide">Latitude (Optional)</label>
                      <input 
                        type="number" 
                        step="0.0001"
                        value={formLatitude}
                        onChange={(e) => setFormLatitude(e.target.value)}
                        placeholder="e.g. 13.1007"
                        className="w-full px-3 py-2 rounded-xl border border-primary-gold/15 focus:outline-none focus:border-deep-rose bg-white text-[#3D2D1E]"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-[#7D7061] text-[9px] uppercase tracking-wide">Longitude (Optional)</label>
                      <input 
                        type="number" 
                        step="0.0001"
                        value={formLongitude}
                        onChange={(e) => setFormLongitude(e.target.value)}
                        placeholder="e.g. 77.5963"
                        className="w-full px-3 py-2 rounded-xl border border-primary-gold/15 focus:outline-none focus:border-deep-rose bg-white text-[#3D2D1E]"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Status input */}
              <div className="space-y-1.5">
                <label className="block text-[#2D241A] uppercase text-[10px] tracking-wider font-extrabold">Publication status</label>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-1.5 font-bold cursor-pointer">
                    <input 
                      type="radio" 
                      name="formStatus" 
                      value="active"
                      checked={formStatus === 'active'}
                      onChange={() => setFormStatus('active')}
                      className="text-deep-rose"
                    />
                    <span>Active (Publish directly)</span>
                  </label>
                  <label className="flex items-center gap-1.5 font-bold cursor-pointer">
                    <input 
                      type="radio" 
                      name="formStatus" 
                      value="inactive"
                      checked={formStatus === 'inactive' || formStatus === 'draft'}
                      onChange={() => setFormStatus('inactive')}
                      className="text-deep-rose"
                    />
                    <span>Keep as Draft (Unpublished)</span>
                  </label>
                </div>
              </div>

              {/* Form Buttons */}
              <div className="pt-4 border-t border-primary-gold/10 flex justify-end gap-3.5">
                <button 
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2.5 bg-cream hover:bg-cream/70 text-[#3D2D1E] rounded-xl font-bold border border-primary-gold/15 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={formSubmitting}
                  className="px-5 py-2.5 bg-gradient-to-r from-deep-rose to-primary-pink hover:opacity-90 disabled:opacity-50 text-white rounded-xl font-bold uppercase tracking-wider transition shadow-sm cursor-pointer"
                >
                  {formSubmitting ? 'Saving Course...' : 'Save Course Curriculum'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}
