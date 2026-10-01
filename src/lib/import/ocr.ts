/**
 * Text recognition (OCR) for photos and scanned documents.
 *
 * - Cloud: a Supabase Edge Function sends the image to a vision model. Most
 *   accurate, handles photos taken at an angle, multi-column pages and PDFs.
 * - On-device: Tesseract.js runs entirely in the browser (WebAssembly). The
 *   file never leaves the device; the recognition engine and language models
 *   (3–5 MB each) are downloaded once and cached by the browser.
 */
import type { Worker } from 'tesseract.js';
import { getSupabase } from '@/integrations/supabase/client';

/** What the importer is doing, for progress messages (the UI turns these into text). */
export type ProgressStep =
  | { kind: 'opening' }
  | { kind: 'reading-pdf' }
  | { kind: 'reading-word' }
  | { kind: 'preparing-image' }
  | { kind: 'preparing-scans' }
  | { kind: 'cloud' }
  | { kind: 'loading-ocr' }
  | { kind: 'downloading-model' }
  | { kind: 'reading-page'; page: number; total: number }
  | { kind: 'done' };

export type Progress = (fraction: number, step: ProgressStep) => void;

export type OcrLanguage = 'eng' | 'uzb';

/**
 * Tesseract models for each language. Uzbek is printed in Latin or Cyrillic;
 * loading both models together mixes the scripts up, so each page is read
 * with one model, and with the other too if the first is unsure.
 */
const TESSERACT_MODELS: Record<OcrLanguage, string[]> = { eng: ['eng'], uzb: ['uzb', 'uzb_cyrl'] };

/** Mean word confidence (0–100) above which a page is not read again with another model. */
const CONFIDENT = 75;

/**
 * Adaptive (Sauvola) thresholding instead of one global threshold, so a
 * shadow across a photographed page does not turn the shaded text black. On
 * shaded test photos it cut the character error rate from 36% (Latin) and
 * 70% (Cyrillic) to about 2%, without hurting clean scans.
 */
const TESSERACT_PARAMS = { thresholding_method: '2' };

/** Remove markdown fences or chatter a vision model sometimes adds. */
function cleanModelOutput(text: string): string {
  return text
    .replace(/^\s*```[a-z]*\s*\n?/i, '')
    .replace(/\n?```\s*$/, '')
    .trim();
}

async function toBase64(blob: Blob): Promise<string> {
  const buffer = new Uint8Array(await blob.arrayBuffer());
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < buffer.length; i += chunk) {
    binary += String.fromCharCode(...buffer.subarray(i, i + chunk));
  }
  return btoa(binary);
}

export class CloudOcrError extends Error {
  constructor(
    readonly code: 'not-configured' | 'no-text' | 'failed',
    detail?: string,
  ) {
    super(detail ?? code);
  }
}

export async function recognizeInCloud(blob: Blob, mimeType: string, signal?: AbortSignal): Promise<string> {
  const supabase = await getSupabase();
  if (!supabase) throw new CloudOcrError('not-configured');
  const image = await toBase64(blob);
  if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
  const { data, error } = await supabase.functions.invoke('ocr', { body: { image, mimeType } });
  if (error) throw new CloudOcrError('failed', error.message);
  const text = cleanModelOutput(String(data?.text ?? ''));
  if (!text) throw new CloudOcrError('no-text');
  return text;
}

/** Recognise one or more images on this device with Tesseract.js. */
export async function recognizeOnDevice(
  images: (Blob | HTMLCanvasElement)[],
  language: OcrLanguage,
  onProgress?: Progress,
  signal?: AbortSignal,
): Promise<string> {
  onProgress?.(0, { kind: 'loading-ocr' });
  const { createWorker } = await import('tesseract.js');
  let page = 0;
  const workers = new Map<string, Promise<Worker>>();
  const workerFor = (model: string) => {
    let worker = workers.get(model);
    if (!worker) {
      worker = createWorker(model, 1, {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            onProgress?.((page + m.progress) / images.length, { kind: 'reading-page', page: page + 1, total: images.length });
          } else if (m.status.startsWith('loading')) {
            onProgress?.(0, { kind: 'downloading-model' });
          }
        },
      }).then(async (w) => {
        await w.setParameters(TESSERACT_PARAMS);
        return w;
      });
      workers.set(model, worker);
    }
    return worker;
  };

  // The model that read the last page best goes first for the next one.
  const models = [...TESSERACT_MODELS[language]];
  try {
    const pages: string[] = [];
    for (; page < images.length; page++) {
      let best = { text: '', confidence: -1, model: models[0] };
      for (const model of models) {
        if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
        const { data } = await (await workerFor(model)).recognize(images[page]);
        if (data.confidence > best.confidence) best = { text: data.text, confidence: data.confidence, model };
        if (data.confidence >= CONFIDENT) break;
      }
      models.sort((a, b) => Number(b === best.model) - Number(a === best.model));
      pages.push(best.text.trim());
    }
    return pages.join('\n\n');
  } finally {
    await Promise.allSettled([...workers.values()].map(async (w) => (await w).terminate()));
  }
}
