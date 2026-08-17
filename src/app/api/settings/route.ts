import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { catalogDb } from '@/lib/db';
import { settings } from '@/lib/db/schema';
import { getSession } from '@/lib/auth';
import { getShopSettings } from '@/lib/settings';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const result = await getShopSettings();
    return NextResponse.json({ settings: result });
  } catch (err) {
    console.error('settings GET error', err);
    return NextResponse.json({ error: 'Could not load settings' }, { status: 500 });
  }
}

const ShopSchema = z.object({
  name: z.string().min(1).max(200),
  address: z.string().min(1).max(500),
  phone: z.string().min(1).max(40),
});

const DeliverySchema = z.object({
  freeUnderMiles: z.number().min(0),
  midTierMiles: z.number().min(0),
  midTierFeePence: z.number().int().min(0),
  farFeePence: z.number().int().min(0),
  radiusMiles: z.number().min(0).max(100).optional(),
});

const PremiumDeliverySchema = z.object({
  enabled: z.boolean(),
  minimumFeeInPence: z.number().int().min(0),
  ratePerKgInPence: z.number().int().min(0),
  carriers: z.array(z.string().min(1).max(60)).max(12),
  description: z.string().max(500),
});

const BannerSchema = z.object({
  messages: z.array(z.string().min(1).max(200)).max(12),
  showCountdown: z.boolean(),
  cutoffHour: z.number().int().min(0).max(23),
});

const PromotionsSchema = z.object({
  singleUsePerCustomer: z.boolean(),
});

const ReferralsSchema = z.object({
  enabled: z.boolean(),
  rewardPercent: z.number().int().min(1).max(100),
});

const SeasonalSchema = z.object({
  theme: z.enum(['none', 'christmas', 'easter']),
});

const SlotBlockSchema = z
  .object({
    id: z.string().min(1).max(80),
    startMinutes: z.number().int().min(0).max(1439),
    endMinutes: z.number().int().min(0).max(1439),
    capacity: z.number().int().min(0),
  })
  .refine((b) => b.endMinutes >= b.startMinutes, {
    message: 'End time must be at or after start time',
  });

const SlotGroupSchema = z.object({
  blocks: z.array(SlotBlockSchema).max(48),
  closedDays: z.array(z.number().int().min(0).max(6)),
  saturdayCutoffMinutes: z.number().int().min(0).max(1439).nullish(),
  orderCutoffMinutes: z.number().int().min(0).max(1439).nullish(),
});

const SameDayFeeSchema = z.object({
  enabled: z.boolean(),
  feeInPence: z.number().int().min(0),
});

const PatchSchema = z.object({
  shop: ShopSchema.optional(),
  delivery: DeliverySchema.optional(),
  premiumDelivery: PremiumDeliverySchema.optional(),
  banner: BannerSchema.optional(),
  promotions: PromotionsSchema.optional(),
  referrals: ReferralsSchema.optional(),
  seasonal: SeasonalSchema.optional(),
  deliverySlots: SlotGroupSchema.optional(),
  sameDay: SlotGroupSchema.optional(),
  sameDayFee: SameDayFeeSchema.optional(),
  pickupSlots: SlotGroupSchema.optional(),
});

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const parsed = PatchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Please check the fields', issues: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const data = parsed.data;

    if (data.shop) {
      await catalogDb
        .insert(settings)
        .values({ key: 'shop', value: data.shop, updatedAt: new Date() })
        .onConflictDoUpdate({
          target: settings.key,
          set: { value: data.shop, updatedAt: new Date() },
        });
    }

    if (data.delivery) {
      await catalogDb
        .insert(settings)
        .values({ key: 'delivery', value: data.delivery, updatedAt: new Date() })
        .onConflictDoUpdate({
          target: settings.key,
          set: { value: data.delivery, updatedAt: new Date() },
        });
    }

    if (data.premiumDelivery) {
      await catalogDb
        .insert(settings)
        .values({ key: 'premiumDelivery', value: data.premiumDelivery, updatedAt: new Date() })
        .onConflictDoUpdate({
          target: settings.key,
          set: { value: data.premiumDelivery, updatedAt: new Date() },
        });
    }

    if (data.banner) {
      await catalogDb
        .insert(settings)
        .values({ key: 'banner', value: data.banner, updatedAt: new Date() })
        .onConflictDoUpdate({
          target: settings.key,
          set: { value: data.banner, updatedAt: new Date() },
        });
    }

    if (data.promotions) {
      await catalogDb
        .insert(settings)
        .values({ key: 'promotions', value: data.promotions, updatedAt: new Date() })
        .onConflictDoUpdate({
          target: settings.key,
          set: { value: data.promotions, updatedAt: new Date() },
        });
    }

    if (data.referrals) {
      await catalogDb
        .insert(settings)
        .values({ key: 'referrals', value: data.referrals, updatedAt: new Date() })
        .onConflictDoUpdate({
          target: settings.key,
          set: { value: data.referrals, updatedAt: new Date() },
        });
    }

    if (data.seasonal) {
      await catalogDb
        .insert(settings)
        .values({ key: 'seasonal', value: data.seasonal, updatedAt: new Date() })
        .onConflictDoUpdate({
          target: settings.key,
          set: { value: data.seasonal, updatedAt: new Date() },
        });
    }

    if (data.deliverySlots) {
      await catalogDb
        .insert(settings)
        .values({ key: 'deliverySlots', value: data.deliverySlots, updatedAt: new Date() })
        .onConflictDoUpdate({
          target: settings.key,
          set: { value: data.deliverySlots, updatedAt: new Date() },
        });
    }

    if (data.sameDay) {
      await catalogDb
        .insert(settings)
        .values({ key: 'sameDay', value: data.sameDay, updatedAt: new Date() })
        .onConflictDoUpdate({
          target: settings.key,
          set: { value: data.sameDay, updatedAt: new Date() },
        });
    }

    if (data.sameDayFee) {
      await catalogDb
        .insert(settings)
        .values({ key: 'sameDayFee', value: data.sameDayFee, updatedAt: new Date() })
        .onConflictDoUpdate({
          target: settings.key,
          set: { value: data.sameDayFee, updatedAt: new Date() },
        });
    }

    if (data.pickupSlots) {
      await catalogDb
        .insert(settings)
        .values({ key: 'pickupSlots', value: data.pickupSlots, updatedAt: new Date() })
        .onConflictDoUpdate({
          target: settings.key,
          set: { value: data.pickupSlots, updatedAt: new Date() },
        });
    }

    // The storefront layout and pages read settings via ISR (revalidate: 60),
    // so without this a saved change can sit stale — served from cache — for
    // up to a minute, and the *first* request after that only triggers a
    // background rebuild rather than showing the update itself. Busting the
    // whole layout tree on save makes admin changes (seasonal theme, banner,
    // delivery pricing, etc.) appear on the next page load instead.
    revalidatePath('/', 'layout');

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('settings PATCH error', err);
    return NextResponse.json({ error: 'Could not save settings' }, { status: 500 });
  }
}
