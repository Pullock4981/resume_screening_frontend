'use client';

import React, { useState } from 'react';
import { Play, FileText, Table, Plus, X, AlertCircle, Sparkles, Briefcase } from 'lucide-react';
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
    if (!sheetUrl.trim()) return alert('Please enter the Student Applicant Google Sheet URL.');
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
    <div className={`w-full border backdrop-blur-xl rounded-2xl p-6 transition-colors duration-200 ${
      isDark
        ? 'bg-slate-900/60 border-slate-800 text-slate-100 shadow-2xl'
        : 'bg-white border-slate-200 text-slate-900 shadow-md'
    }`}>
      <h2 className="text-base font-bold mb-4 flex items-center justify-between">
        <span className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-indigo-500" />
          Screening Input Configuration
        </span>
        {jdText.length > 10 && (
          <button
            type="button"
            onClick={() => handleAutoExtract(jdText)}
            className="px-3 py-1 rounded-lg bg-gradient-to-r from-indigo-500/20 to-cyan-500/20 hover:from-indigo-500/30 hover:to-cyan-500/30 text-indigo-400 border border-indigo-500/30 text-xs font-semibold transition flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" /> Auto-Extract Skills from JD
          </button>
        )}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Top Inputs: 3 Key Fields */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Operation / Job Name */}
          <div>
            <label className={`block text-xs font-semibold mb-1.5 flex items-center gap-2 ${
              isDark ? 'text-slate-300' : 'text-slate-700'
            }`}>
              <Briefcase className="w-4 h-4 text-indigo-400" />
              Operation / Job Name
            </label>
            <input
              type="text"
              placeholder="e.g. Node.js Developer Batch"
              value={operationName}
              onChange={(e) => setOperationName(e.target.value)}
              className={`w-full border rounded-xl px-4 py-2 text-sm transition focus:outline-none focus:ring-2 focus:ring-indigo-500/50 ${
                isDark
                  ? 'bg-slate-950/80 border-slate-800 text-white placeholder-slate-500'
                  : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
              }`}
            />
          </div>

          {/* Field 1: Student Applicant Sheet URL */}
          <div>
            <label className={`block text-xs font-semibold mb-1.5 flex items-center gap-2 ${
              isDark ? 'text-slate-300' : 'text-slate-700'
            }`}>
              <Table className="w-4 h-4 text-cyan-400" />
              Student Applicant Sheet URL <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Paste Google Form Response or Applicant Sheet URL"
              value={sheetUrl}
              onChange={(e) => setSheetUrl(e.target.value)}
              className={`w-full border rounded-xl px-4 py-2 text-sm transition focus:outline-none focus:ring-2 focus:ring-indigo-500/50 ${
                isDark
                  ? 'bg-slate-950/80 border-slate-800 text-white placeholder-slate-500'
                  : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
              }`}
            />
          </div>

          {/* Field 2: Master Database Sheet URL */}
          <div>
            <label className={`block text-xs font-semibold mb-1.5 flex items-center gap-2 ${
              isDark ? 'text-slate-300' : 'text-slate-700'
            }`}>
              <Table className="w-4 h-4 text-emerald-500" />
              Master Central Database Sheet URL
            </label>
            <input
              type="text"
              placeholder="https://docs.google.com/spreadsheets/d/your-master-sheet-id/edit"
              value={masterSheetUrl}
              onChange={(e) => setMasterSheetUrl(e.target.value)}
              className={`w-full border rounded-xl px-4 py-2 text-sm transition focus:outline-none focus:ring-2 focus:ring-indigo-500/50 ${
                isDark
                  ? 'bg-slate-950/80 border-slate-800 text-white placeholder-slate-500'
                  : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
              }`}
            />
          </div>
        </div>

        {/* Informational guide box */}
        <div className={`p-3 rounded-xl border text-[11px] flex items-start gap-2.5 ${
          isDark ? 'bg-indigo-950/30 border-indigo-500/20 text-indigo-300' : 'bg-indigo-50/70 border-indigo-200 text-indigo-800'
        }`}>
          <AlertCircle className="w-4 h-4 text-indigo-500 flex-shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-bold">📍 কিভাবে কাজ করবে (Automated Workflow):</span>
            <ul className="list-disc list-inside space-y-0.5 opacity-90">
              <li><strong>Student Applicant Sheet URL:</strong> যে শিটে স্টুডেন্টদের রেসপন্স/সিভি লিঙ্ক আছে (Google Form Sheet)। সিস্টেম সেখান থেকে ডাটা নিয়ে রেজুমে স্ক্রিনিং করবে এবং ফলাফল ঐ শিটেও আপডেট করবে।</li>
              <li><strong>Master Database Sheet URL:</strong> আপনার সেন্ট্রাল মাস্টার গুগল শিট। স্ক্রিনিং শেষে পুরো ব্যাচের রেজাল্ট এবং `Master_Index` সামারি লগে স্বয়ংক্রিয়ভাবে জমা হবে!</li>
            </ul>
          </div>
        </div>

        {/* Job Description Input */}
        <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className={`block text-xs font-semibold flex items-center gap-2 ${
                isDark ? 'text-slate-300' : 'text-slate-700'
              }`}>
                <FileText className="w-4 h-4 text-cyan-500" />
                Job Description (JD) <span className="text-rose-500">*</span>
              </label>
              {jdText.length > 10 && (
                <button
                  type="button"
                  onClick={() => handleAutoExtract(jdText)}
                  className="text-[11px] text-cyan-400 hover:underline flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3 text-cyan-400" /> Extract Skills
                </button>
              )}
            </div>
            <textarea
              required
              rows={4}
              placeholder="Paste Job Description text here..."
              value={jdText}
              onChange={handleJdChange}
              className={`w-full border rounded-xl px-4 py-2.5 text-sm transition resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500/50 ${
                isDark
                  ? 'bg-slate-950/80 border-slate-800 text-white placeholder-slate-500'
                  : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
              }`}
            />
          </div>

        {/* Min Experience & Skills Row */}
        <div className="space-y-4">
          {/* Min Experience Field */}
          <div className={`p-4 rounded-xl border flex items-center justify-between ${
            isDark ? 'bg-slate-950/40 border-slate-800/80' : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <Briefcase className="w-4 h-4 text-indigo-400" />
              </div>
              <div>
                <label className="block text-xs font-semibold">Min Experience Required (Years)</label>
                <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Auto-extracted from JD or set manually (Candidate resumes will be parsed for experience duration)
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                max="25"
                value={minExperience}
                onChange={(e) => setMinExperience(Math.max(0, parseInt(e.target.value) || 0))}
                className={`w-20 border rounded-lg px-3 py-1.5 text-xs text-center font-bold font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
                  isDark ? 'bg-slate-900 border-slate-800 text-cyan-400' : 'bg-white border-slate-300 text-indigo-600'
                }`}
              />
              <span className="text-xs font-medium text-slate-400">Years</span>
            </div>
          </div>

          {/* Skills Tag Input */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Must Have Skills */}
          <div className={`p-4 rounded-xl border ${
            isDark ? 'bg-slate-950/40 border-slate-800/80' : 'bg-slate-50 border-slate-200'
          }`}>
            <label className="block text-xs font-semibold text-rose-500 mb-2">
              Must-Have Skills (Critical Requirement)
            </label>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                placeholder="e.g. React.js"
                value={mustHaveTag}
                onChange={(e) => setMustHaveTag(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addMustHave(); } }}
                className={`flex-1 border rounded-lg px-3 py-1.5 text-xs focus:outline-none ${
                  isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-300 text-slate-900'
                }`}
              />
              <button
                type="button"
                onClick={addMustHave}
                className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/30 rounded-lg px-3 py-1.5 text-xs font-medium transition flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {mustHaveList.map(tag => (
                <span key={tag} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs bg-rose-500/10 text-rose-500 border border-rose-500/20">
                  {tag}
                  <button type="button" onClick={() => removeMustHave(tag)} className="hover:opacity-70">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Nice To Have Skills */}
          <div className={`p-4 rounded-xl border ${
            isDark ? 'bg-slate-950/40 border-slate-800/80' : 'bg-slate-50 border-slate-200'
          }`}>
            <label className="block text-xs font-semibold text-indigo-500 mb-2">
              Nice-to-Have Skills (Bonus Weight)
            </label>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                placeholder="e.g. Docker"
                value={niceToHaveTag}
                onChange={(e) => setNiceToHaveTag(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addNiceToHave(); } }}
                className={`flex-1 border rounded-lg px-3 py-1.5 text-xs focus:outline-none ${
                  isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-300 text-slate-900'
                }`}
              />
              <button
                type="button"
                onClick={addNiceToHave}
                className="bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-500 border border-indigo-500/30 rounded-lg px-3 py-1.5 text-xs font-medium transition flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {niceToHaveList.map(tag => (
                <span key={tag} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
                  {tag}
                  <button type="button" onClick={() => removeNiceToHave(tag)} className="hover:opacity-70">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-bold shadow-lg shadow-indigo-500/25 transition flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isLoading ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Evaluating Candidate Resumes...</span>
            </>
          ) : (
            <>
              <Play className="w-5 h-5 fill-current" />
              <span>Start Screening (Bulk Process & Write to Sheet)</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}
