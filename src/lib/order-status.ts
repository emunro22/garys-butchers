import { and, gte, ne, notInArray, or, type SQL } from 'drizzle-orm';
import { orders } from '@/lib/db/schema';

/** How long a checkout can sit unpaid before it's treated as abandoned. */
export const PENDING_ORDER_TTL_MINUTES = 20;

/** Orders that should still count against slot capacity: anything not
 *  cancelled/refunded, excluding "pending" orders old enough to have been
 *  abandoned mid-checkout (customer never completed payment). */
export function activeOrderFilter(): SQL {
  const staleCutoff = new Date(Date.now() - PENDING_ORDER_TTL_MINUTES * 60 * 1000);
  return and(
    notInArray(orders.status, ['cancelled', 'refunded']),
    or(ne(orders.status, 'pending'), gte(orders.createdAt, staleCutoff))
  )!;
}
