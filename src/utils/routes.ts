import { NavigationTab } from '../components/Sidebar';

export interface RouteMeta {
  tab: NavigationTab;
  path: string;
  title: string;
  badge: string;
  adminOnly?: boolean;
}

export const ROUTE_CONFIG: Record<NavigationTab, RouteMeta> = {
  screening: {
    tab: 'screening',
    path: '/screening',
    title: 'Resume Screening',
    badge: 'Screening Engine'
  },
  atsCheck: {
    tab: 'atsCheck',
    path: '/ats-check',
    title: 'ATS Resume Check',
    badge: '100-Point Rubric'
  },
  githubCheck: {
    tab: 'githubCheck',
    path: '/github-check',
    title: 'GitHub Profile Check',
    badge: '60-Point Rubric'
  },
  linkedinCheck: {
    tab: 'linkedinCheck',
    path: '/linkedin-check',
    title: 'LinkedIn Profile Check',
    badge: '60-Point Rubric'
  },
  aiAssignmentCheck: {
    tab: 'aiAssignmentCheck',
    path: '/ai-assignment',
    title: 'AI Assignment Check',
    badge: 'Live Portal'
  },
  nexView: {
    tab: 'nexView',
    path: '/nexview',
    title: 'NexView Interview Tool',
    badge: 'Live Tool'
  },
  dashboard: {
    tab: 'dashboard',
    path: '/dashboard',
    title: 'Personal Dashboard',
    badge: 'User Activity'
  },
  profile: {
    tab: 'profile',
    path: '/profile',
    title: 'My Profile & Security',
    badge: 'Account'
  },
  history: {
    tab: 'history',
    path: '/history',
    title: 'Screening History',
    badge: 'Database Sync'
  },
  dictionary: {
    tab: 'dictionary',
    path: '/rules',
    title: 'Skill Rules & ATS Dataset',
    badge: 'Reference'
  },
  guide: {
    tab: 'guide',
    path: '/guide',
    title: 'Google Sheet Setup Guide',
    badge: 'Documentation'
  },
  admin: {
    tab: 'admin',
    path: '/admin/dashboard',
    title: 'Admin Control Panel',
    badge: 'Admin',
    adminOnly: true
  },
  adminDashboard: {
    tab: 'adminDashboard',
    path: '/admin/dashboard',
    title: 'Admin Analytics Dashboard',
    badge: 'Admin Overview',
    adminOnly: true
  },
  userManagement: {
    tab: 'userManagement',
    path: '/admin/users',
    title: 'User Management Panel',
    badge: 'User Control',
    adminOnly: true
  },
  adminLogs: {
    tab: 'adminLogs',
    path: '/admin/logs',
    title: 'User Activity Audit Logs',
    badge: 'Security Audit',
    adminOnly: true
  },
  adminScreeningHistory: {
    tab: 'adminScreeningHistory',
    path: '/admin/history/screening',
    title: 'Admin Audit — Screening History',
    badge: 'Master Audit',
    adminOnly: true
  },
  adminAtsHistory: {
    tab: 'adminAtsHistory',
    path: '/admin/history/ats',
    title: 'Admin Audit — ATS Resume History',
    badge: 'Master Audit',
    adminOnly: true
  },
  adminGithubHistory: {
    tab: 'adminGithubHistory',
    path: '/admin/history/github',
    title: 'Admin Audit — GitHub Check History',
    badge: 'Master Audit',
    adminOnly: true
  },
  adminLinkedinHistory: {
    tab: 'adminLinkedinHistory',
    path: '/admin/history/linkedin',
    title: 'Admin Audit — LinkedIn Check History',
    badge: 'Master Audit',
    adminOnly: true
  },
  adminNexViewHistory: {
    tab: 'adminNexViewHistory',
    path: '/admin/history/nexview',
    title: 'Admin Audit — NexView History',
    badge: 'Master Audit',
    adminOnly: true
  }
};

export function getTabFromPathname(pathname: string, isAdmin: boolean): NavigationTab {
  if (!pathname || pathname === '/') {
    return isAdmin ? 'adminDashboard' : 'screening';
  }

  const clean = pathname.toLowerCase().replace(/\/+$/, '');

  for (const key of Object.keys(ROUTE_CONFIG) as NavigationTab[]) {
    if (ROUTE_CONFIG[key].path.toLowerCase() === clean) {
      if (ROUTE_CONFIG[key].adminOnly && !isAdmin) {
        return 'screening';
      }
      return key;
    }
  }

  // Fallbacks for alternative aliases
  if (clean === '/profile' || clean === '/account' || clean === '/settings') return 'profile';
  if (clean === '/tools') return 'screening';
  if (clean === '/ats') return 'atsCheck';
  if (clean === '/github') return 'githubCheck';
  if (clean === '/linkedin') return 'linkedinCheck';
  if (clean === '/ai-check') return 'aiAssignmentCheck';
  if (clean === '/setup') return 'guide';
  if (clean === '/admin' || clean === '/admin/overview') return isAdmin ? 'adminDashboard' : 'screening';
  if (clean === '/admin/audit-logs') return isAdmin ? 'adminLogs' : 'screening';
  if (clean === '/admin/user-management') return isAdmin ? 'userManagement' : 'screening';
  if (clean === '/admin/history') return isAdmin ? 'history' : 'history';

  return isAdmin ? 'adminDashboard' : 'screening';
}
