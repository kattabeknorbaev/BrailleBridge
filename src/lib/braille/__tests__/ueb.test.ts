import { describe, expect, it } from 'vitest';
import { toBraille, translate } from '../ueb';

const g1 = (text: string) => toBraille(text, 1);
const g2 = (text: string) => toBraille(text, 2);

describe('letters, capitals and punctuation', () => {
  it('writes letters and basic punctuation', () => {
    expect(g1('hello, world!')).toBe('⠓⠑⠇⠇⠕⠂ ⠺⠕⠗⠇⠙⠖');
    expect(g1('why? yes; no: ok.')).toBe('⠺⠓⠽⠦ ⠽⠑⠎⠆ ⠝⠕⠒ ⠕⠅⠲');
  });

  it('marks single capitals, capitalised words and passages', () => {
    expect(g1('Hello')).toBe('⠠⠓⠑⠇⠇⠕');
    expect(g1('HELLO world')).toBe('⠠⠠⠓⠑⠇⠇⠕ ⠺⠕⠗⠇⠙');
    expect(g1('I AM HERE now')).toBe('⠠⠠⠠⠊ ⠁⠍ ⠓⠑⠗⠑⠠⠄ ⠝⠕⠺');
    expect(g2('HELLO THERE MY FRIEND.')).toBe('⠠⠠⠠⠓⠑⠇⠇⠕ ⠐⠮ ⠍⠽ ⠋⠗⠲⠠⠄');
  });

  it('ends a capitalised word before lowercase letters (CDs)', () => {
    expect(g2('CDs')).toBe('⠠⠠⠉⠙⠠⠄⠎');
    expect(g2('McDonald')).toBe('⠠⠍⠉⠠⠙⠕⠝⠁⠇⠙');
  });

  it('keeps capitals passages going through numbers and symbols', () => {
    expect(g2('SERVICE & PATON 5 HENRIETTA STREET 1897')).toBe(
      '⠠⠠⠠⠎⠻⠧⠊⠉⠑ ⠈⠯ ⠏⠁⠞⠕⠝ ⠼⠑ ⠓⠢⠗⠊⠑⠞⠞⠁ ⠌⠗⠑⠑⠞⠠⠄ ⠼⠁⠓⠊⠛',
    );
  });

  it('resolves opening and closing quotation marks', () => {
    expect(g1('"Hi"')).toBe('⠦⠠⠓⠊⠴');
    expect(g1('“Hi,” she said')).toBe('⠦⠠⠓⠊⠂⠴ ⠎⠓⠑ ⠎⠁⠊⠙');
    expect(g1('‘ok’')).toBe('⠠⠦⠕⠅⠠⠴');
    expect(g1('don’t')).toBe('⠙⠕⠝⠄⠞');
  });

  it('uses UEB dashes, ellipsis and signs', () => {
    expect(g1('yes—no')).toBe('⠽⠑⠎⠠⠤⠝⠕');
    expect(g1('wait…')).toBe('⠺⠁⠊⠞⠲⠲⠲');
    expect(g1('50% @ $3 & more')).toBe('⠼⠑⠚⠨⠴ ⠈⠁ ⠈⠎⠼⠉ ⠈⠯ ⠍⠕⠗⠑');
    expect(g1('(a) [b] {c}')).toBe('⠐⠣⠁⠐⠜ ⠨⠣⠃⠨⠜ ⠸⠣⠉⠸⠜');
    expect(g1('© • °')).toBe('⠘⠉ ⠸⠲ ⠘⠚');
  });

  it('places accent modifiers before the letter and capitals before both', () => {
    expect(g1('café')).toBe('⠉⠁⠋⠘⠌⠑');
    expect(g1('naïve')).toBe('⠝⠁⠘⠒⠊⠧⠑');
    expect(g1('Élan')).toBe('⠠⠘⠌⠑⠇⠁⠝');
  });

  it('writes the ae ligature with the ligature indicator', () => {
    expect(g1('æt')).toBe('⠁⠘⠖⠑⠞');
  });
});

