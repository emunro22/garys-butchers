import { and, eq, gte, lt } from 'drizzle-orm';
import { db } from '@/lib/db';
import { orders, subscriptions } from '@/lib/db/schema';
import { getShopSettings } from '@/lib/settings';
import { blocksForWeekday, findBlock, getDateKey, getWeekday, londonDateTime, type SlotBlock } from '@/lib/slots';
import { activeOrderFilter } from '@/lib/order-status';
import { markOrderPaid } from '@/lib/order-payment';

type SubscriptionRow = typeof subscriptions.$inferSelect;

function daysInMonth(year: number, month: number): number {
  // Day 0 of the *next* month is the last day of `month`.
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

async function countBookingsForBlock(
  fulfilment: 'pickup' | 'delivery',
  dayStart: Date,
  dayEnd: Date,
  blocks: SlotBlock[],
  blockId: string
): Promise<number> {
  const col = fulfilment === 'delivery' ? orders.deliverySlot : orders.pickupSlot;
  const rows = await db
    .select({ slot: col })
    .from(orders)
    .where(and(eq(orders.fulfilment, fulfilment), gte(col, dayStart), lt(col, dayEnd), activeOrderFilter()));
  let count = 0;
  for (const row of rows) {
    if (!row.slot) continue;
    const block = findBlock(blocks, new Date(row.slot));
    if (block?.id === blockId) count++;
  }
  return count;
}

/**
 * Finds the next real, bookable date/time for a subscription's preferred
 * block — starting from the nearest occurrence of its preferred day-of-month
 * (today or later), and walking forward day by day (same block, same time)
 * whenever a day is closed or already at capacity. Checks against the exact
 * same slot-capacity data real checkout orders compete for, so a subscription
 * renewal can never silently overbook a delivery/pickup window.
 *
 * Returns null if nothing opens up within the search window — the renewal
 * order is still created (see handleInvoicePaid), just without a slot, so it
 * surfaces in the admin orders screen for manual scheduling.
 */
export async function findNextRenewalSlot(sub: SubscriptionRow): Promise<Date | null> {
  const shopSettings = await getShopSettings();
  const group = sub.fulfilment === 'delivery' ? shopSettings.deliverySlots : shopSettings.pickupSlots;
  const block = group.blocks.find((b) => b.id === sub.preferredBlockId) ?? group.blocks[0];
  if (!block) return null;

  const now = new Date();
  const todayKey = getDateKey(now);
  const [ty, tm, td] = todayKey.split('-').map(Number);

  let year = ty;
  let month = tm;
  let day = Math.min(sub.preferredDayOfMonth, daysInMonth(ty, tm));
  if (day < td) {
    month += 1;
    if (month > 12) {
      month = 1;
      year += 1;
    }
    day = Math.min(sub.preferredDayOfMonth, daysInMonth(year, month));
  }

  // Search up to 10 days forward from the target date for an open slot.
  const SEARCH_WINDOW_DAYS = 10;
  for (let offset = 0; offset < SEARCH_WINDOW_DAYS; offset++) {
    const candidateStart = londonDateTime(year, month, day, 0);
    const candidate = new Date(candidateStart.getTime() + offset * 24 * 60 * 60 * 1000);
    const weekday = getWeekday(candidate);
    if (group.closedDays.includes(weekday)) continue;
    // Skip days where the subscriber's preferred block falls outside that
    // day's offered hours (e.g. an afternoon block on an early-closing Saturday).
    if (!blocksForWeekday(group, weekday).some((b) => b.id === block.id)) continue;

    const dateKey = getDateKey(candidate);
    const [cy, cm, cd] = dateKey.split('-').map(Number);
    const dayStart = londonDateTime(cy, cm, cd, 0);
    const dayEnd = londonDateTime(cy, cm, cd, 1440);
    const count = await countBookingsForBlock(sub.fulfilment, dayStart, dayEnd, group.blocks, block.id);
    if (count < block.capacity) {
      return londonDateTime(cy, cm, cd, block.startMinutes);
    }
  }
  return null;
}

/**
 * Creates this cycle's fulfilment order for a subscription once Stripe has
 * actually collected payment for it (see invoice.paid in the webhook).
 * Idempotent per Stripe invoice — Stripe can and does retry webhook
 * deliveries, and the unique index on orders.stripeInvoiceId turns a repeat
 * delivery into a no-op instead of a duplicate order.
 */
export async function createRenewalOrder(sub: SubscriptionRow, stripeInvoiceId: string, customerEmail: string, customerName: string) {
  const [existing] = await db.select({ id: orders.id }).from(orders).where(eq(orders.stripeInvoiceId, stripeInvoiceId)).limit(1);
  if (existing) return existing;

  const slot = await findNextRenewalSlot(sub);
  const subtotal = sub.subtotalInPence;

  const [order] = await db
    .insert(orders)
    .values({
      userId: sub.userId,
      customerName,
      customerEmail,
      customerPhone: null,
      fulfilment: sub.fulfilment,
      deliveryAddress: sub.fulfilment === 'delivery' ? sub.deliveryAddress : null,
      pickupSlot: sub.fulfilment === 'pickup' ? slot : null,
      deliverySlot: sub.fulfilment === 'delivery' ? slot : null,
      notes: slot
        ? `Subscription renewal (${sub.id})`
        : `Subscription renewal (${sub.id}) — no slot had capacity in the usual window, please schedule manually.`,
      items: sub.items,
      subtotalInPence: subtotal,
      deliveryInPence: 0,
      discountInPence: 0,
      totalInPence: subtotal,
      subscriptionId: sub.id,
      stripeInvoiceId,
      status: 'pending',
    })
    .returning();

  // Payment already succeeded (this only runs from invoice.paid) — go
  // straight to 'paid' and let markOrderPaid handle the order number and
  // confirmation emails exactly like a normal checkout.
  await markOrderPaid(order.id);
  return order;
}
