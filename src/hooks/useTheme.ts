import { useState, useEffect, useCallback } from 'react';

export type ThemeMode = 'dark' | 'light' | 'high-contrast';

const STORAGE_KEY = 'braillebridge-theme';

export function useTheme() {
  const [theme, setTheme] = useState<ThemeMode>(() => {
    if (typeof window === 'undefined') return 'dark';
    const stored = sessionStorage.getItem(STORAGE_KEY) as ThemeMode;
    return stored || 'dark';
  });

  useEffect(() => {
    const root = document.documentElement;
    
    // Remove all theme classes
    root.classList.remove('dark', 'light', 'high-contrast');
    
    // Add current theme class
    root.classList.add(theme);
    
    // Persist to session storage
    sessionStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  const setThemeMode = useCallback((newTheme: ThemeMode) => {
    setTheme(newTheme);
  }, []);

  const cycleTheme = useCallback(() => {
    setTheme(current => {
      const order: ThemeMode[] = ['dark', 'light', 'high-contrast'];
      const currentIndex = order.indexOf(current);
      return order[(currentIndex + 1) % order.length];
    });
  }, []);

  return { theme, setTheme: setThemeMode, cycleTheme };
}
