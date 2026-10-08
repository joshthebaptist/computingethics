# Ethics Decks — Computing Ethics Spaced Repetition

A tiny Anki-style flashcard app for a Computing Ethics course, built as a portfolio project.
Lecture slides are extracted into readable notes in the browser, any note line can become a card
in one click, and reviews are scheduled with **FSRS** (the algorithm behind modern Anki), via
[`ts-fsrs`](https://github.com/open-spaced-repetition/ts-fsrs).

## Why it exists

Active recall (forcing yourself to retrieve the answer) plus a scheduler that shows each card just
before you forget it is what makes flashcards work. This site is those two things, with the friction
of card creation pushed as low as possible.

## Features

- **Review queue** — only cards due today; Again / Hard / Good / Easy with live interval previews.
  Keyboard: `space` to flip, `1`–`4` to rate.
- **Card types**
  - Q&A (definitions, concepts, "explain why" questions)
  - Cloze deletions (`A {{stack}} is a LIFO data structure.`)
  - Code / trace cards (snippet hidden until you flip)
- **Fast capture** — paste markdown notes and turn any line into a cloze or Q&A card in one click;
  select a word first to hide exactly that word.
- **Notes browser** — all ten lectures rendered from the original slides; click a line → card.
- **Decks & tags** — one deck per lecture (plus whatever you create).
- **Stats** — current/best streak, mature recall rate, 14-day review chart, per-deck counts.
- **Daily limits** — new cards/day and reviews/day, editable on the Data tab.
- **Your data, portable** — everything lives in `localStorage`; export/import a single JSON backup.

## Scheduling

[FSRS](https://github.com/open-spaced-repetition/ts-fsrs) (via `ts-fsrs`) with default parameters.
Each rating updates the card's stability/difficulty and sets the next due date; "Again" requeues the
card in the current session.

## Run it

```bash
npm install
npm run dev      # local dev server
npm run build    # typecheck + production build into dist/
```

Open `dist/index.html` (or host `dist/` on GitHub Pages / any static host) — no backend required.
The GitHub Actions workflow in `.github/workflows/deploy.yml` rebuilds and deploys to
GitHub Pages on every push to `main`.

## Repository layout

```
notes/           # markdown notes extracted from the lecture .pptx files
src/             # React app (Vite + TypeScript + ts-fsrs)
  components/    # Review, Add, Notes, Stats, Data screens
  seed/          # starter deck generated from the lectures
tools/           # extract_pptx.py (slides → notes), gen_seed.py (notes → starter deck)
```

## Honest caveat

Anki, RemNote and the Obsidian spaced-repetition plugin already do this well. This project exists to
learn: FSRS integration, offline-first storage, and the UX of low-friction capture.
