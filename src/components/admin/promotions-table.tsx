'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import type { Promotion } from '@/lib/db/schema';

const TYPE_LABEL = {
  percent_off: 'Percent off',
  amount_off: 'Amount off',
  free_delivery: 'Free delivery',
} as const;

function formatValue(p: Promotion) {
  if (p.type === 'percent_off') return `${p.value}% off`;
  if (p.type === 'amount_off') return `${formatPrice(p.value)} off`;
  return 'Free delivery';
}

export function PromotionsTable({ initial }: { initial: Promotion[] }) {
  const router = useRouter();
  const [rows, setRows] = useState(initial);
  const [busy, setBusy] = useState<string | null>(null);

  async function toggleActive(p: Promotion) {
    setBusy(p.id);
    try {
      const res = await fetch(`/api/promotions/${p.id}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ isActive: !p.isActive }),
      });
      if (res.ok) {
        setRows((r) => r.map((x) => (x.id === p.id ? { ...x, isActive: !x.isActive } : x)));
      }
    } finally {
      setBusy(null);
    }
  }

  async function deletePromo(p: Promotion) {
    if (!confirm(`Delete promo code "${p.code}"? This cannot be undone.`)) return;
    setBusy(p.id);
    try {
      const res = await fetch(`/api/promotions/${p.id}`, { method: 'DELETE' });
      if (res.ok) {
        setRows((r) => r.filter((x) => x.id !== p.id));
        router.refresh();
      }
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="bg-cream-100 border border-ink-900/10 overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-cream-50 border-b border-ink-900/10">
          <tr className="text-left text-ink-500 uppercase tracking-[0.16em] text-[11px]">
            <th className="px-5 py-3">Code</th>
            <th className="px-5 py-3">Description</th>
            <th className="px-5 py-3">Type</th>
            <th className="px-5 py-3">Value</th>
            <th className="px-5 py-3 text-right">Min order</th>
            <th className="px-5 py-3 text-right">Used</th>
            <th className="px-5 py-3 text-center">Active</th>
            <th className="px-5 py-3" />
          </tr>
        </thead>
        <tbody className="divide-y divide-ink-900/5">
          {rows.length === 0 && (
            <tr>
              <td colSpan={8} className="px-5 py-10 text-center text-ink-500">
                No promotions yet — create your first discount code.
              </td>
            </tr>
          )}
          {rows.map((p) => (
            <tr key={p.id} className={`hover:bg-cream-50 ${busy === p.id ? 'opacity-50' : ''}`}>
              <td className="px-5 py-3">
                <span className="font-mono text-base font-medium text-ink-900">{p.code}</span>
              </td>
              <td className="px-5 py-3 text-ink-700 max-w-sm truncate">
                {p.description ?? '—'}
              </td>
              <td className="px-5 py-3">
                <span className="text-xs uppercase tracking-[0.18em] text-ink-500">
                  {TYPE_LABEL[p.type]}
                </span>
              </td>
              <td className="px-5 py-3 font-medium text-gold-700">{formatValue(p)}</td>
              <td className="px-5 py-3 text-right tabular">
                {p.minimumOrderInPence > 0 ? formatPrice(p.minimumOrderInPence) : '—'}
              </td>
              <td className="px-5 py-3 text-right tabular">
                {p.redemptionCount}
                {p.maxRedemptions !== null && (
                  <span className="text-ink-500"> / {p.maxRedemptions}</span>
                )}
              </td>
              <td className="px-5 py-3 text-center">
                <button
                  onClick={() => toggleActive(p)}
                  disabled={busy === p.id}
                  title={p.isActive ? 'Deactivate' : 'Activate'}
                  className="inline-flex items-center justify-center text-ink-500 hover:text-gold-600 transition-colors disabled:opacity-40"
                >
                  {p.isActive ? (
                    <ToggleRight className="h-5 w-5 text-green-600" />
                  ) : (
                    <ToggleLeft className="h-5 w-5" />
                  )}
                </button>
              </td>
              <td className="px-5 py-3 text-right">
                <button
                  onClick={() => deletePromo(p)}
                  disabled={busy === p.id}
                  title="Delete"
                  className="inline-flex items-center justify-center text-ink-400 hover:text-butcher-500 transition-colors disabled:opacity-40"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
