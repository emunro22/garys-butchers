import { and, eq, gte, lt, notInArray } from 'drizzle-orm';
import { db } from '@/lib/db';
import { orders } from '@/lib/db/schema';
import { getShopSettings } from '@/lib/settings';
import { findBlock } from '@/lib/slots';

/** Booked counts per same-day block, for today only. */
export async function getSameDayBucketCounts(): Promise<Record<string, number>> {
  const { sameDay } = await getShopSettings();
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

  const counts: Record<string, number> = {};
  for (const row of rows) {
    if (!row.deliverySlot) continue;
    const block = findBlock(sameDay.blocks, new Date(row.deliverySlot));
    if (!block) continue;
    counts[block.id] = (counts[block.id] ?? 0) + 1;
  }
  return counts;
}
