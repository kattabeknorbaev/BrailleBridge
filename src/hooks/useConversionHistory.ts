import { useState, useEffect, useCallback } from 'react';
import type { BrailleGrade } from '@/lib/braille';

export interface ConversionEntry {
  id: string;
  fileName: string;
  date: string;
  grade: BrailleGrade;
  format: 'brf' | 'dxp' | 'unicode';
}

const STORAGE_KEY = 'braillebridge-history';
const MAX_ENTRIES = 5;

export function useConversionHistory() {
  const [history, setHistory] = useState<ConversionEntry[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    } catch {
      // Storage full or unavailable
    }
  }, [history]);

  const addEntry = useCallback((entry: Omit<ConversionEntry, 'id' | 'date'>) => {
    const newEntry: ConversionEntry = {
      ...entry,
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
    };

    setHistory(prev => {
      const updated = [newEntry, ...prev].slice(0, MAX_ENTRIES);
      return updated;
    });
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return { history, addEntry, clearHistory };
}
