'use client';

import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  PlayCircle,
  Sun,
  Moon,
  Database,
  History,
  FileCheck,
  ShieldAlert,
  LogOut,
  User,
  Users,
  Clock,
  Tv,
  Sparkles,
  Wrench,
  ChevronDown
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

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

export type NavigationTab =
  | 'screening'
  | 'atsCheck'
  | 'githubCheck'
  | 'linkedinCheck'
  | 'aiAssignmentCheck'
  | 'nexView'
  | 'dashboard'
  | 'history'
  | 'dictionary'
  | 'guide'
  | 'admin'
  | 'adminDashboard'
  | 'userManagement'
  | 'adminLogs'
  | 'adminScreeningHistory'
  | 'adminAtsHistory'
  | 'adminGithubHistory'
  | 'adminLinkedinHistory'
  | 'adminNexViewHistory'
  | 'profile';

interface SidebarProps {
  activeTab: NavigationTab;
  setActiveTab: (tab: NavigationTab) => void;
  theme: 'dark' | 'light';
  setTheme: (theme: 'dark' | 'light') => void;
  candidateCount: number;
  historyCount?: number;
  atsHistoryCount?: number;
  githubHistoryCount?: number;
  linkedinHistoryCount?: number;
  nexViewHistoryCount?: number;
}

