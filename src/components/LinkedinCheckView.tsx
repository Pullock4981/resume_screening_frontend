'use client';

import React, { useState } from 'react';
import {
  Link2,
  FileText,
  Play,
  Award,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ExternalLink,
  ChevronRight,
  X,
  Sparkles,
  Copy,
  Check,
  Star,
  UserCheck,
  Eye,
  Download,
  Search,
  Filter
} from 'lucide-react';
import { LinkedinCheckItem } from '../types';
import ProgressBar from './ProgressBar';
import { useAuth } from '../context/AuthContext';

export const LinkedinIcon = ({ size = 20, className = '' }: { size?: number; className?: string }) => (
  <svg width={size} height={size} className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"/>
  </svg>
);

interface LinkedinCheckViewProps {
  theme?: 'dark' | 'light';
  onSaveHistoryRecord?: (record: any) => void;
}

export function normalizeLinkedinResult(item: LinkedinCheckItem): LinkedinCheckItem {
  if (!item) return item;
  const rawBreakdown = item.breakdown || [];
  const normalizedBreakdown = rawBreakdown.map((crit) => {
    // If present or passed -> award full marks (maxScore), otherwise 0. No partial marks!
    const isPresent = Boolean(crit.passed || (crit.score !== undefined && crit.score > 0) || crit.status === 'pass');
    return {
      ...crit,
      passed: isPresent,
      score: isPresent ? crit.maxScore : 0,
      status: isPresent ? ('pass' as const) : ('fail' as const)
    };
  });

  const totalScore = normalizedBreakdown.length > 0
    ? normalizedBreakdown.reduce((sum, b) => sum + (b.score || 0), 0)
    : item.totalScore;
  const percentage = Math.round((totalScore / 60) * 100);
  const grade = totalScore >= 50 ? 'Excellent Profile' : totalScore >= 40 ? 'Strong Profile' : totalScore >= 30 ? 'Moderate Profile' : 'Needs Improvement';
  const gradeColor = totalScore >= 50 ? 'emerald' : totalScore >= 40 ? 'indigo' : totalScore >= 30 ? 'amber' : 'rose';
  const passedCount = normalizedBreakdown.filter(b => b.passed).length;
  const missingCount = normalizedBreakdown.filter(b => !b.passed).length;

  return {
    ...item,
    breakdown: normalizedBreakdown,
    totalScore,
    percentage,
    grade,
    gradeColor,
    passedCount,
    missingCount,
    partialCount: 0
  };
}

const DEFAULT_MASTER_SHEET = 'https://docs.google.com/spreadsheets/d/1O84kcu_A4V4Chsb6TPQEwGNxhuqu1Qml431I7yEQu3I/edit?gid=0#gid=0';

