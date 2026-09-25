/**
 * Unified English Braille (UEB) symbol and contraction tables.
 *
 * Every sign is written as dot numbers (e.g. `'5-1345'`) so the tables can be
 * checked directly against the Rules of Unified English Braille (ICEB, 2013)
 * and the BANA quick-reference charts.
 */
import { d } from './cells';

// ---------------------------------------------------------------------------
// Indicators
// ---------------------------------------------------------------------------

export const IND = {
  numeric: d('3456'),
  grade1Symbol: d('56'),
  capitalLetter: d('6'),
  capitalWord: d('6-6'),
  capitalPassage: d('6-6-6'),
  capitalTerminator: d('6-3'),
} as const;

// ---------------------------------------------------------------------------
// Letters, digits and print symbols
// ---------------------------------------------------------------------------

const LETTER_DOTS: Record<string, string> = {
  a: '1', b: '12', c: '14', d: '145', e: '15', f: '124', g: '1245', h: '125', i: '24',
  j: '245', k: '13', l: '123', m: '134', n: '1345', o: '135', p: '1234', q: '12345',
  r: '1235', s: '234', t: '2345', u: '136', v: '1236', w: '2456', x: '1346', y: '13456',
  z: '1356',
};

export const LETTERS: Record<string, string> = Object.fromEntries(
  Object.entries(LETTER_DOTS).map(([letter, dots]) => [letter, d(dots)]),
);

/** Digits use the cells for a–j after a numeric indicator. */
export const DIGITS: Record<string, string> = {
  '1': LETTERS.a, '2': LETTERS.b, '3': LETTERS.c, '4': LETTERS.d, '5': LETTERS.e,
  '6': LETTERS.f, '7': LETTERS.g, '8': LETTERS.h, '9': LETTERS.i, '0': LETTERS.j,
};

/** Punctuation and signs that are the same in grade 1 and grade 2. */
export const SYMBOLS: Record<string, string> = Object.fromEntries(
  Object.entries({
    ',': '2', ';': '23', ':': '25', '.': '256', '!': '235', '?': '236', "'": '3',
    '-': '36', '\u2010': '36', '\u2011': '36', // hyphen, non-breaking hyphen
    '\u2013': '6-36', '\u2014': '6-36', '\u2015': '6-36', // en dash, em dash, bar
    '\u2212': '5-36', // minus sign
    '(': '5-126', ')': '5-345', '[': '46-126', ']': '46-345', '{': '456-126', '}': '456-345',
    '/': '456-34', '\u2044': '456-34', '\\': '456-16', '<': '4-126', '>': '4-345',
    '_': '46-36', '~': '4-35', '^': '4-26', '|': '456-1256',
    '@': '4-1', '#': '456-1456', '$': '4-234', '%': '46-356', '&': '4-12346',
    '*': '5-35', '+': '5-235', '=': '5-2356',
    '\u00ab': '456-236', '\u00bb': '456-356', // « »
    '\u2026': '256-256-256', // …
    '\u2022': '456-256', '\u25e6': '456-256', '\u25aa': '456-256', '\u2023': '456-256',
    '\u25cf': '456-256', '\u25cb': '456-256', '\u2043': '456-256', // bullets
    '\u00a9': '45-14', '\u00ae': '45-1235', '\u2122': '45-2345', '\u00b0': '45-245',
    '\u00a7': '45-234', '\u00b6': '45-1234',
    '\u20ac': '4-15', '\u00a3': '4-123', '\u00a5': '4-13456', '\u00a2': '4-14',
    '\u00d7': '5-236', '\u00f7': '5-34', '\u00b1': '456-235',
    '\u2032': '2356', '\u2033': '2356-2356', // prime, double prime
  }).map(([ch, dots]) => [ch, d(dots)]),
);

/** Quotation marks are resolved to opening/closing forms by context. */
export const QUOTES = {
  doubleOpen: d('236'),
  doubleClose: d('356'),
  singleOpen: d('6-236'),
  singleClose: d('6-356'),
  apostrophe: d('3'),
};

