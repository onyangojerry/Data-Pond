import { createContext, useContext, useEffect, useState } from 'react';

const THEME_KEY = 'data-pond-theme';
const ThemeContext = createContext(null);

export const THEMES = [
  { value: 'classic', label: 'Classic' },
  { value: 'dark', label: 'Dark' },
  { value: 'terminal', label: 'Brew Terminal' }
];

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => localStorage.getItem(THEME_KEY) || 'classic');

  useEffect(() => {
    document.body.dataset.theme = theme;
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}
