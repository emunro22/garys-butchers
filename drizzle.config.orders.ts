import type { Config } from 'drizzle-kit';
import 'dotenv/config';
import { config } from 'dotenv';

// Load .env.local explicitly (dotenv defaults to .env only)
config({ path: '.env.local' });

export default {
  schema: './src/lib/db/schema-orders.ts',
  out: './drizzle/orders',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.ORDERS_DATABASE_URL!,
  },
  verbose: true,
  strict: true,
} satisfies Config;
