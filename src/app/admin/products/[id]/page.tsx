import Link from 'next/link';
import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { categories, products } from '@/lib/db/schema';
import { asc, eq } from 'drizzle-orm';
import { sql } from '@vercel/postgres';
import { ProductForm } from '@/components/admin/product-form';

export const dynamic = 'force-dynamic';

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  try {
    await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS variants jsonb NOT NULL DEFAULT '[]'::jsonb`;
  } catch { /* already exists */ }

  const { id } = await params;
  const [product] = await db.select().from(products).where(eq(products.id, id)).limit(1);
  if (!product) notFound();
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
        <h1 className="font-display text-4xl text-ink-900">{product.name}</h1>
      </header>

      <ProductForm mode="edit" categories={allCategories} initial={product} />
    </div>
  );
}
