'use client';

import React from 'react';
import { ShieldCheck, DatabaseZap, Sun, Moon } from 'lucide-react';

interface NavbarProps {
  theme: 'dark' | 'light';
  setTheme: (theme: 'dark' | 'light') => void;
}

export default function Navbar({ theme, setTheme }: NavbarProps) {
  const isDark = theme === 'dark';

  return (
    <header className={`w-full border-b backdrop-blur-md sticky top-0 z-30 px-6 py-3.5 flex items-center justify-between transition-colors duration-200 ${
      isDark
        ? 'bg-slate-950/80 border-slate-800 text-slate-100'
        : 'bg-white/80 border-slate-200 text-slate-800 shadow-2xs'
    }`}>
      <div className="flex items-center gap-3">
        <h2 className="text-base font-bold flex items-center gap-2">
          Resume Screening Control Panel
        </h2>
      </div>

      <div className="flex items-center gap-3 text-xs">
        <div className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg border ${
          isDark ? 'bg-slate-900 border-slate-800 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-700'
        }`}>
          <DatabaseZap className="w-4 h-4 text-emerald-500" />
          <span>Central Storage: <strong>Google Sheet Sync</strong></span>
        </div>

        {/* Theme Toggle Button */}
        <button
          onClick={() => setTheme(isDark ? 'light' : 'dark')}
          className={`p-2 rounded-xl border transition flex items-center gap-1.5 text-xs font-medium ${
            isDark
              ? 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800'
              : 'bg-slate-100 border-slate-200 text-slate-700 hover:text-black hover:bg-slate-200'
          }`}
          title="Toggle Light/Dark Theme"
        >
          {isDark ? (
            <>
              <Sun className="w-4 h-4 text-amber-400" />
              <span className="hidden md:inline">Light</span>
            </>
          ) : (
            <>
              <Moon className="w-4 h-4 text-indigo-600" />
              <span className="hidden md:inline">Dark</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
}
