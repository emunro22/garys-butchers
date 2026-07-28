'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { track } from '@vercel/analytics';

const SESSION_KEY = 'gb_session_id';

function getSessionId(): string {
  try {
    let id = localStorage.getItem(SESSION_KEY);
    if (!id) {
      id = crypto.randomUUID().slice(0, 40);
      localStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return 'anonymous';
  }
}

function send(type: 'pageview' | 'click', path: string, label?: string) {
  const payload = JSON.stringify({ type, path, label, sessionId: getSessionId() });
  try {
    const blob = new Blob([payload], { type: 'application/json' });
    if (!navigator.sendBeacon(url, blob)) {
      fetch(url, { method: 'POST', body: payload, headers: { 'Content-Type': 'application/json' }, keepalive: true });
    }
  } catch {
    // best-effort only — never disrupt the visitor's browsing
  }
}

const url = '/api/analytics/track';

export function AnalyticsTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname) send('pageview', pathname);
  }, [pathname]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      const target = (e.target as HTMLElement)?.closest('a, button');
      if (!target) return;
      const label =
        target.getAttribute('aria-label') ||
        target.textContent?.trim().replace(/\s+/g, ' ').slice(0, 100) ||
        target.tagName.toLowerCase();
      const path = window.location.pathname;
      // Same @vercel/analytics library the pageview tracker uses, so clicks
      // also show up as custom events in the Vercel Analytics dashboard —
      // mirrored into our own table below so /admin/analytics can query it.
      track('click', { label, path });
      send('click', path, label);
    }
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  return null;
}
