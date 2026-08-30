import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from './api';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'learner' | 'centre' | 'admin';
  preferred_language?: string | null;
  profile_completed: boolean;
  age?: number | null;
  location?: string | null;
  education_level?: string | null;
  existing_skills?: string[] | null;
  learning_interests?: string[] | null;
  learning_preference?: string | null;
  career_goal?: string | null;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  register: (
    name: string,
    email: string,
    password: string,
    role: 'learner' | 'centre' | 'admin',
    phone?: string,
    preferred_language?: string
  ) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  updateUser: (updatedFields: Partial<User>) => void;
  reloadUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('narinexus_token'));
  const [isLoading, setIsLoading] = useState(true);

  // Set default authorization header whenever token changes
  useEffect(() => {
    if (token) {
      localStorage.setItem('narinexus_token', token);
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      localStorage.removeItem('narinexus_token');
      delete api.defaults.headers.common['Authorization'];
    }
  }, [token]);

  // Load user data on startup if a token exists
  useEffect(() => {
    async function loadUser() {
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await api.get('/api/auth/me');
        if (response.data && response.data.success) {
          setUser(response.data.user);
        } else {
          // Invalidate stale token
          setToken(null);
          setUser(null);
        }
      } catch (error) {
        console.error('Failed to load authenticated user:', error);
        // If it's a 401 error, clear token
        setToken(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    }

    loadUser();
  }, [token]);

  const login = async (email: string, password: string) => {
    try {
      const response = await api.post('/api/auth/login', { email, password });
      if (response.data && response.data.success) {
        setToken(response.data.access_token);
        setUser(response.data.user);
        return { success: true };
      }
      return { success: false, message: response.data?.message || 'Login failed' };
    } catch (error: any) {
      console.error('Login error:', error);
      const detail = error.response?.data?.detail || 'Incorrect email or password.';
      return { success: false, message: typeof detail === 'string' ? detail : 'Incorrect email or password.' };
    }
  };

  const register = async (
    name: string,
    email: string,
    password: string,
    role: 'learner' | 'centre' | 'admin',
    phone?: string,
    preferred_language?: string
  ) => {
    try {
      const payload = {
        name,
        email,
        password,
        role,
        phone: phone || null,
        preferred_language: preferred_language || 'en',
        profile_completed: false,
      };
      
      const response = await api.post('/api/auth/register', payload);
      if (response.data && response.data.success) {
        return { success: true, message: response.data.message };
      }
      return { success: false, message: response.data?.message || 'Registration failed' };
    } catch (error: any) {
      console.error('Registration error:', error);
      const detail = error.response?.data?.detail;
      let errorMsg = 'Registration failed.';
      if (typeof detail === 'string') {
        errorMsg = detail;
      } else if (Array.isArray(detail) && detail.length > 0) {
        errorMsg = detail[0].msg || errorMsg;
      }
      return { success: false, message: errorMsg };
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
  };

  const updateUser = (updatedFields: Partial<User>) => {
    setUser((prev) => {
      if (!prev) return null;
      return { ...prev, ...updatedFields };
    });
  };

  const reloadUser = async () => {
    if (!token) return;
    try {
      const response = await api.get('/api/auth/me');
      if (response.data && response.data.success) {
        setUser(response.data.user);
      }
    } catch (error) {
      console.error('Failed to reload user:', error);
    }
  };

  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated, isLoading, login, register, logout, updateUser, reloadUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
