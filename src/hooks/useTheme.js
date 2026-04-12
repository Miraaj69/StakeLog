// hooks/useTheme.js
import { useState, useEffect, useContext, createContext } from 'react';
import { useColorScheme } from 'react-native';
import { getItem, setItem, KEYS } from '../utils/storage';
import { Colors } from '../utils/theme';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const systemScheme = useColorScheme();
  const [themeKey, setThemeKey] = useState('auto');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    getItem(KEYS.THEME, 'auto').then(t => { setThemeKey(t); setLoaded(true); });
  }, []);

  const setTheme = async (key) => {
    setThemeKey(key);
    await setItem(KEYS.THEME, key);
  };

  const isDark = themeKey === 'amoled' || themeKey === 'dark' ||
    (themeKey === 'auto' && systemScheme === 'dark');

  const isAmoled = themeKey === 'amoled';

  const colors = isDark ? {
    ...Colors,
    background: isAmoled ? '#000000' : Colors.dark.background,
    surface: isAmoled ? '#0D0808' : Colors.dark.surface,
    surfaceVariant: isAmoled ? '#150E0E' : Colors.dark.surfaceVariant,
    surfaceElevated: isAmoled ? '#1C1212' : Colors.dark.surfaceElevated,
    border: Colors.dark.border,
    borderLight: Colors.dark.borderLight,
    textPrimary: Colors.dark.textPrimary,
    textSecondary: Colors.dark.textSecondary,
    textTertiary: Colors.dark.textTertiary,
    profit: Colors.dark.profit,
    profitContainer: Colors.dark.profitContainer,
    loss: Colors.dark.loss,
    lossContainer: Colors.dark.lossContainer,
    primaryContainer: Colors.dark.primaryContainer,
  } : Colors;

  return (
    <ThemeContext.Provider value={{ colors, isDark, themeKey, setTheme, loaded }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
