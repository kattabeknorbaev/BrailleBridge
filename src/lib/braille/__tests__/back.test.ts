import { describe, expect, it } from 'vitest';
import fixture from './fixtures/liblouis-ueb.json';
import { asciiToUnicode, backTranslate, looksLikeBrailleAscii } from '../back';
import { toBraille } from '../ueb';

type Row = [print: string, grade1: string, grade2: string];
const words = (fixture.words as Row[]).map(([print]) => print);
const sentences = (fixture.sentences as Row[]).map(([print]) => print);

/** Print forms that share one braille sign are compared in a canonical form. */
const canonical = (s: string) =>
  s.replace(/…/g, '...').replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/--/g, '—');

describe('back-translation', () => {
  it('decodes grade 1 letters, capitals, numbers and punctuation', () => {
    expect(backTranslate('⠠⠓⠑⠇⠇⠕⠂ ⠺⠕⠗⠇⠙⠖', 1)).toBe('Hello, world!');
    expect(backTranslate('⠼⠉⠲⠁⠙ ⠁⠝⠙ ⠼⠁⠂⠚⠚⠚', 1)).toBe('3.14 and 1,000');
    expect(backTranslate('⠠⠠⠓⠑⠇⠇⠕ ⠠⠉⠁⠋⠘⠌⠑', 1)).toBe('HELLO Café');
  });

  it('resolves position-dependent cells in grade 2', () => {
    expect(backTranslate('⠓⠂⠞⠂ ⠆⠇⠊⠑⠧⠑⠆ ⠗⠁⠆⠊⠞', 2)).toBe('heat, believe; rabbit');
    expect(backTranslate('⠦⠠⠓⠊⠴ ⠓⠊⠎⠦', 2)).toBe('“Hi” his?');
  });

  it('reads wordsigns, shortforms and lower wordsigns as whole words', () => {
    expect(backTranslate('⠽ ⠉ ⠙ ⠭', 2)).toBe('you can do it');
    expect(backTranslate('⠟⠅ ⠋⠗⠎ ⠛⠙⠰⠎', 2)).toBe('quick friends goodness');
    expect(backTranslate('⠔ ⠆ ⠴ ⠶ ⠦ ⠢', 2)).toBe('in be was were his enough');
    expect(backTranslate('⠠⠭⠄⠎ ⠉⠄⠞', 2)).toBe("It's can't");
  });

  it('handles capitals passages', () => {
    expect(backTranslate('⠠⠠⠠⠓⠑⠇⠇⠕ ⠐⠮ ⠍⠽ ⠋⠗⠲⠠⠄ ⠓⠊', 2)).toBe('HELLO THERE MY FRIEND. hi');
  });

  it('accepts Braille ASCII (BRF) input', () => {
    expect(looksLikeBrailleAscii(',HELLO _W')).toBe(true);
    expect(looksLikeBrailleAscii('plain {text}')).toBe(false);
    expect(looksLikeBrailleAscii('⠓⠊')).toBe(false);
    expect(asciiToUnicode(',hello')).toBe('⠠⠓⠑⠇⠇⠕');
    expect(backTranslate(',! QK BR[N FOX4', 2)).toBe('The quick brown fox.');
  });

  it.each([1, 2] as const)('round-trips every fixture word in grade %i', (grade) => {
    const failures = words.filter((word) => backTranslate(toBraille(word, grade), grade) !== word);
    expect(failures).toEqual([]);
  });

  it.each([1, 2] as const)('round-trips fixture sentences in grade %i', (grade) => {
    const failures = sentences.filter(
      (s) => canonical(backTranslate(toBraille(s, grade), grade)) !== canonical(s),
    );
    expect(failures).toEqual([]);
  });
});
