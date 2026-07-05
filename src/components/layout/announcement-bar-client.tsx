'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

function getDeliveryMessage(now: Date, cutoffHour: number): string {
  const cutoff = new Date(now);
  cutoff.setHours(cutoffHour, 0, 0, 0);

  const msRemaining = cutoff.getTime() - now.getTime();
  if (msRemaining <= 0) {
    return `⏰  Today's next-day delivery cutoff has passed — order before ${formatHour(cutoffHour)} tomorrow`;
  }

  const minutesRemaining = Math.ceil(msRemaining / 60000);
  if (minutesRemaining < 60) {
    return `⏰  Order in the next ${minutesRemaining} minute${minutesRemaining === 1 ? '' : 's'} for next-day delivery`;
  }

  const hours = Math.floor(minutesRemaining / 60);
  const minutes = minutesRemaining % 60;
  return `⏰  Order in the next ${hours}h ${minutes}m for next-day delivery`;
}

function formatHour(hour: number): string {
  const period = hour >= 12 ? 'pm' : 'am';
  const h = hour % 12 === 0 ? 12 : hour % 12;
  return `${h}${period}`;
}

export function AnnouncementBarClient({
  messages,
  showCountdown,
  cutoffHour,
}: {
  messages: string[];
  showCountdown: boolean;
  cutoffHour: number;
}) {
  // Start null so server and client render the same thing on first paint —
  // the live delivery message is only added once we know the browser's clock.
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    if (!showCountdown) return;
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, [showCountdown]);

  // Reserve the countdown slot from first paint so the track's width — and
  // the marquee animation running over it — doesn't jump once the real
  // countdown text swaps in after mount.
  const countdownMessage = showCountdown
    ? now
      ? getDeliveryMessage(now, cutoffHour)
      : '⏰  Order today for next-day delivery'
    : null;
  const allMessages = countdownMessage ? [...messages, countdownMessage] : messages;
  // Triple the array so the marquee always has content as it loops
  const loop = [...allMessages, ...allMessages, ...allMessages];

  if (allMessages.length === 0) return null;

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
