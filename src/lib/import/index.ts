/**
 * Turn any supported file into editable text, choosing the most accurate and
 * most private route available for its type.
 */
import { looksLikeBrailleAscii, asciiToUnicode, backTranslate } from '@/lib/braille';
import { looksHardWrapped, reflowText } from '@/lib/text-tools';
import { CloudOcrError, recognizeInCloud, recognizeOnDevice, type OcrLanguage, type Progress } from './ocr';

export type { OcrLanguage, Progress, ProgressStep } from './ocr';
import { extractPdfText, MAX_OCR_PAGES, renderPdfPages } from './pdf';

export type OcrMode = 'auto' | 'device';

export type ImportSource = 'pdf' | 'docx' | 'text' | 'brf' | 'ocr-cloud' | 'ocr-device';

/** Things the user should know about an import (the UI turns these into text). */
export type ImportNote =
  | { kind: 'brf-back-translated' }
  | { kind: 'cloud-fallback'; reason: CloudOcrError['code'] | 'unknown' }
  | { kind: 'page-limit'; read: number; total: number }
  | { kind: 'reflowed' };

export interface ImportResult {
  text: string;
  source: ImportSource;
  fileName: string;
  notes: ImportNote[];
  /** The text before line reflow, so it can be undone. */
  original?: string;
}

export const MAX_FILE_BYTES = 25 * 1024 * 1024;
/** Cloud OCR request limit (after base64 encoding the edge function allows ~20 MB). */
const MAX_CLOUD_BYTES = 14 * 1024 * 1024;

export const ACCEPTED_FILE_TYPES = [
  'image/*',
  'application/pdf',
  '.pdf',
  '.docx',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.txt',
  'text/plain',
  '.md',
  '.brf',
].join(',');

export type ImportErrorCode = 'too-large' | 'unsupported' | 'no-text-image' | 'no-text-file';

export class ImportError extends Error {
  constructor(readonly code: ImportErrorCode) {
    super(code);
  }
}

type Kind = 'image' | 'pdf' | 'docx' | 'text' | 'brf' | 'unknown';

function kindOf(file: File): Kind {
  const name = file.name.toLowerCase();
  if (file.type.startsWith('image/') || /\.(jpe?g|png|webp|gif|bmp)$/.test(name)) return 'image';
  if (file.type === 'application/pdf' || name.endsWith('.pdf')) return 'pdf';
  if (name.endsWith('.docx')) return 'docx';
  if (name.endsWith('.brf')) return 'brf';
  if (file.type.startsWith('text/') || /\.(txt|md|text)$/.test(name)) return 'text';
  return 'unknown';
}

/**
 * Shrink large photos before OCR. Phone photos are often 12+ megapixels;
 * ~2400px on the long side keeps text sharp and uploads much faster.
 */
async function prepareImage(file: File): Promise<Blob> {
  if (file.type === 'image/gif') return file;
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
    const scale = Math.min(1, 2400 / Math.max(bitmap.width, bitmap.height));
    if (scale === 1 && file.size < 4 * 1024 * 1024) return file;
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    return await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Could not process image'))), 'image/jpeg', 0.9),
    );
  } catch {
    return file;
  }
}

/**
 * Try cloud recognition first (when allowed), then fall back to on-device
 * recognition so an outage or missing configuration never blocks the user.
 */
async function recognize(
  cloud: (() => Promise<string>) | null,
  device: () => Promise<string>,
  signal: AbortSignal | undefined,
  notes: ImportNote[],
): Promise<{ text: string; source: ImportSource }> {
  if (cloud) {
    try {
      return { text: await cloud(), source: 'ocr-cloud' };
    } catch (error) {
      if (signal?.aborted || (error as Error).name === 'AbortError') throw error;
      notes.push({ kind: 'cloud-fallback', reason: error instanceof CloudOcrError ? error.code : 'unknown' });
    }
  }
  return { text: await device(), source: 'ocr-device' };
}

export async function importFile(
  file: File,
  options: { ocrMode: OcrMode; language?: OcrLanguage; onProgress?: Progress; signal?: AbortSignal },
): Promise<ImportResult> {
  const onProgress: Progress = options.onProgress ?? (() => {});
  const notes: ImportNote[] = [];
  const kind = kindOf(file);
  const language = options.language ?? 'eng';

  if (file.size > MAX_FILE_BYTES) {
    throw new ImportError('too-large');
  }

  let text = '';
  let source: ImportSource;

  switch (kind) {
    case 'text': {
      text = await file.text();
      source = 'text';
      break;
    }
    case 'brf': {
      const raw = await file.text();
      text = backTranslate(looksLikeBrailleAscii(raw) ? asciiToUnicode(raw) : raw, 2);
      source = 'brf';
      notes.push({ kind: 'brf-back-translated' });
      break;
    }
    case 'docx': {
      onProgress(0.3, { kind: 'reading-word' });
      const mammoth = await import('mammoth/mammoth.browser');
      const result = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
      text = result.value;
      source = 'docx';
      break;
    }
    case 'pdf': {
      onProgress(0.05, { kind: 'reading-pdf' });
      const pdf = await extractPdfText(file, (f) => onProgress(0.05 + f * 0.5, { kind: 'reading-pdf' }));
      if (pdf.hasTextLayer) {
        text = pdf.text;
        source = 'pdf';
        break;
      }
      // Scanned PDF: the cloud model reads the whole file; on-device OCR renders pages.
      const useCloud = options.ocrMode === 'auto' && file.size <= MAX_CLOUD_BYTES;
      const result = await recognize(
        useCloud
          ? () => {
              onProgress(0.3, { kind: 'cloud' });
              return recognizeInCloud(file, 'application/pdf', options.signal);
            }
          : null,
        async () => {
          onProgress(0.1, { kind: 'preparing-scans' });
          const pages = await renderPdfPages(file);
          if (pdf.pageCount > MAX_OCR_PAGES) {
            notes.push({ kind: 'page-limit', read: MAX_OCR_PAGES, total: pdf.pageCount });
          }
          return recognizeOnDevice(pages, language, onProgress, options.signal);
        },
        options.signal,
        notes,
      );
      text = result.text;
      source = result.source;
      break;
    }
    case 'image': {
      onProgress(0.05, { kind: 'preparing-image' });
      const blob = await prepareImage(file);
      const useCloud = options.ocrMode === 'auto' && blob.size <= MAX_CLOUD_BYTES;
      const result = await recognize(
        useCloud
          ? () => {
              onProgress(0.3, { kind: 'cloud' });
              return recognizeInCloud(blob, blob.type || file.type, options.signal);
            }
          : null,
        () => recognizeOnDevice([blob], language, onProgress, options.signal),
        options.signal,
        notes,
      );
      text = result.text;
      source = result.source;
      break;
    }
    default:
      throw new ImportError('unsupported');
  }

  text = text.replace(/\r\n?/g, '\n').trim();
  if (!text) {
    throw new ImportError(kind === 'image' || source === 'ocr-cloud' || source === 'ocr-device' ? 'no-text-image' : 'no-text-file');
  }

  let original: string | undefined;
  if ((kind === 'pdf' || kind === 'image') && looksHardWrapped(text)) {
    original = text;
    text = reflowText(text);
    notes.push({ kind: 'reflowed' });
  }

  onProgress(1, { kind: 'done' });
  return { text, source, fileName: file.name, notes, original };
}
