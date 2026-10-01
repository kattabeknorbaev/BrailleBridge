import { useMemo, useState } from 'react';
import { Search, Shuffle } from 'lucide-react';
import { Layout, PageHeader } from '@/components/layout/Layout';
import { BrailleCell } from '@/components/braille/BrailleCell';
import { Button } from '@/components/ui/button';
import { SegmentedControl } from '@/components/SegmentedControl';
import { cellToDots, toBraille, toUzbekBraille } from '@/lib/braille';
import { GROUP_RULES, IND, LETTERS, LOWER_WORDSIGNS, SHORTFORMS, SYMBOLS, WORDSIGNS } from '@/lib/braille/ueb-tables';
import { CYRILLIC_LETTERS, SYMBOLS as UZ_SYMBOLS } from '@/lib/braille/uzbek/uzbek';
import { useMessages, type Messages } from '@/i18n';
import { useLanguageChoice } from '@/hooks/useLanguageChoice';
import { cn } from '@/lib/utils';

interface Sign {
  braille: string;
  print: string;
  note?: string;
}

interface Section {
  id: string;
  title: string;
  intro: string;
  signs: Sign[];
}

type System = 'uz' | 'en';

/** Uzbek Cyrillic alphabet order, with the Latin equivalent of each letter. */
const UZBEK_ALPHABET: [cyrillic: string, latin: string][] = [
  ['а', 'a'], ['б', 'b'], ['в', 'v'], ['г', 'g'], ['д', 'd'], ['е', 'e'], ['ё', 'yo'], ['ж', 'j'], ['з', 'z'],
  ['и', 'i'], ['й', 'y'], ['к', 'k'], ['л', 'l'], ['м', 'm'], ['н', 'n'], ['о', 'o'], ['п', 'p'], ['р', 'r'],
  ['с', 's'], ['т', 't'], ['у', 'u'], ['ф', 'f'], ['х', 'x'], ['ц', 'ts'], ['ч', 'ch'], ['ш', 'sh'], ['ъ', 'ʼ'],
  ['ь', '—'], ['э', 'e'], ['ю', 'yu'], ['я', 'ya'], ['ў', 'oʻ'], ['қ', 'q'], ['ғ', 'gʻ'], ['ҳ', 'h'],
];
const UZBEK_EXTRA = new Set(['ў', 'қ', 'ғ', 'ҳ']);

const letterLabel = ([cyr, lat]: [string, string]) => `${cyr.toUpperCase()} ${cyr} · ${lat}`;

function uzbekSections(t: Messages['learn']): Section[] {
  const n = t.notes;
  return [
    {
      id: 'uz-alphabet',
      ...t.uzSections.alphabet,
      signs: UZBEK_ALPHABET.map((pair) => ({ braille: CYRILLIC_LETTERS[pair[0]], print: letterLabel(pair) })),
    },
    {
      id: 'uz-extra',
      ...t.uzSections.extra,
      signs: UZBEK_ALPHABET.filter(([cyr]) => UZBEK_EXTRA.has(cyr)).map((pair) => ({
        braille: CYRILLIC_LETTERS[pair[0]],
        print: letterLabel(pair),
      })),
    },
    {
      id: 'uz-numbers',
      ...t.uzSections.numbers,
      signs: [
        { braille: IND.numeric, print: '#', note: t.indicatorNames.numeric },
        ...['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'].map((d) => ({ braille: toUzbekBraille(d), print: d })),
        { braille: toUzbekBraille('3,5'), print: '3,5' },
        { braille: toUzbekBraille('2024-yil'), print: '2024-yil' },
      ],
    },
    {
      id: 'uz-punctuation',
      ...t.uzSections.punctuation,
      signs: [
        ...['.', ',', '?', '!', ';', ':', '-', '*'].map((ch) => ({ braille: UZ_SYMBOLS[ch], print: ch })),
        { braille: UZ_SYMBOLS['('], print: '( )', note: n.both },
        { braille: UZ_SYMBOLS['«'], print: '«', note: n.opening },
        { braille: UZ_SYMBOLS['»'], print: '»', note: n.closing },
        { braille: UZ_SYMBOLS['—'], print: '—', note: n.dash },
        { braille: UZ_SYMBOLS['…'], print: '…', note: n.ellipsis },
        { braille: UZ_SYMBOLS['%'], print: '%', note: n.percent },
      ],
    },
  ];
}

