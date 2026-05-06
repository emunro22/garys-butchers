import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About — Gary’s Butchers & Fishmongers',
  description:
    'Local, independent butcher and fishmonger in Erskine. Hand-cut meat, fresh fish, square sausage and the famous family meat packs since 2015.',
};

export default function AboutPage() {
  return (
    <div>
      <section className="bg-ink-900 text-cream-50 py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <p className="eyebrow text-gold-400 mb-4">Est. 2015</p>
          <h1 className="font-display text-5xl md:text-7xl leading-[0.95] max-w-4xl">
            A proper butcher
            <span className="font-display italic text-gold-400"> in the heart of Erskine.</span>
          </h1>
        </div>
      </section>

      <section className="bg-cream-50 py-16 md:py-24">
        <div className="mx-auto max-w-5xl px-4 md:px-8">
          <div className="grid md:grid-cols-[1fr_2fr] gap-10 md:gap-16">
            <div>
              <p className="eyebrow text-ink-500 mb-3">Our story</p>
              <p className="font-display text-2xl md:text-3xl text-ink-900 leading-tight">
                None of that pre-packaged plastic stuff from the supermarkets.
              </p>
            </div>
            <div className="space-y-5 text-ink-700 leading-relaxed">
              <p>
                Gary opened the shop in Bridgewater Shopping Centre in 2015 with a simple
                idea — give people in Erskine a proper local butcher again. Meat cut by
                hand, fresh fish on the counter, and the kind of service you don&apos;t get
                from the big chains.
              </p>
              <p>
                A decade on, the same idea still runs the shop. We hand-cut everything in
                store — sirloin, popeseye, rump, square sausage, link sausage, our own
                burgers, our own pies. The fish counter gets a fresh delivery from the
                Scottish coast, and our meat packs have become a bit of a local legend
                (the Muscle Pack and the Family Pack get most of the love).
              </p>
              <p>
                Whether you&apos;re after a single steak, the Sunday roast, or a full week&apos;s
                shop, the same answer applies: it&apos;ll be cut for you, by hand, the day
                you collect it. Free home delivery on orders over £25 in the local area.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stat strip */}
      <section className="bg-ink-900 text-cream-50 py-16 border-y border-gold-400/20">
        <div className="mx-auto max-w-7xl px-4 md:px-8 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            ['2015', 'Opened the shop'],
            ['5★', 'Google rating'],
            ['11', 'Family meat packs'],
            ['£25', 'Free delivery threshold'],
          ].map(([val, label]) => (
            <div key={label}>
              <p className="font-display text-4xl md:text-5xl text-gold-400">{val}</p>
              <p className="mt-2 text-xs uppercase tracking-[0.2em] text-cream-200/60">
                {label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Visit */}
      <section className="bg-cream-100 py-16 md:py-24">
        <div className="mx-auto max-w-5xl px-4 md:px-8 grid md:grid-cols-2 gap-10 md:gap-16">
          <div>
            <p className="eyebrow text-ink-500 mb-3">Come and see us</p>
            <h2 className="font-display text-4xl md:text-5xl text-ink-900 leading-tight">
              Bridgewater Shopping Centre, Erskine.
            </h2>
            <p className="mt-6 text-ink-700 leading-relaxed">
              Pop in, have a chat, take home a real Scottish steak. We&apos;re happy to
              prepare anything specially — just ask Gary at the counter.
            </p>
            <div className="mt-8">
              <Link href="/contact">
                <Button variant="primary">Get in touch</Button>
              </Link>
            </div>
          </div>
          <div className="bg-ink-900 text-cream-50 p-8 md:p-10">
            <p className="eyebrow text-gold-400 mb-5">Opening hours</p>
            <dl className="space-y-2 text-sm">
              {[
                ['Monday', '8:00 — 17:00'],
                ['Tuesday', '8:00 — 17:00'],
                ['Wednesday', '8:00 — 17:00'],
                ['Thursday', '8:00 — 17:00'],
                ['Friday', '8:00 — 17:00'],
                ['Saturday', '8:00 — 16:00'],
                ['Sunday', 'Closed'],
              ].map(([d, h]) => (
                <div key={d} className="flex justify-between border-b border-gold-400/10 pb-2">
                  <dt>{d}</dt>
                  <dd className="tabular text-cream-200/80">{h}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-8 pt-6 border-t border-gold-400/20">
              <p className="text-xs uppercase tracking-[0.2em] text-gold-400 mb-2">Address</p>
              <p className="text-cream-100">
                Bridgewater Shopping Centre<br />
                Erskine PA8 7AA<br />
                Scotland
              </p>
              <p className="mt-4 text-cream-100 tabular">0141 555 1234</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
