import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { CheckCircle2, Lock, Keyboard } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { SourcePanel, type ImportState } from '@/components/convert/SourcePanel';
import { OutputPanel, type ExportFormat } from '@/components/convert/OutputPanel';
import type { PreviewView } from '@/components/convert/BraillePreview';
import { usePersistentState } from '@/hooks/usePersistentState';
import { useConversionHistory } from '@/hooks/useConversionHistory';
import {
  countCells,
  DEFAULT_LAYOUT,
  paginate,
  toBRF,
  toPEF,
  toUnicodeText,
  translate,
  type Grade,
  type PageLayout,
} from '@/lib/braille';
import { importFile, ImportError, type ImportResult, type OcrMode } from '@/lib/import';
import { cloudAvailable } from '@/integrations/supabase/client';
import { downloadFile, exportFilename, printInterline, titleFromText } from '@/lib/download';
import { feedback, initAudio } from '@/lib/audio-feedback';

interface Settings {
  grade: Grade;
  view: PreviewView;
  fontSize: number;
  layout: PageLayout;
  ocrMode: OcrMode;
}

const DEFAULT_SETTINGS: Settings = {
  grade: 2,
  view: 'braille',
  fontSize: 28,
  layout: DEFAULT_LAYOUT,
  ocrMode: cloudAvailable ? 'auto' : 'device',
};

