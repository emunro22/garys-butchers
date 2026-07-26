import { NextRequest, NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { stripe } from '@/lib/stripe';
import { db } from '@/lib/db';
import { orders } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { markOrderPaid } from '@/lib/order-payment';

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

      await markOrderPaid(orderId);
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
