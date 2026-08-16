import { and, eq, gte, lt } from 'drizzle-orm';
import { ordersDb } from '@/lib/db';
import { orders } from '@/lib/db/schema';
import { getShopSettings } from '@/lib/settings';
import { findBlock, getDateKey, londonDateTime } from '@/lib/slots';
import { activeOrderFilter } from '@/lib/order-status';

/** Booked counts per same-day block, for today only. */
export async function getSameDayBucketCounts(): Promise<Record<string, number>> {
  const { sameDay } = await getShopSettings();
  const [y, m, d] = getDateKey(new Date()).split('-').map(Number);
  const dayStart = londonDateTime(y, m, d, 0);
  const dayEnd = londonDateTime(y, m, d + 1, 0);

  const rows = await ordersDb
    .select({ deliverySlot: orders.deliverySlot })
    .from(orders)
    .where(
      and(
        eq(orders.fulfilment, 'delivery'),
        gte(orders.deliverySlot, dayStart),
        lt(orders.deliverySlot, dayEnd),
        activeOrderFilter()
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
