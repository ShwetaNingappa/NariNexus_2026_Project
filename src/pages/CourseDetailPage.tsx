import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  Clock, 
  User, 
  ArrowLeft, 
  CheckCircle, 
  CheckCircle2,
  AlertCircle,
  Lock, 
  PlayCircle, 
  BookOpen, 
  Calendar, 
  Briefcase, 
  GraduationCap, 
  ChevronRight,
  Info
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
      description?: string;
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
    latitude?: number | null;
    longitude?: number | null;
  } | null;
}

interface Lesson {
  id: string;
  course_id: string;
  title: string;
  description: string;
  lesson_number: number;
  content_type: string;
  content: string;
  duration: string;
  is_preview: boolean;
}

interface Enrollment {
  enrolled: boolean;
  status: 'active' | 'completed' | 'cancelled';
  learning_mode: 'online' | 'offline' | 'hybrid';
  enrollment_id: string;
}

export default function CourseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [enrollMsg, setEnrollMsg] = useState(false);
  const [activeVideoIdx, setActiveVideoIdx] = useState(0);

  // Phase 4.1 Enrollment States
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [selectedMode, setSelectedMode] = useState<'online' | 'offline' | 'hybrid' | null>(null);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [enrollError, setEnrollError] = useState<string | null>(null);

  // Phase 4.2 Progress States
  const [courseProgress, setCourseProgress] = useState<{
    total_lessons: number;
    completed_lessons: number;
    completed_lesson_ids: string[];
    progress_percentage: number;
  } | null>(null);

  useEffect(() => {
    fetchCourseDetails();
  }, [id]);

  const fetchCourseDetails = async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const headers = {
        Authorization: `Bearer ${localStorage.getItem('narinexus_token')}`
      };

      // Fetch course by id
      const courseRes = await fetch(`/api/courses/${id}`, { headers });
      if (!courseRes.ok) {
        if (courseRes.status === 401) throw new Error("Session expired. Please log in again.");
        throw new Error("Course not found.");
      }
      const courseData = await courseRes.json();
      if (courseData.success) {
        setCourse(courseData.course);
      }

      // Fetch lessons
      const lessonsRes = await fetch(`/api/courses/${id}/lessons`, { headers });
      if (lessonsRes.ok) {
        const lessonsData = await lessonsRes.json();
        if (lessonsData.success) {
          setLessons(lessonsData.lessons);
        }
      }

      // Fetch enrollment status for this specific course
      try {
        const enrollRes = await fetch(`/api/enrollments/course/${id}`, { headers });
        if (enrollRes.ok) {
          const enrollData = await enrollRes.json();
          if (enrollData.success && enrollData.enrolled) {
            setEnrollment({
              enrolled: true,
              status: enrollData.status,
              learning_mode: enrollData.learning_mode,
              enrollment_id: enrollData.enrollment_id
            });

            // If enrolled, fetch dynamic course progress
            try {
              const progressRes = await fetch(`/api/progress/courses/${id}`, { headers });
              if (progressRes.ok) {
                const progressData = await progressRes.json();
                setCourseProgress(progressData);
              }
            } catch (pErr) {
              console.error("Failed to fetch course progress details:", pErr);
            }
          } else {
            setEnrollment(null);
            setCourseProgress(null);
          }
        }
      } catch (err) {
        console.error("Failed to fetch enrollment status:", err);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load course structure.");
    } finally {
      setLoading(false);
    }
  };

  const submitEnrollment = async () => {
    if (!selectedMode || !id) return;
    setEnrolling(true);
    setEnrollError(null);
    try {
      const headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('narinexus_token')}`
      };
      const res = await fetch('/api/enrollments', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          course_id: id,
          learning_mode: selectedMode
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Failed to enroll in this course.");
      }

      const data = await res.json();
      if (data.success) {
        setEnrollment({
          enrolled: true,
          status: data.enrollment.status,
          learning_mode: data.enrollment.learning_mode,
          enrollment_id: data.enrollment.id
        });
        
        // Initialize 0% progress on newly created enrollment
        setCourseProgress({
          total_lessons: lessons.length,
          completed_lessons: 0,
          completed_lesson_ids: [],
          progress_percentage: 0
        });

        setShowEnrollModal(false);
        setShowConfirmationModal(true);
      }
    } catch (err: any) {
      setEnrollError(err.message || "Something went wrong. Please try again.");
    } finally {
      setEnrolling(false);
    }
  };

  const triggerEnrollmentPlaceholder = () => {
    setEnrollMsg(true);
    setTimeout(() => {
      setEnrollMsg(false);
    }, 4000);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-[#FCF9F5] text-[#2D241A]">
        <Navbar />
        <div className="flex-grow flex flex-col items-center justify-center py-24">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-gold border-t-transparent mb-3" />
          <span className="text-xs font-semibold text-[#7D7061]">Retrieving detailed syllabus...</span>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="min-h-screen flex flex-col bg-[#FCF9F5] text-[#2D241A]">
        <Navbar />
        <div className="flex-grow max-w-lg mx-auto w-full px-4 py-24 text-center">
          <div className="bg-soft-rose/10 border border-soft-rose/30 text-deep-rose rounded-2xl p-8">
            <h3 className="font-bold text-sm mb-2">Error loading course</h3>
            <p className="text-xs mb-4">{error || "This course does not exist."}</p>
            <Link to="/learner/courses" className="inline-flex items-center gap-1.5 rounded-xl bg-deep-rose px-4 py-2 text-xs font-bold text-white transition">
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Catalogue</span>
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div id="course-detail-container" className="min-h-screen flex flex-col bg-[#FCF9F5] text-[#2D241A] font-sans">
      <Navbar />

      <main className="flex-grow max-w-7xl w-full mx-auto px-4 py-8">
        {/* Back Link */}
        <Link 
          to="/learner/courses" 
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#7D7061] hover:text-[#2D241A] transition mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Courses</span>
        </Link>

        {/* Hero Banner Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
          
          {/* Main Info Column */}
          <div className="lg:col-span-2">
            <div className="flex flex-wrap gap-2 mb-3">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold border bg-white text-primary-gold border-primary-gold/10 uppercase tracking-wider">
                Syllabus Blueprint
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold border bg-peach/10 text-[#C17A42] border-peach/20 uppercase">
                {course.difficulty}
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold border bg-blue-500/10 text-blue-700 border-blue-500/20 uppercase">
                {course.learning_mode}
              </span>
            </div>

            <h1 className="text-2xl md:text-3.5xl font-extrabold text-[#2D241A] leading-tight mb-4 tracking-tight">
              {course.title}
            </h1>

            <p className="text-sm md:text-base text-[#7D7061] leading-relaxed mb-6">
              {course.description}
            </p>

            <div className="flex flex-wrap items-center gap-6 text-xs text-[#7D7061] border-t border-b border-primary-gold/10 py-4 mb-8">
              <div className="flex items-center gap-2">
                <Clock className="h-4.5 w-4.5 text-primary-gold" />
                <div>
                  <span className="block text-[10px] uppercase font-bold text-[#7D7061]/70 leading-none">Duration</span>
                  <span className="font-extrabold text-[#2D241A]">{course.duration}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <User className="h-4.5 w-4.5 text-primary-gold" />
                <div>
                  <span className="block text-[10px] uppercase font-bold text-[#7D7061]/70 leading-none">Instructor</span>
                  <span className="font-extrabold text-[#2D241A]">{course.instructor}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <BookOpen className="h-4.5 w-4.5 text-primary-gold" />
                <div>
                  <span className="block text-[10px] uppercase font-bold text-[#7D7061]/70 leading-none">Lectures</span>
                  <span className="font-extrabold text-[#2D241A]">{lessons.length} Modules</span>
                </div>
              </div>
            </div>

            {/* Training Mode Experience Sections */}
            <div className="space-y-6 mb-8 text-left">
              {(course.training_mode === 'hybrid' || course.learning_mode === 'hybrid') && (
                <div className="bg-gradient-to-r from-deep-rose/10 to-primary-pink/15 p-5 rounded-3xl border border-soft-rose/30">
                  <span className="text-xs uppercase font-extrabold tracking-widest text-deep-rose block mb-1">
                    🔄 Hybrid Training Course
                  </span>
                  <p className="text-xs font-semibold text-[#5D5041] leading-relaxed">
                    This course blends online video theory lessons with offline practical skill-building workshops at our neighborhood Training Centre. Both tracks are unlocked for your credentials.
                  </p>
                </div>
              )}

              {/* A. Online YouTube Training */}
              {(course.training_mode === 'online' || course.training_mode === 'hybrid' || course.learning_mode === 'online' || course.learning_mode === 'hybrid') && (
                <div className="bg-white border border-primary-gold/10 rounded-3xl p-6 shadow-sm space-y-4">
                  <h3 className="font-serif text-lg font-extrabold text-[#2D241A] flex items-center gap-2">
                    <span>🎥</span> Online Training
                  </h3>

                  {course.online_training?.videos && course.online_training.videos.length > 0 ? (
                    <div className="space-y-4">
                      {/* Active Video Player */}
                      {(() => {
                        const activeVideo = course.online_training.videos[activeVideoIdx] || course.online_training.videos[0];
                        const videoId = activeVideo ? (activeVideo.youtube_url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/) || [])[1] : null;
                        
                        return (
                          <div className="space-y-3">
                            <h4 className="font-bold text-sm text-[#2D241A] leading-tight">
                              Currently Playing: <span className="text-deep-rose">{activeVideo?.title}</span>
                            </h4>
                            
                            {videoId ? (
                              <div className="aspect-video w-full rounded-2xl overflow-hidden bg-black border border-primary-gold/15 shadow-sm">
                                <iframe
                                  src={`https://www.youtube.com/embed/${videoId}`}
                                  title={activeVideo?.title || 'YouTube Video'}
                                  className="w-full h-full"
                                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                  allowFullScreen
                                ></iframe>
                              </div>
                            ) : (
                              <div className="aspect-video w-full rounded-2xl bg-cream/35 border border-dashed border-primary-gold/15 flex items-center justify-center text-xs font-semibold text-[#7D7061] italic">
                                Loading video feed...
                              </div>
                            )}

                            <div className="flex justify-between items-center">
                              <span className="text-[11px] text-[#7D7061] font-medium leading-relaxed">
                                {activeVideo?.description || 'Learn core concepts in this lesson module.'}
                              </span>
                              <a
                                href={activeVideo?.youtube_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 rounded-xl bg-red-600 hover:bg-red-700 px-3.5 py-2 text-[10px] font-bold text-white transition cursor-pointer"
                              >
                                🎥 Watch on YouTube
                              </a>
                            </div>
                          </div>
                        );
                      })()}

                      {/* Video Selector list if multiple */}
                      {course.online_training.videos.length > 1 && (
                        <div className="space-y-2 pt-2 border-t border-primary-gold/5">
                          <span className="text-[10px] uppercase font-bold text-[#7D7061] tracking-wider block mb-1">
                            Course Video Lessons ({course.online_training.videos.length})
                          </span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-1">
                            {course.online_training.videos.map((vid, idx) => (
                              <button
                                key={idx}
                                onClick={() => setActiveVideoIdx(idx)}
                                className={`text-left p-2.5 rounded-xl border text-xs transition-all flex items-start gap-2 ${
                                  activeVideoIdx === idx
                                    ? 'border-deep-rose bg-light-pink text-deep-rose font-bold'
                                    : 'border-primary-gold/15 hover:border-primary-gold/30 hover:bg-[#FCF9F5] text-[#3D2D1E]'
                                }`}
                              >
                                <span className="bg-deep-rose/10 px-1.5 py-0.5 rounded text-[9px] font-bold tracking-tight mt-0.5 shrink-0">
                                  {idx + 1}
                                </span>
                                <span className="truncate leading-tight">{vid.title}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-5 text-center bg-cream/20 rounded-2xl border border-dashed border-primary-gold/10 text-xs font-semibold text-[#7D7061] italic">
                      Online lessons are currently being registered under this curriculum.
                    </div>
                  )}
                </div>
              )}

              {/* B. Offline Training Centre Location */}
              {(course.training_mode === 'offline' || course.training_mode === 'hybrid' || course.learning_mode === 'offline' || course.learning_mode === 'hybrid') && (
                <div className="bg-white border border-primary-gold/10 rounded-3xl p-6 shadow-sm space-y-4">
                  <h3 className="font-serif text-lg font-extrabold text-[#2D241A] flex items-center gap-2">
                    <span>📍</span> Neighborhood Training Location
                  </h3>

                  {course.offline_training ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                      <div className="md:col-span-2 space-y-2.5">
                        <div className="space-y-1">
                          <span className="text-[10px] uppercase font-bold text-[#7D7061] tracking-wider block">Official Training Centre</span>
                          <h4 className="font-serif text-base font-extrabold text-[#2D241A]">
                            🏫 {course.centre_name || course.offline_training.centre_name || 'NariNexus Women Skill Centre'}
                          </h4>
                        </div>
                        
                        <div className="space-y-1">
                          <span className="text-[10px] uppercase font-bold text-[#7D7061] tracking-wider block">Neighborhood Address</span>
                          <p className="text-xs font-semibold text-[#5D5041] leading-relaxed">
                            {course.offline_training.address}<br />
                            {course.offline_training.city}, {course.offline_training.district}, {course.offline_training.state} - {course.offline_training.pincode}
                          </p>
                        </div>
                      </div>

                      <div className="md:col-span-1 flex flex-col justify-center items-stretch md:items-end gap-3.5 bg-cream/10 md:bg-transparent p-4 md:p-0 rounded-2xl border border-primary-gold/15 md:border-transparent">
                        {(() => {
                          const offline = course.offline_training;
                          let mapUrl = '#';
                          if (offline.latitude !== undefined && offline.latitude !== null && offline.longitude !== undefined && offline.longitude !== null) {
                            mapUrl = `https://www.google.com/maps/search/?api=1&query=${offline.latitude},${offline.longitude}`;
                          } else {
                            const queryParts = [
                              offline.address,
                              offline.city,
                              offline.district,
                              offline.state,
                              offline.pincode
                            ].filter(Boolean);
                            mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(queryParts.join(', '))}`;
                          }
                          return (
                            <a
                              href={mapUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex w-full md:w-auto items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-deep-gold to-[#C8870A] hover:from-[#C8870A] hover:to-deep-gold text-white text-xs font-bold uppercase tracking-wider py-3 px-5 shadow-sm hover:shadow-md transition cursor-pointer text-center"
                            >
                              <span>📍 VIEW ON MAP</span>
                            </a>
                          );
                        })()}

                        <div className="text-[10px] text-[#7D7061] font-semibold md:text-right space-y-1">
                          <div>📅 {course.offline_training.available_days || 'Monday – Friday'}</div>
                          <div>🕒 {course.offline_training.start_time || '10:00 AM'} - {course.offline_training.end_time || '1:00 PM'}</div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-5 text-center bg-cream/20 rounded-2xl border border-dashed border-primary-gold/10 text-xs font-semibold text-[#7D7061] italic">
                      Offline session schedules are currently being compiled.
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Prerequisites and Career outcomes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-white border border-primary-gold/10 rounded-2xl p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <GraduationCap className="h-5 w-5 text-primary-gold" />
                  <h3 className="font-bold text-sm text-[#2D241A]">Prerequisites</h3>
                </div>
                {course.prerequisites.length > 0 && course.prerequisites[0].toLowerCase() !== 'none' ? (
                  <ul className="space-y-2">
                    {course.prerequisites.map((p, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-xs text-[#7D7061]">
                        <CheckCircle className="h-4 w-4 text-[#6B8E6F] shrink-0 mt-0.5" />
                        <span>{p}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-[#7D7061] italic">No prior experience or skills required. Beginner friendly!</p>
                )}
              </div>

              <div className="bg-white border border-primary-gold/10 rounded-2xl p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <Briefcase className="h-5 w-5 text-primary-gold" />
                  <h3 className="font-bold text-sm text-[#2D241A]">Career & Business Outcomes</h3>
                </div>
                <ul className="space-y-2">
                  {course.career_outcomes.map((o, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-xs text-[#7D7061]">
                      <CheckCircle className="h-4 w-4 text-primary-gold shrink-0 mt-0.5" />
                      <span>{o}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Action Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white border border-primary-gold/10 rounded-2xl p-6 shadow-md sticky top-6 overflow-hidden">
              <div className="aspect-video w-full rounded-xl bg-cream mb-4 relative overflow-hidden">
                <img 
                  src={course.thumbnail} 
                  alt={course.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Enrollment Trigger */}
              {enrollment ? (
                <div className="space-y-4">
                  <div className={`border rounded-xl p-3.5 text-center ${
                    enrollment.status === 'completed'
                      ? 'bg-sage-green/20 border-green-300 text-green-800'
                      : 'bg-sage-green/10 border-[#556B2F]/20 text-[#556B2F]'
                  }`}>
                    <span className="text-xs font-bold block mb-1">
                      {enrollment.status === 'completed' ? '✓ COURSE COMPLETED!' : '✓ ENROLLED & ACTIVE'}
                    </span>
                    <span className="text-[11px] text-[#7D7061] capitalize">
                      {enrollment.learning_mode} Mode Track
                    </span>
                  </div>

                  {/* Course Progress Bar */}
                  {courseProgress && (
                    <div className="bg-cream/40 border border-primary-gold/10 rounded-xl p-3.5 space-y-2">
                      <div className="flex justify-between items-center text-[10px] font-bold">
                        <span className="text-[#7D7061] uppercase">Course Progress</span>
                        <span className="text-deep-rose">{courseProgress.progress_percentage}%</span>
                      </div>
                      <div className="w-full bg-white border border-primary-gold/10 h-2 rounded-full overflow-hidden">
                        <div 
                          className="bg-gradient-to-r from-deep-rose to-primary-pink h-full transition-all duration-300" 
                          style={{ width: `${courseProgress.progress_percentage}%` }} 
                        />
                      </div>
                      <div className="text-[9px] text-[#7D7061] font-semibold text-center mt-1">
                        {courseProgress.completed_lessons} of {courseProgress.total_lessons} modules completed
                      </div>
                    </div>
                  )}

                  {lessons.length > 0 && (
                    <Link
                      to={`/learner/courses/${course.id}/lessons/${lessons[0].id}`}
                      className="w-full text-center block rounded-xl bg-deep-rose hover:bg-deep-rose/90 text-white font-bold py-3 text-xs uppercase tracking-wider shadow-sm transition-all"
                    >
                      {enrollment.status === 'completed' ? 'Review Lessons' : 'Resume Learning'}
                    </Link>
                  )}
                </div>
              ) : (
                <button 
                  onClick={() => setShowEnrollModal(true)}
                  className="w-full rounded-xl bg-deep-rose hover:bg-deep-rose/90 text-white font-bold py-3 text-xs uppercase tracking-wider shadow-sm transition-all cursor-pointer"
                >
                  Enroll in Course
                </button>
              )}

              {enrollMsg && (
                <div className="mt-3 bg-primary-gold/10 border border-primary-gold/20 rounded-xl p-3 flex items-start gap-2 text-[11px] text-[#2D241A] animate-fadeIn">
                  <Info className="h-4 w-4 text-primary-gold shrink-0 mt-0.5" />
                  <span>The NariNexus enrollment system is being finalized. Your preference is recorded!</span>
                </div>
              )}
              {/* Enhanced Training Options & Delivery Management Panel */}
              <div className="mt-5 pt-4 border-t border-primary-gold/15 space-y-4">
                <h4 className="text-xs uppercase font-extrabold text-[#2D241A] tracking-wider border-b border-primary-gold/5 pb-1 text-left">
                  Training Options &amp; Delivery
                </h4>
                
                <div className="bg-[#FCF9F5] p-4 rounded-xl border border-primary-gold/10 space-y-3.5 text-left">
                  <div className="flex items-center justify-between border-b border-primary-gold/5 pb-1.5">
                    <span className="text-[10px] uppercase tracking-wider font-extrabold text-[#7D7061]">Delivery Mode</span>
                    <span className="px-2 py-0.5 rounded bg-deep-gold/10 text-deep-gold text-[8px] font-extrabold uppercase tracking-wide">
                      {course.training_mode || course.learning_mode || 'online'}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[9px] uppercase tracking-wider font-extrabold text-[#7D7061] block">Training Centre</span>
                    <span className="text-xs font-bold text-[#2D241A] block">🏫 {course.centre_name || 'NariNexus Partner Centre'}</span>
                  </div>

                  {/* Online section */}
                  {(course.training_mode === 'online' || course.training_mode === 'hybrid' || course.learning_mode === 'online' || course.learning_mode === 'hybrid') && (
                    <div className="space-y-1.5 border-t border-primary-gold/5 pt-2">
                      <span className="text-[9px] uppercase tracking-wider font-extrabold text-emerald-800 flex items-center gap-1.5">
                        <span>🎥</span> Online Study Portal
                      </span>
                      <p className="text-[11px] text-[#5D5041] font-medium leading-relaxed">
                        ✓ {course.online_training?.videos?.length || 0} YouTube training lectures pre-registered and waiting inside your syllabus.
                      </p>
                    </div>
                  )}

                  {/* Offline section */}
                  {(course.training_mode === 'offline' || course.training_mode === 'hybrid' || course.learning_mode === 'offline' || course.learning_mode === 'hybrid') && (
                    <div className="space-y-2 border-t border-primary-gold/5 pt-2 text-[11px]">
                      <span className="text-[9px] uppercase tracking-wider font-extrabold text-amber-800 flex items-center gap-1.5">
                        <span>📍</span> Practical Classes
                      </span>
                      
                      {course.offline_training ? (
                        <div className="space-y-2 text-[#5D5041] font-semibold">
                          <div>
                            <span className="text-[9px] uppercase tracking-wider font-extrabold text-[#7D7061] block">Location Address</span>
                            <span className="block leading-relaxed">{course.offline_training.address}</span>
                            {course.offline_training.village && <span className="block text-[10px] text-[#7D7061]">{course.offline_training.village}</span>}
                            <span className="block font-bold text-[#2D241A]">{course.offline_training.city}, {course.offline_training.district}, {course.offline_training.state} - {course.offline_training.pincode}</span>
                          </div>

                          {course.distance_km !== null && course.distance_km !== undefined && (
                            <div className="bg-[#E2F0D9] text-[#2E7D32] px-2.5 py-1 rounded font-extrabold text-[10px] tracking-wider w-fit">
                              Distance: {course.distance_km} km away (approx)
                            </div>
                          )}

                          <div className="grid grid-cols-2 gap-2 bg-white p-2 rounded-lg border border-primary-gold/5 text-[10px]">
                            <div>
                              <span className="text-[8px] uppercase tracking-wider text-[#7D7061] block">Weekly Days</span>
                              <span className="text-[#2D241A] font-bold">{course.offline_training.available_days}</span>
                            </div>
                            <div>
                              <span className="text-[8px] uppercase tracking-wider text-[#7D7061] block">Daily Window</span>
                              <span className="text-[#2D241A] font-bold">{course.offline_training.start_time} - {course.offline_training.end_time}</span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <p className="text-[10px] text-[#7D7061] italic leading-relaxed">
                          Practical classes are available at {(course as any).centre_address || 'our local center'}, {(course as any).centre_city || 'Mysuru'}. Contact support for schedule updates.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Syllabus / Lessons Listing */}
        <div className="bg-white border border-primary-gold/10 rounded-2xl p-6 md:p-8 shadow-sm">
          <div className="border-b border-primary-gold/10 pb-4 mb-6">
            <h2 className="text-lg font-bold text-[#2D241A]">Course Curriculum</h2>
            <p className="text-xs text-[#7D7061]">Complete the step-by-step program modules to acquire verified skillset credentials.</p>
          </div>

          {lessons.length === 0 ? (
            <div className="text-center py-8 text-[#7D7061] italic text-xs">
              Syllabus modules are currently being finalized. Please check back soon!
            </div>
          ) : (
            <div className="space-y-4">
              {lessons.map((lesson) => {
                const isCompleted = courseProgress?.completed_lesson_ids?.includes(lesson.id) || false;
                const isUnlocked = lesson.is_preview || (enrollment && (enrollment.status === 'active' || enrollment.status === 'completed')) || isCompleted;
                return (
                  <div 
                    key={lesson.id}
                    className="flex items-center justify-between p-4 rounded-xl border border-primary-gold/10 hover:border-primary-gold/25 bg-[#FCF9F5]/40 hover:bg-[#FCF9F5] transition"
                  >
                    <div className="flex items-start gap-3.5 flex-grow">
                      <div className="rounded-xl bg-primary-gold/10 p-2 text-primary-gold mt-0.5 shrink-0">
                        {isCompleted ? (
                          <CheckCircle className="h-5 w-5 text-[#556B2F]" />
                        ) : isUnlocked ? (
                          <PlayCircle className="h-5 w-5 text-primary-gold" />
                        ) : (
                          <Lock className="h-5 w-5 text-[#7D7061]" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-[10px] font-bold text-primary-gold uppercase tracking-wider">
                            Module {lesson.lesson_number}
                          </span>
                          {lesson.is_preview && (
                            <span className="bg-sage/15 text-[#556B2F] border border-sage/20 text-[9px] font-extrabold px-1.5 py-0.2 rounded uppercase">
                              Preview
                            </span>
                          )}
                          {isCompleted && (
                            <span className="bg-[#556B2F]/15 text-[#556B2F] border border-[#556B2F]/20 text-[9px] font-extrabold px-1.5 py-0.2 rounded uppercase">
                              ✓ Completed
                            </span>
                          )}
                        </div>
                        <h4 className="font-bold text-sm text-[#2D241A] leading-snug">
                          {lesson.title}
                        </h4>
                        <p className="text-xs text-[#7D7061] line-clamp-1 mt-0.5 max-w-xl">
                          {lesson.description}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 shrink-0">
                      <span className="text-xs font-semibold text-[#7D7061]">{lesson.duration}</span>
                      {isUnlocked ? (
                        <Link 
                          to={`/learner/courses/${course.id}/lessons/${lesson.id}`}
                          className="rounded-xl bg-deep-rose hover:bg-deep-rose/95 px-3 py-1.5 text-xs font-bold text-white transition"
                        >
                          Read Module
                        </Link>
                      ) : (
                        <span className="text-[11px] text-[#7D7061] font-semibold flex items-center gap-1 bg-cream border border-primary-gold/10 rounded-lg px-2.5 py-1.5">
                          <Lock className="h-3 w-3" />
                          <span>Locked</span>
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </main>

      {/* Choose Learning Mode Modal */}
      {showEnrollModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl border border-primary-gold/10 p-6 md:p-8 max-w-md w-full shadow-2xl animate-scaleUp text-[#2D241A]">
            <h3 className="font-serif text-xl font-bold text-[#2D241A] mb-2">
              Select Your Learning Pathway
            </h3>
            <p className="text-xs text-[#7D7061] mb-6">
              Empower your career by choosing the instructional delivery mode that best matches your daily schedule.
            </p>

            <div className="space-y-3.5 mb-6">
              <button
                type="button"
                onClick={() => setSelectedMode('online')}
                className={`w-full text-left p-4 rounded-2xl border transition cursor-pointer ${
                  selectedMode === 'online'
                    ? 'border-primary-gold bg-primary-gold/5 text-[#2D241A]'
                    : 'border-primary-gold/10 bg-[#FCF9F5]/30 text-[#7D7061] hover:border-primary-gold/20'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#2D241A]">1. Online Track</span>
                  {selectedMode === 'online' && <CheckCircle2 className="h-4.5 w-4.5 text-primary-gold" />}
                </div>
                <p className="text-[11px] leading-relaxed">
                  Study entirely at your own pace from anywhere using our digital learning syllabus and lesson modules.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setSelectedMode('offline')}
                className={`w-full text-left p-4 rounded-2xl border transition cursor-pointer ${
                  selectedMode === 'offline'
                    ? 'border-[#C17A42] bg-peach/10 text-[#2D241A]'
                    : 'border-primary-gold/10 bg-[#FCF9F5]/30 text-[#7D7061] hover:border-primary-gold/20'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#C17A42]">2. Offline Track</span>
                  {selectedMode === 'offline' && <CheckCircle2 className="h-4.5 w-4.5 text-[#C17A42]" />}
                </div>
                <p className="text-[11px] leading-relaxed">
                  Join physically in scheduled coaching sessions at your nearest registered local partner center.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setSelectedMode('hybrid')}
                className={`w-full text-left p-4 rounded-2xl border transition cursor-pointer ${
                  selectedMode === 'hybrid'
                    ? 'border-deep-rose bg-light-pink/40 text-[#2D241A]'
                    : 'border-primary-gold/10 bg-[#FCF9F5]/30 text-[#7D7061] hover:border-primary-gold/20'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-deep-rose">3. Hybrid Track</span>
                  {selectedMode === 'hybrid' && <CheckCircle2 className="h-4.5 w-4.5 text-deep-rose" />}
                </div>
                <p className="text-[11px] leading-relaxed">
                  Complete online learning modules while attending specialized physical practical and networking workshops.
                </p>
              </button>
            </div>

            {enrollError && (
              <div className="mb-4 text-[11px] text-deep-rose flex items-start gap-1.5 font-medium">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{enrollError}</span>
              </div>
            )}

            <div className="flex gap-3 justify-end pt-2">
              <button
                onClick={() => {
                  setShowEnrollModal(false);
                  setSelectedMode(null);
                  setEnrollError(null);
                }}
                className="px-4 py-2.5 rounded-xl border border-primary-gold/10 hover:bg-[#FCF9F5] text-xs font-bold text-[#7D7061] transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={submitEnrollment}
                disabled={!selectedMode || enrolling}
                className="px-5 py-2.5 rounded-xl bg-deep-rose hover:bg-deep-rose/90 disabled:bg-deep-rose/50 disabled:cursor-not-allowed text-white text-xs font-bold uppercase tracking-wider transition cursor-pointer"
              >
                {enrolling ? 'Enrolling...' : 'Confirm Enrollment'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success/Confirmation Modal */}
      {showConfirmationModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl border border-primary-gold/10 p-6 md:p-8 max-w-md w-full shadow-2xl text-center animate-scaleUp text-[#2D241A]">
            <div className="h-12 w-12 rounded-full bg-sage/10 text-[#556B2F] flex items-center justify-center mx-auto mb-4 border border-sage/20">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <h3 className="font-serif text-xl font-bold text-[#2D241A] mb-2">
              Enrollment Confirmed!
            </h3>
            <p className="text-xs text-[#7D7061] leading-relaxed mb-6">
              You are now enrolled in <strong>{course.title}</strong> via the <span className="capitalize font-bold text-[#2D241A]">{enrollment?.learning_mode} pathway</span>. 
              {enrollment?.learning_mode === 'online' && " Your interactive learning syllabus and core readings are now fully unlocked."}
              {enrollment?.learning_mode === 'offline' && " Visit the My Courses page to get details of physical coaching centers and schedules."}
              {enrollment?.learning_mode === 'hybrid' && " All digital readings are unlocked! Physical session schedules will be displayed in your dashboard."}
            </p>

            <button
              onClick={() => {
                setShowConfirmationModal(false);
              }}
              className="w-full py-3 rounded-xl bg-primary-gold hover:bg-primary-gold/90 text-white text-xs font-bold uppercase tracking-wider transition shadow-sm cursor-pointer"
            >
              Start Learning
            </button>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
