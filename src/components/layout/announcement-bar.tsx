'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

const baseMessages = [
  '🥩  Free home delivery on orders over £25',
  '⭐  Rated 5/5 by our customers in Erskine',
  '🐟  Fresh fish delivered daily — Tuesday to Saturday',
  '🎁  Use code WELCOME10 for 10% off your first order',
];

const CUTOFF_HOUR = 18; // 6pm — last order time for next-day delivery

function getDeliveryMessage(now: Date): string {
  const cutoff = new Date(now);
  cutoff.setHours(CUTOFF_HOUR, 0, 0, 0);

  const msRemaining = cutoff.getTime() - now.getTime();
  if (msRemaining <= 0) {
    return "⏰  Today's next-day delivery cutoff has passed — order before 6pm tomorrow";
  }

  const minutesRemaining = Math.ceil(msRemaining / 60000);
  if (minutesRemaining < 60) {
    return `⏰  Order within ${minutesRemaining} minute${minutesRemaining === 1 ? '' : 's'} for next-day delivery`;
  }

  const hours = Math.floor(minutesRemaining / 60);
  const minutes = minutesRemaining % 60;
  return `⏰  Order within ${hours}h ${minutes}m for next-day delivery`;
}

export function AnnouncementBar() {
  // Start null so server and client render the same thing on first paint —
  // the live delivery message is only added once we know the browser's clock.
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  const messages = now ? [...baseMessages, getDeliveryMessage(now)] : baseMessages;
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
