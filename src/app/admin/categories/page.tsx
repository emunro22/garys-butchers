import { db } from '@/lib/db';
import { categories, products } from '@/lib/db/schema';
import { asc, eq, sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export default async function AdminCategoriesPage() {
  const cats = await db.select().from(categories).orderBy(asc(categories.sortOrder));
  // Count products per category
  const counts = await db
    .select({
      categoryId: products.categoryId,
      count: sql<number>`count(*)::int`,
    })
    .from(products)
    .groupBy(products.categoryId);
  const countMap = new Map(counts.map((r) => [r.categoryId, r.count]));

  return (
    <div className="space-y-8">
      <header>
        <p className="eyebrow text-ink-500 mb-2">Catalogue</p>
        <h1 className="font-display text-4xl text-ink-900">Categories</h1>
      </header>

      <div className="bg-cream-100 border border-ink-900/10 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-cream-50 border-b border-ink-900/10">
            <tr className="text-left text-ink-500 uppercase tracking-[0.16em] text-[11px]">
              <th className="px-5 py-3 w-16">Order</th>
              <th className="px-5 py-3">Name</th>
              <th className="px-5 py-3">Slug</th>
              <th className="px-5 py-3">Description</th>
              <th className="px-5 py-3 text-right">Products</th>
              <th className="px-5 py-3 text-center">Active</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-900/5">
            {cats.map((c) => (
              <tr key={c.id}>
                <td className="px-5 py-3 tabular text-ink-500">{c.sortOrder}</td>
                <td className="px-5 py-3 font-medium text-ink-900">{c.name}</td>
                <td className="px-5 py-3 text-ink-500 font-mono text-xs">{c.slug}</td>
                <td className="px-5 py-3 text-ink-700 max-w-md truncate">
                  {c.description}
                </td>
                <td className="px-5 py-3 text-right tabular">
                  {countMap.get(c.id) ?? 0}
                </td>
                <td className="px-5 py-3 text-center">
                  <span
                    className={`inline-block h-2 w-2 rounded-full ${
                      c.isActive ? 'bg-green-500' : 'bg-ink-300'
                    }`}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-ink-500">
        Categories are seeded with the database. To add or rename a category, update
        <code className="px-1.5 py-0.5 bg-cream-200 mx-1 font-mono text-[11px]">
          src/lib/db/seed.ts
        </code>
        and re-run <code className="px-1.5 py-0.5 bg-cream-200 mx-1 font-mono text-[11px]">npm run db:seed</code>.
      </p>
    </div>
  );
}
