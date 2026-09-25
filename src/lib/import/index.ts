/**
 * Turn any supported file into editable text, choosing the most accurate and
 * most private route available for its type.
 */
import { looksLikeBrailleAscii, asciiToUnicode, backTranslate } from '@/lib/braille';
import { looksHardWrapped, reflowText } from '@/lib/text-tools';
import { CloudOcrError, recognizeInCloud, recognizeOnDevice, type Progress } from './ocr';
import { extractPdfText, MAX_OCR_PAGES, renderPdfPages } from './pdf';

export type OcrMode = 'auto' | 'device';

export type ImportSource = 'pdf' | 'docx' | 'text' | 'brf' | 'ocr-cloud' | 'ocr-device';

export interface ImportResult {
  text: string;
  source: ImportSource;
  fileName: string;
  /** Things the user should know about (fallbacks, page limits, reflow). */
  notes: string[];
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

export class ImportError extends Error {}

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
  notes: string[],
): Promise<{ text: string; source: ImportSource }> {
  if (cloud) {
    try {
      return { text: await cloud(), source: 'ocr-cloud' };
    } catch (error) {
      if (signal?.aborted || (error as Error).name === 'AbortError') throw error;
      const reason = error instanceof CloudOcrError ? ` (${error.message.replace(/\.$/, '')})` : '';
      notes.push(`Cloud recognition was unavailable${reason}, so the text was read on this device instead.`);
    }
  }
  return { text: await device(), source: 'ocr-device' };
}

export async function importFile(
  file: File,
  options: { ocrMode: OcrMode; onProgress?: Progress; signal?: AbortSignal },
): Promise<ImportResult> {
  const onProgress: Progress = options.onProgress ?? (() => {});
  const notes: string[] = [];
  const kind = kindOf(file);

  if (file.size > MAX_FILE_BYTES) {
    throw new ImportError('This file is larger than 25 MB. Try a smaller file or split the document.');
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
      notes.push('This BRF file was back-translated from grade 2 braille. Check the text before re-embossing it.');
      break;
    }
    case 'docx': {
      onProgress(0.3, 'Reading the Word document…');
      const mammoth = await import('mammoth/mammoth.browser');
      const result = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
      text = result.value;
      source = 'docx';
      break;
    }
    case 'pdf': {
      onProgress(0.05, 'Reading the PDF…');
      const pdf = await extractPdfText(file, (f) => onProgress(0.05 + f * 0.5, 'Reading the PDF…'));
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
              onProgress(0.3, 'Recognising scanned pages with cloud AI…');
              return recognizeInCloud(file, 'application/pdf', options.signal);
            }
          : null,
        async () => {
          onProgress(0.1, 'Preparing scanned pages…');
          const pages = await renderPdfPages(file);
          if (pdf.pageCount > MAX_OCR_PAGES) {
            notes.push(`Only the first ${MAX_OCR_PAGES} of ${pdf.pageCount} scanned pages were read.`);
          }
          return recognizeOnDevice(pages, onProgress, options.signal);
        },
        options.signal,
        notes,
      );
      text = result.text;
      source = result.source;
      break;
    }
    case 'image': {
      onProgress(0.05, 'Preparing the image…');
      const blob = await prepareImage(file);
      const useCloud = options.ocrMode === 'auto' && blob.size <= MAX_CLOUD_BYTES;
      const result = await recognize(
        useCloud
          ? () => {
              onProgress(0.3, 'Recognising text with cloud AI…');
              return recognizeInCloud(blob, blob.type || file.type, options.signal);
            }
          : null,
        () => recognizeOnDevice([blob], onProgress, options.signal),
        options.signal,
        notes,
      );
      text = result.text;
      source = result.source;
      break;
    }
    default:
      throw new ImportError('This file type is not supported. Use a photo, PDF, Word (.docx), text or BRF file.');
  }

  text = text.replace(/\r\n?/g, '\n').trim();
  if (!text) {
    throw new ImportError(
      kind === 'image' || source === 'ocr-cloud' || source === 'ocr-device'
        ? 'No text was found. Try a sharper photo with good lighting, taken straight on.'
        : 'This file does not contain any text.',
    );
  }

  let original: string | undefined;
  if ((kind === 'pdf' || kind === 'image') && looksHardWrapped(text)) {
    original = text;
    text = reflowText(text);
    notes.push('Line breaks from the printed page layout were joined into paragraphs.');
  }

  onProgress(1, 'Done');
  return { text, source, fileName: file.name, notes, original };
}
