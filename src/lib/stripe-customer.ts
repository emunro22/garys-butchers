import { eq } from 'drizzle-orm';
import { ordersDb } from '@/lib/db';
import { users } from '@/lib/db/schema-orders';
import { stripe } from '@/lib/stripe';

// Lazily creates (or reuses) the Stripe Customer backing a registered
// customer's account — shared by checkout (saved cards) and subscriptions
// (recurring billing), both of which need the same users.stripeCustomerId.
export async function getOrCreateStripeCustomerId(userId: string): Promise<string | null> {
  const [user] = await ordersDb
    .select({ id: users.id, email: users.email, name: users.name, stripeCustomerId: users.stripeCustomerId })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  if (!user) return null;
  if (user.stripeCustomerId) return user.stripeCustomerId;

  const stripeCustomer = await stripe.customers.create({ email: user.email, name: user.name });
  await ordersDb.update(users).set({ stripeCustomerId: stripeCustomer.id }).where(eq(users.id, user.id));
  return stripeCustomer.id;
}
