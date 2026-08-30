import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Save, ShieldAlert, Award, Star, BookOpen, HeartHandshake, Compass, Smile } from 'lucide-react';
import { useAuth } from '../services/authContext';
import { api } from '../services/api';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const EDUCATION_OPTIONS = [
  'No formal education',
  'Primary',
  'Secondary',
  'Higher Secondary',
  'Diploma',
  'Undergraduate',
  'Postgraduate',
  'Other'
];

const SKILL_OPTIONS = [
  'Tailoring',
  'Embroidery',
  'Cooking',
  'Crafting',
  'Mehendi',
  'Beauty care',
  'Computer basics',
  'Digital marketing',
  'Agriculture',
  'Handicrafts',
  'Other'
];

const PREFERENCE_OPTIONS = [
  { value: 'Online', label: 'Online', description: 'Study via video classes on your phone or computer.' },
  { value: 'Offline', label: 'Offline', description: 'Attend in-person training classes at a nearby coaching centre.' },
  { value: 'Hybrid', label: 'Hybrid', description: 'Blend of online courses and in-person practical sessions.' }
];

const CAREER_GOALS = [
  { value: 'Employment', label: 'Employment (Jobs)', description: 'Find full-time or part-time work in a company or shop.' },
  { value: 'Freelancing', label: 'Freelancing (Work from home)', description: 'Take independent orders and earn on your own schedule.' },
  { value: 'Entrepreneurship', label: 'Entrepreneurship (Start business)', description: 'Set up your own boutique, beauty shop, or trading enterprise.' },
  { value: 'Improve existing skills', label: 'Improve existing skills', description: 'Refine and master tasks you are already familiar with.' },
  { value: 'Personal development', label: 'Personal development', description: 'Gain knowledge, build self-confidence, and support your family.' }
];

