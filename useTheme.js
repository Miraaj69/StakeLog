// useTheme.js — M3 Expressive theme provider
// Supports: light · dark · amoled · auto
import { useState, useEffect, useContext, createContext } from 'react';
import { useColorScheme } from 'react-native';
import { getItem, setItem, KEYS } from './storage';
import { Colors, Shadows, Motion, Tonal, Radius, Spacing, Typography } from './theme';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const systemScheme = useColorScheme();
  const [themeKey, setThemeKey] = useState('auto');

  useEffect(() => {
    getItem(KEYS.THEME, 'auto').then(t => setThemeKey(t));
  }, []);

  const setTheme = async (key) => {
    setThemeKey(key);
    await setItem(KEYS.THEME, key);
  };

  const isDark = themeKey === 'amoled' || themeKey === 'dark' ||
    (themeKey === 'auto' && systemScheme === 'dark');
  const isAmoled = themeKey === 'amoled';

  // ── Merge light / dark tokens ────────────────────────────────
  const colors = isDark ? {
    ...Colors,
    ...Colors.dark,
    // AMOLED overrides — true black surfaces
    background:        isAmoled ? '#000000'  : Colors.dark.background,
    surface:           isAmoled ? '#0A0A0F'  : Colors.dark.surface,
    surfaceVariant:    isAmoled ? '#131320'  : Colors.dark.surfaceVariant,
    surfaceElevated:   isAmoled ? '#161624'  : Colors.dark.surfaceElevated,
    surfaceContainer:  isAmoled ? '#0F0F1C'  : Colors.dark.surfaceContainer,
    surfaceContainerHigh: isAmoled ? '#1A1A2A' : Colors.dark.surfaceContainerHigh,
  } : {
    ...Colors,
    // Light mode surface aliases
    surfaceContainer:    Colors.surfaceContainer || Colors.surfaceVariant,
    surfaceContainerHigh: Colors.border,
    outline:             Colors.outline || Colors.border,
  };

  // ── Convenience helpers exposed to all screens ────────────────
  const value = {
    colors,
    isDark,
    isAmoled,
    themeKey,
    setTheme,

    // Design tokens — screens can pull these directly
    shadows: Shadows,
    motion:  Motion,
    tonal:   Tonal,
    radius:  Radius,
    spacing: Spacing,
    typography: Typography,

    // Quick semantic colors — always correct for current theme
    profit:  isDark ? Colors.dark.profit  : Colors.profit,
    loss:    isDark ? Colors.dark.loss    : Colors.loss,
    pending: isDark ? Colors.dark.pending : Colors.pending,
    primary: Colors.primary,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
