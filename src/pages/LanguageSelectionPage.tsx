import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Globe, Check, ArrowRight, ShieldAlert, HeartHandshake } from 'lucide-react';
import { useAuth } from '../services/authContext';
import { api } from '../services/api';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

interface LanguageOption {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
}

const LANGUAGES: LanguageOption[] = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧' },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ', flag: '🌾' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🌸' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', flag: '🌿' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', flag: '🥥' }
];

export default function LanguageSelectionPage() {
  const { user, updateUser } = useAuth();
  const [selectedLang, setSelectedLang] = useState<string>(user?.preferred_language || 'en');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleContinue = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      // Save language to DB using PUT /api/profile
      const response = await api.put('/api/profile', {
        preferred_language: selectedLang
      });

      if (response.data && response.data.success) {
        // Update user context state locally
        updateUser({ preferred_language: selectedLang });
        
        // Advance to the multi-step profile setup wizard
        navigate('/onboarding/profile');
      } else {
        setError(response.data?.message || 'Failed to update preferred language.');
      }
    } catch (err: any) {
      console.error('Error saving language selection:', err);
      const detail = err.response?.data?.detail || 'An unexpected error occurred. Please try again.';
      setError(typeof detail === 'string' ? detail : 'An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-cream text-[#3D2D1E]" id="language-page-root">
      <Navbar />

      <main className="flex-grow flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl w-full space-y-8 bg-white border border-primary-gold/15 p-8 sm:p-10 rounded-2xl shadow-sm relative overflow-hidden">
          
          <div className="text-center space-y-2">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[#FFF9F2] border border-primary-gold/20 shadow-sm text-primary-gold">
              <Globe className="h-6 w-6 text-deep-gold animate-pulse" />
            </div>
            <h2 className="font-serif text-3xl font-extrabold tracking-tight text-[#2D241A] mt-4">
              Choose your preferred language
            </h2>
            <p className="text-xs text-[#7D7061] max-w-md mx-auto leading-relaxed font-semibold">
              Learn NariNexus in the language you're most comfortable with.
            </p>
          </div>

          {error && (
            <div className="flex items-start bg-soft-rose/30 rounded-xl p-4 border border-deep-rose/20 text-xs text-deep-rose leading-normal font-medium animate-fadeIn">
              <ShieldAlert className="h-4.5 w-4.5 mr-2.5 shrink-0 mt-0.5 text-deep-rose" />
              <span>{error}</span>
            </div>
          )}

          {/* Large Language Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
            {LANGUAGES.map((lang) => {
              const isSelected = selectedLang === lang.code;
              return (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => setSelectedLang(lang.code)}
                  className={`flex items-center justify-between p-5 rounded-2xl border-2 text-left transition-all duration-300 cursor-pointer ${
                    isSelected
                      ? 'border-deep-rose bg-[#FFF9F2] shadow-sm scale-[1.02]'
                      : 'border-primary-gold/15 bg-[#FFFDF9] hover:border-primary-gold/40 hover:bg-[#FFF9F2]/40'
                  }`}
                >
                  <div className="flex items-center space-x-4">
                    <span className="text-2xl">{lang.flag}</span>
                    <div>
                      <h4 className="text-sm font-bold text-[#2D241A]">{lang.name}</h4>
                      <p className="text-xs text-deep-gold font-bold font-serif">{lang.nativeName}</p>
                    </div>
                  </div>
                  
                  {/* Selected Indicator */}
                  <div
                    className={`h-5 w-5 rounded-full flex items-center justify-center border-2 transition-all duration-200 ${
                      isSelected
                        ? 'border-deep-rose bg-deep-rose text-white scale-110'
                        : 'border-primary-gold/30 bg-white'
                    }`}
                  >
                    {isSelected && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="pt-6 border-t border-primary-gold/10">
            <button
              type="button"
              onClick={handleContinue}
              disabled={isSubmitting}
              className="w-full flex items-center justify-center px-6 py-3.5 border border-transparent rounded-xl text-xs font-extrabold uppercase tracking-widest text-white bg-deep-gold hover:bg-deep-rose transition shadow-md hover:shadow-lg focus:outline-none disabled:opacity-50 cursor-pointer"
            >
              <span>{isSubmitting ? 'Saving...' : 'Continue'}</span>
              {!isSubmitting && <ArrowRight className="ml-2 h-4 w-4" />}
            </button>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}
