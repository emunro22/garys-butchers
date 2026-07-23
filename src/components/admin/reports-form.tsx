'use client';

import { useState } from 'react';
import { Users, ShoppingBasket, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input, Label } from '@/components/ui/input';

const DAY_PRESETS = [1, 2, 5, 6, 7, 30];

const REPORT_RECIPIENTS = [
  'gazapeline@outlook.com',
  'garysbutchers-orders@outlook.com',
  'euanmunroo@gmail.com',
];

type ReportType = 'signups' | 'product-sales';
type SendState = { status: 'idle' | 'sending' | 'sent' | 'error'; message?: string };

export function ReportsForm() {
  const [days, setDays] = useState(7);
  const [state, setState] = useState<Record<ReportType, SendState>>({
    signups: { status: 'idle' },
    'product-sales': { status: 'idle' },
  });

  async function runReport(type: ReportType) {
    setState((s) => ({ ...s, [type]: { status: 'sending' } }));
    try {
      const res = await fetch('/api/admin/reports', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ type, days }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Could not send report');
      setState((s) => ({ ...s, [type]: { status: 'sent', message: 'Report emailed.' } }));
    } catch (err) {
      setState((s) => ({
        ...s,
        [type]: { status: 'error', message: err instanceof Error ? err.message : 'Could not send report' },
      }));
    }
  }

  return (
    <div className="space-y-8 max-w-3xl">
      {/* Period selector */}
      <section className="bg-cream-100 border border-ink-900/10 p-6 space-y-4">
        <div>
          <p className="eyebrow text-ink-500 mb-1">Report period</p>
          <p className="text-xs text-ink-500">
            Choose how many days back each report below should cover, then run whichever report
            you need.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {DAY_PRESETS.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDays(d)}
              className={`px-4 h-10 text-sm border transition-colors ${
                days === d
                  ? 'bg-ink-900 border-ink-900 text-cream-50'
                  : 'bg-cream-50 border-ink-900/15 hover:border-ink-900/40 text-ink-900'
              }`}
            >
              {d} day{d === 1 ? '' : 's'}
            </button>
          ))}
        </div>
        <div className="max-w-[160px]">
          <Label htmlFor="customDays">Or enter a custom number of days</Label>
          <Input
            id="customDays"
            type="number"
            min="1"
            max="365"
            step="1"
            value={days}
            onChange={(e) => setDays(Math.max(1, Math.min(365, Number(e.target.value) || 1)))}
          />
        </div>
      </section>

      {/* Sign-ups report */}
      <ReportCard
        icon={Users}
        title="New sign-ups report"
        description={`Every customer account created in the last ${days} day${days === 1 ? '' : 's'}, plus a total count.`}
        days={days}
        state={state.signups}
        onRun={() => runReport('signups')}
      />

      {/* Product sales report */}
      <ReportCard
        icon={ShoppingBasket}
        title="Product sales report"
        description={`Total quantity (and revenue) sold of each product across paid orders in the last ${days} day${days === 1 ? '' : 's'}.`}
        days={days}
        state={state['product-sales']}
        onRun={() => runReport('product-sales')}
      />

      <div className="flex items-start gap-3 text-xs text-ink-500 bg-cream-100 border border-ink-900/10 px-4 py-3">
        <Mail className="h-4 w-4 shrink-0 mt-0.5" />
        <p>
          Reports are emailed as a CSV attachment to: {REPORT_RECIPIENTS.join(', ')}.
        </p>
      </div>
    </div>
  );
}

function ReportCard({
  icon: Icon,
  title,
  description,
  days,
  state,
  onRun,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  days: number;
  state: SendState;
  onRun: () => void;
}) {
  return (
    <section className="bg-cream-100 border border-ink-900/10 p-6">
      <div className="flex items-start gap-4">
        <div className="h-11 w-11 shrink-0 bg-ink-900 text-gold-400 flex items-center justify-center">
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="font-display text-xl text-ink-900">{title}</h2>
          <p className="text-sm text-ink-500 mt-1">{description}</p>

          <div className="mt-4 flex items-center gap-3">
            <Button
              type="button"
              variant="primary"
              onClick={onRun}
              disabled={state.status === 'sending'}
            >
              {state.status === 'sending' ? 'Sending…' : `Email report — last ${days} day${days === 1 ? '' : 's'}`}
            </Button>
            {state.status === 'sent' && (
              <span className="text-sm text-green-600">{state.message}</span>
            )}
            {state.status === 'error' && (
              <span className="text-sm text-butcher-500">{state.message}</span>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
