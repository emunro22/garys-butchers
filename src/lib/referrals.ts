import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq, isNull, and } from 'drizzle-orm';

// Excludes visually ambiguous characters (0/O, 1/I/L) since this gets typed
// or read aloud when a customer shares it.
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function generateReferralCode(): string {
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  }
  return code;
}

/** Returns this user's referral code, generating and persisting one on first use. */
export async function getOrCreateReferralCode(userId: string): Promise<string> {
  const [user] = await db.select({ referralCode: users.referralCode }).from(users).where(eq(users.id, userId)).limit(1);
  if (user?.referralCode) return user.referralCode;

  // Collisions are extremely unlikely (8 chars from a 33-char alphabet) but
  // the unique index means a clash would 500 the request, so retry a few times.
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateReferralCode();
    try {
      const [updated] = await db
        .update(users)
        .set({ referralCode: code })
        .where(and(eq(users.id, userId), isNull(users.referralCode)))
        .returning({ referralCode: users.referralCode });
      if (updated) return updated.referralCode!;
    } catch {
      // Unique constraint collision with another user's code — retry with a new one.
    }
    // Someone else set it concurrently — re-check current value.
    const [recheck] = await db.select({ referralCode: users.referralCode }).from(users).where(eq(users.id, userId)).limit(1);
    if (recheck?.referralCode) return recheck.referralCode;
  }
  throw new Error('Could not generate a unique referral code');
}
