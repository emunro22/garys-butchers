import { NextRequest, NextResponse } from 'next/server';
import { ordersDb } from '@/lib/db';
import { subscriptions } from '@/lib/db/schema';
import { ensureSubscriptionsSchema } from '@/lib/db/ensure-schema';
import { eq, and } from 'drizzle-orm';
import { getCustomerSession } from '@/lib/auth';
import { stripe } from '@/lib/stripe';

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getCustomerSession();
  if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  const { id } = await params;

  try {
    await ensureSubscriptionsSchema();
    const [sub] = await ordersDb
      .select()
      .from(subscriptions)
      .where(and(eq(subscriptions.id, id), eq(subscriptions.userId, session.userId)))
      .limit(1);
    if (!sub) return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });

    if (sub.stripeSubscriptionId) {
      await stripe.subscriptions.cancel(sub.stripeSubscriptionId);
    }

    // The webhook (customer.subscription.deleted) will also land and set the
    // same fields — this just makes the cancellation feel instant rather
    // than waiting on a round trip to Stripe and back.
    await ordersDb
      .update(subscriptions)
      .set({ status: 'cancelled', cancelledAt: new Date(), updatedAt: new Date() })
      .where(eq(subscriptions.id, id));

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('subscription cancel error', err);
    return NextResponse.json({ error: 'Could not cancel subscription' }, { status: 500 });
  }
}
