import Link from 'next/link';
import { Suspense } from 'react';
import { db } from '@/lib/db';
import { categories, products } from '@/lib/db/schema';
import { and, eq, asc, desc, ilike } from 'drizzle-orm';
import { ProductCard } from '@/components/shop/product-card';
import { ProductSort } from '@/components/shop/product-sort';
import { SearchBar } from '@/components/shop/search-bar';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Meat packs — Gary’s Butchers & Fishmongers',
  description:
    'Curated value packs that feed the family for less. Free home delivery within 5 miles.',
};

export const revalidate = 60;

function sortOrderBy(sort: string | undefined) {
  switch (sort) {
    case 'price-asc':
      return [asc(products.priceInPence)];
    case 'price-desc':
      return [desc(products.priceInPence)];
    case 'name':
      return [asc(products.name)];
    case 'bestseller':
    default:
      return [desc(products.isFeatured), asc(products.priceInPence)];
  }
}

export default async function MeatPacksPage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string; q?: string }>;
}) {
  const { sort, q } = await searchParams;
  const query = (q ?? '').trim();

  let packs: any[] = [];
  let allCats: any[] = [];

  try {
    packs = await db
      .select()
      .from(products)
      .where(
        and(
          eq(products.isPack, true),
          eq(products.isActive, true),
          query ? ilike(products.name, `%${query}%`) : undefined
        )
      )
      .orderBy(...sortOrderBy(sort));
    allCats = await db
      .select()
      .from(categories)
      .where(eq(categories.isActive, true))
      .orderBy(asc(categories.sortOrder));
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
            <span className="text-gold-400">Meat packs</span>
          </nav>
          <h1 className="font-display text-5xl md:text-7xl leading-[0.95]">Meat packs</h1>
          <p className="mt-6 max-w-2xl text-cream-200/80 leading-relaxed">
            From quick weekday breakfasts to a full week&apos;s shop — hand-built packs, cut
            fresh and bagged the day you collect. Free home delivery within 5 miles.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 md:px-8 py-12 md:py-16">
        {/* Category pills + search + sort */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-10">
          <div className="flex flex-wrap gap-2">
            <Link
              href="/shop"
              className="px-4 py-2 text-xs uppercase tracking-[0.18em] border border-ink-900/15 hover:border-ink-900 transition-colors"
            >
              All
            </Link>
            {allCats.map((c) => (
              <Link
                key={c.id}
                href={`/shop/${c.slug}`}
                className={`px-4 py-2 text-xs uppercase tracking-[0.18em] border transition-colors ${
                  c.slug === 'meat-packs'
                    ? 'bg-ink-900 text-cream-50 border-ink-900'
                    : 'border-ink-900/15 hover:border-ink-900'
                }`}
              >
                {c.name}
              </Link>
            ))}
          </div>
          <div className="flex items-center gap-4">
            <Suspense fallback={null}>
              <SearchBar variant="inline" placeholder="Search packs…" className="w-52" />
            </Suspense>
            {packs.length > 0 && (
              <Suspense fallback={null}>
                <ProductSort />
              </Suspense>
            )}
          </div>
        </div>

        {packs.length === 0 ? (
          <div className="py-20 text-center">
            {query ? (
              <>
                <p className="font-display text-2xl text-ink-700">No matches for “{query}”.</p>
                <p className="text-ink-500 mt-2">Try a different word, or clear the search.</p>
                <Link
                  href="/shop/meat-packs"
                  className="inline-block mt-6 text-sm uppercase tracking-[0.2em] text-ink-900 underline underline-offset-4"
                >
                  Clear search
                </Link>
              </>
            ) : (
              <>
                <p className="font-display text-2xl text-ink-700">Nothing here yet.</p>
                <p className="text-ink-500 mt-2">
                  We&apos;re still building packs — check back soon.
                </p>
                <Link
                  href="/shop"
                  className="inline-block mt-6 text-sm uppercase tracking-[0.2em] text-ink-900 underline underline-offset-4"
                >
                  Back to shop
                </Link>
              </>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-10">
            {packs.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
