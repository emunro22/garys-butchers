import { and, eq, sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import { orders, promotions, referrals, users } from '@/lib/db/schema';
import { ensureOrdersSchema, ensureUsersSchema, ensureReferralsSchema } from '@/lib/db/ensure-schema';
import { sendOrderConfirmation, sendShopNotification } from '@/lib/email';

type OrderRow = typeof orders.$inferSelect;

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

  const [won] = await db
    .update(orders)
    .set({
      status: 'paid',
      orderNumber: sql`nextval('orders_order_number_seq')`,
      updatedAt: new Date(),
    })
    .where(and(eq(orders.id, orderId), eq(orders.status, 'pending')))
    .returning();

  if (!won) {
    const [existing] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
    return existing ?? null;
  }

  // Premium/bulk orders skip the customer-visible 'paid' state and go
  // straight to 'preparing' — the price and courier aren't finalised until
  // admin weighs the order, so "confirmed" would be misleading. A follow-up
  // shipping-update email (see the admin orders screen) tells the customer
  // once it's actually on its way.
  if (won.fulfilment === 'premium') {
    await db.update(orders).set({ status: 'preparing', updatedAt: new Date() }).where(eq(orders.id, orderId));
    won.status = 'preparing';
  }

  if (won.promotionCode) {
    await db
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
      await db
        .update(users)
        .set({ referralCreditsAvailable: sql`GREATEST(${users.referralCreditsAvailable} - 1, 0)` })
        .where(eq(users.id, won.userId));
    }

    // Was this buyer referred by someone, and is this the first paid order to
    // land since they signed up? The conditional UPDATE (status must still be
    // 'pending') both answers that and claims the reward atomically — a
    // second paid order for the same buyer will match zero rows here.
    await ensureReferralsSchema();
    const [rewarded] = await db
      .update(referrals)
      .set({ status: 'rewarded', qualifyingOrderId: won.id, rewardedAt: new Date() })
      .where(and(eq(referrals.referredUserId, won.userId), eq(referrals.status, 'pending')))
      .returning({ referrerUserId: referrals.referrerUserId });

    if (rewarded) {
      await db
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
