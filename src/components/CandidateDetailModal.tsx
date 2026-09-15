'use client';

import React from 'react';
import { CandidateResult } from '../types';
import { X, ExternalLink, CheckCircle, XCircle, AlertTriangle, FileText, ShieldCheck } from 'lucide-react';

interface CandidateDetailModalProps {
  candidate: CandidateResult | null;
  onClose: () => void;
  theme?: 'dark' | 'light';
}

export default function CandidateDetailModal({ candidate, onClose, theme = 'dark' }: CandidateDetailModalProps) {
  if (!candidate) return null;
  const isDark = theme === 'dark';

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto ${
      isDark ? 'bg-slate-950/80 backdrop-blur-md' : 'bg-slate-900/40 backdrop-blur-md'
    }`}>
      <div className={`border rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl space-y-0 my-8 ${
        isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        {/* Modal Header */}
        <div className={`p-6 border-b flex items-start justify-between ${
          isDark ? 'border-slate-800 bg-slate-950/50' : 'border-slate-200 bg-slate-50'
        }`}>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold">{candidate.name}</h2>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                candidate.category === 'Shortlist'
                  ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                  : candidate.category === 'Waiting List'
                  ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                  : 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
              }`}>
                {candidate.category}
              </span>
            </div>
            <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Email: <strong>{candidate.email || 'N/A'}</strong> | Phone: <strong>{candidate.phone || 'N/A'}</strong>
            </p>
          </div>

          <div className="flex items-center gap-2">
            {candidate.resumeLink && (
              <a
                href={candidate.resumeLink}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-500 border border-indigo-500/30 text-xs font-medium transition flex items-center gap-1.5"
              >
                <ExternalLink className="w-3.5 h-3.5" /> View Resume
              </a>
            )}
            <button
              onClick={onClose}
              className={`p-1.5 rounded-lg transition ${
                isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-500 hover:text-black hover:bg-slate-100'
              }`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Critical Warning Callout */}
          {candidate.criticalFlag && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-500 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-rose-500 uppercase">Critical Requirement Missing Flag</h4>
                <p className="text-xs opacity-90 mt-0.5">
                  This candidate is missing one or more essential Must-Have requirements ({candidate.matchingResults.criticalMissing.join(', ')}). A 10% penalty was applied to their final score.
                </p>
              </div>
            </div>
          )}

          {/* Metric Score Cards */}
          <div className="grid grid-cols-3 gap-4">
            <div className={`p-4 rounded-xl border text-center ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Final Score</p>
              <p className="text-2xl font-bold font-mono text-cyan-500 mt-1">{candidate.finalScore}%</p>
            </div>
            <div className={`p-4 rounded-xl border text-center ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Skill Match Score</p>
              <p className="text-2xl font-bold font-mono text-indigo-500 mt-1">{candidate.matchScore}%</p>
            </div>
            <div className={`p-4 rounded-xl border text-center ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>ATS Format Rating</p>
              <p className="text-2xl font-bold font-mono text-emerald-500 mt-1">{candidate.atsScore}%</p>
            </div>
          </div>

          {/* Automated Rule-Based Feedback */}
          <div className={`p-4 rounded-xl border space-y-2 ${isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
            <h4 className="text-xs font-semibold flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-indigo-500" /> Automated Rule-Based Summary & Feedback
            </h4>
            <p className={`text-xs leading-relaxed font-mono p-3 rounded-lg border ${
              isDark ? 'bg-slate-950 border-slate-800 text-slate-300' : 'bg-white border-slate-200 text-slate-800'
            }`}>
              {candidate.feedback}
            </p>
          </div>

          {/* Must Have Requirements Breakdown */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider mb-3">Must-Have Skills Breakdown</h4>
            <div className="space-y-2">
              {candidate.matchingResults.mustHaveResults.length === 0 ? (
                <p className="text-xs opacity-60 italic">No explicit Must-Have skills defined.</p>
              ) : (
                candidate.matchingResults.mustHaveResults.map((req, idx) => (
                  <div key={idx} className={`flex items-center justify-between p-3 rounded-xl border ${
                    isDark ? 'bg-slate-950/40 border-slate-800/80' : 'bg-slate-50 border-slate-200'
                  }`}>
                    <div className="flex items-center gap-2.5">
                      {req.status === 'Strong' && <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />}
                      {req.status === 'Moderate' && <CheckCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />}
                      {req.status === 'Missing' && <XCircle className="w-4 h-4 text-rose-500 flex-shrink-0" />}
                      <span className="text-xs font-medium">{req.name}</span>
                    </div>
                    <span className="text-[11px] opacity-70 italic">{req.reason}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Nice Have Requirements Breakdown */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider mb-3">Nice-to-Have Skills Breakdown</h4>
            <div className="space-y-2">
              {candidate.matchingResults.niceToHaveResults.length === 0 ? (
                <p className="text-xs opacity-60 italic">No Nice-to-Have skills defined.</p>
              ) : (
                candidate.matchingResults.niceToHaveResults.map((req, idx) => (
                  <div key={idx} className={`flex items-center justify-between p-3 rounded-xl border ${
                    isDark ? 'bg-slate-950/40 border-slate-800/80' : 'bg-slate-50 border-slate-200'
                  }`}>
                    <div className="flex items-center gap-2.5">
                      {req.status === 'Strong' && <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />}
                      {req.status === 'Moderate' && <CheckCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />}
                      {req.status === 'Missing' && <XCircle className="w-4 h-4 text-slate-400 flex-shrink-0" />}
                      <span className="text-xs font-medium">{req.name}</span>
                    </div>
                    <span className="text-[11px] opacity-70 italic">{req.reason}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* ATS Audit Checklist */}
          {candidate.atsDetails && (
            <div className={`p-4 rounded-xl border space-y-3 ${
              isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}>
              <h4 className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-500" /> ATS Format Audit Checklist ({candidate.atsScore}% Rating)
              </h4>

              {candidate.atsDetails.checklist && candidate.atsDetails.checklist.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                  {candidate.atsDetails.checklist.map((item, cIdx) => (
                    <div key={cIdx} className={`p-2.5 rounded-lg border flex items-center justify-between ${
                      item.passed
                        ? isDark ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400' : 'bg-emerald-50 border-emerald-200 text-emerald-700'
                        : isDark ? 'bg-rose-500/5 border-rose-500/20 text-rose-400' : 'bg-rose-50 border-rose-200 text-rose-700'
                    }`}>
                      <div className="flex items-center gap-2">
                        {item.passed ? <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" /> : <XCircle className="w-4 h-4 text-rose-500 flex-shrink-0" />}
                        <span className="font-medium text-[11px]">{item.name}</span>
                      </div>
                      <span className="text-[10px] opacity-80">{item.detail}</span>
                    </div>
                  ))}
                </div>
              )}

              {candidate.atsDetails.warnings && candidate.atsDetails.warnings.length > 0 && (
                <div className="pt-2">
                  <h5 className="text-[11px] font-semibold text-amber-500 mb-1">ATS Optimization Suggestions:</h5>
                  <ul className="space-y-1 text-xs">
                    {candidate.atsDetails.warnings.map((warn, wIdx) => (
                      <li key={wIdx} className="text-[11px] opacity-90 flex items-start gap-1.5">
                        <span className="text-amber-500">•</span> {warn}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
