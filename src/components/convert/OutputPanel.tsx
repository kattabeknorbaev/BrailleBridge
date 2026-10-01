import { useId, useMemo } from 'react';
import { AlertTriangle, Copy, Download, FileText, Info, Languages, Minus, Plus, Printer } from 'lucide-react';
import {
  BRAILLE_CODES,
  CODE_LANGUAGE,
  countCells,
  isContracted,
  translateWith,
  type BrailleCode,
  type Page,
  type PageLayout,
  type TranslationResult,
  type UzbekOptions,
} from '@/lib/braille';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { SegmentedControl } from '@/components/SegmentedControl';
import { BrailleCell } from '@/components/braille/BrailleCell';
import { useMessages } from '@/i18n';
import { BraillePreview, type PreviewView } from './BraillePreview';

export type ExportFormat = 'brf' | 'pef' | 'txt' | 'print' | 'copy';

interface OutputPanelProps {
  result: TranslationResult;
  /** Cells the same text needs uncontracted, to show what contractions save. */
  uncontractedCells: number;
  pages: Page[];
  code: BrailleCode;
  onCodeChange: (code: BrailleCode) => void;
  /** A better code for the text, when it seems to be in another language. */
  suggestedCode?: BrailleCode | null;
  onDismissSuggestion?: () => void;
  uzbek: UzbekOptions;
  onUzbekChange: (options: UzbekOptions) => void;
  view: PreviewView;
  onViewChange: (view: PreviewView) => void;
  fontSize: number;
  onFontSizeChange: (size: number) => void;
  layout: PageLayout;
  onLayoutChange: (layout: PageLayout) => void;
  onExport: (format: ExportFormat) => void;
  empty: boolean;
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-[0.75rem] text-muted-foreground">{label}</dt>
      <dd className="truncate text-[1.05rem] font-bold tabular-nums">{value}</dd>
    </div>
  );
}

function NumberField({
  id,
  label,
  value,
  min,
  max,
  onChange,
}: {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (n: number) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-[0.8rem]">
        {label}
      </Label>
      <input
        id={id}
        type="number"
        inputMode="numeric"
        min={min}
        max={max}
        value={value}
        onChange={(e) => {
          const n = Number(e.target.value);
          if (Number.isFinite(n)) onChange(Math.min(max, Math.max(min, Math.round(n))));
        }}
        className="h-10 w-24 rounded-lg border border-input bg-background px-3 text-[0.95rem] tabular-nums"
      />
    </div>
  );
}

function EmptyState({ code }: { code: BrailleCode }) {
  const t = useMessages().convert.output;
  const word = code === 'uz' ? t.emptyWord : 'hello';
  const cells = [...translateWith(code, word).braille];
  return (
    <div className="flex h-full min-h-[14rem] flex-col items-center justify-center gap-4 text-center">
      <div className="flex gap-2" aria-hidden="true">
        {cells.map((c, i) => (
          <BrailleCell key={i} cell={c} size={34} className="animate-dot-pop" />
        ))}
      </div>
      <p className="max-w-xs text-muted-foreground">
        {t.emptyA} <span className="font-semibold text-foreground">&ldquo;{word}&rdquo;</span> {t.emptyB}
      </p>
    </div>
  );
}

