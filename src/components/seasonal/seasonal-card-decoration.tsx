'use client';

import Image from 'next/image';
import { useSeasonalTheme } from './seasonal-theme-context';

const DECORATIONS = {
  christmas: {
    src: '/seasonal/santa-hat.png',
    width: 56,
    height: 59,
    className: 'rotate-[22deg]',
  },
  easter: {
    src: '/seasonal/easter-egg.png',
    width: 40,
    height: 33,
    className: 'rotate-[18deg]',
  },
} as const;

/** Drop into any `relative`/`overflow-hidden` product or category tile — renders
 *  a small decoration perched on the top-right corner, tilted jauntily, on top
 *  of the image, when a seasonal theme is active, or nothing otherwise.
 *  Positioned with a positive inset (not a negative one) so it isn't clipped
 *  by the tile's `overflow-hidden`. Reads the theme from context so it works
 *  from both client tiles (ProductCard) and server-rendered tiles
 *  (shop/page.tsx's grid). */
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
      className={`pointer-events-none select-none absolute top-2 right-2 z-20 drop-shadow-md w-12 h-auto ${d.className}`}
    />
  );
}
