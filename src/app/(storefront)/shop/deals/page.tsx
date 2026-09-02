import Link from 'next/link';
import { catalogDb } from '@/lib/db';
import { deals } from '@/lib/db/schema';
import { and, eq, or, isNull, gte } from 'drizzle-orm';
import { ensureProductsSchema } from '@/lib/db/ensure-schema';
import { SeasonalDeals } from '@/components/home/seasonal-deals';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Seasonal Deals — Gary's Butchers & Fishmongers",
  description: 'Limited-time bundle pricing on our best seasonal combos at Gary’s Butchers & Fishmongers.',
  alternates: { canonical: '/shop/deals' },
};

export const revalidate = 60;

export default async function DealsPage() {
  let hasActiveDeals = false;
  try {
    await ensureProductsSchema();
    const now = new Date();
    const activeDeals = await catalogDb
      .select({ id: deals.id })
      .from(deals)
      .where(and(eq(deals.status, 'published'), or(isNull(deals.endsAt), gte(deals.endsAt, now))))
      .limit(1);
    hasActiveDeals = activeDeals.length > 0;
  } catch {
    hasActiveDeals = false;
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
            <span className="text-gold-400">Seasonal Deals</span>
          </nav>
          <h1 className="font-display text-5xl md:text-7xl leading-[0.95]">
            Seasonal <span className="font-display italic text-gold-400">deals.</span>
          </h1>
          <p className="mt-6 max-w-xl text-cream-200/80 leading-relaxed">
            Bundle pricing on our best combos — for a limited time only.
          </p>
        </div>
      </section>

      {hasActiveDeals ? (
        <SeasonalDeals />
      ) : (
        <section className="py-20 text-center">
          <p className="font-display text-2xl text-ink-700">No deals running right now.</p>
          <p className="text-ink-500 mt-2">Check back soon, or browse the full shop below.</p>
          <Link
            href="/shop"
            className="inline-block mt-6 text-sm uppercase tracking-[0.2em] text-ink-900 underline underline-offset-4"
          >
            Back to shop
          </Link>
        </section>
      )}
    </div>
  );
}