function Hero() {
  const points = [
    { icon: CheckCircle2, text: 'Checked against liblouis, the braille engine used by screen readers' },
    { icon: Lock, text: 'Translation runs in your browser; on-device OCR keeps files private' },
    { icon: Keyboard, text: 'Built for keyboards, screen readers and high contrast' },
  ];
  return (
    <div className="dot-grid border-b">
      <div className="container py-8 md:py-14">
        <p className="mb-3 text-[0.75rem] font-bold uppercase tracking-[0.12em] text-primary md:text-[0.8rem]">
          Free · Open source · Unified English Braille
        </p>
        <h1 className="max-w-3xl text-[1.9rem] font-bold leading-[1.1] md:text-[3rem]">
          Turn print into braille, <span className="text-primary">right in your browser.</span>
        </h1>
        <p className="mt-4 max-w-2xl text-[1rem] text-muted-foreground md:text-[1.05rem]">
          Type or paste text, open a PDF or Word file, or take a photo of a page. BrailleBridge translates it into grade 1
          or grade 2 braille and gives you files ready for an embosser or braille display.
        </p>
        <ul className="mt-6 hidden gap-3 text-[0.9rem] md:grid md:grid-cols-3">
          {points.map(({ icon: Icon, text }) => (
            <li key={text} className="flex items-start gap-2">
              <Icon className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
              <span>{text}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default function Convert() {
  const [text, setText] = usePersistentState('braillebridge:draft', '');
  const [title, setTitle] = usePersistentState('braillebridge:title', '');
  const [settings, setSettings] = usePersistentState<Settings>('braillebridge:settings', DEFAULT_SETTINGS);
  const [importing, setImporting] = useState<ImportState | null>(null);
  const [lastImport, setLastImport] = useState<ImportResult | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const { history, addEntry } = useConversionHistory();
  const [searchParams, setSearchParams] = useSearchParams();

  const update = useCallback(
    <K extends keyof Settings>(key: K, value: Settings[K]) => setSettings((s) => ({ ...s, [key]: value })),
    [setSettings],
  );
  // Settings saved by an older version may miss newer fields.
  const s: Settings = { ...DEFAULT_SETTINGS, ...settings, layout: { ...DEFAULT_LAYOUT, ...settings.layout } };

  // Translation follows typing without blocking it.
  const deferredText = useDeferredValue(text);
  const result = useMemo(() => translate(deferredText, { grade: s.grade }), [deferredText, s.grade]);
  const grade1Cells = useMemo(
    () => (s.grade === 2 ? countCells(translate(deferredText, { grade: 1 }).braille) : 0),
    [deferredText, s.grade],
  );
  const pages = useMemo(() => paginate(result.lines, s.layout), [result, s.layout]);
  const empty = deferredText.trim().length === 0;

  // Reopen a document from history (?open=<id>).
  useEffect(() => {
    const id = searchParams.get('open');
    if (!id) return;
    const entry = history.find((e) => e.id === id);
    if (entry) {
      setText(entry.text);
      setTitle(entry.title);
      update('grade', entry.grade);
      setLastImport(null);
      toast.success(`Opened “${entry.title}”`);
    }
    setSearchParams({}, { replace: true });
  }, [searchParams, history, setSearchParams, setText, setTitle, update]);

  const replaceText = useCallback(
    (next: string, nextTitle: string, message: string) => {
      const previous = { text, title };
      setText(next);
      setTitle(nextTitle);
      if (previous.text.trim() && previous.text !== next) {
        toast(message, {
          action: {
            label: 'Undo',
            onClick: () => {
              setText(previous.text);
              setTitle(previous.title);
              setLastImport(null);
            },
          },
        });
      }
    },
    [text, title, setText, setTitle],
  );

  const handleFile = useCallback(
    async (file: File) => {
      initAudio();
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      setImporting({ fraction: 0, label: `Opening ${file.name}…` });
      feedback('upload', `Opening ${file.name}`);
      try {
        const imported = await importFile(file, {
          ocrMode: s.ocrMode,
          signal: controller.signal,
          onProgress: (fraction, label) => {
            if (!controller.signal.aborted) setImporting({ fraction, label });
          },
        });
        if (controller.signal.aborted) return;
        replaceText(imported.text, imported.fileName, `Replaced your text with ${imported.fileName}`);
        setLastImport(imported);
        feedback('success', `Text ready from ${imported.fileName}. Review it, then export.`);
      } catch (error) {
        if (controller.signal.aborted || (error as Error).name === 'AbortError') {
          toast('Import cancelled');
          return;
        }
        if (!(error instanceof ImportError)) console.error(error);
        const message =
          error instanceof ImportError
            ? error.message
            : 'Something went wrong while reading this file. Try another file, or paste the text instead.';
        feedback('error', message);
        toast.error(message);
      } finally {
        if (abortRef.current === controller) {
          abortRef.current = null;
          setImporting(null);
        }
      }
    },
    [s.ocrMode, replaceText],
  );

  const cancelImport = () => {
    abortRef.current?.abort();
    setImporting(null);
  };

  const handleExport = (format: ExportFormat) => {
    initAudio();
    const docTitle = title || titleFromText(text);
    try {
      switch (format) {
        case 'brf':
          downloadFile(toBRF(pages), exportFilename(docTitle, s.grade, 'brf'), 'application/octet-stream');
          break;
        case 'pef':
          downloadFile(
            toPEF(pages, { title: docTitle, cellsPerLine: s.layout.cellsPerLine, linesPerPage: s.layout.linesPerPage }),
            exportFilename(docTitle, s.grade, 'pef'),
            'application/x-pef+xml',
          );
          break;
        case 'txt':
          downloadFile(toUnicodeText(pages), exportFilename(docTitle, s.grade, 'txt'), 'text/plain;charset=utf-8');
          break;
        case 'print':
          printInterline(result.lines, docTitle, s.grade);
          break;
        case 'copy':
          void navigator.clipboard.writeText(result.braille).then(
            () => toast.success('Braille copied to the clipboard'),
            () => toast.error('Copying is blocked in this browser. Select the braille and copy it instead.'),
          );
          break;
      }
      addEntry({ title: docTitle, grade: s.grade, format, text });
      if (format !== 'copy' && format !== 'print') {
        feedback('complete', `${format.toUpperCase()} file downloaded`);
        toast.success(`${format.toUpperCase()} file downloaded`, {
          description: `${pages.length} ${pages.length === 1 ? 'page' : 'pages'}, grade ${s.grade}`,
        });
      }
    } catch (error) {
      console.error(error);
      feedback('error', 'Export failed');
      toast.error('Export failed. Please try again.');
    }
  };

  return (
    <Layout>
      <Hero />
      <div className="container py-8">
        <div className="grid items-start gap-6 lg:grid-cols-2">
          <SourcePanel
            text={text}
            onTextChange={(t) => {
              setText(t);
              if (!t.trim()) setTitle('');
            }}
            onFile={handleFile}
            onSample={(sampleTitle, sampleText) => {
              replaceText(sampleText, sampleTitle, `Loaded the “${sampleTitle}” sample`);
              setLastImport(null);
            }}
            onClear={() => replaceText('', '', 'Text cleared')}
            importing={importing}
            onCancelImport={cancelImport}
            lastImport={lastImport}
            onDismissImport={() => setLastImport(null)}
            onUndoReflow={() => {
              if (lastImport?.original) setText(lastImport.original);
              setLastImport((l) => (l ? { ...l, original: undefined, notes: l.notes.filter((n) => !n.startsWith('Line breaks')) } : l));
            }}
            ocrMode={s.ocrMode}
            onOcrModeChange={(mode) => update('ocrMode', mode)}
          />
          <OutputPanel
            result={result}
            grade1Cells={grade1Cells}
            pages={pages}
            grade={s.grade}
            onGradeChange={(g) => update('grade', g)}
            view={s.view}
            onViewChange={(v) => update('view', v)}
            fontSize={s.fontSize}
            onFontSizeChange={(n) => update('fontSize', n)}
            layout={s.layout}
            onLayoutChange={(l) => update('layout', l)}
            onExport={handleExport}
            empty={empty}
          />
        </div>
      </div>
    </Layout>
  );
}
