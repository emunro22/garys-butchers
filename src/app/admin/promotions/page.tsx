import Link from 'next/link';
import { db } from '@/lib/db';
import { promotions } from '@/lib/db/schema';
import { desc } from 'drizzle-orm';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatPrice } from '@/lib/utils';

export const dynamic = 'force-dynamic';

const TYPE_LABEL = {
  percent_off: 'Percent off',
  amount_off: 'Amount off',
  free_delivery: 'Free delivery',
} as const;

function formatValue(p: { type: string; value: number }) {
  if (p.type === 'percent_off') return `${p.value}% off`;
  if (p.type === 'amount_off') return `${formatPrice(p.value)} off`;
  return 'Free delivery';
}

export default async function AdminPromotionsPage() {
  const all = await db.select().from(promotions).orderBy(desc(promotions.createdAt));

  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <p className="eyebrow text-ink-500 mb-2">Marketing</p>
          <h1 className="font-display text-4xl text-ink-900">Promotions</h1>
        </div>
        <Link href="/admin/promotions/new">
          <Button variant="primary">
            <Plus className="h-4 w-4 mr-2" /> New code
          </Button>
        </Link>
      </header>

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
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-900/5">
            {all.length === 0 && (
              <tr>
                <td colSpan={7} className="px-5 py-10 text-center text-ink-500">
                  No promotions yet — create your first discount code.
                </td>
              </tr>
            )}
            {all.map((p) => (
              <tr key={p.id} className="hover:bg-cream-50">
                <td className="px-5 py-3">
                  <span className="font-mono text-base font-medium text-ink-900">
                    {p.code}
                  </span>
                </td>
                <td className="px-5 py-3 text-ink-700 max-w-md">
                  {p.description ?? '—'}
                </td>
                <td className="px-5 py-3">
                  <span className="text-xs uppercase tracking-[0.18em] text-ink-500">
                    {TYPE_LABEL[p.type]}
                  </span>
                </td>
                <td className="px-5 py-3 font-medium text-gold-700">
                  {formatValue(p)}
                </td>
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
                  <span
                    className={`inline-block h-2 w-2 rounded-full ${
                      p.isActive ? 'bg-green-500' : 'bg-ink-300'
                    }`}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
