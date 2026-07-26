import { and, gte, ne, notInArray, or, type SQL } from 'drizzle-orm';
import { orders } from '@/lib/db/schema';

/** How long a checkout can sit unpaid before it's treated as abandoned.
 *
 *  This was originally 20 minutes, which turned out to be far too
 *  aggressive: real customers routinely take longer than that to finish
 *  entering payment details (stepping away, writing delivery notes,
 *  distractions), and the cleanup cron was cancelling their PaymentIntent
 *  out from under them mid-checkout — confirmed against live Stripe data
 *  (amount_received: 0, no payment attempt) for several genuine customers
 *  whose orders were wrongly cancelled ~20-30 minutes after they started. */
export const PENDING_ORDER_TTL_MINUTES = 180;

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
