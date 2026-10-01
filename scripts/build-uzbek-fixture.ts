/**
 * Rebuilds src/lib/braille/__tests__/fixtures/liblouis-uzbek.json — Uzbek
 * reference translations from liblouis (table uz-g1.utb, liblouis 3.39+).
 *
 * The sentences in scripts/uzbek-corpus.txt are translated in the Latin
 * script and, after transliteration, in the Cyrillic script, plus every
 * distinct word on its own.
 *
 * Usage (needs the lou_translate tool from https://github.com/liblouis/liblouis/releases):
 *   LOU_TRANSLATE=/path/to/lou_translate LOUIS_TABLEPATH=/path/to/tables npx tsx scripts/build-uzbek-fixture.ts
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { latinToCyrillic } from '../src/lib/braille/uzbek/translit';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const lou = process.env.LOU_TRANSLATE ?? 'lou_translate';

const sentences = readFileSync(path.join(root, 'scripts/uzbek-corpus.txt'), 'utf8')
  .split(/\r?\n/)
  .map((l) => l.trim())
  .filter((l) => l && !l.startsWith('#'));

const words = [
  ...new Set(
    sentences
      .flatMap((s) => s.split(/\s+/))
      .map((w) => w.replace(/^[«"(]+|[.,!?;:»")]+$/g, ''))
      .filter((w) => /\p{L}/u.test(w)),
  ),
];

function louis(lines: string[]): string[] {
  const out = execFileSync(lou, ['--forward', 'uz-g1.utb'], { input: lines.join('\n') + '\n', encoding: 'utf8' });
  const result = out.replace(/\r\n/g, '\n').split('\n').slice(0, lines.length);
  if (result.length !== lines.length) throw new Error('lou_translate returned a different number of lines');
  // liblouis writes spaces as the blank braille cell; the app uses ordinary spaces.
  return result.map((l) => l.replace(/⠀/g, ' '));
}

const pairs = (lines: string[]) => {
  const braille = louis(lines);
  return lines.map((line, i) => [line, braille[i]]);
};

const latin = [...sentences, ...words];
const cyrillic = latin.map(latinToCyrillic);

const fixture = {
  source: 'liblouis 3.39.0, table uz-g1.utb. Sentences from scripts/uzbek-corpus.txt; see scripts/build-uzbek-fixture.ts.',
  latin: pairs(latin),
  cyrillic: pairs(cyrillic),
};

writeFileSync(path.join(root, 'src/lib/braille/__tests__/fixtures/liblouis-uzbek.json'), JSON.stringify(fixture, null, 0));
console.log(`Wrote ${fixture.latin.length} Latin and ${fixture.cyrillic.length} Cyrillic items.`);
