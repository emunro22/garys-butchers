import Link from 'next/link';
import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { promotions } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { PromotionForm } from '@/components/admin/promotion-form';

export const dynamic = 'force-dynamic';

export default async function EditPromotionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [promotion] = await db.select().from(promotions).where(eq(promotions.id, id)).limit(1);
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
      <PromotionForm initial={promotion} />
    </div>
  );
}
