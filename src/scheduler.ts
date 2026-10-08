import { Rating, State, createEmptyCard, fsrs, type Card as FsrsCard, type Grade } from 'ts-fsrs';
import type { Card, ReviewLog, SrsFields, CardDraft } from './types';

export const scheduler = fsrs();

function uid(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `id-${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
}

export function newSrsFields(now = new Date()): SrsFields {
  const c = createEmptyCard(now);
  return toSrsFields(c);
}

export function toFsrs(card: Card): FsrsCard {
  return {
    due: new Date(card.due),
    stability: card.stability,
    difficulty: card.difficulty,
    elapsed_days: card.elapsed_days,
    scheduled_days: card.scheduled_days,
    reps: card.reps,
    lapses: card.lapses,
    state: card.state as State,
    last_review: card.last_review === undefined ? undefined : new Date(card.last_review),
  };
}

function toSrsFields(c: FsrsCard): SrsFields {
  return {
    due: c.due.getTime(),
    stability: c.stability,
    difficulty: c.difficulty,
    elapsed_days: c.elapsed_days,
    scheduled_days: c.scheduled_days,
    reps: c.reps,
    lapses: c.lapses,
    state: c.state,
    last_review: c.last_review ? c.last_review.getTime() : undefined,
  };
}

export function previewRatings(card: Card, now = new Date()) {
  const record = scheduler.repeat(toFsrs(card), now);
  return (Object.keys(record) as unknown as Grade[])
    .map((rating) => {
      const item = record[rating];
      return {
        rating,
        due: item.card.due.getTime(),
        intervalMs: item.card.due.getTime() - now.getTime(),
      };
    })
    .sort((a, b) => a.rating - b.rating);
}

export function applyRating(card: Card, rating: Rating, now = new Date()): { card: Card; log: ReviewLog } {
  const item = scheduler.next(toFsrs(card), now, rating as Grade);
  const updated: Card = { ...card, ...toSrsFields(item.card) };
  const log: ReviewLog = {
    id: uid(),
    cardId: card.id,
    deck: card.deck,
    rating: item.log.rating,
    state: item.log.state,
    review: item.log.review.getTime(),
    stability: item.log.stability,
    elapsed_days: item.log.elapsed_days,
  };
  return { card: updated, log };
}

export function makeCard(draft: CardDraft, source = 'manual'): Card {
  return {
    id: uid(),
    deck: draft.deck,
    tags: [],
    kind: draft.kind,
    front: draft.front ?? '',
    back: draft.back ?? '',
    text: draft.text ?? '',
    code: draft.code ?? '',
    source,
    created: Date.now(),
    ...newSrsFields(),
  };
}

export function formatInterval(ms: number): string {
  if (ms < 0) ms = 0;
  const min = ms / 60000;
  if (min < 60) return `${Math.max(1, Math.round(min))}m`;
  const h = min / 60;
  if (h < 24) return `${Math.round(h)}h`;
  const d = h / 24;
  if (d < 30) return `${Math.round(d)}d`;
  const mo = d / 30;
  if (mo < 12) return `${mo.toFixed(1)}mo`;
  return `${(mo / 12).toFixed(1)}y`;
}

export const RATING_NAMES: Record<number, string> = {
  [Rating.Again]: 'Again',
  [Rating.Hard]: 'Hard',
  [Rating.Good]: 'Good',
  [Rating.Easy]: 'Easy',
};
