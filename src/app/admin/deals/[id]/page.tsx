import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { deals } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { DealForm } from '@/components/admin/deal-form';

export const dynamic = 'force-dynamic';

export default async function EditDealPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [deal] = await db.select().from(deals).where(eq(deals.id, id)).limit(1);
  if (!deal) notFound();

  return (
    <div className="space-y-8">
      <header>
        <p className="eyebrow text-ink-500 mb-2">Marketing / Edit deal</p>
        <h1 className="font-display text-4xl text-ink-900">{deal.title}</h1>
      </header>
      <DealForm initial={deal} mode="edit" />
    </div>
  );
}
