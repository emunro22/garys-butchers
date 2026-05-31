import { db } from '@/lib/db';
import { deals, products } from '@/lib/db/schema';
import { and, eq, or, isNull, gte, inArray } from 'drizzle-orm';
import { DealCard, type EnrichedDealItem } from '@/components/shop/deal-card';

export async function SeasonalDeals({ compact = false }: { compact?: boolean }) {
  let activeDeals: (typeof deals.$inferSelect)[] = [];
  try {
    const now = new Date();
    activeDeals = await db
      .select()
      .from(deals)
      .where(
        and(
          eq(deals.status, 'published'),
          or(isNull(deals.endsAt), gte(deals.endsAt, now)),
        ),
      );
  } catch {
    return null;
  }

  if (activeDeals.length === 0) return null;

  // Collect all product IDs referenced across all deals
  const allProductIds = [
    ...new Set(activeDeals.flatMap((d) => (d.dealItems ?? []).map((i) => i.productId))),
  ];

  // Fetch product details in one query
  const productMap = new Map<string, typeof products.$inferSelect>();
  if (allProductIds.length > 0) {
    try {
      const rows = await db
        .select()
        .from(products)
        .where(inArray(products.id, allProductIds));
      for (const p of rows) productMap.set(p.id, p);
    } catch {
      // non-fatal — deal cards will just have no items
    }
  }

  // Enrich each deal with full product data
  const enrichedDeals = activeDeals.map((deal) => {
    const enrichedItems: EnrichedDealItem[] = (deal.dealItems ?? []).flatMap((di) => {
      const prod = productMap.get(di.productId);
      if (!prod) return [];
      return [{
        productId: prod.id,
        quantity: di.quantity,
        name: prod.name,
        priceInPence: prod.priceInPence,
        imageUrl: prod.imageUrl ?? null,
        weightLabel: prod.weightLabel ?? null,
        slug: prod.slug,
      }];
    });
    return { ...deal, enrichedItems };
  });

  if (compact) {
    return (
      <div className="border-b border-gold-400/30 bg-ink-900/95">
        <div className="mx-auto max-w-7xl px-4 md:px-8 py-4 flex flex-wrap gap-4 items-center">
          <span className="text-[10px] uppercase tracking-[0.22em] text-gold-400 shrink-0">
            Seasonal deals
          </span>
          <div className="flex flex-wrap gap-3">
            {enrichedDeals.map((deal) => (
              <div key={deal.id} className="flex items-center gap-2">
                {deal.badgeText && (
                  <span className="text-[10px] tracking-[0.15em] uppercase bg-gold-400 text-ink-900 px-1.5 py-0.5 font-semibold">
                    {deal.badgeText}
                  </span>
                )}
                <span className="text-cream-50 text-sm font-medium">{deal.title}</span>
                {deal.enrichedItems.length > 0 && (
                  <span className="text-cream-200/50 text-xs hidden md:inline">
                    — {deal.enrichedItems.map((i) => `${i.quantity > 1 ? i.quantity + '× ' : ''}${i.name}`).join(', ')}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <section className="py-20 md:py-28 bg-ink-900 text-cream-50 relative overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold-400/40 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-gold-400/20 to-transparent" />

      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <div className="text-center mb-14 max-w-2xl mx-auto">
          <p className="eyebrow text-gold-400 mb-4">Limited time only</p>
          <h2 className="font-display text-4xl md:text-5xl lg:text-6xl leading-[1.0]">
            Seasonal{' '}
            <span className="font-display italic text-gold-400">deals.</span>
          </h2>
        </div>

        <div
          className={
            enrichedDeals.length === 1
              ? 'max-w-2xl mx-auto'
              : enrichedDeals.length === 2
              ? 'grid md:grid-cols-2 gap-6 max-w-4xl mx-auto'
              : 'grid md:grid-cols-2 lg:grid-cols-3 gap-6'
          }
        >
          {enrichedDeals.map((deal) => (
            <DealCard
              key={deal.id}
              id={deal.id}
              title={deal.title}
              description={deal.description ?? null}
              badgeText={deal.badgeText ?? null}
              imageUrl={deal.imageUrl ?? null}
              category={deal.category}
              endsAt={deal.endsAt ?? null}
              items={deal.enrichedItems}
              dealPrice={deal.dealPrice ?? null}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
