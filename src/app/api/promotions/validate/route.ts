import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { promotions } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getShopSettings } from '@/lib/settings';
import { hasCustomerUsedPromotion } from '@/lib/promotions';

const Schema = z.object({
  code: z.string().min(1).max(60),
  subtotalInPence: z.number().int().min(0),
  email: z.string().email().max(200).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = Schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }
    const { code, subtotalInPence, email } = parsed.data;
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

    if (email) {
      const shopSettings = await getShopSettings();
      if (
        shopSettings.promotions.singleUsePerCustomer &&
        (await hasCustomerUsedPromotion(email, promo.code))
      ) {
        return NextResponse.json(
          { error: "This discount code can only be used once, and it looks like you've already applied it." },
          { status: 400 }
        );
      }
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
