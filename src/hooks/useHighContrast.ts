import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'braillebridge-high-contrast';

export function useHighContrast() {
  const [isHighContrast, setIsHighContrast] = useState(() => {
    if (typeof window === 'undefined') return false;
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === 'true';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isHighContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }
    localStorage.setItem(STORAGE_KEY, String(isHighContrast));
  }, [isHighContrast]);

  const toggleHighContrast = useCallback(() => {
    setIsHighContrast(prev => !prev);
  }, []);

  return { isHighContrast, toggleHighContrast, setIsHighContrast };
}
