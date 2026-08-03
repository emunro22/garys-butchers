import Image from 'next/image';
import type { SeasonalTheme } from '@/lib/settings';

const COPY = {
  christmas: {
    icon: '/seasonal/santa-hat.png',
    text: "It's beginning to look a lot like Christmas at Gary's Butchers — festive cuts in store now.",
    className: 'bg-gradient-to-r from-butcher-600 via-butcher-500 to-gold-600',
  },
  easter: {
    icon: '/seasonal/easter-egg.png',
    text: "Hoppy Easter! Our Easter specials are hopping onto shelves now.",
    className: 'bg-gradient-to-r from-gold-500 via-gold-400 to-butcher-400',
  },
} as const;

/** A themed strip shown while a seasonal mode is on, toggled from
 *  Admin → Settings → Seasonal theme. See src/lib/settings.ts `seasonal`. */
export function SeasonalBanner({ theme }: { theme: SeasonalTheme }) {
  if (theme === 'none') return null;
  const copy = COPY[theme];

  return (
    <div className={`${copy.className} text-cream-50`}>
      <div className="mx-auto max-w-7xl px-4 md:px-8 py-2 flex items-center justify-center gap-2.5">
        <Image src={copy.icon} alt="" aria-hidden width={18} height={18} className="w-[18px] h-auto shrink-0" />
        <p className="text-[11px] md:text-xs uppercase tracking-[0.14em] font-medium text-center">
          {copy.text}
        </p>
      </div>
    </div>
  );
}
