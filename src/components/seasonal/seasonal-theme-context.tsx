'use client';

import { createContext, useContext } from 'react';
import type { SeasonalTheme } from '@/lib/settings';

const SeasonalThemeContext = createContext<SeasonalTheme>('none');

export function SeasonalThemeProvider({
  theme,
  children,
}: {
  theme: SeasonalTheme;
  children: React.ReactNode;
}) {
  return <SeasonalThemeContext.Provider value={theme}>{children}</SeasonalThemeContext.Provider>;
}

export function useSeasonalTheme() {
  return useContext(SeasonalThemeContext);
}