export default function LinkedinCheckView({ theme = 'light', onSaveHistoryRecord }: LinkedinCheckViewProps) {
  const isDark = theme === 'dark';
  const { token } = useAuth();

  const [inputUrl, setInputUrl] = useState('');
  const masterSheetUrl = DEFAULT_MASTER_SHEET;
  const [operationName, setOperationName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [progress, setProgress] = useState({ completed: 0, total: 0, currentCandidate: '' });
  const [results, setResults] = useState<LinkedinCheckItem[]>([]);
  const [selectedResult, setSelectedResult] = useState<LinkedinCheckItem | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterGrade, setFilterGrade] = useState<'all' | 'excellent' | 'strong' | 'moderate' | 'improvement'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const getBackendUrl = () => {
    if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
      return 'http://localhost:5000';
    }
    return process.env.NEXT_PUBLIC_BACKEND_URL || 'https://resume-screening-backend.vercel.app';
  };

  const saveRecord = (resList: LinkedinCheckItem[]) => {
    if (!resList || resList.length === 0) return;
    const normalizedList = resList.map(normalizeLinkedinResult);
    const now = new Date();
    const opTitle = operationName.trim() || (inputUrl.includes('docs.google.com') ? 'LinkedIn Check (Batch Sheet)' : 'LinkedIn Check (Single Profile)');
    const record = {
      id: `li_${Date.now()}`,
      operationName: opTitle,
      timestamp: now.toISOString(),
      dateFormatted: now.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }),
      studentSheetUrl: inputUrl.trim(),
      totalCandidates: normalizedList.length,
      excellentCount: normalizedList.filter(r => (r.totalScore || 0) >= 50).length,
      strongCount: normalizedList.filter(r => (r.totalScore || 0) >= 40 && (r.totalScore || 0) < 50).length,
      moderateCount: normalizedList.filter(r => (r.totalScore || 0) >= 30 && (r.totalScore || 0) < 40).length,
      needsImprovementCount: normalizedList.filter(r => (r.totalScore || 0) < 30).length,
      results: normalizedList
    };

    try {
      const existing = localStorage.getItem('linkedin_check_history');
      const list = existing ? JSON.parse(existing) : [];
      const updated = [record, ...list];
      localStorage.setItem('linkedin_check_history', JSON.stringify(updated));
      if (onSaveHistoryRecord) {
        onSaveHistoryRecord(record);
      }
    } catch (e) {
      console.error('Failed to save LinkedIn history record:', e);
    }
  };

  const handleEvaluate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputUrl.trim()) {
      alert('Please enter a Candidate Google Sheet URL or LinkedIn Profile URL/Username.');
      return;
    }

    setIsLoading(true);
    setIsFinished(false);
    setErrorMessage(null);
    setResults([]);
    setCurrentPage(1);
    setProgress({ completed: 0, total: 0, currentCandidate: '' });

    const isSheet = inputUrl.includes('docs.google.com/spreadsheets');
    const payload = isSheet
      ? { sheetUrl: inputUrl.trim(), masterSheetUrl: masterSheetUrl.trim(), operationName: operationName.trim() }
      : { linkedinUrl: inputUrl.trim(), masterSheetUrl: masterSheetUrl.trim(), operationName: operationName.trim() };

    const backendUrl = getBackendUrl();

    try {
      const response = await fetch(`${backendUrl}/api/linkedin-check`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Failed to contact backend LinkedIn check endpoint (${response.status}).`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';
      let finalResults: LinkedinCheckItem[] = [];

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (!line.trim()) continue;
            try {
              const chunk = JSON.parse(line);
              if (chunk.status === 'started') {
                setProgress({ completed: 0, total: chunk.total || 0, currentCandidate: 'Initializing high-speed LinkedIn rubric evaluators...' });
              } else if (chunk.status === 'processing') {
                setProgress({
                  completed: chunk.completed,
                  total: chunk.total,
                  currentCandidate: chunk.currentCandidate
                });
                if (chunk.result) {
                  setResults(prev => {
                    const norm = normalizeLinkedinResult(chunk.result);
                    const filtered = prev.filter(p => p.profileUrl !== norm.profileUrl || p.name !== norm.name);
                    return [norm, ...filtered].slice(0, 50);
                  });
                }
              } else if (chunk.status === 'completed') {
                if (chunk.data && chunk.data.results) {
                  finalResults = (chunk.data.results || []).map(normalizeLinkedinResult);
                  setResults(finalResults);
                }
              } else if (chunk.status === 'error') {
                throw new Error(chunk.error || 'LinkedIn evaluation error.');
              }
            } catch (err: any) {
              if (err.message.includes('JSON')) continue;
              throw err;
            }
          }
        }
      }

      setIsFinished(true);
      if (finalResults.length > 0) {
        saveRecord(finalResults);
      }
    } catch (err: any) {
      console.error('LinkedIn Evaluation Error:', err);
      const msg = err.message || '';
      if (msg.includes('Failed to fetch') || msg.includes('network error')) {
        setErrorMessage('Google Sheet Access Error: Please verify the Google Sheet URL is shared (Anyone with link can view).');
      } else {
        setErrorMessage(msg || 'An unexpected error occurred during LinkedIn profile check.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyFeedback = (rawItem: LinkedinCheckItem) => {
    const item = normalizeLinkedinResult(rawItem);
    const feedbackText = `=== LinkedIn Profile Audit: ${item.name || item.username} ===
Total Score: ${item.totalScore}/60 (${item.percentage}%) - ${item.grade}
Profile URL: ${item.profileUrl}

CRITERIA BREAKDOWN (Total: 60 Marks):
${(item.breakdown || []).map((b, idx) => `${idx + 1}. ${b.criterion}: ${b.score}/${b.maxScore} (${b.passed ? 'PASSED' : 'NEEDS IMPROVEMENT'})
   Feedback: ${b.detail}`).join('\n\n')}`;

    navigator.clipboard.writeText(feedbackText);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleExportCSV = () => {
    if (results.length === 0) return;
    const normalized = results.map(normalizeLinkedinResult);
    const headers = ['Candidate Name', 'LinkedIn URL', 'Score (out of 60)', 'Percentage', 'Grade', 'Present Criteria', 'Missing Criteria'];
    const rows = normalized.map(r => [
      `"${r.name || r.username}"`,
      `"${r.profileUrl}"`,
      r.totalScore,
      `${r.percentage}%`,
      `"${r.grade}"`,
      `"${(r.presentItems || '').replace(/"/g, '""')}"`,
      `"${(r.missingItems || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `LinkedIn_Check_Results_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const normalizedResults = results.map(normalizeLinkedinResult);

  const filteredResults = normalizedResults.filter(r => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = (r.name || '').toLowerCase().includes(q) ||
      (r.username || '').toLowerCase().includes(q) ||
      (r.profileUrl || '').toLowerCase().includes(q);

    let matchesGrade = true;
    if (filterGrade === 'excellent') matchesGrade = r.totalScore >= 50;
    else if (filterGrade === 'strong') matchesGrade = r.totalScore >= 40 && r.totalScore < 50;
    else if (filterGrade === 'moderate') matchesGrade = r.totalScore >= 30 && r.totalScore < 40;
    else if (filterGrade === 'improvement') matchesGrade = r.totalScore < 30;

    return matchesSearch && matchesGrade;
  });

  const effectivePageSize = pageSize === -1 ? filteredResults.length || 1 : pageSize;
  const totalPages = Math.max(1, Math.ceil(filteredResults.length / effectivePageSize));
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);
  const paginatedResults = pageSize === -1 
    ? filteredResults 
    : filteredResults.slice((safeCurrentPage - 1) * pageSize, safeCurrentPage * pageSize);

  const startRecordIdx = filteredResults.length === 0 ? 0 : (safeCurrentPage - 1) * effectivePageSize + 1;
  const endRecordIdx = Math.min(safeCurrentPage * effectivePageSize, filteredResults.length);

  const excellentCount = normalizedResults.filter(r => r.totalScore >= 50).length;
  const strongCount = normalizedResults.filter(r => r.totalScore >= 40 && r.totalScore < 50).length;
  const moderateCount = normalizedResults.filter(r => r.totalScore >= 30 && r.totalScore < 40).length;
  const improvementCount = normalizedResults.filter(r => r.totalScore < 30).length;

  return (
    <div className="space-y-8 animate-fadeIn pb-12">
      {/* Header Banner */}
      <div className={`p-6 sm:p-8 rounded-2xl border transition-all duration-300 relative overflow-hidden ${
        isDark
          ? 'bg-slate-900/80 border-slate-800 text-white shadow-xl backdrop-blur-md'
          : 'bg-white border-slate-200 text-slate-900 shadow-md'
      }`}>
        <div className="absolute -right-10 -bottom-10 opacity-10 pointer-events-none">
          <LinkedinIcon size={240} className={isDark ? 'text-indigo-500/20' : 'text-indigo-600/15'} />
        </div>

        <div className="relative z-10 max-w-3xl">
          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-4 border ${
            isDark ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400' : 'bg-indigo-50 border-indigo-200 text-indigo-700'
          }`}>
            <UserCheck size={14} /> 60-Point Standard LinkedIn Profile Rubric (16 Checkpoints)
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight mb-3">
            LinkedIn Profile <span className="text-indigo-600 dark:text-indigo-400">Auditor</span>
          </h1>
          <p className={`text-sm sm:text-base leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
            Audit candidate LinkedIn profiles against 16 quantitative criteria (Photo, Cover banner, Headline, Custom URL, About section, Experience, 12+ Skills, Featured Projects, Media, Certifications, Education & Languages).
          </p>
        </div>
      </div>

      {/* Input Form Card */}
      <div className={`p-6 rounded-2xl border ${
        isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
      }`}>
        <form onSubmit={handleEvaluate} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className={`block text-xs font-semibold uppercase tracking-wider mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                Candidate Sheet URL or LinkedIn Profile URL / Username <span className="text-indigo-600 dark:text-indigo-400">*</span>
              </label>
              <div className="relative">
                <LinkedinIcon size={18} className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
                <input
                  type="text"
                  value={inputUrl}
                  onChange={(e) => setInputUrl(e.target.value)}
                  placeholder="https://docs.google.com/spreadsheets/d/... OR https://linkedin.com/in/username"
                  required
                  className={`w-full pl-10 pr-4 py-3 rounded-xl border text-sm transition-all outline-none ${
                    isDark
                      ? 'bg-slate-900 border-slate-700 text-white placeholder-slate-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500'
                      : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500'
                  }`}
                />
              </div>
              <p className={`text-xs mt-1.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Accepts single LinkedIn URL (e.g. linkedin.com/in/yourname) or batch candidate Google Sheet.
              </p>
            </div>

            <div>
              <label className={`block text-xs font-semibold uppercase tracking-wider mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                Operation Title (Optional)
              </label>
              <input
                type="text"
                value={operationName}
                onChange={(e) => setOperationName(e.target.value)}
                placeholder="e.g., MERN Batch 12 LinkedIn Audit"
                className={`w-full px-4 py-3 rounded-xl border text-sm transition-all outline-none ${
                  isDark
                    ? 'bg-slate-900 border-slate-700 text-white placeholder-slate-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500'
                    : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500'
                }`}
              />
              <p className={`text-xs mt-1.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Syncs evaluated candidate scorecard directly with Master Google Sheet.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
              <Sparkles className="w-4 h-4 text-indigo-500" />
              <span>0% AI Tokens - Deterministic 16-Checkpoint Scoring Engine</span>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`px-6 py-3 rounded-xl text-white font-bold text-sm flex items-center gap-2 transition shadow-md cursor-pointer ${
                isLoading
                  ? 'bg-indigo-600/50 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98]'
              }`}
            >
              <Play size={16} fill="currentColor" />
              <span>{isLoading ? 'Auditing LinkedIn Profiles...' : 'Run LinkedIn Evaluation'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Error Message */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-sm font-semibold flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)} className="hover:opacity-70 cursor-pointer">✕</button>
        </div>
      )}

      {/* Real-time Progress Bar */}
      {(isLoading || progress.total > 0) && (
        <ProgressBar
          completed={progress.completed}
          total={progress.total}
          currentCandidate={progress.currentCandidate}
          isFinished={isFinished}
          theme={theme}
        />
      )}

      {/* Summary Score Metric Cards */}
      {results.length > 0 && (
        <div className="space-y-6 animate-fadeIn">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
            <div className={`p-4 rounded-xl border ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200 shadow-xs'}`}>
              <div className="text-[11px] font-bold text-slate-500 uppercase">Evaluated</div>
              <div className="text-2xl font-black mt-1 text-slate-900 dark:text-white">{results.length}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Profiles Processed</div>
            </div>

            <div className={`p-4 rounded-xl border ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200 shadow-xs'}`}>
              <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase">Excellent (50-60)</div>
              <div className="text-2xl font-black mt-1 text-emerald-600 dark:text-emerald-400">{excellentCount}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Top Tier Ready</div>
            </div>

            <div className={`p-4 rounded-xl border ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200 shadow-xs'}`}>
              <div className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 uppercase">Strong (40-49)</div>
              <div className="text-2xl font-black mt-1 text-indigo-600 dark:text-indigo-400">{strongCount}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Solid Profiles</div>
            </div>

            <div className={`p-4 rounded-xl border ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200 shadow-xs'}`}>
              <div className="text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase">Moderate (30-39)</div>
              <div className="text-2xl font-black mt-1 text-amber-600 dark:text-amber-400">{moderateCount}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Minor Fixes Needed</div>
            </div>

            <div className={`p-4 rounded-xl border ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200 shadow-xs'}`}>
              <div className="text-[11px] font-bold text-rose-600 dark:text-rose-400 uppercase">Needs Work (&lt;30)</div>
              <div className="text-2xl font-black mt-1 text-rose-600 dark:text-rose-400">{improvementCount}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Critical Gaps</div>
            </div>
          </div>

          {/* Results Table Section */}
          <div className={`p-6 rounded-2xl border ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-5">
              <div>
                <h3 className="text-lg font-bold">LinkedIn Evaluation Results ({filteredResults.length})</h3>
                <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Click &apos;View Scorecard&apos; to view all 16 criteria breakdown and personalized feedback.
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={handleExportCSV}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-1.5 transition cursor-pointer ${
                    isDark ? 'border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200' : 'border-slate-300 bg-white hover:bg-slate-50 text-slate-700 shadow-2xs'
                  }`}
                >
                  <Download className="w-3.5 h-3.5" /> Export CSV
                </button>
              </div>
            </div>

            {/* Filter and Search Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-4">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by candidate name or LinkedIn URL..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`w-full pl-9 pr-4 py-2 rounded-xl border text-xs outline-none transition ${
                    isDark ? 'bg-slate-900 border-slate-800 text-white placeholder-slate-500' : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'
                  }`}
                />
              </div>

              <div className={`flex items-center p-1 rounded-xl border text-xs font-semibold gap-1 shrink-0 ${
                isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
              }`}>
                {(['all', 'excellent', 'strong', 'moderate', 'improvement'] as const).map(gr => (
                  <button
                    key={gr}
                    onClick={() => setFilterGrade(gr)}
                    className={`px-2.5 py-1 rounded-lg capitalize transition text-xs font-bold cursor-pointer ${
                      filterGrade === gr
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : isDark
                        ? 'text-slate-400 hover:text-white'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {gr === 'all' ? 'All' : gr === 'improvement' ? 'Needs Work' : gr}
                  </button>
                ))}
              </div>
            </div>

            {/* Results Table */}
            <div className="overflow-x-auto border rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className={`border-b uppercase text-[10px] font-bold ${
                    isDark ? 'bg-slate-950 border-slate-800 text-slate-400' : 'bg-slate-100 border-slate-200 text-slate-700'
                  }`}>
                    <th className="p-3.5 whitespace-nowrap">Candidate</th>
                    <th className="p-3.5 whitespace-nowrap">LinkedIn URL</th>
                    <th className="p-3.5 whitespace-nowrap">Score (60)</th>
                    <th className="p-3.5 whitespace-nowrap">Grade</th>
                    <th className="p-3.5 whitespace-nowrap">Check Summary</th>
                    <th className="p-3.5 text-right whitespace-nowrap">Actions</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDark ? 'divide-slate-800/40' : 'divide-slate-200'}`}>
                  {paginatedResults.length === 0 ? (
                    <tr>
                      <td colSpan={6} className={`p-8 text-center ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        No candidate LinkedIn results found matching current criteria.
                      </td>
                    </tr>
                  ) : (
                    paginatedResults.map((item, idx) => {
                      const gradeBadgeColor =
                        item.totalScore >= 50
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                          : item.totalScore >= 40
                          ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30'
                          : item.totalScore >= 30
                          ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
                          : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30';

                      return (
                        <tr key={item.id || idx} className={`transition ${isDark ? 'hover:bg-indigo-500/5' : 'hover:bg-indigo-50/50'}`}>
                          <td className="p-3.5 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs shrink-0">
                                {item.name ? item.name.charAt(0).toUpperCase() : 'L'}
                              </div>
                              <div>
                                <div className="font-bold text-slate-900 dark:text-white">{item.name || item.username}</div>
                                {item.headline && (
                                  <div className="text-[10px] text-slate-400 truncate max-w-[200px]">{item.headline}</div>
                                )}
                              </div>
                            </div>
                          </td>

                          <td className="p-3.5 whitespace-nowrap">
                            <a
                              href={item.profileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-mono text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                            >
                              <span className="truncate max-w-[180px]">{item.profileUrl.replace('https://www.', '')}</span>
                              <ExternalLink className="w-3 h-3 shrink-0" />
                            </a>
                          </td>

                          <td className="p-3.5 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <span className="font-black text-sm text-slate-900 dark:text-white">{item.totalScore}</span>
                              <span className="text-[11px] text-slate-400">/ 60</span>
                              <div className="w-16 h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden ml-1">
                                <div
                                  className={`h-full rounded-full ${
                                    item.totalScore >= 50 ? 'bg-emerald-500' : item.totalScore >= 40 ? 'bg-indigo-500' : item.totalScore >= 30 ? 'bg-amber-500' : 'bg-rose-500'
                                  }`}
                                  style={{ width: `${Math.min(item.percentage, 100)}%` }}
                                />
                              </div>
                              <span className="text-[10px] font-bold text-slate-400">{item.percentage}%</span>
                            </div>
                          </td>

                          <td className="p-3.5 whitespace-nowrap">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border inline-flex items-center gap-1 whitespace-nowrap shrink-0 ${gradeBadgeColor}`}>
                              {item.grade}
                            </span>
                          </td>

                          <td className="p-3.5 whitespace-nowrap">
                            <div className="flex items-center gap-2 text-[11px]">
                              <span className="text-emerald-600 dark:text-emerald-400 font-bold">✓ {item.passedCount || 0} Passed</span>
                              <span className="text-slate-300 dark:text-slate-700">•</span>
                              <span className="text-rose-600 dark:text-rose-400 font-bold">✗ {item.missingCount || 0} Missing</span>
                            </div>
                          </td>

                          <td className="p-3.5 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => setSelectedResult(item)}
                                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border transition inline-flex items-center gap-1 cursor-pointer ${
                                  isDark ? 'bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600/30 border-indigo-500/30' : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border-indigo-200'
                                }`}
                              >
                                <Eye className="w-3.5 h-3.5" /> View Scorecard
                              </button>

                              <button
                                onClick={() => handleCopyFeedback(item)}
                                className={`p-1.5 rounded-lg border transition cursor-pointer ${
                                  isDark ? 'border-slate-800 hover:bg-slate-800 text-slate-300' : 'border-slate-200 hover:bg-slate-100 text-slate-700'
                                }`}
                                title="Copy candidate scorecard"
                              >
                                {copiedId === item.id ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination & Summary Bar */}
            {filteredResults.length > 0 && (
              <div className={`p-4 border-t flex flex-col sm:flex-row items-center justify-between gap-4 text-xs ${
                isDark ? 'border-slate-800/80 bg-slate-950/30 text-slate-400' : 'border-slate-200 bg-slate-50/50 text-slate-600'
              }`}>
                <div className="flex items-center gap-3">
                  <span>
                    Showing <strong className="text-slate-900 dark:text-white font-bold">{startRecordIdx}</strong> to <strong className="text-slate-900 dark:text-white font-bold">{endRecordIdx}</strong> of <strong className="text-slate-900 dark:text-white font-bold">{filteredResults.length}</strong> candidates
                  </span>
                  <div className="flex items-center gap-1.5 ml-2">
                    <span className="text-[11px]">Per page:</span>
                    {[25, 50, 100, -1].map((sz) => (
                      <button
                        key={sz}
                        type="button"
                        onClick={() => {
                          setPageSize(sz);
                          setCurrentPage(1);
                        }}
                        className={`px-2 py-0.5 rounded text-[11px] font-bold border transition cursor-pointer ${
                          pageSize === sz
                            ? 'bg-indigo-600 text-white border-indigo-600'
                            : isDark
                            ? 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800'
                            : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {sz === -1 ? 'All' : sz}
                      </button>
                    ))}
                  </div>
                </div>

                {totalPages > 1 && pageSize !== -1 && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={safeCurrentPage <= 1}
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      className={`px-3 py-1.5 rounded-lg border font-bold transition cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${
                        isDark ? 'bg-slate-900 border-slate-700 text-white hover:bg-slate-800' : 'bg-white border-slate-300 text-slate-800 hover:bg-slate-100'
                      }`}
                    >
                      Previous
                    </button>
                    <span className="font-bold text-slate-900 dark:text-white px-2">
                      Page {safeCurrentPage} of {totalPages}
                    </span>
                    <button
                      type="button"
                      disabled={safeCurrentPage >= totalPages}
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      className={`px-3 py-1.5 rounded-lg border font-bold transition cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${
                        isDark ? 'bg-slate-900 border-slate-700 text-white hover:bg-slate-800' : 'bg-white border-slate-300 text-slate-800 hover:bg-slate-100'
                      }`}
                    >
                      Next
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Detailed Scorecard Modal (16 Checkpoints) */}
      {selectedResult && (() => {
        const item = normalizeLinkedinResult(selectedResult);

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
            <div className={`w-full max-w-3xl max-h-[90vh] flex flex-col rounded-2xl border shadow-2xl overflow-hidden ${
              isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
            }`}>
              {/* Modal Header */}
              <div className={`p-5 border-b flex items-center justify-between shrink-0 ${isDark ? 'border-slate-800 bg-slate-950/60' : 'border-slate-200 bg-slate-50'}`}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                    <LinkedinIcon size={24} />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold flex items-center gap-2">
                      <span>{item.name || item.username}</span>
                      <a
                        href={item.profileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-slate-400 hover:text-indigo-500 transition"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </h3>
                    <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      {item.headline || item.profileUrl}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCopyFeedback(item)}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                      isDark ? 'border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200' : 'border-slate-200 bg-white hover:bg-slate-100 text-slate-800'
                    }`}
                  >
                    {copiedId === item.id ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedId === item.id ? 'Copied!' : 'Copy Scorecard'}</span>
                  </button>

                  <button
                    onClick={() => setSelectedResult(null)}
                    className="p-1.5 rounded-lg hover:bg-slate-500/10 transition cursor-pointer text-slate-400 hover:text-slate-200"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Modal Body - Score Summary & 16 Criteria */}
              <div className="p-6 overflow-y-auto space-y-6">
                {/* Score Banner */}
                <div className={`p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                  isDark ? 'bg-slate-950/50 border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}>
                  <div>
                    <span className="text-xs font-bold text-slate-400 uppercase">Overall Audit Score</span>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="text-3xl font-black text-indigo-600 dark:text-indigo-400">{item.totalScore}</span>
                      <span className="text-sm font-bold text-slate-400">/ 60 Marks ({item.percentage}%)</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase border whitespace-nowrap ${
                      item.totalScore >= 50
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                        : item.totalScore >= 40
                        ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30'
                        : item.totalScore >= 30
                        ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
                        : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30'
                    }`}>
                      {item.grade}
                    </span>
                  </div>
                </div>

                {/* 16 Checkpoints List */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Detailed Criteria Breakdown (16 Rubric Items)
                  </h4>

                  <div className="space-y-2.5">
                    {(item.breakdown || []).map((crit, idx) => {
                      const isFull = Boolean(crit.passed || crit.score === crit.maxScore);

                      return (
                        <div
                          key={crit.id || idx}
                          className={`p-3.5 rounded-xl border text-xs transition ${
                            isFull
                              ? isDark ? 'bg-slate-950/40 border-slate-800/80' : 'bg-white border-slate-200'
                              : isDark ? 'bg-rose-500/5 border-rose-500/20' : 'bg-rose-50/50 border-rose-200'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2 mb-1.5">
                            <div className="flex items-center gap-2">
                              <span className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 ${
                                isFull
                                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                                  : 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                              }`}>
                                {idx + 1}
                              </span>
                              <span className="font-bold text-slate-900 dark:text-white">{crit.criterion}</span>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase border ${
                                isFull
                                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                                  : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                              }`}>
                                {isFull ? `+${crit.maxScore} / ${crit.maxScore}` : `0 / ${crit.maxScore}`}
                              </span>
                            </div>
                          </div>

                          <p className={`pl-7 text-[11px] leading-relaxed ${
                            isDark ? 'text-slate-300' : 'text-slate-600'
                          }`}>
                            {crit.detail}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className={`p-4 border-t flex justify-end shrink-0 ${isDark ? 'border-slate-800 bg-slate-950/60' : 'border-slate-200 bg-slate-50'}`}>
                <button
                  onClick={() => setSelectedResult(null)}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition cursor-pointer"
                >
                  Close Scorecard
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
