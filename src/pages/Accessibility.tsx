import { Link } from 'react-router-dom';
import { Layout, PageHeader } from '@/components/layout/Layout';
import { useLocale } from '@/i18n';

function AccessibilityEn() {
  return (
    <>
      <PageHeader
        eyebrow="Accessibility statement"
        title="Built to be used without sight"
        intro="BrailleBridge is made for blind and low-vision people, so it has to work with a keyboard, a screen reader and a magnifier. We aim to meet WCAG 2.2 level AA."
      />
      <div className="prose-page">
        <h2>What we do</h2>
        <ul>
          <li>Every control works with the keyboard, with a visible focus outline and a &ldquo;Skip to main content&rdquo; link.</li>
          <li>Pages use headings, landmarks and labelled regions; buttons and fields have descriptive names.</li>
          <li>
            Progress and results (file import, export, errors) are announced to screen readers, and optional sound cues mark
            key events. Sounds can be turned off with the speaker button in the header.
          </li>
          <li>
            Light, dark and high-contrast (black, white and yellow) themes. By default the site follows your device&rsquo;s dark
            mode and increased-contrast settings.
          </li>
          <li>
            Text is set in Atkinson Hyperlegible, a typeface designed by the Braille Institute for low-vision readers, at
            18&nbsp;px by default. Pages reflow when zoomed to 400%.
          </li>
          <li>
            Main buttons are 44 pixels tall and every control meets the WCAG 2.2 minimum target size. Animation is turned off
            when you ask your system to reduce motion.
          </li>
          <li>
            Braille is never shown only as a picture: every cell is also available as text, and the Learn page lists the dots
            of every sign.
          </li>
          <li>
            The interface is available in English and Uzbek. The page language is set for each, so screen readers switch to
            the right voice.
          </li>
        </ul>

        <h2>Using BrailleBridge with a screen reader</h2>
        <p>
          On the Convert page, the print text editor comes first, followed by the braille code, the preview and the export
          buttons. The braille preview is mainly for sighted users; the exported BRF file is what your braille display or
          embosser uses. On the Read braille page, the Perkins keyboard area captures the S, D, F, J, K and L keys while it
          has focus, so you may need to switch your screen reader to focus or forms mode.
        </p>

        <h2>Known limitations</h2>
        <ul>
          <li>The dot and page previews are visual; their content is available to screen readers as braille text instead.</li>
          <li>Text recognised from photos may contain mistakes, which are easier to spot visually.</li>
        </ul>

        <h2>Tell us about a problem</h2>
        <p>
          If something is hard to use with your setup, please <Link to="/feedback">send feedback</Link> and mention your
          browser and assistive technology. Accessibility problems are treated as bugs.
        </p>
      </div>
    </>
  );
}

function AccessibilityUz() {
  return (
    <>
      <PageHeader
        eyebrow="Foydalanish qulayligi"
        title="Koʻrmasdan foydalanish uchun yaratilgan"
        intro="BrailleBridge koʻzi ojiz va zaif koʻruvchi insonlar uchun yaratilgan, shuning uchun u klaviatura, ekran oʻquvchi dastur va ekran kattalashtirgich bilan ishlashi shart. Biz WCAG 2.2 AA darajasiga javob berishga intilamiz."
      />
      <div className="prose-page">
        <h2>Nimalar qilingan</h2>
        <ul>
          <li>Barcha boshqaruv elementlari klaviatura bilan ishlaydi, fokus aniq koʻrinadi, «Asosiy mazmunga oʻtish» havolasi bor.</li>
          <li>Sahifalarda sarlavhalar, belgilangan hududlar ishlatilgan; tugma va maydonlarning aniq nomlari bor.</li>
          <li>
            Jarayon va natijalar (fayl ochish, saqlash, xatolar) ekran oʻquvchi dasturga eʼlon qilinadi, muhim hodisalar
            ixtiyoriy tovush signallari bilan bildiriladi. Tovushlarni sarlavhadagi karnay tugmasi bilan oʻchirish mumkin.
          </li>
          <li>
            Yorugʻ, qorongʻi va yuqori kontrastli (qora, oq va sariq) mavzular. Odatda sayt qurilmangizdagi qorongʻi rejim va
            kontrast sozlamalariga moslashadi.
          </li>
          <li>
            Matn zaif koʻruvchilar uchun Braille Institute tomonidan yaratilgan Atkinson Hyperlegible shriftida, odatda
            18&nbsp;px oʻlchamda. Sahifalar 400% gacha kattalashtirilganda ham toʻgʻri joylashadi.
          </li>
          <li>
            Asosiy tugmalar 44 piksel balandlikda, barcha elementlar WCAG 2.2 talab qilgan minimal oʻlchamga ega. Tizimda
            harakatni kamaytirish yoqilgan boʻlsa, animatsiyalar oʻchiriladi.
          </li>
          <li>
            Brayl yozuvi hech qachon faqat rasm sifatida koʻrsatilmaydi: har bir katak matn sifatida ham mavjud, Oʻrganish
            sahifasida esa har bir belgining nuqtalari yozilgan.
          </li>
          <li>
            Interfeys oʻzbek va ingliz tillarida. Har bir til uchun sahifa tili koʻrsatilgan, shuning uchun ekran oʻquvchi
            dasturlar mos ovozga oʻtadi.
          </li>
        </ul>

        <h2>Ekran oʻquvchi dastur bilan ishlash</h2>
        <p>
          Oʻgirish sahifasida avval matn muharriri, keyin Brayl tizimi, koʻrinish va saqlash tugmalari keladi. Brayl
          koʻrinishi asosan koʻruvchilar uchun; Brayl displeyi yoki printeringiz saqlangan BRF faylidan foydalanadi. Braylni
          oʻqish sahifasidagi Perkins klaviaturasi fokusda boʻlganda S, D, F, J, K va L tugmalarini egallaydi, shuning uchun
          ekran oʻquvchi dasturni fokus yoki shakllar rejimiga oʻtkazish kerak boʻlishi mumkin.
        </p>

        <h2>Maʼlum cheklovlar</h2>
        <ul>
          <li>Nuqtalar va sahifalar koʻrinishi vizual; ularning mazmuni ekran oʻquvchi uchun Brayl matni sifatida mavjud.</li>
          <li>Suratlardan aniqlangan matnda xatolar boʻlishi mumkin, ularni koʻz bilan topish osonroq.</li>
        </ul>

        <h2>Muammo haqida xabar bering</h2>
        <p>
          Agar biror narsadan foydalanish qiyin boʻlsa, iltimos, <Link to="/feedback">bizga yozing</Link> va brauzeringiz
          hamda yordamchi texnologiyangizni koʻrsating. Foydalanish qulayligi bilan bogʻliq muammolar xato sifatida koʻrib
          chiqiladi.
        </p>
      </div>
    </>
  );
}

export default function Accessibility() {
  const locale = useLocale();
  return (
    <Layout>
      <article className="container max-w-3xl py-10">{locale === 'uz' ? <AccessibilityUz /> : <AccessibilityEn />}</article>
    </Layout>
  );
}
