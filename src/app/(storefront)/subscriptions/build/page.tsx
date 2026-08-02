import { db } from '@/lib/db';
import { products } from '@/lib/db/schema';
import { ensureProductsSchema } from '@/lib/db/ensure-schema';
import { and, eq, asc } from 'drizzle-orm';
import { getShopSettings } from '@/lib/settings';
import { SubscriptionBuilder } from '@/components/shop/subscription-builder';

export const dynamic = 'force-dynamic';

export default async function BuildSubscriptionPage() {
  await ensureProductsSchema();

  const eligibleProducts = await db
    .select({
      id: products.id,
      name: products.name,
      slug: products.slug,
      priceInPence: products.priceInPence,
      imageUrl: products.imageUrl,
      weightLabel: products.weightLabel,
    })
    .from(products)
    .where(and(eq(products.isActive, true), eq(products.isSubscribable, true)))
    .orderBy(asc(products.name));

  const { deliverySlots, pickupSlots } = await getShopSettings();

  return (
    <div className="bg-cream-50">
      <section className="border-b border-ink-900/10 py-10 md:py-14">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <p className="eyebrow text-ink-500 mb-3">Subscriptions</p>
          <h1 className="font-display text-4xl md:text-5xl text-ink-900">Build your subscription</h1>
          <p className="text-sm text-ink-500 mt-2 max-w-2xl">
            Pick your regulars, choose pickup or delivery, and we&apos;ll charge your card
            automatically every month and get it ready around your preferred day — no need to
            reorder each time.
          </p>
        </div>
      </section>

      <section className="py-10 md:py-14">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <SubscriptionBuilder
            products={eligibleProducts}
            deliveryBlocks={deliverySlots.blocks}
            pickupBlocks={pickupSlots.blocks}
          />
        </div>
      </section>
    </div>
  );
}
