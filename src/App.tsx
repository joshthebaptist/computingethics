import { useCallback, useEffect, useState } from 'react';
import { Rating } from 'ts-fsrs';
import type { Card, CardDraft, Store } from './types';
import { clearStore, defaultStore, loadStore, saveStore } from './storage';
import { applyRating, makeCard } from './scheduler';
import { hasCloze } from './markdown';
import { seedCards } from './seed/starter';
import Review from './components/Review';
import AddCard from './components/AddCard';
import Notes from './components/Notes';
import Stats from './components/Stats';
import DataPort from './components/DataPort';

type Tab = 'review' | 'add' | 'notes' | 'stats' | 'data';

const TABS: { id: Tab; label: string }[] = [
  { id: 'review', label: 'Review' },
  { id: 'add', label: 'Add' },
  { id: 'notes', label: 'Notes' },
  { id: 'stats', label: 'Stats' },
  { id: 'data', label: 'Data' },
];

function initialStore(): Store {
  const s = loadStore();
  if (s.seeded) return s;
  const existing = new Set(s.cards.map((c) => c.id));
  const seeded = seedCards().filter((c) => !existing.has(c.id));
  return { ...s, cards: [...s.cards, ...seeded], seeded: true };
}

export default function App() {
  const [store, setStore] = useState<Store>(initialStore);
  const [tab, setTab] = useState<Tab>('review');
  const [draft, setDraft] = useState<CardDraft | null>(null);
  const [toast, setToast] = useState('');

  useEffect(() => saveStore(store), [store]);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(''), 2600);
    return () => clearTimeout(t);
  }, [toast]);

  const addCard = useCallback((card: Card, message = 'Card added') => {
    setStore((s) => ({ ...s, cards: [...s.cards, card] }));
    setToast(message);
  }, []);

  const rate = useCallback((card: Card, rating: Rating): Card => {
    const { card: updated, log } = applyRating(card, rating);
    setStore((s) => ({
      ...s,
      cards: s.cards.map((c) => (c.id === updated.id ? updated : c)),
      logs: [...s.logs, log],
    }));
    return updated;
  }, []);

  const clozeFromNotes = useCallback(
    (text: string, deck: string) => {
      const body = hasCloze(text) ? text : `{{${text}}}`;
      addCard(makeCard({ kind: 'cloze', deck, text: body }, deck), 'Cloze card added');
    },
    [addCard],
  );

  const questionFromNotes = useCallback((line: string, deck: string) => {
    setDraft({ kind: 'basic', deck, front: '', back: line });
    setTab('add');
  }, []);

  const importStore = useCallback((incoming: Store, mode: 'merge' | 'replace') => {
    setStore((s) => {
      if (mode === 'replace') return { ...incoming, seeded: true };
      const byId = new Map(s.cards.map((c) => [c.id, c]));
      for (const c of incoming.cards) byId.set(c.id, c);
      const logIds = new Set(s.logs.map((l) => l.id));
      const logs = [...s.logs, ...incoming.logs.filter((l) => !logIds.has(l.id))];
      return { ...s, cards: [...byId.values()], logs, seeded: true };
    });
  }, []);

  const restoreSeed = useCallback(() => {
    setStore((s) => {
      const existing = new Set(s.cards.map((c) => c.id));
      const added = seedCards().filter((c) => !existing.has(c.id));
      return { ...s, cards: [...s.cards, ...added], seeded: true };
    });
    setToast('Starter deck restored');
  }, []);

  const deleteDeck = useCallback((deck: string) => {
    if (!confirm(`Delete every card in "${deck}"? Review history is kept.`)) return;
    setStore((s) => ({ ...s, cards: s.cards.filter((c) => c.deck !== deck) }));
  }, []);

  const setLimits = useCallback((newLimit: number, reviewLimit: number) => {
    setStore((s) => ({
      ...s,
      dailyNewLimit: Math.max(0, Math.min(999, newLimit)),
      dailyReviewLimit: Math.max(1, Math.min(9999, reviewLimit)),
    }));
    setToast('Daily limits saved');
  }, []);

  const clearAll = useCallback(() => {
    clearStore();
    setStore({ ...defaultStore(), seeded: true });
    setToast('All data erased');
  }, []);

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">⌁</span>
          <span>
            Ethics Decks <em>· Computing Ethics</em>
          </span>
        </div>
        <nav className="tabs">
          {TABS.map((t) => (
            <button key={t.id} className={`tab ${tab === t.id ? 'tab-active' : ''}`} onClick={() => setTab(t.id)}>
              {t.label}
            </button>
          ))}
        </nav>
      </header>

      <main className="main">
        {tab === 'review' && <Review store={store} onRate={rate} />}
        {tab === 'add' && (
          <AddCard store={store} draft={draft} onAdd={addCard} onDraftConsumed={() => setDraft(null)} />
        )}
        {tab === 'notes' && <Notes onCloze={clozeFromNotes} onQuestion={questionFromNotes} />}
        {tab === 'stats' && <Stats store={store} onDeleteDeck={deleteDeck} />}
        {tab === 'data' && (
          <DataPort
            store={store}
            onImport={importStore}
            onRestoreSeed={restoreSeed}
            onClear={clearAll}
            onSetLimits={setLimits}
          />
        )}
      </main>

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
