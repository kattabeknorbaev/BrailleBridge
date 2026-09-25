/**
 * Text recognition (OCR) for photos and scanned documents.
 *
 * - Cloud: a Supabase Edge Function sends the image to a vision model. Most
 *   accurate, handles photos taken at an angle, multi-column pages and PDFs.
 * - On-device: Tesseract.js runs entirely in the browser (WebAssembly). The
 *   file never leaves the device; the recognition engine and English model
 *   (~5 MB) are downloaded once and cached by the browser.
 */
import { getSupabase } from '@/integrations/supabase/client';

export type Progress = (fraction: number, label: string) => void;

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

export class CloudOcrError extends Error {}

export async function recognizeInCloud(blob: Blob, mimeType: string, signal?: AbortSignal): Promise<string> {
  const supabase = await getSupabase();
  if (!supabase) throw new CloudOcrError('Cloud text recognition is not configured.');
  const image = await toBase64(blob);
  if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
  const { data, error } = await supabase.functions.invoke('ocr', { body: { image, mimeType } });
  if (error) throw new CloudOcrError(error.message || 'Cloud text recognition failed.');
  const text = cleanModelOutput(String(data?.text ?? ''));
  if (!text) throw new CloudOcrError('No text was found in the image.');
  return text;
}

/** Recognise one or more images on this device with Tesseract.js. */
export async function recognizeOnDevice(
  images: (Blob | HTMLCanvasElement)[],
  onProgress?: Progress,
  signal?: AbortSignal,
): Promise<string> {
  onProgress?.(0, 'Loading on-device text recognition…');
  const { createWorker } = await import('tesseract.js');
  let page = 0;
  const worker = await createWorker('eng', 1, {
    logger: (m) => {
      if (m.status === 'recognizing text') {
        onProgress?.((page + m.progress) / images.length, `Reading page ${page + 1} of ${images.length}…`);
      } else if (m.status.startsWith('loading')) {
        onProgress?.(0, 'Downloading the English recognition model (first time only)…');
      }
    },
  });
  try {
    const pages: string[] = [];
    for (; page < images.length; page++) {
      if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
      const { data } = await worker.recognize(images[page]);
      pages.push(data.text.trim());
    }
    return pages.join('\n\n');
  } finally {
    await worker.terminate();
  }
}
