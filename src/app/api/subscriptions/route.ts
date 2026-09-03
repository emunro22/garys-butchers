import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { catalogDb, ordersDb } from '@/lib/db';
import { subscriptions } from '@/lib/db/schema-orders';
import { products } from '@/lib/db/schema-catalog';
import { ensureUsersSchema, ensureProductsSchema, ensureSubscriptionsSchema } from '@/lib/db/ensure-schema';
import { eq, inArray, desc } from 'drizzle-orm';
import { getCustomerSession } from '@/lib/auth';
import { getShopSettings } from '@/lib/settings';
import { stripe } from '@/lib/stripe';
import { getOrCreateStripeCustomerId } from '@/lib/stripe-customer';

const Schema = z.object({
  items: z.array(z.object({ productId: z.string().uuid(), quantity: z.number().int().min(1).max(20) })).min(1).max(30),
  fulfilment: z.enum(['pickup', 'delivery']),
  deliveryAddress: z
    .object({ line1: z.string().min(1), line2: z.string().optional(), city: z.string().min(1), postcode: z.string().min(1) })
    .nullable()
    .optional(),
  preferredBlockId: z.string().min(1).max(80),
  preferredDayOfMonth: z.number().int().min(1).max(31),
});

export async function GET() {
  const session = await getCustomerSession();
  if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  await ensureSubscriptionsSchema();
  const mine = await ordersDb
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, session.userId))
    .orderBy(desc(subscriptions.createdAt));

  return NextResponse.json({ subscriptions: mine });
}

export async function POST(req: NextRequest) {
  const session = await getCustomerSession();
  if (!session) return NextResponse.json({ error: 'Please sign in to set up a subscription' }, { status: 401 });

  try {
    const body = await req.json();
    const parsed = Schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Please check your subscription details' }, { status: 400 });
    }
    const data = parsed.data;

    if (data.fulfilment === 'delivery' && !data.deliveryAddress) {
      return NextResponse.json({ error: 'Delivery address required' }, { status: 400 });
    }

    await ensureProductsSchema();
    await ensureUsersSchema();
    await ensureSubscriptionsSchema();

    const shopSettings = await getShopSettings();
    const group = data.fulfilment === 'delivery' ? shopSettings.deliverySlots : shopSettings.pickupSlots;
    if (!group.blocks.some((b) => b.id === data.preferredBlockId)) {
      return NextResponse.json({ error: 'Please choose a valid time window' }, { status: 400 });
    }

    // Prices and eligibility are always taken from the current product
    // record, never trusted from the client.
    const productIds = data.items.map((i) => i.productId);
    const dbProducts = await catalogDb
      .select({ id: products.id, name: products.name, priceInPence: products.priceInPence, isSubscribable: products.isSubscribable, isActive: products.isActive })
      .from(products)
      .where(inArray(products.id, productIds));

    const priceMap = new Map(dbProducts.map((p) => [p.id, p]));
    const lineItems: Array<{ productId: string; name: string; priceInPence: number; quantity: number }> = [];
    for (const item of data.items) {
      const p = priceMap.get(item.productId);
      if (!p || !p.isActive || !p.isSubscribable) {
        return NextResponse.json({ error: 'One of the items you picked is no longer available for subscription' }, { status: 400 });
      }
      lineItems.push({ productId: p.id, name: p.name, priceInPence: p.priceInPence, quantity: item.quantity });
    }
    const subtotalInPence = lineItems.reduce((sum, i) => sum + i.priceInPence * i.quantity, 0);
    if (subtotalInPence < 100) {
      return NextResponse.json({ error: 'Add a few more items to your subscription' }, { status: 400 });
    }

    const stripeCustomerId = await getOrCreateStripeCustomerId(session.userId);
    if (!stripeCustomerId) return NextResponse.json({ error: 'Account not found' }, { status: 404 });

    const [draft] = await ordersDb
      .insert(subscriptions)
      .values({
        userId: session.userId,
        status: 'pending',
        items: lineItems,
        subtotalInPence,
        fulfilment: data.fulfilment,
        deliveryAddress: data.fulfilment === 'delivery' ? data.deliveryAddress ?? null : null,
        preferredBlockId: data.preferredBlockId,
        preferredDayOfMonth: data.preferredDayOfMonth,
      })
      .returning();

    const origin = req.nextUrl.origin;
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: stripeCustomerId,
      line_items: [
        {
          price_data: {
            currency: 'gbp',
            product_data: { name: "Gary's Butchers — Custom Subscription" },
            unit_amount: subtotalInPence,
            recurring: { interval: 'month' },
          },
          quantity: 1,
        },
      ],
      metadata: { subscriptionId: draft.id },
      subscription_data: { metadata: { subscriptionId: draft.id } },
      success_url: `${origin}/account?subscription=success`,
      cancel_url: `${origin}/subscriptions/build?cancelled=1`,
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (err) {
    console.error('subscription create error', err);
    return NextResponse.json({ error: 'Could not start your subscription' }, { status: 500 });
  }
}
