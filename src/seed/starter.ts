import type { Card } from '../types';
import { newSrsFields } from '../scheduler';
import data from './starter-deck.json';

type SeedCard = Omit<Card, 'due' | 'stability' | 'difficulty' | 'elapsed_days' | 'scheduled_days' | 'reps' | 'lapses' | 'state' | 'last_review'>;

export function seedCards(): Card[] {
  return (data as unknown as SeedCard[]).map((c) => ({ ...c, ...newSrsFields() }));
}
