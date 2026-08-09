import { NextRequest, NextResponse } from 'next/server';
import { and, eq, lt } from 'drizzle-orm';
import { db } from '@/lib/db';
import { orders } from '@/lib/db/schema';
import { ensureOrdersSchema } from '@/lib/db/ensure-schema';
import { stripe } from '@/lib/stripe';
import { PENDING_ORDER_TTL_MINUTES } from '@/lib/order-status';
import { markOrderPaid } from '@/lib/order-payment';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization');
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await ensureOrdersSchema();

  const staleCutoff = new Date(Date.now() - PENDING_ORDER_TTL_MINUTES * 60 * 1000);

  const stale = await db
    .select()
    .from(orders)
    .where(and(eq(orders.status, 'pending'), lt(orders.createdAt, staleCutoff)));

  let cancelled = 0;
  let reconciledPaid = 0;
  for (const order of stale) {
    if (!order.stripePaymentIntentId) {
      await db
        .update(orders)
        .set({ status: 'cancelled', updatedAt: new Date() })
        .where(eq(orders.id, order.id));
      cancelled++;
      continue;
    }

    try {
      const intent = await stripe.paymentIntents.retrieve(order.stripePaymentIntentId);
      if (intent.status === 'succeeded') {
        // Payment actually went through but the webhook never landed — reconcile
        // rather than cancel, so the slot stays correctly booked.
        await markOrderPaid(order.id);
        reconciledPaid++;
        continue;
      }
      if (intent.status === 'processing' || intent.status === 'requires_action') {
        // Still potentially resolvable (e.g. mid-3D-Secure, or an async
        // payment method) — leave it pending, re-check on the next run
        // rather than guessing it's dead.
        continue;
      }
      if (intent.status !== 'canceled') {
        await stripe.paymentIntents.cancel(order.stripePaymentIntentId).catch(() => {});
      }
      await db
        .update(orders)
        .set({ status: 'cancelled', updatedAt: new Date() })
        .where(eq(orders.id, order.id));
      cancelled++;
    } catch (err) {
      // Couldn't confirm the real Stripe status (transient API error) —
      // leave it pending and retry next run, rather than cancelling an
      // order whose payment might have actually succeeded.
      console.error(`cron: failed to check PaymentIntent for order ${order.id}`, err);
    }
  }

  return NextResponse.json({ checked: stale.length, cancelled, reconciledPaid });
}
