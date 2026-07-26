import { NextRequest, NextResponse } from 'next/server';
import { and, eq, lt } from 'drizzle-orm';
import { db } from '@/lib/db';
import { orders } from '@/lib/db/schema';
import { stripe } from '@/lib/stripe';
import { PENDING_ORDER_TTL_MINUTES } from '@/lib/order-status';
import { markOrderPaid } from '@/lib/order-payment';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization');
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const staleCutoff = new Date(Date.now() - PENDING_ORDER_TTL_MINUTES * 60 * 1000);

  const stale = await db
    .select()
    .from(orders)
    .where(and(eq(orders.status, 'pending'), lt(orders.createdAt, staleCutoff)));

  let cancelled = 0;
  let reconciledPaid = 0;
  for (const order of stale) {
    if (order.stripePaymentIntentId) {
      try {
        const intent = await stripe.paymentIntents.retrieve(order.stripePaymentIntentId);
        if (intent.status === 'succeeded') {
          // Payment actually went through but the webhook never landed — reconcile
          // rather than cancel, so the slot stays correctly booked.
          await markOrderPaid(order.id);
          reconciledPaid++;
          continue;
        }
        if (intent.status === 'processing') {
          continue;
        }
        if (intent.status !== 'canceled') {
          await stripe.paymentIntents.cancel(order.stripePaymentIntentId).catch(() => {});
        }
      } catch (err) {
        console.error(`cron: failed to check PaymentIntent for order ${order.id}`, err);
      }
    }
    await db
      .update(orders)
      .set({ status: 'cancelled', updatedAt: new Date() })
      .where(eq(orders.id, order.id));
    cancelled++;
  }

  return NextResponse.json({ checked: stale.length, cancelled, reconciledPaid });
}
