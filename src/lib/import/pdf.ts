/**
 * PDF import with pdf.js. Digital PDFs keep their text, so it is read
 * directly — exact and instant, and the file never leaves the device.
 * Scanned PDFs (pictures of pages) have no text layer and need OCR.
 */
import type { PDFDocumentLoadingTask, TextItem } from 'pdfjs-dist/types/src/display/api';

export const MAX_OCR_PAGES = 30;

async function openPdf(file: Blob): Promise<PDFDocumentLoadingTask> {
  const pdfjs = await import('pdfjs-dist');
  const { default: workerUrl } = await import('pdfjs-dist/build/pdf.worker.min.mjs?url');
  pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
  return pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) });
}

export interface PdfText {
  text: string;
  pageCount: number;
  /** False for scanned PDFs: almost no text on most pages. */
  hasTextLayer: boolean;
}

export async function extractPdfText(file: Blob, onProgress?: (fraction: number) => void): Promise<PdfText> {
  const task = await openPdf(file);
  try {
    const doc = await task.promise;
    const pages: string[] = [];
    for (let n = 1; n <= doc.numPages; n++) {
      const page = await doc.getPage(n);
      const content = await page.getTextContent();
      const text = (content.items as TextItem[])
        .filter((item) => 'str' in item)
        .map((item) => item.str + (item.hasEOL ? '\n' : ''))
        .join('')
        .replace(/[ \t]+\n/g, '\n')
        .trim();
      pages.push(text);
      onProgress?.(n / doc.numPages);
    }
    const pagesWithText = pages.filter((p) => p.replace(/\s/g, '').length > 20).length;
    return {
      text: pages.filter(Boolean).join('\n\n'),
      pageCount: doc.numPages,
      hasTextLayer: pagesWithText >= Math.max(1, doc.numPages * 0.5),
    };
  } finally {
    await task.destroy();
  }
}

/** Render pages to canvases (for on-device OCR of scanned PDFs). */
export async function renderPdfPages(file: Blob, maxPages = MAX_OCR_PAGES): Promise<HTMLCanvasElement[]> {
  const task = await openPdf(file);
  try {
    const doc = await task.promise;
    const canvases: HTMLCanvasElement[] = [];
    for (let n = 1; n <= Math.min(doc.numPages, maxPages); n++) {
      const page = await doc.getPage(n);
      const viewport = page.getViewport({ scale: 2 });
      const canvas = document.createElement('canvas');
      canvas.width = Math.ceil(viewport.width);
      canvas.height = Math.ceil(viewport.height);
      await page.render({ canvas, viewport }).promise;
      canvases.push(canvas);
    }
    return canvases;
  } finally {
    await task.destroy();
  }
}
