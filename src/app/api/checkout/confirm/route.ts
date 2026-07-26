import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { orders } from '@/lib/db/schema';
import { stripe } from '@/lib/stripe';
import { markOrderPaid } from '@/lib/order-payment';

const Schema = z.object({ orderId: z.string().uuid() });

/**
 * Called by the frontend right after Stripe confirms payment succeeded, so
 * the order (and its order number) is marked paid synchronously rather than
 * waiting on the async webhook — the webhook still runs and is safe to race
 * against this (markOrderPaid's transition is a single conditional UPDATE),
 * it's just no longer the only path, so the customer isn't left looking at
 * a still-pending order while the webhook is in flight.
 */
export async function POST(req: NextRequest) {
  try {
    const parsed = Schema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }
    const { orderId } = parsed.data;

    const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (order.status === 'pending') {
      if (!order.stripePaymentIntentId) {
        return NextResponse.json({ error: 'Payment not confirmed yet' }, { status: 409 });
      }
      const intent = await stripe.paymentIntents.retrieve(order.stripePaymentIntentId);
      if (intent.status !== 'succeeded') {
        return NextResponse.json({ error: 'Payment not confirmed yet' }, { status: 409 });
      }
      await markOrderPaid(orderId);
    }

    const [finalOrder] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
    return NextResponse.json({
      status: finalOrder?.status ?? null,
      orderNumber: finalOrder?.orderNumber ?? null,
    });
  } catch (err) {
    console.error('checkout confirm error', err);
    return NextResponse.json({ error: 'Could not confirm order' }, { status: 500 });
  }
}
