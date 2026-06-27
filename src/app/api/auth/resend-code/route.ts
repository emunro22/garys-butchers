import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { generateVerificationCode } from '@/lib/auth';
import { sendVerificationCode } from '@/lib/email';

const Schema = z.object({
  email: z.string().email(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = Schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
    }

    const normalizedEmail = parsed.data.email.toLowerCase().trim();

    const [user] = await db
      .select({ id: users.id, name: users.name, emailVerified: users.emailVerified })
      .from(users)
      .where(eq(users.email, normalizedEmail))
      .limit(1);

    if (!user || user.emailVerified) {
      return NextResponse.json({ ok: true });
    }

    const code = generateVerificationCode();
    await db
      .update(users)
      .set({
        verificationCode: code,
        verificationCodeExpiresAt: new Date(Date.now() + 15 * 60 * 1000),
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));

    await sendVerificationCode(normalizedEmail, user.name, code);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('resend-code error', err);
    return NextResponse.json({ error: 'Could not resend code' }, { status: 500 });
  }
}
