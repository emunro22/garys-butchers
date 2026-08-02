import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { users, referrals } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { hashPassword, generateVerificationCode } from '@/lib/auth';
import { sendVerificationCode } from '@/lib/email';
import { ensureUsersSchema, ensureReferralsSchema } from '@/lib/db/ensure-schema';

const Schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  phone: z.string().optional(),
  referralCode: z.string().max(12).optional(),
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

    const { name, email, password, phone, referralCode } = parsed.data;
    const normalizedEmail = email.toLowerCase().trim();

    await ensureUsersSchema();

    // A bad/unknown code should never block signup — just skip attribution.
    let referrerUserId: string | null = null;
    if (referralCode) {
      const [referrer] = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.referralCode, referralCode.toUpperCase().trim()))
        .limit(1);
      referrerUserId = referrer?.id ?? null;
    }

    const existing = await db
      .select({ id: users.id, emailVerified: users.emailVerified, referredByUserId: users.referredByUserId })
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
      // Unverified account exists — update it with new details and resend code.
      // Referral attribution is set once and never overwritten on a resend.
      const attributeReferrer =
        referrerUserId && !existing[0].referredByUserId && referrerUserId !== existing[0].id
          ? referrerUserId
          : null;
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
          ...(attributeReferrer ? { referredByUserId: attributeReferrer } : {}),
        })
        .where(eq(users.id, existing[0].id));

      if (attributeReferrer) {
        await recordPendingReferral(attributeReferrer, existing[0].id);
      }

      await sendVerificationCode(normalizedEmail, name, code);
      return NextResponse.json({ ok: true, email: normalizedEmail });
    }

    const code = generateVerificationCode();
    const passwordHash = await hashPassword(password);

    const [created] = await db
      .insert(users)
      .values({
        name,
        email: normalizedEmail,
        passwordHash,
        phone: phone || null,
        verificationCode: code,
        verificationCodeExpiresAt: new Date(Date.now() + 15 * 60 * 1000),
        referredByUserId: referrerUserId,
      })
      .returning({ id: users.id });

    if (referrerUserId && referrerUserId !== created.id) {
      await recordPendingReferral(referrerUserId, created.id);
    }

    await sendVerificationCode(normalizedEmail, name, code);

    return NextResponse.json({ ok: true, email: normalizedEmail });
  } catch (err) {
    console.error('signup error', err);
    return NextResponse.json({ error: 'Could not create account' }, { status: 500 });
  }
}

async function recordPendingReferral(referrerUserId: string, referredUserId: string) {
  await ensureReferralsSchema();
  await db
    .insert(referrals)
    .values({ referrerUserId, referredUserId, status: 'pending' })
    .onConflictDoNothing({ target: referrals.referredUserId });
}
