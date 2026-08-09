import { NextRequest, NextResponse } from 'next/server';
import { and, eq, gt, isNull, lt } from 'drizzle-orm';
import { db } from '@/lib/db';
import { orders } from '@/lib/db/schema';
import { ensureOrdersSchema } from '@/lib/db/ensure-schema';
import { PENDING_ORDER_TTL_MINUTES } from '@/lib/order-status';
import { sendAbandonedCheckoutEmail } from '@/lib/email';

export const dynamic = 'force-dynamic';

// A checkout younger than this is still probably just mid-form — no point
// nagging someone who's still typing their address.
const REMINDER_AFTER_MINUTES = 20;

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization');
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await ensureOrdersSchema();

  const reminderCutoff = new Date(Date.now() - REMINDER_AFTER_MINUTES * 60 * 1000);
  const ttlCutoff = new Date(Date.now() - PENDING_ORDER_TTL_MINUTES * 60 * 1000);

  // Orders that had a PaymentIntent created (so they actually reached the
  // payment step) but never paid, aren't already superseded/cancelled, and
  // haven't had a reminder sent yet. The upper bound (ttlCutoff) hands off
  // to the existing expire-pending-orders cron once an order is too old to
  // usefully resume.
  const candidates = await db
    .select()
    .from(orders)
    .where(
      and(
        eq(orders.status, 'pending'),
        lt(orders.createdAt, reminderCutoff),
        gt(orders.createdAt, ttlCutoff),
        isNull(orders.abandonedReminderSentAt)
      )
    );

  let sent = 0;
  for (const order of candidates) {
    if (!order.stripePaymentIntentId) continue;

    // Claim before sending — a conditional UPDATE that only one overlapping
    // cron run can win, so a slow previous run can never cause a double-send.
    const [claimed] = await db
      .update(orders)
      .set({ abandonedReminderSentAt: new Date() })
      .where(
        and(
          eq(orders.id, order.id),
          eq(orders.status, 'pending'),
          isNull(orders.abandonedReminderSentAt)
        )
      )
      .returning({ id: orders.id });
    if (!claimed) continue;

    try {
      await sendAbandonedCheckoutEmail({
        orderId: order.id,
        customerName: order.customerName,
        customerEmail: order.customerEmail,
        items: order.items,
        totalInPence: order.totalInPence,
      });
      sent++;
    } catch (err) {
      console.error(`abandoned-checkout reminder failed for order ${order.id}`, err);
    }
  }

  return NextResponse.json({ checked: candidates.length, sent });
}
