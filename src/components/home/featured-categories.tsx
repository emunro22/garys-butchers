'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';

const categories = [
  {
    name: 'Beef',
    slug: 'beef',
    description: 'Sirloin, popeseye, rump, mince, diced beef and roasting joints',
    accent: '#8b1f1f',
    illustration: 'bull',
  },
  {
    name: 'Pork',
    slug: 'pork',
    description: 'Loin steaks, links, pork olives and traditional cuts',
    accent: '#c9a961',
    illustration: 'pig',
  },
  {
    name: 'Chicken',
    slug: 'chicken',
    description: 'Free-range fillets, chicken burgers and prepared cuts',
    accent: '#a3925d',
    illustration: 'chicken',
  },
  {
    name: 'Fish',
    slug: 'fish',
    description: 'Fresh salmon, haddock, cod and prawns from the Scottish coast',
    accent: '#3a6571',
    illustration: 'fish',
  },
  {
    name: 'Sausages & Burgers',
    slug: 'sausages-burgers',
    description: 'Steak burgers, beef and pork links — made on site',
    accent: '#6b3e1f',
    illustration: 'sausage',
  },
  {
    name: 'Pies & Bakery',
    slug: 'pies-bakery',
    description: 'Steak pies, scotch pies, family pies and tatty scones',
    accent: '#8b6f3f',
    illustration: 'pie',
  },
];

// Inline SVG illustrations matching the gold-on-black motif
function Illustration({ kind }: { kind: string }) {
  const props = { className: 'h-20 w-20', stroke: 'currentColor', strokeWidth: 1.2, fill: 'none' };
  switch (kind) {
    case 'bull':
      return (
        <svg viewBox="0 0 64 64" {...props}>
          <path d="M16 22c-4-2-6-6-4-10 4 2 8 2 12 0M48 22c4-2 6-6 4-10-4 2-8 2-12 0M20 18c0 8 6 14 12 14s12-6 12-14M20 28c-2 4-2 10 2 14s8 6 10 6 6-2 10-6 4-10 2-14M28 36c0 2 2 4 4 4s4-2 4-4M30 30v3M34 30v3" />
        </svg>
      );
    case 'pig':
      return (
        <svg viewBox="0 0 64 64" {...props}>
          <ellipse cx="32" cy="36" rx="20" ry="14" />
          <ellipse cx="32" cy="34" rx="6" ry="4" />
          <circle cx="30" cy="34" r="0.8" fill="currentColor" />
          <circle cx="34" cy="34" r="0.8" fill="currentColor" />
          <path d="M16 28l-2-6 6 2M48 28l2-6-6 2M20 50l2 6M44 50l-2 6" />
          <circle cx="26" cy="30" r="0.8" fill="currentColor" />
          <circle cx="38" cy="30" r="0.8" fill="currentColor" />
        </svg>
      );
    case 'chicken':
      return (
        <svg viewBox="0 0 64 64" {...props}>
          <ellipse cx="32" cy="40" rx="14" ry="12" />
          <circle cx="40" cy="26" r="6" />
          <path d="M44 22l4-4 2 4-4 2M40 20v-4M42 26h2M36 50v6M28 50v6" />
          <circle cx="42" cy="26" r="0.8" fill="currentColor" />
        </svg>
      );
    case 'fish':
      return (
        <svg viewBox="0 0 64 64" {...props}>
          <path d="M8 32c4-8 14-12 24-12s18 4 22 12c-4 8-12 12-22 12S12 40 8 32z" />
          <path d="M50 24l8-4v24l-8-4M16 32h2M22 28h2M22 36h2" />
          <circle cx="22" cy="32" r="0.8" fill="currentColor" />
        </svg>
      );
    case 'sausage':
      return (
        <svg viewBox="0 0 64 64" {...props}>
          <path d="M10 24c0-4 4-8 8-8h28c4 0 8 4 8 8s-4 8-8 8H18c-4 0-8-4-8-8zM12 40c0-4 4-8 8-8h28c4 0 8 4 8 8s-4 8-8 8H20c-4 0-8-4-8-8z" />
          <path d="M16 24h32M18 40h32" strokeDasharray="2 3" />
        </svg>
      );
    case 'pie':
      return (
        <svg viewBox="0 0 64 64" {...props}>
          <ellipse cx="32" cy="40" rx="22" ry="6" />
          <path d="M10 40c0-6 6-14 22-14s22 8 22 14M16 32l4-4M48 32l-4-4M32 26v-4M24 26l-2-3M40 26l2-3" />
        </svg>
      );
    default:
      return null;
  }
}

export function FeaturedCategories() {
  return (
    <section className="py-24 lg:py-32 bg-cream-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-14 gap-6">
          <div>
            <p className="eyebrow text-gold-600 mb-3">Browse the counter</p>
            <h2 className="font-display text-4xl lg:text-6xl leading-[1] max-w-2xl">
              From the <em className="text-gold-500">block</em>, the <em className="text-gold-500">grill</em>, and the <em className="text-gold-500">sea</em>.
            </h2>
          </div>
          <Link
            href="/shop"
            className="eyebrow text-ink-700 hover:text-ink-900 inline-flex items-center gap-2"
          >
            Shop everything <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-px bg-ink-900/10">
          {categories.map((cat, i) => (
            <motion.div
              key={cat.slug}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.5, delay: i * 0.05 }}
            >
              <Link
                href={`/shop/${cat.slug}`}
                className="group relative block bg-cream-50 hover:bg-ink-900 transition-colors duration-300 aspect-square p-6 lg:p-10 overflow-hidden"
              >
                <div
                  className="absolute -top-12 -right-12 w-44 h-44 rounded-full opacity-0 group-hover:opacity-30 transition-opacity duration-500"
                  style={{ background: cat.accent }}
                />
                <div className="relative h-full flex flex-col justify-between">
                  <div className="text-ink-700 group-hover:text-gold-400 transition-colors">
                    <Illustration kind={cat.illustration} />
                  </div>
                  <div>
                    <h3 className="font-display text-2xl lg:text-3xl mb-2 text-ink-900 group-hover:text-cream-50 transition-colors">
                      {cat.name}
                    </h3>
                    <p className="text-sm text-ink-500 group-hover:text-cream-200 transition-colors max-w-[18rem] hidden sm:block">
                      {cat.description}
                    </p>
                    <div className="mt-4 lg:mt-6 inline-flex items-center gap-2 eyebrow text-ink-900 group-hover:text-gold-400 transition-colors">
                      Shop now <ArrowUpRight className="h-3.5 w-3.5" />
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