const rule = (text: string) => GROUP_RULES.find((r) => r.text === text)!;
const fromRules = (texts: string[], note?: string): Sign[] => texts.map((x) => ({ braille: rule(x).braille, print: x, note }));

function uebSections(t: Messages['learn']): Section[] {
  const s = t.uebSections;
  const k = t.indicatorNames;
  const n = t.notes;
  return [
    {
      id: 'alphabet',
      ...s.alphabet,
      signs: Object.entries(LETTERS).map(([letter, braille]) => ({ braille, print: letter })),
    },
    {
      id: 'numbers',
      ...s.numbers,
      signs: [
        { braille: IND.numeric, print: '#', note: k.numeric },
        ...['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'].map((d) => ({ braille: toBraille(d, 1), print: d })),
        { braille: toBraille('3.5', 1), print: '3.5' },
        { braille: toBraille('1,000', 1), print: '1,000' },
      ],
    },
    {
      id: 'indicators',
      ...s.indicators,
      signs: [
        { braille: IND.capitalLetter, print: k.capitalLetter, note: k.nextLetter },
        { braille: IND.capitalWord, print: k.capitalWord, note: k.wholeWord },
        { braille: IND.capitalPassage, print: k.capitalPassage, note: k.threeWords },
        { braille: IND.capitalTerminator, print: k.terminator },
        { braille: IND.grade1Symbol, print: k.grade1, note: k.literal },
        { braille: toBraille('Anna', 1), print: 'Anna' },
        { braille: toBraille('UNESCO', 1), print: 'UNESCO' },
      ],
    },
    {
      id: 'punctuation',
      ...s.punctuation,
      signs: [
        ...[',', ';', ':', '.', '!', '?', "'", '-', '(', ')', '/', '@', '&', '%', '$'].map((ch) => ({ braille: SYMBOLS[ch], print: ch })),
        { braille: '⠦', print: '“', note: n.opening },
        { braille: '⠴', print: '”', note: n.closing },
        { braille: SYMBOLS['—'], print: '—', note: n.dash },
        { braille: SYMBOLS['…'], print: '…', note: n.ellipsis },
      ],
    },
    {
      id: 'wordsigns',
      ...s.wordsigns,
      signs: Object.entries(WORDSIGNS)
        .filter(([, braille]) => [...braille].length === 1 && Object.values(LETTERS).includes(braille))
        .map(([word, braille]) => ({ braille, print: word })),
    },
    {
      id: 'strong',
      ...s.strong,
      signs: [
        ...fromRules(['and', 'for', 'of', 'the', 'with']),
        ...fromRules(['ch', 'gh', 'sh', 'th', 'wh', 'ed', 'er', 'ou', 'ow', 'st', 'ar', 'ing']),
        ...['child', 'shall', 'this', 'which', 'out', 'still'].map((w) => ({ braille: WORDSIGNS[w], print: w, note: k.word })),
      ],
    },
    {
      id: 'lower',
      ...s.lower,
      signs: [
        ...fromRules(['be', 'con', 'dis'], k.wordStart),
        ...fromRules(['ea', 'bb', 'cc', 'ff', 'gg'], k.midWord),
        ...fromRules(['en', 'in']),
        ...Object.entries(LOWER_WORDSIGNS).map(([word, braille]) => ({ braille, print: word, note: k.alone })),
      ],
    },
    {
      id: 'initial',
      ...s.initial,
      signs: GROUP_RULES.filter((r) => r.initial).map((r) => ({ braille: r.braille, print: r.text })),
    },
    {
      id: 'final',
      ...s.final,
      signs: GROUP_RULES.filter((r) => r.position === 'notBegin' && [...r.braille].length === 2).map((r) => ({
        braille: r.braille,
        print: `-${r.text}`,
      })),
    },
    {
      id: 'shortforms',
      ...s.shortforms,
      signs: Object.entries(SHORTFORMS).map(([word, braille]) => ({ braille, print: word })),
    },
  ];
}

