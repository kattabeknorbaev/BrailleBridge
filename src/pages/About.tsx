import { Link } from 'react-router-dom';
import { FileText, Languages, Printer } from 'lucide-react';
import { Layout, PageHeader, REPO_URL } from '@/components/layout/Layout';
import { toBraille, toUzbekBraille } from '@/lib/braille';
import { useLocale } from '@/i18n';

function Steps({ steps }: { steps: { title: string; body: string }[] }) {
  const icons = [FileText, Languages, Printer];
  return (
    <ol className="mt-4 space-y-4">
      {steps.map(({ title, body }, i) => {
        const Icon = icons[i];
        return (
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
        );
      })}
    </ol>
  );
}

function Example({ caption, rows }: { caption: string; rows: { label: string; value: string; braille?: boolean; lang?: string }[] }) {
  return (
    <div className="my-8 rounded-xl border bg-card p-5">
      <p className="text-[0.85rem] font-semibold text-muted-foreground">{caption}</p>
      <dl className="mt-3 space-y-3">
        {rows.map((row) => (
          <div key={row.label}>
            <dt className="text-[0.8rem] text-muted-foreground">{row.label}</dt>
            <dd className={row.braille ? 'braille-text text-[1.6rem]' : 'text-lg'} lang={row.lang}>
              {row.value}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function AboutEn() {
  const example = 'Knowledge is power.';
  return (
    <>
      <PageHeader
        eyebrow="About"
        title="Why BrailleBridge exists"
        intro="Most printed material never becomes braille. Transcription software is expensive and hard to use with a screen reader, and many teachers, parents and braille readers just need a worksheet, letter or menu in braille today."
      />
      <div className="prose-page">
        <p>
          BrailleBridge is a free, open-source tool that turns print into braille in the browser. It is built for blind and
          low-vision readers, for teachers of visually impaired students, and for anyone who needs to produce braille without
          specialist software. It supports Unified English Braille and Uzbek braille.
        </p>
      </div>
      <Example
        caption="The same sentence, three ways"
        rows={[
          { label: 'Print', value: example },
          { label: 'Grade 1 (every letter spelled out)', value: toBraille(example, 1), braille: true },
          { label: 'Grade 2 (contracted, used by most adult readers)', value: toBraille(example, 2), braille: true },
        ]}
      />
      <div className="prose-page">
        <h2>How it works</h2>
      </div>
      <Steps
        steps={[
          {
            title: 'Get the text',
            body: 'Typed and pasted text is used as-is. Digital PDFs and Word files are read directly in your browser. Photos and scanned pages go through text recognition: a cloud vision model by default, or Tesseract running on your own device if you prefer privacy or the cloud is unavailable. Page-layout line breaks are joined back into paragraphs, and you can edit everything before exporting.',
          },
          {
            title: 'Translate to braille',
            body: 'A rule-based Unified English Braille translator marks capitals, numbers, punctuation and accents. In grade 2 it applies the rules for where each of the 180+ contractions may be used, then picks the combination that uses the fewest cells, the way experienced transcribers do. Uzbek text is translated letter by letter with the Uzbek braille alphabet.',
          },
          {
            title: 'Format and export',
            body: 'Text is laid out on braille pages (40 cells × 25 lines by default) with paragraph indents and braille page numbers, then saved as BRF for embossers and notetakers, PEF (an open embosser format), Unicode braille, or an interline print copy for sighted teachers.',
          },
        ]}
      />
      <div className="prose-page">
        <h2>Uzbek braille</h2>
        <p>
          Uzbek braille is based on Russian (Cyrillic) braille, with four extra letters: ғ, қ, ў and ҳ. BrailleBridge
          translates Uzbek written in either alphabet. Latin letters use the cell of the matching Cyrillic letter (q = қ, oʻ =
          ў, sh = ш), so <span lang="uz">Oʻzbekiston</span> and <span lang="uz-Cyrl">Ўзбекистон</span> give the same braille.
          Latin text can also be converted to Cyrillic first, to match Cyrillic braille books.
        </p>
        <p>
          The translator was checked against the Uzbek table of liblouis 3.39 on 90 sentences and 356 words: the results are
          identical for every Cyrillic item and every Latin item, apart from a liblouis bug that adds a capital sign only to
          words starting with I, V, X, L, C, D or M. BrailleBridge also understands the official oʻ and gʻ apostrophe (ʻ),
          which liblouis does not. Whether capital letters are marked, and how Latin “ya”, “yo” and “yu” are written, are
          settings, so they can follow the practice of the Uzbekistan Society of the Blind.
        </p>

        <h2>How accurate is it?</h2>
        <p>
          The translator is tested against <a href="https://liblouis.io">liblouis</a>, the open-source braille translator used
          by screen readers such as NVDA and JAWS. On 7,000 common English words from public-domain books, BrailleBridge
          produces the same grade 2 braille for 99.9% of them, and the same grade 1 braille for all of them. Every difference is
          reviewed and documented, and the tests run automatically on every change.
        </p>
        <p>
          Text recognition is less certain than translation: photos can be misread. Always check the recognised text before you
          emboss, and use a certified transcriber for exams, legal documents and anything where every character matters.
        </p>

        <h2>Current limitations</h2>
        <ul>
          <li>English (Unified English Braille) and Uzbek only. Other languages are not supported yet.</li>
          <li>No mathematics or science notation, music braille or tactile graphics.</li>
          <li>Tables and multi-column layouts are read as plain text, and bold, italics and headings are not marked yet.</li>
          <li>
            A small number of English words need a transcriber’s judgement (for example compound words). Known cases are handled
            with an exception list.
          </li>
        </ul>

        <h2>Privacy</h2>
        <p>
          Typing, translation, PDF and Word import, and exporting all happen in your browser; nothing is uploaded. Only photos
          and scanned PDFs are sent to the cloud for text recognition, and only when cloud recognition is turned on. Recent
          documents are saved in your browser only and can be cleared at any time. The site counts page visits with Vercel
          Analytics and Google Analytics; these never see the text of your documents.
        </p>

        <h2>Who made this</h2>
        <p>
          BrailleBridge is built by Kattabek Norbaev as an open-source, non-commercial project. The code, including the
          translation rules and tests, is on <a href={REPO_URL}>GitHub</a>. Suggestions and corrections from braille readers and
          transcribers are very welcome through the <Link to="/feedback">feedback form</Link>.
        </p>
      </div>
    </>
  );
}

function AboutUz() {
  const example = 'Bilim — kuch.';
  return (
    <>
      <PageHeader
        eyebrow="Loyiha haqida"
        title="BrailleBridge nima uchun yaratildi"
        intro="Bosma materiallarning aksariyati hech qachon Brayl yozuviga oʻgirilmaydi. Maxsus dasturlar qimmat va ekran oʻquvchi bilan foydalanish qiyin, holbuki koʻplab oʻqituvchilar, ota-onalar va Brayl yozuvidan foydalanuvchilarga bugunoq bir varaq topshiriq, xat yoki eʼlon kerak boʻladi."
      />
      <div className="prose-page">
        <p>
          BrailleBridge — matnni brauzerning oʻzida Brayl yozuviga oʻgiradigan bepul va ochiq kodli vosita. U koʻzi ojiz va
          zaif koʻruvchi insonlar, ularga dars beradigan oʻqituvchilar hamda maxsus dasturlarsiz Brayl matni tayyorlashi kerak
          boʻlgan har bir kishi uchun yaratilgan. Oʻzbek va ingliz (UEB) Brayl yozuvlarini qoʻllab-quvvatlaydi.
        </p>
      </div>
      <Example
        caption="Bitta gap — ikki alifboda"
        rows={[
          { label: 'Lotin yozuvi', value: example, lang: 'uz' },
          { label: 'Kirill yozuvi', value: 'Билим — куч.', lang: 'uz-Cyrl' },
          { label: 'Oʻzbek brayli (ikkalasi uchun bir xil)', value: toUzbekBraille(example), braille: true },
        ]}
      />
      <div className="prose-page">
        <h2>Qanday ishlaydi</h2>
      </div>
      <Steps
        steps={[
          {
            title: 'Matnni olish',
            body: 'Yozilgan yoki joylashtirilgan matn oʻz holicha ishlatiladi. Raqamli PDF va Word fayllari brauzerning oʻzida oʻqiladi. Surat va skanerlangan sahifalardagi matn aniqlanadi: odatda bulutli sunʼiy intellekt yordamida, maxfiylik kerak boʻlsa yoki bulut ishlamasa — qurilmaning oʻzidagi Tesseract yordamida (oʻzbek tilining lotin va kirill yozuvlari bilan). Sahifa tuzilishidagi qator boʻlinishlari xatboshilarga birlashtiriladi, saqlashdan oldin hammasini tahrirlash mumkin.',
          },
          {
            title: 'Brayl yozuviga oʻgirish',
            body: 'Oʻzbek matni oʻzbek Brayl alifbosi asosida harfma-harf oʻgiriladi: raqamlar, tinish belgilari va rus brayliga xos boʻsh joy qoidalari bilan. Ingliz matni uchun qoidalarga asoslangan UEB tarjimoni ishlaydi: 2-darajada 180 dan ortiq qisqartmaning qaysi oʻrinda ishlatilishi mumkinligini tekshirib, eng kam katak talab qiladigan variantni tanlaydi.',
          },
          {
            title: 'Sahifalash va saqlash',
            body: 'Matn Brayl sahifalariga joylashtiriladi (odatda 40 katak × 25 qator), xatboshi chekinishi va sahifa raqamlari bilan. Soʻng Brayl printerlari va qurilmalari uchun BRF, ochiq PEF formati, Unicode Brayl yoki koʻruvchi oʻqituvchilar uchun matn bilan parallel chop etiladigan nusxa sifatida saqlanadi.',
          },
        ]}
      />
      <div className="prose-page">
        <h2>Oʻzbek brayli</h2>
        <p>
          Oʻzbek brayli rus (kirill) brayliga asoslangan va unga toʻrtta harf qoʻshilgan: ғ, қ, ў va ҳ. BrailleBridge oʻzbek
          matnini ikkala alifboda ham oʻgiradi. Lotin harflari mos kirill harfining katagi bilan yoziladi (q = қ, oʻ = ў, sh =
          ш), shuning uchun «Oʻzbekiston» va «Ўзбекистон» bir xil Brayl yozuvini beradi. Lotin matnini kirill Brayl kitoblariga
          moslab, avval kirillga oʻgirib yozish ham mumkin.
        </p>
        <p>
          Oʻgiruvchi liblouis 3.39 ning oʻzbek jadvali bilan 90 ta gap va 356 ta soʻzda tekshirildi: barcha kirill matnlarda
          natija bir xil, lotin matnlarda ham bir xil — faqat liblouis dagi bir xatoni hisobga olmaganda (u I, V, X, L, C, D
          yoki M bilan boshlanadigan soʻzlargagina bosh harf belgisini qoʻyadi). BrailleBridge rasmiy oʻ va gʻ belgisini (ʻ)
          ham toʻgʻri tushunadi, liblouis esa tushunmaydi. Bosh harflarni belgilash va lotin «ya», «yo», «yu» ning yozilishi
          sozlamalar orqali tanlanadi — ularni Oʻzbekiston koʻzi ojizlar jamiyati amaliyotiga moslash mumkin.
        </p>

        <h2>Qanchalik aniq?</h2>
        <p>
          Ingliz tilidagi oʻgiruvchi NVDA va JAWS kabi ekran oʻquvchi dasturlar ishlatadigan ochiq kodli{' '}
          <a href="https://liblouis.io">liblouis</a> bilan solishtiriladi: ommaviy kitoblardagi 7 000 ta soʻzning 99,9 foizida
          2-darajali Brayl yozuvi bir xil, 1-darajada esa hammasi bir xil. Har bir farq tekshirilgan va hujjatlashtirilgan,
          testlar har bir oʻzgarishda avtomatik ishga tushadi.
        </p>
        <p>
          Matnni aniqlash oʻgirishdan koʻra kamroq ishonchli: suratdagi soʻzlar notoʻgʻri oʻqilishi mumkin. Chop etishdan oldin
          aniqlangan matnni albatta tekshiring. Imtihon, rasmiy hujjatlar kabi har bir belgi muhim boʻlgan materiallarni
          malakali mutaxassis tekshirgani maʼqul.
        </p>

        <h2>Hozirgi cheklovlar</h2>
        <ul>
          <li>Faqat oʻzbek va ingliz (UEB) tillari. Boshqa tillar hozircha qoʻllab-quvvatlanmaydi.</li>
          <li>Matematik va ilmiy belgilar, nota yozuvi va boʻrtma rasmlar yoʻq.</li>
          <li>Jadval va koʻp ustunli matnlar oddiy matn sifatida oʻqiladi; qalin, kursiv va sarlavhalar hozircha belgilanmaydi.</li>
        </ul>

        <h2>Maxfiylik</h2>
        <p>
          Yozish, oʻgirish, PDF va Word fayllarini ochish hamda saqlash brauzerning oʻzida bajariladi — hech narsa yuklanmaydi.
          Faqat surat va skanerlangan PDF fayllar, bulutli aniqlash yoqilgan boʻlsa, matnni aniqlash uchun yuboriladi. Oxirgi
          hujjatlar faqat sizning brauzeringizda saqlanadi va istalgan vaqtda oʻchirilishi mumkin. Sayt tashriflar sonini
          Vercel Analytics va Google Analytics yordamida hisoblaydi; ular hujjatlaringiz matnini koʻrmaydi.
        </p>

        <h2>Muallif</h2>
        <p>
          BrailleBridge ni Kattabek Norbaev ochiq kodli, notijorat loyiha sifatida yaratgan. Kod, jumladan oʻgirish qoidalari va
          testlar <a href={REPO_URL}>GitHub</a> da joylashgan. Brayl yozuvidan foydalanuvchilar va mutaxassislarning
          takliflari <Link to="/feedback">fikr bildirish shakli</Link> orqali mamnuniyat bilan qabul qilinadi.
        </p>
      </div>
    </>
  );
}

export default function About() {
  const locale = useLocale();
  return (
    <Layout>
      <article className="container max-w-3xl py-10">{locale === 'uz' ? <AboutUz /> : <AboutEn />}</article>
    </Layout>
  );
}
