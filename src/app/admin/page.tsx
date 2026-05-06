import Link from 'next/link';
import { db } from '@/lib/db';
import { orders, products, promotions } from '@/lib/db/schema';
import { desc, eq, sql } from 'drizzle-orm';
import { formatPrice } from '@/lib/utils';
import { Package, ClipboardList, TicketPercent, Banknote } from 'lucide-react';

export const dynamic = 'force-dynamic';

async function loadStats() {
  try {
    const [productCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(products);
    const [paidCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(orders)
      .where(eq(orders.status, 'paid'));
    const [pendingCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(orders)
      .where(eq(orders.status, 'pending'));
    const [revenueRow] = await db
      .select({ total: sql<number>`coalesce(sum(${orders.totalInPence}), 0)::int` })
      .from(orders)
      .where(eq(orders.status, 'paid'));
    const [activePromos] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(promotions)
      .where(eq(promotions.isActive, true));
    const recent = await db
      .select()
      .from(orders)
      .orderBy(desc(orders.createdAt))
      .limit(8);
    return {
      products: productCount?.count ?? 0,
      paidOrders: paidCount?.count ?? 0,
      pendingOrders: pendingCount?.count ?? 0,
      revenue: revenueRow?.total ?? 0,
      activePromos: activePromos?.count ?? 0,
      recent,
    };
  } catch {
    return {
      products: 0,
      paidOrders: 0,
      pendingOrders: 0,
      revenue: 0,
      activePromos: 0,
      recent: [] as any[],
    };
  }
}

export default async function AdminDashboardPage() {
  const stats = await loadStats();

  return (
    <div className="space-y-10">
      <header>
        <p className="eyebrow text-ink-500 mb-2">Overview</p>
        <h1 className="font-display text-4xl text-ink-900">Dashboard</h1>
      </header>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Total revenue"
          value={formatPrice(stats.revenue)}
          icon={<Banknote className="h-5 w-5" />}
          tone="gold"
        />
        <StatCard
          label="Paid orders"
          value={String(stats.paidOrders)}
          icon={<ClipboardList className="h-5 w-5" />}
        />
        <StatCard
          label="Products"
          value={String(stats.products)}
          icon={<Package className="h-5 w-5" />}
        />
        <StatCard
          label="Active promos"
          value={String(stats.activePromos)}
          icon={<TicketPercent className="h-5 w-5" />}
        />
      </div>

      {/* Recent orders */}
      <section className="bg-cream-100 border border-ink-900/10">
        <header className="p-5 md:p-6 border-b border-ink-900/10 flex items-center justify-between">
          <h2 className="font-display text-2xl text-ink-900">Recent orders</h2>
          <Link
            href="/admin/orders"
            className="text-xs uppercase tracking-[0.18em] text-ink-700 hover:text-ink-900"
          >
            View all →
          </Link>
        </header>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-cream-50 border-b border-ink-900/10">
              <tr className="text-left text-ink-500 uppercase tracking-[0.16em] text-[11px]">
                <th className="px-5 py-3">Order</th>
                <th className="px-5 py-3">Customer</th>
                <th className="px-5 py-3">Type</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-900/5">
              {stats.recent.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-ink-500">
                    No orders yet — they&apos;ll appear here once customers start shopping.
                  </td>
                </tr>
              )}
              {stats.recent.map((o) => (
                <tr key={o.id} className="hover:bg-cream-50">
                  <td className="px-5 py-3 tabular font-medium">
                    #{String(o.orderNumber).padStart(5, '0')}
                  </td>
                  <td className="px-5 py-3">
                    <div>{o.customerName}</div>
                    <div className="text-ink-500 text-xs">{o.customerEmail}</div>
                  </td>
                  <td className="px-5 py-3 capitalize">{o.fulfilment}</td>
                  <td className="px-5 py-3">
                    <StatusBadge status={o.status} />
                  </td>
                  <td className="px-5 py-3 text-right tabular">
                    {formatPrice(o.totalInPence)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  tone = 'plain',
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  tone?: 'plain' | 'gold';
}) {
  return (
    <div
      className={`p-5 border border-ink-900/10 ${
        tone === 'gold' ? 'bg-ink-900 text-cream-50' : 'bg-cream-100'
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <p
          className={`eyebrow ${tone === 'gold' ? 'text-gold-400' : 'text-ink-500'}`}
        >
          {label}
        </p>
        <span className={tone === 'gold' ? 'text-gold-400' : 'text-ink-400'}>
          {icon}
        </span>
      </div>
      <p
        className={`font-display text-3xl ${
          tone === 'gold' ? 'text-cream-50' : 'text-ink-900'
        } tabular`}
      >
        {value}
      </p>
    </div>
  );
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-cream-200 text-ink-700',
  paid: 'bg-gold-400/20 text-gold-700',
  preparing: 'bg-blue-100 text-blue-700',
  ready: 'bg-green-100 text-green-700',
  completed: 'bg-ink-900 text-cream-50',
  cancelled: 'bg-butcher-500/10 text-butcher-500',
  refunded: 'bg-ink-900/5 text-ink-500',
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-block px-2 py-0.5 text-[10px] uppercase tracking-[0.18em] font-medium ${
        STATUS_COLORS[status] ?? 'bg-ink-100 text-ink-700'
      }`}
    >
      {status}
    </span>
  );
}
