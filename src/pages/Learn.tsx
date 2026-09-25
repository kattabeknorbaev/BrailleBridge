import { useMemo, useState } from 'react';
import { Search, Shuffle } from 'lucide-react';
import { Layout, PageHeader } from '@/components/layout/Layout';
import { BrailleCell } from '@/components/braille/BrailleCell';
import { Button } from '@/components/ui/button';
import { SegmentedControl } from '@/components/SegmentedControl';
import { cellToDots, toBraille } from '@/lib/braille';
import {
  GROUP_RULES,
  IND,
  LETTERS,
  LOWER_WORDSIGNS,
  SHORTFORMS,
  SYMBOLS,
  WORDSIGNS,
} from '@/lib/braille/ueb-tables';
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

const rule = (text: string) => GROUP_RULES.find((r) => r.text === text)!;
const fromRules = (texts: string[], note?: string): Sign[] =>
  texts.map((t) => ({ braille: rule(t).braille, print: t, note }));

const SECTIONS: Section[] = [
  {
    id: 'alphabet',
    title: 'The alphabet',
    intro:
      'Each letter is a pattern in a six-dot cell. The first ten letters (a–j) use only the top four dots; k–t add dot 3; u–z add dots 3 and 6 (w is the exception).',
    signs: Object.entries(LETTERS).map(([letter, braille]) => ({ braille, print: letter })),
  },
  {
    id: 'numbers',
    title: 'Numbers',
    intro: 'The numeric indicator ⠼ turns the letters a–j into the digits 1–0 until a space or another symbol ends the number.',
    signs: [
      { braille: IND.numeric, print: 'numeric indicator' },
      ...['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'].map((n) => ({ braille: toBraille(n, 1), print: n })),
      { braille: toBraille('3.5', 1), print: '3.5' },
      { braille: toBraille('1,000', 1), print: '1,000' },
    ],
  },
  {
    id: 'indicators',
    title: 'Capitals and indicators',
    intro: 'Braille has no separate capital letters. Indicators placed before a letter or word change how it is read.',
    signs: [
      { braille: IND.capitalLetter, print: 'capital letter', note: 'next letter' },
      { braille: IND.capitalWord, print: 'capital word', note: 'whole word' },
      { braille: IND.capitalPassage, print: 'capitals passage', note: '3+ words' },
      { braille: IND.capitalTerminator, print: 'capitals terminator' },
      { braille: IND.grade1Symbol, print: 'grade 1 indicator', note: 'read literally' },
      { braille: toBraille('Anna', 1), print: 'Anna' },
      { braille: toBraille('UNESCO', 1), print: 'UNESCO' },
    ],
  },
  {
    id: 'punctuation',
    title: 'Punctuation',
    intro: 'Common punctuation. Several marks share a cell with a contraction; position in the word tells them apart.',
    signs: [
      ...[',', ';', ':', '.', '!', '?', "'", '-', '(', ')', '/', '@', '&', '%', '$'].map((ch) => ({
        braille: SYMBOLS[ch],
        print: ch,
      })),
      { braille: '⠦', print: '“', note: 'opening quote' },
      { braille: '⠴', print: '”', note: 'closing quote' },
      { braille: SYMBOLS['—'], print: '—', note: 'dash' },
      { braille: SYMBOLS['…'], print: '…', note: 'ellipsis' },
    ],
  },
  {
    id: 'wordsigns',
    title: 'Grade 2: one-letter words',
    intro: 'In grade 2, a letter standing alone is a whole word. "b" alone means "but"; to write just the letter b, add the grade 1 indicator: ⠰⠃.',
    signs: Object.entries(WORDSIGNS)
      .filter(([, braille]) => [...braille].length === 1 && Object.values(LETTERS).includes(braille))
      .map(([word, braille]) => ({ braille, print: word })),
  },
  {
    id: 'strong',
    title: 'Grade 2: strong contractions',
    intro: 'Cells that stand for common words and letter groups. "the", "and", "for", "of" and "with" can also appear inside words: "other" = ⠕⠮⠗.',
    signs: [
      ...fromRules(['and', 'for', 'of', 'the', 'with']),
      ...fromRules(['ch', 'gh', 'sh', 'th', 'wh', 'ed', 'er', 'ou', 'ow', 'st', 'ar', 'ing']),
      ...['child', 'shall', 'this', 'which', 'out', 'still'].map((w) => ({ braille: WORDSIGNS[w], print: w, note: 'word' })),
    ],
  },
  {
    id: 'lower',
    title: 'Grade 2: lower signs',
    intro: 'Signs written in the bottom of the cell. Their meaning depends on position: ⠆ is "be" at the start of a word, "bb" in the middle and ";" at the end.',
    signs: [
      ...fromRules(['be', 'con', 'dis'], 'word start'),
      ...fromRules(['ea', 'bb', 'cc', 'ff', 'gg'], 'mid-word'),
      ...fromRules(['en', 'in']),
      ...Object.entries(LOWER_WORDSIGNS).map(([word, braille]) => ({ braille, print: word, note: 'alone' })),
    ],
  },
  {
    id: 'initial',
    title: 'Grade 2: initial-letter contractions',
    intro: 'Dots 5, 4-5 or 4-5-6 before the first letter of a word: ⠐⠞ is "time", also used inside "sometimes" = ⠐⠎⠐⠞⠎.',
    signs: GROUP_RULES.filter((r) => r.initial).map((r) => ({ braille: r.braille, print: r.text })),
  },
  {
    id: 'final',
    title: 'Grade 2: final-letter groupsigns',
    intro: 'Dots 4-6 or 5-6 before the last letter of a common ending. Never used at the start of a word.',
    signs: GROUP_RULES.filter((r) => r.position === 'notBegin' && [...r.braille].length === 2).map((r) => ({
      braille: r.braille,
      print: `-${r.text}`,
    })),
  },
  {
    id: 'shortforms',
    title: 'Grade 2: shortforms',
    intro: 'The 75 abbreviated words of UEB, such as ⠁⠃ for "about" and ⠟⠅ for "quick".',
    signs: Object.entries(SHORTFORMS).map(([word, braille]) => ({ braille, print: word })),
  },
];

