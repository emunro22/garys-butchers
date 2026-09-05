import Link from 'next/link';
import Image from 'next/image';
import { Sparkles } from 'lucide-react';
import { catalogDb } from '@/lib/db';
import { categories, products } from '@/lib/db/schema';
import { eq, asc, desc, and } from 'drizzle-orm';
import { ensureProductsSchema } from '@/lib/db/ensure-schema';
import { getCategoryImageMap } from '@/lib/db/category-images';
import { ProductCard } from '@/components/shop/product-card';
import { RecommendedForYou } from '@/components/shop/recommended-for-you';
import { SeasonalCardDecoration } from '@/components/seasonal/seasonal-card-decoration';
import { SeasonalCardFrame } from '@/components/seasonal/seasonal-card-frame';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Shop all | Gary’s Butchers & Fishmongers',
  description:
    'Browse the full Gary’s Butchers & Fishmongers range: beef, pork, chicken, fish, sausages, pies and meat packs.',
  alternates: { canonical: '/shop' },
};

export const revalidate = 60;

export default async function ShopPage() {
  let cats: Awaited<ReturnType<typeof catalogDb.select>> extends never ? never : any[] = [];
  let bestsellers: any[] = [];
  try {
    await ensureProductsSchema();
    const [catsRes, categoryImages] = await Promise.all([
      catalogDb
        .select()
        .from(categories)
        .where(eq(categories.isActive, true))
        .orderBy(asc(categories.sortOrder)),
      getCategoryImageMap(),
    ]);
    cats = catsRes.map((c) => ({ ...c, imageUrl: c.imageUrl ?? categoryImages[c.id] ?? null }));
    bestsellers = await catalogDb
      .select()
      .from(products)
      .where(and(eq(products.isFeatured, true), eq(products.isActive, true)))
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
          <Link
            href="/shop/deals"
            className="group relative aspect-[4/5] overflow-hidden bg-ink-900 border border-gold-400/50 shadow-[0_0_30px_-8px_rgba(201,169,97,0.5)] transition-shadow duration-500 hover:shadow-[0_0_40px_-6px_rgba(201,169,97,0.75)]"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-gold-400/20 via-ink-900 to-ink-900" />
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold-400 to-transparent" />
            <div className="absolute inset-0 flex flex-col justify-end p-5 md:p-6">
              <Sparkles className="h-5 w-5 text-gold-400 mb-3" />
              <span className="text-[10px] uppercase tracking-[0.2em] text-gold-400 mb-1">
                Limited time
              </span>
              <h3 className="font-display text-2xl md:text-3xl text-cream-50">Seasonal Deals</h3>
              <p className="text-xs text-cream-200/70 mt-2 line-clamp-2">
                Bundle pricing on our best seasonal combos.
              </p>
              <span className="mt-4 inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-gold-400 group-hover:gap-3 transition-all">
                Shop deals
                <span aria-hidden>→</span>
              </span>
            </div>
          </Link>
          {cats.map((c) => (
            <div key={c.id} className="relative group">
              <SeasonalCardDecoration />
              <Link
                href={`/shop/${c.slug}`}
                className="block aspect-[4/5] relative overflow-hidden bg-ink-900 text-cream-50"
              >
                {c.imageUrl && (
                  <Image
                    src={c.imageUrl}
                    alt={c.name}
                    fill
                    sizes="(max-width: 768px) 50vw, 25vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-b from-ink-900/30 via-ink-900/20 to-ink-900/85" />
                <div className="absolute inset-0 flex flex-col justify-end p-5 md:p-6">
                  <h3 className="font-display text-2xl md:text-3xl">{c.name}</h3>
                  <p className="text-xs text-cream-200/70 mt-2 line-clamp-2">
                    {c.description}
                  </p>
                  <span className="mt-4 inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-gold-400 group-hover:gap-3 transition-all">
                    Shop {c.name.toLowerCase()}
                    <span aria-hidden>→</span>
                  </span>
                </div>
                <SeasonalCardFrame />
              </Link>
            </div>
          ))}
        </div>
      </section>

      <RecommendedForYou />

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
                href="/shop/meat-packs"
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
