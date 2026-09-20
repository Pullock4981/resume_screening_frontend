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
  ChevronRight,
  ShieldCheck,
  History,
  FileCheck
} from 'lucide-react';

interface SidebarProps {
  activeTab: 'screening' | 'atsCheck' | 'dashboard' | 'history' | 'dictionary' | 'guide';
  setActiveTab: (tab: 'screening' | 'atsCheck' | 'dashboard' | 'history' | 'dictionary' | 'guide') => void;
  theme: 'dark' | 'light';
  setTheme: (theme: 'dark' | 'light') => void;
  candidateCount: number;
  historyCount?: number;
}

export default function Sidebar({
  activeTab,
  setActiveTab,
  theme,
  setTheme,
  candidateCount,
  historyCount = 0
}: SidebarProps) {
  const isDark = theme === 'dark';

  const menuItems = [
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
      id: 'dashboard' as const,
      label: 'Dashboard & Results',
      icon: LayoutDashboard,
      badge: candidateCount > 0 ? candidateCount : null
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
              <h1 className="font-extrabold text-base leading-none tracking-tight">AutoScreener</h1>
              <span className="text-[10px] text-emerald-500 font-mono font-medium">0% AI Tokens</span>
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <div className="p-3 space-y-1">
          <p className={`px-3 py-2 text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
            Main Menu
          </p>

          {menuItems.map(item => {
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
      </div>

      {/* Sidebar Footer & Theme Toggle */}
      <div className={`p-4 border-t space-y-3 ${isDark ? 'border-slate-800/80 bg-slate-950/40' : 'border-slate-200 bg-slate-50/50'}`}>
        {/* System Info Box */}
        <div className={`p-3 rounded-xl border text-[11px] space-y-1 ${
          isDark ? 'bg-slate-900/60 border-slate-800 text-slate-400' : 'bg-white border-slate-200 text-slate-600 shadow-2xs'
        }`}>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-500">
            <Database className="w-3.5 h-3.5" />
            <span>Google Sheet Sync</span>
          </div>
          <p className="text-[10px] leading-tight">All candidate scores write back directly into your central Google Sheet.</p>
        </div>

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