/** Diacritic modifiers, keyed by Unicode combining mark (from NFD). */
export const MODIFIERS: Record<string, string> = Object.fromEntries(
  Object.entries({
    '\u0300': '45-16', // grave
    '\u0301': '45-34', // acute
    '\u0302': '45-146', // circumflex
    '\u0303': '45-12456', // tilde
    '\u0304': '4-36', // macron
    '\u0306': '4-346', // breve
    '\u0308': '45-25', // diaeresis
    '\u030a': '45-1246', // ring
    '\u030c': '45-346', // caron
    '\u0327': '45-12346', // cedilla
  }).map(([mark, dots]) => [mark, d(dots)]),
);

/** Precomposed fractions become numeric fractions (⠼⠁⠌⠃ for ½). */
export const VULGAR_FRACTIONS: Record<string, [string, string]> = {
  '\u00bd': ['1', '2'], '\u00bc': ['1', '4'], '\u00be': ['3', '4'], '\u2153': ['1', '3'],
  '\u2154': ['2', '3'], '\u215b': ['1', '8'], '\u215c': ['3', '8'], '\u215d': ['5', '8'],
  '\u215e': ['7', '8'],
};

export const FRACTION_LINE = d('34');

/** Characters that may come before a word that is still "standing alone". */
export const OPENING_PUNCTUATION = new Set([
  '(', '[', '{', '"', "'", '\u201c', '\u2018', '\u00ab',
]);

/** Characters that may follow a word that is still "standing alone". */
export const CLOSING_PUNCTUATION = new Set([
  ',', ';', ':', '.', '!', '?', ')', ']', '}', '"', "'", '\u201d', '\u2019', '\u00bb', '\u2026',
]);

/** Hyphens and dashes separate words for contraction purposes (e.g. "so-called"). */
export const WORD_SEPARATORS = new Set(['-', '\u2010', '\u2011', '\u2013', '\u2014', '\u2015']);

// ---------------------------------------------------------------------------
// Grade 2 contractions
// ---------------------------------------------------------------------------

/**
 * Where inside a word a groupsign may be used.
 * - `any`: anywhere
 * - `begin`: only at the start of a word
 * - `middle`: only with a letter on both sides
 * - `notBegin`: anywhere except the first letter
 */
export type Position = 'any' | 'begin' | 'middle' | 'notBegin';

export interface GroupRule {
  text: string;
  braille: string;
  position: Position;
  /** Lower groupsigns get a small cost penalty so upper signs win ties (e.g. "dear" = d-e-ar). */
  lower?: boolean;
  /**
   * Initial-letter contractions (⠐⠕ "one", ⠸⠓ "had") lose ties against other
   * signs, so "prisoner" is p-r-i-s-o-n-er and "shade" is sh-a-d.
   */
  initial?: boolean;
  /** Extra check against the whole lowercase word. */
  allow?: (word: string, index: number) => boolean;
}

const g = (text: string, dots: string, position: Position, extra: Partial<GroupRule> = {}): GroupRule => ({
  text,
  braille: d(dots),
  position,
  ...extra,
});

/**
 * "be", "con" and "dis" are only contracted when they form the first
 * syllable of the word. English syllable boundaries cannot be computed
 * reliably, so these patterns list the common prefix uses.
 */
const BE_PREFIX =
  /^be(?:ing|ga[nt]?|gin|gun|cam|com|cause|fall|fell|fit|fog|fri|grudg|guil|half|hav|head|hel|hind|hold|jewel|lat|lie|lo[nvw]|moan|mus|nev|nigh|numb|queath|rat|reav|reft|seech|set|side|siege|smirch|sought|speak|spoke|stow|stir|strew|stride|think|tide|tim|tok|tray|troth|tween|twixt|wail|ware|wept|wild|witch|yond)/;
