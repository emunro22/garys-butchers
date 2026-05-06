import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { promotions } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

const Schema = z.object({
  code: z.string().min(1).max(60),
  subtotalInPence: z.number().int().min(0),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = Schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }
    const { code, subtotalInPence } = parsed.data;
    const [promo] = await db
      .select()
      .from(promotions)
      .where(eq(promotions.code, code.toUpperCase()))
      .limit(1);

    if (!promo) {
      return NextResponse.json({ error: 'Code not recognised' }, { status: 404 });
    }
    if (!promo.isActive) {
      return NextResponse.json({ error: 'This code is no longer active' }, { status: 400 });
    }
    const now = new Date();
    if (promo.startsAt && new Date(promo.startsAt) > now) {
      return NextResponse.json({ error: 'This code is not yet valid' }, { status: 400 });
    }
    if (promo.endsAt && new Date(promo.endsAt) < now) {
      return NextResponse.json({ error: 'This code has expired' }, { status: 400 });
    }
    if (
      promo.maxRedemptions !== null &&
      promo.redemptionCount >= promo.maxRedemptions
    ) {
      return NextResponse.json({ error: 'This code has reached its limit' }, { status: 400 });
    }
    if (promo.minimumOrderInPence > subtotalInPence) {
      return NextResponse.json(
        {
          error: `Minimum order for this code is £${(promo.minimumOrderInPence / 100).toFixed(
            2
          )}`,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      promotion: {
        id: promo.id,
        code: promo.code,
        type: promo.type,
        value: promo.value,
        description: promo.description,
      },
    });
  } catch (err) {
    console.error('promo validate error', err);
    return NextResponse.json({ error: 'Could not check that code' }, { status: 500 });
  }
}
