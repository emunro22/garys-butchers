import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { ordersDb } from '@/lib/db';
import { orders } from '@/lib/db/schema';
import { sendOrderConfirmation, sendShopNotification } from '@/lib/email';

export const dynamic = 'force-dynamic';

// One-off: order #00195 (id 485ed0b5-7576-44bd-88bf-404501fd7e3d) never got
// its confirmation/notification emails because the Resend sending domain
// briefly lost verification (see order-payment.ts's swallowed email
// try/catch). Scheduled as a one-shot cron below (see vercel.json) so
// Vercel's own scheduler supplies CRON_SECRET server-side — nobody needs to
// handle the key by hand. Delete this route and its vercel.json entry once
// confirmed sent.
const TARGET_ORDER_ID = '485ed0b5-7576-44bd-88bf-404501fd7e3d';

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization');
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const [order] = await ordersDb.select().from(orders).where(eq(orders.id, TARGET_ORDER_ID)).limit(1);
  if (!order || order.orderNumber == null) {
    return NextResponse.json({ error: 'Order not found or unpaid' }, { status: 404 });
  }

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

  await Promise.all([sendOrderConfirmation(emailPayload), sendShopNotification(emailPayload)]);

  return NextResponse.json({ sent: true, orderNumber: order.orderNumber });
}
