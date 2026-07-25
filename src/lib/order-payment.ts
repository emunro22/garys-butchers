import { eq, sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import { orders, promotions } from '@/lib/db/schema';
import { sendOrderConfirmation, sendShopNotification } from '@/lib/email';

type OrderRow = typeof orders.$inferSelect;

/** Marks an order paid and fires the confirmation/notification emails.
 *  Idempotent — a no-op if the order isn't still pending. */
export async function markOrderPaid(order: OrderRow) {
  if (order.status !== 'pending') return;

  await db
    .update(orders)
    .set({ status: 'paid', updatedAt: new Date() })
    .where(eq(orders.id, order.id));

  if (order.promotionCode) {
    await db
      .update(promotions)
      .set({ redemptionCount: sql`${promotions.redemptionCount} + 1` })
      .where(eq(promotions.code, order.promotionCode));
  }

  try {
    const emailPayload = {
      orderNumber: order.orderNumber,
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      customerPhone: order.customerPhone,
      fulfilment: order.fulfilment,
      items: order.items,
      subtotalInPence: order.subtotalInPence,
      deliveryInPence: order.deliveryInPence,
      discountInPence: order.discountInPence,
      totalInPence: order.totalInPence,
      pickupSlot: order.pickupSlot ? order.pickupSlot.toISOString() : null,
      deliverySlot: order.deliverySlot ? order.deliverySlot.toISOString() : null,
      deliveryAddress: order.deliveryAddress,
      notes: order.notes,
      promotionCode: order.promotionCode,
    };
    await Promise.all([
      sendOrderConfirmation(emailPayload),
      sendShopNotification(emailPayload),
    ]);
  } catch (emailErr) {
    console.error('order email failed', emailErr);
  }
}
