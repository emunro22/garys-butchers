import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

/**
 * Consolidates steak products that have a size baked into their name (e.g. "7oz Sirloin Steak")
 * into a single product per cut with a variants array (e.g. "Sirloin Steak" with [{label:"7oz",...}]).
 * Safe to run multiple times — uses slug matching and skips if already consolidated.
 */
export async function POST() {
  const results: string[] = [];

  // Each entry: current slug, new name, new slug, weight label, existing price becomes the 7oz variant
  const steaks = [
    { oldSlug: '7oz-sirloin-steak',   newName: 'Sirloin Steak',   newSlug: 'sirloin-steak',   variantLabel: '7oz' },
    { oldSlug: '7oz-popeseye-steak',  newName: 'Popeseye Steak',  newSlug: 'popeseye-steak',  variantLabel: '7oz' },
    { oldSlug: '7oz-rump-steak',      newName: 'Rump Steak',      newSlug: 'rump-steak',      variantLabel: '7oz' },
    { oldSlug: '7oz-pork-loin-steak', newName: 'Pork Loin Steak', newSlug: 'pork-loin-steak', variantLabel: '7oz' },
  ];

  for (const s of steaks) {
    // Check if old slug exists
    const existing = await sql`SELECT id, price_in_pence, variants FROM products WHERE slug = ${s.oldSlug} LIMIT 1`;

    if (existing.rowCount === 0) {
      // Check if already migrated under new slug
      const migrated = await sql`SELECT id FROM products WHERE slug = ${s.newSlug} LIMIT 1`;
      if ((migrated.rowCount ?? 0) > 0) {
        results.push(`${s.newName}: already migrated, skipped`);
      } else {
        results.push(`${s.newName}: old product not found, skipped`);
      }
      continue;
    }

    const product = existing.rows[0];
    const currentVariants = Array.isArray(product.variants) ? product.variants : [];

    // Only add the variant if it's not already there
    const alreadyHasVariant = currentVariants.some((v: { label: string }) => v.label === s.variantLabel);
    const newVariants = alreadyHasVariant
      ? currentVariants
      : [{ label: s.variantLabel, priceInPence: product.price_in_pence }, ...currentVariants];

    await sql`
      UPDATE products
      SET
        name       = ${s.newName},
        slug       = ${s.newSlug},
        variants   = ${JSON.stringify(newVariants)}::jsonb,
        weight_label = NULL,
        updated_at = NOW()
      WHERE slug = ${s.oldSlug}
    `;

    results.push(`${s.newName}: updated (variant ${s.variantLabel} = ${product.price_in_pence}p)`);
  }

  return NextResponse.json({ ok: true, results });
}
