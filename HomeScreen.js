// HomeScreen.js — Premium redesign: Obsidian fintech aesthetic
import React, { useMemo, useEffect, useRef, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Pressable,
  Animated as RNAnimated, Dimensions, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient as ExpoLinearGradient } from 'expo-linear-gradient';
function LinearGradient(props) {
  try { return <ExpoLinearGradient {...props} />; }
  catch (e) { return <View style={[props.style, { backgroundColor: (props.colors && props.colors[0]) || 'transparent' }]}>{props.children}</View>; }
}
import Animated, {
  FadeInDown, FadeIn, useSharedValue, useAnimatedStyle,
  withSpring, withTiming, withSequence, withDelay, interpolate,
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

// ── Animated number ticker ────────────────────────────────────────
function AnimatedValue({ value, style, prefix = '', suffix = '' }) {
  const anim = useRef(new RNAnimated.Value(0)).current;
  const prevRef = useRef(value);
  useEffect(() => {
    if (prevRef.current === value) return;
    prevRef.current = value;
    RNAnimated.sequence([
      RNAnimated.timing(anim, { toValue: 1, duration: 120, useNativeDriver: true }),
      RNAnimated.timing(anim, { toValue: 0, duration: 120, useNativeDriver: true }),
    ]).start();
  }, [value]);
  const scale = anim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 1.04, 1] });
  return (
    <RNAnimated.Text style={[style, { transform: [{ scale }] }]}>
      {prefix}{value}{suffix}
    </RNAnimated.Text>
  );
}

// ── Metric tile ───────────────────────────────────────────────────
function MetricTile({ label, value, color, bgColor, borderColor, delay = 0, colors }) {
  const scale = useSharedValue(1);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <Animated.View entering={FadeInDown.delay(delay).springify().damping(22)} style={[style, { flex: 1 }]}>
      <Pressable
        onPressIn={() => { scale.value = withSpring(0.95, { damping: 15, stiffness: 300 }); }}
        onPressOut={() => { scale.value = withSpring(1, { damping: 15 }); }}
        style={[mt.card, { backgroundColor: bgColor || colors.surface, borderColor: borderColor || colors.border }]}
      >
        <Text style={[mt.value, { color }]} numberOfLines={1} adjustsFontSizeToFit>{value}</Text>
        <Text style={[mt.label, { color: color, opacity: 0.6 }]}>{label}</Text>
      </Pressable>
    </Animated.View>
  );
}
const mt = StyleSheet.create({
  card: { borderRadius: 18, paddingVertical: 14, paddingHorizontal: 12, borderWidth: 0.5 },
  value: { fontSize: 20, fontWeight: '800', letterSpacing: -0.5, marginBottom: 4 },
  label: { fontSize: 9, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8 },
});

// ── Insight pill ──────────────────────────────────────────────────
function InsightPill({ ins, idx, colors }) {
  const scale = useSharedValue(1);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const cfgMap = {
    positive: { bg: 'rgba(0,200,83,0.08)', border: 'rgba(0,200,83,0.2)', color: '#00C853', iconBg: 'rgba(0,200,83,0.15)' },
    warning: { bg: 'rgba(255,111,0,0.08)', border: 'rgba(255,111,0,0.2)', color: '#FF6F00', iconBg: 'rgba(255,111,0,0.15)' },
    info: { bg: 'rgba(229,9,20,0.06)', border: 'rgba(229,9,20,0.15)', color: '#E50914', iconBg: 'rgba(229,9,20,0.1)' },
  };
  const cfg = cfgMap[ins.type] || { bg: colors.surfaceVariant, border: colors.border, color: colors.textSecondary, iconBg: colors.border };
  return (
    <Animated.View
      entering={FadeInDown.delay(240 + idx * 60).springify().damping(22)}
      style={style}
    >
      <Pressable
        onPressIn={() => { scale.value = withSpring(0.97, { damping: 15 }); }}
        onPressOut={() => { scale.value = withSpring(1, { damping: 15 }); }}
        style={[ip.wrap, { backgroundColor: cfg.bg, borderColor: cfg.border }]}
      >
        <View style={[ip.iconWrap, { backgroundColor: cfg.iconBg }]}>
          <Text style={{ fontSize: 14 }}>{ins.icon}</Text>
        </View>
        <Text style={[ip.txt, { color: cfg.color }]}>{ins.text}</Text>
        <Text style={[ip.arrow, { color: cfg.color, opacity: 0.4 }]}>›</Text>
      </Pressable>
    </Animated.View>
  );
}
const ip = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 16, padding: 14, borderWidth: 0.5, marginBottom: 8 },
  iconWrap: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  txt: { flex: 1, fontSize: 13, fontWeight: '600', lineHeight: 18 },
  arrow: { fontSize: 20, fontWeight: '300' },
});

