import {
  pgTable,
  text,
  varchar,
  timestamp,
  integer,
  boolean,
  jsonb,
  uuid,
  pgEnum,
  index,
  uniqueIndex,
  serial,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ---------- Enums ----------

export const orderStatusEnum = pgEnum('order_status', [
  'pending',
  'paid',
  'preparing',
  'ready',
  'completed',
  'cancelled',
  'refunded',
]);

export const fulfilmentEnum = pgEnum('fulfilment', ['pickup', 'delivery']);

export const promotionTypeEnum = pgEnum('promotion_type', [
  'percent_off',
  'amount_off',
  'free_delivery',
]);

// ---------- Tables ----------

export const categories = pgTable(
  'categories',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    name: varchar('name', { length: 120 }).notNull(),
    slug: varchar('slug', { length: 140 }).notNull(),
    description: text('description'),
    imageUrl: text('image_url'),
    sortOrder: integer('sort_order').default(0).notNull(),
    isActive: boolean('is_active').default(true).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    slugIdx: uniqueIndex('categories_slug_idx').on(t.slug),
  })
);

export const products = pgTable(
  'products',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    categoryId: uuid('category_id').references(() => categories.id, { onDelete: 'set null' }),
    name: varchar('name', { length: 200 }).notNull(),
    slug: varchar('slug', { length: 220 }).notNull(),
    description: text('description'),
    // price stored in pence (e.g. £10.95 -> 1095)
    priceInPence: integer('price_in_pence').notNull(),
    // optional compare-at price for "was £X" strikethroughs
    compareAtPriceInPence: integer('compare_at_price_in_pence'),
    imageUrl: text('image_url'),
    galleryUrls: jsonb('gallery_urls').$type<string[]>().default([]).notNull(),
    weightLabel: varchar('weight_label', { length: 80 }), // e.g. "approx 500g"
    // structured contents for meat packs (list of items in the box)
    packContents: jsonb('pack_contents').$type<string[]>().default([]).notNull(),
    isPack: boolean('is_pack').default(false).notNull(),
    isFeatured: boolean('is_featured').default(false).notNull(),
    isActive: boolean('is_active').default(true).notNull(),
    stockCount: integer('stock_count'), // null = unlimited / made fresh
    badge: varchar('badge', { length: 40 }), // "Bestseller", "New", etc.
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    slugIdx: uniqueIndex('products_slug_idx').on(t.slug),
    categoryIdx: index('products_category_idx').on(t.categoryId),
    activeIdx: index('products_active_idx').on(t.isActive),
  })
);

export const promotions = pgTable(
  'promotions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    code: varchar('code', { length: 60 }).notNull(),
    description: text('description'),
    type: promotionTypeEnum('type').notNull(),
    // value is percentage (1-100) for percent_off, or pence for amount_off, or 0 for free_delivery
    value: integer('value').notNull(),
    minimumOrderInPence: integer('minimum_order_in_pence').default(0).notNull(),
    maxRedemptions: integer('max_redemptions'), // null = unlimited
    redemptionCount: integer('redemption_count').default(0).notNull(),
    startsAt: timestamp('starts_at', { withTimezone: true }),
    endsAt: timestamp('ends_at', { withTimezone: true }),
    isActive: boolean('is_active').default(true).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    codeIdx: uniqueIndex('promotions_code_idx').on(t.code),
  })
);

export const orders = pgTable(
  'orders',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    orderNumber: serial('order_number').notNull(),
    customerName: varchar('customer_name', { length: 160 }).notNull(),
    customerEmail: varchar('customer_email', { length: 200 }).notNull(),
    customerPhone: varchar('customer_phone', { length: 40 }),
    fulfilment: fulfilmentEnum('fulfilment').notNull(),
    deliveryAddress: jsonb('delivery_address').$type<{
      line1: string;
      line2?: string;
      city: string;
      postcode: string;
    } | null>(),
    pickupSlot: timestamp('pickup_slot', { withTimezone: true }),
    deliverySlot: timestamp('delivery_slot', { withTimezone: true }),
    notes: text('notes'),
    items: jsonb('items')
      .$type<
        Array<{
          productId: string;
          name: string;
          priceInPence: number;
          quantity: number;
          imageUrl?: string;
        }>
      >()
      .notNull(),
    subtotalInPence: integer('subtotal_in_pence').notNull(),
    deliveryInPence: integer('delivery_in_pence').default(0).notNull(),
    discountInPence: integer('discount_in_pence').default(0).notNull(),
    totalInPence: integer('total_in_pence').notNull(),
    promotionCode: varchar('promotion_code', { length: 60 }),
    stripePaymentIntentId: varchar('stripe_payment_intent_id', { length: 200 }),
    status: orderStatusEnum('status').default('pending').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    statusIdx: index('orders_status_idx').on(t.status),
    emailIdx: index('orders_email_idx').on(t.customerEmail),
  })
);

export const reviews = pgTable('reviews', {
  id: uuid('id').defaultRandom().primaryKey(),
  authorName: varchar('author_name', { length: 160 }).notNull(),
  rating: integer('rating').notNull(),
  body: text('body').notNull(),
  source: varchar('source', { length: 60 }).default('google'),
  publishedAt: timestamp('published_at', { withTimezone: true }).defaultNow().notNull(),
  isFeatured: boolean('is_featured').default(false).notNull(),
});

export const settings = pgTable('settings', {
  key: varchar('key', { length: 80 }).primaryKey(),
  value: jsonb('value').notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const subscribers = pgTable(
  'subscribers',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    email: varchar('email', { length: 200 }).notNull(),
    name: varchar('name', { length: 160 }),
    source: varchar('source', { length: 60 }).default('website').notNull(),
    isActive: boolean('is_active').default(true).notNull(),
    subscribedAt: timestamp('subscribed_at', { withTimezone: true }).defaultNow().notNull(),
    unsubscribedAt: timestamp('unsubscribed_at', { withTimezone: true }),
  },
  (t) => ({
    emailIdx: uniqueIndex('subscribers_email_idx').on(t.email),
  })
);

// ---------- Relations ----------

export const categoriesRelations = relations(categories, ({ many }) => ({
  products: many(products),
}));

export const productsRelations = relations(products, ({ one }) => ({
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
}));

// ---------- Type exports ----------

export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;
export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
export type Promotion = typeof promotions.$inferSelect;
export type NewPromotion = typeof promotions.$inferInsert;
export type Order = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;
export type Review = typeof reviews.$inferSelect;
export type Subscriber = typeof subscribers.$inferSelect;
export type NewSubscriber = typeof subscribers.$inferInsert;