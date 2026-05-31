import { db } from '@/lib/db';
import { deals } from '@/lib/db/schema';
import { and, eq, or, isNull, gte } from 'drizzle-orm';

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

  if (compact) {
    return (
      <div className="border-b border-gold-400/30 bg-ink-900/95">
        <div className="mx-auto max-w-7xl px-4 md:px-8 py-4 flex flex-wrap gap-4 items-center">
          <span className="text-[10px] uppercase tracking-[0.22em] text-gold-400 shrink-0">
            Seasonal deals
          </span>
          <div className="flex flex-wrap gap-3">
            {activeDeals.map((deal) => (
              <div key={deal.id} className="flex items-center gap-2">
                {deal.badgeText && (
                  <span className="text-[10px] tracking-[0.15em] uppercase bg-gold-400 text-ink-900 px-1.5 py-0.5 font-semibold">
                    {deal.badgeText}
                  </span>
                )}
                <span className="text-cream-50 text-sm font-medium">{deal.title}</span>
                {deal.description && (
                  <span className="text-cream-200/60 text-xs hidden md:inline">
                    — {deal.description.slice(0, 80)}{deal.description.length > 80 ? '…' : ''}
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
            activeDeals.length === 1
              ? 'max-w-2xl mx-auto'
              : activeDeals.length === 2
              ? 'grid md:grid-cols-2 gap-6 max-w-4xl mx-auto'
              : 'grid md:grid-cols-2 lg:grid-cols-3 gap-6'
          }
        >
          {activeDeals.map((deal) => (
            <article
              key={deal.id}
              className="relative overflow-hidden border border-gold-400/20 group"
            >
              {deal.imageUrl ? (
                <div className="absolute inset-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={deal.imageUrl}
                    alt=""
                    className="w-full h-full object-cover opacity-25 group-hover:opacity-30 transition-opacity duration-500 scale-105 group-hover:scale-100"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-ink-900/95 via-ink-900/70 to-ink-900/40" />
                </div>
              ) : (
                <div className="absolute inset-0 bg-ink-900/60" />
              )}

              <div className="relative z-10 p-8 md:p-10 flex flex-col min-h-[260px]">
                {deal.badgeText && (
                  <span className="inline-block self-start mb-4 text-[10px] tracking-[0.18em] uppercase bg-gold-400 text-ink-900 px-2 py-0.5 font-semibold">
                    {deal.badgeText}
                  </span>
                )}

                <div className="mt-auto">
                  <p className="eyebrow text-gold-400/70 mb-2">
                    {deal.category === 'christmas'
                      ? 'Christmas Special'
                      : deal.category === 'easter'
                      ? 'Easter Special'
                      : deal.category === 'summer-bbq'
                      ? 'Summer BBQ'
                      : 'Special Offer'}
                  </p>

                  <h3 className="font-display text-3xl md:text-4xl leading-tight mb-4">
                    {deal.title}
                  </h3>

                  {deal.description && (
                    <p className="text-cream-200/80 text-sm leading-relaxed">
                      {deal.description}
                    </p>
                  )}

                  {deal.endsAt && (
                    <p className="mt-5 text-[11px] uppercase tracking-[0.18em] text-gold-400 flex items-center gap-2">
                      <span className="inline-block w-4 h-px bg-gold-400/60" />
                      Ends{' '}
                      {new Date(deal.endsAt).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </p>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
