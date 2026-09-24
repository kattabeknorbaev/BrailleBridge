/**
 * Braille → print back-translation for UEB grade 1 and grade 2.
 *
 * Many braille cells mean different things depending on where they appear
 * (⠂ is "ea" inside a word but a comma at the end; ⠦ is "his" on its own,
 * an opening quote before a word and "?" after one). The decoder resolves
 * these with the same position rules the forward translator follows.
 */
import { asciiToCell, isBrailleCell } from './cells';
import type { Grade } from './ueb';
import {
  DIGITS,
  GROUP_RULES,
  IND,
  LETTERS,
  LOWER_WORDSIGNS,
  MODIFIERS,
  QUOTES,
  SHORTFORMS,
  SHORTFORM_DERIVATIVES,
  SHORTFORM_PREFIXES,
  SYMBOLS,
  WORDSIGNS,
} from './ueb-tables';

// ---------------------------------------------------------------------------
// Input handling
// ---------------------------------------------------------------------------

/** True when the text has no Unicode braille but is valid Braille ASCII (e.g. a BRF file). */
export function looksLikeBrailleAscii(text: string): boolean {
  if ([...text].some(isBrailleCell)) return false;
  return /[A-Za-z]/.test(text) && [...text].every((ch) => /\s/.test(ch) || asciiToCell(ch) !== null);
}

/** Convert BRF / Braille ASCII to Unicode braille. Form feeds become line breaks. */
export function asciiToUnicode(text: string): string {
  return [...text.replace(/\r\n?/g, '\n').replace(/\f/g, '\n')]
    .map((ch) => (ch === ' ' || ch === '\n' ? ch : (asciiToCell(ch) ?? '')))
    .join('');
}

// ---------------------------------------------------------------------------
// Reverse tables
// ---------------------------------------------------------------------------

function invert(table: Record<string, string>): Map<string, string> {
  const map = new Map<string, string>();
  for (const [text, braille] of Object.entries(table)) if (!map.has(braille)) map.set(braille, text);
  return map;
}

const cells = (s: string) => [...s];

const LETTER_OF = invert(LETTERS);
const DIGIT_OF = invert(DIGITS);
const MODIFIER_OF = invert(MODIFIERS);

/** Print character for each braille symbol; common forms are preferred when signs are shared. */
const SYMBOL_OF = (() => {
  const map = new Map<string, string>();
  for (const ch of ['-', '—', '/', '•']) map.set(SYMBOLS[ch], ch);
  for (const [ch, braille] of Object.entries(SYMBOLS)) if (!map.has(braille)) map.set(braille, ch);
  map.set(QUOTES.singleOpen, '‘');
  map.set(QUOTES.singleClose, '’');
  return map;
})();
const MULTI_CELL_SYMBOLS = [...SYMBOL_OF.entries()]
  .filter(([braille]) => cells(braille).length > 1)
  .sort((a, b) => cells(b[0]).length - cells(a[0]).length);

const STRONG_WORDS = ['and', 'for', 'of', 'the', 'with'];
const WORD_OF = new Map<string, string>([
  ...invert(WORDSIGNS),
  ...invert(SHORTFORMS),
  ...STRONG_WORDS.map((w): [string, string] => [GROUP_RULES.find((r) => r.text === w)!.braille, w]),
]);
const LOWER_WORD_OF = invert(LOWER_WORDSIGNS);

/** Two-cell contractions (initial- and final-letter), keyed by braille. */
const TWO_CELL_GROUPS = new Map(
  GROUP_RULES.filter((r) => cells(r.braille).length === 2).map((r) => [r.braille, r.text]),
);
/** One-cell contractions that mean the same thing anywhere in a word. */
const ANYWHERE_GROUPS = new Map(
  GROUP_RULES.filter((r) => cells(r.braille).length === 1 && (!r.lower || r.text === 'en' || r.text === 'in')).map(
    (r) => [r.braille, r.text],
  ),
);

/** Shortforms longest-first, for matching derivatives such as "friends" or "quickly". */
const SHORTFORMS_BY_LENGTH = Object.entries(SHORTFORMS).sort((a, b) => cells(b[1]).length - cells(a[1]).length);

const CAPITAL = IND.capitalLetter;
const TERMINATOR_TAIL = '⠄';
const HYPHEN = SYMBOLS['-'];

