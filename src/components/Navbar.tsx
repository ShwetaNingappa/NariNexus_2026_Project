import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, CheckCircle, AlertTriangle, RefreshCw, Sparkles, Home, Info, GraduationCap, Building2, ShieldCheck, LogIn, UserPlus, HeartHandshake } from 'lucide-react';
import { checkApiHealth, HealthCheckResponse } from '../services/api';
import { useAuth } from '../services/authContext';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [health, setHealth] = useState<HealthCheckResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuth();

  const fetchHealth = async () => {
    setLoading(true);
    const data = await checkApiHealth();
    setHealth(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchHealth();
    // Periodically poll health every 15 seconds for reactive UI validation
    const interval = setInterval(fetchHealth, 15000);
    return () => clearInterval(interval);
  }, []);

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-primary-gold/15 bg-cream/90 backdrop-blur-md" id="nari-header">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo and Brand */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-3 group" id="brand-logo">
              <div className="relative flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-tr from-deep-gold to-primary-gold shadow-md text-white shrink-0 group-hover:scale-105 transition-transform duration-300">
                <HeartHandshake className="h-5 w-5 text-white" />
              </div>
              <div className="flex flex-col ml-1">
                <span className="font-serif text-lg font-extrabold tracking-widest text-[#3D2D1E] group-hover:text-deep-gold transition-colors duration-300">
                  NARINEXUS
                </span>
                <span className="text-[9px] tracking-[0.2em] uppercase font-bold text-deep-gold/80">Empowerment Platform</span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center space-x-8" aria-label="Main Navigation">
            <Link
              to="/"
              className={`inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest transition-all duration-300 pb-1 ${
                isActive('/') ? 'text-deep-gold border-b-2 border-primary-gold' : 'text-[#7D7061] hover:text-deep-gold'
              }`}
            >
              <Home className="h-3.5 w-3.5" />
              <span>Home</span>
            </Link>
            <Link
              to="/about"
              className={`inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest transition-all duration-300 pb-1 ${
                isActive('/about') ? 'text-deep-gold border-b-2 border-primary-gold' : 'text-[#7D7061] hover:text-deep-gold'
              }`}
            >
              <Info className="h-3.5 w-3.5" />
              <span>About</span>
            </Link>
            <div className="h-4 w-[1px] bg-primary-gold/20" />
            
            {/* Quick Dashboard Access Drops */}
            <div className="flex items-center space-x-3">
              <Link
                to="/learner"
                className={`inline-flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-widest px-3 py-1.5 rounded-full border transition-all duration-300 ${
                  isActive('/learner') ? 'bg-light-pink text-deep-rose border-soft-rose/50 shadow-sm' : 'bg-white text-[#7D7061] border-primary-gold/10 hover:border-primary-pink hover:text-primary-pink'
                }`}
              >
                <GraduationCap className="h-3.5 w-3.5" />
                <span>Learner</span>
              </Link>
              <Link
                to="/centre"
                className={`inline-flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-widest px-3 py-1.5 rounded-full border transition-all duration-300 ${
                  isActive('/centre') ? 'bg-sage-green text-green-800 border-green-300 shadow-sm' : 'bg-white text-[#7D7061] border-primary-gold/10 hover:border-green-600 hover:text-green-700'
                }`}
              >
                <Building2 className="h-3.5 w-3.5" />
                <span>Centre</span>
              </Link>
              <Link
                to="/admin"
                className={`inline-flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-widest px-3 py-1.5 rounded-full border transition-all duration-300 ${
                  isActive('/admin') ? 'bg-soft-yellow text-deep-gold border-primary-gold/40 shadow-sm' : 'bg-white text-[#7D7061] border-primary-gold/10 hover:border-deep-gold hover:text-deep-gold'
                }`}
              >
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>Admin</span>
              </Link>
            </div>
          </nav>

          {/* Right Controls: Connection Status Badge & Auth CTAs */}
          <div className="hidden md:flex items-center space-x-5">
            {/* Health Badge */}
            <button
              onClick={fetchHealth}
              disabled={loading}
              className="flex items-center space-x-1.5 rounded-full border border-primary-gold/25 bg-white px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[#7D7061] hover:bg-soft-yellow/50 transition duration-300 cursor-pointer shadow-sm"
              title="Click to re-verify React -> FastAPI -> MongoDB connection"
            >
              {loading ? (
                <RefreshCw className="h-3 w-3 animate-spin text-primary-gold" />
              ) : health?.success && health?.database === 'connected' ? (
                <div className="flex items-center space-x-1">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                  </span>
                  <span className="text-green-700">Nexus Active</span>
                </div>
              ) : (
                <div className="flex items-center space-x-1">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                  </span>
                  <span className="text-rose-700">Offline Mode</span>
                </div>
              )}
            </button>

            {isAuthenticated && user ? (
              <div className="flex items-center space-x-4">
                <Link
                  to={`/${user.role}`}
                  className="inline-flex items-center gap-1.5 justify-center rounded-full bg-soft-yellow hover:bg-soft-yellow/80 border border-primary-gold/45 px-4 py-2 text-xs font-bold uppercase tracking-widest text-deep-gold transition-all shadow-sm"
                >
                  <span>My Dashboard</span>
                </Link>
                <button
                  onClick={logout}
                  className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-widest text-[#7D7061] hover:text-deep-rose transition-colors cursor-pointer"
                >
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              <>
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-widest text-[#7D7061] hover:text-deep-gold transition-colors"
                >
                  <LogIn className="h-3.5 w-3.5" />
                  <span>Login</span>
                </Link>
                <Link
                  to="/register"
                  className="inline-flex items-center gap-1.5 justify-center rounded-full bg-gradient-to-r from-deep-rose to-primary-pink px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-white shadow-sm hover:shadow-md hover:from-primary-pink hover:to-deep-rose transition-all duration-300 transform hover:-translate-y-0.5"
                >
                  <UserPlus className="h-3.5 w-3.5" />
                  <span>Register</span>
                </Link>
              </>
            )}
          </div>

          {/* Mobile hamburger button */}
          <div className="flex items-center space-x-2 md:hidden">
            {/* Small screen Health indicator */}
            <button
              onClick={fetchHealth}
              className="p-1.5 rounded-full border border-primary-gold/25 text-xs bg-white"
            >
              <span className={`inline-block h-2.5 w-2.5 rounded-full ${health?.database === 'connected' ? 'bg-green-500' : 'bg-rose-500'}`} />
            </button>

            <button
              onClick={() => setIsOpen(!isOpen)}
              type="button"
              className="inline-flex items-center justify-center rounded-full p-2 text-[#7D7061] hover:bg-soft-yellow/40 hover:text-[#2D241A] focus:outline-none"
              aria-controls="mobile-menu"
              aria-expanded={isOpen}
            >
              <span className="sr-only">Open main menu</span>
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden border-b border-primary-gold/15 bg-cream" id="mobile-menu">
          <div className="space-y-1 px-2 pb-4 pt-2">
            <Link
              to="/"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-xs font-bold uppercase tracking-widest text-[#2D241A] hover:bg-soft-yellow"
            >
              <Home className="h-4 w-4 text-deep-gold" />
              <span>Home</span>
            </Link>
            <Link
              to="/about"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-xs font-bold uppercase tracking-widest text-[#2D241A] hover:bg-soft-yellow"
            >
              <Info className="h-4 w-4 text-deep-gold" />
              <span>About</span>
            </Link>
            <div className="my-2 border-t border-primary-gold/15" />
            <Link
              to="/learner"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-xs font-bold uppercase tracking-widest text-deep-rose bg-light-pink hover:bg-soft-rose transition"
            >
              <GraduationCap className="h-4 w-4 text-deep-rose" />
              <span>Learner Dashboard</span>
            </Link>
            <Link
              to="/centre"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-xs font-bold uppercase tracking-widest text-green-900 bg-sage-green/70 hover:bg-sage-green transition"
            >
              <Building2 className="h-4 w-4 text-green-700" />
              <span>Coaching Centre Dashboard</span>
            </Link>
            <Link
              to="/admin"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-xs font-bold uppercase tracking-widest text-deep-gold bg-soft-yellow hover:bg-soft-yellow/90 transition"
            >
              <ShieldCheck className="h-4 w-4 text-deep-gold" />
              <span>Admin Dashboard</span>
            </Link>
            <div className="my-2 border-t border-primary-gold/15" />
            {isAuthenticated && user ? (
              <div className="space-y-2 mt-2">
                <Link
                  to={`/${user.role}`}
                  onClick={() => setIsOpen(false)}
                  className="flex items-center justify-center gap-2 w-full rounded-full bg-soft-yellow border border-primary-gold/40 px-4 py-3 text-center text-xs font-bold uppercase tracking-widest text-deep-gold"
                >
                  <span>My Dashboard</span>
                </Link>
                <button
                  onClick={() => {
                    setIsOpen(false);
                    logout();
                  }}
                  className="flex items-center justify-center gap-2 w-full rounded-full bg-white border border-primary-gold/10 px-4 py-3 text-center text-xs font-bold uppercase tracking-widest text-deep-rose"
                >
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-xs font-bold uppercase tracking-widest text-[#7D7061] hover:bg-soft-yellow"
                >
                  <LogIn className="h-4 w-4 text-deep-gold" />
                  <span>Login</span>
                </Link>
                <Link
                  to="/register"
                  onClick={() => setIsOpen(false)}
                  className="mt-2 flex items-center justify-center gap-2 w-full rounded-full bg-gradient-to-r from-deep-rose to-primary-pink px-4 py-3 text-center text-xs font-bold uppercase tracking-widest text-white hover:from-primary-pink hover:to-deep-rose transition-all duration-300"
                >
                  <UserPlus className="h-4 w-4 text-white" />
                  <span>Register</span>
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
