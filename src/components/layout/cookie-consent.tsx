'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export const CONSENT_KEY = 'gb_cookie_consent';

export function hasAnalyticsConsent(): boolean {
  try {
    return localStorage.getItem(CONSENT_KEY) === 'accepted';
  } catch {
    return false;
  }
}

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(CONSENT_KEY)) setVisible(true);
    } catch {
      // localStorage unavailable — don't block the page on it
    }
  }, []);

  function choose(value: 'accepted' | 'rejected') {
    try {
      localStorage.setItem(CONSENT_KEY, value);
    } catch {
      // ignore — banner just won't be remembered next visit
    }
    setVisible(false);
    window.dispatchEvent(new Event('gb-cookie-consent-change'));
  }

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-ink-900/10 bg-cream-50 px-4 py-4 md:px-8 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <p className="text-sm text-ink-700">
          We use essential cookies to run this site and optional analytics to see which pages are useful.{' '}
          <Link href="/privacy" className="underline hover:text-gold-700">
            Read our privacy policy
          </Link>
          .
        </p>
        <div className="flex shrink-0 gap-3">
          <button
            onClick={() => choose('rejected')}
            className="rounded-full border border-ink-900/20 px-5 py-2 text-sm text-ink-900 hover:border-ink-900/40"
          >
            Reject
          </button>
          <button
            onClick={() => choose('accepted')}
            className="rounded-full bg-ink-900 px-5 py-2 text-sm text-cream-50 hover:bg-ink-900/90"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
