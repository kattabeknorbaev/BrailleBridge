/**
 * Guess whether a text is English or Uzbek, so the converter can warn when
 * the chosen braille code does not fit the text. Returns null when unsure.
 */

const APOSTROPHE = /['`‘’ʻʼ]/g;

const ENGLISH_WORDS = new Set(
  'the and of to is in that it for you with are this was be on as have not or by from at an will can your we they he she his her has had were which their there what all would about been'.split(
    ' ',
  ),
);

const UZBEK_WORDS = new Set(
  "va bu bilan uchun ham emas edi bor yo'q men sen biz siz ular bir har eng juda keyin oldin lekin ammo yoki chunki agar kerak mumkin bo'ladi bo'lib qilib deb shu bizning sizning o'z yil kuni soat qanday nima kim".split(
    ' ',
  ),
);

export type TextLanguage = 'en' | 'uz';

export function detectLanguage(text: string): TextLanguage | null {
  const sample = text.slice(0, 4000);
  const cyrillic = sample.match(/[Ѐ-ӿ]/g)?.length ?? 0;
  const latin = sample.match(/[a-z]/gi)?.length ?? 0;
  // Uzbek is the only Cyrillic-script language BrailleBridge translates.
  if (cyrillic >= 3 && cyrillic > latin) return 'uz';

  let en = 0;
  let uz = 0;
  for (const raw of sample.toLowerCase().replace(APOSTROPHE, "'").match(/[a-z']+/g) ?? []) {
    const word = raw.replace(/^'+|'+$/g, '');
    if (ENGLISH_WORDS.has(word)) en++;
    else if (UZBEK_WORDS.has(word)) uz++;
    // oʻ, gʻ and a q not followed by u are typical of Uzbek Latin.
    else if (/[og]'/.test(word) || /q(?!u)/.test(word)) uz++;
  }
  if (uz >= 2 && uz > en * 2) return 'uz';
  if (en >= 2 && en > uz * 2) return 'en';
  return null;
}
