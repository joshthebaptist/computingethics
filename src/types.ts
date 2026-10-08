export type CardKind = 'basic' | 'cloze' | 'code';

export interface SrsFields {
  due: number;
  stability: number;
  difficulty: number;
  elapsed_days: number;
  scheduled_days: number;
  reps: number;
  lapses: number;
  state: number;
  last_review?: number;
}

export interface Card extends SrsFields {
  id: string;
  deck: string;
  tags: string[];
  kind: CardKind;
  front: string;
  back: string;
  text: string;
  code: string;
  source: string;
  created: number;
}

export interface ReviewLog {
  id: string;
  cardId: string;
  deck: string;
  rating: number;
  state: number;
  review: number;
  stability: number;
  elapsed_days: number;
}

export interface Store {
  version: 1;
  cards: Card[];
  logs: ReviewLog[];
  dailyNewLimit: number;
  dailyReviewLimit: number;
  seeded: boolean;
}

export interface CardDraft {
  kind: CardKind;
  deck: string;
  front?: string;
  back?: string;
  text?: string;
  code?: string;
}
