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
  } catch { /* already exists */ }
}
