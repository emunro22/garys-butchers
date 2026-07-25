import { db } from '@/lib/db';
import { orders } from '@/lib/db/schema';
import { desc, ne } from 'drizzle-orm';
import { OrdersTable } from '@/components/admin/orders-table';

export const dynamic = 'force-dynamic';

export default async function AdminOrdersPage() {
  // 'pending' orders haven't had payment confirmed yet — they aren't real
  // orders until they're paid, so they never show up here at all. They
  // either become 'paid' via the webhook, or get auto-cancelled by the
  // expire-pending-orders cron if the checkout was abandoned.
  const all = await db
    .select()
    .from(orders)
    .where(ne(orders.status, 'pending'))
    .orderBy(desc(orders.createdAt));

  return (
    <div className="space-y-8">
      <header>
        <p className="eyebrow text-ink-500 mb-2">Operations</p>
        <h1 className="font-display text-4xl text-ink-900">Orders</h1>
      </header>

      <OrdersTable initialOrders={all} />
    </div>
  );
}
