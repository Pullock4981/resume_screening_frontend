'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  LayoutDashboard,
  User,
  Mail,
  Shield,
  Activity,
  Clock,
  Sparkles,
  PlayCircle,
  FileCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ExternalLink,
  Copy,
  Check,
  Search,
  Filter,
  Calendar,
  TrendingUp,
  BarChart3,
  RefreshCw,
  ArrowUpRight,
  Tv,
  Briefcase,
  Award,
  Zap,
  ChevronRight,
  ShieldCheck,
  CheckSquare,
  Trophy,
  FileText,
  History,
  FileSpreadsheet,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { NavigationTab } from './Sidebar';
import { HistoryRecord } from './HistoryView';
import { AtsHistoryRecord, GithubCheckItem, LinkedinHistoryRecord } from '../types';

const GithubIcon = ({ className = 'w-4 h-4' }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
  </svg>
);

const LinkedinIcon = ({ className = 'w-4 h-4' }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"/>
  </svg>
);

interface PersonalDashboardViewProps {
  theme?: 'dark' | 'light';
  historyRecords: HistoryRecord[];
  atsHistoryRecords?: AtsHistoryRecord[];
  githubHistoryRecords?: any[];
  linkedinHistoryRecords?: any[];
  nexViewHistoryRecords?: any[];
  onNavigateTab: (tab: NavigationTab) => void;
  onSelectRecord?: (record: any) => void;
  onSyncHistory?: () => void;
  isSyncing?: boolean;
  showToolUsageChart?: boolean;
}

