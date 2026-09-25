import { useCallback, useSyncExternalStore } from 'react';
import type { Grade } from '@/lib/braille';

export interface HistoryEntry {
  id: string;
  title: string;
  date: string;
  grade: Grade;
  format: 'brf' | 'pef' | 'txt' | 'print' | 'copy';
  /** The source text, so a past document can be reopened (kept on this device only). */
  text: string;
}

const STORAGE_KEY = 'braillebridge:history';
const MAX_ENTRIES = 12;
const MAX_TEXT = 60_000;

const listeners = new Set<() => void>();
let cache: HistoryEntry[] | null = null;

function load(): HistoryEntry[] {
  if (cache) return cache;
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
    cache = Array.isArray(parsed) ? parsed.filter((e) => e && typeof e.text === 'string') : [];
  } catch {
    cache = [];
  }
  return cache;
}

function save(entries: HistoryEntry[]) {
  cache = entries;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // Storage full: drop the oldest half and try once more.
    try {
      cache = entries.slice(0, Math.ceil(entries.length / 2));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
    } catch {
      // Give up silently; history is a convenience.
    }
  }
  listeners.forEach((l) => l());
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

/** Recent exports, stored only in this browser. */
export function useConversionHistory() {
  const history = useSyncExternalStore(subscribe, load, () => [] as HistoryEntry[]);

  const addEntry = useCallback((entry: Omit<HistoryEntry, 'id' | 'date'>) => {
    const id = globalThis.crypto?.randomUUID?.() ?? String(Date.now());
    const next: HistoryEntry = { ...entry, text: entry.text.slice(0, MAX_TEXT), id, date: new Date().toISOString() };
    // Re-exporting the same document replaces its previous entry.
    const rest = load().filter((e) => e.text !== next.text);
    save([next, ...rest].slice(0, MAX_ENTRIES));
  }, []);

  const removeEntry = useCallback((id: string) => save(load().filter((e) => e.id !== id)), []);
  const clearHistory = useCallback(() => save([]), []);

  return { history, addEntry, removeEntry, clearHistory };
}
