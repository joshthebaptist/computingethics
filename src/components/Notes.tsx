import { useEffect, useMemo, useRef, useState } from 'react';
import { LECTURES, type Lecture } from '../notes';
import { renderMarkdown } from '../markdown';

interface Props {
  onCloze: (text: string, deck: string) => void;
  onQuestion: (line: string, deck: string) => void;
}

export default function Notes({ onCloze, onQuestion }: Props) {
  const [lecture, setLecture] = useState<Lecture>(LECTURES[2]);
  const [selection, setSelection] = useState('');
  const [clickedLine, setClickedLine] = useState('');
  const contentRef = useRef<HTMLDivElement>(null);
  const html = useMemo(() => renderMarkdown(lecture.md), [lecture]);

  useEffect(() => {
    setSelection('');
    setClickedLine('');
  }, [lecture.id]);

  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    const onClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const li = target.closest('li');
      if (!li || !el.contains(li)) return;
      const sel = window.getSelection();
      const selected = sel && !sel.isCollapsed ? sel.toString().trim() : '';
      setSelection(selected);
      setClickedLine(li.textContent?.trim() ?? '');
    };
    el.addEventListener('click', onClick);
    return () => el.removeEventListener('click', onClick);
  }, [html]);

  const makeCloze = () => {
    const target = selection || clickedLine;
    if (!target) return;
    const text = selection ? target : `{{${target}}}`;
    onCloze(text, lecture.title);
    setSelection('');
    setClickedLine('');
  };

  const makeQuestion = () => {
    const target = selection || clickedLine;
    if (!target) return;
    onQuestion(target, lecture.title);
    setSelection('');
    setClickedLine('');
  };

  return (
    <div className="notes-wrap">
      <aside className="notes-sidebar">
        <h3>Lectures</h3>
        {LECTURES.map((l) => (
          <button
            key={l.id}
            className={`notes-link ${l.id === lecture.id ? 'notes-link-active' : ''}`}
            onClick={() => setLecture(l)}
          >
            {l.title}
          </button>
        ))}
      </aside>
      <section className="notes-content">
        <div className="notes-hint">
          Click any bullet to select it (drag to select part of it), then turn it into a card →
        </div>
        <article className="notes-body" ref={contentRef} dangerouslySetInnerHTML={{ __html: html }} />
      </section>

      {(clickedLine || selection) && (
        <div className="action-bar">
          <span className="action-quote">{(selection || clickedLine).slice(0, 80)}{(selection || clickedLine).length > 80 ? '…' : ''}</span>
          <button className="btn btn-mini btn-primary" onClick={makeCloze}>
            {selection ? '→ Cloze card' : '→ Cloze (whole line)'}
          </button>
          <button className="btn btn-mini" onClick={makeQuestion}>
            → Q&amp;A card
          </button>
          <button
            className="btn btn-ghost btn-mini"
            onClick={() => {
              setSelection('');
              setClickedLine('');
            }}
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
