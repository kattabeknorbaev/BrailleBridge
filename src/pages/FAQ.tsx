import { Link } from 'react-router-dom';
import { Layout, PageHeader } from '@/components/layout/Layout';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const FAQS: { q: string; a: React.ReactNode }[] = [
  {
    q: 'What is the difference between grade 1 and grade 2 braille?',
    a: (
      <>
        Grade 1 (uncontracted) braille spells every word letter by letter. Grade 2 (contracted) braille also uses about
        180 contractions and short forms: &ldquo;the&rdquo; is one cell and &ldquo;knowledge&rdquo; is the single cell
        ⠅. Grade 2 is what most adult braille readers use and takes around 20–30% less space. Grade 1 is common for
        beginners and young learners.
      </>
    ),
  },
  {
    q: 'Which braille code does BrailleBridge use?',
    a: 'Unified English Braille (UEB), the standard for English braille in the United States, the United Kingdom, Canada, Australia, New Zealand, South Africa and many other countries.',
  },
  {
    q: 'Which file should I download for my embosser?',
    a: (
      <>
        Choose <strong>BRF</strong> for almost any embosser, braille notetaker or braille display: it is the standard
        braille file format. <strong>PEF</strong> is an open XML format that stores each page exactly; use it if your
        embosser software supports it. Before exporting, set <em>cells per line</em> and <em>lines per page</em> to match
        your paper. 40 × 25 is standard for 11.5 × 11 inch braille paper; check your embosser&rsquo;s settings for A4.
      </>
    ),
  },
  {
    q: 'Can I read the braille on a refreshable braille display?',
    a: 'Yes. Open the BRF file on your notetaker or braille display, or in your braille reading app. You can also copy the Unicode braille and paste it into a document.',
  },
  {
    q: 'Which files can I open?',
    a: 'Photos (JPG, PNG, WebP), PDFs (both digital and scanned), Word documents (.docx), plain text and BRF files. You can also type or paste text directly.',
  },
  {
    q: 'Is my document private?',
    a: (
      <>
        Typed text, PDFs, Word files and all translation stay in your browser. Photos and scanned PDFs are sent for text
        recognition only while cloud recognition is on; switch it to &ldquo;This device only&rdquo; in the text
        recognition settings and nothing leaves your device. See <Link to="/about">About</Link> for details.
      </>
    ),
  },
  {
    q: 'How accurate is the braille?',
    a: 'The translator matches liblouis, the braille engine used by major screen readers, on 99.9% of 7,000 test words. Text recognition from photos can make mistakes, so read through the recognised text before you export. For exams or legal documents, have the braille checked by a certified transcriber.',
  },
  {
    q: 'Can it turn braille back into print?',
    a: (
      <>
        Yes. The <Link to="/read">Read braille</Link> page back-translates Unicode braille or BRF files, and has a
        Perkins-style keyboard for typing braille with the S, D, F, J, K and L keys.
      </>
    ),
  },
  {
    q: 'Does it work offline?',
    a: 'Once the page has loaded, translation and export work without a connection. On-device text recognition downloads its English model the first time you use it.',
  },
  {
    q: 'Does it support maths, music or other languages?',
    a: 'Not yet. BrailleBridge currently handles English literary text in UEB. Maths notation and other languages are planned.',
  },
];

export default function FAQ() {
  return (
    <Layout>
      <div className="container max-w-3xl py-10">
        <PageHeader eyebrow="Help" title="Frequently asked questions" />
        <Accordion type="multiple" className="rounded-xl border bg-card px-5">
          {FAQS.map((item, i) => (
            <AccordionItem key={item.q} value={`q${i}`} className={i === FAQS.length - 1 ? 'border-b-0' : ''}>
              <AccordionTrigger headingLevel={2} className="py-5 text-left text-[1rem] font-semibold hover:no-underline">
                {item.q}
              </AccordionTrigger>
              <AccordionContent className="pb-5 text-[0.95rem] leading-relaxed text-muted-foreground">{item.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
        <p className="mt-8 text-muted-foreground">
          Another question? <Link to="/feedback" className="font-semibold text-primary underline underline-offset-4">Send feedback</Link>.
        </p>
      </div>
    </Layout>
  );
}
