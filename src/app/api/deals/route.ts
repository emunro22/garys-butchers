import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { deals } from '@/lib/db/schema';
import { desc } from 'drizzle-orm';
import { getSession } from '@/lib/auth';

const Schema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).nullable().optional(),
  category: z.enum(['christmas', 'easter', 'summer-bbq', 'general']),
  imageUrl: z.string().url().nullable().optional(),
  badgeText: z.string().max(80).nullable().optional(),
  status: z.enum(['draft', 'published']).optional(),
  startsAt: z.string().datetime().nullable().optional(),
  endsAt: z.string().datetime().nullable().optional(),
});

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const all = await db.select().from(deals).orderBy(desc(deals.createdAt));
    return NextResponse.json({ deals: all });
  } catch (err) {
    console.error('deals GET error', err);
    return NextResponse.json({ error: 'Could not load deals' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const parsed = Schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Please check the fields', issues: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const d = parsed.data;
    const [created] = await db
      .insert(deals)
      .values({
        title: d.title,
        description: d.description ?? null,
        category: d.category,
        imageUrl: d.imageUrl ?? null,
        badgeText: d.badgeText ?? null,
        status: d.status ?? 'draft',
        startsAt: d.startsAt ? new Date(d.startsAt) : null,
        endsAt: d.endsAt ? new Date(d.endsAt) : null,
      })
      .returning();
    return NextResponse.json({ deal: created });
  } catch (err) {
    console.error('deals POST error', err);
    return NextResponse.json({ error: 'Could not create deal' }, { status: 500 });
  }
}
