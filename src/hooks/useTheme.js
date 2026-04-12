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
    ...Colors.dark,
    background: isAmoled ? '#000000' : Colors.dark.background,
    surface: isAmoled ? '#0D0D0D' : Colors.dark.surface,
    surfaceVariant: isAmoled ? '#161618' : Colors.dark.surfaceVariant,
    surfaceElevated: isAmoled ? '#1A1A1C' : Colors.dark.surfaceElevated,
  } : {
    ...Colors,
  };

  return (
    <ThemeContext.Provider value={{ colors, isDark, themeKey, setTheme, loaded }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
