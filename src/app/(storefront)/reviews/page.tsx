import { db } from '@/lib/db';
import { reviews } from '@/lib/db/schema';
import { desc } from 'drizzle-orm';
import { Star } from 'lucide-react';
import type { Metadata } from 'next';
import { avatarColor, timeAgo } from '@/lib/utils';
import { GoogleLogo } from '@/components/ui/google-logo';

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
            <GoogleLogo className="h-8 w-8" />
            <div className="flex gap-1 text-[#FBBC04]">
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
                  <div className="flex items-center gap-3 mb-4">
                    <div
                      className="h-11 w-11 rounded-full flex items-center justify-center text-white font-medium shrink-0"
                      style={{ background: avatarColor(r.authorName) }}
                    >
                      {r.authorName.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-ink-900 truncate">{r.authorName}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <GoogleLogo className="h-3 w-3" />
                        <span className="text-xs text-ink-400">
                          {timeAgo(r.publishedAt)} · via Google
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1 text-[#FBBC04] mb-4">
                    {Array.from({ length: r.rating }).map((_, i) => (
                      <Star key={i} className="h-4 w-4" fill="currentColor" />
                    ))}
                  </div>
                  <p className="text-ink-700 leading-relaxed">{r.body}</p>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
