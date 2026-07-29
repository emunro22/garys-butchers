import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { products } from '@/lib/db/schema';
import { and, eq, inArray, desc } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const categoryIds = (url.searchParams.get('categoryIds') ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 8);
  const limit = Math.min(Number(url.searchParams.get('limit') ?? 8) || 8, 12);

  if (categoryIds.length === 0) return NextResponse.json({ products: [] });

  try {
    const results = await db
      .select()
      .from(products)
      .where(and(inArray(products.categoryId, categoryIds), eq(products.isActive, true)))
      .orderBy(desc(products.isFeatured), desc(products.createdAt))
      .limit(limit);

    return NextResponse.json({ products: results });
  } catch (err) {
    console.error('products recommended error', err);
    return NextResponse.json({ products: [] });
  }
}
