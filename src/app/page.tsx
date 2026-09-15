'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import InputForm from '../components/InputForm';
import ProgressBar from '../components/ProgressBar';
import SummaryCards from '../components/SummaryCards';
import CandidateTable from '../components/CandidateTable';
import CandidateDetailModal from '../components/CandidateDetailModal';
import SkillRulesView from '../components/SkillRulesView';
import SetupGuideView from '../components/SetupGuideView';
import { CandidateResult } from '../types';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'screening' | 'dashboard' | 'dictionary' | 'guide'>('screening');
  const [theme, setTheme] = useState<'dark' | 'light'>('light');

  const [isLoading, setIsLoading] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [progress, setProgress] = useState({ completed: 0, total: 0, currentCandidate: '' });
  const [candidates, setCandidates] = useState<CandidateResult[]>([]);
  const [filterCategory, setFilterCategory] = useState<string>('All');
  const [selectedCandidate, setSelectedCandidate] = useState<CandidateResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://resume-screening-backend.vercel.app';

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

    try {
      const response = await fetch(`${BACKEND_URL}/api/screen`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const resData = await response.json();

      if (!response.ok) {
        throw new Error(resData.error || 'Failed to execute screening process.');
      }

      if (resData.data && resData.data.results) {
        setCandidates(resData.data.results);
        setIsFinished(true);
        setIsLoading(false);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error occurred while contacting backend server.');
      setIsLoading(false);
    }
  };

  const isDark = theme === 'dark';

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
      />

      {/* Main Right Content Panel */}
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar theme={theme} setTheme={setTheme} />

        <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto space-y-6">
          {/* Error Banner */}
          {errorMessage && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-sm font-medium flex items-center justify-between">
              <span>⚠️ {errorMessage}</span>
              <button onClick={() => setErrorMessage(null)} className="hover:opacity-70">✕</button>
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

          {/* TAB 2: Dashboard & Results */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h2 className="text-2xl font-extrabold tracking-tight">Candidate Results & Analytics</h2>
                  <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    Real-time evaluation table and metric indicators.
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('screening')}
                  className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md transition"
                >
                  + New Screening Batch
                </button>
              </div>

              {/* Progress Bar */}
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
              <SummaryCards
                candidates={candidates}
                theme={theme}
                activeCategory={filterCategory}
                onSelectCategory={setFilterCategory}
              />

              {/* Candidate Table */}
              <CandidateTable
                candidates={candidates}
                onSelectCandidate={setSelectedCandidate}
                theme={theme}
                filterCategory={filterCategory}
                setFilterCategory={setFilterCategory}
              />
            </div>
          )}

          {/* TAB 3: Skill Rules & ATS Dataset */}
          {activeTab === 'dictionary' && <SkillRulesView theme={theme} />}

          {/* TAB 4: Google Sheet Setup Guide */}
          {activeTab === 'guide' && <SetupGuideView theme={theme} />}
        </main>

        <footer className={`border-t py-4 text-center text-xs transition-colors duration-200 ${
          isDark ? 'border-slate-900 text-slate-500' : 'border-slate-200 text-slate-400'
        }`}>
          Resume Screening Tool — 0% AI Token Deterministic Engine with Central Google Sheet Sync
        </footer>
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
