/**
 * Print → Unified English Braille translator (grade 1 and grade 2).
 *
 * The translator works on "symbols-sequences" (runs of characters between
 * spaces), which is how the UEB rulebook defines most of its conditions:
 *
 *  1. Numbers get a numeric indicator; letters a–j right after digits get a
 *     grade 1 indicator so they are not read as digits.
 *  2. Capitals are marked per letter (⠠), per word (⠠⠠ … ⠠⠄) or per passage
 *     of three or more capitalised words (⠠⠠⠠ … ⠠⠄).
 *  3. In grade 2, words that "stand alone" may use wordsigns and shortforms.
 *  4. Everything else is split into the cheapest sequence of groupsigns using
 *     dynamic programming, subject to each groupsign's position rules.
 */
import {
  APOSTROPHE_SUFFIX,
  CLOSING_PUNCTUATION,
  DIGITS,
  EXCEPTIONS,
  FRACTION_LINE,
  GROUP_RULES,
  IND,
  LETTERS,
  LOWER_WORDSIGNS,
  LOWER_WORDSIGN_AFTER,
  LOWER_WORDSIGN_BEFORE,
  MODIFIERS,
  OPENING_PUNCTUATION,
  QUOTES,
  SHORTFORMS,
  SHORTFORM_DERIVATIVES,
  SHORTFORM_PREFIXES,
  SYMBOLS,
  VULGAR_FRACTIONS,
  WORDSIGNS,
  WORD_SEPARATORS,
  type GroupRule,
} from './ueb-tables';
import { d } from './cells';

export type Grade = 1 | 2;

export interface TranslateOptions {
  /** 1 = uncontracted, 2 = contracted (default). */
  grade?: Grade;
}

/** One symbols-sequence (or run of spaces) and its braille equivalent. */
export interface Segment {
  print: string;
  braille: string;
}

export interface TranslationResult {
  /** Unicode braille. Lines are separated by "\n", words by ordinary spaces. */
  braille: string;
  /** Per input line, the print/braille pairs — used for interline views and pagination. */
  lines: Segment[][];
  /** Characters that have no UEB equivalent in this translator and were left out. */
  unsupported: string[];
}

// ---------------------------------------------------------------------------
// Text normalisation
// ---------------------------------------------------------------------------

const LIGATURES: Record<string, string> = {
  '\ufb00': 'ff', '\ufb01': 'fi', '\ufb02': 'fl', '\ufb03': 'ffi', '\ufb04': 'ffl',
  '\ufb05': 'st', '\ufb06': 'st',
};

/** Clean up text from OCR / PDFs / word processors before translation. */
export function normalizeText(text: string): string {
  return text
    .normalize('NFC')
    .replace(/\r\n?/g, '\n')
    .replace(/[\u2028\u2029\f\v]/g, '\n')
    .replace(/[\t\u00a0\u2000-\u200a\u202f\u205f\u3000]/g, ' ')
    .replace(/[\u00ad\u200b-\u200d\u2060\ufeff]/g, '')
    .replace(/[\ufb00-\ufb06]/g, (ch) => LIGATURES[ch] ?? ch)
    .replace(/[\u02bc\u02bb]/g, '\u2019');
}

// ---------------------------------------------------------------------------
// Units: one per printed character, with letters decomposed into base + accents
// ---------------------------------------------------------------------------

interface Unit {
  ch: string;
  kind: 'letter' | 'digit' | 'other';
  /** Lowercase a–z base letter (letters only). */
  base?: string;
  upper?: boolean;
  /** Braille for diacritic modifiers placed before the letter. */
  mods?: string;
  /** Fixed braille for special symbols (the ligature sign in æ / œ). */
  braille?: string;
}

const STROKE = d('4-16');
const LIGATURE = d('45-235');
const PRINT_LIGATURES: Record<string, [string, string]> = {
  '\u00e6': ['a', 'e'], '\u00c6': ['A', 'E'], '\u0153': ['o', 'e'], '\u0152': ['O', 'E'],
};

