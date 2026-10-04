'use client';

import React from 'react';
import {
  FileSearch,
  LayoutDashboard,
  PlayCircle,
  BookOpen,
  HelpCircle,
  Sun,
  Moon,
  Database,
  History,
  FileCheck,
  ShieldAlert,
  LogOut,
  User,
  Users,
  Clock
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const GithubIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
  </svg>
);


interface SidebarProps {
  activeTab: 'screening' | 'atsCheck' | 'githubCheck' | 'dashboard' | 'history' | 'dictionary' | 'guide' | 'admin' | 'adminDashboard' | 'userManagement' | 'adminLogs' | 'adminScreeningHistory' | 'adminAtsHistory' | 'adminGithubHistory';
  setActiveTab: (tab: 'screening' | 'atsCheck' | 'githubCheck' | 'dashboard' | 'history' | 'dictionary' | 'guide' | 'admin' | 'adminDashboard' | 'userManagement' | 'adminLogs' | 'adminScreeningHistory' | 'adminAtsHistory' | 'adminGithubHistory') => void;
  theme: 'dark' | 'light';
  setTheme: (theme: 'dark' | 'light') => void;
  candidateCount: number;
  historyCount?: number;
  atsHistoryCount?: number;
  githubHistoryCount?: number;
}

export default function Sidebar({
  activeTab,
  setActiveTab,
  theme,
  setTheme,
  candidateCount,
  historyCount = 0,
  atsHistoryCount = 0,
  githubHistoryCount = 0
}: SidebarProps) {
  const isDark = theme === 'dark';
  const { user, isAdmin, logout } = useAuth();

  const adminMenuItems = [
    {
      id: 'adminDashboard' as const,
      label: 'Admin Dashboard',
      icon: ShieldAlert,
      badge: 'Admin'
    },
    {
      id: 'userManagement' as const,
      label: 'User Management',
      icon: Users,
      badge: null
    },
    {
      id: 'adminLogs' as const,
      label: 'User Activity Audit Logs',
      icon: Clock,
      badge: null
    },
    {
      id: 'adminScreeningHistory' as const,
      label: 'Resume Screening History',
      icon: History,
      badge: historyCount > 0 ? historyCount : null
    },
    {
      id: 'adminAtsHistory' as const,
      label: 'ATS Checking History',
      icon: FileCheck,
      badge: atsHistoryCount > 0 ? atsHistoryCount : null
    },
    {
      id: 'adminGithubHistory' as const,
      label: 'GitHub Checking History',
      icon: GithubIcon,
      badge: githubHistoryCount > 0 ? githubHistoryCount : null
    }
  ];


  const userMenuItems = [
    {
      id: 'screening' as const,
      label: 'New Screening',
      icon: PlayCircle,
      badge: null
    },
    {
      id: 'atsCheck' as const,
      label: 'ATS Resume Check',
      icon: FileCheck,
      badge: null
    },
    {
      id: 'githubCheck' as const,
      label: 'GitHub Profile Check',
      icon: GithubIcon,
      badge: null
    },
    {
      id: 'history' as const,
      label: 'Screening History',
      icon: History,
      badge: historyCount > 0 ? historyCount : null
    },
    {
      id: 'dictionary' as const,
      label: 'Skill Rules & ATS',
      icon: BookOpen,
      badge: null
    },
    {
      id: 'guide' as const,
      label: 'Google Sheet Setup',
      icon: HelpCircle,
      badge: null
    }
  ];


  return (
    <aside
      className={`w-64 flex-shrink-0 border-r flex flex-col justify-between transition-colors duration-200 sticky top-0 h-screen z-40 overflow-y-auto ${
        isDark
          ? 'bg-slate-950 border-slate-800 text-slate-200'
          : 'bg-white border-slate-200 text-slate-800 shadow-sm'
      }`}
    >
      <div>
        {/* Sidebar Brand Header */}
        <div className={`p-5 border-b flex items-center justify-between ${isDark ? 'border-slate-800/80' : 'border-slate-200'}`}>
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-400 p-0.5 shadow-md">
              <div className={`h-full w-full rounded-[10px] flex items-center justify-center ${isDark ? 'bg-slate-950' : 'bg-white'}`}>
                <FileSearch className="w-5 h-5 text-indigo-500" />
              </div>
            </div>
            <div>
              <h1 className="font-extrabold text-base leading-none tracking-tight">Placement Kit</h1>
              <span className="text-[10px] text-emerald-500 font-mono font-medium">0% AI Tokens</span>
            </div>
          </div>
        </div>

        {/* Main Navigation Menu (Only for Non-Admin Users) */}
        {!isAdmin && (
          <div className="p-3 space-y-1">
            <p className={`px-3 py-2 text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
              Main Menu
            </p>

            {userMenuItems.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition ${
                    isActive
                      ? isDark
                        ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 shadow-sm'
                        : 'bg-indigo-50 text-indigo-600 border border-indigo-200 shadow-sm'
                      : isDark
                      ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-500' : isDark ? 'text-slate-400' : 'text-slate-500'}`} />
                    <span>{item.label}</span>
                  </div>

                  {item.badge !== null && (
                    <span className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded-full ${
                      isActive
                        ? 'bg-indigo-500 text-white'
                        : isDark
                        ? 'bg-slate-800 text-slate-300'
                        : 'bg-slate-200 text-slate-700'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Admin Control Panel Menu (Only for Admin) */}
        {isAdmin && (
          <div className="p-3 pt-1 space-y-1 border-t border-slate-800/60 mt-1">
            <p className={`px-3 py-2 text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
              Admin Control Panel
            </p>

            {adminMenuItems.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition ${
                    isActive
                      ? isDark
                        ? 'bg-purple-600/20 text-purple-400 border border-purple-500/30 shadow-sm'
                        : 'bg-purple-50 text-purple-600 border border-purple-200 shadow-sm'
                      : isDark
                      ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-purple-500' : isDark ? 'text-slate-400' : 'text-slate-500'}`} />
                    <span>{item.label}</span>
                  </div>

                  {item.badge !== null && (
                    <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/30">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Sidebar Footer & User Auth Box */}
      <div className={`p-4 border-t space-y-3 ${isDark ? 'border-slate-800/80 bg-slate-950/40' : 'border-slate-200 bg-slate-50/50'}`}>
        {/* User Account Box */}
        {user && (
          <div className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
            isDark ? 'bg-slate-900/60 border-slate-800 text-slate-300' : 'bg-white border-slate-200 text-slate-700 shadow-2xs'
          }`}>
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="w-7 h-7 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white flex items-center justify-center font-bold text-xs shrink-0">
                {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="overflow-hidden">
                <div className="font-bold truncate text-[11px]">{user.name}</div>
                <div className="text-[9px] uppercase font-mono text-indigo-400 font-semibold">{user.role}</div>
              </div>
            </div>

            <button
              onClick={logout}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition"
              title="Log out (24h session)"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Light / Dark Mode Toggle */}
        <button
          onClick={() => setTheme(isDark ? 'light' : 'dark')}
          className={`w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-semibold border transition ${
            isDark
              ? 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
              : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100 shadow-2xs'
          }`}
        >
          <div className="flex items-center gap-2">
            {isDark ? (
              <Moon className="w-4 h-4 text-indigo-400" />
            ) : (
              <Sun className="w-4 h-4 text-amber-500" />
            )}
            <span>Theme: <strong>{isDark ? 'Dark Mode' : 'Light Mode'}</strong></span>
          </div>
          <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-500/10">Switch</span>
        </button>
      </div>
    </aside>
  );
}

