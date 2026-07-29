import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { sql } from '@vercel/postgres';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

const UpdateRoleSchema = z
  .object({
    userId: z.string().uuid(),
    role: z.enum(['customer', 'admin']).optional(),
    premiumDeliveryEligible: z.boolean().optional(),
  })
  .refine((v) => v.role !== undefined || v.premiumDeliveryEligible !== undefined, {
    message: 'Nothing to update',
  });

const DeleteSchema = z.object({
  userId: z.string().uuid(),
});

export async function PUT(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = UpdateRoleSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    try {
      await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS premium_delivery_eligible boolean NOT NULL DEFAULT false`;
    } catch { /* already exists */ }

    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (parsed.data.role !== undefined) updates.role = parsed.data.role;
    if (parsed.data.premiumDeliveryEligible !== undefined) {
      updates.premiumDeliveryEligible = parsed.data.premiumDeliveryEligible;
    }

    await db
      .update(users)
      .set(updates)
      .where(eq(users.id, parsed.data.userId));

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('update role error', err);
    return NextResponse.json({ error: 'Could not update role' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = DeleteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    const [target] = await db
      .select({ email: users.email })
      .from(users)
      .where(eq(users.id, parsed.data.userId))
      .limit(1);

    if (target?.email === session.email) {
      return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 });
    }

    await db.delete(users).where(eq(users.id, parsed.data.userId));

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('delete customer error', err);
    return NextResponse.json({ error: 'Could not delete customer' }, { status: 500 });
  }
}
