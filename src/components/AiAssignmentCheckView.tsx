'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ExternalLink, RotateCw, Sparkles, Maximize2, Minimize2, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface AiAssignmentCheckViewProps {
  theme?: 'dark' | 'light';
}

const TARGET_URL = 'https://ai-code-reviewer-frontend-six.vercel.app/';

export default function AiAssignmentCheckView({ theme = 'light' }: AiAssignmentCheckViewProps) {
  const isDark = theme === 'dark';
  const { user, token } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Record launch history in localStorage & send activity audit log
    try {
      const now = new Date();
      const record = {
        id: `ai_assign_${Date.now()}`,
        operationName: 'AI Assignment Check Portal Launch',
        timestamp: now.toISOString(),
        dateFormatted: now.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }),
        targetUrl: TARGET_URL,
        userEmail: user?.email || 'user@system.com',
        status: 'Active'
      };

      const existing = localStorage.getItem('ai_assignment_history');
      const list = existing ? JSON.parse(existing) : [];
      const alreadyLoggedRecent = list.some((item: any) => (
        item.userEmail === record.userEmail &&
        (Date.now() - new Date(item.timestamp).getTime()) < 60000
      ));

      if (!alreadyLoggedRecent) {
        const updated = [record, ...list];
        localStorage.setItem('ai_assignment_history', JSON.stringify(updated));

        const backendUrl = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
          ? 'http://localhost:5000'
          : process.env.NEXT_PUBLIC_BACKEND_URL || 'https://resume-screening-backend.vercel.app';

        fetch(`${backendUrl}/api/activity/log`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          },
          body: JSON.stringify({
            action: 'AI_ASSIGNMENT_CHECK_VISIT',
            details: `AI Assignment Check Visit: User visited embedded Code Reviewer (${TARGET_URL})`
          })
        }).catch(err => console.warn('Activity log error:', err));
      }
    } catch (e) {
      console.warn('Failed to record AI assignment history:', e);
    }
  }, [user, token]);

  const handleRefresh = () => {
    setIsLoading(true);
    setReloadKey(prev => prev + 1);
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(err => {
        console.warn('Fullscreen request failed:', err);
      });
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(err => {
        console.warn('Exit fullscreen failed:', err);
      });
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  return (
    <div
      ref={containerRef}
      className={`w-full h-full flex flex-col overflow-hidden transition-colors duration-200 ${
        isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
      }`}
    >
      {/* Top Embedded Header Controls */}
      <div
        className={`px-4 py-2.5 border-b flex items-center justify-between flex-shrink-0 transition-colors ${
          isDark
            ? 'bg-slate-900/90 border-slate-800 text-slate-200'
            : 'bg-white border-slate-200 text-slate-800 shadow-xs'
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-indigo-500 p-0.5 shadow-sm flex items-center justify-center text-white">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold tracking-tight">AI Assignment Check</h2>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold font-mono rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Tool
              </span>
            </div>
            <p className={`text-[11px] truncate max-w-md ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Automated Code Reviewer & Assignment Evaluation Engine
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            title="Reload Tool"
            className={`p-1.5 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition ${
              isDark
                ? 'bg-slate-800/80 hover:bg-slate-800 border-slate-700 text-slate-300'
                : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700'
            }`}
          >
            <RotateCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Reload</span>
          </button>

          <button
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
            className={`p-1.5 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition ${
              isDark
                ? 'bg-slate-800/80 hover:bg-slate-800 border-slate-700 text-slate-300'
                : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700'
            }`}
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{isFullscreen ? 'Exit' : 'Full Screen'}</span>
          </button>

          <a
            href={TARGET_URL}
            target="_blank"
            rel="noopener noreferrer"
            title="Open in New Tab"
            className="p-1.5 px-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium flex items-center gap-1.5 shadow-xs transition"
          >
            <span>Open in Tab</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Main Iframe Wrapper */}
      <div className="flex-1 w-full h-full relative overflow-hidden bg-slate-900">
        {isLoading && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-slate-950/80 backdrop-blur-xs text-white">
            <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-medium tracking-wide text-slate-300">
              Connecting to AI Assignment Check...
            </span>
          </div>
        )}

        <iframe
          key={reloadKey}
          src={TARGET_URL}
          title="AI Assignment Check - Code Reviewer"
          onLoad={() => setIsLoading(false)}
          className="w-full h-full border-0 overflow-hidden"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; clipboard-read; clipboard-write"
          allowFullScreen
        />
      </div>
    </div>
  );
}
