import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight, BookOpen, Clock, RefreshCw, AlertCircle, Award } from 'lucide-react';

interface CourseRecommendation {
  id: string;
  title: string;
  description: string;
  skill_id: string;
  category_id: string;
  difficulty: string;
  duration: string;
  reason?: string;
  benefit?: string;
  relevance?: string;
}

export default function RecommendedCourses() {
  const [courses, setCourses] = useState<CourseRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const fetchCourseRecommendations = async () => {
    setLoading(true);
    setError(null);
    const token = localStorage.getItem('narinexus_token');
    if (!token) {
      setError("Please login to view your personalized course path.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/courses/recommendations', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (!res.ok) {
        throw new Error(`Failed to fetch course recommendations: ${res.statusText}`);
      }
      const data = await res.json();
      if (data.success && Array.isArray(data.courses)) {
        setCourses(data.courses);
      } else {
        throw new Error(data.message || "Invalid server response");
      }
    } catch (err: any) {
      console.error("Error fetching recommended courses:", err);
      setError("We encountered an error loading your personalized course path. Try refreshing.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourseRecommendations();
  }, []);

  if (loading) {
    return (
      <div className="w-full bg-cream/40 border border-primary-gold/10 rounded-3xl p-8 text-center flex flex-col items-center justify-center min-h-[220px]">
        <div className="h-8 w-8 animate-spin rounded-full border-3 border-[#E6AF2E] border-t-transparent mb-3" />
        <span className="text-xs text-[#7D7061] font-semibold tracking-wider uppercase animate-pulse">
          Analyzing your skills & selecting custom courses...
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full bg-[#FFF5F5] border border-red-200 rounded-3xl p-6 text-center flex flex-col items-center justify-center">
        <AlertCircle className="h-8 w-8 text-red-500 mb-2" />
        <p className="text-xs text-[#7D7061] font-semibold mb-3">{error}</p>
        <button
          onClick={fetchCourseRecommendations}
          className="px-4 py-2 bg-white border border-red-200 hover:bg-red-50 text-red-600 rounded-xl text-xs font-bold transition-all duration-200 flex items-center gap-1.5 shadow-sm"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh Recommended Courses
        </button>
      </div>
    );
  }

  if (courses.length === 0) {
    return (
      <div className="w-full bg-cream/30 border border-dashed border-primary-gold/20 rounded-3xl p-8 text-center flex flex-col items-center justify-center">
        <Sparkles className="h-6 w-6 text-primary-gold/60 mb-2" />
        <p className="text-xs text-[#7D7061] font-semibold">
          Complete more skills training or lessons to unlock advanced, targeted course recommendations.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="bg-blush/60 p-2 rounded-xl border border-primary-gold/15">
            <Award className="h-4.5 w-4.5 text-deep-rose" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-[#2D241A] tracking-tight">
              Recommended Courses for You
            </h2>
            <p className="text-[11px] text-[#7D7061] font-medium leading-tight">
              Curated course list based on your progress, completed modules, and career objectives.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {courses.map((course, index) => (
          <div
            key={course.id || index}
            className="group relative bg-white border border-primary-gold/15 hover:border-primary-gold/30 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between"
          >
            {/* Top Rank Badge */}
            <div className="absolute top-4 right-4 flex items-center gap-1 bg-cream border border-primary-gold/10 px-2.5 py-0.5 rounded-full">
              <span className="text-[9px] font-extrabold text-[#6B8E6F] uppercase tracking-wider">
                {index === 0 ? "Highly Matching" : index === 1 ? "Recommended Next" : "Career Path"}
              </span>
            </div>

            <div>
              <span className="text-[10px] uppercase tracking-widest font-extrabold text-[#E6AF2E] block mb-1">
                {course.category_id ? course.category_id.replace('-', ' ') : 'Course Pathway'}
              </span>
              <h3 className="font-serif text-base font-bold text-[#2D241A] tracking-tight pr-14 group-hover:text-deep-rose transition-colors duration-200">
                {course.title}
              </h3>
              <p className="mt-2 text-xs text-[#7D7061] leading-relaxed line-clamp-2">
                {course.description}
              </p>

              {/* Advanced Personalized Reason Layer */}
              {(course.reason || course.benefit) && (
                <div className="mt-4 p-4 bg-[#FFFBF0]/60 border border-primary-gold/10 rounded-2xl space-y-2.5">
                  {course.reason && (
                    <div>
                      <span className="text-[9px] uppercase font-extrabold tracking-widest text-[#6B8E6F] block">
                        Why recommended:
                      </span>
                      <span className="text-[11px] text-[#3D2D1E] font-medium leading-normal block">
                        {course.reason}
                      </span>
                    </div>
                  )}
                  {course.benefit && (
                    <div>
                      <span className="text-[9px] uppercase font-extrabold tracking-widest text-[#6B8E6F] block">
                        Your career payoff:
                      </span>
                      <span className="text-[11px] text-[#7D7061] leading-normal block">
                        {course.benefit}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-[#FCF9F5] flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1 text-[10px] text-[#7D7061] font-bold">
                  <Clock className="h-3.5 w-3.5 text-primary-gold" />
                  <span>{course.duration || "Self-Paced"}</span>
                </div>
                <span className="text-[9px] uppercase bg-blush px-2 py-0.5 rounded text-deep-rose font-bold">
                  {course.difficulty}
                </span>
              </div>
              <button
                onClick={() => navigate(`/learner/courses/${course.id}`)}
                className="px-4 py-2 bg-deep-rose hover:bg-deep-rose/90 text-white rounded-xl text-xs font-bold tracking-wider flex items-center gap-1 transition-all duration-200 shadow-sm"
              >
                Start Learning
                <ArrowRight className="h-3 w-3" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
