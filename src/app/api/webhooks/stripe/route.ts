import { NextRequest, NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { stripe } from '@/lib/stripe';
import { db } from '@/lib/db';
import { orders, subscriptions, users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { markOrderPaid } from '@/lib/order-payment';
import { ensureSubscriptionsSchema } from '@/lib/db/ensure-schema';
import { createRenewalOrder } from '@/lib/subscription-renewal';

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
    } else if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.mode === 'subscription') {
        const subscriptionId = session.metadata?.subscriptionId;
        const stripeSubscriptionId =
          typeof session.subscription === 'string' ? session.subscription : session.subscription?.id;
        const stripeCustomerId = typeof session.customer === 'string' ? session.customer : session.customer?.id;
        if (subscriptionId && stripeSubscriptionId) {
          await ensureSubscriptionsSchema();
          await db
            .update(subscriptions)
            .set({
              status: 'active',
              stripeSubscriptionId,
              stripeCustomerId: stripeCustomerId ?? null,
              updatedAt: new Date(),
            })
            .where(eq(subscriptions.id, subscriptionId));
        }
      }
    } else if (event.type === 'invoice.paid') {
      const invoice = event.data.object as Stripe.Invoice;
      const stripeSubscriptionId =
        typeof invoice.subscription === 'string' ? invoice.subscription : invoice.subscription?.id;
      if (stripeSubscriptionId) {
        await ensureSubscriptionsSchema();
        const [sub] = await db
          .select()
          .from(subscriptions)
          .where(eq(subscriptions.stripeSubscriptionId, stripeSubscriptionId))
          .limit(1);
        if (sub && sub.status !== 'cancelled') {
          const [buyer] = await db
            .select({ email: users.email, name: users.name })
            .from(users)
            .where(eq(users.id, sub.userId))
            .limit(1);
          if (buyer) {
            await createRenewalOrder(sub, invoice.id!, buyer.email, buyer.name);
          }
        }
      }
    } else if (event.type === 'customer.subscription.deleted') {
      const sub = event.data.object as Stripe.Subscription;
      await ensureSubscriptionsSchema();
      await db
        .update(subscriptions)
        .set({ status: 'cancelled', cancelledAt: new Date(), updatedAt: new Date() })
        .where(eq(subscriptions.stripeSubscriptionId, sub.id));
    } else if (event.type === 'invoice.payment_failed') {
      const invoice = event.data.object as Stripe.Invoice;
      const stripeSubscriptionId =
        typeof invoice.subscription === 'string' ? invoice.subscription : invoice.subscription?.id;
      if (stripeSubscriptionId) {
        await ensureSubscriptionsSchema();
        await db
          .update(subscriptions)
          .set({ status: 'past_due', updatedAt: new Date() })
          .where(eq(subscriptions.stripeSubscriptionId, stripeSubscriptionId));
      }
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error('webhook handler error', err);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}
