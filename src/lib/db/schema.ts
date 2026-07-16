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

export const userRoleEnum = pgEnum('user_role', ['customer', 'admin']);

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

export const users = pgTable(
  'users',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    email: varchar('email', { length: 200 }).notNull(),
    passwordHash: text('password_hash').notNull(),
    name: varchar('name', { length: 160 }).notNull(),
    phone: varchar('phone', { length: 40 }),
    role: userRoleEnum('role').default('customer').notNull(),
    emailVerified: boolean('email_verified').default(false).notNull(),
    verificationCode: varchar('verification_code', { length: 6 }),
    verificationCodeExpiresAt: timestamp('verification_code_expires_at', { withTimezone: true }),
    resetCode: varchar('reset_code', { length: 6 }),
    resetCodeExpiresAt: timestamp('reset_code_expires_at', { withTimezone: true }),
    defaultAddress: jsonb('default_address').$type<{
      line1: string;
      line2?: string;
      city: string;
      postcode: string;
    } | null>(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    emailIdx: uniqueIndex('users_email_idx').on(t.email),
  })
);

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
    // structured contents for meat packs (list of items in the box)
    packContents: jsonb('pack_contents').$type<string[]>().default([]).notNull(),
    // size/weight variants (e.g. [{label:"7oz",priceInPence:999},{label:"10oz",priceInPence:1299}])
    variants: jsonb('variants').$type<Array<{ label: string; priceInPence: number }>>().default([]).notNull(),
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
    userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
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

export const usersRelations = relations(users, ({ many }) => ({
  orders: many(orders),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  products: many(products),
}));

export const productsRelations = relations(products, ({ one }) => ({
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
}));

export const ordersRelations = relations(orders, ({ one }) => ({
  user: one(users, {
    fields: [orders.userId],
    references: [users.id],
  }),
}));

// ---------- Type exports ----------

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
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
export type Deal = typeof deals.$inferSelect;
export type NewDeal = typeof deals.$inferInsert;