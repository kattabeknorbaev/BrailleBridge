/**
 * Uzbek braille (uncontracted).
 *
 * Uzbek braille is based on Russian (Cyrillic) literary braille, with four
 * additional letters: ғ (1-2-4-5-6), қ (1-3-4-5-6), ў (1-2-3-6) and
 * ҳ (1-4-5-6). Text in the Latin alphabet is written with the same cells as
 * the corresponding Cyrillic letters (q = қ, h = ҳ, x = х, oʻ = ў, gʻ = ғ,
 * sh = ш, ch = ч), so a reader gets the same braille from either script.
 *
 * Sources: the liblouis table uz-g1.utb (BAUM Engineering, 2020–21, built on
 * ru-litbrl.ctb) and the UNESCO World Braille Usage data for the four
 * additional letters. Numbers, punctuation and spacing follow liblouis;
 * see src/lib/braille/__tests__/uzbek.test.ts for the comparison.
 */
import { d } from '../cells';
import { normalizeText, type Segment, type TranslationResult } from '../ueb';
import { APOSTROPHES, latinToCyrillic } from './translit';

export interface UzbekOptions {
  /**
   * How Latin-script text is written:
   * - `letters`: letter by letter onto the matching cells (liblouis uz-g1),
   *   so "yaxshi" is y-a-x-sh-i.
   * - `cyrillic`: converted to Cyrillic first, matching Cyrillic braille books,
   *   so "yaxshi" becomes "яхши" (я is one cell).
   */
  latin: 'letters' | 'cyrillic';
  /** Mark capital letters with dot 6. Not used in liblouis or Russian-based practice. */
  capitals: boolean;
}

export const DEFAULT_UZBEK_OPTIONS: UzbekOptions = { latin: 'letters', capitals: false };

const cells = (table: Record<string, string>) =>
  Object.fromEntries(Object.entries(table).map(([k, dots]) => [k, d(dots)]));

/** Russian literary braille letters plus the Uzbek additions. */
export const CYRILLIC_LETTERS: Record<string, string> = cells({
  'а': '1', 'б': '12', 'в': '2456', 'г': '1245', 'д': '145', 'е': '15',
  'ё': '16', 'ж': '245', 'з': '1356', 'и': '24', 'й': '12346', 'к': '13',
  'л': '123', 'м': '134', 'н': '1345', 'о': '135', 'п': '1234', 'р': '1235',
  'с': '234', 'т': '2345', 'у': '136', 'ф': '124', 'х': '125', 'ц': '14',
  'ч': '12345', 'ш': '156', 'щ': '1346', 'ъ': '12356', 'ы': '2346', 'ь': '23456',
  'э': '246', 'ю': '1256', 'я': '1246',
  // Uzbek additions
  'ғ': '12456', // ғ
  'қ': '13456', // қ
  'ў': '1236', // ў
  'ҳ': '1456', // ҳ
});

/** Latin letters written with the cell of their Cyrillic counterpart. */
export const LATIN_LETTERS: Record<string, string> = cells({
  a: '1', b: '12', d: '145', e: '15', f: '124', g: '1245', h: '1456', i: '24', j: '245', k: '13',
  l: '123', m: '134', n: '1345', o: '135', p: '1234', q: '13456', r: '1235', s: '234', t: '2345',
  u: '136', v: '2456', x: '125', y: '12346', z: '1356',
  // Not Uzbek letters; international values (as in liblouis).
  c: '14', w: '2456',
});

const DIGRAPHS: Record<string, string> = cells({ sh: '156', ch: '12345', 'o’': '1236', 'g’': '12456' });

const DIGITS: Record<string, string> = cells({
  '1': '1', '2': '12', '3': '14', '4': '145', '5': '15', '6': '124', '7': '1245', '8': '125', '9': '24', '0': '245',
});

const NUMERIC = d('3456');
const CAPITAL = d('6');

/** Punctuation and signs (ru-litbrl with the uz-g1 overrides). */
export const SYMBOLS: Record<string, string> = cells({
  '.': '256', ',': '2', '?': '26', '!': '235', ';': '23', ':': '25',
  '-': '36', '‐': '36', '‑': '36', '‒': '36', '–': '36', '—': '36', '―': '36',
  '(': '2356', ')': '2356', '[': '126', ']': '345', '{': '126', '}': '345',
  '«': '236', '»': '356', '“': '236', '”': '356', '„': '236', '‹': '236', '›': '356',
  '…': '256-256-256', "'": '3', '‘': '3', '*': '35', '%': '3456-245-356', '@': '4-1', '#': '1456',
  '$': '4-145', '€': '4-15', '₽': '4-1235', '£': '4-123', '¥': '4-13456', '¢': '4-14',
  '°': '46-356', '§': '346', '•': '56-35', '◦': '56-35', '/': '34', '\\': '16', '&': '12346',
  '=': '2356', '+': '235', '№': '1345', '_': '456', '|': '456',
});

