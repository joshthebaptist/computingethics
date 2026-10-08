import json
import re
import uuid
from pathlib import Path

NOTES = Path(r"C:\Users\User\computingethics\notes")
OUT = Path(r"C:\Users\User\computingethics\src\seed\starter-deck.json")
CREATED = 1791000000000  # fixed timestamp for reproducible seeds

NOISE = re.compile(
    r"^(lecture outline|tip|source:|part \d|question:|\d{2}$|tttt\d*|ethical computing)",
    re.I,
)
DEF_RE = re.compile(
    r"^(?P<subj>[^.?!:]{3,70}?)\s+(?P<verb>is a|is an|is the|are a|are the|refers to|means|is defined as|is known as)\s+(?P<rest>.{15,400})$",
    re.I,
)
TERM_PAIR = re.compile(r"^[A-Z][\w\s/&'-]{2,50}$")


def lines_of(md_path: Path):
    deck = None
    slide = 0
    out = []
    for raw in md_path.read_text(encoding="utf-8").splitlines():
        h = re.match(r"# (.+)", raw)
        if h:
            deck = h.group(1).strip()
            continue
        s = re.match(r"## Slide (\d+)", raw)
        if s:
            slide = int(s.group(1))
            continue
        b = re.match(r"- (.*)", raw)
        if b:
            text = re.sub(r"\s+", " ", b.group(1)).strip()
            if text:
                out.append((deck, slide, text))
    return out


cards = []
seen = set()


def add(deck, kind, *, front="", back="", text="", tags=None):
    key = (kind, (front or text).lower())
    if key in seen:
        return
    seen.add(key)
    cards.append(
        {
            "id": "seed_" + uuid.uuid4().hex[:12],
            "deck": deck,
            "tags": tags or ["auto"],
            "kind": kind,
            "front": front,
            "back": back,
            "text": text,
            "code": "",
            "source": deck,
            "created": CREATED,
        }
    )


for md in sorted(NOTES.glob("*.md")):
    entries = lines_of(md)
    def_matches = []
    for i, (deck, slide, text) in enumerate(entries):
        if NOISE.search(text) or text.endswith("?"):
            continue
        m = DEF_RE.match(text)
        if m:
            subj = m.group("subj").strip().rstrip(":")
            words = subj.split()
            if subj[0] in "“\"'([" or "'" in subj or "’" in subj:
                continue
            if words[-1].lower().endswith("ing"):
                continue
            if (
                1 <= len(words) <= 8
                and not subj.lower().startswith(("we ", "it ", "they ", "this ", "these "))
                and subj.lower() not in {"man", "woman", "people", "life", "thing", "things", "good", "bad"}
            ):
                def_matches.append((i, deck, slide, subj, m.group("rest").strip()))

    taken_slides = set()
    per_deck = 0
    for (i, deck, slide, subj, rest) in def_matches:
        if per_deck >= 8:
            break
        if slide in taken_slides and len(taken_slides) >= 4:
            continue
        # rebuild cloze from original line
        orig = entries[i][2]
        idx = orig.lower().find(subj.lower())
        cloze = orig[:idx] + "{{" + orig[idx : idx + len(subj)] + "}}" + orig[idx + len(subj) :]
        add(deck, "cloze", text=cloze)
        add(deck, "basic", front=f"What is meant by {subj.lower()}?", back=orig)
        taken_slides.add(slide)
        per_deck += 2

    # term + description pairs: "Softlifting" / "Buying one licence and ..."
    pair_count = 0
    for i in range(len(entries) - 1):
        if pair_count >= 4:
            break
        deck, slide, term = entries[i]
        _, _, desc = entries[i + 1]
        if deck != entries[i + 1][0]:
            continue
        if not TERM_PAIR.match(term) or term.endswith("?"):
            continue
        if "&" in term or term.split()[0] in {"What", "How", "Why", "When", "Where", "List", "Explain"}:
            continue
        if " is " in term.lower() or len(desc.split()) < 6 or len(desc.split()) > 30:
            continue
        if NOISE.search(desc) or desc.split()[0] in {"What", "How", "Why", "When", "Where", "List", "Explain"} or "?" in desc:
            continue
        add(deck, "basic", front=f"What is {term}?", back=desc, tags=["key-term"])
        pair_count += 1
        per_deck += 1


