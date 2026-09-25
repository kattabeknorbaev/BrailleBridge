/**
 * File formats for embossers, braille displays and braille software.
 */
import { BLANK_CELL, cellToAscii } from './cells';
import type { Page } from './layout';

/**
 * BRF (Braille Ready Format): North American Braille ASCII, CR LF line
 * endings and a form feed after every page. Readable by virtually every
 * embosser, notetaker and braille translation program.
 */
export function toBRF(pages: Page[]): string {
  return pages
    .map((page) => page.map((line) => [...line].map(cellToAscii).join('').trimEnd() + '\r\n').join('') + '\f')
    .join('');
}

export interface PefMetadata {
  title: string;
  /** BCP 47 language tag of the source text. */
  language?: string;
  cellsPerLine: number;
  linesPerPage: number;
}

const escapeXml = (s: string) =>
  s.replace(/[<>&"']/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' })[c]!);

function identifier(): string {
  const uuid = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return `urn:uuid:${uuid}`;
}

/**
 * PEF (Portable Embosser Format, DAISY Consortium): an open XML format that
 * describes every page and row exactly as it will be embossed.
 * Rows may only contain braille pattern characters, so spaces become U+2800.
 */
export function toPEF(pages: Page[], meta: PefMetadata): string {
  const rows = (page: Page) =>
    page
      .map((line) => line.trimEnd().replace(/ /g, BLANK_CELL))
      .map((line) => (line ? `          <row>${line}</row>` : '          <row/>'))
      .join('\n');

  const body = pages.map((page) => `        <page>\n${rows(page)}\n        </page>`).join('\n');
  const date = new Date().toISOString().slice(0, 10);

  return `<?xml version="1.0" encoding="UTF-8"?>
<pef version="2008-1" xmlns="http://www.daisy.org/ns/2008/pef">
  <head>
    <meta xmlns:dc="http://purl.org/dc/elements/1.1/">
      <dc:format>application/x-pef+xml</dc:format>
      <dc:identifier>${identifier()}</dc:identifier>
      <dc:title>${escapeXml(meta.title)}</dc:title>
      <dc:language>${escapeXml(meta.language ?? 'en')}</dc:language>
      <dc:date>${date}</dc:date>
      <dc:publisher>BrailleBridge</dc:publisher>
    </meta>
  </head>
  <body>
    <volume cols="${meta.cellsPerLine}" rows="${meta.linesPerPage}" rowgap="0" duplex="false">
      <section>
${body}
      </section>
    </volume>
  </body>
</pef>
`;
}

/** Unicode braille text, one page after another, pages separated by a blank line. */
export function toUnicodeText(pages: Page[]): string {
  return pages.map((page) => page.map((line) => line.trimEnd()).join('\n')).join('\n\n') + '\n';
}