function SignCard({ sign, dotsPrefix }: { sign: Sign; dotsPrefix: string }) {
  const cells = [...sign.braille];
  const dots = cells.map((c) => cellToDots(c).join('')).join('-');
  return (
    <li className="flex flex-col items-center gap-2 rounded-lg border bg-card px-2 py-3 text-center">
      <span className="flex gap-1" aria-hidden="true">
        {cells.map((c, i) => (
          <BrailleCell key={i} cell={c} size={30} />
        ))}
      </span>
      <span className="text-[0.95rem] font-bold leading-tight">{sign.print}</span>
      <span className="text-[0.7rem] text-muted-foreground">
        <span className="sr-only">{dotsPrefix} </span>
        {dots}
        {sign.note && <span className="block italic">{sign.note}</span>}
      </span>
    </li>
  );
}

type QuizMode = 'uzLetters' | 'letters' | 'words';

function Practice({ system }: { system: System }) {
  const m = useMessages();
  const t = m.learn;
  const modes: QuizMode[] = system === 'uz' ? ['uzLetters'] : ['letters', 'words'];
  const [chosen, setChosen] = useState<QuizMode>(modes[0]);
  const mode = modes.includes(chosen) ? chosen : modes[0];
  const [round, setRound] = useState(0);
  const [answer, setAnswer] = useState<string | null>(null);
  const [score, setScore] = useState({ right: 0, total: 0 });

  const pool: Sign[] = useMemo(() => {
    if (mode === 'uzLetters') return UZBEK_ALPHABET.map((pair) => ({ braille: CYRILLIC_LETTERS[pair[0]], print: `${pair[0]} (${pair[1]})` }));
    if (mode === 'letters') return Object.entries(LETTERS).map(([letter, braille]) => ({ braille, print: letter }));
    return Object.entries(WORDSIGNS)
      .filter(([, braille]) => [...braille].length === 1 && Object.values(LETTERS).includes(braille))
      .map(([word, braille]) => ({ braille, print: word }));
  }, [mode]);

  const { target, options } = useMemo(() => {
    const pick = () => pool[Math.floor(Math.random() * pool.length)];
    const target = pick();
    const opts = new Set([target.print]);
    while (opts.size < 4) opts.add(pick().print);
    return { target, options: [...opts].sort(() => Math.random() - 0.5) };
    // A new question for every round.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round, pool]);

  const choose = (option: string) => {
    if (answer) return;
    setAnswer(option);
    setScore((s) => ({ right: s.right + (option === target.print ? 1 : 0), total: s.total + 1 }));
  };

  return (
    <section aria-labelledby="practice-h" className="rounded-xl border bg-card p-6 shadow-sm">
      <div className="flex flex-wrap items-center gap-3">
        <h2 id="practice-h" className="mr-auto text-xl font-bold">
          {t.practice}
        </h2>
        {modes.length > 1 && (
          <SegmentedControl
            label={t.practiceWith}
            size="sm"
            value={mode}
            onChange={(next) => {
              setChosen(next);
              setAnswer(null);
            }}
            options={modes.map((value) => ({ value, label: t.modes[value] }))}
          />
        )}
        <p className="text-[0.85rem] text-muted-foreground" aria-live="polite">
          {t.score(score.right, score.total)}
        </p>
      </div>
      <p className="mt-2 text-[0.9rem] text-muted-foreground">{t.questions[mode]}</p>
      <div className="mt-5 flex flex-col items-center gap-5 sm:flex-row sm:items-center">
        <div className="surface-braille flex size-28 shrink-0 items-center justify-center rounded-lg border">
          <BrailleCell cell={target.braille} size={80} />
          <span className="sr-only">{t.cellAria(cellToDots(target.braille))}</span>
        </div>
        <div className="grid w-full grid-cols-2 gap-2">
          {options.map((option) => {
            const isRight = option === target.print;
            const isChosen = answer === option;
            return (
              <Button
                key={option}
                variant="outline"
                onClick={() => choose(option)}
                aria-disabled={!!answer}
                className={cn(
                  'h-12 text-base',
                  answer && isRight && 'border-success bg-success/15 text-foreground',
                  isChosen && !isRight && 'border-destructive bg-destructive/10',
                )}
              >
                {option}
              </Button>
            );
          })}
        </div>
      </div>
      <div className="mt-4 flex min-h-11 items-center justify-between gap-3" aria-live="polite">
        <p className="text-[0.9rem]">
          {answer &&
            (answer === target.print ? (
              <span className="font-semibold text-success">{t.correct}</span>
            ) : (
              <span>
                {t.notQuiteA} <span className="font-semibold">&ldquo;{target.print}&rdquo;</span>.
              </span>
            ))}
        </p>
        <Button
          onClick={() => {
            setAnswer(null);
            setRound((r) => r + 1);
          }}
          variant={answer ? 'default' : 'ghost'}
        >
          <Shuffle aria-hidden="true" />
          {answer ? t.next : t.skip}
        </Button>
      </div>
    </section>
  );
}

export default function Learn() {
  const t = useMessages().learn;
  const [system, setSystem] = useLanguageChoice<System>('braillebridge:learn-system', (locale) => locale, (system) => system);
  const [query, setQuery] = useState('');
  const q = query.trim().toLowerCase();

  const sections = useMemo(() => (system === 'uz' ? uzbekSections(t) : uebSections(t)), [system, t]);
  const filtered = useMemo(
    () =>
      sections
        .map((s) => ({ ...s, signs: q ? s.signs.filter((sign) => sign.print.toLowerCase().includes(q)) : s.signs }))
        .filter((s) => s.signs.length > 0),
    [sections, q],
  );
  const total = filtered.reduce((n, s) => n + s.signs.length, 0);

  return (
    <Layout>
      <div className="container py-10">
        <PageHeader eyebrow={t.eyebrow} title={t.title} intro={t.intro} />

        <div className="mb-6">
          <SegmentedControl
            label={t.systemLabel}
            value={system}
            onChange={(next) => {
              setSystem(next);
              setQuery('');
            }}
            options={[
              { value: 'uz', label: t.systems.uz },
              { value: 'en', label: t.systems.en },
            ]}
          />
        </div>

        <Practice key={system} system={system} />

        <div className="sticky top-16 z-10 -mx-4 mt-10 bg-background/90 px-4 py-3 backdrop-blur">
          <label htmlFor="learn-search" className="sr-only">
            {t.searchLabel}
          </label>
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <input
              id="learn-search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={system === 'uz' ? t.searchPlaceholderUz : t.searchPlaceholder}
              className="h-11 w-full rounded-lg border border-input bg-card pl-10 pr-3"
            />
          </div>
          <p className="sr-only" aria-live="polite">
            {q ? t.found(total) : ''}
          </p>
        </div>

        {!q && (
          <nav aria-label={t.sectionsLabel} className="mt-4">
            <ul className="flex flex-wrap gap-2 text-[0.85rem]">
              {sections.map((s) => (
                <li key={s.id}>
                  <a href={`#${s.id}`} className="inline-block rounded-full border px-3 py-1.5 hover:bg-secondary">
                    {s.title.replace(/^(Grade 2|2-daraja): /, '')}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        )}

        {filtered.length === 0 && <p className="mt-10 text-muted-foreground">{t.none(query)}</p>}

        {filtered.map((section) => (
          <section key={section.id} id={section.id} aria-labelledby={`${section.id}-h`} className="mt-12 scroll-mt-32">
            <h2 id={`${section.id}-h`} className="text-2xl font-bold">
              {section.title}
            </h2>
            <p className="mt-2 max-w-3xl text-muted-foreground">{section.intro}</p>
            <ul className="mt-5 grid gap-3 [grid-template-columns:repeat(auto-fill,minmax(7.5rem,1fr))]">
              {section.signs.map((sign) => (
                <SignCard key={`${section.id}-${sign.print}-${sign.braille}-${sign.note ?? ''}`} sign={sign} dotsPrefix={t.dotsPrefix} />
              ))}
            </ul>
          </section>
        ))}
      </div>
    </Layout>
  );
}