describe('numbers', () => {
  it('uses the numeric indicator, decimal point and comma', () => {
    expect(g1('3.14 and 1,000')).toBe('⠼⠉⠲⠁⠙ ⠁⠝⠙ ⠼⠁⠂⠚⠚⠚');
    expect(g1('.5')).toBe('⠼⠲⠑');
  });

  it('adds a grade 1 indicator before letters a–j after digits', () => {
    expect(g2('10am 4a 2nd 3D')).toBe('⠼⠁⠚⠰⠁⠍ ⠼⠙⠰⠁ ⠼⠃⠝⠙ ⠼⠉⠠⠙');
  });

  it('leaves letters after digits uncontracted', () => {
    expect(g2('1st 4th')).toBe('⠼⠁⠎⠞ ⠼⠙⠞⠓');
  });

  it('treats a single slash between digits as a fraction line but dates as slashes', () => {
    expect(g1('1/2')).toBe('⠼⠁⠌⠃');
    expect(g1('½')).toBe('⠼⠁⠌⠃');
    expect(g1('12/25/2024')).toBe('⠼⠁⠃⠸⠌⠼⠃⠑⠸⠌⠼⠃⠚⠃⠙');
  });

  it('restarts numbers after hyphens and colons', () => {
    expect(g1('555-1234')).toBe('⠼⠑⠑⠑⠤⠼⠁⠃⠉⠙');
    expect(g1('10:30')).toBe('⠼⠁⠚⠒⠼⠉⠚');
  });
});

describe('grade 2 contractions', () => {
  it('uses wordsigns only when the word stands alone', () => {
    expect(g2('you can do it')).toBe('⠽ ⠉ ⠙ ⠭');
    expect(g2('It’s')).toBe('⠠⠭⠄⠎');
    expect(g2("can't")).toBe('⠉⠄⠞');
    expect(g2('so-called')).toBe('⠎⠤⠉⠁⠇⠇⠫');
    expect(g2('item')).toBe('⠊⠞⠑⠍'); // "it" is not a wordsign inside a word
  });

  it('uses strong contractions anywhere', () => {
    expect(g2('the other father and mother')).toBe('⠮ ⠕⠮⠗ ⠐⠋ ⠯ ⠐⠍');
    expect(g2('without')).toBe('⠾⠳⠞');
  });

  it('only uses lower wordsigns away from punctuation', () => {
    expect(g2('in be was were his enough')).toBe('⠔ ⠆ ⠴ ⠶ ⠦ ⠢');
    expect(g2('in, be. his?')).toBe('⠊⠝⠂ ⠃⠑⠲ ⠓⠊⠎⠦');
    expect(g2('(was)')).toBe('⠐⠣⠴⠐⠜');
    expect(g2('brother-in-law')).toBe('⠃⠗⠕⠮⠗⠤⠔⠤⠇⠁⠺');
  });

  it('respects groupsign positions', () => {
    expect(g2('heat idea')).toBe('⠓⠂⠞ ⠊⠙⠑⠁'); // ea only in the middle
    expect(g2('thing ingot')).toBe('⠹⠬ ⠔⠛⠕⠞'); // ing never begins a word
    expect(g2('suffer egg')).toBe('⠎⠥⠖⠻ ⠑⠛⠛'); // ff/gg only in the middle
    expect(g2('effort')).toBe('⠑⠋⠿⠞'); // e-f-for-t saves more than e-ff-or-t
    expect(g2('lesson unless')).toBe('⠇⠑⠎⠎⠕⠝ ⠥⠝⠨⠎'); // final-letter signs never begin a word
  });

  it('uses be-, con- and dis- only as a first syllable', () => {
    expect(g2('believe became being')).toBe('⠆⠇⠊⠑⠧⠑ ⠆⠉⠁⠍⠑ ⠆⠬');
    expect(g2('best been bed')).toBe('⠃⠑⠌ ⠃⠑⠢ ⠃⠫');
    expect(g2('contain disappear dish')).toBe('⠒⠞⠁⠔ ⠲⠁⠏⠏⠑⠜ ⠙⠊⠩');
  });

  it('picks the contraction that saves the most space', () => {
    expect(g2('several never money')).toBe('⠎⠐⠑⠁⠇ ⠝⠐⠑ ⠍⠐⠕⠽');
    expect(g2('sound nation friendly')).toBe('⠎⠨⠙ ⠝⠁⠰⠝ ⠋⠗⠇⠽');
  });

  it('breaks ties the way UEB readers expect', () => {
    expect(g2('dear')).toBe('⠙⠑⠜'); // e-ar, not ea-r
    expect(g2('shade')).toBe('⠩⠁⠙⠑'); // sh-a-d-e, not s-had-e
    expect(g2('prisoner')).toBe('⠏⠗⠊⠎⠕⠝⠻'); // o-n-er, not one-r
  });

  it('uses shortforms and their standard derivatives', () => {
    expect(g2('quick about friends')).toBe('⠟⠅ ⠁⠃ ⠋⠗⠎');
    expect(g2('goodness unnecessary')).toBe('⠛⠙⠰⠎ ⠥⠝⠝⠑⠉');
    expect(g2("couldn't")).toBe('⠉⠙⠝⠄⠞');
    expect(g2('blinded mustard')).toBe('⠃⠇⠔⠙⠫ ⠍⠥⠌⠜⠙'); // not before a vowel
  });

  it('applies word exceptions', () => {
    expect(g2('colonel reaction nowhere')).toBe('⠉⠕⠇⠕⠝⠑⠇ ⠗⠑⠁⠉⠰⠝ ⠝⠕⠐⠱');
  });

  it('never writes a word that reads as a different wordsign', () => {
    expect(g2('b x-ray')).toBe('⠰⠃ ⠰⠭⠤⠗⠁⠽');
    expect(g2('CD')).toBe('⠰⠠⠠⠉⠙');
    expect(g2('st sch en')).toBe('⠎⠞ ⠎⠉⠓ ⠑⠝');
    expect(g2('a I o')).toBe('⠁ ⠠⠊ ⠕');
  });

  it('keeps capitals on contracted words', () => {
    expect(g2('The THE')).toBe('⠠⠮ ⠠⠠⠮');
    expect(g2('World')).toBe('⠠⠸⠺');
  });

  it('does not contract in grade 1', () => {
    expect(g1('the knowledge')).toBe('⠞⠓⠑ ⠅⠝⠕⠺⠇⠑⠙⠛⠑');
    expect(g1('b x-ray')).toBe('⠃ ⠭⠤⠗⠁⠽');
  });
});

