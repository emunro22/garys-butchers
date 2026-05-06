'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

const stats = [
  { value: '2015', label: 'Family run since' },
  { value: '5★', label: 'Customer rated' },
  { value: '11', label: 'Curated meat packs' },
  { value: '£25', label: 'Free delivery from' },
];

export function AboutStrip() {
  return (
    <section className="py-24 lg:py-32 bg-cream-50 paper">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10">
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-20 items-center">
          <motion.div
            initial={{ opacity: 0, x: -16 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.7 }}
            className="lg:col-span-5"
          >
            {/* Decorative card */}
            <div className="relative aspect-[4/5] bg-ink-900 menu-plate p-12 flex flex-col justify-between text-cream-50">
              <div>
                <p className="eyebrow text-gold-400 mb-4">Est. Erskine, 2015</p>
                <p className="font-display text-3xl lg:text-4xl leading-tight">
                  &ldquo;Gary will go out of his way with any requests made with stock.
                  Fantastic quality, always great offers on, can&apos;t fault it.&rdquo;
                </p>
              </div>
              <div>
                <div className="h-px bg-gold-400/30 mb-4" />
                <p className="eyebrow text-gold-400">— Suzanne, regular customer</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 16 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="lg:col-span-7"
          >
            <p className="eyebrow text-gold-600 mb-4">Our story</p>
            <h2 className="font-display text-4xl lg:text-5xl leading-[1.05] mb-6">
              An independent butcher and fishmonger,{' '}
              <em className="text-gold-500">in the centre of Erskine</em>.
            </h2>
            <p className="text-ink-700 leading-relaxed mb-5">
              We&apos;ve been hand-cutting meat behind the counter since 2015 — sourced from
              Scottish farms we know by name, prepared on the day, and priced honestly.
              No clingfilm trays, no anonymous supermarket cuts. Just a proper butcher,
              doing it the proper way.
            </p>
            <p className="text-ink-700 leading-relaxed mb-10">
              Our fishmonger counter runs Tuesday to Saturday, with daily deliveries from
              the Scottish coast. And our meat packs — the ones lining the wall on the
              shop&apos;s price list — are how local families feed themselves well, all week.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 lg:gap-4 mb-10 py-8 border-y border-ink-900/10">
              {stats.map((stat) => (
                <div key={stat.label}>
                  <p className="font-display text-3xl lg:text-4xl text-gold-500 leading-none">
                    {stat.value}
                  </p>
                  <p className="text-xs text-ink-500 mt-2 leading-tight">{stat.label}</p>
                </div>
              ))}
            </div>

            <Link
              href="/about"
              className="eyebrow text-ink-900 inline-flex items-center gap-2 border-b-2 border-gold-400 pb-1 hover:gap-3 transition-all"
            >
              Read more about Gary&apos;s
              <ArrowRight className="h-4 w-4" />
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
