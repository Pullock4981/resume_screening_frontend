'use client';

import React, { useState } from 'react';
import { History, Calendar, Users, CheckCircle2, Clock, XCircle, ExternalLink, Trash2, ArrowUpRight, Copy, Check, Filter, RefreshCw } from 'lucide-react';
import { CandidateResult } from '../types';

export interface HistoryRecord {
  id: string;
  operationName: string;
  timestamp: string;
  dateFormatted: string;
  studentSheetUrl: string;
  totalCandidates: number;
  goodToGoCount: number;
  waitingListCount: number;
  notMatchingCount: number;
  candidates: CandidateResult[];
}

interface HistoryViewProps {
  theme: 'dark' | 'light';
  historyRecords: HistoryRecord[];
  onSelectRecord: (record: HistoryRecord) => void;
  onClearHistory: () => void;
  onDeleteRecord: (id: string) => void;
  onSyncHistory?: () => void;
  isSyncing?: boolean;
}

export default function HistoryView({
  theme,
  historyRecords,
  onSelectRecord,
  onClearHistory,
  onDeleteRecord,
  onSyncHistory,
  isSyncing = false
}: HistoryViewProps) {
  const isDark = theme === 'dark';
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Sort history newest first
  const sortedRecords = [...historyRecords].sort((a, b) => {
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
  });

  const filteredRecords = sortedRecords.filter(r =>
    r.operationName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.dateFormatted.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.studentSheetUrl.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCopyUrl = (id: string, url: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight flex items-center gap-2.5">
            <History className="w-6 h-6 text-indigo-500" />
            Screening History ({sortedRecords.length})
          </h2>
          <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            List of all past candidate evaluation runs (Auto-synchronized with Google Sheet).
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {onSyncHistory && (
            <button
              onClick={onSyncHistory}
              disabled={isSyncing}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold border flex items-center gap-1.5 transition ${
                isDark
                  ? 'bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 border-indigo-500/30'
                  : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-600 border-indigo-200'
              }`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-indigo-400' : ''}`} />
              <span>{isSyncing ? 'Syncing...' : 'Sync with Google Sheet'}</span>
            </button>
          )}

          {sortedRecords.length > 0 && (
            <button
              onClick={onClearHistory}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition ${
                isDark
                  ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border-rose-500/20'
                  : 'bg-rose-50 hover:bg-rose-100 text-rose-600 border-rose-200'
              }`}
            >
              <Trash2 className="w-3.5 h-3.5" /> Clear History
            </button>
          )}
        </div>
      </div>

      {/* Search Filter */}
      {sortedRecords.length > 0 && (
        <div className="relative">
          <input
            type="text"
            placeholder="Search history by Job Name, Date or Sheet URL..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full border rounded-xl pl-4 pr-10 py-2.5 text-xs transition focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
              isDark
                ? 'bg-slate-900 border-slate-800 text-white placeholder-slate-500'
                : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'
            }`}
          />
        </div>
      )}

      {/* History Items Container */}
      {filteredRecords.length === 0 ? (
        <div className={`p-12 text-center rounded-2xl border ${
          isDark ? 'bg-slate-900/40 border-slate-800 text-slate-400' : 'bg-white border-slate-200 text-slate-500'
        }`}>
          <History className="w-12 h-12 mx-auto mb-3 opacity-30 text-indigo-400" />
          <h3 className="text-base font-bold text-slate-300">No Screening History Found</h3>
          <p className="text-xs mt-1 max-w-sm mx-auto">
            {searchQuery ? 'No past batches match your search query.' : 'Run a new screening batch to start recording history here.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredRecords.map((item, index) => (
            <div
              key={item.id || index}
              onClick={() => onSelectRecord(item)}
              className={`p-5 rounded-2xl border transition-all cursor-pointer group hover:shadow-lg relative overflow-hidden ${
                isDark
                  ? 'bg-slate-900/60 hover:bg-slate-900 border-slate-800 text-slate-100'
                  : 'bg-white hover:bg-slate-50/80 border-slate-200 text-slate-900 shadow-xs'
              }`}
            >
              {/* Recent Tag for the very first item */}
              {index === 0 && !searchQuery && (
                <div className="absolute top-0 right-0 bg-gradient-to-l from-indigo-500 to-cyan-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl shadow-xs">
                  ⚡ Most Recent
                </div>
              )}

              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1.5 flex-1 pr-4">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-extrabold group-hover:text-indigo-400 transition">
                      {item.operationName || 'Screening Operation'}
                    </h3>
                    <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-indigo-400" />
                      {item.dateFormatted}
                    </span>
                  </div>

                  {/* Sheet URL & Copy */}
                  <div className="flex items-center gap-2 text-xs font-mono opacity-80 overflow-hidden">
                    <span className="truncate max-w-md text-slate-400">{item.studentSheetUrl}</span>
                    <button
                      onClick={(e) => handleCopyUrl(item.id, item.studentSheetUrl, e)}
                      className={`p-1 rounded text-[10px] font-sans flex items-center gap-1 transition ${
                        copiedId === item.id
                          ? 'bg-emerald-500 text-white'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                      }`}
                      title="Copy Sheet URL"
                    >
                      {copiedId === item.id ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    </button>
                    {item.studentSheetUrl && (
                      <a
                        href={item.studentSheetUrl}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-indigo-400 hover:text-indigo-300"
                      >
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>

                {/* Candidate Stats Pills */}
                <div className="flex items-center gap-3 flex-wrap">
                  <div className={`px-3 py-1.5 rounded-xl border flex items-center gap-2 text-xs font-bold ${
                    isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200'
                  }`}>
                    <Users className="w-4 h-4 text-cyan-400" />
                    <span>{item.totalCandidates} Total</span>
                  </div>

                  <div className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{item.goodToGoCount} Good to Go</span>
                  </div>

                  <div className="px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    <span>{item.waitingListCount} Waiting</span>
                  </div>

                  <div className="px-3 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold flex items-center gap-1.5">
                    <XCircle className="w-3.5 h-3.5 text-rose-400" />
                    <span>{item.notMatchingCount} Not Matching</span>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteRecord(item.id);
                    }}
                    className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition"
                    title="Delete record"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <div className="p-2 rounded-xl bg-indigo-600/20 group-hover:bg-indigo-600 text-indigo-400 group-hover:text-white transition">
                    <ArrowUpRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
