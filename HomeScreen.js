// HomeScreen.js — Material 3 Expressive · Pixel flagship quality
// Zero blur · Spring physics · Tonal surfaces · Google-native feel

import React, { useMemo, useEffect, useRef, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Pressable,
  Animated as RNAnimated, Dimensions, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeInDown, FadeIn,
  useSharedValue, useAnimatedStyle,
  withSpring, withTiming, withDelay,
  interpolate, Extrapolation,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTheme } from './useTheme';
import { useStore, useStats } from './store';
import Chart from './Chart';
import {
  formatMoney, calcPnLTimeSeries, calcSmartInsights,
  calcSportStats, calcBookieStats, getCurrencySymbol,
} from './calculations';

const { width: SW } = Dimensions.get('window');

// ─── ANIMATED TICKER ─────────────────────────────────────────────
function AnimatedValue({ value, style, prefix = '', suffix = '' }) {
  const anim = useRef(new RNAnimated.Value(0)).current;
  const prevRef = useRef(value);

  useEffect(() => {
    if (prevRef.current === value) return;
    prevRef.current = value;
    RNAnimated.sequence([
      RNAnimated.timing(anim, { toValue: 1, duration: 100, useNativeDriver: true }),
      RNAnimated.timing(anim, { toValue: 0, duration: 100, useNativeDriver: true }),
    ]).start();
  }, [value]);

  const scale = anim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 1.05, 1],
  });

  return (
    <RNAnimated.Text style={[style, { transform: [{ scale }] }]}>
      {prefix}{value}{suffix}
    </RNAnimated.Text>
  );
}

// ─── METRIC TILE ─────────────────────────────────────────────────
function MetricTile({ label, value, color, bgColor, borderColor, delay = 0, colors, shadows }) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View
      entering={FadeInDown.delay(delay).springify().damping(28).stiffness(320)}
      style={[animStyle, { flex: 1 }]}
    >
      <Pressable
        onPressIn={() => {
          scale.value = withSpring(0.95, { damping: 22, stiffness: 400 });
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }}
        onPressOut={() => {
          scale.value = withSpring(1, { damping: 22, stiffness: 400 });
        }}
        style={[
          mt.card,
          {
            backgroundColor: bgColor || colors.surfaceVariant,
            borderColor: borderColor || colors.border,
          },
          shadows.sm,
        ]}
      >
        <Text style={[mt.value, { color }]} numberOfLines={1} adjustsFontSizeToFit>
          {value}
        </Text>
        <Text style={[mt.label, { color, opacity: 0.55 }]}>{label}</Text>
      </Pressable>
    </Animated.View>
  );
}

const mt = StyleSheet.create({
  card: {
    borderRadius: 22,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderWidth: 1,
  },
  value: {
    fontSize: 19,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 5,
  },
  label: {
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
});

// ─── INSIGHT PILL ────────────────────────────────────────────────
function InsightPill({ ins, idx, colors, shadows, onPress }) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const cfgMap = {
    positive: {
      bg:      'rgba(0,191,111,0.08)',
      border:  'rgba(0,191,111,0.22)',
      color:   '#00BF6F',
      iconBg:  'rgba(0,191,111,0.14)',
    },
    warning: {
      bg:      'rgba(255,179,71,0.08)',
      border:  'rgba(255,179,71,0.22)',
      color:   '#FFB347',
      iconBg:  'rgba(255,179,71,0.14)',
    },
    info: {
      bg:      'rgba(255,75,106,0.07)',
      border:  'rgba(255,75,106,0.18)',
      color:   '#FF4B6A',
      iconBg:  'rgba(255,75,106,0.12)',
    },
  };

  const cfg = cfgMap[ins.type] || {
    bg: colors.surfaceVariant,
    border: colors.border,
    color: colors.textSecondary,
    iconBg: colors.border,
  };

  return (
    <Animated.View
      entering={FadeInDown.delay(220 + idx * 55).springify().damping(28)}
      style={animStyle}
    >
      <Pressable
        onPressIn={() => {
          scale.value = withSpring(0.97, { damping: 22, stiffness: 400 });
        }}
        onPressOut={() => {
          scale.value = withSpring(1, { damping: 22, stiffness: 400 });
        }}
        onPress={onPress}
        style={[ip.wrap, { backgroundColor: cfg.bg, borderColor: cfg.border }]}
      >
        <View style={[ip.iconWrap, { backgroundColor: cfg.iconBg }]}>
          <Text style={{ fontSize: 15 }}>{ins.icon}</Text>
        </View>
        <Text style={[ip.txt, { color: cfg.color }]} numberOfLines={2}>
          {ins.text}
        </Text>
        <Text style={[ip.arrow, { color: cfg.color, opacity: 0.45 }]}>›</Text>
      </Pressable>
    </Animated.View>
  );
}

