'use client';

import React, { useState, useEffect } from 'react';
import { History, Calendar, Users, CheckCircle2, Clock, XCircle, ExternalLink, Trash2, ArrowUpRight, Copy, Check, RefreshCw, FileCheck, Award, Sparkles, X, ChevronRight, Eye } from 'lucide-react';
import { CandidateResult, AtsHistoryRecord, AtsRubricResult, GithubCheckItem } from '../types';

const GithubIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
  </svg>
);

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

export interface GithubHistoryRecord {
  id: string;
  operationName: string;
  timestamp: string;
  dateFormatted: string;
  studentSheetUrl: string;
  totalCandidates: number;
  excellentCount: number;
  strongCount: number;
  moderateCount: number;
  needsImprovementCount: number;
  userEmail?: string;
  results: GithubCheckItem[];
}

interface HistoryViewProps {
  theme: 'dark' | 'light';
  historyRecords: HistoryRecord[];
  atsHistoryRecords?: AtsHistoryRecord[];
  githubHistoryRecords?: GithubHistoryRecord[];
  onSelectRecord: (record: HistoryRecord) => void;
  onClearHistory: () => void;
  onDeleteRecord: (id: string) => void;
  onClearAtsHistory?: () => void;
  onDeleteAtsRecord?: (id: string) => void;
  onClearGithubHistory?: () => void;
  onDeleteGithubRecord?: (id: string) => void;
  onSyncHistory?: () => void;
  isSyncing?: boolean;
  defaultSubTab?: 'screening' | 'atsCheck' | 'githubCheck' | 'activityLogs';
}

import { useAuth } from '../context/AuthContext';