const CON_PREFIX = /^con(?=[bcdfghjklmnpqrstvwxz])/;
const DIS_PREFIX = /^dis(?=[aeiouy]|[bcdfgjklmnpqrstvw][a-z]{2})/;

export const GROUP_RULES: GroupRule[] = [
  // Strong contractions (also used as whole words).
  g('and', '12346', 'any'),
  g('for', '123456', 'any'),
  g('of', '12356', 'any'),
  g('the', '2346', 'any'),
  g('with', '23456', 'any'),
  // Strong groupsigns.
  g('ch', '16', 'any'),
  g('gh', '126', 'any'),
  g('sh', '146', 'any'),
  g('th', '1456', 'any'),
  g('wh', '156', 'any'),
  g('ed', '1246', 'any'),
  g('er', '12456', 'any'),
  g('ou', '1256', 'any'),
  g('ow', '246', 'any'),
  g('st', '34', 'any'),
  g('ar', '345', 'any'),
  g('ing', '346', 'notBegin'),
  // Lower groupsigns.
  g('ea', '2', 'middle', { lower: true }),
  g('bb', '23', 'middle', { lower: true }),
  g('cc', '25', 'middle', { lower: true }),
  g('ff', '235', 'middle', { lower: true }),
  g('gg', '2356', 'middle', { lower: true }),
  g('en', '26', 'any', { lower: true }),
  g('in', '35', 'any', { lower: true }),
  g('be', '23', 'begin', { lower: true, allow: (w) => BE_PREFIX.test(w) }),
  g('con', '25', 'begin', { lower: true, allow: (w) => CON_PREFIX.test(w) && w.length > 4 }),
  g('dis', '256', 'begin', { lower: true, allow: (w) => DIS_PREFIX.test(w) }),
  // Initial-letter contractions (dots 5, 45 and 456 + letter).
  g('day', '5-145', 'any', { initial: true }),
  g('ever', '5-15', 'any', { initial: true }),
  g('father', '5-124', 'any', { initial: true }),
  g('here', '5-125', 'any', { initial: true }),
  g('know', '5-13', 'any', { initial: true }),
  g('lord', '5-123', 'any', { initial: true }),
  g('mother', '5-134', 'any', { initial: true }),
  g('name', '5-1345', 'any', { initial: true }),
  g('one', '5-135', 'any', { initial: true }),
  g('part', '5-1234', 'any', { initial: true }),
  g('question', '5-12345', 'any', { initial: true }),
  g('right', '5-1235', 'any', { initial: true }),
  g('some', '5-234', 'any', { initial: true }),
  g('time', '5-2345', 'any', { initial: true }),
  g('under', '5-136', 'any', { initial: true }),
  g('work', '5-2456', 'any', { initial: true }),
  g('young', '5-13456', 'any', { initial: true }),
  g('character', '5-16', 'any', { initial: true }),
  g('through', '5-1456', 'any', { initial: true }),
  g('where', '5-156', 'any', { initial: true }),
  g('ought', '5-1256', 'any', { initial: true }),
  // "there" is a whole-word sign, also used in its standard compounds.
  g('there', '5-2346', 'begin', {
    initial: true,
    allow: (w) => /^there(?:after|abouts?|at|by|fore|from|in|of|on|to|upon|with)$/.test(w),
  }),
  g('upon', '45-136', 'any', { initial: true }),
  g('word', '45-2456', 'any', { initial: true }),
  g('these', '45-2346', 'any', { initial: true }),
  g('those', '45-1456', 'any', { initial: true }),
  g('whose', '45-156', 'any', { initial: true }),
  g('cannot', '456-14', 'any', { initial: true }),
  g('had', '456-125', 'any', { initial: true }),
  g('many', '456-134', 'any', { initial: true }),
  g('spirit', '456-234', 'any', { initial: true }),
  g('world', '456-2456', 'any', { initial: true }),
  g('their', '456-2346', 'any', { initial: true }),
  // Final-letter groupsigns (never at the start of a word).
  g('ound', '46-145', 'notBegin'),
  g('ance', '46-15', 'notBegin'),
  g('sion', '46-1345', 'notBegin'),
  g('less', '46-234', 'notBegin'),
  g('ount', '46-2345', 'notBegin'),
  g('ence', '56-15', 'notBegin'),
  g('ong', '56-1245', 'notBegin'),
  g('ful', '56-123', 'notBegin'),
  g('tion', '56-1345', 'notBegin'),
  g('ness', '56-234', 'notBegin'),
  g('ment', '56-2345', 'notBegin'),
  g('ity', '56-13456', 'notBegin'),
];

