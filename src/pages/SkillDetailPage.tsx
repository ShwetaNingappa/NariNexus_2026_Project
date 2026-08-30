import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Clock, 
  Briefcase, 
  GraduationCap, 
  MapPin, 
  Award, 
  BookOpen, 
  CheckCircle, 
  Calendar, 
  Users,
  Building,
  HelpCircle,
  ChevronRight,
  RefreshCw,
  Sparkle
} from 'lucide-react';
import { api } from '../services/api';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

interface Category {
  id: string;
  name: string;
  description: string;
  icon: string;
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

export default function SkillDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [skill, setSkill] = useState<Skill | null>(null);
  const [category, setCategory] = useState<Category | null>(null);
  const [associatedCourses, setAssociatedCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [interestRegistered, setInterestRegistered] = useState(false);
  const [registering, setRegistering] = useState(false);

  useEffect(() => {
    fetchSkillDetail();
  }, [id]);

  const fetchSkillDetail = async () => {
    setLoading(true);
    setError(null);
    try {
      const headers = {
        Authorization: `Bearer ${localStorage.getItem('narinexus_token')}`
      };

      // 1. Fetch skill details
      const skillRes = await api.get(`/api/skills/${id}`, { headers });
      if (skillRes.data.success) {
        const skillData = skillRes.data.skill;
        setSkill(skillData);

        // 2. Fetch parent category details
        const catRes = await api.get(`/api/categories/${skillData.category_id}`, { headers });
        if (catRes.data.success) {
          setCategory(catRes.data.category);
        }

        // 3. Fetch associated courses
        const coursesRes = await api.get(`/api/skills/${id}/courses`, { headers });
        if (coursesRes.data.success) {
          setAssociatedCourses(coursesRes.data.courses);
        }
      } else {
        setError('Skill not found');
      }
    } catch (err: any) {
      console.error('Failed to load skill details:', err);
      setError('Failed to retrieve skill data. It may not exist or authorization has expired.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterInterest = () => {
    setRegistering(true);
    // Simulate a secure backend operation to save learner enrollment interest
    setTimeout(() => {
      setRegistering(false);
      setInterestRegistered(true);
    }, 800);
  };

  // Difficulty colors
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

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col bg-[#FCF9F5]">
        <Navbar />
        <div className="flex-grow flex flex-col items-center justify-center py-24">
          <RefreshCw className="h-10 w-10 animate-spin text-deep-gold mb-3" />
          <p className="text-sm font-medium text-[#7D7061]">Retrieving Skill Details...</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !skill) {
    return (
      <div className="flex min-h-screen flex-col bg-[#FCF9F5]">
        <Navbar />
        <div className="flex-grow max-w-2xl mx-auto px-4 py-16 text-center">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-800 mb-4">
            <HelpCircle className="h-6 w-6" />
          </div>
          <h2 className="font-serif text-2xl font-bold text-[#3D2D1E] mb-2">Error Retrieving Skill</h2>
          <p className="text-sm text-[#7D7061] mb-6">{error || 'The requested skill does not exist.'}</p>
          <button
            onClick={() => navigate('/learner/skills')}
            className="inline-flex items-center gap-2 rounded-full bg-deep-gold hover:bg-deep-gold/90 px-6 py-2.5 text-xs font-bold uppercase tracking-widest text-white shadow-sm transition-all"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Return to Catalogue</span>
          </button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#FCF9F5] text-[#2D241A] font-sans antialiased" id="skill-detail-container">
      <Navbar />

      {/* Navigation Breadcrumb */}
      <div className="bg-cream border-b border-primary-gold/5 py-4 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl flex items-center justify-between">
          <button
            onClick={() => navigate('/learner/skills')}
            className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-[#7D7061] hover:text-deep-gold transition-colors cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Catalogue</span>
          </button>
          <div className="hidden sm:flex items-center space-x-2 text-xs text-[#7D7061] font-semibold">
            <Link to="/learner" className="hover:text-deep-gold">Dashboard</Link>
            <ChevronRight className="h-3 w-3" />
            <Link to="/learner/skills" className="hover:text-deep-gold">Skills</Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-[#3D2D1E] font-bold truncate max-w-[150px]">{skill.name}</span>
          </div>
        </div>
      </div>

      <main className="flex-grow mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-3">
          
          {/* Main Syllabus / Content column */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white rounded-3xl border border-primary-gold/10 p-6 sm:p-8 shadow-sm">
              <div className="flex flex-wrap items-center gap-2.5">
                {category && (
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-deep-gold bg-soft-yellow/20 px-3 py-1 rounded-full border border-primary-gold/10">
                    {category.name}
                  </span>
                )}
                <span className={`text-[10px] font-extrabold uppercase tracking-widest border px-3 py-1 rounded-full ${getDifficultyStyles(skill.difficulty)}`}>
                  {skill.difficulty} Level
                </span>
              </div>

              <h1 className="mt-4 font-serif text-2xl sm:text-3xl font-extrabold text-[#3D2D1E] tracking-tight">
                {skill.name}
              </h1>

              <p className="mt-4 text-sm sm:text-base text-[#7D7061] leading-relaxed">
                {skill.description}
              </p>

              {/* Skill metadata grid */}
              <div className="mt-8 grid gap-4 sm:grid-cols-2 bg-[#FCF9F5] border border-primary-gold/10 rounded-2xl p-4 sm:p-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm border border-primary-gold/5 text-deep-gold shrink-0">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-widest text-[#7D7061]">Estimated Duration</h4>
                    <p className="mt-0.5 text-sm font-bold text-[#3D2D1E]">{skill.estimated_duration}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm border border-primary-gold/5 text-deep-gold shrink-0">
                    <Award className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-widest text-[#7D7061]">Certification Badge</h4>
                    <p className="mt-0.5 text-sm font-bold text-[#3D2D1E]">NariNexus Certified</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Prerequisites Section */}
            <div className="bg-white rounded-3xl border border-primary-gold/10 p-6 sm:p-8 shadow-sm">
              <h2 className="font-serif text-lg sm:text-xl font-bold text-[#3D2D1E] mb-4">
                Prerequisites & Eligibility
              </h2>
              {skill.prerequisites && skill.prerequisites.length > 0 && skill.prerequisites[0] !== 'None' ? (
                <div className="space-y-3">
                  <p className="text-xs text-[#7D7061]">
                    To successfully complete this program, we suggest having completion certificates or equivalent background in:
                  </p>
                  <ul className="grid gap-2 sm:grid-cols-2">
                    {skill.prerequisites.map((req, i) => (
                      <li key={i} className="flex items-center gap-2 text-xs font-bold text-[#3D2D1E] bg-[#FCF9F5] border border-primary-gold/10 px-3.5 py-2.5 rounded-xl">
                        <BookOpen className="h-4 w-4 text-deep-gold shrink-0" />
                        <span>{req}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div className="flex items-center gap-3 text-[#7D7061]">
                  <CheckCircle className="h-5 w-5 text-green-600 shrink-0" />
                  <p className="text-xs font-medium">
                    <strong>No prior experience required!</strong> This skill module is beginner-friendly and open to all learners.
                  </p>
                </div>
              )}
            </div>

            {/* Career Opportunities / Employment Pathways */}
            <div className="bg-white rounded-3xl border border-primary-gold/10 p-6 sm:p-8 shadow-sm">
              <h2 className="font-serif text-lg sm:text-xl font-bold text-[#3D2D1E] mb-2.5">
                Employment & Business Pathways
              </h2>
              <p className="text-xs text-[#7D7061] mb-5">
                Completing this skill training unlocks key micro-business pathways, gig-work connections, or formal sector employment opportunities:
              </p>
              
              <div className="grid gap-3 sm:grid-cols-2">
                {skill.career_options.map((option, idx) => (
                  <div key={idx} className="flex items-start gap-3 bg-cream/40 border border-primary-gold/5 rounded-2xl p-4">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-soft-yellow/30 text-[#B37000] shrink-0">
                      <Briefcase className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-[#3D2D1E]">{option}</h4>
                      <p className="mt-0.5 text-[10px] text-[#7D7061]">Eligible for micro-enterprise business loans & job placements.</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Associated Learning Courses */}
            {associatedCourses.length > 0 && (
              <div className="bg-white rounded-3xl border border-primary-gold/10 p-6 sm:p-8 shadow-sm">
                <h2 className="font-serif text-lg sm:text-xl font-bold text-[#3D2D1E] mb-2">
                  Available Learning Courses
                </h2>
                <p className="text-xs text-[#7D7061] mb-5">
                  The following active course tracks teach this specific skill area. You can view their full syllabus outline, structures, and access lesson modules:
                </p>
                <div className="space-y-4">
                  {associatedCourses.map((course) => (
                    <div 
                      key={course.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl border border-primary-gold/10 bg-[#FCF9F5]/40 hover:bg-[#FCF9F5] transition"
                    >
                      <div className="flex items-start gap-3.5">
                        <div className="h-14 w-20 rounded-xl overflow-hidden shrink-0 bg-cream border border-primary-gold/5">
                          <img 
                            src={course.thumbnail} 
                            alt={course.title}
                            referrerPolicy="no-referrer"
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <span className="text-[9px] font-extrabold uppercase tracking-widest text-[#C17A42] bg-peach/15 px-1.5 py-0.2 rounded">
                              {course.learning_mode}
                            </span>
                            <span className="text-[9px] font-extrabold uppercase tracking-widest text-[#556B2F] bg-sage-green/15 px-1.5 py-0.2 rounded">
                              {course.difficulty}
                            </span>
                          </div>
                          <h4 className="font-bold text-sm text-[#2D241A] leading-tight">{course.title}</h4>
                          <p className="text-xs text-[#7D7061] mt-0.5 font-medium">Instructor: {course.instructor} • {course.duration}</p>
                        </div>
                      </div>

                      <div className="shrink-0">
                        <Link 
                          to={`/learner/courses/${course.id}`}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-light-pink border border-soft-rose/30 hover:border-primary-pink px-4 py-2.5 text-xs font-bold text-deep-rose transition"
                        >
                          <span>Syllabus Blueprint</span>
                          <ChevronRight className="h-3.5 w-3.5" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Simulated Course Syllabus Outline */}
            <div className="bg-white rounded-3xl border border-primary-gold/10 p-6 sm:p-8 shadow-sm">
              <h2 className="font-serif text-lg sm:text-xl font-bold text-[#3D2D1E] mb-4">
                Program Syllabus Outline
              </h2>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-soft-yellow/30 text-deep-gold text-xs font-extrabold">
                    1
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-[#3D2D1E]">Module 1: Fundamental Concepts & Tools Orientation</h3>
                    <p className="mt-1 text-xs text-[#7D7061] leading-relaxed">
                      Introduction to standard equipment, foundational safety guidelines, tool mechanics, and core vocabulary definitions.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 border-t border-[#FCF9F5] pt-4">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-soft-yellow/30 text-deep-gold text-xs font-extrabold">
                    2
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-[#3D2D1E]">Module 2: Practical Exercises & Intermediate Methodologies</h3>
                    <p className="mt-1 text-xs text-[#7D7061] leading-relaxed">
                      Hand-on drills under peer supervision. Learning intermediate procedures, troubleshooting errors, and optimizing workflows.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 border-t border-[#FCF9F5] pt-4">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-soft-yellow/30 text-deep-gold text-xs font-extrabold">
                    3
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-[#3D2D1E]">Module 3: Business Integration & Local Market Capstone</h3>
                    <p className="mt-1 text-xs text-[#7D7061] leading-relaxed">
                      Drafting basic ledger models, quality control evaluations, and executing a final individual capstone project to receive the NariNexus digital badge.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar options / Register Interest */}
          <div className="space-y-6">
            
            {/* Call to action panel */}
            <div className="bg-cream border border-primary-gold/15 rounded-3xl p-6 shadow-sm text-center">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-light-pink text-deep-rose mb-3.5 shadow-sm">
                <Sparkle className="h-5 w-5 animate-spin" />
              </span>
              <h3 className="font-serif text-lg font-bold text-[#3D2D1E] mb-2">
                Join Next Batch
              </h3>
              <p className="text-xs text-[#7D7061] leading-relaxed mb-6">
                Register your interest to get notified about offline classroom training at your nearest coaching center, or access hybrid learning formats.
              </p>

              {interestRegistered ? (
                <div className="rounded-2xl bg-green-50/50 border border-green-200/50 p-4 text-center">
                  <CheckCircle className="h-6 w-6 text-green-600 mx-auto mb-2" />
                  <h4 className="text-xs font-bold text-green-800">Interest Registered!</h4>
                  <p className="mt-1 text-[10px] text-green-700">
                    We will notify you via SMS/WhatsApp once the next batch commences at your nearest local center.
                  </p>
                </div>
              ) : (
                <button
                  onClick={handleRegisterInterest}
                  disabled={registering}
                  className="w-full inline-flex items-center justify-center gap-1.5 rounded-full bg-gradient-to-r from-deep-rose to-primary-pink hover:from-primary-pink hover:to-deep-rose py-3 text-xs font-extrabold uppercase tracking-widest text-white shadow-sm hover:shadow-md transition-all transform hover:-translate-y-0.5 cursor-pointer"
                >
                  {registering ? (
                    <>
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      <span>Registering...</span>
                    </>
                  ) : (
                    <span>Register Interest</span>
                  )}
                </button>
              )}

              <p className="mt-4 text-[10px] text-[#A09384]">
                Registering is completely free and unlocks support loans.
              </p>
            </div>

            {/* Offline batch details box */}
            <div className="bg-white border border-primary-gold/10 rounded-3xl p-6 shadow-sm">
              <h3 className="font-serif text-sm font-bold text-[#3D2D1E] mb-4 uppercase tracking-wider">
                Training Structure
              </h3>

              <div className="space-y-4 text-xs">
                <div className="flex gap-3">
                  <Building className="h-4 w-4 text-primary-pink shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-[#3D2D1E]">Offline Centres</h4>
                    <p className="text-[#7D7061] mt-0.5">Participate in daily physical laboratories led by experienced master tutors.</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Users className="h-4 w-4 text-primary-pink shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-[#3D2D1E]">Peer Cohorts</h4>
                    <p className="text-[#7D7061] mt-0.5">Collaborate in small batches of 15-20 learners to build social support.</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Calendar className="h-4 w-4 text-primary-pink shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-[#3D2D1E]">Flexible Timings</h4>
                    <p className="text-[#7D7061] mt-0.5">Morning, afternoon, and weekend schedules tailored for mothers and working professionals.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
