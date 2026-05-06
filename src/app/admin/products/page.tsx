import Link from 'next/link';
import { db } from '@/lib/db';
import { products, categories } from '@/lib/db/schema';
import { asc } from 'drizzle-orm';
import { formatPrice } from '@/lib/utils';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProductsTable } from '@/components/admin/products-table';

export const dynamic = 'force-dynamic';

export default async function AdminProductsPage() {
  const [allProducts, allCategories] = await Promise.all([
    db.select().from(products).orderBy(asc(products.name)),
    db.select().from(categories).orderBy(asc(categories.sortOrder)),
  ]);

  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <p className="eyebrow text-ink-500 mb-2">Catalogue</p>
          <h1 className="font-display text-4xl text-ink-900">Products</h1>
        </div>
        <Link href="/admin/products/new">
          <Button variant="primary">
            <Plus className="h-4 w-4 mr-2" /> New product
          </Button>
        </Link>
      </header>

      <ProductsTable products={allProducts} categories={allCategories} />
    </div>
  );
}
