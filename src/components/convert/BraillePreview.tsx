import { useState, type CSSProperties } from 'react';
import type { Page, PageLayout, TranslationResult } from '@/lib/braille';
import { BrailleCell } from '@/components/braille/BrailleCell';
import { Button } from '@/components/ui/button';

export type PreviewView = 'braille' | 'dots' | 'interline' | 'pages';

interface BraillePreviewProps {
  result: TranslationResult;
  pages: Page[];
  layout: PageLayout;
  view: PreviewView;
  fontSize: number;
}

const DOT_CELL_LIMIT = 1500;
const INTERLINE_LINE_LIMIT = 200;
const PAGE_LIMIT = 12;

function ShowMore({ shown, total, unit, onClick }: { shown: number; total: number; unit: string; onClick: () => void }) {
  if (shown >= total) return null;
  return (
    <div className="mt-4 flex items-center justify-center gap-3 text-[0.85rem] text-muted-foreground">
      Showing {shown.toLocaleString()} of {total.toLocaleString()} {unit}.
      <Button variant="outline" size="sm" onClick={onClick}>
        Show all
      </Button>
    </div>
  );
}

function DotsView({ result, fontSize }: { result: TranslationResult; fontSize: number }) {
  const [expanded, setExpanded] = useState(false);
  const cellSize = Math.round(fontSize * 0.95);
  let budget = expanded ? Infinity : DOT_CELL_LIMIT;
  const total = [...result.braille].filter((c) => c !== ' ' && c !== '\n').length;

  return (
    <div>
      {result.lines.map((segments, li) => {
        if (budget <= 0) return null;
        const words = segments.filter((s) => s.braille.trim());
        if (words.length === 0) return <div key={li} className="h-4" />;
        return (
          <div key={li} className="mb-3 flex flex-wrap gap-x-4 gap-y-2">
            {words.map((word, wi) => {
              if (budget <= 0) return null;
              const cells = [...word.braille].slice(0, budget);
              budget -= cells.length;
              return (
                <span key={wi} className="inline-flex gap-[3px]" title={word.print}>
                  {cells.map((cell, ci) => (
                    <BrailleCell key={ci} cell={cell} size={cellSize} />
                  ))}
                </span>
              );
            })}
          </div>
        );
      })}
      <ShowMore shown={Math.min(total, DOT_CELL_LIMIT)} total={expanded ? 0 : total} unit="cells" onClick={() => setExpanded(true)} />
    </div>
  );
}

function InterlineView({ result, fontSize }: { result: TranslationResult; fontSize: number }) {
  const [expanded, setExpanded] = useState(false);
  const lines = expanded ? result.lines : result.lines.slice(0, INTERLINE_LINE_LIMIT);
  return (
    <div>
      {lines.map((segments, li) => {
        const words = segments.filter((s) => s.print.trim());
        if (words.length === 0) return <div key={li} className="h-5" />;
        return (
          <div key={li} className="mb-4 flex flex-wrap gap-x-5 gap-y-3">
            {words.map((word, wi) => (
              <span key={wi} className="inline-flex flex-col">
                <span className="text-[0.8rem] leading-tight text-muted-foreground">{word.print}</span>
                <span className="braille-text leading-tight" style={{ fontSize }} aria-hidden="true">
                  {word.braille}
                </span>
              </span>
            ))}
          </div>
        );
      })}
      <ShowMore
        shown={INTERLINE_LINE_LIMIT}
        total={expanded ? 0 : result.lines.length}
        unit="lines"
        onClick={() => setExpanded(true)}
      />
    </div>
  );
}

function PagesView({ pages, layout, fontSize }: { pages: Page[]; layout: PageLayout; fontSize: number }) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? pages : pages.slice(0, PAGE_LIMIT);
  const pageStyle: CSSProperties = { fontSize: Math.max(12, Math.round(fontSize * 0.6)) };
  return (
    <div>
      <ol className="grid gap-5 [grid-template-columns:repeat(auto-fill,minmax(min(100%,22rem),1fr))]">
        {visible.map((page, i) => (
          <li key={i} className="rounded-lg border bg-card shadow-sm">
            <p className="rounded-t-lg border-b bg-muted/50 px-3 py-1.5 text-[0.75rem] font-semibold text-muted-foreground">
              Page {i + 1} of {pages.length}
            </p>
            <div className="p-3">
              <pre className="braille-text m-0 whitespace-pre" style={pageStyle} aria-label={`Braille page ${i + 1}`}>
                {page.map((line) => line.padEnd(layout.cellsPerLine, '⠀')).join('\n')}
              </pre>
            </div>
          </li>
        ))}
      </ol>
      <ShowMore shown={PAGE_LIMIT} total={expanded ? 0 : pages.length} unit="pages" onClick={() => setExpanded(true)} />
    </div>
  );
}

export function BraillePreview({ result, pages, layout, view, fontSize }: BraillePreviewProps) {
  if (view === 'dots') return <DotsView result={result} fontSize={fontSize} />;
  if (view === 'interline') return <InterlineView result={result} fontSize={fontSize} />;
  if (view === 'pages') return <PagesView pages={pages} layout={layout} fontSize={fontSize} />;
  return (
    <p className="braille-text m-0 whitespace-pre-wrap" style={{ fontSize }}>
      {result.braille}
    </p>
  );
}