const ip = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    marginBottom: 8,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  txt: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
  arrow: {
    fontSize: 22,
    fontWeight: '300',
  },
});

// ─── LOSS ALERT BANNER ───────────────────────────────────────────
function LossAlert({ stats, colors }) {
  if (!stats.lossLimitHit) return null;
  return (
    <Animated.View
      entering={FadeIn.duration(350)}
      style={[la.wrap, {
        backgroundColor: 'rgba(217,48,55,0.08)',
        borderColor: 'rgba(217,48,55,0.22)',
      }]}
    >
      <Text style={{ fontSize: 18 }}>🛑</Text>
      <Text style={la.txt}>Daily loss limit reached — step back for today</Text>
    </Animated.View>
  );
}

const la = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    marginHorizontal: 16,
    marginTop: 8,
  },
  txt: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    color: '#D93037',
    lineHeight: 18,
  },
});

// ─── SECTION LABEL ───────────────────────────────────────────────
function SectionLabel({ text, colors, action, onAction }) {
  return (
    <View style={s.sectionHeader}>
      <Text style={[s.sectionLabel, { color: colors.textTertiary }]}>{text}</Text>
      {action && (
        <Pressable onPress={onAction}>
          <Text style={{ fontSize: 12, fontWeight: '700', color: '#FF4B6A' }}>
            {action}
          </Text>
        </Pressable>
      )}
    </View>
  );
}

// ─── QUICK NAV ITEM ──────────────────────────────────────────────
function NavItem({ item, index, colors, shadows, navigation }) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View
      entering={FadeInDown.delay(300 + index * 45).springify().damping(28)}
      style={[animStyle, { flex: 1 }]}
    >
      <Pressable
        onPressIn={() => {
          scale.value = withSpring(0.93, { damping: 18, stiffness: 380 });
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }}
        onPressOut={() => {
          scale.value = withSpring(1, { damping: 18, stiffness: 380 });
        }}
        onPress={() => navigation.navigate(item.screen)}
        style={[
          nv.card,
          {
            backgroundColor: colors.surfaceVariant,
            borderColor: colors.border,
          },
          shadows.sm,
        ]}
      >
        <View style={[nv.iconWrap, { backgroundColor: `${item.accent}18` }]}>
          <Text style={{ fontSize: 21 }}>{item.icon}</Text>
        </View>
        <Text style={[nv.label, { color: colors.textSecondary }]}>{item.label}</Text>
      </Pressable>
    </Animated.View>
  );
}

const nv = StyleSheet.create({
  card: {
    borderRadius: 22,
    paddingVertical: 16,
    paddingHorizontal: 10,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
  },
  iconWrap: {
    width: 46,
    height: 46,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.1,
  },
});

