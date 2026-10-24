'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { AuthUser, LoginAuditLog, TEAM_OPTIONS } from '../types';
import { ShieldAlert, Users, UserCheck, UserX, ShieldCheck, Edit, Clock, Search, RefreshCw, X, Save, AlertCircle, FileText, CheckCircle2, BarChart3, Activity, Trophy, Sparkles } from 'lucide-react';

const GithubIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
  </svg>
);

const LinkedinIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"/>
  </svg>
);

interface AdminUserManagementViewProps {
  theme?: 'dark' | 'light';
  initialSubTab?: 'overview' | 'users' | 'logs';
  onNavigateTab?: (tab: 'adminDashboard' | 'userManagement' | 'adminLogs') => void;
}

export default function AdminUserManagementView({ theme = 'dark', initialSubTab = 'overview', onNavigateTab }: AdminUserManagementViewProps) {
  const isDark = theme === 'dark';
  const { token } = useAuth();

  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'users' | 'logs'>(initialSubTab);

  useEffect(() => {
    setActiveSubTab(initialSubTab);
  }, [initialSubTab]);

  const handleSwitchTab = (tab: 'overview' | 'users' | 'logs') => {
    setActiveSubTab(tab);
    if (onNavigateTab) {
      if (tab === 'overview') onNavigateTab('adminDashboard');
      if (tab === 'users') onNavigateTab('userManagement');
      if (tab === 'logs') onNavigateTab('adminLogs');
    }
  };

  const [users, setUsers] = useState<AuthUser[]>([]);
  const [logs, setLogs] = useState<LoginAuditLog[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [userStatusFilter, setUserStatusFilter] = useState<'all' | 'pending' | 'active' | 'banned'>('all');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Edit User Modal State
  const [editingUser, setEditingUser] = useState<AuthUser | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editTeam, setEditTeam] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const getBackendUrl = () => {
    if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
      return 'http://localhost:5000';
    }
    return process.env.NEXT_PUBLIC_BACKEND_URL || 'https://resume-screening-backend.vercel.app';
  };

  const BACKEND_URL = getBackendUrl();

  const fetchUsers = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const activeToken = token || (typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null);
      if (!activeToken) return;
      const res = await fetch(`${BACKEND_URL}/api/admin/users`, {
        headers: { Authorization: `Bearer ${activeToken}` }
      });
      const data = await res.json();
      if (res.ok && data.users) {
        const seen = new Set<string>();
        const uniqueUsers: AuthUser[] = [];
        data.users.forEach((u: AuthUser) => {
          const key = (u.id || u.email || '').toLowerCase().trim();
          if (key && !seen.has(key)) {
            seen.add(key);
            uniqueUsers.push(u);
          }
        });
        setUsers(uniqueUsers);
      } else {
        throw new Error(data.error || 'Failed to fetch users.');
      }
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchLogs = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const activeToken = token || (typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null);
      if (!activeToken) return;
      const res = await fetch(`${BACKEND_URL}/api/admin/login-logs`, {
        headers: { Authorization: `Bearer ${activeToken}` }
      });
      const data = await res.json();
      if (res.ok && data.logs) {
        setLogs(data.logs);
      } else {
        throw new Error(data.error || 'Failed to fetch login audit logs.');
      }
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchHistory = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/history`);
      if (res.ok) {
        const data = await res.json();
        if (data.history && Array.isArray(data.history)) {
          setHistory(data.history);
        }
      }
    } catch (err) {}
  };

  useEffect(() => {
    fetchUsers();
    fetchLogs();
    fetchHistory();
  }, [token]);

  const handleApproveUser = async (userToApprove: AuthUser) => {
    try {
      setErrorMsg(null);
      const activeToken = token || (typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null);
      const res = await fetch(`${BACKEND_URL}/api/admin/users/${userToApprove.id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${activeToken}`
        },
        body: JSON.stringify({ status: 'active' })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg(`User "${userToApprove.name}" has been successfully APPROVED and activated.`);
        setUsers(prev => prev.map(u => (u.id === userToApprove.id || u.email === userToApprove.email) ? { ...u, status: 'active' } : u));
        fetchUsers();
      } else {
        throw new Error(data.error || 'Approval failed.');
      }
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const handleToggleStatus = async (userToToggle: AuthUser) => {
    const newStatus = (userToToggle.status === 'banned') ? 'active' : 'banned';
    const actionLabel = newStatus === 'banned' ? (userToToggle.status === 'pending' ? 'REJECT' : 'BAN') : 'ACTIVATE';
    if (!confirm(`Are you sure you want to ${actionLabel} user "${userToToggle.name}"?`)) return;

    try {
      setErrorMsg(null);
      const activeToken = token || (typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null);
      const res = await fetch(`${BACKEND_URL}/api/admin/users/${userToToggle.id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${activeToken}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg(`User "${userToToggle.name}" is now ${newStatus.toUpperCase()}.`);
        setUsers(prev => prev.map(u => (u.id === userToToggle.id || u.email === userToToggle.email) ? { ...u, status: newStatus } : u));
        fetchUsers();
      } else {
        throw new Error(data.error || 'Status update failed.');
      }
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const handleToggleRole = async (userToToggle: AuthUser) => {
    const newRole = userToToggle.role === 'admin' ? 'user' : 'admin';
    const actionName = newRole === 'admin' ? 'Make Admin' : 'Make User';

    if (!confirm(`Are you sure you want to ${actionName} for "${userToToggle.name}" (${userToToggle.email})?`)) return;

    try {
      setErrorMsg(null);
      const res = await fetch(`${BACKEND_URL}/api/admin/users/${userToToggle.id}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ role: newRole })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg(`User "${userToToggle.name}" is now updated to ${newRole === 'admin' ? 'Admin' : 'User'}.`);
        setUsers(prev => prev.map(u => (u.id === userToToggle.id || u.email === userToToggle.email) ? { ...u, role: newRole } : u));
        fetchUsers();
      } else {
        throw new Error(data.error || 'Role update failed.');
      }
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const handleSaveEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setIsUpdating(true);

    try {
      setErrorMsg(null);
      const res = await fetch(`${BACKEND_URL}/api/admin/users/${editingUser.id}/edit`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ name: editName, email: editEmail, team: editTeam })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg(`User updated successfully.`);
        setEditingUser(null);
        fetchUsers();
      } else {
        throw new Error(data.error || 'Edit failed.');
      }
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsUpdating(false);
    }
  };

  const getUserName = (email: string) => {
    const found = users.find(u => (u.email || '').toLowerCase() === (email || '').toLowerCase());
    return found && found.name ? found.name : (email ? email.split('@')[0] : 'Central Admin');
  };

  const getToolBadge = (details: string = '') => {
    const text = details.toLowerCase();
    if (text.includes('linkedin')) {
      return (
        <span className="px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 text-[10px] font-bold inline-flex items-center gap-1 whitespace-nowrap shrink-0">
          <LinkedinIcon className="w-3 h-3" /> LinkedIn Profile Check
        </span>
      );
    }
    if (text.includes('github')) {
      return (
        <span className="px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 text-[10px] font-bold inline-flex items-center gap-1 whitespace-nowrap shrink-0">
          <GithubIcon className="w-3 h-3" /> GitHub Profile Auditor
        </span>
      );
    }
    if (text.includes('screening') || text.includes('batch') || text.includes('jd')) {
      return (
        <span className="px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 text-[10px] font-bold inline-flex items-center gap-1 whitespace-nowrap shrink-0">
          <FileText className="w-3 h-3" /> Resume Screener
        </span>
      );
    }
    if (text.includes('ats')) {
      return (
        <span className="px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 text-[10px] font-bold inline-flex items-center gap-1 whitespace-nowrap shrink-0">
          <CheckCircle2 className="w-3 h-3" /> ATS Resume Check
        </span>
      );
    }
    return (
      <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[10px] font-bold inline-flex items-center gap-1 whitespace-nowrap shrink-0">
        🔐 System Auth
      </span>
    );
  };

  // Combine Google Sheet Login_Logs with master History records to guarantee full audit trail
  const combinedLogs = React.useMemo(() => {
    const historyLogs = history.map((h, idx) => {
      const toolName = h.type === 'linkedin' || /linkedin/i.test(h.operationName || '')
        ? 'LinkedIn Profile Check'
        : h.type === 'github'
        ? 'GitHub Profile Auditor'
        : h.type === 'ats'
        ? 'ATS Resume Check'
        : 'Candidate Resume Screener';
      const count = h.totalCandidates || (h.results ? h.results.length : 0);
      return {
        id: h.id || `hist_log_${idx}`,
        email: h.executorEmail || h.email || 'admin@gmail.com',
        role: 'admin',
        loginTime: h.dateFormatted || new Date(h.timestamp || Date.now()).toLocaleString(),
        details: `${toolName} Executed: '${h.operationName || 'Batch Run'}' (${count} candidate profiles evaluated)`
      };
    });

    const merged = [...logs, ...historyLogs];
    const uniqueMap = new Map<string, any>();
    merged.forEach(l => {
      const key = `${l.email}_${l.loginTime}_${l.details}`;
      if (!uniqueMap.has(key)) {
        uniqueMap.set(key, l);
      }
    });

    return Array.from(uniqueMap.values());
  }, [logs, history]);

  const filteredUsers = users.filter(u => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      (u.name || '').toLowerCase().includes(q) ||
      (u.email || '').toLowerCase().includes(q) ||
      (u.role || '').toLowerCase().includes(q) ||
      (u.status || '').toLowerCase().includes(q);
    const matchesStatus = userStatusFilter === 'all' || u.status === userStatusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredLogs = combinedLogs.filter(l =>
    getUserName(l.email).toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.loginTime.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (l.details && l.details.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const adminCount = users.filter(u => u.role === 'admin').length;
  const bannedCount = users.filter(u => u.status === 'banned').length;

  // Calculate Tool Usage Statistics (Point 6: কোন tool কেমন use হচ্ছে)
  const ghHistory = history.filter(h => h.type === 'github' || /github/i.test(h.operationName || ''));
  const ghLogs = logs.filter(l => l.details && /github/i.test(l.details));
  const githubRuns = Math.max(ghHistory.length, ghLogs.length);
  const githubCandidates = ghHistory.reduce((acc, h) => acc + (h.totalCandidates || (h.results ? h.results.length : 0)), 0);

  const liHistory = history.filter(h => h.type === 'linkedin' || /linkedin/i.test(h.operationName || ''));
  const liLogs = logs.filter(l => l.details && /linkedin/i.test(l.details));
  const linkedinRuns = Math.max(liHistory.length, liLogs.length);
  const linkedinCandidates = liHistory.reduce((acc, h) => acc + (h.totalCandidates || (h.results ? h.results.length : 0)), 0);

  const screeningHistory = history.filter(h => (h.type === 'screening' || h.type === 'job') && !/ats/i.test(h.operationName || '') && !/github/i.test(h.operationName || '') && !/linkedin/i.test(h.operationName || ''));
  const screeningLogs = logs.filter(l => l.details && /screening|job|jd/i.test(l.details));
  const screeningRuns = Math.max(screeningHistory.length, screeningLogs.length);
  const screeningCandidates = screeningHistory.reduce((acc, h) => acc + (h.totalCandidates || (h.candidates ? h.candidates.length : 0)), 0);

  const atsHistory = history.filter(h => h.type === 'ats' || (/ats/i.test(h.operationName || '') && !/github/i.test(h.operationName || '') && !/linkedin/i.test(h.operationName || '')));
  const atsLogs = logs.filter(l => l.details && /ats/i.test(l.details));
  const atsRuns = Math.max(atsHistory.length, atsLogs.length);
  const atsCandidates = atsHistory.reduce((acc, h) => acc + (h.totalCandidates || (h.candidates ? h.candidates.length : 0)), 0);

  const totalToolRuns = githubRuns + screeningRuns + atsRuns + linkedinRuns || 1;
  const totalCandidatesCount = githubCandidates + screeningCandidates + atsCandidates + linkedinCandidates;

  const githubPct = Math.round((githubRuns / totalToolRuns) * 100);
  const linkedinPct = Math.round((linkedinRuns / totalToolRuns) * 100);
  const screeningPct = Math.round((screeningRuns / totalToolRuns) * 100);
  const atsPct = Math.round((atsRuns / totalToolRuns) * 100);

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight flex items-center gap-2.5">
            <ShieldAlert className="w-6 h-6 text-indigo-500" />
            <span className={isDark ? 'text-white' : 'text-slate-900'}>
              {activeSubTab === 'users' ? 'User Management & Role Control' : activeSubTab === 'logs' ? 'User Activity & Security Audit Logs' : 'Admin Analytics Dashboard & Overview'}
            </span>
          </h2>
          <p className={`text-xs mt-1 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
            {activeSubTab === 'users'
              ? 'Approve new signups, manage roles, edit accounts, and toggle user permissions.'
              : activeSubTab === 'logs'
              ? 'Complete timestamped audit trail of all candidate evaluations, logins, and system operations.'
              : 'Full system overview: Tool usage metrics, candidate volumes, and operational analytics.'}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap shrink-0">
          <button
            onClick={() => handleSwitchTab('overview')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs border cursor-pointer ${
              activeSubTab === 'overview'
                ? 'bg-indigo-600 text-white border-indigo-500 ring-2 ring-indigo-500/30'
                : isDark
                ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-300'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Dashboard Overview</span>
          </button>

          <button
            onClick={() => handleSwitchTab('users')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs border cursor-pointer ${
              activeSubTab === 'users'
                ? 'bg-indigo-600 text-white border-indigo-500 ring-2 ring-indigo-500/30'
                : isDark
                ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-300'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>User Management ({users.length})</span>
            {users.filter(u => u.status === 'pending').length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-amber-500 text-slate-950 font-black animate-pulse">
                {users.filter(u => u.status === 'pending').length} Pending
              </span>
            )}
          </button>

          <button
            onClick={() => handleSwitchTab('logs')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs border cursor-pointer ${
              activeSubTab === 'logs'
                ? 'bg-indigo-600 text-white border-indigo-500 ring-2 ring-indigo-500/30'
                : isDark
                ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-300'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Audit Logs ({combinedLogs.length})</span>
          </button>

          <button
            onClick={() => { fetchUsers(); fetchLogs(); fetchHistory(); }}
            disabled={isLoading}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold border flex items-center gap-1.5 transition cursor-pointer ${
              isDark ? 'bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border-indigo-500/30' : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200 shadow-2xs'
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh Data</span>
          </button>
        </div>
      </div>

      {/* Feedback Messages */}
      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-semibold flex justify-between items-center">
          <span>⚠️ {errorMsg}</span>
          <button onClick={() => setErrorMsg(null)} className="hover:opacity-70 cursor-pointer">✕</button>
        </div>
      )}

      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex justify-between items-center">
          <span>✅ {successMsg}</span>
          <button onClick={() => setSuccessMsg(null)} className="hover:opacity-70 cursor-pointer">✕</button>
        </div>
      )}

      {/* Search & Status Filters for Users */}
      {activeSubTab === 'users' && (
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search users by name, email, role, or status..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full border rounded-xl pl-10 pr-4 py-2.5 text-xs transition focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                isDark ? 'bg-slate-900 border-slate-800 text-white placeholder-slate-500' : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 shadow-2xs'
              }`}
            />
          </div>

          <div className={`flex items-center p-1 rounded-xl border text-xs font-semibold gap-1 shrink-0 ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-2xs'
          }`}>
            {(['all', 'pending', 'active', 'banned'] as const).map(st => {
              const count = st === 'all' ? users.length : users.filter(u => u.status === st).length;
              return (
                <button
                  key={st}
                  onClick={() => setUserStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-lg capitalize transition text-xs font-bold flex items-center gap-1 cursor-pointer ${
                    userStatusFilter === st
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : isDark
                      ? 'text-slate-400 hover:text-white'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span>{st === 'pending' ? 'Pending Approval' : st}</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                    st === 'pending' && count > 0
                      ? 'bg-amber-500 text-slate-950 font-black'
                      : userStatusFilter === st
                      ? 'bg-white/20 text-white'
                      : isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-700'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Search Input for Audit Logs */}
      {activeSubTab === 'logs' && (
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search logs by email, date, role..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full border rounded-xl pl-10 pr-4 py-2.5 text-xs transition focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
              isDark ? 'bg-slate-900 border-slate-800 text-white placeholder-slate-500' : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 shadow-2xs'
            }`}
          />
        </div>
      )}

      {/* SUB-TAB 0: Admin Dashboard Overview */}
      {activeSubTab === 'overview' && (
        <div className="space-y-6">
            {/* Tool Usage Analytics & Stats (Replaces old 4 boxes per Point 1 & Point 6) */}
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold flex items-center gap-2">
                    <BarChart3 className="w-4.5 h-4.5 text-indigo-500" />
                    <span>Tool Usage Analytics & Statistics (কোন Tool কেমন Use হচ্ছে)</span>
                  </h3>
                  <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    Real-time execution analytics across all 3 AI-Free screening tools
                  </p>
                </div>

                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                  isDark ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                }`}>
                  Total Executed: {totalToolRuns} Operations ({totalCandidatesCount} Candidates)
                </span>
              </div>

              {/* Visual Graphical Charts Layout */}
              {(() => {
                const toolsData = [
                  {
                    id: 'ats',
                    name: 'ATS Resume Check',
                    shortName: 'ATS Check',
                    runs: atsRuns,
                    candidates: atsCandidates,
                    pct: atsPct,
                    color: '#6366F1',
                    icon: CheckCircle2,
                    typeLabel: 'Resumes'
                  },
                  {
                    id: 'screening',
                    name: 'Resume Screener',
                    shortName: 'JD Screening',
                    runs: screeningRuns,
                    candidates: screeningCandidates,
                    pct: screeningPct,
                    color: '#4F46E5',
                    icon: FileText,
                    typeLabel: 'Resumes'
                  },
                  {
                    id: 'github',
                    name: 'GitHub Profile Auditor',
                    shortName: 'GitHub Check',
                    runs: githubRuns,
                    candidates: githubCandidates,
                    pct: githubPct,
                    color: '#A5B4FC',
                    icon: GithubIcon,
                    typeLabel: 'Profiles'
                  },
                  {
                    id: 'linkedin',
                    name: 'LinkedIn Profile Check',
                    shortName: 'LinkedIn Check',
                    runs: linkedinRuns,
                    candidates: linkedinCandidates,
                    pct: linkedinPct,
                    color: '#818CF8',
                    icon: LinkedinIcon,
                    typeLabel: 'Profiles'
                  }
                ];

                const mostUsed = [...toolsData].sort((a, b) => b.runs - a.runs)[0];
                const maxRunCount = Math.max(...toolsData.map(t => t.runs), 1);

                return (
                  <div className={`w-full p-5 sm:p-6 rounded-2xl border transition shadow-xs flex flex-col justify-between ${
                    isDark ? 'bg-slate-900/80 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
                  }`}>
                    <div>
                      <div className="flex items-center justify-between border-b pb-3 mb-3 border-slate-200 dark:border-slate-800">
                        <div>
                          <h4 className="text-xs font-bold tracking-wide uppercase text-indigo-500 flex items-center gap-1.5">
                            <Activity className="w-4 h-4" /> Tool Executions Frequency (Bar Chart)
                          </h4>
                          <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                            Showing total execution count per tool (Actual run numbers, not percentage)
                          </p>
                        </div>
                        <span className="text-xs font-bold text-emerald-500 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                          ⚡ Live Counts
                        </span>
                      </div>

                      {/* Highlight Banner: Most Used Tool */}
                      <div className={`p-3 rounded-xl border flex items-center justify-between text-xs mb-3 ${
                        isDark
                          ? 'bg-indigo-950/40 border-indigo-500/30 text-slate-200'
                          : 'bg-indigo-50/80 border-indigo-200 text-indigo-900'
                      }`}>
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-500 flex items-center justify-center font-bold">
                            <Trophy className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="font-bold text-xs">Most Used Tool: <strong>{mostUsed.name}</strong></span>
                            <span className={`block text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                              Total {mostUsed.runs} runs recorded ({mostUsed.pct}% of all operations)
                            </span>
                          </div>
                        </div>
                        <span className="px-2.5 py-1 rounded-lg text-xs font-extrabold bg-indigo-600 text-white shadow-xs">
                          {mostUsed.runs} Executions
                        </span>
                      </div>
                    </div>

                    {/* Vertical Comparative Bars showing RUN COUNT */}
                    <div className="h-56 pt-2 pb-2 flex items-end justify-around gap-6">
                      {toolsData.map(tool => {
                        const isTop = tool.id === mostUsed.id;
                        const heightPct = Math.max(25, Math.round((tool.runs / maxRunCount) * 100));

                        return (
                          <div key={tool.id} className="flex-1 flex flex-col items-center h-full justify-end group">
                            {/* Top Label: Badge & Exact Run Count */}
                            <div className="flex flex-col items-center mb-1.5 transition-transform group-hover:-translate-y-1">
                              {isTop && (
                                <span className="text-[10px] font-black uppercase text-amber-500 flex items-center gap-0.5 mb-0.5">
                                  <Trophy className="w-3 h-3" /> Most Used
                                </span>
                              )}
                              <span className={`text-sm font-black ${isTop ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-700 dark:text-slate-300'}`}>
                                {tool.runs} Runs
                              </span>
                            </div>

                            {/* Bar with exact count inside */}
                            <div className={`w-full max-w-[72px] rounded-t-xl h-full flex items-end p-1.5 relative overflow-hidden transition ${
                              isDark ? 'bg-slate-800/70' : 'bg-slate-100'
                            }`}>
                              <div
                                className={`w-full rounded-t-lg transition-all duration-700 relative flex items-center justify-center shadow-md ${
                                  isTop
                                    ? 'bg-gradient-to-t from-indigo-700 to-indigo-500 ring-2 ring-indigo-400/50'
                                    : 'bg-gradient-to-t from-indigo-900 to-indigo-600 dark:from-indigo-800 dark:to-indigo-500'
                                }`}
                                style={{ height: `${heightPct}%` }}
                              >
                                {/* Exact Run Count inside Bar */}
                                <span className="text-xs font-black text-white drop-shadow-md">
                                  {tool.runs}
                                </span>
                              </div>
                            </div>

                            {/* Bottom Tool Name & Evaluated count */}
                            <div className="mt-2.5 text-center w-full">
                              <span className="block text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                                {tool.shortName}
                              </span>
                              <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 block mt-0.5">
                                {tool.candidates} {tool.typeLabel}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}
            </div>



          {/* System Health & Recent Activity Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* System Status */}
            <div className={`p-5 rounded-2xl border space-y-4 ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200 shadow-xs'}`}>
              <h3 className="text-sm font-bold flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-emerald-500" />
                System Integration Status
              </h3>

              <div className="space-y-3 text-xs">
                <div className={`flex items-center justify-between p-3 rounded-xl border ${
                  isDark ? 'bg-slate-950/40 border-slate-800/80 text-slate-300' : 'bg-slate-100/80 border-slate-200 text-slate-800'
                }`}>
                  <span className={`font-semibold ${isDark ? 'text-slate-400' : 'text-slate-700'}`}>Master Google Sheet Sync</span>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                    Connected & Active
                  </span>
                </div>

                <div className={`flex items-center justify-between p-3 rounded-xl border ${
                  isDark ? 'bg-slate-950/40 border-slate-800/80 text-slate-300' : 'bg-slate-100/80 border-slate-200 text-slate-800'
                }`}>
                  <span className={`font-semibold ${isDark ? 'text-slate-400' : 'text-slate-700'}`}>Session Inactivity Security</span>
                  <span className="font-mono text-indigo-600 dark:text-indigo-400 font-bold">10-Min Auto-Logout</span>
                </div>

                <div className={`flex items-center justify-between p-3 rounded-xl border ${
                  isDark ? 'bg-slate-950/40 border-slate-800/80 text-slate-300' : 'bg-slate-100/80 border-slate-200 text-slate-800'
                }`}>
                  <span className={`font-semibold ${isDark ? 'text-slate-400' : 'text-slate-700'}`}>Password Hashing Security</span>
                  <span className="font-mono text-indigo-600 dark:text-indigo-400 font-bold">Bcrypt 10 Rounds</span>
                </div>

                <div className={`flex items-center justify-between p-3 rounded-xl border ${
                  isDark ? 'bg-slate-950/40 border-slate-800/80 text-slate-300' : 'bg-slate-100/80 border-slate-200 text-slate-800'
                }`}>
                  <span className={`font-semibold ${isDark ? 'text-slate-400' : 'text-slate-700'}`}>Database Sheets Tabs</span>
                  <span className="font-mono text-indigo-600 dark:text-indigo-400 font-bold">Users & Login_Logs</span>
                </div>
              </div>
            </div>

            {/* Recent Login Audit Trail Preview */}
            <div className={`p-5 rounded-2xl border space-y-4 ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200 shadow-xs'}`}>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold flex items-center gap-2">
                  <Clock className="w-4 h-4 text-indigo-500" />
                  Recent User Logins
                </h3>
                <button
                  onClick={() => setActiveSubTab('logs')}
                  className="text-xs text-indigo-500 hover:underline font-bold"
                >
                  View All ({logs.length}) →
                </button>
              </div>

              <div className="space-y-2">
                {logs.slice(0, 4).length === 0 ? (
                  <p className={`text-xs p-4 text-center ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>No recent login events recorded.</p>
                ) : (
                  logs.slice(0, 4).map((l, idx) => (
                    <div key={idx} className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
                      isDark ? 'bg-slate-950/40 border-slate-800/60 text-slate-300' : 'bg-slate-100/80 border-slate-200 text-slate-800'
                    }`}>
                      <div>
                        <div className="font-bold text-indigo-600 dark:text-indigo-400 font-mono text-[11px]">{l.email}</div>
                        <div className={`text-[10px] mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{l.details}</div>
                      </div>
                      <div className="text-right">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase border ${
                          l.role === 'admin'
                            ? 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-300'
                            : isDark
                            ? 'bg-slate-800 text-slate-300 border-slate-700'
                            : 'bg-slate-200 text-slate-800 border-slate-300'
                        }`}>
                          {l.role}
                        </span>
                        <div className={`text-[10px] font-mono mt-1 ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>{l.loginTime}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 1: Registered Users Table */}
      {activeSubTab === 'users' && (
        <div className={`border rounded-2xl overflow-hidden ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200 shadow-md'}`}>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className={`border-b uppercase text-[10px] font-bold ${isDark ? 'bg-slate-950/60 border-slate-800 text-slate-400' : 'bg-slate-100 border-slate-200 text-slate-700'}`}>
                  <th className="p-3.5 whitespace-nowrap">User Name</th>
                  <th className="p-3.5 whitespace-nowrap">Email Address</th>
                  <th className="p-3.5 whitespace-nowrap">Team</th>
                  <th className="p-3.5 whitespace-nowrap">Role</th>
                  <th className="p-3.5 whitespace-nowrap">Status</th>
                  <th className="p-3.5 text-right whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDark ? 'divide-slate-800/40' : 'divide-slate-200'}`}>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className={`p-8 text-center ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      No user accounts found.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u, idx) => (
                    <tr key={`${u.id || u.email || 'user'}_${idx}`} className={`transition ${isDark ? 'hover:bg-indigo-500/5' : 'hover:bg-indigo-50/60'}`}>
                      <td className="p-3.5 font-bold flex items-center gap-2 whitespace-nowrap">
                        <div className="w-7 h-7 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs shrink-0">
                          {u.name ? u.name.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <span className={isDark ? 'text-slate-100' : 'text-slate-900'}>{u.name}</span>
                      </td>
                      <td className={`p-3.5 font-mono whitespace-nowrap ${isDark ? 'text-slate-300' : 'text-slate-700 font-semibold'}`}>{u.email}</td>
                      <td className="p-3.5 whitespace-nowrap">
                        {u.team ? (
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border inline-flex items-center gap-1 whitespace-nowrap ${
                            isDark
                              ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30'
                              : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                          }`}>
                            <span>👥</span>
                            <span>{u.team}</span>
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-400 dark:text-slate-500 italic">None</span>
                        )}
                      </td>
                      <td className="p-3.5 whitespace-nowrap">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                          u.role === 'admin'
                            ? isDark
                              ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30'
                              : 'bg-indigo-100 text-indigo-700 border-indigo-300'
                            : isDark
                            ? 'bg-slate-800 text-slate-300 border-slate-700'
                            : 'bg-slate-200 text-slate-800 border-slate-300'
                        }`}>
                          <span className="text-xs">{u.role === 'admin' ? '🛡️' : '👤'}</span>
                          <span>{u.role === 'admin' ? 'Admin' : 'User'}</span>
                        </span>
                      </td>
                      <td className="p-3.5 whitespace-nowrap">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                          u.status === 'banned'
                            ? isDark
                              ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                              : 'bg-rose-100 text-rose-700 border-rose-300'
                            : u.status === 'pending'
                            ? isDark
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                              : 'bg-amber-100 text-amber-800 border-amber-300'
                            : isDark
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : 'bg-emerald-100 text-emerald-700 border-emerald-300'
                        }`}>
                          <span>{u.status === 'banned' ? '🚫' : u.status === 'pending' ? '⏳' : '✅'}</span>
                          <span>{u.status === 'banned' ? 'Banned' : u.status === 'pending' ? 'Pending Approval' : 'Active'}</span>
                        </span>
                      </td>
                      <td className="p-3.5 text-right space-x-2 whitespace-nowrap">
                        {u.status === 'pending' ? (
                          <>
                            <button
                              onClick={() => handleApproveUser(u)}
                              className={`px-3 py-1.5 rounded-lg font-bold transition text-xs inline-flex items-center gap-1 shadow-xs cursor-pointer ${
                                isDark
                                  ? 'bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 border border-emerald-500/30'
                                  : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border border-emerald-300'
                              }`}
                              title="Approve user registration"
                            >
                              <UserCheck className="w-3.5 h-3.5" /> Approve
                            </button>

                            <button
                              onClick={() => handleToggleStatus(u)}
                              className={`px-2.5 py-1.5 rounded-lg font-bold transition text-xs inline-flex items-center gap-1 cursor-pointer ${
                                isDark
                                  ? 'bg-rose-600/20 text-rose-400 hover:bg-rose-600/30 border border-rose-500/30'
                                  : 'bg-rose-100 text-rose-700 hover:bg-rose-200 border border-rose-300'
                              }`}
                              title="Reject / Ban user"
                            >
                              <UserX className="w-3.5 h-3.5" /> Reject
                            </button>

                            <button
                              onClick={() => { setEditingUser(u); setEditName(u.name || ''); setEditEmail(u.email || ''); setEditTeam(u.team || ''); }}
                              className={`px-2.5 py-1.5 rounded-lg font-semibold transition text-xs inline-flex items-center gap-1 cursor-pointer ${
                                isDark
                                  ? 'bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600/30'
                                  : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200 border border-indigo-300'
                              }`}
                            >
                              <Edit className="w-3.5 h-3.5" /> Edit
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => { setEditingUser(u); setEditName(u.name || ''); setEditEmail(u.email || ''); setEditTeam(u.team || ''); }}
                              className={`px-2.5 py-1.5 rounded-lg font-semibold transition text-xs inline-flex items-center gap-1 cursor-pointer ${
                                isDark
                                  ? 'bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600/30'
                                  : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200 border border-indigo-300'
                              }`}
                            >
                              <Edit className="w-3.5 h-3.5" /> Edit
                            </button>

                            <button
                              onClick={() => handleToggleRole(u)}
                              className={`px-2.5 py-1.5 rounded-lg font-bold transition text-xs inline-flex items-center gap-1 cursor-pointer ${
                                isDark
                                  ? 'bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600/30'
                                  : 'bg-indigo-100 text-indigo-800 hover:bg-indigo-200 border border-indigo-300'
                              }`}
                              title={u.role === 'admin' ? 'Make User' : 'Make Admin'}
                            >
                              <ShieldCheck className="w-3.5 h-3.5" /> {u.role === 'admin' ? 'Make User' : 'Make Admin'}
                            </button>

                            <button
                              onClick={() => handleToggleStatus(u)}
                              className={`px-2.5 py-1.5 rounded-lg font-bold transition text-xs inline-flex items-center gap-1 cursor-pointer ${
                                u.status === 'banned'
                                  ? isDark
                                    ? 'bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30'
                                    : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border border-emerald-300'
                                  : isDark
                                  ? 'bg-rose-600/20 text-rose-400 hover:bg-rose-600/30'
                                  : 'bg-rose-100 text-rose-700 hover:bg-rose-200 border border-rose-300'
                              }`}
                            >
                              {u.status === 'banned' ? <UserCheck className="w-3.5 h-3.5" /> : <UserX className="w-3.5 h-3.5" />}
                              {u.status === 'banned' ? 'Unban' : 'Ban'}
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: User Activity Audit Trail Table (Point 2: Name, Email, Role, Event, Tool Used) */}
      {activeSubTab === 'logs' && (
        <div className={`border rounded-2xl overflow-hidden ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200 shadow-md'}`}>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className={`border-b uppercase text-[10px] font-bold ${isDark ? 'bg-slate-950/60 border-slate-800 text-slate-400' : 'bg-slate-100 border-slate-200 text-slate-700'}`}>
                  <th className="p-3.5 whitespace-nowrap">User Name</th>
                  <th className="p-3.5 whitespace-nowrap">Email Address</th>
                  <th className="p-3.5 whitespace-nowrap">Role</th>
                  <th className="p-3.5 whitespace-nowrap">Tool Used</th>
                  <th className="p-3.5 whitespace-nowrap">Audit Event Details</th>
                  <th className="p-3.5 whitespace-nowrap">Activity Timestamp</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDark ? 'divide-slate-800/40' : 'divide-slate-200'}`}>
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className={`p-8 text-center ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      No user activity audit logs recorded yet.
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((l, idx) => (
                    <tr key={l.id || idx} className={`transition ${isDark ? 'hover:bg-indigo-500/5' : 'hover:bg-indigo-50/60'}`}>
                      <td className="p-3.5 font-bold flex items-center gap-2 whitespace-nowrap">
                        <div className="w-6 h-6 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-[11px] shrink-0">
                          {getUserName(l.email).charAt(0).toUpperCase()}
                        </div>
                        <span className={isDark ? 'text-slate-100' : 'text-slate-900'}>{getUserName(l.email)}</span>
                      </td>
                      <td className="p-3.5 font-bold font-mono text-indigo-600 dark:text-indigo-400 whitespace-nowrap">{l.email}</td>
                      <td className="p-3.5 whitespace-nowrap">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                          l.role === 'admin'
                            ? isDark
                              ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30'
                              : 'bg-indigo-100 text-indigo-700 border-indigo-300'
                            : isDark
                            ? 'bg-slate-800 text-slate-300 border-slate-700'
                            : 'bg-slate-200 text-slate-800 border-slate-300'
                        }`}>
                          <span className="text-xs">{l.role === 'admin' ? '🛡️' : '👤'}</span>
                          <span>{l.role === 'admin' ? 'Admin' : 'User'}</span>
                        </span>
                      </td>
                      <td className="p-3.5 whitespace-nowrap">
                        {getToolBadge(l.details)}
                      </td>
                      <td className={`p-3.5 ${isDark ? 'text-slate-300' : 'text-slate-800 font-medium'}`}>{l.details}</td>
                      <td className={`p-3.5 font-mono text-[11px] whitespace-nowrap ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{l.loginTime}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`w-full max-w-md rounded-2xl border p-6 space-y-5 ${
            isDark ? 'bg-slate-900 border-slate-800 text-slate-100 shadow-2xl' : 'bg-white border-slate-200 text-slate-900 shadow-2xl'
          }`}>
            <div className={`flex items-center justify-between border-b pb-3 ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
              <h3 className="text-base font-bold">Edit User Details</h3>
              <button onClick={() => setEditingUser(null)} className={`p-1 rounded ${isDark ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-600'}`}>
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditUser} className="space-y-4">
              <div>
                <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Full Name</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className={`w-full border rounded-xl px-3.5 py-2 text-xs ${
                    isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div>
                <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Email Address</label>
                <input
                  type="email"
                  required
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className={`w-full border rounded-xl px-3.5 py-2 text-xs ${
                    isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div>
                <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Assigned Team</label>
                <select
                  value={editTeam}
                  onChange={(e) => setEditTeam(e.target.value)}
                  className={`w-full border rounded-xl px-3.5 py-2 text-xs cursor-pointer ${
                    isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                >
                  <option value="">-- No Team Assigned --</option>
                  {TEAM_OPTIONS.map((t) => (
                    <option key={t} value={t} className={isDark ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className={`px-4 py-2 rounded-xl border text-xs font-semibold cursor-pointer ${
                    isDark ? 'border-slate-700 text-slate-300 hover:bg-slate-800' : 'border-slate-300 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Save className="w-4 h-4" /> Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
