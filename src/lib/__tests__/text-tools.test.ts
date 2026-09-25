import { describe, expect, it } from 'vitest';
import { countWords, looksHardWrapped, reflowText } from '../text-tools';

const scanned = [
  'Alice was beginning to get very tired of sitting by her',
  'sister on the bank, and of having nothing to do: once or',
  'twice she had peeped into the book her sister was read-',
  'ing, but it had no pictures or conversations in it.',
  '',
  'So she was considering in her own mind (as well as she',
  'could, for the hot day made her feel very sleepy and',
  'stupid).',
].join('\n');

describe('reflowText', () => {
  it('joins lines broken by the page layout and repairs hyphenation', () => {
    expect(reflowText(scanned)).toBe(
      'Alice was beginning to get very tired of sitting by her sister on the bank, and of having nothing to do: once or twice she had peeped into the book her sister was reading, but it had no pictures or conversations in it.\n\n' +
        'So she was considering in her own mind (as well as she could, for the hot day made her feel very sleepy and stupid).',
    );
  });

  it('keeps headings, list items and blank lines', () => {
    const text = 'CHAPTER I\nDown the Rabbit-Hole\n\n\n• first item that is long enough to wrap onto\n• second item';
    expect(reflowText(text)).toBe('CHAPTER I\nDown the Rabbit-Hole\n\n• first item that is long enough to wrap onto\n• second item');
  });

  it('without blank lines, treats sentence-final lines as paragraph ends', () => {
    const text = 'This is a first paragraph that happens to be long enough.\nThis is the second one, which wraps across a line\nbreak in the middle.';
    expect(reflowText(text)).toBe(
      'This is a first paragraph that happens to be long enough.\nThis is the second one, which wraps across a line break in the middle.',
    );
  });
});

describe('looksHardWrapped / countWords', () => {
  it('detects scanned-page line breaks', () => {
    expect(looksHardWrapped(scanned)).toBe(true);
    expect(looksHardWrapped('One line.\nAnother line.\nThird.\nFourth.')).toBe(false);
  });

  it('counts words', () => {
    expect(countWords('  two words ')).toBe(2);
    expect(countWords('')).toBe(0);
  });
});
