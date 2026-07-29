import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { users, orders } from '@/lib/db/schema';
import { ensureOrdersSchema, ensureUsersSchema } from '@/lib/db/ensure-schema';
import { and, eq, desc, ne, or } from 'drizzle-orm';
import { CustomerProfile } from '@/components/admin/customer-profile';

export const dynamic = 'force-dynamic';

export default async function AdminCustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await ensureUsersSchema();
  await ensureOrdersSchema();

  const { id } = await params;

  // Guest customer ids are base64url-encoded emails, not UUIDs — querying the
  // uuid `users.id` column with one throws a Postgres "invalid input syntax
  // for type uuid" error, so only look up registered users when `id` is
  // actually shaped like a UUID.
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

  // Try to find as a registered user first
  const [user] = isUuid
    ? await db
        .select()
        .from(users)
        .where(eq(users.id, id))
        .limit(1)
    : [];

  if (user) {
    // 'pending' orders never completed payment — not real order history.
    const customerOrders = await db
      .select()
      .from(orders)
      .where(
        and(
          or(
            eq(orders.userId, user.id),
            eq(orders.customerEmail, user.email)
          ),
          ne(orders.status, 'pending')
        )
      )
      .orderBy(desc(orders.createdAt));

    const totalSpent = customerOrders
      .filter((o) => ['paid', 'preparing', 'ready', 'completed'].includes(o.status))
      .reduce((sum, o) => sum + o.totalInPence, 0);

    return (
      <CustomerProfile
        customer={{
          id: user.id,
          type: 'registered',
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          emailVerified: user.emailVerified,
          premiumDeliveryEligible: user.premiumDeliveryEligible,
          defaultAddress: user.defaultAddress,
          createdAt: user.createdAt.toISOString(),
          totalSpentInPence: totalSpent,
          orderCount: customerOrders.filter((o) =>
            ['paid', 'preparing', 'ready', 'completed'].includes(o.status)
          ).length,
        }}
        orders={customerOrders.map((o) => ({
          ...o,
          createdAt: o.createdAt.toISOString(),
          updatedAt: o.updatedAt.toISOString(),
          pickupSlot: o.pickupSlot?.toISOString() ?? null,
          deliverySlot: o.deliverySlot?.toISOString() ?? null,
        }))}
      />
    );
  }

  // Fall back to guest customer (looked up by email encoded as base64 in the id)
  let email: string;
  try {
    email = Buffer.from(id, 'base64url').toString('utf-8');
  } catch {
    notFound();
  }

  const customerOrders = await db
    .select()
    .from(orders)
    .where(and(eq(orders.customerEmail, email), ne(orders.status, 'pending')))
    .orderBy(desc(orders.createdAt));

  if (customerOrders.length === 0) notFound();

  const paidOrders = customerOrders.filter((o) =>
    ['paid', 'preparing', 'ready', 'completed'].includes(o.status)
  );

  const latestOrder = customerOrders[0];

  return (
    <CustomerProfile
      customer={{
        id,
        type: 'guest',
        name: latestOrder.customerName,
        email: latestOrder.customerEmail,
        phone: latestOrder.customerPhone,
        role: null,
        emailVerified: null,
        premiumDeliveryEligible: false,
        defaultAddress: latestOrder.deliveryAddress,
        createdAt: customerOrders[customerOrders.length - 1].createdAt.toISOString(),
        totalSpentInPence: paidOrders.reduce((s, o) => s + o.totalInPence, 0),
        orderCount: paidOrders.length,
      }}
      orders={customerOrders.map((o) => ({
        ...o,
        createdAt: o.createdAt.toISOString(),
        updatedAt: o.updatedAt.toISOString(),
        pickupSlot: o.pickupSlot?.toISOString() ?? null,
        deliverySlot: o.deliverySlot?.toISOString() ?? null,
      }))}
    />
  );
}
