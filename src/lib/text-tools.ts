/**
 * Text clean-up used before translation.
 *
 * Scanned pages and PDFs break lines where the printed page ended, not where
 * sentences end. In braille (40 cells per line) those breaks produce ragged,
 * half-empty lines, so imported text is reflowed into real paragraphs.
 */

const BULLET = /^(?:[•●○◦▪‣⁃*-]|\d+[.)]|[a-z][.)])\s/i;

/** True when the text looks hard-wrapped (many lines end mid-sentence). */
export function looksHardWrapped(text: string): boolean {
  const lines = text.split('\n').filter((l) => l.trim().length > 0);
  if (lines.length < 4) return false;
  const midSentence = lines.filter((l) => /[\p{Ll},;-]\s*$/u.test(l)).length;
  return midSentence / lines.length > 0.3;
}

/**
 * Join lines that belong to the same paragraph, repair words hyphenated
 * across lines, and normalise bullets and spacing. Blank lines, list items
 * and short heading-like lines are kept on their own lines.
 */
export function reflowText(text: string): string {
  const lines = text
    .replace(/\r\n?/g, '\n')
    .replace(/\t/g, ' ')
    .split('\n')
    .map((l) => l.replace(/ {2,}/g, ' ').trim());

  // If paragraphs are already separated by blank lines, every other line
  // break is layout. Otherwise, a line ending in sentence punctuation is
  // assumed to end its paragraph.
  const blankLineParagraphs = lines.some((l, i) => !l && i > 0 && lines[i - 1]);

  const out: string[] = [];
  for (const line of lines) {
    const prev = out.length ? out[out.length - 1] : '';
    const startsBlock = !line || BULLET.test(line);
    const endsSentence = /[.!?:”"')\]]$/.test(prev);
    const headingLike = prev.length < 40 && !endsSentence;
    const prevEndsBlock = !prev || headingLike || (!blankLineParagraphs && endsSentence);

    if (!line) {
      if (prev !== '') out.push('');
      continue;
    }
    if (out.length && prev && !startsBlock && !prevEndsBlock) {
      // "infor-" + "mation" → "information"; keep real hyphens before capitals.
      if (/[a-z]-$/.test(prev) && /^[a-z]/.test(line)) out[out.length - 1] = prev.slice(0, -1) + line;
      else out[out.length - 1] = `${prev} ${line}`;
      continue;
    }
    out.push(line.replace(/^[●○◦▪‣⁃]\s*/, '• '));
  }
  while (out.length && out[out.length - 1] === '') out.pop();
  return out.join('\n');
}

/** Words in a text (for counters). */
export function countWords(text: string): number {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}
