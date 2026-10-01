import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { CheckCircle2, Lock, Keyboard } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { SourcePanel, type ImportState } from '@/components/convert/SourcePanel';
import { OutputPanel, type ExportFormat } from '@/components/convert/OutputPanel';
import type { PreviewView } from '@/components/convert/BraillePreview';
import type { Sample } from '@/components/convert/samples';
import { usePersistentState } from '@/hooks/usePersistentState';
import { useConversionHistory } from '@/hooks/useConversionHistory';
import {
  CODE_LANGUAGE,
  countCells,
  DEFAULT_LAYOUT,
  DEFAULT_UZBEK_OPTIONS,
  detectLanguage,
  isContracted,
  paginate,
  toBRF,
  toPEF,
  toUnicodeText,
  translateWith,
  type BrailleCode,
  type PageLayout,
  type UzbekOptions,
} from '@/lib/braille';
import { importFile, ImportError, type ImportResult, type OcrMode, type ProgressStep } from '@/lib/import';
import { cloudAvailable } from '@/integrations/supabase/client';
import { downloadFile, exportFilename, printInterline, titleFromText } from '@/lib/download';
import { feedback, initAudio } from '@/lib/audio-feedback';
import { getLocale, useLocale, useMessages, type Locale, type Messages } from '@/i18n';

interface Settings {
  code: BrailleCode;
  uzbek: UzbekOptions;
  view: PreviewView;
  fontSize: number;
  layout: PageLayout;
  ocrMode: OcrMode;
  /** The interface language when the code was last chosen; switching language switches the code. */
  codeFor?: Locale;
  /** Older versions stored only the UEB grade. */
  grade?: 1 | 2;
}

const codeForLocale = (locale: Locale): BrailleCode => (locale === 'uz' ? 'uz' : 'ueb2');

const defaultSettings = (): Settings => ({
  code: codeForLocale(getLocale()),
  codeFor: getLocale(),
  uzbek: DEFAULT_UZBEK_OPTIONS,
  view: 'braille',
  fontSize: 28,
  layout: DEFAULT_LAYOUT,
  ocrMode: cloudAvailable ? 'auto' : 'device',
});

function stepText(step: ProgressStep, t: Messages['convert']['source']['steps'], fileName: string): string {
  switch (step.kind) {
    case 'opening':
      return t.opening(fileName);
    case 'reading-page':
      return t.readingPage(step.page, step.total);
    default:
      return t[step.kind];
  }
}

