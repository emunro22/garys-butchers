import Link from 'next/link';
import { db } from '@/lib/db';
import { products } from '@/lib/db/schema';
import { eq, asc } from 'drizzle-orm';
import { ensureProductsSchema } from '@/lib/db/ensure-schema';
import { ProductCard } from '@/components/shop/product-card';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Offers — Gary’s Butchers & Fishmongers',
  description: 'Everything currently discounted, hand-cut fresh as always.',
};

export const revalidate = 60;

type VariantLite = { priceInPence: number; compareAtPriceInPence?: number };

function isOnSale(p: {
  priceInPence: number;
  compareAtPriceInPence: number | null;
  variants: unknown;
}): boolean {
  if (p.compareAtPriceInPence && p.compareAtPriceInPence > p.priceInPence) return true;
  const variants = (p.variants as VariantLite[] | null) ?? [];
  return variants.some((v) => v.compareAtPriceInPence && v.compareAtPriceInPence > v.priceInPence);
}

export default async function OffersPage() {
  let items: any[] = [];

  try {
    await ensureProductsSchema();
    const all = await db
      .select()
      .from(products)
      .where(eq(products.isActive, true))
      .orderBy(asc(products.name));
    items = all.filter(isOnSale);
  } catch {
    // empty fallback
  }

  return (
    <div className="bg-cream-50">
      <section className="bg-ink-900 text-cream-50 py-20 md:py-24">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <nav className="text-xs uppercase tracking-[0.22em] text-cream-200/60 mb-6">
            <Link href="/shop" className="hover:text-gold-400">
              Shop
            </Link>
            <span className="mx-3">/</span>
            <span className="text-gold-400">Offers</span>
          </nav>
          <h1 className="font-display text-5xl md:text-7xl leading-[0.95]">Offers</h1>
          <p className="mt-6 max-w-2xl text-cream-200/80 leading-relaxed">
            Today&apos;s discounts, cut fresh as always — while stocks last.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 md:px-8 py-12 md:py-16">
        {items.length === 0 ? (
          <div className="py-20 text-center">
            <p className="font-display text-2xl text-ink-700">No offers right now.</p>
            <p className="text-ink-500 mt-2">Check back soon, or browse the full shop.</p>
            <Link
              href="/shop"
              className="inline-block mt-6 text-sm uppercase tracking-[0.2em] text-ink-900 underline underline-offset-4"
            >
              Back to shop
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-10">
            {items.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
