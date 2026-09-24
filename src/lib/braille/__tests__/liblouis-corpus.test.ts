/**
 * Regression test against liblouis, the open-source braille translator used
 * by NVDA, JAWS, BRLTTY and most braille software.
 *
 * The fixture holds 7,000 common English words and 350 sentences from
 * Project Gutenberg books, translated by liblouis 3.1 (see
 * scripts/build-liblouis-fixture.mjs). Differences are only allowed where
 * they are listed below with a reason.
 */
import { describe, expect, it } from 'vitest';
import fixture from './fixtures/liblouis-ueb.json';
import { toBraille } from '../ueb';

type Row = [print: string, grade1: string, grade2: string];
const words = fixture.words as Row[];
const sentences = fixture.sentences as Row[];

/**
 * Known, reviewed differences from liblouis 3.1 (grade 2 only).
 * Dialect spellings and names where liblouis applies "be"/"ea" more freely.
 */
const KNOWN_WORD_DIFFERENCES = new Set(['citizeness', 'bez', 'becuz', 'leah']);

/**
 * liblouis 3.1 (2017) predates two table fixes that current liblouis and
 * BANA guidance agree on, so sentences containing these are compared after
 * applying the fix to the expected text:
 *  - em dash is ⠠⠤ (dash), not ⠐⠠⠤ (long dash);
 *  - ’ is an apostrophe ⠄ between letters and a closing quote ⠠⠴ elsewhere,
 *    never ⠴⠄.
 */
function modernise(print: string, expected: string): string | null {
  if (print.includes('’')) return null; // ’ cannot be patched reliably; skip
  return print.includes('—') ? expected.replace(/⠐⠠⠤/g, '⠠⠤') : expected;
}

/** liblouis 3.1 does not start a capitals passage right after an opening quote. */
const KNOWN_SENTENCE_DIFFERENCES = new Set(['“AND I ONLY AM ESCAPED ALONE TO TELL THEE” Job.']);

describe('agreement with liblouis on common words', () => {
  it.each([
    ['grade 1', 1],
    ['grade 2', 2],
  ] as const)('%s: every word matches', (_, grade) => {
    const mismatches = words
      .filter(([print]) => grade === 1 || !KNOWN_WORD_DIFFERENCES.has(print))
      .filter((row) => toBraille(row[0], grade) !== row[grade])
      .map(([print]) => print);
    expect(mismatches).toEqual([]);
  });

  it('the known differences are still the only ones', () => {
    const differing = words.filter((row) => toBraille(row[0], 2) !== row[2]).map(([print]) => print);
    expect(new Set(differing)).toEqual(KNOWN_WORD_DIFFERENCES);
  });
});

describe('agreement with liblouis on sentences', () => {
  it.each([
    ['grade 1', 1],
    ['grade 2', 2],
  ] as const)('%s: every comparable sentence matches', (_, grade) => {
    let compared = 0;
    const mismatches: string[] = [];
    for (const row of sentences) {
      if (KNOWN_SENTENCE_DIFFERENCES.has(row[0])) continue;
      const expected = modernise(row[0], row[grade]);
      if (expected === null) continue;
      compared++;
      if (toBraille(row[0], grade) !== expected) mismatches.push(row[0]);
    }
    expect(mismatches).toEqual([]);
    expect(compared).toBeGreaterThan(250);
  });
});
