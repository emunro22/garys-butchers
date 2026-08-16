import { ordersDb } from '@/lib/db';
import { subscriptions, users } from '@/lib/db/schema';
import { ensureSubscriptionsSchema, ensureUsersSchema } from '@/lib/db/ensure-schema';
import { desc, eq } from 'drizzle-orm';
import { formatPrice } from '@/lib/utils';
import { RefreshCw } from 'lucide-react';

export const dynamic = 'force-dynamic';

const STATUS_LABEL: Record<string, string> = {
  pending: 'Awaiting checkout',
  active: 'Active',
  past_due: 'Payment issue',
  cancelled: 'Cancelled',
};

const STATUS_COLOR: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  active: 'bg-green-100 text-green-800',
  past_due: 'bg-red-100 text-red-800',
  cancelled: 'bg-gray-100 text-gray-800',
};

export default async function AdminSubscriptionsPage() {
  await ensureUsersSchema();
  await ensureSubscriptionsSchema();

  const rows = await ordersDb
    .select({
      id: subscriptions.id,
      status: subscriptions.status,
      items: subscriptions.items,
      subtotalInPence: subscriptions.subtotalInPence,
      fulfilment: subscriptions.fulfilment,
      preferredDayOfMonth: subscriptions.preferredDayOfMonth,
      createdAt: subscriptions.createdAt,
      customerName: users.name,
      customerEmail: users.email,
    })
    .from(subscriptions)
    .innerJoin(users, eq(users.id, subscriptions.userId))
    .orderBy(desc(subscriptions.createdAt));

  function formatDate(d: Date) {
    return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  const activeCount = rows.filter((r) => r.status === 'active').length;
  const mrr = rows.filter((r) => r.status === 'active').reduce((sum, r) => sum + r.subtotalInPence, 0);

  return (
    <div className="space-y-8">
      <header>
        <p className="eyebrow text-ink-500 mb-2">Marketing</p>
        <h1 className="font-display text-4xl text-ink-900">Subscriptions</h1>
        <p className="text-sm text-ink-500 mt-2">
          {activeCount} active · {formatPrice(mrr)} recurring monthly. Renewal orders are created
          automatically each cycle and appear in Orders as normal — look for the &quot;Subscription
          renewal&quot; note if a slot couldn&apos;t be auto-booked and needs scheduling by hand.
        </p>
      </header>

      <div className="bg-cream-100 border border-ink-900/10 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-cream-50 border-b border-ink-900/10">
            <tr className="text-left text-ink-500 uppercase tracking-[0.16em] text-[11px]">
              <th className="px-5 py-3">Customer</th>
              <th className="px-5 py-3">Items</th>
              <th className="px-5 py-3">Fulfilment</th>
              <th className="px-5 py-3 text-right">Monthly</th>
              <th className="px-5 py-3">Started</th>
              <th className="px-5 py-3 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-900/5">
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-10 text-center text-ink-500">
                  <RefreshCw className="h-8 w-8 mx-auto mb-3 text-ink-300" />
                  No subscriptions yet.
                </td>
              </tr>
            )}
            {rows.map((r) => (
              <tr key={r.id} className="hover:bg-cream-50">
                <td className="px-5 py-3">
                  <p className="text-ink-900 font-medium">{r.customerName}</p>
                  <p className="text-xs text-ink-500">{r.customerEmail}</p>
                </td>
                <td className="px-5 py-3 text-ink-700 max-w-xs truncate">
                  {(r.items as Array<{ name: string; quantity: number }>).map((i) => `${i.quantity}x ${i.name}`).join(', ')}
                </td>
                <td className="px-5 py-3 text-ink-700 capitalize">
                  {r.fulfilment} · ~{r.preferredDayOfMonth}
                  {'th'}
                </td>
                <td className="px-5 py-3 text-right tabular font-medium text-gold-700">
                  {formatPrice(r.subtotalInPence)}
                </td>
                <td className="px-5 py-3 text-ink-700">{formatDate(r.createdAt)}</td>
                <td className="px-5 py-3 text-center">
                  <span className={`text-xs px-2 py-1 font-medium uppercase tracking-wider ${STATUS_COLOR[r.status]}`}>
                    {STATUS_LABEL[r.status] ?? r.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
