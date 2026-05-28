// theme.js — Material 3 Expressive Design System
// Pixel-native · Google-quality · Zero blur

// ─── TONAL PALETTE ───────────────────────────────────────────────
// Brand: Coral Red (M3 Expressive primary)
// Semantic: Emerald profit · Coral loss · Amber pending
// Surface: Deep slate dark · Clean white light

export const Colors = {
  // ── Brand ──────────────────────────────────────────────────────
  primary:           '#FF4B6A',   // M3 expressive coral-red
  primaryLight:      '#FF7A92',
  primaryDark:       '#D93050',
  primaryContainer:  '#FFD9E2',   // light tonal container
  onPrimary:         '#FFFFFF',

  // ── Semantic ───────────────────────────────────────────────────
  profit:            '#00BF6F',   // M3 emerald — calmer than pure green
  profitLight:       '#00E587',
  profitContainer:   '#E6FFF4',
  loss:              '#FF4444',
  lossLight:         '#FF7070',
  lossContainer:     '#FFE8E8',
  pending:           '#FFB347',   // warm amber
  pendingContainer:  '#FFF5E0',
  void:              '#8A8AA0',
  voidContainer:     '#F0F0F8',

  // ── Light surfaces ─────────────────────────────────────────────
  background:        '#F6F6FA',   // warm off-white — not sterile
  surface:           '#FFFFFF',
  surfaceVariant:    '#F0F0F8',   // tonal surface
  surfaceElevated:   '#FFFFFF',
  surfaceContainer:  '#EBEBF5',
  border:            'rgba(0,0,0,0.08)',
  borderLight:       'rgba(0,0,0,0.05)',
  outline:           'rgba(0,0,0,0.06)',

  // ── Light text ─────────────────────────────────────────────────
  textPrimary:       '#0D0D14',
  textSecondary:     '#54546B',
  textTertiary:      '#8888A8',
  textInverse:       '#FFFFFF',

  // ── Dark theme — M3 dark baseline ──────────────────────────────
  dark: {
    // Surfaces — layered tonal depth, zero blur needed
    background:        '#0C0C12',   // deepest layer
    surface:           '#13131C',   // card base
    surfaceVariant:    '#1C1C28',   // slightly elevated
    surfaceElevated:   '#1F1F2E',   // modal / sheet
    surfaceContainer:  '#181824',   // inner sections
    surfaceContainerHigh: '#222234',
    border:            'rgba(255,255,255,0.08)',
    borderLight:       'rgba(255,255,255,0.05)',
    outline:           'rgba(255,255,255,0.06)',

    // Text
    textPrimary:       '#EEEEF8',
    textSecondary:     '#9898B8',
    textTertiary:      '#5C5C78',
    textInverse:       '#0C0C12',

    // Semantic — adapted for dark
    profit:            '#00D97A',
    profitLight:       '#00FF90',
    profitContainer:   '#002518',
    loss:              '#FF5555',
    lossLight:         '#FF8080',
    lossContainer:     '#1E0000',
    pending:           '#FFC060',
    pendingContainer:  '#201000',
    void:              '#7070A0',
    voidContainer:     '#18182A',

    // Brand — vibrant on dark
    primary:           '#FF4B6A',
    primaryLight:      '#FF7A92',
    primaryDark:       '#D93050',
    primaryContainer:  '#2E0012',
    onPrimary:         '#FFFFFF',
  },
};

// ─── SPACING — 4pt grid ──────────────────────────────────────────
export const Spacing = {
  xs:   4,
  sm:   8,
  md:  16,
  lg:  24,
  xl:  32,
  xxl: 48,
};

// ─── SHAPE — M3 Expressive radius scale ──────────────────────────
// Larger radii = more expressive, more physical feeling
export const Radius = {
  xs:   6,
  sm:  10,
  md:  14,
  lg:  18,
  xl:  22,
  xxl: 28,
  xxxl: 36,
  full: 999,
};

