import { db } from '@/lib/db';
import { settings } from '@/lib/db/schema';
import type { SlotBlock, SlotGroupSettings } from '@/lib/slots';

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
      "For bulk orders and deliveries outside our usual area — we'll confirm the exact price and courier once your order is weighed.",
  },
  banner: {
    messages: [
      '🥩  Free home delivery within 5 miles',
      '⭐  Rated 5/5 by our customers in Erskine',
      '🐟  Fresh fish delivered daily — Tuesday to Saturday',
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
  deliverySlots: {
    blocks: [
      { id: 'morning', startMinutes: 540, endMinutes: 720, capacity: 8 },
      { id: 'midday', startMinutes: 720, endMinutes: 900, capacity: 8 },
      { id: 'afternoon', startMinutes: 900, endMinutes: 1080, capacity: 8 },
    ] as SlotBlock[],
    closedDays: [0] as number[],
  } satisfies SlotGroupSettings,
  sameDay: {
    // A single window, not a slot the customer picks between — same-day
    // delivery is "order now, it arrives this evening," so every same-day
    // order shares one block and one combined capacity.
    blocks: [{ id: 'fiveEight', startMinutes: 1020, endMinutes: 1200, capacity: 20 }] as SlotBlock[],
    closedDays: [0] as number[],
  } satisfies SlotGroupSettings,
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
  } satisfies SlotGroupSettings,
};

export type AppSettings = typeof DEFAULT_SETTINGS;

/** Old rows only had a fixed capacity map keyed by a hardcoded block name — convert them
 *  onto the current default time boundaries so admin-set capacities aren't lost. */
function migrateSlotGroup(
  value: unknown,
  defaults: SlotGroupSettings,
  legacyKeyOrder: string[]
): SlotGroupSettings {
  if (value && typeof value === 'object' && Array.isArray((value as SlotGroupSettings).blocks)) {
    const v = value as SlotGroupSettings;
    return {
      blocks: v.blocks.length ? v.blocks : defaults.blocks,
      closedDays: Array.isArray(v.closedDays) ? v.closedDays : defaults.closedDays,
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
    };
  }
  return defaults;
}

export async function getShopSettings(): Promise<AppSettings> {
  const result: AppSettings = {
    shop: { ...DEFAULT_SETTINGS.shop },
    delivery: { ...DEFAULT_SETTINGS.delivery },
    premiumDelivery: { ...DEFAULT_SETTINGS.premiumDelivery, carriers: [...DEFAULT_SETTINGS.premiumDelivery.carriers] },
    banner: { ...DEFAULT_SETTINGS.banner },
    promotions: { ...DEFAULT_SETTINGS.promotions },
    referrals: { ...DEFAULT_SETTINGS.referrals },
    deliverySlots: { blocks: [...DEFAULT_SETTINGS.deliverySlots.blocks], closedDays: [...DEFAULT_SETTINGS.deliverySlots.closedDays] },
    sameDay: { blocks: [...DEFAULT_SETTINGS.sameDay.blocks], closedDays: [...DEFAULT_SETTINGS.sameDay.closedDays] },
    pickupSlots: { blocks: [...DEFAULT_SETTINGS.pickupSlots.blocks], closedDays: [...DEFAULT_SETTINGS.pickupSlots.closedDays] },
  };
  try {
    const rows = await db.select().from(settings);
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
      } else if (row.key === 'deliverySlots') {
        result.deliverySlots = migrateSlotGroup(row.value, DEFAULT_SETTINGS.deliverySlots, [
          'morning',
          'midday',
          'afternoon',
        ]);
      } else if (row.key === 'sameDay') {
        result.sameDay = migrateSlotGroup(row.value, DEFAULT_SETTINGS.sameDay, [
          'nineEleven',
          'elevenOne',
          'oneThree',
        ]);
      } else if (row.key === 'pickupSlots') {
        result.pickupSlots = migrateSlotGroup(row.value, DEFAULT_SETTINGS.pickupSlots, []);
      }
    }
    return result;
  } catch {
    return result;
  }
}
