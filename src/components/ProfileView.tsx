'use client';

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  User,
  Mail,
  Shield,
  ShieldCheck,
  Lock,
  KeyRound,
  Users,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Eye,
  EyeOff,
  Clock,
  Sparkles,
  ArrowRight,
  RefreshCw
} from 'lucide-react';
import { NavigationTab } from './Sidebar';

interface ProfileViewProps {
  theme?: 'dark' | 'light';
  onNavigateTab?: (tab: NavigationTab) => void;
}

export default function ProfileView({ theme = 'dark', onNavigateTab }: ProfileViewProps) {
  const isDark = theme === 'dark';
  const { user, isAdmin, changePassword } = useAuth();

  // Change Password Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // UI state
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Password strength calculator
  const getPasswordStrength = (pwd: string) => {
    if (!pwd) return { score: 0, label: '', color: 'bg-slate-500' };
    if (pwd.length < 4) return { score: 25, label: 'Too short (min 4 chars)', color: 'bg-rose-500' };
    let score = 25;
    if (pwd.length >= 6) score += 25;
    if (/[0-9]/.test(pwd) && /[a-zA-Z]/.test(pwd)) score += 25;
    if (/[^a-zA-Z0-9]/.test(pwd) || pwd.length >= 10) score += 25;

    if (score <= 25) return { score, label: 'Weak', color: 'bg-rose-500' };
    if (score <= 50) return { score, label: 'Fair', color: 'bg-amber-500' };
    if (score <= 75) return { score, label: 'Good', color: 'bg-sky-500' };
    return { score, label: 'Strong', color: 'bg-emerald-500' };
  };

  const strength = getPasswordStrength(newPassword);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!currentPassword) {
      setErrorMsg('Please enter your current password.');
      return;
    }

    if (!newPassword) {
      setErrorMsg('Please enter your new password.');
      return;
    }

    if (newPassword.length < 4) {
      setErrorMsg('New password must be at least 4 characters long.');
      return;
    }

    if (currentPassword === newPassword) {
      setErrorMsg('New password must be different from your current password.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('New password and confirm password do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await changePassword(currentPassword, newPassword);
      setSuccessMsg(res?.message || 'Password changed successfully! Keep your new password safe.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to change password. Please check your current password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const userName = user?.name || 'User Profile';
  const userEmail = user?.email || 'user@organization.com';
  const userRole = user?.role === 'admin' ? 'Central Administrator' : 'Team Evaluator (User)';
  const userTeam = user?.team || 'Nexen';
  const userId = user?.id || 'usr_active';

  return (
    <div className="space-y-6 pb-12 animate-fadeIn max-w-5xl mx-auto">
      {/* 1. Header / Breadcrumb */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-xs text-indigo-500 font-semibold mb-1">
            <span>Account</span>
            <span>›</span>
            <span className={isDark ? 'text-white' : 'text-slate-900'}>My Profile & Security</span>
          </div>
          <h1 className={`text-2xl font-black tracking-tight flex items-center gap-2.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            <User className="w-6 h-6 text-indigo-500" />
            <span>Profile & Account Credentials</span>
          </h1>
          <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            আপনার পার্সোনাল ইনফরমেশন এবং সিকিউরিটি সেটিংস (পাসওয়ার্ড পরিবর্তন) ম্যানেজ করুন।
          </p>
        </div>

        {onNavigateTab && (
          <button
            onClick={() => onNavigateTab(isAdmin ? 'adminDashboard' : 'dashboard')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 cursor-pointer shadow-xs ${
              isDark
                ? 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-800'
                : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
            }`}
          >
            <span>Back to Dashboard</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* 2. Personal Information Card */}
      <div className={`p-6 sm:p-7 rounded-2xl border transition-all shadow-sm relative overflow-hidden ${
        isDark
          ? 'bg-slate-900/90 border-slate-800 text-slate-100'
          : 'bg-white border-slate-200 text-slate-900'
      }`}>
        {/* Ambient Top Glow */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row items-start md:items-center gap-6 relative z-10">
          {/* Avatar Icon */}
          <div className="relative shrink-0">
            <div className="w-20 h-20 sm:w-22 sm:h-22 rounded-2xl bg-gradient-to-tr from-indigo-700 via-indigo-600 to-sky-500 text-white flex items-center justify-center font-black text-3xl sm:text-4xl shadow-xl shadow-indigo-600/30 ring-4 ring-indigo-500/20">
              {userName.charAt(0).toUpperCase()}
            </div>
            <div className="absolute -bottom-1.5 -right-1.5 p-1 rounded-full bg-emerald-500 text-white ring-2 ring-slate-900" title="Active Account">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>

          {/* User Details */}
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className={`text-xl sm:text-2xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {userName}
              </h2>

              <span className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold uppercase border flex items-center gap-1.5 ${
                isAdmin
                  ? 'bg-indigo-500/15 border-indigo-500/40 text-indigo-400'
                  : 'bg-sky-500/15 border-sky-500/40 text-sky-400'
              }`}>
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>{user?.role || 'user'}</span>
              </span>

              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border flex items-center gap-1.5 ${
                isDark ? 'bg-indigo-500/10 border-indigo-500/25 text-indigo-300' : 'bg-indigo-50 border-indigo-200 text-indigo-700'
              }`}>
                <Users className="w-3.5 h-3.5" />
                <span>Team: <strong>{userTeam}</strong></span>
              </span>

              <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border flex items-center gap-1.5 ${
                isDark ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-emerald-50 border-emerald-200 text-emerald-700'
              }`}>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Active Account</span>
              </span>
            </div>

            <p className={`text-xs flex items-center gap-2 font-mono ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              <Mail className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              <span>{userEmail}</span>
              <button
                type="button"
                onClick={() => handleCopy(userEmail, 'email')}
                className="hover:text-indigo-400 transition cursor-pointer p-0.5"
                title="Copy Email"
              >
                {copiedField === 'email' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              </button>
            </p>

            <div className="flex items-center gap-3 pt-1 text-xs flex-wrap">
              <span className={`text-[11px] font-mono px-2 py-0.5 rounded border flex items-center gap-1 ${
                isDark ? 'bg-slate-950/70 border-slate-800 text-slate-400' : 'bg-slate-100 border-slate-200 text-slate-600'
              }`}>
                <span>ID: {userId}</span>
                <button
                  type="button"
                  onClick={() => handleCopy(userId, 'id')}
                  className="hover:text-indigo-400 transition cursor-pointer p-0.5"
                  title="Copy User ID"
                >
                  {copiedField === 'id' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                </button>
              </span>

              <span className={`text-[11px] px-2 py-0.5 rounded border flex items-center gap-1 ${
                isDark ? 'bg-slate-950/70 border-slate-800 text-slate-400' : 'bg-slate-100 border-slate-200 text-slate-600'
              }`}>
                <Clock className="w-3 h-3 text-indigo-400" />
                <span>Auto-logout 10m Inactivity</span>
              </span>
            </div>
          </div>
        </div>

        {/* Info Grid Breakdown */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-200 dark:border-slate-800/80">
          <div className={`p-3.5 rounded-xl border ${isDark ? 'bg-slate-950/50 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Full Name</span>
            <span className="text-xs font-bold text-slate-900 dark:text-white truncate block">{userName}</span>
          </div>

          <div className={`p-3.5 rounded-xl border ${isDark ? 'bg-slate-950/50 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Assigned Team</span>
            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
              <Users className="w-3 h-3" /> {userTeam}
            </span>
          </div>

          <div className={`p-3.5 rounded-xl border ${isDark ? 'bg-slate-950/50 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Account Role</span>
            <span className="text-xs font-bold text-slate-900 dark:text-white truncate block">{userRole}</span>
          </div>

          <div className={`p-3.5 rounded-xl border ${isDark ? 'bg-slate-950/50 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Credential Security</span>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> 256-Bit Bcrypt
            </span>
          </div>
        </div>
      </div>

      {/* 3. Change Password Card (Fully Functional) */}
      <div className={`p-6 sm:p-7 rounded-2xl border transition-all shadow-sm ${
        isDark ? 'bg-slate-900/90 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        <div className="flex items-center gap-3 pb-4 mb-5 border-b border-slate-200 dark:border-slate-800">
          <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
            <KeyRound className="w-5 h-5" />
          </div>
          <div>
            <h3 className={`text-base font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Change Account Password (পাসওয়ার্ড পরিবর্তন)
            </h3>
            <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              আপনার বর্তমান পাসওয়ার্ড যাচাই করে নতুন পাসওয়ার্ড সংরক্ষণ করুন।
            </p>
          </div>
        </div>

        {/* Success Alert Banner */}
        {successMsg && (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-start gap-2.5 mb-5 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">{successMsg}</p>
              <p className="text-[11px] opacity-80 mt-0.5">পরবর্তী সময়ে লগইন করার জন্য অনুগ্রহ করে এই নতুন পাসওয়ার্ডটি ব্যবহার করুন।</p>
            </div>
          </div>
        )}

        {/* Error Alert Banner */}
        {errorMsg && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center gap-2.5 mb-5 animate-fadeIn">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-xl">
          {/* Field 1: Current Password */}
          <div>
            <label className={`block text-xs font-semibold mb-1.5 flex items-center justify-between ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              <span className="flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-indigo-500" />
                <span>Current Password (বর্তমান পাসওয়ার্ড)</span>
                <span className="text-rose-500">*</span>
              </span>
            </label>
            <div className="relative">
              <input
                type={showCurrentPassword ? 'text' : 'password'}
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                className={`w-full border rounded-xl px-4 py-2.5 pr-10 text-xs transition focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  isDark
                    ? 'bg-slate-950 border-slate-800 text-white placeholder-slate-500 focus:border-indigo-500'
                    : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:bg-white focus:border-indigo-600'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute inset-y-0 right-0 px-3 flex items-center text-slate-400 hover:text-slate-200 transition cursor-pointer"
                title={showCurrentPassword ? 'Hide password' : 'Show password'}
              >
                {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Field 2: New Password */}
          <div>
            <label className={`block text-xs font-semibold mb-1.5 flex items-center justify-between ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              <span className="flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-indigo-500" />
                <span>New Password (নতুন পাসওয়ার্ড)</span>
                <span className="text-rose-500">*</span>
              </span>
              {newPassword && (
                <span className={`text-[10px] font-mono font-bold ${
                  strength.score <= 25 ? 'text-rose-400' : strength.score <= 50 ? 'text-amber-400' : 'text-emerald-400'
                }`}>
                  Strength: {strength.label}
                </span>
              )}
            </label>
            <div className="relative">
              <input
                type={showNewPassword ? 'text' : 'password'}
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password (min 4 characters)"
                className={`w-full border rounded-xl px-4 py-2.5 pr-10 text-xs transition focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  isDark
                    ? 'bg-slate-950 border-slate-800 text-white placeholder-slate-500 focus:border-indigo-500'
                    : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:bg-white focus:border-indigo-600'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute inset-y-0 right-0 px-3 flex items-center text-slate-400 hover:text-slate-200 transition cursor-pointer"
                title={showNewPassword ? 'Hide password' : 'Show password'}
              >
                {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Password strength progress meter */}
            {newPassword && (
              <div className="mt-2 space-y-1">
                <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${strength.color}`}
                    style={{ width: `${strength.score}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Field 3: Confirm New Password */}
          <div>
            <label className={`block text-xs font-semibold mb-1.5 flex items-center justify-between ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" />
                <span>Confirm New Password (পুনরায় নতুন পাসওয়ার্ড দিন)</span>
                <span className="text-rose-500">*</span>
              </span>
              {confirmPassword && (
                <span className={`text-[10px] font-mono font-bold ${
                  newPassword === confirmPassword ? 'text-emerald-400' : 'text-rose-400'
                }`}>
                  {newPassword === confirmPassword ? '✓ Passwords Match' : '✕ Passwords Do Not Match'}
                </span>
              )}
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                className={`w-full border rounded-xl px-4 py-2.5 pr-10 text-xs transition focus:outline-none focus:ring-2 ${
                  confirmPassword && newPassword !== confirmPassword
                    ? 'border-rose-500 focus:ring-rose-500/40'
                    : confirmPassword && newPassword === confirmPassword
                    ? 'border-emerald-500 focus:ring-emerald-500/40'
                    : 'focus:ring-indigo-500'
                } ${
                  isDark
                    ? 'bg-slate-950 border-slate-800 text-white placeholder-slate-500 focus:border-indigo-500'
                    : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:bg-white focus:border-indigo-600'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 px-3 flex items-center text-slate-400 hover:text-slate-200 transition cursor-pointer"
                title={showConfirmPassword ? 'Hide password' : 'Show password'}
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting || !currentPassword || !newPassword || !confirmPassword || newPassword !== confirmPassword}
              className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/25 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer uppercase tracking-wider"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Updating Password...</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Save & Update Password</span>
                </>
              )}
            </button>
          </div>
        </form>

        <div className={`mt-6 pt-4 text-[11px] border-t flex items-center gap-2 ${
          isDark ? 'text-slate-400 border-slate-800/80' : 'text-slate-500 border-slate-200'
        }`}>
          <Shield className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span>পাসওয়ার্ড পরিবর্তনের সাথে সাথে কেন্দ্রীয় গুগল শিটের ডেটাবেজে তা স্বয়ংক্রিয়ভাবে এনক্রিপ্ট হয়ে সেভ হয়।</span>
        </div>
      </div>
    </div>
  );
}