// ─── TYPOGRAPHY — Google Sans scale ──────────────────────────────
export const Typography = {
  // Display — hero numbers, big headlines
  displayLg: { fontSize: 52, fontWeight: '800', letterSpacing: -2.5, lineHeight: 56 },
  displayMd: { fontSize: 40, fontWeight: '800', letterSpacing: -1.5, lineHeight: 44 },
  displaySm: { fontSize: 32, fontWeight: '700', letterSpacing: -1.0, lineHeight: 36 },

  // Legacy aliases — keeps old screens working
  hero: { fontSize: 40, fontWeight: '900', letterSpacing: -1.5 },
  h1:   { fontSize: 28, fontWeight: '800', letterSpacing: -0.5 },
  h2:   { fontSize: 22, fontWeight: '700', letterSpacing: -0.3 },
  h3:   { fontSize: 18, fontWeight: '700', letterSpacing: -0.2 },
  h4:   { fontSize: 16, fontWeight: '600', letterSpacing:  0   },

  // Headline
  headlineLg: { fontSize: 26, fontWeight: '700', letterSpacing: -0.5, lineHeight: 30 },
  headlineMd: { fontSize: 22, fontWeight: '700', letterSpacing: -0.3, lineHeight: 26 },
  headlineSm: { fontSize: 18, fontWeight: '600', letterSpacing: -0.2, lineHeight: 22 },

  // Title
  titleLg: { fontSize: 17, fontWeight: '600', letterSpacing: 0, lineHeight: 22 },
  titleMd: { fontSize: 15, fontWeight: '600', letterSpacing: 0, lineHeight: 20 },
  titleSm: { fontSize: 13, fontWeight: '600', letterSpacing: 0, lineHeight: 18 },

  // Body
  bodyLg:    { fontSize: 15, fontWeight: '400', letterSpacing: 0,   lineHeight: 22 },
  body:      { fontSize: 15, fontWeight: '400', letterSpacing: 0,   lineHeight: 22 },
  bodyMd:    { fontSize: 13, fontWeight: '400', letterSpacing: 0,   lineHeight: 19 },
  bodySmall: { fontSize: 13, fontWeight: '400', letterSpacing: 0,   lineHeight: 19 },

  // Label — caps, tight tracking
  labelLg: { fontSize: 12, fontWeight: '700', letterSpacing: 0.8,  lineHeight: 16 },
  label:    { fontSize: 12, fontWeight: '600', letterSpacing: 0.5,  lineHeight: 16 },
  labelMd:  { fontSize: 10, fontWeight: '700', letterSpacing: 1.2,  lineHeight: 14 },
  labelSm:  { fontSize:  9, fontWeight: '700', letterSpacing: 1.5,  lineHeight: 13 },
  caption:  { fontSize: 11, fontWeight: '500', letterSpacing: 0.2,  lineHeight: 15 },
  micro:    { fontSize: 10, fontWeight: '600', letterSpacing: 0.8,  lineHeight: 14 },
};

// ─── ELEVATION — tonal + shadow ──────────────────────────────────
// M3: elevation expressed through tonal surface overlay + subtle shadow
// No blur. Just depth.
export const Shadows = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.10,
    shadowRadius: 10,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.14,
    shadowRadius: 18,
    elevation: 8,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 28,
    elevation: 12,
  },
  primary: {
    shadowColor: '#FF4B6A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.32,
    shadowRadius: 16,
    elevation: 8,
  },
  profit: {
    shadowColor: '#00BF6F',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 16,
    elevation: 8,
  },
};

// ─── MOTION — spring configs ──────────────────────────────────────
// Use with react-native-reanimated withSpring()
export const Motion = {
  // Standard — most UI transitions
  standard: { damping: 28, stiffness: 320, mass: 1 },
  // Snappy — small components, chips, toggles
  snappy:   { damping: 22, stiffness: 400, mass: 0.8 },
  // Gentle — large surfaces, modals, sheets
  gentle:   { damping: 35, stiffness: 260, mass: 1.2 },
  // Expressive — hero elements, FAB, dramatic
  expressive: { damping: 18, stiffness: 280, mass: 1 },
  // Stiff — instant feedback, no bounce
  stiff:    { damping: 40, stiffness: 500, mass: 1 },
};

// ─── TONAL OVERLAYS — semantic alpha layers ───────────────────────
// Apply over surfaces for contextual tinting
export const Tonal = {
  profit:  (opacity = 0.08) => `rgba(0,191,111,${opacity})`,
  loss:    (opacity = 0.08) => `rgba(255,68,68,${opacity})`,
  pending: (opacity = 0.08) => `rgba(255,179,71,${opacity})`,
  primary: (opacity = 0.08) => `rgba(255,75,106,${opacity})`,
  neutral: (opacity = 0.06) => `rgba(255,255,255,${opacity})`,
};
