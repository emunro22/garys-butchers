import { and, eq, gte, lt, notInArray } from 'drizzle-orm';
import { db } from '@/lib/db';
import { orders } from '@/lib/db/schema';
import { getShopSettings } from '@/lib/settings';
import { bucketKey, findBlock, getDateKey } from '@/lib/slots';

export async function getPickupBucketCounts() {
  const { pickupSlots } = await getShopSettings();
  const now = new Date();
  const horizon = new Date(now);
  horizon.setDate(horizon.getDate() + 8);

  const rows = await db
    .select({ pickupSlot: orders.pickupSlot })
    .from(orders)
    .where(
      and(
        eq(orders.fulfilment, 'pickup'),
        gte(orders.pickupSlot, now),
        lt(orders.pickupSlot, horizon),
        notInArray(orders.status, ['cancelled', 'refunded'])
      )
    );

  const counts: Record<string, number> = {};
  for (const row of rows) {
    if (!row.pickupSlot) continue;
    const slotDate = new Date(row.pickupSlot);
    const block = findBlock(pickupSlots.blocks, slotDate);
    if (!block) continue;
    const key = bucketKey(getDateKey(slotDate), block.id);
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return counts;
}
