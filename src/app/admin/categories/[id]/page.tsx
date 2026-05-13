import Link from 'next/link';
import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { categories } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { CategoryForm } from '@/components/admin/category-form';

export const dynamic = 'force-dynamic';

export default async function EditCategoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [category] = await db
    .select()
    .from(categories)
    .where(eq(categories.id, id))
    .limit(1);
  if (!category) notFound();

  return (
    <div className="space-y-8">
      <header>
        <Link
          href="/admin/categories"
          className="text-xs uppercase tracking-[0.18em] text-ink-500 hover:text-ink-900 mb-3 inline-block"
        >
          ← Categories
        </Link>
        <h1 className="font-display text-4xl text-ink-900">{category.name}</h1>
      </header>
      <CategoryForm mode="edit" initial={category} />
    </div>
  );
}