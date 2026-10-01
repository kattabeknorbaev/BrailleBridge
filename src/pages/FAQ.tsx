import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Layout, PageHeader } from '@/components/layout/Layout';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useLocale, type Locale } from '@/i18n';

type Faq = { q: string; a: ReactNode };

const FAQS_EN: Faq[] = [
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
    q: 'Which braille codes does BrailleBridge use?',
    a: 'Unified English Braille (UEB), the standard for English braille in the United States, the United Kingdom, Canada, Australia, New Zealand, South Africa and many other countries, and Uzbek braille, which is used in Uzbekistan.',
  },
  {
    q: 'Can it translate Uzbek?',
    a: (
      <>
        Yes, in both the Latin and the Cyrillic alphabet. Uzbek braille is based on Russian braille with four extra
        letters (ғ, қ, ў, ҳ) and is written letter by letter, without contractions. Latin letters use the cell of the
        matching Cyrillic letter, so <span lang="uz">Oʻzbekiston</span> and <span lang="uz-Cyrl">Ўзбекистон</span> give the
        same braille. Choose <strong>Uzbek</strong> as the braille code on the Convert page, or switch the interface to
        Oʻzbekcha with the language menu.
      </>
    ),
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
    a: 'The English translator matches liblouis, the braille engine used by major screen readers, on 99.9% of 7,000 test words, and the Uzbek translator matches the liblouis Uzbek table on every test sentence and word. Text recognition from photos can make mistakes, so read through the recognised text before you export. For exams or legal documents, have the braille checked by a certified transcriber.',
  },
  {
    q: 'Can it turn braille back into print?',
    a: (
      <>
        Yes. The <Link to="/read">Read braille</Link> page back-translates Unicode braille or BRF files in English or
        Uzbek (Latin or Cyrillic), and has a Perkins-style keyboard for typing braille with the S, D, F, J, K and L keys.
      </>
    ),
  },
  {
    q: 'Does it work offline?',
    a: 'Once the page has loaded, translation and export work without a connection. On-device text recognition downloads its language model the first time you use it.',
  },
  {
    q: 'Does it support maths, music or other languages?',
    a: 'Not yet. BrailleBridge currently handles literary text in English (UEB) and Uzbek. Maths notation and other languages are planned.',
  },
];

