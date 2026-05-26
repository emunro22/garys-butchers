import Link from 'next/link';
import { db } from '@/lib/db';
import { deals } from '@/lib/db/schema';
import { desc } from 'drizzle-orm';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DealsTable } from '@/components/admin/deals-table';

export const dynamic = 'force-dynamic';

export default async function AdminDealsPage() {
  const all = await db.select().from(deals).orderBy(desc(deals.createdAt));
  const published = all.filter((d) => d.status === 'published').length;

  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <p className="eyebrow text-ink-500 mb-2">Marketing</p>
          <h1 className="font-display text-4xl text-ink-900">Seasonal Deals</h1>
          {all.length > 0 && (
            <p className="text-sm text-ink-500 mt-1">
              {published} published · {all.length - published} draft
            </p>
          )}
        </div>
        <Link href="/admin/deals/new">
          <Button variant="primary">
            <Plus className="h-4 w-4 mr-2" /> New deal
          </Button>
        </Link>
      </header>

      <p className="text-sm text-ink-500 bg-cream-100 border border-ink-900/10 px-4 py-3">
        Create Christmas, Easter, Summer BBQ or general deals here. Save as <strong>draft</strong> — they won&apos;t appear on the site until you publish them.
      </p>

      <DealsTable initial={all} />
    </div>
  );
}
