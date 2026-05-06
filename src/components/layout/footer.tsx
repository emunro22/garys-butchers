import Link from 'next/link';
import Image from 'next/image';
import { Facebook, Instagram, MapPin, Phone, Clock } from 'lucide-react';

const cols = [
  {
    title: 'Shop',
    links: [
      { label: 'All products', href: '/shop' },
      { label: 'Beef', href: '/shop/beef' },
      { label: 'Pork', href: '/shop/pork' },
      { label: 'Chicken', href: '/shop/chicken' },
      { label: 'Fish', href: '/shop/fish' },
      { label: 'Meat packs', href: '/meat-packs' },
    ],
  },
  {
    title: 'Help',
    links: [
      { label: 'Pickup & delivery', href: '/faq#delivery' },
      { label: 'Frequently asked', href: '/faq' },
      { label: 'Reviews', href: '/reviews' },
      { label: 'Contact us', href: '/contact' },
    ],
  },
  {
    title: 'About',
    links: [
      { label: "Our story", href: '/about' },
      { label: 'Sourcing', href: '/about#sourcing' },
      { label: 'Privacy', href: '/privacy' },
      { label: 'Terms', href: '/terms' },
    ],
  },
];

export function Footer() {
  return (
    <footer className="bg-ink-900 text-cream-100 ink-paper">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10 pt-20 pb-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 pb-16 border-b border-cream-100/10">
          {/* Brand */}
          <div className="lg:col-span-4">
              <div className="w-24 h-24 rounded-full bg-ink-900 p-2 overflow-hidden flex items-center justify-center mb-6">
                <Image
                  src="/logo.png"
                  alt="Gary's Butchers & Fishmongers"
                  width={120}
                  height={120}
                  className="w-full h-full object-contain"
                />
              </div>            
            <p className="text-cream-200/80 leading-relaxed text-sm max-w-xs">
              An independent butcher and fishmonger in Erskine. Hand-cut Scottish meat,
              fresh fish daily, and our famous meat packs. Family-run since 2015.
            </p>
            <div className="flex gap-3 mt-6">
              <a
                href="https://facebook.com"
                aria-label="Facebook"
                className="h-10 w-10 border border-gold-400/30 flex items-center justify-center hover:bg-gold-400 hover:text-ink-900 transition-colors"
              >
                <Facebook className="h-4 w-4" />
              </a>
              <a
                href="https://instagram.com"
                aria-label="Instagram"
                className="h-10 w-10 border border-gold-400/30 flex items-center justify-center hover:bg-gold-400 hover:text-ink-900 transition-colors"
              >
                <Instagram className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Link columns */}
          <div className="lg:col-span-5 grid grid-cols-3 gap-6">
            {cols.map((col) => (
              <div key={col.title}>
                <h3 className="eyebrow text-gold-400 mb-4">{col.title}</h3>
                <ul className="space-y-3">
                  {col.links.map((l) => (
                    <li key={l.href}>
                      <Link
                        href={l.href}
                        className="text-sm text-cream-200/80 hover:text-cream-50 transition-colors"
                      >
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Visit */}
          <div className="lg:col-span-3">
            <h3 className="eyebrow text-gold-400 mb-4">Visit the shop</h3>
            <ul className="space-y-4 text-sm text-cream-200/90">
              <li className="flex gap-3">
                <MapPin className="h-4 w-4 mt-0.5 text-gold-400 shrink-0" />
                <span>
                  Bridgewater Shopping Centre,
                  <br />
                  Erskine, PA8 7AA
                </span>
              </li>
              <li className="flex gap-3">
                <Phone className="h-4 w-4 mt-0.5 text-gold-400 shrink-0" />
                <a href="tel:01415551234" className="hover:text-cream-50">
                  0141 555 1234
                </a>
              </li>
              <li className="flex gap-3">
                <Clock className="h-4 w-4 mt-0.5 text-gold-400 shrink-0" />
                <span>
                  Tue–Fri 9–5,
                  <br />
                  Sat 9–4, Sun–Mon closed
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pt-8 text-xs text-cream-200/60">
          <p>© {new Date().getFullYear()} Gary&apos;s Butchers &amp; Fishmongers. All rights reserved.</p>
          <p className="eyebrow">Independent · Family run · Since 2015</p>
        </div>
      </div>
    </footer>
  );
}
