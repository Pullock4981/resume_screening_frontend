'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { AuthUser, LoginAuditLog } from '../types';
import { ShieldAlert, Users, UserCheck, UserX, ShieldCheck, Edit, Clock, Search, RefreshCw, X, Save, AlertCircle, FileText, CheckCircle2, BarChart3, Activity } from 'lucide-react';

const GithubIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
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
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Edit User Modal State
  const [editingUser, setEditingUser] = useState<AuthUser | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
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
      const res = await fetch(`${BACKEND_URL}/api/admin/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data.users) {
        setUsers(data.users);
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
      const res = await fetch(`${BACKEND_URL}/api/admin/login-logs`, {
        headers: { Authorization: `Bearer ${token}` }
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
    if (token) {
      fetchUsers();
      fetchLogs();
      fetchHistory();
    }
  }, [token]);

  const handleToggleStatus = async (userToToggle: AuthUser) => {
    const newStatus = userToToggle.status === 'banned' ? 'active' : 'banned';
    if (!confirm(`Are you sure you want to ${newStatus === 'banned' ? 'BAN' : 'UNBAN'} ${userToToggle.name}?`)) return;

    try {
      setErrorMsg(null);
      const res = await fetch(`${BACKEND_URL}/api/admin/users/${userToToggle.id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg(`User ${userToToggle.name} is now ${newStatus.toUpperCase()}.`);
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
    const actionName = newRole === 'admin' ? 'Promote to Admin' : 'Demote to User';

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
        setSuccessMsg(`User "${userToToggle.name}" has been successfully ${newRole === 'admin' ? 'PROMOTED to Admin' : 'DEMOTED to User'}.`);
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
        body: JSON.stringify({ name: editName, email: editEmail })
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
    const found = users.find(u => u.email.toLowerCase() === (email || '').toLowerCase());
    return found && found.name ? found.name : (email ? email.split('@')[0] : 'Central Admin');
  };

  const getToolBadge = (details: string = '') => {
    const text = details.toLowerCase();
    if (text.includes('github')) {
      return (
        <span className="px-2.5 py-1 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 text-[10px] font-bold inline-flex items-center gap-1">
          <GithubIcon className="w-3 h-3" /> GitHub Profile Auditor
        </span>
      );
    }
    if (text.includes('screening') || text.includes('batch') || text.includes('jd')) {
      return (
        <span className="px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 text-[10px] font-bold inline-flex items-center gap-1">
          <FileText className="w-3 h-3" /> Resume Screener
        </span>
      );
    }
    if (text.includes('ats')) {
      return (
        <span className="px-2.5 py-1 rounded-full bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20 text-[10px] font-bold inline-flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3" /> ATS Resume Check
        </span>
      );
    }
    return (
      <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[10px] font-bold inline-flex items-center gap-1">
        🔐 System Auth
      </span>
    );
  };

  // Combine Google Sheet Login_Logs with master History records to guarantee full audit trail
  const combinedLogs = React.useMemo(() => {
    const historyLogs = history.map((h, idx) => {
      const toolName = h.type === 'github' ? 'GitHub Profile Auditor' : h.type === 'ats' ? 'ATS Resume Check' : 'Candidate Resume Screener';
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

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
  const ghHistory = history.filter(h => h.type === 'github');
  const ghLogs = logs.filter(l => l.details && /github/i.test(l.details));
  const githubRuns = Math.max(ghHistory.length, ghLogs.length);
  const githubCandidates = ghHistory.reduce((acc, h) => acc + (h.totalCandidates || (h.results ? h.results.length : 0)), 0);

  const screeningHistory = history.filter(h => h.type === 'screening' || h.type === 'job');
  const screeningLogs = logs.filter(l => l.details && /screening|job|jd/i.test(l.details));
  const screeningRuns = Math.max(screeningHistory.length, screeningLogs.length);
  const screeningCandidates = screeningHistory.reduce((acc, h) => acc + (h.totalCandidates || (h.candidates ? h.candidates.length : 0)), 0);

  const atsHistory = history.filter(h => h.type === 'ats');
  const atsLogs = logs.filter(l => l.details && /ats/i.test(l.details));
  const atsRuns = Math.max(atsHistory.length, atsLogs.length);
  const atsCandidates = atsHistory.reduce((acc, h) => acc + (h.totalCandidates || (h.candidates ? h.candidates.length : 0)), 0);

  const totalToolRuns = githubRuns + screeningRuns + atsRuns || 1;
  const totalCandidatesCount = githubCandidates + screeningCandidates + atsCandidates;

  const githubPct = Math.round((githubRuns / totalToolRuns) * 100);
  const screeningPct = Math.round((screeningRuns / totalToolRuns) * 100);
  const atsPct = Math.round((atsRuns / totalToolRuns) * 100);

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight flex items-center gap-2.5">
            <ShieldAlert className="w-6 h-6 text-purple-500" />
            Admin Dashboard & Control Panel
          </h2>
          <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            Full system overview: User Management, Role Promotion, Account Ban Control & Login Audit Logs.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap shrink-0">
          <button
            onClick={() => handleSwitchTab('overview')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs border ${
              activeSubTab === 'overview'
                ? 'bg-purple-600 text-white border-purple-500 ring-2 ring-purple-500/30'
                : isDark
                ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Dashboard Overview</span>
          </button>

          <button
            onClick={() => handleSwitchTab('users')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs border ${
              activeSubTab === 'users'
                ? 'bg-purple-600 text-white border-purple-500 ring-2 ring-purple-500/30'
                : isDark
                ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>User Management ({users.length})</span>
          </button>

          <button
            onClick={() => handleSwitchTab('logs')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs border ${
              activeSubTab === 'logs'
                ? 'bg-cyan-600 text-white border-cyan-500 ring-2 ring-cyan-500/30'
                : isDark
                ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Audit Logs ({combinedLogs.length})</span>
          </button>

          <button
            onClick={() => { fetchUsers(); fetchLogs(); fetchHistory(); }}
            disabled={isLoading}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold border flex items-center gap-1.5 transition ${
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
          <button onClick={() => setErrorMsg(null)} className="hover:opacity-70">✕</button>
        </div>
      )}

      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex justify-between items-center">
          <span>✅ {successMsg}</span>
          <button onClick={() => setSuccessMsg(null)} className="hover:opacity-70">✕</button>
        </div>
      )}

      {/* Search Input (Shown for Users & Logs) */}
      {activeSubTab !== 'overview' && (
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder={activeSubTab === 'users' ? "Search users by name, email, role..." : "Search logs by email, date..."}
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
                    <BarChart3 className="w-4.5 h-4.5 text-purple-500" />
                    <span>Tool Usage Analytics & Statistics (কোন Tool কেমন Use হচ্ছে)</span>
                  </h3>
                  <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    Real-time execution analytics across all 3 AI-Free screening tools
                  </p>
                </div>

                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                  isDark ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' : 'bg-purple-50 text-purple-700 border border-purple-200'
                }`}>
                  Total Executed: {githubRuns + screeningRuns + atsRuns} Operations ({totalCandidatesCount} Candidates)
                </span>
              </div>

              {/* Visual Graphical Charts Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* Visual Chart 1: Donut Distribution Chart */}
                <div className={`p-5 rounded-2xl border transition shadow-xs flex flex-col items-center justify-between ${
                  isDark ? 'bg-slate-900/80 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
                }`}>
                  <div className="w-full flex items-center justify-between border-b pb-3 mb-4 border-slate-200 dark:border-slate-800">
                    <h4 className="text-xs font-bold tracking-wide uppercase text-purple-500 flex items-center gap-1.5">
                      <BarChart3 className="w-4 h-4" /> Usage Share % (Donut Chart)
                    </h4>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">
                      Total: {githubRuns + screeningRuns + atsRuns} Ops
                    </span>
                  </div>

                  {/* SVG Donut Chart */}
                  <div className="relative w-44 h-44 flex items-center justify-center my-2">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                      {/* Background Ring */}
                      <circle
                        cx="50"
                        cy="50"
                        r="38"
                        className="stroke-slate-200 dark:stroke-slate-800"
                        strokeWidth="10"
                        fill="transparent"
                      />
                      {/* GitHub Segment */}
                      <circle
                        cx="50"
                        cy="50"
                        r="38"
                        className="stroke-purple-500 transition-all duration-700"
                        strokeWidth="10"
                        strokeDasharray={`${(githubRuns / totalToolRuns) * 238.76} 238.76`}
                        strokeDashoffset="0"
                        strokeLinecap="round"
                        fill="transparent"
                      />
                      {/* Screening Segment */}
                      <circle
                        cx="50"
                        cy="50"
                        r="38"
                        className="stroke-indigo-500 transition-all duration-700"
                        strokeWidth="10"
                        strokeDasharray={`${(screeningRuns / totalToolRuns) * 238.76} 238.76`}
                        strokeDashoffset={`-${(githubRuns / totalToolRuns) * 238.76}`}
                        strokeLinecap="round"
                        fill="transparent"
                      />
                      {/* ATS Segment */}
                      <circle
                        cx="50"
                        cy="50"
                        r="38"
                        className="stroke-cyan-500 transition-all duration-700"
                        strokeWidth="10"
                        strokeDasharray={`${(atsRuns / totalToolRuns) * 238.76} 238.76`}
                        strokeDashoffset={`-${((githubRuns + screeningRuns) / totalToolRuns) * 238.76}`}
                        strokeLinecap="round"
                        fill="transparent"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                      <span className="text-2xl font-black tracking-tight">{githubRuns + screeningRuns + atsRuns}</span>
                      <span className={`text-[10px] font-bold uppercase ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Total Runs</span>
                    </div>
                  </div>

                  {/* Donut Legend */}
                  <div className="w-full grid grid-cols-3 gap-1 pt-3 border-t border-slate-200 dark:border-slate-800 text-center text-[11px] font-bold">
                    <div className="flex flex-col items-center">
                      <div className="flex items-center gap-1 text-purple-500">
                        <span className="w-2.5 h-2.5 rounded-full bg-purple-500 inline-block"></span>
                        <span>GH</span>
                      </div>
                      <span className="text-xs font-black mt-0.5">{githubPct}%</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <div className="flex items-center gap-1 text-indigo-500">
                        <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 inline-block"></span>
                        <span>JD</span>
                      </div>
                      <span className="text-xs font-black mt-0.5">{screeningPct}%</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <div className="flex items-center gap-1 text-cyan-500">
                        <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 inline-block"></span>
                        <span>ATS</span>
                      </div>
                      <span className="text-xs font-black mt-0.5">{atsPct}%</span>
                    </div>
                  </div>
                </div>

                {/* Visual Chart 2: Comparative Bar Graph */}
                <div className={`lg:col-span-2 p-5 rounded-2xl border transition shadow-xs flex flex-col justify-between ${
                  isDark ? 'bg-slate-900/80 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
                }`}>
                  <div className="flex items-center justify-between border-b pb-3 mb-2 border-slate-200 dark:border-slate-800">
                    <div>
                      <h4 className="text-xs font-bold tracking-wide uppercase text-indigo-500 flex items-center gap-1.5">
                        <Activity className="w-4 h-4" /> Operations & Candidates Comparison Chart
                      </h4>
                      <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        Side-by-side volume comparison of executions vs processed candidates
                      </p>
                    </div>
                    <span className="text-xs font-bold text-emerald-500 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                      ⚡ Live Data
                    </span>
                  </div>

                  {/* Vertical Comparative Bars */}
                  <div className="h-44 pt-4 pb-2 flex items-end justify-around gap-6">
                    {/* Bar 1: GitHub Auditor */}
                    <div className="flex-1 flex flex-col items-center h-full justify-end group">
                      <span className="text-xs font-extrabold text-purple-500 mb-1">{githubRuns} Runs</span>
                      <div className="w-full max-w-[56px] bg-slate-200 dark:bg-slate-800/80 rounded-t-xl h-full flex items-end p-1 relative overflow-hidden">
                        <div
                          className="w-full bg-gradient-to-t from-purple-600 to-purple-400 rounded-t-lg transition-all duration-700 relative group-hover:brightness-110"
                          style={{ height: `${Math.max(15, Math.round((githubRuns / Math.max(githubRuns, screeningRuns, atsRuns, 1)) * 100))}%` }}
                        >
                          <div className="absolute inset-x-0 top-1 text-center text-[10px] font-black text-white drop-shadow-xs">
                            {githubPct}%
                          </div>
                        </div>
                      </div>
                      <div className="mt-2 text-center">
                        <span className="block text-xs font-bold text-purple-500 truncate">GitHub Auditor</span>
                        <span className="text-[10px] font-semibold text-emerald-500">{githubCandidates} Profiles</span>
                      </div>
                    </div>

                    {/* Bar 2: Candidate Resume Screener */}
                    <div className="flex-1 flex flex-col items-center h-full justify-end group">
                      <span className="text-xs font-extrabold text-indigo-500 mb-1">{screeningRuns} Runs</span>
                      <div className="w-full max-w-[56px] bg-slate-200 dark:bg-slate-800/80 rounded-t-xl h-full flex items-end p-1 relative overflow-hidden">
                        <div
                          className="w-full bg-gradient-to-t from-indigo-600 to-indigo-400 rounded-t-lg transition-all duration-700 relative group-hover:brightness-110"
                          style={{ height: `${Math.max(15, Math.round((screeningRuns / Math.max(githubRuns, screeningRuns, atsRuns, 1)) * 100))}%` }}
                        >
                          <div className="absolute inset-x-0 top-1 text-center text-[10px] font-black text-white drop-shadow-xs">
                            {screeningPct}%
                          </div>
                        </div>
                      </div>
                      <div className="mt-2 text-center">
                        <span className="block text-xs font-bold text-indigo-500 truncate">Resume Screener</span>
                        <span className="text-[10px] font-semibold text-emerald-500">{screeningCandidates} Resumes</span>
                      </div>
                    </div>

                    {/* Bar 3: ATS Resume Check */}
                    <div className="flex-1 flex flex-col items-center h-full justify-end group">
                      <span className="text-xs font-extrabold text-cyan-500 mb-1">{atsRuns} Runs</span>
                      <div className="w-full max-w-[56px] bg-slate-200 dark:bg-slate-800/80 rounded-t-xl h-full flex items-end p-1 relative overflow-hidden">
                        <div
                          className="w-full bg-gradient-to-t from-cyan-600 to-cyan-400 rounded-t-lg transition-all duration-700 relative group-hover:brightness-110"
                          style={{ height: `${Math.max(15, Math.round((atsRuns / Math.max(githubRuns, screeningRuns, atsRuns, 1)) * 100))}%` }}
                        >
                          <div className="absolute inset-x-0 top-1 text-center text-[10px] font-black text-white drop-shadow-xs">
                            {atsPct}%
                          </div>
                        </div>
                      </div>
                      <div className="mt-2 text-center">
                        <span className="block text-xs font-bold text-cyan-500 truncate">ATS Check</span>
                        <span className="text-[10px] font-semibold text-emerald-500">{atsCandidates} Resumes</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 3 Tool Detailed Metric Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
                {/* Tool 1: GitHub Profile Checker */}
                <div className={`p-4 rounded-2xl border transition shadow-xs relative overflow-hidden ${
                  isDark ? 'bg-slate-900/60 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-purple-500/10 text-purple-500">
                        <GithubIcon className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold tracking-wide uppercase text-purple-500">GitHub Profile Auditor</h4>
                        <p className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>60-Point Rubric Check</p>
                      </div>
                    </div>
                    <span className="text-xs font-extrabold text-purple-500 bg-purple-500/10 px-2 py-0.5 rounded-full border border-purple-500/20">
                      {githubPct}% Share
                    </span>
                  </div>

                  <div className="mt-3 flex items-baseline justify-between">
                    <div>
                      <span className="text-xl font-extrabold tracking-tight">{githubRuns}</span>
                      <span className={`text-[11px] ml-1.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Executions</span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-bold text-emerald-500">{githubCandidates}</span>
                      <span className={`text-[11px] ml-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Profiles</span>
                    </div>
                  </div>
                </div>

                {/* Tool 2: Candidate Resume Screener */}
                <div className={`p-4 rounded-2xl border transition shadow-xs relative overflow-hidden ${
                  isDark ? 'bg-slate-900/60 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold tracking-wide uppercase text-indigo-500">Resume Screening</h4>
                        <p className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>JD Match & Math Scoring</p>
                      </div>
                    </div>
                    <span className="text-xs font-extrabold text-indigo-500 bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">
                      {screeningPct}% Share
                    </span>
                  </div>

                  <div className="mt-3 flex items-baseline justify-between">
                    <div>
                      <span className="text-xl font-extrabold tracking-tight">{screeningRuns}</span>
                      <span className={`text-[11px] ml-1.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Executions</span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-bold text-emerald-500">{screeningCandidates}</span>
                      <span className={`text-[11px] ml-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Resumes</span>
                    </div>
                  </div>
                </div>

                {/* Tool 3: ATS Resume Check */}
                <div className={`p-4 rounded-2xl border transition shadow-xs relative overflow-hidden ${
                  isDark ? 'bg-slate-900/60 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-500">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold tracking-wide uppercase text-cyan-500">ATS Resume Check</h4>
                        <p className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Rubric & Parsing Check</p>
                      </div>
                    </div>
                    <span className="text-xs font-extrabold text-cyan-500 bg-cyan-500/10 px-2 py-0.5 rounded-full border border-cyan-500/20">
                      {atsPct}% Share
                    </span>
                  </div>

                  <div className="mt-3 flex items-baseline justify-between">
                    <div>
                      <span className="text-xl font-extrabold tracking-tight">{atsRuns}</span>
                      <span className={`text-[11px] ml-1.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Executions</span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-bold text-emerald-500">{atsCandidates}</span>
                      <span className={`text-[11px] ml-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Resumes</span>
                    </div>
                  </div>
                </div>
              </div>
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
                  <span className={`font-semibold ${isDark ? 'text-slate-400' : 'text-slate-700'}`}>Authentication Session Token</span>
                  <span className="font-mono text-purple-600 dark:text-purple-400 font-bold">24-Hour Expiration JWT</span>
                </div>

                <div className={`flex items-center justify-between p-3 rounded-xl border ${
                  isDark ? 'bg-slate-950/40 border-slate-800/80 text-slate-300' : 'bg-slate-100/80 border-slate-200 text-slate-800'
                }`}>
                  <span className={`font-semibold ${isDark ? 'text-slate-400' : 'text-slate-700'}`}>Password Hashing Security</span>
                  <span className="font-mono text-cyan-600 dark:text-cyan-400 font-bold">Bcrypt 10 Rounds</span>
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
                  <Clock className="w-4 h-4 text-cyan-500" />
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
                        <div className="font-bold text-indigo-600 dark:text-cyan-400 font-mono text-[11px]">{l.email}</div>
                        <div className={`text-[10px] mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{l.details}</div>
                      </div>
                      <div className="text-right">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase border ${
                          l.role === 'admin'
                            ? 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-300'
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
                  <th className="p-3.5">User Name</th>
                  <th className="p-3.5">Email Address</th>
                  <th className="p-3.5">Role</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDark ? 'divide-slate-800/40' : 'divide-slate-200'}`}>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className={`p-8 text-center ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      No user accounts found.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => (
                    <tr key={u.id} className={`transition ${isDark ? 'hover:bg-indigo-500/5' : 'hover:bg-indigo-50/60'}`}>
                      <td className="p-3.5 font-bold flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold text-xs">
                          {u.name ? u.name.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <span className={isDark ? 'text-slate-100' : 'text-slate-900'}>{u.name}</span>
                      </td>
                      <td className={`p-3.5 font-mono ${isDark ? 'text-slate-300' : 'text-slate-700 font-semibold'}`}>{u.email}</td>
                      <td className="p-3.5">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border ${
                          u.role === 'admin'
                            ? isDark
                              ? 'bg-purple-500/10 text-purple-400 border-purple-500/30'
                              : 'bg-purple-100 text-purple-700 border-purple-300'
                            : isDark
                            ? 'bg-slate-800 text-slate-300 border-slate-700'
                            : 'bg-slate-200 text-slate-800 border-slate-300'
                        }`}>
                          {u.role === 'admin' ? '🛡️ Admin' : '👤 User'}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border ${
                          u.status === 'banned'
                            ? isDark
                              ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                              : 'bg-rose-100 text-rose-700 border-rose-300'
                            : isDark
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : 'bg-emerald-100 text-emerald-700 border-emerald-300'
                        }`}>
                          {u.status === 'banned' ? '🚫 Banned' : '✅ Active'}
                        </span>
                      </td>
                      <td className="p-3.5 text-right space-x-2">
                        <button
                          onClick={() => { setEditingUser(u); setEditName(u.name); setEditEmail(u.email); }}
                          className={`px-2.5 py-1.5 rounded-lg font-semibold transition text-xs inline-flex items-center gap-1 ${
                            isDark
                              ? 'bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600/30'
                              : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200 border border-indigo-300'
                          }`}
                        >
                          <Edit className="w-3.5 h-3.5" /> Edit
                        </button>

                        <button
                          onClick={() => handleToggleRole(u)}
                          className={`px-2.5 py-1.5 rounded-lg font-bold transition text-xs inline-flex items-center gap-1 ${
                            isDark
                              ? 'bg-purple-600/20 text-purple-400 hover:bg-purple-600/30'
                              : 'bg-purple-100 text-purple-800 hover:bg-purple-200 border border-purple-300'
                          }`}
                          title={u.role === 'admin' ? 'Demote to User' : 'Promote to Admin'}
                        >
                          <ShieldCheck className="w-3.5 h-3.5" /> {u.role === 'admin' ? 'Demote' : 'Promote'}
                        </button>

                        <button
                          onClick={() => handleToggleStatus(u)}
                          className={`px-2.5 py-1.5 rounded-lg font-bold transition text-xs inline-flex items-center gap-1 ${
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
                  <th className="p-3.5">User Name</th>
                  <th className="p-3.5">Email Address</th>
                  <th className="p-3.5">Role</th>
                  <th className="p-3.5">Tool Used</th>
                  <th className="p-3.5">Audit Event Details</th>
                  <th className="p-3.5">Activity Timestamp</th>
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
                    <tr key={l.id || idx} className={`transition ${isDark ? 'hover:bg-cyan-500/5' : 'hover:bg-cyan-50/60'}`}>
                      <td className="p-3.5 font-bold flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold text-[11px]">
                          {getUserName(l.email).charAt(0).toUpperCase()}
                        </div>
                        <span className={isDark ? 'text-slate-100' : 'text-slate-900'}>{getUserName(l.email)}</span>
                      </td>
                      <td className="p-3.5 font-bold font-mono text-indigo-600 dark:text-cyan-400">{l.email}</td>
                      <td className="p-3.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                          l.role === 'admin'
                            ? 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-300'
                            : isDark
                            ? 'bg-slate-800 text-slate-300 border-slate-700'
                            : 'bg-slate-200 text-slate-800 border-slate-300'
                        }`}>
                          {l.role === 'admin' ? '🛡️ Admin' : '👤 User'}
                        </span>
                      </td>
                      <td className="p-3.5">
                        {getToolBadge(l.details)}
                      </td>
                      <td className={`p-3.5 ${isDark ? 'text-slate-300' : 'text-slate-800 font-medium'}`}>{l.details}</td>
                      <td className={`p-3.5 font-mono text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{l.loginTime}</td>
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

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className={`px-4 py-2 rounded-xl border text-xs font-semibold ${
                    isDark ? 'border-slate-700 text-slate-300 hover:bg-slate-800' : 'border-slate-300 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm"
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
