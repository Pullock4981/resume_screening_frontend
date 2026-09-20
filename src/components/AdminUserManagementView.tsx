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

  const handleToggleStatus = async (user: AuthUser) => {
    const newStatus = user.status === 'banned' ? 'active' : 'banned';
    if (!confirm(`Are you sure you want to ${newStatus === 'banned' ? 'BAN' : 'UNBAN'} ${user.name}?`)) return;

    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/users/${user.id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg(`User ${user.name} is now ${newStatus.toUpperCase()}.`);
        fetchUsers();
      } else {
        throw new Error(data.error || 'Status update failed.');
      }
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const handleToggleRole = async (user: AuthUser) => {
    const newRole = user.role === 'admin' ? 'user' : 'admin';
    if (!confirm(`Promote/Demote ${user.name} to ${newRole.toUpperCase()}?`)) return;

    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/users/${user.id}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ role: newRole })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg(`User ${user.name} role changed to ${newRole.toUpperCase()}.`);
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
            <ShieldAlert className="w-6 h-6 text-purple-400" />
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
            isDark ? 'bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border-indigo-500/30' : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-600 border-indigo-200'
          }`}
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Sub-tab Navigation */}
      <div className="flex border-b border-slate-800 gap-6">
        <button
          onClick={() => setActiveSubTab('overview')}
          className={`pb-3 text-sm font-bold border-b-2 transition flex items-center gap-2 ${
            activeSubTab === 'overview'
              ? 'border-purple-500 text-purple-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-purple-400" />
          <span>Admin Dashboard Overview</span>
        </button>

        <button
          onClick={() => setActiveSubTab('users')}
          className={`pb-3 text-sm font-bold border-b-2 transition flex items-center gap-2 ${
            activeSubTab === 'users'
              ? 'border-purple-500 text-purple-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>User Management ({users.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('logs')}
          className={`pb-3 text-sm font-bold border-b-2 transition flex items-center gap-2 ${
            activeSubTab === 'logs'
              ? 'border-purple-500 text-purple-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Clock className="w-4 h-4 text-cyan-400" />
          <span>History & Login Audit Logs ({logs.length})</span>
        </button>
      </div>

      {/* Feedback Messages */}
      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-medium flex justify-between items-center">
          <span>⚠️ {errorMsg}</span>
          <button onClick={() => setErrorMsg(null)} className="hover:opacity-70">✕</button>
        </div>
      )}

      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium flex justify-between items-center">
          <span>✅ {successMsg}</span>
          <button onClick={() => setSuccessMsg(null)} className="hover:opacity-70">✕</button>
        </div>
      )}

      {/* Search Input (Shown for Users & Logs) */}
      {activeSubTab !== 'overview' && (
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
          <input
            type="text"
            placeholder={activeSubTab === 'users' ? "Search users by name, email, role..." : "Search logs by email, date..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full border rounded-xl pl-10 pr-4 py-2.5 text-xs transition focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
              isDark ? 'bg-slate-900 border-slate-800 text-white placeholder-slate-500' : 'bg-white border-slate-300 text-slate-900'
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
            <div className={`p-5 rounded-2xl border transition shadow-sm ${isDark ? 'bg-slate-900/60 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'}`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Users</span>
                <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
                  <Users className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3">
                <span className="text-3xl font-extrabold tracking-tight">{users.length}</span>
                <p className="text-[11px] text-emerald-400 font-semibold mt-1">
                  {users.filter(u => u.status === 'active').length} Active Accounts
                </p>
              </div>
            </div>

            {/* Active Admins */}
            <div className={`p-5 rounded-2xl border transition shadow-sm ${isDark ? 'bg-slate-900/60 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'}`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">System Admins</span>
                <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
                  <ShieldCheck className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3">
                <span className="text-3xl font-extrabold tracking-tight">{adminCount}</span>
                <p className="text-[11px] text-purple-400 font-semibold mt-1">
                  Full Administrative Privileges
                </p>
              </div>
            </div>

            {/* Banned Accounts */}
            <div className={`p-5 rounded-2xl border transition shadow-sm ${isDark ? 'bg-slate-900/60 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'}`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Banned Accounts</span>
                <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400">
                  <UserX className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3">
                <span className="text-3xl font-extrabold tracking-tight text-rose-400">{bannedCount}</span>
                <p className="text-[11px] text-slate-400 mt-1">
                  {users.length ? Math.round((bannedCount / users.length) * 100) : 0}% of user base
                </p>
              </div>
            </div>

            {/* Total Login Audits */}
            <div className={`p-5 rounded-2xl border transition shadow-sm ${isDark ? 'bg-slate-900/60 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'}`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Login Events</span>
                <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
                  <Clock className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3">
                <span className="text-3xl font-extrabold tracking-tight text-cyan-400">{logs.length}</span>
                <p className="text-[11px] text-slate-400 mt-1">
                  Logged in Master Google Sheet
                </p>
              </div>
            </div>
          </div>

          {/* Quick Action Banner */}
          <div className={`p-5 rounded-2xl border flex flex-col sm:flex-row items-center justify-between gap-4 bg-gradient-to-r ${
            isDark ? 'from-indigo-950/60 via-purple-950/40 to-slate-900 border-indigo-500/30' : 'from-indigo-50 via-purple-50 to-white border-indigo-200 shadow-sm'
          }`}>
            <div>
              <h3 className="text-base font-bold flex items-center gap-2">
                <span>🛡️ Quick Administrative Control Center</span>
              </h3>
              <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Manage user permissions, ban suspicious accounts, or inspect login timestamps.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setActiveSubTab('users')}
                className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
              >
                <Users className="w-4 h-4" /> Manage Users
              </button>
              <button
                onClick={() => setActiveSubTab('logs')}
                className="px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
              >
                <Clock className="w-4 h-4" /> View Audit Logs
              </button>
            </div>
          </div>

          {/* System Health & Recent Activity Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* System Status */}
            <div className={`p-5 rounded-2xl border space-y-4 ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
              <h3 className="text-sm font-bold flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-emerald-400" />
                System Integration Status
              </h3>

              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/40 border border-slate-800/80">
                  <span className="text-slate-400 font-medium">Master Google Sheet Sync</span>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                    Connected & Active
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/40 border border-slate-800/80">
                  <span className="text-slate-400 font-medium">Authentication Session Token</span>
                  <span className="font-mono text-purple-400 font-bold">24-Hour Expiration JWT</span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/40 border border-slate-800/80">
                  <span className="text-slate-400 font-medium">Password Hashing Security</span>
                  <span className="font-mono text-cyan-400 font-bold">Bcrypt 10 Rounds</span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/40 border border-slate-800/80">
                  <span className="text-slate-400 font-medium">Database Sheets Tabs</span>
                  <span className="font-mono text-indigo-400 font-bold">Users & Login_Logs</span>
                </div>
              </div>
            </div>

            {/* Recent Login Audit Trail Preview */}
            <div className={`p-5 rounded-2xl border space-y-4 ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold flex items-center gap-2">
                  <Clock className="w-4 h-4 text-cyan-400" />
                  Recent User Logins
                </h3>
                <button
                  onClick={() => setActiveSubTab('logs')}
                  className="text-xs text-indigo-400 hover:underline font-semibold"
                >
                  View All ({logs.length}) →
                </button>
              </div>

              <div className="space-y-2">
                {logs.slice(0, 4).length === 0 ? (
                  <p className="text-xs text-slate-400 p-4 text-center">No recent login events recorded.</p>
                ) : (
                  logs.slice(0, 4).map((l, idx) => (
                    <div key={idx} className="p-2.5 rounded-xl bg-slate-950/40 border border-slate-800/60 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-bold text-cyan-400 font-mono">{l.email}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">{l.details}</div>
                      </div>
                      <div className="text-right">
                        <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-slate-800 text-slate-300">
                          {l.role}
                        </span>
                        <div className="text-[10px] text-slate-500 font-mono mt-1">{l.loginTime}</div>
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
                <tr className={`border-b uppercase text-[10px] font-bold ${isDark ? 'bg-slate-950/60 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                  <th className="p-3.5">User Name</th>
                  <th className="p-3.5">Email Address</th>
                  <th className="p-3.5">Role</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-400">
                      No user accounts found.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-indigo-500/5 transition">
                      <td className="p-3.5 font-bold flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-purple-500/10 text-purple-400 flex items-center justify-center font-bold text-xs">
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                        <span>{u.name}</span>
                      </td>
                      <td className="p-3.5 font-mono text-slate-300">{u.email}</td>
                      <td className="p-3.5">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border ${
                          u.role === 'admin'
                            ? 'bg-purple-500/10 text-purple-400 border-purple-500/30'
                            : 'bg-slate-800 text-slate-300 border-slate-700'
                        }`}>
                          {u.role === 'admin' ? '🛡️ Admin' : '👤 User'}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border ${
                          u.status === 'banned'
                            ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                            : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        }`}>
                          {u.status === 'banned' ? '🚫 Banned' : '✅ Active'}
                        </span>
                      </td>
                      <td className="p-3.5 text-right space-x-2">
                        <button
                          onClick={() => { setEditingUser(u); setEditName(u.name); setEditEmail(u.email); }}
                          className="px-2.5 py-1.5 rounded-lg bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600/30 font-semibold transition text-xs inline-flex items-center gap-1"
                        >
                          <Edit className="w-3.5 h-3.5" /> Edit
                        </button>

                        <button
                          onClick={() => handleToggleRole(u)}
                          className="px-2.5 py-1.5 rounded-lg bg-purple-600/20 text-purple-400 hover:bg-purple-600/30 font-semibold transition text-xs inline-flex items-center gap-1"
                        >
                          <ShieldCheck className="w-3.5 h-3.5" /> {u.role === 'admin' ? 'Demote' : 'Promote'}
                        </button>

                        <button
                          onClick={() => handleToggleStatus(u)}
                          className={`px-2.5 py-1.5 rounded-lg font-semibold transition text-xs inline-flex items-center gap-1 ${
                            u.status === 'banned'
                              ? 'bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30'
                              : 'bg-rose-600/20 text-rose-400 hover:bg-rose-600/30'
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
                <tr className={`border-b uppercase text-[10px] font-bold ${isDark ? 'bg-slate-950/60 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                  <th className="p-3.5">Email Address</th>
                  <th className="p-3.5">Role</th>
                  <th className="p-3.5">Login Date & Time</th>
                  <th className="p-3.5">Audit Event Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-slate-400">
                      No login audit logs recorded.
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((l, idx) => (
                    <tr key={l.id || idx} className="hover:bg-cyan-500/5 transition">
                      <td className="p-3.5 font-bold font-mono text-cyan-400">{l.email}</td>
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-800 text-slate-300">
                          {l.role}
                        </span>
                      </td>
                      <td className="p-3.5 font-mono text-slate-300">{l.loginTime}</td>
                      <td className="p-3.5 text-slate-400">{l.details}</td>
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
          <div className={`w-full max-w-md rounded-2xl border p-6 space-y-5 ${isDark ? 'bg-slate-900 border-slate-800 text-slate-100 shadow-2xl' : 'bg-white border-slate-200 text-slate-900'}`}>
            <div className="flex items-center justify-between border-b pb-3 border-slate-800">
              <h3 className="text-base font-bold">Edit User Details</h3>
              <button onClick={() => setEditingUser(null)} className="p-1 rounded hover:bg-slate-800 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditUser} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1 text-slate-300">Full Name</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full border rounded-xl px-3.5 py-2 text-xs bg-slate-950 border-slate-800 text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1 text-slate-300">Email Address</label>
                <input
                  type="email"
                  required
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full border rounded-xl px-3.5 py-2 text-xs bg-slate-950 border-slate-800 text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 rounded-xl border border-slate-700 text-xs font-semibold hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-1.5"
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
