import { useEffect, useSyncExternalStore } from 'react';

export type ThemePreference = 'system' | 'light' | 'dark' | 'high-contrast';
export type ResolvedTheme = 'light' | 'dark' | 'high-contrast';

const STORAGE_KEY = 'braillebridge:theme';
const listeners = new Set<() => void>();

function readPreference(): ThemePreference {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'light' || stored === 'dark' || stored === 'high-contrast' || stored === 'system') return stored;
  } catch {
    // ignore
  }
  return 'system';
}

let preference: ThemePreference = typeof window === 'undefined' ? 'system' : readPreference();

export function resolveTheme(pref: ThemePreference): ResolvedTheme {
  if (pref !== 'system') return pref;
  if (window.matchMedia('(prefers-contrast: more)').matches || window.matchMedia('(forced-colors: active)').matches) {
    return 'high-contrast';
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

const THEME_COLORS: Record<ResolvedTheme, string> = {
  light: '#f9f8f4',
  dark: '#0d111a',
  'high-contrast': '#000000',
};

/** Apply the theme class to <html> (also done by an inline script before first paint). */
export function applyTheme(pref: ThemePreference) {
  const resolved = resolveTheme(pref);
  const root = document.documentElement;
  root.classList.remove('light', 'dark', 'high-contrast');
  root.classList.add(resolved);
  // Tailwind's dark: variants also apply in high contrast (both are dark backgrounds).
  if (resolved === 'high-contrast') root.classList.add('dark');
  root.style.colorScheme = resolved === 'light' ? 'light' : 'dark';
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLORS[resolved]);
}

function setPreference(next: ThemePreference) {
  preference = next;
  try {
    localStorage.setItem(STORAGE_KEY, next);
  } catch {
    // ignore
  }
  applyTheme(next);
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useTheme() {
  const pref = useSyncExternalStore(subscribe, () => preference);

  // Follow system changes while the preference is "system".
  useEffect(() => {
    if (pref !== 'system') return;
    const queries = ['(prefers-color-scheme: dark)', '(prefers-contrast: more)'].map((q) => window.matchMedia(q));
    const onChange = () => applyTheme('system');
    queries.forEach((q) => q.addEventListener('change', onChange));
    return () => queries.forEach((q) => q.removeEventListener('change', onChange));
  }, [pref]);

  return { preference: pref, resolved: resolveTheme(pref), setPreference };
}
