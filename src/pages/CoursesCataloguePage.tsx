import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Laptop, 
  Palette, 
  Sparkles, 
  UtensilsCrossed, 
  TrendingUp, 
  Sprout, 
  Scissors, 
  Heart, 
  Search, 
  Clock, 
  BookOpen, 
  Filter, 
  RefreshCw, 
  User, 
  ChevronRight, 
  GraduationCap, 
  Briefcase,
  Star
} from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

interface Course {
  id: string;
  title: string;
  description: string;
  skill_id: string;
  category_id: string;
  thumbnail: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration: string;
  learning_mode: 'online' | 'offline' | 'hybrid';
  instructor: string;
  prerequisites: string[];
  career_outcomes: string[];
  language: string;
  // Enhanced parent training centre delivery fields
  training_mode?: string;
  centre_name?: string;
  distance_km?: number | null;
  online_training?: {
    videos?: Array<{
      title: string;
      youtube_url: string;
      duration?: string;
      order?: number;
    }>;
  } | null;
  offline_training?: {
    address: string;
    city: string;
    district: string;
    state: string;
    pincode: string;
    available_days: string;
    start_time: string;
    end_time: string;
  } | null;
}

interface Category {
  id: string;
  name: string;
  description: string;
  icon: string;
}

interface Skill {
  id: string;
  name: string;
}

const IconMap: Record<string, React.ComponentType<any>> = {
  Laptop,
  Palette,
  Sparkles,
  UtensilsCrossed,
  TrendingUp,
  Sprout,
  Scissors,
  Heart
};

