import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { comparePassword, signCustomerSession, setCustomerSessionCookie, signSession, setSessionCookie } from '@/lib/auth';

const Schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const attempts = new Map<string, { count: number; firstAt: number }>();
const WINDOW_MS = 5 * 60 * 1000;
const MAX_ATTEMPTS = 8;

function rateLimit(key: string) {
  const now = Date.now();
  const entry = attempts.get(key);
  if (!entry || now - entry.firstAt > WINDOW_MS) {
    attempts.set(key, { count: 1, firstAt: now });
    return false;
  }
  entry.count += 1;
  return entry.count > MAX_ATTEMPTS;
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  if (rateLimit(ip)) {
    return NextResponse.json({ error: 'Too many attempts, try again later' }, { status: 429 });
  }

  try {
    const body = await req.json();
    const parsed = Schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 400 });
    }

    const { email, password } = parsed.data;
    const normalizedEmail = email.toLowerCase().trim();

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, normalizedEmail))
      .limit(1);

    if (!user) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    if (!user.emailVerified) {
      return NextResponse.json(
        { error: 'Please verify your email first', needsVerification: true, email: normalizedEmail },
        { status: 403 }
      );
    }

    const valid = await comparePassword(password, user.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const token = await signCustomerSession({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });
    await setCustomerSessionCookie(token);

    if (user.role === 'admin') {
      const adminToken = await signSession({ email: user.email, role: 'admin' });
      await setSessionCookie(adminToken);
    }

    return NextResponse.json({ ok: true, user: { name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    console.error('customer-login error', err);
    return NextResponse.json({ error: 'Could not sign in' }, { status: 500 });
  }
}
