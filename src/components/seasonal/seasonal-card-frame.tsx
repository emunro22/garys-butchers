'use client';

import Image from 'next/image';
import { useSeasonalTheme } from './seasonal-theme-context';

/** Drop *inside* a product/category tile's `relative overflow-hidden` image
 *  box (unlike SeasonalCardDecoration, which sits outside it) — dresses the
 *  photo itself with a festive frame: a fir/tinsel garland along the top and
 *  bottom edges for Christmas, a bunting of eggs for Easter. Renders nothing
 *  when no seasonal theme is active. */
export function SeasonalCardFrame() {
  const theme = useSeasonalTheme();
  if (theme === 'none') return null;

  if (theme === 'christmas') {
    return (
      <Image
        src="/seasonal/christmas-garland-frame.png"
        alt=""
        aria-hidden
        fill
        style={{ objectFit: 'fill' }}
        className="pointer-events-none select-none absolute inset-0 z-10"
      />
    );
  }

  // Easter: a bunting of eggs strung along the top and bottom edges.
  const eggStrip: React.CSSProperties = {
    backgroundImage: "url('/seasonal/easter-egg.png')",
    backgroundRepeat: 'repeat-x',
    backgroundSize: '26px auto',
    backgroundPosition: 'center',
  };
  return (
    <>
      <div className="pointer-events-none select-none absolute inset-x-0 top-0 h-7 z-10 opacity-90" style={eggStrip} aria-hidden />
      <div className="pointer-events-none select-none absolute inset-x-0 bottom-0 h-7 z-10 opacity-90" style={eggStrip} aria-hidden />
    </>
  );
}
