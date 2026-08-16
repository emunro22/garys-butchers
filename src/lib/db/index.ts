import { drizzle } from 'drizzle-orm/vercel-postgres';
import { sql } from '@vercel/postgres';
import postgres from 'postgres';
import { drizzle as drizzlePostgresJs } from 'drizzle-orm/postgres-js';
import * as catalogSchema from './schema-catalog';
import * as ordersSchema from './schema-orders';

// Catalog DB (products/categories/promotions/deals/reviews/settings/
// analytics) — unchanged from before the split: the existing Vercel
// Postgres integration, reading POSTGRES_URL.
export const catalogDb = drizzle(sql, { schema: catalogSchema });

// Orders DB (users/orders/referrals/subscriptions/subscribers) — a second,
// independent Neon database, reading ORDERS_DATABASE_URL.
const ordersConnectionString = process.env.ORDERS_DATABASE_URL!;
export const ordersClient = postgres(ordersConnectionString);
export const ordersDb = drizzlePostgresJs(ordersClient, { schema: ordersSchema });

export * from './schema';
