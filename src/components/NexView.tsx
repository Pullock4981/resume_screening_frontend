'use client';

import React, { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

interface NexViewProps {
  theme?: 'dark' | 'light';
}

const DEFAULT_NEXVIEW_URL = 'https://interview-feedback-frontend.vercel.app/dashboard';

export default function NexView({ theme = 'dark' }: NexViewProps) {
  const isDark = theme === 'dark';
  const { user, token } = useAuth();

  useEffect(() => {
    // Record launch history entry in localStorage & log to central sheet
    try {
      const now = new Date();
      const record = {
        id: `nv_${Date.now()}`,
        operationName: 'NexView Live Dashboard Launch',
        timestamp: now.toISOString(),
        dateFormatted: now.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }),
        targetUrl: DEFAULT_NEXVIEW_URL,
        userEmail: user?.email || 'user@system.com',
        status: 'Active'
      };

      const existing = localStorage.getItem('nexview_history');
      const list = existing ? JSON.parse(existing) : [];
      // Deduplicate by timestamp within 1 minute
      const alreadyLoggedRecent = list.some((item: any) => (
        item.userEmail === record.userEmail &&
        (Date.now() - new Date(item.timestamp).getTime()) < 60000
      ));

      if (!alreadyLoggedRecent) {
        const updated = [record, ...list];
        localStorage.setItem('nexview_history', JSON.stringify(updated));

        // Send activity audit log to backend
        const backendUrl = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
          ? 'http://localhost:5000'
          : process.env.NEXT_PUBLIC_BACKEND_URL || 'https://resume-screening-backend.vercel.app';

        fetch(`${backendUrl}/api/activity/log`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          },
          body: JSON.stringify({
            action: 'NEXVIEW_VISIT',
            details: `NexView Launch: User visited NexView Live Dashboard (${DEFAULT_NEXVIEW_URL})`
          })
        }).catch(err => console.warn('Activity log error for NexView:', err));
      }
    } catch (e) {
      console.warn('Failed to record NexView history entry:', e);
    }
  }, [user, token]);

  return (
    <div className={`w-full h-full overflow-hidden transition-all duration-200 ${
      isDark ? 'bg-slate-950' : 'bg-white'
    }`}>
      <iframe
        src={DEFAULT_NEXVIEW_URL}
        title="NexView Dashboard"
        className="w-full h-full border-0 overflow-hidden"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
      />
    </div>
  );
}