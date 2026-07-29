import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { generateVerificationCode } from '@/lib/auth';
import { sendPasswordResetCode } from '@/lib/email';
import { rateLimit, clientIp } from '@/lib/rate-limit';

const Schema = z.object({
  email: z.string().email(),
});

// Keeps this from being used to spam a target's inbox with reset codes.
const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;

export async function POST(req: NextRequest) {
  if (rateLimit(`forgot-password:${clientIp(req)}`, WINDOW_MS, MAX_ATTEMPTS)) {
    return NextResponse.json({ error: 'Too many attempts, try again later' }, { status: 429 });
  }

  try {
    const body = await req.json();
    const parsed = Schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Please enter a valid email' }, { status: 400 });
    }

    const normalizedEmail = parsed.data.email.toLowerCase().trim();

    const [user] = await db
      .select({ id: users.id, name: users.name, emailVerified: users.emailVerified })
      .from(users)
      .where(eq(users.email, normalizedEmail))
      .limit(1);

    // Always return success to prevent email enumeration
    if (!user || !user.emailVerified) {
      return NextResponse.json({ ok: true });
    }

    const code = generateVerificationCode();
    await db
      .update(users)
      .set({
        resetCode: code,
        resetCodeExpiresAt: new Date(Date.now() + 15 * 60 * 1000),
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));

    await sendPasswordResetCode(normalizedEmail, user.name, code);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('forgot-password error', err);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
