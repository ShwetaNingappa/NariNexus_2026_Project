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
  Briefcase, 
  GraduationCap, 
  ArrowRight, 
  Sparkle,
  BookOpen,
  Filter,
  RefreshCw,
  X,
  Compass
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../services/authContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

interface Category {
  id: string;
  name: string;
  description: string;
  icon: string;
  image?: string;
  is_active: boolean;
}

interface Skill {
  id: string;
  category_id: string;
  name: string;
  description: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  estimated_duration: string;
  prerequisites: string[];
  career_options: string[];
  is_active: boolean;
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

export default function SkillsCataloguePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [recommendedSkills, setRecommendedSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(null);

  useEffect(() => {
    fetchCatalogueData();
  }, [selectedCategory, selectedDifficulty]);

  const fetchCatalogueData = async () => {
    setLoading(true);
    setError(null);
    try {
      const headers = {
        Authorization: `Bearer ${localStorage.getItem('narinexus_token')}`
      };

      // 1. Fetch categories
      const catRes = await api.get('/api/categories', { headers });
      if (catRes.data.success) {
        setCategories(catRes.data.categories);
      }

      // 2. Fetch skills with filter queries
      let skillsUrl = '/api/skills';
      const params: string[] = [];
      if (selectedCategory) params.push(`category=${selectedCategory}`);
      if (selectedDifficulty) params.push(`difficulty=${selectedDifficulty}`);
      if (searchQuery.trim()) params.push(`search=${encodeURIComponent(searchQuery.trim())}`);
      
      if (params.length > 0) {
        skillsUrl += `?${params.join('&')}`;
      }

      const skillsRes = await api.get(skillsUrl, { headers });
      if (skillsRes.data.success) {
        setSkills(skillsRes.data.skills);
      }

      // 3. Fetch recommended skills
      const recRes = await api.get('/api/skills/recommendations', { headers });
      if (recRes.data.success) {
        setRecommendedSkills(recRes.data.skills);
      }

    } catch (err: any) {
      console.error('Failed to load skill catalogue:', err);
      setError('Failed to load catalogue. Please check your network connection.');
    } finally {
      setLoading(false);
    }
  };

  // Perform search submission
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCatalogueData();
  };