/** Lower cells whose meaning depends on their position in the word (grade 2). */
const POSITIONAL: Record<string, { begin?: string; middle?: string; end: string }> = {
  '⠆': { begin: 'be', middle: 'bb', end: ';' },
  '⠒': { begin: 'con', middle: 'cc', end: ':' },
  '⠲': { begin: 'dis', end: '.' },
  '⠂': { middle: 'ea', end: ',' },
  '⠖': { middle: 'ff', end: '!' },
  '⠶': { middle: 'gg', end: '′' },
  '⠦': { begin: '“', end: '?' },
  '⠴': { end: '”' },
};
/** The same cells in grade 1: punctuation only. */
const GRADE1_POSITIONAL: Record<string, { begin?: string; end: string }> = {
  '⠆': { end: ';' },
  '⠒': { end: ':' },
  '⠲': { end: '.' },
  '⠂': { end: ',' },
  '⠖': { end: '!' },
  '⠶': { end: '′' },
  '⠦': { begin: '“', end: '?' },
  '⠴': { end: '”' },
};

const OPENING = new Map([
  [QUOTES.doubleOpen, '“'],
  [QUOTES.singleOpen, '‘'],
  [SYMBOLS['('], '('],
  [SYMBOLS['['], '['],
  [SYMBOLS['{'], '{'],
]);
const CLOSING = new Set([',', ';', ':', '.', '!', '?', '”', ')', ']', '}', '’', '»', '…']);
const CLOSING_SIGNS = [...SYMBOL_OF.entries()]
  .filter(([, ch]) => CLOSING.has(ch))
  .concat([[QUOTES.doubleClose, '”']])
  .sort((a, b) => cells(b[0]).length - cells(a[0]).length);

// ---------------------------------------------------------------------------
// Decoding
// ---------------------------------------------------------------------------

type CaseMode = 'none' | 'first' | 'all';

function applyCase(text: string, mode: CaseMode): string {
  if (mode === 'all') return text.toUpperCase();
  if (mode === 'first') return text.charAt(0).toUpperCase() + text.slice(1);
  return text;
}

interface State {
  grade: Grade;
  /** Inside a capitals passage (⠠⠠⠠ … ⠠⠄); carries across words. */
  passage: boolean;
}

/**
 * Decode a run of cells cell-by-cell (no whole-word signs). Used for words
 * that are not wordsigns and for the endings of shortform derivatives.
 */