export default function CoursesCataloguePage() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
  const [recommendations, setRecommendations] = useState<Course[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  
  // Filters
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSkill, setSelectedSkill] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('');
  const [selectedMode, setSelectedMode] = useState('');

  // Enhanced geolocation and distance filtering states
  const [selectedSort, setSelectedSort] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedState, setSelectedState] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMetadataAndRecommendations();
  }, []);

  useEffect(() => {
    fetchFilteredCourses();
  }, [search, selectedCategory, selectedSkill, selectedDifficulty, selectedMode, selectedSort, selectedCity, selectedDistrict, selectedState]);

  const fetchMetadataAndRecommendations = async () => {
    try {
      const headers = {
        Authorization: `Bearer ${localStorage.getItem('narinexus_token')}`
      };

      // Fetch Categories
      const catRes = await fetch('/api/categories', { headers });
      if (catRes.ok) {
        const catData = await catRes.json();
        if (catData.success) setCategories(catData.categories);
      }

      // Fetch Skills
      const skillRes = await fetch('/api/skills', { headers });
      if (skillRes.ok) {
        const skillData = await skillRes.json();
        if (skillData.success) setSkills(skillData.skills);
      }

      // Fetch Personalized Recommendations
      const recRes = await fetch('/api/courses/recommendations', { headers });
      if (recRes.ok) {
        const recData = await recRes.json();
        if (recData.success) setRecommendations(recData.courses);
      }
    } catch (err) {
      console.error("Error loading catalogue metadata:", err);
    }
  };

  const fetchFilteredCourses = async () => {
    setLoading(true);
    setError(null);
    try {
      const headers = {
        Authorization: `Bearer ${localStorage.getItem('narinexus_token')}`
      };

      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (selectedCategory) params.append('category_id', selectedCategory);
      if (selectedSkill) params.append('skill_id', selectedSkill);
      if (selectedDifficulty) params.append('difficulty', selectedDifficulty);
      if (selectedMode) params.append('learning_mode', selectedMode);

      // Enhanced geolocated parameters
      if (selectedSort) params.append('sort', selectedSort);
      if (selectedCity) params.append('city', selectedCity);
      if (selectedDistrict) params.append('district', selectedDistrict);
      if (selectedState) params.append('state', selectedState);

      const res = await fetch(`/api/courses?${params.toString()}`, { headers });
      if (!res.ok) {
        if (res.status === 401) {
          throw new Error("Session expired. Please log in again.");
        }
        throw new Error("Failed to load courses catalogue.");
      }

      const data = await res.json();
      if (data.success) {
        setCourses(data.courses);
      } else {
        throw new Error(data.message || "Failed to load courses.");
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const resetFilters = () => {
    setSearch('');
    setSelectedCategory('');
    setSelectedSkill('');
    setSelectedDifficulty('');
    setSelectedMode('');
    setSelectedSort('');
    setSelectedCity('');
    setSelectedDistrict('');
    setSelectedState('');
  };

  const getDifficultyBadgeColor = (diff: string) => {
    switch (diff.toLowerCase()) {
      case 'beginner':
        return 'bg-sage/10 text-[#556B2F] border-sage/20';
      case 'intermediate':
        return 'bg-peach/10 text-[#C17A42] border-peach/20';
      case 'advanced':
        return 'bg-soft-rose/20 text-[#A3485E] border-soft-rose/30';
      default:
        return 'bg-cream text-[#7D7061] border-primary-gold/10';
    }
  };

  const getModeBadgeColor = (mode: string) => {
    switch (mode.toLowerCase()) {
      case 'online':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case 'offline':
        return 'bg-amber-50 text-amber-900 border-amber-200';
      case 'hybrid':
        return 'bg-blue-50 text-blue-800 border-blue-200';
      default:
        return 'bg-cream text-[#7D7061] border-primary-gold/10';
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-cream text-[#3D2D1E]" id="courses-catalogue-root">
      <Navbar />

      <main className="flex-grow max-w-7xl w-full mx-auto px-4 py-8 sm:px-6 lg:px-8 space-y-8">
        
        {/* Page Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <span className="text-xs uppercase font-extrabold tracking-widest text-deep-gold block">
            Skills &amp; Vocational Training Hub
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl font-black text-[#2D241A] tracking-tight">
            Discover Lifelong Learning and Enterprise Skills
          </h1>
          <p className="text-sm font-medium text-[#7D7061] leading-relaxed">
            Choose from high-quality, local language courses provided by verified coaching centres. Study online at your own pace, or join hands-on classes nearby.
          </p>
        </div>

        {/* Global Catalog Search Bar */}
        <div className="max-w-2xl mx-auto relative shadow-sm border border-primary-gold/15 rounded-2xl overflow-hidden bg-white">
          <input 
            type="text" 
            placeholder="Search tailoring, digital literacy, finance, food products, basic stitching..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-4 text-xs font-semibold bg-white text-[#2D241A] focus:outline-none"
          />
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-primary-gold/70" />
        </div>

        {/* Personalized Recommendations Section */}
        {recommendations.length > 0 && !search && (
          <div className="space-y-4">
            <h2 className="font-serif text-lg font-bold text-[#2D241A] flex items-center gap-1.5 justify-start">
              <Sparkles className="h-5 w-5 text-deep-gold" />
              <span>Recommended Courses For Your Profile</span>
            </h2>
            
            <div className="overflow-x-auto pb-4 scrollbar-thin">
              <div className="flex gap-6 w-max pr-4">
                {recommendations.map((course) => (
                  <div 
                    key={`rec-${course.id}`}
                    onClick={() => navigate(`/learner/courses/${course.id}`)}
                    className="w-80 bg-white border border-primary-gold/10 hover:border-primary-gold/30 rounded-2xl p-4 shadow-sm hover:shadow-md transition cursor-pointer flex flex-col group text-left"
                  >
                    <div className="h-32 rounded-xl overflow-hidden bg-cream mb-3.5 relative">
                      <img src={course.thumbnail} alt={course.title} referrerPolicy="no-referrer" className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
                      <span className={`absolute top-2 right-2 px-2 py-0.5 rounded text-[8px] font-extrabold uppercase border ${getModeBadgeColor(course.training_mode || course.learning_mode)}`}>
                        {course.training_mode || course.learning_mode}
                      </span>
                    </div>
                    <span className="text-[9px] uppercase tracking-widest font-extrabold text-[#C8870A] mb-1">
                      {course.centre_name || 'Partner Centre'}
                    </span>
                    <h3 className="text-sm font-bold text-[#2D241A] mb-1 line-clamp-1 group-hover:text-primary-gold transition">
                      {course.title}
                    </h3>
                    <p className="text-xs text-[#7D7061] line-clamp-2 mb-3 flex-grow">{course.description}</p>
                    
                    {course.distance_km !== null && course.distance_km !== undefined && (
                      <span className="text-[9px] text-[#2E7D32] bg-[#E2F0D9] font-bold px-2 py-0.5 rounded w-fit mb-2">
                        📍 Approx {course.distance_km} km away
                      </span>
                    )}

                    <div className="flex items-center justify-between text-[11px] font-medium text-[#7D7061] pt-2 border-t border-primary-gold/5">
                      <span>{course.duration}</span>
                      <span>By {course.instructor}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Filters and List */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Sidebar Filters */}
          <div className="lg:col-span-1 bg-white border border-primary-gold/10 rounded-2xl p-6 h-fit sticky top-6 text-left">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Filter className="h-4.5 w-4.5 text-primary-gold" />
                <h3 className="text-sm font-bold text-[#2D241A] uppercase tracking-wider">Filters</h3>
              </div>
              <button 
                onClick={resetFilters}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-primary-gold hover:text-[#2D241A] transition cursor-pointer"
              >
                <RefreshCw className="h-3 w-3" />
                <span>Reset</span>
              </button>
            </div>

            {/* Category Filter */}
            <div className="mb-4">
              <label className="block text-xs font-bold uppercase text-[#7D7061] mb-1.5">Category</label>
              <select 
                value={selectedCategory} 
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  setSelectedSkill(''); // reset skill since category changed
                }}
                className="w-full rounded-xl border border-primary-gold/10 bg-[#FCF9F5] p-2.5 text-xs text-[#2D241A] focus:outline-none focus:border-primary-gold transition font-semibold"
              >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            {/* Skill Filter */}
            <div className="mb-4">
              <label className="block text-xs font-bold uppercase text-[#7D7061] mb-1.5">Skill Area</label>
              <select 
                value={selectedSkill} 
                onChange={(e) => setSelectedSkill(e.target.value)}
                className="w-full rounded-xl border border-primary-gold/10 bg-[#FCF9F5] p-2.5 text-xs text-[#2D241A] focus:outline-none focus:border-primary-gold transition font-semibold"
              >
                <option value="">All Skills</option>
                {skills
                  .filter(s => !selectedCategory || (categories.find(c => c.id === selectedCategory) && s.id)) // rough filter helper
                  .map((sk) => (
                    <option key={sk.id} value={sk.id}>{sk.name}</option>
                  ))
                }
              </select>
            </div>

            {/* Difficulty Filter */}
            <div className="mb-4">
              <label className="block text-xs font-bold uppercase text-[#7D7061] mb-1.5">Difficulty</label>
              <select 
                value={selectedDifficulty} 
                onChange={(e) => setSelectedDifficulty(e.target.value)}
                className="w-full rounded-xl border border-primary-gold/10 bg-[#FCF9F5] p-2.5 text-xs text-[#2D241A] focus:outline-none focus:border-primary-gold transition font-semibold"
              >
                <option value="">All Levels</option>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>

            {/* Learning Mode Filter */}
            <div className="mb-4">
              <label className="block text-xs font-bold uppercase text-[#7D7061] mb-1.5">Learning Mode</label>
              <select 
                value={selectedMode} 
                onChange={(e) => setSelectedMode(e.target.value)}
                className="w-full rounded-xl border border-primary-gold/10 bg-[#FCF9F5] p-2.5 text-xs text-[#2D241A] focus:outline-none focus:border-primary-gold transition font-semibold"
              >
                <option value="">All Modes</option>
                <option value="online">Online</option>
                <option value="offline">Offline</option>
                <option value="hybrid">Hybrid</option>
              </select>
            </div>

            {/* Distance Sorting Option */}
            <div className="mb-4">
              <label className="block text-xs font-bold uppercase text-[#7D7061] mb-1.5">Geographic Distance</label>
              <select 
                value={selectedSort} 
                onChange={(e) => setSelectedSort(e.target.value)}
                className="w-full rounded-xl border border-primary-gold/10 bg-[#FCF9F5] p-2.5 text-xs text-[#2D241A] focus:outline-none focus:border-primary-gold transition font-semibold"
              >
                <option value="">None (Standard order)</option>
                <option value="nearest">Nearest Training Centres</option>
              </select>
            </div>

            {/* City Lookup Filter */}
            <div className="mb-4">
              <label className="block text-xs font-bold uppercase text-[#7D7061] mb-1.5">City Location</label>
              <input 
                type="text" 
                placeholder="e.g. Mysuru"
                value={selectedCity} 
                onChange={(e) => setSelectedCity(e.target.value)}
                className="w-full rounded-xl border border-primary-gold/10 bg-[#FCF9F5] p-2.5 text-xs text-[#2D241A] focus:outline-none focus:border-primary-gold transition font-semibold"
              />
            </div>
          </div>

          {/* Courses List Grid */}
          <div className="lg:col-span-3">
            {error && (
              <div className="p-4 bg-soft-rose/30 border border-deep-rose/20 rounded-2xl text-xs text-deep-rose font-medium text-left">
                {error}
              </div>
            )}

            {loading ? (
              <div className="text-center py-20 text-xs font-bold uppercase tracking-widest text-[#7D7061]">
                Syncing Course Database...
              </div>
            ) : courses.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-2xl border border-primary-gold/10 shadow-sm">
                <p className="text-sm font-bold text-[#7D7061] uppercase tracking-wider">No matching courses found</p>
                <p className="text-xs text-[#7D7061]/70 font-semibold mt-1">Try relaxing your search terms or location filters.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {courses.map((course) => (
                  <div 
                    key={course.id}
                    className="flex flex-col bg-white border border-primary-gold/10 rounded-2xl hover:border-primary-gold/40 hover:shadow-lg transition-all overflow-hidden group"
                  >
                    {/* Thumbnail banner */}
                    <div className="h-44 relative bg-cream overflow-hidden">
                      <img 
                        src={course.thumbnail} 
                        alt={course.title}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-[1.02] transition duration-500"
                      />
                      <div className="absolute top-3 left-3 flex gap-2">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider shadow-sm bg-white`}>
                          {categories.find(c => c.id === course.category_id)?.name || 'Course'}
                        </span>
                      </div>
                      <div className="absolute top-3 right-3 flex flex-col gap-1.5 items-end">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold border ${getModeBadgeColor(course.training_mode || course.learning_mode)} uppercase tracking-wider shadow-sm`}>
                          {course.training_mode || course.learning_mode}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold border ${getDifficultyBadgeColor(course.difficulty)} uppercase tracking-wider shadow-sm`}>
                          {course.difficulty}
                        </span>
                      </div>
                    </div>

                    {/* Card details */}
                    <div className="p-5 flex-grow flex flex-col">
                      <div className="flex items-center gap-1 text-[11px] font-bold text-primary-gold uppercase tracking-wider mb-1.5 text-left">
                        <BookOpen className="h-3 w-3" />
                        <span>{skills.find(s => s.id === course.skill_id)?.name || 'Learning Unit'}</span>
                      </div>
                      <h3 className="text-base font-extrabold text-[#2D241A] mb-2 leading-snug group-hover:text-primary-gold transition text-left">
                        {course.title}
                      </h3>
                      <p className="text-xs text-[#7D7061] line-clamp-3 mb-4 flex-grow leading-relaxed text-left">
                        {course.description}
                      </p>

                      <div className="flex flex-wrap items-center gap-y-2 justify-between text-xs font-semibold text-[#7D7061] border-t border-primary-gold/5 pt-3.5 mt-auto">
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5 text-primary-gold" />
                          <span>{course.duration}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <User className="h-3.5 w-3.5 text-primary-gold" />
                          <span>By {course.instructor}</span>
                        </div>
                      </div>

                      {/* Training Delivery Details Display for Learner */}
                      <div className="mt-4 pt-3 border-t border-primary-gold/5 text-[11px] font-semibold text-[#5D5041] space-y-2 text-left bg-[#FCF9F5] p-3.5 rounded-xl border border-primary-gold/5">
                        <div className="flex items-center justify-between text-[10px] text-deep-gold font-bold uppercase tracking-wider mb-0.5">
                          <span>Delivery Options</span>
                          <span className="bg-deep-gold/10 px-2 py-0.5 rounded text-[8px]">
                            {course.training_mode || course.learning_mode}
                          </span>
                        </div>
                        
                        {/* Parent Centre Name */}
                        <div className="text-[10px] text-[#2D241A] font-extrabold uppercase tracking-wider block">
                          🏫 {course.centre_name || 'NariNexus Partner Centre'}
                        </div>

                        {(course.training_mode === 'online' || course.training_mode === 'hybrid' || course.learning_mode === 'online' || course.learning_mode === 'hybrid') && (
                          <div className="flex items-center gap-1.5 text-[10px] text-emerald-700">
                            <span>🎥</span>
                            <span>{course.online_training?.videos?.length || 0} YouTube training lessons</span>
                          </div>
                        )}
                        
                        {(course.training_mode === 'offline' || course.training_mode === 'hybrid' || course.learning_mode === 'offline' || course.learning_mode === 'hybrid') && (
                          <div className="space-y-1.5 pt-1.5 border-t border-primary-gold/5">
                            <div className="flex items-center justify-between text-[10px] text-amber-800">
                              <span className="flex items-center gap-1">
                                <span>📍</span>
                                <span>{course.offline_training?.city || course.city || 'Mysuru'}, {course.offline_training?.state || course.state || 'Karnataka'}</span>
                              </span>
                              {course.distance_km !== null && course.distance_km !== undefined && (
                                <span className="bg-[#E2F0D9] text-[#2E7D32] px-1.5 py-0.5 rounded font-extrabold text-[8px] tracking-wider shrink-0">
                                  {course.distance_km} km away (approx)
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1 text-[9px] text-[#7D7061]">
                              <span>📅</span>
                              <span>{course.offline_training?.available_days || 'Mon–Fri'} ({course.offline_training?.start_time || '10:00 AM'} - {course.offline_training?.end_time || '1:00 PM'})</span>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="mt-4">
                        <Link 
                          to={`/learner/courses/${course.id}`}
                          className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-light-pink border border-soft-rose/30 hover:border-primary-pink py-2.5 text-xs font-bold text-deep-rose transition"
                        >
                          <span>View Course Structure</span>
                          <ChevronRight className="h-3.5 w-3.5" />
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </main>

      <Footer />
    </div>
  );
}