const FAQS_UZ: Faq[] = [
  {
    q: 'Oʻzbek brayli qanday tuzilgan?',
    a: (
      <>
        Oʻzbek Brayl alifbosi rus Brayl yozuviga asoslangan va unga toʻrtta harf qoʻshilgan: ғ, қ, ў va ҳ. Matn
        qisqartmasiz, harfma-harf yoziladi: har bir harf — bitta katak. Raqamlar oldidan raqam belgisi ⠼ qoʻyiladi. Barcha
        harflar va belgilarni <Link to="/learn">Oʻrganish</Link> sahifasida koʻrish mumkin.
      </>
    ),
  },
  {
    q: 'Lotin yozuvidagi matnni ham oʻgira oladimi?',
    a: (
      <>
        Ha. Lotin harflari mos kirill harfining katagi bilan yoziladi: q → қ, oʻ → ў, gʻ → ғ, sh → ш, ch → ч. Shuning
        uchun «Oʻzbekiston» va «Ўзбекистон» bir xil Brayl yozuvini beradi. «ya», «yu», «yo» va «e» ni kirill Brayl
        kitoblaridagidek yozish kerak boʻlsa, sozlamalarda <strong>«Kirillga oʻgirib»</strong> variantini tanlang.
      </>
    ),
  },
  {
    q: 'Bosh harflar belgilanadimi?',
    a: 'Odatda yoʻq: oʻzbek va rus Brayl matnlarida bosh harflar koʻpincha belgilanmaydi. Kerak boʻlsa, «Bosh harflarni belgilash» sozlamasini yoqing — har bir bosh harf oldidan 6-nuqta (⠠), butunlay bosh harflar bilan yozilgan soʻz oldidan esa ikkita ⠠ qoʻyiladi.',
  },
  {
    q: 'Brayl printeri uchun qaysi faylni yuklab olish kerak?',
    a: (
      <>
        Deyarli barcha Brayl printerlari, Brayl qurilmalari va displeylari uchun <strong>BRF</strong> faylini tanlang. Fayl
        harflarni emas, Brayl kataklarini saqlaydi, shuning uchun printerda Shimoliy Amerika (NABCC) Brayl jadvalini
        tanlang. <strong>PEF</strong> — har bir sahifani aniq saqlaydigan ochiq XML formati, printeringiz dasturi uni
        qoʻllab-quvvatlasa, undan foydalaning. Saqlashdan oldin <em>qatordagi kataklar</em> va <em>sahifadagi qatorlar</em>{' '}
        sonini qogʻozingizga moslang.
      </>
    ),
  },
  {
    q: 'Brayl displeyida oʻqish mumkinmi?',
    a: 'Ha. BRF faylini Brayl qurilmangiz yoki displeyingizda, yoxud Brayl oʻqish dasturida oching. Unicode Brayl matnidan nusxa olib, istalgan hujjatga joylashtirish ham mumkin.',
  },
  {
    q: 'Qaysi fayllarni ochish mumkin?',
    a: 'Suratlar (JPG, PNG, WebP), PDF (raqamli va skanerlangan), Word hujjatlari (.docx), oddiy matn va BRF fayllari. Matnni toʻgʻridan-toʻgʻri yozish yoki joylashtirish ham mumkin. Oʻzbek tili tanlanganda suratlardagi lotin va kirill matni aniqlanadi.',
  },
  {
    q: 'Hujjatlarim maxfiy saqlanadimi?',
    a: (
      <>
        Yozilgan matn, PDF, Word fayllari va butun oʻgirish jarayoni brauzeringizda qoladi. Surat va skanerlangan PDF
        fayllar faqat bulutli aniqlash yoqilgan boʻlsa yuboriladi; matnni aniqlash sozlamalarida «Faqat shu qurilmada»
        variantini tanlasangiz, hech narsa qurilmangizdan chiqmaydi. Batafsil — <Link to="/about">Loyiha haqida</Link>{' '}
        sahifasida.
      </>
    ),
  },
  {
    q: 'Brayl yozuvi qanchalik aniq?',
    a: 'Oʻzbek oʻgiruvchisi ekran oʻquvchi dasturlar ishlatadigan liblouis tizimining oʻzbek jadvali bilan barcha test gaplari va soʻzlarida bir xil natija beradi. Suratlardan matnni aniqlashda xatolar boʻlishi mumkin, shuning uchun saqlashdan oldin matnni oʻqib chiqing. Imtihon va rasmiy hujjatlar uchun Brayl matnini mutaxassis tekshirgani maʼqul.',
  },
  {
    q: 'Brayl yozuvini oddiy matnga qaytarish mumkinmi?',
    a: (
      <>
        Ha. <Link to="/read">Braylni oʻqish</Link> sahifasi Unicode Brayl matni yoki BRF faylini lotin yoki kirill yozuvidagi
        oʻzbek matniga qaytaradi. U yerda S, D, F, J, K va L tugmalari bilan Brayl yozish uchun Perkins klaviaturasi ham
        bor.
      </>
    ),
  },
  {
    q: 'Internetsiz ishlaydimi?',
    a: 'Sahifa yuklangandan keyin oʻgirish va saqlash internetsiz ishlaydi. Qurilmadagi matn aniqlash birinchi marta ishlatilganda til modelini yuklab oladi.',
  },
  {
    q: 'Ingliz tilini ham qoʻllab-quvvatlaydimi?',
    a: 'Ha. Ingliz tili uchun xalqaro Unified English Braille (UEB) standarti ishlatiladi: 1-daraja (harfma-harf) va 2-daraja (qisqartmalar bilan).',
  },
  {
    q: 'Matematika, nota yozuvi yoki boshqa tillar bormi?',
    a: 'Hozircha yoʻq. BrailleBridge hozir oʻzbek va ingliz tilidagi oddiy matnlarni oʻgiradi. Matematik belgilar va boshqa tillar rejada bor.',
  },
];

const FAQS: Record<Locale, Faq[]> = { en: FAQS_EN, uz: FAQS_UZ };

const TEXT = {
  en: { eyebrow: 'Help', title: 'Frequently asked questions', more: 'Another question?', send: 'Send feedback' },
  uz: { eyebrow: 'Yordam', title: 'Koʻp beriladigan savollar', more: 'Boshqa savolingiz bormi?', send: 'Bizga yozing' },
};

export default function FAQ() {
  const locale = useLocale();
  const faqs = FAQS[locale];
  const t = TEXT[locale];
  return (
    <Layout>
      <div className="container max-w-3xl py-10">
        <PageHeader eyebrow={t.eyebrow} title={t.title} />
        <Accordion key={locale} type="multiple" className="rounded-xl border bg-card px-5">
          {faqs.map((item, i) => (
            <AccordionItem key={item.q} value={`q${i}`} className={i === faqs.length - 1 ? 'border-b-0' : ''}>
              <AccordionTrigger headingLevel={2} className="py-5 text-left text-[1rem] font-semibold hover:no-underline">
                {item.q}
              </AccordionTrigger>
              <AccordionContent className="pb-5 text-[0.95rem] leading-relaxed text-muted-foreground">{item.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
        <p className="mt-8 text-muted-foreground">
          {t.more}{' '}
          <Link to="/feedback" className="font-semibold text-primary underline underline-offset-4">
            {t.send}
          </Link>
          .
        </p>
      </div>
    </Layout>
  );
}
