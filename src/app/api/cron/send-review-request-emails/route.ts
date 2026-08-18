import { NextRequest, NextResponse } from 'next/server';
import { and, eq, isNull, notInArray, or, isNotNull } from 'drizzle-orm';
import { ordersDb } from '@/lib/db';
import { orders } from '@/lib/db/schema';
import { ensureOrdersSchema } from '@/lib/db/ensure-schema';
import { getDateKey } from '@/lib/slots';
import { sendReviewRequestEmail } from '@/lib/email';

export const dynamic = 'force-dynamic';

// Vercel Cron schedules only run in UTC, so an 8pm-UK job is triggered by
// running this route every 15 minutes and having it no-op unless it's
// currently 8pm in London — correct across the BST/GMT switch, unlike a
// fixed UTC cron expression would be.
const SEND_HOUR_LONDON = 20;

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization');
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const nowHourLondon = Number(
    new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/London', hour: '2-digit', hourCycle: 'h23' }).format(
      new Date()
    )
  );
  if (nowHourLondon !== SEND_HOUR_LONDON) {
    return NextResponse.json({ skipped: true, reason: 'not 8pm London time' });
  }

  await ensureOrdersSchema();

  const todayKey = getDateKey(new Date());

  // Pickup/delivery orders (premium has no shop slot to match against) that
  // are due today, aren't pending/cancelled/refunded, and haven't already
  // had a review request sent.
  const candidates = await ordersDb
    .select()
    .from(orders)
    .where(
      and(
        notInArray(orders.status, ['pending', 'cancelled', 'refunded']),
        isNull(orders.reviewEmailSentAt),
        or(isNotNull(orders.pickupSlot), isNotNull(orders.deliverySlot))
      )
    );

  const dueToday = candidates.filter((order) => {
    const slot = order.fulfilment === 'pickup' ? order.pickupSlot : order.deliverySlot;
    return slot != null && getDateKey(slot) === todayKey;
  });

  let sent = 0;
  for (const order of dueToday) {
    if (!order.orderNumber) continue;

    // Claim before sending — a conditional UPDATE that only one overlapping
    // cron run can win, so a slow previous run can never cause a double-send.
    const [claimed] = await ordersDb
      .update(orders)
      .set({ reviewEmailSentAt: new Date() })
      .where(and(eq(orders.id, order.id), isNull(orders.reviewEmailSentAt)))
      .returning({ id: orders.id });
    if (!claimed) continue;

    try {
      await sendReviewRequestEmail({
        orderNumber: order.orderNumber,
        customerName: order.customerName,
        customerEmail: order.customerEmail,
      });
      sent++;
    } catch (err) {
      console.error(`review request email failed for order ${order.id}`, err);
    }
  }

  return NextResponse.json({ checked: dueToday.length, sent });
}
