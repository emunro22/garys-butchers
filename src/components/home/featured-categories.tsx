'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  sortOrder: number;
  imageUrl?: string | null;
}

export function FeaturedCategories({ categories }: { categories: Category[] }) {
  const cats = categories.length > 0 ? categories : [];

  if (cats.length === 0) return null;

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

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {cats.map((cat, i) => (
            <motion.div
              key={cat.id}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.5, delay: i * 0.05 }}
            >
              <Link href={`/shop/${cat.slug}`} className="group block">
                <div className="relative aspect-[4/3] overflow-hidden bg-ink-900/5">
                  {cat.imageUrl ? (
                    <Image
                      src={cat.imageUrl}
                      alt={cat.name}
                      fill
                      sizes="(max-width: 1024px) 50vw, 33vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-ink-300">
                      <span className="font-display text-2xl">{cat.name}</span>
                    </div>
                  )}
                </div>
                <div className="pt-4">
                  <h3 className="font-display text-2xl lg:text-3xl mb-1 text-ink-900 group-hover:text-gold-600 transition-colors">
                    {cat.name}
                  </h3>
                  <p className="text-sm text-ink-500 max-w-[18rem] hidden sm:block">
                    {cat.description}
                  </p>
                  <div className="mt-3 inline-flex items-center gap-2 eyebrow text-ink-700 group-hover:text-gold-600 transition-colors">
                    Shop now <ArrowUpRight className="h-3.5 w-3.5" />
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
