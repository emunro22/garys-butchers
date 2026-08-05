import Link from 'next/link';
import { db } from '@/lib/db';
import { products } from '@/lib/db/schema';
import { asc } from 'drizzle-orm';
import { PromotionForm } from '@/components/admin/promotion-form';

export const dynamic = 'force-dynamic';

export default async function NewPromotionPage() {
  const allProducts = await db
    .select({ id: products.id, name: products.name })
    .from(products)
    .orderBy(asc(products.name));

  return (
    <div className="space-y-8">
      <header>
        <Link
          href="/admin/promotions"
          className="text-xs uppercase tracking-[0.18em] text-ink-500 hover:text-ink-900 mb-3 inline-block"
        >
          ← Promotions
        </Link>
        <h1 className="font-display text-4xl text-ink-900">New promo code</h1>
      </header>
      <PromotionForm products={allProducts} />
    </div>
  );
}