const QUOTE_OPEN = d('236');
const QUOTE_CLOSE = d('356');
const APOSTROPHE = d('3');

/** Russian braille omits the space after these signs… */
const NO_SPACE_AFTER = new Set([',', ';', '+', '=', '/', '№']);
/** …and before these. */
const NO_SPACE_BEFORE = new Set(['-', '–', '—', '―', '%', '/']);

const isDigit = (ch: string | undefined) => !!ch && ch >= '0' && ch <= '9';
const isLetter = (ch: string | undefined) => !!ch && /\p{L}/u.test(ch);
const isUpper = (ch: string) => ch !== ch.toLowerCase() && ch === ch.toUpperCase();

/** Make every apostrophe-like mark the same so oʻ / gʻ are recognised however they were typed. */
function unifyApostrophes(text: string): string {
  const marks = new RegExp(`([OoGg])[${APOSTROPHES}]`, 'g');
  return text.replace(marks, '$1’');
}

function translateWord(word: string, options: UzbekOptions, unsupported: Set<string>): string {
  const chars = [...word];
  const allCaps = chars.filter(isLetter).length > 1 && chars.filter(isLetter).every(isUpper);
  let out = '';
  let numeric = false;
  let capsWordMarked = false;

  for (let i = 0; i < chars.length; ) {
    const ch = chars[i];
    const lower = ch.toLowerCase();
    const next = chars[i + 1];

    // Numbers: ⠼ + a–j. A comma between digits stays in the number; any other sign ends it.
    if (isDigit(ch)) {
      if (!numeric) out += NUMERIC;
      numeric = true;
      out += DIGITS[ch];
      i++;
      continue;
    }
    if (numeric && ch === ',' && isDigit(next)) {
      out += SYMBOLS[','];
      i++;
      continue;
    }
    numeric = false;

    if (isLetter(ch)) {
      if (options.capitals && isUpper(ch)) {
        if (allCaps) {
          if (!capsWordMarked) out += CAPITAL + CAPITAL;
          capsWordMarked = true;
        } else {
          out += CAPITAL;
        }
      }
      const pair = (lower + (next ?? '')).toLowerCase();
      if (DIGRAPHS[pair]) {
        out += DIGRAPHS[pair];
        i += 2;
        continue;
      }
      const cell = CYRILLIC_LETTERS[lower] ?? LATIN_LETTERS[lower];
      if (cell) out += cell;
      else unsupported.add(ch);
      i++;
      continue;
    }

    // Quotation marks and apostrophes.
    if (ch === '"') {
      const opening = i === 0 || !/[\p{L}\p{N}.,!?;:)\]]/u.test(chars[i - 1]);
      out += opening ? QUOTE_OPEN : QUOTE_CLOSE;
      i++;
      continue;
    }
    if (ch === '’') {
      out += isLetter(chars[i - 1]) && isLetter(next) ? APOSTROPHE : QUOTE_CLOSE;
      i++;
      continue;
    }
    const symbol = SYMBOLS[ch];
    if (symbol) out += symbol;
    else unsupported.add(ch);
    i++;
  }
  return out;
}

function translateLine(line: string, options: UzbekOptions, unsupported: Set<string>): Segment[] {
  const parts = line.split(/( +)/).filter((p) => p.length > 0);
  const segments: Segment[] = parts.map((part) =>
    part.trim() ? { print: part, braille: translateWord(part, options, unsupported) } : { print: part, braille: ' ' },
  );
  // Spacing conventions of Russian-based braille: no space after a comma or
  // semicolon, none before a dash or percent sign.
  for (let k = 0; k < segments.length; k++) {
    if (parts[k].trim()) continue;
    const before = parts[k - 1];
    const after = parts[k + 1];
    if ((before && NO_SPACE_AFTER.has(before.at(-1)!)) || (after && NO_SPACE_BEFORE.has(after[0]))) {
      segments[k] = { print: parts[k], braille: '' };
    }
  }
  return segments;
}

/** Translate Uzbek (Latin or Cyrillic) text to Uzbek braille. */
export function translateUzbek(text: string, options: UzbekOptions = DEFAULT_UZBEK_OPTIONS): TranslationResult {
  let source = unifyApostrophes(normalizeText(text));
  if (options.latin === 'cyrillic') source = latinToCyrillic(source);
  const unsupported = new Set<string>();
  const lines = source.split('\n').map((line) => translateLine(line, options, unsupported));
  const braille = lines.map((segments) => segments.map((s) => s.braille).join('')).join('\n');
  return { braille, lines, unsupported: [...unsupported] };
}

export function toUzbekBraille(text: string, options?: Partial<UzbekOptions>): string {
  return translateUzbek(text, { ...DEFAULT_UZBEK_OPTIONS, ...options }).braille;
}
