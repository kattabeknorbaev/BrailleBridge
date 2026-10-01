/**
 * OCR benchmark, run in the browser from the dev server:
 *   const b = await import('/scripts/ocr-bench/bench.ts'); await b.run();
 * Renders Uzbek text (Latin and Cyrillic) as clean and photo-like images and
 * measures the character error rate (CER) of each recognition strategy.
 */
import { latinToCyrillic } from '/src/lib/braille/uzbek/translit.ts';

const LATIN_TEXT = [
  'Hurmatli ota-onalar va oʻquvchilar! Fan oyligi 14-mart, juma kuni soat 10:30 dan 14:00 gacha maktab zalida boʻlib oʻtadi.',
  'Koʻzi ojiz bolalar uchun yangi kitoblar keldi. Brayl yozuvi oltita nuqtadan iborat. Sport bilan shugʻullanish sogʻliq uchun foydali.',
  'Qishda qor yogʻadi, bahorda gullar ochiladi. Gʻalaba kuni 9-mayda nishonlanadi. Shahar markazida yangi bogʻ ochildi.',
  'Osh tayyorlash uchun 1 kg guruch, 800 g goʻsht va sabzi kerak. Narxi 15000 soʻm, chegirma 20%.',
].join('\n');

export const TEXTS = { latin: LATIN_TEXT, cyrillic: latinToCyrillic(LATIN_TEXT) };

interface Look {
  font: number;
  family: string;
  rotate?: number;
  shadow?: boolean;
  blur?: number;
  noise?: number;
  paper?: string;
  ink?: string;
}

export const LOOKS: Record<string, Look> = {
  'clean-serif': { font: 30, family: 'Georgia, "Times New Roman", serif' },
  'clean-sans': { font: 30, family: 'Arial, sans-serif' },
  photo: { font: 30, family: 'Georgia, serif', rotate: 2.5, shadow: true, blur: 0.9, noise: 18, paper: '#e8e2d4', ink: '#2a2a2a' },
  small: { font: 15, family: 'Arial, sans-serif', blur: 0.4 },
};

function wrap(ctx: CanvasRenderingContext2D, text: string, width: number): string[] {
  const lines: string[] = [];
  for (const para of text.split('\n')) {
    let line = '';
    for (const word of para.split(' ')) {
      const next = line ? `${line} ${word}` : word;
      if (ctx.measureText(next).width > width && line) {
        lines.push(line);
        line = word;
      } else line = next;
    }
    lines.push(line, '');
  }
  return lines;
}

export function render(text: string, look: Look): HTMLCanvasElement {
  const width = look.font * 40;
  const probe = document.createElement('canvas').getContext('2d')!;
  probe.font = `${look.font}px ${look.family}`;
  const lines = wrap(probe, text, width);
  const lineHeight = look.font * 1.45;
  const pad = look.font * 2;
  const page = document.createElement('canvas');
  page.width = width + pad * 2;
  page.height = Math.ceil(lines.length * lineHeight + pad * 2);
  const ctx = page.getContext('2d')!;
  ctx.fillStyle = look.paper ?? '#fff';
  ctx.fillRect(0, 0, page.width, page.height);
  ctx.fillStyle = look.ink ?? '#000';
  ctx.font = probe.font;
  ctx.textBaseline = 'top';
  lines.forEach((l, i) => ctx.fillText(l, pad, pad + i * lineHeight));

  const out = document.createElement('canvas');
  out.width = page.width;
  out.height = page.height;
  const o = out.getContext('2d')!;
  o.fillStyle = look.paper ?? '#fff';
  o.fillRect(0, 0, out.width, out.height);
  o.filter = look.blur ? `blur(${look.blur}px)` : 'none';
  o.translate(out.width / 2, out.height / 2);
  o.rotate(((look.rotate ?? 0) * Math.PI) / 180);
  o.drawImage(page, -page.width / 2, -page.height / 2);
  o.setTransform(1, 0, 0, 1, 0, 0);
  o.filter = 'none';
  if (look.shadow) {
    // Uneven light: a dark corner, as when a phone shades the page.
    const g = o.createRadialGradient(out.width * 0.85, out.height * 0.9, 0, out.width * 0.85, out.height * 0.9, out.width * 0.9);
    g.addColorStop(0, 'rgba(0,0,0,0.55)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    o.fillStyle = g;
    o.fillRect(0, 0, out.width, out.height);
  }
  if (look.noise) {
    const img = o.getImageData(0, 0, out.width, out.height);
    let seed = 7;
    const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647) - 0.5;
    for (let i = 0; i < img.data.length; i += 4) {
      const n = rand() * look.noise * 2;
      img.data[i] += n;
      img.data[i + 1] += n;
      img.data[i + 2] += n;
    }
    o.putImageData(img, 0, 0);
  }
  return out;
}

const normalize = (s: string) =>
  s
    .replace(/['`‘’ʻʼ]/g, "'")
    .replace(/\s+/g, ' ')
    .trim();

export function cer(got: string, want: string): number {
  const a = normalize(got);
  const b = normalize(want);
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    prev = cur;
  }
  return prev[b.length] / b.length;
}

export type Strategy = (images: HTMLCanvasElement[]) => Promise<string[]>;

/** Run every strategy on every image; returns CER per strategy and image. */
export async function run(strategies: Record<string, Strategy>, log: (s: string) => void = console.log) {
  const cases = Object.entries(LOOKS).flatMap(([look, l]) =>
    (Object.keys(TEXTS) as (keyof typeof TEXTS)[]).map((script) => ({
      name: `${script}/${look}`,
      truth: TEXTS[script],
      image: render(TEXTS[script], l),
    })),
  );
  const results: Record<string, Record<string, number>> = {};
  const outputs: Record<string, Record<string, string>> = {};
  for (const [name, strategy] of Object.entries(strategies)) {
    const t0 = performance.now();
    const texts = await strategy(cases.map((c) => c.image));
    results[name] = {};
    outputs[name] = {};
    cases.forEach((c, i) => {
      results[name][c.name] = Math.round(cer(texts[i], c.truth) * 1000) / 10;
      outputs[name][c.name] = texts[i];
    });
    log(`${name}: ${((performance.now() - t0) / 1000).toFixed(1)} s`);
  }
  return { results, outputs, cases };
}

/** Recognise images with one Tesseract worker; returns text and mean confidence per image. */
export async function tesseract(langs: string, images: HTMLCanvasElement[], params: Record<string, string> = {}) {
  const { createWorker } = await import('tesseract.js');
  const worker = await createWorker(langs, 1);
  if (Object.keys(params).length) await worker.setParameters(params);
  const out: { text: string; confidence: number }[] = [];
  for (const image of images) {
    const { data } = await worker.recognize(image);
    out.push({ text: data.text, confidence: data.confidence });
  }
  await worker.terminate();
  return out;
}
