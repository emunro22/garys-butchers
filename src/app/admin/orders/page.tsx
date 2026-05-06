import { db } from '@/lib/db';
import { orders } from '@/lib/db/schema';
import { desc } from 'drizzle-orm';
import { OrdersTable } from '@/components/admin/orders-table';

export const dynamic = 'force-dynamic';

export default async function AdminOrdersPage() {
  const all = await db.select().from(orders).orderBy(desc(orders.createdAt));

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
