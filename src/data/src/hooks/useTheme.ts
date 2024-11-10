import { useState, useEffect } from 'react';
import { APP_CONFIG } from '../config/app.config';

type ThemeType = 'light' | 'dark' | 'darker' | 'sepia';

export function useTheme() {
  const [theme, setTheme] = useState<ThemeType>(() => {
    const saved = localStorage.getItem(APP_CONFIG.cacheKeys.theme);
    return (saved as ThemeType) || 'darker';
  });

  useEffect(() => {
    localStorage.setItem(APP_CONFIG.cacheKeys.theme, theme);
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  return { theme, setTheme };
}