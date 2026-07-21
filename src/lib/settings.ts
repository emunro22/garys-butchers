import { db } from '@/lib/db';
import { settings } from '@/lib/db/schema';

export const DEFAULT_SETTINGS = {
  shop: {
    name: "Gary's Butchers & Fishmongers",
    address: '19 Park Glade Shops, Erskine, PA8 7HH',
    phone: '0141 959 0478',
  },
  delivery: {
    freeThresholdPence: 2500,
    feePence: 350,
    radiusMiles: 10,
    premiumFeePence: 500,
  },
  banner: {
    messages: [
      '🥩  Free home delivery on orders over £25',
      '⭐  Rated 5/5 by our customers in Erskine',
      '🐟  Fresh fish delivered daily — Tuesday to Saturday',
      '🎁  Use code WELCOME10 for 10% off your first order',
    ],
    showCountdown: true,
    cutoffHour: 18,
  },
  deliverySlots: {
    capacity: {
      morning: 8,
      midday: 8,
      afternoon: 8,
    },
  },
};

export type AppSettings = typeof DEFAULT_SETTINGS;

export async function getShopSettings(): Promise<AppSettings> {
  try {
    const rows = await db.select().from(settings);
    const result: AppSettings = {
      shop: { ...DEFAULT_SETTINGS.shop },
      delivery: { ...DEFAULT_SETTINGS.delivery },
      banner: { ...DEFAULT_SETTINGS.banner },
      deliverySlots: {
        capacity: { ...DEFAULT_SETTINGS.deliverySlots.capacity },
      },
    };
    for (const row of rows) {
      if (row.key === 'shop') {
        result.shop = { ...DEFAULT_SETTINGS.shop, ...(row.value as AppSettings['shop']) };
      } else if (row.key === 'delivery') {
        result.delivery = { ...DEFAULT_SETTINGS.delivery, ...(row.value as AppSettings['delivery']) };
      } else if (row.key === 'banner') {
        result.banner = { ...DEFAULT_SETTINGS.banner, ...(row.value as AppSettings['banner']) };
      } else if (row.key === 'deliverySlots') {
        const value = row.value as AppSettings['deliverySlots'];
        result.deliverySlots = {
          capacity: { ...DEFAULT_SETTINGS.deliverySlots.capacity, ...value?.capacity },
        };
      }
    }
    return result;
  } catch {
    return {
      shop: { ...DEFAULT_SETTINGS.shop },
      delivery: { ...DEFAULT_SETTINGS.delivery },
      banner: { ...DEFAULT_SETTINGS.banner },
      deliverySlots: {
        capacity: { ...DEFAULT_SETTINGS.deliverySlots.capacity },
      },
    };
  }
}
