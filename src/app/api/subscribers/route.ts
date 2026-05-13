import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { subscribers } from '@/lib/db/schema';
import { desc } from 'drizzle-orm';
import { getSession } from '@/lib/auth';

const SignupSchema = z.object({
  email: z.string().email().max(200),
  name: z.string().max(160).optional(),
  source: z.string().max(60).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = SignupSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Please enter a valid email address' },
        { status: 400 }
      );
    }
    const email = parsed.data.email.toLowerCase().trim();
    await db
      .insert(subscribers)
      .values({
        email,
        name: parsed.data.name ?? null,
        source: parsed.data.source ?? 'website',
        isActive: true,
      })
      .onConflictDoUpdate({
        target: subscribers.email,
        set: { isActive: true, unsubscribedAt: null },
      });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('subscriber POST error', err);
    return NextResponse.json(
      { error: 'Could not sign you up right now' },
      { status: 500 }
    );
  }
}

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const all = await db
      .select()
      .from(subscribers)
      .orderBy(desc(subscribers.subscribedAt));
    return NextResponse.json({ subscribers: all });
  } catch (err) {
    console.error('subscribers GET error', err);
    return NextResponse.json({ error: 'Could not load subscribers' }, { status: 500 });
  }
}