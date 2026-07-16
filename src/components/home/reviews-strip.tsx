'use client';

import Link from 'next/link';
import { Star } from 'lucide-react';

export function ReviewsStrip() {
  return (
    <section className="bg-cream-50 py-6">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10 flex items-center justify-center gap-4">
        <div className="flex gap-1 text-gold-500">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star key={i} className="h-4 w-4 fill-current" />
          ))}
        </div>
        <p className="text-sm text-ink-700">
          <span className="font-semibold text-ink-900">5.0</span> from local Google reviews —
          <Link href="/reviews" className="text-gold-600 hover:underline ml-1">
            read them all
          </Link>
        </p>
      </div>
    </section>
  );
}
