import { Fragment, useSyncExternalStore, type ReactNode } from 'react';
import { en, type Messages } from './en';
import { uz } from './uz';

export type Locale = 'en' | 'uz';

export const LOCALES: { value: Locale; label: string; htmlLang: string }[] = [
  { value: 'uz', label: 'Oʻzbekcha', htmlLang: 'uz-Latn' },
  { value: 'en', label: 'English', htmlLang: 'en' },
];

const MESSAGES: Record<Locale, Messages> = { en, uz };
const STORAGE_KEY = 'braillebridge:locale';
const listeners = new Set<() => void>();

function initialLocale(): Locale {
  if (typeof window === 'undefined') return 'en';
  // A shared link (?lang=uz) wins, then the saved choice, then the browser language.
  const fromUrl = new URLSearchParams(window.location.search).get('lang');
  if (fromUrl === 'uz' || fromUrl === 'en') {
    try {
      localStorage.setItem(STORAGE_KEY, fromUrl);
    } catch {
      // ignore
    }
    return fromUrl;
  }
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'uz' || saved === 'en') return saved;
  } catch {
    // ignore
  }
  return navigator.languages?.some((l) => l.toLowerCase().startsWith('uz')) ? 'uz' : 'en';
}

let current: Locale = initialLocale();

/** Keep <html lang> in sync so screen readers switch to the right voice. */
export function applyLocale(locale: Locale = current) {
  document.documentElement.lang = LOCALES.find((l) => l.value === locale)!.htmlLang;
}

export function getLocale(): Locale {
  return current;
}

export function setLocale(locale: Locale) {
  current = locale;
  try {
    localStorage.setItem(STORAGE_KEY, locale);
  } catch {
    // ignore
  }
  applyLocale(locale);
  listeners.forEach((l) => l());
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

export function useLocale(): Locale {
  return useSyncExternalStore(subscribe, () => current, () => 'en' as Locale);
}

/** The message catalogue for the current interface language. */
export function useMessages(): Messages {
  return MESSAGES[useLocale()];
}

export function messagesFor(locale: Locale): Messages {
  return MESSAGES[locale];
}

/**
 * Fill {placeholders} in a translated sentence with React nodes, so links
 * and emphasis can sit inside translated text: rich('See {faq}.', { faq: <Link/> }).
 */
export function rich(text: string, parts: Record<string, ReactNode>): ReactNode {
  return text.split(/(\{\w+\})/).map((piece, i) => {
    const key = piece.match(/^\{(\w+)\}$/)?.[1];
    return <Fragment key={i}>{key && key in parts ? parts[key] : piece}</Fragment>;
  });
}

export type { Messages };
