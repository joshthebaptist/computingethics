import type { Store } from './types';

const KEY = 'computingethics.store.v1';

export function defaultStore(): Store {
  return {
    version: 1,
    cards: [],
    logs: [],
    dailyNewLimit: 20,
    dailyReviewLimit: 200,
    seeded: false,
  };
}

export function loadStore(): Store {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(KEY);
  } catch {
    return defaultStore();
  }
  if (!raw) return defaultStore();
  try {
    const parsed = JSON.parse(raw) as Partial<Store>;
    if (!parsed || !Array.isArray(parsed.cards) || !Array.isArray(parsed.logs)) {
      throw new Error('bad shape');
    }
    return {
      version: 1,
      cards: parsed.cards,
      logs: parsed.logs,
      dailyNewLimit: numberOr(parsed.dailyNewLimit, 20),
      dailyReviewLimit: numberOr(parsed.dailyReviewLimit, 200),
      seeded: parsed.seeded === true,
    };
  } catch {
    try {
      localStorage.setItem(KEY + '.corrupt', raw);
    } catch {
      /* ignore */
    }
    return defaultStore();
  }
}

export function saveStore(store: Store): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(store));
  } catch {
    /* storage full or unavailable */
  }
}

export function clearStore(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}

function numberOr(v: unknown, fallback: number): number {
  return typeof v === 'number' && Number.isFinite(v) ? v : fallback;
}
