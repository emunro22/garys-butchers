export default function AdminSettingsPage() {
  return (
    <div className="space-y-8">
      <header>
        <p className="eyebrow text-ink-500 mb-2">Configuration</p>
        <h1 className="font-display text-4xl text-ink-900">Settings</h1>
      </header>

      <section className="grid md:grid-cols-2 gap-6">
        <div className="bg-cream-100 border border-ink-900/10 p-6 space-y-3">
          <p className="eyebrow text-ink-500">Shop</p>
          <h2 className="font-display text-2xl text-ink-900">
            Gary&apos;s Butchers &amp; Fishmongers
          </h2>
          <p className="text-sm text-ink-700">
            Bridgewater Shopping Centre, Erskine PA8 7AA
          </p>
          <p className="text-sm text-ink-700 tabular">0141 555 1234</p>
        </div>

        <div className="bg-cream-100 border border-ink-900/10 p-6 space-y-3">
          <p className="eyebrow text-ink-500">Delivery</p>
          <h2 className="font-display text-2xl text-ink-900">£25 free threshold</h2>
          <p className="text-sm text-ink-700">
            Orders below £25 are charged £3.50 for home delivery. Above £25 is free.
          </p>
          <p className="text-xs text-ink-500">
            Adjust these values in <code className="bg-cream-200 px-1.5 py-0.5 font-mono text-[11px]">src/lib/utils.ts</code>.
          </p>
        </div>

        <div className="bg-cream-100 border border-ink-900/10 p-6 space-y-3">
          <p className="eyebrow text-ink-500">Integrations</p>
          <h2 className="font-display text-2xl text-ink-900">Stripe &amp; Resend</h2>
          <p className="text-sm text-ink-700">
            Payments via Stripe, transactional email via Resend. Configure your API keys in your Vercel environment variables — see the README for the full list.
          </p>
        </div>

        <div className="bg-cream-100 border border-ink-900/10 p-6 space-y-3">
          <p className="eyebrow text-ink-500">Database</p>
          <h2 className="font-display text-2xl text-ink-900">Vercel Postgres</h2>
          <p className="text-sm text-ink-700">
            Schema is managed via Drizzle. Run{' '}
            <code className="bg-cream-200 px-1.5 py-0.5 font-mono text-[11px]">
              npm run db:push
            </code>{' '}
            to sync after schema changes, and{' '}
            <code className="bg-cream-200 px-1.5 py-0.5 font-mono text-[11px]">
              npm run db:seed
            </code>{' '}
            to repopulate with the catalogue.
          </p>
        </div>
      </section>
    </div>
  );
}
