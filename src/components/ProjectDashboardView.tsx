'use client';

import React, { useState } from 'react';
import { FolderGit2, Plus, Calendar, Table, Users, CheckCircle2, Clock, XCircle, ChevronDown, Sparkles, ExternalLink, Copy, Check, Filter } from 'lucide-react';
import { CandidateResult } from '../types';
import { HistoryRecord } from './HistoryView';
import SummaryCards from './SummaryCards';
import CandidateTable from './CandidateTable';
import ProgressBar from './ProgressBar';

interface ProjectDashboardViewProps {
  theme: 'dark' | 'light';
  historyRecords: HistoryRecord[];
  activeCandidates: CandidateResult[];
  selectedProjectId: string;
  onSelectProject: (id: string) => void;
  onNewScreening: () => void;
  onSelectCandidate: (candidate: CandidateResult) => void;
  isLoading: boolean;
  isFinished: boolean;
  progress: { completed: number; total: number; currentCandidate: string };
}

export default function ProjectDashboardView({
  theme,
  historyRecords,
  activeCandidates,
  selectedProjectId,
  onSelectProject,
  onNewScreening,
  onSelectCandidate,
  isLoading,
  isFinished,
  progress
}: ProjectDashboardViewProps) {
  const isDark = theme === 'dark';
  const [filterCategory, setFilterCategory] = useState<string>('All');
  const [copiedUrl, setCopiedUrl] = useState(false);

  // Determine current active record or candidates
  const currentRecord = historyRecords.find(r => r.id === selectedProjectId);

  // Derive candidates to display based on selection
  let displayedCandidates: CandidateResult[] = [];
  let projectTitle = 'All Projects Combined';
  let projectDate = '';
  let projectSheetUrl = '';

  if (selectedProjectId === 'latest') {
    if (activeCandidates.length > 0) {
      displayedCandidates = activeCandidates;
      projectTitle = 'Latest Screening Batch';
      projectDate = 'Just Now';
    } else if (historyRecords.length > 0) {
      const latestRec = historyRecords[0];
      displayedCandidates = latestRec.candidates || [];
      projectTitle = latestRec.operationName || 'Latest Screening Project';
      projectDate = latestRec.dateFormatted || '';
      projectSheetUrl = latestRec.studentSheetUrl || '';
    } else {
      displayedCandidates = [];
      projectTitle = 'Latest Screening Batch';
    }
  } else if (currentRecord) {
    displayedCandidates = currentRecord.candidates || [];
    projectTitle = currentRecord.operationName || 'Screening Project';
    projectDate = currentRecord.dateFormatted || '';
    projectSheetUrl = currentRecord.studentSheetUrl || '';
  } else if (selectedProjectId === 'all' || historyRecords.length > 0) {
    // Combine candidates from all history records
    const combinedMap = new Map<string, CandidateResult>();
    historyRecords.forEach(r => {
      (r.candidates || []).forEach(c => {
        combinedMap.set(`${c.name}_${c.email}`, c);
      });
    });
    activeCandidates.forEach(c => {
      combinedMap.set(`${c.name}_${c.email}`, c);
    });
    displayedCandidates = Array.from(combinedMap.values());
    projectTitle = 'All Projects Combined';
    projectDate = `${historyRecords.length} Projects Total`;
  } else {
    displayedCandidates = activeCandidates;
  }

  const handleCopySheetUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header Bar with Project Selector */}
      <div className={`p-6 rounded-2xl border transition-all ${
        isDark ? 'bg-slate-900/80 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900 shadow-sm'
      }`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-2xl font-extrabold tracking-tight flex items-center gap-2.5">
              <FolderGit2 className="w-6 h-6 text-indigo-500" />
              Project-Wise Analytics & Results
            </h2>
            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Select a specific Job/Operation Project below to filter candidate results and metrics.
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Project Selector Dropdown */}
            <div className="relative min-w-[260px]">
              <select
                value={selectedProjectId}
                onChange={(e) => onSelectProject(e.target.value)}
                className={`w-full appearance-none border rounded-xl pl-4 pr-10 py-2.5 text-xs font-bold transition focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer ${
                  isDark
                    ? 'bg-slate-950 border-slate-700 text-indigo-300'
                    : 'bg-slate-50 border-slate-300 text-indigo-700'
                }`}
              >
                {activeCandidates.length > 0 && (
                  <option value="latest">⚡ Current / Active Batch ({activeCandidates.length} Candidates)</option>
                )}

                <option value="all">🌐 All Projects Combined ({displayedCandidates.length} Candidates)</option>

                {historyRecords.length > 0 && (
                  <optgroup label="Past Projects / Batches">
                    {historyRecords.map((r, idx) => (
                      <option key={r.id} value={r.id}>
                        📁 {r.operationName || `Batch #${historyRecords.length - idx}`} ({r.totalCandidates} candidates) - {r.dateFormatted}
                      </option>
                    ))}
                  </optgroup>
                )}
              </select>
              <ChevronDown className="w-4 h-4 absolute right-3 top-3 pointer-events-none text-indigo-400" />
            </div>

            <button
              onClick={onNewScreening}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white text-xs font-bold shadow-md transition flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> + New Screening Batch
            </button>
          </div>
        </div>

        {/* Selected Project Information Banner */}
        <div className={`mt-5 pt-4 border-t flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
          isDark ? 'border-slate-800/80 text-slate-300' : 'border-slate-200 text-slate-700'
        }`}>
          <div className="flex items-center gap-3 flex-wrap">
            <span className="font-extrabold text-sm text-indigo-400 flex items-center gap-1.5">
              📌 {projectTitle}
            </span>
            {projectDate && (
              <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono text-[11px] flex items-center gap-1">
                <Calendar className="w-3 h-3 text-indigo-400" /> {projectDate}
              </span>
            )}
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-bold text-[11px] flex items-center gap-1">
              <Users className="w-3 h-3" /> {displayedCandidates.length} Candidates Evaluated
            </span>
          </div>

          {projectSheetUrl && (
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-400">Sheet:</span>
              <button
                onClick={() => handleCopySheetUrl(projectSheetUrl)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition ${
                  copiedUrl
                    ? 'bg-emerald-500 text-white'
                    : isDark
                    ? 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                {copiedUrl ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                {copiedUrl ? 'Copied Link' : 'Copy Sheet URL'}
              </button>
              <a
                href={projectSheetUrl}
                target="_blank"
                rel="noreferrer"
                className="text-indigo-400 hover:text-indigo-300 flex items-center gap-0.5 text-[11px]"
              >
                Open <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Progress Bar (if active screening running) */}
      {(isLoading || isFinished || progress.total > 0) && (
        <ProgressBar
          completed={progress.completed}
          total={progress.total}
          currentCandidate={progress.currentCandidate}
          isFinished={isFinished}
          theme={theme}
        />
      )}

      {/* Project Cards Grid (shown if history records exist to give a quick visual overview) */}
      {historyRecords.length > 1 && selectedProjectId === 'all' && (
        <div className="space-y-3">
          <h3 className="text-sm font-bold tracking-tight text-slate-400 uppercase font-mono">
            📁 Select a Project / Batch ({historyRecords.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {historyRecords.map((r) => {
              const isSelected = selectedProjectId === r.id;
              return (
                <div
                  key={r.id}
                  onClick={() => onSelectProject(r.id)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
                    isSelected
                      ? 'bg-indigo-600/20 border-indigo-500 shadow-md'
                      : isDark
                      ? 'bg-slate-900/50 hover:bg-slate-900 border-slate-800'
                      : 'bg-white hover:bg-slate-50 border-slate-200 shadow-2xs'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-extrabold text-sm truncate text-indigo-400">
                        {r.operationName || 'Screening Batch'}
                      </h4>
                      <span className="text-[10px] font-mono opacity-60">{r.dateFormatted}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 truncate">{r.studentSheetUrl}</p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 text-xs">
                    <span className="font-bold">{r.totalCandidates} Candidates</span>
                    <div className="flex items-center gap-1.5 text-[10px] font-bold">
                      <span className="text-emerald-400">✓ {r.goodToGoCount}</span>
                      <span className="text-amber-400">⏱ {r.waitingListCount}</span>
                      <span className="text-rose-400">✕ {r.notMatchingCount}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Summary Metrics Cards for Selected Project */}
      {displayedCandidates.length > 0 ? (
        <>
          <SummaryCards
            candidates={displayedCandidates}
            theme={theme}
            activeCategory={filterCategory}
            onSelectCategory={setFilterCategory}
          />

          {/* Candidate Table for Selected Project */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <span>Candidate Evaluation List ({displayedCandidates.length})</span>
                <span className="text-xs text-indigo-400 font-mono font-normal">[{projectTitle}]</span>
              </h3>
              <span className="text-xs text-slate-400 font-normal hidden sm:inline">
                Click any row for detailed evaluation breakdown
              </span>
            </div>

            <CandidateTable
              candidates={displayedCandidates}
              onSelectCandidate={onSelectCandidate}
              theme={theme}
              filterCategory={filterCategory}
              setFilterCategory={setFilterCategory}
            />
          </div>
        </>
      ) : (
        <div className={`p-12 text-center rounded-2xl border ${
          isDark ? 'bg-slate-900/40 border-slate-800 text-slate-400' : 'bg-white border-slate-200 text-slate-500'
        }`}>
          <FolderGit2 className="w-12 h-12 mx-auto mb-3 opacity-30 text-indigo-400" />
          <h3 className="text-base font-bold text-slate-300">No Candidates in Selected Project</h3>
          <p className="text-xs mt-1 max-w-sm mx-auto">
            Start a new screening batch to populate candidate evaluations for this project.
          </p>
          <button
            onClick={onNewScreening}
            className="mt-4 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md transition"
          >
            + Start New Screening
          </button>
        </div>
      )}
    </div>
  );
}
