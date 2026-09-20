'use client';

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail, User, Key, ShieldCheck, Sparkles, LogIn, UserPlus, AlertCircle, CheckCircle2 } from 'lucide-react';

interface AuthViewProps {
  theme?: 'dark' | 'light';
}

export default function AuthView({ theme = 'dark' }: AuthViewProps) {
  const isDark = theme === 'dark';
  const { login, register, authError, setAuthError } = useAuth();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [adminSecret, setAdminSecret] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setSuccessMsg(null);
    setIsLoading(true);

    try {
      if (mode === 'login') {
        await login(email, password);
        setSuccessMsg('Login successful! Welcome back.');
      } else {
        await register(name, email, password, adminSecret);
        setSuccessMsg('Registration successful! Session active.');
      }
    } catch (err: any) {
      // Error handles in context
    } finally {
      setIsLoading(false);
    }
  };

  const switchMode = (newMode: 'login' | 'register') => {
    setMode(newMode);
    setAuthError(null);
    setSuccessMsg(null);
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 sm:p-6 transition-colors duration-200 ${
      isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
    }`}>
      {/* Background glow effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -right-40 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 left-1/3 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl" />
      </div>

      <div className={`w-full max-w-md rounded-3xl border backdrop-blur-2xl p-8 space-y-7 relative z-10 shadow-2xl transition-all ${
        isDark ? 'bg-slate-900/70 border-slate-800 text-slate-100' : 'bg-white/90 border-slate-200 text-slate-900'
      }`}>
        {/* Header Icon & Title */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-cyan-500 mx-auto flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <ShieldCheck className="w-9 h-9 text-white" />
          </div>
          <h1 className="text-2xl font-black tracking-tight bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
            AutoScreener AI Engine
          </h1>
          <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            {mode === 'login' ? 'Enter credentials for 24-Hour Secure Access' : 'Create an account to start screening candidate resumes'}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className={`p-1 rounded-2xl border grid grid-cols-2 text-xs font-bold ${
          isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-100 border-slate-200'
        }`}>
          <button
            type="button"
            onClick={() => switchMode('login')}
            className={`py-2.5 rounded-xl transition flex items-center justify-center gap-1.5 ${
              mode === 'login'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <LogIn className="w-4 h-4" /> Log In
          </button>
          <button
            type="button"
            onClick={() => switchMode('register')}
            className={`py-2.5 rounded-xl transition flex items-center justify-center gap-1.5 ${
              mode === 'register'
                ? 'bg-gradient-to-r from-purple-600 to-cyan-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <UserPlus className="w-4 h-4" /> Register
          </button>
        </div>

        {/* Quick Admin Fill Shortcut */}
        <div className="flex items-center justify-between text-xs px-1">
          <span className="text-slate-400 text-[11px]">System Credentials:</span>
          <button
            type="button"
            onClick={() => {
              setEmail('admin@admin.com');
              setPassword('admin123');
              switchMode('login');
            }}
            className="text-[11px] font-bold text-indigo-400 hover:text-indigo-300 underline flex items-center gap-1"
          >
            <Sparkles className="w-3 h-3 text-amber-400" /> Auto-Fill Default Admin
          </button>
        </div>

        {/* Feedback Banners */}
        {authError && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{authError}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <div>
              <label className="block text-xs font-semibold mb-1 flex items-center gap-1.5 text-slate-300">
                <User className="w-3.5 h-3.5 text-indigo-400" /> Full Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Enter your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={`w-full border rounded-xl px-4 py-2.5 text-xs transition focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  isDark ? 'bg-slate-950/80 border-slate-800 text-white placeholder-slate-500' : 'bg-slate-50 border-slate-300 text-slate-900'
                }`}
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold mb-1 flex items-center gap-1.5 text-slate-300">
              <Mail className="w-3.5 h-3.5 text-cyan-400" /> Email Address <span className="text-rose-500">*</span>
            </label>
            <input
              type="email"
              required
              placeholder="user@organization.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`w-full border rounded-xl px-4 py-2.5 text-xs transition focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                isDark ? 'bg-slate-950/80 border-slate-800 text-white placeholder-slate-500' : 'bg-slate-50 border-slate-300 text-slate-900'
              }`}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1 flex items-center gap-1.5 text-slate-300">
              <Lock className="w-3.5 h-3.5 text-purple-400" /> Password <span className="text-rose-500">*</span>
            </label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`w-full border rounded-xl px-4 py-2.5 text-xs transition focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                isDark ? 'bg-slate-950/80 border-slate-800 text-white placeholder-slate-500' : 'bg-slate-50 border-slate-300 text-slate-900'
              }`}
            />
          </div>

          {mode === 'register' && (
            <div>
              <label className="block text-xs font-semibold mb-1 flex items-center gap-1.5 text-slate-400">
                <Key className="w-3.5 h-3.5 text-amber-400" /> Admin Registration Secret Key (Optional)
              </label>
              <input
                type="password"
                placeholder="Pass key to auto-grant Admin role"
                value={adminSecret}
                onChange={(e) => setAdminSecret(e.target.value)}
                className={`w-full border rounded-xl px-4 py-2.5 text-xs transition focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  isDark ? 'bg-slate-950/80 border-slate-800 text-white placeholder-slate-500' : 'bg-slate-50 border-slate-300 text-slate-900'
                }`}
              />
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-6 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-bold shadow-lg shadow-indigo-500/25 transition flex items-center justify-center gap-2 text-xs uppercase tracking-wider disabled:opacity-50 mt-2"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Authenticating...</span>
              </>
            ) : mode === 'login' ? (
              <>
                <LogIn className="w-4 h-4" /> Log In to System
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4" /> Create Account
              </>
            )}
          </button>
        </form>

        <div className="text-center pt-2 text-[11px] text-slate-500 border-t border-slate-800">
          <span>🔒 Logged-in session valid for 24 hours. Auto-synced with Master Sheet.</span>
        </div>
      </div>
    </div>
  );
}
