'use client';

import React from 'react';
import { BookOpen, ShieldCheck, Cpu } from 'lucide-react';
import { skillsList } from '../data/skillsData';

interface SkillRulesViewProps {
  theme: 'dark' | 'light';
}

export default function SkillRulesView({ theme }: SkillRulesViewProps) {
  const isDark = theme === 'dark';

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-indigo-500" />
          Skill Dictionary & Deterministic Rules Engine
        </h2>
        <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
          This system operates with 0% AI Tokens. All skill matching and ATS friendliness evaluations use the rule-based dataset below.
        </p>
      </div>

      {/* ATS Check Parameters */}
      <div className={`p-5 rounded-2xl border ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
        <h3 className="text-sm font-bold flex items-center gap-2 mb-3">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          ATS Format Verification Rules
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div className={`p-3 rounded-xl border ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
            <span className="font-semibold text-indigo-400">1. Text Parseability</span>
            <p className="mt-1 opacity-80">Verifies that PDF/DOCX contains parseable text string data rather than scanned image content.</p>
          </div>
          <div className={`p-3 rounded-xl border ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
            <span className="font-semibold text-indigo-400">2. Contact Regex Inspection</span>
            <p className="mt-1 opacity-80">Detects valid Email patterns, Phone number formats, and LinkedIn/GitHub portfolio links.</p>
          </div>
          <div className={`p-3 rounded-xl border ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
            <span className="font-semibold text-indigo-400">3. Standard Section Headers</span>
            <p className="mt-1 opacity-80">Searches for standard headers: Experience, Education, Technical Skills, Projects, Summary.</p>
          </div>
          <div className={`p-3 rounded-xl border ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
            <span className="font-semibold text-indigo-400">4. Word Density Analyzer</span>
            <p className="mt-1 opacity-80">Ensures document length stays within recommended ATS ranges (300 to 1200 words).</p>
          </div>
        </div>
      </div>

      {/* Skills Dataset Preview */}
      <div className={`p-5 rounded-2xl border ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
        <h3 className="text-sm font-bold flex items-center gap-2 mb-3">
          <Cpu className="w-4 h-4 text-cyan-500" />
          Preloaded Technology Skill Synonyms ({skillsList.length} Categories)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {skillsList.map(sk => (
            <div key={sk.name} className={`p-3 rounded-xl border ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
              <h4 className="text-xs font-bold text-indigo-500">{sk.name}</h4>
              <div className="flex flex-wrap gap-1 mt-2">
                {sk.aliases.map(alias => (
                  <span key={alias} className={`text-[10px] px-2 py-0.5 rounded border font-mono ${
                    isDark ? 'bg-slate-900 border-slate-800 text-slate-300' : 'bg-white border-slate-300 text-slate-700'
                  }`}>
                    {alias}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
