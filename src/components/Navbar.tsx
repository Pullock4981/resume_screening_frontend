import React, { useEffect } from 'react';
import { ShieldCheck, DatabaseZap, Sun, Moon, LogOut, User, ExternalLink } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { NavigationTab } from './Sidebar';
import { ROUTE_CONFIG } from '../utils/routes';

interface NavbarProps {
  theme: 'dark' | 'light';
  setTheme: (theme: 'dark' | 'light') => void;
  activeTab?: NavigationTab;
  onNavigateTab?: (tab: NavigationTab) => void;
}

export default function Navbar({ theme, setTheme, activeTab = 'screening', onNavigateTab }: NavbarProps) {
  const isDark = theme === 'dark';
  const { user, isAdmin, logout } = useAuth();

  const routeMeta = ROUTE_CONFIG[activeTab] || ROUTE_CONFIG.screening;

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.title = `${routeMeta.title} | Placement Kit`;
    }
  }, [routeMeta.title]);

  return (
    <header className={`w-full h-16 border-b backdrop-blur-md sticky top-0 z-30 px-6 flex items-center justify-between transition-colors duration-200 ${
      isDark
        ? 'bg-slate-950/80 border-slate-800 text-slate-100'
        : 'bg-white/80 border-slate-200 text-slate-800 shadow-2xs'
    }`}>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => onNavigateTab && onNavigateTab('dashboard')}
          title="Go to User Dashboard"
          className="md:hidden w-8 h-8 rounded-lg bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center p-1 shrink-0 cursor-pointer hover:scale-105 transition-transform"
        >
          <img src="/assats/placement-logo.png" alt="Placement Kit" className="w-full h-full object-contain" />
        </button>
        <div>
          <div className="flex items-center gap-2">
            <h2 className={`text-base font-extrabold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {routeMeta.title}
            </h2>
            {routeMeta.badge && (
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                isDark ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400' : 'bg-indigo-50 border-indigo-200 text-indigo-700'
              }`}>
                {routeMeta.badge}
              </span>
            )}
          </div>
          <div className="text-[11px] text-slate-400 dark:text-slate-500 flex items-center gap-1.5 font-mono">
            <span>{isAdmin ? 'Admin' : 'Workspace'}</span>
            <span>›</span>
            <span className="text-indigo-600 dark:text-indigo-400 font-semibold">{routeMeta.path}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 text-xs">
        <a
          href="https://docs.google.com/spreadsheets/d/1O84kcu_A4V4Chsb6TPQEwGNxhuqu1Qml431I7yEQu3I/edit?gid=0#gid=0"
          target="_blank"
          rel="noopener noreferrer"
          title="Click to open Central Master Google Sheet"
          className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg border transition cursor-pointer group ${
            isDark
              ? 'bg-slate-900 border-slate-800 text-slate-200 hover:border-emerald-500/50 hover:bg-slate-800'
              : 'bg-slate-100 border-slate-200 text-slate-800 hover:border-emerald-400 hover:bg-emerald-50/50'
          }`}
        >
          <DatabaseZap className="w-4 h-4 text-emerald-500 group-hover:scale-110 transition" />
          <span>Central Storage: <strong>Google Sheet Sync</strong></span>
          <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-emerald-400 transition" />
        </a>

        {user && (
          <div
            onClick={() => onNavigateTab && onNavigateTab('profile')}
            className={`flex items-center gap-2.5 px-3 py-1.5 rounded-xl border transition cursor-pointer select-none ${
              activeTab === 'profile'
                ? isDark
                  ? 'bg-indigo-600/20 border-indigo-500/50 text-white ring-1 ring-indigo-500/30'
                  : 'bg-indigo-50 border-indigo-300 text-indigo-900 ring-1 ring-indigo-200'
                : isDark
                ? 'bg-slate-900 border-slate-800 text-white hover:border-indigo-500/50 hover:bg-slate-800/80'
                : 'bg-slate-100 border-slate-200 text-slate-900 hover:border-indigo-400 hover:bg-slate-200/60'
            }`}
            title="Click to view your Profile & Account Security"
          >
            <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-[11px] shadow-sm">
              {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="hidden sm:block text-left">
              <span className="font-bold text-xs block leading-tight">{user.name}</span>
              <span className={`text-[9px] uppercase font-mono font-semibold ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`}>{user.role}</span>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                logout();
              }}
              className={`p-1 rounded transition ml-1 ${isDark ? 'text-slate-400 hover:text-rose-400 hover:bg-rose-500/10' : 'text-slate-500 hover:text-rose-600 hover:bg-rose-50'}`}
              title="Logout"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

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
