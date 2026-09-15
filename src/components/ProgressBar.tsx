'use client';

import React from 'react';
import { Loader2, CheckCircle2 } from 'lucide-react';

interface ProgressBarProps {
  completed: number;
  total: number;
  currentCandidate?: string;
  isFinished: boolean;
  theme?: 'dark' | 'light';
}

export default function ProgressBar({ completed, total, currentCandidate, isFinished, theme = 'dark' }: ProgressBarProps) {
  const isDark = theme === 'dark';
  
  const displayTotal = total > 0 ? total : completed;
  const displayCompleted = isFinished ? displayTotal : completed;
  const percentage = isFinished ? 100 : (displayTotal > 0 ? Math.min(100, Math.round((displayCompleted / displayTotal) * 100)) : 0);

  return (
    <div className={`w-full border backdrop-blur-md rounded-2xl p-5 shadow-xl space-y-3 transition-colors duration-200 ${
      isDark
        ? 'bg-slate-900/80 border-slate-800 text-slate-100'
        : 'bg-white border-slate-200 text-slate-900 shadow-sm'
    }`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {isFinished ? (
            <div className="h-8 w-8 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          ) : (
            <div className="h-8 w-8 rounded-full bg-indigo-500/20 text-indigo-500 flex items-center justify-center">
              <Loader2 className="w-5 h-5 animate-spin" />
            </div>
          )}
          <div>
            <h3 className="text-sm font-semibold flex items-center gap-2">
              {isFinished ? 'Screening Complete!' : 'Batch Screening in Progress...'}
              <span className={`text-xs px-2 py-0.5 rounded-full font-mono ${
                isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-700'
              }`}>
                {displayCompleted} / {displayTotal} Completed
              </span>
            </h3>
            {currentCandidate && !isFinished && (
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Processing: <strong className="text-indigo-500 font-medium">{currentCandidate}</strong>
              </p>
            )}
          </div>
        </div>

        <span className="text-lg font-bold font-mono text-indigo-500">
          {percentage}%
        </span>
      </div>

      {/* Progress Bar Track */}
      <div className={`w-full h-3 rounded-full overflow-hidden p-0.5 border ${
        isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200'
      }`}>
        <div
          className="h-full bg-gradient-to-r from-indigo-500 via-blue-500 to-cyan-400 rounded-full transition-all duration-300 ease-out shadow-lg shadow-cyan-500/20"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
