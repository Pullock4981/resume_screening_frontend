'use client';

import React from 'react';
import { Users, CheckCircle2, Clock, XCircle, AlertOctagon } from 'lucide-react';
import { CandidateResult } from '../types';

interface SummaryCardsProps {
  candidates: CandidateResult[];
  theme?: 'dark' | 'light';
  activeCategory?: string;
  onSelectCategory?: (category: string) => void;
}

export default function SummaryCards({
  candidates,
  theme = 'dark',
  activeCategory = 'All',
  onSelectCategory
}: SummaryCardsProps) {
  const isDark = theme === 'dark';

  const total = candidates.length;

  const shortlisted = candidates.filter(
    c => c.finalScore >= 90 || c.category.includes('Good to Go') || c.category === 'Shortlist'
  ).length;

  const waitingList = candidates.filter(
    c => (c.finalScore >= 70 && c.finalScore < 90) || c.category.includes('Waiting List')
  ).length;

  const rejected = candidates.filter(
    c => c.finalScore < 70 || c.category.includes('Reject') || c.category.includes('Match') || c.category.includes('Fit')
  ).length;

  const criticalFlagged = candidates.filter(c => c.criticalFlag).length;

  const cardBase = `p-4 rounded-xl border flex items-center gap-3 transition cursor-pointer select-none text-left`;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
      {/* Total */}
      <button
        type="button"
        onClick={() => onSelectCategory && onSelectCategory('All')}
        className={`${cardBase} ${
          activeCategory === 'All'
            ? 'ring-2 ring-blue-500 bg-blue-500/10 border-blue-500/50'
            : isDark
            ? 'bg-slate-900/60 border-slate-800 hover:bg-slate-800/80 text-slate-100'
            : 'bg-white border-slate-200 hover:bg-slate-100 text-slate-900 shadow-xs'
        }`}
      >
        <div className="p-2.5 rounded-lg bg-blue-500/10 text-blue-500 border border-blue-500/20">
          <Users className="w-5 h-5" />
        </div>
        <div>
          <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Total Evaluated</p>
          <p className="text-xl font-bold font-mono">{total}</p>
        </div>
      </button>

      {/* Shortlisted */}
      <button
        type="button"
        onClick={() => onSelectCategory && onSelectCategory('Shortlist')}
        className={`${cardBase} ${
          activeCategory === 'Shortlist'
            ? 'ring-2 ring-emerald-500 bg-emerald-500/10 border-emerald-500/50'
            : isDark
            ? 'bg-slate-900/60 border-slate-800 hover:bg-slate-800/80 text-slate-100'
            : 'bg-white border-slate-200 hover:bg-slate-100 text-slate-900 shadow-xs'
        }`}
      >
        <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
          <CheckCircle2 className="w-5 h-5" />
        </div>
        <div>
          <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Shortlisted (≥90%)</p>
          <p className="text-xl font-bold font-mono text-emerald-500">{shortlisted}</p>
        </div>
      </button>

      {/* Waiting List */}
      <button
        type="button"
        onClick={() => onSelectCategory && onSelectCategory('Waiting List')}
        className={`${cardBase} ${
          activeCategory === 'Waiting List'
            ? 'ring-2 ring-amber-500 bg-amber-500/10 border-amber-500/50'
            : isDark
            ? 'bg-slate-900/60 border-slate-800 hover:bg-slate-800/80 text-slate-100'
            : 'bg-white border-slate-200 hover:bg-slate-100 text-slate-900 shadow-xs'
        }`}
      >
        <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-500 border border-amber-500/20">
          <Clock className="w-5 h-5" />
        </div>
        <div>
          <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Waiting List (70-89%)</p>
          <p className="text-xl font-bold font-mono text-amber-500">{waitingList}</p>
        </div>
      </button>

      {/* Rejected */}
      <button
        type="button"
        onClick={() => onSelectCategory && onSelectCategory('Reject')}
        className={`${cardBase} ${
          activeCategory === 'Reject'
            ? 'ring-2 ring-rose-500 bg-rose-500/10 border-rose-500/50'
            : isDark
            ? 'bg-slate-900/60 border-slate-800 hover:bg-slate-800/80 text-slate-100'
            : 'bg-white border-slate-200 hover:bg-slate-100 text-slate-900 shadow-xs'
        }`}
      >
        <div className="p-2.5 rounded-lg bg-rose-500/10 text-rose-500 border border-rose-500/20">
          <XCircle className="w-5 h-5" />
        </div>
        <div>
          <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Rejected (&lt;70%)</p>
          <p className="text-xl font-bold font-mono text-rose-500">{rejected}</p>
        </div>
      </button>

      {/* Critical Flagged */}
      <button
        type="button"
        onClick={() => onSelectCategory && onSelectCategory('CriticalMissing')}
        className={`${cardBase} col-span-2 lg:col-span-1 ${
          activeCategory === 'CriticalMissing'
            ? 'ring-2 ring-orange-500 bg-orange-500/10 border-orange-500/50'
            : isDark
            ? 'bg-slate-900/60 border-slate-800 hover:bg-slate-800/80 text-slate-100'
            : 'bg-white border-slate-200 hover:bg-slate-100 text-slate-900 shadow-xs'
        }`}
      >
        <div className="p-2.5 rounded-lg bg-orange-500/10 text-orange-500 border border-orange-500/20">
          <AlertOctagon className="w-5 h-5" />
        </div>
        <div>
          <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Critical Flagged</p>
          <p className="text-xl font-bold font-mono text-orange-500">{criticalFlagged}</p>
        </div>
      </button>
    </div>
  );
}
