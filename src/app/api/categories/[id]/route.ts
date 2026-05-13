import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { categories, products } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';
import { getSession } from '@/lib/auth';
import { slugify } from '@/lib/utils';

const PatchSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  slug: z.string().min(1).max(140).optional(),
  description: z.string().max(2000).nullable().optional(),
  imageUrl: z.string().url().nullable().optional(),
  sortOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const [c] = await db.select().from(categories).where(eq(categories.id, id)).limit(1);
    if (!c) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ category: c });
  } catch (err) {
    console.error('category GET error', err);
    return NextResponse.json({ error: 'Could not load category' }, { status: 500 });
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
      .update(categories)
      .set(update)
      .where(eq(categories.id, id))
      .returning();
    if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ category: updated });
  } catch (err) {
    console.error('category PATCH error', err);
    return NextResponse.json({ error: 'Could not update category' }, { status: 500 });
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
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(products)
      .where(eq(products.categoryId, id));
    if (count > 0) {
      return NextResponse.json(
        {
          error: `Can't delete — ${count} product${count === 1 ? ' is' : 's are'} still in this category. Move or delete them first.`,
        },
        { status: 409 }
      );
    }
    await db.delete(categories).where(eq(categories.id, id));
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('category DELETE error', err);
    return NextResponse.json({ error: 'Could not delete category' }, { status: 500 });
  }
}