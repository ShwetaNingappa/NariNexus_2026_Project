import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  BookOpen, 
  Clock, 
  ChevronRight, 
  ArrowLeft, 
  Award,
  CheckCircle2,
  Calendar,
  XCircle,
  AlertCircle
} from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

interface EnrolledCourse {
  enrollment_id: string;
  course_id: string;
  course_title: string;
  skill_id: string;
  learning_mode: 'online' | 'offline' | 'hybrid';
  status: 'active' | 'completed' | 'cancelled';
  enrollment_date: string;
}

export default function MyCoursesPage() {
  const navigate = useNavigate();
  const [enrollments, setEnrollments] = useState<EnrolledCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'active' | 'completed'>('active');
  
  // Phase 4.2 progress dictionary mapping course_id -> progress summary
  const [progressMap, setProgressMap] = useState<Record<string, any>>({});

  useEffect(() => {
    fetchMyEnrollments();
  }, []);

  const fetchMyEnrollments = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('narinexus_token');
      if (!token) {
        throw new Error("You must be logged in to view your enrolled courses.");
      }

      const res = await fetch('/api/enrollments/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!res.ok) {
        if (res.status === 401) {
          throw new Error("Session expired. Please log in again.");
        }
        throw new Error("Failed to load enrollments.");
      }

      const data = await res.json();
      setEnrollments(data);

      // Fetch dynamic progress for all enrolled courses
      try {
        const progRes = await fetch('/api/progress/me', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (progRes.ok) {
          const progData = await progRes.json();
          const map: Record<string, any> = {};
          progData.forEach((p: any) => {
            map[p.course_id] = p;
          });
          setProgressMap(map);
        }
      } catch (pErr) {
        console.error("Failed to load dynamic progress map:", pErr);
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEnrollment = async (enrollmentId: string) => {
    if (!window.confirm("Are you sure you want to cancel this enrollment? You can re-enroll at any time.")) {
      return;
    }

    try {
      const token = localStorage.getItem('narinexus_token');
      const res = await fetch(`/api/enrollments/${enrollmentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || "Failed to cancel enrollment.");
      }

      // Refresh enrollments list
      fetchMyEnrollments();
    } catch (err: any) {
      alert(err.message || "Could not cancel enrollment.");
    }
  };

  const filteredEnrollments = enrollments.filter(e => {
    if (activeTab === 'active') {
      return e.status === 'active';
    } else {
      return e.status === 'completed';
    }
  });

  const cancelledEnrollments = enrollments.filter(e => e.status === 'cancelled');

  return (
    <div id="my-courses-page-container" className="min-h-screen flex flex-col bg-[#FCF9F5] text-[#2D241A] font-sans">
      <Navbar />

      <main className="flex-grow max-w-7xl w-full mx-auto px-4 py-8">
        
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between mb-6">
          <Link 
            to="/learner" 
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#7D7061] hover:text-[#2D241A] transition"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Learner Dashboard</span>
          </Link>
          <Link 
            to="/learner/courses"
            className="text-xs font-extrabold text-[#C17A42] hover:text-[#a05f2c] transition"
          >
            Browse Course Catalogue →
          </Link>
        </div>

        {/* Page Title Header */}
        <div className="mb-8">
          <h1 className="font-serif text-2xl md:text-3.5xl font-extrabold text-[#3D2D1E] tracking-tight leading-tight mb-2">
            My Learning Blueprint
          </h1>
          <p className="text-xs md:text-sm text-[#7D7061] max-w-2xl">
            Track your ongoing skill programs, access digital reading modules, and complete your local coaching assignments here.
          </p>
        </div>

        {error && (
          <div className="mb-6 bg-soft-rose/10 border border-soft-rose/30 rounded-2xl p-4 flex items-start gap-2 text-xs text-deep-rose">
            <AlertCircle className="h-4.5 w-4.5 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Dynamic Tabs */}
        <div className="flex border-b border-primary-gold/10 mb-8 gap-4 sm:gap-6 overflow-x-auto">
          <button
            onClick={() => setActiveTab('active')}
            className={`pb-4 text-xs font-extrabold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'active' 
                ? 'border-b-2 border-primary-gold text-[#2D241A]' 
                : 'text-[#7D7061] hover:text-[#2D241A]'
            }`}
          >
            Active Tracks ({enrollments.filter(e => e.status === 'active').length})
          </button>
          <button
            onClick={() => setActiveTab('completed')}
            className={`pb-4 text-xs font-extrabold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'completed' 
                ? 'border-b-2 border-primary-gold text-[#2D241A]' 
                : 'text-[#7D7061] hover:text-[#2D241A]'
            }`}
          >
            Completed Credentials ({enrollments.filter(e => e.status === 'completed').length})
          </button>
        </div>

        {loading ? (
          <div className="py-16 text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-gold border-t-transparent mx-auto mb-3" />
            <span className="text-xs text-[#7D7061]">Retrieving your learning tracks...</span>
          </div>
        ) : (
          <>
            {filteredEnrollments.length === 0 ? (
              <div className="bg-white border border-primary-gold/10 rounded-3xl p-10 sm:p-14 text-center max-w-xl mx-auto shadow-sm">
                <BookOpen className="h-10 w-10 text-primary-gold/60 mx-auto mb-4" />
                <h3 className="font-bold text-base text-[#2D241A] mb-2">
                  No {activeTab} courses found
                </h3>
                <p className="text-xs text-[#7D7061] leading-relaxed mb-6">
                  {activeTab === 'active' 
                    ? "You haven't enrolled in any active course tracks yet. Explore our diverse career skillsets to get started."
                    : "Your completed course credentials will appear here once you finish all syllabus modules."}
                </p>
                {activeTab === 'active' && (
                  <Link 
                    to="/learner/courses"
                    className="inline-flex items-center gap-1.5 rounded-xl bg-deep-rose hover:bg-deep-rose/90 text-white font-bold px-5 py-3 text-xs uppercase tracking-wider transition shadow-sm"
                  >
                    Explore Skill Courses
                  </Link>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredEnrollments.map((enroll) => (
                  <div 
                    key={enroll.enrollment_id}
                    className="bg-white rounded-2xl border border-primary-gold/10 p-5 sm:p-6 shadow-sm flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span className="text-[9px] font-extrabold uppercase tracking-widest text-[#C17A42] bg-peach/15 px-2 py-0.5 rounded">
                          {enroll.learning_mode} Mode
                        </span>
                        <span className="text-[9px] font-bold text-[#7D7061] flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>Joined {new Date(enroll.enrollment_date).toLocaleDateString()}</span>
                        </span>
                      </div>

                      <h3 className="font-serif font-bold text-base sm:text-lg text-[#2D241A] leading-snug mb-1">
                        {enroll.course_title}
                      </h3>
                      
                      <p className="text-xs text-[#7D7061] mb-5 font-medium">
                        Skill Domain: <span className="text-[#2D241A] font-semibold">{enroll.skill_id.replace(/-/g, ' ').toUpperCase()}</span>
                      </p>

                      {/* Lesson Progress Tracker */}
                      {(() => {
                        const prog = progressMap[enroll.course_id] || {
                          progress_percentage: 0,
                          completed_lessons: 0,
                          total_lessons: 0
                        };
                        return (
                          <div className="mb-6">
                            <div className="flex justify-between items-center text-[10px] uppercase font-extrabold text-[#7D7061] mb-1.5">
                              <span>Syllabus Modules Completed</span>
                              <span className="text-deep-rose font-black">{prog.progress_percentage}%</span>
                            </div>
                            <div className="w-full bg-[#FCF9F5] border border-primary-gold/10 h-2 rounded-full overflow-hidden">
                              <div 
                                className="bg-gradient-to-r from-deep-rose to-primary-pink h-full rounded-full transition-all duration-300" 
                                style={{ width: `${prog.progress_percentage}%` }} 
                              />
                            </div>
                            <div className="text-[9px] text-[#7D7061]/70 font-semibold mt-1 text-right">
                              {prog.completed_lessons} of {prog.total_lessons || 1} modules
                            </div>
                          </div>
                        );
                      })()}
                    </div>

                    <div className="flex items-center justify-between gap-4 pt-4 border-t border-primary-gold/5 mt-2">
                      <button
                        onClick={() => handleCancelEnrollment(enroll.enrollment_id)}
                        className="text-xs font-bold text-deep-rose/80 hover:text-deep-rose transition"
                      >
                        Cancel Enrollment
                      </button>

                      <Link 
                        to={`/learner/courses/${enroll.course_id}`}
                        className="inline-flex items-center gap-1 rounded-xl bg-light-pink border border-soft-rose/30 hover:border-primary-pink px-4 py-2.5 text-xs font-bold text-deep-rose transition"
                      >
                        <span>Continue Learning</span>
                        <ChevronRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Cancelled Enrollments Section if present */}
            {cancelledEnrollments.length > 0 && (
              <div className="mt-14 border-t border-primary-gold/10 pt-10">
                <h3 className="font-serif font-bold text-md text-[#7D7061] mb-4 uppercase tracking-wider">
                  Cancelled Enrollments ({cancelledEnrollments.length})
                </h3>
                <div className="space-y-3 max-w-2xl">
                  {cancelledEnrollments.map((enroll) => (
                    <div 
                      key={enroll.enrollment_id}
                      className="flex items-center justify-between p-4 rounded-xl border border-primary-gold/5 bg-[#FCF9F5]/30 text-xs text-[#7D7061]"
                    >
                      <div className="flex items-center gap-3">
                        <XCircle className="h-4.5 w-4.5 text-deep-rose/60 shrink-0" />
                        <div>
                          <h4 className="font-bold text-[#2D241A]">{enroll.course_title}</h4>
                          <span className="text-[10px]">Cancelled on {new Date(enroll.enrollment_date).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <Link 
                        to={`/learner/courses/${enroll.course_id}`}
                        className="text-xs font-extrabold text-[#C17A42] hover:underline"
                      >
                        Enroll Again
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

      </main>

      <Footer />
    </div>
  );
}