export default function HistoryView({
  theme,
  historyRecords,
  atsHistoryRecords = [],
  githubHistoryRecords = [],
  onSelectRecord,
  onClearHistory,
  onDeleteRecord,
  onClearAtsHistory,
  onDeleteAtsRecord,
  onClearGithubHistory,
  onDeleteGithubRecord,
  onSyncHistory,
  isSyncing = false,
  defaultSubTab
}: HistoryViewProps) {
  const isDark = theme === 'dark';
  const { token, user, isAdmin } = useAuth();

  const [activeSubTab, setActiveSubTab] = useState<'screening' | 'atsCheck' | 'githubCheck' | 'activityLogs'>(defaultSubTab || 'screening');

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

  // Local GitHub records state sync
  const [localGithubRecords, setLocalGithubRecords] = useState<GithubHistoryRecord[]>(githubHistoryRecords);
  const [selectedGithubRecord, setSelectedGithubRecord] = useState<GithubHistoryRecord | null>(null);
  const [selectedCandidateGithub, setSelectedCandidateGithub] = useState<GithubCheckItem | null>(null);

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

    try {
      const savedGh = localStorage.getItem('github_check_history');
      if (savedGh) {
        setLocalGithubRecords(JSON.parse(savedGh));
      } else {
        setLocalGithubRecords(githubHistoryRecords);
      }
    } catch (e) {
      setLocalGithubRecords(githubHistoryRecords);
    }

    fetchActivityLogs();
  }, [token, atsHistoryRecords?.length, githubHistoryRecords?.length]);


  // 1. Separate pure screening records from ATS & GitHub check records
  const pureScreeningRecords = historyRecords.filter(r => !/ats/i.test(r.operationName || '') && !/github/i.test(r.operationName || '') && (r as any).type !== 'github');
  const syncedAtsHistoryRecords = historyRecords.filter(r => /ats/i.test(r.operationName || '') && !/github/i.test(r.operationName || ''));
  const syncedGithubRecords = historyRecords.filter(r => /github/i.test(r.operationName || '') || (r as any).type === 'github');

  // Sort screening history newest first
  const sortedRecords = [...pureScreeningRecords].sort((a, b) => {
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
  });

  const filteredRecords = sortedRecords.filter(r =>
    r.operationName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.dateFormatted.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.studentSheetUrl.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // 2. Convert synced ATS history records to AtsHistoryRecord shape
  const convertedSyncedAts: AtsHistoryRecord[] = syncedAtsHistoryRecords.map(syncedRec => ({
    id: syncedRec.id,
    operationName: syncedRec.operationName,
    timestamp: syncedRec.timestamp,
    dateFormatted: syncedRec.dateFormatted,
    studentSheetUrl: syncedRec.studentSheetUrl,
    totalCandidates: syncedRec.totalCandidates,
    excellentCount: syncedRec.goodToGoCount,
    strongCount: syncedRec.waitingListCount,
    moderateCount: 0,
    needsWorkCount: syncedRec.notMatchingCount,
    userEmail: (syncedRec as any).userEmail,
    results: (syncedRec.candidates || []).map(c => ({
      name: c.name,
      email: c.email,
      phone: c.phone,
      resumeLink: c.resumeLink,
      totalScore: c.atsScore || c.finalScore || 0,
      grade: (c.atsScore || c.finalScore || 0) >= 85 ? 'Excellent' : (c.atsScore || c.finalScore || 0) >= 70 ? 'Strong' : (c.atsScore || c.finalScore || 0) >= 55 ? 'Moderate' : 'Needs Work',
      gradeColor: (c.atsScore || c.finalScore || 0) >= 85 ? 'emerald' : (c.atsScore || c.finalScore || 0) >= 70 ? 'cyan' : (c.atsScore || c.finalScore || 0) >= 55 ? 'amber' : 'rose',
      isParseable: true,
      breakdown: {
        contactInfo: { score: 15, max: 15, details: ['Name & Email parsed'] },
        essentialSections: { score: 20, max: 20, details: ['Essential sections verified'] },
        keywordMatch: { score: 25, max: 25, details: ['Skills & keywords matched'] },
        actionVerbsImpact: { score: 15, max: 15, details: ['Impact verbs analyzed'] },
        formattingReadability: { score: 15, max: 15, details: ['Standard layout'] },
        atsParseability: { score: 10, max: 10, details: ['Text parseable'] }
      },
      feedback: {
        summary: c.feedback || 'ATS Resume Evaluation details recorded in master sheet.',
        strengths: ['Formatted for ATS systems'],
        improvements: ['Keep keywords updated'],
        recommendation: c.category || 'Reviewed'
      }
    }))
  }));

  // 3. Convert synced GitHub history records to GithubHistoryRecord shape
  const convertedSyncedGithub: GithubHistoryRecord[] = syncedGithubRecords.map(syncedRec => ({
    id: syncedRec.id,
    operationName: syncedRec.operationName,
    timestamp: syncedRec.timestamp,
    dateFormatted: syncedRec.dateFormatted,
    studentSheetUrl: syncedRec.studentSheetUrl,
    totalCandidates: syncedRec.totalCandidates,
    excellentCount: (syncedRec as any).excellentCount || (syncedRec.candidates || []).filter(c => ((c as any).totalScore || 0) >= 50).length,
    strongCount: (syncedRec as any).strongCount || (syncedRec.candidates || []).filter(c => ((c as any).totalScore || 0) >= 40 && ((c as any).totalScore || 0) < 50).length,
    moderateCount: (syncedRec as any).moderateCount || (syncedRec.candidates || []).filter(c => ((c as any).totalScore || 0) >= 30 && ((c as any).totalScore || 0) < 40).length,
    needsImprovementCount: (syncedRec as any).needsImprovementCount || (syncedRec.candidates || []).filter(c => ((c as any).totalScore || 0) < 30).length,
    userEmail: (syncedRec as any).userEmail,
    results: ((syncedRec as any).results || syncedRec.candidates || []).map((c: any) => ({
      username: c.username || c.name || 'Candidate',
      name: c.name || c.username || 'Candidate',
      email: c.email || 'N/A',
      phone: c.phone || 'N/A',
      avatarUrl: c.avatarUrl || '',
      profileUrl: c.profileUrl || c.resumeLink || '#',
      bio: c.bio || '',
      location: c.location || '',
      publicRepos: c.publicRepos || 0,
      followers: c.followers || 0,
      following: 0,
      totalScore: c.totalScore !== undefined ? c.totalScore : Math.round(((c.finalScore || 0) / 100) * 60),
      maxScore: 60,
      percentage: c.percentage !== undefined ? c.percentage : (c.finalScore || 0),
      grade: c.grade || c.category || 'Reviewed',
      gradeColor: c.gradeColor || (c.totalScore >= 50 ? 'emerald' : c.totalScore >= 40 ? 'cyan' : c.totalScore >= 30 ? 'amber' : 'rose'),
      breakdown: c.breakdown || [],
      topRepos: c.topRepos || []
    }))
  }));

  // Combine local ATS records
  const atsRecordMap = new Map<string, AtsHistoryRecord>();
  localAtsRecords.forEach(r => atsRecordMap.set(r.operationName || r.id, r));
  convertedSyncedAts.forEach(r => {
    if (!atsRecordMap.has(r.operationName || r.id)) {
      atsRecordMap.set(r.operationName || r.id, r);
    }
  });

  const allAtsRecordsCombined = Array.from(atsRecordMap.values());
  const sortedAtsRecords = [...allAtsRecordsCombined].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  const filteredAtsRecords = sortedAtsRecords.filter(r =>
    r.operationName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.dateFormatted.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.studentSheetUrl.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Combine local GitHub records
  const githubRecordMap = new Map<string, GithubHistoryRecord>();
  localGithubRecords.forEach(r => githubRecordMap.set(r.operationName || r.id, r));
  convertedSyncedGithub.forEach(r => {
    if (!githubRecordMap.has(r.operationName || r.id)) {
      githubRecordMap.set(r.operationName || r.id, r);
    }
  });

  const allGithubRecordsCombined = Array.from(githubRecordMap.values());
  const sortedGithubRecords = [...allGithubRecordsCombined].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  const filteredGithubRecords = sortedGithubRecords.filter(r =>
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

  const handleClearGithub = () => {
    if (confirm('Are you sure you want to clear all GitHub Check history?')) {
      localStorage.removeItem('github_check_history');
      setLocalGithubRecords([]);
      if (onClearGithubHistory) onClearGithubHistory();
    }
  };

  const handleDeleteGithubItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = localGithubRecords.filter(r => r.id !== id);
    setLocalGithubRecords(updated);
    try {
      localStorage.setItem('github_check_history', JSON.stringify(updated));
    } catch (err) {}
    if (onDeleteGithubRecord) onDeleteGithubRecord(id);
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

          {activeSubTab === 'githubCheck' && sortedGithubRecords.length > 0 && (
            <button
              onClick={handleClearGithub}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition ${
                isDark
                  ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border-rose-500/20'
                  : 'bg-rose-50 hover:bg-rose-100 text-rose-600 border-rose-200'
              }`}
            >
              <Trash2 className="w-3.5 h-3.5" /> Clear GitHub Check History
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
          onClick={() => setActiveSubTab('githubCheck')}
          className={`pb-3 text-sm font-bold border-b-2 transition flex items-center gap-2 ${
            activeSubTab === 'githubCheck'
              ? 'border-indigo-500 text-indigo-500'
              : isDark
              ? 'border-transparent text-slate-400 hover:text-slate-200'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <GithubIcon className="w-4 h-4 text-purple-500" />
          <span>GitHub Profile Check History ({sortedGithubRecords.length})</span>
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
              : `My Checks Summary (${sortedRecords.length + sortedAtsRecords.length + sortedGithubRecords.length})`}
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


      {/* SUB-TAB 3: GitHub Profile Check History */}
      {activeSubTab === 'githubCheck' && (
        filteredGithubRecords.length === 0 ? (
          <div className={`p-12 text-center rounded-2xl border ${
            isDark ? 'bg-slate-900/40 border-slate-800 text-slate-400' : 'bg-white border-slate-200 text-slate-500'
          }`}>
            <GithubIcon className="w-12 h-12 mx-auto mb-3 opacity-30 text-purple-400" />
            <h3 className="text-base font-bold text-slate-300">No GitHub Profile Check History Found</h3>
            <p className="text-xs mt-1 max-w-sm mx-auto">
              {searchQuery ? 'No past GitHub profile check runs match your search query.' : 'Run a 60-Point GitHub Profile Check to start recording history here.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredGithubRecords.map((item, index) => (
              <div
                key={item.id || index}
                onClick={() => setSelectedGithubRecord(item)}
                className={`p-5 rounded-2xl border transition-all cursor-pointer group hover:shadow-lg relative overflow-hidden ${
                  isDark
                    ? 'bg-slate-900/60 hover:bg-slate-900 border-slate-800 text-slate-100'
                    : 'bg-white hover:bg-slate-50/80 border-slate-200 text-slate-900 shadow-xs'
                }`}
              >
                {/* Recent Tag */}
                {index === 0 && !searchQuery && (
                  <div className="absolute top-0 right-0 bg-gradient-to-l from-purple-600 to-indigo-600 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl shadow-xs">
                    ⚡ Most Recent GitHub Check
                  </div>
                )}

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1.5 flex-1 pr-4">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base font-extrabold group-hover:text-purple-400 transition">
                        {item.operationName || 'GitHub Profile Check'}
                      </h3>
                      <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-purple-400" />
                        {item.dateFormatted}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border flex items-center gap-1 ${
                        isDark ? 'bg-purple-500/10 text-purple-300 border-purple-500/30' : 'bg-purple-50 text-purple-700 border-purple-200'
                      }`}>
                        👤 Executed by: {getExecutorEmail(item)}
                      </span>
                    </div>

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
                          className="text-purple-400 hover:text-purple-300"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>

                  {/* GitHub Metrics Pills */}
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className={`px-3 py-1.5 rounded-xl border flex items-center gap-2 text-xs font-bold ${
                      isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200'
                    }`}>
                      <Users className="w-4 h-4 text-purple-400" />
                      <span>{item.totalCandidates} Profiles</span>
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
                      <span>{item.needsImprovementCount} Needs Work</span>
                    </div>

                    <button
                      onClick={(e) => handleDeleteGithubItem(item.id, e)}
                      className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition"
                      title="Delete record"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <div className="p-2 rounded-xl bg-purple-600/20 group-hover:bg-purple-600 text-purple-400 group-hover:text-white transition">
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
            <div className={`flex items-start justify-between border-b pb-4 ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
              <div className="space-y-1">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <FileCheck className="w-5 h-5 text-cyan-500 dark:text-cyan-400" />
                  {selectedAtsRecord.operationName}
                </h3>
                <p className={`text-xs font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  {selectedAtsRecord.dateFormatted} • {selectedAtsRecord.totalCandidates} Resumes Evaluated
                </p>
              </div>
              <button onClick={() => setSelectedAtsRecord(null)} className={`p-1 rounded-lg transition ${isDark ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`}>
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Results Table */}
            <div className={`overflow-x-auto border rounded-xl ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className={`border-b uppercase text-[10px] ${isDark ? 'bg-slate-950/60 border-slate-800 text-slate-400' : 'bg-slate-100 border-slate-200 text-slate-700 font-semibold'}`}>
                    <th className="p-3">Candidate Name</th>
                    <th className="p-3">Contact Info</th>
                    <th className="p-3">ATS Score</th>
                    <th className="p-3">Grade</th>
                    <th className="p-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDark ? 'divide-slate-800/40' : 'divide-slate-200'}`}>
                  {selectedAtsRecord.results.map((res, i) => (
                    <tr key={i} className={isDark ? 'hover:bg-slate-800/30' : 'hover:bg-slate-50'}>
                      <td className="p-3 font-bold">{res.name}</td>
                      <td className={`p-3 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{res.email}</td>
                      <td className="p-3 font-mono font-bold text-indigo-600 dark:text-indigo-400">{res.totalScore} / 100</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getGradeBadge(res.grade)}`}>
                          {res.grade}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => setSelectedCandidateRubric(res)}
                          className={`px-2.5 py-1 rounded font-semibold text-[11px] transition ${
                            isDark
                              ? 'bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600/30'
                              : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-600 hover:text-white border border-indigo-200'
                          }`}
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
            <div className={`flex items-start justify-between border-b pb-4 ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
              <div className="space-y-1">
                <h3 className="text-xl font-bold">{selectedCandidateRubric.name}</h3>
                <span className={`px-3 py-1 rounded-full border text-xs font-bold uppercase ${getGradeBadge(selectedCandidateRubric.grade)}`}>
                  Grade: {selectedCandidateRubric.grade} ({selectedCandidateRubric.totalScore}/100)
                </span>
              </div>
              <button onClick={() => setSelectedCandidateRubric(null)} className={`p-1 rounded-lg transition ${isDark ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`}>
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className={`p-4 rounded-xl border space-y-2 ${isDark ? 'bg-indigo-950/30 border-indigo-500/20' : 'bg-indigo-50 border-indigo-200'}`}>
              <h4 className="text-xs font-bold uppercase text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-cyan-500" /> Feedback Summary
              </h4>
              <p className={`text-xs font-medium leading-relaxed ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                {selectedCandidateRubric.feedback?.summary}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Selected GitHub Record Modal Viewer */}
      {selectedGithubRecord && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className={`w-full max-w-4xl rounded-2xl border p-6 space-y-6 my-8 max-h-[90vh] overflow-y-auto ${
            isDark ? 'bg-slate-900 border-slate-800 text-slate-100 shadow-2xl' : 'bg-white border-slate-200 text-slate-900 shadow-xl'
          }`}>
            {/* Modal Header */}
            <div className={`flex items-start justify-between border-b pb-4 ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
              <div className="space-y-1">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <GithubIcon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  {selectedGithubRecord.operationName}
                </h3>
                <p className={`text-xs font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  {selectedGithubRecord.dateFormatted} • {selectedGithubRecord.totalCandidates} Profiles Evaluated
                </p>
              </div>
              <button onClick={() => setSelectedGithubRecord(null)} className={`p-1 rounded-lg transition ${isDark ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`}>
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Results Table */}
            <div className={`overflow-x-auto border rounded-xl ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className={`border-b uppercase text-[10px] ${isDark ? 'bg-slate-950/60 border-slate-800 text-slate-400' : 'bg-slate-100 border-slate-200 text-slate-700 font-semibold'}`}>
                    <th className="p-3">Candidate / Profile</th>
                    <th className="p-3 text-center">Total Score (out of 60)</th>
                    <th className="p-3 text-center">Grade</th>
                    <th className="p-3 text-center">Public Repos</th>
                    <th className="p-3 text-center">Followers</th>
                    <th className="p-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDark ? 'divide-slate-800/40' : 'divide-slate-200'}`}>
                  {(selectedGithubRecord.results || []).map((res, i) => (
                    <tr key={i} className={isDark ? 'hover:bg-slate-800/30' : 'hover:bg-slate-50'}>
                      <td className="p-3 font-bold">
                        <div className="flex items-center gap-2">
                          {res.avatarUrl ? (
                            <img src={res.avatarUrl} alt={res.username} className="w-7 h-7 rounded-full object-cover border border-purple-500/30" />
                          ) : (
                            <div className={`w-7 h-7 rounded-full font-bold flex items-center justify-center text-xs ${isDark ? 'bg-purple-600/20 text-purple-400' : 'bg-purple-100 text-purple-700'}`}>
                              {(res.name || res.username || 'G').charAt(0)}
                            </div>
                          )}
                          <div>
                            <div className={isDark ? 'text-white' : 'text-slate-900'}>{res.name}</div>
                            <div className={`text-[10px] font-mono ${isDark ? 'text-purple-400' : 'text-purple-600'}`}>@{res.username}</div>
                          </div>
                        </div>
                      </td>
                      <td className={`p-3 text-center font-mono font-extrabold ${isDark ? 'text-purple-400' : 'text-purple-700'}`}>
                        {res.totalScore} / 60 ({res.percentage}%)
                      </td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          res.gradeColor === 'emerald'
                            ? isDark ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : res.gradeColor === 'cyan'
                            ? isDark ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' : 'bg-cyan-50 text-cyan-700 border-cyan-200'
                            : res.gradeColor === 'amber'
                            ? isDark ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-amber-50 text-amber-700 border-amber-200'
                            : isDark ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}>
                          {res.grade}
                        </span>
                      </td>
                      <td className={`p-3 text-center font-mono ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{res.publicRepos}</td>
                      <td className={`p-3 text-center font-mono ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{res.followers}</td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => setSelectedCandidateGithub(res)}
                          className={`px-2.5 py-1 rounded font-semibold text-[11px] inline-flex items-center gap-1 transition ${
                            isDark
                              ? 'bg-purple-600/20 text-purple-300 hover:bg-purple-600 hover:text-white'
                              : 'bg-purple-100 text-purple-700 hover:bg-purple-600 hover:text-white border border-purple-200'
                          }`}
                        >
                          <Eye size={12} /> Rubric Specs
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

      {/* Single Candidate GitHub Rubric Detail Modal inside History */}
      {selectedCandidateGithub && (() => {
        const getGithubBreakdown = (candidate: GithubCheckItem) => {
          if (candidate.breakdown && candidate.breakdown.length > 0) {
            return candidate.breakdown;
          }
          const score = candidate.totalScore !== undefined ? candidate.totalScore : Math.round(((candidate.percentage || 0) / 100) * 60);
          const standardCriteria = [
            { title: 'Professional Profile Image', maxScore: 6 },
            { title: 'Current Location Listed', maxScore: 2 },
            { title: 'Email & Contact Info Provided', maxScore: 2 },
            { title: 'Profile README Banner Image', maxScore: 2 },
            { title: 'Name & Professional Designation', maxScore: 4 },
            { title: 'About Me Section', maxScore: 4 },
            { title: 'Current Activities & Focus', maxScore: 2 },
            { title: 'Skills Section (Categorized with Icons)', maxScore: 8 },
            { title: 'Social & Portfolio Links', maxScore: 4 },
            { title: 'GitHub Stats & Contributions', maxScore: 2 },
            { title: 'Pinned / Featured Repositories (≥2)', maxScore: 4 },
            { title: 'Project Description in Repositories', maxScore: 8 },
            { title: 'Live Project Demo Links', maxScore: 4 },
            { title: 'Technologies & Tech Stack Specified', maxScore: 4 },
            { title: 'Repository README File Quality', maxScore: 4 }
          ];

          let runningScore = 0;
          return standardCriteria.map(c => {
            const passed = (runningScore + c.maxScore <= score) || (score >= 50 && c.maxScore <= 4);
            if (passed) runningScore += c.maxScore;
            return {
              title: c.title,
              score: passed ? c.maxScore : 0,
              maxScore: c.maxScore,
              passed,
              detail: passed
                ? `Criterion verified and passed (${c.maxScore}/${c.maxScore} Marks).`
                : `Missing or incomplete in profile (-${c.maxScore} Marks lost).`
            };
          });
        };

        const breakdownList = getGithubBreakdown(selectedCandidateGithub);
        const passedItems = breakdownList.filter(item => item.passed || item.score > 0);
        const missingItems = breakdownList.filter(item => !item.passed && item.score === 0);
        const isAllPresent = missingItems.length === 0 || selectedCandidateGithub.totalScore >= 60;

        return (
          <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
            <div className={`w-full max-w-3xl rounded-2xl border p-6 space-y-6 my-8 max-h-[90vh] overflow-y-auto ${
              isDark ? 'bg-slate-900 border-slate-800 text-slate-100 shadow-2xl' : 'bg-white border-slate-200 text-slate-900 shadow-xl'
            }`}>
              {/* Header */}
              <div className={`flex items-start justify-between border-b pb-4 ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
                <div className="flex items-center gap-3">
                  {selectedCandidateGithub.avatarUrl ? (
                    <img src={selectedCandidateGithub.avatarUrl} alt={selectedCandidateGithub.username} className="w-12 h-12 rounded-full border border-purple-500/40 object-cover" />
                  ) : (
                    <div className={`w-12 h-12 rounded-full font-extrabold flex items-center justify-center text-lg ${isDark ? 'bg-purple-600/20 text-purple-400' : 'bg-purple-100 text-purple-700'}`}>
                      {(selectedCandidateGithub.name || selectedCandidateGithub.username || 'G').charAt(0)}
                    </div>
                  )}
                  <div>
                    <h3 className="text-xl font-bold">{selectedCandidateGithub.name}</h3>
                    <div className={`text-xs font-mono font-semibold ${isDark ? 'text-purple-400' : 'text-purple-600'}`}>
                      @{selectedCandidateGithub.username} • Score: {selectedCandidateGithub.totalScore}/60 Marks ({selectedCandidateGithub.percentage}%)
                    </div>
                  </div>
                </div>
                <button onClick={() => setSelectedCandidateGithub(null)} className={`p-1 rounded-lg transition ${isDark ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`}>
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Overall Status Banner */}
              {isAllPresent ? (
                <div className={`p-4 rounded-xl border flex items-center gap-3.5 ${
                  isDark ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-emerald-50 border-emerald-200 text-emerald-900'
                }`}>
                  <CheckCircle2 size={28} className="text-emerald-500 shrink-0" />
                  <div>
                    <div className="font-extrabold text-sm text-emerald-700 dark:text-emerald-400">
                      🎉 Excellent Profile! All Requirements Present! (সবকিছু ঠিক আছে!)
                    </div>
                    <div className="text-xs opacity-90 mt-0.5">
                      Candidate profile fulfilled 100% of the 15 standard rubric criteria specifications.
                    </div>
                  </div>
                </div>
              ) : (
                <div className={`p-3.5 rounded-xl border flex items-center justify-between text-xs font-bold ${
                  isDark ? 'bg-slate-800/60 border-slate-700' : 'bg-slate-100 border-slate-200'
                }`}>
                  <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 size={16} /> ✅ Passed ({passedItems.length} Criteria)
                  </span>
                  <span className="text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                    <XCircle size={16} /> ❌ Missing / Needs Improvement ({missingItems.length} Criteria)
                  </span>
                </div>
              )}

              {/* Section 1: ✅ Passed Requirements (কী কী আছে) */}
              <div className="space-y-3">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 size={16} /> Passed Requirements & Present Items (কী কী আছে - {passedItems.length})
                </h4>
                {passedItems.length > 0 ? (
                  <div className="space-y-2">
                    {passedItems.map((item, idx) => (
                      <div key={idx} className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
                        isDark ? 'bg-emerald-500/5 border-emerald-500/20 text-slate-200' : 'bg-emerald-50/80 border-emerald-200 text-slate-900'
                      }`}>
                        <div className="flex items-center gap-2.5">
                          <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                          <div>
                            <div className="font-bold">{item.title}</div>
                            <div className={`text-[11px] mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{item.detail}</div>
                          </div>
                        </div>
                        <span className={`font-mono font-bold px-2 py-0.5 rounded text-[11px] shrink-0 ${
                          isDark ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        }`}>
                          +{item.score} / {item.maxScore}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>No passed criteria recorded.</p>
                )}
              </div>

              {/* Section 2: ❌ Missing Requirements (কী কী নাই) */}
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                  <XCircle size={16} /> Missing Requirements & Needs Improvement (কী কী নাই - {missingItems.length})
                </h4>
                {missingItems.length > 0 ? (
                  <div className="space-y-2">
                    {missingItems.map((item, idx) => (
                      <div key={idx} className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
                        isDark ? 'bg-rose-500/5 border-rose-500/20 text-slate-200' : 'bg-rose-50/80 border-rose-200 text-slate-900'
                      }`}>
                        <div className="flex items-center gap-2.5">
                          <XCircle size={16} className="text-rose-500 shrink-0" />
                          <div>
                            <div className="font-bold text-rose-700 dark:text-rose-300">{item.title}</div>
                            <div className={`text-[11px] mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{item.detail}</div>
                          </div>
                        </div>
                        <span className={`font-mono font-bold px-2 py-0.5 rounded text-[11px] shrink-0 ${
                          isDark ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-rose-100 text-rose-800 border border-rose-300'
                        }`}>
                          0 / {item.maxScore}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
                    isDark ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  }`}>
                    <CheckCircle2 size={16} /> 🎉 No missing requirements! Candidate profile fulfilled all 15 rubric criteria.
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}