function Hero() {
  const t = useMessages().convert.hero;
  const icons = [CheckCircle2, Lock, Keyboard];
  return (
    <div className="dot-grid border-b">
      <div className="container py-8 md:py-14">
        <p className="mb-3 text-[0.75rem] font-bold uppercase tracking-[0.12em] text-primary md:text-[0.8rem]">{t.eyebrow}</p>
        <h1 className="max-w-3xl text-[1.9rem] font-bold leading-[1.1] md:text-[3rem]">
          {t.titleA} <span className="text-primary">{t.titleB}</span>
        </h1>
        <p className="mt-4 max-w-2xl text-[1rem] text-muted-foreground md:text-[1.05rem]">{t.intro}</p>
        <ul className="mt-6 hidden gap-3 text-[0.9rem] md:grid md:grid-cols-3">
          {t.points.map((text, i) => {
            const Icon = icons[i];
            return (
              <li key={text} className="flex items-start gap-2">
                <Icon className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
                <span>{text}</span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

export default function Convert() {
  const m = useMessages();
  const t = m.convert;
  const locale = useLocale();
  const [text, setText] = usePersistentState('braillebridge:draft', '');
  const [title, setTitle] = usePersistentState('braillebridge:title', '');
  const [settings, setSettings] = usePersistentState<Settings>('braillebridge:settings', defaultSettings());
  const [importing, setImporting] = useState<ImportState | null>(null);
  const [lastImport, setLastImport] = useState<ImportResult | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const { history, addEntry } = useConversionHistory();
  const [searchParams, setSearchParams] = useSearchParams();

  const update = useCallback(
    <K extends keyof Settings>(key: K, value: Settings[K]) => setSettings((s) => ({ ...s, [key]: value })),
    [setSettings],
  );
  const chooseCode = useCallback(
    (code: BrailleCode) => setSettings((s) => ({ ...s, code, codeFor: getLocale() })),
    [setSettings],
  );
  // A primitive, so the settings below only change when the guess does.
  const textLanguage = useMemo(() => detectLanguage(text), [text]);
  // Settings saved by an older version may miss newer fields.
  const s: Settings = useMemo(() => {
    const defaults = defaultSettings();
    const legacyCode: BrailleCode | undefined = settings.grade ? (settings.grade === 1 ? 'ueb1' : 'ueb2') : undefined;
    let code = settings.code ?? legacyCode ?? defaults.code;
    // After the interface language changes, use a braille code for that language,
    // unless the text is clearly in the other one.
    if (settings.codeFor !== locale && CODE_LANGUAGE[code] !== locale && (textLanguage ?? locale) === locale) {
      code = codeForLocale(locale);
    }
    return {
      ...defaults,
      ...settings,
      code,
      codeFor: locale,
      uzbek: { ...DEFAULT_UZBEK_OPTIONS, ...settings.uzbek },
      layout: { ...DEFAULT_LAYOUT, ...settings.layout },
    };
  }, [settings, locale, textLanguage]);
  useEffect(() => {
    if (settings.codeFor !== locale) setSettings((prev) => ({ ...prev, code: s.code, codeFor: locale }));
  }, [settings.codeFor, locale, s.code, setSettings]);

  // Translation follows typing without blocking it.
  const deferredText = useDeferredValue(text);
  const result = useMemo(() => translateWith(s.code, deferredText, s.uzbek), [deferredText, s.code, s.uzbek]);
  const uncontractedCells = useMemo(
    () => (isContracted(s.code) ? countCells(translateWith('ueb1', deferredText).braille) : 0),
    [deferredText, s.code],
  );
  const pages = useMemo(() => paginate(result.lines, s.layout), [result, s.layout]);
  const empty = deferredText.trim().length === 0;
  const [dismissedSuggestion, setDismissedSuggestion] = useState<BrailleCode | null>(null);
  const suggestion = textLanguage && textLanguage !== CODE_LANGUAGE[s.code] ? codeForLocale(textLanguage) : null;

  // Reopen a document from history (?open=<id>).
  useEffect(() => {
    const id = searchParams.get('open');
    if (!id) return;
    const entry = history.find((e) => e.id === id);
    if (entry) {
      setText(entry.text);
      setTitle(entry.title);
      chooseCode(entry.code);
      setLastImport(null);
      toast.success(t.toasts.opened(entry.title));
    }
    setSearchParams({}, { replace: true });
  }, [searchParams, history, setSearchParams, setText, setTitle, chooseCode, t]);

  const replaceText = useCallback(
    (next: string, nextTitle: string, message: string) => {
      const previous = { text, title };
      setText(next);
      setTitle(nextTitle);
      if (previous.text.trim() && previous.text !== next) {
        toast(message, {
          action: {
            label: t.toasts.undo,
            onClick: () => {
              setText(previous.text);
              setTitle(previous.title);
              setLastImport(null);
            },
          },
        });
      }
    },
    [text, title, setText, setTitle, t],
  );

  const handleFile = useCallback(
    async (file: File) => {
      initAudio();
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      setImporting({ fraction: 0, label: t.source.steps.opening(file.name) });
      feedback('upload', t.toasts.announceOpening(file.name));
      try {
        const imported = await importFile(file, {
          ocrMode: s.ocrMode,
          language: s.code === 'uz' ? 'uzb' : 'eng',
          signal: controller.signal,
          onProgress: (fraction, step) => {
            if (!controller.signal.aborted) setImporting({ fraction, label: stepText(step, t.source.steps, file.name) });
          },
        });
        if (controller.signal.aborted) return;
        replaceText(imported.text, imported.fileName, t.toasts.replaced(imported.fileName));
        setLastImport(imported);
        feedback('success', t.toasts.announceReady(imported.fileName));
      } catch (error) {
        if (controller.signal.aborted || (error as Error).name === 'AbortError') {
          toast(t.toasts.importCancelled);
          return;
        }
        if (!(error instanceof ImportError)) console.error(error);
        const message = error instanceof ImportError ? t.toasts.importErrors[error.code] : t.toasts.importFailed;
        feedback('error', message);
        toast.error(message);
      } finally {
        if (abortRef.current === controller) {
          abortRef.current = null;
          setImporting(null);
        }
      }
    },
    [s.ocrMode, s.code, replaceText, t],
  );

  const cancelImport = () => {
    abortRef.current?.abort();
    setImporting(null);
  };

  const handleExport = (format: ExportFormat) => {
    initAudio();
    const docTitle = title || titleFromText(text, t.untitled);
    const codeName = m.codes.short[s.code];
    try {
      switch (format) {
        case 'brf':
          downloadFile(toBRF(pages), exportFilename(docTitle, s.code, 'brf'), 'application/octet-stream');
          break;
        case 'pef':
          downloadFile(
            toPEF(pages, {
              title: docTitle,
              language: CODE_LANGUAGE[s.code],
              cellsPerLine: s.layout.cellsPerLine,
              linesPerPage: s.layout.linesPerPage,
            }),
            exportFilename(docTitle, s.code, 'pef'),
            'application/x-pef+xml',
          );
          break;
        case 'txt':
          downloadFile(toUnicodeText(pages), exportFilename(docTitle, s.code, 'txt'), 'text/plain;charset=utf-8');
          break;
        case 'print':
          printInterline(result.lines, docTitle, t.printHeader(codeName), document.documentElement.lang);
          break;
        case 'copy':
          void navigator.clipboard.writeText(result.braille).then(
            () => toast.success(t.toasts.copied),
            () => toast.error(t.toasts.copyBlocked),
          );
          break;
      }
      addEntry({ title: docTitle, code: s.code, format, text });
      if (format !== 'copy' && format !== 'print') {
        feedback('complete', t.toasts.downloaded(format.toUpperCase()));
        toast.success(t.toasts.downloaded(format.toUpperCase()), { description: t.toasts.downloadedDetail(pages.length, codeName) });
      }
    } catch (error) {
      console.error(error);
      feedback('error', t.toasts.exportFailed);
      toast.error(t.toasts.exportFailed);
    }
  };

  const loadSample = (sample: Sample) => {
    replaceText(sample.text, sample.title, t.toasts.sampleLoaded(sample.title));
    if ((sample.code === 'uz') !== (s.code === 'uz')) chooseCode(sample.code);
    setLastImport(null);
  };

  return (
    <Layout>
      <Hero />
      <div className="container py-8">
        <div className="grid items-start gap-6 lg:grid-cols-2">
          <SourcePanel
            text={text}
            onTextChange={(next) => {
              setText(next);
              if (!next.trim()) setTitle('');
            }}
            onFile={handleFile}
            onSample={loadSample}
            onClear={() => replaceText('', '', t.toasts.cleared)}
            importing={importing}
            onCancelImport={cancelImport}
            lastImport={lastImport}
            onDismissImport={() => setLastImport(null)}
            onUndoReflow={() => {
              if (lastImport?.original) setText(lastImport.original);
              setLastImport((l) => (l ? { ...l, original: undefined, notes: l.notes.filter((n) => n.kind !== 'reflowed') } : l));
            }}
            ocrMode={s.ocrMode}
            onOcrModeChange={(mode) => update('ocrMode', mode)}
          />
          <OutputPanel
            result={result}
            uncontractedCells={uncontractedCells}
            pages={pages}
            code={s.code}
            onCodeChange={chooseCode}
            suggestedCode={suggestion !== dismissedSuggestion ? suggestion : null}
            onDismissSuggestion={() => setDismissedSuggestion(suggestion)}
            uzbek={s.uzbek}
            onUzbekChange={(options) => update('uzbek', options)}
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