export default function Sidebar({
  activeTab,
  setActiveTab,
  theme,
  setTheme,
  candidateCount,
  historyCount = 0,
  atsHistoryCount = 0,
  githubHistoryCount = 0,
  linkedinHistoryCount = 0,
  nexViewHistoryCount = 0
}: SidebarProps) {
  const isDark = theme === 'dark';
  const { user, isAdmin, logout } = useAuth();

  const totalHistoryCount = historyCount + atsHistoryCount + githubHistoryCount + (linkedinHistoryCount || 0) + nexViewHistoryCount;

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
      id: 'profile' as const,
      label: 'Profile & Security',
      icon: User,
      badge: 'Account'
    }
  ];

  const userToolMenuItems = [
    {
      id: 'screening' as const,
      label: 'Resume Screening',
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
      id: 'linkedinCheck' as const,
      label: 'LinkedIn Profile Check',
      icon: LinkedinIcon,
      badge: 'New'
    },
    {
      id: 'aiAssignmentCheck' as const,
      label: 'AI Assignment Check',
      icon: Sparkles,
      badge: 'Live'
    },
    {
      id: 'nexView' as const,
      label: 'NexView Tool',
      icon: Tv,
      badge: 'Live'
    },
    {
      id: 'history' as const,
      label: 'Screening History',
      icon: History,
      badge: historyCount > 0 ? historyCount : null
    }
  ];

  const adminToolMenuItems = [
    {
      id: 'adminScreeningHistory' as const,
      label: 'Resume Screening',
      icon: PlayCircle,
      badge: historyCount > 0 ? historyCount : null
    },
    {
      id: 'adminAtsHistory' as const,
      label: 'ATS Resume Check',
      icon: FileCheck,
      badge: atsHistoryCount > 0 ? atsHistoryCount : null
    },
    {
      id: 'adminGithubHistory' as const,
      label: 'GitHub Profile Check',
      icon: GithubIcon,
      badge: githubHistoryCount > 0 ? githubHistoryCount : null
    },
    {
      id: 'adminLinkedinHistory' as const,
      label: 'LinkedIn Profile Check',
      icon: LinkedinIcon,
      badge: linkedinHistoryCount > 0 ? linkedinHistoryCount : null
    },
    {
      id: 'adminNexViewHistory' as const,
      label: 'NexView Tool',
      icon: Tv,
      badge: nexViewHistoryCount > 0 ? nexViewHistoryCount : null
    },
    {
      id: 'history' as const,
      label: 'Screening History',
      icon: History,
      badge: totalHistoryCount > 0 ? totalHistoryCount : null
    }
  ];

  const toolMenuItems = isAdmin ? adminToolMenuItems : userToolMenuItems;

  const isToolActive = [
    'screening',
    'atsCheck',
    'githubCheck',
    'linkedinCheck',
    'aiAssignmentCheck',
    'nexView',
    'history',
    'adminScreeningHistory',
    'adminAtsHistory',
    'adminGithubHistory',
    'adminLinkedinHistory',
    'adminNexViewHistory'
  ].includes(activeTab);

  // Tools collapsed by default ("eta collups thakbe"), auto-open if a tool is active
  const [isToolsOpen, setIsToolsOpen] = useState(isToolActive);

  useEffect(() => {
    if (isToolActive) {
      setIsToolsOpen(true);
    }
  }, [isToolActive, activeTab]);

  return (
    <aside
      className={`w-64 flex-shrink-0 border-r flex flex-col justify-between transition-colors duration-200 sticky top-0 h-screen z-40 overflow-y-auto ${
        isDark
          ? 'bg-slate-950 border-slate-800 text-slate-200'
          : 'bg-white border-slate-200 text-slate-800 shadow-sm'
      }`}
    >
      <div>
        {/* Sidebar Brand Header (Clickable link to Dashboard) */}
        <button
          type="button"
          onClick={() => setActiveTab(isAdmin ? 'adminDashboard' : 'dashboard')}
          title={isAdmin ? "Go to Admin Dashboard" : "Go to User Dashboard"}
          className={`w-full h-16 px-5 flex items-center gap-3 text-left transition-all duration-200 cursor-pointer group ${
            activeTab === (isAdmin ? 'adminDashboard' : 'dashboard')
              ? isDark
                ? 'bg-indigo-950/30'
                : 'bg-indigo-50/70'
              : isDark
              ? 'hover:bg-slate-900/60'
              : 'hover:bg-slate-50'
          }`}
        >
          <div className="w-9 h-9 rounded-xl bg-indigo-600/10 dark:bg-indigo-500/15 border border-indigo-500/20 flex items-center justify-center p-1.5 shrink-0 shadow-xs group-hover:scale-105 group-hover:border-indigo-500/40 transition-transform">
            <img
              src="/assats/placement-logo.png"
              alt="Placement Kit"
              className="w-full h-full object-contain"
            />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className={`font-extrabold text-base leading-none tracking-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Placement Kit
            </h1>
            <span className={`text-[10px] font-mono font-semibold mt-1 inline-block ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`}>
              0% AI Tokens
            </span>
          </div>
        </button>

        {/* Admin Control Panel Menu (Only for Admin) */}
        {isAdmin && (
          <div className="p-3 space-y-1">
            <p className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Admin Control Panel
            </p>

            {adminMenuItems.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                    isActive
                      ? isDark
                        ? 'bg-indigo-600 text-white shadow-sm font-bold'
                        : 'bg-indigo-600 text-white shadow-sm font-bold'
                      : isDark
                      ? 'text-slate-300 hover:text-white hover:bg-slate-900'
                      : 'text-slate-700 hover:text-slate-950 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : isDark ? 'text-slate-400' : 'text-slate-500'}`} />
                    <span>{item.label}</span>
                  </div>

                  {item.badge !== null && (
                    <span className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded-full ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : isDark
                        ? 'bg-slate-800 text-slate-200 border border-slate-700'
                        : 'bg-slate-100 text-slate-800 border border-slate-200'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Main Navigation Menu */}
        <div className="p-3 space-y-1">
          {/* 1. Personal Dashboard (Only for regular users; for Admin, Admin Dashboard is their personal dashboard) */}
          {!isAdmin && (
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                activeTab === 'dashboard'
                  ? 'bg-indigo-600 text-white shadow-sm font-bold'
                  : isDark
                  ? 'text-slate-300 hover:text-white hover:bg-slate-900'
                  : 'text-slate-700 hover:text-slate-950 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <LayoutDashboard className={`w-4 h-4 ${activeTab === 'dashboard' ? 'text-white' : isDark ? 'text-slate-400' : 'text-slate-500'}`} />
                <span>Personal Dashboard</span>
              </div>

              <span className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded-full ${
                activeTab === 'dashboard'
                  ? 'bg-white/20 text-white'
                  : isDark
                  ? 'bg-slate-800 text-slate-200 border border-slate-700'
                  : 'bg-slate-100 text-slate-800 border border-slate-200'
              }`}>
                My Stats
              </span>
            </button>
          )}

          {/* Profile & Security (Available for both user and admin) */}
          {!isAdmin && (
            <button
              onClick={() => setActiveTab('profile')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                activeTab === 'profile'
                  ? 'bg-indigo-600 text-white shadow-sm font-bold'
                  : isDark
                  ? 'text-slate-300 hover:text-white hover:bg-slate-900'
                  : 'text-slate-700 hover:text-slate-950 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <User className={`w-4 h-4 ${activeTab === 'profile' ? 'text-white' : isDark ? 'text-slate-400' : 'text-slate-500'}`} />
                <span>Profile & Security</span>
              </div>

              <span className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded-full ${
                activeTab === 'profile'
                  ? 'bg-white/20 text-white'
                  : isDark
                  ? 'bg-slate-800 text-slate-200 border border-slate-700'
                  : 'bg-slate-100 text-slate-800 border border-slate-200'
              }`}>
                Account
              </span>
            </button>
          )}

          {/* 2. Collapsible Tools Parent Route */}
          <div className="pt-0.5 space-y-1">
            <button
              type="button"
              onClick={() => setIsToolsOpen(prev => !prev)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer select-none ${
                isToolActive && !isToolsOpen
                  ? isDark
                    ? 'bg-indigo-950/40 text-indigo-300 border border-indigo-500/30'
                    : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                  : isDark
                  ? 'text-slate-300 hover:text-white hover:bg-slate-900'
                  : 'text-slate-700 hover:text-slate-950 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Wrench className={`w-4 h-4 ${isToolActive ? 'text-indigo-500 dark:text-indigo-400' : isDark ? 'text-slate-400' : 'text-slate-500'}`} />
                <span className="font-bold">{isAdmin ? 'Tool History & Stats' : 'Tools'}</span>
              </div>

              <div className="flex items-center gap-1.5">
                {isToolActive && !isToolsOpen && (
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                )}
                <ChevronDown
                  className={`w-4 h-4 transition-transform duration-200 ${
                    isToolsOpen ? 'rotate-180 text-indigo-500' : isDark ? 'text-slate-500' : 'text-slate-400'
                  }`}
                />
              </div>
            </button>

            {/* Collapsible Child Routes */}
            {isToolsOpen && (
              <div className="pl-2 space-y-1 pt-1 ml-3.5 border-l-2 border-indigo-500/20 dark:border-indigo-500/30 transition-all duration-200 animate-fadeIn">
                {toolMenuItems.map(item => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id ||
                    (item.id === 'adminScreeningHistory' && activeTab === 'screening') ||
                    (item.id === 'adminAtsHistory' && activeTab === 'atsCheck') ||
                    (item.id === 'adminGithubHistory' && activeTab === 'githubCheck') ||
                    (item.id === 'adminLinkedinHistory' && activeTab === 'linkedinCheck') ||
                    (item.id === 'adminNexViewHistory' && activeTab === 'nexView');

                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium transition cursor-pointer ${
                        isActive
                          ? isDark
                            ? 'bg-indigo-600 text-white shadow-xs font-bold'
                            : 'bg-indigo-600 text-white shadow-xs font-bold'
                          : isDark
                          ? 'text-slate-300 hover:text-white hover:bg-slate-900/80'
                          : 'text-slate-600 hover:text-slate-950 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-white' : isDark ? 'text-slate-400' : 'text-slate-500'}`} />
                        <span className="truncate">{item.label}</span>
                      </div>

                      {item.badge !== null && (
                        <span className={`px-1.5 py-0.5 text-[9px] font-mono font-bold rounded-full shrink-0 ${
                          isActive
                            ? 'bg-white/20 text-white'
                            : isDark
                            ? 'bg-slate-800 text-slate-300 border border-slate-700'
                            : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}>
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sidebar Footer & User Auth Box */}
      <div className={`p-4 border-t space-y-3 ${isDark ? 'border-slate-800/80 bg-slate-950/40' : 'border-slate-200 bg-slate-50/50'}`}>
        {user && (
          <div
            onClick={() => setActiveTab('profile')}
            className={`p-3 rounded-xl border text-xs flex items-center justify-between transition cursor-pointer select-none ${
              activeTab === 'profile'
                ? isDark
                  ? 'bg-indigo-600/20 border-indigo-500/50 text-white ring-1 ring-indigo-500/30'
                  : 'bg-indigo-50 border-indigo-300 text-indigo-900 ring-1 ring-indigo-200'
                : isDark
                ? 'bg-slate-900/60 border-slate-800 text-slate-300 hover:bg-slate-800 hover:border-slate-700'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100 shadow-2xs'
            }`}
            title="Click to view Profile & Security"
          >
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
                {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="overflow-hidden">
                <div className="font-bold truncate text-[11px] flex items-center gap-1.5">
                  <span>{user.name}</span>
                  <span className="text-[9px] text-slate-400 font-normal">› Profile</span>
                </div>
                <div className="text-[9px] uppercase font-mono text-indigo-400 font-semibold">{user.role}</div>
              </div>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                logout();
              }}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
              title="Log out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}

        <button
          onClick={() => setTheme(isDark ? 'light' : 'dark')}
          className={`w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-semibold border transition cursor-pointer ${
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