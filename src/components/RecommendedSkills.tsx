import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight, BookOpen, RefreshCw, AlertCircle } from 'lucide-react';

interface SkillRecommendation {
  id: string;
  name: string;
  description: string;
  category_id: string;
  difficulty: string;
  estimated_duration: string;
  career_options?: string[];
  reason?: string;
  benefit?: string;
  next_step?: string;
}

export default function RecommendedSkills() {
  const [skills, setSkills] = useState<SkillRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const fetchRecommendations = async () => {
    setLoading(true);
    setError(null);
    const token = localStorage.getItem('narinexus_token');
    if (!token) {
      setError("Please login to view personalized recommendations.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/skills/recommendations', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (!res.ok) {
        throw new Error(`Failed to fetch recommendations: ${res.statusText}`);
      }
      const data = await res.json();
      if (data.success && Array.isArray(data.skills)) {
        setSkills(data.skills);
      } else {
        throw new Error(data.message || "Invalid response format from server");
      }
    } catch (err: any) {
      console.error("Error fetching recommended skills:", err);
      setError("Unable to generate recommendations. Please try refreshing.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, []);

  if (loading) {
    return (
      <div className="w-full bg-cream/40 border border-primary-gold/10 rounded-3xl p-8 text-center flex flex-col items-center justify-center min-h-[220px]">
        <div className="h-8 w-8 animate-spin rounded-full border-3 border-[#E6AF2E] border-t-transparent mb-3" />
        <span className="text-xs text-[#7D7061] font-semibold tracking-wider uppercase animate-pulse">
          Crafting personalized recommendations...
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
          onClick={fetchRecommendations}
          className="px-4 py-2 bg-white border border-red-200 hover:bg-red-50 text-red-600 rounded-xl text-xs font-bold transition-all duration-200 flex items-center gap-1.5 shadow-sm"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Retry Generating
        </button>
      </div>
    );
  }

  if (skills.length === 0) {
    return (
      <div className="w-full bg-cream/30 border border-dashed border-primary-gold/20 rounded-3xl p-8 text-center flex flex-col items-center justify-center">
        <Sparkles className="h-6 w-6 text-primary-gold/60 mb-2" />
        <p className="text-xs text-[#7D7061] font-semibold">
          Tell us more about your interests in your profile setup to receive smart recommendations.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="bg-blush/60 p-2 rounded-xl border border-primary-gold/15">
            <Sparkles className="h-4.5 w-4.5 text-deep-rose" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-[#2D241A] tracking-tight">
              Recommended for You
            </h2>
            <p className="text-[11px] text-[#7D7061] font-medium leading-tight">
              AI-personalized matching based on your interests and active learning journey.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {skills.map((skill, index) => (
          <div
            key={skill.id || index}
            className="group relative bg-white border border-primary-gold/15 hover:border-primary-gold/30 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between"
          >
            {/* Top Indicator Tag */}
            <div className="absolute top-4 right-4 flex items-center gap-1 bg-cream border border-primary-gold/10 px-2.5 py-0.5 rounded-full">
              <span className="text-[9px] font-extrabold text-deep-rose uppercase tracking-wider">
                {index === 0 ? "Top Pick" : index === 1 ? "Next Step" : "Highly Relevant"}
              </span>
            </div>

            <div>
              <span className="text-[10px] uppercase tracking-widest font-extrabold text-[#6B8E6F] block mb-1">
                {skill.category_id ? skill.category_id.replace('-', ' ') : 'Skill Development'}
              </span>
              <h3 className="font-serif text-lg font-bold text-[#2D241A] tracking-tight pr-12 group-hover:text-deep-rose transition-colors duration-200">
                {skill.name}
              </h3>
              <p className="mt-2 text-xs text-[#7D7061] leading-relaxed line-clamp-2">
                {skill.description}
              </p>

              {/* Personalization Layer */}
              {(skill.reason || skill.benefit || skill.next_step) && (
                <div className="mt-4 p-4 bg-cream/40 border border-primary-gold/10 rounded-2xl space-y-2.5">
                  {skill.reason && (
                    <div>
                      <span className="text-[9px] uppercase font-extrabold tracking-widest text-[#6B8E6F] block">
                        Why Recommended:
                      </span>
                      <span className="text-[11px] text-[#3D2D1E] font-medium leading-normal block">
                        {skill.reason}
                      </span>
                    </div>
                  )}
                  {skill.benefit && (
                    <div>
                      <span className="text-[9px] uppercase font-extrabold tracking-widest text-[#6B8E6F] block">
                        Livelihood Potential:
                      </span>
                      <span className="text-[11px] text-[#7D7061] leading-normal block">
                        {skill.benefit}
                      </span>
                    </div>
                  )}
                  {skill.next_step && (
                    <div className="pt-2 border-t border-primary-gold/10">
                      <span className="text-[9px] uppercase font-extrabold tracking-widest text-[#6B8E6F] block">
                        Suggested Next Step:
                      </span>
                      <span className="text-[11px] text-deep-rose font-bold block">
                        {skill.next_step}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-[#FCF9F5] flex items-center justify-between gap-3">
              <div className="flex items-center gap-1.5 text-[10px] text-[#7D7061] font-bold">
                <BookOpen className="h-3.5 w-3.5 text-primary-gold" />
                <span>{skill.estimated_duration || "Self-Paced"}</span>
              </div>
              <button
                onClick={() => navigate(`/learner/skills/${skill.id}`)}
                className="px-4 py-2 bg-[#E6AF2E] hover:bg-[#D4A017] text-white rounded-xl text-xs font-bold tracking-wider flex items-center gap-1 transition-colors duration-200 shadow-sm"
              >
                Explore
                <ArrowRight className="h-3 w-3" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