/** Wordsigns: used only when the word stands alone. */
export const WORDSIGNS: Record<string, string> = Object.fromEntries(
  Object.entries({
    // Alphabetic wordsigns
    but: '12', can: '14', do: '145', every: '15', from: '124', go: '1245', have: '125',
    just: '245', knowledge: '13', like: '123', more: '134', not: '1345', people: '1234',
    quite: '12345', rather: '1235', so: '234', that: '2345', us: '136', very: '1236',
    will: '2456', it: '1346', you: '13456', as: '1356',
    // Strong wordsigns
    child: '16', shall: '146', this: '1456', which: '156', out: '1256', still: '34',
    // Initial-letter contraction that is only used as a whole word
    there: '5-2346',
  }).map(([word, dots]) => [word, d(dots)]),
);

/**
 * Lower wordsigns: only used when standing alone *and* not touching
 * punctuation other than brackets (before) or brackets, ";" and ":" (after).
 */
export const LOWER_WORDSIGNS: Record<string, string> = Object.fromEntries(
  Object.entries({ be: '23', enough: '26', were: '2356', his: '236', in: '35', was: '356' }).map(
    ([word, dots]) => [word, d(dots)],
  ),
);

export const LOWER_WORDSIGN_BEFORE = new Set(['(', '[', '{']);
export const LOWER_WORDSIGN_AFTER = new Set([')', ']', '}', ';', ':']);

/** The 75 UEB shortforms (abbreviated words). */
export const SHORTFORMS: Record<string, string> = Object.fromEntries(
  Object.entries({
    about: '1-12', above: '1-12-1236', according: '1-14', across: '1-14-1235', after: '1-124',
    afternoon: '1-124-1345', afterward: '1-124-2456', again: '1-1245', against: '1-1245-34',
    almost: '1-123-134', already: '1-123-1235', also: '1-123', although: '1-123-1456',
    altogether: '1-123-2345', always: '1-123-2456', because: '23-14', before: '23-124',
    behind: '23-125', below: '23-123', beneath: '23-1345', beside: '23-234', between: '23-2345',
    beyond: '23-13456', blind: '12-123', braille: '12-1235-123', children: '16-1345',
    conceive: '25-14-1236', conceiving: '25-14-1236-1245', could: '14-145', deceive: '145-14-1236',
    deceiving: '145-14-1236-1245', declare: '145-14-123', declaring: '145-14-123-1245',
    either: '15-24', first: '124-34', friend: '124-1235', good: '1245-145',
    great: '1245-1235-2345', herself: '125-12456-124', him: '125-134', himself: '125-134-124',
    immediate: '24-134-134', its: '1346-234', itself: '1346-124', letter: '123-1235',
    little: '123-123', much: '134-16', must: '134-34', myself: '134-13456-124',
    necessary: '1345-15-14', neither: '1345-15-24', oneself: '5-135-124',
    ourselves: '1256-1235-1236-234', paid: '1234-145', perceive: '1234-12456-14-1236',
    perceiving: '1234-12456-14-1236-1245', perhaps: '1234-12456-125', quick: '12345-13',
    receive: '1235-14-1236', receiving: '1235-14-1236-1245', rejoice: '1235-245-14',
    rejoicing: '1235-245-14-1245', said: '234-145', should: '146-145', such: '234-16',
    themselves: '2346-134-1236-234', thyself: '1456-13456-124', today: '2345-145',
    together: '2345-1245-1235', tomorrow: '2345-134', tonight: '2345-1345', would: '2456-145',
    your: '13456-1235', yourself: '13456-1235-124', yourselves: '13456-1235-1236-234',
  }).map(([word, dots]) => [word, d(dots)]),
);

