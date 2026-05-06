import { db } from '@/lib/db';
import { reviews } from '@/lib/db/schema';
import { desc } from 'drizzle-orm';
import { Quote, Star } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Reviews — Gary’s Butchers & Fishmongers',
  description:
    'See what customers in Erskine and beyond say about Gary’s Butchers & Fishmongers.',
};

export const revalidate = 300;

export default async function ReviewsPage() {
  let allReviews: any[] = [];
  try {
    allReviews = await db.select().from(reviews).orderBy(desc(reviews.publishedAt));
  } catch {
    // empty fallback
  }

  const avg =
    allReviews.length === 0
      ? 5
      : allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;

  return (
    <div>
      <section className="bg-ink-900 text-cream-50 py-20 md:py-24">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <p className="eyebrow text-gold-400 mb-4">Customer reviews</p>
          <h1 className="font-display text-5xl md:text-7xl leading-[0.95]">
            What folks are
            <span className="font-display italic text-gold-400"> saying.</span>
          </h1>
          <div className="mt-8 flex items-center gap-4">
            <div className="flex gap-1 text-gold-400">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="h-5 w-5" fill="currentColor" />
              ))}
            </div>
            <p className="text-cream-200/80 text-sm">
              <span className="font-display text-2xl text-cream-50 mr-2">
                {avg.toFixed(1)}
              </span>
              average · based on {allReviews.length || 7} Google reviews
            </p>
          </div>
        </div>
      </section>

      <section className="bg-cream-50 py-16 md:py-20">
        <div className="mx-auto max-w-6xl px-4 md:px-8">
          {allReviews.length === 0 ? (
            <p className="text-center text-ink-500">Reviews loading…</p>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {allReviews.map((r) => (
                <article
                  key={r.id}
                  className="bg-cream-100 border border-ink-900/10 p-6 md:p-8 relative"
                >
                  <Quote className="absolute top-6 right-6 h-8 w-8 text-gold-400/40" />
                  <div className="flex gap-1 text-gold-500 mb-4">
                    {Array.from({ length: r.rating }).map((_, i) => (
                      <Star key={i} className="h-4 w-4" fill="currentColor" />
                    ))}
                  </div>
                  <p className="font-display text-xl text-ink-900 leading-snug">
                    &ldquo;{r.body}&rdquo;
                  </p>
                  <div className="mt-6 pt-4 border-t border-ink-900/10 flex items-center justify-between">
                    <p className="text-sm font-medium text-ink-900">{r.authorName}</p>
                    <p className="text-xs uppercase tracking-[0.2em] text-ink-500">
                      via {r.source ?? 'Google'}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
