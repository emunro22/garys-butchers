import { NextRequest, NextResponse } from 'next/server';
import { and, asc, isNotNull, isNull } from 'drizzle-orm';
import { db } from '@/lib/db';
import { orders } from '@/lib/db/schema';
import { ensureOrdersSchema } from '@/lib/db/ensure-schema';

/**
 * Polled by the local print-agent (see print-agent/) running on a shop PC —
 * not reachable the other way around, since the printer sits on the shop's
 * own network with no public internet access. `orderNumber IS NOT NULL` is
 * exactly "this order was actually paid" (see markOrderPaid, the only place
 * that column is ever set), so this naturally covers pickup/delivery/premium
 * orders regardless of what status they later move to.
 */
export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization');
  if (auth !== `Bearer ${process.env.PRINT_AGENT_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await ensureOrdersSchema();

    const queue = await db
      .select()
      .from(orders)
      .where(and(isNotNull(orders.orderNumber), isNull(orders.printedAt)))
      .orderBy(asc(orders.orderNumber))
      .limit(20);

    return NextResponse.json({ orders: queue });
  } catch (err) {
    console.error('print-queue GET error', err);
    return NextResponse.json({ error: 'Could not load print queue' }, { status: 500 });
  }
}
