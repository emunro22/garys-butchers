'use client';

import { motion } from 'framer-motion';
import { Star, Quote } from 'lucide-react';
import type { Review } from '@/lib/db/schema';

export function Reviews({ reviews }: { reviews: Review[] }) {
  return (
    <section className="py-24 lg:py-32 bg-cream-100 paper">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10">
        <div className="text-center mb-14 max-w-2xl mx-auto">
          <div className="stars justify-center mb-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className="h-5 w-5 fill-current" />
            ))}
          </div>
          <p className="eyebrow text-gold-600 mb-4">Five out of five</p>
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
              <Quote className="absolute top-5 right-5 h-7 w-7 text-gold-400/30" strokeWidth={1.5} />
              <div className="stars mb-4">
                {Array.from({ length: review.rating }).map((_, idx) => (
                  <Star key={idx} className="h-3.5 w-3.5 fill-current" />
                ))}
              </div>
              <blockquote className="text-ink-700 leading-relaxed mb-5 flex-1">
                {review.body}
              </blockquote>
              <figcaption className="pt-5 border-t border-ink-900/10">
                <p className="font-display text-lg">{review.authorName}</p>
                <p className="text-xs text-ink-400 eyebrow mt-1">via Google</p>
              </figcaption>
            </motion.figure>
          ))}
        </div>
      </div>
    </section>
  );
}
