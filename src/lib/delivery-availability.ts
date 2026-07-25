import { and, eq, gte, lt } from 'drizzle-orm';
import { db } from '@/lib/db';
import { orders } from '@/lib/db/schema';
import { getShopSettings } from '@/lib/settings';
import { bucketKey, findBlock, getDateKey } from '@/lib/slots';
import { activeOrderFilter } from '@/lib/order-status';

export async function getDeliveryBucketCounts() {
  const { deliverySlots } = await getShopSettings();
  const now = new Date();
  const horizon = new Date(now);
  horizon.setDate(horizon.getDate() + 8);

  const rows = await db
    .select({ deliverySlot: orders.deliverySlot })
    .from(orders)
    .where(
      and(
        eq(orders.fulfilment, 'delivery'),
        gte(orders.deliverySlot, now),
        lt(orders.deliverySlot, horizon),
        activeOrderFilter()
      )
    );

  const counts: Record<string, number> = {};
  for (const row of rows) {
    if (!row.deliverySlot) continue;
    const slotDate = new Date(row.deliverySlot);
    const block = findBlock(deliverySlots.blocks, slotDate);
    if (!block) continue;
    const key = bucketKey(getDateKey(slotDate), block.id);
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return counts;
}
