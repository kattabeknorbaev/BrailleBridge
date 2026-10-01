/**
 * Uzbek Latin ↔ Cyrillic transliteration, following the correspondence of
 * the official Latin alphabet (1995) with the Cyrillic alphabet.
 *
 * Latin → Cyrillic is used to produce braille that matches Cyrillic-based
 * Uzbek braille books; Cyrillic → Latin is used to show back-translated
 * braille in the Latin script.
 */

/** Characters people use for the oʻ / gʻ mark and the tutuq belgisi (ʼ). */
export const APOSTROPHES = "'‘’ʻʼ`";
const isApostrophe = (ch: string | undefined) => !!ch && APOSTROPHES.includes(ch);

const LATIN_TO_CYRILLIC: Record<string, string> = {
  a: 'а', b: 'б', d: 'д', f: 'ф', g: 'г', h: 'ҳ', i: 'и',
  j: 'ж', k: 'к', l: 'л', m: 'м', n: 'н', o: 'о', p: 'п',
  q: 'қ', r: 'р', s: 'с', t: 'т', u: 'у', v: 'в', x: 'х',
  y: 'й', z: 'з', c: 'ц', w: 'в',
};

const VOWELS_LATIN = 'aeiou';
const isLatinLetter = (ch: string | undefined) => !!ch && /[a-z]/i.test(ch);

function withCase(cyrillic: string, source: string): string {
  // "Sh" → "Ш", "SH" → "Ш", "sh" → "ш": the first source letter decides.
  return source[0] === source[0].toUpperCase() && source[0] !== source[0].toLowerCase()
    ? cyrillic.charAt(0).toUpperCase() + cyrillic.slice(1)
    : cyrillic;
}

/** Convert Uzbek Latin text to Cyrillic. Cyrillic or other characters pass through unchanged. */
export function latinToCyrillic(text: string): string {
  let out = '';
  const chars = [...text];
  for (let i = 0; i < chars.length; ) {
    const ch = chars[i];
    const lower = ch.toLowerCase();
    const next = chars[i + 1];
    const nextLower = next?.toLowerCase();
    const prev = chars[i - 1];
    const wordStart = !isLatinLetter(prev) && !isApostrophe(prev);
    const afterVowel = !!prev && VOWELS_LATIN.includes(prev.toLowerCase());

    // oʻ, gʻ
    if ((lower === 'o' || lower === 'g') && isApostrophe(next)) {
      out += withCase(lower === 'o' ? 'ў' : 'ғ', ch);
      i += 2;
      continue;
    }
    // sh, ch (but "sʼh" is s + h, the apostrophe only separates them)
    if ((lower === 's' || lower === 'c') && nextLower === 'h') {
      out += withCase(lower === 's' ? 'ш' : 'ч', ch);
      i += 2;
      continue;
    }
    // ya, yu, yo (not yoʻ), ye
    if (lower === 'y' && nextLower && 'aueo'.includes(nextLower)) {
      const third = chars[i + 2];
      if (nextLower === 'o' && isApostrophe(third)) {
        out += withCase('й', ch); // y + oʻ → йў
        i += 1;
        continue;
      }
      if (nextLower === 'e' && !(wordStart || afterVowel)) {
        out += withCase('й', ch); // consonant + ye → йе
        i += 1;
        continue;
      }
      const map: Record<string, string> = { a: 'я', u: 'ю', o: 'ё', e: 'е' };
      out += withCase(map[nextLower], ch);
      i += 2;
      continue;
    }
    // e: э at the start of a word or after a vowel, otherwise е
    if (lower === 'e') {
      out += withCase(wordStart || afterVowel ? 'э' : 'е', ch);
      i += 1;
      continue;
    }
    // Tutuq belgisi (maʼno → маъно); "sʼh" keeps s and h apart without ъ.
    if (isApostrophe(ch) && isLatinLetter(prev)) {
      const sepSh = prev.toLowerCase() === 's' && nextLower === 'h';
      if (!sepSh && isLatinLetter(next)) out += 'ъ';
      else if (!sepSh) out += ch;
      i += 1;
      continue;
    }
    const mapped = LATIN_TO_CYRILLIC[lower];
    if (mapped) {
      out += withCase(mapped, ch);
      i += 1;
      continue;
    }
    out += ch;
    i += 1;
  }
  return out;
}

const CYRILLIC_TO_LATIN: Record<string, string> = {
  'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'ё': 'yo',
  'ж': 'j', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l',
  'м': 'm', 'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's',
  'т': 't', 'у': 'u', 'ф': 'f', 'х': 'x', 'ц': 'ts', 'ч': 'ch',
  'ш': 'sh', 'щ': 'sh', 'ъ': 'ʼ', 'ы': 'i', 'ь': '', 'э': 'e',
  'ю': 'yu', 'я': 'ya', 'ў': 'oʻ', 'қ': 'q', 'ғ': 'gʻ',
  'ҳ': 'h',
};

const VOWELS_CYRILLIC = 'аеёиоуэюяў';
const isCyrillicLetter = (ch: string | undefined) => !!ch && /\p{Script=Cyrillic}/u.test(ch);

/**
 * Convert Uzbek Cyrillic text to the official Latin alphabet (with ʻ and ʼ).
 * `initialYe`: write е as "ye" at the start of a word and after a vowel, as
 * the spelling rules require. Turn it off for text decoded from braille that
 * was itself made from Latin, where "ye" is already spelled y-e.
 */
export function cyrillicToLatin(text: string, { initialYe = true } = {}): string {
  const chars = [...text];
  let out = '';
  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i];
    const lower = ch.toLowerCase();
    const upper = ch !== lower;
    let latin: string | undefined;
    if (lower === 'е') {
      const prev = chars[i - 1]?.toLowerCase();
      const wordStart = !isCyrillicLetter(prev);
      latin = initialYe && (wordStart || (prev && VOWELS_CYRILLIC.includes(prev))) ? 'ye' : 'e';
    } else if (lower === 'с' && chars[i + 1]?.toLowerCase() === 'ҳ') {
      latin = 'sʼ'; // сҳ → sʼh, so it is not read as "sh"
    } else {
      latin = CYRILLIC_TO_LATIN[lower];
    }
    if (latin === undefined) {
      out += ch;
      continue;
    }
    if (upper && latin) {
      const nextUpper = chars[i + 1] && chars[i + 1] !== chars[i + 1].toLowerCase();
      latin = nextUpper ? latin.toUpperCase() : latin.charAt(0).toUpperCase() + latin.slice(1);
    }
    out += latin;
  }
  return out;
}
