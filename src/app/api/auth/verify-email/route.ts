import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { signCustomerSession, setCustomerSessionCookie } from '@/lib/auth';
import { sendNewCustomerNotification } from '@/lib/email';
import { rateLimit } from '@/lib/rate-limit';

const Schema = z.object({
  email: z.string().email(),
  code: z.string().length(6),
});

// Codes are 6 digits (1M possibilities) — cap attempts per email so the
// window can't be brute-forced before it expires.
const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 10;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = Schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    const { email, code } = parsed.data;
    const normalizedEmail = email.toLowerCase().trim();

    if (rateLimit(`verify-email:${normalizedEmail}`, WINDOW_MS, MAX_ATTEMPTS)) {
      return NextResponse.json(
        { error: 'Too many attempts — please request a new code and try again shortly.' },
        { status: 429 }
      );
    }

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
