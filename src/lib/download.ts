import brailleFontUrl from '@fontsource/noto-sans-symbols-2/files/noto-sans-symbols-2-braille-400-normal.woff2?url';
import type { Grade, Segment } from '@/lib/braille';

export function downloadFile(content: string | Blob, filename: string, mimeType: string) {
  const blob = content instanceof Blob ? content : new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Give the browser a moment to start the download before revoking.
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** "My Worksheet.pdf" → "my-worksheet-grade2.brf" */
export function exportFilename(title: string, grade: Grade, extension: string): string {
  const base =
    title
      .replace(/\.[a-z0-9]{2,4}$/i, '')
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || 'braille';
  return `${base}-grade${grade}.${extension}`;
}

/** Pick a document title from the first line of text. */
export function titleFromText(text: string): string {
  const first = text.trim().split('\n')[0]?.trim() ?? '';
  const words = first.split(/\s+/).slice(0, 8).join(' ');
  return words.length > 3 ? words.replace(/[.,:;!?]+$/, '') : 'Untitled document';
}

const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

/**
 * Print an interline copy: every print word above its braille. Teachers of
 * visually impaired students use this to read and check braille work.
 */
export function printInterline(lines: Segment[][], title: string, grade: Grade) {
  const body = lines
    .map((segments) => {
      const words = segments.filter((s) => s.print.trim());
      if (!words.length) return '<div class="gap"></div>';
      return `<div class="line">${words
        .map((w) => `<span class="pair"><span class="print">${escapeHtml(w.print)}</span><span class="braille">${w.braille}</span></span>`)
        .join('')}</div>`;
    })
    .join('');

  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${escapeHtml(title)}</title>
<style>
@font-face { font-family: 'BB Braille'; src: url('${new URL(brailleFontUrl, location.href).href}') format('woff2'); }
@page { margin: 16mm; }
body { font-family: system-ui, sans-serif; color: #000; margin: 0; }
header { border-bottom: 1px solid #999; margin-bottom: 14pt; padding-bottom: 6pt; }
h1 { font-size: 16pt; margin: 0 0 2pt; }
header p { font-size: 9pt; color: #444; margin: 0; }
.line { display: flex; flex-wrap: wrap; gap: 4pt 12pt; margin-bottom: 10pt; break-inside: avoid; }
.gap { height: 10pt; }
.pair { display: inline-flex; flex-direction: column; }
.print { font-size: 9pt; color: #333; }
.braille { font-family: 'BB Braille', 'Segoe UI Symbol', 'Apple Braille', sans-serif; font-size: 20pt; line-height: 1.2; }
</style></head><body>
<header><h1>${escapeHtml(title)}</h1><p>Unified English Braille, grade ${grade} · interline print copy · made with BrailleBridge</p></header>
${body}
</body></html>`;

  const frame = document.createElement('iframe');
  frame.setAttribute('aria-hidden', 'true');
  frame.tabIndex = -1;
  frame.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;';
  document.body.appendChild(frame);
  const doc = frame.contentDocument!;
  doc.open();
  doc.write(html);
  doc.close();

  const print = () => {
    frame.contentWindow?.focus();
    frame.contentWindow?.print();
    window.setTimeout(() => frame.remove(), 1000);
  };
  // Wait for the braille font so the print preview is not blank.
  const fonts = doc.fonts;
  if (fonts?.ready) {
    void fonts.load("20pt 'BB Braille'", '⠁').finally(() => fonts.ready.then(print));
  } else {
    window.setTimeout(print, 300);
  }
}
