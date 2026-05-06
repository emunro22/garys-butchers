# Gary's Butchers & Fishmongers

Full-stack e-commerce site for Gary's Butchers & Fishmongers — an independent butcher and fishmonger in Erskine, Scotland. Hand-cut Scottish meat, fresh fish, and the famous family meat packs.

Built with Next.js 15 (App Router), TypeScript, Tailwind CSS, Framer Motion, Drizzle ORM, Vercel Postgres, Stripe, and Resend.

## What's in the box

**Storefront**
- Animated, gold-on-charcoal homepage with hero, featured packs, categories, reviews, and an about strip
- Full shop with category pages, product detail pages, and an interactive cart drawer
- 11 family meat packs from the printed price list, each with its own page and full contents
- Cart, checkout (pickup or delivery), Stripe payment, and order confirmation flow
- About, Contact, Reviews, and FAQ pages
- Free home delivery threshold (£25), promo code support, slot picker

**Admin panel** (at `/admin`)
- JWT session auth, password-hashed against env vars
- Dashboard with revenue, order, and product stats
- Products: list with search and filters, create/edit with image upload to Vercel Blob, pack-contents editor
- Orders: filterable by status, expand to view items, inline status updates
- Promotions: percent-off, amount-off, or free-delivery codes with min order, expiry, and redemption limits
- Categories overview, settings page

**Backend**
- Drizzle ORM schema for categories, products, orders, promotions, reviews, settings
- Server-side price recalculation on checkout (client prices are never trusted)
- Stripe webhook for `payment_intent.succeeded` → marks order paid, increments promo redemption count, sends confirmation emails to customer and shop
- Resend transactional email with branded HTML templates

## Quick start (local dev)

### 1. Prerequisites
- Node.js 20+
- A Vercel account (free tier works for development)
- A Stripe account (test mode is fine)
- A Resend account (free tier: 100 emails/day)

### 2. Install
```bash
npm install
```

### 3. Environment variables
Copy `.env.example` to `.env.local` and fill in the following:

```bash
# Database (Vercel Postgres / Neon)
POSTGRES_URL="postgres://..."

# Stripe
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."

# Resend
RESEND_API_KEY="re_..."
RESEND_FROM_EMAIL="orders@yourdomain.co.uk"
SHOP_NOTIFY_EMAIL="gary@yourdomain.co.uk"

# Admin auth
AUTH_SECRET="..."           # openssl rand -base64 32
ADMIN_EMAIL="gary@yourdomain.co.uk"
ADMIN_PASSWORD_HASH="$2b$10$..." # see below

# Vercel Blob (for product image uploads)
BLOB_READ_WRITE_TOKEN="vercel_blob_rw_..."

# Site URL (for OG metadata, links in emails)
NEXT_PUBLIC_SITE_URL="https://garysbutchers.co.uk"
```

### 4. Generate the admin password hash
```bash
node -e "console.log(require('bcryptjs').hashSync(process.argv[1], 10))" 'your-password-here'
```
Copy the output into `ADMIN_PASSWORD_HASH`.

### 5. Push the schema and seed the database
```bash
npm run db:push
npm run db:seed
```
This creates all tables and populates the catalogue: 8 categories, ~30 single products, all 11 meat packs, the 7 Google reviews, and 3 sample promotion codes (`WELCOME10`, `FREEDELIVERY`, `WEEKEND5`).

### 6. Run the dev server
```bash
npm run dev
```
Open http://localhost:3000.

### 7. Test Stripe webhooks locally
In a second terminal:
```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```
Copy the `whsec_...` it prints into `STRIPE_WEBHOOK_SECRET`.

Use Stripe's test cards (e.g. `4242 4242 4242 4242`, any future expiry, any 3-digit CVC) to place test orders.

## Deploying to Vercel

1. Push this repo to GitHub.
2. Import it into Vercel.
3. In **Storage → Create Database**, add a Postgres database. Vercel will auto-populate `POSTGRES_URL` and friends.
4. In **Storage → Blob**, add a Blob store. Vercel will auto-populate `BLOB_READ_WRITE_TOKEN`.
5. In **Settings → Environment Variables**, add the rest of the env vars from above. (Use `NEXT_PUBLIC_SITE_URL` set to your production domain.)
6. Deploy. After the first deploy, run `db:push` and `db:seed` against the production database — locally, point your `.env.local` at the production `POSTGRES_URL` temporarily and run `npm run db:push && npm run db:seed`.
7. In the Stripe Dashboard → **Developers → Webhooks**, add an endpoint pointing at `https://<your-domain>/api/webhooks/stripe`, subscribe to `payment_intent.succeeded` and `payment_intent.payment_failed`, then copy the signing secret into `STRIPE_WEBHOOK_SECRET` and redeploy.
8. Verify your domain in Resend so emails come from `orders@yourdomain.co.uk`.

