import { useId, useMemo } from 'react';
import { AlertTriangle, Copy, Download, FileText, Minus, Plus, Printer } from 'lucide-react';
import { countCells, type Grade, type Page, type PageLayout, type TranslationResult } from '@/lib/braille';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { SegmentedControl } from '@/components/SegmentedControl';
import { BrailleCell } from '@/components/braille/BrailleCell';
import { BraillePreview, type PreviewView } from './BraillePreview';

export type ExportFormat = 'brf' | 'pef' | 'txt' | 'print' | 'copy';

interface OutputPanelProps {
  result: TranslationResult;
  grade1Cells: number;
  pages: Page[];
  grade: Grade;
  onGradeChange: (grade: Grade) => void;
  view: PreviewView;
  onViewChange: (view: PreviewView) => void;
  fontSize: number;
  onFontSizeChange: (size: number) => void;
  layout: PageLayout;
  onLayoutChange: (layout: PageLayout) => void;
  onExport: (format: ExportFormat) => void;
  empty: boolean;
}

const VIEWS: { value: PreviewView; label: string }[] = [
  { value: 'braille', label: 'Braille' },
  { value: 'dots', label: 'Dots' },
  { value: 'interline', label: 'With print' },
  { value: 'pages', label: 'Pages' },
];

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

function EmptyState() {
  const hello = '⠓⠑⠇⠇⠕';
  return (
    <div className="flex h-full min-h-[14rem] flex-col items-center justify-center gap-4 text-center">
      <div className="flex gap-2" aria-hidden="true">
        {[...hello].map((c, i) => (
          <BrailleCell key={i} cell={c} size={34} className="animate-dot-pop" />
        ))}
      </div>
      <p className="max-w-xs text-muted-foreground">
        Braille appears here as you type. That&rsquo;s <span className="font-semibold text-foreground">&ldquo;hello&rdquo;</span> above.
      </p>
    </div>
  );
}

