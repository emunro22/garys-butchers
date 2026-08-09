import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { orders } from '@/lib/db/schema';
import { ensureOrdersSchema } from '@/lib/db/ensure-schema';
import { stripe } from '@/lib/stripe';
import { markOrderPaid } from '@/lib/order-payment';

const Schema = z.object({ orderId: z.string().uuid() });

/**
 * Backs the "Resume checkout" link in the abandoned-checkout reminder email
 * (and anyone reloading a checkout tab that already has a PaymentIntent in
 * flight) — loads the order's existing payment state and hands back enough
 * to jump straight to the payment step, with no cart/details re-entry and no
 * new order/PaymentIntent created. Safe to call repeatedly.
 */
export async function GET(req: NextRequest) {
  try {
    const parsed = Schema.safeParse({ orderId: req.nextUrl.searchParams.get('orderId') });
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }
    const { orderId } = parsed.data;

    await ensureOrdersSchema();

    const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
    if (!order) {
      return NextResponse.json({ status: 'expired', error: 'Order not found.' }, { status: 404 });
    }

    if (order.status !== 'pending') {
      if (order.status === 'cancelled' || order.status === 'refunded') {
        return NextResponse.json(
          { status: 'expired', error: 'This checkout has expired — please start a new order.' },
          { status: 410 }
        );
      }
      return NextResponse.json({ status: 'already_paid', orderId: order.id, orderNumber: order.orderNumber });
    }

    if (!order.stripePaymentIntentId) {
      return NextResponse.json(
        { status: 'expired', error: 'This checkout has expired — please start a new order.' },
        { status: 410 }
      );
    }

    const intent = await stripe.paymentIntents.retrieve(order.stripePaymentIntentId);

    if (intent.status === 'succeeded') {
      // Payment actually went through but the webhook/confirm call never
      // landed — reconcile rather than tell the customer to pay again.
      const paidOrder = await markOrderPaid(order.id);
      return NextResponse.json({ status: 'already_paid', orderId: order.id, orderNumber: paidOrder?.orderNumber ?? null });
    }

    if (['requires_payment_method', 'requires_confirmation', 'requires_action'].includes(intent.status)) {
      return NextResponse.json({
        status: 'resumable',
        orderId: order.id,
        clientSecret: intent.client_secret,
        totalInPence: order.totalInPence,
      });
    }

    if (intent.status === 'processing') {
      return NextResponse.json(
        { status: 'processing', error: 'This payment is still being processed — please check back in a minute.' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { status: 'expired', error: 'This checkout has expired — please start a new order.' },
      { status: 410 }
    );
  } catch (err) {
    console.error('checkout resume error', err);
    return NextResponse.json({ status: 'expired', error: 'Could not resume this order.' }, { status: 500 });
  }
}
