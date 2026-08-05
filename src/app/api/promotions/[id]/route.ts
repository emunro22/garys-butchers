import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { promotions } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getSession } from '@/lib/auth';
import { ensurePromotionsSchema } from '@/lib/db/ensure-schema';

const PatchSchema = z.object({
  code: z.string().min(2).max(60).optional(),
  description: z.string().max(500).nullable().optional(),
  type: z.enum(['percent_off', 'amount_off', 'free_delivery']).optional(),
  value: z.number().int().min(0).optional(),
  minimumOrderInPence: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
  maxRedemptions: z.number().int().min(1).nullable().optional(),
  startsAt: z.string().datetime().nullable().optional(),
  endsAt: z.string().datetime().nullable().optional(),
  productId: z.string().uuid().nullable().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;

  try {
    await ensurePromotionsSchema();
    const body = await req.json();
    const parsed = PatchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid fields' }, { status: 400 });
    }
    if (
      parsed.data.type === 'percent_off' &&
      parsed.data.value !== undefined &&
      (parsed.data.value < 1 || parsed.data.value > 100)
    ) {
      return NextResponse.json(
        { error: 'Percent value must be between 1 and 100' },
        { status: 400 }
      );
    }
    const update: Record<string, unknown> = { ...parsed.data };
    if (parsed.data.code !== undefined) {
      update.code = parsed.data.code.toUpperCase();
    }
    if (parsed.data.startsAt !== undefined) {
      update.startsAt = parsed.data.startsAt ? new Date(parsed.data.startsAt) : null;
    }
    if (parsed.data.endsAt !== undefined) {
      update.endsAt = parsed.data.endsAt ? new Date(parsed.data.endsAt) : null;
    }

    const [updated] = await db
      .update(promotions)
      .set(update)
      .where(eq(promotions.id, id))
      .returning();
    if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ promotion: updated });
  } catch (err) {
    console.error('promotion PATCH error', err);
    return NextResponse.json({ error: 'Could not update promotion' }, { status: 500 });
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
    await db.delete(promotions).where(eq(promotions.id, id));
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('promotion DELETE error', err);
    return NextResponse.json({ error: 'Could not delete promotion' }, { status: 500 });
  }
}
