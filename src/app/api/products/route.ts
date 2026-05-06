import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { products } from '@/lib/db/schema';
import { eq, asc } from 'drizzle-orm';
import { getSession } from '@/lib/auth';
import { slugify } from '@/lib/utils';

const ProductSchema = z.object({
  categoryId: z.string().uuid().nullable().optional(),
  name: z.string().min(1).max(200),
  slug: z.string().min(1).max(220).optional(),
  description: z.string().max(4000).optional().nullable(),
  priceInPence: z.number().int().min(0),
  compareAtPriceInPence: z.number().int().min(0).optional().nullable(),
  imageUrl: z.string().url().optional().nullable(),
  galleryUrls: z.array(z.string().url()).optional(),
  weightLabel: z.string().max(80).optional().nullable(),
  packContents: z.array(z.string()).optional(),
  isPack: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  isActive: z.boolean().optional(),
  stockCount: z.number().int().nullable().optional(),
  badge: z.string().max(40).nullable().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const categoryId = url.searchParams.get('categoryId');
    const isPack = url.searchParams.get('isPack');

    const all = await db.select().from(products).orderBy(asc(products.name));
    const filtered = all.filter((p) => {
      if (categoryId && p.categoryId !== categoryId) return false;
      if (isPack === 'true' && !p.isPack) return false;
      if (isPack === 'false' && p.isPack) return false;
      return true;
    });
    return NextResponse.json({ products: filtered });
  } catch (err) {
    console.error('products GET error', err);
    return NextResponse.json({ error: 'Could not load products' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const parsed = ProductSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Please check the fields', issues: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const data = parsed.data;
    const slug = (data.slug ?? slugify(data.name)).toLowerCase();
    const [created] = await db
      .insert(products)
      .values({
        categoryId: data.categoryId ?? null,
        name: data.name,
        slug,
        description: data.description ?? null,
        priceInPence: data.priceInPence,
        compareAtPriceInPence: data.compareAtPriceInPence ?? null,
        imageUrl: data.imageUrl ?? null,
        galleryUrls: data.galleryUrls ?? [],
        weightLabel: data.weightLabel ?? null,
        packContents: data.packContents ?? [],
        isPack: data.isPack ?? false,
        isFeatured: data.isFeatured ?? false,
        isActive: data.isActive ?? true,
        stockCount: data.stockCount ?? null,
        badge: data.badge ?? null,
      })
      .returning();
    return NextResponse.json({ product: created });
  } catch (err) {
    console.error('product POST error', err);
    return NextResponse.json({ error: 'Could not create product' }, { status: 500 });
  }
}
