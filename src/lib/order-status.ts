import { notInArray, type SQL } from 'drizzle-orm';
import { orders } from '@/lib/db/schema';

/** How long a checkout can sit unpaid before the cleanup cron cancels it
 *  (and its PaymentIntent) — purely housekeeping at this point, since
 *  pending orders no longer hold slot capacity either way (see below). */
export const PENDING_ORDER_TTL_MINUTES = 180;

/** Orders that should count against slot capacity: a slot is only taken
 *  once someone has actually paid — first come, first served is decided
 *  by who completes payment first, not by who started checking out first.
 *  A "pending" order (payment not yet confirmed) never holds a slot, no
 *  matter how fresh it is. */
export function activeOrderFilter(): SQL {
  return notInArray(orders.status, ['pending', 'cancelled', 'refunded']);
}
