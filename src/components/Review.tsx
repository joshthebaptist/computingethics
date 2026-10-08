import { useEffect, useMemo, useState } from 'react';
import { Rating, State } from 'ts-fsrs';
import type { Card, Store } from '../types';
import { formatInterval, previewRatings, RATING_NAMES } from '../scheduler';
import { renderCloze, renderMarkdown } from '../markdown';
import { dayKey, newIntroducedToday, streaks, todayKey } from '../stats';

interface Props {
  store: Store;
  onRate: (card: Card, rating: Rating) => Card;
}

interface Session {
  filter: string;
  queue: Card[];
  total: number;
  flipped: boolean;
  sessionRatings: number[];
}

function buildQueue(store: Store, filter: string): Card[] {
  const now = Date.now();
  let newQuota = Math.max(0, store.dailyNewLimit - newIntroducedToday(store));
  let reviewQuota = store.dailyReviewLimit;
  const due = store.cards
    .filter((c) => c.due <= now)
    .filter((c) => filter === 'all' || c.deck === filter)
    .sort((a, b) => {
      const aNew = a.state === State.New ? 0 : 1;
      const bNew = b.state === State.New ? 0 : 1;
      if (aNew !== bNew) return aNew - bNew;
      return a.due - b.due;
    });

  const queue: Card[] = [];
  for (const c of due) {
    if (c.state === State.New) {
      if (newQuota <= 0) continue;
      newQuota -= 1;
    } else {
      if (reviewQuota <= 0) continue;
      reviewQuota -= 1;
    }
    queue.push(c);
  }
  return queue;
}

function CardFace({ card, showAnswer }: { card: Card; showAnswer: boolean }) {
  if (card.kind === 'cloze') {
    return (
      <div className="card-face cloze-face" dangerouslySetInnerHTML={{ __html: renderCloze(card.text, showAnswer) }} />
    );
  }
  return (
    <>
      <div className="card-face" dangerouslySetInnerHTML={{ __html: renderMarkdown(card.front) }} />
      {showAnswer && (
        <div className="card-back">
          {card.kind === 'code' && card.code && <pre className="code-block">{card.code}</pre>}
          <div dangerouslySetInnerHTML={{ __html: renderMarkdown(card.back) }} />
        </div>
      )}
    </>
  );
}

export default function Review({ store, onRate }: Props) {
  const [session, setSession] = useState<Session>(() => {
    const queue = buildQueue(store, 'all');
    return { filter: 'all', queue, total: queue.length, flipped: false, sessionRatings: [] };
  });

  const decks = useMemo(() => {
    const names = new Set(store.cards.map((c) => c.deck));
    return ['all', ...[...names].sort()];
  }, [store.cards]);

  const card = session.queue[0];
  const progress = session.total - session.queue.length;
  const { current: streak } = streaks(store.logs);

  const switchFilter = (filter: string) => {
    const queue = buildQueue(store, filter);
    setSession({ filter, queue, total: queue.length, flipped: false, sessionRatings: [] });
  };

  const rate = (rating: Rating) => {
    if (!card || !session.flipped) return;
    const updated = onRate(card, rating);
    setSession((s) => {
      const rest = s.queue.slice(1);
      const queue = rating === Rating.Again ? [...rest, updated] : rest;
      return { ...s, queue, flipped: false, sessionRatings: [...s.sessionRatings, rating] };
    });
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT')) return;
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        setSession((s) => ({ ...s, flipped: !s.flipped }));
        return;
      }
      if (session.flipped && ['1', '2', '3', '4'].includes(e.key)) {
        e.preventDefault();
        rate(Number(e.key) as Rating);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const previews = useMemo(() => (card && session.flipped ? previewRatings(card) : []), [card, session.flipped]);
  const doneToday = store.logs.filter((l) => dayKey(l.review) === todayKey()).length;

  if (store.cards.length === 0) {
    return (
      <div className="panel empty-state">
        <h2>No cards yet</h2>
        <p>Create your first card from the <strong>Add</strong> tab, or turn lecture note lines into cards from the <strong>Notes</strong> tab.</p>
      </div>
    );
  }

  return (
    <div className="review-wrap">
      <div className="review-toolbar">
        <div className="deck-chips">
          {decks.map((d) => (
            <button
              key={d}
              className={`chip ${session.filter === d ? 'chip-active' : ''}`}
              onClick={() => switchFilter(d)}
            >
              {d === 'all' ? 'All decks' : d}
            </button>
          ))}
        </div>
        <div className="review-meta">
          <span className="pill pill-due">{session.queue.length} in queue</span>
          <span className="pill">{progress}/{session.total} done</span>
          <span className="pill">🔥 {streak} day streak</span>
        </div>
      </div>

      {!card ? (
        <div className="panel empty-state">
          <h2>{session.total === 0 ? 'Nothing due right now' : 'Session complete'}</h2>
          <p>
            {session.total === 0
              ? 'All caught up. New cards appear when they are due — a little every day beats cramming.'
              : `You reviewed ${session.sessionRatings.length} cards. ${doneToday} reviews logged today.`}
          </p>
          <button className="btn btn-primary" onClick={() => switchFilter(session.filter)}>
            Rebuild queue
          </button>
        </div>
      ) : (
        <>
          <div className="panel card-panel">
            <div className="card-header">
              <span className="badge">{card.deck}</span>
              <span className="badge badge-kind">{card.kind}</span>
              {card.tags.map((t) => (
                <span className="badge badge-tag" key={t}>
                  {t}
                </span>
              ))}
            </div>
            <CardFace card={card} showAnswer={session.flipped} />
            {!session.flipped ? (
              <button className="btn btn-primary btn-flip" onClick={() => setSession((s) => ({ ...s, flipped: true }))}>
                Show answer <kbd>space</kbd>
              </button>
            ) : (
              <div className="rating-row">
                {previews.map((p) => (
                  <button
                    key={p.rating}
                    className={`btn btn-rate rate-${p.rating}`}
                    onClick={() => rate(p.rating)}
                  >
                    <span>{RATING_NAMES[p.rating]}</span>
                    <small>{formatInterval(p.intervalMs)}</small>
                  </button>
                ))}
              </div>
            )}
            {session.flipped && (
              <div className="rate-hint">
                press <kbd>1</kbd>–<kbd>4</kbd> to rate
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
