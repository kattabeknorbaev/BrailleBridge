/**
 * Low-level helpers for working with six-dot braille cells.
 *
 * Cells are represented as Unicode braille patterns (U+2800–U+283F). Dot
 * numbers follow the standard layout:
 *
 *   1 • • 4
 *   2 • • 5
 *   3 • • 6
 */

export const BLANK_CELL = '⠀';

const BRAILLE_BASE = 0x2800;

/** True when `ch` is a six-dot Unicode braille pattern (including the blank). */
export function isBrailleCell(ch: string): boolean {
  const code = ch.codePointAt(0) ?? 0;
  return code >= BRAILLE_BASE && code <= BRAILLE_BASE + 0x3f;
}

/** Convert a dot string such as `"1245"` to a single braille cell. */
export function dotsToCell(dots: string): string {
  let bits = 0;
  for (const ch of dots) {
    const n = Number(ch);
    if (!Number.isInteger(n) || n < 1 || n > 6) {
      throw new Error(`Invalid dot "${ch}" in "${dots}"`);
    }
    bits |= 1 << (n - 1);
  }
  return String.fromCharCode(BRAILLE_BASE + bits);
}

/**
 * Convert a dash-separated dot sequence (`"5-1345"`) into braille cells.
 * Used to keep the translation tables readable and checkable against
 * published UEB references, which always list signs by dot number.
 */
export function d(sequence: string): string {
  return sequence
    .split('-')
    .map((dots) => dotsToCell(dots))
    .join('');
}

/** Raised dots (1–6) of a braille cell, or an empty array for non-braille input. */
export function cellToDots(cell: string): number[] {
  if (!isBrailleCell(cell)) return [];
  const bits = (cell.codePointAt(0) ?? BRAILLE_BASE) - BRAILLE_BASE;
  const dots: number[] = [];
  for (let i = 0; i < 6; i++) {
    if (bits & (1 << i)) dots.push(i + 1);
  }
  return dots;
}

/** Six booleans in dot order [1, 2, 3, 4, 5, 6]. */
export function cellToDotMask(cell: string): boolean[] {
  const bits = isBrailleCell(cell) ? (cell.codePointAt(0) ?? BRAILLE_BASE) - BRAILLE_BASE : 0;
  return [0, 1, 2, 3, 4, 5].map((i) => (bits & (1 << i)) !== 0);
}

/** Human-readable dot description, e.g. "dots 1 2 5" — used for screen readers. */
export function describeCell(cell: string): string {
  if (cell === ' ' || cell === BLANK_CELL) return 'blank';
  const dots = cellToDots(cell);
  return dots.length ? `dots ${dots.join(' ')}` : cell;
}

/**
 * North American Braille ASCII — the 64-character set used by .brf files.
 * Listed in ASCII order (0x20–0x5F) so it can be checked line-by-line
 * against the published table.
 */
const BRAILLE_ASCII: [string, string][] = [
  [' ', ''], ['!', '2346'], ['"', '5'], ['#', '3456'], ['$', '1246'], ['%', '146'],
  ['&', '12346'], ["'", '3'], ['(', '12356'], [')', '23456'], ['*', '16'], ['+', '346'],
  [',', '6'], ['-', '36'], ['.', '46'], ['/', '34'], ['0', '356'], ['1', '2'],
  ['2', '23'], ['3', '25'], ['4', '256'], ['5', '26'], ['6', '235'], ['7', '2356'],
  ['8', '236'], ['9', '35'], [':', '156'], [';', '56'], ['<', '126'], ['=', '123456'],
  ['>', '345'], ['?', '1456'], ['@', '4'], ['A', '1'], ['B', '12'], ['C', '14'],
  ['D', '145'], ['E', '15'], ['F', '124'], ['G', '1245'], ['H', '125'], ['I', '24'],
  ['J', '245'], ['K', '13'], ['L', '123'], ['M', '134'], ['N', '1345'], ['O', '135'],
  ['P', '1234'], ['Q', '12345'], ['R', '1235'], ['S', '234'], ['T', '2345'], ['U', '136'],
  ['V', '1236'], ['W', '2456'], ['X', '1346'], ['Y', '13456'], ['Z', '1356'], ['[', '246'],
  ['\\', '1256'], [']', '12456'], ['^', '45'], ['_', '456'],
];

const ASCII_BY_PATTERN: string[] = (() => {
  const table: string[] = new Array(64);
  for (const [ch, dots] of BRAILLE_ASCII) {
    const bits = dots ? dotsToCell(dots).charCodeAt(0) - BRAILLE_BASE : 0;
    table[bits] = ch;
  }
  return table;
})();

const PATTERN_BY_ASCII: Map<string, number> = new Map(
  ASCII_BY_PATTERN.map((ch, bits) => [ch, bits] as [string, number]),
);

/** Convert one braille cell to its North American Braille ASCII character. */
export function cellToAscii(cell: string): string {
  if (cell === ' ') return ' ';
  if (!isBrailleCell(cell)) return cell;
  return ASCII_BY_PATTERN[(cell.codePointAt(0) ?? BRAILLE_BASE) - BRAILLE_BASE];
}

/** Convert a Braille ASCII character (either letter case) back to a cell, or null. */
export function asciiToCell(ch: string): string | null {
  const bits = PATTERN_BY_ASCII.get(ch.toUpperCase());
  return bits === undefined ? null : String.fromCharCode(BRAILLE_BASE + bits);
}
