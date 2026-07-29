// Tracks which product categories a visitor shows interest in while
// searching, entirely client-side (localStorage) — no server-side tracking,
// no account required, nothing sent anywhere. Used to power "Recommended for
// you" without collecting any new personal data.
const STORAGE_KEY = 'garys_search_interest_v1';
const MAX_CATEGORIES = 8;

type InterestMap = Record<string, number>;

function readInterest(): InterestMap {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeInterest(map: InterestMap) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    // localStorage unavailable (private browsing, quota exceeded, etc.) —
    // recommendations simply won't personalize, nothing else depends on it.
  }
}

export function recordSearchInterest(categoryId: string | null | undefined, weight = 1) {
  if (!categoryId || typeof window === 'undefined') return;
  const map = readInterest();
  map[categoryId] = (map[categoryId] ?? 0) + weight;

  const trimmed = Object.fromEntries(
    Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, MAX_CATEGORIES)
  );
  writeInterest(trimmed);
}

export function getTopInterestCategories(limit = 3): string[] {
  return Object.entries(readInterest())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([id]) => id);
}
