'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import { formatPrice, cn } from '@/lib/utils';
import { useCart } from '@/lib/cart';
import type { Product } from '@/lib/db/schema';

export function ProductCard({
  product,
  index = 0,
}: {
  product: Product;
  index?: number;
}) {
  const addItem = useCart((s) => s.addItem);
  const href = product.isPack ? `/meat-packs/${product.slug}` : `/product/${product.slug}`;

  return (
    <motion.article
      initial={{ opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-30px' }}
      transition={{ duration: 0.4, delay: Math.min(index * 0.04, 0.3) }}
      className="group flex flex-col"
    >
      <Link href={href} className="relative block overflow-hidden bg-ink-900/5 aspect-[4/5] mb-4">
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-ink-900 text-gold-400/40">
            <svg className="h-16 w-16" viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1">
              <circle cx="32" cy="32" r="28" />
              <path d="M32 12v40M12 32h40M20 20l24 24M44 20L20 44" opacity="0.3" />
            </svg>
          </div>
        )}

        {product.badge && (
          <span className="absolute top-3 left-3 bg-gold-400 text-ink-900 text-[10px] uppercase tracking-[0.18em] font-semibold px-2 py-1">
            {product.badge}
          </span>
        )}

        {product.compareAtPriceInPence && (
          <span className="absolute top-3 right-3 bg-butcher-500 text-cream-50 text-[10px] uppercase tracking-[0.18em] font-semibold px-2 py-1">
            On offer
          </span>
        )}

        <button
          onClick={(e) => {
            e.preventDefault();
            addItem({
              productId: product.id,
              slug: product.slug,
              name: product.name,
              priceInPence: product.priceInPence,
              imageUrl: product.imageUrl ?? undefined,
              weightLabel: product.weightLabel ?? undefined,
            });
          }}
          aria-label={`Add ${product.name} to basket`}
          className="absolute bottom-3 right-3 h-11 w-11 bg-cream-50 text-ink-900 border border-ink-900/15 flex items-center justify-center opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all hover:bg-gold-400 hover:border-gold-500"
        >
          <Plus className="h-4 w-4" />
        </button>
      </Link>

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <Link href={href}>
            <h3 className="font-display text-lg leading-tight text-ink-900 hover:text-ink-700 transition-colors">
              {product.name}
            </h3>
          </Link>
          {product.weightLabel && (
            <p className="text-xs text-ink-500 mt-1">{product.weightLabel}</p>
          )}
        </div>
        <div className="text-right shrink-0">
          <p className="tabular text-base font-medium text-ink-900">
            {formatPrice(product.priceInPence)}
          </p>
          {product.compareAtPriceInPence && (
            <p className="text-xs text-ink-400 line-through tabular">
              {formatPrice(product.compareAtPriceInPence)}
            </p>
          )}
        </div>
      </div>
    </motion.article>
  );
}
