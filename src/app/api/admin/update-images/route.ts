import { type NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { products, categories } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

const PRODUCT_IMAGES: Array<[RegExp, string]> = [
  // ── Beef ──────────────────────────────────────────────────────────────────
  [/sirloin/i,              'https://images.unsplash.com/photo-1546964124-0cce460e0700?w=800&q=80'],
  [/popeseye/i,             'https://images.unsplash.com/photo-1607116667981-ff0f5b0c8c29?w=800&q=80'],
  [/rump steak/i,           'https://images.unsplash.com/photo-1607116667981-ff0f5b0c8c29?w=800&q=80'],
  [/roasting joint/i,       'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800&q=80'],
  [/diced beef/i,           'https://images.unsplash.com/photo-1529359536977-1ce2c7543cca?w=800&q=80'],
  [/steak mince|mince/i,    'https://images.unsplash.com/photo-1588347785-3f1e5b15c1a4?w=800&q=80'],
  [/beef olive/i,           'https://images.unsplash.com/photo-1544025162-d76538b2ed81?w=800&q=80'],
  // ── Pork ──────────────────────────────────────────────────────────────────
  [/pork loin steak/i,      'https://images.unsplash.com/photo-1529042410759-befb1204b468?w=800&q=80'],
  [/pork.*link/i,           'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80'],
  [/pork olive/i,           'https://images.unsplash.com/photo-1529042410759-befb1204b468?w=800&q=80'],
  // ── Chicken ───────────────────────────────────────────────────────────────
  [/chicken fillet/i,       'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=800&q=80'],
  [/chicken burger/i,       'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&q=80'],
  // ── Fish ──────────────────────────────────────────────────────────────────
  [/salmon/i,               'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=800&q=80'],
  [/haddock/i,              'https://images.unsplash.com/photo-1535637603896-07c179d71103?w=800&q=80'],
  [/prawn/i,                'https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?w=800&q=80'],
  [/cod/i,                  'https://images.unsplash.com/photo-1559847844-5315695dadae?w=800&q=80'],
  // ── Sausages & Burgers ────────────────────────────────────────────────────
  [/rump steak burger/i,    'https://images.unsplash.com/photo-1561758033-d89a9ad46330?w=800&q=80'],
  [/steak burger/i,         'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&q=80'],
  [/beef sausage|beef.*link/i, 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80'],
  // ── Pies & Bakery ─────────────────────────────────────────────────────────
  [/family steak pie/i,     'https://images.unsplash.com/photo-1621796359060-e56ca3fd26a0?w=800&q=80'],
  [/steak pie/i,            'https://images.unsplash.com/photo-1621796359060-e56ca3fd26a0?w=800&q=80'],
  [/scotch pie/i,           'https://images.unsplash.com/photo-1478145046317-39f10e56b5e9?w=800&q=80'],
  [/potato scone/i,         'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=800&q=80'],
  // ── Breakfast & Sides ─────────────────────────────────────────────────────
  [/square slice|lorne/i,   'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=800&q=80'],
  [/sweetcure bacon|bacon/i,'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=800&q=80'],
  [/black pudding/i,        'https://images.unsplash.com/photo-1551782450-a2132b4ba21d?w=800&q=80'],
  [/haggis/i,               'https://images.unsplash.com/photo-1551782450-a2132b4ba21d?w=800&q=80'],
  [/fruit pudding/i,        'https://images.unsplash.com/photo-1551782450-a2132b4ba21d?w=800&q=80'],
  [/egg/i,                  'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=800&q=80'],
  // ── Meat packs ────────────────────────────────────────────────────────────
  [/breakfast pack/i,       'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=800&q=80'],
  [/bbq/i,                  'https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?w=800&q=80'],
  [/slimmer/i,              'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=800&q=80'],
  [/fit pack/i,             'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=800&q=80'],
  [/muscle/i,               'https://images.unsplash.com/photo-1607623347174-e8c2f0cc9e20?w=800&q=80'],
  [/mid.?week/i,            'https://images.unsplash.com/photo-1607623347174-e8c2f0cc9e20?w=800&q=80'],
  [/7 day saver/i,          'https://images.unsplash.com/photo-1607623347174-e8c2f0cc9e20?w=800&q=80'],
  [/family pack/i,          'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800&q=80'],
  [/bumper/i,               'https://images.unsplash.com/photo-1607623347174-e8c2f0cc9e20?w=800&q=80'],
  [/manager.*special/i,     'https://images.unsplash.com/photo-1607623347174-e8c2f0cc9e20?w=800&q=80'],
  [/pack|special|saver/i,   'https://images.unsplash.com/photo-1607623347174-e8c2f0cc9e20?w=800&q=80'],
];

const CATEGORY_FALLBACKS: Record<string, string> = {
  beef:               'https://images.unsplash.com/photo-1546964124-0cce460e0700?w=800&q=80',
  pork:               'https://images.unsplash.com/photo-1529042410759-befb1204b468?w=800&q=80',
  chicken:            'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=800&q=80',
  fish:               'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=800&q=80',
  'sausages-burgers': 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&q=80',
  'pies-bakery':      'https://images.unsplash.com/photo-1621796359060-e56ca3fd26a0?w=800&q=80',
  'breakfast-sides':  'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=800&q=80',
  'meat-packs':       'https://images.unsplash.com/photo-1607623347174-e8c2f0cc9e20?w=800&q=80',
};

function pickImage(name: string, catSlug: string | null | undefined): string | null {
  for (const [pattern, url] of PRODUCT_IMAGES) {
    if (pattern.test(name)) return url;
  }
  return catSlug ? CATEGORY_FALLBACKS[catSlug] ?? null : null;
}

export async function POST(_req: NextRequest) {
  try {
    const allCats = await db.select().from(categories);
    const slugById = new Map(allCats.map((c) => [c.id, c.slug]));

    const allProducts = await db.select().from(products);
    const results: string[] = [];
    let updated = 0;
    let skipped = 0;

    for (const product of allProducts) {
      const catSlug = product.categoryId ? slugById.get(product.categoryId) : null;
      const imageUrl = pickImage(product.name, catSlug);
      if (!imageUrl) {
        skipped++;
        continue;
      }
      await db
        .update(products)
        .set({ imageUrl, updatedAt: new Date() })
        .where(eq(products.id, product.id));
      results.push(product.name);
      updated++;
    }

    return NextResponse.json({ updated, skipped, products: results });
  } catch (err) {
    console.error('update-images error', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
