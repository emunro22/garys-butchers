import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { hashPassword, generateVerificationCode } from '@/lib/auth';
import { sendVerificationCode } from '@/lib/email';

const Schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  phone: z.string().optional(),
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

    const { name, email, password, phone } = parsed.data;
    const normalizedEmail = email.toLowerCase().trim();

    const existing = await db
      .select({ id: users.id, emailVerified: users.emailVerified })
      .from(users)
      .where(eq(users.email, normalizedEmail))
      .limit(1);

    if (existing.length > 0) {
      if (existing[0].emailVerified) {
        return NextResponse.json(
          { error: 'An account with this email already exists' },
          { status: 409 }
        );
      }
      // Unverified account exists — update it with new details and resend code
      const code = generateVerificationCode();
      const passwordHash = await hashPassword(password);
      await db
        .update(users)
        .set({
          name,
          passwordHash,
          phone: phone || null,
          verificationCode: code,
          verificationCodeExpiresAt: new Date(Date.now() + 15 * 60 * 1000),
          updatedAt: new Date(),
        })
        .where(eq(users.id, existing[0].id));

      await sendVerificationCode(normalizedEmail, name, code);
      return NextResponse.json({ ok: true, email: normalizedEmail });
    }

    const code = generateVerificationCode();
    const passwordHash = await hashPassword(password);

    await db.insert(users).values({
      name,
      email: normalizedEmail,
      passwordHash,
      phone: phone || null,
      verificationCode: code,
      verificationCodeExpiresAt: new Date(Date.now() + 15 * 60 * 1000),
    });

    await sendVerificationCode(normalizedEmail, name, code);

    return NextResponse.json({ ok: true, email: normalizedEmail });
  } catch (err) {
    console.error('signup error', err);
    return NextResponse.json({ error: 'Could not create account' }, { status: 500 });
  }
}
