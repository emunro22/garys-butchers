import { db } from '@/lib/db';
import { settings } from '@/lib/db/schema';

export const DEFAULT_SETTINGS = {
  shop: {
    name: "Gary's Butchers & Fishmongers",
    address: 'Bridgewater Shopping Centre, Erskine PA8 7AA',
    phone: '0141 555 1234',
  },
  delivery: {
    freeThresholdPence: 2500,
    feePence: 350,
    radiusMiles: 5,
  },
};

export type AppSettings = typeof DEFAULT_SETTINGS;

export async function getShopSettings(): Promise<AppSettings> {
  try {
    const rows = await db.select().from(settings);
    const result: AppSettings = {
      shop: { ...DEFAULT_SETTINGS.shop },
      delivery: { ...DEFAULT_SETTINGS.delivery },
    };
    for (const row of rows) {
      if (row.key === 'shop') {
        result.shop = { ...DEFAULT_SETTINGS.shop, ...(row.value as AppSettings['shop']) };
      } else if (row.key === 'delivery') {
        result.delivery = { ...DEFAULT_SETTINGS.delivery, ...(row.value as AppSettings['delivery']) };
      }
    }
    return result;
  } catch {
    return { shop: { ...DEFAULT_SETTINGS.shop }, delivery: { ...DEFAULT_SETTINGS.delivery } };
  }
}
