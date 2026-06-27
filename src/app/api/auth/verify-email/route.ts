import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { signCustomerSession, setCustomerSessionCookie } from '@/lib/auth';
import { sendNewCustomerNotification } from '@/lib/email';

const Schema = z.object({
  email: z.string().email(),
  code: z.string().length(6),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = Schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    const { email, code } = parsed.data;
    const normalizedEmail = email.toLowerCase().trim();

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, normalizedEmail))
      .limit(1);

    if (!user) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    if (user.emailVerified) {
      return NextResponse.json({ error: 'Email already verified' }, { status: 400 });
    }

    if (
      user.verificationCode !== code ||
      !user.verificationCodeExpiresAt ||
      new Date() > user.verificationCodeExpiresAt
    ) {
      return NextResponse.json(
        { error: 'Invalid or expired verification code' },
        { status: 400 }
      );
    }

    await db
      .update(users)
      .set({
        emailVerified: true,
        verificationCode: null,
        verificationCodeExpiresAt: null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));

    const token = await signCustomerSession({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });
    await setCustomerSessionCookie(token);

    try {
      await sendNewCustomerNotification({
        name: user.name,
        email: user.email,
        phone: user.phone,
      });
    } catch (e) {
      console.error('new-customer notification failed', e);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('verify-email error', err);
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 });
  }
}
