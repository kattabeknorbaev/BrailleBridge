import { describe, expect, it } from 'vitest';
import { asciiToCell, cellToAscii, cellToDots, d, dotsToCell } from '../cells';
import { toBRF, toPEF } from '../export';
import { paginate, type PageLayout } from '../layout';
import { translate } from '../ueb';

const layout = (overrides: Partial<PageLayout> = {}): PageLayout => ({
  cellsPerLine: 20,
  linesPerPage: 5,
  indentParagraphs: false,
  pageNumbers: false,
  ...overrides,
});
const cellLength = (line: string) => [...line].length;

describe('cells', () => {
  it('converts between dots and Unicode cells', () => {
    expect(dotsToCell('1245')).toBe('⠛');
    expect(d('5-1345')).toBe('⠐⠝');
    expect(cellToDots('⠛')).toEqual([1, 2, 4, 5]);
  });

  it('maps all 64 cells to distinct Braille ASCII characters and back', () => {
    const seen = new Set<string>();
    for (let bits = 0; bits < 64; bits++) {
      const cell = String.fromCharCode(0x2800 + bits);
      const ascii = bits === 0 ? ' ' : cellToAscii(cell);
      expect(ascii).toMatch(/^[ -_]$/);
      seen.add(ascii);
      if (bits > 0) expect(asciiToCell(ascii)).toBe(cell);
    }
    expect(seen.size).toBe(64);
  });

  it('uses the standard North American Braille ASCII table', () => {
    expect([...'⠁⠃⠉⠵'].map(cellToAscii).join('')).toBe('ABCZ');
    expect([...'⠼⠠⠮⠯⠿⠷⠾'].map(cellToAscii).join('')).toBe('#,!&=()');
    expect([...'⠂⠆⠒⠲⠢⠖⠶⠦⠔⠴'].map(cellToAscii).join('')).toBe('1234567890');
  });
});

describe('pagination', () => {
  it('wraps words without exceeding the line length', () => {
    const text = 'the quick brown fox jumps over the lazy dog again and again';
    const pages = paginate(translate(text, { grade: 1 }).lines, layout());
    for (const line of pages.flat()) expect(cellLength(line)).toBeLessThanOrEqual(20);
    expect(pages.flat().join(' ').replace(/ +/g, ' ').trim()).toBe(translate(text, { grade: 1 }).braille);
  });

  it('starts a new page after the configured number of lines', () => {
    const text = Array.from({ length: 12 }, (_, i) => `line ${i}`).join('\n');
    const pages = paginate(translate(text, { grade: 1 }).lines, layout());
    expect(pages.map((p) => p.length)).toEqual([5, 5, 2]);
  });

  it('indents paragraphs by two cells', () => {
    const pages = paginate(translate('one\ntwo', { grade: 1 }).lines, layout({ indentParagraphs: true }));
    expect(pages[0]).toEqual(['  ⠕⠝⠑', '  ⠞⠺⠕']);
  });

  it('puts braille page numbers at the right margin of the last line', () => {
    const text = Array.from({ length: 6 }, () => 'word').join('\n');
    const pages = paginate(translate(text, { grade: 1 }).lines, layout({ pageNumbers: true }));
    expect(pages).toHaveLength(2);
    for (const [i, page] of pages.entries()) {
      expect(page).toHaveLength(5);
      const last = page[4];
      expect(cellLength(last)).toBe(20);
      expect(last.endsWith(i === 0 ? '⠼⠁' : '⠼⠃')).toBe(true);
    }
  });

  it('breaks hyphenated words at the hyphen and splits over-long words', () => {
    const hyphenated = paginate(translate('aaaaaaaaaaaa-bbbbbbbbbbbb', { grade: 1 }).lines, layout());
    expect(hyphenated[0][0]).toBe('⠁⠁⠁⠁⠁⠁⠁⠁⠁⠁⠁⠁⠤');
    const long = paginate(translate('a'.repeat(45), { grade: 1 }).lines, layout());
    // 19 letters + hyphen, 19 letters + hyphen, then the last 7 letters.
    expect(long[0].slice(0, 3).map(cellLength)).toEqual([20, 20, 7]);
    expect(long[0][0].endsWith('⠤')).toBe(true);
  });
});

describe('export formats', () => {
  const pages = paginate(translate('The quick brown fox.\nSecond paragraph.', { grade: 2 }).lines, layout());

  it('writes BRF as ASCII with CRLF lines and a form feed per page', () => {
    const brf = toBRF(pages);
    expect(brf).toMatch(/^[\x20-\x5f\r\n\f]*$/);
    expect(brf.startsWith(',! QK BR[N FOX4\r\n')).toBe(true);
    expect(brf.endsWith('\f')).toBe(true);
    expect(brf.split('\f').length - 1).toBe(pages.length);
  });

  it('writes a PEF document whose rows contain only braille cells', () => {
    const pef = toPEF(pages, { title: 'Test & <title>', cellsPerLine: 20, linesPerPage: 5 });
    expect(pef).toContain('<pef version="2008-1" xmlns="http://www.daisy.org/ns/2008/pef">');
    expect(pef).toContain('<dc:title>Test &amp; &lt;title&gt;</dc:title>');
    expect(pef).toContain('<volume cols="20" rows="5" rowgap="0" duplex="false">');
    const rows = [...pef.matchAll(/<row>(.*?)<\/row>/g)].map((m) => m[1]);
    expect(rows.length).toBeGreaterThan(0);
    for (const row of rows) expect(row).toMatch(/^[⠀-⠿]+$/);
    expect(pef.match(/<page>/g)).toHaveLength(pages.length);
  });
});
