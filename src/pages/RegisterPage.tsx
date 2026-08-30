import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Phone, ArrowLeft, ShieldAlert, Sparkles, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../services/authContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function RegisterPage() {
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<'learner' | 'centre'>('learner');
  const [language, setLanguage] = useState('en');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate inputs
    if (!name.trim() || !email.trim() || !password) {
      setError('Please fill in all required fields.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await register(
        name.trim(),
        email.trim(),
        password,
        role,
        phone.trim() || undefined,
        language
      );

      if (result.success) {
        setSuccess(true);
        setTimeout(() => {
          navigate('/verify-otp', { replace: true, state: { email: email.trim() } });
        }, 1500);
      } else {
        setError(result.message || 'Registration failed. Please check your credentials.');
      }
    } catch (err) {
      setError('An error occurred during registration. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-cream text-[#3D2D1E]" id="register-page-root">
      <Navbar />

      <main className="flex-grow flex items-center justify-center py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 bg-white border border-primary-gold/15 p-8 sm:p-10 rounded-2xl shadow-sm relative overflow-hidden">
          
          {/* Success Overlay with Auto Redirect to Verification Portal */}
          {success && (
            <div className="absolute inset-0 bg-white/95 rounded-2xl z-20 flex flex-col items-center justify-center text-center p-6 transition-all duration-300 animate-fadeIn">
              <span className="flex h-12 w-12 items-center justify-center bg-sage-green text-green-700 mb-4 text-xl rounded-full border border-green-300 shadow-sm font-bold animate-bounce">
                ✓
              </span>
              <h3 className="font-serif text-xl font-bold text-green-900 uppercase tracking-widest">Account Created!</h3>
              <p className="text-xs text-green-700 mt-2 max-w-xs leading-relaxed font-semibold">
                Your NariNexus account has been registered successfully. A 6-digit verification code has been dispatched.
              </p>
              <p className="text-[10px] text-green-600/80 mt-1 font-bold">
                Redirecting to Verification Portal...
              </p>
            </div>
          )}

          <div className="text-center">
            <Link to="/" className="inline-flex items-center space-x-1.5 text-xs font-bold uppercase tracking-widest text-deep-gold hover:text-deep-rose mb-6 group transition-colors">
              <ArrowLeft className="h-4 w-4 transform group-hover:-translate-x-1 transition-transform" />
              <span>Back to Home</span>
            </Link>
            <h2 className="font-serif text-3xl font-extrabold tracking-tight text-[#2D241A]">
              Join NariNexus
            </h2>
            <p className="mt-2 text-xs text-[#7D7061] max-w-xs mx-auto font-medium">
              Begin acquiring practical skills and exploring economic autonomy.
            </p>
          </div>

          {error && (
            <div className="flex flex-col gap-2.5 bg-soft-rose/30 rounded-xl p-4 border border-deep-rose/20 text-xs text-deep-rose leading-normal font-medium animate-fadeIn">
              <div className="flex items-start">
                <ShieldAlert className="h-4.5 w-4.5 mr-2.5 shrink-0 mt-0.5 text-deep-rose" />
                <span>{error}</span>
              </div>
              {error.toLowerCase().includes('already registered') && (
                <div className="flex flex-col gap-2 mt-1 border-t border-deep-rose/10 pt-2 pl-7">
                  <Link
                    to="/login"
                    className="text-[10px] font-extrabold uppercase tracking-widest text-deep-gold hover:text-deep-rose hover:underline self-start transition"
                  >
                    Go to Login Page →
                  </Link>
                  <button
                    type="button"
                    onClick={() => navigate('/verify-otp', { state: { email: email.trim() } })}
                    className="text-[10px] font-extrabold uppercase tracking-widest text-deep-gold hover:text-deep-rose hover:underline self-start transition cursor-pointer"
                  >
                    Verify your account instead →
                  </button>
                </div>
              )}
            </div>
          )}

          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-4">
              
              {/* Full Name */}
              <div>
                <label htmlFor="name" className="block text-[10px] font-extrabold text-[#7D7061] uppercase tracking-widest mb-1.5">
                  Full Name *
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-[#7D7061]">
                    <User className="h-4 w-4 text-primary-gold" />
                  </span>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Savitha Nair"
                    className="block w-full rounded-xl border border-primary-gold/15 bg-white pl-11 pr-3.5 py-3 text-xs text-[#2D241A] focus:border-deep-gold focus:ring-1 focus:ring-deep-gold focus:outline-none placeholder-[#7D7061]/40 font-semibold transition"
                  />
                </div>
              </div>

              {/* Email Address */}
              <div>
                <label htmlFor="email" className="block text-[10px] font-extrabold text-[#7D7061] uppercase tracking-widest mb-1.5">
                  Email Address *
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-[#7D7061]">
                    <Mail className="h-4 w-4 text-primary-gold" />
                  </span>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="savitha@example.com"
                    className="block w-full rounded-xl border border-primary-gold/15 bg-white pl-11 pr-3.5 py-3 text-xs text-[#2D241A] focus:border-deep-gold focus:ring-1 focus:ring-deep-gold focus:outline-none placeholder-[#7D7061]/40 font-semibold transition"
                  />
                </div>
              </div>

              {/* Optional Phone Number */}
              <div>
                <label htmlFor="phone" className="block text-[10px] font-extrabold text-[#7D7061] uppercase tracking-widest mb-1.5">
                  Phone Number (Optional)
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-[#7D7061]">
                    <Phone className="h-4 w-4 text-primary-gold" />
                  </span>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="9876543210"
                    className="block w-full rounded-xl border border-primary-gold/15 bg-white pl-11 pr-3.5 py-3 text-xs text-[#2D241A] focus:border-deep-gold focus:ring-1 focus:ring-deep-gold focus:outline-none placeholder-[#7D7061]/40 font-semibold transition"
                  />
                </div>
              </div>

              {/* Grid for Role Choice & Native Language */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="role" className="block text-[10px] font-extrabold text-[#7D7061] uppercase tracking-widest mb-1.5">
                    Register Role *
                  </label>
                  <select
                    id="role"
                    value={role}
                    onChange={(e) => setRole(e.target.value as any)}
                    className="block w-full rounded-xl border border-primary-gold/15 bg-white px-3.5 py-3 text-xs font-bold uppercase tracking-wider text-[#2D241A] focus:border-deep-gold focus:ring-1 focus:ring-deep-gold focus:outline-none transition cursor-pointer"
                  >
                    <option value="learner">Learner (Student)</option>
                    <option value="centre">Coaching Centre</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="language" className="block text-[10px] font-extrabold text-[#7D7061] uppercase tracking-widest mb-1.5">
                    Native Language
                  </label>
                  <select
                    id="language"
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="block w-full rounded-xl border border-primary-gold/15 bg-white px-3.5 py-3 text-xs font-bold uppercase tracking-wider text-[#2D241A] focus:border-deep-gold focus:ring-1 focus:ring-deep-gold focus:outline-none transition cursor-pointer"
                  >
                    <option value="en">English</option>
                    <option value="hi">हिन्दी (Hindi)</option>
                    <option value="te">తెలుగు (Telugu)</option>
                    <option value="ta">தமிழ் (Tamil)</option>
                    <option value="kn">ಕನ್ನಡ (Kannada)</option>
                    <option value="mr">मराठी (Marathi)</option>
                    <option value="gu">ગુજરાતી (Gujarati)</option>
                  </select>
                </div>
              </div>

              {/* Password Fields */}
              <div>
                <label htmlFor="password" className="block text-[10px] font-extrabold text-[#7D7061] uppercase tracking-widest mb-1.5">
                  Password *
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-[#7D7061]">
                    <Lock className="h-4 w-4 text-primary-gold" />
                  </span>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="block w-full rounded-xl border border-primary-gold/15 bg-white pl-11 pr-3.5 py-3 text-xs text-[#2D241A] focus:border-deep-gold focus:ring-1 focus:ring-deep-gold focus:outline-none placeholder-[#7D7061]/40 font-semibold transition"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-[10px] font-extrabold text-[#7D7061] uppercase tracking-widest mb-1.5">
                  Confirm Password *
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-[#7D7061]">
                    <Lock className="h-4 w-4 text-primary-gold" />
                  </span>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="block w-full rounded-xl border border-primary-gold/15 bg-white pl-11 pr-3.5 py-3 text-xs text-[#2D241A] focus:border-deep-gold focus:ring-1 focus:ring-deep-gold focus:outline-none placeholder-[#7D7061]/40 font-semibold transition"
                  />
                </div>
              </div>

            </div>

            {/* Terms Consent and Submit */}
            <div className="flex items-start">
              <span className="flex items-center mt-0.5">
                <CheckCircle2 className="h-4 w-4 text-deep-gold" />
              </span>
              <p className="ml-2 text-[11px] text-[#7D7061] font-semibold leading-normal">
                By creating an account, you agree to join NariNexus learning circles and share progress markers.
              </p>
            </div>

            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="group relative w-full flex justify-center py-3.5 px-4 text-xs font-bold uppercase tracking-widest text-white bg-gradient-to-r from-deep-rose to-primary-pink hover:from-primary-pink hover:to-deep-rose hover:scale-[1.01] active:scale-95 focus:outline-none rounded-full transition-all duration-300 shadow-sm hover:shadow-md cursor-pointer disabled:opacity-50"
              >
                <span className="absolute left-0 inset-y-0 flex items-center pl-4">
                  <Sparkles className="h-4 w-4 text-white animate-pulse" />
                </span>
                {isSubmitting ? 'Registering Account...' : 'Create Free Account'}
              </button>
            </div>
          </form>

          <div className="text-center text-xs text-[#7D7061] border-t border-primary-gold/10 pt-6">
            Already registered?{' '}
            <Link to="/login" className="font-bold text-deep-gold hover:text-deep-rose hover:underline transition">
              Sign in instead
            </Link>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}
