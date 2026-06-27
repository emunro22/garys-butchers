import { redirect } from 'next/navigation';
import { getCustomerSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { orders, products, users } from '@/lib/db/schema';
import { eq, desc, or, notInArray, and } from 'drizzle-orm';
import { sql } from 'drizzle-orm';
import { AccountDashboard } from '@/components/account/account-dashboard';

export const dynamic = 'force-dynamic';

export default async function AccountPage() {
  const session = await getCustomerSession();
  if (!session) redirect('/account/login');

  const [user] = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      phone: users.phone,
      defaultAddress: users.defaultAddress,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.id, session.userId))
    .limit(1);

  if (!user) redirect('/account/login');

  const userOrders = await db
    .select()
    .from(orders)
    .where(
      or(
        eq(orders.userId, session.userId),
        eq(orders.customerEmail, session.email)
      )
    )
    .orderBy(desc(orders.createdAt))
    .limit(20);

  // Build "you may like" recommendations based on categories the user hasn't ordered from
  const orderedProductIds = userOrders.flatMap((o) =>
    (o.items as Array<{ productId: string }>).map((i) => i.productId)
  );

  let recommendations: Array<{
    id: string;
    name: string;
    slug: string;
    priceInPence: number;
    imageUrl: string | null;
    badge: string | null;
  }> = [];

  if (orderedProductIds.length > 0) {
    recommendations = await db
      .select({
        id: products.id,
        name: products.name,
        slug: products.slug,
        priceInPence: products.priceInPence,
        imageUrl: products.imageUrl,
        badge: products.badge,
      })
      .from(products)
      .where(
        and(
          eq(products.isActive, true),
          notInArray(products.id, orderedProductIds)
        )
      )
      .orderBy(sql`random()`)
      .limit(4);
  } else {
    recommendations = await db
      .select({
        id: products.id,
        name: products.name,
        slug: products.slug,
        priceInPence: products.priceInPence,
        imageUrl: products.imageUrl,
        badge: products.badge,
      })
      .from(products)
      .where(eq(products.isFeatured, true))
      .limit(4);
  }

  return (
    <AccountDashboard
      user={{
        ...user,
        createdAt: user.createdAt.toISOString(),
      }}
      orders={userOrders.map((o) => ({
        ...o,
        createdAt: o.createdAt.toISOString(),
        updatedAt: o.updatedAt.toISOString(),
        pickupSlot: o.pickupSlot?.toISOString() ?? null,
        deliverySlot: o.deliverySlot?.toISOString() ?? null,
      }))}
      recommendations={recommendations}
    />
  );
}
