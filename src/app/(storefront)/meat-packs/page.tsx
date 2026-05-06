import Link from 'next/link';
import { db } from '@/lib/db';
import { products } from '@/lib/db/schema';
import { and, eq, asc } from 'drizzle-orm';
import { formatPrice } from '@/lib/utils';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Meat packs — Gary’s Butchers & Fishmongers',
  description:
    'Curated value packs that feed the family for less. Free home delivery on orders over £25.',
};

export const revalidate = 60;

export default async function MeatPacksPage() {
  let packs: any[] = [];
  try {
    packs = await db
      .select()
      .from(products)
      .where(and(eq(products.isPack, true), eq(products.isActive, true)))
      .orderBy(asc(products.priceInPence));
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
            cut fresh and bagged the day you collect. Free home delivery over £25.
          </p>
        </div>
      </section>

      {/* Grid */}
      <section className="bg-cream-50 py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          {packs.length === 0 ? (
            <p className="text-ink-500 text-center py-20">
              Packs are being prepared. Please check back shortly.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {packs.map((pack) => {
                const contents = (pack.packContents as string[]) ?? [];
                return (
                  <Link
                    key={pack.id}
                    href={`/meat-packs/${pack.slug}`}
                    className="group bg-cream-100 border border-ink-900/10 hover:border-gold-500 transition-colors flex flex-col"
                  >
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
                      <p className="mt-3 text-xs uppercase tracking-[0.22em] text-cream-200/60">
                        {contents.length} items
                      </p>
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
