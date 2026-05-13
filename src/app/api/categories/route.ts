import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { categories } from '@/lib/db/schema';
import { asc } from 'drizzle-orm';
import { getSession } from '@/lib/auth';
import { slugify } from '@/lib/utils';

const CategorySchema = z.object({
  name: z.string().min(1).max(120),
  slug: z.string().min(1).max(140).optional(),
  description: z.string().max(2000).nullable().optional(),
  imageUrl: z.string().url().nullable().optional(),
  sortOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

export async function GET() {
  try {
    const all = await db.select().from(categories).orderBy(asc(categories.sortOrder));
    return NextResponse.json({ categories: all });
  } catch (err) {
    console.error('categories GET error', err);
    return NextResponse.json({ error: 'Could not load categories' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const parsed = CategorySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Please check the fields', issues: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const d = parsed.data;
    const slug = (d.slug ?? slugify(d.name)).toLowerCase();
    const [created] = await db
      .insert(categories)
      .values({
        name: d.name,
        slug,
        description: d.description ?? null,
        imageUrl: d.imageUrl ?? null,
        sortOrder: d.sortOrder ?? 0,
        isActive: d.isActive ?? true,
      })
      .returning();
    return NextResponse.json({ category: created });
  } catch (err) {
    console.error('category POST error', err);
    return NextResponse.json({ error: 'Could not create category' }, { status: 500 });
  }
}