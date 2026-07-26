import { and, eq, sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import { orders, promotions } from '@/lib/db/schema';
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

  if (won.promotionCode) {
    await db
      .update(promotions)
      .set({ redemptionCount: sql`${promotions.redemptionCount} + 1` })
      .where(eq(promotions.code, won.promotionCode));
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
