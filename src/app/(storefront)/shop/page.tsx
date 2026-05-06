import Link from 'next/link';
import { db } from '@/lib/db';
import { categories, products } from '@/lib/db/schema';
import { eq, asc, desc } from 'drizzle-orm';
import { ProductCard } from '@/components/shop/product-card';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Shop all — Gary’s Butchers & Fishmongers',
  description:
    'Browse the full Gary’s Butchers & Fishmongers range — beef, pork, chicken, fish, sausages, pies and meat packs.',
};

export const revalidate = 60;

export default async function ShopPage() {
  let cats: Awaited<ReturnType<typeof db.select>> extends never ? never : any[] = [];
  let bestsellers: any[] = [];
  try {
    cats = await db
      .select()
      .from(categories)
      .where(eq(categories.isActive, true))
      .orderBy(asc(categories.sortOrder));
    bestsellers = await db
      .select()
      .from(products)
      .where(eq(products.isFeatured, true))
      .orderBy(desc(products.createdAt))
      .limit(8);
  } catch {
    // Database not yet migrated — fall back to empty state
  }

  return (
    <div className="bg-cream-50">
      {/* Header */}
      <section className="bg-ink-900 text-cream-50 py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <p className="eyebrow text-gold-400 mb-4">The shop</p>
          <h1 className="font-display text-5xl md:text-7xl leading-[0.95]">
            Shop all
            <span className="font-display italic text-gold-400"> cuts.</span>
          </h1>
          <p className="mt-6 max-w-xl text-cream-200/80 leading-relaxed">
            Hand-cut, hand-prepared and ready when you are. Browse by category or jump
            straight to our value packs.
          </p>
        </div>
      </section>

      {/* Categories */}
      <section className="mx-auto max-w-7xl px-4 md:px-8 py-16 md:py-20">
        <div className="flex items-baseline justify-between mb-8">
          <h2 className="font-display text-3xl md:text-4xl text-ink-900">By category</h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {cats.map((c) => (
            <Link
              key={c.id}
              href={`/shop/${c.slug}`}
              className="group block aspect-[4/5] relative overflow-hidden bg-ink-900 text-cream-50"
            >
              <div className="absolute inset-0 bg-gradient-to-b from-ink-900/30 via-ink-900/20 to-ink-900/85" />
              <div className="absolute inset-0 flex flex-col justify-end p-5 md:p-6">
                <p className="eyebrow text-gold-400 mb-1">{String(c.sortOrder).padStart(2, '0')}</p>
                <h3 className="font-display text-2xl md:text-3xl">{c.name}</h3>
                <p className="text-xs text-cream-200/70 mt-2 line-clamp-2">
                  {c.description}
                </p>
                <span className="mt-4 inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-gold-400 group-hover:gap-3 transition-all">
                  Shop {c.name.toLowerCase()}
                  <span aria-hidden>→</span>
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Bestsellers */}
      {bestsellers.length > 0 && (
        <section className="border-t border-ink-900/10">
          <div className="mx-auto max-w-7xl px-4 md:px-8 py-16 md:py-20">
            <div className="flex items-baseline justify-between mb-8">
              <div>
                <p className="eyebrow text-ink-500 mb-2">Customer favourites</p>
                <h2 className="font-display text-3xl md:text-4xl text-ink-900">Bestsellers</h2>
              </div>
              <Link
                href="/meat-packs"
                className="hidden md:inline-flex items-center gap-2 text-sm uppercase tracking-[0.2em] text-ink-700 hover:text-ink-900"
              >
                Meat packs
                <span aria-hidden>→</span>
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-10">
              {bestsellers.map((p, i) => (
                <ProductCard key={p.id} product={p} index={i} />
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
