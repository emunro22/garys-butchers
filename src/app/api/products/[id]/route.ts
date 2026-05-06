import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { products } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getSession } from '@/lib/auth';
import { slugify } from '@/lib/utils';

const PatchSchema = z.object({
  categoryId: z.string().uuid().nullable().optional(),
  name: z.string().min(1).max(200).optional(),
  slug: z.string().min(1).max(220).optional(),
  description: z.string().max(4000).nullable().optional(),
  priceInPence: z.number().int().min(0).optional(),
  compareAtPriceInPence: z.number().int().min(0).nullable().optional(),
  imageUrl: z.string().url().nullable().optional(),
  galleryUrls: z.array(z.string().url()).optional(),
  weightLabel: z.string().max(80).nullable().optional(),
  packContents: z.array(z.string()).optional(),
  isPack: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  isActive: z.boolean().optional(),
  stockCount: z.number().int().nullable().optional(),
  badge: z.string().max(40).nullable().optional(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const [p] = await db.select().from(products).where(eq(products.id, id)).limit(1);
    if (!p) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ product: p });
  } catch (err) {
    console.error('product GET error', err);
    return NextResponse.json({ error: 'Could not load product' }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;

  try {
    const body = await req.json();
    const parsed = PatchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Please check the fields', issues: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const data = parsed.data;
    const update: Record<string, unknown> = { ...data, updatedAt: new Date() };
    if (data.name && !data.slug) update.slug = slugify(data.name);

    const [updated] = await db
      .update(products)
      .set(update)
      .where(eq(products.id, id))
      .returning();
    if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ product: updated });
  } catch (err) {
    console.error('product PATCH error', err);
    return NextResponse.json({ error: 'Could not update product' }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  try {
    await db.delete(products).where(eq(products.id, id));
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('product DELETE error', err);
    return NextResponse.json({ error: 'Could not delete product' }, { status: 500 });
  }
}
