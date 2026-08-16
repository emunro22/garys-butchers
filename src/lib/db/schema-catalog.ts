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
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ---------- Enums ----------

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
    cookingTips: text('cooking_tips'),
    ingredients: text('ingredients'),
    allergyInfo: text('allergy_info'),
    nutritionInfo: text('nutrition_info'),
    // structured contents for meat packs (list of items in the box)
    packContents: jsonb('pack_contents').$type<string[]>().default([]).notNull(),
    // size variants (e.g. [{label:"7oz",priceInPence:999},{label:"10oz",priceInPence:1299}]).
    // compareAtPriceInPence mirrors the product-level discount field, but per size.
    variants: jsonb('variants').$type<Array<{
      label: string;
      priceInPence: number;
      compareAtPriceInPence?: number;
    }>>().default([]).notNull(),
    // optional marinade choices (e.g. ["Peri Peri","Lemon & Herb","Plain"]) — a
    // product only gets a marinade dropdown on its page when this is non-empty,
    // so this list doubles as the admin on/off switch per product.
    marinades: jsonb('marinades').$type<string[]>().default([]).notNull(),
    isPack: boolean('is_pack').default(false).notNull(),
    isFeatured: boolean('is_featured').default(false).notNull(),
    isActive: boolean('is_active').default(true).notNull(),
    stockCount: integer('stock_count'), // null = unlimited / made fresh
    badge: varchar('badge', { length: 40 }), // "Bestseller", "New", etc.
    // extra days notice needed beyond the normal earliest slot (0 = no extra notice required)
    noticeDays: integer('notice_days').default(0).notNull(),
    // Admin-only flag: whether this product can be added to a customer's
    // build-your-own subscription (see /subscriptions/build). Off by default —
    // day-fresh items like fish generally shouldn't be offered as a fixed
    // recurring monthly item.
    isSubscribable: boolean('is_subscribable').default(false).notNull(),
    // Admin-curated placement on /shop/offers — independent of whether a
    // discounted price is set, so a product can be featured there without
    // one, or discounted without appearing there.
    showOnOffers: boolean('show_on_offers').default(false).notNull(),
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
    // empty = store-wide code (applies to the whole discountable subtotal,
    // as before). When set, the code only applies if at least one of these
    // products is in the basket, and the discount is calculated against
    // just the matching products' line total, not the rest of the order.
    productIds: jsonb('product_ids').$type<string[]>().default([]).notNull(),
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

export const analyticsEventTypeEnum = pgEnum('analytics_event_type', ['pageview', 'click']);

export const analyticsEvents = pgTable(
  'analytics_events',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    type: analyticsEventTypeEnum('type').notNull(),
    path: varchar('path', { length: 300 }).notNull(),
    label: varchar('label', { length: 200 }),
    sessionId: varchar('session_id', { length: 40 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    typeIdx: index('analytics_events_type_idx').on(t.type),
    createdAtIdx: index('analytics_events_created_at_idx').on(t.createdAt),
    pathIdx: index('analytics_events_path_idx').on(t.path),
  })
);

export const dealCategoryEnum = pgEnum('deal_category', [
  'christmas',
  'easter',
  'summer-bbq',
  'general',
]);

export const dealStatusEnum = pgEnum('deal_status', ['draft', 'published']);

export const deals = pgTable('deals', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: varchar('title', { length: 200 }).notNull(),
  description: text('description'),
  category: dealCategoryEnum('category').default('general').notNull(),
  imageUrl: text('image_url'),
  badgeText: varchar('badge_text', { length: 80 }),
  status: dealStatusEnum('status').default('draft').notNull(),
  startsAt: timestamp('starts_at', { withTimezone: true }),
  endsAt: timestamp('ends_at', { withTimezone: true }),
  // Items bundled in this deal — stored as [{productId, quantity}]
  dealItems: jsonb('deal_items').$type<Array<{ productId: string; quantity: number }>>().default([]).notNull(),
  // Optional override price in pence (null = sum of item prices)
  dealPrice: integer('deal_price'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

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
export type Review = typeof reviews.$inferSelect;
export type Deal = typeof deals.$inferSelect;
export type NewDeal = typeof deals.$inferInsert;
export type AnalyticsEvent = typeof analyticsEvents.$inferSelect;
export type NewAnalyticsEvent = typeof analyticsEvents.$inferInsert;
