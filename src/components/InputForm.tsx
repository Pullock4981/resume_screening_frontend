'use client';

import React, { useState } from 'react';
import { Play, FileText, Table, Plus, X, Sparkles, Briefcase, Copy, Check, Lock, Database, Sliders } from 'lucide-react';
import { extractSkillsFromJDText } from '../utils/skillExtractor';

interface InputFormProps {
  onStartScreening: (data: {
    sheetUrl: string;
    masterSheetUrl: string;
    jdText: string;
    mustHave: string[];
    niceToHave: string[];
    minExperience: number;
    operationName: string;
  }) => void;
  isLoading: boolean;
  theme?: 'dark' | 'light';
}

const DEFAULT_MASTER_SHEET = 'https://docs.google.com/spreadsheets/d/1O84kcu_A4V4Chsb6TPQEwGNxhuqu1Qml431I7yEQu3I/edit?gid=0#gid=0';

export default function InputForm({ onStartScreening, isLoading, theme = 'dark' }: InputFormProps) {
  const isDark = theme === 'dark';

  const [sheetUrl, setSheetUrl] = useState('');
  const [masterSheetUrl, setMasterSheetUrl] = useState(DEFAULT_MASTER_SHEET);
  const [copiedMasterUrl, setCopiedMasterUrl] = useState(false);
  const [operationName, setOperationName] = useState('');
  const [jdText, setJdText] = useState('');
  const [mustHaveTag, setMustHaveTag] = useState('');
  const [niceToHaveTag, setNiceToHaveTag] = useState('');
  const [mustHaveList, setMustHaveList] = useState<string[]>(['React', 'Node.js']);
  const [niceToHaveList, setNiceToHaveList] = useState<string[]>(['TypeScript', 'Docker', 'AWS']);
  const [minExperience, setMinExperience] = useState<number>(2);

  const handleAutoExtract = (text: string) => {
    if (!text.trim()) return;
    const { mustHave, niceToHave, minExperience: extractedExp } = extractSkillsFromJDText(text);
    if (mustHave.length > 0) setMustHaveList(mustHave);
    if (niceToHave.length > 0) setNiceToHaveList(niceToHave);
    if (extractedExp > 0) setMinExperience(extractedExp);
  };

  const handleJdChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setJdText(val);
    if (val.length > 30) {
      handleAutoExtract(val);
    }
  };

  const addMustHave = () => {
    if (mustHaveTag.trim() && !mustHaveList.includes(mustHaveTag.trim())) {
      setMustHaveList([...mustHaveList, mustHaveTag.trim()]);
      setMustHaveTag('');
    }
  };

  const removeMustHave = (tag: string) => {
    setMustHaveList(mustHaveList.filter(t => t !== tag));
  };

  const addNiceToHave = () => {
    if (niceToHaveTag.trim() && !niceToHaveList.includes(niceToHaveTag.trim())) {
      setNiceToHaveList([...niceToHaveList, niceToHaveTag.trim()]);
      setNiceToHaveTag('');
    }
  };

  const removeNiceToHave = (tag: string) => {
    setNiceToHaveList(niceToHaveList.filter(t => t !== tag));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sheetUrl.trim()) return alert('Please enter the Applicant Google Sheet URL.');
    if (!jdText.trim()) return alert('Please enter the Job Description.');

    onStartScreening({
      sheetUrl: sheetUrl.trim(),
      masterSheetUrl: masterSheetUrl.trim(),
      jdText: jdText.trim(),
      mustHave: mustHaveList,
      niceToHave: niceToHaveList,
      minExperience,
      operationName: operationName.trim()
    });
  };

  return (
    <div className={`w-full border rounded-2xl p-5 sm:p-6 transition-all duration-200 ${
      isDark
        ? 'bg-slate-900 border-slate-800 text-slate-100 shadow-xl'
        : 'bg-white border-slate-200 text-slate-900 shadow-sm'
    }`}>
      {/* Card Header */}
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-indigo-600/10 text-indigo-600 dark:text-indigo-400">
            <Sliders className="w-4 h-4" />
          </div>
          <div>
            <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Screening Parameters
            </h3>
            <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Configure batch targets, criteria, and Google Sheet destinations
            </p>
          </div>
        </div>

        {jdText.length > 10 && (
          <button
            type="button"
            onClick={() => handleAutoExtract(jdText)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 border cursor-pointer ${
              isDark
                ? 'bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border-indigo-500/30'
                : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-500" /> Auto-Extract Skills
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Row 1: Source & Destination Sheets */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {/* Operation / Batch Name */}
          <div>
            <label className={`block text-xs font-semibold mb-1.5 flex items-center gap-1.5 ${
              isDark ? 'text-slate-300' : 'text-slate-700'
            }`}>
              <Briefcase className="w-3.5 h-3.5 text-indigo-500" />
              Batch / Job Title
            </label>
            <input
              type="text"
              placeholder="e.g. Node.js Developer Batch"
              value={operationName}
              onChange={(e) => setOperationName(e.target.value)}
              className={`w-full border rounded-xl px-3.5 py-2 text-xs transition focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                isDark
                  ? 'bg-slate-950 border-slate-800 text-white placeholder-slate-500 focus:border-indigo-500'
                  : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:bg-white focus:border-indigo-600'
              }`}
            />
          </div>

          {/* Student Applicant Sheet URL */}
          <div>
            <label className={`block text-xs font-semibold mb-1.5 flex items-center gap-1.5 ${
              isDark ? 'text-slate-300' : 'text-slate-700'
            }`}>
              <Table className="w-3.5 h-3.5 text-indigo-500" />
              Applicant Sheet URL <span className="text-indigo-600 dark:text-indigo-400">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="https://docs.google.com/spreadsheets/d/..."
              value={sheetUrl}
              onChange={(e) => setSheetUrl(e.target.value)}
              className={`w-full border rounded-xl px-3.5 py-2 text-xs transition focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                isDark
                  ? 'bg-slate-950 border-slate-800 text-white placeholder-slate-500 focus:border-indigo-500'
                  : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:bg-white focus:border-indigo-600'
              }`}
            />
          </div>

          {/* Master Database Sheet URL */}
          <div>
            <label className={`block text-xs font-semibold mb-1.5 flex items-center justify-between ${
              isDark ? 'text-slate-300' : 'text-slate-700'
            }`}>
              <span className="flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-indigo-500" />
                Master Central Database
              </span>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded border flex items-center gap-1 font-semibold ${
                isDark ? 'text-indigo-300 bg-indigo-950/60 border-indigo-500/30' : 'text-indigo-700 bg-indigo-50 border-indigo-200'
              }`}>
                <Lock className="w-2.5 h-2.5" /> Fixed
              </span>
            </label>
            <div className="relative flex items-center">
              <input
                type="text"
                readOnly
                value={masterSheetUrl}
                className={`w-full border rounded-xl pl-3 pr-20 py-2 text-xs font-mono transition select-all cursor-not-allowed ${
                  isDark
                    ? 'bg-slate-950 border-slate-800 text-slate-400'
                    : 'bg-slate-100 border-slate-300 text-slate-600'
                }`}
              />
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(masterSheetUrl);
                  setCopiedMasterUrl(true);
                  setTimeout(() => setCopiedMasterUrl(false), 2000);
                }}
                className={`absolute right-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition cursor-pointer ${
                  copiedMasterUrl
                    ? 'bg-emerald-600 text-white'
                    : isDark
                    ? 'bg-indigo-600 hover:bg-indigo-500 text-white'
                    : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200'
                }`}
              >
                {copiedMasterUrl ? (
                  <>
                    <Check className="w-3 h-3" /> Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" /> Copy
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Workflow Summary Pills (English Summary replacing verbose Bengali) */}
        <div className={`p-3.5 rounded-xl border text-xs flex items-start gap-3 ${
          isDark ? 'bg-slate-950/60 border-slate-800/80 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-600'
        }`}>
          <div className="p-1 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-6 w-full text-[11px] leading-relaxed">
            <div>
              <span className="font-bold text-slate-900 dark:text-white mr-1.5">• Applicant Sheet:</span>
              <span>Reads CV links, extracts structured experience & skills, and writes score results back.</span>
            </div>
            <div>
              <span className="font-bold text-slate-900 dark:text-white mr-1.5">• Master Database:</span>
              <span>Centrally archives evaluation summaries and updates the master tracking index.</span>
            </div>
          </div>
        </div>

        {/* Row 2: Job Description */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className={`block text-xs font-semibold flex items-center gap-1.5 ${
              isDark ? 'text-slate-300' : 'text-slate-700'
            }`}>
              <FileText className="w-3.5 h-3.5 text-indigo-500" />
              Job Description (JD) <span className="text-indigo-600 dark:text-indigo-400">*</span>
            </label>
            {jdText.length > 10 && (
              <button
                type="button"
                onClick={() => handleAutoExtract(jdText)}
                className={`text-[11px] font-semibold hover:underline flex items-center gap-1 cursor-pointer ${
                  isDark ? 'text-indigo-400' : 'text-indigo-600'
                }`}
              >
                <Sparkles className="w-3 h-3 text-indigo-500" /> Re-extract Skills
              </button>
            )}
          </div>
          <textarea
            required
            rows={3}
            placeholder="Paste job description text here..."
            value={jdText}
            onChange={handleJdChange}
            className={`w-full border rounded-xl px-4 py-2.5 text-xs transition resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
              isDark
                ? 'bg-slate-950 border-slate-800 text-white placeholder-slate-500 focus:border-indigo-500'
                : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:bg-white focus:border-indigo-600'
            }`}
          />
        </div>

        {/* Row 3: Evaluation Criteria (Experience + Skills) */}
        <div className="space-y-3.5">
          {/* Min Experience */}
          <div className={`p-3 px-4 rounded-xl border flex items-center justify-between ${
            isDark ? 'bg-slate-950/40 border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                <Briefcase className="w-4 h-4" />
              </div>
              <div>
                <span className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Minimum Experience Required
                </span>
                <span className={`text-[11px] ml-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  (Parsed from candidate CVs)
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                max="25"
                value={minExperience}
                onChange={(e) => setMinExperience(Math.max(0, parseInt(e.target.value) || 0))}
                className={`w-16 border rounded-lg px-2.5 py-1 text-xs text-center font-bold font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  isDark ? 'bg-slate-900 border-slate-700 text-indigo-400' : 'bg-white border-slate-300 text-indigo-600'
                }`}
              />
              <span className={`text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>Years</span>
            </div>
          </div>

          {/* Skills Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {/* Must-Have Skills */}
            <div className={`p-3.5 rounded-xl border ${
              isDark ? 'bg-slate-950/40 border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <span className={`text-xs font-bold flex items-center gap-1.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Must-Have Skills
                </span>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                  isDark
                    ? 'bg-slate-800 text-slate-300 border-slate-700'
                    : 'bg-slate-200/80 text-slate-800 border-slate-300'
                }`}>
                  Required
                </span>
              </div>

              <div className="flex gap-2 mb-2.5">
                <input
                  type="text"
                  placeholder="e.g. React.js"
                  value={mustHaveTag}
                  onChange={(e) => setMustHaveTag(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addMustHave(); } }}
                  className={`flex-1 border rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/40 ${
                    isDark ? 'bg-slate-900 border-slate-800 text-white placeholder-slate-500' : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'
                  }`}
                />
                <button
                  type="button"
                  onClick={addMustHave}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg px-3 py-1.5 text-xs font-semibold transition flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Add
                </button>
              </div>

              <div className="flex flex-wrap gap-1.5 min-h-[30px] items-center">
                {mustHaveList.length === 0 ? (
                  <span className={`text-[11px] italic ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>No skills added yet</span>
                ) : (
                  mustHaveList.map(tag => (
                    <span key={tag} className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs border font-medium ${
                      isDark
                        ? 'bg-slate-800 text-slate-200 border-slate-700'
                        : 'bg-white text-slate-800 border-slate-300 shadow-2xs'
                    }`}>
                      {tag}
                      <button type="button" onClick={() => removeMustHave(tag)} className="hover:opacity-75 cursor-pointer">
                        <X className="w-3 h-3 text-slate-400 hover:text-slate-600 dark:hover:text-white" />
                      </button>
                    </span>
                  ))
                )}
              </div>
            </div>

            {/* Nice-To-Have Skills */}
            <div className={`p-3.5 rounded-xl border ${
              isDark ? 'bg-slate-950/40 border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <span className={`text-xs font-bold flex items-center gap-1.5 ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`}>
                  Nice-to-Have Skills
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                  Bonus
                </span>
              </div>

              <div className="flex gap-2 mb-2.5">
                <input
                  type="text"
                  placeholder="e.g. Docker"
                  value={niceToHaveTag}
                  onChange={(e) => setNiceToHaveTag(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addNiceToHave(); } }}
                  className={`flex-1 border rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/50 ${
                    isDark ? 'bg-slate-900 border-slate-800 text-white placeholder-slate-500' : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'
                  }`}
                />
                <button
                  type="button"
                  onClick={addNiceToHave}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg px-3 py-1.5 text-xs font-semibold transition flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Add
                </button>
              </div>

              <div className="flex flex-wrap gap-1.5 min-h-[30px] items-center">
                {niceToHaveList.length === 0 ? (
                  <span className={`text-[11px] italic ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>No skills added yet</span>
                ) : (
                  niceToHaveList.map(tag => (
                    <span key={tag} className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs border font-medium ${
                      isDark ? 'bg-indigo-950/40 text-indigo-300 border-indigo-500/30' : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                    }`}>
                      {tag}
                      <button type="button" onClick={() => removeNiceToHave(tag)} className="hover:opacity-75 cursor-pointer">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold shadow-lg shadow-indigo-600/25 transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-wider cursor-pointer disabled:opacity-50 mt-1"
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Evaluating Candidate Resumes...</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-current" />
              <span>Start Candidate Screening</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}
