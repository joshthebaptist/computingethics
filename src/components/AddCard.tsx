import { useEffect, useMemo, useRef, useState } from 'react';
import type { Card, CardDraft, CardKind, Store } from '../types';
import { makeCard } from '../scheduler';
import { clozeFirstOccurrence, wrapSelectionInCloze } from '../markdown';

interface Props {
  store: Store;
  draft: CardDraft | null;
  onAdd: (card: Card) => void;
  onDraftConsumed: () => void;
}

interface QuickLine {
  index: number;
  text: string;
  start: number;
  end: number;
}

const NEW_DECK = '__new__';

export default function AddCard({ store, draft, onAdd, onDraftConsumed }: Props) {
  const decks = useMemo(() => [...new Set(store.cards.map((c) => c.deck))].sort(), [store.cards]);
  const [kind, setKind] = useState<CardKind>('basic');
  const [deck, setDeck] = useState(decks[0] ?? 'Computing Ethics');
  const [newDeckName, setNewDeckName] = useState('');
  const [front, setFront] = useState('');
  const [back, setBack] = useState('');
  const [text, setText] = useState('');
  const [code, setCode] = useState('');
  const [answer, setAnswer] = useState('');
  const [paste, setPaste] = useState('');
  const [wordRow, setWordRow] = useState<number | null>(null);
  const [wordValue, setWordValue] = useState('');
  const [showPaste, setShowPaste] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const formRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!draft) return;
    setKind(draft.kind);
    if (draft.deck) {
      setDeck(draft.deck);
      setNewDeckName('');
    }
    setFront(draft.front ?? '');
    setBack(draft.back ?? '');
    setText(draft.text ?? '');
    if (draft.code !== undefined) setCode(draft.code);
    onDraftConsumed();
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [draft, onDraftConsumed]);

  const quickLines: QuickLine[] = useMemo(() => {
    if (!paste.trim()) return [];
    const lines: QuickLine[] = [];
    let offset = 0;
    for (let i = 0; i < paste.length; ) {
      const nl = paste.indexOf('\n', i);
      const end = nl === -1 ? paste.length : nl;
      const raw = paste.slice(i, end);
      const trimmed = raw.trim();
      if (
        trimmed &&
        !trimmed.startsWith('#') &&
        !/^\d{2}$/.test(trimmed) &&
        !trimmed.startsWith('PART ') &&
        !trimmed.startsWith('Lecture Outline')
      ) {
        lines.push({ index: lines.length, text: trimmed, start: i + (raw.indexOf(trimmed)), end: i + raw.indexOf(trimmed) + trimmed.length });
      }
      offset = end + 1;
      i = offset;
    }
    return lines.slice(0, 300);
  }, [paste]);

  const resolvedDeck = deck === NEW_DECK ? newDeckName.trim() || 'Untitled deck' : deck;

  const saveCard = (card: Card) => {
    onAdd(card);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (kind === 'basic') {
      if (!front.trim() || !back.trim()) return;
      saveCard(makeCard({ kind, deck: resolvedDeck, front: front.trim(), back: back.trim() }));
      setFront('');
      setBack('');
    } else if (kind === 'cloze') {
      if (!/\{\{[^{}]+\}\}/.test(text)) return;
      saveCard(makeCard({ kind, deck: resolvedDeck, text }));
      setText('');
    } else {
      if (!front.trim() || !answer.trim()) return;
      saveCard(makeCard({ kind, deck: resolvedDeck, front: front.trim(), back: answer.trim(), code }));
      setFront('');
      setCode('');
      setAnswer('');
    }
  };

  const lineHasSelection = (line: QuickLine): boolean => {
    const ta = textareaRef.current;
    if (!ta || ta.selectionStart === ta.selectionEnd) return false;
    return ta.selectionStart >= line.start && ta.selectionEnd <= line.end;
  };

  const clozeFromLine = (line: QuickLine) => {
    const ta = textareaRef.current;
    if (ta && ta.selectionStart >= line.start && ta.selectionEnd <= line.end && ta.selectionStart !== ta.selectionEnd) {
      const updated = wrapSelectionInCloze(paste, ta.selectionStart, ta.selectionEnd);
      setPaste(updated);
      saveCard(makeCard({ kind: 'cloze', deck: resolvedDeck, text: line.text.slice(0, ta.selectionStart - line.start) + `{{${paste.slice(ta.selectionStart, ta.selectionEnd)}}}` + line.text.slice(ta.selectionEnd - line.start) }));
      return;
    }
    setWordRow(line.index);
    setWordValue('');
  };

  const confirmWord = (line: QuickLine) => {
    const clozed = clozeFirstOccurrence(line.text, wordValue);
    if (!clozed) return;
    saveCard(makeCard({ kind: 'cloze', deck: resolvedDeck, text: clozed }));
    setWordRow(null);
    setWordValue('');
  };

  const qaFromLine = (line: QuickLine) => {
    setKind('basic');
    setFront('');
    setBack(line.text);
    setShowPaste(true);
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="add-wrap">
      <div className="panel" ref={formRef}>
        <h2>Add a card</h2>
        <div className="kind-tabs">
          {(['basic', 'cloze', 'code'] as CardKind[]).map((k) => (
            <button key={k} className={`tab ${kind === k ? 'tab-active' : ''}`} onClick={() => setKind(k)}>
              {k === 'basic' ? 'Q&A' : k === 'cloze' ? 'Cloze' : 'Code / trace'}
            </button>
          ))}
        </div>

        <form onSubmit={submit} className="card-form">
          <label>
            Deck
            <select value={deck} onChange={(e) => setDeck(e.target.value)}>
              {decks.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
              <option value={NEW_DECK}>+ New deck…</option>
            </select>
          </label>
          {deck === NEW_DECK && (
            <label>
              New deck name
              <input value={newDeckName} onChange={(e) => setNewDeckName(e.target.value)} placeholder="e.g. L11 AI Ethics" />
            </label>
          )}

          {kind === 'basic' && (
            <>
              <label>
                Question
                <textarea value={front} onChange={(e) => setFront(e.target.value)} rows={2} placeholder="What is the time complexity of binary search, and why?" />
              </label>
              <label>
                Answer
                <textarea value={back} onChange={(e) => setBack(e.target.value)} rows={4} placeholder="Markdown supported. **bold**, `code`, lists…" />
              </label>
            </>
          )}

          {kind === 'cloze' && (
            <label>
              Text with <code>{'{{hidden word}}'}</code>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={5}
                placeholder="A {{stack}} is a LIFO data structure."
              />
              <span className="hint">Tip: select a word below in the paste box and it gets hidden in one click.</span>
            </label>
          )}

          {kind === 'code' && (
            <>
              <label>
                Prompt
                <textarea value={front} onChange={(e) => setFront(e.target.value)} rows={2} placeholder="What does this snippet output?" />
              </label>
              <label>
                Code
                <textarea value={code} onChange={(e) => setCode(e.target.value)} rows={6} className="mono" placeholder="print('hello')" />
              </label>
              <label>
                Answer
                <textarea value={answer} onChange={(e) => setAnswer(e.target.value)} rows={3} className="mono" placeholder="hello" />
              </label>
            </>
          )}

          <button className="btn btn-primary" type="submit">
            Add card <kbd>⌘/Ctrl+Enter</kbd>
          </button>
        </form>
      </div>

      <div className="panel">
        <div className="panel-head">
          <h2>Paste markdown notes</h2>
          <button className="btn btn-ghost" onClick={() => setShowPaste((v) => !v)}>
            {showPaste ? 'Hide' : 'Show'}
          </button>
        </div>
        {showPaste && (
          <>
            <p className="hint">Paste a lecture's notes, then turn any line into a card with one click. Select text inside the box first to hide exactly that word.</p>
            <textarea
              ref={textareaRef}
              className="paste-area"
              value={paste}
              onChange={(e) => setPaste(e.target.value)}
              onSelect={() => setWordRow(null)}
              rows={6}
              placeholder="- Ethical egoism holds that…"
            />
            <div className="quick-lines">
              {quickLines.map((line) => (
                <div className={`quick-line ${wordRow === line.index ? 'quick-line-open' : ''}`} key={line.index}>
                  <span className="quick-text">{line.text}</span>
                  <span className="quick-actions">
                    <button className="btn btn-mini" onClick={() => clozeFromLine(line)}>
                      {lineHasSelection(line) ? 'Hide selection →' : 'Cloze'}
                    </button>
                    <button className="btn btn-mini" onClick={() => qaFromLine(line)}>
                      Q&amp;A
                    </button>
                  </span>
                  {wordRow === line.index && (
                    <span className="word-ask">
                      <input
                        autoFocus
                        value={wordValue}
                        placeholder="word to hide"
                        onChange={(e) => setWordValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            confirmWord(line);
                          }
                          if (e.key === 'Escape') setWordRow(null);
                        }}
                      />
                      <button className="btn btn-mini btn-primary" onClick={() => confirmWord(line)}>
                        Hide it
                      </button>
                    </span>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
