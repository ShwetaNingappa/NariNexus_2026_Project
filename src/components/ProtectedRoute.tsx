import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../services/authContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: Array<'learner' | 'centre' | 'admin'>;
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  // Show a beautifully aligned neutral loading screen while checking auth tokens
  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-cream flex-col space-y-4">
        <div className="relative flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-tr from-deep-gold to-primary-gold shadow-md text-white animate-bounce">
          <span className="text-xl font-serif font-extrabold">N</span>
        </div>
        <p className="font-serif text-sm font-bold tracking-widest text-[#7D7061] uppercase animate-pulse">
          Loading Circle...
        </p>
      </div>
    );
  }

  // If not authenticated, redirect to login page
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Handle learner onboarding redirection
  if (user.role === 'learner') {
    const isOnboardingPath = location.pathname.startsWith('/onboarding');
    
    if (!user.profile_completed && !isOnboardingPath) {
      // If profile is not complete and trying to access main learner dashboard/other areas, redirect to language onboarding
      return <Navigate to="/onboarding/language" replace />;
    }
    
    if (user.profile_completed && isOnboardingPath) {
      // If profile is already complete and trying to access onboarding, redirect to learner dashboard
      return <Navigate to="/learner" replace />;
    }
  } else {
    // If centre or admin trying to access onboarding path, redirect to their home dashboard
    if (location.pathname.startsWith('/onboarding')) {
      return <Navigate to={`/${user.role}`} replace />;
    }
  }

  // If role is not allowed, redirect to user's authorized home dashboard
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    const fallbackPath = `/${user.role}`;
    return <Navigate to={fallbackPath} replace />;
  }

  return <>{children}</>;
}