## Day-to-day operations

### Add a product
- Go to `/admin/products/new`
- Upload an image (JPEG/PNG/WebP, ≤ 5 MB)
- Fill in name, price, weight label, category, and description
- For meat packs: toggle "This is a meat pack" and add the contents line by line
- Toggle "Featured on homepage" to surface it on the homepage

### Edit a product
- Go to `/admin/products`, hit the pencil icon
- Edit and save — changes are live within 60 seconds (or instantly if you trigger a redeploy)

### Create a promo code
- Go to `/admin/promotions/new`
- Pick a type (percent off, amount off, free delivery), set value, optional min order, optional expiry, optional max redemptions
- Codes are entered by customers at checkout and validated server-side

### Process orders
- New orders arrive at `/admin/orders` with status `paid`
- Mark them `preparing` → `ready` → `completed` as you work through them
- Email notifications go to `SHOP_NOTIFY_EMAIL` for every paid order

## Project structure

```
src/
├── app/
│   ├── (admin-public)/admin/login/   ← login page (no auth wall)
│   ├── (storefront)/                  ← customer-facing pages
│   ├── admin/                         ← protected admin app
│   ├── api/                           ← all API routes
│   ├── globals.css
│   └── layout.tsx                     ← root layout with fonts
├── components/
│   ├── admin/                         ← admin-only UI
│   ├── home/                          ← homepage sections
│   ├── layout/                        ← header, footer, announcement bar
│   ├── shop/                          ← cart drawer, product card, checkout
│   └── ui/                            ← buttons, inputs, badges
├── lib/
│   ├── auth.ts                        ← JWT sessions + bcrypt admin login
│   ├── cart.ts                        ← Zustand cart store with persistence
│   ├── db/
│   │   ├── index.ts                   ← Drizzle client
│   │   ├── schema.ts                  ← all tables
│   │   └── seed.ts                    ← catalogue seed data
│   ├── email.ts                       ← Resend wrappers + HTML templates
│   ├── stripe.ts                      ← Stripe client
│   └── utils.ts                       ← formatPrice, slugify, delivery calc
└── middleware.ts                      ← protects /admin/*
```

## Design system at a glance

- **Display:** Fraunces (serif, with SOFT/WONK/optical-size axes)
- **Body:** DM Sans
- **Palette:** charcoal (`ink-900` `#0a0a0a`), antique gold (`gold-400` `#c9a961`), butcher's red (`butcher-500` `#8b1f1f`), warm cream (`cream-50` `#f8f5f0`)
- **Aesthetic:** square corners (no rounding except on a couple of badges), uppercase tracked-out eyebrow labels, gold rules between sections, dark-on-cream homepage with a single charcoal hero
- **Prices:** stored in **pence** as integers everywhere (no float arithmetic on money)

## Tech stack reference

| Concern | Library |
|---|---|
| Framework | Next.js 15 (App Router, server components) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Animation | Framer Motion |
| State (cart) | Zustand with localStorage persistence |
| Database | Vercel Postgres |
| ORM | Drizzle |
| Payments | Stripe (PaymentIntents + Elements) |
| Email | Resend |
| Auth (admin) | jose (JWT) + bcryptjs |
| Image hosting | Vercel Blob |
| Validation | Zod |

## Common tasks

```bash
npm run dev              # local dev server
npm run build            # production build
npm run lint             # ESLint
npm run typecheck        # TypeScript check, no emit
npm run db:generate      # generate migration files from schema changes
npm run db:push          # apply schema directly (dev workflow)
npm run db:studio        # open Drizzle Studio at https://local.drizzle.studio
npm run db:seed          # repopulate catalogue from seed.ts
```

## Notes for handover

- The 8 categories and 11 meat packs are seeded from `src/lib/db/seed.ts`. Re-running the seed will **not** wipe orders — only categories, products, promotions, and reviews are repopulated.
- Adding a new category currently means editing `seed.ts` and re-seeding. If you'd like a UI for managing categories, the `/admin/categories` page is the place to extend.
- Delivery and pickup slots are generated client-side as the next 7 working days × 4–5 time slots. Sundays are skipped (shop closed). To change shop hours, edit the `slots` memo in `src/components/shop/checkout.tsx`.
- The free-delivery threshold (£25) and standard delivery fee (£3.50) are constants in `src/lib/utils.ts`.
- All emails route through Resend. The from-address `orders@yourdomain.co.uk` must have its domain verified in Resend before going live.

---

Made for Gary's Butchers & Fishmongers, Bridgewater Shopping Centre, Erskine PA8 7AA · 0141 555 1234.
