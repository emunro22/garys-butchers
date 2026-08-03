'use client';

import Image from 'next/image';
import { useSeasonalTheme } from './seasonal-theme-context';

const DECORATIONS = {
  christmas: {
    src: '/seasonal/santa-hat.png',
    width: 56,
    height: 59,
    className: '-rotate-[18deg]',
  },
  easter: {
    src: '/seasonal/easter-egg.png',
    width: 40,
    height: 33,
    className: 'rotate-[10deg]',
  },
} as const;

/** Drop into any `relative`/`overflow-hidden` product or category tile — renders
 *  a small decoration perched on the top edge when a seasonal theme is active,
 *  or nothing otherwise. Reads the theme from context so it works from both
 *  client tiles (ProductCard) and server-rendered tiles (shop/page.tsx's grid). */
export function SeasonalCardDecoration() {
  const theme = useSeasonalTheme();
  if (theme === 'none') return null;
  const d = DECORATIONS[theme];

  return (
    <Image
      src={d.src}
      alt=""
      aria-hidden
      width={d.width}
      height={d.height}
      className={`pointer-events-none select-none absolute -top-3 left-1/2 -translate-x-1/2 z-20 drop-shadow-md w-11 h-auto ${d.className}`}
    />
  );
}
