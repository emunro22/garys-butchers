import { Suspense } from 'react';
import { catalogDb } from '@/lib/db';
import { products } from '@/lib/db/schema';
import { and, eq, or, ilike } from 'drizzle-orm';
import { ensureProductsSchema } from '@/lib/db/ensure-schema';
import { ProductCard } from '@/components/shop/product-card';
import { SearchBar } from '@/components/shop/search-bar';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Search — Gary’s Butchers & Fishmongers',
};

export const dynamic = 'force-dynamic';

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = (q ?? '').trim();

  let results: any[] = [];
  if (query) {
    try {
      await ensureProductsSchema();
      const term = `%${query}%`;
      results = await catalogDb
        .select()
        .from(products)
        .where(
          and(
            eq(products.isActive, true),
            or(ilike(products.name, term), ilike(products.description, term))
          )
        )
        .orderBy(products.name);
    } catch {
      // Database not yet migrated — fall back to empty state
    }
  }

  return (
    <div className="bg-cream-50">
      <section className="bg-ink-900 text-cream-50 py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <p className="eyebrow text-gold-400 mb-4">Search</p>
          <h1 className="font-display text-4xl md:text-6xl leading-[0.95] mb-8">
            {query ? (
              <>
                Results for <span className="italic text-gold-400">“{query}”</span>
              </>
            ) : (
              'Find something good.'
            )}
          </h1>
          <Suspense fallback={null}>
            <SearchBar variant="page" className="max-w-xl" />
          </Suspense>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 md:px-8 py-12 md:py-16">
        {!query ? (
          <p className="text-ink-500">Type something above to search our full range.</p>
        ) : results.length === 0 ? (
          <div className="py-10 text-center">
            <p className="font-display text-2xl text-ink-700">No matches for “{query}”.</p>
            <p className="text-ink-500 mt-2">Try a different word, or browse the shop instead.</p>
          </div>
        ) : (
          <>
            <p className="text-sm text-ink-500 mb-8">
              {results.length} {results.length === 1 ? 'result' : 'results'}
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-10">
              {results.map((p, i) => (
                <ProductCard key={p.id} product={p} index={i} />
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  );
}
