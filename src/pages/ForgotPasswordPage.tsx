import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, ArrowLeft, ShieldAlert, Sparkles, RefreshCw, Eye, CheckCircle2 } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

type Step = 'REQUEST' | 'RESET';

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('REQUEST');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [devOtp, setDevOtp] = useState<string | null>(null);

  const inputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  useEffect(() => {
    let timer: any;
    if (cooldown > 0) {
      timer = setInterval(() => {
        setCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) {
      value = value.slice(-1);
    }
    if (value && !/^\d$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      inputRefs[index + 1].current?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const newOtp = [...otp];
      newOtp[index - 1] = '';
      setOtp(newOtp);
      inputRefs[index - 1].current?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').trim();
    if (/^\d{6}$/.test(pasteData)) {
      const digits = pasteData.split('');
      setOtp(digits);
      inputRefs[5].current?.focus();
    }
  };

  // Request Reset OTP
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setError(null);
    setMessage(null);
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage('A password reset code has been sent to your email.');
        setCooldown(15);
        setStep('RESET');
      } else {
        setError(data.detail || 'Failed to initiate password reset.');
      }
    } catch (err) {
      setError('Connection failed. Please verify your network.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset Password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpCode = otp.join('');
    
    if (otpCode.length < 6) {
      setError('Please enter the 6-digit verification code.');
      return;
    }
    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setError(null);
    setMessage(null);
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          otp: otpCode,
          new_password: newPassword,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage('Password has been updated successfully!');
        setTimeout(() => {
          navigate('/login', { replace: true });
        }, 1500);
      } else {
        setError(data.detail || 'Failed to reset password. Please check your OTP.');
      }
    } catch (err) {
      setError('Network connection error.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0) return;
    setError(null);
    setMessage(null);
    
    try {
      const res = await fetch('/api/auth/resend-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), purpose: 'password_reset' }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage('A new password reset code has been sent.');
        setCooldown(15);
        setOtp(['', '', '', '', '', '']);
      } else {
        setError(data.detail || 'Failed to resend code.');
      }
    } catch (err) {
      setError('Network connection error.');
    }
  };

  const fetchDevOtp = async () => {
    if (!email) return;
    try {
      const res = await fetch(`/api/auth/dev-last-otp?email=${encodeURIComponent(email.trim())}`);
      const data = await res.json();
      if (res.ok && data.otp) {
        setDevOtp(data.otp);
        setOtp(data.otp.split(''));
        setMessage('Dev Fallback: Recovery code retrieved and prefilled successfully!');
      } else {
        setError('Dev Helper: No OTP found for this email. Check if registered/requested correctly.');
      }
    } catch (err) {
      setError('Dev Helper failed. Normal fallback active.');
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-cream text-[#3D2D1E]" id="forgot-password-page-root">
      <Navbar />

      <main className="flex-grow flex items-center justify-center py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 bg-white border border-primary-gold/15 p-8 sm:p-10 rounded-2xl shadow-sm relative overflow-hidden">
          
          <div className="text-center">
            <button
              onClick={() => step === 'RESET' ? setStep('REQUEST') : navigate('/login')}
              className="inline-flex items-center space-x-1.5 text-xs font-bold uppercase tracking-widest text-deep-gold hover:text-deep-rose mb-6 group transition-colors"
            >
              <ArrowLeft className="h-4 w-4 transform group-hover:-translate-x-1 transition-transform" />
              <span>{step === 'RESET' ? 'Back' : 'Back to Login'}</span>
            </button>
            <h2 className="font-serif text-3xl font-extrabold tracking-tight text-[#2D241A]">
              Account Recovery
            </h2>
            <p className="mt-2 text-xs text-[#7D7061] max-w-xs mx-auto font-medium">
              {step === 'REQUEST' 
                ? 'Enter your email address to receive a 6-digit password reset code.' 
                : `Enter the code sent to ${email} and set your new password.`
              }
            </p>
          </div>

          {error && (
            <div className="flex items-start bg-soft-rose/30 rounded-xl p-4 border border-deep-rose/20 text-xs text-deep-rose leading-normal font-medium animate-fadeIn">
              <ShieldAlert className="h-4.5 w-4.5 mr-2.5 shrink-0 mt-0.5 text-deep-rose" />
              <span>{error}</span>
            </div>
          )}

          {message && (
            <div className="flex items-start bg-sage-green/20 rounded-xl p-4 border border-sage-green/40 text-xs text-green-800 leading-normal font-semibold animate-fadeIn">
              <span className="mr-2 text-lg">✓</span>
              <span>{message}</span>
            </div>
          )}

          {step === 'REQUEST' ? (
            <form onSubmit={handleRequestOtp} className="mt-6 space-y-4">
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
                    placeholder="savitha@example.com"
                    className="block w-full rounded-xl border border-primary-gold/15 bg-white pl-11 pr-3.5 py-3 text-xs text-[#2D241A] focus:border-deep-gold focus:ring-1 focus:ring-deep-gold focus:outline-none placeholder-[#7D7061]/40 font-semibold transition"
                  />
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isSubmitting || !email.trim()}
                  className="group relative w-full flex justify-center py-3.5 px-4 text-xs font-bold uppercase tracking-widest text-white bg-gradient-to-r from-deep-rose to-primary-pink hover:from-primary-pink hover:to-deep-rose hover:scale-[1.01] active:scale-95 focus:outline-none rounded-full transition-all duration-300 shadow-sm hover:shadow-md cursor-pointer disabled:opacity-50"
                >
                  <span className="absolute left-0 inset-y-0 flex items-center pl-4">
                    <Sparkles className="h-4 w-4 text-white" />
                  </span>
                  {isSubmitting ? 'Sending Request...' : 'Send Recovery Code'}
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleResetPassword} className="mt-6 space-y-5">
              {/* 6 box code input */}
              <div>
                <label className="block text-[10px] font-extrabold text-[#7D7061] uppercase tracking-widest mb-2 text-center">
                  6-Digit Recovery Code
                </label>
                <div className="flex justify-between gap-2.5">
                  {otp.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={inputRefs[idx]}
                      type="text"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(idx, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(idx, e)}
                      onPaste={idx === 0 ? handlePaste : undefined}
                      className="w-12 h-14 text-center text-xl font-bold text-[#2D241A] border border-primary-gold/20 rounded-xl bg-[#FFFDF9] focus:outline-none focus:border-deep-gold focus:ring-1 focus:ring-deep-gold shadow-inner transition"
                    />
                  ))}
                </div>
              </div>

              {/* New Password */}
              <div>
                <label htmlFor="newPassword" className="block text-[10px] font-extrabold text-[#7D7061] uppercase tracking-widest mb-1.5">
                  New Password *
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-[#7D7061]">
                    <Lock className="h-4 w-4 text-primary-gold" />
                  </span>
                  <input
                    id="newPassword"
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="block w-full rounded-xl border border-primary-gold/15 bg-white pl-11 pr-3.5 py-3 text-xs text-[#2D241A] focus:border-deep-gold focus:ring-1 focus:ring-deep-gold focus:outline-none placeholder-[#7D7061]/40 font-semibold transition"
                  />
                </div>
              </div>

              {/* Confirm New Password */}
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
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="block w-full rounded-xl border border-primary-gold/15 bg-white pl-11 pr-3.5 py-3 text-xs text-[#2D241A] focus:border-deep-gold focus:ring-1 focus:ring-deep-gold focus:outline-none placeholder-[#7D7061]/40 font-semibold transition"
                  />
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isSubmitting || otp.join('').length < 6 || !newPassword}
                  className="group relative w-full flex justify-center py-3.5 px-4 text-xs font-bold uppercase tracking-widest text-white bg-gradient-to-r from-deep-rose to-primary-pink hover:from-primary-pink hover:to-deep-rose hover:scale-[1.01] active:scale-95 focus:outline-none rounded-full transition-all duration-300 shadow-sm hover:shadow-md cursor-pointer disabled:opacity-50"
                >
                  <span className="absolute left-0 inset-y-0 flex items-center pl-4">
                    <CheckCircle2 className="h-4 w-4 text-white" />
                  </span>
                  {isSubmitting ? 'Updating Password...' : 'Reset Password'}
                </button>
              </div>

              <div className="flex justify-between items-center text-xs text-[#7D7061]">
                <span>No code received?</span>
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={cooldown > 0}
                  className={`font-bold transition cursor-pointer ${
                    cooldown > 0 
                      ? 'text-[#7D7061]/50 cursor-not-allowed' 
                      : 'text-deep-gold hover:text-deep-rose hover:underline'
                  }`}
                >
                  {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend Code'}
                </button>
              </div>
            </form>
          )}

          {/* Development Help Module */}
          <div className="mt-6 border-t border-primary-gold/10 pt-6">
            <div className="rounded-xl bg-soft-yellow/40 border border-primary-gold/20 p-4 text-left">
              <span className="inline-flex items-center gap-1.5 text-[9px] font-extrabold uppercase tracking-widest text-deep-gold bg-[#FFF7D6] px-2.5 py-1 rounded-full border border-primary-gold/10 mb-2.5">
                <Eye className="h-3 w-3" />
                Development Helper
              </span>
              <p className="text-[11px] text-[#7D7061] font-semibold leading-relaxed mb-3">
                Since we are in sandbox mode, you can fetch and auto-fill the recovery OTP code directly into this screen with one click.
              </p>
              <button
                type="button"
                onClick={fetchDevOtp}
                disabled={!email}
                className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-white bg-deep-gold hover:bg-deep-gold/85 px-4 py-2.5 rounded-full shadow-sm hover:scale-[1.01] active:scale-95 transition cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Fetch Recovery Code</span>
              </button>
              {devOtp && (
                <div className="mt-2.5 text-[10px] font-mono font-bold text-green-700 bg-green-50 rounded-lg p-2 border border-green-200">
                  Last Code Found: {devOtp}
                </div>
              )}
            </div>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}
