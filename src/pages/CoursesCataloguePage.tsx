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
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMetadataAndRecommendations();
  }, []);

  useEffect(() => {
    fetchFilteredCourses();
  }, [search, selectedCategory, selectedSkill, selectedDifficulty, selectedMode]);

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
        return 'bg-blue-500/10 text-blue-700 border-blue-500/20';
      case 'offline':
        return 'bg-amber-500/10 text-amber-800 border-amber-500/20';
      case 'hybrid':
        return 'bg-emerald-500/10 text-emerald-800 border-emerald-500/20';
      default:
        return 'bg-cream text-[#7D7061] border-primary-gold/10';
    }
  };

  return (
    <div id="courses-catalogue-container" className="min-h-screen flex flex-col bg-[#FCF9F5] text-[#2D241A] font-sans">
      <Navbar />

      <main className="flex-grow max-w-7xl w-full mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8 text-center md:text-left">
          <h1 className="text-3xl font-extrabold text-[#2D241A] tracking-tight mb-2">Explore Learning Courses</h1>
          <p className="text-sm text-[#7D7061] max-w-2xl">
            Choose from high-quality offline classes at verified centers, convenient online modules, or hybrid skill-development courses.
          </p>
        </div>

        {/* Personalized recommendations */}
        {recommendations.length > 0 && (
          <div id="personalized-courses-shelf" className="mb-10 rounded-2xl bg-[#FFF8F0] border border-primary-gold/10 p-6 md:p-8">
            <div className="flex items-center gap-2 mb-4">
              <div className="rounded-full bg-primary-gold/10 p-1.5 text-primary-gold">
                <Star className="h-5 w-5 fill-current text-primary-gold" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-[#2D241A]">Recommended for You</h2>
                <p className="text-xs text-[#7D7061]">Preliminary suggestions matching your stated goals and language preferences.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {recommendations.map((course) => (
                <div 
                  key={`rec-${course.id}`} 
                  onClick={() => navigate(`/learner/courses/${course.id}`)}
                  className="flex flex-col bg-white rounded-xl border border-primary-gold/5 shadow-sm hover:shadow-md transition cursor-pointer overflow-hidden group"
                >
                  <div className="h-32 w-full relative overflow-hidden bg-cream">
                    <img 
                      src={course.thumbnail} 
                      alt={course.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                    <div className="absolute top-2 right-2 flex flex-col gap-1">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getModeBadgeColor(course.learning_mode)} uppercase`}>
                        {course.learning_mode}
                      </span>
                    </div>
                  </div>
                  <div className="p-4 flex-grow flex flex-col">
                    <span className="text-[10px] font-bold text-primary-gold uppercase mb-1">
                      {skills.find(s => s.id === course.skill_id)?.name || 'Course'}
                    </span>
                    <h3 className="text-sm font-bold text-[#2D241A] mb-1 line-clamp-1 group-hover:text-primary-gold transition">
                      {course.title}
                    </h3>
                    <p className="text-xs text-[#7D7061] line-clamp-2 mb-3 flex-grow">{course.description}</p>
                    <div className="flex items-center justify-between text-[11px] font-medium text-[#7D7061] pt-2 border-t border-primary-gold/5">
                      <span>{course.duration}</span>
                      <span>By {course.instructor}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Filters and List */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Sidebar Filters */}
          <div className="lg:col-span-1 bg-white border border-primary-gold/10 rounded-2xl p-6 h-fit sticky top-6">
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
                className="w-full rounded-xl border border-primary-gold/10 bg-[#FCF9F5] p-2.5 text-xs text-[#2D241A] focus:outline-none focus:border-primary-gold transition"
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
                className="w-full rounded-xl border border-primary-gold/10 bg-[#FCF9F5] p-2.5 text-xs text-[#2D241A] focus:outline-none focus:border-primary-gold transition"
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
                className="w-full rounded-xl border border-primary-gold/10 bg-[#FCF9F5] p-2.5 text-xs text-[#2D241A] focus:outline-none focus:border-primary-gold transition"
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
                className="w-full rounded-xl border border-primary-gold/10 bg-[#FCF9F5] p-2.5 text-xs text-[#2D241A] focus:outline-none focus:border-primary-gold transition"
              >
                <option value="">All Modes</option>
                <option value="online">Online</option>
                <option value="offline">Offline</option>
                <option value="hybrid">Hybrid</option>
              </select>
            </div>
          </div>

          {/* Core Catalogue Area */}
          <div className="lg:col-span-3">
            {/* Search Input */}
            <div className="relative mb-6">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-[#7D7061]" />
              <input 
                type="text" 
                placeholder="Search courses by title, keywords, or instructor..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-2xl border border-primary-gold/15 bg-white pl-11 pr-4 py-3 text-sm focus:outline-none focus:border-primary-gold shadow-sm transition"
              />
            </div>

            {/* Loading/Error state */}
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 text-[#7D7061]">
                <div className="h-7 w-7 animate-spin rounded-full border-2 border-primary-gold border-t-transparent mb-3" />
                <span className="text-xs font-medium">Fetching learning content...</span>
              </div>
            ) : error ? (
              <div className="bg-soft-rose/10 border border-soft-rose/30 text-deep-rose rounded-2xl p-6 text-center text-sm font-medium">
                {error}
              </div>
            ) : courses.length === 0 ? (
              <div className="bg-white border border-primary-gold/5 rounded-2xl p-12 text-center">
                <p className="text-sm font-bold text-[#2D241A] mb-1">No courses found matching filters</p>
                <p className="text-xs text-[#7D7061] mb-4">Try clearing active search queries or loosening selection properties.</p>
                <button 
                  onClick={resetFilters}
                  className="rounded-xl bg-light-pink border border-soft-rose/30 px-4 py-2 text-xs font-bold text-deep-rose hover:bg-soft-rose/10 transition cursor-pointer"
                >
                  Clear All Filters
                </button>
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
                        <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold border ${getModeBadgeColor(course.learning_mode)} uppercase tracking-wider shadow-sm`}>
                          {course.learning_mode}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold border ${getDifficultyBadgeColor(course.difficulty)} uppercase tracking-wider shadow-sm`}>
                          {course.difficulty}
                        </span>
                      </div>
                    </div>

                    {/* Card details */}
                    <div className="p-5 flex-grow flex flex-col">
                      <div className="flex items-center gap-1 text-[11px] font-bold text-primary-gold uppercase tracking-wider mb-1.5">
                        <BookOpen className="h-3 w-3" />
                        <span>{skills.find(s => s.id === course.skill_id)?.name || 'Learning Unit'}</span>
                      </div>
                      <h3 className="text-base font-extrabold text-[#2D241A] mb-2 leading-snug group-hover:text-primary-gold transition">
                        {course.title}
                      </h3>
                      <p className="text-xs text-[#7D7061] line-clamp-3 mb-4 flex-grow leading-relaxed">
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

                      {/* Learning Mode Instructions */}
                      <div className="mt-4 pt-3 border-t border-primary-gold/5 text-[11px] font-medium text-[#7D7061]">
                        {course.learning_mode === 'online' && (
                          <span className="text-emerald-700">✓ Digital course modules accessible immediately online.</span>
                        )}
                        {course.learning_mode === 'offline' && (
                          <span className="text-amber-800 font-bold">ℹ Available through verified training centres.</span>
                        )}
                        {course.learning_mode === 'hybrid' && (
                          <span className="text-blue-700">⚙ Online learning lectures + mandatory local centre sessions.</span>
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
