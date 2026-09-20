'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { AuthUser, LoginAuditLog } from '../types';
import { ShieldAlert, Users, UserCheck, UserX, ShieldCheck, Edit, Clock, Search, RefreshCw, X, Save, AlertCircle } from 'lucide-react';

interface AdminUserManagementViewProps {
  theme?: 'dark' | 'light';
  initialSubTab?: 'overview' | 'users' | 'logs';
}

export default function AdminUserManagementView({ theme = 'dark', initialSubTab = 'overview' }: AdminUserManagementViewProps) {
  const isDark = theme === 'dark';
  const { token } = useAuth();

  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'users' | 'logs'>(initialSubTab);

  useEffect(() => {
    setActiveSubTab(initialSubTab);
  }, [initialSubTab]);

  const [users, setUsers] = useState<AuthUser[]>([]);
  const [logs, setLogs] = useState<LoginAuditLog[]>([]);
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

  useEffect(() => {
    if (token) {
      fetchUsers();
      fetchLogs();
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

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredLogs = logs.filter(l =>
    l.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.loginTime.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const adminCount = users.filter(u => u.role === 'admin').length;
  const bannedCount = users.filter(u => u.status === 'banned').length;

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

        <button
          onClick={() => { fetchUsers(); fetchLogs(); }}
          disabled={isLoading}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold border flex items-center gap-1.5 transition ${
            isDark ? 'bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border-indigo-500/30' : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200 shadow-2xs'
          }`}
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Sub-tab Navigation */}
      <div className={`flex border-b gap-6 ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
        <button
          onClick={() => setActiveSubTab('overview')}
          className={`pb-3 text-sm font-bold border-b-2 transition flex items-center gap-2 ${
            activeSubTab === 'overview'
              ? 'border-purple-500 text-purple-500'
              : isDark
              ? 'border-transparent text-slate-400 hover:text-slate-200'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-purple-500" />
          <span>Admin Dashboard Overview</span>
        </button>

        <button
          onClick={() => setActiveSubTab('users')}
          className={`pb-3 text-sm font-bold border-b-2 transition flex items-center gap-2 ${
            activeSubTab === 'users'
              ? 'border-purple-500 text-purple-500'
              : isDark
              ? 'border-transparent text-slate-400 hover:text-slate-200'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>User Management ({users.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('logs')}
          className={`pb-3 text-sm font-bold border-b-2 transition flex items-center gap-2 ${
            activeSubTab === 'logs'
              ? 'border-purple-500 text-purple-500'
              : isDark
              ? 'border-transparent text-slate-400 hover:text-slate-200'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Clock className="w-4 h-4 text-cyan-500" />
          <span>History & Login Audit Logs ({logs.length})</span>
        </button>
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
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Users */}
            <div className={`p-5 rounded-2xl border transition shadow-xs ${isDark ? 'bg-slate-900/60 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'}`}>
              <div className="flex items-center justify-between">
                <span className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Total Users</span>
                <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500">
                  <Users className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3">
                <span className="text-3xl font-extrabold tracking-tight">{users.length}</span>
                <p className="text-[11px] text-emerald-500 font-semibold mt-1">
                  {users.filter(u => u.status === 'active').length} Active Accounts
                </p>
              </div>
            </div>

            {/* Active Admins */}
            <div className={`p-5 rounded-2xl border transition shadow-xs ${isDark ? 'bg-slate-900/60 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'}`}>
              <div className="flex items-center justify-between">
                <span className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>System Admins</span>
                <div className="p-2 rounded-xl bg-purple-500/10 text-purple-500">
                  <ShieldCheck className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3">
                <span className="text-3xl font-extrabold tracking-tight">{adminCount}</span>
                <p className="text-[11px] text-purple-500 font-semibold mt-1">
                  Full Administrative Privileges
                </p>
              </div>
            </div>

            {/* Banned Accounts */}
            <div className={`p-5 rounded-2xl border transition shadow-xs ${isDark ? 'bg-slate-900/60 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'}`}>
              <div className="flex items-center justify-between">
                <span className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Banned Accounts</span>
                <div className="p-2 rounded-xl bg-rose-500/10 text-rose-500">
                  <UserX className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3">
                <span className="text-3xl font-extrabold tracking-tight text-rose-500">{bannedCount}</span>
                <p className={`text-[11px] mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  {users.length ? Math.round((bannedCount / users.length) * 100) : 0}% of user base
                </p>
              </div>
            </div>

            {/* Total Login Audits */}
            <div className={`p-5 rounded-2xl border transition shadow-xs ${isDark ? 'bg-slate-900/60 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'}`}>
              <div className="flex items-center justify-between">
                <span className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Login Events</span>
                <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-500">
                  <Clock className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3">
                <span className="text-3xl font-extrabold tracking-tight text-cyan-600 dark:text-cyan-400">{logs.length}</span>
                <p className={`text-[11px] mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Logged in Master Google Sheet
                </p>
              </div>
            </div>
          </div>

          {/* Quick Action Banner */}
          <div className={`p-5 rounded-2xl border flex flex-col sm:flex-row items-center justify-between gap-4 bg-gradient-to-r ${
            isDark ? 'from-indigo-950/60 via-purple-950/40 to-slate-900 border-indigo-500/30' : 'from-indigo-50 via-purple-50 to-white border-indigo-200 shadow-xs'
          }`}>
            <div>
              <h3 className="text-base font-bold flex items-center gap-2">
                <span>🛡️ Quick Administrative Control Center</span>
              </h3>
              <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Manage user permissions, promote users to admin, ban accounts, or inspect login timestamps.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setActiveSubTab('users')}
                className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
              >
                <Users className="w-4 h-4" /> Manage Users
              </button>
              <button
                onClick={() => setActiveSubTab('logs')}
                className="px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
              >
                <Clock className="w-4 h-4" /> View Audit Logs
              </button>
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

      {/* SUB-TAB 2: Login Audit Trail Table */}
      {activeSubTab === 'logs' && (
        <div className={`border rounded-2xl overflow-hidden ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200 shadow-md'}`}>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className={`border-b uppercase text-[10px] font-bold ${isDark ? 'bg-slate-950/60 border-slate-800 text-slate-400' : 'bg-slate-100 border-slate-200 text-slate-700'}`}>
                  <th className="p-3.5">Email Address</th>
                  <th className="p-3.5">Role</th>
                  <th className="p-3.5">Login Date & Time</th>
                  <th className="p-3.5">Audit Event Details</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDark ? 'divide-slate-800/40' : 'divide-slate-200'}`}>
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={4} className={`p-8 text-center ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      No login audit logs recorded.
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((l, idx) => (
                    <tr key={l.id || idx} className={`transition ${isDark ? 'hover:bg-cyan-500/5' : 'hover:bg-cyan-50/60'}`}>
                      <td className="p-3.5 font-bold font-mono text-indigo-600 dark:text-cyan-400">{l.email}</td>
                      <td className="p-3.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                          l.role === 'admin'
                            ? 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-300'
                            : isDark
                            ? 'bg-slate-800 text-slate-300 border-slate-700'
                            : 'bg-slate-200 text-slate-800 border-slate-300'
                        }`}>
                          {l.role}
                        </span>
                      </td>
                      <td className={`p-3.5 font-mono ${isDark ? 'text-slate-300' : 'text-slate-700 font-medium'}`}>{l.loginTime}</td>
                      <td className={`p-3.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{l.details}</td>
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
