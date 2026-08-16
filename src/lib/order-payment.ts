import { and, desc, eq, sql } from 'drizzle-orm';
import { catalogDb, ordersDb } from '@/lib/db';
import { orders, referrals, users } from '@/lib/db/schema-orders';
import { promotions } from '@/lib/db/schema-catalog';
import { ensureOrdersSchema, ensureUsersSchema, ensureReferralsSchema } from '@/lib/db/ensure-schema';
import { sendOrderConfirmation, sendShopNotification } from '@/lib/email';
import { stripe } from '@/lib/stripe';

type OrderRow = typeof orders.$inferSelect;

/** Every still-open (unpaid) order for this email, newest first — used at
 *  checkout time to detect "the customer already has one of these in
 *  flight" before creating another. */
export async function getPendingOrdersForEmail(email: string): Promise<OrderRow[]> {
  await ensureOrdersSchema();
  return ordersDb
    .select()
    .from(orders)
    .where(and(eq(orders.customerEmail, email), eq(orders.status, 'pending')))
    .orderBy(desc(orders.createdAt));
}

/**
 * Cancels a stale pending order (and best-effort cancels its PaymentIntent)
 * so a customer starting a genuinely new checkout attempt doesn't leave the
 * old one sitting around as unpaid clutter. Same conditional-UPDATE idiom as
 * markOrderPaid — only actually cancels if it's still 'pending', so this is
 * safe to call even if the order has just been paid/cancelled by something
 * else in the meantime.
 */
export async function supersedeOrder(orderId: string): Promise<boolean> {
  await ensureOrdersSchema();
  const [won] = await ordersDb
    .update(orders)
    .set({ status: 'cancelled', updatedAt: new Date() })
    .where(and(eq(orders.id, orderId), eq(orders.status, 'pending')))
    .returning({ id: orders.id, stripePaymentIntentId: orders.stripePaymentIntentId });

  if (!won) return false;
  if (won.stripePaymentIntentId) {
    await stripe.paymentIntents.cancel(won.stripePaymentIntentId).catch(() => {});
  }
  return true;
}

/**
 * Marks an order paid, assigning it its (only-ever-assigned-here) order
 * number, and fires the confirmation/notification emails.
 *
 * Both the Stripe webhook and the client-side checkout-confirm call can
 * race to do this for the same order, so the transition itself is a single
 * conditional UPDATE (status must still be 'pending') — whichever caller's
 * UPDATE actually matches a row is the one that assigns the order number
 * and sends the emails; the other sees zero rows affected and just returns
 * the order as it now stands, without repeating any side effects.
 */
export async function markOrderPaid(orderId: string): Promise<OrderRow | null> {
  // This UPDATE (and its .returning()) touches every column Drizzle knows
  // about on `orders`, including ones added after the table was first
  // created — every successful checkout runs through here, so a missing
  // column here breaks ALL payments, not just premium-delivery ones.
  await ensureOrdersSchema();

  const [won] = await ordersDb
    .update(orders)
    .set({
      status: 'paid',
      orderNumber: sql`nextval('orders_order_number_seq')`,
      updatedAt: new Date(),
    })
    .where(and(eq(orders.id, orderId), eq(orders.status, 'pending')))
    .returning();

  if (!won) {
    const [existing] = await ordersDb.select().from(orders).where(eq(orders.id, orderId)).limit(1);
    return existing ?? null;
  }

  // Premium/bulk orders skip the customer-visible 'paid' state and go
  // straight to 'preparing' — the price and courier aren't finalised until
  // admin weighs the order, so "confirmed" would be misleading. A follow-up
  // shipping-update email (see the admin orders screen) tells the customer
  // once it's actually on its way.
  if (won.fulfilment === 'premium') {
    await ordersDb.update(orders).set({ status: 'preparing', updatedAt: new Date() }).where(eq(orders.id, orderId));
    won.status = 'preparing';
  }

  if (won.promotionCode) {
    await catalogDb
      .update(promotions)
      .set({ redemptionCount: sql`${promotions.redemptionCount} + 1` })
      .where(eq(promotions.code, won.promotionCode));
  }

  if (won.userId) {
    await ensureUsersSchema();

    // This order spent one of the buyer's own referral rewards — consume it now
    // that payment has actually succeeded (never at checkout time, in case the
    // payment fails).
    if (won.referralCreditRedeemed) {
      await ordersDb
        .update(users)
        .set({ referralCreditsAvailable: sql`GREATEST(${users.referralCreditsAvailable} - 1, 0)` })
        .where(eq(users.id, won.userId));
    }

    // Was this buyer referred by someone, and is this the first paid order to
    // land since they signed up? The conditional UPDATE (status must still be
    // 'pending') both answers that and claims the reward atomically — a
    // second paid order for the same buyer will match zero rows here.
    await ensureReferralsSchema();
    const [rewarded] = await ordersDb
      .update(referrals)
      .set({ status: 'rewarded', qualifyingOrderId: won.id, rewardedAt: new Date() })
      .where(and(eq(referrals.referredUserId, won.userId), eq(referrals.status, 'pending')))
      .returning({ referrerUserId: referrals.referrerUserId });

    if (rewarded) {
      await ordersDb
        .update(users)
        .set({ referralCreditsAvailable: sql`${users.referralCreditsAvailable} + 1` })
        .where(eq(users.id, rewarded.referrerUserId));
    }
  }

  try {
    const emailPayload = {
      orderNumber: won.orderNumber!,
      customerName: won.customerName,
      customerEmail: won.customerEmail,
      customerPhone: won.customerPhone,
      fulfilment: won.fulfilment,
      items: won.items,
      subtotalInPence: won.subtotalInPence,
      deliveryInPence: won.deliveryInPence,
      discountInPence: won.discountInPence,
      totalInPence: won.totalInPence,
      pickupSlot: won.pickupSlot ? won.pickupSlot.toISOString() : null,
      deliverySlot: won.deliverySlot ? won.deliverySlot.toISOString() : null,
      deliveryAddress: won.deliveryAddress,
      notes: won.notes,
      promotionCode: won.promotionCode,
    };
    await Promise.all([
      sendOrderConfirmation(emailPayload),
      sendShopNotification(emailPayload),
    ]);
  } catch (emailErr) {
    console.error('order email failed', emailErr);
  }

  return won;
}
