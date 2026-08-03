'use client';

import Image from 'next/image';
import { useSeasonalTheme } from './seasonal-theme-context';

const DECORATIONS = {
  christmas: {
    src: '/seasonal/santa-hat.png',
    width: 56,
    height: 59,
    className: '-rotate-[12deg]',
  },
  easter: {
    src: '/seasonal/easter-egg.png',
    width: 40,
    height: 33,
    className: 'rotate-[8deg]',
  },
} as const;

/** Drop into any `relative`/`overflow-hidden` product or category tile — renders
 *  a small decoration sitting in the corner, on top of the image, when a
 *  seasonal theme is active, or nothing otherwise. Positioned with a positive
 *  inset (not a negative one) so it isn't clipped by the tile's
 *  `overflow-hidden`, and anchored bottom-left since that corner is never used
 *  by a product badge or the quick-add button. Reads the theme from context so
 *  it works from both client tiles (ProductCard) and server-rendered tiles
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
      className={`pointer-events-none select-none absolute bottom-2 left-2 z-20 drop-shadow-md w-12 h-auto ${d.className}`}
    />
  );
}
