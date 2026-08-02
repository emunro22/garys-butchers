'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { formatPrice } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

type SubscriptionItem = { productId: string; name: string; priceInPence: number; quantity: number };

type SubscriptionRow = {
  id: string;
  status: 'pending' | 'active' | 'past_due' | 'cancelled';
  items: SubscriptionItem[];
  subtotalInPence: number;
  fulfilment: 'pickup' | 'delivery';
  preferredDayOfMonth: number;
  createdAt: string;
};

const STATUS_LABEL: Record<SubscriptionRow['status'], string> = {
  pending: 'Awaiting checkout',
  active: 'Active',
  past_due: 'Payment issue',
  cancelled: 'Cancelled',
};

const STATUS_COLOR: Record<SubscriptionRow['status'], string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  active: 'bg-green-100 text-green-800',
  past_due: 'bg-red-100 text-red-800',
  cancelled: 'bg-gray-100 text-gray-800',
};

export function SubscriptionsPanel() {
  const [subs, setSubs] = useState<SubscriptionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  function load() {
    fetch('/api/subscriptions')
      .then((r) => r.json())
      .then((data) => setSubs(data.subscriptions ?? []))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function cancel(id: string) {
    if (!confirm('Cancel this subscription? This stops future monthly charges and orders.')) return;
    setBusy(id);
    try {
      const res = await fetch(`/api/subscriptions/${id}/cancel`, { method: 'POST' });
      if (res.ok) load();
    } finally {
      setBusy(null);
    }
  }

  if (loading) return <p className="text-sm text-ink-500">Loading…</p>;

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl text-ink-900">My subscriptions</h2>
        <Link href="/subscriptions/build">
          <Button variant="outline" size="sm">New subscription</Button>
        </Link>
      </div>

      {subs.length === 0 ? (
        <div className="text-center py-16 bg-cream-100 border border-ink-900/10">
          <RefreshCw className="h-10 w-10 text-ink-300 mx-auto mb-4" />
          <p className="font-display text-xl text-ink-700">No subscriptions yet</p>
          <p className="text-sm text-ink-500 mt-1">Set up a recurring monthly order of your regulars.</p>
          <Link href="/subscriptions/build" className="inline-block mt-5">
            <Button variant="primary">Build your subscription</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {subs.map((s) => (
            <div key={s.id} className="bg-cream-100 border border-ink-900/10 p-5">
              <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                <div>
                  <p className="font-medium text-ink-900">
                    {s.fulfilment === 'delivery' ? 'Delivery' : 'Pickup'} · around the {s.preferredDayOfMonth}
                    {s.preferredDayOfMonth === 1 ? 'st' : s.preferredDayOfMonth === 2 ? 'nd' : s.preferredDayOfMonth === 3 ? 'rd' : 'th'} each month
                  </p>
                  <p className="text-xs text-ink-500 mt-0.5">{formatPrice(s.subtotalInPence)} / month</p>
                </div>
                <span className={`text-xs px-2 py-1 font-medium uppercase tracking-wider ${STATUS_COLOR[s.status]}`}>
                  {STATUS_LABEL[s.status]}
                </span>
              </div>
              <div className="flex flex-wrap gap-2 mb-3">
                {s.items.map((item, i) => (
                  <div key={i} className="flex items-center gap-2 bg-cream-50 px-3 py-1.5 text-xs text-ink-700">
                    <span className="font-medium">{item.quantity}x</span>
                    <span className="truncate max-w-[140px]">{item.name}</span>
                  </div>
                ))}
              </div>
              {(s.status === 'active' || s.status === 'past_due') && (
                <button
                  onClick={() => cancel(s.id)}
                  disabled={busy === s.id}
                  className="text-xs uppercase tracking-[0.18em] text-butcher-500 hover:text-butcher-600 disabled:opacity-40"
                >
                  Cancel subscription
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
