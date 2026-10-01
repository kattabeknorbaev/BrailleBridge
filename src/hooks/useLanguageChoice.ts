import { useCallback } from 'react';
import { getLocale, useLocale, type Locale } from '@/i18n';
import { usePersistentState } from './usePersistentState';

interface Stored<T> {
  value: T;
  /** The interface language when the value was chosen. */
  locale: Locale;
}

/**
 * A saved choice tied to a language, such as the braille code. When the
 * interface language changes and the saved value is for another language, it
 * falls back to the default for the new language. A value chosen on purpose
 * in the current language is kept.
 */
export function useLanguageChoice<T>(
  key: string,
  defaultFor: (locale: Locale) => T,
  languageOf: (value: T) => Locale,
) {
  const locale = useLocale();
  const [stored, setStored] = usePersistentState<Stored<T> | null>(key, null);
  const valid = stored && typeof stored === 'object' && 'value' in stored ? stored : null;
  const value =
    valid && (valid.locale === locale || languageOf(valid.value) === locale) ? valid.value : defaultFor(locale);
  const setValue = useCallback((next: T) => setStored({ value: next, locale: getLocale() }), [setStored]);
  return [value, setValue] as const;
}
