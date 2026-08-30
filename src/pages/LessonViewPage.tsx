import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  ArrowRight, 
  BookOpen, 
  Clock, 
  List, 
  CheckCircle, 
  PlayCircle,
  Home
} from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

interface Course {
  id: string;
  title: string;
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

export default function LessonViewPage() {
  const { courseId, lessonId } = useParams<{ courseId: string; lessonId: string }>();
  const navigate = useNavigate();
  
  const [course, setCourse] = useState<Course | null>(null);
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [allLessons, setAllLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchLessonData();
  }, [courseId, lessonId]);

  const fetchLessonData = async () => {
    if (!courseId || !lessonId) return;
    setLoading(true);
    setError(null);
    try {
      const headers = {
        Authorization: `Bearer ${localStorage.getItem('narinexus_token')}`
      };

      // 1. Fetch course details
      const courseRes = await fetch(`/api/courses/${courseId}`, { headers });
      if (courseRes.ok) {
        const courseData = await courseRes.json();
        if (courseData.success) {
          setCourse(courseData.course);
        }
      }

      // 2. Fetch specific lesson
      const lessonRes = await fetch(`/api/courses/${courseId}/lessons/${lessonId}`, { headers });
      if (!lessonRes.ok) {
        throw new Error("This lesson module is locked or unavailable.");
      }
      const lessonData = await lessonRes.json();
      if (lessonData.success) {
        setLesson(lessonData.lesson);
      }

      // 3. Fetch all lessons (for navigation indexing)
      const allRes = await fetch(`/api/courses/${courseId}/lessons`, { headers });
      if (allRes.ok) {
        const allData = await allRes.json();
        if (allData.success) {
          setAllLessons(allData.lessons);
        }
      }
    } catch (err: any) {
      setError(err.message || "Failed to load lesson module.");
    } finally {
      setLoading(false);
    }
  };

  // Find index and build previous/next handles
  const currentIndex = allLessons.findIndex(l => l.id === lessonId);
  const prevLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null;
  const nextLesson = currentIndex >= 0 && currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null;

  const navigateToLesson = (targetId: string) => {
    navigate(`/learner/courses/${courseId}/lessons/${targetId}`);
  };

