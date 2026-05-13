import Link from 'next/link';
import { db } from '@/lib/db';
import { categories, products } from '@/lib/db/schema';
import { asc, sql } from 'drizzle-orm';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CategoriesTable } from '@/components/admin/categories-table';

export const dynamic = 'force-dynamic';

export default async function AdminCategoriesPage() {
  const cats = await db.select().from(categories).orderBy(asc(categories.sortOrder));
  const counts = await db
    .select({
      categoryId: products.categoryId,
      count: sql<number>`count(*)::int`,
    })
    .from(products)
    .groupBy(products.categoryId);
  const countMap = Object.fromEntries(counts.map((r) => [r.categoryId, r.count]));

  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <p className="eyebrow text-ink-500 mb-2">Catalogue</p>
          <h1 className="font-display text-4xl text-ink-900">Categories</h1>
        </div>
        <Link href="/admin/categories/new">
          <Button variant="primary">
            <Plus className="h-4 w-4 mr-2" /> New category
          </Button>
        </Link>
      </header>

      <CategoriesTable categories={cats} countMap={countMap} />
    </div>
  );
}