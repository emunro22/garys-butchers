import { NextRequest, NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { stripe } from '@/lib/stripe';
import { db } from '@/lib/db';
import { orders, promotions } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';
import { sendOrderConfirmation, sendShopNotification } from '@/lib/email';

// Stripe needs the raw body to verify signatures
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const sig = req.headers.get('stripe-signature');
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!sig || !secret) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    const body = await req.text();
    event = stripe.webhooks.constructEvent(body, sig, secret);
  } catch (err) {
    console.error('webhook signature verification failed', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    if (event.type === 'payment_intent.succeeded') {
      const intent = event.data.object as Stripe.PaymentIntent;
      const orderId = intent.metadata?.orderId;
      if (!orderId) {
        console.warn('payment_intent.succeeded without orderId metadata');
        return NextResponse.json({ received: true });
      }

      const [order] = await db
        .select()
        .from(orders)
        .where(eq(orders.id, orderId))
        .limit(1);

      if (!order) {
        console.warn(`Order ${orderId} not found`);
        return NextResponse.json({ received: true });
      }

      // Idempotency: only act if we haven't already marked it paid
      if (order.status === 'pending') {
        await db
          .update(orders)
          .set({ status: 'paid', updatedAt: new Date() })
          .where(eq(orders.id, orderId));

        // Increment promo redemption count if applicable
        if (order.promotionCode) {
          await db
            .update(promotions)
            .set({ redemptionCount: sql`${promotions.redemptionCount} + 1` })
            .where(eq(promotions.code, order.promotionCode));
        }

        // Fire emails (don't block webhook ack on email failures)
        try {
          const emailPayload = {
            orderNumber: order.orderNumber,
            customerName: order.customerName,
            customerEmail: order.customerEmail,
            fulfilment: order.fulfilment,
            items: order.items,
            subtotalInPence: order.subtotalInPence,
            deliveryInPence: order.deliveryInPence,
            discountInPence: order.discountInPence,
            totalInPence: order.totalInPence,
            pickupSlot: order.pickupSlot ? order.pickupSlot.toISOString() : null,
            deliverySlot: order.deliverySlot ? order.deliverySlot.toISOString() : null,
            deliveryAddress: order.deliveryAddress,
          };
          await Promise.all([
            sendOrderConfirmation(emailPayload),
            sendShopNotification(emailPayload),
          ]);
        } catch (emailErr) {
          console.error('order email failed', emailErr);
        }
      }
    } else if (event.type === 'payment_intent.payment_failed') {
      const intent = event.data.object as Stripe.PaymentIntent;
      const orderId = intent.metadata?.orderId;
      if (orderId) {
        await db
          .update(orders)
          .set({ status: 'cancelled', updatedAt: new Date() })
          .where(eq(orders.id, orderId));
      }
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error('webhook handler error', err);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}
