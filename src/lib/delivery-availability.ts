import { and, eq, gte, lt, notInArray } from 'drizzle-orm';
import { db } from '@/lib/db';
import { orders } from '@/lib/db/schema';
import { bucketKey, getDeliveryBlockKey, getDeliveryDateKey } from '@/lib/delivery-slots';

export async function getDeliveryBucketCounts() {
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
        notInArray(orders.status, ['cancelled', 'refunded'])
      )
    );

  const counts: Record<string, number> = {};
  for (const row of rows) {
    if (!row.deliverySlot) continue;
    const blockKey = getDeliveryBlockKey(row.deliverySlot);
    if (!blockKey) continue;
    const key = bucketKey(getDeliveryDateKey(row.deliverySlot), blockKey);
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return counts;
}
