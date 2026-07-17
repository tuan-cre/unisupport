import { useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window === 'undefined') return 'light';
    const stored = localStorage.getItem('unisupport-theme') as Theme | null;
    return stored ?? 'light';
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('unisupport-theme', theme);
  }, [theme]);

  const toggle = () => setThemeState((prev) => (prev === 'light' ? 'dark' : 'light'));

  return { theme, toggle };
}
