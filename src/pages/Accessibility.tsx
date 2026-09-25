import { Link } from 'react-router-dom';
import { Layout, PageHeader } from '@/components/layout/Layout';

export default function Accessibility() {
  return (
    <Layout>
      <article className="container max-w-3xl py-10">
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
              Progress and results (file import, export, errors) are announced to screen readers, and optional sound cues
              mark key events. Sounds can be turned off with the speaker button in the header.
            </li>
            <li>
              Light, dark and high-contrast (black, white and yellow) themes. By default the site follows your device&rsquo;s
              dark mode and increased-contrast settings.
            </li>
            <li>
              Text is set in Atkinson Hyperlegible, a typeface designed by the Braille Institute for low-vision readers, at
              18&nbsp;px by default. Pages reflow when zoomed to 400%.
            </li>
            <li>
              Main buttons are 44 pixels tall and every control meets the WCAG 2.2 minimum target size. Animation is turned
              off when you ask your system to reduce motion.
            </li>
            <li>
              Braille is never shown only as a picture: every cell is also available as text, and the Learn page lists the
              dots of every sign.
            </li>
          </ul>

          <h2>Using BrailleBridge with a screen reader</h2>
          <p>
            On the Convert page, the print text editor comes first, followed by the braille grade, the preview and the export
            buttons. The braille preview is mainly for sighted users; the exported BRF file is what your braille display or
            embosser uses. On the Read braille page, the Perkins keyboard area captures the S, D, F, J, K and L keys while
            it has focus, so you may need to switch your screen reader to focus or forms mode.
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
      </article>
    </Layout>
  );
}
