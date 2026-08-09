import { NextResponse } from 'next/server';
import { and, eq, isNotNull, isNull } from 'drizzle-orm';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { orders } from '@/lib/db/schema';
import { ensureOrdersSchema } from '@/lib/db/ensure-schema';
import { stripe } from '@/lib/stripe';
import { markOrderPaid } from '@/lib/order-payment';

/**
 * One-off backfill for orders wrongly cancelled by the (now-fixed) bug where
 * a single declined payment attempt cancelled the order even though the
 * customer went on to pay successfully on the same PaymentIntent — those
 * customers were genuinely charged but never got an order number or
 * confirmation email. Re-checks every cancelled, unnumbered order with a
 * PaymentIntent against Stripe's real status and repairs any that actually
 * succeeded. Safe to run repeatedly — orders already fixed no longer match
 * the query (they'll have an orderNumber).
 */
export async function POST() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    await ensureOrdersSchema();

    const candidates = await db
      .select()
      .from(orders)
      .where(
        and(
          eq(orders.status, 'cancelled'),
          isNotNull(orders.stripePaymentIntentId),
          isNull(orders.orderNumber)
        )
      );

    const fixed: Array<{ orderId: string; orderNumber: number | null; customerName: string; customerEmail: string }> = [];

    for (const order of candidates) {
      try {
        const intent = await stripe.paymentIntents.retrieve(order.stripePaymentIntentId!);
        if (intent.status !== 'succeeded') continue;

        const [unCancelled] = await db
          .update(orders)
          .set({ status: 'pending', updatedAt: new Date() })
          .where(and(eq(orders.id, order.id), eq(orders.status, 'cancelled')))
          .returning({ id: orders.id });
        if (!unCancelled) continue;

        const paidOrder = await markOrderPaid(order.id);
        if (paidOrder?.orderNumber != null) {
          fixed.push({
            orderId: order.id,
            orderNumber: paidOrder.orderNumber,
            customerName: order.customerName,
            customerEmail: order.customerEmail,
          });
        }
      } catch (err) {
        console.error(`reconcile: failed to check/fix order ${order.id}`, err);
      }
    }

    return NextResponse.json({ checked: candidates.length, fixed });
  } catch (err) {
    console.error('orders reconcile error', err);
    return NextResponse.json({ error: 'Could not reconcile orders' }, { status: 500 });
  }
}
