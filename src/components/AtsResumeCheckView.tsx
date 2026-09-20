'use client';

import React, { useState } from 'react';
import {
  FileCheck,
  Table,
  Link2,
  FileText,
  Play,
  Award,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  ExternalLink,
  ChevronRight,
  X,
  Sparkles,
  Info
} from 'lucide-react';
import { AtsRubricResult } from '../types';

interface AtsResumeCheckViewProps {
  theme?: 'dark' | 'light';
}

export default function AtsResumeCheckView({ theme = 'dark' }: AtsResumeCheckViewProps) {
  const isDark = theme === 'dark';

  const [inputUrl, setInputUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<AtsRubricResult[]>([]);
  const [selectedResult, setSelectedResult] = useState<AtsRubricResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const getBackendUrl = () => {
    if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
      return 'http://localhost:5000';
    }
    return process.env.NEXT_PUBLIC_BACKEND_URL || 'https://resume-screening-backend.vercel.app';
  };

  const handleEvaluate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputUrl.trim()) {
      alert('Please enter a Candidate Google Sheet URL or Direct Resume Link.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setResults([]);

    const isSheet = inputUrl.includes('docs.google.com/spreadsheets');
    const payload = isSheet
      ? { sheetUrl: inputUrl.trim() }
      : { resumeUrl: inputUrl.trim() };

    const backendUrl = getBackendUrl();

    try {
      const response = await fetch(`${backendUrl}/api/ats-check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Failed to contact backend ATS check endpoint (${response.status}).`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';
      let finalData: any = null;

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
              const parsed = JSON.parse(line.trim());
              if (parsed.status === 'processing' && parsed.result) {
                setResults(prev => {
                  const idx = prev.findIndex(r => r.name === parsed.result.name && r.email === parsed.result.email);
                  if (idx !== -1) {
                    const copy = [...prev];
                    copy[idx] = parsed.result;
                    return copy;
                  }
                  return [...prev, parsed.result];
                });
              } else if (parsed.status === 'completed' && parsed.data) {
                finalData = parsed.data;
              } else if (parsed.status === 'error') {
                throw new Error(parsed.error || 'Evaluation failed.');
              }
            } catch (jsonErr: any) {
              if (jsonErr.message && jsonErr.message.includes('Evaluation failed')) throw jsonErr;
            }
          }
        }

        // Process remaining buffer chunk after stream ends
        if (buffer && buffer.trim()) {
          try {
            const parsed = JSON.parse(buffer.trim());
            if (parsed.status === 'completed' && parsed.data) {
              finalData = parsed.data;
            } else if (parsed.status === 'error') {
              throw new Error(parsed.error || 'Evaluation failed.');
            }
          } catch (jsonErr: any) {
            if (jsonErr.message && jsonErr.message.includes('Evaluation failed')) throw jsonErr;
          }
        }
      }

      if (finalData && finalData.results && finalData.results.length > 0) {
        setResults(finalData.results);
      } else {
        setResults(prev => {
          if (prev.length > 0) return prev;
          throw new Error('No evaluation output returned.');
        });
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error occurred during ATS Resume evaluation.');
    } finally {
      setIsLoading(false);
    }
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
      {/* Page Header */}
      <div className="space-y-1">
        <h2 className="text-2xl font-extrabold tracking-tight flex items-center gap-2">
          <FileCheck className="w-6 h-6 text-indigo-500" />
          ATS Resume Check & 100-Point Rubric Evaluator
        </h2>
        <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
          Evaluate applicant resumes against the official 100-Point ATS Rubric. Supports Candidate Google Sheet URL or Direct Resume Drive links.
        </p>
      </div>

      {/* Rubric Points Cards Banner */}
      <div className={`p-4 rounded-2xl border text-xs grid grid-cols-2 md:grid-cols-6 gap-3 ${
        isDark ? 'bg-slate-900/60 border-slate-800 text-slate-300' : 'bg-white border-slate-200 text-slate-700 shadow-sm'
      }`}>
        <div className="space-y-0.5 p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
          <span className="font-bold text-indigo-400">Contact Info</span>
          <p className="text-[10px] text-slate-400">Email, Phone, LinkedIn/Web</p>
          <span className="text-xs font-bold text-indigo-400">15 Pts</span>
        </div>
        <div className="space-y-0.5 p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
          <span className="font-bold text-cyan-400">Essential Sections</span>
          <p className="text-[10px] text-slate-400">Summary, Exp, Edu, Skills</p>
          <span className="text-xs font-bold text-cyan-400">25 Pts</span>
        </div>
        <div className="space-y-0.5 p-2 rounded-xl bg-purple-500/10 border border-purple-500/20">
          <span className="font-bold text-purple-400">Keyword Match</span>
          <p className="text-[10px] text-slate-400">Industry Tech Keywords</p>
          <span className="text-xs font-bold text-purple-400">25 Pts</span>
        </div>
        <div className="space-y-0.5 p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
          <span className="font-bold text-emerald-400">Action Verbs & Impact</span>
          <p className="text-[10px] text-slate-400">Action verbs + %, $, numbers</p>
          <span className="text-xs font-bold text-emerald-400">15 Pts</span>
        </div>
        <div className="space-y-0.5 p-2 rounded-xl bg-amber-500/10 border border-amber-500/20">
          <span className="font-bold text-amber-400">Formatting</span>
          <p className="text-[10px] text-slate-400">Length, bullets, dates</p>
          <span className="text-xs font-bold text-amber-400">10 Pts</span>
        </div>
        <div className="space-y-0.5 p-2 rounded-xl bg-rose-500/10 border border-rose-500/20">
          <span className="font-bold text-rose-400">ATS Parseability</span>
          <p className="text-[10px] text-slate-400">Headings, text extraction</p>
          <span className="text-xs font-bold text-rose-400">10 Pts</span>
        </div>
      </div>

      {/* Input Form Box */}
      <div className={`border backdrop-blur-xl rounded-2xl p-6 ${
        isDark ? 'bg-slate-900/60 border-slate-800 text-slate-100 shadow-2xl' : 'bg-white border-slate-200 text-slate-900 shadow-md'
      }`}>
        <form onSubmit={handleEvaluate} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold mb-1.5 flex items-center gap-2">
              <Table className="w-4 h-4 text-cyan-400" />
              Google Sheet URL or Direct Resume Drive Link <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Paste Candidate Google Sheet URL (with applicant resumes) OR direct PDF/Drive link"
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              className={`w-full border rounded-xl px-4 py-3 text-sm transition focus:outline-none focus:ring-2 focus:ring-indigo-500/50 ${
                isDark ? 'bg-slate-950/80 border-slate-800 text-white placeholder-slate-500' : 'bg-slate-50 border-slate-300 text-slate-900'
              }`}
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-bold shadow-lg shadow-indigo-500/25 transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Evaluating ATS Rubric & Generating Feedback...</span>
              </>
            ) : (
              <>
                <Play className="w-5 h-5 fill-current" />
                <span>Run ATS Resume Check (100-Point Rubric)</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* Error Message */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-sm font-medium">
          ⚠️ {errorMessage}
        </div>
      )}

      {/* Evaluation Results List */}
      {results.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold">Evaluation Results ({results.length} Resumes Evaluated)</h3>
            <span className="text-xs text-slate-400">Click any row to inspect full rubric breakdown & feedback</span>
          </div>

          <div className={`border rounded-2xl overflow-hidden ${
            isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200 shadow-md'
          }`}>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className={`border-b text-[11px] font-bold uppercase tracking-wider ${
                    isDark ? 'bg-slate-950/60 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'
                  }`}>
                    <th className="p-3.5">Candidate Name</th>
                    <th className="p-3.5">Contact Info</th>
                    <th className="p-3.5">Total Rubric Score</th>
                    <th className="p-3.5">Grade</th>
                    <th className="p-3.5">Keyword Match</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40">
                  {results.map((res, idx) => (
                    <tr
                      key={idx}
                      onClick={() => setSelectedResult(res)}
                      className={`cursor-pointer transition hover:bg-indigo-500/5 ${
                        isDark ? 'border-slate-800/50' : 'border-slate-100'
                      }`}
                    >
                      <td className="p-3.5 font-bold flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold text-xs">
                          {res.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div>{res.name}</div>
                          <div className="text-[10px] text-slate-400 font-normal">{res.email}</div>
                        </div>
                      </td>
                      <td className="p-3.5">
                        <div className="text-[11px] space-y-0.5">
                          <div>📧 {res.email !== 'N/A' ? 'Present' : 'Missing'}</div>
                          <div>📞 {res.phone !== 'N/A' ? 'Present' : 'Missing'}</div>
                        </div>
                      </td>
                      <td className="p-3.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-extrabold text-sm text-indigo-400">{res.totalScore} / 100</span>
                          <div className="w-20 bg-slate-800 h-2 rounded-full overflow-hidden">
                            <div
                              className="bg-gradient-to-r from-indigo-500 to-cyan-400 h-full rounded-full"
                              style={{ width: `${res.totalScore}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="p-3.5">
                        <span className={`px-2.5 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wider ${getGradeBadge(res.grade)}`}>
                          {res.grade}
                        </span>
                      </td>
                      <td className="p-3.5 font-mono font-semibold">
                        {res.breakdown?.keywordMatch?.score || 0} / 25 Pts
                      </td>
                      <td className="p-3.5 text-right">
                        <button
                          onClick={(e) => { e.stopPropagation(); setSelectedResult(res); }}
                          className="px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 border border-indigo-500/30 font-semibold transition text-xs inline-flex items-center gap-1"
                        >
                          View Rubric & Feedback <ChevronRight className="w-3.5 h-3.5" />
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

      {/* Candidate Rubric Detail Modal */}
      {selectedResult && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className={`w-full max-w-3xl rounded-2xl border p-6 space-y-6 my-8 max-h-[90vh] overflow-y-auto ${
            isDark ? 'bg-slate-900 border-slate-800 text-slate-100 shadow-2xl' : 'bg-white border-slate-200 text-slate-900 shadow-xl'
          }`}>
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b pb-4 border-slate-800">
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <h3 className="text-xl font-bold">{selectedResult.name}</h3>
                  <span className={`px-3 py-1 rounded-full border text-xs font-bold uppercase tracking-wider ${getGradeBadge(selectedResult.grade)}`}>
                    Grade: {selectedResult.grade} ({selectedResult.totalScore}/100)
                  </span>
                </div>
                <p className="text-xs text-slate-400">{selectedResult.email} • {selectedResult.phone}</p>
              </div>
              <button onClick={() => setSelectedResult(null)} className="p-1 rounded-lg hover:bg-slate-800 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Rubric Category Breakdown Cards */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                <Award className="w-4 h-4" /> 100-Point Rubric Category Breakdown
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* 1. Contact Info */}
                <div className={`p-3.5 rounded-xl border ${isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-semibold text-xs text-indigo-400">1. Contact Info</span>
                    <span className="font-mono font-bold text-xs">{selectedResult.breakdown?.contactInfo?.score} / 15 Pts</span>
                  </div>
                  <ul className="text-[11px] space-y-0.5 text-slate-400">
                    {selectedResult.breakdown?.contactInfo?.details.map((d, i) => (
                      <li key={i}>• {d}</li>
                    ))}
                  </ul>
                </div>

                {/* 2. Essential Sections */}
                <div className={`p-3.5 rounded-xl border ${isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-semibold text-xs text-cyan-400">2. Essential Sections</span>
                    <span className="font-mono font-bold text-xs">{selectedResult.breakdown?.essentialSections?.score} / 25 Pts</span>
                  </div>
                  <ul className="text-[11px] space-y-0.5 text-slate-400">
                    {selectedResult.breakdown?.essentialSections?.details.map((d, i) => (
                      <li key={i}>• {d}</li>
                    ))}
                  </ul>
                </div>

                {/* 3. Keyword Match */}
                <div className={`p-3.5 rounded-xl border ${isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-semibold text-xs text-purple-400">3. Keyword Match</span>
                    <span className="font-mono font-bold text-xs">{selectedResult.breakdown?.keywordMatch?.score} / 25 Pts</span>
                  </div>
                  <ul className="text-[11px] space-y-0.5 text-slate-400">
                    {selectedResult.breakdown?.keywordMatch?.details.map((d, i) => (
                      <li key={i}>• {d}</li>
                    ))}
                  </ul>
                </div>

                {/* 4. Action Verbs & Impact */}
                <div className={`p-3.5 rounded-xl border ${isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-semibold text-xs text-emerald-400">4. Action Verbs & Impact</span>
                    <span className="font-mono font-bold text-xs">{selectedResult.breakdown?.actionVerbsImpact?.score} / 15 Pts</span>
                  </div>
                  <ul className="text-[11px] space-y-0.5 text-slate-400">
                    {selectedResult.breakdown?.actionVerbsImpact?.details.map((d, i) => (
                      <li key={i}>• {d}</li>
                    ))}
                  </ul>
                </div>

                {/* 5. Formatting & Readability */}
                <div className={`p-3.5 rounded-xl border ${isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-semibold text-xs text-amber-400">5. Formatting & Readability</span>
                    <span className="font-mono font-bold text-xs">{selectedResult.breakdown?.formattingReadability?.score} / 10 Pts</span>
                  </div>
                  <ul className="text-[11px] space-y-0.5 text-slate-400">
                    {selectedResult.breakdown?.formattingReadability?.details.map((d, i) => (
                      <li key={i}>• {d}</li>
                    ))}
                  </ul>
                </div>

                {/* 6. ATS Parseability */}
                <div className={`p-3.5 rounded-xl border ${isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-semibold text-xs text-rose-400">6. ATS Parseability</span>
                    <span className="font-mono font-bold text-xs">{selectedResult.breakdown?.atsParseability?.score} / 10 Pts</span>
                  </div>
                  <ul className="text-[11px] space-y-0.5 text-slate-400">
                    {selectedResult.breakdown?.atsParseability?.details.map((d, i) => (
                      <li key={i}>• {d}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Precise General Feedback Box */}
            <div className={`p-4 rounded-xl border space-y-3 ${
              isDark ? 'bg-indigo-950/30 border-indigo-500/20' : 'bg-indigo-50 border-indigo-200'
            }`}>
              <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-cyan-400" /> Precise General Feedback & Recommendations
              </h4>

              <p className="text-xs font-medium leading-relaxed">
                {selectedResult.feedback?.summary}
              </p>

              {selectedResult.feedback?.strengths && selectedResult.feedback.strengths.length > 0 && (
                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Key Strengths:
                  </span>
                  <ul className="list-disc list-inside text-xs text-slate-300 space-y-0.5 pl-1">
                    {selectedResult.feedback.strengths.map((s, i) => <li key={i}>{s}</li>)}
                  </ul>
                </div>
              )}

              {selectedResult.feedback?.improvements && selectedResult.feedback.improvements.length > 0 && (
                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-amber-400 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" /> Actionable Improvements Needed:
                  </span>
                  <ul className="list-disc list-inside text-xs text-slate-300 space-y-0.5 pl-1">
                    {selectedResult.feedback.improvements.map((imp, i) => <li key={i}>{imp}</li>)}
                  </ul>
                </div>
              )}

              <div className="pt-2 border-t border-indigo-500/20 text-xs font-bold text-cyan-400">
                📌 Recommendation: {selectedResult.feedback?.recommendation}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
