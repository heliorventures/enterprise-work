import { createContext, ReactNode, useContext, useMemo, useState } from 'react';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { buildTheme } from './theme';

const KEY = 'wmp-theme';
const ThemeModeContext = createContext({ mode: 'light' as 'light' | 'dark', toggle: () => {} });
export const useThemeMode = () => useContext(ThemeModeContext);

export function AppThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<'light' | 'dark'>(
    () => (localStorage.getItem(KEY) as 'light' | 'dark') || 'light',
  );
  const theme = useMemo(() => buildTheme(mode), [mode]);
  const toggle = () => {
    const next = mode === 'light' ? 'dark' : 'light';
    localStorage.setItem(KEY, next);
    setMode(next);
  };
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <ThemeModeContext.Provider value={{ mode, toggle }}>{children}</ThemeModeContext.Provider>
    </ThemeProvider>
  );
}
