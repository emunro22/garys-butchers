/**
 * Copies users/orders/referrals/subscriptions/subscribers from the old
 * single database (POSTGRES_URL) into the new orders database
 * (ORDERS_DATABASE_URL). Idempotent — safe to re-run any number of times,
 * before or after cutover: every row is upserted by primary key, so a
 * re-run just re-syncs anything that changed since the last run.
 *
 * Run with: npm run db:migrate-orders-data
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

import postgres from 'postgres';

const oldConnectionString = process.env.POSTGRES_URL;
const newConnectionString = process.env.ORDERS_DATABASE_URL;

if (!oldConnectionString || !newConnectionString) {
  console.error('Both POSTGRES_URL and ORDERS_DATABASE_URL must be set (see .env.local)');
  process.exit(1);
}

const oldDb = postgres(oldConnectionString);
const newDb = postgres(newConnectionString);

// Order matters: users has no dependency, orders/referrals reference users,
// subscriptions/subscribers are independent. Copying in this order means a
// partial run never leaves a dangling reference on the new DB.
const TABLES = ['users', 'orders', 'referrals', 'subscriptions', 'subscribers'] as const;

async function copyTable(table: string) {
  const rows = await oldDb`SELECT * FROM ${oldDb(table)}`;
  if (rows.length === 0) {
    console.log(`  ${table}: 0 rows (nothing to copy)`);
    return { copied: 0, oldCount: 0 };
  }

  const columns = Object.keys(rows[0]);
  // Column names come from our own schema (Object.keys of a row we just
  // read), never from external input, so nesting them into an unsafe
  // fragment for the SET clause is safe — see "nest sql.unsafe within a
  // safe sql expression" in the postgres-js README.
  const updateSetClause = columns
    .filter((c) => c !== 'id')
    .map((c) => `"${c}" = excluded."${c}"`)
    .join(', ');

  let copied = 0;
  // Batch to keep each statement reasonably sized.
  const BATCH_SIZE = 500;
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    await newDb`
      INSERT INTO ${newDb(table)} ${newDb(batch, ...columns)}
      ON CONFLICT (id) DO UPDATE SET ${newDb.unsafe(updateSetClause)}
    `;
    copied += batch.length;
  }
  console.log(`  ${table}: copied ${copied} rows`);
  return { copied, oldCount: rows.length };
}

async function main() {
  console.log('Copying orders-domain tables from old DB -> new orders DB...\n');

  for (const table of TABLES) {
    await copyTable(table);
  }

  // orders.order_number is assigned via nextval('orders_order_number_seq'),
  // which isn't part of the row data above — advance the new DB's sequence
  // past whatever the highest copied order number is, so the next paid
  // order on the new DB doesn't collide with (or restart before) history.
  const [{ max_order_number }] = await newDb`
    SELECT COALESCE(MAX(order_number), 0) AS max_order_number FROM orders
  `;
  await newDb`SELECT setval('orders_order_number_seq', ${max_order_number})`;
  console.log(`\norders_order_number_seq advanced to ${max_order_number}`);

  console.log('\nVerifying row counts (old vs new)...');
  for (const table of TABLES) {
    const [{ count: oldCount }] = await oldDb`SELECT count(*)::int AS count FROM ${oldDb(table)}`;
    const [{ count: newCount }] = await newDb`SELECT count(*)::int AS count FROM ${newDb(table)}`;
    const flag = oldCount === newCount ? 'OK' : 'MISMATCH';
    console.log(`  ${table}: old=${oldCount} new=${newCount} [${flag}]`);
  }

  await oldDb.end();
  await newDb.end();
  console.log('\nDone.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