/**
 * Shortforms that may begin a longer word, with the endings allowed after
 * them. UEB permits shortforms inside longer words only in specific cases;
 * this covers the common derivatives (plurals, -ly, -ness, -er, ...).
 */
export const SHORTFORM_DERIVATIVES: Record<string, RegExp> = {
  about: /^(s)$/,
  according: /^ly$/,
  after: /^(s|noons?|wards?|thought|math|life)$/,
  afternoon: /^s$/,
  afterward: /^s$/,
  beside: /^s$/,
  blind: /^(s|ly|ness|fold|folded|folds)$/,
  braille: /^(s|d|r|rs|writer|writers)$/,
  children: /^s$/,
  conceive: /^[ds]$/,
  could: /^n$/, // couldn't
  deceive: /^[dsr]$/,
  declare: /^[ds]$/,
  first: /^(s|ly|hand|born)$/,
  friend: /^(s|ly|less|lier|liest|liness|ship|ships)$/,
  good: /^(s|ly|ness|bye|will|wife|man|men)$/,
  great: /^(er|est|ly|ness|s|coats?)$/,
  immediate: /^ly$/,
  letter: /^(s|ed|ing|head|heads)$/,
  little: /^(r|st|ness)$/,
  must: /^n$/, // mustn't
  perceive: /^[ds]$/,
  quick: /^(er|est|ly|ness|s|en|ens|ened|ening|sand|silver)$/,
  receive: /^[dsr]$/,
  rejoice: /^[ds]$/,
  should: /^n$/, // shouldn't
  today: /^s$/,
  tomorrow: /^s$/,
  tonight: /^s$/,
  would: /^n$/, // wouldn't
  your: /^s$/,
};

/**
 * Prefixes after which a shortform may still be used (un-necessary,
 * here-after, where-about-s). Keyed by prefix, listing the allowed shortforms.
 */
export const SHORTFORM_PREFIXES: Record<string, RegExp> = {
  un: /^(necessary|friendly|friendliness|blinded)$/,
  here: /^(after|about|abouts)$/,
  there: /^(after|about|abouts)$/,
  where: /^(about|abouts)$/,
  round: /^(about|abouts)$/,
};

/** Endings after an apostrophe that still count as "standing alone" (it's, can't, you're). */
export const APOSTROPHE_SUFFIX = /^(s|d|t|ll|re|ve)$/i;

/**
 * Word-specific exceptions to the general rules.
 * - `|` marks a boundary no contraction may cross (compound words, prefixes).
 * - A value of `null` means "spell the word without contractions".
 * - A key ending in `*` applies to every word starting with that prefix.
 */
export const EXCEPTIONS: Record<string, string | null> = {
  // "one" does not bridge syllables pronounced differently.
  colonel: 'colo|nel',
  coronet: 'coro|net',
  // "ever" is not used where the stress falls on "vere"/"vert"/"verse".
  'severe*': 'se|vere',
  'severit*': 'se|verit',
  'persever*': 'perse|ver',
  'revert*': 're|vert',
  'reverse*': 're|verse',
  'revere*': 're|vere',
  // Contractions follow the syllables: wher-ever, not where-ver.
  wherever: 'wher|ever',
  'bayonet*': 'bayo|net',
  // Compound words: contractions do not bridge the two parts.
  nowhere: 'no|where',
  // The prefix "re-" is not joined to the next letter by "ea".
  'react*': 're|act',
  'reapp*': 're|app',
  'reass*': 're|ass',
  'reaff*': 're|aff',
  'realig*': 're|alig',
  'reanim*': 're|anim',
  'readj*': 're|adj',
  'readm*': 're|adm',
  'reaw*': 're|aw',
  'deact*': 'de|act',
};
