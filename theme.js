// utils/theme.js

export const Colors = {
  // Brand
  primary: '#E50914',
  primaryLight: '#FF453A',
  primaryDark: '#C0000A',
  primaryContainer: '#FFD9D8',
  onPrimary: '#FFFFFF',

  // Semantic
  profit: '#00C853',
  profitLight: '#69F0AE',
  profitContainer: '#E8F5E9',
  loss: '#E53935',
  lossLight: '#EF9A9A',
  lossContainer: '#FFEBEE',
  pending: '#FF6F00',
  pendingContainer: '#FFF8E1',
  void: '#757575',
  voidContainer: '#F5F5F5',

  // Surfaces
  background: '#F8F9FA',
  surface: '#FFFFFF',
  surfaceVariant: '#F1F3F5',
  surfaceElevated: '#FFFFFF',
  border: '#E9ECEF',
  borderLight: '#F1F3F5',

  // Text
  textPrimary: '#0D0D0D',
  textSecondary: '#6B7280',
  textTertiary: '#9CA3AF',
  textInverse: '#FFFFFF',

  // Dark theme
  dark: {
    background: '#121212',
    surface: '#1E1E1E',
    surfaceVariant: '#2A2A2A',
    surfaceElevated: '#252525',
    border: '#333333',
    borderLight: '#2A2A2A',
    textPrimary: '#F9FAFB',
    textSecondary: '#9CA3AF',
    textTertiary: '#6B7280',
    profit: '#4CAF50',
    profitContainer: '#1B5E20',
    loss: '#EF5350',
    lossContainer: '#B71C1C',
    primaryContainer: '#4A0000',
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
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  full: 999,
};

export const Typography = {
  hero: { fontSize: 40, fontWeight: '900', letterSpacing: -1.5 },
  h1: { fontSize: 28, fontWeight: '800', letterSpacing: -0.5 },
  h2: { fontSize: 22, fontWeight: '700' },
  h3: { fontSize: 18, fontWeight: '700' },
  h4: { fontSize: 16, fontWeight: '600' },
  body: { fontSize: 15, fontWeight: '400' },
  bodySmall: { fontSize: 13, fontWeight: '400' },
  label: { fontSize: 12, fontWeight: '600', letterSpacing: 0.5 },
  caption: { fontSize: 11, fontWeight: '500' },
  micro: { fontSize: 10, fontWeight: '600', letterSpacing: 0.8 },
};

export const Shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  primary: {
    shadowColor: '#E50914',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
};
