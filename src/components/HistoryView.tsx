'use client';

import React, { useState, useEffect } from 'react';
import { History, Calendar, Users, CheckCircle2, Clock, XCircle, ExternalLink, Trash2, ArrowUpRight, Copy, Check, RefreshCw, FileCheck, Award, Sparkles, X, ChevronRight } from 'lucide-react';
import { CandidateResult, AtsHistoryRecord, AtsRubricResult } from '../types';

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
  atsHistoryRecords?: AtsHistoryRecord[];
  onSelectRecord: (record: HistoryRecord) => void;
  onClearHistory: () => void;
  onDeleteRecord: (id: string) => void;
  onClearAtsHistory?: () => void;
  onDeleteAtsRecord?: (id: string) => void;
  onSyncHistory?: () => void;
  isSyncing?: boolean;
  defaultSubTab?: 'screening' | 'atsCheck' | 'activityLogs';
}

import { useAuth } from '../context/AuthContext';

export default function HistoryView({
  theme,
  historyRecords,
  atsHistoryRecords = [],
  onSelectRecord,
  onClearHistory,
  onDeleteRecord,
  onClearAtsHistory,
  onDeleteAtsRecord,
  onSyncHistory,
  isSyncing = false,
  defaultSubTab
}: HistoryViewProps) {
  const isDark = theme === 'dark';
  const { token, user, isAdmin } = useAuth();

  const [activeSubTab, setActiveSubTab] = useState<'screening' | 'atsCheck' | 'activityLogs'>(defaultSubTab || 'screening');
  const [filterByUser, setFilterByUser] = useState<'all' | 'me'>('all');

  useEffect(() => {
    if (defaultSubTab) {
      setActiveSubTab(defaultSubTab);
    }
  }, [defaultSubTab]);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Local ATS records state sync
  const [localAtsRecords, setLocalAtsRecords] = useState<AtsHistoryRecord[]>(atsHistoryRecords);
  const [selectedAtsRecord, setSelectedAtsRecord] = useState<AtsHistoryRecord | null>(null);
  const [selectedCandidateRubric, setSelectedCandidateRubric] = useState<AtsRubricResult | null>(null);

  // Activity Audit Logs from Master Sheet Login_Logs
  const [activityLogs, setActivityLogs] = useState<any[]>([]);
  const [isLogsLoading, setIsLogsLoading] = useState(false);

  const getBackendUrl = () => {
    if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
      return 'http://localhost:5000';
    }
    return process.env.NEXT_PUBLIC_BACKEND_URL || 'https://resume-screening-backend.vercel.app';
  };

  const BACKEND_URL = getBackendUrl();

  const fetchActivityLogs = async () => {
    setIsLogsLoading(true);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    try {
      const res = await fetch(`${BACKEND_URL}/api/activity/logs`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      const data = await res.json();
      if (res.ok && data.logs) {
        setActivityLogs(data.logs);
      }
    } catch (e: any) {
      clearTimeout(timeoutId);
      console.warn('Failed to fetch activity logs:', e.message || e);
    } finally {
      setIsLogsLoading(false);
    }
  };

  useEffect(() => {
    try {
      const saved = localStorage.getItem('ats_check_history');
      if (saved) {
        setLocalAtsRecords(JSON.parse(saved));
      } else {
        setLocalAtsRecords(atsHistoryRecords);
      }
    } catch (e) {
      setLocalAtsRecords(atsHistoryRecords);
    }
    fetchActivityLogs();
  }, [atsHistoryRecords, token]);

  // Sort screening history newest first
  const sortedRecords = [...historyRecords].sort((a, b) => {
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
  });

  const filteredRecords = sortedRecords.filter(r =>
    r.operationName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.dateFormatted.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.studentSheetUrl.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Sort ATS history newest first
  const sortedAtsRecords = [...localAtsRecords].sort((a, b) => {
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
  });

  const filteredAtsRecords = sortedAtsRecords.filter(r =>
    r.operationName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.dateFormatted.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.studentSheetUrl.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredActivityLogs = activityLogs.filter(l => {
    const matchesUser = filterByUser === 'me' && user?.email
      ? (l.email || '').toLowerCase() === user.email.toLowerCase()
      : true;
    const matchesQuery =
      (l.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (l.details || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (l.loginTime || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesUser && matchesQuery;
  });

  const getExecutorEmail = (item: any) => {
    if (item.userEmail) return item.userEmail;
    if (!item.operationName && !item.studentSheetUrl) return user?.email || 'System User';
    const op = (item.operationName || '').toLowerCase();
    const match = activityLogs.find(l => l.details && op && op.length > 2 && l.details.toLowerCase().includes(op));
    if (match && match.email) return match.email;
    return user?.email || 'System User';
  };

  const handleCopyUrl = (id: string, url: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleClearAts = () => {
    if (confirm('Are you sure you want to clear all ATS Check history?')) {
      localStorage.removeItem('ats_check_history');
      setLocalAtsRecords([]);
      if (onClearAtsHistory) onClearAtsHistory();
    }
  };

  const handleDeleteAtsItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = localAtsRecords.filter(r => r.id !== id);
    setLocalAtsRecords(updated);
    try {
      localStorage.setItem('ats_check_history', JSON.stringify(updated));
    } catch (err) {}
    if (onDeleteAtsRecord) onDeleteAtsRecord(id);
  };

  const getGradeBadge = (grade: string) => {
    switch (grade) {
      case 'Excellent':
        return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30';
      case 'Strong':
        return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30';
      case 'Moderate':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'Needs Work':
        return 'bg-orange-500/10 text-orange-400 border-orange-500/30';
      default:
        return 'bg-rose-500/10 text-rose-500 border-rose-500/30';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight flex items-center gap-2.5">
            <History className="w-6 h-6 text-indigo-400" />
            Screening & Activity History
          </h2>
          <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            View past screening batch operations, ATS resume rubric evaluation history, and full user activity logs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onSyncHistory && (
            <button
              onClick={() => { onSyncHistory(); fetchActivityLogs(); }}
              disabled={isSyncing}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition ${
                isDark
                  ? 'bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 border-indigo-500/30'
                  : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-600 border-indigo-200'
              }`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing || isLogsLoading ? 'animate-spin text-indigo-400' : ''}`} />
              <span>{isSyncing || isLogsLoading ? 'Syncing...' : 'Sync with Google Sheet'}</span>
            </button>
          )}

          {activeSubTab === 'screening' && sortedRecords.length > 0 && (
            <button
              onClick={onClearHistory}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition ${
                isDark
                  ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border-rose-500/20'
                  : 'bg-rose-50 hover:bg-rose-100 text-rose-600 border-rose-200'
              }`}
            >
              <Trash2 className="w-3.5 h-3.5" /> Clear Screening History
            </button>
          )}

          {activeSubTab === 'atsCheck' && sortedAtsRecords.length > 0 && (
            <button
              onClick={handleClearAts}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition ${
                isDark
                  ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border-rose-500/20'
                  : 'bg-rose-50 hover:bg-rose-100 text-rose-600 border-rose-200'
              }`}
            >
              <Trash2 className="w-3.5 h-3.5" /> Clear ATS Check History
            </button>
          )}
        </div>
      </div>

      {/* Sub-tab Navigation Switcher */}
      <div className={`flex border-b gap-6 ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
        <button
          onClick={() => setActiveSubTab('screening')}
          className={`pb-3 text-sm font-bold border-b-2 transition flex items-center gap-2 ${
            activeSubTab === 'screening'
              ? 'border-indigo-500 text-indigo-500'
              : isDark
              ? 'border-transparent text-slate-400 hover:text-slate-200'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Job Screening History ({sortedRecords.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('atsCheck')}
          className={`pb-3 text-sm font-bold border-b-2 transition flex items-center gap-2 ${
            activeSubTab === 'atsCheck'
              ? 'border-indigo-500 text-indigo-500'
              : isDark
              ? 'border-transparent text-slate-400 hover:text-slate-200'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <FileCheck className="w-4 h-4 text-cyan-500" />
          <span>ATS Resume Check History ({sortedAtsRecords.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('activityLogs')}
          className={`pb-3 text-sm font-bold border-b-2 transition flex items-center gap-2 ${
            activeSubTab === 'activityLogs'
              ? 'border-indigo-500 text-indigo-500'
              : isDark
              ? 'border-transparent text-slate-400 hover:text-slate-200'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Clock className="w-4 h-4 text-purple-500" />
          <span>
            {isAdmin 
              ? `User Activity Audit Logs (${activityLogs.length})` 
              : `My Checks Summary (${sortedRecords.length + sortedAtsRecords.length})`}
          </span>
        </button>
      </div>

      {/* Search Filter */}
      <div className="relative">
        <input
          type="text"
          placeholder={
            activeSubTab === 'screening'
              ? "Search screening history..."
              : activeSubTab === 'atsCheck'
              ? "Search ATS check history..."
              : "Search activity logs by email, date, or action..."
          }
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className={`w-full border rounded-xl pl-4 pr-10 py-2.5 text-xs transition focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
            isDark
              ? 'bg-slate-900 border-slate-800 text-white placeholder-slate-500'
              : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'
          }`}
        />
      </div>

      {/* SUB-TAB 1: Job Screening History */}
      {activeSubTab === 'screening' && (
        filteredRecords.length === 0 ? (
          <div className={`p-12 text-center rounded-2xl border ${
            isDark ? 'bg-slate-900/40 border-slate-800 text-slate-400' : 'bg-white border-slate-200 text-slate-500'
          }`}>
            <History className="w-12 h-12 mx-auto mb-3 opacity-30 text-indigo-400" />
            <h3 className="text-base font-bold text-slate-300">No Job Screening History Found</h3>
            <p className="text-xs mt-1 max-w-sm mx-auto">
              {searchQuery ? 'No past screening runs match your search query.' : 'Run a new screening batch to start recording history here.'}
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
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base font-extrabold group-hover:text-indigo-400 transition">
                        {item.operationName || 'Screening Operation'}
                      </h3>
                      <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-indigo-400" />
                        {item.dateFormatted}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border flex items-center gap-1 ${
                        isDark ? 'bg-purple-500/10 text-purple-300 border-purple-500/30' : 'bg-purple-50 text-purple-700 border-purple-200'
                      }`}>
                        👤 Executed by: {getExecutorEmail(item)}
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
        )
      )}

      {/* SUB-TAB 2: ATS Check History */}
      {activeSubTab === 'atsCheck' && (
        filteredAtsRecords.length === 0 ? (
          <div className={`p-12 text-center rounded-2xl border ${
            isDark ? 'bg-slate-900/40 border-slate-800 text-slate-400' : 'bg-white border-slate-200 text-slate-500'
          }`}>
            <FileCheck className="w-12 h-12 mx-auto mb-3 opacity-30 text-cyan-400" />
            <h3 className="text-base font-bold text-slate-300">No ATS Check History Found</h3>
            <p className="text-xs mt-1 max-w-sm mx-auto">
              {searchQuery ? 'No past ATS check runs match your search query.' : 'Run a 100-Point ATS Resume Check to start recording history here.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredAtsRecords.map((item, index) => (
              <div
                key={item.id || index}
                onClick={() => setSelectedAtsRecord(item)}
                className={`p-5 rounded-2xl border transition-all cursor-pointer group hover:shadow-lg relative overflow-hidden ${
                  isDark
                    ? 'bg-slate-900/60 hover:bg-slate-900 border-slate-800 text-slate-100'
                    : 'bg-white hover:bg-slate-50/80 border-slate-200 text-slate-900 shadow-xs'
                }`}
              >
                {/* Recent Tag */}
                {index === 0 && !searchQuery && (
                  <div className="absolute top-0 right-0 bg-gradient-to-l from-indigo-500 to-cyan-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl shadow-xs">
                    ⚡ Most Recent ATS Run
                  </div>
                )}

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1.5 flex-1 pr-4">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base font-extrabold group-hover:text-cyan-400 transition">
                        {item.operationName || 'ATS Resume Check'}
                      </h3>
                      <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-cyan-400" />
                        {item.dateFormatted}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border flex items-center gap-1 ${
                        isDark ? 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30' : 'bg-cyan-50 text-cyan-700 border-cyan-200'
                      }`}>
                        👤 Executed by: {getExecutorEmail(item)}
                      </span>
                    </div>

                    {/* Sheet / Resume URL */}
                    <div className="flex items-center gap-2 text-xs font-mono opacity-80 overflow-hidden">
                      <span className="truncate max-w-md text-slate-400">{item.studentSheetUrl}</span>
                      <button
                        onClick={(e) => handleCopyUrl(item.id, item.studentSheetUrl, e)}
                        className={`p-1 rounded text-[10px] font-sans flex items-center gap-1 transition ${
                          copiedId === item.id
                            ? 'bg-emerald-500 text-white'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                        }`}
                        title="Copy Link"
                      >
                        {copiedId === item.id ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      </button>
                      {item.studentSheetUrl && item.studentSheetUrl.includes('http') && (
                        <a
                          href={item.studentSheetUrl}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-cyan-400 hover:text-cyan-300"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>

                  {/* ATS Grade Stats Pills */}
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className={`px-3 py-1.5 rounded-xl border flex items-center gap-2 text-xs font-bold ${
                      isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200'
                    }`}>
                      <Users className="w-4 h-4 text-indigo-400" />
                      <span>{item.totalCandidates} Evaluated</span>
                    </div>

                    <div className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold flex items-center gap-1">
                      <span>{item.excellentCount} Excellent</span>
                    </div>

                    <div className="px-3 py-1.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-bold flex items-center gap-1">
                      <span>{item.strongCount} Strong</span>
                    </div>

                    <div className="px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold flex items-center gap-1">
                      <span>{item.moderateCount} Moderate</span>
                    </div>

                    <div className="px-3 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold flex items-center gap-1">
                      <span>{item.needsWorkCount} Needs Work</span>
                    </div>

                    <button
                      onClick={(e) => handleDeleteAtsItem(item.id, e)}
                      className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition"
                      title="Delete record"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <div className="p-2 rounded-xl bg-cyan-600/20 group-hover:bg-cyan-600 text-cyan-400 group-hover:text-white transition">
                      <ArrowUpRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* SUB-TAB 3: User Activity & Performed Checks */}
      {activeSubTab === 'activityLogs' && (
        !isAdmin ? (
          /* REGULAR USER VIEW: Clean Performed Checks Summary & User Logs */
          <div className="space-y-6">
            {/* User Check Statistics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className={`p-5 rounded-2xl border flex items-center gap-4 ${
                isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
              }`}>
                <div className="p-3.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  <History className="w-6 h-6" />
                </div>
                <div>
                  <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Job Screening Batches</p>
                  <p className="text-2xl font-black font-mono text-indigo-400">{sortedRecords.length}</p>
                  <p className="text-[11px] text-slate-500">{sortedRecords.reduce((s, r) => s + (r.totalCandidates || 0), 0)} candidates evaluated</p>
                </div>
              </div>

              <div className={`p-5 rounded-2xl border flex items-center gap-4 ${
                isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
              }`}>
                <div className="p-3.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  <FileCheck className="w-6 h-6" />
                </div>
                <div>
                  <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>ATS Resume Checks</p>
                  <p className="text-2xl font-black font-mono text-cyan-400">{sortedAtsRecords.length}</p>
                  <p className="text-[11px] text-slate-500">{sortedAtsRecords.reduce((s, r) => s + (r.totalCandidates || 0), 0)} resumes evaluated</p>
                </div>
              </div>

              <div className={`p-5 rounded-2xl border flex items-center gap-4 ${
                isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
              }`}>
                <div className="p-3.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Total Operations Executed</p>
                  <p className="text-2xl font-black font-mono text-purple-400">{sortedRecords.length + sortedAtsRecords.length}</p>
                  <p className="text-[11px] text-slate-500">All checks combined</p>
                </div>
              </div>
            </div>

            {/* My Executed Activity Logs */}
            <div className={`border rounded-2xl overflow-hidden ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200 shadow-md'}`}>
              <div className="p-4 border-b border-slate-800/60 flex items-center justify-between text-xs">
                <span className="font-bold flex items-center gap-2">
                  <Clock className="w-4 h-4 text-purple-400" />
                  My Executed Activity & Check Logs ({activityLogs.filter(l => (l.email || '').toLowerCase() === (user?.email || '').toLowerCase()).length})
                </span>
                <span className={`text-[11px] font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  User: {user?.email}
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className={`border-b uppercase text-[10px] font-bold ${isDark ? 'bg-slate-950/60 border-slate-800 text-slate-400' : 'bg-slate-100 border-slate-200 text-slate-700'}`}>
                      <th className="p-3.5">Activity Timestamp</th>
                      <th className="p-3.5">Operation Type</th>
                      <th className="p-3.5">Executed Action Details</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${isDark ? 'divide-slate-800/40' : 'divide-slate-200'}`}>
                    {activityLogs.filter(l => (l.email || '').toLowerCase() === (user?.email || '').toLowerCase()).length === 0 ? (
                      <tr>
                        <td colSpan={3} className={`p-8 text-center ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                          No activity checks recorded yet for your account. Run a job screening or ATS check to populate this.
                        </td>
                      </tr>
                    ) : (
                      activityLogs
                        .filter(l => (l.email || '').toLowerCase() === (user?.email || '').toLowerCase())
                        .map((log, idx) => (
                          <tr key={log.id || idx} className={`transition ${isDark ? 'hover:bg-purple-500/5' : 'hover:bg-purple-50/60'}`}>
                            <td className={`p-3.5 font-mono ${isDark ? 'text-slate-300' : 'text-slate-700 font-medium'}`}>
                              {log.loginTime}
                            </td>
                            <td className="p-3.5">
                              {log.details.includes('ATS') ? (
                                <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-[10px] font-bold">
                                  ATS Check
                                </span>
                              ) : log.details.includes('Screening') ? (
                                <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[10px] font-bold">
                                  Screening Batch
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold">
                                  Login Session
                                </span>
                              )}
                            </td>
                            <td className={`p-3.5 ${isDark ? 'text-slate-300' : 'text-slate-800 font-medium'}`}>
                              {log.details}
                            </td>
                          </tr>
                        ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          /* ADMIN VIEW: Full Master System Audit Logs Table with User Toggle */
          <div className={`border rounded-2xl overflow-hidden ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200 shadow-md'}`}>
            <div className="p-4 border-b border-slate-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <span className="font-bold flex items-center gap-2">
                <Clock className="w-4 h-4 text-purple-400" />
                Master Google Sheet User Activity & Audit Logs ({filteredActivityLogs.length})
              </span>
              <div className="flex items-center gap-3">
                {user?.email && (
                  <div className={`flex items-center gap-1 p-0.5 rounded-lg border ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200'}`}>
                    <button
                      type="button"
                      onClick={() => setFilterByUser('all')}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition ${
                        filterByUser === 'all'
                          ? 'bg-purple-600 text-white shadow-xs'
                          : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      All Users Activity ({activityLogs.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setFilterByUser('me')}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition flex items-center gap-1 ${
                        filterByUser === 'me'
                          ? 'bg-purple-600 text-white shadow-xs'
                          : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <span>My Activity Only</span>
                      <span className="text-[10px] opacity-75">({user.name || user.email.split('@')[0]})</span>
                    </button>
                  </div>
                )}
                <span className={`text-[11px] font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Tab: Login_Logs
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className={`border-b uppercase text-[10px] font-bold ${isDark ? 'bg-slate-950/60 border-slate-800 text-slate-400' : 'bg-slate-100 border-slate-200 text-slate-700'}`}>
                    <th className="p-3.5">User Email</th>
                    <th className="p-3.5">Role</th>
                    <th className="p-3.5">Activity Timestamp</th>
                    <th className="p-3.5">Audit Details / Performed Action</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDark ? 'divide-slate-800/40' : 'divide-slate-200'}`}>
                  {filteredActivityLogs.length === 0 ? (
                    <tr>
                      <td colSpan={4} className={`p-8 text-center ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        No user activity audit logs recorded yet.
                      </td>
                    </tr>
                  ) : (
                    filteredActivityLogs.map((log, idx) => (
                      <tr key={log.id || idx} className={`transition ${isDark ? 'hover:bg-purple-500/5' : 'hover:bg-purple-50/60'}`}>
                        <td className="p-3.5 font-bold font-mono text-indigo-600 dark:text-cyan-400 flex items-center gap-1.5">
                          <span>{log.email}</span>
                          {user?.email && (log.email || '').toLowerCase() === user.email.toLowerCase() && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] bg-indigo-500/20 text-indigo-400 font-bold border border-indigo-500/30">
                              You
                            </span>
                          )}
                        </td>
                        <td className="p-3.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                            log.role === 'admin'
                              ? 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-300'
                              : isDark
                              ? 'bg-slate-800 text-slate-300 border-slate-700'
                              : 'bg-slate-200 text-slate-800 border-slate-300'
                          }`}>
                            {log.role}
                          </span>
                        </td>
                        <td className={`p-3.5 font-mono ${isDark ? 'text-slate-300' : 'text-slate-700 font-medium'}`}>
                          {log.loginTime}
                        </td>
                        <td className={`p-3.5 ${isDark ? 'text-slate-300' : 'text-slate-800 font-medium'}`}>
                          <span className="flex items-center gap-1.5">
                            {log.details.includes('ATS') ? (
                              <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20 text-[10px] font-bold">
                                ATS Check
                              </span>
                            ) : log.details.includes('Screening') ? (
                              <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 text-[10px] font-bold">
                                Screening Batch
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[10px] font-bold">
                                Login Session
                              </span>
                            )}
                            <span>{log.details}</span>
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}

      {/* Selected ATS Record Modal Viewer */}
      {selectedAtsRecord && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className={`w-full max-w-4xl rounded-2xl border p-6 space-y-6 my-8 max-h-[90vh] overflow-y-auto ${
            isDark ? 'bg-slate-900 border-slate-800 text-slate-100 shadow-2xl' : 'bg-white border-slate-200 text-slate-900 shadow-xl'
          }`}>
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b pb-4 border-slate-800">
              <div className="space-y-1">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <FileCheck className="w-5 h-5 text-cyan-400" />
                  {selectedAtsRecord.operationName}
                </h3>
                <p className="text-xs text-slate-400 font-mono">
                  {selectedAtsRecord.dateFormatted} • {selectedAtsRecord.totalCandidates} Resumes Evaluated
                </p>
              </div>
              <button onClick={() => setSelectedAtsRecord(null)} className="p-1 rounded-lg hover:bg-slate-800 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Results Table */}
            <div className="overflow-x-auto border rounded-xl border-slate-800">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b bg-slate-950/60 border-slate-800 text-slate-400 uppercase text-[10px]">
                    <th className="p-3">Candidate Name</th>
                    <th className="p-3">Contact Info</th>
                    <th className="p-3">ATS Score</th>
                    <th className="p-3">Grade</th>
                    <th className="p-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40">
                  {selectedAtsRecord.results.map((res, i) => (
                    <tr key={i} className="hover:bg-slate-800/30">
                      <td className="p-3 font-bold">{res.name}</td>
                      <td className="p-3 text-slate-400">{res.email}</td>
                      <td className="p-3 font-mono font-bold text-indigo-400">{res.totalScore} / 100</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getGradeBadge(res.grade)}`}>
                          {res.grade}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => setSelectedCandidateRubric(res)}
                          className="px-2.5 py-1 rounded bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600/30 font-semibold text-[11px]"
                        >
                          View Rubric
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Single Candidate Rubric Detail Modal inside History */}
      {selectedCandidateRubric && (
        <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className={`w-full max-w-3xl rounded-2xl border p-6 space-y-6 my-8 max-h-[90vh] overflow-y-auto ${
            isDark ? 'bg-slate-900 border-slate-800 text-slate-100 shadow-2xl' : 'bg-white border-slate-200 text-slate-900 shadow-xl'
          }`}>
            <div className="flex items-start justify-between border-b pb-4 border-slate-800">
              <div className="space-y-1">
                <h3 className="text-xl font-bold">{selectedCandidateRubric.name}</h3>
                <span className={`px-3 py-1 rounded-full border text-xs font-bold uppercase ${getGradeBadge(selectedCandidateRubric.grade)}`}>
                  Grade: {selectedCandidateRubric.grade} ({selectedCandidateRubric.totalScore}/100)
                </span>
              </div>
              <button onClick={() => setSelectedCandidateRubric(null)} className="p-1 rounded-lg hover:bg-slate-800 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 rounded-xl bg-indigo-950/30 border border-indigo-500/20 space-y-2">
              <h4 className="text-xs font-bold uppercase text-indigo-400 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-cyan-400" /> Feedback Summary
              </h4>
              <p className="text-xs font-medium leading-relaxed">
                {selectedCandidateRubric.feedback?.summary}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

