import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { promotions, products } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getShopSettings } from '@/lib/settings';
import { hasCustomerUsedPromotion } from '@/lib/promotions';
import { ensurePromotionsSchema } from '@/lib/db/ensure-schema';

const Schema = z.object({
  code: z.string().min(1).max(60),
  subtotalInPence: z.number().int().min(0),
  email: z.string().email().max(200).optional(),
  // Basket contents, used only to check a product-targeted code actually
  // matches something in the basket — never trusted for pricing (the real
  // discount amount is always recalculated server-side at checkout).
  items: z.array(z.object({ productId: z.string().uuid() })).optional(),
});

export async function POST(req: NextRequest) {
  try {
    await ensurePromotionsSchema();
    const body = await req.json();
    const parsed = Schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }
    const { code, subtotalInPence, email, items } = parsed.data;
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

    let productName: string | null = null;
    if (promo.productId) {
      const [product] = await db
        .select({ id: products.id, name: products.name })
        .from(products)
        .where(eq(products.id, promo.productId))
        .limit(1);
      productName = product?.name ?? null;
      const inBasket = (items ?? []).some((i) => i.productId === promo.productId);
      if (!inBasket) {
        return NextResponse.json(
          {
            error: productName
              ? `This code only applies to "${productName}" — add it to your basket to use it.`
              : 'This code only applies to a specific product that is no longer available.',
          },
          { status: 400 }
        );
      }
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
        productId: promo.productId,
        productName,
      },
    });
  } catch (err) {
    console.error('promo validate error', err);
    return NextResponse.json({ error: 'Could not check that code' }, { status: 500 });
  }
}
