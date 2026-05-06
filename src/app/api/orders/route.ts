import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { orders } from '@/lib/db/schema';
import { desc, eq } from 'drizzle-orm';
import { getSession } from '@/lib/auth';

const StatusSchema = z.object({
  id: z.string().uuid(),
  status: z.enum([
    'pending',
    'paid',
    'preparing',
    'ready',
    'completed',
    'cancelled',
    'refunded',
  ]),
});

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const url = new URL(req.url);
    const status = url.searchParams.get('status');
    const all = await db.select().from(orders).orderBy(desc(orders.createdAt));
    const filtered = status ? all.filter((o) => o.status === status) : all;
    return NextResponse.json({ orders: filtered });
  } catch (err) {
    console.error('orders GET error', err);
    return NextResponse.json({ error: 'Could not load orders' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const body = await req.json();
    const parsed = StatusSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }
    const [updated] = await db
      .update(orders)
      .set({ status: parsed.data.status, updatedAt: new Date() })
      .where(eq(orders.id, parsed.data.id))
      .returning();
    if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ order: updated });
  } catch (err) {
    console.error('orders PATCH error', err);
    return NextResponse.json({ error: 'Could not update order' }, { status: 500 });
  }
}