function decodeCells(input: string[], state: State, continuesWord = false): string {
  let out = '';
  let numeric = false;
  let capsNext = false;
  let capsWord = false;
  let grade1Next = false;
  let lettersInWord = continuesWord ? 1 : 0;
  const contracted = () => state.grade === 2 && !grade1Next;

  const emitLetters = (text: string, mark = '') => {
    const mode: CaseMode = state.passage || capsWord ? 'all' : capsNext ? 'first' : 'none';
    out += (applyCase(text, mode) + mark).normalize('NFC');
    capsNext = false;
    grade1Next = false;
    lettersInWord += text.length;
  };
  const emitSymbol = (text: string) => {
    out += text;
    capsWord = false;
    grade1Next = false;
    if (text !== "'") lettersInWord = 0;
  };
  /** Only punctuation (no letters, contractions or numbers) remains after `from`. */
  const onlyPunctuationAfter = (from: number) => {
    for (let k = from; k < input.length; k++) {
      const cell = input[k];
      if (LETTER_OF.has(cell) || cell === IND.numeric) return false;
      if (state.grade === 2 && (ANYWHERE_GROUPS.has(cell) || TWO_CELL_GROUPS.has(cell + (input[k + 1] ?? '')))) {
        return false;
      }
    }
    return true;
  };

  for (let i = 0; i < input.length; ) {
    const cell = input[i];
    const two = input.slice(i, i + 2).join('');
    const rest = input.slice(i).join('');

    // Numbers: ⠼ followed by a–j, with decimal points, commas and fraction lines.
    if (cell === IND.numeric) {
      numeric = true;
      i++;
      continue;
    }
    if (numeric) {
      if (DIGIT_OF.has(cell)) {
        out += DIGIT_OF.get(cell);
        i++;
        continue;
      }
      const inner = { '⠂': ',', '⠲': '.', '⠌': '/' }[cell];
      if (inner && DIGIT_OF.has(input[i + 1])) {
        out += inner;
        i++;
        continue;
      }
      numeric = false;
      if (cell === IND.grade1Symbol) {
        grade1Next = true;
        i++;
        continue;
      }
    }

    // Capital terminator, then capital indicators.
    if (cell === CAPITAL && input[i + 1] === TERMINATOR_TAIL) {
      state.passage = false;
      capsWord = false;
      i += 2;
      continue;
    }
    // Accent modifiers (⠘⠌ + e = é) apply to the following letter.
    if (MODIFIER_OF.has(two) && LETTER_OF.has(input[i + 2])) {
      emitLetters(LETTER_OF.get(input[i + 2])!, MODIFIER_OF.get(two));
      i += 3;
      continue;
    }
    // Two-cell contractions (⠐⠕ "one", ⠰⠝ "tion") before multi-cell symbols.
    if (contracted() && TWO_CELL_GROUPS.has(two)) {
      const finalLetter = cell === IND.grade1Symbol || cell === '⠨';
      if (!finalLetter || lettersInWord > 0) {
        emitLetters(TWO_CELL_GROUPS.get(two)!);
        i += 2;
        continue;
      }
    }
    const symbol = MULTI_CELL_SYMBOLS.find(([braille]) => rest.startsWith(braille));
    if (symbol) {
      emitSymbol(symbol[1]);
      i += cells(symbol[0]).length;
      continue;
    }
    if (cell === CAPITAL) {
      let n = 0;
      while (input[i + n] === CAPITAL && n < 3) n++;
      if (n === 3) state.passage = true;
      else if (n === 2) capsWord = true;
      else capsNext = true;
      i += n;
      continue;
    }
    if (cell === IND.grade1Symbol) {
      grade1Next = true;
      i++;
      continue;
    }

    if (LETTER_OF.has(cell)) {
      emitLetters(LETTER_OF.get(cell)!);
      i++;
      continue;
    }
    if (contracted() && ANYWHERE_GROUPS.has(cell)) {
      emitLetters(ANYWHERE_GROUPS.get(cell)!);
      i++;
      continue;
    }

    const positional = contracted() ? POSITIONAL[cell] : GRADE1_POSITIONAL[cell];
    if (positional) {
      const atBegin = lettersInWord === 0;
      const atEnd = onlyPunctuationAfter(i + 1);
      if (atBegin && !atEnd && positional.begin) {
        const text = positional.begin;
        if (/^[a-z]/.test(text)) emitLetters(text);
        else emitSymbol(text);
      } else if (!atBegin && !atEnd && 'middle' in positional && positional.middle) {
        emitLetters(positional.middle);
      } else {
        emitSymbol(positional.end);
      }
      i++;
      continue;
    }

    const single = SYMBOL_OF.get(cell);
    emitSymbol(single ?? cell);
    i++;
  }
  return out;
}

/**
 * Try to read one hyphen-separated word as a wordsign, shortform or lower
 * wordsign, allowing surrounding punctuation and 's / n't endings.
 */
