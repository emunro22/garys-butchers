import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { promotions } from '@/lib/db/schema';
import { desc } from 'drizzle-orm';
import { getSession } from '@/lib/auth';

const Schema = z.object({
  code: z.string().min(2).max(60),
  description: z.string().max(500).optional().nullable(),
  type: z.enum(['percent_off', 'amount_off', 'free_delivery']),
  value: z.number().int().min(0),
  minimumOrderInPence: z.number().int().min(0).optional(),
  maxRedemptions: z.number().int().min(1).nullable().optional(),
  startsAt: z.string().datetime().nullable().optional(),
  endsAt: z.string().datetime().nullable().optional(),
  isActive: z.boolean().optional(),
});

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const all = await db.select().from(promotions).orderBy(desc(promotions.createdAt));
    return NextResponse.json({ promotions: all });
  } catch (err) {
    console.error('promotions GET error', err);
    return NextResponse.json({ error: 'Could not load promotions' }, { status: 500 });
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
    if (d.type === 'percent_off' && (d.value < 1 || d.value > 100)) {
      return NextResponse.json(
        { error: 'Percent value must be between 1 and 100' },
        { status: 400 }
      );
    }
    const [created] = await db
      .insert(promotions)
      .values({
        code: d.code.toUpperCase(),
        description: d.description ?? null,
        type: d.type,
        value: d.value,
        minimumOrderInPence: d.minimumOrderInPence ?? 0,
        maxRedemptions: d.maxRedemptions ?? null,
        startsAt: d.startsAt ? new Date(d.startsAt) : null,
        endsAt: d.endsAt ? new Date(d.endsAt) : null,
        isActive: d.isActive ?? true,
      })
      .returning();
    return NextResponse.json({ promotion: created });
  } catch (err) {
    console.error('promotion POST error', err);
    return NextResponse.json({ error: 'Could not create promotion' }, { status: 500 });
  }
}
