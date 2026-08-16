import { NextResponse } from 'next/server';
import { getCustomerSession } from '@/lib/auth';
import { ordersDb } from '@/lib/db';
import { orders } from '@/lib/db/schema';
import { ensureOrdersSchema } from '@/lib/db/ensure-schema';
import { and, eq, desc, ne, or } from 'drizzle-orm';

export async function GET() {
  const session = await getCustomerSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  await ensureOrdersSchema();

  // 'pending' orders haven't had payment confirmed yet — not a real order
  // from the customer's point of view either.
  const userOrders = await ordersDb
    .select()
    .from(orders)
    .where(
      and(
        or(
          eq(orders.userId, session.userId),
          eq(orders.customerEmail, session.email)
        ),
        ne(orders.status, 'pending')
      )
    )
    .orderBy(desc(orders.createdAt));

  return NextResponse.json({ orders: userOrders });
}
