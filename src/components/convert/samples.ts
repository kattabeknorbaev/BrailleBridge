import type { BrailleCode } from '@/lib/braille';

export interface Sample {
  id: string;
  title: string;
  text: string;
  /** The braille code that suits the sample. */
  code: BrailleCode;
}

/** Short sample texts that show off different parts of each braille code. */
export const SAMPLES: Sample[] = [
  {
    id: 'uz-notice',
    code: 'uz',
    title: 'Maktab eʼloni',
    text: `Hurmatli ota-onalar va oʻquvchilar!

Fan oyligi 14-mart, juma kuni soat 10:30 dan 14:00 gacha maktab zalida boʻlib oʻtadi. Loyihalaringizni ertalab soat 9 gacha olib keling. Har bir sinf qatnashadi, eng yaxshi 3 ta loyiha shahar muzeyiga sayohat bilan taqdirlanadi!

Savollar boʻlsa: +998 71 123-45-67.`,
  },
  {
    id: 'uz-recipe',
    code: 'uz',
    title: 'Palov retsepti',
    text: `Toshkent palovi (6 kishilik)

• 1 kg guruch
• 1 kg goʻsht
• 1 kg sabzi
• 2 ta piyoz, 1 bosh sarimsoq va zira

Qozonda yogʻni qizdiring, goʻsht va piyozni qovuring. Sabzini qoʻshib, 15–20 daqiqa dimlang. Soʻng guruchni solib, suv quying va past olovda 40 daqiqa pishiring. Yoqimli ishtaha!`,
  },
  {
    id: 'uz-proverbs',
    code: 'uz',
    title: 'Maqollar',
    text: `Ilm olish — igna bilan quduq qazish.
Yetti oʻlchab, bir kes.
Bugungi ishni ertaga qoldirma.
Oz-oz oʻrganib dono boʻlur, qatra-qatra yigʻilib daryo boʻlur.
Avval oʻyla, keyin soʻyla.`,
  },
  {
    id: 'uz-cyrillic',
    code: 'uz',
    title: 'Кирилл ёзувида',
    text: `Ўзбекистон — гўзал юрт.
Тошкентда метро, боғлар ва кутубхоналар кўп. Ҳар йили 21-мартда Наврўз байрами нишонланади.`,
  },
  {
    id: 'notice',
    code: 'ueb2',
    title: 'School notice',
    text: `Dear parents and students,

The Science Fair will take place on Friday, March 14th, from 10:30am to 2pm in the main hall. Please bring your project by 9am. Every class will present, and the top 3 projects win a trip to the city museum!

Questions? Email science@school.org or call 555-0142.`,
  },
  {
    id: 'recipe',
    code: 'ueb2',
    title: 'Recipe',
    text: `Simple Pancakes (serves 4)

• 1½ cups flour
• 2 eggs
• 1¼ cups milk
• 1 tablespoon sugar and a pinch of salt

Whisk everything together until smooth. Cook each pancake on a hot pan for 2–3 minutes per side, until golden. Enjoy them with fruit or honey.`,
  },
  {
    id: 'alice',
    code: 'ueb2',
    title: 'Alice in Wonderland',
    text: `CHAPTER I. Down the Rabbit-Hole

Alice was beginning to get very tired of sitting by her sister on the bank, and of having nothing to do: once or twice she had peeped into the book her sister was reading, but it had no pictures or conversations in it, “and what is the use of a book,” thought Alice “without pictures or conversations?”`,
  },
];
