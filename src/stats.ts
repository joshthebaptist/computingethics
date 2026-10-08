import { Rating, State } from 'ts-fsrs';
import type { Card, ReviewLog, Store } from './types';

export function dayKey(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function todayKey(): string {
  return dayKey(Date.now());
}

export function streaks(logs: ReviewLog[]): { current: number; best: number } {
  const days = new Set(logs.map((l) => dayKey(l.review)));
  if (days.size === 0) return { current: 0, best: 0 };

  let best = 0;
  const sorted = [...days].sort();
  let run = 1;
  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1]);
    const cur = new Date(sorted[i]);
    const gap = Math.round((cur.getTime() - prev.getTime()) / 86400000);
    run = gap === 1 ? run + 1 : 1;
    best = Math.max(best, run);
  }
  best = Math.max(best, 1);

  let current = 0;
  const cursor = new Date();
  if (!days.has(dayKey(cursor.getTime()))) cursor.setDate(cursor.getDate() - 1);
  while (days.has(dayKey(cursor.getTime()))) {
    current += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return { current, best };
}

export function retention(logs: ReviewLog[]): { rate: number; reviewed: number } {
  const mature = logs.filter((l) => l.state === State.Review);
  const pool = mature.length > 0 ? mature : logs.filter((l) => l.rating !== Rating.Manual);
  if (pool.length === 0) return { rate: 0, reviewed: 0 };
  const passed = pool.filter((l) => l.rating !== Rating.Again).length;
  return { rate: Math.round((passed / pool.length) * 100), reviewed: pool.length };
}

export function reviewsToday(logs: ReviewLog[]): number {
  const t = todayKey();
  return logs.filter((l) => dayKey(l.review) === t).length;
}

export function newIntroducedToday(store: Store): number {
  const t = todayKey();
  return store.logs.filter((l) => dayKey(l.review) === t && l.state === State.New).length;
}

export function dueCards(cards: Card[], now = Date.now()): Card[] {
  return cards.filter((c) => c.due <= now);
}

export function deckStats(cards: Card[], now = Date.now()) {
  const map = new Map<string, { total: number; due: number; fresh: number }>();
  for (const c of cards) {
    const e = map.get(c.deck) ?? { total: 0, due: 0, fresh: 0 };
    e.total += 1;
    if (c.due <= now) e.due += 1;
    if (c.state === State.New) e.fresh += 1;
    map.set(c.deck, e);
  }
  return [...map.entries()]
    .map(([deck, stats]) => ({ deck, ...stats }))
    .sort((a, b) => a.deck.localeCompare(b.deck));
}

export function last14Days(logs: ReviewLog[]): { day: string; label: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const l of logs) {
    const k = dayKey(l.review);
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  const out: { day: string; label: string; count: number }[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const k = dayKey(d.getTime());
    out.push({
      day: k,
      label: String(d.getDate()),
      count: counts.get(k) ?? 0,
    });
  }
  return out;
}

export function overallCounts(store: Store, now = Date.now()) {
  const cards = store.cards;
  const due = cards.filter((c) => c.due <= now);
  return {
    total: cards.length,
    due: due.length,
    newCards: cards.filter((c) => c.state === State.New).length,
    learning: cards.filter((c) => c.state === State.Learning || c.state === State.Relearning).length,
    mature: cards.filter((c) => c.state === State.Review && c.stability >= 21).length,
    reviews: store.logs.length,
    reviewsToday: reviewsToday(store.logs),
  };
}
