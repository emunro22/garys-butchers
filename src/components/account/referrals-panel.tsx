'use client';

import { useEffect, useState } from 'react';
import { Check, Copy, Gift } from 'lucide-react';

type ReferralHistoryEntry = {
  id: string;
  status: 'pending' | 'rewarded';
  createdAt: string;
  rewardedAt: string | null;
  referredName: string;
};

export function ReferralsPanel() {
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [creditsAvailable, setCreditsAvailable] = useState(0);
  const [history, setHistory] = useState<ReferralHistoryEntry[]>([]);
  const [rewardPercent, setRewardPercent] = useState(5);
  const [enabled, setEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch('/api/account/referral').then((r) => r.json()),
      fetch('/api/referral-settings').then((r) => r.json()),
    ])
      .then(([referral, settings]) => {
        setReferralCode(referral.referralCode ?? null);
        setCreditsAvailable(referral.creditsAvailable ?? 0);
        setHistory(referral.history ?? []);
        setRewardPercent(settings.referrals?.rewardPercent ?? 5);
        setEnabled(settings.referrals?.enabled ?? true);
      })
      .finally(() => setLoading(false));
  }, []);

  const link =
    referralCode && typeof window !== 'undefined'
      ? `${window.location.origin}/account/signup?ref=${referralCode}`
      : '';

  async function copyLink() {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API unavailable — nothing more we can do here.
    }
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  if (loading) {
    return <p className="text-sm text-ink-500">Loading…</p>;
  }

  if (!enabled) {
    return (
      <div className="space-y-6 max-w-md">
        <h2 className="font-display text-2xl text-ink-900">Refer a friend</h2>
        <p className="text-sm text-ink-500">Our referral scheme isn&apos;t currently running — check back soon.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-lg">
      <div>
        <h2 className="font-display text-2xl text-ink-900">Refer a friend</h2>
        <p className="text-sm text-ink-500 mt-1">
          Share your link. Once a friend signs up and completes their first order, you&apos;ll get{' '}
          {rewardPercent}% off your next order — automatically, no code needed.
        </p>
      </div>

      <div>
        <p className="text-xs uppercase tracking-[0.18em] text-ink-500 mb-2">Your referral link</p>
        <div className="flex gap-2">
          <input
            readOnly
            value={link}
            onClick={(e) => e.currentTarget.select()}
            className="flex-1 border border-ink-900/15 bg-cream-50 px-3 h-11 text-sm font-mono truncate"
          />
          <button
            type="button"
            onClick={copyLink}
            className="shrink-0 flex items-center gap-1.5 px-4 h-11 bg-ink-900 text-cream-50 text-xs uppercase tracking-[0.18em] hover:bg-ink-800 transition-colors"
          >
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3 bg-gold-400/10 border border-gold-400/40 px-4 py-3">
        <Gift className="h-5 w-5 text-gold-700 shrink-0" />
        <p className="text-sm text-ink-900">
          {creditsAvailable > 0
            ? `You have ${creditsAvailable} referral reward${creditsAvailable === 1 ? '' : 's'} ready — the next one is applied automatically at checkout.`
            : "You don't have any referral rewards yet."}
        </p>
      </div>

      <div>
        <p className="text-xs uppercase tracking-[0.18em] text-ink-500 mb-2">Your referrals</p>
        {history.length === 0 ? (
          <p className="text-sm text-ink-500">No one has signed up with your link yet.</p>
        ) : (
          <div className="space-y-2">
            {history.map((h) => (
              <div key={h.id} className="flex items-center justify-between bg-cream-100 border border-ink-900/10 px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-ink-900">{h.referredName}</p>
                  <p className="text-xs text-ink-500">Joined {formatDate(h.createdAt)}</p>
                </div>
                <span
                  className={`text-xs px-2 py-1 font-medium uppercase tracking-wider ${
                    h.status === 'rewarded' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                  }`}
                >
                  {h.status === 'rewarded' ? 'Rewarded' : 'Pending first order'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
