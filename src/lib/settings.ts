import { catalogDb } from '@/lib/db';
import { settings } from '@/lib/db/schema';
import type { SlotBlock, SlotGroupSettings } from '@/lib/slots';

export type SeasonalTheme = 'none' | 'christmas' | 'easter';

export const DEFAULT_SETTINGS = {
  shop: {
    name: "Gary's Butchers & Fishmongers",
    address: '19 Park Glade Shops, Erskine, PA8 7HH',
    phone: '0141 959 0478',
  },
  delivery: {
    freeUnderMiles: 5,
    midTierMiles: 10,
    midTierFeePence: 395,
    farFeePence: 500,
    radiusMiles: 30,
  },
  premiumDelivery: {
    enabled: true,
    minimumFeeInPence: 2000,
    ratePerKgInPence: 150,
    carriers: ['DHL', 'UPS', 'Parcelforce', 'Royal Mail'],
    description:
      "For bulk orders and deliveries outside our usual area, we'll confirm the exact price and courier once your order is weighed.",
  },
  banner: {
    messages: [
      '🥩  Free home delivery within 5 miles',
      '⭐  Rated 5/5 by our customers in Erskine',
      '🐟  Fresh fish delivered daily, Tuesday to Saturday',
      '🎁  Use code WELCOME10 for 10% off your first order',
    ],
    showCountdown: true,
    cutoffHour: 18,
  },
  promotions: {
    // When on, a customer (identified by the email on their order — account or
    // guest) can only ever redeem a given promo code once. See hasCustomerUsedPromotion.
    singleUsePerCustomer: false,
  },
  referrals: {
    enabled: true,
    // Percent off the referrer's next order, auto-applied once the person
    // they referred completes their first paid order. See src/lib/referrals.ts.
    rewardPercent: 5,
  },
  seasonal: {
    // Site-wide festive mode: recolours the storefront and adds decorative
    // overlays/banner. See src/components/seasonal/.
    theme: 'none' as SeasonalTheme,
  },
  deliverySlots: {
    blocks: [
      { id: 'morning', startMinutes: 540, endMinutes: 720, capacity: 8 },
      { id: 'midday', startMinutes: 720, endMinutes: 900, capacity: 8 },
      { id: 'afternoon', startMinutes: 900, endMinutes: 1080, capacity: 8 },
    ] as SlotBlock[],
    closedDays: [0] as number[],
    // Shop closes early on Saturdays (7:30–14:00) — no delivery slots starting
    // at or after 3pm that day.
    saturdayCutoffMinutes: 900 as number | null,
  } satisfies SlotGroupSettings,
  sameDay: {
    // A single window, not a slot the customer picks between — same-day
    // delivery is "order now, it arrives this evening," so every same-day
    // order shares one block and one combined capacity.
    blocks: [{ id: 'fiveEight', startMinutes: 1020, endMinutes: 1200, capacity: 20 }] as SlotBlock[],
    closedDays: [0] as number[],
    // Same-day can't be ordered before the shop opens (7:30am) — matches the
    // published hours on the about/contact pages.
    opensAtMinutes: 450 as number,
    // Same-day orders stop being taken at 2pm, well before the 5-8pm delivery
    // window itself, to leave enough time to prep and run the round.
    orderCutoffMinutes: 840 as number | null,
  } satisfies SlotGroupSettings,
  // Optional rush-delivery surcharge, added on top of the normal
  // distance-based delivery fee (see delivery above) — same-day orders are
  // still hand-delivered locally, so distance still matters, this is just
  // an extra charge for the same-day turnaround.
  sameDayFee: {
    enabled: false,
    feeInPence: 500,
  },
  pickupSlots: {
    blocks: [
      { id: 'p9', startMinutes: 540, endMinutes: 600, capacity: 20 },
      { id: 'p10', startMinutes: 600, endMinutes: 660, capacity: 20 },
      { id: 'p11', startMinutes: 660, endMinutes: 720, capacity: 20 },
      { id: 'p12', startMinutes: 720, endMinutes: 780, capacity: 20 },
      { id: 'p13', startMinutes: 780, endMinutes: 840, capacity: 20 },
      { id: 'p14', startMinutes: 840, endMinutes: 900, capacity: 20 },
      { id: 'p15', startMinutes: 900, endMinutes: 960, capacity: 20 },
      { id: 'p16', startMinutes: 960, endMinutes: 1020, capacity: 20 },
      { id: 'p17', startMinutes: 1020, endMinutes: 1080, capacity: 20 },
    ] as SlotBlock[],
    closedDays: [0] as number[],
    // Shop closes early on Saturdays (7:30–14:00) — no pickup slots starting
    // at or after 2pm that day.
    saturdayCutoffMinutes: 840 as number | null,
  } satisfies SlotGroupSettings,
};

export type AppSettings = typeof DEFAULT_SETTINGS;

/** Old rows only had a fixed capacity map keyed by a hardcoded block name — convert them
 *  onto the current default time boundaries so admin-set capacities aren't lost. */
