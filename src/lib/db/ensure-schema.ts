import { sql } from '@vercel/postgres';

// This repo has no committed migrations folder — schema changes are applied
// live via guarded, idempotent statements like these instead of a migration
// runner. Any column/enum value added after a table's original creation
// needs one of these, called from every code path that queries the table
// with an unqualified `.select()`/`.returning()` (Drizzle expands those to
// every column it knows about, including new ones) — missing just one call
// site means that route 500s or silently falls back to empty data the
// moment it's hit, which is exactly what happened before this file existed:
// customer login, the admin dashboard, and checkout all broke at once
// because `users`/`orders` gained columns the live table didn't have yet.
//
// Each function is idempotent and cheap once the column/value exists, so
// it's safe to call on every request rather than trying to call it exactly
// once somewhere central.

export async function ensureUsersSchema() {
  try {
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS premium_delivery_eligible boolean NOT NULL DEFAULT false`;
  } catch { /* already exists */ }
}

export async function ensureOrdersSchema() {
  try {
    await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS weight_grams integer`;
    await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS courier_name varchar(60)`;
    await sql`ALTER TYPE fulfilment ADD VALUE IF NOT EXISTS 'premium'`;
    await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS printed_at timestamptz`;
  } catch { /* already exists */ }
}

// variants/marinades were previously guarded inline in only a handful of the
// routes that touch `products` (see the file-level comment above for what
// that pattern costs) — every unqualified `.select()`/`.returning()` against
// `products` needs this called first.
export async function ensureProductsSchema() {
  try {
    await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS variants jsonb NOT NULL DEFAULT '[]'::jsonb`;
    await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS marinades jsonb NOT NULL DEFAULT '[]'::jsonb`;
  } catch { /* already exists */ }
}
