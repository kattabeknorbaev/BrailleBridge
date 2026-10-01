/**
 * The braille codes BrailleBridge supports, behind one interface so the
 * converter, reader and exports do not need to know which one is active.
 */
import { backTranslate } from './back';
import { translate, type TranslationResult } from './ueb';
import { backTranslateUzbek, type UzbekScript } from './uzbek/back';
import { DEFAULT_UZBEK_OPTIONS, translateUzbek, type UzbekOptions } from './uzbek/uzbek';

export type BrailleCode = 'ueb2' | 'ueb1' | 'uz';

export const BRAILLE_CODES: BrailleCode[] = ['ueb2', 'ueb1', 'uz'];

/** BCP 47 language of the source text, for PEF metadata. */
export const CODE_LANGUAGE: Record<BrailleCode, 'en' | 'uz'> = { ueb2: 'en', ueb1: 'en', uz: 'uz' };

export function isContracted(code: BrailleCode): boolean {
  return code === 'ueb2';
}

export function translateWith(code: BrailleCode, text: string, uzbek: UzbekOptions = DEFAULT_UZBEK_OPTIONS): TranslationResult {
  if (code === 'uz') return translateUzbek(text, uzbek);
  return translate(text, { grade: code === 'ueb1' ? 1 : 2 });
}

export function backTranslateWith(code: BrailleCode, braille: string, script: UzbekScript = 'latin'): string {
  if (code === 'uz') return backTranslateUzbek(braille, script);
  return backTranslate(braille, code === 'ueb1' ? 1 : 2);
}
