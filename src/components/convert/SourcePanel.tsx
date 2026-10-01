import { useCallback, useId, useRef, useState, type DragEvent } from 'react';
import { Camera, ChevronDown, FileUp, Info, Loader2, Settings2, Sparkles, Undo2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ACCEPTED_FILE_TYPES, type ImportNote, type ImportResult, type OcrMode } from '@/lib/import';
import { cloudAvailable } from '@/integrations/supabase/client';
import { countWords } from '@/lib/text-tools';
import { cn } from '@/lib/utils';
import { useLocale, useMessages, type Messages } from '@/i18n';
import { SAMPLES, type Sample } from './samples';

export interface ImportState {
  fraction: number;
  label: string;
}

interface SourcePanelProps {
  text: string;
  onTextChange: (text: string) => void;
  onFile: (file: File) => void;
  onSample: (sample: Sample) => void;
  onClear: () => void;
  importing: ImportState | null;
  onCancelImport: () => void;
  lastImport: ImportResult | null;
  onDismissImport: () => void;
  onUndoReflow: () => void;
  ocrMode: OcrMode;
  onOcrModeChange: (mode: OcrMode) => void;
}

function noteText(note: ImportNote, t: Messages['convert']['source']['notes']): string {
  switch (note.kind) {
    case 'cloud-fallback':
      return t.cloudFallback;
    case 'page-limit':
      return t.pageLimit(note.read, note.total);
    default:
      return t[note.kind];
  }
}