function migrateSlotGroup(
  value: unknown,
  defaults: SlotGroupSettings,
  legacyKeyOrder: string[]
): SlotGroupSettings & { saturdayCutoffMinutes: number | null; orderCutoffMinutes: number | null } {
  if (value && typeof value === 'object' && Array.isArray((value as SlotGroupSettings).blocks)) {
    const v = value as SlotGroupSettings;
    return {
      blocks: v.blocks.length ? v.blocks : defaults.blocks,
      closedDays: Array.isArray(v.closedDays) ? v.closedDays : defaults.closedDays,
      // undefined (field predates this setting) falls back to the default
      // cutoff; null (admin explicitly turned it off) is kept as-is.
      saturdayCutoffMinutes:
        v.saturdayCutoffMinutes === null || typeof v.saturdayCutoffMinutes === 'number'
          ? v.saturdayCutoffMinutes
          : defaults.saturdayCutoffMinutes ?? null,
      orderCutoffMinutes:
        v.orderCutoffMinutes === null || typeof v.orderCutoffMinutes === 'number'
          ? v.orderCutoffMinutes
          : defaults.orderCutoffMinutes ?? null,
      opensAtMinutes: typeof v.opensAtMinutes === 'number' ? v.opensAtMinutes : defaults.opensAtMinutes,
    };
  }
  const legacyCapacity = (value as { capacity?: Record<string, number> } | undefined)?.capacity;
  if (legacyCapacity) {
    return {
      blocks: defaults.blocks.map((block, i) => ({
        ...block,
        capacity: legacyCapacity[legacyKeyOrder[i]] ?? block.capacity,
      })),
      closedDays: defaults.closedDays,
      saturdayCutoffMinutes: defaults.saturdayCutoffMinutes ?? null,
      orderCutoffMinutes: defaults.orderCutoffMinutes ?? null,
      opensAtMinutes: defaults.opensAtMinutes,
    };
  }
  return {
    ...defaults,
    saturdayCutoffMinutes: defaults.saturdayCutoffMinutes ?? null,
    orderCutoffMinutes: defaults.orderCutoffMinutes ?? null,
  };
}

export async function getShopSettings(): Promise<AppSettings> {
  const result: AppSettings = {
    shop: { ...DEFAULT_SETTINGS.shop },
    delivery: { ...DEFAULT_SETTINGS.delivery },
    premiumDelivery: { ...DEFAULT_SETTINGS.premiumDelivery, carriers: [...DEFAULT_SETTINGS.premiumDelivery.carriers] },
    banner: { ...DEFAULT_SETTINGS.banner },
    promotions: { ...DEFAULT_SETTINGS.promotions },
    referrals: { ...DEFAULT_SETTINGS.referrals },
    seasonal: { ...DEFAULT_SETTINGS.seasonal },
    deliverySlots: {
      blocks: [...DEFAULT_SETTINGS.deliverySlots.blocks],
      closedDays: [...DEFAULT_SETTINGS.deliverySlots.closedDays],
      saturdayCutoffMinutes: DEFAULT_SETTINGS.deliverySlots.saturdayCutoffMinutes,
    },
    sameDay: {
      blocks: [...DEFAULT_SETTINGS.sameDay.blocks],
      closedDays: [...DEFAULT_SETTINGS.sameDay.closedDays],
      opensAtMinutes: DEFAULT_SETTINGS.sameDay.opensAtMinutes,
      orderCutoffMinutes: DEFAULT_SETTINGS.sameDay.orderCutoffMinutes,
    },
    sameDayFee: { ...DEFAULT_SETTINGS.sameDayFee },
    pickupSlots: {
      blocks: [...DEFAULT_SETTINGS.pickupSlots.blocks],
      closedDays: [...DEFAULT_SETTINGS.pickupSlots.closedDays],
      saturdayCutoffMinutes: DEFAULT_SETTINGS.pickupSlots.saturdayCutoffMinutes,
    },
  };
  try {
    const rows = await catalogDb.select().from(settings);
    for (const row of rows) {
      if (row.key === 'shop') {
        result.shop = { ...DEFAULT_SETTINGS.shop, ...(row.value as AppSettings['shop']) };
      } else if (row.key === 'delivery') {
        result.delivery = { ...DEFAULT_SETTINGS.delivery, ...(row.value as AppSettings['delivery']) };
      } else if (row.key === 'premiumDelivery') {
        result.premiumDelivery = {
          ...DEFAULT_SETTINGS.premiumDelivery,
          ...(row.value as AppSettings['premiumDelivery']),
        };
      } else if (row.key === 'banner') {
        result.banner = { ...DEFAULT_SETTINGS.banner, ...(row.value as AppSettings['banner']) };
      } else if (row.key === 'promotions') {
        result.promotions = { ...DEFAULT_SETTINGS.promotions, ...(row.value as AppSettings['promotions']) };
      } else if (row.key === 'referrals') {
        result.referrals = { ...DEFAULT_SETTINGS.referrals, ...(row.value as AppSettings['referrals']) };
      } else if (row.key === 'seasonal') {
        result.seasonal = { ...DEFAULT_SETTINGS.seasonal, ...(row.value as AppSettings['seasonal']) };
      } else if (row.key === 'deliverySlots') {
        result.deliverySlots = migrateSlotGroup(row.value, DEFAULT_SETTINGS.deliverySlots, [
          'morning',
          'midday',
          'afternoon',
        ]);
      } else if (row.key === 'sameDay') {
        const migrated = migrateSlotGroup(row.value, DEFAULT_SETTINGS.sameDay, [
          'nineEleven',
          'elevenOne',
          'oneThree',
        ]);
        // opensAtMinutes is optional on the shared SlotGroupSettings type (only
        // sameDay uses it), but always defined on sameDay's own defaults.
        result.sameDay = { ...migrated, opensAtMinutes: migrated.opensAtMinutes ?? DEFAULT_SETTINGS.sameDay.opensAtMinutes };
      } else if (row.key === 'sameDayFee') {
        result.sameDayFee = { ...DEFAULT_SETTINGS.sameDayFee, ...(row.value as AppSettings['sameDayFee']) };
      } else if (row.key === 'pickupSlots') {
        result.pickupSlots = migrateSlotGroup(row.value, DEFAULT_SETTINGS.pickupSlots, []);
      }
    }
    return result;
  } catch {
    return result;
  }
}
