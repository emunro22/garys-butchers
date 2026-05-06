'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import type { Product } from '@/lib/db/schema';

export function FeaturedPacks({ packs }: { packs: Product[] }) {
  return (
    <section className="py-24 lg:py-32 bg-ink-900 text-cream-50 ink-paper relative">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold-400/40 to-transparent" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10">
        <div className="text-center mb-16 max-w-2xl mx-auto">
          <p className="eyebrow text-gold-400 mb-4">The famous meat packs</p>
          <h2 className="font-display text-4xl lg:text-6xl leading-[1.05] mb-6">
            Feed the family for less.
          </h2>
          <p className="text-cream-200/80 leading-relaxed">
            Curated boxes of our best cuts at a brilliant price. The Manager&apos;s Special is our
            top seller, but every pack here is a proper bit of value.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {packs.map((pack, i) => (
            <motion.article
              key={pack.id}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.6, delay: i * 0.08 }}
              className="menu-plate p-8 lg:p-10 group flex flex-col"
            >
              <header className="flex items-start justify-between gap-4 mb-6 relative z-10">
                <div>
                  <h3 className="font-display text-3xl leading-tight">{pack.name}</h3>
                  {pack.badge && (
                    <span className="inline-block mt-2 text-[10px] tracking-[0.18em] uppercase bg-gold-400 text-ink-900 px-2 py-0.5 font-semibold">
                      {pack.badge}
                    </span>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <p className="font-display text-3xl text-gold-400 leading-none tabular">
                    {formatPrice(pack.priceInPence)}
                  </p>
                </div>
              </header>

              <div className="border-t border-gold-400/20 pt-5 mb-5 relative z-10">
                <p className="eyebrow text-gold-400/80 mb-3">Includes</p>
                <ul className="space-y-1.5 text-sm text-cream-200/90">
                  {(pack.packContents as string[])?.slice(0, 6).map((line) => (
                    <li key={line} className="flex gap-2">
                      <span className="text-gold-400 shrink-0">·</span>
                      <span>{line}</span>
                    </li>
                  ))}
                  {(pack.packContents as string[])?.length > 6 && (
                    <li className="text-cream-200/60 italic pt-1">
                      …plus {(pack.packContents as string[]).length - 6} more
                    </li>
                  )}
                </ul>
              </div>

              <Link
                href={`/meat-packs/${pack.slug}`}
                className="mt-auto inline-flex items-center justify-center gap-2 eyebrow text-cream-50 group-hover:text-gold-400 transition-colors py-3 border-t border-gold-400/20 relative z-10"
              >
                View pack
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
              </Link>
            </motion.article>
          ))}
        </div>

        <div className="text-center mt-14">
          <Link
            href="/meat-packs"
            className="inline-flex items-center gap-2 eyebrow text-gold-400 hover:text-gold-300 border-b border-gold-400/40 pb-1"
          >
            See all 11 meat packs
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
