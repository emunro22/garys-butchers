'use client';

import { useEffect, useState } from 'react';
import { ProductCard } from '@/components/shop/product-card';
import { getTopInterestCategories } from '@/lib/search-history';
import type { Product } from '@/lib/db/schema';

export function RecommendedForYou() {
  const [products, setProducts] = useState<Product[] | null>(null);

  useEffect(() => {
    const categoryIds = getTopInterestCategories(3);
    if (categoryIds.length === 0) return;

    fetch(`/api/products/recommended?categoryIds=${categoryIds.join(',')}&limit=8`)
      .then((res) => res.json())
      .then((data) => setProducts(data.products ?? []))
      .catch(() => setProducts([]));
  }, []);

  if (!products || products.length === 0) return null;

  return (
    <section className="border-t border-ink-900/10">
      <div className="mx-auto max-w-7xl px-4 md:px-8 py-16 md:py-20">
        <p className="eyebrow text-ink-500 mb-2">Based on what you've been searching for</p>
        <h2 className="font-display text-3xl md:text-4xl text-ink-900 mb-10">Recommended for you</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-10">
          {products.map((p, i) => (
            <ProductCard key={p.id} product={p} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
