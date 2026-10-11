'use client';

import React, { useState, useEffect } from 'react';
import Sidebar, { NavigationTab } from '../components/Sidebar';
import Navbar from '../components/Navbar';
import InputForm from '../components/InputForm';
import ProgressBar from '../components/ProgressBar';
import SummaryCards from '../components/SummaryCards';
import CandidateTable from '../components/CandidateTable';
import CandidateDetailModal from '../components/CandidateDetailModal';
import SkillRulesView from '../components/SkillRulesView';
import SetupGuideView from '../components/SetupGuideView';
import HistoryView, { HistoryRecord } from '../components/HistoryView';
import ProjectDashboardView from '../components/ProjectDashboardView';
import AtsResumeCheckView from '../components/AtsResumeCheckView';
import GithubCheckView from '../components/GithubCheckView';
import NexView from '../components/NexView';
import AiAssignmentCheckView from '../components/AiAssignmentCheckView';
import AdminUserManagementView from '../components/AdminUserManagementView';
import AuthView from '../components/AuthView';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { CandidateResult, AtsHistoryRecord, NexViewRecord } from '../types';

function MainAppContent() {
  const { isAuthenticated, isAdmin, token, isLoading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<NavigationTab>('screening');
  const [theme, setTheme] = useState<'dark' | 'light'>('light');

  // Route access restrictions for Admin and User
  useEffect(() => {
    if (isAuthenticated) {
      if (!isAdmin) {
        if (['adminDashboard', 'userManagement', 'adminLogs', 'admin', 'adminScreeningHistory', 'adminAtsHistory', 'adminGithubHistory', 'adminNexViewHistory'].includes(activeTab)) {
          setActiveTab('screening');
        }
      } else {
        if (['screening', 'atsCheck', 'githubCheck', 'dictionary', 'guide'].includes(activeTab)) {
          setActiveTab('adminDashboard');
        }
      }
    }
  }, [isAdmin, isAuthenticated]);

  const [isLoading, setIsLoading] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [progress, setProgress] = useState({ completed: 0, total: 0, currentCandidate: '' });
  const [candidates, setCandidates] = useState<CandidateResult[]>([]);
  const [filterCategory, setFilterCategory] = useState<string>('All');
  const [selectedCandidate, setSelectedCandidate] = useState<CandidateResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [historyRecords, setHistoryRecords] = useState<HistoryRecord[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('latest');
  const [isSyncing, setIsSyncing] = useState(false);

  const getBackendUrl = () => {
    if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
      return 'http://localhost:5000';
    }
    return process.env.NEXT_PUBLIC_BACKEND_URL || 'https://resume-screening-backend.vercel.app';
  };

  const BACKEND_URL = getBackendUrl();

  // Load history from localStorage and sync with Google Sheets on initial mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('screening_history');
      if (saved) {
        setHistoryRecords(JSON.parse(saved));
      }
    } catch (e) {
      console.error('Failed to load screening history:', e);
    }
    syncHistoryWithGoogleSheets();
  }, []);

  // Save history to localStorage
  const saveHistoryToStorage = (updated: HistoryRecord[]) => {
    setHistoryRecords(updated);
    try {
      localStorage.setItem('screening_history', JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save screening history:', e);
    }
  };

  const syncHistoryWithGoogleSheets = async () => {
    setIsSyncing(true);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    try {
      const res = await fetch(`${BACKEND_URL}/api/history`, {
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      if (res.ok) {
        const data = await res.json();
        if (data.history && Array.isArray(data.history)) {
          saveHistoryToStorage(data.history);
        }
      }
    } catch (e: any) {
      clearTimeout(timeoutId);
      console.warn('Google Sheets history sync skipped/timed out:', e.message || e);
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    // Setup SSE listener for real-time progress stream
    const eventSource = new EventSource(`${BACKEND_URL}/api/progress`);

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.status === 'processing') {
          setProgress(prev => ({
            completed: data.completed,
            total: data.total,
            currentCandidate: data.currentCandidate || ''
          }));

          if (data.result) {
            setCandidates(prev => {
              const existsIdx = prev.findIndex(c => c.name === data.result.name && c.email === data.result.email);
              if (existsIdx !== -1) {
                const updated = [...prev];
                updated[existsIdx] = data.result;
                return updated;
              }
              return [...prev, data.result];
            });
          }
        } else if (data.status === 'completed') {
          setIsFinished(true);
          setIsLoading(false);
        } else if (data.status === 'error') {
          setErrorMessage(data.error);
          setIsLoading(false);
        }
      } catch (err) {
        console.error('SSE Error:', err);
      }
    };

    return () => {
      eventSource.close();
    };
  }, [BACKEND_URL]);

  const handleStartScreening = async (formData: {
    sheetUrl: string;
    jdText: string;
    mustHave: string[];
    niceToHave: string[];
    minExperience: number;
    operationName: string;
  }) => {
    setIsLoading(true);
    setIsFinished(false);
    setCandidates([]);
    setProgress({ completed: 0, total: 0, currentCandidate: '' });
    setErrorMessage(null);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);

    try {
      const response = await fetch(`${BACKEND_URL}/api/screen`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData),
        signal: controller.signal
      });

      if (!response.ok) {
        throw new Error('Failed to execute screening process.');
      }

      if (!response.body) {
        throw new Error('Response stream unreadable.');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';
      let finalOutcome: any = null;

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
            if (chunk.status === 'processing' && chunk.result) {
              setCandidates(prev => {
                const existsIdx = prev.findIndex(c => c.name === chunk.result.name && c.email === chunk.result.email);
                if (existsIdx !== -1) {
                  const updated = [...prev];
                  updated[existsIdx] = chunk.result;
                  return updated;
                }
                return [...prev, chunk.result];
              });
              setProgress({
                completed: chunk.completed,
                total: chunk.total,
                currentCandidate: chunk.currentCandidate || ''
              });
            } else if (chunk.status === 'completed' && chunk.data) {
              finalOutcome = chunk.data;
            } else if (chunk.status === 'error') {
              throw new Error(chunk.error || 'Screening processing error.');
            }
          } catch (jsonErr: any) {
            if (jsonErr.message.includes('JSON')) continue;
            throw jsonErr;
          }
        }
      }

      clearTimeout(timeoutId);

      if (finalOutcome && finalOutcome.results) {
        const resultsList = finalOutcome.results;
        setCandidates(resultsList);
        setIsFinished(true);
        setIsLoading(false);

        // Record locally in history
        const now = new Date();
        const newRecord: HistoryRecord = {
          id: `proj_${Date.now()}`,
          operationName: formData.operationName || 'Untitled Batch',
          timestamp: now.toISOString(),
          dateFormatted: now.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }),
          studentSheetUrl: formData.sheetUrl,
          totalCandidates: resultsList.length,
          goodToGoCount: resultsList.filter((c: CandidateResult) => c.finalScore >= 80).length,
          waitingListCount: resultsList.filter((c: CandidateResult) => c.finalScore >= 70 && c.finalScore < 80).length,
          notMatchingCount: resultsList.filter((c: CandidateResult) => c.finalScore < 70).length,
          candidates: resultsList
        };

        const updatedHistory = [newRecord, ...historyRecords];
        saveHistoryToStorage(updatedHistory);

        // Log activity to Google Sheet Login_Logs tab
        if (token) {
          fetch(`${BACKEND_URL}/api/activity/log`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({
              action: 'SCREENING_BATCH',
              details: `Screening Batch: Executed screening for ${resultsList.length} candidate(s) (Operation: '${formData.operationName || 'Batch'}')`
            })
          }).catch(err => console.error('Activity log error:', err));
        }
      } else {
        setIsFinished(true);
        setIsLoading(false);
      }
    } catch (err: any) {
      clearTimeout(timeoutId);
      const msg = err.name === 'AbortError' ? 'Screening request timed out. Please check your sheet URL.' : (err.message || 'Error occurred while contacting backend server.');
      setErrorMessage(msg);
      setIsLoading(false);
    }
  };

  const handleSelectHistoryRecord = (record: HistoryRecord) => {
    setSelectedProjectId(record.id);
    setIsFinished(true);
    setActiveTab('dashboard');
  };

  const handleClearHistory = () => {
    if (confirm('Are you sure you want to clear all screening history?')) {
      saveHistoryToStorage([]);
    }
  };

  const handleDeleteHistoryRecord = (id: string) => {
    const updated = historyRecords.filter(r => r.id !== id);
    saveHistoryToStorage(updated);
  };

  const [atsHistoryRecords, setAtsHistoryRecords] = useState<AtsHistoryRecord[]>([]);
  const [githubHistoryRecords, setGithubHistoryRecords] = useState<any[]>([]);

  const [nexViewHistoryRecords, setNexViewHistoryRecords] = useState<NexViewRecord[]>([]);

  useEffect(() => {
    try {
      const savedNv = localStorage.getItem('nexview_history');
      if (savedNv) {
        setNexViewHistoryRecords(JSON.parse(savedNv));
      }
    } catch (e) {}
  }, []);


  useEffect(() => {
    try {
      const savedGh = localStorage.getItem('github_check_history');
      if (savedGh) setGithubHistoryRecords(JSON.parse(savedGh));
    } catch (e) {}
  }, []);

  useEffect(() => {
    try {
      const savedAts = localStorage.getItem('ats_check_history');
      if (savedAts) {
        setAtsHistoryRecords(JSON.parse(savedAts));
      }
    } catch (e) {}
  }, []);

  const handleSaveAtsRecord = (newRecord: AtsHistoryRecord) => {
    setAtsHistoryRecords(prev => {
      const updated = [newRecord, ...prev];
      try { localStorage.setItem('ats_check_history', JSON.stringify(updated)); } catch (e) {}
      return updated;
    });
    syncHistoryWithGoogleSheets();
  };

  const handleSaveGithubRecord = (newRecord: any) => {
    setGithubHistoryRecords(prev => {
      const updated = [newRecord, ...prev];
      try { localStorage.setItem('github_check_history', JSON.stringify(updated)); } catch (e) {}
      return updated;
    });
    syncHistoryWithGoogleSheets();
  };

  const isDark = theme === 'dark';

  if (authLoading) {
    return (
      <div className={`min-h-screen flex items-center justify-center font-sans ${isDark ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-900'}`}>
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-semibold">Verifying 24-Hour Session...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthView theme={theme} />;
  }

  return (
    <div className={`min-h-screen flex font-sans transition-colors duration-200 ${
      isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
    }`}>
      {/* Sidebar Component */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        theme={theme}
        setTheme={setTheme}
        candidateCount={candidates.length}
        historyCount={historyRecords.filter(r => !/ats/i.test(r.operationName || '') && !/github/i.test(r.operationName || '') && (r as any).type !== 'github').length}
        atsHistoryCount={historyRecords.filter(r => /ats/i.test(r.operationName || '') && !/github/i.test(r.operationName || '')).length + (atsHistoryRecords ? atsHistoryRecords.length : 0)}
        githubHistoryCount={historyRecords.filter(r => /github/i.test(r.operationName || '') || (r as any).type === 'github').length}
        nexViewHistoryCount={nexViewHistoryRecords.length}
      />

      {/* Main Right Content Panel */}
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar theme={theme} setTheme={setTheme} />

        <main className={`flex-1 w-full max-w-[1920px] mx-auto ${
          activeTab === 'nexView' || activeTab === 'aiAssignmentCheck' ? 'p-0 h-[calc(100vh-65px)] overflow-hidden' : (activeTab === 'screening' ? (candidates.length > 0 ? 'p-4 sm:p-6 md:p-8 space-y-6' : 'p-3 sm:p-4 space-y-3 max-h-[calc(100vh-65px)] overflow-hidden') : 'p-4 sm:p-6 md:p-8 space-y-6')
        }`}>
          {/* Error Banner */}
          {errorMessage && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-sm font-medium flex items-center justify-between">
              <span>Attention: {errorMessage}</span>
              <button onClick={() => setErrorMessage(null)} className="hover:opacity-70">Close</button>
            </div>
          )}

          {/* TAB 1: New Screening Input */}
          {activeTab === 'screening' && (
            <div className="space-y-6">
              <div className="space-y-1">
                <h2 className="text-2xl font-extrabold tracking-tight">New Candidate Screening Batch</h2>
                <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  Paste Job Description & Google Sheet link. Engine evaluates resumes with 0% AI Tokens and syncs directly with Google Sheet.
                </p>
              </div>

              <InputForm onStartScreening={handleStartScreening} isLoading={isLoading} theme={theme} />

              {/* Real-time Progress Bar & Results below Form on the SAME page */}
              {(isLoading || isFinished || progress.total > 0) && (
                <ProgressBar
                  completed={progress.completed}
                  total={progress.total}
                  currentCandidate={progress.currentCandidate}
                  isFinished={isFinished}
                  theme={theme}
                />
              )}

              {/* Metric Cards */}
              {candidates.length > 0 && (
                <SummaryCards
                  candidates={candidates}
                  theme={theme}
                  activeCategory={filterCategory}
                  onSelectCategory={setFilterCategory}
                />
              )}

              {/* Candidate Table */}
              {candidates.length > 0 && (
                <div className="space-y-3 pt-2">
                  <h3 className="text-lg font-bold flex items-center justify-between">
                    <span>Evaluation Results & Candidate List ({candidates.length})</span>
                    <span className="text-xs text-slate-400 font-normal">Click any candidate row for detail view</span>
                  </h3>
                  <CandidateTable
                    candidates={candidates}
                    onSelectCandidate={setSelectedCandidate}
                    theme={theme}
                    filterCategory={filterCategory}
                    setFilterCategory={setFilterCategory}
                  />
                </div>
              )}
            </div>
          )}

          {/* TAB: ATS Resume Check (100-Point Rubric) */}
          {activeTab === 'atsCheck' && <AtsResumeCheckView theme={theme} onSaveHistoryRecord={handleSaveAtsRecord} />}

          {/* TAB: GitHub Profile Check (60-Point Rubric) */}
          {activeTab === 'githubCheck' && <GithubCheckView theme={theme} onSaveHistoryRecord={handleSaveGithubRecord} />}

          {/* TAB: NexView Tool Portal */}
          {activeTab === 'nexView' && <NexView theme={theme} />}

          {/* TAB: AI Assignment Check Portal */}
          {activeTab === 'aiAssignmentCheck' && <AiAssignmentCheckView theme={theme} />}

          {/* TAB 2: Dashboard & Results (Generalized Project-Wise) */}
          {activeTab === 'dashboard' && (
            <ProjectDashboardView
              theme={theme}
              historyRecords={historyRecords}
              activeCandidates={candidates}
              selectedProjectId={selectedProjectId}
              onSelectProject={setSelectedProjectId}
              onNewScreening={() => setActiveTab('screening')}
              onSelectCandidate={setSelectedCandidate}
              isLoading={isLoading}
              isFinished={isFinished}
              progress={progress}
            />
          )}

          {/* TAB 3 & Admin History Routes */}
          {(activeTab === 'history' || activeTab === 'adminScreeningHistory' || activeTab === 'adminAtsHistory' || activeTab === 'adminGithubHistory' || activeTab === 'adminNexViewHistory') && (
            <HistoryView
              theme={theme}
              historyRecords={historyRecords}
              atsHistoryRecords={atsHistoryRecords}
              githubHistoryRecords={githubHistoryRecords}
              nexViewHistoryRecords={nexViewHistoryRecords}
              onSelectRecord={handleSelectHistoryRecord}
              onClearHistory={handleClearHistory}
              onDeleteRecord={handleDeleteHistoryRecord}
              onSyncHistory={syncHistoryWithGoogleSheets}
              isSyncing={isSyncing}
              defaultSubTab={
                activeTab === 'adminNexViewHistory'
                  ? 'nexView'
                  : activeTab === 'adminGithubHistory'
                  ? 'githubCheck'
                  : activeTab === 'adminAtsHistory'
                  ? 'atsCheck'
                  : 'screening'
              }
            />
          )}

          {/* TAB: Admin User Management Panel & Dashboard */}
          {(activeTab === 'admin' || activeTab === 'adminDashboard') && <AdminUserManagementView theme={theme} initialSubTab="overview" onNavigateTab={setActiveTab} />}
          {activeTab === 'userManagement' && <AdminUserManagementView theme={theme} initialSubTab="users" onNavigateTab={setActiveTab} />}
          {activeTab === 'adminLogs' && <AdminUserManagementView theme={theme} initialSubTab="logs" onNavigateTab={setActiveTab} />}

          {/* TAB 4: Skill Rules & ATS Dataset */}
          {activeTab === 'dictionary' && <SkillRulesView theme={theme} />}

          {/* TAB 5: Google Sheet Setup Guide */}
          {activeTab === 'guide' && <SetupGuideView theme={theme} />}
        </main>

        {activeTab !== 'nexView' && activeTab !== 'aiAssignmentCheck' && (
          <footer className={`border-t py-4 text-center text-xs transition-colors duration-200 ${
            isDark ? 'border-slate-900 text-slate-500' : 'border-slate-200 text-slate-400'
          }`}>
            Placement Kit - 0% AI Token Deterministic Engine with Central Google Sheet Sync
          </footer>
        )}
      </div>

      {/* Detail View Modal */}
      <CandidateDetailModal
        candidate={selectedCandidate}
        onClose={() => setSelectedCandidate(null)}
        theme={theme}
      />
    </div>
  );
}

export default function Home() {
  return (
    <AuthProvider>
      <MainAppContent />
    </AuthProvider>
  );
}