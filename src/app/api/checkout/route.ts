import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { orders, products, promotions, users } from '@/lib/db/schema';
import { ensureOrdersSchema, ensureUsersSchema, ensureProductsSchema } from '@/lib/db/ensure-schema';
import { eq, inArray } from 'drizzle-orm';
import { stripe } from '@/lib/stripe';
import {
  calculateDelivery,
  getDistanceMiles,
  calculateDeliveryByDistance,
  formatPrice,
  MINIMUM_DELIVERY_ORDER_PENCE,
} from '@/lib/utils';
import { getShopSettings } from '@/lib/settings';
import { getCustomerSession } from '@/lib/auth';
import { hasCustomerUsedPromotion } from '@/lib/promotions';
import { bucketKey, findBlock, getDateKey, getWeekday, isToday, londonDateTime, minutesOfDay } from '@/lib/slots';
import { getDeliveryBucketCounts } from '@/lib/delivery-availability';
import { getSameDayBucketCounts } from '@/lib/same-day-availability';
import { getPickupBucketCounts } from '@/lib/pickup-availability';
import { markOrderPaid } from '@/lib/order-payment';

// Stripe won't create a PaymentIntent below this amount for GBP — a promo
// code that fully (or near-fully) covers the order needs to skip Stripe.
const STRIPE_MINIMUM_CHARGE_PENCE = 30;

// Thrown deliberately with a message that's safe to show the customer
// verbatim. Anything else caught below (Stripe errors, DB errors, etc.)
// gets a generic fallback instead, so no raw/internal error text ever
// reaches the checkout page.
class CheckoutError extends Error {}

const GENERIC_CHECKOUT_ERROR =
  "Sorry, something went wrong placing your order. Please try again, or contact us if it keeps happening.";

const ItemSchema = z.object({
  productId: z.string().uuid(),
  slug: z.string(),
  name: z.string(),
  priceInPence: z.number().int().min(0),
  imageUrl: z.string().optional(),
  quantity: z.number().int().min(1).max(99),
  weightLabel: z.string().optional(),
  variantLabel: z.string().optional(),
  marinadeLabel: z.string().optional(),
});

