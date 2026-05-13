import { db } from '@/lib/db';
import { orders } from '@/lib/db/schema';
import { sql } from 'drizzle-orm';
import { CustomersView } from '@/components/admin/customers-view';

export const dynamic = 'force-dynamic';

export default async function AdminCustomersPage() {
  const customers = await db
    .select({
      email: orders.customerEmail,
      name: sql<string>`max(${orders.customerName})`,
      phone: sql<string>`max(${orders.customerPhone})`,
      orderCount: sql<number>`count(*)::int`,
      totalSpentInPence: sql<number>`sum(${orders.totalInPence})::int`,
      firstOrder: sql<Date>`min(${orders.createdAt})`,
      lastOrder: sql<Date>`max(${orders.createdAt})`,
    })
    .from(orders)
    .where(sql`${orders.status} in ('paid', 'preparing', 'ready', 'completed')`)
    .groupBy(orders.customerEmail)
    .orderBy(sql`max(${orders.createdAt}) desc`);

  return (
    <div className="space-y-8">
      <header>
        <p className="eyebrow text-ink-500 mb-2">People</p>
        <h1 className="font-display text-4xl text-ink-900">Customers</h1>
        <p className="text-sm text-ink-500 mt-2">
          Derived from paid orders. {customers.length} unique customer{customers.length === 1 ? '' : 's'}.
        </p>
      </header>

      <CustomersView
        customers={customers.map((c) => ({
          ...c,
          firstOrder: new Date(c.firstOrder).toISOString(),
          lastOrder: new Date(c.lastOrder).toISOString(),
        }))}
      />
    </div>
  );
}