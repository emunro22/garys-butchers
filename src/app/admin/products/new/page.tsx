import Link from 'next/link';
import { db } from '@/lib/db';
import { categories } from '@/lib/db/schema';
import { asc } from 'drizzle-orm';
import { ProductForm } from '@/components/admin/product-form';

export const dynamic = 'force-dynamic';

export default async function NewProductPage() {
  const allCategories = await db
    .select()
    .from(categories)
    .orderBy(asc(categories.sortOrder));

  return (
    <div className="space-y-8">
      <header>
        <Link
          href="/admin/products"
          className="text-xs uppercase tracking-[0.18em] text-ink-500 hover:text-ink-900 mb-3 inline-block"
        >
          ← Products
        </Link>
        <h1 className="font-display text-4xl text-ink-900">New product</h1>
      </header>

      <ProductForm mode="create" categories={allCategories} />
    </div>
  );
}