const CheckoutSchema = z.object({
  items: z.array(ItemSchema).min(1),
  fulfilment: z.enum(['pickup', 'delivery', 'premium']),
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
  // Premium/bulk delivery is courier-scheduled, not a self-managed shop
  // slot, so it's the only fulfilment type that doesn't require one.
  slot: z.string().datetime().optional(),
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

    // Every checkout inserts into `orders` and reads/returns all of its
    // columns (Drizzle's .returning() covers every schema column, including
    // ones added after the table was first created) — so this must run
    // unconditionally, not just for premium orders, or ALL checkouts break.
    await ensureOrdersSchema();
    await ensureUsersSchema();
    await ensureProductsSchema();

    const customerSession = await getCustomerSession();

    if (data.fulfilment !== 'premium' && !data.slot) {
      return NextResponse.json({ error: 'Please choose a time slot' }, { status: 400 });
    }

    if (data.fulfilment !== 'pickup' && !data.deliveryAddress) {
      return NextResponse.json(
        { error: 'Delivery address required for home delivery' },
        { status: 400 }
      );
    }

    if (data.fulfilment === 'premium') {
      // Re-check eligibility server-side — never trust the client, since a
      // customer could otherwise submit fulfilment: 'premium' directly.
      const eligible =
        customerSession?.userId &&
        (
          await db
            .select({ premiumDeliveryEligible: users.premiumDeliveryEligible })
            .from(users)
            .where(eq(users.id, customerSession.userId))
            .limit(1)
        )[0]?.premiumDeliveryEligible;

      if (!eligible) {
        return NextResponse.json(
          {
            error:
              'Premium/bulk delivery is not available on your account — please sign in with an eligible account, or contact us.',
          },
          { status: 403 }
        );
      }
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
        throw new CheckoutError(`Item "${i.name}" is no longer available.`);
      }

      // Resolve price: if a variantLabel is given, use the matching variant price
      let priceInPence = dbP.priceInPence;
      if (i.variantLabel) {
        const variants = dbP.variants as Array<{ label: string; priceInPence: number }> | null;
        const variant = variants?.find((v) => v.label === i.variantLabel);
        if (!variant) {
          throw new CheckoutError(`Size "${i.variantLabel}" is no longer available for "${dbP.name}".`);
        }
        priceInPence = variant.priceInPence;
      }

      // Marinade choice never affects price — just validate it's still one of
      // this product's current options, and fold it into the display name
      // (there's no separate column for it, same as variantLabel above).
      if (i.marinadeLabel) {
        const marinades = (dbP.marinades as string[] | null) ?? [];
        if (!marinades.includes(i.marinadeLabel)) {
          throw new CheckoutError(`Marinade "${i.marinadeLabel}" is no longer available for "${dbP.name}".`);
        }
      }

      const suffix = [i.variantLabel, i.marinadeLabel].filter(Boolean).join(', ');

      return {
        productId: i.productId,
        name: suffix ? `${dbP.name} (${suffix})` : dbP.name,
        priceInPence,
        quantity: i.quantity,
        imageUrl: dbP.imageUrl ?? undefined,
      };
    });

    const subtotal = lineItems.reduce(
      (sum, i) => sum + i.priceInPence * i.quantity,
      0
    );

    // Meat packs are already bundled/discounted pricing — promo codes apply
    // only to the non-pack portion of the order, so percent_off/amount_off
    // below is calculated against this instead of the full subtotal.
    const discountableSubtotal = lineItems.reduce((sum, i) => {
      const dbP = priceMap.get(i.productId);
      return dbP?.isPack ? sum : sum + i.priceInPence * i.quantity;
    }, 0);

    if (data.fulfilment !== 'pickup' && subtotal < MINIMUM_DELIVERY_ORDER_PENCE) {
      return NextResponse.json(
        {
          error: `Sorry, there's a ${formatPrice(
            MINIMUM_DELIVERY_ORDER_PENCE
          )} minimum order for delivery — please add more items, or choose pickup instead.`,
        },
        { status: 400 }
      );
    }

    // Premium/bulk delivery has no slot to parse — the date is meaningless
    // for it and must never be used in the notice-day/slot-capacity checks below.
    const slotDate = data.slot ? new Date(data.slot) : null;
    const shopSettings = await getShopSettings();

    // Some products require extra notice beyond the earliest available slot (always "tomorrow").
    const maxNoticeDays = Math.max(
      0,
      ...data.items.map((i) => priceMap.get(i.productId)?.noticeDays ?? 0)
    );

    // A "delivery" order dated today is only ever a same-day order — the regular
    // delivery slot list never offers today (it starts tomorrow), so this is unambiguous.
    // Premium/bulk delivery has no slot at all, so it never matches here.
    const sameDayBlock =
      data.fulfilment === 'delivery' && slotDate && isToday(slotDate)
        ? findBlock(shopSettings.sameDay.blocks, slotDate)
        : null;
    const isSameDaySlot = sameDayBlock !== null;

    if (sameDayBlock && slotDate) {
      if (maxNoticeDays > 0) {
        return NextResponse.json(
          { error: "Sorry, an item in your basket isn't available for same-day delivery — please choose a later date." },
          { status: 400 }
        );
      }
      const now = new Date();
      const endsAt = sameDayBlock.endMinutes > sameDayBlock.startMinutes ? sameDayBlock.endMinutes : sameDayBlock.startMinutes;
      const nowMinutes = minutesOfDay(now);
      if (!isToday(slotDate, now) || nowMinutes >= endsAt || shopSettings.sameDay.closedDays.includes(getWeekday(now))) {
        return NextResponse.json(
          { error: 'That same-day slot has passed — please choose another time.' },
          { status: 400 }
        );
      }
      const counts = await getSameDayBucketCounts();
      if ((counts[sameDayBlock.id] ?? 0) >= sameDayBlock.capacity) {
        return NextResponse.json(
          { error: 'That same-day slot is fully booked — please choose another.' },
          { status: 400 }
        );
      }
    } else if (maxNoticeDays > 0 && data.fulfilment !== 'premium' && slotDate) {
      const [y, m, d] = getDateKey(new Date()).split('-').map(Number);
      const minAllowed = londonDateTime(y, m, d + 1 + maxNoticeDays, 0);
      if (getDateKey(slotDate) < getDateKey(minAllowed)) {
        return NextResponse.json(
          {
            error: `Sorry, an item in your basket needs ${maxNoticeDays} day${maxNoticeDays === 1 ? '' : 's'} notice — please choose a later date.`,
          },
          { status: 400 }
        );
      }
    }

    let discount = 0;
    let deliveryFee: number;
    if (data.fulfilment === 'premium') {
      deliveryFee = shopSettings.premiumDelivery.minimumFeeInPence;
    } else if (data.fulfilment === 'delivery' && data.deliveryAddress?.postcode) {
      const { delivery } = shopSettings;
      const settings = {
        freeUnderMiles: delivery.freeUnderMiles,
        midTierMiles: delivery.midTierMiles,
        midTierFeePence: delivery.midTierFeePence,
        farFeePence: delivery.farFeePence,
        radiusMiles: delivery.radiusMiles,
      };
      const distanceMiles = await getDistanceMiles(data.deliveryAddress.postcode);
      const result = calculateDeliveryByDistance(distanceMiles, settings);
      if (!result.withinRadius) {
        const error =
          distanceMiles === null
            ? "Sorry, we couldn't verify that postcode. Please check it and try again, or choose pickup instead."
            : `Sorry, that address is outside our ${settings.radiusMiles} mile delivery area. Please choose pickup instead.`;
        return NextResponse.json({ error }, { status: 400 });
      }
      deliveryFee = result.feePence;
    } else {
      deliveryFee = calculateDelivery(data.fulfilment);
    }
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
        const singleUseOk =
          !shopSettings.promotions.singleUsePerCustomer ||
          !(await hasCustomerUsedPromotion(data.customer.email, promo.code));
        if (startsOk && endsOk && redemptionsOk && minOk && singleUseOk) {
          if (promo.type === 'percent_off') {
            discount = Math.round((discountableSubtotal * promo.value) / 100);
          } else if (promo.type === 'amount_off') {
            discount = Math.min(promo.value, discountableSubtotal);
          } else if (promo.type === 'free_delivery') {
            deliveryFee = 0;
          }
          appliedPromoCode = promo.code;
        }
      }
    }

    const total = Math.max(0, subtotal - discount) + deliveryFee;

    // data.slot (and therefore slotDate) is guaranteed non-null here — enforced
    // by the "please choose a time slot" check earlier for every fulfilment
    // type except 'premium', which never reaches these two branches.
    if (data.fulfilment === 'delivery' && !isSameDaySlot && slotDate) {
      const { deliverySlots } = shopSettings;
      const block = deliverySlots.closedDays.includes(getWeekday(slotDate)) ? null : findBlock(deliverySlots.blocks, slotDate);
      if (!block) {
        return NextResponse.json({ error: 'That delivery slot is no longer valid' }, { status: 400 });
      }
      const counts = await getDeliveryBucketCounts();
      const key = bucketKey(getDateKey(slotDate), block.id);
      if ((counts[key] ?? 0) >= block.capacity) {
        return NextResponse.json(
          { error: 'That delivery slot is fully booked — please choose another.' },
          { status: 400 }
        );
      }
    }

    if (data.fulfilment === 'pickup' && slotDate) {
      const { pickupSlots } = shopSettings;
      const block = pickupSlots.closedDays.includes(getWeekday(slotDate)) ? null : findBlock(pickupSlots.blocks, slotDate);
      if (!block) {
        return NextResponse.json({ error: 'That pickup slot is no longer valid' }, { status: 400 });
      }
      const counts = await getPickupBucketCounts();
      const key = bucketKey(getDateKey(slotDate), block.id);
      if ((counts[key] ?? 0) >= block.capacity) {
        return NextResponse.json(
          { error: 'That pickup slot is fully booked — please choose another.' },
          { status: 400 }
        );
      }
    }

    // Insert order with status 'pending'
    const [order] = await db
      .insert(orders)
      .values({
        userId: customerSession?.userId ?? null,
        customerName: data.customer.name,
        customerEmail: data.customer.email,
        customerPhone: data.customer.phone,
        fulfilment: data.fulfilment,
        deliveryAddress:
          data.fulfilment !== 'pickup' ? data.deliveryAddress ?? null : null,
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

    // A promo code can cover the whole order (or leave a residue below
    // Stripe's minimum chargeable amount) — nothing to charge, so skip Stripe.
    if (total < STRIPE_MINIMUM_CHARGE_PENCE) {
      const paidOrder = await markOrderPaid(order.id);
      return NextResponse.json({
        orderId: order.id,
        orderNumber: paidOrder?.orderNumber ?? null,
        clientSecret: null,
        total,
      });
    }

    // Create a Stripe PaymentIntent. No order number exists yet at this point
    // — it's only assigned once payment actually succeeds (markOrderPaid) —
    // so orderId (not orderNumber) is the reference for this PaymentIntent.
    const intent = await stripe.paymentIntents.create({
      amount: total,
      currency: 'gbp',
      automatic_payment_methods: { enabled: true },
      receipt_email: data.customer.email,
      metadata: {
        orderId: order.id,
        ...(appliedPromoCode ? { promoCode: appliedPromoCode } : {}),
        fulfilment: data.fulfilment,
      },
      description: `Gary's Butchers order ${order.id}`,
    });

    // Persist the PI id on the order
    await db
      .update(orders)
      .set({ stripePaymentIntentId: intent.id, updatedAt: new Date() })
      .where(eq(orders.id, order.id));

    return NextResponse.json({
      orderId: order.id,
      clientSecret: intent.client_secret,
      total,
    });
  } catch (err) {
    console.error('checkout error', err);
    if (err instanceof CheckoutError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    return NextResponse.json({ error: GENERIC_CHECKOUT_ERROR }, { status: 500 });
  }
}
