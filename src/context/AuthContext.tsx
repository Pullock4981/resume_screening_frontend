'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AuthUser } from '../types';

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, adminSecret?: string) => Promise<void>;
  logout: () => void;
  authError: string | null;
  setAuthError: (err: string | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;
const TEN_MINUTES_MS = 10 * 60 * 1000;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const getBackendUrl = () => {
    if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
      return 'http://localhost:5000';
    }
    return process.env.NEXT_PUBLIC_BACKEND_URL || 'https://resume-screening-backend.vercel.app';
  };

  const BACKEND_URL = getBackendUrl();

  const saveSession = (newToken: string, newUser: AuthUser) => {
    const now = Date.now();
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('auth_token', newToken);
    localStorage.setItem('auth_user', JSON.stringify(newUser));
    localStorage.setItem('auth_timestamp', now.toString());
    localStorage.setItem('auth_last_activity', now.toString());
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    localStorage.removeItem('auth_timestamp');
    localStorage.removeItem('auth_last_activity');
  };

  // 10-Minute Inactivity Auto-Logout Security (Point 5)
  // Only logs out if user is completely inactive for 10 minutes. Active users are NEVER logged out.
  useEffect(() => {
    if (!token || !user) return;

    let timer: NodeJS.Timeout;
    let lastSave = 0;

    const handleUserActivity = () => {
      const now = Date.now();

      // Throttled update to localStorage every 5 seconds
      if (now - lastSave > 5000) {
        lastSave = now;
        localStorage.setItem('auth_last_activity', now.toString());
      }

      if (timer) clearTimeout(timer);

      // Schedule auto-logout after 10 minutes of zero activity
      timer = setTimeout(() => {
        const currentNow = Date.now();
        const savedLastActivityStr = localStorage.getItem('auth_last_activity');
        const lastActivityTime = savedLastActivityStr ? parseInt(savedLastActivityStr, 10) : now;
        const elapsed = currentNow - lastActivityTime;

        if (elapsed >= TEN_MINUTES_MS) {
          console.warn('10 minutes of complete user inactivity detected. Auto logging out.');
          setAuthError('Secured Auto-Logout: You were automatically logged out due to 10 minutes of inactivity.');
          logout();
        }
      }, TEN_MINUTES_MS);
    };

    const activityEvents = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart', 'pointerdown'];
    activityEvents.forEach(evt => window.addEventListener(evt, handleUserActivity, { passive: true }));

    // Check initial elapsed time on mount/load
    const initialLastActivityStr = localStorage.getItem('auth_last_activity');
    if (initialLastActivityStr) {
      const elapsed = Date.now() - parseInt(initialLastActivityStr, 10);
      if (elapsed >= TEN_MINUTES_MS) {
        setAuthError('Secured Auto-Logout: You were automatically logged out due to 10 minutes of inactivity.');
        logout();
        return;
      }
    } else {
      localStorage.setItem('auth_last_activity', Date.now().toString());
    }

    // Start initial timer
    handleUserActivity();

    return () => {
      if (timer) clearTimeout(timer);
      activityEvents.forEach(evt => window.removeEventListener(evt, handleUserActivity));
    };
  }, [token, user]);

  // Load session from localStorage on mount & enforce 24-hour expiry
  useEffect(() => {
    try {
      const savedToken = localStorage.getItem('auth_token');
      const savedUser = localStorage.getItem('auth_user');
      const savedTime = localStorage.getItem('auth_timestamp');

      if (savedToken && savedUser && savedTime) {
        const timestamp = parseInt(savedTime, 10);
        const now = Date.now();

        // Check if 24 hours passed
        if (now - timestamp > TWENTY_FOUR_HOURS_MS) {
          console.log('24-hour login session expired. Logging out.');
          logout();
        } else {
          setToken(savedToken);
          setUser(JSON.parse(savedUser));
        }
      }
    } catch (e) {
      console.error('Auth restore error:', e);
      logout();
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    setAuthError(null);
    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Login failed.');
      }

      saveSession(data.token, data.user);
    } catch (err: any) {
      setAuthError(err.message || 'Failed to authenticate.');
      throw err;
    }
  };

  const register = async (name: string, email: string, password: string, adminSecret?: string) => {
    setAuthError(null);
    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, adminSecret })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Registration failed.');
      }

      saveSession(data.token, data.user);
    } catch (err: any) {
      setAuthError(err.message || 'Registration failed.');
      throw err;
    }
  };

  const isAuthenticated = !!token && !!user && user.status === 'active';
  const isAdmin = isAuthenticated && user?.role === 'admin';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated,
        isAdmin,
        isLoading,
        login,
        register,
        logout,
        authError,
        setAuthError
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
