import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

const UpdateRoleSchema = z.object({
  userId: z.string().uuid(),
  role: z.enum(['customer', 'admin']),
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

    await db
      .update(users)
      .set({ role: parsed.data.role, updatedAt: new Date() })
      .where(eq(users.id, parsed.data.userId));

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('update role error', err);
    return NextResponse.json({ error: 'Could not update role' }, { status: 500 });
  }
}
