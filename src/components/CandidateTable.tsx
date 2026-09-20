'use client';

import React, { useState } from 'react';
import { CandidateResult } from '../types';
import { Search, ArrowUpDown, ChevronRight, CheckCircle2, Clock, XCircle, AlertTriangle } from 'lucide-react';

interface CandidateTableProps {
  candidates: CandidateResult[];
  onSelectCandidate: (candidate: CandidateResult) => void;
  theme?: 'dark' | 'light';
  filterCategory?: string;
  setFilterCategory?: (cat: string) => void;
}

export default function CandidateTable({
  candidates,
  onSelectCandidate,
  theme = 'dark',
  filterCategory,
  setFilterCategory
}: CandidateTableProps) {
  const isDark = theme === 'dark';

  const [internalFilterCategory, setInternalFilterCategory] = useState<string>('All');
  const activeFilterCategory = filterCategory !== undefined ? filterCategory : internalFilterCategory;

  const handleFilterChange = (cat: string) => {
    if (setFilterCategory) {
      setFilterCategory(cat);
    }
    setInternalFilterCategory(cat);
  };

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortField, setSortField] = useState<'finalScore' | 'matchScore' | 'name'>('finalScore');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Filter logic
  const filtered = candidates.filter(c => {
    const matchesCat =
      activeFilterCategory === 'All'
        ? true
        : activeFilterCategory === 'CriticalMissing'
        ? c.criticalFlag
        : activeFilterCategory === 'Shortlist'
        ? (c.finalScore >= 80 || c.category.includes('Good to Go') || c.category === 'Shortlist')
        : activeFilterCategory === 'Waiting List'
        ? ((c.finalScore >= 70 && c.finalScore < 80) || c.category.includes('Waiting List'))
        : activeFilterCategory === 'Reject'
        ? (c.finalScore < 70 || c.category.includes('Reject') || c.category.includes('Match') || c.category.includes('Fit'))
        : c.category === activeFilterCategory;

    const matchesSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesCat && matchesSearch;
  });

  // Sort logic
  const sorted = [...filtered].sort((a, b) => {
    let valA = a[sortField];
    let valB = b[sortField];

    if (typeof valA === 'string') {
      return sortOrder === 'asc'
        ? (valA as string).localeCompare(valB as string)
        : (valB as string).localeCompare(valA as string);
    }

    return sortOrder === 'asc'
      ? (valA as number) - (valB as number)
      : (valB as number) - (valA as number);
  });

  const toggleSort = (field: 'finalScore' | 'matchScore' | 'name') => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  return (
    <div className={`w-full border rounded-2xl overflow-hidden shadow-2xl transition-colors duration-200 ${
      isDark
        ? 'bg-slate-900/60 border-slate-800 text-slate-100'
        : 'bg-white border-slate-200 text-slate-900 shadow-md'
    }`}>
      {/* Header Controls */}
      <div className={`p-4 border-b flex flex-col md:flex-row items-center justify-between gap-3 ${
        isDark ? 'border-slate-800' : 'border-slate-200 bg-slate-50/50'
      }`}>
        {/* Search */}
        <div className="relative w-full md:w-72">
          <Search className={`w-4 h-4 absolute left-3 top-3 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
          <input
            type="text"
            placeholder="Search candidate name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full border rounded-xl pl-9 pr-4 py-2 text-xs transition focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
              isDark
                ? 'bg-slate-950/80 border-slate-800 text-white placeholder-slate-500'
                : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'
            }`}
          />
        </div>

        {/* Filter Badges */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto text-xs pb-1 md:pb-0">
          {['All', 'Shortlist', 'Waiting List', 'Reject', 'CriticalMissing'].map(cat => (
            <button
              key={cat}
              onClick={() => handleFilterChange(cat)}
              className={`px-3 py-1.5 rounded-lg border transition font-medium whitespace-nowrap ${
                activeFilterCategory === cat
                  ? 'bg-indigo-600 border-indigo-500 text-white shadow-md'
                  : isDark
                  ? 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              {cat === 'CriticalMissing' ? '⚠️ Critical Flag' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className={`border-b text-[11px] font-semibold uppercase tracking-wider ${
              isDark
                ? 'border-slate-800/80 bg-slate-950/40 text-slate-400'
                : 'border-slate-200 bg-slate-100/70 text-slate-600'
            }`}>
              <th className="py-3.5 px-4 cursor-pointer hover:text-indigo-500" onClick={() => toggleSort('name')}>
                <div className="flex items-center gap-1">Candidate Name <ArrowUpDown className="w-3 h-3" /></div>
              </th>
              <th className="py-3.5 px-4">Contact Info</th>
              <th className="py-3.5 px-4 cursor-pointer hover:text-indigo-500" onClick={() => toggleSort('finalScore')}>
                <div className="flex items-center gap-1">Final Score <ArrowUpDown className="w-3 h-3" /></div>
              </th>
              <th className="py-3.5 px-4">ATS Format</th>
              <th className="py-3.5 px-4">Category</th>
              <th className="py-3.5 px-4">Critical Check</th>
              <th className="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className={`divide-y text-xs ${isDark ? 'divide-slate-800/50' : 'divide-slate-200'}`}>
            {sorted.length === 0 ? (
              <tr>
                <td colSpan={7} className={`text-center py-12 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                  No candidates match the current filter or search criteria.
                </td>
              </tr>
            ) : (
              sorted.map((c, idx) => (
                <tr
                  key={idx}
                  onClick={() => onSelectCandidate(c)}
                  className={`transition cursor-pointer group ${
                    isDark ? 'hover:bg-slate-800/40' : 'hover:bg-indigo-50/50'
                  }`}
                >
                  {/* Name */}
                  <td className="py-3.5 px-4 font-semibold group-hover:text-indigo-500 transition">
                    {c.name}
                  </td>

                  {/* Email & Phone */}
                  <td className={isDark ? 'py-3.5 px-4 text-slate-400' : 'py-3.5 px-4 text-slate-600'}>
                    <div>{c.email || 'N/A'}</div>
                    <div className="text-[11px] opacity-70">{c.phone}</div>
                  </td>

                  {/* Final Score */}
                  <td className="py-3.5 px-4 font-mono font-bold">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm ${
                        c.finalScore >= 90 ? 'text-emerald-500' : c.finalScore >= 70 ? 'text-amber-500' : 'text-rose-500'
                      }`}>
                        {c.finalScore}%
                      </span>
                      <div className={`w-16 h-1.5 rounded-full overflow-hidden border ${
                        isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200'
                      }`}>
                        <div
                          className={`h-full ${
                            c.finalScore >= 90 ? 'bg-emerald-500' : c.finalScore >= 70 ? 'bg-amber-500' : 'bg-rose-500'
                          }`}
                          style={{ width: `${c.finalScore}%` }}
                        />
                      </div>
                    </div>
                  </td>

                  {/* ATS Format Score */}
                  <td className="py-3.5 px-4 font-mono">
                    <span className={`px-2 py-0.5 rounded border ${
                      isDark ? 'bg-slate-950 border-slate-800 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-700'
                    }`}>
                      {c.atsScore}%
                    </span>
                  </td>

                  {/* Category Badge */}
                  <td className="py-3.5 px-4">
                    {(c.category.includes('Good to Go') || c.category === 'Shortlist') && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                        <CheckCircle2 className="w-3 h-3" /> Good to Go (80%+)
                      </span>
                    )}
                    {c.category.includes('Waiting List') && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-amber-500/10 text-amber-500 border border-amber-500/20">
                        <Clock className="w-3 h-3" /> Waiting List (70-79%)
                      </span>
                    )}
                    {c.category.includes('Partial Match') && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-orange-500/10 text-orange-500 border border-orange-500/20">
                        <XCircle className="w-3 h-3" /> Partial Match (50-69%)
                      </span>
                    )}
                    {c.category.includes('Weak Fit') && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-rose-500/10 text-rose-500 border border-rose-500/20">
                        <XCircle className="w-3 h-3" /> Weak Fit (30-49%)
                      </span>
                    )}
                    {(c.category.includes('Critical Mismatch') || c.category === 'Reject') && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-red-500/10 text-red-500 border border-red-500/20">
                        <XCircle className="w-3 h-3" /> Critical Mismatch (&lt;30%)
                      </span>
                    )}
                  </td>

                  {/* Critical Check */}
                  <td className="py-3.5 px-4">
                    {c.criticalFlag ? (
                      <span className="inline-flex items-center gap-1 text-[11px] text-orange-500 bg-orange-500/10 border border-orange-500/20 px-2 py-0.5 rounded-md font-medium">
                        <AlertTriangle className="w-3 h-3 text-orange-500" /> Missing Must-Have
                      </span>
                    ) : (
                      <span className={`text-[11px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Pass ✓</span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectCandidate(c);
                      }}
                      className={`p-1.5 rounded-lg border transition inline-flex items-center gap-1 text-xs ${
                        isDark
                          ? 'text-slate-400 hover:text-white border-slate-800 hover:bg-slate-800'
                          : 'text-slate-600 hover:text-black border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      Details <ChevronRight className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
