/**
 * Uzbek braille → print. Uzbek braille is uncontracted and every letter cell
 * is unique, so letters decode directly to Cyrillic; the result can then be
 * shown in the Latin alphabet.
 */
import { asciiToUnicode, looksLikeBrailleAscii } from '../back';
import { d } from '../cells';
import { CYRILLIC_LETTERS } from './uzbek';
import { cyrillicToLatin } from './translit';

export type UzbekScript = 'latin' | 'cyrillic';

const LETTER_OF = new Map(Object.entries(CYRILLIC_LETTERS).map(([letter, cell]) => [cell, letter]));
const DIGIT_OF = new Map(
  Object.entries({ '1': '1', '2': '12', '3': '14', '4': '145', '5': '15', '6': '124', '7': '1245', '8': '125', '9': '24', '0': '245' }).map(
    ([digit, dots]) => [d(dots), digit],
  ),
);

/** Multi-cell signs, longest first. */
const MULTI: [string, string][] = (
  [
    ['256-256-256', '…'],
    ['3456-245-356', '%'],
    ['4-1', '@'],
    ['4-145', '$'],
    ['4-15', '€'],
    ['4-1235', '₽'],
    ['46-356', '°'],
    ['56-35', '•'],
  ] as [string, string][]
).map(([dots, ch]) => [d(dots), ch]);

const SINGLE = new Map(
  Object.entries({ '256': '.', '2': ',', '26': '?', '235': '!', '23': ';', '25': ':', '35': '*', '126': '[', '345': ']', '34': '/' }).map(
    ([dots, ch]) => [d(dots), ch],
  ),
);

const NUMERIC = d('3456');
const CAPITAL = d('6');
const HYPHEN = d('36');
const PAREN = d('2356');
const QUOTE_OPEN = d('236');
const QUOTE_CLOSE = d('356');
const APOSTROPHE = d('3');
const HARD_SIGN = 'ъ';

function decodeLine(line: string): string {
  const cells = [...line.replace(/⠀/g, ' ')];
  let out = '';
  let numeric = false;
  let capsNext = false;
  let capsWord = false;
  const prevIsLetter = () => /\p{L}/u.test(out.slice(-1));

  for (let i = 0; i < cells.length; ) {
    const cell = cells[i];
    const rest = cells.slice(i).join('');

    if (cell === ' ') {
      out += ' ';
      numeric = false;
      capsWord = false;
      i++;
      continue;
    }
    const multi = MULTI.find(([braille]) => rest.startsWith(braille));
    if (multi) {
      out += multi[1];
      numeric = false;
      i += [...multi[0]].length;
      continue;
    }
    if (cell === NUMERIC) {
      numeric = true;
      i++;
      continue;
    }
    if (numeric && DIGIT_OF.has(cell)) {
      out += DIGIT_OF.get(cell);
      i++;
      continue;
    }
    if (numeric && cell === d('2') && DIGIT_OF.has(cells[i + 1])) {
      out += ',';
      i++;
      continue;
    }
    numeric = false;

    if (cell === CAPITAL) {
      if (cells[i + 1] === CAPITAL) {
        capsWord = true;
        i += 2;
      } else {
        capsNext = true;
        i++;
      }
      continue;
    }
    const letter = LETTER_OF.get(cell);
    if (letter) {
      out += capsWord || capsNext ? letter.toUpperCase() : letter;
      capsNext = false;
      i++;
      continue;
    }

    const next = cells[i + 1];
    const nextIsText = next !== undefined && next !== ' ';
    if (cell === HYPHEN) {
      // A dash is written without the space before it: "ha⠤ yoʻq" = "ha — yoʻq".
      out += prevIsLetter() && !nextIsText ? ' —' : out.endsWith(' ') || !out ? '—' : '-';
      i++;
      continue;
    }
    if (cell === PAREN) {
      out += out === '' || out.endsWith(' ') ? '(' : ')';
      i++;
      continue;
    }
    if (cell === QUOTE_OPEN) {
      out += '“';
      i++;
      continue;
    }
    if (cell === QUOTE_CLOSE) {
      out += '”';
      i++;
      continue;
    }
    if (cell === APOSTROPHE) {
      out += prevIsLetter() && next && LETTER_OF.has(next) ? HARD_SIGN : '’';
      i++;
      continue;
    }
    // ⠖ is "!" but also "+", as in phone numbers (+998).
    const sign = cell === d('235') && next === NUMERIC ? '+' : SINGLE.get(cell);
    out += sign ?? cell;
    // Braille drops the space after commas and semicolons; print needs it back.
    if ((sign === ',' || sign === ';') && nextIsText) out += ' ';
    i++;
  }
  return out;
}

/**
 * Uzbek braille does not mark capitals, so the start of each sentence is
 * capitalised to make the decoded text easier to read.
 */
function sentenceCase(text: string): string {
  return text.replace(
    /(^|[.!?…]\s+|:\s+(?=["“«])|\n\s*)(["“«(]?)(\p{Ll})/gu,
    (_, before, quote, letter) => before + quote + letter.toUpperCase(),
  );
}

/** Back-translate Uzbek braille (Unicode or BRF) to Latin or Cyrillic text. */
export function backTranslateUzbek(input: string, script: UzbekScript = 'latin'): string {
  const braille = looksLikeBrailleAscii(input) ? asciiToUnicode(input) : input;
  const cyrillic = braille.replace(/\r\n?/g, '\n').split('\n').map(decodeLine).join('\n');
  // Capital signs (dot 6) only appear when "mark capitals" was used.
  const text = braille.includes(CAPITAL) ? cyrillic : sentenceCase(cyrillic);
  return script === 'latin' ? cyrillicToLatin(text, { initialYe: false }) : text;
}
