// One-time backfill: sends the "leave us a review" email to every existing
// customer who has an order due today or in the past (pickup/delivery slot
// already happened) — one email per customer, not per order, so repeat
// customers aren't sent several at once.
//
// Only touches orders whose fulfilment slot is today or earlier. Orders with
// a future slot are left alone so the ongoing 8pm cron
// (src/app/api/cron/send-review-request-emails) sends them on their actual
// day, same as any order placed from now on. Premium/bulk orders have no
// shop slot to match against and are skipped, same as that cron.
//
// Shared by scripts/send-review-request-backfill.ts (run locally) and
// src/app/api/admin/send-review-backfill/route.ts (triggered from the admin
// panel, where production credentials are already available at runtime).

import { and, eq, isNull, notInArray, or, isNotNull } from 'drizzle-orm';
import { ordersDb } from '@/lib/db';
import { orders, type Order } from '@/lib/db/schema';
import { ensureOrdersSchema } from '@/lib/db/ensure-schema';
import { getDateKey } from '@/lib/slots';
import { sendReviewRequestEmail } from '@/lib/email';

export async function getReviewBackfillCandidates() {
  await ensureOrdersSchema();

  const todayKey = getDateKey(new Date());

  const candidates = await ordersDb
    .select()
    .from(orders)
    .where(
      and(
        notInArray(orders.status, ['pending', 'cancelled', 'refunded']),
        isNull(orders.reviewEmailSentAt),
        or(isNotNull(orders.pickupSlot), isNotNull(orders.deliverySlot))
      )
    );

  const dueOrEarlier = candidates.filter((order) => {
    const slot = order.fulfilment === 'pickup' ? order.pickupSlot : order.deliverySlot;
    return slot != null && getDateKey(slot) <= todayKey && order.orderNumber != null;
  });

  // One email per customer — pick each customer's most recently fulfilled
  // order to reference in the email, dedupe by (lowercased) email.
  const byEmail = new Map<string, Order>();
  for (const order of dueOrEarlier) {
    const email = order.customerEmail.toLowerCase();
    const existing = byEmail.get(email);
    if (!existing || order.createdAt > existing.createdAt) {
      byEmail.set(email, order);
    }
  }

  return { dueOrEarlier, byEmail };
}

export async function runReviewBackfill() {
  const { dueOrEarlier, byEmail } = await getReviewBackfillCandidates();

  let sent = 0;
  let failed = 0;
  for (const order of byEmail.values()) {
    try {
      await sendReviewRequestEmail({
        orderNumber: order.orderNumber!,
        customerName: order.customerName,
        customerEmail: order.customerEmail,
      });
      sent++;
    } catch (err) {
      failed++;
      console.error(`Failed to send review email to ${order.customerEmail} (order ${order.id})`, err);
      continue; // leave reviewEmailSentAt null for this customer's orders so a re-run retries them
    }

    // Mark every one of this customer's *already-due* orders covered, so the
    // ongoing cron never sends a second one for an older order of theirs
    // that also happens to be due today. Their future orders are untouched.
    const theirDueOrderIds = dueOrEarlier
      .filter((o) => o.customerEmail.toLowerCase() === order.customerEmail.toLowerCase())
      .map((o) => o.id);
    for (const id of theirDueOrderIds) {
      await ordersDb
        .update(orders)
        .set({ reviewEmailSentAt: new Date() })
        .where(and(eq(orders.id, id), isNull(orders.reviewEmailSentAt)));
    }
  }

  return { eligibleOrders: dueOrEarlier.length, eligibleCustomers: byEmail.size, sent, failed };
}
