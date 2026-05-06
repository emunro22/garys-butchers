'use client';

import Link from 'next/link';

const messages = [
  '🥩  Free home delivery on orders over £25',
  '⭐  Rated 5/5 by our customers in Erskine',
  '🐟  Fresh fish delivered daily — Tuesday to Saturday',
  '🎁  Use code WELCOME10 for 10% off your first order',
];

export function AnnouncementBar() {
  // Triple the array so the marquee always has content as it loops
  const loop = [...messages, ...messages, ...messages];
  return (
    <div className="bg-ink-900 text-cream-50 overflow-hidden border-b border-gold-400/15">
      <Link href="/shop">
        <div className="marquee-track py-2.5 text-[11px] tracking-[0.22em] uppercase font-medium">
          {loop.map((m, i) => (
            <span key={i} className="px-8 whitespace-nowrap text-cream-100">
              {m}
              <span className="ml-8 text-gold-400">·</span>
            </span>
          ))}
        </div>
      </Link>
    </div>
  );
}
