import React, { useState } from 'react';
import { AtsResult } from '../types';
import { ShieldAlert, FileText, Zap, Award, Search, AlertTriangle, Table, CheckCircle2, XCircle, ExternalLink, RefreshCw, Lock, Copy, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface CandidateBatchItem extends AtsResult {
  name: string;
  email: string;
  phone: string;
  resumeLink: string;
  atsScore: number;
  finalScore: number;
  category: string;
  criticalFlag: boolean;
  feedback: string;
}

interface Props {
  theme?: 'dark' | 'light';
  onSaveHistoryRecord?: (record: any) => void;
}

const SERVICE_ACCOUNT_EMAIL = 'resume-service@resume-scanner-508710.iam.gserviceaccount.com';

export const AtsResumeCheckView: React.FC<Props> = ({ theme = 'dark', onSaveHistoryRecord }) => {
  const isDark = theme === 'dark';
  const { user, token } = useAuth();
  const [sheetUrl, setSheetUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [progressMsg, setProgressMsg] = useState('');
  const [progressCount, setProgressCount] = useState({ completed: 0, total: 0 });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedEmail, setCopiedEmail] = useState(false);

  // Batch evaluation results
  const [batchResults, setBatchResults] = useState<CandidateBatchItem[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState<CandidateBatchItem | null>(null);
  const [filterCategory, setFilterCategory] = useState<'all' | 'friendly' | 'needs_work' | 'risk'>('all');

  const copyServiceEmail = () => {
    try {
      navigator.clipboard.writeText(SERVICE_ACCOUNT_EMAIL);
      setCopiedEmail(true);
      setTimeout(() => setCopiedEmail(false), 2000);
    } catch (e) {}
  };

  const handleRunAtsCheck = async () => {
    if (!sheetUrl.trim()) return;

    setLoading(true);
    setErrorMessage(null);
    setProgressMsg('Initiating ATS Evaluation Engine...');
    setProgressCount({ completed: 0, total: 0 });

    try {
      const backendUrl = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
        ? 'http://localhost:5000'
        : process.env.NEXT_PUBLIC_BACKEND_URL || 'https://resume-screening-backend.vercel.app';

      const payload: any = {
        sheetUrl: sheetUrl.trim(),
        operationName: 'ATS_Batch_Sheet_Evaluation',
        email: user?.email,
        userEmail: user?.email
      };

      const res = await fetch(`${backendUrl}/api/ats-check`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok && res.status !== 200) {
        throw new Error(`HTTP ${res.status}: Failed to communicate with backend server.`);
      }

      if (!res.body) throw new Error('No response stream returned from backend server.');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const data = JSON.parse(line);
            if (data.status === 'processing') {
              setProgressMsg('Evaluating ' + (data.currentCandidate || 'Applicant') + ' (' + data.completed + '/' + data.total + ')...');
              setProgressCount({ completed: data.completed, total: data.total });
            } else if (data.status === 'completed' && data.data) {
              const outcome = data.data;
              if (Array.isArray(outcome.results)) {
                setBatchResults(outcome.results);
                if (outcome.results.length > 0) setSelectedCandidate(outcome.results[0]);
                if (onSaveHistoryRecord) {
                  onSaveHistoryRecord({
                    id: 'ats_' + Date.now(),
                    timestamp: new Date().toISOString(),
                    dateFormatted: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
                    operationName: 'ATS Batch Sheet Check (' + outcome.results.length + ' Candidates)',
                    studentSheetUrl: sheetUrl.trim(),
                    totalCandidates: outcome.results.length,
                    userEmail: user?.email || 'user@system.com',
                    excellentCount: outcome.results.filter((r: any) => (r.atsScore || r.ats_score || 0) >= 80).length,
                    strongCount: outcome.results.filter((r: any) => (r.atsScore || r.ats_score || 0) >= 70 && (r.atsScore || r.ats_score || 0) < 80).length,
                    moderateCount: outcome.results.filter((r: any) => (r.atsScore || r.ats_score || 0) >= 60 && (r.atsScore || r.ats_score || 0) < 70).length,
                    needsWorkCount: outcome.results.filter((r: any) => (r.atsScore || r.ats_score || 0) < 60).length,
                    results: outcome.results
                  });
                }
                // Log activity to backend
                if (token) {
                  fetch(`${backendUrl}/api/activity/log`, {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify({
                      action: 'ATS_CHECK',
                      email: user?.email,
                      role: user?.role || 'user',
                      details: `ATS Resume Check: Evaluated ${outcome.results.length} resume(s)`
                    })
                  }).catch(e => {});
                }
              }
            } else if (data.status === 'error') {
              setErrorMessage(data.error || 'Failed to access or parse Google Sheet resumes.');
            }
          } catch (e) {
            // Ignore partial chunk parsing errors
          }
        }
      }
    } catch (err: any) {
      const msg = err?.message || 'Connection or Network error occurred.';
      setErrorMessage(msg.includes('Google Sheet') ? msg : `Google Sheet Access Error: ${msg}. Please check if sheet URL is valid and set to "Anyone with link can view".`);
    } finally {
      setLoading(false);
      setProgressMsg('');
    }
  };

  const getSeverityBadge = (severity: string) => {
    if (severity === 'CRITICAL' || severity === 'HIGH') return <span className='px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20'>{severity}</span>;
    if (severity === 'MEDIUM') return <span className='px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20'>MEDIUM</span>;
    if (severity === 'LOW') return <span className='px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'>LOW</span>;
    return <span className='px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'>GOOD</span>;
  };

  const getAtsBadge = (score: number) => {
    if (score >= 80) return <span className='px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center space-x-1'><CheckCircle2 className='w-3.5 h-3.5 text-emerald-400 inline mr-1' />ATS Friendly ({score})</span>;
    if (score >= 60) return <span className='px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 flex items-center space-x-1'><AlertTriangle className='w-3.5 h-3.5 text-indigo-400 inline mr-1' />Needs Work ({score})</span>;
    return <span className='px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30 flex items-center space-x-1'><XCircle className='w-3.5 h-3.5 text-rose-400 inline mr-1' />High Risk ({score})</span>;
  };

  const filteredBatch = batchResults.filter(item => {
    const s = item.atsScore || item.ats_score || 0;
    if (filterCategory === 'friendly') return s >= 80;
    if (filterCategory === 'needs_work') return s >= 60 && s < 80;
    if (filterCategory === 'risk') return s < 60;
    return true;
  });

  const activeResult = selectedCandidate;
  const activeScore = activeResult ? (activeResult.ats_score ?? activeResult.atsScore ?? 0) : 0;

  return (
    <div className={'h-full flex flex-col p-4 overflow-hidden ' + (isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900')}>
      {/* Input Configuration Box */}
      <div className={'rounded-xl p-3.5 mb-3 shrink-0 border space-y-3 ' + (isDark ? 'bg-slate-900/90 border-slate-800 shadow-xl' : 'bg-white border-slate-200 shadow-sm')}>
        <div className='space-y-2'>
          <label className={'text-xs font-bold flex items-center justify-between ' + (isDark ? 'text-slate-200' : 'text-slate-800')}>
            <span className='flex items-center space-x-2'>
              <Table className={'w-4 h-4 ' + (isDark ? 'text-emerald-400' : 'text-emerald-600')} />
              <span>Google Sheet Link (Resumes Batch) *</span>
            </span>
            <span className={'text-[11px] font-medium ' + (isDark ? 'text-slate-400' : 'text-slate-500')}>Sheet must contain candidate name & resume link columns</span>
          </label>
          <div className='flex items-center space-x-3'>
            <input
              type='url'
              className={'flex-1 rounded-lg p-2.5 text-xs font-mono border transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 ' + (isDark ? 'bg-slate-950 border-slate-800 text-slate-100 placeholder-slate-500' : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400')}
              placeholder='Paste Google Sheet URL (e.g. https://docs.google.com/spreadsheets/d/...)'
              value={sheetUrl}
              onChange={(e) => setSheetUrl(e.target.value)}
            />
            <button
              onClick={handleRunAtsCheck}
              disabled={loading || !sheetUrl.trim()}
              className='py-2.5 px-5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs rounded-lg transition-all shadow-md flex items-center space-x-2 shrink-0 cursor-pointer'
            >
              {loading ? (
                <>
                  <RefreshCw className='w-3.5 h-3.5 animate-spin' />
                  <span>Evaluating ATS...</span>
                </>
              ) : (
                <>
                  <Search className='w-3.5 h-3.5' />
                  <span>Evaluate Sheet Resumes</span>
                </>
              )}
            </button>
          </div>

          {/* Access Permission Helper */}
          <div className={'flex flex-wrap items-center justify-between gap-2 p-2 rounded-lg text-[11px] border mt-1.5 ' + (isDark ? 'bg-slate-950/80 border-slate-800 text-slate-400' : 'bg-slate-100 border-slate-200 text-slate-600')}>
            <span className='flex items-center space-x-1.5'>
              <Lock className='w-3.5 h-3.5 text-amber-500 shrink-0' />
              <span>Permission Note: Ensure sheet is set to <strong>"Anyone with link can view"</strong> or shared with Service Account:</span>
            </span>
            <button
              onClick={copyServiceEmail}
              className={'flex items-center space-x-1 font-mono font-bold px-2 py-0.5 rounded border transition-all ' + (isDark ? 'bg-indigo-950/80 border-indigo-700 text-indigo-300 hover:bg-indigo-900' : 'bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100')}
            >
              <span className='truncate max-w-[220px]'>{SERVICE_ACCOUNT_EMAIL}</span>
              {copiedEmail ? <Check className='w-3 h-3 text-emerald-400' /> : <Copy className='w-3 h-3' />}
            </button>
          </div>
        </div>

        {/* Error Alert Box */}
        {errorMessage && (
          <div className={'p-3 rounded-lg border flex items-start justify-between space-x-3 text-xs font-semibold ' + (isDark ? 'bg-rose-950/80 border-rose-800 text-rose-200' : 'bg-rose-50 border-rose-200 text-rose-900')}>
            <div className='flex items-start space-x-2'>
              <AlertTriangle className='w-4 h-4 text-rose-500 shrink-0 mt-0.5' />
              <div className='space-y-1'>
                <p className='font-bold'>{errorMessage}</p>
                <p className='text-[11px] font-normal opacity-90 leading-relaxed'>
                  To fix: Open your Google Sheet → Click <strong>Share</strong> (top right) → Change Access to <strong>"Anyone with the link can view"</strong> (or share directly with <code className='font-mono font-bold'>{SERVICE_ACCOUNT_EMAIL}</code>).
                </p>
              </div>
            </div>
            <button onClick={() => setErrorMessage(null)} className='px-2 py-0.5 rounded text-[10px] font-bold bg-rose-900/60 hover:bg-rose-900 text-white shrink-0'>Close</button>
          </div>
        )}

        {/* Live Progress Bar */}
        {loading && (
          <div className={'rounded-lg p-3 space-y-1.5 border ' + (isDark ? 'bg-slate-950 border-indigo-900/60' : 'bg-indigo-50/60 border-indigo-200')}>
            <div className={'flex items-center justify-between text-xs font-semibold ' + (isDark ? 'text-indigo-300' : 'text-indigo-700')}>
              <span>{progressMsg || 'Processing candidates...'}</span>
              {progressCount.total > 0 && <span>{progressCount.completed} / {progressCount.total}</span>}
            </div>
            <div className={'w-full h-2 rounded-full overflow-hidden ' + (isDark ? 'bg-slate-800' : 'bg-indigo-200')}>
              <div
                className='h-full bg-indigo-600 transition-all duration-300'
                style={{ width: progressCount.total > 0 ? ((progressCount.completed / progressCount.total) * 100) + '%' : '40%' }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Main Grid View */}
      <div className='grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1 min-h-0 overflow-hidden'>
        {/* Left Column: Candidate List Table */}
        <div className={'lg:col-span-6 flex flex-col rounded-xl border overflow-hidden min-h-0 ' + (isDark ? 'bg-slate-900/90 border-slate-800 shadow-xl' : 'bg-white border-slate-200 shadow-sm')}>
          {/* Header & Filter Tabs */}
          <div className={'p-3 border-b flex items-center justify-between shrink-0 ' + (isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-100/80 border-slate-200')}>
            <h3 className={'text-xs font-extrabold uppercase tracking-wider flex items-center space-x-2 ' + (isDark ? 'text-slate-200' : 'text-slate-800')}>
              <Table className={'w-4 h-4 ' + (isDark ? 'text-emerald-400' : 'text-emerald-600')} />
              <span>Evaluated Applicants ({batchResults.length})</span>
            </h3>
            <div className='flex items-center space-x-1 text-[11px] font-bold'>
              <button onClick={() => setFilterCategory('all')} className={'px-2 py-1 rounded transition-all ' + (filterCategory === 'all' ? 'bg-indigo-600 text-white' : (isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'))}>All ({batchResults.length})</button>
              <button onClick={() => setFilterCategory('friendly')} className={'px-2 py-1 rounded transition-all ' + (filterCategory === 'friendly' ? 'bg-emerald-600 text-white' : (isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'))}>Friendly ({batchResults.filter(r => (r.atsScore || r.ats_score || 0) >= 80).length})</button>
              <button onClick={() => setFilterCategory('needs_work')} className={'px-2 py-1 rounded transition-all ' + (filterCategory === 'needs_work' ? 'bg-amber-600 text-white' : (isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'))}>Needs Work ({batchResults.filter(r => (r.atsScore || r.ats_score || 0) >= 60 && (r.atsScore || r.ats_score || 0) < 80).length})</button>
              <button onClick={() => setFilterCategory('risk')} className={'px-2 py-1 rounded transition-all ' + (filterCategory === 'risk' ? 'bg-rose-600 text-white' : (isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'))}>High Risk ({batchResults.filter(r => (r.atsScore || r.ats_score || 0) < 60).length})</button>
            </div>
          </div>

          {/* Candidate List Rows */}
          <div className='flex-1 overflow-y-auto p-3 space-y-2 min-h-0'>
            {batchResults.length === 0 && !loading && (
              <div className={'h-full flex flex-col items-center justify-center p-6 text-center ' + (isDark ? 'text-slate-500' : 'text-slate-400')}>
                <Table className={'w-10 h-10 mb-2 ' + (isDark ? 'text-slate-700' : 'text-slate-300')} />
                <p className='text-xs max-w-xs'>Paste a Google Sheet URL above and click <strong>Evaluate Sheet Resumes</strong> to evaluate applicant resumes.</p>
              </div>
            )}

            {filteredBatch.map((item, idx) => {
              const s = item.atsScore || item.ats_score || 0;
              const isSelected = selectedCandidate?.name === item.name;
              return (
                <div
                  key={idx}
                  onClick={() => setSelectedCandidate(item)}
                  className={'p-3 rounded-lg border cursor-pointer transition-all flex items-center justify-between ' + (
                    isSelected
                      ? (isDark ? 'bg-indigo-950/80 border-indigo-500 text-slate-100 shadow' : 'bg-indigo-50 border-indigo-400 text-slate-900 shadow-sm')
                      : (isDark ? 'bg-slate-950/80 border-slate-800 text-slate-200 hover:border-slate-700' : 'bg-slate-50 border-slate-200 text-slate-800 hover:border-slate-300')
                  )}
                >
                  <div className='space-y-1 min-w-0 pr-2'>
                    <div className='flex items-center space-x-2'>
                      <span className={'text-xs font-extrabold truncate ' + (isDark ? 'text-slate-100' : 'text-slate-900')}>{item.name || 'Applicant'}</span>
                      {item.resumeLink && (
                        <a href={item.resumeLink} target='_blank' rel='noreferrer' onClick={(e) => e.stopPropagation()} className='text-indigo-500 hover:text-indigo-400 shrink-0'>
                          <ExternalLink className='w-3 h-3' />
                        </a>
                      )}
                    </div>
                    <p className={'text-[11px] truncate ' + (isDark ? 'text-slate-400' : 'text-slate-500')}>{item.email || 'N/A'}</p>
                  </div>

                  <div className='flex items-center space-x-3 shrink-0'>
                    <div className='text-right'>
                      <span className={'text-sm font-black block ' + (isDark ? 'text-slate-100' : 'text-slate-900')}>{s}/100</span>
                      <span className={'text-[10px] font-semibold ' + (isDark ? 'text-slate-400' : 'text-slate-500')}>ATS Score</span>
                    </div>
                    {getAtsBadge(s)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Detailed Rubric Report */}
        <div className={'lg:col-span-6 flex flex-col rounded-xl border overflow-hidden min-h-0 ' + (isDark ? 'bg-slate-900/90 border-slate-800 shadow-xl' : 'bg-white border-slate-200 shadow-sm')}>
          <div className={'p-3 border-b flex items-center justify-between shrink-0 ' + (isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-100/80 border-slate-200')}>
            <h3 className={'text-xs font-extrabold uppercase tracking-wider flex items-center space-x-2 ' + (isDark ? 'text-slate-200' : 'text-slate-800')}>
              <Award className={'w-4 h-4 ' + (isDark ? 'text-amber-400' : 'text-amber-600')} />
              <span>ATS Detailed Rubric Report {activeResult ? '(' + (activeResult.name || 'Candidate') + ')' : ''}</span>
            </h3>
            {activeResult && (
              <div className='flex items-center space-x-2'>
                <span className={'text-xs font-black ' + (isDark ? 'text-slate-100' : 'text-slate-900')}>{activeScore}/100</span>
                {getAtsBadge(activeScore)}
              </div>
            )}
          </div>

          <div className='flex-1 overflow-y-auto p-3.5 space-y-3.5 min-h-0'>
            {!activeResult && (
              <div className={'h-full flex flex-col items-center justify-center p-8 text-center ' + (isDark ? 'text-slate-500' : 'text-slate-400')}>
                <Award className={'w-12 h-12 mb-3 ' + (isDark ? 'text-slate-700' : 'text-slate-300')} />
                <h3 className={'text-sm font-bold mb-1 ' + (isDark ? 'text-slate-300' : 'text-slate-700')}>No Resume Selected</h3>
                <p className={'text-xs max-w-sm ' + (isDark ? 'text-slate-500' : 'text-slate-500')}>
                  Select any applicant row from the list on the left to inspect their detailed 100-point rubric breakdown.
                </p>
              </div>
            )}

            {activeResult && (
              <>
                {/* Rubric Category Scores */}
                {activeResult.category_scores && (
                  <div className={'rounded-lg p-3 border shrink-0 ' + (isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200')}>
                    <h4 className={'text-xs font-bold uppercase tracking-wider mb-2.5 flex items-center space-x-1.5 ' + (isDark ? 'text-slate-300' : 'text-slate-800')}>
                      <Zap className={'w-3.5 h-3.5 ' + (isDark ? 'text-amber-400' : 'text-amber-600')} />
                      <span>100-Point Master Rubric Breakdown</span>
                    </h4>
                    <div className='grid grid-cols-2 sm:grid-cols-4 gap-2'>
                      {Object.entries(activeResult.category_scores).map(([key, cat]) => (
                        <div key={key} className={'rounded p-2 border flex flex-col justify-between ' + (isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm')}>
                          <span className={'text-[10px] font-semibold truncate ' + (isDark ? 'text-slate-400' : 'text-slate-600')}>{cat.label}</span>
                          <div className='flex items-baseline justify-between mt-1'>
                            <span className={'text-sm font-black ' + (isDark ? 'text-slate-100' : 'text-slate-900')}>{cat.score}</span>
                            <span className={'text-[10px] font-medium ' + (isDark ? 'text-slate-400' : 'text-slate-400')}>/ {cat.max} pts</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Unnecessary Personal Information Alert */}
                {activeResult.unnecessary_personal_info && activeResult.unnecessary_personal_info.length > 0 && (
                  <div className={'rounded-lg p-3 border flex items-start space-x-2.5 shrink-0 ' + (isDark ? 'bg-amber-950/40 border-amber-800/60 text-amber-200' : 'bg-amber-50 border-amber-200 text-amber-900')}>
                    <AlertTriangle className={'w-4 h-4 shrink-0 mt-0.5 ' + (isDark ? 'text-amber-400' : 'text-amber-600')} />
                    <div className='text-xs leading-relaxed'>
                      <strong className='font-bold'>Unnecessary Personal Information Flagged: </strong>
                      <span>{activeResult.unnecessary_personal_info.join(', ')}. Employers and ATS systems do not require these details.</span>
                    </div>
                  </div>
                )}

                {/* Detailed Severity Recommendations */}
                {activeResult.recommendations && activeResult.recommendations.length > 0 && (
                  <div className={'rounded-lg p-3 border flex-1 min-h-0 space-y-2 ' + (isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200')}>
                    <h4 className={'text-xs font-bold uppercase tracking-wider mb-2 flex items-center space-x-1.5 ' + (isDark ? 'text-slate-300' : 'text-slate-800')}>
                      <ShieldAlert className={'w-3.5 h-3.5 ' + (isDark ? 'text-indigo-400' : 'text-indigo-600')} />
                      <span>Actionable Severity Recommendations ({activeResult.recommendations.length})</span>
                    </h4>
                    <div className='space-y-2'>
                      {activeResult.recommendations.map((rec, idx) => (
                        <div key={idx} className={'rounded p-2.5 border flex flex-col space-y-1 transition-all ' + (isDark ? 'bg-slate-900 border-slate-800/80' : 'bg-white border-slate-200 shadow-sm')}>
                          <div className='flex items-center justify-between'>
                            <span className={'text-xs font-bold ' + (isDark ? 'text-slate-200' : 'text-slate-800')}>{rec.title}</span>
                            {getSeverityBadge(rec.severity)}
                          </div>
                          <p className={'text-[11px] leading-relaxed ' + (isDark ? 'text-slate-400' : 'text-slate-600')}>{rec.message}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AtsResumeCheckView;
