import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { signSession, setSessionCookie, verifyAdminLogin } from '@/lib/auth';

const Schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// Tiny in-memory rate limit (best-effort; reset on each cold start).
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
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  if (rateLimit(ip)) {
    return NextResponse.json({ error: 'Too many attempts, try again later' }, { status: 429 });
  }

  try {
    const body = await req.json();
    const parsed = Schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 400 });
    }
    const ok = await verifyAdminLogin(parsed.data.email, parsed.data.password);
    if (!ok) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }
    const token = await signSession({ email: parsed.data.email, role: 'admin' });
    await setSessionCookie(token);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('login error', err);
    return NextResponse.json({ error: 'Could not sign in' }, { status: 500 });
  }
}
