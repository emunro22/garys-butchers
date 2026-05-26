import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { settings } from '@/lib/db/schema';
import { getSession } from '@/lib/auth';
import { DEFAULT_SETTINGS } from '@/lib/settings';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const rows = await db.select().from(settings);
    const result: Record<string, unknown> = { ...DEFAULT_SETTINGS };
    for (const row of rows) {
      result[row.key] = row.value;
    }
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
  freeThresholdPence: z.number().int().min(0),
  feePence: z.number().int().min(0),
});

const PatchSchema = z.object({
  shop: ShopSchema.optional(),
  delivery: DeliverySchema.optional(),
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
      await db
        .insert(settings)
        .values({ key: 'shop', value: data.shop, updatedAt: new Date() })
        .onConflictDoUpdate({
          target: settings.key,
          set: { value: data.shop, updatedAt: new Date() },
        });
    }

    if (data.delivery) {
      await db
        .insert(settings)
        .values({ key: 'delivery', value: data.delivery, updatedAt: new Date() })
        .onConflictDoUpdate({
          target: settings.key,
          set: { value: data.delivery, updatedAt: new Date() },
        });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('settings PATCH error', err);
    return NextResponse.json({ error: 'Could not save settings' }, { status: 500 });
  }
}
