import { NextResponse } from 'next/server';
import { getCustomerSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { orders } from '@/lib/db/schema';
import { eq, desc, or } from 'drizzle-orm';

export async function GET() {
  const session = await getCustomerSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const userOrders = await db
    .select()
    .from(orders)
    .where(
      or(
        eq(orders.userId, session.userId),
        eq(orders.customerEmail, session.email)
      )
    )
    .orderBy(desc(orders.createdAt));

  return NextResponse.json({ orders: userOrders });
}
