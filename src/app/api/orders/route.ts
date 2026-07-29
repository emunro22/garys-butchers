import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { sql } from '@vercel/postgres';
import { db } from '@/lib/db';
import { orders } from '@/lib/db/schema';
import { desc, eq } from 'drizzle-orm';
import { getSession } from '@/lib/auth';

const DeleteSchema = z.object({
  id: z.string().uuid(),
});

const StatusSchema = z
  .object({
    id: z.string().uuid(),
    status: z
      .enum(['pending', 'paid', 'preparing', 'ready', 'completed', 'cancelled', 'refunded'])
      .optional(),
    // Premium/bulk delivery only — set via the weight calculator on the
    // order, purely for reference (quoting/invoicing/courier handoff). Never
    // recalculates deliveryInPence/totalInPence on an already-placed order.
    weightGrams: z.number().int().min(0).nullable().optional(),
    courierName: z.string().max(60).nullable().optional(),
  })
  .refine(
    (v) => v.status !== undefined || v.weightGrams !== undefined || v.courierName !== undefined,
    { message: 'Nothing to update' }
  );

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

export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const body = await req.json();
    const parsed = DeleteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }
    const [deleted] = await db
      .delete(orders)
      .where(eq(orders.id, parsed.data.id))
      .returning();
    if (!deleted) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('orders DELETE error', err);
    return NextResponse.json({ error: 'Could not delete order' }, { status: 500 });
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

    try {
      await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS weight_grams integer`;
      await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS courier_name varchar(60)`;
    } catch { /* already exists */ }

    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (parsed.data.status !== undefined) updates.status = parsed.data.status;
    if (parsed.data.weightGrams !== undefined) updates.weightGrams = parsed.data.weightGrams;
    if (parsed.data.courierName !== undefined) updates.courierName = parsed.data.courierName;

    const [updated] = await db
      .update(orders)
      .set(updates)
      .where(eq(orders.id, parsed.data.id))
      .returning();
    if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ order: updated });
  } catch (err) {
    console.error('orders PATCH error', err);
    return NextResponse.json({ error: 'Could not update order' }, { status: 500 });
  }
}
