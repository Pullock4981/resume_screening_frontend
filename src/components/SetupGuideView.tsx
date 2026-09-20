'use client';

import React from 'react';
import { HelpCircle, Key, Table, CheckCircle } from 'lucide-react';

interface SetupGuideViewProps {
  theme: 'dark' | 'light';
}

export default function SetupGuideView({ theme }: SetupGuideViewProps) {
  const isDark = theme === 'dark';

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-indigo-500" />
          Google Sheet & Service Account Setup Guide
        </h2>
        <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
          Follow these 3 quick steps to connect your central Google Sheet with the NexScanner engine.
        </p>
      </div>

      <div className="space-y-4">
        {/* Step 1 */}
        <div className={`p-5 rounded-2xl border ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
          <div className="flex items-center gap-3 mb-2">
            <span className="h-7 w-7 rounded-lg bg-indigo-600 text-white font-bold text-xs flex items-center justify-center">1</span>
            <h3 className="text-sm font-bold">Google Sheet Column Structure</h3>
          </div>
          <p className="text-xs text-slate-400 mb-3">Your Google Sheet only needs 2 mandatory columns in row 1:</p>
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono font-bold">Resume Link (Mandatory)</span>
            <span className="px-3 py-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-mono font-bold">Email (Mandatory)</span>
            <span className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-400 border border-slate-700 font-mono">Name (Optional)</span>
            <span className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-400 border border-slate-700 font-mono">Phone (Optional)</span>
          </div>
        </div>

        {/* Step 2 */}
        <div className={`p-5 rounded-2xl border ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
          <div className="flex items-center gap-3 mb-2">
            <span className="h-7 w-7 rounded-lg bg-indigo-600 text-white font-bold text-xs flex items-center justify-center">2</span>
            <h3 className="text-sm font-bold">Share Google Sheet with Service Account</h3>
          </div>
          <p className="text-xs text-slate-400 mb-2">
            Open your Google Sheet, click top-right <strong className="text-slate-200">Share</strong> button, and add your Service Account email with <strong className="text-emerald-400">Editor</strong> access:
          </p>
          <div className={`p-3 rounded-xl border font-mono text-xs flex items-center justify-between ${
            isDark ? 'bg-slate-950 border-slate-800 text-cyan-400' : 'bg-slate-50 border-slate-300 text-indigo-600'
          }`}>
            <span>GOOGLE_SERVICE_ACCOUNT_EMAIL (Check backend/.env)</span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-sans font-medium">Editor Permission</span>
          </div>
        </div>

        {/* Step 3 */}
        <div className={`p-5 rounded-2xl border ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
          <div className="flex items-center gap-3 mb-2">
            <span className="h-7 w-7 rounded-lg bg-indigo-600 text-white font-bold text-xs flex items-center justify-center">3</span>
            <h3 className="text-sm font-bold">Automatic Output Columns</h3>
          </div>
          <p className="text-xs text-slate-400">
            When screening runs, the engine automatically appends 6 dynamic result columns to your sheet: <strong className="text-slate-200">Match Score (%), ATS Score (%), Final Score (%), Category, Critical Flag, Feedback Summary</strong>.
          </p>
        </div>
      </div>
    </div>
  );
}
