import { useRef, useState } from 'react';
import type { Store } from '../types';

interface Props {
  store: Store;
  onImport: (incoming: Store, mode: 'merge' | 'replace') => void;
  onRestoreSeed: () => void;
  onClear: () => void;
  onSetLimits: (newLimit: number, reviewLimit: number) => void;
}

function sanitizeStore(raw: unknown): Store | null {
  if (!raw || typeof raw !== 'object') return null;
  const s = raw as Partial<Store>;
  if (!Array.isArray(s.cards) || !Array.isArray(s.logs)) return null;
  return {
    version: 1,
    cards: s.cards,
    logs: s.logs,
    dailyNewLimit: typeof s.dailyNewLimit === 'number' ? s.dailyNewLimit : 20,
    dailyReviewLimit: typeof s.dailyReviewLimit === 'number' ? s.dailyReviewLimit : 200,
    seeded: true,
  };
}

export default function DataPort({ store, onImport, onRestoreSeed, onClear, onSetLimits }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<Store | null>(null);
  const [message, setMessage] = useState('');
  const [newLimit, setNewLimit] = useState(store.dailyNewLimit);
  const [reviewLimit, setReviewLimit] = useState(store.dailyReviewLimit);

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(store, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `computingethics-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setMessage('Exported your full study history as JSON.');
  };

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text());
      const clean = sanitizeStore(parsed);
      if (!clean) {
        setMessage('That file does not look like a valid backup.');
        return;
      }
      setPending(clean);
      setMessage(`Backup loaded: ${clean.cards.length} cards, ${clean.logs.length} reviews. Choose merge or replace.`);
    } catch {
      setMessage('Could not read that file as JSON.');
    }
  };

  return (
    <div className="data-wrap">
      <div className="panel">
        <h2>Back up your data</h2>
        <p className="hint">Your whole study history lives in this browser. Export regularly — it is the only copy.</p>
        <div className="btn-row">
          <button className="btn btn-primary" onClick={exportJson}>
            Export JSON
          </button>
          <button className="btn" onClick={() => fileRef.current?.click()}>
            Import JSON…
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={(e) => {
              onFile(e.target.files?.[0]);
              e.target.value = '';
            }}
          />
        </div>
        {pending && (
          <div className="import-confirm">
            <p>
              <strong>{pending.cards.length}</strong> cards / <strong>{pending.logs.length}</strong> review logs found.
            </p>
            <div className="btn-row">
              <button className="btn btn-primary" onClick={() => { onImport(pending, 'merge'); setPending(null); setMessage('Backup merged into your collection.'); }}>
                Merge with existing
              </button>
              <button className="btn" onClick={() => { onImport(pending, 'replace'); setPending(null); setMessage('Collection replaced with the backup.'); }}>
                Replace everything
              </button>
              <button className="btn btn-ghost" onClick={() => setPending(null)}>
                Cancel
              </button>
            </div>
          </div>
        )}
        {message && <p className="hint">{message}</p>}
      </div>

      <div className="panel">
        <h2>Daily limits</h2>
        <div className="limits-row">
          <label>
            New cards / day
            <input
              type="number"
              min={0}
              max={999}
              value={newLimit}
              onChange={(e) => setNewLimit(Number(e.target.value))}
            />
          </label>
          <label>
            Reviews / day
            <input
              type="number"
              min={1}
              max={9999}
              value={reviewLimit}
              onChange={(e) => setReviewLimit(Number(e.target.value))}
            />
          </label>
          <button className="btn btn-primary" onClick={() => onSetLimits(newLimit, reviewLimit)}>
            Save limits
          </button>
        </div>
      </div>

      <div className="panel">
        <h2>Starter deck</h2>
        <p className="hint">Cards generated from the ten lecture slides. Safe to re-add — duplicates are skipped by id.</p>
        <div className="btn-row">
          <button className="btn" onClick={onRestoreSeed}>
            Restore starter deck
          </button>
          <button
            className="btn btn-danger"
            onClick={() => {
              if (confirm('Erase every card, review log and stat? This cannot be undone unless you exported a backup.')) onClear();
            }}
          >
            Erase all data
          </button>
        </div>
      </div>
    </div>
  );
}
