import { describe, expect, it } from 'vitest';
import fixture from './fixtures/liblouis-uzbek.json';
import { SAMPLES } from '@/components/convert/samples';
import { detectLanguage } from '../detect';

type Pair = [print: string, braille: string];
const sentences = (pairs: Pair[]) => pairs.map(([print]) => print).filter((print) => print.split(' ').length >= 6);

describe('detectLanguage', () => {
  it('recognises the built-in samples', () => {
    for (const sample of SAMPLES) {
      expect(detectLanguage(sample.text), sample.title).toBe(sample.code === 'uz' ? 'uz' : 'en');
    }
  });

  it('recognises longer Uzbek corpus sentences in both scripts', () => {
    const all = [...sentences(fixture.latin as Pair[]), ...sentences(fixture.cyrillic as Pair[])];
    const missed = all.filter((print) => detectLanguage(print) === 'en');
    expect(missed).toEqual([]);
    const found = all.filter((print) => detectLanguage(print) === 'uz').length;
    expect(found / all.length).toBeGreaterThan(0.8);
  });

  it('recognises English', () => {
    expect(detectLanguage('The quick brown fox jumps over the lazy dog and runs to the river.')).toBe('en');
    expect(detectLanguage('Please bring your permission slip to the office by Friday.')).toBe('en');
  });

  it('accepts every Uzbek apostrophe', () => {
    for (const a of ["'", 'ʻ', '‘', '’', '`']) {
      expect(detectLanguage(`Bu yil o${a}quvchilar g${a}alaba qozonishdi.`)).toBe('uz');
    }
  });

  it('stays unsure about short or mixed text', () => {
    expect(detectLanguage('')).toBeNull();
    expect(detectLanguage('Hello')).toBeNull();
    expect(detectLanguage('12:30')).toBeNull();
  });
});
