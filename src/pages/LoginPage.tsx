import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, LogIn, ArrowLeft, ShieldAlert, Sparkles, Key, ChevronDown, ChevronUp } from 'lucide-react';
import { useAuth } from '../services/authContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [redirectedRole, setRedirectedRole] = useState<string>('learner');
  const [showDemoLogins, setShowDemoLogins] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();

  // Get redirection target or fallback based on login roles
  const from = location.state?.from?.pathname || '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setError(null);
    setIsSubmitting(true);

    try {
      const result = await login(email, password);
      if (result.success && result.user) {
        setSuccess(true);
        const userRole = result.user.role || 'learner';
        setRedirectedRole(userRole);

        setTimeout(() => {
          // If from target matches role, route there; otherwise route to default role page
          if (from && from.startsWith(`/${userRole}`)) {
            navigate(from, { replace: true });
          } else {
            navigate(`/${userRole}`, { replace: true });
          }
        }, 1200);
      } else {
        setError(result.message || 'Incorrect email or password.');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFillDemo = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('securePassword123');
    setError(null);
  };

  const handlePlaceholderAlert = (method: string) => {
    alert(`${method} login is a planned feature and will be implemented in subsequent development phases.`);
  };

  return (
    <div className="flex min-h-screen flex-col bg-cream text-[#3D2D1E]" id="login-page-root">
      <Navbar />

      <main className="flex-grow flex items-center justify-center py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 bg-white border border-primary-gold/15 p-8 sm:p-10 rounded-2xl shadow-sm relative overflow-hidden">
          
          {/* Success Routing Transition Overlay */}
          {success && (
            <div className="absolute inset-0 bg-white/95 rounded-2xl z-20 flex flex-col items-center justify-center text-center p-6 transition-all duration-300">
              <span className="flex h-12 w-12 items-center justify-center bg-sage-green text-green-700 mb-4 text-xl rounded-full border border-green-300 shadow-sm font-bold animate-bounce">
                ✓
              </span>
              <h3 className="font-serif text-xl font-bold text-green-900 uppercase tracking-widest">Login Successful</h3>
              <p className="text-xs text-green-700 mt-2 max-w-xs leading-relaxed font-semibold">
                Access Granted! Redirecting you to your <strong className="uppercase">{redirectedRole} dashboard</strong>...
              </p>
            </div>
          )}

          <div className="text-center">
            <Link to="/" className="inline-flex items-center space-x-1.5 text-xs font-bold uppercase tracking-widest text-deep-gold hover:text-deep-rose mb-6 group transition-colors duration-200">
              <ArrowLeft className="h-4 w-4 transform group-hover:-translate-x-1 transition-transform" />
              <span>Back to Home</span>
            </Link>
            <h2 className="font-serif text-3xl font-extrabold tracking-tight text-[#2D241A]">
              Welcome Back
            </h2>
            <p className="mt-2 text-xs text-[#7D7061] max-w-xs mx-auto font-medium">
              Access your personalized learning, coaching, and management circles.
            </p>
          </div>

          {/* Quick Demo Login Help Panel */}
          <div className="border border-primary-gold/20 rounded-xl bg-soft-yellow/15 overflow-hidden transition-all duration-300">
            <button
              type="button"
              onClick={() => setShowDemoLogins(!showDemoLogins)}
              className="w-full flex items-center justify-between px-4 py-3 bg-soft-yellow/25 hover:bg-soft-yellow/40 transition-colors text-xs font-bold text-deep-gold uppercase tracking-wider cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Key className="h-4 w-4 text-primary-gold" />
                <span>Explore with Demo Portals</span>
              </div>
              {showDemoLogins ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
            
            {showDemoLogins && (
              <div className="p-4 space-y-3 border-t border-primary-gold/10 bg-white/50 text-xs animate-fadeIn">
                <p className="text-[11px] text-[#7D7061] font-medium leading-relaxed">
                  Select a role below to auto-fill the credentials of a pre-seeded account and access their specific dashboard portal.
                </p>
                <div className="grid grid-cols-1 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => handleFillDemo('notif_learner_a_6fe0bf@gmail.com')}
                    className="flex flex-col text-left p-2.5 rounded-lg border border-primary-gold/10 hover:border-primary-pink/50 hover:bg-light-pink/15 transition-all text-xs cursor-pointer group"
                  >
                    <span className="font-extrabold text-[#3D2D1E] uppercase tracking-wider text-[10px] group-hover:text-deep-rose transition-colors">
                      👤 Learner Account
                    </span>
                    <span className="text-[10px] text-[#7D7061] mt-0.5 font-medium leading-tight">
                      Email: notif_learner_a_6fe0bf@gmail.com
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleFillDemo('centre_9de948@naricentre.org')}
                    className="flex flex-col text-left p-2.5 rounded-lg border border-primary-gold/10 hover:border-green-400 hover:bg-sage-green/10 transition-all text-xs cursor-pointer group"
                  >
                    <span className="font-extrabold text-[#3D2D1E] uppercase tracking-wider text-[10px] group-hover:text-green-800 transition-colors">
                      🏫 Coaching/Training Centre
                    </span>
                    <span className="text-[10px] text-[#7D7061] mt-0.5 font-medium leading-tight">
                      Email: centre_9de948@naricentre.org
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleFillDemo('app_tracker_admin_6fae91@narinexus.org')}
                    className="flex flex-col text-left p-2.5 rounded-lg border border-primary-gold/10 hover:border-deep-gold hover:bg-soft-yellow/10 transition-all text-xs cursor-pointer group"
                  >
                    <span className="font-extrabold text-[#3D2D1E] uppercase tracking-wider text-[10px] group-hover:text-deep-gold transition-colors">
                      🛡️ Platform Administrator
                    </span>
                    <span className="text-[10px] text-[#7D7061] mt-0.5 font-medium leading-tight">
                      Email: app_tracker_admin_6fae91@narinexus.org
                    </span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {error && (
            <div className="flex flex-col gap-2 bg-soft-rose/30 rounded-xl p-4 border border-deep-rose/20 text-xs text-deep-rose leading-normal font-medium animate-fadeIn">
              <div className="flex items-start">
                <ShieldAlert className="h-4.5 w-4.5 mr-2.5 shrink-0 mt-0.5 text-deep-rose" />
                <span>{error}</span>
              </div>
              {error.toLowerCase().includes('verification') && email && (
                <button
                  type="button"
                  onClick={() => navigate('/verify-otp', { state: { email: email.trim() } })}
                  className="text-[10px] font-extrabold uppercase tracking-widest text-deep-gold hover:text-deep-rose hover:underline self-start mt-1 cursor-pointer transition"
                >
                  Verify your account now →
                </button>
              )}
            </div>
          )}

          <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-4">
              
              {/* Email Input */}
              <div>
                <label htmlFor="email" className="block text-[10px] font-extrabold text-[#7D7061] uppercase tracking-widest mb-1.5">
                  Email Address
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
                    placeholder="name@example.com"
                    className="block w-full rounded-xl border border-primary-gold/15 bg-white pl-11 pr-3.5 py-3 text-xs text-[#2D241A] focus:border-deep-gold focus:ring-1 focus:ring-deep-gold focus:outline-none placeholder-[#7D7061]/40 font-semibold transition"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label htmlFor="password" className="block text-[10px] font-extrabold text-[#7D7061] uppercase tracking-widest">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => navigate('/forgot-password')}
                    className="text-[10px] font-extrabold text-deep-gold hover:text-deep-rose uppercase tracking-widest hover:underline transition"
                  >
                    Forgot Password?
                  </button>
                </div>
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

            </div>

            {/* Remember Me Toggle */}
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 rounded border-primary-gold/30 text-deep-gold focus:ring-deep-gold cursor-pointer"
              />
              <label htmlFor="remember-me" className="ml-2 block text-xs font-semibold text-[#7D7061] cursor-pointer selection:bg-none">
                Remember my session
              </label>
            </div>

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="group relative w-full flex justify-center py-3.5 px-4 text-xs font-bold uppercase tracking-widest text-white bg-gradient-to-r from-deep-rose to-primary-pink hover:from-primary-pink hover:to-deep-rose hover:scale-[1.01] active:scale-95 focus:outline-none rounded-full transition-all duration-300 shadow-sm hover:shadow-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="absolute left-0 inset-y-0 flex items-center pl-4">
                  <LogIn className="h-4 w-4 text-white" />
                </span>
                {isSubmitting ? 'Verifying Credentials...' : 'Sign In'}
              </button>
            </div>
          </form>

          {/* Social / Visual Alternative Placeholders */}
          <div className="mt-6 space-y-3">
            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-primary-gold/10"></div>
              <span className="flex-shrink mx-3 text-[10px] font-extrabold uppercase tracking-widest text-[#7D7061]/60">Or Sign In with</span>
              <div className="flex-grow border-t border-primary-gold/10"></div>
            </div>

            <button
              onClick={() => handlePlaceholderAlert('Google OAuth')}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-full border border-primary-gold/20 bg-white hover:bg-cream/45 text-xs font-bold text-[#3D2D1E] tracking-wider transition-colors cursor-pointer"
            >
              <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
              </svg>
              <span>Continue with Google</span>
            </button>

            <button
              onClick={() => handlePlaceholderAlert('Mobile OTP')}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-full border border-primary-gold/20 bg-white hover:bg-cream/45 text-xs font-bold text-[#3D2D1E] tracking-wider transition-colors cursor-pointer"
            >
              <svg className="h-4 w-4 shrink-0 text-primary-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              <span>Login with mobile number</span>
            </button>
          </div>

          <div className="text-center text-xs text-[#7D7061] border-t border-primary-gold/10 pt-6">
            New to NariNexus?{' '}
            <Link to="/register" className="font-bold text-deep-gold hover:text-deep-rose hover:underline transition">
              Create an account
            </Link>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}