export function OutputPanel(props: OutputPanelProps) {
  const { result, pages, grade, layout, empty } = props;
  const headingId = useId();
  const idPrefix = useId();

  const cells = useMemo(() => countCells(result.braille), [result.braille]);
  const savings = grade === 2 && props.grade1Cells > 0 ? Math.round((1 - cells / props.grade1Cells) * 100) : 0;

  const setLayout = (patch: Partial<PageLayout>) => props.onLayoutChange({ ...layout, ...patch });

  return (
    <section aria-labelledby={headingId} className="flex flex-col rounded-xl border bg-card shadow-sm">
      <div className="flex flex-wrap items-center gap-3 border-b px-4 py-3">
        <h2 id={headingId} className="mr-auto text-[1rem] font-bold">
          <span className="mr-2 inline-flex size-6 items-center justify-center rounded-full bg-primary text-[0.75rem] text-primary-foreground">
            2
          </span>
          Braille
        </h2>
        <SegmentedControl
          label="Braille grade"
          value={String(grade) as '1' | '2'}
          onChange={(v) => props.onGradeChange(Number(v) as Grade)}
          options={[
            { value: '1', label: 'Grade 1' },
            { value: '2', label: 'Grade 2' },
          ]}
        />
      </div>

      <div className="flex flex-wrap items-center gap-2 px-4 pt-3">
        <SegmentedControl label="Preview" value={props.view} onChange={props.onViewChange} options={VIEWS} size="sm" />
        <div className="ml-auto flex items-center gap-1" role="group" aria-label="Preview size">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => props.onFontSizeChange(Math.max(16, props.fontSize - 4))}
            aria-label="Smaller braille"
          >
            <Minus />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => props.onFontSizeChange(Math.min(64, props.fontSize + 4))}
            aria-label="Larger braille"
          >
            <Plus />
          </Button>
        </div>
      </div>

      <div
        className="surface-braille m-4 mt-3 max-h-[32rem] min-h-[16rem] overflow-auto rounded-lg border p-4"
        role="region"
        aria-label="Braille preview"
        tabIndex={0}
      >
        {empty ? (
          <EmptyState />
        ) : (
          <BraillePreview result={result} pages={pages} layout={layout} view={props.view} fontSize={props.fontSize} />
        )}
      </div>

      {result.unsupported.length > 0 && (
        <div className="mx-4 mb-3 flex gap-2 rounded-lg border border-warning/40 bg-warning/10 p-3 text-[0.85rem]" role="alert">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden="true" />
          <p>
            {result.unsupported.length === 1 ? 'One character has' : `${result.unsupported.length} characters have`} no
            braille equivalent here and {result.unsupported.length === 1 ? 'was' : 'were'} left out:{' '}
            <span className="font-semibold">{result.unsupported.slice(0, 12).join(' ')}</span>
          </p>
        </div>
      )}

      <dl className="mx-4 grid grid-cols-3 gap-3 border-y py-3">
        <Stat label="Braille cells" value={cells.toLocaleString()} />
        <Stat label={`Pages (${layout.cellsPerLine}×${layout.linesPerPage})`} value={empty ? '0' : pages.length.toLocaleString()} />
        <Stat label={grade === 2 ? 'Saved by contractions' : 'Contractions'} value={grade === 2 ? `${Math.max(0, savings)}%` : 'Off'} />
      </dl>

      <div className="space-y-4 p-4">
        <h3 className="text-[0.95rem] font-bold">
          <span className="mr-2 inline-flex size-6 items-center justify-center rounded-full bg-primary text-[0.75rem] text-primary-foreground">
            3
          </span>
          Export
        </h3>

        <fieldset className="flex flex-wrap items-end gap-x-5 gap-y-3">
          <legend className="sr-only">Page layout</legend>
          <NumberField
            id={`${idPrefix}-cells`}
            label="Cells per line"
            value={layout.cellsPerLine}
            min={10}
            max={100}
            onChange={(n) => setLayout({ cellsPerLine: n })}
          />
          <NumberField
            id={`${idPrefix}-lines`}
            label="Lines per page"
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
              Indent paragraphs
            </Label>
          </div>
          <div className="flex items-center gap-2 pb-2">
            <Switch
              id={`${idPrefix}-numbers`}
              checked={layout.pageNumbers}
              onCheckedChange={(v) => setLayout({ pageNumbers: v })}
            />
            <Label htmlFor={`${idPrefix}-numbers`} className="text-[0.85rem]">
              Page numbers
            </Label>
          </div>
        </fieldset>

        <div className="grid gap-2 sm:grid-cols-2">
          <Button onClick={() => props.onExport('brf')} disabled={empty} className="h-auto justify-start py-3 text-left">
            <Download aria-hidden="true" />
            <span>
              <span className="block">Download BRF</span>
              <span className="block text-[0.75rem] font-normal opacity-85">Embossers, notetakers, displays</span>
            </span>
          </Button>
          <Button
            variant="outline"
            onClick={() => props.onExport('pef')}
            disabled={empty}
            className="h-auto justify-start py-3 text-left"
          >
            <Download aria-hidden="true" />
            <span>
              <span className="block">Download PEF</span>
              <span className="block text-[0.75rem] font-normal text-muted-foreground">Open embosser format (XML)</span>
            </span>
          </Button>
          <Button
            variant="outline"
            onClick={() => props.onExport('print')}
            disabled={empty}
            className="h-auto justify-start py-3 text-left"
          >
            <Printer aria-hidden="true" />
            <span>
              <span className="block">Print with print text</span>
              <span className="block text-[0.75rem] font-normal text-muted-foreground">Interline copy for teachers</span>
            </span>
          </Button>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" onClick={() => props.onExport('txt')} disabled={empty} className="h-auto py-3">
              <FileText aria-hidden="true" />
              .txt
            </Button>
            <Button variant="outline" onClick={() => props.onExport('copy')} disabled={empty} className="h-auto py-3">
              <Copy aria-hidden="true" />
              Copy
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