export function SourcePanel(props: SourcePanelProps) {
  const { text, onTextChange, onFile, importing, lastImport } = props;
  const t = useMessages().convert.source;
  const locale = useLocale();
  const fileInput = useRef<HTMLInputElement>(null);
  const cameraInput = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const dragDepth = useRef(0);
  const editorId = useId();
  const helpId = useId();

  const takeFile = useCallback(
    (files: FileList | null) => {
      const file = files?.[0];
      if (file) onFile(file);
    },
    [onFile],
  );

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    dragDepth.current = 0;
    setDragging(false);
    takeFile(e.dataTransfer.files);
  };

  // Samples in the interface language first.
  const sampleGroups = [
    { label: 'Oʻzbekcha', items: SAMPLES.filter((s) => s.code === 'uz') },
    { label: 'English', items: SAMPLES.filter((s) => s.code !== 'uz') },
  ];
  if (locale === 'en') sampleGroups.reverse();

  return (
    <section
      aria-labelledby={`${editorId}-heading`}
      className="relative flex min-h-[28rem] flex-col rounded-xl border bg-card shadow-sm"
      onDragEnter={(e) => {
        if (!e.dataTransfer.types.includes('Files')) return;
        e.preventDefault();
        dragDepth.current++;
        setDragging(true);
      }}
      onDragOver={(e) => e.dataTransfer.types.includes('Files') && e.preventDefault()}
      onDragLeave={() => {
        dragDepth.current = Math.max(0, dragDepth.current - 1);
        if (dragDepth.current === 0) setDragging(false);
      }}
      onDrop={onDrop}
    >
      <div className="flex items-center gap-3 border-b px-4 py-3">
        <h2 id={`${editorId}-heading`} className="mr-auto text-[1rem] font-bold">
          <span className="mr-2 inline-flex size-6 items-center justify-center rounded-full bg-primary text-[0.75rem] text-primary-foreground">
            1
          </span>
          {t.heading}
        </h2>
        <span className="hidden text-[0.8rem] text-muted-foreground sm:inline">{t.hint}</span>
      </div>

      <div className="flex flex-wrap items-center gap-2 border-b px-4 py-3">
        <input
          ref={fileInput}
          type="file"
          accept={ACCEPTED_FILE_TYPES}
          className="sr-only"
          tabIndex={-1}
          aria-hidden="true"
          onChange={(e) => {
            takeFile(e.target.files);
            e.target.value = '';
          }}
        />
        <input
          ref={cameraInput}
          type="file"
          accept="image/*"
          capture="environment"
          className="sr-only"
          tabIndex={-1}
          aria-hidden="true"
          onChange={(e) => {
            takeFile(e.target.files);
            e.target.value = '';
          }}
        />

        <Button variant="default" size="sm" onClick={() => fileInput.current?.click()} disabled={!!importing}>
          <FileUp aria-hidden="true" />
          {t.openFile}
        </Button>
        <Button variant="outline" size="sm" onClick={() => cameraInput.current?.click()} disabled={!!importing}>
          <Camera aria-hidden="true" />
          <span className="hidden sm:inline">{t.takePhoto}</span>
          <span className="sm:hidden">{t.photoShort}</span>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" disabled={!!importing}>
              <Sparkles aria-hidden="true" />
              {t.samples}
              <ChevronDown aria-hidden="true" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-52">
            {sampleGroups.map((group, gi) => (
              <div key={group.label}>
                {gi > 0 && <DropdownMenuSeparator />}
                <DropdownMenuLabel>{group.label}</DropdownMenuLabel>
                {group.items.map((sample) => (
                  <DropdownMenuItem key={sample.id} className="min-h-10" onSelect={() => props.onSample(sample)}>
                    {sample.title}
                  </DropdownMenuItem>
                ))}
              </div>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="ml-auto h-9 w-9" aria-label={t.ocrSettings}>
              <Settings2 />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="max-w-xs">
            <DropdownMenuLabel>{t.ocrTitle}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuRadioGroup value={props.ocrMode} onValueChange={(v) => props.onOcrModeChange(v as OcrMode)}>
              <DropdownMenuRadioItem value="auto" disabled={!cloudAvailable} className="items-start py-2">
                <span>
                  <span className="block font-semibold">{t.cloudTitle}</span>
                  <span className="block text-[0.8rem] text-muted-foreground">{t.cloudDescription}</span>
                </span>
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="device" className="items-start py-2">
                <span>
                  <span className="block font-semibold">{t.deviceTitle}</span>
                  <span className="block text-[0.8rem] text-muted-foreground">{t.deviceDescription}</span>
                </span>
              </DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {lastImport && (
        <div className="flex items-start gap-3 border-b bg-muted/60 px-4 py-3 text-[0.85rem]" role="status">
          <Info className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
          <div className="flex-1 space-y-1">
            <p className="font-semibold">
              {lastImport.fileName} — {t.sources[lastImport.source]}
            </p>
            {lastImport.notes.map((note) => (
              <p key={note.kind} className="text-muted-foreground">
                {noteText(note, t.notes)}
              </p>
            ))}
            <p className="text-muted-foreground">{t.checkText}</p>
            {lastImport.original && (
              <Button variant="link" className="h-auto p-0 text-[0.85rem]" onClick={props.onUndoReflow}>
                <Undo2 aria-hidden="true" />
                {t.keepLineBreaks}
              </Button>
            )}
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={props.onDismissImport} aria-label={t.dismiss}>
            <X />
          </Button>
        </div>
      )}

      <label htmlFor={editorId} className="sr-only">
        {t.editorLabel}
      </label>
      <textarea
        id={editorId}
        value={text}
        onChange={(e) => onTextChange(e.target.value)}
        aria-describedby={helpId}
        spellCheck
        placeholder={t.placeholder}
        className="min-h-[20rem] flex-1 resize-none rounded-b-xl bg-transparent px-4 py-4 text-[1.05rem] leading-relaxed placeholder:text-muted-foreground focus-visible:ring-inset focus-visible:ring-offset-0"
      />

      <div className="flex items-center gap-3 border-t px-4 py-2 text-[0.8rem] text-muted-foreground">
        <span id={helpId}>{t.counts(countWords(text), text.length)}</span>
        {text && (
          <Button variant="ghost" size="sm" className="ml-auto h-8" onClick={props.onClear}>
            {t.clear}
          </Button>
        )}
      </div>

      {importing && (
        <div
          className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 rounded-xl bg-card/95 p-8 text-center"
          role="status"
          aria-live="polite"
        >
          <Loader2 className="size-8 animate-spin text-primary" aria-hidden="true" />
          <p className="font-semibold">{importing.label}</p>
          <Progress value={Math.round(importing.fraction * 100)} className="h-2 w-full max-w-xs" aria-label={t.progressLabel} />
          <Button variant="outline" size="sm" onClick={props.onCancelImport}>
            {t.cancel}
          </Button>
        </div>
      )}

      {dragging && !importing && (
        <div
          className={cn(
            'pointer-events-none absolute inset-2 z-20 flex flex-col items-center justify-center gap-2 rounded-lg',
            'border-2 border-dashed border-primary bg-card/95 text-center',
          )}
        >
          <FileUp className="size-8 text-primary" aria-hidden="true" />
          <p className="font-semibold">{t.dropTitle}</p>
          <p className="text-[0.85rem] text-muted-foreground">{t.dropTypes}</p>
        </div>
      )}
    </section>
  );
}
