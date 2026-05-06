import type { Config } from 'drizzle-kit';
import 'dotenv/config';
import { config } from 'dotenv';

// Load .env.local explicitly (dotenv defaults to .env only)
config({ path: '.env.local' });

export default {
  schema: './src/lib/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.POSTGRES_URL!,
  },
  verbose: true,
  strict: true,
} satisfies Config;