export default function ProfileSetupPage() {
  const { user, reloadUser } = useAuth();
  const navigate = useNavigate();

  // Wizard state
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 6;

  // Form Fields State
  const [fullName, setFullName] = useState(user?.name || '');
  const [age, setAge] = useState<string>(user?.age ? String(user.age) : '');
  const [location, setLocation] = useState(user?.location || '');
  const [educationLevel, setEducationLevel] = useState(user?.education_level || '');
  const [existingSkills, setExistingSkills] = useState<string[]>(user?.existing_skills || []);
  const [learningInterests, setLearningInterests] = useState<string[]>(user?.learning_interests || []);
  const [learningPreference, setLearningPreference] = useState(user?.learning_preference || '');
  const [careerGoal, setCareerGoal] = useState(user?.career_goal || '');

  // UI Error/Submit State
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto-fill existing user info if they visit
  useEffect(() => {
    if (user) {
      if (user.name && !fullName) setFullName(user.name);
      if (user.age && !age) setAge(String(user.age));
      if (user.location && !location) setLocation(user.location);
      if (user.education_level && !educationLevel) setEducationLevel(user.education_level);
      if (user.existing_skills && existingSkills.length === 0) setExistingSkills(user.existing_skills);
      if (user.learning_interests && learningInterests.length === 0) setLearningInterests(user.learning_interests);
      if (user.learning_preference && !learningPreference) setLearningPreference(user.learning_preference);
      if (user.career_goal && !careerGoal) setCareerGoal(user.career_goal);
    }
  }, [user]);

  // Real-time calculation of completion percentage
  const calculateRealTimePercentage = () => {
    let points = 0;
    const total = 8;

    if (user?.preferred_language) points += 1;
    if (fullName.trim().length >= 2) points += 1;
    if (age && parseInt(age, 10) > 0) points += 1;
    if (location.trim()) points += 1;
    if (educationLevel) points += 1;
    if (existingSkills !== null) points += 1; // Existing skills step is counted once checked
    if (learningInterests.length > 0) points += 1;
    if (learningPreference) points += 1;
    if (careerGoal) points += 1;

    // Minimum 12% if they have preferred language, capped at 100%
    return Math.min(100, Math.round((points / total) * 100));
  };

  const validationErrorForStep = (stepNum: number): string | null => {
    if (stepNum === 1) {
      if (!fullName.trim()) return 'Full Name is required.';
      if (fullName.trim().length < 2) return 'Full Name must be at least 2 characters long.';
      if (!age) return 'Age is required.';
      const ageVal = parseInt(age, 10);
      if (isNaN(ageVal) || ageVal < 1 || ageVal > 120) return 'Please enter a valid age between 1 and 120.';
      if (!location.trim()) return 'Location is required.';
    }
    if (stepNum === 2) {
      if (!educationLevel) return 'Please select an education level.';
    }
    if (stepNum === 4) {
      if (learningInterests.length === 0) return 'Please select at least one skill you want to learn.';
    }
    if (stepNum === 5) {
      if (!learningPreference) return 'Please choose a preferred learning mode.';
    }
    if (stepNum === 6) {
      if (!careerGoal) return 'Please select your primary career goal.';
    }
    return null;
  };

  const handleNext = () => {
    const stepError = validationErrorForStep(currentStep);
    if (stepError) {
      setError(stepError);
      return;
    }
    setError(null);
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    setError(null);
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const toggleExistingSkill = (skill: string) => {
    if (existingSkills.includes(skill)) {
      setExistingSkills(existingSkills.filter(s => s !== skill));
    } else {
      setExistingSkills([...existingSkills, skill]);
    }
  };

  const toggleLearningInterest = (skill: string) => {
    if (learningInterests.includes(skill)) {
      setLearningInterests(learningInterests.filter(s => s !== skill));
    } else {
      setLearningInterests([...learningInterests, skill]);
    }
  };

  const handleSubmitProfile = async () => {
    // Validate final step before submission
    const finalStepError = validationErrorForStep(6);
    if (finalStepError) {
      setError(finalStepError);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const payload = {
      age: parseInt(age, 10),
      location: location.trim(),
      education_level: educationLevel,
      existing_skills: existingSkills,
      learning_interests: learningInterests,
      learning_preference: learningPreference,
      career_goal: careerGoal,
    };

    try {
      // First, update basic info like full name on the backend if changed
      if (fullName.trim() !== user?.name) {
        await api.put('/api/profile', { name: fullName.trim() });
      }

      // Update remaining profile fields
      const response = await api.put('/api/profile', payload);

      if (response.data && response.data.success) {
        // Force authentication provider to reload the updated JWT data
        await reloadUser();
        
        // Navigate learner to their verified home dashboard
        navigate('/learner');
      } else {
        setError(response.data?.message || 'Failed to save profile. Please check your inputs.');
      }
    } catch (err: any) {
      console.error('Profile submission error:', err);
      const detail = err.response?.data?.detail || 'An unexpected error occurred. Please try again.';
      setError(typeof detail === 'string' ? detail : 'An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const completionPct = calculateRealTimePercentage();

  return (
    <div className="flex min-h-screen flex-col bg-cream text-[#3D2D1E]" id="profile-setup-root">
      <Navbar />

      <main className="flex-grow flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl w-full bg-white border border-primary-gold/15 p-8 sm:p-10 rounded-2xl shadow-sm relative overflow-hidden">
          
          {/* Header Progress and Completion Score */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-primary-gold/10 pb-6 mb-8">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-deep-gold">
                Step {currentStep} of {totalSteps}
              </span>
              <h1 className="font-serif text-2xl font-black text-[#2D241A] mt-1">
                Complete Your Profile
              </h1>
            </div>
            
            {/* Real-time Percentage Indicator */}
            <div className="flex items-center space-x-3 bg-[#FFF9F2] px-4 py-2 rounded-xl border border-primary-gold/10 self-start sm:self-center">
              <div className="flex flex-col items-end">
                <span className="text-[10px] font-bold text-[#7D7061] uppercase tracking-widest">
                  Profile Complete
                </span>
                <span className="text-sm font-black text-deep-rose">
                  {completionPct}%
                </span>
              </div>
              <div className="w-16 h-2 bg-primary-gold/20 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-deep-rose transition-all duration-500 rounded-full" 
                  style={{ width: `${completionPct}%` }}
                />
              </div>
            </div>
          </div>

          {/* Stepper Node Visualizer */}
          <div className="hidden sm:flex items-center justify-between mb-8 px-4" aria-hidden="true">
            {Array.from({ length: totalSteps }).map((_, idx) => {
              const stepIdx = idx + 1;
              const isActive = stepIdx === currentStep;
              const isPast = stepIdx < currentStep;
              return (
                <React.Fragment key={stepIdx}>
                  <div className="flex flex-col items-center relative z-10">
                    <div
                      className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 border-2 ${
                        isActive
                          ? 'border-deep-rose bg-deep-rose text-white scale-110 shadow-sm'
                          : isPast
                          ? 'border-[#8FBC8F] bg-[#8FBC8F] text-white'
                          : 'border-primary-gold/20 bg-[#FFFDF9] text-[#7D7061]'
                      }`}
                    >
                      {stepIdx}
                    </div>
                  </div>
                  {stepIdx < totalSteps && (
                    <div
                      className={`flex-grow h-0.5 mx-2 transition-all duration-300 ${
                        isPast ? 'bg-[#8FBC8F]' : 'bg-primary-gold/10'
                      }`}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </div>

          {error && (
            <div className="flex items-start bg-soft-rose/30 rounded-xl p-4 border border-deep-rose/20 text-xs text-deep-rose leading-normal font-medium mb-6 animate-fadeIn">
              <ShieldAlert className="h-4.5 w-4.5 mr-2.5 shrink-0 mt-0.5 text-deep-rose" />
              <span>{error}</span>
            </div>
          )}

          {/* Setup Steps content */}
          <div className="min-h-[250px] py-2">
            
            {/* STEP 1: Basic Information */}
            {currentStep === 1 && (
              <div className="space-y-6 animate-fadeIn" id="step-1-container">
                <div className="space-y-1">
                  <h3 className="text-lg font-extrabold text-[#2D241A] flex items-center gap-2">
                    <Smile className="h-5 w-5 text-deep-gold" />
                    Tell us about yourself
                  </h3>
                  <p className="text-xs text-[#7D7061] font-semibold">
                    We'll customize your dashboard based on your age and region.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                  <div className="space-y-1.5">
                    <label htmlFor="fullname" className="block text-[10px] font-extrabold text-[#7D7061] uppercase tracking-widest">
                      Full Name *
                    </label>
                    <input
                      id="fullname"
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => {
                        setFullName(e.target.value);
                        setError(null);
                      }}
                      placeholder="Enter your full name"
                      className="block w-full rounded-xl border border-primary-gold/15 bg-white px-4 py-3 text-xs text-[#2D241A] focus:border-deep-gold focus:ring-1 focus:ring-deep-gold focus:outline-none placeholder-[#7D7061]/30 font-semibold"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="age" className="block text-[10px] font-extrabold text-[#7D7061] uppercase tracking-widest">
                      Age (Years) *
                    </label>
                    <input
                      id="age"
                      type="number"
                      required
                      min="1"
                      max="120"
                      value={age}
                      onChange={(e) => {
                        setAge(e.target.value);
                        setError(null);
                      }}
                      placeholder="E.g., 24"
                      className="block w-full rounded-xl border border-primary-gold/15 bg-white px-4 py-3 text-xs text-[#2D241A] focus:border-deep-gold focus:ring-1 focus:ring-deep-gold focus:outline-none placeholder-[#7D7061]/30 font-semibold"
                    />
                  </div>

                  <div className="space-y-1.5 md:col-span-2">
                    <label htmlFor="location" className="block text-[10px] font-extrabold text-[#7D7061] uppercase tracking-widest">
                      Your Location / City / District *
                    </label>
                    <input
                      id="location"
                      type="text"
                      required
                      value={location}
                      onChange={(e) => {
                        setLocation(e.target.value);
                        setError(null);
                      }}
                      placeholder="E.g., Bengaluru, Hubballi, Mysuru"
                      className="block w-full rounded-xl border border-primary-gold/15 bg-white px-4 py-3 text-xs text-[#2D241A] focus:border-deep-gold focus:ring-1 focus:ring-deep-gold focus:outline-none placeholder-[#7D7061]/30 font-semibold"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: Education */}
            {currentStep === 2 && (
              <div className="space-y-6 animate-fadeIn" id="step-2-container">
                <div className="space-y-1">
                  <h3 className="text-lg font-extrabold text-[#2D241A] flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-deep-gold" />
                    What is your educational background?
                  </h3>
                  <p className="text-xs text-[#7D7061] font-semibold">
                    This helps us match courses suitable for your reading comfort.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-4">
                  {EDUCATION_OPTIONS.map((edu) => {
                    const isSelected = educationLevel === edu;
                    return (
                      <button
                        key={edu}
                        type="button"
                        onClick={() => {
                          setEducationLevel(edu);
                          setError(null);
                        }}
                        className={`p-4 text-left text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                          isSelected
                            ? 'border-deep-rose bg-[#FFF9F2] text-[#2D241A]'
                            : 'border-primary-gold/15 bg-[#FFFDF9] text-[#7D7061] hover:border-primary-gold/30 hover:bg-[#FFF9F2]/30'
                        }`}
                      >
                        {edu}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* STEP 3: Existing Skills */}
            {currentStep === 3 && (
              <div className="space-y-6 animate-fadeIn" id="step-3-container">
                <div className="space-y-1">
                  <span className="bg-sage-green/20 text-green-700 text-[9px] px-2.5 py-1 rounded-full uppercase tracking-wider font-extrabold">
                    Optional
                  </span>
                  <h3 className="text-lg font-extrabold text-[#2D241A] mt-2 flex items-center gap-2">
                    <Star className="h-5 w-5 text-deep-gold" />
                    Do you have any existing skills?
                  </h3>
                  <p className="text-xs text-[#7D7061] font-semibold">
                    Select any work or skills you already know. You can choose more than one.
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-4">
                  {SKILL_OPTIONS.map((skill) => {
                    const isSelected = existingSkills.includes(skill);
                    return (
                      <button
                        key={skill}
                        type="button"
                        onClick={() => toggleExistingSkill(skill)}
                        className={`p-3.5 text-center text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                          isSelected
                            ? 'border-deep-rose bg-deep-rose/5 text-[#2D241A]'
                            : 'border-primary-gold/15 bg-[#FFFDF9] text-[#7D7061] hover:border-primary-gold/30 hover:bg-[#FFF9F2]/30'
                        }`}
                      >
                        {skill}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* STEP 4: Learning Interests */}
            {currentStep === 4 && (
              <div className="space-y-6 animate-fadeIn" id="step-4-container">
                <div className="space-y-1">
                  <h3 className="text-lg font-extrabold text-[#2D241A] flex items-center gap-2">
                    <Award className="h-5 w-5 text-deep-gold" />
                    What skills do you want to learn? *
                  </h3>
                  <p className="text-xs text-[#7D7061] font-semibold">
                    We will recommend customized lessons based on your answers. Choose one or more.
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-4">
                  {SKILL_OPTIONS.map((skill) => {
                    const isSelected = learningInterests.includes(skill);
                    return (
                      <button
                        key={skill}
                        type="button"
                        onClick={() => toggleLearningInterest(skill)}
                        className={`p-3.5 text-center text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                          isSelected
                            ? 'border-deep-rose bg-deep-rose/5 text-[#2D241A]'
                            : 'border-primary-gold/15 bg-[#FFFDF9] text-[#7D7061] hover:border-primary-gold/30 hover:bg-[#FFF9F2]/30'
                        }`}
                      >
                        {skill}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* STEP 5: Learning Preference */}
            {currentStep === 5 && (
              <div className="space-y-6 animate-fadeIn" id="step-5-container">
                <div className="space-y-1">
                  <h3 className="text-lg font-extrabold text-[#2D241A] flex items-center gap-2">
                    <Compass className="h-5 w-5 text-deep-gold" />
                    How would you like to study? *
                  </h3>
                  <p className="text-xs text-[#7D7061] font-semibold">
                    Select a learning style that fits your family and daily schedule.
                  </p>
                </div>

                <div className="space-y-3.5 pt-4">
                  {PREFERENCE_OPTIONS.map((pref) => {
                    const isSelected = learningPreference === pref.value;
                    return (
                      <button
                        key={pref.value}
                        type="button"
                        onClick={() => {
                          setLearningPreference(pref.value);
                          setError(null);
                        }}
                        className={`w-full p-4.5 rounded-xl border text-left flex items-start space-x-3.5 transition-all cursor-pointer ${
                          isSelected
                            ? 'border-deep-rose bg-[#FFF9F2] text-[#2D241A]'
                            : 'border-primary-gold/15 bg-[#FFFDF9] text-[#7D7061] hover:border-primary-gold/30 hover:bg-[#FFF9F2]/30'
                        }`}
                      >
                        <div
                          className={`mt-1 h-4 w-4 shrink-0 rounded-full border-2 flex items-center justify-center ${
                            isSelected ? 'border-deep-rose text-deep-rose' : 'border-primary-gold/30 bg-white'
                          }`}
                        >
                          {isSelected && <div className="h-2 w-2 rounded-full bg-deep-rose" />}
                        </div>
                        <div>
                          <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#2D241A]">{pref.label}</h4>
                          <p className="text-[11px] text-[#7D7061] mt-1.5 leading-relaxed font-semibold">{pref.description}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* STEP 6: Career Goal */}
            {currentStep === 6 && (
              <div className="space-y-6 animate-fadeIn" id="step-6-container">
                <div className="space-y-1">
                  <h3 className="text-lg font-extrabold text-[#2D241A] flex items-center gap-2">
                    <HeartHandshake className="h-5 w-5 text-deep-gold" />
                    What is your main career goal? *
                  </h3>
                  <p className="text-xs text-[#7D7061] font-semibold">
                    We will help you connect with jobs, clients, or local coaches according to your dream.
                  </p>
                </div>

                <div className="space-y-3 pt-4">
                  {CAREER_GOALS.map((goal) => {
                    const isSelected = careerGoal === goal.value;
                    return (
                      <button
                        key={goal.value}
                        type="button"
                        onClick={() => {
                          setCareerGoal(goal.value);
                          setError(null);
                        }}
                        className={`w-full p-4.5 rounded-xl border text-left flex items-start space-x-3.5 transition-all cursor-pointer ${
                          isSelected
                            ? 'border-deep-rose bg-[#FFF9F2] text-[#2D241A]'
                            : 'border-primary-gold/15 bg-[#FFFDF9] text-[#7D7061] hover:border-primary-gold/30 hover:bg-[#FFF9F2]/30'
                        }`}
                      >
                        <div
                          className={`mt-1 h-4 w-4 shrink-0 rounded-full border-2 flex items-center justify-center ${
                            isSelected ? 'border-deep-rose text-deep-rose' : 'border-primary-gold/30 bg-white'
                          }`}
                        >
                          {isSelected && <div className="h-2 w-2 rounded-full bg-deep-rose" />}
                        </div>
                        <div>
                          <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#2D241A]">{goal.label}</h4>
                          <p className="text-[11px] text-[#7D7061] mt-1.5 leading-relaxed font-semibold">{goal.description}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

          </div>

          {/* Navigation Controls */}
          <div className="flex items-center justify-between border-t border-primary-gold/10 pt-6 mt-8">
            <button
              type="button"
              onClick={handleBack}
              disabled={currentStep === 1 || isSubmitting}
              className="flex items-center px-4 py-3.5 rounded-xl border border-primary-gold/25 text-xs font-extrabold uppercase tracking-widest text-[#7D7061] hover:bg-primary-gold/5 transition disabled:opacity-30 cursor-pointer"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              <span>Back</span>
            </button>

            {currentStep < totalSteps ? (
              <button
                type="button"
                onClick={handleNext}
                className="flex items-center px-6 py-3.5 border border-transparent rounded-xl text-xs font-extrabold uppercase tracking-widest text-white bg-deep-gold hover:bg-deep-rose transition shadow-md hover:shadow-lg focus:outline-none cursor-pointer"
              >
                <span>Next</span>
                <ArrowRight className="ml-2 h-4 w-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmitProfile}
                disabled={isSubmitting}
                className="flex items-center px-6 py-3.5 border border-transparent rounded-xl text-xs font-extrabold uppercase tracking-widest text-white bg-deep-rose hover:bg-[#D45050] transition shadow-md hover:shadow-lg focus:outline-none disabled:opacity-50 cursor-pointer"
              >
                <span>{isSubmitting ? 'Saving...' : 'Complete & Enter'}</span>
                {!isSubmitting && <Save className="ml-2 h-4 w-4" />}
              </button>
            )}
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}