  // Reset all filters
  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCategory(null);
    setSelectedDifficulty(null);
  };

  // Difficulty badge color styling
  const getDifficultyStyles = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner':
        return 'bg-sage-green/15 text-green-800 border-green-200/40';
      case 'Intermediate':
        return 'bg-soft-yellow/40 text-[#B37000] border-primary-gold/15';
      case 'Advanced':
        return 'bg-light-pink text-deep-rose border-soft-rose/50';
      default:
        return 'bg-[#7D7061]/10 text-[#7D7061] border-transparent';
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#FCF9F5] text-[#2D241A] font-sans antialiased" id="skills-catalog-container">
      <Navbar />

      {/* Header Banner */}
      <section className="bg-cream border-b border-primary-gold/10 py-12 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="md:flex md:items-center md:justify-between">
            <div className="max-w-3xl">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-light-pink px-3 py-1 text-xs font-bold uppercase tracking-widest text-deep-rose border border-soft-rose/40">
                <Compass className="h-3.5 w-3.5 animate-pulse" />
                <span>NariNexus Academy</span>
              </span>
              <h1 className="mt-4 font-serif text-3xl font-extrabold tracking-tight sm:text-4xl text-[#3D2D1E]">
                Explore Skills Catalogue
              </h1>
              <p className="mt-3 text-base text-[#7D7061] max-w-2xl leading-relaxed">
                Empower your journey with highly specialized, data-driven offline, online, and hybrid skill training. Choose from traditional trades to cutting-edge digital literacy programs designed for women entrepreneurs and local leaders.
              </p>
            </div>
            
            <div className="mt-6 md:mt-0 flex flex-wrap gap-3">
              <Link
                to="/learner"
                className="inline-flex items-center gap-2 justify-center rounded-full bg-white border border-primary-gold/20 hover:border-primary-pink px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-[#7D7061] hover:text-primary-pink transition-all shadow-sm"
              >
                <span>Back to Dashboard</span>
              </Link>
              <Link
                to="/learner/courses"
                className="inline-flex items-center gap-2 justify-center rounded-full bg-gradient-to-r from-deep-rose to-primary-pink hover:from-primary-pink hover:to-deep-rose px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-white shadow-sm hover:shadow-md transition-all transform hover:-translate-y-0.5 cursor-pointer"
              >
                <span>Explore Courses</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>

          {/* Search Box */}
          <form onSubmit={handleSearchSubmit} className="mt-8 max-w-2xl" id="skills-search-form">
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                <Search className="h-5 w-5 text-deep-gold/60" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search skills by name, career options, description..."
                className="block w-full rounded-2xl border border-primary-gold/25 bg-white py-4 pl-12 pr-28 text-sm placeholder-[#A09384] text-[#3D2D1E] focus:outline-none focus:ring-2 focus:ring-primary-pink focus:border-transparent shadow-sm transition duration-300"
              />
              <div className="absolute inset-y-1.5 right-1.5 flex gap-2">
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setTimeout(fetchCatalogueData, 50);
                    }}
                    className="p-2 text-xs font-semibold text-[#7D7061] hover:text-[#3D2D1E] cursor-pointer"
                  >
                    Clear
                  </button>
                )}
                <button
                  type="submit"
                  className="rounded-xl bg-deep-gold hover:bg-deep-gold/90 px-5 py-2 text-xs font-bold uppercase tracking-widest text-white transition-colors duration-300 cursor-pointer shadow-sm"
                >
                  Search
                </button>
              </div>
            </div>
          </form>
        </div>
      </section>

      {/* Content Section */}
      <main className="flex-grow mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        
        {/* Dynamic Personalization Layer: "Recommended for you" */}
        {recommendedSkills.length > 0 && !selectedCategory && !selectedDifficulty && !searchQuery && (
          <section className="mb-12 bg-cream/65 border border-primary-gold/15 rounded-3xl p-6 sm:p-8" id="personalized-recommendations">
            <div className="flex items-center gap-2.5 mb-6">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-light-pink text-deep-rose shadow-sm">
                <Sparkle className="h-4 w-4 animate-spin" />
              </span>
              <div>
                <h2 className="font-serif text-lg sm:text-xl font-bold text-[#3D2D1E]">
                  Personalized For You
                </h2>
                <p className="text-xs text-[#7D7061]">
                  Preliminary recommendation based on your profile interests, existing skills, and career goals.
                </p>
              </div>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {recommendedSkills.map((skill) => (
                <div 
                  key={skill.id} 
                  className="group relative flex flex-col justify-between rounded-2xl border border-primary-gold/15 bg-white p-5 hover:shadow-md transition-all duration-300"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-extrabold uppercase tracking-widest text-deep-gold bg-soft-yellow/30 border border-primary-gold/10 px-2.5 py-1 rounded-full">
                        {skill.category_id.replace('-', ' ')}
                      </span>
                      <span className={`text-[10px] font-extrabold uppercase tracking-widest border px-2.5 py-1 rounded-full ${getDifficultyStyles(skill.difficulty)}`}>
                        {skill.difficulty}
                      </span>
                    </div>

                    <h3 className="mt-4 text-base font-bold text-[#3D2D1E] group-hover:text-primary-pink transition-colors">
                      {skill.name}
                    </h3>
                    <p className="mt-2 text-xs text-[#7D7061] line-clamp-3 leading-relaxed">
                      {skill.description}
                    </p>

                    <div className="mt-4 space-y-2">
                      <div className="flex items-center gap-1.5 text-xs text-[#7D7061]">
                        <Clock className="h-3.5 w-3.5 text-primary-gold shrink-0" />
                        <span>Estimated: <strong>{skill.estimated_duration}</strong></span>
                      </div>
                      {skill.career_options.length > 0 && (
                        <div className="flex items-start gap-1.5 text-xs text-[#7D7061]">
                          <Briefcase className="h-3.5 w-3.5 text-primary-gold mt-0.5 shrink-0" />
                          <span className="line-clamp-1">
                            Career: <strong>{skill.career_options[0]}</strong>
                          </span>
                        </div>
                      )}
                    </div>

                    {/* AI-Personalized Guidance Segment */}
                    {((skill as any).reason || (skill as any).benefit || (skill as any).next_step) && (
                      <div className="mt-4 p-3 bg-cream/40 border border-primary-gold/10 rounded-xl space-y-2">
                        {(skill as any).reason && (
                          <div>
                            <span className="text-[9px] uppercase font-extrabold tracking-widest text-[#6B8E6F] block">Why Recommended:</span>
                            <span className="text-[11px] text-[#3D2D1E] font-medium leading-normal block">{(skill as any).reason}</span>
                          </div>
                        )}
                        {(skill as any).benefit && (
                          <div>
                            <span className="text-[9px] uppercase font-extrabold tracking-widest text-[#6B8E6F] block">Your Livelihood Benefit:</span>
                            <span className="text-[11px] text-[#7D7061] leading-normal block">{(skill as any).benefit}</span>
                          </div>
                        )}
                        {(skill as any).next_step && (
                          <div className="pt-1.5 border-t border-primary-gold/10">
                            <span className="text-[9px] uppercase font-extrabold tracking-widest text-[#6B8E6F] block">Suggested Action:</span>
                            <span className="text-[11px] text-deep-rose font-bold block">{(skill as any).next_step}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="mt-5 pt-3 border-t border-[#FCF9F5]">
                    <button
                      onClick={() => navigate(`/learner/skills/${skill.id}`)}
                      className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-[#FCF9F5] border border-primary-gold/10 hover:border-primary-pink py-2 text-xs font-bold text-[#7D7061] hover:text-primary-pink transition-all cursor-pointer"
                    >
                      <span>View Details</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        <div className="lg:flex lg:gap-8">
          {/* Side Filters Sidebar */}
          <aside className="lg:w-64 shrink-0 mb-8 lg:mb-0">
            <div className="sticky top-20 bg-cream/40 border border-primary-gold/10 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-primary-gold/10">
                <div className="flex items-center gap-2 font-bold text-[#3D2D1E] text-sm uppercase tracking-wider">
                  <Filter className="h-4 w-4 text-primary-gold" />
                  <span>Filters</span>
                </div>
                {(selectedCategory || selectedDifficulty || searchQuery) && (
                  <button
                    onClick={handleResetFilters}
                    className="text-xs font-bold text-deep-rose hover:text-primary-pink cursor-pointer"
                  >
                    Reset All
                  </button>
                )}
              </div>

              {/* Difficulty Filter */}
              <div className="mb-6">
                <h4 className="text-xs font-bold uppercase tracking-widest text-[#7D7061] mb-2.5">
                  Difficulty
                </h4>
                <div className="space-y-1.5">
                  {['Beginner', 'Intermediate', 'Advanced'].map((diff) => (
                    <button
                      key={diff}
                      onClick={() => setSelectedDifficulty(selectedDifficulty === diff ? null : diff)}
                      className={`flex w-full items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                        selectedDifficulty === diff
                          ? 'bg-light-pink border-soft-rose/50 text-deep-rose shadow-sm'
                          : 'bg-white border-primary-gold/5 text-[#7D7061] hover:bg-[#FCF9F5] hover:border-primary-gold/20'
                      }`}
                    >
                      <span>{diff}</span>
                      {selectedDifficulty === diff && <span className="h-1.5 w-1.5 rounded-full bg-deep-rose" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Categories Sidebar Selection */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-widest text-[#7D7061] mb-2.5">
                  Skill Domain
                </h4>
                <div className="space-y-1.5">
                  <button
                    onClick={() => setSelectedCategory(null)}
                    className={`flex w-full items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                      selectedCategory === null
                        ? 'bg-light-pink border-soft-rose/50 text-deep-rose shadow-sm'
                        : 'bg-white border-primary-gold/5 text-[#7D7061] hover:bg-[#FCF9F5] hover:border-primary-gold/20'
                    }`}
                  >
                    <span>All Domains</span>
                    {selectedCategory === null && <span className="h-1.5 w-1.5 rounded-full bg-deep-rose" />}
                  </button>
                  
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(selectedCategory === cat.id ? null : cat.id)}
                      className={`flex w-full items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold border transition-all text-left cursor-pointer ${
                        selectedCategory === cat.id
                          ? 'bg-light-pink border-soft-rose/50 text-deep-rose shadow-sm'
                          : 'bg-white border-primary-gold/5 text-[#7D7061] hover:bg-[#FCF9F5] hover:border-primary-gold/20'
                      }`}
                    >
                      <span className="truncate">{cat.name}</span>
                      {selectedCategory === cat.id && <span className="h-1.5 w-1.5 rounded-full bg-deep-rose" />}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          {/* Main Grid Section */}
          <div className="flex-grow">
            
            {/* Category Cards Section */}
            {!selectedCategory && !selectedDifficulty && !searchQuery && (
              <section className="mb-10" id="categories-grid">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="font-serif text-xl font-bold text-[#3D2D1E]">
                    Explore Learning Domains
                  </h2>
                  <span className="text-xs font-bold text-deep-gold uppercase tracking-widest">
                    {categories.length} domains available
                  </span>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  {categories.map((cat) => {
                    const IconComponent = IconMap[cat.icon] || BookOpen;
                    return (
                      <div
                        key={cat.id}
                        onClick={() => setSelectedCategory(cat.id)}
                        className="group flex flex-col justify-between rounded-2xl border border-primary-gold/10 bg-white p-5 cursor-pointer hover:border-primary-pink hover:shadow-md transition-all duration-300"
                      >
                        <div className="flex items-start gap-4">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-soft-yellow/40 text-deep-gold shadow-sm group-hover:scale-105 transition-transform">
                            <IconComponent className="h-5 w-5" />
                          </div>
                          <div>
                            <h3 className="text-base font-bold text-[#3D2D1E] group-hover:text-deep-gold transition-colors">
                              {cat.name}
                            </h3>
                            <p className="mt-1 text-xs text-[#7D7061] line-clamp-2 leading-relaxed">
                              {cat.description}
                            </p>
                          </div>
                        </div>
                        <div className="mt-4 pt-3 border-t border-[#FCF9F5] flex items-center justify-between text-[11px] font-bold text-deep-gold group-hover:text-primary-pink transition-colors">
                          <span>View Skills in Domain</span>
                          <ArrowRight className="h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Skills Results List */}
            <section id="skills-list">
              <div className="flex items-center justify-between mb-5 pb-2 border-b border-[#FCF9F5]">
                <h2 className="font-serif text-xl font-bold text-[#3D2D1E]">
                  {selectedCategory 
                    ? `${categories.find(c => c.id === selectedCategory)?.name || 'Domain'} Skills` 
                    : searchQuery 
                      ? `Search Results for "${searchQuery}"`
                      : 'All Core Skills'}
                </h2>
                <span className="text-xs text-[#7D7061] font-medium bg-white px-3 py-1 rounded-full border border-primary-gold/10 shadow-sm">
                  Found <strong>{skills.length}</strong> {skills.length === 1 ? 'skill' : 'skills'}
                </span>
              </div>

              {loading ? (
                <div className="flex flex-col items-center justify-center py-12 bg-white rounded-2xl border border-primary-gold/5">
                  <RefreshCw className="h-8 w-8 animate-spin text-deep-gold mb-3" />
                  <span className="text-sm font-medium text-[#7D7061]">Loading Skill Catalogue...</span>
                </div>
              ) : error ? (
                <div className="rounded-2xl border border-red-100 bg-red-50/50 p-6 text-center">
                  <p className="text-sm font-semibold text-red-800">{error}</p>
                  <button
                    onClick={fetchCatalogueData}
                    className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-red-800 hover:bg-red-900 px-4 py-2 text-xs font-bold uppercase text-white cursor-pointer"
                  >
                    Retry Loading
                  </button>
                </div>
              ) : skills.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 bg-white border border-primary-gold/10 rounded-2xl text-center px-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-soft-yellow/30 text-deep-gold mb-4">
                    <Search className="h-6 w-6" />
                  </div>
                  <h3 className="text-base font-bold text-[#3D2D1E]">No Skills Found</h3>
                  <p className="mt-1.5 text-xs text-[#7D7061] max-w-sm">
                    No active skills match your current filtering or query combination. Try resetting your filter state.
                  </p>
                  <button
                    onClick={handleResetFilters}
                    className="mt-5 inline-flex items-center gap-2 rounded-full bg-deep-gold hover:bg-deep-gold/90 px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-white shadow-sm transition-all cursor-pointer"
                  >
                    Reset Active Filters
                  </button>
                </div>
              ) : (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2">
                  {skills.map((skill) => (
                    <div
                      key={skill.id}
                      className="group flex flex-col justify-between rounded-2xl border border-primary-gold/10 bg-white p-5 hover:border-primary-pink/50 hover:shadow-md transition-all duration-300"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#7D7061] bg-[#FCF9F5] border border-primary-gold/10 px-2 py-0.5 rounded-md">
                            {skill.category_id.replace('-', ' ')}
                          </span>
                          <span className={`text-[10px] font-extrabold uppercase tracking-widest border px-2 py-0.5 rounded-md ${getDifficultyStyles(skill.difficulty)}`}>
                            {skill.difficulty}
                          </span>
                        </div>

                        <h3 className="mt-3.5 text-base font-bold text-[#3D2D1E] group-hover:text-primary-pink transition-colors">
                          {skill.name}
                        </h3>
                        <p className="mt-1.5 text-xs text-[#7D7061] leading-relaxed line-clamp-3">
                          {skill.description}
                        </p>

                        <div className="mt-4 grid grid-cols-2 gap-3 pt-3 border-t border-[#FCF9F5]">
                          <div className="flex items-center gap-1.5 text-xs text-[#7D7061]">
                            <Clock className="h-3.5 w-3.5 text-primary-gold shrink-0" />
                            <span className="truncate">Duration: <strong>{skill.estimated_duration}</strong></span>
                          </div>
                          {skill.career_options.length > 0 && (
                            <div className="flex items-center gap-1.5 text-xs text-[#7D7061]">
                              <Briefcase className="h-3.5 w-3.5 text-primary-gold shrink-0" />
                              <span className="truncate" title={skill.career_options.join(', ')}>
                                Job: <strong>{skill.career_options[0]}</strong>
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="mt-5 pt-3 border-t border-[#FCF9F5]">
                        <button
                          onClick={() => navigate(`/learner/skills/${skill.id}`)}
                          className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-cream hover:bg-soft-yellow/30 border border-primary-gold/15 hover:border-primary-pink py-2 text-xs font-bold text-[#7D7061] hover:text-primary-pink transition-all cursor-pointer"
                        >
                          <span>View Detail Syllabus</span>
                          <ArrowRight className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