function toUnits(sequence: string): Unit[] {
  const units: Unit[] = [];
  for (const ch of sequence) {
    if (ch >= '0' && ch <= '9') {
      units.push({ ch, kind: 'digit' });
      continue;
    }
    if (PRINT_LIGATURES[ch]) {
      // ae / oe ligatures: first letter, ligature sign, second letter.
      const [first, second] = PRINT_LIGATURES[ch];
      const letter = (l: string): Unit => ({ ch: l, kind: 'letter', base: l.toLowerCase(), upper: l !== l.toLowerCase(), mods: '' });
      units.push(letter(first), { ch, kind: 'other', braille: LIGATURE }, letter(second));
      continue;
    }
    if (ch === '\u00f8' || ch === '\u00d8') {
      units.push({ ch, kind: 'letter', base: 'o', upper: ch === '\u00d8', mods: STROKE });
      continue;
    }
    const [base, ...marks] = ch.normalize('NFD');
    if (/[a-z]/i.test(base) && marks.every((m) => MODIFIERS[m])) {
      units.push({
        ch,
        kind: 'letter',
        base: base.toLowerCase(),
        upper: base !== base.toLowerCase(),
        mods: marks.map((m) => MODIFIERS[m]).join(''),
      });
      continue;
    }
    units.push({ ch, kind: 'other' });
  }
  return units;
}

const isLetter = (u: Unit | undefined): boolean => u?.kind === 'letter';
const isDigit = (u: Unit | undefined): boolean => u?.kind === 'digit';

// ---------------------------------------------------------------------------
// Grade 2 groupsign selection (dynamic programming)
// ---------------------------------------------------------------------------

const RULES_BY_FIRST_LETTER = new Map<string, GroupRule[]>();
for (const rule of GROUP_RULES) {
  const list = RULES_BY_FIRST_LETTER.get(rule.text[0]) ?? [];
  list.push(rule);
  RULES_BY_FIRST_LETTER.set(rule.text[0], list);
}

interface Piece {
  start: number;
  end: number;
  braille: string;
  initial?: boolean;
}

/**
 * Split a lowercase word into the cheapest valid sequence of groupsigns.
 * `blocked[k]` forbids any sign spanning the boundary before letter k
 * (capital indicators, accented letters, exception markers).
 */
function contract(word: string, blocked: boolean[], plain: boolean[]): Piece[] {
  const n = word.length;
  const cost: number[] = new Array(n + 1).fill(0);
  const choice: Piece[] = new Array(n);

  for (let i = n - 1; i >= 0; i--) {
    // Default: the single letter.
    let bestCost = 1 + cost[i + 1];
    let best: Piece = { start: i, end: i + 1, braille: LETTERS[word[i]] };

    const consider = (end: number, braille: string, penalty: number, initial = false) => {
      for (let k = i + 1; k < end; k++) if (blocked[k]) return;
      for (let k = i; k < end; k++) if (!plain[k]) return;
      const c = [...braille].length + penalty + cost[end];
      // Fewest cells wins. On a tie, initial-letter contractions lose
      // ("prisoner" = o-n-er, not one-r); otherwise the longer sign at the
      // earlier position wins ("shade" = sh-a-d, not s-had).
      let better = c < bestCost - 1e-9;
      if (!better && Math.abs(c - bestCost) < 1e-9) {
        better = initial !== !!best.initial ? !initial : end > best.end;
      }
      if (better) {
        bestCost = c;
        best = { start: i, end, braille, initial };
      }
    };

    for (const rule of RULES_BY_FIRST_LETTER.get(word[i]) ?? []) {
      const end = i + rule.text.length;
      if (end > n || !word.startsWith(rule.text, i)) continue;
      if (rule.position === 'begin' && i !== 0) continue;
      if (rule.position === 'notBegin' && i === 0) continue;
      if (rule.position === 'middle' && (i === 0 || end === n)) continue;
      if (rule.allow && !rule.allow(word, i)) continue;
      consider(end, rule.braille, rule.lower ? 0.1 : 0, rule.initial);
    }

    if (i === 0) {
      for (const [shortform, endings] of Object.entries(SHORTFORM_DERIVATIVES)) {
        if (word.startsWith(shortform) && endings.test(word.slice(shortform.length))) {
          consider(shortform.length, SHORTFORMS[shortform], 0);
        }
      }
    } else {
      const prefix = word.slice(0, i);
      const rest = word.slice(i);
      if (SHORTFORM_PREFIXES[prefix]?.test(rest)) {
        for (const [shortform, braille] of Object.entries(SHORTFORMS)) {
          const ending = rest.slice(shortform.length);
          if (rest.startsWith(shortform) && (!ending || SHORTFORM_DERIVATIVES[shortform]?.test(ending))) {
            consider(i + shortform.length, braille, 0);
          }
        }
      }
    }

    cost[i] = bestCost;
    choice[i] = best;
  }

  const pieces: Piece[] = [];
  for (let i = 0; i < n; i = choice[i].end) pieces.push(choice[i]);
  return pieces;
}

