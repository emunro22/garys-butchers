import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { deals } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getSession } from '@/lib/auth';

const DealItemSchema = z.object({ productId: z.string().uuid(), quantity: z.number().int().min(1) });

const PatchSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).nullable().optional(),
  category: z.enum(['christmas', 'easter', 'summer-bbq', 'general']).optional(),
  imageUrl: z.string().url().nullable().optional(),
  badgeText: z.string().max(80).nullable().optional(),
  status: z.enum(['draft', 'published']).optional(),
  startsAt: z.string().datetime().nullable().optional(),
  endsAt: z.string().datetime().nullable().optional(),
  dealItems: z.array(DealItemSchema).optional(),
  dealPrice: z.number().int().min(0).nullable().optional(),
});

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
      return NextResponse.json({ error: 'Invalid fields' }, { status: 400 });
    }
    const data = parsed.data;
    const update: Record<string, unknown> = { ...data, updatedAt: new Date() };
    if (data.startsAt !== undefined) update.startsAt = data.startsAt ? new Date(data.startsAt) : null;
    if (data.endsAt !== undefined) update.endsAt = data.endsAt ? new Date(data.endsAt) : null;

    const [updated] = await db
      .update(deals)
      .set(update)
      .where(eq(deals.id, id))
      .returning();
    if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ deal: updated });
  } catch (err) {
    console.error('deal PATCH error', err);
    return NextResponse.json({ error: 'Could not update deal' }, { status: 500 });
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
    await db.delete(deals).where(eq(deals.id, id));
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('deal DELETE error', err);
    return NextResponse.json({ error: 'Could not delete deal' }, { status: 500 });
  }
}
