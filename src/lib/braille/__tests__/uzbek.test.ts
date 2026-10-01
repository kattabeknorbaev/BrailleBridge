import { describe, expect, it } from 'vitest';
import fixture from './fixtures/liblouis-uzbek.json';
import { toUzbekBraille, translateUzbek } from '../uzbek/uzbek';
import { backTranslateUzbek } from '../uzbek/back';
import { cyrillicToLatin, latinToCyrillic } from '../uzbek/translit';

type Pair = [print: string, braille: string];
const latin = fixture.latin as Pair[];
const cyrillic = fixture.cyrillic as Pair[];
/** The corpus sentences (the fixture also holds every word on its own). */
const isSentence = ([print]: Pair) => print.includes(' ');

/**
 * liblouis (uz-g1.utb) keeps a capital sign (dots 4-6) before Latin words
 * that start with a capital I, V, X, L, C, D or M, mistaking them for Roman
 * numerals ("Men", "Diqqat", "Xalq"), while other capitals are unmarked.
 * BrailleBridge leaves all capitals unmarked, so that sign is removed from
 * the expected output.
 */
const withoutRomanNumeralQuirk = (braille: string) => braille.replace(/(^|[ ⠦⠶])⠨(?=\S)/g, '$1');

describe('Uzbek braille: agreement with liblouis uz-g1', () => {
  it('matches every Cyrillic sentence and word', () => {
    const mismatches = cyrillic.filter(([print, braille]) => toUzbekBraille(print) !== braille).map(([p]) => p);
    expect(mismatches).toEqual([]);
    expect(cyrillic.length).toBeGreaterThan(400);
  });

  it('matches every Latin sentence and word (apart from the Roman-numeral capital quirk)', () => {
    const mismatches = latin
      .filter(([print, braille]) => toUzbekBraille(print) !== withoutRomanNumeralQuirk(braille))
      .map(([p]) => p);
    expect(mismatches).toEqual([]);
  });

  it('gives the same braille for the Latin and Cyrillic spelling of a sentence', () => {
    let compared = 0;
    latin.forEach(([print], i) => {
      // Latin "ya/yo/yu/ye/e" and ʼ are spelled letter by letter, so compare only sentences without them.
      if (!print.includes(' ') || /y[aeou]|(^|\s)e|'/i.test(print)) return;
      expect(toUzbekBraille(print)).toBe(toUzbekBraille(cyrillic[i][0]));
      compared++;
    });
    expect(compared).toBeGreaterThan(5);
  });
});

describe('Uzbek letters and signs', () => {
  it('uses the four Uzbek additions to Russian braille', () => {
    expect(toUzbekBraille('ғ қ ў ҳ')).toBe('⠻ ⠽ ⠧ ⠹');
    expect(toUzbekBraille('q h x')).toBe('⠽ ⠹ ⠓');
  });

  it('recognises oʻ and gʻ however the apostrophe is typed', () => {
    const expected = toUzbekBraille("O'zbekiston");
    for (const mark of ['ʻ', '‘', '’', '`', 'ʼ']) {
      expect(toUzbekBraille(`O${mark}zbekiston`)).toBe(expected);
    }
    expect(expected).toBe('⠧⠵⠃⠑⠅⠊⠎⠞⠕⠝');
    expect(toUzbekBraille('gʻalaba')).toBe('⠻⠁⠇⠁⠃⠁');
  });

  it('writes sh and ch as one cell in any letter case', () => {
    expect(toUzbekBraille('shahar Shahar SHAHAR')).toBe('⠱⠁⠹⠁⠗ ⠱⠁⠹⠁⠗ ⠱⠁⠹⠁⠗');
    expect(toUzbekBraille('choy CHOY')).toBe('⠟⠕⠯ ⠟⠕⠯');
  });

  it('writes numbers with the numeric indicator and keeps decimal commas', () => {
    expect(toUzbekBraille('3,5')).toBe('⠼⠉⠂⠑');
    expect(toUzbekBraille('2024-yil')).toBe('⠼⠃⠚⠃⠙⠤⠯⠊⠇');
    expect(toUzbekBraille('10:30')).toBe('⠼⠁⠚⠒⠼⠉⠚');
  });

  it('follows the Russian-braille spacing rules', () => {
    expect(toUzbekBraille('non, sut')).toBe('⠝⠕⠝⠂⠎⠥⠞'); // no space after a comma
    expect(toUzbekBraille('ha — yoʻq')).toBe('⠹⠁⠤ ⠯⠧⠽'); // no space before a dash
  });

  it('uses Russian-braille punctuation', () => {
    expect(toUzbekBraille('Xoʻsh? Ha!')).toBe('⠓⠧⠱⠢ ⠹⠁⠖');
    expect(toUzbekBraille('«Oʻtkan kunlar» (roman)')).toBe('⠦⠧⠞⠅⠁⠝ ⠅⠥⠝⠇⠁⠗⠴ ⠶⠗⠕⠍⠁⠝⠶');
  });

  it('can mark capitals with dot 6 when asked', () => {
    expect(toUzbekBraille('Toshkent', { capitals: true })).toBe('⠠⠞⠕⠱⠅⠑⠝⠞');
    expect(toUzbekBraille('BMT', { capitals: true })).toBe('⠠⠠⠃⠍⠞');
  });

  it('can convert Latin text to Cyrillic first', () => {
    expect(toUzbekBraille('yaxshi', { latin: 'letters' })).toBe('⠯⠁⠓⠱⠊');
    expect(toUzbekBraille('yaxshi', { latin: 'cyrillic' })).toBe('⠫⠓⠱⠊'); // я is one cell
    expect(toUzbekBraille('maʼno', { latin: 'cyrillic' })).toBe('⠍⠁⠷⠝⠕'); // ъ
  });

  it('reports characters it cannot write', () => {
    expect(translateUzbek('salom 你').unsupported).toEqual(['你']);
  });
});

describe('Latin ↔ Cyrillic transliteration', () => {
  it.each([
    ['yaxshi', 'яхши'],
    ["yo'l", 'йўл'],
    ['Yevropa', 'Европа'],
    ['ertak', 'эртак'],
    ['poyezd', 'поезд'],
    ["ma'no", 'маъно'],
    ["Is'hoq", 'Исҳоқ'],
    ["O'zbekiston", 'Ўзбекистон'],
    ['SHAHAR', 'ШАҲАР'],
    ["g'alaba", 'ғалаба'],
  ])('%s ↔ %s', (lat, cyr) => {
    expect(latinToCyrillic(lat)).toBe(cyr);
    expect(cyrillicToLatin(cyr)).toBe(lat.replace(/'/g, (_, i) => (/[ogOG]/.test(lat[i - 1]) ? 'ʻ' : 'ʼ')));
  });
});

describe('Uzbek back-translation', () => {
  const canonical = (s: string) =>
    s.toLowerCase().replace(/[«»"“”]/g, '"').replace(/ ?[-—] /g, ' — ').replace(/['ʻʼ’]/g, "'");

  it('round-trips every Cyrillic sentence (up to capitals and quote style)', () => {
    const failures = cyrillic
      .filter(isSentence)
      .filter(([print]) => canonical(backTranslateUzbek(toUzbekBraille(print), 'cyrillic')) !== canonical(print));
    expect(failures).toEqual([]);
  });

  it('round-trips every Latin sentence (up to capitals and quote style)', () => {
    const failures = latin
      .filter(isSentence)
      .filter(([print]) => canonical(backTranslateUzbek(toUzbekBraille(print), 'latin')) !== canonical(print));
    expect(failures).toEqual([]);
  });

  it('restores sentence capitals and spaces after commas', () => {
    expect(backTranslateUzbek('⠎⠁⠇⠕⠍⠂⠙⠥⠝⠯⠕⠖ ⠍⠑⠝⠊⠝⠛ ⠊⠎⠍⠊⠍ ⠁⠵⠊⠵⠲', 'latin')).toBe('Salom, dunyo! Mening ismim aziz.');
    expect(backTranslateUzbek('⠼⠃⠚⠃⠙⠤⠯⠊⠇', 'cyrillic')).toBe('2024-йил');
  });
});
