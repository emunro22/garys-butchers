import Link from 'next/link';
import Image from 'next/image';
import { Suspense } from 'react';
import { db } from '@/lib/db';
import { products } from '@/lib/db/schema';
import { and, eq, asc, desc, ilike } from 'drizzle-orm';
import { formatPrice } from '@/lib/utils';
import { noticeLabel } from '@/lib/notice';
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
  } catch {
    // empty fallback
  }

  return (
    <div>
      {/* Header */}
      <section className="bg-ink-900 text-cream-50 py-20 md:py-28 relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              'repeating-linear-gradient(45deg, transparent, transparent 12px, rgba(201,169,97,0.5) 12px, rgba(201,169,97,0.5) 13px)',
          }}
        />
        <div className="relative mx-auto max-w-7xl px-4 md:px-8">
          <p className="eyebrow text-gold-400 mb-4">Family value packs</p>
          <h1 className="font-display text-5xl md:text-7xl leading-[0.95] max-w-3xl">
            Meat packs
            <span className="font-display italic text-gold-400"> made to feed.</span>
          </h1>
          <p className="mt-6 max-w-xl text-cream-200/80 leading-relaxed">
            From quick weekday breakfasts to a full week&apos;s shop — eleven hand-built packs,
            cut fresh and bagged the day you collect. Free home delivery within 5 miles.
          </p>
        </div>
      </section>

      {/* Grid */}
      <section className="bg-cream-50 py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <div className="flex flex-wrap items-center justify-end gap-4 mb-10">
            <Suspense fallback={null}>
              <SearchBar variant="inline" placeholder="Search packs…" className="w-52" />
            </Suspense>
            {packs.length > 0 && (
              <Suspense fallback={null}>
                <ProductSort />
              </Suspense>
            )}
          </div>

          {packs.length === 0 ? (
            <div className="py-20 text-center">
              {query ? (
                <>
                  <p className="font-display text-2xl text-ink-700">No matches for “{query}”.</p>
                  <p className="text-ink-500 mt-2">Try a different word, or clear the search.</p>
                  <Link
                    href="/meat-packs"
                    className="inline-block mt-6 text-sm uppercase tracking-[0.2em] text-ink-900 underline underline-offset-4"
                  >
                    Clear search
                  </Link>
                </>
              ) : (
                <p className="text-ink-500">Packs are being prepared. Please check back shortly.</p>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {packs.map((pack) => {
                const contents = (pack.packContents as string[]) ?? [];
                return (
                  <Link
                    key={pack.id}
                    href={`/meat-packs/${pack.slug}`}
                    className="group bg-cream-100 border border-ink-900/10 hover:border-gold-500 transition-colors flex flex-col overflow-hidden"
                  >
                    {/* Image */}
                    {pack.imageUrl && (
                      <div className="relative aspect-[16/9] bg-ink-900/5 overflow-hidden">
                        <Image
                          src={pack.imageUrl}
                          alt={pack.name}
                          fill
                          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      </div>
                    )}

                    {/* Plate header */}
                    <div className="bg-ink-900 text-cream-50 p-6 md:p-8 relative">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="eyebrow text-gold-400 mb-2">Pack</p>
                          <h3 className="font-display text-2xl md:text-3xl leading-tight">
                            {pack.name}
                          </h3>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="font-display text-3xl text-gold-400 tabular">
                            {formatPrice(pack.priceInPence)}
                          </p>
                        </div>
                      </div>
                      <div className="mt-6 h-px bg-gold-400/30" />
                      <div className="mt-3 flex items-center justify-between gap-3">
                        <p className="text-xs uppercase tracking-[0.22em] text-cream-200/60">
                          {contents.length} items
                        </p>
                        <p
                          className={`text-xs font-medium ${
                            pack.noticeDays > 0 ? 'text-gold-400' : 'text-green-400'
                          }`}
                        >
                          {noticeLabel(pack.noticeDays)}
                        </p>
                      </div>
                    </div>

                    {/* Contents */}
                    <div className="p-6 md:p-8 flex-1 flex flex-col">
                      <ul className="space-y-1.5 text-sm text-ink-700">
                        {contents.slice(0, 6).map((line, i) => (
                          <li key={i} className="flex items-baseline gap-2">
                            <span className="text-gold-500">•</span>
                            <span>{line}</span>
                          </li>
                        ))}
                        {contents.length > 6 && (
                          <li className="text-ink-500 italic pt-1">
                            ...plus {contents.length - 6} more
                          </li>
                        )}
                      </ul>
                      <span className="mt-auto pt-6 text-xs uppercase tracking-[0.22em] text-ink-900 group-hover:text-gold-600 transition-colors inline-flex items-center gap-2">
                        View pack
                        <span aria-hidden className="transition-transform group-hover:translate-x-1">→</span>
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
