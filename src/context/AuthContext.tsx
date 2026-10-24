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
  register: (name: string, email: string, password: string, team?: string) => Promise<{ pendingApproval?: boolean; message?: string; success?: boolean }>;
  logout: () => void;
  authError: string | null;
  setAuthError: (err: string | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

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
    localStorage.setItem('auth_last_activity', now.toString());
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    localStorage.removeItem('auth_last_activity');
    localStorage.removeItem('auth_timestamp');
  };

  // Restore session from localStorage on mount & verify 10-minute inactivity limit
  useEffect(() => {
    try {
      const savedToken = localStorage.getItem('auth_token');
      const savedUser = localStorage.getItem('auth_user');
      const savedLastActivity = localStorage.getItem('auth_last_activity');

      if (savedToken && savedUser) {
        const lastActivityTime = savedLastActivity ? parseInt(savedLastActivity, 10) : 0;
        const now = Date.now();

        // Expire if no activity recorded or more than 10 minutes of inactivity
        if (!lastActivityTime || now - lastActivityTime >= TEN_MINUTES_MS) {
          console.warn('10-minute inactivity timeout reached. Logging out.');
          logout();
          setAuthError('Secured Auto-Logout: You were logged out due to 10 minutes of inactivity.');
        } else {
          setToken(savedToken);
          setUser(JSON.parse(savedUser));
          localStorage.setItem('auth_last_activity', now.toString());
        }
      } else {
        logout();
      }
    } catch (e) {
      console.error('Auth restore error:', e);
      logout();
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Strict 10-minute inactivity detection: logs out after 10 min of complete inactivity
  useEffect(() => {
    if (!token || !user) return;

    let lastSave = Date.now();

    const checkInactivity = () => {
      const savedLastActivityStr = localStorage.getItem('auth_last_activity');
      if (savedLastActivityStr) {
        const lastActivityTime = parseInt(savedLastActivityStr, 10);
        const elapsed = Date.now() - lastActivityTime;
        if (elapsed >= TEN_MINUTES_MS) {
          console.warn('10 minutes of inactivity elapsed. Auto logging out.');
          setAuthError('Secured Auto-Logout: You were automatically logged out due to 10 minutes of inactivity.');
          logout();
          return true;
        }
      }
      return false;
    };

    const handleUserActivity = () => {
      const now = Date.now();
      // Throttle localStorage update to every 2 seconds
      if (now - lastSave > 2000) {
        lastSave = now;
        localStorage.setItem('auth_last_activity', now.toString());
      }
    };

    // Listen for any user input / mouse / touch / scroll events
    const activityEvents = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart', 'pointerdown'];
    activityEvents.forEach((evt) => window.addEventListener(evt, handleUserActivity, { passive: true }));

    // Periodic check every 3 seconds
    const intervalId = setInterval(() => {
      checkInactivity();
    }, 3000);

    // Re-check immediately when tab becomes focused or visible
    const onFocusOrVisible = () => {
      if (document.visibilityState === 'visible') {
        checkInactivity();
      }
    };
    window.addEventListener('focus', onFocusOrVisible);
    document.addEventListener('visibilitychange', onFocusOrVisible);

    return () => {
      clearInterval(intervalId);
      activityEvents.forEach((evt) => window.removeEventListener(evt, handleUserActivity));
      window.removeEventListener('focus', onFocusOrVisible);
      document.removeEventListener('visibilitychange', onFocusOrVisible);
    };
  }, [token, user]);

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

  const register = async (name: string, email: string, password: string, team?: string) => {
    setAuthError(null);
    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, team })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Registration failed.');
      }

      if (data.pendingApproval) {
        return { pendingApproval: true, message: data.message };
      }

      if (data.token && data.user) {
        saveSession(data.token, data.user);
      }
      return { success: true };
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
