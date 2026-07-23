import { and, eq, gte, lt, notInArray } from 'drizzle-orm';
import { db } from '@/lib/db';
import { orders } from '@/lib/db/schema';
import { getSameDayBlockKey, type SameDayBlockKey } from '@/lib/same-day-slots';

/** Booked counts per same-day block, for today only. */
export async function getSameDayBucketCounts(): Promise<Partial<Record<SameDayBlockKey, number>>> {
  const dayStart = new Date();
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(dayStart);
  dayEnd.setDate(dayEnd.getDate() + 1);

  const rows = await db
    .select({ deliverySlot: orders.deliverySlot })
    .from(orders)
    .where(
      and(
        eq(orders.fulfilment, 'delivery'),
        gte(orders.deliverySlot, dayStart),
        lt(orders.deliverySlot, dayEnd),
        notInArray(orders.status, ['cancelled', 'refunded'])
      )
    );

  const counts: Partial<Record<SameDayBlockKey, number>> = {};
  for (const row of rows) {
    if (!row.deliverySlot) continue;
    const blockKey = getSameDayBlockKey(new Date(row.deliverySlot));
    if (!blockKey) continue;
    counts[blockKey] = (counts[blockKey] ?? 0) + 1;
  }
  return counts;
}