// ── Loss limit banner ─────────────────────────────────────────────
function LossAlert({ stats }) {
  if (!stats.lossLimitHit) return null;
  return (
    <Animated.View entering={FadeIn.duration(300)} style={la.wrap}>
      <Text style={{ fontSize: 16 }}>🛑</Text>
      <Text style={la.txt}>Daily loss limit hit — time to stop for today</Text>
    </Animated.View>
  );
}
const la = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 14, padding: 14, borderWidth: 0.5, marginHorizontal: 16, marginTop: 8, backgroundColor: 'rgba(217,48,37,0.08)', borderColor: 'rgba(217,48,37,0.25)' },
  txt: { flex: 1, fontSize: 13, fontWeight: '700', color: '#D93025' },
});

export default function HomeScreen({ navigation }) {
  const { colors, isDark } = useTheme();
  const bets = useStore(s => s.bets);
  const bookies = useStore(s => s.bookies);
  const sports = useStore(s => s.sports);
  const currency = useStore(s => s.currency);
  const loading = useStore(s => s.loading);
  const stats = useStats();
  const [hidden, setHidden] = useState(false);
  const currSym = getCurrencySymbol(currency);

  const pnlData = useMemo(() => calcPnLTimeSeries(bets), [bets]);
  const sportStats = useMemo(() => calcSportStats(bets, sports), [bets, sports]);
  const bookieStats = useMemo(() => calcBookieStats(bets, bookies), [bets, bookies]);
  const insights = useMemo(() => calcSmartInsights(bets, sportStats, bookieStats, stats.streak, stats.winRate), [bets, sportStats, bookieStats, stats]);

  const isProfit = stats.totalPnL >= 0;
  const pnlColor = isProfit ? '#00C853' : '#E53935';
  const pnlDisplay = hidden ? `${currSym}••••` : `${isProfit ? '+' : ''}${formatMoney(stats.totalPnL, currSym)}`;

  // Hero card gradient based on theme
  const heroGradColors = isDark
    ? ['#141414', '#1C1C1E', '#141414']
    : ['#FAFAFA', '#FFFFFF', '#F5F5F7'];

  if (loading) return <View style={{ flex: 1, backgroundColor: colors.background }} />;

  const QuickNavItems = [
    { icon: '📋', label: 'Bets', screen: 'Bets', accent: '#E50914' },
    { icon: '📊', label: 'Stats', screen: 'Stats', accent: '#0A84FF' },
    { icon: '💰', label: 'Bankroll', screen: 'Bankroll', accent: '#30D158' },
    { icon: '⚙️', label: 'Settings', screen: 'Settings', accent: '#636366' },
  ];

  return (
    <SafeAreaView style={[s.screen, { backgroundColor: colors.background }]} edges={['top']}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scroll}
      >
        {/* Loss Alert */}
        <LossAlert stats={stats} />

        {/* ── HERO CARD ── */}
        <Animated.View entering={FadeIn.duration(400)} style={s.heroOuter}>
          <LinearGradient
            colors={heroGradColors}
            style={[s.heroCard, { borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)' }]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          >
            {/* Top row */}
            <View style={s.heroTop}>
              <View>
                <Text style={[s.heroEyebrow, { color: colors.textTertiary }]}>Total P&L · All Time</Text>
                {stats.streak.type && stats.streak.current >= 2 && (
                  <View style={[s.streakBadge, {
                    backgroundColor: stats.streak.type === 'Won' ? 'rgba(0,200,83,0.1)' : 'rgba(229,9,20,0.1)',
                    borderColor: stats.streak.type === 'Won' ? 'rgba(0,200,83,0.25)' : 'rgba(229,9,20,0.2)',
                  }]}>
                    <Text style={{ fontSize: 10 }}>{stats.streak.type === 'Won' ? '🔥' : '❄️'}</Text>
                    <Text style={[s.streakTxt, { color: stats.streak.type === 'Won' ? '#00C853' : '#E53935' }]}>
                      {stats.streak.current} {stats.streak.type === 'Won' ? 'win' : 'loss'} streak
                    </Text>
                  </View>
                )}
              </View>
              <Pressable
                onPress={() => { setHidden(h => !h); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                style={[s.eyeBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.04)' }]}
              >
                <Text style={{ fontSize: 16 }}>{hidden ? '👁️' : '🙈'}</Text>
              </Pressable>
            </View>

            {/* Big P&L */}
            <Pressable onPress={() => { setHidden(h => !h); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}>
              <Text style={[s.heroAmount, { color: pnlColor }]} adjustsFontSizeToFit numberOfLines={1}>
                {pnlDisplay}
              </Text>
            </Pressable>

            {/* Pills row */}
            <View style={s.pillsRow}>
              {stats.roi && (
                <View style={[s.pill, {
                  backgroundColor: isProfit ? 'rgba(0,200,83,0.1)' : 'rgba(229,9,20,0.08)',
                  borderColor: isProfit ? 'rgba(0,200,83,0.2)' : 'rgba(229,9,20,0.18)',
                }]}>
                  <Text style={[s.pillTxt, { color: pnlColor }]}>
                    {isProfit ? '↑' : '↓'} {isProfit ? '+' : ''}{stats.roi}% ROI
                  </Text>
                </View>
              )}
              {stats.winRate && (
                <View style={[s.pill, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)', borderColor: colors.border }]}>
                  <Text style={[s.pillTxt, { color: colors.textSecondary }]}>{stats.winRate}% WR</Text>
                </View>
              )}
              <View style={[s.pill, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)', borderColor: colors.border }]}>
                <Text style={[s.pillTxt, { color: colors.textSecondary }]}>{stats.totalBets} bets</Text>
              </View>
            </View>

            {/* Mini chart */}
            {!hidden && pnlData.length >= 2 && (
              <View style={s.miniChart}>
                <Chart data={pnlData} color={pnlColor} height={56} currSym={currSym} />
              </View>
            )}
          </LinearGradient>
        </Animated.View>

        <View style={s.content}>

          {/* ── SESSION METRICS ── */}
          <Animated.View entering={FadeInDown.delay(80).springify().damping(22)} style={s.section}>
            <Text style={[s.sectionLabel, { color: colors.textTertiary }]}>Performance</Text>
            <View style={s.metricsRow}>
              {[
                { label: 'Today', v: stats.todayPnL },
                { label: 'Week', v: stats.weekPnL },
                { label: 'Month', v: stats.monthPnL },
              ].map((item, i) => {
                const c = item.v > 0 ? '#00C853' : item.v < 0 ? '#E53935' : colors.textTertiary;
                const bg = item.v > 0 ? (isDark ? 'rgba(0,200,83,0.06)' : 'rgba(0,200,83,0.05)') :
                  item.v < 0 ? (isDark ? 'rgba(229,9,20,0.06)' : 'rgba(229,9,20,0.04)') :
                    colors.surface;
                const border = item.v > 0 ? 'rgba(0,200,83,0.15)' : item.v < 0 ? 'rgba(229,9,20,0.12)' : colors.border;
                return (
                  <MetricTile
                    key={item.label}
                    label={item.label}
                    value={hidden ? '••' : (item.v >= 0 ? '+' : '') + formatMoney(item.v, currSym)}
                    color={c} bgColor={bg} borderColor={border}
                    delay={80 + i * 40} colors={colors}
                  />
                );
              })}
            </View>
          </Animated.View>

          {/* ── OUTCOME COUNTS ── */}
          <Animated.View entering={FadeInDown.delay(140).springify().damping(22)} style={s.section}>
            <View style={s.metricsRow}>
              <MetricTile label="Total" value={String(stats.totalBets)} color={colors.textPrimary} delay={140} colors={colors} />
              <MetricTile label="Won" value={String(stats.wonCount)} color="#00C853" bgColor={isDark ? 'rgba(0,200,83,0.07)' : '#F0FBF4'} borderColor="rgba(0,200,83,0.15)" delay={170} colors={colors} />
              <MetricTile label="Lost" value={String(stats.lostCount)} color="#E53935" bgColor={isDark ? 'rgba(229,9,20,0.07)' : '#FDF2F2'} borderColor="rgba(229,9,20,0.12)" delay={200} colors={colors} />
            </View>
          </Animated.View>

          {/* ── SMART INSIGHTS ── */}
          {insights.length > 0 && (
            <View style={s.section}>
              <View style={s.sectionHeader}>
                <Text style={[s.sectionLabel, { color: colors.textTertiary }]}>Smart Insights</Text>
                <Pressable onPress={() => navigation.navigate('Stats')}>
                  <Text style={[s.seeAll, { color: '#E50914' }]}>View all →</Text>
                </Pressable>
              </View>
              {insights.slice(0, 3).map((ins, i) => (
                <InsightPill key={i} ins={ins} idx={i} colors={colors} />
              ))}
            </View>
          )}

          {/* ── QUICK NAV ── */}
          <Animated.View entering={FadeInDown.delay(300).springify().damping(22)} style={s.section}>
            <Text style={[s.sectionLabel, { color: colors.textTertiary }]}>Navigate</Text>
            <View style={s.navGrid}>
              {QuickNavItems.map((item, i) => {
                const scale = useSharedValue(1);
                const aStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
                return (
                  <Animated.View key={item.label} entering={FadeInDown.delay(300 + i * 40).springify()} style={[aStyle, s.navItemWrap]}>
                    <Pressable
                      onPressIn={() => { scale.value = withSpring(0.94, { damping: 14 }); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                      onPressOut={() => { scale.value = withSpring(1, { damping: 14 }); }}
                      onPress={() => navigation.navigate(item.screen)}
                      style={[s.navItem, { backgroundColor: colors.surface, borderColor: colors.border }]}
                    >
                      <View style={[s.navIconWrap, { backgroundColor: `${item.accent}14` }]}>
                        <Text style={{ fontSize: 20 }}>{item.icon}</Text>
                      </View>
                      <Text style={[s.navLabel, { color: colors.textSecondary }]}>{item.label}</Text>
                    </Pressable>
                  </Animated.View>
                );
              })}
            </View>
          </Animated.View>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1 },
  scroll: { paddingBottom: 120 },
  heroOuter: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4 },
  heroCard: {
    borderRadius: 28, padding: 22, borderWidth: 1,
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1, shadowRadius: 24, elevation: 8,
  },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 },
  heroEyebrow: { fontSize: 11, fontWeight: '600', letterSpacing: 0.3, marginBottom: 6 },
  streakBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 9, paddingVertical: 4, borderRadius: 999, borderWidth: 0.5, alignSelf: 'flex-start' },
  streakTxt: { fontSize: 11, fontWeight: '700' },
  eyeBtn: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  heroAmount: { fontSize: 46, fontWeight: '800', letterSpacing: -2, lineHeight: 52, marginBottom: 14 },
  pillsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  pill: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, borderWidth: 0.5 },
  pillTxt: { fontSize: 11, fontWeight: '700' },
  miniChart: { marginTop: 16, opacity: 0.85 },
  content: { paddingHorizontal: 16, paddingTop: 16 },
  section: { marginBottom: 24 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 12 },
  seeAll: { fontSize: 12, fontWeight: '700' },
  metricsRow: { flexDirection: 'row', gap: 10 },
  navGrid: { flexDirection: 'row', gap: 10 },
  navItemWrap: { flex: 1 },
  navItem: { borderRadius: 18, paddingVertical: 16, paddingHorizontal: 10, alignItems: 'center', gap: 8, borderWidth: 0.5 },
  navIconWrap: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  navLabel: { fontSize: 11, fontWeight: '600' },
});
