// utils/theme.js — Premium Design System v2

export const Colors = {
  // Brand
  primary: '#E50914',
  primaryLight: '#FF2D20',
  primaryDark: '#B0000A',
  primaryContainer: 'rgba(229,9,20,0.12)',
  primaryBorder: 'rgba(229,9,20,0.25)',

  // Semantic — Light Mode
  profit: '#1DB954',
  profitAlt: '#34C759',
  profitContainer: 'rgba(29,185,84,0.10)',
  profitBorder: 'rgba(29,185,84,0.25)',
  loss: '#FF3B30',
  lossAlt: '#FF453A',
  lossContainer: 'rgba(255,59,48,0.10)',
  lossBorder: 'rgba(255,59,48,0.25)',
  pending: '#FF9F0A',
  pendingContainer: 'rgba(255,159,10,0.10)',
  pendingBorder: 'rgba(255,159,10,0.25)',
  void: '#8E8E93',
  voidContainer: 'rgba(142,142,147,0.10)',
  voidBorder: 'rgba(142,142,147,0.2)',

  // Light surfaces
  background: '#F2F2F7',
  surface: '#FFFFFF',
  surfaceVariant: '#F8F8FA',
  surfaceElevated: '#FFFFFF',
  surfaceOverlay: 'rgba(255,255,255,0.85)',
  border: 'rgba(0,0,0,0.08)',
  borderLight: 'rgba(0,0,0,0.05)',

  // Light text
  textPrimary: '#0A0A0A',
  textSecondary: '#3C3C43',
  textTertiary: '#8E8E93',
  textQuaternary: '#AEAEB2',
  textInverse: '#FFFFFF',

  // Dark theme
  dark: {
    background: '#0A0A0A',
    surface: '#141414',
    surfaceVariant: '#1C1C1E',
    surfaceElevated: '#1E1E20',
    surfaceOverlay: 'rgba(20,20,20,0.92)',
    border: 'rgba(255,255,255,0.08)',
    borderLight: 'rgba(255,255,255,0.05)',
    textPrimary: '#F5F5F7',
    textSecondary: 'rgba(235,235,245,0.6)',
    textTertiary: 'rgba(235,235,245,0.3)',
    textQuaternary: 'rgba(235,235,245,0.18)',
    profit: '#32D74B',
    profitAlt: '#34C759',
    profitContainer: 'rgba(50,215,75,0.12)',
    profitBorder: 'rgba(50,215,75,0.25)',
    loss: '#FF453A',
    lossAlt: '#FF6961',
    lossContainer: 'rgba(255,69,58,0.12)',
    lossBorder: 'rgba(255,69,58,0.25)',
    pending: '#FF9F0A',
    pendingContainer: 'rgba(255,159,10,0.12)',
    pendingBorder: 'rgba(255,159,10,0.25)',
    void: '#636366',
    voidContainer: 'rgba(99,99,102,0.12)',
    voidBorder: 'rgba(99,99,102,0.2)',
    primaryContainer: 'rgba(229,9,20,0.15)',
    primaryBorder: 'rgba(229,9,20,0.3)',
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const Radius = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 18,
  xl: 22,
  xxl: 28,
  full: 999,
};

export const Typography = {
  hero: { fontSize: 42, fontWeight: '700', letterSpacing: -2, lineHeight: 46 },
  h1: { fontSize: 28, fontWeight: '700', letterSpacing: -0.8, lineHeight: 34 },
  h2: { fontSize: 22, fontWeight: '700', letterSpacing: -0.4 },
  h3: { fontSize: 18, fontWeight: '600', letterSpacing: -0.3 },
  h4: { fontSize: 16, fontWeight: '600', letterSpacing: -0.2 },
  body: { fontSize: 15, fontWeight: '400', lineHeight: 22 },
  bodyMedium: { fontSize: 15, fontWeight: '500' },
  bodySmall: { fontSize: 13, fontWeight: '400', lineHeight: 18 },
  label: { fontSize: 13, fontWeight: '600', letterSpacing: 0.2 },
  caption: { fontSize: 11, fontWeight: '500' },
  micro: { fontSize: 10, fontWeight: '600', letterSpacing: 0.6 },
  overline: { fontSize: 10, fontWeight: '600', letterSpacing: 1.2 },
};

export const Shadows = {
  none: {},
  xs: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.12,
    shadowRadius: 28,
    elevation: 8,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.18,
    shadowRadius: 40,
    elevation: 14,
  },
  primary: {
    shadowColor: '#E50914',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28,
    shadowRadius: 20,
    elevation: 8,
  },
};
