import { useDeferredValue, useId, useMemo, useRef } from 'react';
import { Copy, FileUp, X } from 'lucide-react';
import { toast } from 'sonner';
import { Layout, PageHeader } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { SegmentedControl } from '@/components/SegmentedControl';
import { PerkinsInput } from '@/components/read/PerkinsInput';
import { usePersistentState } from '@/hooks/usePersistentState';
import {
  asciiToUnicode,
  backTranslateWith,
  BRAILLE_CODES,
  CODE_LANGUAGE,
  looksLikeBrailleAscii,
  translateWith,
  type BrailleCode,
  type UzbekScript,
} from '@/lib/braille';
import { useMessages } from '@/i18n';
import { useLanguageChoice } from '@/hooks/useLanguageChoice';

const EXAMPLES: Record<BrailleCode, string> = {
  ueb2: 'Braille is a tactile writing system.',
  ueb1: 'Braille is a tactile writing system.',
  uz: 'Brayl yozuvi oltita nuqtadan iborat.',
};

export default function Read() {
  const m = useMessages();
  const t = m.read;
  const [braille, setBraille] = usePersistentState('braillebridge:read-input', '');
  const [code, setCode] = useLanguageChoice<BrailleCode>(
    'braillebridge:read-code',
    (locale) => (locale === 'uz' ? 'uz' : 'ueb2'),
    (code) => CODE_LANGUAGE[code],
  );
  const [script, setScript] = usePersistentState<UzbekScript>('braillebridge:read-script', 'latin');
  const fileInput = useRef<HTMLInputElement>(null);
  const inputId = useId();
  const outputId = useId();
  const codeId = useId();

  const example = useMemo(() => translateWith(code, EXAMPLES[code]).braille, [code]);
  const deferred = useDeferredValue(braille);
  const isAscii = useMemo(() => looksLikeBrailleAscii(deferred), [deferred]);
  const print = useMemo(() => backTranslateWith(code, deferred, script), [code, deferred, script]);

  const append = (s: string) => setBraille((b) => b + s);

  return (
    <Layout>
      <div className="container py-10">
        <PageHeader eyebrow={t.eyebrow} title={t.title} intro={t.intro} />

        <div className="grid items-start gap-6 lg:grid-cols-2">
          <section aria-labelledby={`${inputId}-h`} className="rounded-xl border bg-card shadow-sm">
            <div className="flex flex-wrap items-center gap-2 border-b px-4 py-3">
              <h2 id={`${inputId}-h`} className="mr-auto font-bold">
                {t.brailleHeading}
              </h2>
              <label htmlFor={codeId} className="sr-only">
                {m.convert.output.codeLabel}
              </label>
              <select
                id={codeId}
                value={code}
                onChange={(e) => setCode(e.target.value as BrailleCode)}
                className="h-9 rounded-lg border border-input bg-background pl-3 pr-8 text-[0.85rem] font-semibold"
              >
                {BRAILLE_CODES.map((c) => (
                  <option key={c} value={c}>
                    {m.codes[c]}
                  </option>
                ))}
              </select>
              <input
                ref={fileInput}
                type="file"
                accept=".brf,.txt,text/plain"
                className="sr-only"
                tabIndex={-1}
                aria-hidden="true"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  e.target.value = '';
                  if (!file) return;
                  const raw = await file.text();
                  setBraille(looksLikeBrailleAscii(raw) ? asciiToUnicode(raw) : raw);
                  toast.success(t.opened(file.name));
                }}
              />
              <Button variant="outline" size="sm" onClick={() => fileInput.current?.click()}>
                <FileUp aria-hidden="true" /> {t.openBrf}
              </Button>
            </div>
            <label htmlFor={inputId} className="sr-only">
              {t.inputLabel}
            </label>
            <textarea
              id={inputId}
              value={braille}
              onChange={(e) => setBraille(e.target.value)}
              placeholder={t.placeholder(example)}
              spellCheck={false}
              className="braille-text min-h-[12rem] w-full resize-y bg-transparent px-4 py-4 text-[1.6rem] placeholder:font-sans placeholder:text-[0.95rem] placeholder:text-muted-foreground focus-visible:ring-inset focus-visible:ring-offset-0"
            />
            <div className="flex items-center gap-2 border-t px-4 py-2 text-[0.8rem] text-muted-foreground">
              {isAscii ? t.ascii : t.unicode}
              {braille ? (
                <Button variant="ghost" size="sm" className="ml-auto h-8" onClick={() => setBraille('')}>
                  <X aria-hidden="true" /> {t.clear}
                </Button>
              ) : (
                <Button variant="link" size="sm" className="ml-auto h-8" onClick={() => setBraille(example)}>
                  {t.tryExample}
                </Button>
              )}
            </div>
            <div className="border-t p-4">
              <h3 className="mb-3 font-bold">{t.typeHeading}</h3>
              <PerkinsInput
                onCell={(cell) => append(cell)}
                onSpace={() => append(' ')}
                onNewline={() => append('\n')}
                onBackspace={() => setBraille((b) => [...b].slice(0, -1).join(''))}
              />
            </div>
          </section>

          <section aria-labelledby={`${outputId}-h`} className="rounded-xl border bg-card shadow-sm lg:sticky lg:top-24">
            <div className="flex flex-wrap items-center gap-2 border-b px-4 py-3">
              <h2 id={`${outputId}-h`} className="mr-auto font-bold">
                {t.printHeading}
              </h2>
              {code === 'uz' && (
                <SegmentedControl<UzbekScript>
                  label={t.scriptLabel}
                  size="sm"
                  value={script}
                  onChange={setScript}
                  options={[
                    { value: 'latin', label: t.latin },
                    { value: 'cyrillic', label: t.cyrillic },
                  ]}
                />
              )}
              <Button
                variant="outline"
                size="sm"
                disabled={!print.trim()}
                onClick={() =>
                  navigator.clipboard.writeText(print).then(
                    () => toast.success(t.copied),
                    () => toast.error(t.copyBlocked),
                  )
                }
              >
                <Copy aria-hidden="true" /> {t.copy}
              </Button>
            </div>
            <output
              htmlFor={inputId}
              aria-live="polite"
              lang={code === 'uz' ? (script === 'latin' ? 'uz-Latn' : 'uz-Cyrl') : 'en'}
              className="block min-h-[12rem] whitespace-pre-wrap px-4 py-4 text-[1.15rem] leading-relaxed"
            >
              {print || <span className="text-muted-foreground">{t.empty}</span>}
            </output>
            <p className="border-t px-4 py-3 text-[0.8rem] text-muted-foreground">
              {code === 'uz' ? `${t.uzNote} ` : ''}
              {t.note}
            </p>
          </section>
        </div>
      </div>
    </Layout>
  );
}
