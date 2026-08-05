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
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS referral_code varchar(12)`;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS referred_by_user_id uuid REFERENCES users(id) ON DELETE SET NULL`;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS referral_credits_available integer NOT NULL DEFAULT 0`;
    // Postgres unique indexes allow any number of NULLs, so this is safe
    // ahead of referral codes being backfilled lazily per-user.
    await sql`CREATE UNIQUE INDEX IF NOT EXISTS users_referral_code_idx ON users (referral_code)`;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_customer_id varchar(200)`;
  } catch { /* already exists */ }
}

export async function ensureOrdersSchema() {
  try {
    await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS weight_grams integer`;
    await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS courier_name varchar(60)`;
    await sql`ALTER TYPE fulfilment ADD VALUE IF NOT EXISTS 'premium'`;
    await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS printed_at timestamptz`;
    await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS referral_credit_redeemed boolean NOT NULL DEFAULT false`;
    await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS subscription_id uuid`;
    await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS stripe_invoice_id varchar(200)`;
    await sql`CREATE UNIQUE INDEX IF NOT EXISTS orders_stripe_invoice_idx ON orders (stripe_invoice_id)`;
  } catch { /* already exists */ }
}

// Referrals is a brand-new table (not an alter of an existing one), so unlike
// the guards above this only needs to be called from the handful of new
// routes that actually touch it.
export async function ensureReferralsSchema() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS referrals (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        referrer_user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        referred_user_id uuid NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
        status varchar(20) NOT NULL DEFAULT 'pending',
        qualifying_order_id uuid REFERENCES orders(id) ON DELETE SET NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        rewarded_at timestamptz
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS referrals_referrer_idx ON referrals (referrer_user_id)`;
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
    await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS is_subscribable boolean NOT NULL DEFAULT false`;
    await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS sale_enabled boolean NOT NULL DEFAULT true`;
  } catch { /* already exists */ }
}

// Brand-new table — only needs to be called from the routes that touch it.
export async function ensureSubscriptionsSchema() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS subscriptions (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        stripe_subscription_id varchar(200),
        stripe_customer_id varchar(200),
        status varchar(20) NOT NULL DEFAULT 'pending',
        items jsonb NOT NULL,
        subtotal_in_pence integer NOT NULL,
        fulfilment varchar(20) NOT NULL,
        delivery_address jsonb,
        preferred_block_id varchar(80) NOT NULL,
        preferred_day_of_month integer NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        cancelled_at timestamptz
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS subscriptions_user_idx ON subscriptions (user_id)`;
    await sql`CREATE UNIQUE INDEX IF NOT EXISTS subscriptions_stripe_sub_idx ON subscriptions (stripe_subscription_id)`;
  } catch { /* already exists */ }
}
