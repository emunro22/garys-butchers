import { and, eq, gte, lt } from 'drizzle-orm';
import { ordersDb } from '@/lib/db';
import { orders } from '@/lib/db/schema';
import { getShopSettings } from '@/lib/settings';
import { bucketKey, findBlock, getDateKey } from '@/lib/slots';
import { activeOrderFilter } from '@/lib/order-status';

export async function getPickupBucketCounts() {
  const { pickupSlots } = await getShopSettings();
  const now = new Date();
  const horizon = new Date(now);
  horizon.setDate(horizon.getDate() + 8);

  const rows = await ordersDb
    .select({ pickupSlot: orders.pickupSlot })
    .from(orders)
    .where(
      and(
        eq(orders.fulfilment, 'pickup'),
        gte(orders.pickupSlot, now),
        lt(orders.pickupSlot, horizon),
        activeOrderFilter()
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
