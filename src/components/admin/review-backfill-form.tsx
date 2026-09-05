'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';

type Sample = { orderNumber: number | null; customerName: string; customerEmail: string };
type Preview = { eligibleOrders: number; eligibleCustomers: number; sample: Sample[] };
type Result = { eligibleOrders: number; eligibleCustomers: number; sent: number; failed: number };

export function ReviewBackfillForm() {
  const [preview, setPreview] = useState<Preview | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(true);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function loadPreview() {
    setLoadingPreview(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/send-review-backfill');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Could not load preview');
      setPreview(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load preview');
    } finally {
      setLoadingPreview(false);
    }
  }

  useEffect(() => {
    loadPreview();
  }, []);

  async function handleSend() {
    if (!preview || preview.eligibleCustomers === 0) return;
    if (
      !confirm(
        `Send a review-request email to ${preview.eligibleCustomers} customer${preview.eligibleCustomers === 1 ? '' : 's'} now? This can't be undone.`
      )
    ) {
      return;
    }
    setSending(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/send-review-backfill', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Send failed');
      setResult(data);
      await loadPreview();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Send failed');
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <section className="bg-cream-100 border border-ink-900/10 p-6">
        <h2 className="font-display text-xl text-ink-900 mb-1">Eligible customers</h2>
        <p className="text-sm text-ink-500 mb-4">
          One email per customer, covering every already-fulfilled order (today or earlier) that
          hasn&apos;t had a review request sent yet. Orders with a future pickup/delivery date and
          premium/bulk orders are excluded; those get picked up by the ongoing 8pm cron instead.
        </p>

        {loadingPreview ? (
          <p className="text-sm text-ink-500">Loading…</p>
        ) : preview ? (
          <>
            <p className="text-sm text-ink-900">
              <strong>{preview.eligibleCustomers}</strong> customer{preview.eligibleCustomers === 1 ? '' : 's'} ·{' '}
              <strong>{preview.eligibleOrders}</strong> order{preview.eligibleOrders === 1 ? '' : 's'} covered
            </p>
            {preview.sample.length > 0 && (
              <ul className="mt-3 space-y-1 text-xs text-ink-500">
                {preview.sample.map((s, i) => (
                  <li key={i}>
                    #{String(s.orderNumber ?? '—').padStart(5, '0')}: {s.customerName} &lt;{s.customerEmail}&gt;
                  </li>
                ))}
                {preview.eligibleCustomers > preview.sample.length && (
                  <li>…and {preview.eligibleCustomers - preview.sample.length} more</li>
                )}
              </ul>
            )}
          </>
        ) : null}

        {error && (
          <p className="mt-4 text-sm text-butcher-500 bg-butcher-500/10 border border-butcher-500/30 px-3 py-2">
            {error}
          </p>
        )}

        <div className="mt-5">
          <Button
            type="button"
            variant="primary"
            onClick={handleSend}
            disabled={sending || loadingPreview || !preview || preview.eligibleCustomers === 0}
          >
            {sending
              ? 'Sending…'
              : preview
              ? `Send to ${preview.eligibleCustomers} customer${preview.eligibleCustomers === 1 ? '' : 's'}`
              : 'Send'}
          </Button>
        </div>
      </section>

      {result && (
        <section className="bg-cream-100 border border-ink-900/10 p-6">
          <h2 className="font-display text-xl text-ink-900 mb-1">Done</h2>
          <p className="text-sm text-ink-900">
            Sent <strong>{result.sent}</strong> email{result.sent === 1 ? '' : 's'}
            {result.failed > 0 && (
              <> · <strong className="text-butcher-500">{result.failed} failed</strong> (left unsent for retry)</>
            )}
          </p>
        </section>
      )}
    </div>
  );
}
