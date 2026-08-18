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

export const fulfilmentEnum = pgEnum('fulfilment', ['pickup', 'delivery', 'premium']);

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
    // Admin-only flag: whether this registered customer can select Premium /
    // Bulk delivery at checkout (see src/app/api/checkout/route.ts). Never
    // customer-settable.
    premiumDeliveryEligible: boolean('premium_delivery_eligible').default(false).notNull(),
    // This customer's own shareable referral code (see src/lib/referrals.ts) —
    // generated lazily the first time they open the Referrals tab.
    referralCode: varchar('referral_code', { length: 12 }),
    // Who referred this customer in, if anyone — set once at signup and never
    // changed. Rewarded to the referrer on this customer's first paid order.
    referredByUserId: uuid('referred_by_user_id').references((): any => users.id, { onDelete: 'set null' }),
    // Unredeemed referral rewards: incremented by one each time someone this
    // customer referred completes their first paid order, decremented by one
    // each time a reward is spent (auto-applied) on a checkout.
    referralCreditsAvailable: integer('referral_credits_available').default(0).notNull(),
    // Stripe Customer object backing this user's recurring subscription
    // billing — created lazily the first time they set one up.
    stripeCustomerId: varchar('stripe_customer_id', { length: 200 }),
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

export const orders = pgTable(
  'orders',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    // Only assigned once payment succeeds (see markOrderPaid) — a failed or
    // abandoned checkout should never consume a customer-visible order number.
    orderNumber: integer('order_number'),
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
    // Premium/bulk delivery only — filled in later by admin via the weight
    // calculator on the order, not at checkout time. Grams (not kg) to avoid
    // float rounding, matching the priceInPence convention.
    weightGrams: integer('weight_grams'),
    courierName: varchar('courier_name', { length: 60 }),
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
    // True if this order spent one of the customer's referral-reward credits
    // (see referralCreditsAvailable on users) — set at checkout, consumed
    // (decremented on the user) in markOrderPaid once payment actually succeeds.
    referralCreditRedeemed: boolean('referral_credit_redeemed').default(false).notNull(),
    stripePaymentIntentId: varchar('stripe_payment_intent_id', { length: 200 }),
    // Fingerprint of the cart/fulfilment/slot/address/promo at checkout time —
    // lets a retried submission (reload, back button) recognise "this is the
    // same attempt" and reuse the pending order/PaymentIntent instead of
    // creating a duplicate. See computeCartSignature in lib/cart-signature.ts.
    cartSignature: varchar('cart_signature', { length: 64 }),
    // Set once the abandoned-checkout reminder email has been sent for this
    // order, so the reminder cron never sends it twice.
    abandonedReminderSentAt: timestamp('abandoned_reminder_sent_at', { withTimezone: true }),
    // Set once the post-fulfilment "leave us a review" email has been sent
    // for this order, so the 8pm review cron never sends it twice.
    reviewEmailSentAt: timestamp('review_email_sent_at', { withTimezone: true }),
    // Set only for orders auto-created by a subscription renewal (see
    // src/lib/subscription-renewal.ts) — null for every normal checkout order.
    subscriptionId: uuid('subscription_id'),
    // The Stripe invoice that paid for this renewal — makes each webhook
    // delivery idempotent (Stripe can retry the same invoice.paid event).
    stripeInvoiceId: varchar('stripe_invoice_id', { length: 200 }),
    status: orderStatusEnum('status').default('pending').notNull(),
    // Null until the receipt printer's agent (see print-agent/) acks the
    // job — null is also what puts a paid order back into the print queue,
    // so an admin "reprint" is just clearing this back to null.
    printedAt: timestamp('printed_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    statusIdx: index('orders_status_idx').on(t.status),
    emailIdx: index('orders_email_idx').on(t.customerEmail),
    emailStatusIdx: index('orders_email_status_idx').on(t.customerEmail, t.status),
    stripeInvoiceIdx: uniqueIndex('orders_stripe_invoice_idx').on(t.stripeInvoiceId),
  })
);

// Not a pg enum on purpose — this table is created/altered via the ad-hoc
// ensure-schema pattern (see ensureReferralsSchema), and CREATE TYPE has no
// IF NOT EXISTS guard, so a plain varchar avoids the enum-creation race.
export const referrals = pgTable(
  'referrals',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    referrerUserId: uuid('referrer_user_id').notNull(),
    // One referral relationship per referred customer — they can only ever
    // have been brought in by one person.
    referredUserId: uuid('referred_user_id').notNull(),
    status: varchar('status', { length: 20 }).$type<'pending' | 'rewarded'>().default('pending').notNull(),
    qualifyingOrderId: uuid('qualifying_order_id'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    rewardedAt: timestamp('rewarded_at', { withTimezone: true }),
  },
  (t) => ({
    referredUserIdx: uniqueIndex('referrals_referred_user_idx').on(t.referredUserId),
    referrerIdx: index('referrals_referrer_idx').on(t.referrerUserId),
  })
);

// Not a pg enum — same ad-hoc ensure-schema reasoning as referrals.status above.
export const subscriptions = pgTable(
  'subscriptions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id').notNull(),
    // Null until the Stripe Checkout session for this subscription completes
    // (see checkout.session.completed in the webhook) — a subscription draft
    // that never finishes checkout just sits at status 'pending' forever.
    stripeSubscriptionId: varchar('stripe_subscription_id', { length: 200 }),
    stripeCustomerId: varchar('stripe_customer_id', { length: 200 }),
    status: varchar('status', { length: 20 })
      .$type<'pending' | 'active' | 'past_due' | 'cancelled'>()
      .default('pending')
      .notNull(),
    items: jsonb('items')
      .$type<Array<{ productId: string; name: string; priceInPence: number; quantity: number }>>()
      .notNull(),
    subtotalInPence: integer('subtotal_in_pence').notNull(),
    fulfilment: varchar('fulfilment', { length: 20 }).$type<'pickup' | 'delivery'>().notNull(),
    deliveryAddress: jsonb('delivery_address').$type<{
      line1: string;
      line2?: string;
      city: string;
      postcode: string;
    } | null>(),
    // Which admin-configured slot block (see src/lib/slots.ts) each renewal
    // tries to book into, and which day of the month it targets — the actual
    // date/time booked each cycle is computed fresh against real capacity by
    // src/lib/subscription-renewal.ts, this is only the customer's preference.
    preferredBlockId: varchar('preferred_block_id', { length: 80 }).notNull(),
    preferredDayOfMonth: integer('preferred_day_of_month').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
    cancelledAt: timestamp('cancelled_at', { withTimezone: true }),
  },
  (t) => ({
    userIdx: index('subscriptions_user_idx').on(t.userId),
    stripeSubIdx: uniqueIndex('subscriptions_stripe_sub_idx').on(t.stripeSubscriptionId),
  })
);

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

export const usersRelations = relations(users, ({ many }) => ({
  orders: many(orders),
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
export type Order = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;
export type Referral = typeof referrals.$inferSelect;
export type NewReferral = typeof referrals.$inferInsert;
export type Subscription = typeof subscriptions.$inferSelect;
export type NewSubscription = typeof subscriptions.$inferInsert;
export type Subscriber = typeof subscribers.$inferSelect;
export type NewSubscriber = typeof subscribers.$inferInsert;
