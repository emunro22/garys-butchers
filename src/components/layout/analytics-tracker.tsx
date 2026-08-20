'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

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

const url = '/api/analytics/track';

// Pageviews are queued and flushed together on a timer (or once the queue
// gets large, or the tab is hidden) instead of one DB write per navigation.
const FLUSH_INTERVAL_MS = 8000;
const MAX_QUEUE_SIZE = 20;

let queue: Array<{ type: 'pageview'; path: string; sessionId: string }> = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;

function flush() {
  if (flushTimer) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }
  if (queue.length === 0) return;
  const batch = queue;
  queue = [];
  try {
    const payload = JSON.stringify(batch);
    const blob = new Blob([payload], { type: 'application/json' });
    if (!navigator.sendBeacon(url, blob)) {
      fetch(url, { method: 'POST', body: payload, headers: { 'Content-Type': 'application/json' }, keepalive: true });
    }
  } catch {
    // best-effort only — never disrupt the visitor's browsing
  }
}

function send(path: string) {
  queue.push({ type: 'pageview', path, sessionId: getSessionId() });
  if (queue.length >= MAX_QUEUE_SIZE) {
    flush();
    return;
  }
  if (!flushTimer) {
    flushTimer = setTimeout(flush, FLUSH_INTERVAL_MS);
  }
}

if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flush();
  });
}

export function AnalyticsTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname) send(pathname);
  }, [pathname]);

  return null;
}
