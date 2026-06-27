import { db } from '@/lib/db';
import { orders, users } from '@/lib/db/schema';
import { sql, eq } from 'drizzle-orm';
import { CustomersView } from '@/components/admin/customers-view';

export const dynamic = 'force-dynamic';

export default async function AdminCustomersPage() {
  // Get all registered users
  const registeredUsers = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      phone: users.phone,
      role: users.role,
      emailVerified: users.emailVerified,
      createdAt: users.createdAt,
    })
    .from(users)
    .orderBy(sql`${users.createdAt} desc`);

  // Get order stats grouped by email (includes guest orders)
  const orderStats = await db
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

  // Merge registered users with order data
  const registeredEmails = new Set(registeredUsers.map((u) => u.email));
  const ordersByEmail = new Map(orderStats.map((o) => [o.email, o]));

  const customers = registeredUsers.map((u) => {
    const stats = ordersByEmail.get(u.email);
    return {
      id: u.id,
      type: 'registered' as const,
      email: u.email,
      name: u.name,
      phone: u.phone ?? stats?.phone ?? null,
      role: u.role,
      emailVerified: u.emailVerified,
      orderCount: stats?.orderCount ?? 0,
      totalSpentInPence: stats?.totalSpentInPence ?? 0,
      firstOrder: stats?.firstOrder ? new Date(stats.firstOrder).toISOString() : u.createdAt.toISOString(),
      lastOrder: stats?.lastOrder ? new Date(stats.lastOrder).toISOString() : null,
      createdAt: u.createdAt.toISOString(),
    };
  });

  // Add guest customers (those with orders but no registered account)
  const guestCustomers = orderStats
    .filter((o) => !registeredEmails.has(o.email))
    .map((o) => ({
      id: Buffer.from(o.email, 'utf-8').toString('base64url'),
      type: 'guest' as const,
      email: o.email,
      name: o.name,
      phone: o.phone ?? null,
      role: null as string | null,
      emailVerified: null as boolean | null,
      orderCount: o.orderCount,
      totalSpentInPence: o.totalSpentInPence,
      firstOrder: new Date(o.firstOrder).toISOString(),
      lastOrder: new Date(o.lastOrder).toISOString(),
      createdAt: new Date(o.firstOrder).toISOString(),
    }));

  const allCustomers = [...customers, ...guestCustomers].sort((a, b) => {
    const aDate = a.lastOrder ?? a.createdAt;
    const bDate = b.lastOrder ?? b.createdAt;
    return new Date(bDate).getTime() - new Date(aDate).getTime();
  });

  return (
    <div className="space-y-8">
      <header>
        <p className="eyebrow text-ink-500 mb-2">People</p>
        <h1 className="font-display text-4xl text-ink-900">Customers</h1>
        <p className="text-sm text-ink-500 mt-2">
          {registeredUsers.length} registered account{registeredUsers.length === 1 ? '' : 's'},{' '}
          {guestCustomers.length} guest customer{guestCustomers.length === 1 ? '' : 's'}.
        </p>
      </header>

      <CustomersView customers={allCustomers} />
    </div>
  );
}
