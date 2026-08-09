import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { and, eq, isNull } from 'drizzle-orm';
import { db } from '@/lib/db';
import { orders } from '@/lib/db/schema';
import { ensureOrdersSchema } from '@/lib/db/ensure-schema';

const Schema = z.object({ orderId: z.string().uuid() });

/**
 * Called by the print-agent once it has actually printed an order's receipt.
 * Conditional UPDATE (only if still unprinted) — same "only the winner acts"
 * idiom as markOrderPaid/supersedeOrder, so a retried/duplicate ack from the
 * agent is harmless.
 */
export async function POST(req: NextRequest) {
  const auth = req.headers.get('authorization');
  if (auth !== `Bearer ${process.env.PRINT_AGENT_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const parsed = Schema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    await ensureOrdersSchema();

    const [acked] = await db
      .update(orders)
      .set({ printedAt: new Date() })
      .where(and(eq(orders.id, parsed.data.orderId), isNull(orders.printedAt)))
      .returning({ id: orders.id });

    return NextResponse.json({ ok: true, acked: Boolean(acked) });
  } catch (err) {
    console.error('print-queue ack error', err);
    return NextResponse.json({ error: 'Could not acknowledge print job' }, { status: 500 });
  }
}
