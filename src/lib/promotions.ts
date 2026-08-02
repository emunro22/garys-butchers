import { db } from '@/lib/db';
import { orders } from '@/lib/db/schema';
import { and, eq, ne, sql } from 'drizzle-orm';

/** True if this email already has a completed (non-pending) order that redeemed this
 *  promo code — used to enforce the admin-configurable one-redemption-per-customer rule. */
export async function hasCustomerUsedPromotion(email: string, code: string): Promise<boolean> {
  const [existing] = await db
    .select({ id: orders.id })
    .from(orders)
    .where(
      and(
        sql`lower(${orders.customerEmail}) = ${email.toLowerCase()}`,
        eq(orders.promotionCode, code.toUpperCase()),
        ne(orders.status, 'pending')
      )
    )
    .limit(1);
  return !!existing;
}
