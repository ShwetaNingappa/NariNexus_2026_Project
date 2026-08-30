/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import AboutPage from './pages/AboutPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import OtpPage from './pages/OtpPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import LearnerDashboard from './pages/LearnerDashboard';
import CentreDashboard from './pages/CentreDashboard';
import AdminDashboard from './pages/AdminDashboard';
import LanguageSelectionPage from './pages/LanguageSelectionPage';
import ProfileSetupPage from './pages/ProfileSetupPage';
import SkillsCataloguePage from './pages/SkillsCataloguePage';
import SkillDetailPage from './pages/SkillDetailPage';
import CoursesCataloguePage from './pages/CoursesCataloguePage';
import CourseDetailPage from './pages/CourseDetailPage';
import LessonViewPage from './pages/LessonViewPage';
import MyCoursesPage from './pages/MyCoursesPage';
import { AuthProvider } from './services/authContext';
import ProtectedRoute from './components/ProtectedRoute';

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/verify-otp" element={<OtpPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route 
            path="/onboarding/language" 
            element={
              <ProtectedRoute allowedRoles={['learner']}>
                <LanguageSelectionPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/onboarding/profile" 
            element={
              <ProtectedRoute allowedRoles={['learner']}>
                <ProfileSetupPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/learner" 
            element={
              <ProtectedRoute allowedRoles={['learner']}>
                <LearnerDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/learner/skills" 
            element={
              <ProtectedRoute allowedRoles={['learner']}>
                <SkillsCataloguePage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/learner/skills/:id" 
            element={
              <ProtectedRoute allowedRoles={['learner']}>
                <SkillDetailPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/learner/courses" 
            element={
              <ProtectedRoute allowedRoles={['learner']}>
                <CoursesCataloguePage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/learner/courses/:id" 
            element={
              <ProtectedRoute allowedRoles={['learner']}>
                <CourseDetailPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/learner/my-courses" 
            element={
              <ProtectedRoute allowedRoles={['learner']}>
                <MyCoursesPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/learner/courses/:courseId/lessons/:lessonId" 
            element={
              <ProtectedRoute allowedRoles={['learner']}>
                <LessonViewPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/centre" 
            element={
              <ProtectedRoute allowedRoles={['centre']}>
                <CentreDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