function decodeWholeWord(input: string[], state: State): string | null {
  let start = 0;
  let end = input.length;
  let lead = '';
  let trail = '';

  for (;;) {
    const rest = input.slice(start, end).join('');
    const opening = [...OPENING.entries()].find(([braille]) => rest.startsWith(braille));
    if (!opening || cells(rest).length <= cells(opening[0]).length) break;
    lead += opening[1];
    start += cells(opening[0]).length;
  }

  let mode: CaseMode = state.passage ? 'all' : 'none';
  let startsPassage = false;
  const head = input.slice(start, start + 3).join('');
  if (head === IND.capitalPassage) {
    startsPassage = true;
    mode = 'all';
    start += 3;
  } else if (head.startsWith(IND.capitalWord)) {
    mode = 'all';
    start += 2;
  } else if (input[start] === CAPITAL && input[start + 1] !== TERMINATOR_TAIL) {
    mode = 'first';
    start += 1;
  }

  let endsPassage = false;
  for (;;) {
    const core = input.slice(start, end).join('');
    if (core.endsWith(IND.capitalTerminator) && end - start > 2) {
      endsPassage = true;
      end -= 2;
      continue;
    }
    const closing = CLOSING_SIGNS.find(
      ([braille]) => core.endsWith(braille) && cells(core).length > cells(braille).length,
    );
    if (!closing) break;
    trail = closing[1] + trail;
    end -= cells(closing[0]).length;
  }

  // Apostrophe endings: it's, can't, you're, we'll.
  let core = input.slice(start, end);
  let suffix = '';
  const apostrophe = core.indexOf(QUOTES.apostrophe);
  if (apostrophe > 0) {
    const after = core.slice(apostrophe + 1).map((cell) => LETTER_OF.get(cell) ?? '?').join('');
    if (/^(s|d|t|ll|re|ve)$/.test(after)) {
      suffix = "'" + after;
      core = core.slice(0, apostrophe);
    }
  }
  const key = core.join('');

  let word = WORD_OF.get(key);
  if (!word) {
    for (const [shortform, braille] of SHORTFORMS_BY_LENGTH) {
      if (key === braille || !key.startsWith(braille)) continue;
      const ending = decodeCells(cells(key.slice(braille.length)), { grade: 2, passage: false }, true);
      if (SHORTFORM_DERIVATIVES[shortform]?.test(ending)) {
        word = shortform + ending;
        break;
      }
    }
  }
  if (!word) {
    for (const [shortform, braille] of SHORTFORMS_BY_LENGTH) {
      if (key === braille || !key.endsWith(braille)) continue;
      const prefix = decodeCells(cells(key.slice(0, -braille.length)), { grade: 2, passage: false });
      if (SHORTFORM_PREFIXES[prefix]?.test(shortform)) {
        word = prefix + shortform;
        break;
      }
    }
  }
  if (!word && LOWER_WORD_OF.has(key) && !suffix) {
    // Lower wordsigns only stand alone next to brackets, ";" or ":".
    if (/^[([{]*$/.test(lead) && /^[)\]};:]*$/.test(trail)) word = LOWER_WORD_OF.get(key);
  }
  if (!word) return null;

  if (startsPassage) state.passage = true;
  const text = lead + applyCase(word + suffix, mode) + trail;
  if (endsPassage) state.passage = false;
  return text;
}

/** Split a space-free sequence at hyphens and dashes; each part is its own word. */
function decodeSequence(sequence: string[], state: State): string {
  const parts: { cells: string[]; separator: string }[] = [];
  let current: string[] = [];
  for (let i = 0; i < sequence.length; i++) {
    const cell = sequence[i];
    const prev = sequence[i - 1];
    // ⠐⠤ (minus) and ⠨⠤ (underscore) are symbols, not word breaks.
    if (cell === HYPHEN && prev !== '⠐' && prev !== '⠨') {
      // ⠠⠤ is a dash (⠐⠠⠤ a long dash); a bare ⠤ is a hyphen.
      const isDash = prev === CAPITAL;
      if (isDash) {
        current.pop();
        if (current[current.length - 1] === '⠐') current.pop();
      }
      parts.push({ cells: current, separator: isDash ? '—' : '-' });
      current = [];
      continue;
    }
    current.push(cell);
  }
  parts.push({ cells: current, separator: '' });

  return parts
    .map(({ cells: part, separator }, index) => {
      if (part.length === 0) return separator;
      const key = part.join('');
      // “—word  or  word—” : a lone quote or bracket beside a dash is punctuation.
      if (index === 0 && separator && OPENING.has(key)) return OPENING.get(key) + separator;
      if (index > 0 && !separator) {
        const closing = CLOSING_SIGNS.find(([braille]) => braille === key);
        if (closing) return closing[1];
      }
      const whole = state.grade === 2 ? decodeWholeWord(part, state) : null;
      return (whole ?? decodeCells(part, state)) + separator;
    })
    .join('');
}

/** Back-translate Unicode braille (or Braille ASCII / BRF) to print. */
export function backTranslate(input: string, grade: Grade = 2): string {
  const braille = looksLikeBrailleAscii(input) ? asciiToUnicode(input) : input;
  const state: State = { grade, passage: false };
  return braille
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((line) =>
      line
        .split(/([ ⠀]+)/)
        .map((part) => (/^[ ⠀]*$/.test(part) ? part.replace(/⠀/g, ' ') : decodeSequence(cells(part), state)))
        .join(''),
    )
    .join('\n');
}

