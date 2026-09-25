import { Link } from 'react-router-dom';
import { FileText, Languages, Printer } from 'lucide-react';
import { Layout, PageHeader, REPO_URL } from '@/components/layout/Layout';
import { toBraille } from '@/lib/braille';

const STEPS = [
  {
    icon: FileText,
    title: 'Get the text',
    body: 'Typed and pasted text is used as-is. Digital PDFs and Word files are read directly in your browser. Photos and scanned pages go through text recognition: a cloud vision model by default, or Tesseract running on your own device if you prefer privacy or the cloud is unavailable. Page-layout line breaks are joined back into paragraphs, and you can edit everything before exporting.',
  },
  {
    icon: Languages,
    title: 'Translate to braille',
    body: 'A rule-based Unified English Braille translator marks capitals (letters, words and whole passages), numbers, punctuation and accents. In grade 2 it applies the rules for where each of the 180+ contractions may be used, then picks the combination that uses the fewest cells, the way experienced transcribers do.',
  },
  {
    icon: Printer,
    title: 'Format and export',
    body: 'Text is laid out on braille pages (40 cells × 25 lines by default) with paragraph indents and braille page numbers, then saved as BRF for embossers and notetakers, PEF (an open embosser format), Unicode braille, or an interline print copy for sighted teachers.',
  },
];

export default function About() {
  const example = 'Knowledge is power.';
  return (
    <Layout>
      <article className="container max-w-3xl py-10">
        <PageHeader
          eyebrow="About"
          title="Why BrailleBridge exists"
          intro="Most printed material never becomes braille. Transcription software is expensive and hard to use with a screen reader, and many teachers, parents and braille readers just need a worksheet, letter or menu in braille today."
        />

        <div className="prose-page">
          <p>
            BrailleBridge is a free, open-source tool that turns print into braille in the browser. It is built for blind
            and low-vision readers, for teachers of visually impaired students, and for anyone who needs to produce braille
            without specialist software.
          </p>

          <div className="not-prose my-8 rounded-xl border bg-card p-5">
            <p className="text-[0.85rem] font-semibold text-muted-foreground">The same sentence, three ways</p>
            <dl className="mt-3 space-y-3">
              <div>
                <dt className="text-[0.8rem] text-muted-foreground">Print</dt>
                <dd className="text-lg">{example}</dd>
              </div>
              <div>
                <dt className="text-[0.8rem] text-muted-foreground">Grade 1 (every letter spelled out)</dt>
                <dd className="braille-text text-[1.6rem]">{toBraille(example, 1)}</dd>
              </div>
              <div>
                <dt className="text-[0.8rem] text-muted-foreground">Grade 2 (contracted, used by most adult readers)</dt>
                <dd className="braille-text text-[1.6rem]">{toBraille(example, 2)}</dd>
              </div>
            </dl>
          </div>

          <h2>How it works</h2>
        </div>

        <ol className="mt-4 space-y-4">
          {STEPS.map(({ icon: Icon, title, body }, i) => (
            <li key={title} className="flex gap-4 rounded-xl border bg-card p-5">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Icon className="size-5" aria-hidden="true" />
              </span>
              <div>
                <h3 className="font-bold">
                  {i + 1}. {title}
                </h3>
                <p className="mt-1 text-muted-foreground">{body}</p>
              </div>
            </li>
          ))}
        </ol>

        <div className="prose-page">
          <h2>How accurate is it?</h2>
          <p>
            The translator is tested against <a href="https://liblouis.io">liblouis</a>, the open-source braille
            translator used by screen readers such as NVDA and JAWS. On a test set of 7,000 common English words from
            public-domain books, BrailleBridge produces the same grade 2 braille for 99.9% of them, and the same grade 1
            braille for all of them. Every difference is reviewed and documented in the source code, and the whole test
            set runs automatically on every change.
          </p>
          <p>
            Text recognition is less certain than translation: photos can be misread. Always check the recognised text
            before you emboss, and use a certified transcriber for exams, legal documents and anything where every
            character matters.
          </p>

          <h2>Current limitations</h2>
          <ul>
            <li>English only (Unified English Braille). Other languages and codes are not supported yet.</li>
            <li>No mathematics or science notation, music braille or tactile graphics.</li>
            <li>Tables and multi-column layouts are read as plain text.</li>
            <li>Bold, italics and headings are not marked in braille yet.</li>
            <li>
              A small number of words need a transcriber&rsquo;s judgement (for example compound words where a contraction
              should not bridge the two parts). Known cases are handled with an exception list.
            </li>
          </ul>

          <h2>Privacy</h2>
          <p>
            Typing, translation, PDF and Word import, and exporting all happen in your browser; nothing is uploaded. Only
            photos and scanned PDFs are sent to the cloud for text recognition, and only when cloud recognition is turned
            on (it can be switched to on-device in the text recognition settings). Recent documents are saved in your
            browser only and can be cleared at any time. The site counts page visits with Vercel Analytics and Google
            Analytics; these never see the text of your documents.
          </p>

          <h2>Who made this</h2>
          <p>
            BrailleBridge is built by Kattabek Norbaev as an open-source, non-commercial project. The code, including the
            translation rules and tests, is on <a href={REPO_URL}>GitHub</a>. Suggestions and corrections from braille
            readers and transcribers are very welcome through the <Link to="/feedback">feedback form</Link>.
          </p>
        </div>
      </article>
    </Layout>
  );
}
