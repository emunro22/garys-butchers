import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { subscribers } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getSession } from '@/lib/auth';

const PatchSchema = z.object({
  isActive: z.boolean(),
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
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }
    const [updated] = await db
      .update(subscribers)
      .set({
        isActive: parsed.data.isActive,
        unsubscribedAt: parsed.data.isActive ? null : new Date(),
      })
      .where(eq(subscribers.id, id))
      .returning();
    if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ subscriber: updated });
  } catch (err) {
    console.error('subscriber PATCH error', err);
    return NextResponse.json({ error: 'Could not update subscriber' }, { status: 500 });
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
    await db.delete(subscribers).where(eq(subscribers.id, id));
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('subscriber DELETE error', err);
    return NextResponse.json({ error: 'Could not delete subscriber' }, { status: 500 });
  }
}