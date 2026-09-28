'use client';

import React, { useState } from 'react';
import {
  Table,
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
  Lock,
  Copy,
  Check,
  Star,
  GitBranch,
  UserCheck,
  FolderGit2,
  Eye
} from 'lucide-react';
import { GithubCheckItem } from '../types';
import ProgressBar from './ProgressBar';
import { useAuth } from '../context/AuthContext';

const GithubIcon = ({ size = 20, className = '' }: { size?: number; className?: string }) => (
  <svg width={size} height={size} className={className} fill="currentColor" viewBox="0 0 24 24">
    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
  </svg>
);


interface GithubCheckViewProps {
  theme?: 'dark' | 'light';
  onSaveHistoryRecord?: (record: any) => void;
}

const DEFAULT_MASTER_SHEET = 'https://docs.google.com/spreadsheets/d/1O84kcu_A4V4Chsb6TPQEwGNxhuqu1Qml431I7yEQu3I/edit?gid=0#gid=0';

export default function GithubCheckView({ theme = 'dark', onSaveHistoryRecord }: GithubCheckViewProps) {
  const isDark = theme === 'dark';
  const { token } = useAuth();

  const [inputUrl, setInputUrl] = useState('');
  const masterSheetUrl = DEFAULT_MASTER_SHEET;
  const [operationName, setOperationName] = useState('');
  const [copiedMasterUrl, setCopiedMasterUrl] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [progress, setProgress] = useState({ completed: 0, total: 0, currentCandidate: '' });
  const [results, setResults] = useState<GithubCheckItem[]>([]);
  const [selectedResult, setSelectedResult] = useState<GithubCheckItem | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const getBackendUrl = () => {
    if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
      return 'http://localhost:5000';
    }
    return process.env.NEXT_PUBLIC_BACKEND_URL || 'https://resume-screening-backend.vercel.app';
  };

  const saveRecord = (resList: GithubCheckItem[]) => {
    if (!resList || resList.length === 0) return;
    const now = new Date();
    const opTitle = operationName.trim() || (inputUrl.includes('docs.google.com') ? 'GitHub Check (Batch Sheet)' : 'GitHub Check (Single Profile)');
    const record = {
      id: `gh_${Date.now()}`,
      operationName: opTitle,
      timestamp: now.toISOString(),
      dateFormatted: now.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }),
      studentSheetUrl: inputUrl.trim(),
      totalCandidates: resList.length,
      excellentCount: resList.filter(r => (r.totalScore || 0) >= 50).length,
      strongCount: resList.filter(r => (r.totalScore || 0) >= 40 && (r.totalScore || 0) < 50).length,
      moderateCount: resList.filter(r => (r.totalScore || 0) >= 30 && (r.totalScore || 0) < 40).length,
      needsImprovementCount: resList.filter(r => (r.totalScore || 0) < 30).length,
      results: resList
    };

    try {
      const existing = localStorage.getItem('github_check_history');
      const list = existing ? JSON.parse(existing) : [];
      const updated = [record, ...list];
      localStorage.setItem('github_check_history', JSON.stringify(updated));
      if (onSaveHistoryRecord) {
        onSaveHistoryRecord(record);
      }
    } catch (e) {
      console.error('Failed to save GitHub history record:', e);
    }
  };

  const handleEvaluate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputUrl.trim()) {
      alert('Please enter a Candidate Google Sheet URL or GitHub Profile URL/Username.');
      return;
    }

    setIsLoading(true);
    setIsFinished(false);
    setErrorMessage(null);
    setResults([]);
    setProgress({ completed: 0, total: 0, currentCandidate: '' });

    const isSheet = inputUrl.includes('docs.google.com/spreadsheets');
    const payload = isSheet
      ? { sheetUrl: inputUrl.trim(), masterSheetUrl: masterSheetUrl.trim(), operationName: operationName.trim() }
      : { githubUrl: inputUrl.trim(), masterSheetUrl: masterSheetUrl.trim(), operationName: operationName.trim() };

    const backendUrl = getBackendUrl();

    try {
      const response = await fetch(`${backendUrl}/api/github-check`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Failed to contact backend GitHub check endpoint (${response.status}).`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';
      let finalResults: GithubCheckItem[] = [];

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
                setProgress({ completed: 0, total: chunk.total || 0, currentCandidate: 'Initializing GitHub API scanners...' });
              } else if (chunk.status === 'processing') {
                setProgress({
                  completed: chunk.completed,
                  total: chunk.total,
                  currentCandidate: chunk.currentCandidate
                });
                if (chunk.result) {
                  setResults(prev => [...prev, chunk.result]);
                }
              } else if (chunk.status === 'completed') {
                if (chunk.data && chunk.data.results) {
                  finalResults = chunk.data.results;
                  setResults(finalResults);
                }
              } else if (chunk.status === 'error') {
                throw new Error(chunk.error || 'GitHub evaluation error.');
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
      console.error('GitHub Evaluation Error:', err);
      const msg = err.message || '';
      if (msg.includes('Failed to fetch') || msg.includes('network error')) {
        setErrorMessage('Google Sheet Access Error: Please check if the Google Sheet URL is valid and shared (or set to "Anyone with link can view").');
      } else {
        setErrorMessage(msg || 'An unexpected error occurred during GitHub profile check.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyMasterUrl = () => {
    navigator.clipboard.writeText(masterSheetUrl);
    setCopiedMasterUrl(true);
    setTimeout(() => setCopiedMasterUrl(false), 2000);
  };

  return (
    <div className="space-y-8 animate-fadeIn pb-12">
      {/* Header Banner */}
      <div className={`p-6 sm:p-8 rounded-2xl border transition-all duration-300 relative overflow-hidden ${
        isDark
          ? 'bg-slate-900/80 border-slate-800 text-white shadow-xl backdrop-blur-md'
          : 'bg-white border-slate-200 text-slate-900 shadow-md'
      }`}>
        <div className="absolute -right-10 -bottom-10 opacity-10 pointer-events-none">
          <GithubIcon size={240} className="text-purple-400" />
        </div>


        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-semibold uppercase tracking-wider mb-4">
            <UserCheck size={14} /> 60-Point Standard GitHub Profile & Repo Rubric
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight mb-3">
            GitHub Profile <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-400">Auditor</span>
          </h1>
          <p className={`text-sm sm:text-base leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
            Evaluate candidate GitHub profiles against 15 quantitative rubric criteria (Profile picture, Bio, Pinned Repos, Tech Stack, README quality, Live Links, and Stats).
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
                Candidate Sheet URL or GitHub Profile URL / Username <span className="text-purple-400">*</span>
              </label>
              <div className="relative">
                <GithubIcon size={18} className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
                <input

                  type="text"
                  value={inputUrl}
                  onChange={(e) => setInputUrl(e.target.value)}
                  placeholder="https://docs.google.com/spreadsheets/d/... OR https://github.com/username"
                  required
                  className={`w-full pl-10 pr-4 py-3 rounded-xl border text-sm transition-all outline-none ${
                    isDark
                      ? 'bg-slate-800/80 border-slate-700 text-white placeholder-slate-500 focus:border-purple-500 focus:ring-1 focus:ring-purple-500'
                      : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:border-purple-500 focus:ring-1 focus:ring-purple-500'
                  }`}
                />
              </div>
              <p className={`text-xs mt-1.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Paste a Google Sheet link or a single candidate GitHub profile link/username.
              </p>
            </div>

            <div>
              <label className={`block text-xs font-semibold uppercase tracking-wider mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                Operation / Batch Name (Optional)
              </label>
              <input
                type="text"
                value={operationName}
                onChange={(e) => setOperationName(e.target.value)}
                placeholder="e.g. MERN Batch 2026 GitHub Check"
                className={`w-full px-4 py-3 rounded-xl border text-sm transition-all outline-none ${
                  isDark
                    ? 'bg-slate-800/80 border-slate-700 text-white placeholder-slate-500 focus:border-purple-500 focus:ring-1 focus:ring-purple-500'
                    : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:border-purple-500 focus:ring-1 focus:ring-purple-500'
                }`}
              />
              <p className={`text-xs mt-1.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Identifies this batch run in history and Google Sheets.
              </p>
            </div>
          </div>

          {/* Master Central Sheet Url (System Locked) */}
          <div className={`p-4 rounded-xl border ${
            isDark ? 'bg-slate-800/40 border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${isDark ? 'text-purple-400' : 'text-purple-600'}`}>
                  <Lock size={12} /> Master Central Google Sheet (Admin Synchronized)
                </span>
                <p className={`text-xs mt-1 font-mono truncate max-w-xl ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  {masterSheetUrl}
                </p>
              </div>

              <button
                type="button"
                onClick={handleCopyMasterUrl}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  copiedMasterUrl
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : isDark
                      ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                      : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                }`}
              >
                {copiedMasterUrl ? <Check size={14} /> : <Copy size={14} />}
                {copiedMasterUrl ? 'Copied' : 'Copy URL'}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-4 rounded-xl font-bold text-white shadow-lg transition-all duration-300 flex items-center justify-center gap-2.5 ${
              isLoading
                ? 'bg-purple-800 opacity-70 cursor-not-allowed'
                : 'bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 hover:shadow-purple-500/25 active:scale-[0.99]'
            }`}
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Scanning Candidate GitHub Profiles...
              </>
            ) : (
              <>
                <Play size={18} fill="currentColor" /> Run GitHub Profile Check
              </>
            )}
          </button>
        </form>
      </div>

      {/* Error Banner */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-start gap-3">
          <AlertTriangle className="shrink-0 mt-0.5" size={20} />
          <div>
            <h4 className="font-semibold text-sm">Evaluation Failed</h4>
            <p className="text-xs mt-0.5 opacity-90">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* Progress Bar */}
      {isLoading && (
        <ProgressBar
          completed={progress.completed}
          total={progress.total}
          currentCandidate={progress.currentCandidate}
          isFinished={isFinished}
          theme={theme}
        />
      )}


      {/* Summary Stat Cards */}
      {(results.length > 0 || isFinished) && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
            <div className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Total Scanned</div>
            <div className="text-2xl font-black mt-1 text-purple-400">{results.length}</div>
            <div className="text-xs text-slate-500 mt-1">Candidates</div>
          </div>

          <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
            <div className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Excellent (≥50/60)</div>
            <div className="text-2xl font-black mt-1 text-emerald-400">
              {results.filter(r => (r.totalScore || 0) >= 50).length}
            </div>
            <div className="text-xs text-emerald-500 mt-1">Top Class Profile</div>
          </div>

          <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
            <div className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Strong (40-49)</div>
            <div className="text-2xl font-black mt-1 text-cyan-400">
              {results.filter(r => (r.totalScore || 0) >= 40 && (r.totalScore || 0) < 50).length}
            </div>
            <div className="text-xs text-cyan-500 mt-1">Good Setup</div>
          </div>

          <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
            <div className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Needs Work (&lt;30)</div>
            <div className="text-2xl font-black mt-1 text-rose-400">
              {results.filter(r => (r.totalScore || 0) < 30).length}
            </div>
            <div className="text-xs text-rose-500 mt-1">Incomplete Profile</div>
          </div>
        </div>
      )}

      {/* Candidates Results Table */}
      {results.length > 0 && (
        <div className={`rounded-2xl border overflow-hidden ${isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-md'}`}>
          <div className={`p-4 sm:p-6 border-b flex items-center justify-between ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
            <h3 className={`font-bold text-base flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              <Table size={18} className="text-purple-500" /> Candidate GitHub Evaluation Results
            </h3>
            <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${isDark ? 'bg-purple-500/10 text-purple-400' : 'bg-purple-50 text-purple-700 border border-purple-200'}`}>
              Sorted by Total Score
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className={`text-xs uppercase font-semibold ${isDark ? 'bg-slate-800/60 text-slate-400' : 'bg-slate-100 text-slate-600'}`}>
                <tr>
                  <th className="py-3 px-4">Candidate / Profile</th>
                  <th className="py-3 px-4 text-center">Score (out of 60)</th>
                  <th className="py-3 px-4 text-center">Grade</th>
                  <th className="py-3 px-4 text-center">Public Repos</th>
                  <th className="py-3 px-4 text-center">Followers</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDark ? 'divide-slate-800' : 'divide-slate-200'}`}>
                {results.map((res, idx) => (
                  <tr key={idx} className={`transition-colors ${isDark ? 'hover:bg-slate-800/40' : 'hover:bg-slate-50'}`}>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        {res.avatarUrl ? (
                          <img src={res.avatarUrl} alt={res.username} className="w-9 h-9 rounded-full border border-purple-500/30 object-cover" />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-purple-600/20 flex items-center justify-center font-bold text-purple-500">
                            {(res.name || res.username || 'G').charAt(0)}
                          </div>
                        )}
                        <div>
                          <div className={`font-bold flex items-center gap-1.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                            {res.name}
                            <a
                              href={res.profileUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-slate-400 hover:text-purple-500 inline-flex items-center"
                            >
                              <ExternalLink size={12} />
                            </a>
                          </div>
                          <div className={`text-xs font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>@{res.username}</div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4 text-center">
                      <div className={`inline-flex items-center gap-1 font-extrabold text-base ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        <span className="text-purple-500">{res.totalScore}</span>
                        <span className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>/ 60</span>
                      </div>
                      <div className={`text-[10px] font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{res.percentage}%</div>
                    </td>

                    <td className="py-3 px-4 text-center">
                      <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold ${
                        res.gradeColor === 'emerald'
                          ? isDark ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : res.gradeColor === 'cyan'
                          ? isDark ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' : 'bg-cyan-50 text-cyan-700 border border-cyan-200'
                          : res.gradeColor === 'amber'
                          ? isDark ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-amber-50 text-amber-700 border border-amber-200'
                          : isDark ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}>
                        {res.grade}
                      </span>
                    </td>

                    <td className={`py-3 px-4 text-center font-mono ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                      {res.publicRepos}
                    </td>

                    <td className={`py-3 px-4 text-center font-mono ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                      {res.followers}
                    </td>

                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => setSelectedResult(res)}
                        className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all inline-flex items-center gap-1 ${
                          isDark
                            ? 'bg-purple-600/20 text-purple-300 hover:bg-purple-600 hover:text-white border-purple-500/30'
                            : 'bg-purple-50 text-purple-700 hover:bg-purple-600 hover:text-white border-purple-200 shadow-2xs'
                        }`}
                      >
                        <Eye size={14} /> Rubric Specs
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 15-Criteria Rubric Breakdown Modal */}
      {selectedResult && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`w-full max-w-3xl max-h-[90vh] rounded-2xl border flex flex-col overflow-hidden shadow-2xl ${
            isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            {/* Modal Header */}
            <div className={`p-6 border-b flex items-center justify-between ${isDark ? 'border-slate-800' : 'border-slate-200 bg-slate-50/50'}`}>
              <div className="flex items-center gap-3">
                {selectedResult.avatarUrl ? (
                  <img src={selectedResult.avatarUrl} alt={selectedResult.username} className="w-12 h-12 rounded-full border border-purple-500/40 object-cover" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-purple-600/20 text-purple-600 font-extrabold flex items-center justify-center text-lg">
                    {(selectedResult.name || selectedResult.username || 'G').charAt(0)}
                  </div>
                )}
                <div>
                  <h3 className={`font-extrabold text-lg ${isDark ? 'text-white' : 'text-slate-900'}`}>{selectedResult.name}</h3>
                  <div className={`text-xs font-mono font-semibold ${isDark ? 'text-purple-400' : 'text-purple-600'}`}>
                    @{selectedResult.username} • {selectedResult.location || 'Location Not Set'}
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSelectedResult(null)}
                className={`p-2 rounded-xl transition-all ${
                  isDark ? 'hover:bg-slate-800 text-slate-400 hover:text-white' : 'hover:bg-slate-200 text-slate-500 hover:text-slate-900'
                }`}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {/* Score Header Card */}
              <div className={`p-4.5 rounded-xl border flex items-center justify-between ${
                isDark
                  ? 'bg-gradient-to-r from-purple-900/30 via-indigo-900/20 to-pink-900/20 border-purple-500/30'
                  : 'bg-gradient-to-r from-purple-50 via-indigo-50 to-pink-50 border-purple-200'
              }`}>
                <div>
                  <div className={`text-xs font-bold uppercase ${isDark ? 'text-purple-300' : 'text-purple-700'}`}>
                    Total Rubric Evaluation Score
                  </div>
                  <div className={`text-3xl font-black mt-0.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {selectedResult.totalScore} <span className={`text-sm font-normal ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>/ 60 Marks ({selectedResult.percentage}%)</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`inline-block px-3.5 py-1.5 rounded-full text-xs font-bold ${
                    selectedResult.gradeColor === 'emerald'
                      ? isDark ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : selectedResult.gradeColor === 'cyan'
                      ? isDark ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'bg-cyan-100 text-cyan-800 border border-cyan-300'
                      : selectedResult.gradeColor === 'amber'
                      ? isDark ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-amber-100 text-amber-800 border border-amber-300'
                      : isDark ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-rose-100 text-rose-800 border border-rose-300'
                  }`}>
                    {selectedResult.grade}
                  </span>
                </div>
              </div>

              {/* Categorized Criteria Breakdown */}
              {(() => {
                const breakdownList = selectedResult.breakdown || [];
                const passedItems = breakdownList.filter(item => item.passed || item.score > 0);
                const missingItems = breakdownList.filter(item => !item.passed && item.score === 0);
                const isAllPresent = missingItems.length === 0 || selectedResult.totalScore >= 60;

                return (
                  <div className="space-y-6">
                    {/* Overall Banner */}
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
                );
              })()}

              {/* Top Repos Overview */}
              {selectedResult.topRepos && selectedResult.topRepos.length > 0 && (
                <div>
                  <h4 className={`text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-1.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    <FolderGit2 size={14} className="text-purple-500" /> Top / Pinned Repositories Analyzed
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {selectedResult.topRepos.map((repo, rIdx) => (
                      <div key={rIdx} className={`p-3.5 rounded-xl border space-y-1.5 ${
                        isDark ? 'border-slate-800 bg-slate-800/40' : 'border-slate-200 bg-slate-50'
                      }`}>
                        <div className="flex items-center justify-between">
                          <a href={repo.url} target="_blank" rel="noreferrer" className="font-bold text-sm text-purple-500 hover:underline flex items-center gap-1">
                            {repo.name} <ExternalLink size={12} />
                          </a>
                          <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                            isDark ? 'bg-slate-700 text-slate-300' : 'bg-slate-200 text-slate-700 font-semibold'
                          }`}>
                            {repo.language}
                          </span>
                        </div>
                        <p className={`text-xs line-clamp-2 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{repo.description}</p>
                        {repo.homepage && (
                          <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium truncate">
                            Live Demo: <a href={repo.homepage} target="_blank" rel="noreferrer" className="underline">{repo.homepage}</a>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className={`p-4 border-t flex justify-end ${isDark ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-slate-50'}`}>
              <button
                onClick={() => setSelectedResult(null)}
                className={`px-5 py-2.5 rounded-xl font-semibold text-xs transition-all ${
                  isDark ? 'bg-slate-800 hover:bg-slate-700 text-white' : 'bg-slate-900 hover:bg-slate-800 text-white shadow-sm'
                }`}
              >
                Close Rubric Inspection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