// ─── MAIN SCREEN ─────────────────────────────────────────────────
export default function HomeScreen({ navigation }) {
  const { colors, isDark, shadows } = useTheme();
  const bets      = useStore(s => s.bets);
  const bookies   = useStore(s => s.bookies);
  const sports    = useStore(s => s.sports);
  const currency  = useStore(s => s.currency);
  const loading   = useStore(s => s.loading);
  const stats     = useStats();
  const [hidden, setHidden] = useState(false);
  const currSym = getCurrencySymbol(currency);

  const pnlData    = useMemo(() => calcPnLTimeSeries(bets), [bets]);
  const sportStats = useMemo(() => calcSportStats(bets, sports), [bets, sports]);
  const bookStats  = useMemo(() => calcBookieStats(bets, bookies), [bets, bookies]);
  const insights   = useMemo(() =>
    calcSmartInsights(bets, sportStats, bookStats, stats.streak, stats.winRate),
    [bets, sportStats, bookStats, stats]
  );

  const isProfit   = stats.totalPnL >= 0;
  const pnlColor   = isProfit ? (isDark ? '#00D97A' : '#00BF6F') : (isDark ? '#FF5555' : '#FF4444');
  const pnlDisplay = hidden
    ? `${currSym}••••`
    : `${isProfit ? '+' : ''}${formatMoney(stats.totalPnL, currSym)}`;

  const QuickNavItems = [
    { icon: '📋', label: 'Bets',     screen: 'Bets',     accent: '#FF4B6A' },
    { icon: '📊', label: 'Stats',    screen: 'Stats',    accent: '#5B8DEF' },
    { icon: '💰', label: 'Bankroll', screen: 'Bankroll', accent: '#00BF6F' },
    { icon: '⚙️', label: 'Settings', screen: 'Settings', accent: '#8888A8' },
  ];

  if (loading) {
    return <View style={[s.screen, { backgroundColor: colors.background }]} />;
  }

  // Hero gradient — tonal, no heavy glass
  const heroColors = isDark
    ? [colors.surfaceVariant, colors.surface]
    : ['#FFFFFF', '#F8F8FF'];

  // Ambient accent strip at top of hero
  const ambientColor = isProfit
    ? (isDark ? 'rgba(0,217,122,0.06)' : 'rgba(0,191,111,0.05)')
    : (isDark ? 'rgba(255,85,85,0.07)' : 'rgba(255,68,68,0.05)');

  return (
    <SafeAreaView style={[s.screen, { backgroundColor: colors.background }]} edges={['top']}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scroll}
        overScrollMode="never"
      >
        <LossAlert stats={stats} colors={colors} />

        {/* ── HERO CARD ── */}
        <Animated.View
          entering={FadeIn.duration(420).springify()}
          style={s.heroOuter}
        >
          <View
            style={[
              s.heroCard,
              {
                backgroundColor: isDark ? colors.surfaceVariant : '#FFFFFF',
                borderColor: colors.border,
              },
              shadows.md,
            ]}
          >
            {/* Ambient glow strip */}
            <View style={[s.ambientStrip, { backgroundColor: ambientColor }]} />

            {/* Top row */}
            <View style={s.heroTop}>
              <View style={{ flex: 1 }}>
                <Text style={[s.heroEyebrow, { color: colors.textTertiary }]}>
                  Total P&L · All Time
                </Text>
                {stats.streak?.type && stats.streak.current >= 2 && (
                  <Animated.View
                    entering={FadeIn.delay(200).duration(300)}
                    style={[
                      s.streakBadge,
                      {
                        backgroundColor: stats.streak.type === 'Won'
                          ? 'rgba(0,191,111,0.1)'
                          : 'rgba(255,85,85,0.1)',
                        borderColor: stats.streak.type === 'Won'
                          ? 'rgba(0,191,111,0.25)'
                          : 'rgba(255,85,85,0.22)',
                      },
                    ]}
                  >
                    <Text style={{ fontSize: 11 }}>
                      {stats.streak.type === 'Won' ? '🔥' : '❄️'}
                    </Text>
                    <Text style={[
                      s.streakTxt,
                      { color: stats.streak.type === 'Won' ? '#00BF6F' : '#FF4444' },
                    ]}>
                      {stats.streak.current} {stats.streak.type === 'Won' ? 'win' : 'loss'} streak
                    </Text>
                  </Animated.View>
                )}
              </View>

              {/* Eye button */}
              <Pressable
                onPress={() => {
                  setHidden(h => !h);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
                style={[
                  s.eyeBtn,
                  { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' },
                ]}
              >
                <Text style={{ fontSize: 17 }}>{hidden ? '👁️' : '🙈'}</Text>
              </Pressable>
            </View>

            {/* Big P&L number */}
            <Pressable
              onPress={() => {
                setHidden(h => !h);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
            >
              <Text
                style={[s.heroAmount, { color: pnlColor }]}
                adjustsFontSizeToFit
                numberOfLines={1}
              >
                {pnlDisplay}
              </Text>
            </Pressable>

            {/* Pills row */}
            <View style={s.pillsRow}>
              {stats.roi != null && (
                <View style={[
                  s.pill,
                  {
                    backgroundColor: isProfit ? 'rgba(0,191,111,0.1)' : 'rgba(255,68,68,0.08)',
                    borderColor:     isProfit ? 'rgba(0,191,111,0.22)' : 'rgba(255,68,68,0.2)',
                  },
                ]}>
                  <Text style={[s.pillTxt, { color: pnlColor }]}>
                    {isProfit ? '↑' : '↓'} {isProfit ? '+' : ''}{stats.roi}% ROI
                  </Text>
                </View>
              )}
              {stats.winRate != null && (
                <View style={[s.pill, {
                  backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                  borderColor: colors.border,
                }]}>
                  <Text style={[s.pillTxt, { color: colors.textSecondary }]}>
                    {stats.winRate}% WR
                  </Text>
                </View>
              )}
              <View style={[s.pill, {
                backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                borderColor: colors.border,
              }]}>
                <Text style={[s.pillTxt, { color: colors.textSecondary }]}>
                  {stats.totalBets} bets
                </Text>
              </View>
            </View>

            {/* Mini chart */}
            {!hidden && pnlData.length >= 2 && (
              <View style={s.miniChart}>
                <Chart data={pnlData} color={pnlColor} height={60} currSym={currSym} />
              </View>
            )}
          </View>
        </Animated.View>

        {/* ── CONTENT ── */}
        <View style={s.content}>

          {/* Performance metrics */}
          <View style={s.section}>
            <SectionLabel text="Performance" colors={colors} />
            <View style={s.metricsRow}>
              {[
                { label: 'Today', v: stats.todayPnL },
                { label: 'Week',  v: stats.weekPnL  },
                { label: 'Month', v: stats.monthPnL },
              ].map((item, i) => {
                const c = item.v > 0
                  ? pnlColor
                  : item.v < 0
                    ? (isDark ? '#FF5555' : '#FF4444')
                    : colors.textTertiary;
                const bg = item.v > 0
                  ? (isDark ? 'rgba(0,191,111,0.08)' : 'rgba(0,191,111,0.06)')
                  : item.v < 0
                    ? (isDark ? 'rgba(255,68,68,0.08)' : 'rgba(255,68,68,0.05)')
                    : colors.surfaceVariant;
                const border = item.v > 0
                  ? 'rgba(0,191,111,0.18)'
                  : item.v < 0
                    ? 'rgba(255,68,68,0.15)'
                    : colors.border;
                return (
                  <MetricTile
                    key={item.label}
                    label={item.label}
                    value={hidden ? '••' : (item.v >= 0 ? '+' : '') + formatMoney(item.v, currSym)}
                    color={c}
                    bgColor={bg}
                    borderColor={border}
                    delay={80 + i * 40}
                    colors={colors}
                    shadows={shadows || {}}
                  />
                );
              })}
            </View>
          </View>

          {/* Outcome counts */}
          <View style={[s.section, { marginTop: -8 }]}>
            <View style={s.metricsRow}>
              <MetricTile
                label="Total"
                value={String(stats.totalBets)}
                color={colors.textPrimary}
                delay={160}
                colors={colors}
                shadows={shadows || {}}
              />
              <MetricTile
                label="Won"
                value={String(stats.wonCount)}
                color={isDark ? '#00D97A' : '#00BF6F'}
                bgColor={isDark ? 'rgba(0,191,111,0.09)' : 'rgba(0,191,111,0.07)'}
                borderColor="rgba(0,191,111,0.18)"
                delay={195}
                colors={colors}
                shadows={shadows || {}}
              />
              <MetricTile
                label="Lost"
                value={String(stats.lostCount)}
                color={isDark ? '#FF5555' : '#FF4444'}
                bgColor={isDark ? 'rgba(255,68,68,0.09)' : 'rgba(255,68,68,0.06)'}
                borderColor="rgba(255,68,68,0.16)"
                delay={230}
                colors={colors}
                shadows={shadows || {}}
              />
            </View>
          </View>

          {/* Smart Insights */}
          {insights.length > 0 && (
            <View style={s.section}>
              <SectionLabel
                text="Smart Insights"
                colors={colors}
                action="View all →"
                onAction={() => navigation.navigate('Stats')}
              />
              {insights.slice(0, 3).map((ins, i) => (
                <InsightPill
                  key={i}
                  ins={ins}
                  idx={i}
                  colors={colors}
                  shadows={shadows || {}}
                  onPress={() => navigation.navigate('Stats')}
                />
              ))}
            </View>
          )}

          {/* Quick Nav */}
          <View style={s.section}>
            <SectionLabel text="Navigate" colors={colors} />
            <View style={s.navGrid}>
              {QuickNavItems.map((item, i) => (
                <NavItem
                  key={item.label}
                  item={item}
                  index={i}
                  colors={colors}
                  shadows={shadows || {}}
                  navigation={navigation}
                />
              ))}
            </View>
          </View>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1 },
  scroll: { paddingBottom: 120 },

  // Hero
  heroOuter:  { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4 },
  heroCard: {
    borderRadius: 28,
    padding: 22,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  ambientStrip: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    height: 80,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  heroEyebrow: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  streakTxt: { fontSize: 11, fontWeight: '700' },
  eyeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroAmount: {
    fontSize: 48,
    fontWeight: '800',
    letterSpacing: -2,
    lineHeight: 54,
    marginBottom: 14,
    marginTop: 4,
  },
  pillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
    marginBottom: 4,
  },
  pill: {
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
  },
  pillTxt: { fontSize: 11, fontWeight: '700' },
  miniChart: { marginTop: 16 },

  // Layout
  content:  { paddingHorizontal: 16, paddingTop: 16 },
  section:  { marginBottom: 24 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  metricsRow: { flexDirection: 'row', gap: 10 },
  navGrid:   { flexDirection: 'row', gap: 10 },
});
