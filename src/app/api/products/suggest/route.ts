import { NextRequest, NextResponse } from 'next/server';
import { catalogDb } from '@/lib/db';
import { products } from '@/lib/db/schema';
import { and, eq, or, ilike, asc } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const q = (url.searchParams.get('q') ?? '').trim().slice(0, 60);

  if (!q) return NextResponse.json({ products: [] });

  try {
    const term = `%${q}%`;
    const results = await catalogDb
      .select({
        id: products.id,
        name: products.name,
        slug: products.slug,
        imageUrl: products.imageUrl,
        priceInPence: products.priceInPence,
        weightLabel: products.weightLabel,
        isPack: products.isPack,
        categoryId: products.categoryId,
      })
      .from(products)
      .where(and(eq(products.isActive, true), or(ilike(products.name, term), ilike(products.description, term))))
      .orderBy(asc(products.name))
      .limit(6);

    return NextResponse.json({ products: results });
  } catch (err) {
    console.error('products suggest error', err);
    return NextResponse.json({ products: [] });
  }
}
