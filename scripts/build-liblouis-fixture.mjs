#!/usr/bin/env node
/**
 * Rebuilds src/lib/braille/__tests__/fixtures/liblouis-ueb.json — the
 * reference translations the braille engine is tested against.
 *
 * 1. Downloads ten public-domain books from Project Gutenberg.
 * 2. Takes the 4,000 most common words of five "training" books and 3,000
 *    words that only appear in five other "held-out" books, plus sample
 *    sentences from both.
 * 3. Translates everything with liblouis (the open-source braille library
 *    used by NVDA, JAWS and BRLTTY) using its UEB grade 1 and 2 tables.
 *
 * Usage:
 *   npm install --no-save liblouis-js@0.2.0
 *   node scripts/build-liblouis-fixture.mjs
 */
import { createRequire } from 'node:module';
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const OUT = path.join(root, 'src/lib/braille/__tests__/fixtures/liblouis-ueb.json');

const TRAINING = [11, 1342, 1661, 84, 98]; // Alice, Pride and Prejudice, Sherlock Holmes, Frankenstein, A Tale of Two Cities
const HELD_OUT = [1260, 2600, 2701, 345, 74]; // Jane Eyre, War and Peace, Moby Dick, Dracula, Tom Sawyer

// --- liblouis (emscripten build) -------------------------------------------
const louisDir = path.dirname(require.resolve('liblouis-js/package.json'));
const capi = require(path.join(louisDir, 'liblouis-no-tables.js'));
const easy = require(path.join(louisDir, 'easy-api.js'));
easy.setLiblouisBuild(capi);
easy.registerLogCallback(() => {});
easy.setLogLevel(60000);
try {
  capi.FS.mkdir('/tables');
} catch {
  // exists
}
for (const f of readdirSync(path.join(louisDir, 'tables'))) {
  capi.FS.writeFile(`/tables/${f}`, new Uint8Array(readFileSync(path.join(louisDir, 'tables', f))), { encoding: 'binary' });
}

function louis(table, text) {
  const n = text.length;
  const cap = n * 8 + 16;
  const inp = capi._malloc(cap * 2);
  const out = capi._malloc(cap * 2);
  const inLen = capi._malloc(4);
  const outLen = capi._malloc(4);
  for (let i = 0; i < n; i++) capi.setValue(inp + i * 2, text.charCodeAt(i), 'i16');
  capi.setValue(inLen, n, 'i32');
  capi.setValue(outLen, cap, 'i32');
  const ok = capi.ccall(
    'lou_translateString',
    'number',
    ['string', 'number', 'number', 'number', 'number', 'number', 'number', 'number'],
    [`/tables/unicode.dis,/tables/${table}`, inp, inLen, out, outLen, 0, 0, 0],
  );
  let result = null;
  if (ok) {
    result = '';
    const len = capi.getValue(outLen, 'i32');
    for (let i = 0; i < len; i++) result += String.fromCharCode(capi.getValue(out + i * 2, 'i16') & 0xffff);
  }
  [inp, out, inLen, outLen].forEach((p) => capi._free(p));
  return result;
}

const row = (text) => [text, louis('en-ueb-g1.ctb', text), louis('en-ueb-g2.ctb', text)];

// --- corpus -----------------------------------------------------------------
async function book(id) {
  const res = await fetch(`https://www.gutenberg.org/cache/epub/${id}/pg${id}.txt`);
  if (!res.ok) throw new Error(`Could not download book ${id}: ${res.status}`);
  const text = await res.text();
  const start = text.indexOf('*** START');
  return text.slice(text.indexOf('\n', start), text.indexOf('*** END'));
}

function wordFrequencies(text) {
  const freq = new Map();
  for (const m of text.toLowerCase().matchAll(/[a-z]+(?:['’][a-z]+)?/g)) {
    const w = m[0].replace('’', "'");
    freq.set(w, (freq.get(w) || 0) + 1);
  }
  return [...freq.entries()].sort((a, b) => b[1] - a[1]);
}

function sampleSentences(text, count) {
  const paras = text
    .split(/\r?\n\r?\n/)
    .map((p) => p.replace(/\s+/g, ' ').trim())
    .filter((p) => p.length > 40 && p.length < 220 && !/[_*[\]]/.test(p));
  const step = Math.max(1, Math.floor(paras.length / count));
  const out = [];
  for (let i = 0; i < paras.length && out.length < count; i += step) out.push(paras[i]);
  return out;
}

const trainingText = (await Promise.all(TRAINING.map(book))).join('\n');
const heldOutText = (await Promise.all(HELD_OUT.map(book))).join('\n');

const trainingWords = wordFrequencies(trainingText)
  .filter(([, c]) => c >= 3)
  .slice(0, 4000)
  .map(([w]) => w);
const known = new Set(trainingWords);
const heldOutWords = wordFrequencies(heldOutText)
  .filter(([w, c]) => c >= 2 && !known.has(w))
  .slice(0, 3000)
  .map(([w]) => w);

const fixture = {
  source:
    'liblouis 3.1.0 via liblouis-js 0.2.0 (tables en-ueb-g1.ctb, en-ueb-g2.ctb). Words and sentences from Project Gutenberg books; see scripts/build-liblouis-fixture.mjs.',
  columns: ['print', 'grade1', 'grade2'],
  words: [...trainingWords, ...heldOutWords].map(row),
  sentences: [...sampleSentences(trainingText, 400).slice(0, 200), ...sampleSentences(heldOutText, 300).slice(0, 150)].map(row),
};
writeFileSync(OUT, JSON.stringify(fixture));
console.log(`Wrote ${fixture.words.length} words and ${fixture.sentences.length} sentences to ${path.relative(root, OUT)}`);