function SignCard({ sign }: { sign: Sign }) {
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
        <span className="sr-only">dots </span>
        {dots}
        {sign.note && <span className="block italic">{sign.note}</span>}
      </span>
    </li>
  );
}

const QUIZ = {
  letters: { pool: SECTIONS[0].signs, question: 'Which letter is this?' },
  words: { pool: SECTIONS[4].signs, question: 'In grade 2, what word does this cell mean when it stands alone?' },
};
type QuizMode = keyof typeof QUIZ;

function Practice() {
  const [mode, setMode] = useState<QuizMode>('letters');
  const [round, setRound] = useState(0);
  const [answer, setAnswer] = useState<string | null>(null);
  const [score, setScore] = useState({ right: 0, total: 0 });

  const { target, options } = useMemo(() => {
    const pool = QUIZ[mode].pool;
    const pick = () => pool[Math.floor(Math.random() * pool.length)];
    const t = pick();
    const opts = new Set([t.print]);
    while (opts.size < 4) opts.add(pick().print);
    return { target: t, options: [...opts].sort(() => Math.random() - 0.5) };
    // A new question for every round.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round, mode]);

  const choose = (option: string) => {
    if (answer) return;
    setAnswer(option);
    setScore((s) => ({ right: s.right + (option === target.print ? 1 : 0), total: s.total + 1 }));
  };

  return (
    <section aria-labelledby="practice-h" className="rounded-xl border bg-card p-6 shadow-sm">
      <div className="flex flex-wrap items-center gap-3">
        <h2 id="practice-h" className="mr-auto text-xl font-bold">
          Practice
        </h2>
        <SegmentedControl
          label="Practice with"
          size="sm"
          value={mode}
          onChange={(m) => {
            setMode(m);
            setAnswer(null);
          }}
          options={[
            { value: 'letters', label: 'Letters' },
            { value: 'words', label: 'Grade 2 words' },
          ]}
        />
        <p className="text-[0.85rem] text-muted-foreground" aria-live="polite">
          Score: {score.right} / {score.total}
        </p>
      </div>
      <p className="mt-2 text-[0.9rem] text-muted-foreground">{QUIZ[mode].question}</p>
      <div className="mt-5 flex flex-col items-center gap-5 sm:flex-row sm:items-center">
        <div className="surface-braille flex size-28 shrink-0 items-center justify-center rounded-lg border">
          <BrailleCell cell={target.braille} size={80} />
          <span className="sr-only">Braille cell with dots {cellToDots(target.braille).join(' ')}</span>
        </div>
        <div className="grid w-full grid-cols-2 gap-2">
          {options.map((option) => {
            const isRight = option === target.print;
            const chosen = answer === option;
            return (
              <Button
                key={option}
                variant="outline"
                onClick={() => choose(option)}
                aria-disabled={!!answer}
                className={cn(
                  'h-12 text-base',
                  answer && isRight && 'border-success bg-success/15 text-foreground',
                  chosen && !isRight && 'border-destructive bg-destructive/10',
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
              <span className="font-semibold text-success">Correct!</span>
            ) : (
              <span>
                Not quite — it&rsquo;s <span className="font-semibold">&ldquo;{target.print}&rdquo;</span>.
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
          {answer ? 'Next' : 'Skip'}
        </Button>
      </div>
    </section>
  );
}

export default function Learn() {
  const [query, setQuery] = useState('');
  const q = query.trim().toLowerCase();
  const filtered = useMemo(
    () =>
      SECTIONS.map((s) => ({
        ...s,
        signs: q ? s.signs.filter((sign) => sign.print.toLowerCase().includes(q)) : s.signs,
      })).filter((s) => s.signs.length > 0),
    [q],
  );
  const total = filtered.reduce((n, s) => n + s.signs.length, 0);

  return (
    <Layout>
      <div className="container py-10">
        <PageHeader
          eyebrow="Reference"
          title="Learn Unified English Braille"
          intro="Every sign BrailleBridge uses, drawn from the same tables as the translator. Search for a letter, word or contraction."
        />

        <Practice />

        <div className="sticky top-16 z-10 -mx-4 mt-10 bg-background/90 px-4 py-3 backdrop-blur">
          <label htmlFor="learn-search" className="sr-only">
            Search signs
          </label>
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <input
              id="learn-search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search, e.g. “the”, “ing”, “because”"
              className="h-11 w-full rounded-lg border border-input bg-card pl-10 pr-3"
            />
          </div>
          <p className="sr-only" aria-live="polite">
            {q ? `${total} signs found` : ''}
          </p>
        </div>

        {!q && (
          <nav aria-label="Sections" className="mt-4">
            <ul className="flex flex-wrap gap-2 text-[0.85rem]">
              {SECTIONS.map((s) => (
                <li key={s.id}>
                  <a href={`#${s.id}`} className="inline-block rounded-full border px-3 py-1.5 hover:bg-secondary">
                    {s.title.replace('Grade 2: ', '')}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        )}

        {filtered.length === 0 && <p className="mt-10 text-muted-foreground">No signs match &ldquo;{query}&rdquo;.</p>}

        {filtered.map((section) => (
          <section key={section.id} id={section.id} aria-labelledby={`${section.id}-h`} className="mt-12 scroll-mt-32">
            <h2 id={`${section.id}-h`} className="text-2xl font-bold">
              {section.title}
            </h2>
            <p className="mt-2 max-w-3xl text-muted-foreground">{section.intro}</p>
            <ul className="mt-5 grid gap-3 [grid-template-columns:repeat(auto-fill,minmax(7.5rem,1fr))]">
              {section.signs.map((sign) => (
                <SignCard key={`${section.id}-${sign.print}-${sign.braille}-${sign.note ?? ''}`} sign={sign} />
              ))}
            </ul>
          </section>
        ))}
      </div>
    </Layout>
  );
}
