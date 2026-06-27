import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { hashPassword } from '@/lib/auth';

const Schema = z.object({
  email: z.string().email(),
  code: z.string().length(6),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = Schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const { email, code, newPassword } = parsed.data;
    const normalizedEmail = email.toLowerCase().trim();

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, normalizedEmail))
      .limit(1);

    if (!user) {
      return NextResponse.json({ error: 'Invalid or expired reset code' }, { status: 400 });
    }

    if (
      user.resetCode !== code ||
      !user.resetCodeExpiresAt ||
      new Date() > user.resetCodeExpiresAt
    ) {
      return NextResponse.json({ error: 'Invalid or expired reset code' }, { status: 400 });
    }

    const passwordHash = await hashPassword(newPassword);
    await db
      .update(users)
      .set({
        passwordHash,
        resetCode: null,
        resetCodeExpiresAt: null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('reset-password error', err);
    return NextResponse.json({ error: 'Could not reset password' }, { status: 500 });
  }
}
