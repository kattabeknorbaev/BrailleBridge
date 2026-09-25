import { useDeferredValue, useId, useMemo, useRef } from 'react';
import { Copy, FileUp, X } from 'lucide-react';
import { toast } from 'sonner';
import { Layout, PageHeader } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { SegmentedControl } from '@/components/SegmentedControl';
import { PerkinsInput } from '@/components/read/PerkinsInput';
import { usePersistentState } from '@/hooks/usePersistentState';
import { asciiToUnicode, backTranslate, looksLikeBrailleAscii, type Grade } from '@/lib/braille';

const EXAMPLE = '⠠⠃⠗⠇ ⠊⠎ ⠁ ⠞⠁⠉⠞⠊⠇⠑ ⠺⠗⠊⠞⠬ ⠎⠽⠌⠑⠍⠲';

export default function Read() {
  const [braille, setBraille] = usePersistentState('braillebridge:read-input', '');
  const [grade, setGrade] = usePersistentState<Grade>('braillebridge:read-grade', 2);
  const fileInput = useRef<HTMLInputElement>(null);
  const inputId = useId();
  const outputId = useId();

  const deferred = useDeferredValue(braille);
  const isAscii = useMemo(() => looksLikeBrailleAscii(deferred), [deferred]);
  const print = useMemo(() => backTranslate(deferred, grade), [deferred, grade]);

  const append = (s: string) => setBraille((b) => b + s);

  return (
    <Layout>
      <div className="container py-10">
        <PageHeader
          eyebrow="Braille to print"
          title="Read braille"
          intro="Paste braille or open a BRF file to see it in print, or type braille yourself with a Perkins-style keyboard. Useful for checking a student's work or a file before embossing."
        />

        <div className="grid items-start gap-6 lg:grid-cols-2">
          <section aria-labelledby={`${inputId}-h`} className="rounded-xl border bg-card shadow-sm">
            <div className="flex flex-wrap items-center gap-2 border-b px-4 py-3">
              <h2 id={`${inputId}-h`} className="mr-auto font-bold">
                Braille
              </h2>
              <SegmentedControl
                label="Braille grade"
                value={String(grade) as '1' | '2'}
                onChange={(v) => setGrade(Number(v) as Grade)}
                options={[
                  { value: '1', label: 'Grade 1' },
                  { value: '2', label: 'Grade 2' },
                ]}
                size="sm"
              />
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
                  toast.success(`Opened ${file.name}`);
                }}
              />
              <Button variant="outline" size="sm" onClick={() => fileInput.current?.click()}>
                <FileUp aria-hidden="true" /> Open BRF
              </Button>
            </div>
            <label htmlFor={inputId} className="sr-only">
              Braille input (Unicode braille or Braille ASCII)
            </label>
            <textarea
              id={inputId}
              value={braille}
              onChange={(e) => setBraille(e.target.value)}
              placeholder={`Paste braille here, e.g. ${EXAMPLE}`}
              spellCheck={false}
              className="braille-text min-h-[12rem] w-full resize-y bg-transparent px-4 py-4 text-[1.6rem] placeholder:font-sans placeholder:text-[0.95rem] placeholder:text-muted-foreground focus-visible:ring-inset focus-visible:ring-offset-0"
            />
            <div className="flex items-center gap-2 border-t px-4 py-2 text-[0.8rem] text-muted-foreground">
              {isAscii ? 'Braille ASCII (BRF) detected' : 'Unicode braille'}
              {braille && (
                <Button variant="ghost" size="sm" className="ml-auto h-8" onClick={() => setBraille('')}>
                  <X aria-hidden="true" /> Clear
                </Button>
              )}
              {!braille && (
                <Button variant="link" size="sm" className="ml-auto h-8" onClick={() => setBraille(EXAMPLE)}>
                  Try an example
                </Button>
              )}
            </div>
            <div className="border-t p-4">
              <h3 className="mb-3 font-bold">Type braille</h3>
              <PerkinsInput
                onCell={(cell) => append(cell)}
                onSpace={() => append(' ')}
                onNewline={() => append('\n')}
                onBackspace={() => setBraille((b) => [...b].slice(0, -1).join(''))}
              />
            </div>
          </section>

          <section aria-labelledby={`${outputId}-h`} className="rounded-xl border bg-card shadow-sm lg:sticky lg:top-24">
            <div className="flex items-center gap-2 border-b px-4 py-3">
              <h2 id={`${outputId}-h`} className="mr-auto font-bold">
                Print
              </h2>
              <Button
                variant="outline"
                size="sm"
                disabled={!print.trim()}
                onClick={() =>
                  navigator.clipboard.writeText(print).then(
                    () => toast.success('Text copied'),
                    () => toast.error('Copying is blocked in this browser'),
                  )
                }
              >
                <Copy aria-hidden="true" /> Copy
              </Button>
            </div>
            <output
              htmlFor={inputId}
              aria-live="polite"
              className="block min-h-[12rem] whitespace-pre-wrap px-4 py-4 text-[1.15rem] leading-relaxed"
            >
              {print || <span className="text-muted-foreground">The print translation appears here.</span>}
            </output>
            <p className="border-t px-4 py-3 text-[0.8rem] text-muted-foreground">
              Back-translation follows the UEB rules used by the converter. A few signs have more than one print form
              (for example, an ellipsis and three full stops are written the same way), so check anything important.
            </p>
          </section>
        </div>
      </div>
    </Layout>
  );
}
