/**
 * Page layout for embossed braille: word wrapping, paragraph indents and
 * braille page numbers, following the basic BANA formatting conventions.
 */
import type { Segment } from './ueb';
import { DIGITS, IND } from './ueb-tables';

export interface PageLayout {
  /** Cells per line. 40 is standard for 11.5" embosser paper. */
  cellsPerLine: number;
  /** Lines per page. 25 is standard for 11" paper. */
  linesPerPage: number;
  /** Indent the first line of each paragraph by two cells (BANA style). */
  indentParagraphs: boolean;
  /** Put the braille page number at the right end of the last line. */
  pageNumbers: boolean;
}

export const DEFAULT_LAYOUT: PageLayout = {
  cellsPerLine: 40,
  linesPerPage: 25,
  indentParagraphs: true,
  pageNumbers: true,
};

/** A page is a list of lines; each line is a string of braille cells and spaces. */
export type Page = string[];

const HYPHEN = '⠤';
const INDENT = '  ';
/** At least three blank cells between text and the page number. */
const PAGE_NUMBER_GAP = 3;

function pageNumberCells(n: number): string {
  return IND.numeric + [...String(n)].map((digit) => DIGITS[digit]).join('');
}

const cellCount = (s: string) => [...s].length;

/**
 * Lay translated lines out on pages.
 * Each input line is treated as a paragraph; blank input lines are kept as
 * single blank braille lines.
 */
export function paginate(lines: Segment[][], layout: PageLayout = DEFAULT_LAYOUT): Page[] {
  const width = Math.max(10, layout.cellsPerLine);
  const height = Math.max(3, layout.linesPerPage);
  const pages: Page[] = [];
  let page: Page = [];

  // The last line of a page is shortened so the page number fits.
  const widthFor = (lineIndex: number): number => {
    if (!layout.pageNumbers || lineIndex !== height - 1) return width;
    return width - cellCount(pageNumberCells(pages.length + 1)) - PAGE_NUMBER_GAP;
  };

  const finishPage = () => {
    if (layout.pageNumbers) {
      while (page.length < height) page.push('');
      const number = pageNumberCells(pages.length + 1);
      const last = page[height - 1];
      page[height - 1] = last + ' '.repeat(width - cellCount(last) - cellCount(number)) + number;
    }
    pages.push(page);
    page = [];
  };

  const pushLine = (text: string) => {
    if (page.length === height) finishPage();
    page.push(text);
  };

  let previousBlank = true;
  for (const segments of lines) {
    const words = segments.map((s) => s.braille).filter((b) => b.trim().length > 0);
    if (words.length === 0) {
      // Collapse runs of blank lines and never start a page with one.
      if (!previousBlank && page.length > 0 && page.length < height) pushLine('');
      previousBlank = true;
      continue;
    }
    previousBlank = false;

    let current = layout.indentParagraphs ? INDENT : '';
    const flush = () => {
      pushLine(current.trimEnd());
      current = '';
    };

    for (const word of words) {
      let remaining = word;
      while (remaining) {
        const lineWidth = widthFor(page.length === height ? 0 : page.length);
        const separator = current.trim() ? ' ' : '';
        const room = lineWidth - cellCount(current) - cellCount(separator);

        if (cellCount(remaining) <= room) {
          current += separator + remaining;
          break;
        }
        // Break at a hyphen in the word if part of it fits.
        const cells = [...remaining];
        let split = -1;
        for (let k = Math.min(room, cells.length) - 1; k > 0; k--) {
          if (cells[k] === HYPHEN) {
            split = k + 1;
            break;
          }
        }
        if (split > 0) {
          current += separator + cells.slice(0, split).join('');
          remaining = cells.slice(split).join('');
          flush();
          continue;
        }
        if (current.trim()) {
          flush();
          continue;
        }
        // A single word longer than a whole line: divide it with a hyphen.
        const take = Math.max(1, lineWidth - cellCount(current) - 1);
        current += cells.slice(0, take).join('') + HYPHEN;
        remaining = cells.slice(take).join('');
        flush();
      }
    }
    if (current.trim()) flush();
  }

  if (page.length > 0 || pages.length === 0) finishPage();
  return pages;
}

/** Number of braille cells in the translated text (excluding spaces). */
export function countCells(braille: string): number {
  let n = 0;
  for (const ch of braille) if (ch !== ' ' && ch !== '\n') n++;
  return n;
}
