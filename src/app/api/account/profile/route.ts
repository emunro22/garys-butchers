import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getCustomerSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET() {
  const session = await getCustomerSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const [user] = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      phone: users.phone,
      defaultAddress: users.defaultAddress,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.id, session.userId))
    .limit(1);

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  return NextResponse.json({ profile: user });
}

const UpdateSchema = z.object({
  name: z.string().min(2).optional(),
  phone: z.string().optional(),
  defaultAddress: z
    .object({
      line1: z.string().min(1),
      line2: z.string().optional(),
      city: z.string().min(1),
      postcode: z.string().min(1),
    })
    .nullable()
    .optional(),
});

export async function PUT(req: NextRequest) {
  const session = await getCustomerSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = UpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (parsed.data.name !== undefined) updates.name = parsed.data.name;
    if (parsed.data.phone !== undefined) updates.phone = parsed.data.phone || null;
    if (parsed.data.defaultAddress !== undefined) updates.defaultAddress = parsed.data.defaultAddress;

    await db.update(users).set(updates).where(eq(users.id, session.userId));

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('profile update error', err);
    return NextResponse.json({ error: 'Could not update profile' }, { status: 500 });
  }
}