// ---------------------------------------------------------------------------
// Sequence translation
// ---------------------------------------------------------------------------

interface SequenceContext {
  grade: Grade;
  passageStart: boolean;
  inPassage: boolean;
  passageEnd: boolean;
  unsupported: Set<string>;
  /** Open ‘ quotes on this line, used to tell closing ’ from apostrophes. */
  openSingleQuotes: number;
}

function isStandingAlone(units: Unit[], start: number, end: number): boolean {
  let k = start - 1;
  while (k >= 0 && OPENING_PUNCTUATION.has(units[k].ch)) k--;
  if (k >= 0 && !WORD_SEPARATORS.has(units[k].ch)) return false;

  let r = end;
  if (r < units.length && /['\u2019]/.test(units[r].ch) && isLetter(units[r + 1])) {
    let s = r + 1;
    while (isLetter(units[s])) s++;
    const suffix = units.slice(r + 1, s).map((u) => u.base).join('');
    if (APOSTROPHE_SUFFIX.test(suffix)) r = s;
  }
  while (r < units.length && CLOSING_PUNCTUATION.has(units[r].ch)) r++;
  return r >= units.length || WORD_SEPARATORS.has(units[r].ch);
}

function lowerWordsignAllowed(units: Unit[], start: number, end: number): boolean {
  const before = units[start - 1]?.ch;
  const after = units[end]?.ch;
  const okBefore = !before || LOWER_WORDSIGN_BEFORE.has(before) || WORD_SEPARATORS.has(before);
  const okAfter = !after || LOWER_WORDSIGN_AFTER.has(after) || WORD_SEPARATORS.has(after);
  return okBefore && okAfter;
}

/** Exception for a word: exact entries first, then prefix entries ("revert*"). */
function findException(word: string): string | null | undefined {
  if (word in EXCEPTIONS) return EXCEPTIONS[word];
  for (const [key, value] of PREFIX_EXCEPTIONS) {
    if (word.startsWith(key)) return value;
  }
  return undefined;
}

const PREFIX_EXCEPTIONS: [string, string | null][] = Object.entries(EXCEPTIONS)
  .filter(([key]) => key.endsWith('*'))
  .map(([key, value]) => [key.slice(0, -1), value]);

/** Capital indicators to insert before each letter of a run (index = letter offset). */
function capitalPlan(run: Unit[], inPassage: boolean): string[] {
  const plan: string[] = new Array(run.length + 1).fill('');
  if (inPassage) return plan;
  let k = 0;
  while (k < run.length) {
    if (!run[k].upper) {
      k++;
      continue;
    }
    let m = k;
    while (m < run.length && run[m].upper) m++;
    if (m - k >= 2) {
      plan[k] = IND.capitalWord;
      if (m < run.length) plan[m] = IND.capitalTerminator;
    } else {
      plan[k] = IND.capitalLetter;
    }
    k = m;
  }
  return plan;
}

function translateLetters(
  units: Unit[],
  start: number,
  end: number,
  ctx: SequenceContext,
  afterNumber: boolean,
): string {
  const run = units.slice(start, end);
  const word = run.map((u) => u.base).join('');
  const caps = capitalPlan(run, ctx.inPassage);
  const letterAt = (k: number) => caps[k] + (run[k].mods ?? '') + LETTERS[run[k].base!];
  const spelled = () => run.map((_, k) => letterAt(k)).join('');

  if (ctx.grade === 1 || afterNumber) return spelled();

  const alone = isStandingAlone(units, start, end);
  const accented = run.some((u) => u.mods);
  const innerCaps = caps.slice(1, run.length).some(Boolean);

  // Wordsigns, shortforms and lower wordsigns replace the whole word.
  if (alone && !accented && !innerCaps && findException(word) === undefined) {
    const sign = WORDSIGNS[word] ?? SHORTFORMS[word];
    if (sign) return caps[0] + sign;
    if (LOWER_WORDSIGNS[word] && lowerWordsignAllowed(units, start, end)) {
      return caps[0] + LOWER_WORDSIGNS[word];
    }
  }

  // Words such as "in" / "be" that touch punctuation are spelled out rather
  // than using the groupsign alone (UEB 10.5).
  if (alone && LOWER_WORDSIGNS[word] && word.length <= 2) return spelled();

  const exception = findException(word);
  if (exception === null) return spelled();

  const blocked = caps.map((c, k) => k > 0 && c !== '');
  if (typeof exception === 'string') {
    let k = 0;
    for (const ch of exception) {
      if (ch === '|') blocked[k] = true;
      else k++;
    }
  }
  const plain = run.map((u) => !u.mods);
  const pieces = contract(word, blocked, plain);

  // A word standing alone must not look like a different whole-word sign:
  // "sch" contracted is ⠎⠡ ("such"), so it is spelled out; if even the
  // spelling is a sign ("b" = "but", "cd" = "could"), a grade 1 indicator
  // is added.
  if (alone) {
    const readsAs = WHOLE_WORD_SIGNS.get(pieces.map((p) => p.braille).join(''));
    if (readsAs !== undefined && readsAs !== word) {
      const letters = run.map((u) => LETTERS[u.base!]).join('');
      return (WHOLE_WORD_SIGNS.has(letters) ? IND.grade1Symbol : '') + spelled();
    }
  }

  return pieces
    .map((piece) =>
      piece.end - piece.start === 1 ? letterAt(piece.start) : caps[piece.start] + piece.braille,
    )
    .join('');
}

/** Braille of every sign that stands for a whole word, mapped to that word. */
const WHOLE_WORD_SIGNS: Map<string, string> = (() => {
  const map = new Map<string, string>();
  const add = (table: Record<string, string>) => {
    for (const [word, braille] of Object.entries(table)) if (!map.has(braille)) map.set(braille, word);
  };
  add(WORDSIGNS);
  add(SHORTFORMS);
  add(LOWER_WORDSIGNS);
  for (const rule of GROUP_RULES) {
    if (['and', 'for', 'of', 'the', 'with'].includes(rule.text)) map.set(rule.braille, rule.text);
  }
  return map;
})();

function translateSequence(sequence: string, ctx: SequenceContext): string {
  const units = toUnits(sequence);
  let out = '';
  let passageMarked = !ctx.passageStart;

  for (let i = 0; i < units.length; ) {
    const u = units[i];

    // Numbers (including a leading decimal point, e.g. ".5").
    if (isDigit(u) || (u.ch === '.' && isDigit(units[i + 1]) && !isDigit(units[i - 1]))) {
      let j = i;
      let slashes = 0;
      while (j < units.length) {
        if (isDigit(units[j])) j++;
        else if ((units[j].ch === ',' || units[j].ch === '.') && isDigit(units[j + 1])) j++;
        else if (units[j].ch === '/' && isDigit(units[j - 1]) && isDigit(units[j + 1])) {
          slashes++;
          j++;
        } else break;
      }
      // A single slash between digits is a fraction line (1/2); dates use the
      // ordinary slash and restart the number (12/25/2024).
      out += IND.numeric;
      for (let k = i; k < j; k++) {
        const ch = units[k].ch;
        if (ch === '/') {
          if (slashes === 1) out += FRACTION_LINE;
          else out += SYMBOLS['/'] + IND.numeric;
        } else {
          out += DIGITS[ch] ?? SYMBOLS[ch];
        }
      }
      i = j;
      if (isLetter(units[i])) {
        let e = i;
        while (isLetter(units[e])) e++;
        if (!units[i].upper && 'abcdefghij'.includes(units[i].base!)) out += IND.grade1Symbol;
        if (!passageMarked) {
          out += IND.capitalPassage;
          passageMarked = true;
        }
        out += translateLetters(units, i, e, ctx, true);
        i = e;
      }
      continue;
    }

    if (isLetter(u)) {
      let e = i;
      while (isLetter(units[e])) e++;
      if (!passageMarked) {
        out += IND.capitalPassage;
        passageMarked = true;
      }
      out += translateLetters(units, i, e, ctx, false);
      i = e;
      continue;
    }

    out += translateSymbol(units, i, ctx);
    i++;
  }

  if (ctx.passageEnd) out += IND.capitalTerminator;
  return out;
}

function translateSymbol(units: Unit[], i: number, ctx: SequenceContext): string {
  if (units[i].braille) return units[i].braille!;
  const ch = units[i].ch;
  const prev = units[i - 1];
  const next = units[i + 1];

  if (ch === '"') {
    const opening = !prev || OPENING_PUNCTUATION.has(prev.ch) || WORD_SEPARATORS.has(prev.ch);
    return opening ? QUOTES.doubleOpen : QUOTES.doubleClose;
  }
  if (ch === '\u201c') return QUOTES.doubleOpen;
  if (ch === '\u201d') return QUOTES.doubleClose;
  if (ch === '\u2018') {
    ctx.openSingleQuotes++;
    return QUOTES.singleOpen;
  }
  if (ch === '\u2019') {
    if (isLetter(prev) && isLetter(next)) return QUOTES.apostrophe;
    if (ctx.openSingleQuotes > 0 && !isLetter(next)) {
      ctx.openSingleQuotes--;
      return QUOTES.singleClose;
    }
    return QUOTES.apostrophe;
  }
  if (VULGAR_FRACTIONS[ch]) {
    const [num, den] = VULGAR_FRACTIONS[ch];
    return IND.numeric + DIGITS[num] + FRACTION_LINE + DIGITS[den];
  }
  const symbol = SYMBOLS[ch];
  if (symbol) return symbol;

  ctx.unsupported.add(ch);
  return '';
}

// ---------------------------------------------------------------------------
// Lines and documents
// ---------------------------------------------------------------------------

type SequenceCase = 'caps' | 'lower' | 'neutral';

function sequenceCase(sequence: string): SequenceCase {
  if (/\p{Ll}/u.test(sequence)) return 'lower';
  return /\p{L}/u.test(sequence) ? 'caps' : 'neutral';
}

function translateLine(line: string, grade: Grade, unsupported: Set<string>, quoteState: { open: number }): Segment[] {
  const parts = line.split(/( +)/).filter((p) => p.length > 0);
  const wordIndexes = parts.map((p, i) => (p.trim() ? i : -1)).filter((i) => i >= 0);
  const cases = wordIndexes.map((i) => sequenceCase(parts[i]));

  // Capitals passages: three or more fully capitalised sequences, ended only
  // by a lowercase letter (numbers and symbols such as "&" do not end them).
  const passageRole = new Map<number, 'start' | 'middle' | 'end'>();
  for (let w = 0; w < wordIndexes.length; ) {
    if (cases[w] === 'lower') {
      w++;
      continue;
    }
    let e = w;
    while (e < wordIndexes.length && cases[e] !== 'lower') e++;
    const capsInRun = [];
    for (let k = w; k < e; k++) if (cases[k] === 'caps') capsInRun.push(k);
    if (capsInRun.length >= 3) {
      const first = capsInRun[0];
      const last = capsInRun[capsInRun.length - 1];
      for (let k = first; k <= last; k++) {
        passageRole.set(wordIndexes[k], k === first ? 'start' : k === last ? 'end' : 'middle');
      }
    }
    w = e;
  }

  return parts.map((part, index) => {
    if (!part.trim()) return { print: part, braille: part };
    const role = passageRole.get(index);
    const ctx: SequenceContext = {
      grade,
      passageStart: role === 'start',
      inPassage: role !== undefined,
      passageEnd: role === 'end',
      unsupported,
      openSingleQuotes: quoteState.open,
    };
    const braille = translateSequence(part, ctx);
    quoteState.open = ctx.openSingleQuotes;
    return { print: part, braille };
  });
}

/** Translate print text to Unicode braille. */
export function translate(text: string, options: TranslateOptions = {}): TranslationResult {
  const grade = options.grade ?? 2;
  const unsupported = new Set<string>();
  const quoteState = { open: 0 };
  const lines = normalizeText(text)
    .split('\n')
    .map((line) => {
      const segments = translateLine(line, grade, unsupported, quoteState);
      return segments;
    });
  const braille = lines.map((segments) => segments.map((s) => s.braille).join('')).join('\n');
  return { braille, lines, unsupported: [...unsupported] };
}

/** Convenience wrapper returning only the braille string. */
export function toBraille(text: string, grade: Grade = 2): string {
  return translate(text, { grade }).braille;
}
