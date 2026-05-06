import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { orders, products, promotions } from '@/lib/db/schema';
import { eq, inArray } from 'drizzle-orm';
import { stripe } from '@/lib/stripe';
import { calculateDelivery } from '@/lib/utils';

const ItemSchema = z.object({
  productId: z.string().uuid(),
  slug: z.string(),
  name: z.string(),
  priceInPence: z.number().int().min(0),
  imageUrl: z.string().optional(),
  quantity: z.number().int().min(1).max(99),
  weightLabel: z.string().optional(),
});

const CheckoutSchema = z.object({
  items: z.array(ItemSchema).min(1),
  fulfilment: z.enum(['pickup', 'delivery']),
  customer: z.object({
    name: z.string().min(1).max(160),
    email: z.string().email().max(200),
    phone: z.string().min(5).max(40),
  }),
  deliveryAddress: z
    .object({
      line1: z.string().min(1),
      line2: z.string().optional(),
      city: z.string().min(1),
      postcode: z.string().min(1),
    })
    .nullable()
    .optional(),
  slot: z.string().datetime(),
  notes: z.string().max(1000).optional(),
  promotionCode: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const raw = await req.json();
    const parsed = CheckoutSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Please check your details and try again', issues: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const data = parsed.data;

    if (data.fulfilment === 'delivery' && !data.deliveryAddress) {
      return NextResponse.json(
        { error: 'Delivery address required for home delivery' },
        { status: 400 }
      );
    }

    // Pull canonical prices from DB so client-side prices can't be tampered with.
    const ids = data.items.map((i) => i.productId);
    const dbProducts = await db
      .select()
      .from(products)
      .where(inArray(products.id, ids));

    const priceMap = new Map(dbProducts.map((p) => [p.id, p]));

    const lineItems = data.items.map((i) => {
      const dbP = priceMap.get(i.productId);
      if (!dbP || !dbP.isActive) {
        throw new Error(`Item "${i.name}" is no longer available.`);
      }
      return {
        productId: i.productId,
        name: dbP.name,
        priceInPence: dbP.priceInPence,
        quantity: i.quantity,
        imageUrl: dbP.imageUrl ?? undefined,
      };
    });

    const subtotal = lineItems.reduce(
      (sum, i) => sum + i.priceInPence * i.quantity,
      0
    );

    let discount = 0;
    let deliveryFee = calculateDelivery(subtotal, data.fulfilment);
    let appliedPromoCode: string | null = null;

    if (data.promotionCode) {
      const [promo] = await db
        .select()
        .from(promotions)
        .where(eq(promotions.code, data.promotionCode.toUpperCase()))
        .limit(1);
      if (promo && promo.isActive) {
        const now = new Date();
        const startsOk = !promo.startsAt || new Date(promo.startsAt) <= now;
        const endsOk = !promo.endsAt || new Date(promo.endsAt) >= now;
        const redemptionsOk =
          promo.maxRedemptions === null || promo.redemptionCount < promo.maxRedemptions;
        const minOk = subtotal >= promo.minimumOrderInPence;
        if (startsOk && endsOk && redemptionsOk && minOk) {
          if (promo.type === 'percent_off') {
            discount = Math.round((subtotal * promo.value) / 100);
          } else if (promo.type === 'amount_off') {
            discount = Math.min(promo.value, subtotal);
          } else if (promo.type === 'free_delivery') {
            deliveryFee = 0;
          }
          appliedPromoCode = promo.code;
        }
      }
    }

    const total = Math.max(0, subtotal - discount) + deliveryFee;

    const slotDate = new Date(data.slot);

    // Insert order with status 'pending'
    const [order] = await db
      .insert(orders)
      .values({
        customerName: data.customer.name,
        customerEmail: data.customer.email,
        customerPhone: data.customer.phone,
        fulfilment: data.fulfilment,
        deliveryAddress:
          data.fulfilment === 'delivery' ? data.deliveryAddress ?? null : null,
        pickupSlot: data.fulfilment === 'pickup' ? slotDate : null,
        deliverySlot: data.fulfilment === 'delivery' ? slotDate : null,
        notes: data.notes,
        items: lineItems,
        subtotalInPence: subtotal,
        deliveryInPence: deliveryFee,
        discountInPence: discount,
        totalInPence: total,
        promotionCode: appliedPromoCode,
        status: 'pending',
      })
      .returning();

    // Create a Stripe PaymentIntent
    const intent = await stripe.paymentIntents.create({
      amount: total,
      currency: 'gbp',
      automatic_payment_methods: { enabled: true },
      receipt_email: data.customer.email,
      metadata: {
        orderId: order.id,
        orderNumber: String(order.orderNumber),
      },
      description: `Gary's Butchers order #${order.orderNumber}`,
    });

    // Persist the PI id on the order
    await db
      .update(orders)
      .set({ stripePaymentIntentId: intent.id, updatedAt: new Date() })
      .where(eq(orders.id, order.id));

    return NextResponse.json({
      orderId: order.id,
      orderNumber: order.orderNumber,
      clientSecret: intent.client_secret,
      total,
    });
  } catch (err) {
    console.error('checkout error', err);
    const message = err instanceof Error ? err.message : 'Could not start checkout';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