def text_after(entries, i):
    return entries[i][2]


def text_after(entries, i):
    return entries[i][2]


HAND = [
    {
        "deck": "L2 Ethical Dilemma",
        "kind": "basic",
        "front": "Explain the difference between a moral temptation and a true ethical dilemma (Kidder).",
        "back": "**Right vs wrong** is a moral *temptation* — e.g. copying a friend's code. The answer is clear; the challenge is doing it.\n\n**Right vs right** is a true *dilemma* — both options are defensible, so some value is sacrificed either way. The four common patterns: truth vs loyalty, individual vs community, short term vs long term, justice vs mercy.",
        "tags": ["explain-why"],
    },
    {
        "deck": "L2 Ethical Dilemma",
        "kind": "basic",
        "front": "List the four steps of ethical analysis and decision making (Kallman & Grillo).",
        "back": "1. **Understand the situation** — facts, ethical issues, harms, stakeholders\n2. **Isolate the dilemma** — state it as: *Should X do Y?*\n3. **Analyse both alternatives** — utilitarianism, rights & duties, Kant\n4. **Decide and plan** — defend the decision and plan its implementation",
        "tags": ["explain-why"],
    },
    {
        "deck": "L3 Intro to Ethics",
        "kind": "basic",
        "front": "Explain why ethics, in the Islamic view of *akhlak*, requires practice and not just knowledge.",
        "back": "Akhlak is a firmly rooted state of the soul that moves a person to do good and reject evil. It develops in two stages: (1) careful consideration and reflection, then (2) repeated practice until the good deed becomes a habit — so good actions flow easily without long deliberation. Some qualities (e.g. readiness to forgive) are natural; most are trained.",
        "tags": ["explain-why"],
    },
    {
        "deck": "L3 Intro to Ethics",
        "kind": "basic",
        "front": "Why is ethics useless if it only stays in the head? What is it a tool for?",
        "back": "Ethical theories are only useful if they affect how people actually *behave* — if you know something is morally good, it would be irrational not to do it. But people are not always rational and often follow gut instinct. Even so, ethics gives us a **toolkit for thinking clearly** about moral issues.",
        "tags": ["explain-why"],
    },
    {
        "deck": "L7 Software Piracy",
        "kind": "basic",
        "front": "Pirates often say 'sharing is caring' and mean well. Explain why a good motive does not automatically make piracy right.",
        "back": "The question to ask is: *does a good motive (sharing to study or enjoy) make the action (copying without permission) right?* Motive does not change the act — developers lose revenue, licences are violated, and sharers still expose recipients to the malware and legal risks of unlicensed copies.",
        "tags": ["explain-why"],
    },
    {
        "deck": "L7 Software Piracy",
        "kind": "basic",
        "front": "Give three reasons beyond legality that pirated software is dangerous.",
        "back": "1. **It leaves you open to attack** — cracks and keygens spread malware (BSA estimates nearly US$359B/year in company costs): data theft, ransomware, identity theft.\n2. **It may stop working when you need it most** — no updates, broken activation.\n3. **It can lead to fines or prosecution.**",
        "tags": ["explain-why"],
    },
    {
        "deck": "L6 Netiquette",
        "kind": "basic",
        "front": "Explain why the early Internet was limited to military, corporate and academic use, and what changed that.",
        "back": "The early Internet was technical and hard to use, so it stayed with institutions — and advertising was not allowed. The **World Wide Web** (Berners-Lee, CERN, 1991) and graphical browsers like **Mosaic** (1993) made it easy and visual, so it opened to everyone.",
        "tags": ["explain-why"],
    },
]

for h in HAND:
    add(h["deck"], h["kind"], front=h["front"], back=h["back"], text="", tags=h["tags"])

OUT.parent.mkdir(parents=True, exist_ok=True)
OUT.write_text(json.dumps(cards, indent=1, ensure_ascii=False), encoding="utf-8")
from collections import Counter

c = Counter(card["deck"] for card in cards)
print(f"total {len(cards)}")
for deck, n in sorted(c.items()):
    print(f"  {deck}: {n}")
