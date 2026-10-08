function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function inline(s: string): string {
  return s
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em>$2</em>');
}

export function renderMarkdown(md: string): string {
  const lines = escapeHtml(md).split(/\r?\n/);
  const out: string[] = [];
  let list: string[] = [];
  let para: string[] = [];
  let inCode = false;
  let codeBuf: string[] = [];

  const flushList = () => {
    if (list.length) {
      out.push(`<ul>${list.map((l) => `<li>${inline(l)}</li>`).join('')}</ul>`);
      list = [];
    }
  };
  const flushPara = () => {
    if (para.length) {
      out.push(`<p>${inline(para.join(' '))}</p>`);
      para = [];
    }
  };

  for (const line of lines) {
    if (line.trim().startsWith('```')) {
      if (inCode) {
        out.push(`<pre><code>${codeBuf.join('\n')}</code></pre>`);
        codeBuf = [];
        inCode = false;
      } else {
        flushList();
        flushPara();
        inCode = true;
      }
      continue;
    }
    if (inCode) {
      codeBuf.push(line);
      continue;
    }
    const h = /^(#{1,4})\s+(.*)$/.exec(line);
    if (h) {
      flushList();
      flushPara();
      const level = Math.min(h[1].length + 2, 6);
      out.push(`<h${level}>${inline(h[2])}</h${level}>`);
      continue;
    }
    const li = /^\s*[-*]\s+(.*)$/.exec(line);
    if (li) {
      flushPara();
      list.push(li[1]);
      continue;
    }
    if (!line.trim()) {
      flushList();
      flushPara();
      continue;
    }
    flushList();
    para.push(line.trim());
  }
  if (inCode) out.push(`<pre><code>${codeBuf.join('\n')}</code></pre>`);
  flushList();
  flushPara();
  return out.join('\n');
}

const CLOZE_RE = /\{\{([^{}]+)\}\}/g;

export function renderCloze(text: string, showAnswers: boolean): string {
  const escaped = escapeHtml(text);
  if (showAnswers) {
    return escaped.replace(CLOZE_RE, '<span class="cloze-answer">[$1]</span>');
  }
  let n = 0;
  return escaped.replace(CLOZE_RE, (_m, answer: string) => {
    n += 1;
    const width = Math.min(Math.max(answer.length + 2, 6), 24);
    return `<span class="cloze-blank" style="min-width:${width}ch">${n}</span>`;
  });
}

export function hasCloze(text: string): boolean {
  return /\{\{[^{}]+\}\}/.test(text);
}

export function wrapSelectionInCloze(text: string, start: number, end: number): string {
  const selected = text.slice(start, end);
  if (!selected.trim()) return text;
  return text.slice(0, start) + `{{${selected}}}` + text.slice(end);
}

export function clozeFirstOccurrence(line: string, word: string): string | null {
  if (!word.trim()) return null;
  const idx = line.toLowerCase().indexOf(word.trim().toLowerCase());
  if (idx < 0) return null;
  return line.slice(0, idx) + `{{${line.slice(idx, idx + word.length)}}}` + line.slice(idx + word.length);
}
