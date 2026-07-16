'use client';

import { motion } from 'framer-motion';
import { Star } from 'lucide-react';
import type { Review } from '@/lib/db/schema';
import { avatarColor, timeAgo } from '@/lib/utils';
import { GoogleLogo } from '@/components/ui/google-logo';

export function Reviews({ reviews }: { reviews: Review[] }) {
  return (
    <section className="py-24 lg:py-32 bg-cream-100 paper">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10">
        <div className="text-center mb-14 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 mb-4">
            <GoogleLogo className="h-6 w-6" />
            <div className="flex gap-0.5 text-[#FBBC04]">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="h-4 w-4 fill-current" />
              ))}
            </div>
          </div>
          <p className="eyebrow text-gold-600 mb-4">Five out of five on Google</p>
          <h2 className="font-display text-4xl lg:text-5xl leading-[1.05]">
            What our regulars say.
          </h2>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reviews.map((review, i) => (
            <motion.figure
              key={review.id}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.5, delay: i * 0.06 }}
              className="bg-cream-50 border border-ink-900/10 p-7 lg:p-8 relative flex flex-col"
            >
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="h-10 w-10 rounded-full flex items-center justify-center text-white font-medium text-sm shrink-0"
                  style={{ background: avatarColor(review.authorName) }}
                >
                  {review.authorName.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-display text-base leading-tight truncate">{review.authorName}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <GoogleLogo className="h-3 w-3" />
                    <span className="text-xs text-ink-400">Google review</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 mb-4">
                <div className="flex gap-0.5 text-[#FBBC04]">
                  {Array.from({ length: review.rating }).map((_, idx) => (
                    <Star key={idx} className="h-3.5 w-3.5 fill-current" />
                  ))}
                </div>
                <span className="text-xs text-ink-400">{timeAgo(review.publishedAt)}</span>
              </div>
              <blockquote className="text-ink-700 leading-relaxed flex-1">
                {review.body}
              </blockquote>
            </motion.figure>
          ))}
        </div>
      </div>
    </section>
  );
}