  // Simple Markdown-style converter for rendering clean articles nicely
  const renderFormattedContent = (text: string) => {
    return text.split('\n').map((para, index) => {
      const trimmed = para.trim();
      if (trimmed.startsWith('###')) {
        return <h3 key={index} className="text-lg font-bold text-[#2D241A] mt-6 mb-3">{trimmed.replace('###', '').trim()}</h3>;
      }
      if (trimmed.startsWith('####')) {
        return <h4 key={index} className="text-base font-bold text-primary-gold mt-4 mb-2">{trimmed.replace('####', '').trim()}</h4>;
      }
      if (trimmed.startsWith('*') || trimmed.startsWith('-')) {
        return (
          <li key={index} className="text-sm text-[#7D7061] leading-relaxed ml-4 list-disc mb-1.5">
            {trimmed.substring(1).trim()}
          </li>
        );
      }
      if (trimmed.startsWith('1.') || trimmed.startsWith('2.') || trimmed.startsWith('3.') || trimmed.startsWith('4.')) {
        return (
          <li key={index} className="text-sm text-[#7D7061] leading-relaxed ml-4 list-decimal mb-1.5">
            {trimmed.substring(2).trim()}
          </li>
        );
      }
      if (trimmed === '') {
        return <div key={index} className="h-2" />;
      }
      return <p key={index} className="text-sm text-[#7D7061] leading-relaxed mb-4">{trimmed}</p>;
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-[#FCF9F5] text-[#2D241A]">
        <Navbar />
        <div className="flex-grow flex flex-col items-center justify-center py-24">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-gold border-t-transparent mb-3" />
          <span className="text-xs font-semibold text-[#7D7061]">Formatting lesson article...</span>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !lesson || !course) {
    return (
      <div className="min-h-screen flex flex-col bg-[#FCF9F5] text-[#2D241A]">
        <Navbar />
        <div className="flex-grow max-w-lg mx-auto w-full px-4 py-24 text-center">
          <div className="bg-soft-rose/10 border border-soft-rose/30 text-deep-rose rounded-2xl p-8">
            <h3 className="font-bold text-sm mb-2">Lesson Unavailable</h3>
            <p className="text-xs mb-4">{error || "This module could not be displayed."}</p>
            <Link to={`/learner/courses/${courseId}`} className="inline-flex items-center gap-1.5 rounded-xl bg-deep-rose px-4 py-2 text-xs font-bold text-white transition">
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Course Syllabus</span>
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div id="lesson-view-container" className="min-h-screen flex flex-col bg-[#FCF9F5] text-[#2D241A] font-sans">
      <Navbar />

      <main className="flex-grow max-w-7xl w-full mx-auto px-4 py-8">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between mb-6">
          <Link 
            to={`/learner/courses/${courseId}`}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#7D7061] hover:text-[#2D241A] transition"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Syllabus Home</span>
          </Link>
          <span className="text-xs font-bold text-primary-gold uppercase tracking-wider">
            {course.title}
          </span>
        </div>

        {/* Master Lesson Layout split */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Sidebar checklist modules */}
          <div className="lg:col-span-1 bg-white border border-primary-gold/10 rounded-2xl p-5 h-fit lg:sticky lg:top-6 order-2 lg:order-1">
            <div className="flex items-center gap-2 border-b border-primary-gold/5 pb-3 mb-4">
              <List className="h-4.5 w-4.5 text-primary-gold" />
              <h3 className="font-bold text-xs uppercase tracking-wider text-[#2D241A]">Modules Checklist</h3>
            </div>

            <div className="space-y-3">
              {allLessons.map((les) => {
                const isActive = les.id === lessonId;
                return (
                  <button 
                    key={les.id}
                    disabled={!les.is_preview && !isActive}
                    onClick={() => navigateToLesson(les.id)}
                    className={`w-full flex items-start gap-2.5 p-2.5 rounded-xl text-left border transition text-xs ${
                      isActive 
                        ? 'bg-light-pink border-soft-rose text-deep-rose font-bold'
                        : les.is_preview
                          ? 'border-transparent hover:bg-cream text-[#2D241A] font-medium cursor-pointer'
                          : 'border-transparent opacity-50 text-[#7D7061] cursor-not-allowed'
                    }`}
                  >
                    <div className="mt-0.5 shrink-0">
                      {les.is_preview ? (
                        <PlayCircle className="h-4 w-4 text-primary-gold" />
                      ) : (
                        <CheckCircle className="h-4 w-4 text-[#7D7061]" />
                      )}
                    </div>
                    <div>
                      <div className="text-[10px] text-[#7D7061] uppercase leading-none mb-1">Module {les.lesson_number}</div>
                      <span className="line-clamp-2 leading-tight">{les.title}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Core Lesson Reading Canvas */}
          <div className="lg:col-span-3 bg-white border border-primary-gold/10 rounded-2xl p-6 md:p-10 shadow-sm order-1 lg:order-2">
            
            {/* Header info */}
            <div className="border-b border-primary-gold/10 pb-6 mb-6">
              <div className="flex items-center gap-2 mb-2 text-xs font-bold text-primary-gold uppercase tracking-wider">
                <BookOpen className="h-4 w-4" />
                <span>Module {lesson.lesson_number} of {allLessons.length}</span>
                <span className="text-[#7D7061]/30">•</span>
                <span className="flex items-center gap-1 text-[#7D7061]">
                  <Clock className="h-3.5 w-3.5 text-[#7D7061]" />
                  {lesson.duration}
                </span>
              </div>
              <h1 className="text-xl md:text-2.5xl font-extrabold text-[#2D241A] tracking-tight leading-tight">
                {lesson.title}
              </h1>
            </div>

            {/* Reading body container */}
            <div id="lesson-reading-body" className="prose max-w-none text-[#7D7061] mb-10">
              {renderFormattedContent(lesson.content)}
            </div>

            {/* Bottom Navigation controls */}
            <div className="flex items-center justify-between pt-6 border-t border-primary-gold/10 mt-12 gap-4">
              {prevLesson ? (
                <button 
                  onClick={() => navigateToLesson(prevLesson.id)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-primary-gold/20 hover:border-primary-gold px-4 py-2.5 text-xs font-bold text-[#7D7061] hover:text-[#2D241A] transition cursor-pointer"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Prev: Module {prevLesson.lesson_number}</span>
                </button>
              ) : (
                <div />
              )}

              {nextLesson && nextLesson.is_preview ? (
                <button 
                  onClick={() => navigateToLesson(nextLesson.id)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-deep-rose hover:bg-deep-rose/90 px-4 py-2.5 text-xs font-bold text-white transition cursor-pointer shadow-sm"
                >
                  <span>Next: Module {nextLesson.lesson_number}</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              ) : (
                <Link 
                  to={`/learner/courses/${courseId}`}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-primary-gold/15 hover:border-primary-gold px-4 py-2.5 text-xs font-bold text-[#7D7061] hover:text-[#2D241A] transition"
                >
                  <Home className="h-4 w-4 text-primary-gold" />
                  <span>Syllabus Home</span>
                </Link>
              )}
            </div>

          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}
