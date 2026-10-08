import re
import zipfile
from pathlib import Path
from xml.etree import ElementTree as ET

NS = {"a": "http://schemas.openxmlformats.org/drawingml/2006/main"}
SRC = Path(r"C:\Users\User\Desktop\Computing Ethics")
OUT = Path(r"C:\Users\User\computingethics\notes")
OUT.mkdir(parents=True, exist_ok=True)


def slide_num(name: str) -> int:
    m = re.search(r"slide(\d+)\.xml$", name)
    return int(m.group(1)) if m else 0


def extract_text(path: Path) -> list[list[str]]:
    slides = []
    with zipfile.ZipFile(path) as z:
        names = sorted(
            [n for n in z.namelist() if re.match(r"ppt/slides/slide\d+\.xml$", n)],
            key=slide_num,
        )
        for n in names:
            root = ET.fromstring(z.read(n))
            paras = []
            for p in root.iter(f"{{{NS['a']}}}p"):
                txt = "".join(
                    t.text or "" for t in p.iter(f"{{{NS['a']}}}t")
                ).strip()
                if txt:
                    paras.append(txt)
            slides.append(paras)
    return slides


def to_markdown(title: str, slides: list[list[str]]) -> str:
    lines = [f"# {title}", ""]
    for i, paras in enumerate(slides, 1):
        lines.append(f"## Slide {i}")
        lines.append("")
        for p in paras:
            clean = re.sub(r"\s+", " ", p).strip()
            if not clean:
                continue
            if len(clean) > 1 and (clean[0].isdigit() and clean[1] in ".)"):
                lines.append(f"- {clean}")
            else:
                lines.append(f"- {clean}")
        lines.append("")
    return "\n".join(lines)


for pptx in sorted(SRC.glob("*.pptx")):
    title = pptx.stem.replace(" (1)", "").strip()
    md_name = re.sub(r"[^\w\s-]", "", title).strip().replace(" ", "-").lower() + ".md"
    slides = extract_text(pptx)
    (OUT / md_name).write_text(to_markdown(title, slides), encoding="utf-8")
    print(f"{pptx.name} -> {md_name} ({len(slides)} slides)")
