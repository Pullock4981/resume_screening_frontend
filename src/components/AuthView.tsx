'use client';

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail, User, ShieldCheck, LogIn, UserPlus, AlertCircle, CheckCircle2, Users, ChevronDown } from 'lucide-react';
import { TEAM_OPTIONS, isValidOrgEmail } from '../types';

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
  const [team, setTeam] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setSuccessMsg(null);
    setIsLoading(true);

    try {
      const cleanEmail = email.trim().toLowerCase();
      if (!isValidOrgEmail(cleanEmail) && cleanEmail !== 'admin@admin.com') {
        setAuthError('Invalid email address! Email must contain ".ph@gmail.com" or "programming-hero.com" (e.g. name.ph@gmail.com or user@programming-hero.com).');
        setIsLoading(false);
        return;
      }

      if (mode === 'login') {
        await login(email, password);
        setSuccessMsg('Login successful! Welcome back.');
      } else {
        if (!team) {
          setAuthError('Please select your Team Name (Nexen, Alpha, Delta, Supernuva, or PRM).');
          setIsLoading(false);
          return;
        }
        const res = await register(name, email, password, team);
        if (res?.pendingApproval) {
          setSuccessMsg('Registration request submitted! Your account is pending admin approval. You can log in once approved.');
          setMode('login');
        } else {
          setSuccessMsg('Registration successful! Session active.');
        }
      }
    } catch (err: any) {
      // Error handled in AuthContext
    } finally {
      setIsLoading(false);
    }
  };

  const switchMode = (newMode: 'login' | 'register') => {
    setMode(newMode);
    setAuthError(null);
    setSuccessMsg(null);
    setTeam('');
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 sm:p-6 transition-colors duration-200 ${
      isDark ? 'dark bg-slate-950 text-slate-100' : 'bg-slate-100 text-slate-900'
    }`}>
      {/* Background ambient accents */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -left-32 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -right-32 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 left-1/3 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl" />
      </div>

      <div className={`w-full max-w-md rounded-2xl border p-7 sm:p-8 space-y-6 relative z-10 shadow-xl transition-all ${
        isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        {/* Header Icon & Title */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-2xl bg-indigo-600/10 dark:bg-indigo-500/15 border border-indigo-500/20 mx-auto flex items-center justify-center p-2.5 shadow-lg shadow-indigo-600/20">
            <img
              src="/assats/placement-logo.png"
              alt="Placement Kit"
              className="w-full h-full object-contain"
            />
          </div>
          <h1 className={`text-2xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Placement Kit <span className="text-indigo-600 dark:text-indigo-400">Engine</span>
          </h1>
          <p className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            {mode === 'login' ? 'Enter credentials for secure system access' : 'Create an account to start screening resumes'}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className={`p-1 rounded-xl border grid grid-cols-2 text-xs font-bold ${
          isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200'
        }`}>
          <button
            type="button"
            onClick={() => switchMode('login')}
            className={`py-2.5 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              mode === 'login'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25 font-bold'
                : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <LogIn className="w-4 h-4" /> Log In
          </button>
          <button
            type="button"
            onClick={() => switchMode('register')}
            className={`py-2.5 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              mode === 'register'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25 font-bold'
                : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <UserPlus className="w-4 h-4" /> Register
          </button>
        </div>

        {/* Feedback Banners */}
        {authError && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{authError}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <>
              <div>
                <label className={`block text-xs font-semibold mb-1.5 flex items-center gap-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  <User className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" /> Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Enter your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={`w-full border rounded-xl px-4 py-2.5 text-xs transition focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                    isDark ? 'bg-slate-950 border-slate-800 text-white placeholder-slate-500 focus:border-indigo-500' : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:bg-white focus:border-indigo-600'
                  }`}
                />
              </div>

              <div>
                <label className={`block text-xs font-semibold mb-1.5 flex items-center justify-between ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  <span className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" /> Select Team Name <span className="text-rose-500">*</span>
                  </span>
                  <span className={`text-[10px] font-mono ${isDark ? 'text-indigo-400/80' : 'text-indigo-600/80'}`}>Required</span>
                </label>
                <div className="relative">
                  <select
                    required
                    value={team}
                    onChange={(e) => setTeam(e.target.value)}
                    className={`w-full border rounded-xl px-4 py-2.5 text-xs transition appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer ${
                      isDark
                        ? 'bg-slate-950 border-slate-800 text-white focus:border-indigo-500'
                        : 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white focus:border-indigo-600'
                    } ${!team ? (isDark ? 'text-slate-500' : 'text-slate-400') : ''}`}
                  >
                    <option value="" disabled className={isDark ? 'bg-slate-900 text-slate-400' : 'bg-white text-slate-400'}>
                      -- Select Team Name --
                    </option>
                    {TEAM_OPTIONS.map((t) => (
                      <option key={t} value={t} className={isDark ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}>
                        {t}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3.5 text-slate-400">
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </div>
              </div>
            </>
          )}

          <div>
            <label className={`block text-xs font-semibold mb-1.5 flex items-center justify-between ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              <span className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" /> Email Address <span className="text-rose-500">*</span>
              </span>
              <span className={`text-[10px] font-mono transition-colors ${
                !email
                  ? (isDark ? 'text-slate-500' : 'text-slate-400')
                  : isValidOrgEmail(email) || email.trim().toLowerCase() === 'admin@admin.com'
                  ? 'text-emerald-500 font-bold'
                  : 'text-rose-500 font-bold'
              }`}>
                {!email ? '.ph@gmail.com | programming-hero.com' : (isValidOrgEmail(email) || email.trim().toLowerCase() === 'admin@admin.com') ? '✓ Valid Domain' : '✕ Invalid Domain'}
              </span>
            </label>
            <input
              type="email"
              required
              placeholder="e.g. yourname.ph@gmail.com or name@programming-hero.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`w-full border rounded-xl px-4 py-2.5 text-xs transition focus:outline-none focus:ring-2 ${
                email && !isValidOrgEmail(email) && email.trim().toLowerCase() !== 'admin@admin.com'
                  ? 'border-rose-500/80 focus:ring-rose-500/40'
                  : email && (isValidOrgEmail(email) || email.trim().toLowerCase() === 'admin@admin.com')
                  ? 'border-emerald-500/80 focus:ring-emerald-500/40'
                  : 'focus:ring-indigo-500'
              } ${
                isDark ? 'bg-slate-950 border-slate-800 text-white placeholder-slate-500 focus:border-indigo-500' : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:bg-white focus:border-indigo-600'
              }`}
            />
            {email && !isValidOrgEmail(email) && email.trim().toLowerCase() !== 'admin@admin.com' && (
              <p className="text-[11px] text-rose-500 mt-1 flex items-center gap-1 font-medium">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>ইমেইল অবশ্যই <strong>.ph@gmail.com</strong> অথবা <strong>programming-hero.com</strong> হতে হবে।</span>
              </p>
            )}
          </div>

          <div>
            <label className={`block text-xs font-semibold mb-1.5 flex items-center gap-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              <Lock className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" /> Password <span className="text-rose-500">*</span>
            </label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`w-full border rounded-xl px-4 py-2.5 text-xs transition focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                isDark ? 'bg-slate-950 border-slate-800 text-white placeholder-slate-500 focus:border-indigo-500' : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:bg-white focus:border-indigo-600'
              }`}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold shadow-lg shadow-indigo-600/25 transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-wider disabled:opacity-50 mt-2 cursor-pointer"
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

        <div className={`text-center pt-3 text-[11px] font-medium border-t ${isDark ? 'text-slate-400 border-slate-800' : 'text-slate-500 border-slate-200'}`}>
          <span>🔒 Auto-logout after 10 minutes of inactivity. Auto-synced with Master Sheet.</span>
        </div>
      </div>
    </div>
  );
}
