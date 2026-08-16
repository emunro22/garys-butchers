// Table definitions live in schema-catalog.ts (products/categories/etc, in
// the catalog DB) and schema-orders.ts (users/orders/etc, in the orders DB)
// — split so each can be pushed with drizzle-kit against its own database.
// This barrel keeps `import { X } from '@/lib/db/schema'` working unchanged
// for callers that only care about table/type shapes, not which DB client
// to use for them (see src/lib/db/index.ts for catalogDb/ordersDb).
export * from './schema-catalog';
export * from './schema-orders';
