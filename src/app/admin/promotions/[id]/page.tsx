import Link from 'next/link';
import { notFound } from 'next/navigation';
import { catalogDb } from '@/lib/db';
import { promotions, products } from '@/lib/db/schema';
import { eq, asc } from 'drizzle-orm';
import { PromotionForm } from '@/components/admin/promotion-form';
import { ensurePromotionsSchema } from '@/lib/db/ensure-schema';

export const dynamic = 'force-dynamic';

export default async function EditPromotionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await ensurePromotionsSchema();
  const [[promotion], allProducts] = await Promise.all([
    catalogDb.select().from(promotions).where(eq(promotions.id, id)).limit(1),
    catalogDb.select({ id: products.id, name: products.name }).from(products).orderBy(asc(products.name)),
  ]);
  if (!promotion) notFound();

  return (
    <div className="space-y-8">
      <header>
        <Link
          href="/admin/promotions"
          className="text-xs uppercase tracking-[0.18em] text-ink-500 hover:text-ink-900 mb-3 inline-block"
        >
          ← Promotions
        </Link>
        <h1 className="font-display text-4xl text-ink-900">Edit {promotion.code}</h1>
      </header>
      <PromotionForm initial={promotion} products={allProducts} />
    </div>
  );
}