export function OutputPanel(props: OutputPanelProps) {
  const { result, pages, code, layout, empty, uzbek } = props;
  const suggested = props.suggestedCode;
  const m = useMessages();
  const t = m.convert.output;
  const headingId = useId();
  const idPrefix = useId();

  const cells = useMemo(() => countCells(result.braille), [result.braille]);
  const savings = isContracted(code) && props.uncontractedCells > 0 ? Math.round((1 - cells / props.uncontractedCells) * 100) : 0;
  const savingsStat = isContracted(code)
    ? { label: t.stats.saved, value: `${Math.max(0, savings)}%` }
    : { label: t.stats.contractions, value: code === 'uz' ? t.stats.uncontracted : t.stats.off };

  const setLayout = (patch: Partial<PageLayout>) => props.onLayoutChange({ ...layout, ...patch });

  const VIEWS: { value: PreviewView; label: string }[] = [
    { value: 'braille', label: t.views.braille },
    { value: 'dots', label: t.views.dots },
    { value: 'interline', label: t.views.interline },
    { value: 'pages', label: t.views.pages },
  ];

  return (
    <section aria-labelledby={headingId} className="flex flex-col rounded-xl border bg-card shadow-sm">
      <div className="flex flex-wrap items-center gap-3 border-b px-4 py-3">
        <h2 id={headingId} className="mr-auto text-[1rem] font-bold">
          <span className="mr-2 inline-flex size-6 items-center justify-center rounded-full bg-primary text-[0.75rem] text-primary-foreground">
            2
          </span>
          {t.heading}
        </h2>
        <label htmlFor={`${idPrefix}-code`} className="sr-only">
          {t.codeLabel}
        </label>
        <select
          id={`${idPrefix}-code`}
          value={code}
          onChange={(e) => props.onCodeChange(e.target.value as BrailleCode)}
          className="h-10 rounded-lg border border-input bg-background pl-3 pr-8 text-[0.9rem] font-semibold"
        >
          {BRAILLE_CODES.map((c) => (
            <option key={c} value={c}>
              {m.codes[c]}
            </option>
          ))}
        </select>
      </div>

      {/* Always rendered, so screen readers announce the suggestion when it appears. */}
      <div role="status">
        {suggested && (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b bg-primary/10 px-4 py-3 text-[0.9rem]">
            <Languages className="size-4 shrink-0 text-primary" aria-hidden="true" />
            <span className="font-semibold">{t.looksLike[CODE_LANGUAGE[suggested]]}</span>
            <Button size="sm" variant="outline" className="h-8" onClick={() => props.onCodeChange(suggested)}>
              {t.switchTo[CODE_LANGUAGE[suggested]]}
            </Button>
            <Button size="sm" variant="ghost" className="h-8" onClick={props.onDismissSuggestion}>
              {t.keepCode}
            </Button>
          </div>
        )}
      </div>

      {code === 'uz' && (
        <div className="space-y-3 border-b px-4 py-3">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <span id={`${idPrefix}-latin`} className="text-[0.85rem] font-semibold">
              {t.latinLabel}
            </span>
            <SegmentedControl
              label={t.latinLabel}
              size="sm"
              value={uzbek.latin}
              onChange={(latin) => props.onUzbekChange({ ...uzbek, latin })}
              options={[
                { value: 'letters', label: t.latinLetters },
                { value: 'cyrillic', label: t.latinCyrillic },
              ]}
            />
            <div className="flex items-center gap-2">
              <Switch
                id={`${idPrefix}-caps`}
                checked={uzbek.capitals}
                onCheckedChange={(capitals) => props.onUzbekChange({ ...uzbek, capitals })}
              />
              <Label htmlFor={`${idPrefix}-caps`} className="text-[0.85rem]">
                {t.capitals}
              </Label>
            </div>
          </div>
          <p className="text-[0.8rem] text-muted-foreground">{t.latinHelp}</p>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2 px-4 pt-3">
        <SegmentedControl label={t.previewLabel} value={props.view} onChange={props.onViewChange} options={VIEWS} size="sm" />
        <div className="ml-auto flex items-center gap-1" role="group" aria-label={t.previewSize}>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => props.onFontSizeChange(Math.max(16, props.fontSize - 4))}
            aria-label={t.smaller}
          >
            <Minus />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => props.onFontSizeChange(Math.min(64, props.fontSize + 4))}
            aria-label={t.larger}
          >
            <Plus />
          </Button>
        </div>
      </div>

      <div
        className="surface-braille m-4 mt-3 max-h-[32rem] min-h-[16rem] overflow-auto rounded-lg border p-4"
        role="region"
        aria-label={t.previewRegion}
        tabIndex={0}
      >
        {empty ? (
          <EmptyState code={code} />
        ) : (
          <BraillePreview result={result} pages={pages} layout={layout} view={props.view} fontSize={props.fontSize} />
        )}
      </div>

      {result.unsupported.length > 0 && (
        <div className="mx-4 mb-3 flex gap-2 rounded-lg border border-warning/40 bg-warning/10 p-3 text-[0.85rem]" role="alert">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden="true" />
          <p>
            {t.unsupported(result.unsupported.length)}{' '}
            <span className="font-semibold">{result.unsupported.slice(0, 12).join(' ')}</span>
          </p>
        </div>
      )}

      <dl className="mx-4 grid grid-cols-3 gap-3 border-y py-3">
        <Stat label={t.stats.cells} value={cells.toLocaleString()} />
        <Stat label={t.stats.pages(layout.cellsPerLine, layout.linesPerPage)} value={empty ? '0' : pages.length.toLocaleString()} />
        <Stat label={savingsStat.label} value={savingsStat.value} />
      </dl>

      <div className="space-y-4 p-4">
        <h3 className="text-[0.95rem] font-bold">
          <span className="mr-2 inline-flex size-6 items-center justify-center rounded-full bg-primary text-[0.75rem] text-primary-foreground">
            3
          </span>
          {t.exportHeading}
        </h3>

        <fieldset className="flex flex-wrap items-end gap-x-5 gap-y-3">
          <legend className="sr-only">{t.layoutLegend}</legend>
          <NumberField
            id={`${idPrefix}-cells`}
            label={t.cellsPerLine}
            value={layout.cellsPerLine}
            min={10}
            max={100}
            onChange={(n) => setLayout({ cellsPerLine: n })}
          />
          <NumberField
            id={`${idPrefix}-lines`}
            label={t.linesPerPage}
            value={layout.linesPerPage}
            min={4}
            max={100}
            onChange={(n) => setLayout({ linesPerPage: n })}
          />
          <div className="flex items-center gap-2 pb-2">
            <Switch
              id={`${idPrefix}-indent`}
              checked={layout.indentParagraphs}
              onCheckedChange={(v) => setLayout({ indentParagraphs: v })}
            />
            <Label htmlFor={`${idPrefix}-indent`} className="text-[0.85rem]">
              {t.indent}
            </Label>
          </div>
          <div className="flex items-center gap-2 pb-2">
            <Switch
              id={`${idPrefix}-numbers`}
              checked={layout.pageNumbers}
              onCheckedChange={(v) => setLayout({ pageNumbers: v })}
            />
            <Label htmlFor={`${idPrefix}-numbers`} className="text-[0.85rem]">
              {t.pageNumbers}
            </Label>
          </div>
        </fieldset>

        <div className="grid gap-2 sm:grid-cols-2">
          <Button onClick={() => props.onExport('brf')} disabled={empty} className="h-auto justify-start py-3 text-left">
            <Download aria-hidden="true" />
            <span>
              <span className="block">{t.brf}</span>
              <span className="block text-[0.75rem] font-normal opacity-85">{t.brfSub}</span>
            </span>
          </Button>
          <Button variant="outline" onClick={() => props.onExport('pef')} disabled={empty} className="h-auto justify-start py-3 text-left">
            <Download aria-hidden="true" />
            <span>
              <span className="block">{t.pef}</span>
              <span className="block text-[0.75rem] font-normal text-muted-foreground">{t.pefSub}</span>
            </span>
          </Button>
          <Button variant="outline" onClick={() => props.onExport('print')} disabled={empty} className="h-auto justify-start py-3 text-left">
            <Printer aria-hidden="true" />
            <span>
              <span className="block">{t.print}</span>
              <span className="block text-[0.75rem] font-normal text-muted-foreground">{t.printSub}</span>
            </span>
          </Button>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" onClick={() => props.onExport('txt')} disabled={empty} className="h-auto py-3">
              <FileText aria-hidden="true" />
              {t.txt}
            </Button>
            <Button variant="outline" onClick={() => props.onExport('copy')} disabled={empty} className="h-auto py-3">
              <Copy aria-hidden="true" />
              {t.copy}
            </Button>
          </div>
        </div>

        {code === 'uz' && (
          <p className="flex gap-2 text-[0.8rem] text-muted-foreground">
            <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            {t.uzEmbosserHint}
          </p>
        )}
      </div>
    </section>
  );
}
