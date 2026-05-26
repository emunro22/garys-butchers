import Link from 'next/link';
import { db } from '@/lib/db';
import { promotions } from '@/lib/db/schema';
import { desc } from 'drizzle-orm';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PromotionsTable } from '@/components/admin/promotions-table';

export const dynamic = 'force-dynamic';

export default async function AdminPromotionsPage() {
  const all = await db.select().from(promotions).orderBy(desc(promotions.createdAt));

  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <p className="eyebrow text-ink-500 mb-2">Marketing</p>
          <h1 className="font-display text-4xl text-ink-900">Promotions</h1>
        </div>
        <Link href="/admin/promotions/new">
          <Button variant="primary">
            <Plus className="h-4 w-4 mr-2" /> New code
          </Button>
        </Link>
      </header>

      <PromotionsTable initial={all} />
    </div>
  );
}