export default function PersonalDashboardView({
  theme = 'dark',
  historyRecords = [],
  atsHistoryRecords = [],
  githubHistoryRecords = [],
  linkedinHistoryRecords = [],
  nexViewHistoryRecords = [],
  onNavigateTab,
  onSelectRecord,
  onSyncHistory,
  isSyncing = false,
  showToolUsageChart = false
}: PersonalDashboardViewProps) {
  const isDark = theme === 'dark';
  const { user, token, isAdmin } = useAuth();
  const isAdministrator = Boolean(isAdmin || showToolUsageChart || user?.role === 'admin');
  const currentUserEmail = (user?.email || '').trim().toLowerCase();

  const CENTRAL_GOOGLE_SHEET_URL = 'https://docs.google.com/spreadsheets/d/1O84kcu_A4V4Chsb6TPQEwGNxhuqu1Qml431I7yEQu3I/edit?gid=0#gid=0';
  const [isSheetExpanded, setIsSheetExpanded] = useState(false);
  const [isSheetLoading, setIsSheetLoading] = useState(true);
  const [isCopiedSheetUrl, setIsCopiedSheetUrl] = useState(false);

  const handleCopySheetUrl = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    navigator.clipboard.writeText(CENTRAL_GOOGLE_SHEET_URL);
    setIsCopiedSheetUrl(true);
    setTimeout(() => setIsCopiedSheetUrl(false), 2000);
  };

  const [backendLogs, setBackendLogs] = useState<any[]>([]);
  const [isLogsLoading, setIsLogsLoading] = useState(false);
  const [activitySearchQuery, setActivitySearchQuery] = useState('');
  const [activityCategoryFilter, setActivityCategoryFilter] = useState<'all' | 'screening' | 'ats' | 'github' | 'linkedin' | 'nexview'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const getBackendUrl = () => {
    if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
      return 'http://localhost:5000';
    }
    return process.env.NEXT_PUBLIC_BACKEND_URL || 'https://resume-screening-backend.vercel.app';
  };

  const BACKEND_URL = getBackendUrl();

  // Fetch verified user activity logs from backend
  const fetchUserLogs = async () => {
    setIsLogsLoading(true);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    try {
      const res = await fetch(`${BACKEND_URL}/api/activity/logs`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      if (res.ok) {
        const data = await res.json();
        if (data.logs && Array.isArray(data.logs)) {
          setBackendLogs(data.logs);
        }
      }
    } catch (e: any) {
      clearTimeout(timeoutId);
      console.warn('Backend activity logs skipped/timeout:', e.message || e);
    } finally {
      setIsLogsLoading(false);
    }
  };

  const [serverHistory, setServerHistory] = useState<any[]>([]);

  const fetchHistory = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/history`);
      if (res.ok) {
        const data = await res.json();
        if (data.history && Array.isArray(data.history)) {
          setServerHistory(data.history);
        }
      }
    } catch (err) {}
  };

  useEffect(() => {
    fetchUserLogs();
    fetchHistory();
  }, [token, currentUserEmail]);

  // Filter logs for this specific user
  const userLogs = useMemo(() => {
    if (!currentUserEmail) return [];
    return backendLogs.filter(l => {
      const logEmail = (l.email || '').trim().toLowerCase();
      return logEmail === currentUserEmail;
    });
  }, [backendLogs, currentUserEmail]);

  // Calculate Tool Usage Statistics for Admin Chart (Image 2)
  const adminToolStats = useMemo(() => {
    const combinedHistory = [
      ...serverHistory,
      ...historyRecords,
      ...atsHistoryRecords,
      ...githubHistoryRecords,
      ...linkedinHistoryRecords
    ];

    const uniqueHistoryMap = new Map<string, any>();
    combinedHistory.forEach(h => {
      const key = h.id || `${h.timestamp}_${h.operationName}`;
      if (key && !uniqueHistoryMap.has(key)) {
        uniqueHistoryMap.set(key, h);
      }
    });
    const historyList = uniqueHistoryMap.size > 0 ? Array.from(uniqueHistoryMap.values()) : combinedHistory;

    const ghHistory = historyList.filter(h => h.type === 'github' || /github/i.test(h.operationName || ''));
    const ghLogs = backendLogs.filter(l => l.details && /github/i.test(l.details));
    const githubRuns = Math.max(ghHistory.length, ghLogs.length);
    const githubCandidates = ghHistory.reduce((acc, h) => acc + (h.totalCandidates || (h.results ? h.results.length : 0)), 0);

    const liHistory = historyList.filter(h => h.type === 'linkedin' || /linkedin/i.test(h.operationName || ''));
    const liLogs = backendLogs.filter(l => l.details && /linkedin/i.test(l.details));
    const linkedinRuns = Math.max(liHistory.length, liLogs.length);
    const linkedinCandidates = liHistory.reduce((acc, h) => acc + (h.totalCandidates || (h.results ? h.results.length : 0)), 0);

    const screeningHistory = historyList.filter(h => (h.type === 'screening' || h.type === 'job') && !/ats/i.test(h.operationName || '') && !/github/i.test(h.operationName || '') && !/linkedin/i.test(h.operationName || ''));
    const screeningLogs = backendLogs.filter(l => l.details && /screening|job|jd/i.test(l.details));
    const screeningRuns = Math.max(screeningHistory.length, screeningLogs.length);
    const screeningCandidates = screeningHistory.reduce((acc, h) => acc + (h.totalCandidates || (h.candidates ? h.candidates.length : 0) || (h.results ? h.results.length : 0)), 0);

    const atsHistory = historyList.filter(h => h.type === 'ats' || (/ats/i.test(h.operationName || '') && !/github/i.test(h.operationName || '') && !/linkedin/i.test(h.operationName || '')));
    const atsLogs = backendLogs.filter(l => l.details && /ats/i.test(l.details));
    const atsRuns = Math.max(atsHistory.length, atsLogs.length);
    const atsCandidates = atsHistory.reduce((acc, h) => acc + (h.totalCandidates || (h.candidates ? h.candidates.length : 0) || (h.results ? h.results.length : 0)), 0);

    const totalToolRuns = githubRuns + screeningRuns + atsRuns + linkedinRuns || 1;
    const totalCandidatesCount = githubCandidates + screeningCandidates + atsCandidates + linkedinCandidates;

    const githubPct = Math.round((githubRuns / totalToolRuns) * 100);
    const linkedinPct = Math.round((linkedinRuns / totalToolRuns) * 100);
    const screeningPct = Math.round((screeningRuns / totalToolRuns) * 100);
    const atsPct = Math.round((atsRuns / totalToolRuns) * 100);

    const toolsData = [
      {
        id: 'ats',
        name: 'ATS Resume Check',
        shortName: 'ATS Check',
        runs: atsRuns,
        candidates: atsCandidates,
        pct: atsPct,
        color: '#6366F1',
        icon: CheckCircle2,
        typeLabel: 'Resumes'
      },
      {
        id: 'screening',
        name: 'Resume Screener',
        shortName: 'JD Screening',
        runs: screeningRuns,
        candidates: screeningCandidates,
        pct: screeningPct,
        color: '#4F46E5',
        icon: FileText,
        typeLabel: 'Resumes'
      },
      {
        id: 'github',
        name: 'GitHub Profile Auditor',
        shortName: 'GitHub Check',
        runs: githubRuns,
        candidates: githubCandidates,
        pct: githubPct,
        color: '#A5B4FC',
        icon: GithubIcon,
        typeLabel: 'Profiles'
      },
      {
        id: 'linkedin',
        name: 'LinkedIn Profile Check',
        shortName: 'LinkedIn Check',
        runs: linkedinRuns,
        candidates: linkedinCandidates,
        pct: linkedinPct,
        color: '#818CF8',
        icon: LinkedinIcon,
        typeLabel: 'Profiles'
      }
    ];

    const mostUsed = [...toolsData].sort((a, b) => b.runs - a.runs)[0];
    const maxRunCount = Math.max(...toolsData.map(t => t.runs), 1);

    return {
      toolsData,
      mostUsed,
      maxRunCount,
      totalToolRuns,
      totalCandidatesCount
    };
  }, [serverHistory, historyRecords, atsHistoryRecords, githubHistoryRecords, linkedinHistoryRecords, backendLogs]);

  // Helper to determine if an operation belongs to this user
  const doesRecordBelongToUser = (record: any) => {
    if (!currentUserEmail) return true;
    if (record.userEmail && record.userEmail.trim().toLowerCase() === currentUserEmail) return true;

    // Check if operation name appears in this user's activity logs
    const op = (record.operationName || '').trim().toLowerCase();
    if (op && op.length > 2) {
      const match = userLogs.find(l => (l.details || '').toLowerCase().includes(op));
      if (match) return true;
    }

    return false;
  };

  const allScreeningHistory = useMemo(() => {
    const list = [...historyRecords, ...serverHistory.filter(h => (h.type === 'screening' || h.type === 'job') && !/ats/i.test(h.operationName || '') && !/github/i.test(h.operationName || '') && !/linkedin/i.test(h.operationName || ''))];
    const map = new Map();
    list.forEach(r => { const k = r.id || `${r.timestamp}_${r.operationName}`; if (!map.has(k)) map.set(k, r); });
    return Array.from(map.values());
  }, [historyRecords, serverHistory]);

  const allAtsHistory = useMemo(() => {
    const list = [...atsHistoryRecords, ...serverHistory.filter(h => h.type === 'ats' || (/ats/i.test(h.operationName || '') && !/github/i.test(h.operationName || '') && !/linkedin/i.test(h.operationName || '')))];
    const map = new Map();
    list.forEach(r => { const k = r.id || `${r.timestamp}_${r.operationName}`; if (!map.has(k)) map.set(k, r); });
    return Array.from(map.values());
  }, [atsHistoryRecords, serverHistory]);

  const allGithubHistory = useMemo(() => {
    const list = [...githubHistoryRecords, ...serverHistory.filter(h => h.type === 'github' || /github/i.test(h.operationName || ''))];
    const map = new Map();
    list.forEach(r => { const k = r.id || `${r.timestamp}_${r.operationName}`; if (!map.has(k)) map.set(k, r); });
    return Array.from(map.values());
  }, [githubHistoryRecords, serverHistory]);

  const allLinkedinHistory = useMemo(() => {
    const list = [...linkedinHistoryRecords, ...serverHistory.filter(h => h.type === 'linkedin' || /linkedin/i.test(h.operationName || ''))];
    const map = new Map();
    list.forEach(r => { const k = r.id || `${r.timestamp}_${r.operationName}`; if (!map.has(k)) map.set(k, r); });
    return Array.from(map.values());
  }, [linkedinHistoryRecords, serverHistory]);

  // User-specific Tool Records
  const myScreeningRecords = useMemo(() => {
    return allScreeningHistory.filter(r =>
      !/ats/i.test(r.operationName || '') &&
      !/github/i.test(r.operationName || '') &&
      !/linkedin/i.test(r.operationName || '') &&
      (r as any).type !== 'github' &&
      (r as any).type !== 'ats' &&
      (r as any).type !== 'linkedin' &&
      doesRecordBelongToUser(r)
    );
  }, [allScreeningHistory, userLogs, currentUserEmail]);

  const myAtsRecords = useMemo(() => {
    return allAtsHistory.filter(r => doesRecordBelongToUser(r));
  }, [allAtsHistory, userLogs, currentUserEmail]);

  const myGithubRecords = useMemo(() => {
    return allGithubHistory.filter(r => doesRecordBelongToUser(r));
  }, [allGithubHistory, userLogs, currentUserEmail]);

  const myLinkedinRecords = useMemo(() => {
    return allLinkedinHistory.filter(r => doesRecordBelongToUser(r));
  }, [allLinkedinHistory, userLogs, currentUserEmail]);

  const myNexViewRecords = useMemo(() => {
    return nexViewHistoryRecords.filter(r => doesRecordBelongToUser(r));
  }, [nexViewHistoryRecords, userLogs, currentUserEmail]);

  // Aggregate Candidates and Evaluations Count
  const screeningCandidates = myScreeningRecords.reduce((acc, r) => acc + (r.totalCandidates || (r.candidates ? r.candidates.length : 0)), 0);
  const screeningGoodToGo = myScreeningRecords.reduce((acc, r) => acc + (r.goodToGoCount || 0), 0);
  const screeningWaiting = myScreeningRecords.reduce((acc, r) => acc + (r.waitingListCount || 0), 0);
  const screeningReject = myScreeningRecords.reduce((acc, r) => acc + (r.notMatchingCount || 0), 0);

  const atsCandidates = myAtsRecords.reduce((acc, r) => acc + (r.totalCandidates || (r.results ? r.results.length : 0)), 0);
  const atsFriendly = myAtsRecords.reduce((acc, r) => acc + (r.excellentCount || 0), 0);
  const atsNeedsWork = myAtsRecords.reduce((acc, r) => acc + ((r.strongCount || 0) + (r.moderateCount || 0)), 0);
  const atsRisk = myAtsRecords.reduce((acc, r) => acc + (r.needsWorkCount || 0), 0);

  const githubCandidates = myGithubRecords.reduce((acc, r) => acc + (r.totalCandidates || (r.results ? r.results.length : 0)), 0);
  const githubHigh = myGithubRecords.reduce((acc, r) => acc + ((r.excellentCount || 0) + (r.strongCount || 0)), 0);

  const linkedinCandidates = myLinkedinRecords.reduce((acc, r) => acc + (r.totalCandidates || (r.results ? r.results.length : 0)), 0);
  const linkedinHigh = myLinkedinRecords.reduce((acc, r) => acc + ((r.excellentCount || 0) + (r.strongCount || 0)), 0);

  const nexViewInterviews = myNexViewRecords.reduce((acc, r) => acc + (r.totalCandidates || (r.results ? r.results.length : 1)), 0);

  const totalCandidatesProcessed = screeningCandidates + atsCandidates + githubCandidates + linkedinCandidates + nexViewInterviews;
  const totalOperationsRun = myScreeningRecords.length + myAtsRecords.length + myGithubRecords.length + myLinkedinRecords.length + myNexViewRecords.length;

  const totalHighQualityCandidates = screeningGoodToGo + atsFriendly + githubHigh + linkedinHigh;
  const successPercentage = totalCandidatesProcessed > 0
    ? Math.min(100, Math.round((totalHighQualityCandidates / totalCandidatesProcessed) * 100))
    : 0;

  // Active tools count
  const toolsUsedCount = [
    myScreeningRecords.length > 0,
    myAtsRecords.length > 0,
    myGithubRecords.length > 0,
    myLinkedinRecords.length > 0,
    myNexViewRecords.length > 0,
    userLogs.some(l => /assignment/i.test(l.details || ''))
  ].filter(Boolean).length;

  // Display counts for Tool Breakdown Cards (Admin cards show Admin's personal counts)
  const displayScreeningRuns = myScreeningRecords.length;
  const displayScreeningCandidates = screeningCandidates;

  const displayAtsRuns = myAtsRecords.length;
  const displayAtsCandidates = atsCandidates;

  const displayGithubRuns = myGithubRecords.length;
  const displayGithubCandidates = githubCandidates;

  const displayLinkedinRuns = myLinkedinRecords.length;
  const displayLinkedinCandidates = linkedinCandidates;

  const displayNexViewRuns = myNexViewRecords.length;
  const displayNexViewCandidates = nexViewInterviews;

  // Unified Chronological Activity Timeline
  const timelineActivities = useMemo(() => {
    const list: Array<{
      id: string;
      toolName: string;
      toolType: 'screening' | 'ats' | 'github' | 'linkedin' | 'nexview' | 'system';
      title: string;
      details: string;
      timestamp: string;
      dateFormatted: string;
      candidateCount?: number;
      sheetUrl?: string;
      rawRecord?: any;
    }> = [];

    // Add screening batches
    myScreeningRecords.forEach(r => {
      list.push({
        id: `act_${r.id}`,
        toolName: 'Resume Screening',
        toolType: 'screening',
        title: r.operationName || 'Resume Screening Batch',
        details: `Screened ${r.totalCandidates || (r.candidates ? r.candidates.length : 0)} candidate(s) against Job Description (${r.goodToGoCount || 0} Shortlisted)`,
        timestamp: r.timestamp || new Date().toISOString(),
        dateFormatted: r.dateFormatted || 'Recent',
        candidateCount: r.totalCandidates || (r.candidates ? r.candidates.length : 0),
        sheetUrl: r.studentSheetUrl,
        rawRecord: r
      });
    });

    // Add ATS batches
    myAtsRecords.forEach(r => {
      list.push({
        id: `act_${r.id}`,
        toolName: 'ATS Resume Check',
        toolType: 'ats',
        title: r.operationName || 'ATS Resume Rubric Evaluation',
        details: `Evaluated ${r.totalCandidates || (r.results ? r.results.length : 0)} resume(s) with 100-Point Rubric (${r.excellentCount || 0} ATS Friendly)`,
        timestamp: r.timestamp || new Date().toISOString(),
        dateFormatted: r.dateFormatted || 'Recent',
        candidateCount: r.totalCandidates || (r.results ? r.results.length : 0),
        sheetUrl: r.studentSheetUrl,
        rawRecord: r
      });
    });

    // Add GitHub batches
    myGithubRecords.forEach(r => {
      list.push({
        id: `act_${r.id}`,
        toolName: 'GitHub Profile Check',
        toolType: 'github',
        title: r.operationName || 'GitHub Profile Audit',
        details: `Audited ${r.totalCandidates || (r.results ? r.results.length : 0)} candidate profile(s) with 60-Point Quantitative Rubric`,
        timestamp: r.timestamp || new Date().toISOString(),
        dateFormatted: r.dateFormatted || 'Recent',
        candidateCount: r.totalCandidates || (r.results ? r.results.length : 0),
        sheetUrl: r.studentSheetUrl,
        rawRecord: r
      });
    });

    // Add LinkedIn batches
    myLinkedinRecords.forEach(r => {
      list.push({
        id: `act_${r.id}`,
        toolName: 'LinkedIn Profile Check',
        toolType: 'linkedin',
        title: r.operationName || 'LinkedIn Profile Audit',
        details: `Audited ${r.totalCandidates || (r.results ? r.results.length : 0)} LinkedIn profile(s) with 60-Point Quantitative Rubric`,
        timestamp: r.timestamp || new Date().toISOString(),
        dateFormatted: r.dateFormatted || 'Recent',
        candidateCount: r.totalCandidates || (r.results ? r.results.length : 0),
        sheetUrl: r.studentSheetUrl,
        rawRecord: r
      });
    });

    // Add NexView records
    myNexViewRecords.forEach(r => {
      list.push({
        id: `act_${r.id}`,
        toolName: 'NexView Interview',
        toolType: 'nexview',
        title: r.operationName || 'NexView Interview Session',
        details: `Candidate interview evaluation conducted with rubric feedback notes`,
        timestamp: r.timestamp || new Date().toISOString(),
        dateFormatted: r.dateFormatted || 'Recent',
        candidateCount: r.totalCandidates || 1,
        rawRecord: r
      });
    });

    // Add backend activity log entries if not duplicate
    userLogs.forEach((l, idx) => {
      const details = l.details || 'User session activity';
      const isAlreadyInList = list.some(item => details.includes(item.title));
      if (!isAlreadyInList) {
        let toolType: 'screening' | 'ats' | 'github' | 'linkedin' | 'nexview' | 'system' = 'system';
        let toolName = 'Account Activity';

        if (/screening|job/i.test(details)) {
          toolType = 'screening';
          toolName = 'Resume Screening';
        } else if (/ats/i.test(details)) {
          toolType = 'ats';
          toolName = 'ATS Resume Check';
        } else if (/github/i.test(details)) {
          toolType = 'github';
          toolName = 'GitHub Profile Check';
        } else if (/linkedin/i.test(details)) {
          toolType = 'linkedin';
          toolName = 'LinkedIn Profile Check';
        } else if (/nexview/i.test(details)) {
          toolType = 'nexview';
          toolName = 'NexView Tool';
        }

        list.push({
          id: `log_${idx}_${l.loginTime || Date.now()}`,
          toolName,
          toolType,
          title: details.split('(')[0].trim() || 'System Operation',
          details,
          timestamp: l.loginTime || new Date().toISOString(),
          dateFormatted: l.loginTime || 'Recent'
        });
      }
    });

    // Sort descending by timestamp
    return list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [myScreeningRecords, myAtsRecords, myGithubRecords, myLinkedinRecords, myNexViewRecords, userLogs]);

  // Filtered timeline
  const filteredTimeline = useMemo(() => {
    return timelineActivities.filter(item => {
      const matchesCategory =
        activityCategoryFilter === 'all'
          ? true
          : item.toolType === activityCategoryFilter;

      const q = activitySearchQuery.toLowerCase();
      const matchesSearch =
        item.title.toLowerCase().includes(q) ||
        item.details.toLowerCase().includes(q) ||
        item.toolName.toLowerCase().includes(q) ||
        (item.sheetUrl || '').toLowerCase().includes(q);

      return matchesCategory && matchesSearch;
    });
  }, [timelineActivities, activityCategoryFilter, activitySearchQuery]);

  const handleCopyUrl = (id: string, url: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getToolIcon = (type: string) => {
    switch (type) {
      case 'screening':
        return <PlayCircle className="w-4 h-4 text-indigo-400" />;
      case 'ats':
        return <FileCheck className="w-4 h-4 text-emerald-400" />;
      case 'github':
        return <GithubIcon className="w-4 h-4 text-sky-400" />;
      case 'linkedin':
        return <LinkedinIcon className="w-4 h-4 text-blue-400" />;
      case 'nexview':
        return <Tv className="w-4 h-4 text-amber-400" />;
      default:
        return <Sparkles className="w-4 h-4 text-indigo-400" />;
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* 1. Header Profile Banner */}
      <div className={`p-6 sm:p-7 rounded-2xl border transition-all duration-300 relative overflow-hidden ${
        isDark
          ? 'bg-slate-900 border-slate-800 text-white shadow-xl'
          : 'bg-white border-slate-200 text-slate-900 shadow-sm'
      }`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black text-2xl shrink-0 shadow-lg shadow-indigo-600/30">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight">
                  {showToolUsageChart ? `${user?.name || 'Admin'} (Admin Dashboard)` : (user?.name || 'Personal Workspace')}
                </h1>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider border ${
                  user?.role === 'admin'
                    ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                    : 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400'
                }`}>
                  {user?.role || 'Mentor / User'}
                </span>
                {showToolUsageChart && (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-indigo-400" />
                    Admin Personal Dashboard
                  </span>
                )}
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Active Account
                </span>
                {user?.team && (
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1.5 ${
                    isDark ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400' : 'bg-indigo-50 border-indigo-200 text-indigo-700'
                  }`}>
                    <span>👥</span>
                    <span>Team: {user.team}</span>
                  </span>
                )}
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1.5 ${
                  isDark ? 'bg-slate-800/80 border-slate-700 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-700'
                }`}>
                  <img src="/assats/placement-logo.png" alt="Placement Kit" className="w-3.5 h-3.5 object-contain" />
                  <span>Placement Kit Workspace</span>
                </span>
              </div>
              <p className={`text-xs mt-1 flex items-center gap-2 font-mono ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                <Mail className="w-3.5 h-3.5 text-indigo-400" />
                <span>{user?.email || 'user@system.com'}</span>
                <span>•</span>
                <span>ID: {user?.id || 'usr_active'}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => {
                fetchUserLogs();
                fetchHistory();
                if (onSyncHistory) onSyncHistory();
              }}
              disabled={isLogsLoading || isSyncing}
              className={`px-4 py-2 rounded-xl text-xs font-semibold border flex items-center gap-2 transition cursor-pointer ${
                isDark
                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
              }`}
            >
              <RefreshCw className={`w-3.5 h-3.5 text-indigo-400 ${isLogsLoading || isSyncing ? 'animate-spin' : ''}`} />
              <span>{isLogsLoading || isSyncing ? 'Syncing Activity...' : 'Sync Activity Stats'}</span>
            </button>

            {isAdministrator ? (
              <a
                href={CENTRAL_GOOGLE_SHEET_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-emerald-600/25 cursor-pointer"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Central Google Sheet</span>
                <ExternalLink className="w-3.5 h-3.5 ml-0.5 opacity-80" />
              </a>
            ) : (
              <button
                onClick={() => onNavigateTab('screening')}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-indigo-600/25 cursor-pointer"
              >
                <PlayCircle className="w-4 h-4" />
                <span>Launch Screening</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. Top Summary KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* KPI 1: Total Operations */}
        <div className={`p-5 rounded-2xl border transition-all ${
          isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className={`text-xs font-semibold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Total Operations Executed
            </span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className={`text-2xl sm:text-3xl font-black font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {totalOperationsRun}
          </div>
          <div className={`text-[11px] mt-1 font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Across all candidate evaluation tools
          </div>
        </div>

        {/* KPI 2: Total Candidates Processed */}
        <div className={`p-5 rounded-2xl border transition-all ${
          isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className={`text-xs font-semibold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Total Candidates Processed
            </span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-emerald-400">
            {totalCandidatesProcessed}
          </div>
          <div className={`text-[11px] mt-1 font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Resumes, GitHub & LinkedIn profiles parsed
          </div>
        </div>

        {/* KPI 3: Tools Actively Utilized */}
        <div className={`p-5 rounded-2xl border transition-all ${
          isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className={`text-xs font-semibold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Tools Actively Used
            </span>
            <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
              <BarChart3 className="w-4 h-4" />
            </div>
          </div>
          <div className={`text-2xl sm:text-3xl font-black font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {toolsUsedCount} <span className="text-sm font-normal text-slate-500">/ 6 Tools</span>
          </div>
          <div className={`text-[11px] mt-1 font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Multi-tool pipeline adoption
          </div>
        </div>

        {/* KPI 4: High Match / Shortlist Quality Rate */}
        <div className={`p-5 rounded-2xl border transition-all ${
          isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className={`text-xs font-semibold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              High Quality Pass Rate
            </span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-amber-400">
            {successPercentage}%
          </div>
          <div className={`text-[11px] mt-1 font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            {totalHighQualityCandidates} candidates rated Shortlist / Strong
          </div>
        </div>
      </div>

      {/* 2.4 Central Google Sheet Master Database Section (For Admin) */}
      {isAdministrator && (
        <div className={`p-5 sm:p-6 rounded-2xl border transition-all shadow-sm ${
          isDark
            ? 'bg-gradient-to-r from-emerald-950/30 via-slate-900 to-indigo-950/20 border-emerald-500/30 text-white'
            : 'bg-gradient-to-r from-emerald-50/70 via-white to-indigo-50/40 border-emerald-200 text-slate-900'
        }`}>
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            {/* Left Info Area - Clickable to toggle sheet preview */}
            <div 
              onClick={() => setIsSheetExpanded(prev => !prev)}
              className="flex items-start gap-4 cursor-pointer select-none group flex-1"
            >
              <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 group-hover:scale-105 group-hover:border-emerald-400 transition-all shadow-xs shrink-0">
                <FileSpreadsheet className="w-7 h-7 text-emerald-400" />
              </div>

              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h3 className="text-base sm:text-lg font-black tracking-tight flex items-center gap-2">
                    <span>Central Master Google Sheet</span>
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                      সেন্ট্রাল শিট ডেটাবেজ
                    </span>
                  </h3>
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Live Cloud Sync Active
                  </span>
                </div>

                <p className={`text-xs mt-1.5 max-w-2xl leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                  সকল ক্যান্ডিডেট স্ক্রিনিং, রেজাল্ট ডেটা, শর্টলিস্ট স্ট্যাটাস এবং অ্যাক্টিভিটি হিস্ট্রি স্বয়ংক্রিয়ভাবে এই সেন্ট্রাল গুগল শিটে রিয়েল-টাইমে সিঙ্ক ও স্টোর হচ্ছে। ক্লিক করে সরাসরি ডেটাবেজ শিট দেখুন।
                </p>

                {/* Live Sheet URL Pill & Badges */}
                <div className="flex items-center gap-2 mt-2.5 flex-wrap">
                  <div className={`px-2.5 py-1 rounded-lg text-[11px] font-mono border flex items-center gap-1.5 ${
                    isDark ? 'bg-slate-950/60 border-slate-800 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-700'
                  }`}>
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span className="truncate max-w-[280px] sm:max-w-md">
                      {CENTRAL_GOOGLE_SHEET_URL}
                    </span>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                    isDark ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-300' : 'bg-indigo-50 border-indigo-200 text-indigo-700'
                  }`}>
                    0% AI Tokens • Deterministic
                  </span>
                </div>
              </div>
            </div>

            {/* Right Action Buttons */}
            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap w-full lg:w-auto shrink-0">
              {/* Toggle Inline Preview */}
              <button
                type="button"
                onClick={() => setIsSheetExpanded(prev => !prev)}
                className={`flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-xs font-bold border transition flex items-center justify-center gap-2 cursor-pointer shadow-xs ${
                  isSheetExpanded
                    ? isDark
                      ? 'bg-slate-800 text-white border-slate-700 hover:bg-slate-700'
                      : 'bg-slate-200 text-slate-900 border-slate-300 hover:bg-slate-300'
                    : isDark
                      ? 'bg-emerald-600/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-600/30'
                      : 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
                }`}
              >
                {isSheetExpanded ? <EyeOff className="w-4 h-4 text-emerald-400" /> : <Eye className="w-4 h-4 text-emerald-400" />}
                <span>{isSheetExpanded ? 'Hide Sheet Preview' : 'View Central Sheet'}</span>
                {isSheetExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>

              {/* Copy URL Button */}
              <button
                type="button"
                onClick={handleCopySheetUrl}
                title="Copy Google Sheet Link"
                className={`p-2.5 rounded-xl text-xs font-semibold border transition flex items-center justify-center cursor-pointer ${
                  isDark
                    ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                }`}
              >
                {isCopiedSheetUrl ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>

              {/* Open in New Window */}
              <a
                href={CENTRAL_GOOGLE_SHEET_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-md shadow-emerald-600/25 cursor-pointer"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Open in Google Sheets</span>
                <ExternalLink className="w-3.5 h-3.5 opacity-80" />
              </a>
            </div>
          </div>

          {/* Inline Interactive Google Sheet Viewer */}
          {isSheetExpanded && (
            <div className={`mt-5 rounded-xl border overflow-hidden transition-all duration-300 ${
              isDark ? 'border-slate-800 bg-slate-950' : 'border-slate-200 bg-slate-50'
            }`}>
              {/* Iframe Top Bar */}
              <div className={`px-4 py-2.5 border-b flex items-center justify-between gap-3 text-xs ${
                isDark ? 'bg-slate-900 border-slate-800 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-700'
              }`}>
                <div className="flex items-center gap-2 font-mono">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="font-semibold text-emerald-400">Live Central Sheet View:</span>
                  <span className="text-[11px] truncate max-w-xs sm:max-w-md opacity-80">
                    Google Spreadsheets Viewer (All Candidate Records & Logs)
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={CENTRAL_GOOGLE_SHEET_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline flex items-center gap-1 font-semibold text-emerald-400"
                  >
                    <span>Full Tab</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                  <button
                    type="button"
                    onClick={() => setIsSheetExpanded(false)}
                    className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white"
                  >
                    <EyeOff className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Iframe Container */}
              <div className="relative w-full h-[600px] bg-slate-900">
                {isSheetLoading && (
                  <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-slate-950/80 backdrop-blur-xs text-white">
                    <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                    <span className="text-xs font-medium tracking-wide text-slate-300">
                      Loading Central Google Sheet...
                    </span>
                  </div>
                )}
                <iframe
                  src="https://docs.google.com/spreadsheets/d/1O84kcu_A4V4Chsb6TPQEwGNxhuqu1Qml431I7yEQu3I/preview"
                  title="Central Master Google Sheet"
                  onLoad={() => setIsSheetLoading(false)}
                  className="w-full h-full border-0"
                  allowFullScreen
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* 2.5 Admin Tool Usage Analytics & Statistics (Bar Chart - Image 2) */}
      {showToolUsageChart && (
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold flex items-center gap-2">
                <BarChart3 className="w-4.5 h-4.5 text-indigo-500" />
                <span className={isDark ? 'text-white' : 'text-slate-900'}>
                  Tool Usage Analytics & Statistics (কোন Tool কেমন Use হচ্ছে)
                </span>
              </h3>
              <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Real-time execution analytics across all 3 AI-Free screening tools
              </p>
            </div>

            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
              isDark ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
            }`}>
              Total Executed: {adminToolStats.totalToolRuns} Operations ({adminToolStats.totalCandidatesCount} Candidates)
            </span>
          </div>

          <div className={`w-full p-5 sm:p-6 rounded-2xl border transition shadow-xs flex flex-col justify-between ${
            isDark ? 'bg-slate-900/80 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div>
              <div className="flex items-center justify-between border-b pb-3 mb-3 border-slate-200 dark:border-slate-800">
                <div>
                  <h4 className="text-xs font-bold tracking-wide uppercase text-indigo-500 flex items-center gap-1.5">
                    <Activity className="w-4 h-4" /> TOOL EXECUTIONS FREQUENCY (BAR CHART)
                  </h4>
                  <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    Showing total execution count per tool (Actual run numbers, not percentage)
                  </p>
                </div>
                <span className="text-xs font-bold text-emerald-500 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                  ⚡ Live Counts
                </span>
              </div>

              {/* Highlight Banner: Most Used Tool */}
              <div className={`p-3 rounded-xl border flex items-center justify-between text-xs mb-3 ${
                isDark
                  ? 'bg-indigo-950/40 border-indigo-500/30 text-slate-200'
                  : 'bg-indigo-50/80 border-indigo-200 text-indigo-900'
              }`}>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-500 flex items-center justify-center font-bold">
                    <Trophy className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-xs">
                      Most Used Tool: <strong>{adminToolStats.mostUsed.name}</strong>
                    </span>
                    <span className={`block text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                      Total {adminToolStats.mostUsed.runs} runs recorded ({adminToolStats.mostUsed.pct}% of all operations)
                    </span>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-lg text-xs font-extrabold bg-indigo-600 text-white shadow-xs">
                  {adminToolStats.mostUsed.runs} Executions
                </span>
              </div>
            </div>

            {/* Vertical Comparative Bars showing RUN COUNT */}
            <div className="h-56 pt-2 pb-2 flex items-end justify-around gap-6">
              {adminToolStats.toolsData.map(tool => {
                const isTop = tool.id === adminToolStats.mostUsed.id;
                const heightPct = Math.max(25, Math.round((tool.runs / adminToolStats.maxRunCount) * 100));
                const targetTab = tool.id === 'ats'
                  ? 'adminAtsHistory'
                  : tool.id === 'screening'
                  ? 'adminScreeningHistory'
                  : tool.id === 'github'
                  ? 'adminGithubHistory'
                  : 'adminLinkedinHistory';

                return (
                  <div
                    key={tool.id}
                    onClick={() => onNavigateTab(targetTab)}
                    title={`Click to view ${tool.name} History & Statistics`}
                    className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer"
                  >
                    {/* Top Label: Badge & Exact Run Count */}
                    <div className="flex flex-col items-center mb-1.5 transition-transform group-hover:-translate-y-1">
                      {isTop && (
                        <span className="text-[10px] font-black uppercase text-amber-500 flex items-center gap-0.5 mb-0.5">
                          <Trophy className="w-3 h-3" /> Most Used
                        </span>
                      )}
                      <span className={`text-sm font-black ${isTop ? 'text-indigo-600 dark:text-indigo-400' : isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                        {tool.runs} Runs
                      </span>
                    </div>

                    {/* Bar with exact count inside */}
                    <div className={`w-full max-w-[72px] rounded-t-xl h-full flex items-end p-1.5 relative overflow-hidden transition group-hover:ring-2 group-hover:ring-indigo-500/50 ${
                      isDark ? 'bg-slate-800/70' : 'bg-slate-100'
                    }`}>
                      <div
                        className={`w-full rounded-t-lg transition-all duration-700 relative flex items-center justify-center shadow-md ${
                          isTop
                            ? 'bg-gradient-to-t from-indigo-700 to-indigo-500 ring-2 ring-indigo-400/50'
                            : 'bg-gradient-to-t from-indigo-900 to-indigo-600 dark:from-indigo-800 dark:to-indigo-500'
                        }`}
                        style={{ height: `${heightPct}%` }}
                      >
                        {/* Exact Run Count inside Bar */}
                        <span className="text-xs font-black text-white drop-shadow-md">
                          {tool.runs}
                        </span>
                      </div>
                    </div>

                    {/* Bottom Tool Name & Evaluated count */}
                    <div className="mt-2.5 text-center w-full">
                      <span className={`block text-xs font-bold truncate group-hover:text-indigo-500 transition-colors ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                        {tool.shortName}
                      </span>
                      <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 block mt-0.5">
                        {tool.candidates} {tool.typeLabel}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 3. Tool-by-Tool Usage Breakdown Cards */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className={`text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Tool-by-Tool Activity Breakdown
            </h3>
            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Detailed candidate volumes and evaluation metrics for each screening tool
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Tool Card 1: Resume Screening */}
          <div className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
          }`}>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    <PlayCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Resume Screening</h4>
                    <span className="text-[10px] font-mono text-indigo-400 font-semibold">JD-to-Resume Matching</span>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-500/10 text-slate-300">
                  {displayScreeningRuns} Runs
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center pt-1">
                <div className={`p-2 rounded-xl border ${isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                  <span className="text-[10px] text-slate-400 block">Total</span>
                  <span className="text-base font-black font-mono">{displayScreeningCandidates}</span>
                </div>
                <div className={`p-2 rounded-xl border ${isDark ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400' : 'bg-indigo-50 border-indigo-200 text-indigo-700'}`}>
                  <span className="text-[10px] block opacity-80">Shortlist</span>
                  <span className="text-base font-black font-mono">{screeningGoodToGo}</span>
                </div>
                <div className={`p-2 rounded-xl border ${isDark ? 'bg-slate-950/60 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                  <span className="text-[10px] block opacity-80">Waitlist</span>
                  <span className="text-base font-black font-mono">{screeningWaiting}</span>
                </div>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2">
              <button
                onClick={() => onNavigateTab(isAdministrator ? 'adminScreeningHistory' : 'screening')}
                className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold border flex items-center justify-center gap-1.5 transition cursor-pointer shadow-xs ${
                  isAdministrator
                    ? 'bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-500 shadow-indigo-600/25'
                    : isDark
                    ? 'bg-slate-800 hover:bg-indigo-600 hover:text-white text-slate-200 border-slate-700'
                    : 'bg-slate-100 hover:bg-indigo-600 hover:text-white text-slate-700 border-slate-300'
                }`}
              >
                <History className="w-4 h-4" />
                <span>{isAdministrator ? 'View Screening History & Stats' : 'Open Resume Screener'}</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Tool Card 2: ATS Resume Check */}
          <div className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
          }`}>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    <FileCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>ATS Resume Check</h4>
                    <span className="text-[10px] font-mono text-indigo-400 font-semibold">100-Point Rubric</span>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-500/10 text-slate-300">
                  {displayAtsRuns} Runs
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center pt-1">
                <div className={`p-2 rounded-xl border ${isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                  <span className="text-[10px] text-slate-400 block">Total</span>
                  <span className="text-base font-black font-mono">{displayAtsCandidates}</span>
                </div>
                <div className={`p-2 rounded-xl border ${isDark ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400' : 'bg-indigo-50 border-indigo-200 text-indigo-700'}`}>
                  <span className="text-[10px] block opacity-80">Friendly</span>
                  <span className="text-base font-black font-mono">{atsFriendly}</span>
                </div>
                <div className={`p-2 rounded-xl border ${isDark ? 'bg-slate-950/60 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                  <span className="text-[10px] block opacity-80">Review</span>
                  <span className="text-base font-black font-mono">{atsNeedsWork}</span>
                </div>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2">
              <button
                onClick={() => onNavigateTab(isAdministrator ? 'adminAtsHistory' : 'atsCheck')}
                className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold border flex items-center justify-center gap-1.5 transition cursor-pointer shadow-xs ${
                  isAdministrator
                    ? 'bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-500 shadow-indigo-600/25'
                    : isDark
                    ? 'bg-slate-800 hover:bg-indigo-600 hover:text-white text-slate-200 border-slate-700'
                    : 'bg-slate-100 hover:bg-indigo-600 hover:text-white text-slate-700 border-slate-300'
                }`}
              >
                <History className="w-4 h-4" />
                <span>{isAdministrator ? 'View ATS History & Stats' : 'Open ATS Check'}</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Tool Card 3: GitHub Profile Check */}
          <div className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
          }`}>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    <GithubIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>GitHub Auditor</h4>
                    <span className="text-[10px] font-mono text-indigo-400 font-semibold">60-Point Quantitative</span>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-500/10 text-slate-300">
                  {displayGithubRuns} Runs
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-center pt-1">
                <div className={`p-2 rounded-xl border ${isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                  <span className="text-[10px] text-slate-400 block">Profiles Audited</span>
                  <span className="text-base font-black font-mono">{displayGithubCandidates}</span>
                </div>
                <div className={`p-2 rounded-xl border ${isDark ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400' : 'bg-indigo-50 border-indigo-200 text-indigo-700'}`}>
                  <span className="text-[10px] block opacity-80">High Scores (40+)</span>
                  <span className="text-base font-black font-mono">{githubHigh}</span>
                </div>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2">
              <button
                onClick={() => onNavigateTab(isAdministrator ? 'adminGithubHistory' : 'githubCheck')}
                className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold border flex items-center justify-center gap-1.5 transition cursor-pointer shadow-xs ${
                  isAdministrator
                    ? 'bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-500 shadow-indigo-600/25'
                    : isDark
                    ? 'bg-slate-800 hover:bg-indigo-600 hover:text-white text-slate-200 border-slate-700'
                    : 'bg-slate-100 hover:bg-indigo-600 hover:text-white text-slate-700 border-slate-300'
                }`}
              >
                <History className="w-4 h-4" />
                <span>{isAdministrator ? 'View GitHub History & Stats' : 'Open GitHub Auditor'}</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Tool Card 4: LinkedIn Profile Check */}
          <div className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
          }`}>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    <LinkedinIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>LinkedIn Auditor</h4>
                    <span className="text-[10px] font-mono text-indigo-400 font-semibold">60-Point Quantitative</span>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-500/10 text-slate-300">
                  {displayLinkedinRuns} Runs
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-center pt-1">
                <div className={`p-2 rounded-xl border ${isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                  <span className="text-[10px] text-slate-400 block">Profiles Audited</span>
                  <span className="text-base font-black font-mono">{displayLinkedinCandidates}</span>
                </div>
                <div className={`p-2 rounded-xl border ${isDark ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400' : 'bg-indigo-50 border-indigo-200 text-indigo-700'}`}>
                  <span className="text-[10px] block opacity-80">High Scores (40+)</span>
                  <span className="text-base font-black font-mono">{linkedinHigh}</span>
                </div>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2">
              <button
                onClick={() => onNavigateTab(isAdministrator ? 'adminLinkedinHistory' : 'linkedinCheck')}
                className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold border flex items-center justify-center gap-1.5 transition cursor-pointer shadow-xs ${
                  isAdministrator
                    ? 'bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-500 shadow-indigo-600/25'
                    : isDark
                    ? 'bg-slate-800 hover:bg-indigo-600 hover:text-white text-slate-200 border-slate-700'
                    : 'bg-slate-100 hover:bg-indigo-600 hover:text-white text-slate-700 border-slate-300'
                }`}
              >
                <History className="w-4 h-4" />
                <span>{isAdministrator ? 'View LinkedIn History & Stats' : 'Open LinkedIn Auditor'}</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Tool Card 5: NexView Interview Tool */}
          <div className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
          }`}>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    <Tv className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>NexView Tool</h4>
                    <span className="text-[10px] font-mono text-indigo-400 font-semibold">Live Interview System</span>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-500/10 text-slate-300">
                  {displayNexViewRuns} Sessions
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-center pt-1">
                <div className={`p-2 rounded-xl border ${isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                  <span className="text-[10px] text-slate-400 block">Interview Sessions</span>
                  <span className="text-base font-black font-mono">{displayNexViewCandidates}</span>
                </div>
                <div className={`p-2 rounded-xl border ${isDark ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400' : 'bg-indigo-50 border-indigo-200 text-indigo-700'}`}>
                  <span className="text-[10px] block opacity-80">Portal Status</span>
                  <span className="text-xs font-bold font-mono">Live Integrated</span>
                </div>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2">
              <button
                onClick={() => onNavigateTab(isAdministrator ? 'adminNexViewHistory' : 'nexView')}
                className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold border flex items-center justify-center gap-1.5 transition cursor-pointer shadow-xs ${
                  isAdministrator
                    ? 'bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-500 shadow-indigo-600/25'
                    : isDark
                    ? 'bg-slate-800 hover:bg-indigo-600 hover:text-white text-slate-200 border-slate-700'
                    : 'bg-slate-100 hover:bg-indigo-600 hover:text-white text-slate-700 border-slate-300'
                }`}
              >
                <History className="w-4 h-4" />
                <span>{isAdministrator ? 'View NexView History & Stats' : 'Launch NexView'}</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Tool Card 6: AI Assignment Check */}
          <div className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
          }`}>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>AI Assignment Check</h4>
                    <span className="text-[10px] font-mono text-indigo-400 font-semibold">Evaluation Rubrics</span>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-500/10 text-slate-300">
                  Ready
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-center pt-1">
                <div className={`p-2 rounded-xl border ${isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                  <span className="text-[10px] text-slate-400 block">Rubric Evaluator</span>
                  <span className="text-base font-black font-mono">0% Tokens</span>
                </div>
                <div className={`p-2 rounded-xl border ${isDark ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400' : 'bg-indigo-50 border-indigo-200 text-indigo-700'}`}>
                  <span className="text-[10px] block opacity-80">Automation</span>
                  <span className="text-xs font-bold font-mono">Instant Rubric</span>
                </div>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2">
              <button
                onClick={() => onNavigateTab(isAdministrator ? 'history' : 'aiAssignmentCheck')}
                className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold border flex items-center justify-center gap-1.5 transition cursor-pointer shadow-xs ${
                  isAdministrator
                    ? 'bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-500 shadow-indigo-600/25'
                    : isDark
                    ? 'bg-slate-800 hover:bg-indigo-600 hover:text-white text-slate-200 border-slate-700'
                    : 'bg-slate-100 hover:bg-indigo-600 hover:text-white text-slate-700 border-slate-300'
                }`}
              >
                <Sparkles className="w-4 h-4" />
                <span>{isAdministrator ? 'View AI Assignment Tool & Stats' : 'Open AI Assignment'}</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Personal Activity Feed & Timeline */}
      <div className={`rounded-2xl border overflow-hidden ${
        isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900 shadow-sm'
      }`}>
        <div className={`p-5 border-b flex flex-col md:flex-row md:items-center justify-between gap-4 ${
          isDark ? 'border-slate-800' : 'border-slate-200 bg-slate-50/50'
        }`}>
          <div>
            <h3 className="text-base font-bold flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-400" />
              <span>Personal Activity Log & Timeline</span>
            </h3>
            <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Chronological log of your screening evaluations, candidate batches, and tool usage
            </p>
          </div>

          {/* Search & Filters */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="relative w-full sm:w-56">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search my activity..."
                value={activitySearchQuery}
                onChange={(e) => setActivitySearchQuery(e.target.value)}
                className={`w-full rounded-xl pl-8 pr-3 py-1.5 text-xs border focus:outline-none ${
                  isDark ? 'bg-slate-950 border-slate-800 text-white placeholder-slate-500' : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'
                }`}
              />
            </div>

            <select
              value={activityCategoryFilter}
              onChange={(e) => setActivityCategoryFilter(e.target.value as any)}
              className={`rounded-xl px-3 py-1.5 text-xs border font-medium focus:outline-none cursor-pointer ${
                isDark ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-white border-slate-300 text-slate-700'
              }`}
            >
              <option value="all">All Tool Categories</option>
              <option value="screening">Resume Screening</option>
              <option value="ats">ATS Resume Check</option>
              <option value="github">GitHub Check</option>
              <option value="linkedin">LinkedIn Check</option>
              <option value="nexview">NexView Tool</option>
            </select>
          </div>
        </div>

        {/* Timeline list */}
        <div className="divide-y divide-slate-800/60 max-h-[460px] overflow-y-auto">
          {filteredTimeline.length === 0 ? (
            <div className="p-8 text-center space-y-2">
              <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mx-auto">
                <Clock className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold">No Activity Records Found</h4>
              <p className={`text-xs max-w-sm mx-auto ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {activitySearchQuery
                  ? `No activities matched "${activitySearchQuery}". Try clearing search.`
                  : 'Start screening candidates or auditing profiles to record activities in your personal dashboard.'}
              </p>
            </div>
          ) : (
            filteredTimeline.map((item) => (
              <div
                key={item.id}
                className={`p-4 transition flex items-start justify-between gap-3 ${
                  isDark ? 'hover:bg-slate-800/40' : 'hover:bg-slate-50'
                }`}
              >
                <div className="flex items-start gap-3 overflow-hidden">
                  <div className="p-2 rounded-xl bg-slate-800/80 border border-slate-700 shrink-0 mt-0.5">
                    {getToolIcon(item.toolType)}
                  </div>
                  <div className="overflow-hidden space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-xs truncate">{item.title}</span>
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold border ${
                        item.toolType === 'screening'
                          ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300'
                          : item.toolType === 'ats'
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                          : item.toolType === 'github'
                          ? 'bg-sky-500/10 border-sky-500/30 text-sky-300'
                          : item.toolType === 'linkedin'
                          ? 'bg-blue-500/10 border-blue-500/30 text-blue-300'
                          : 'bg-slate-500/10 border-slate-500/30 text-slate-300'
                      }`}>
                        {item.toolName}
                      </span>
                      {item.candidateCount !== undefined && item.candidateCount > 0 && (
                        <span className="text-[10px] text-slate-400 font-mono">
                          • {item.candidateCount} Candidates
                        </span>
                      )}
                    </div>
                    <p className={`text-xs ${isDark ? 'text-slate-300' : 'text-slate-600'} leading-relaxed`}>
                      {item.details}
                    </p>
                    {item.sheetUrl && (
                      <div className="flex items-center gap-2 text-[11px] font-mono text-indigo-400 pt-0.5">
                        <span className="truncate max-w-xs">{item.sheetUrl}</span>
                        <button
                          onClick={(e) => handleCopyUrl(item.id, item.sheetUrl!, e)}
                          className="hover:underline flex items-center gap-1 cursor-pointer shrink-0"
                          title="Copy Sheet Link"
                        >
                          {copiedId === item.id ? (
                            <><Check className="w-3 h-3 text-emerald-400" /> Copied</>
                          ) : (
                            <><Copy className="w-3 h-3" /> Copy Link</>
                          )}
                        </button>
                        <a
                          href={item.sheetUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:underline flex items-center gap-0.5 shrink-0"
                        >
                          <ExternalLink className="w-3 h-3" /> Open
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className={`text-[11px] font-mono block ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    {item.dateFormatted}
                  </span>
                  <span className="text-[10px] font-bold text-emerald-400 uppercase font-mono mt-1 inline-block">
                    ✓ Completed
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
