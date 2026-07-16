import { db } from '@/lib/db';
import { products } from '@/lib/db/schema';
import { and, eq, isNotNull, desc } from 'drizzle-orm';

export async function getCategoryImageMap(): Promise<Record<string, string>> {
  const rows = await db
    .select({ categoryId: products.categoryId, imageUrl: products.imageUrl })
    .from(products)
    .where(and(eq(products.isActive, true), isNotNull(products.categoryId), isNotNull(products.imageUrl)))
    .orderBy(desc(products.isFeatured), desc(products.createdAt));

  const map: Record<string, string> = {};
  for (const row of rows) {
    if (row.categoryId && row.imageUrl && !map[row.categoryId]) {
      map[row.categoryId] = row.imageUrl;
    }
  }
  return map;
}