describe('text handling', () => {
  it('keeps line structure and spaces', () => {
    expect(g1('a b\nc')).toBe('⠁ ⠃\n⠉');
  });

  it('normalises typographic ligatures, non-breaking spaces and soft hyphens', () => {
    expect(g1('ﬁsh\u00a0o\u00adk')).toBe('⠋⠊⠎⠓ ⠕⠅');
  });

  it('reports characters it cannot translate instead of emitting them', () => {
    const result = translate('hi \u{1F600} 你', { grade: 1 });
    expect(result.braille).toBe('⠓⠊  ');
    expect(result.unsupported).toEqual(['\u{1F600}', '你']);
  });

  it('gives identical results from the line cache, including warnings', () => {
    const text = 'cached line \u{1F600}\n‘open quote\nclosed’ here';
    const first = translate(text, { grade: 2 });
    const second = translate(text, { grade: 2 });
    expect(second).toEqual(first);
    expect(second.unsupported).toEqual(['\u{1F600}']);
    // The open quote carries to the next line, so its closing mark is a quote, not an apostrophe.
    expect(second.lines[2][0].braille.endsWith('⠠⠴')).toBe(true);
  });

  it('returns print/braille pairs for each word', () => {
    const result = translate('The cat', { grade: 2 });
    expect(result.lines[0]).toEqual([
      { print: 'The', braille: '⠠⠮' },
      { print: ' ', braille: ' ' },
      { print: 'cat', braille: '⠉⠁⠞' },
    ]);
  });
});
