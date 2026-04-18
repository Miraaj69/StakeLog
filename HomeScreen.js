// HomeScreen.js — Premium v2: Dark glass hero, goal bar, streak, gamification, smart insights
import React, { useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeIn, useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTheme } from './useTheme';
import { useStore, useStats } from './store';
import Chart from './Chart';
import {
  formatMoney, calcPnLTimeSeries, calcSmartInsights,
  calcSportStats, calcBookieStats, getCurrencySymbol, ACHIEVEMENTS,
} from './calculations';

// ── Streak Banner ──────────────────────────────────────────────
function StreakBanner({ streak, colors }) {
  if (!streak.type || streak.current < 2) return null;
  var isWin = streak.type === 'Won';
  return (
    <Animated.View
      entering={FadeInDown.delay(60).springify()}
      style={[sb.wrap, {
        backgroundColor: isWin ? 'rgba(74,222,128,0.08)' : 'rgba(248,113,113,0.08)',
        borderColor: isWin ? 'rgba(74,222,128,0.22)' : 'rgba(248,113,113,0.22)',
      }]}
    >
      <Text style={sb.emoji}>{isWin ? '🔥' : '❄️'}</Text>
      <View style={{ flex: 1 }}>
        <Text style={[sb.title, { color: isWin ? '#4ADE80' : '#F87171' }]}>
          {streak.current} {isWin ? 'Win' : 'Loss'} Streak
        </Text>
        <Text style={[sb.sub, { color: colors.textTertiary }]}>
          Best ever: {streak.best} • {isWin ? 'Keep it going!' : 'Take a break ⚠️'}
        </Text>
      </View>
    </Animated.View>
  );
}
var sb = StyleSheet.create({
  wrap:  { flexDirection: 'row', alignItems: 'center', gap: 12, marginHorizontal: 16, marginBottom: 12, borderRadius: 18, padding: 14, borderWidth: 0.5 },
  emoji: { fontSize: 28 },
  title: { fontSize: 15, fontWeight: '800', letterSpacing: -0.3 },
  sub:   { fontSize: 11, fontWeight: '500', marginTop: 2 },
});

// ── Goal Progress Card ─────────────────────────────────────────
function GoalCard({ stats, monthlyGoal, colors, isDark }) {
  if (!monthlyGoal || monthlyGoal <= 0) return null;
  var pct = Math.min(100, Math.max(0, stats.goalProgress));
  var isAchieved = pct >= 100;
  return (
    <Animated.View
      entering={FadeInDown.delay(120).springify()}
      style={[gc.card, {
        backgroundColor: colors.surface,
        borderColor: isAchieved ? (isDark ? 'rgba(74,222,128,0.3)' : 'rgba(74,222,128,0.4)') : colors.border,
      }]}
    >
      <View style={gc.header}>
        <Text style={[gc.title, { color: colors.textPrimary }]}>
          {isAchieved ? '🏆 Goal Achieved!' : '🎯 Monthly Goal'}
        </Text>
        <View style={[gc.badge, {
          backgroundColor: isAchieved ? 'rgba(74,222,128,0.15)' : 'rgba(124,107,255,0.12)',
          borderColor: isAchieved ? 'rgba(74,222,128,0.3)' : 'rgba(124,107,255,0.25)',
        }]}>
          <Text style={[gc.badgeTxt, { color: isAchieved ? '#4ADE80' : '#7C6BFF' }]}>
            {Math.round(pct)}%
          </Text>
        </View>
      </View>
      <View style={[gc.barBg, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }]}>
        <Animated.View style={[gc.barFill, { width: pct + '%' }]} />
      </View>
      <View style={gc.meta}>
        <Text style={[gc.metaLeft, { color: colors.textTertiary }]}>
          {formatMoney(stats.monthPnL, getCurrencySymbol('INR'))} earned
        </Text>
        <Text style={[gc.metaRight, { color: '#7C6BFF' }]}>
          {formatMoney(monthlyGoal, getCurrencySymbol('INR'))} target
        </Text>
      </View>
    </Animated.View>
  );
}
var gc = StyleSheet.create({
  card:     { marginHorizontal: 16, marginBottom: 12, borderRadius: 22, padding: 18, borderWidth: 0.5 },
  header:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  title:    { fontSize: 14, fontWeight: '700' },
  badge:    { paddingHorizontal: 11, paddingVertical: 4, borderRadius: 999, borderWidth: 0.5 },
  badgeTxt: { fontSize: 11, fontWeight: '800' },
  barBg:    { borderRadius: 999, height: 8, overflow: 'hidden', marginBottom: 8 },
  barFill:  { height: '100%', borderRadius: 999, backgroundColor: '#7C6BFF' },
  meta:     { flexDirection: 'row', justifyContent: 'space-between' },
  metaLeft: { fontSize: 11, fontWeight: '600' },
  metaRight:{ fontSize: 11, fontWeight: '700' },
});

// ── XP Gamification Card ───────────────────────────────────────
function XPCard({ stats, colors, isDark }) {
  var xpInLevel  = stats.xp % 500;
  var xpPct      = (xpInLevel / 500) * 100;
  return (
    <Animated.View
      entering={FadeInDown.delay(200).springify()}
      style={[xp.card, {
        backgroundColor: isDark ? '#1A1228' : '#F5F3FF',
        borderColor: isDark ? 'rgba(168,157,255,0.2)' : 'rgba(124,107,255,0.2)',
      }]}
    >
      <View style={xp.row}>
        <View style={{ flex: 1 }}>
          <Text style={[xp.level, { color: '#A89DFF' }]}>Level {stats.xpLevel} — {stats.levelName}</Text>
          <Text style={[xp.title, { color: colors.textPrimary }]}>{stats.xpToNext} XP to next level</Text>
        </View>
        <View style={[xp.xpBadge, { backgroundColor: 'rgba(124,107,255,0.15)', borderColor: 'rgba(124,107,255,0.3)' }]}>
          <Text style={xp.xpNum}>{stats.xp}</Text>
          <Text style={xp.xpLbl}>XP</Text>
        </View>
      </View>
      <View style={[xp.barBg, { backgroundColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)' }]}>
        <View style={[xp.barFill, { width: xpPct + '%' }]} />
      </View>
    </Animated.View>
  );
}
var xp = StyleSheet.create({
  card:    { marginHorizontal: 16, marginBottom: 12, borderRadius: 22, padding: 18, borderWidth: 0.5 },
  row:     { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  level:   { fontSize: 10, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 3 },
  title:   { fontSize: 14, fontWeight: '700' },
  xpBadge: { borderRadius: 14, padding: 10, alignItems: 'center', borderWidth: 0.5 },
  xpNum:   { fontSize: 18, fontWeight: '900', color: '#7C6BFF', letterSpacing: -0.5 },
  xpLbl:   { fontSize: 8,  fontWeight: '700', letterSpacing: 1, color: '#A89DFF', textTransform: 'uppercase' },
  barBg:   { borderRadius: 999, height: 7, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 999, backgroundColor: '#7C6BFF' },
});

// ── Smart Insight Row ──────────────────────────────────────────
function InsightRow({ ins, idx, colors }) {
  var cfg = {
    positive: { bg: 'rgba(74,222,128,0.07)',  border: 'rgba(74,222,128,0.22)',  color: '#4ADE80' },
    warning:  { bg: 'rgba(252,211,77,0.07)',  border: 'rgba(252,211,77,0.22)',  color: '#FCD34D' },
    info:     { bg: 'rgba(124,107,255,0.07)', border: 'rgba(124,107,255,0.22)', color: '#A89DFF' },
  }[ins.type] || { bg: colors.surfaceVariant, border: colors.border, color: colors.textSecondary };
  return (
    <Animated.View
      entering={FadeInDown.delay(250 + idx * 50).springify()}
      style={[ir.wrap, { backgroundColor: cfg.bg, borderColor: cfg.border }]}
    >
      <Text style={{ fontSize: 16, flexShrink: 0 }}>{ins.icon}</Text>
      <Text style={[ir.txt, { color: cfg.color }]}>{ins.text}</Text>
    </Animated.View>
  );
}
var ir = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 14, padding: 13, borderWidth: 0.5, marginBottom: 8 },
  txt:  { flex: 1, fontSize: 13, fontWeight: '600', lineHeight: 19 },
});

// ── Perf Card ─────────────────────────────────────────────────
function PerfCard({ label, value, color, colors, isDark }) {
  return (
    <View style={[pc.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Text style={[pc.val, { color }]} numberOfLines={1} adjustsFontSizeToFit>{value}</Text>
      <Text style={[pc.lbl, { color: colors.textTertiary }]}>{label}</Text>
    </View>
  );
}
var pc = StyleSheet.create({
  card: { flex: 1, borderRadius: 18, padding: 13, borderWidth: 0.5 },
  val:  { fontSize: 16, fontWeight: '800', letterSpacing: -0.5, marginBottom: 3 },
  lbl:  { fontSize: 9, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8 },
});

// ── Count Card ────────────────────────────────────────────────
function CountCard({ label, value, color, bg, border }) {
  return (
    <View style={[cc.card, { backgroundColor: bg, borderColor: border }]}>
      <Text style={[cc.val, { color }]} numberOfLines={1} adjustsFontSizeToFit>{value}</Text>
      <Text style={[cc.lbl, { color, opacity: 0.65 }]}>{label}</Text>
    </View>
  );
}
var cc = StyleSheet.create({
  card: { flex: 1, borderRadius: 18, padding: 13, borderWidth: 0.5 },
  val:  { fontSize: 26, fontWeight: '800', letterSpacing: -1, marginBottom: 2 },
  lbl:  { fontSize: 9, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8 },
});

// ── Main Screen ───────────────────────────────────────────────
export default function HomeScreen({ navigation }) {
  var { colors, isDark } = useTheme();
  var bets        = useStore(function(s) { return s.bets; });
  var bookies     = useStore(function(s) { return s.bookies; });
  var sports      = useStore(function(s) { return s.sports; });
  var currency    = useStore(function(s) { return s.currency; });
  var monthlyGoal = useStore(function(s) { return s.monthlyGoal; });
  var loading     = useStore(function(s) { return s.loading; });
  var stats       = useStats();
  var [hidden, setHidden] = React.useState(false);
  var currSym     = getCurrencySymbol(currency);

  var pnlData    = useMemo(function() { return calcPnLTimeSeries(bets); }, [bets]);
  var sportStats = useMemo(function() { return calcSportStats(bets, sports); }, [bets, sports]);
  var bookieStats = useMemo(function() { return calcBookieStats(bets, bookies); }, [bets, bookies]);
  var insights   = useMemo(function() { return calcSmartInsights(bets, sportStats, bookieStats, stats.streak, stats.winRate); }, [bets, sportStats, bookieStats, stats]);

  var isProfit   = stats.totalPnL >= 0;
  var heroColors = isDark
    ? isProfit ? ['#0F1F16', '#121E16', '#0A0A0F'] : ['#1A0A0A', '#1E1010', '#0A0A0F']
    : isProfit ? ['#F0FBF4', '#FFFFFF', '#F4F5F9'] : ['#FDF2F2', '#FFFFFF', '#F4F5F9'];

  if (loading) {
    return (
      <View style={[s.screen, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: colors.textTertiary, fontSize: 14 }}>Loading…</Text>
      </View>
    );
  }

  // Empty state
  if (bets.length === 0) {
    return (
      <SafeAreaView style={[s.screen, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={s.topBar}>
          <View>
            <Text style={[s.greeting, { color: colors.textTertiary }]}>Good day 👋</Text>
            <Text style={[s.appName, { color: colors.textPrimary }]}>Stake Log</Text>
          </View>
        </View>
        <View style={s.emptyWrap}>
          <Text style={s.emptyIllus}>🎯</Text>
          <Text style={[s.emptyTitle, { color: colors.textPrimary }]}>Start tracking your bets</Text>
          <Text style={[s.emptySub, { color: colors.textTertiary }]}>Log your first bet to see analytics, insights, and performance charts here.</Text>
          <Pressable
            style={[s.emptyCta, { backgroundColor: '#7C6BFF' }]}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); navigation.navigate('Bets'); }}
          >
            <Text style={s.emptyCtaTxt}>+ Add First Bet</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[s.screen, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* ── Top Bar ── */}
        <View style={s.topBar}>
          <View>
            <Text style={[s.greeting, { color: colors.textTertiary }]}>
              {new Date().getHours() < 12 ? 'Good morning 👋' : new Date().getHours() < 18 ? 'Good afternoon 👋' : 'Good evening 👋'}
            </Text>
            <Text style={[s.appName, { color: colors.textPrimary }]}>Stake Log</Text>
          </View>
          <Pressable
            onPress={() => { setHidden(function(h) { return !h; }); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
            style={[s.eyeBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' }]}
          >
            <Text style={{ fontSize: 18 }}>{hidden ? '👁️' : '🙈'}</Text>
          </Pressable>
        </View>

        {/* ── HERO — glassmorphism ── */}
        <Animated.View entering={FadeIn.duration(350)} style={s.heroOuter}>
          <LinearGradient
            colors={heroColors}
            style={[s.heroCard, { borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          >
            <Text style={[s.heroLbl, { color: colors.textTertiary }]}>NET P&L — ALL TIME</Text>
            <Text
              style={[s.heroAmount, { color: isProfit ? '#4ADE80' : '#F87171' }]}
              adjustsFontSizeToFit numberOfLines={1}
            >
              {hidden ? currSym + '••••••' : (isProfit ? '+' : '') + formatMoney(stats.totalPnL, currSym)}
            </Text>

            {/* Pills */}
            <View style={s.pillsRow}>
              {stats.roi && (
                <View style={[s.pill, {
                  backgroundColor: isProfit ? 'rgba(74,222,128,0.12)' : 'rgba(248,113,113,0.10)',
                  borderColor: isProfit ? 'rgba(74,222,128,0.28)' : 'rgba(248,113,113,0.25)',
                }]}>
                  <Text style={[s.pillTxt, { color: isProfit ? '#4ADE80' : '#F87171' }]}>
                    {isProfit ? '↑' : '↓'} {isProfit ? '+' : ''}{stats.roi}% ROI
                  </Text>
                </View>
              )}
              {stats.winRate && (
                <View style={[s.pill, { backgroundColor: 'rgba(124,107,255,0.12)', borderColor: 'rgba(124,107,255,0.28)' }]}>
                  <Text style={[s.pillTxt, { color: '#A89DFF' }]}>{stats.winRate}% WR</Text>
                </View>
              )}
              {stats.streak.current >= 2 && (
                <View style={[s.pill, {
                  backgroundColor: stats.streak.type === 'Won' ? 'rgba(74,222,128,0.10)' : 'rgba(248,113,113,0.10)',
                  borderColor: stats.streak.type === 'Won' ? 'rgba(74,222,128,0.25)' : 'rgba(248,113,113,0.22)',
                }]}>
                  <Text style={[s.pillTxt, { color: stats.streak.type === 'Won' ? '#4ADE80' : '#F87171' }]}>
                    {stats.streak.type === 'Won' ? '🔥' : '❄️'} {stats.streak.current} streak
                  </Text>
                </View>
              )}
            </View>

            {/* Chart inside hero */}
            {pnlData.length >= 2 && (
              <View style={{ marginTop: 14, opacity: 0.85 }}>
                <Chart data={pnlData} color={isProfit ? '#4ADE80' : '#F87171'} height={62} currSym={currSym} />
              </View>
            )}
          </LinearGradient>
        </Animated.View>

        <View style={s.content}>

          {/* ── PERFORMANCE (Time) ── */}
          <Animated.View entering={FadeInDown.delay(80).springify()} style={s.section}>
            <Text style={[s.sectionLbl, { color: colors.textTertiary }]}>PERFORMANCE</Text>
            <View style={s.row3}>
              <PerfCard label="Today" colors={colors}
                value={hidden ? '••' : (stats.todayPnL >= 0 ? '+' : '') + formatMoney(stats.todayPnL, currSym)}
                color={stats.todayPnL > 0 ? '#4ADE80' : stats.todayPnL < 0 ? '#F87171' : colors.textTertiary} />
              <PerfCard label="Week" colors={colors}
                value={hidden ? '••' : (stats.weekPnL >= 0 ? '+' : '') + formatMoney(stats.weekPnL, currSym)}
                color={stats.weekPnL > 0 ? '#4ADE80' : stats.weekPnL < 0 ? '#F87171' : colors.textTertiary} />
              <PerfCard label="Month" colors={colors}
                value={hidden ? '••' : (stats.monthPnL >= 0 ? '+' : '') + formatMoney(stats.monthPnL, currSym)}
                color={stats.monthPnL > 0 ? '#4ADE80' : stats.monthPnL < 0 ? '#F87171' : colors.textTertiary} />
            </View>
          </Animated.View>

          {/* ── COUNTS ── */}
          <Animated.View entering={FadeInDown.delay(110).springify()} style={s.section}>
            <View style={s.row3}>
              <CountCard label="Total"   value={String(stats.totalBets)} color={colors.textPrimary}    bg={colors.surface}                border={colors.border} />
              <CountCard label="Won"     value={String(stats.wonCount)}  color="#4ADE80" bg={isDark ? 'rgba(74,222,128,0.08)' : '#F0FBF4'} border={isDark ? 'rgba(74,222,128,0.2)' : '#A7DFB9'} />
              <CountCard label="Lost"    value={String(stats.lostCount)} color="#F87171" bg={isDark ? 'rgba(248,113,113,0.08)' : '#FDF2F2'} border={isDark ? 'rgba(248,113,113,0.2)' : '#FCA5A5'} />
            </View>
          </Animated.View>

          {/* ── STREAK BANNER ── */}
          <StreakBanner streak={stats.streak} colors={colors} />

          {/* ── GOAL PROGRESS ── */}
          <GoalCard stats={stats} monthlyGoal={monthlyGoal} colors={colors} isDark={isDark} />

          {/* ── XP GAMIFICATION ── */}
          {stats.totalBets >= 3 && <XPCard stats={stats} colors={colors} isDark={isDark} />}

          {/* ── SMART INSIGHTS ── */}
          {insights.length > 0 && (
            <Animated.View entering={FadeInDown.delay(160).springify()} style={s.section}>
              <View style={s.sectionHeader}>
                <Text style={[s.sectionLbl, { color: colors.textTertiary }]}>SMART INSIGHTS</Text>
                <Pressable onPress={() => navigation.navigate('Stats')}>
                  <Text style={{ color: '#7C6BFF', fontSize: 12, fontWeight: '700' }}>See All →</Text>
                </Pressable>
              </View>
              {insights.slice(0, 3).map(function(ins, i) {
                return <InsightRow key={i} ins={ins} idx={i} colors={colors} />;
              })}
            </Animated.View>
          )}

          {/* ── QUICK NAV ── */}
          <Animated.View entering={FadeInDown.delay(220).springify()} style={[s.section, { marginBottom: 110 }]}>
            <Text style={[s.sectionLbl, { color: colors.textTertiary }]}>QUICK ACCESS</Text>
            <View style={s.row4}>
              {[
                { icon: '📋', label: 'Bets',     screen: 'Bets' },
                { icon: '📊', label: 'Analytics', screen: 'Stats' },
                { icon: '💰', label: 'Bankroll',  screen: 'Bankroll' },
                { icon: '⚙️', label: 'Settings',  screen: 'Settings' },
              ].map(function(item) {
                return (
                  <Pressable key={item.label}
                    onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); navigation.navigate(item.screen); }}
                    style={({ pressed }) => [s.navItem, {
                      backgroundColor: colors.surface, borderColor: colors.border,
                      opacity: pressed ? 0.75 : 1,
                    }]}
                  >
                    <Text style={{ fontSize: 22, marginBottom: 5 }}>{item.icon}</Text>
                    <Text style={[s.navLbl, { color: colors.textSecondary }]}>{item.label}</Text>
                  </Pressable>
                );
              })}
            </View>
          </Animated.View>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

var s = StyleSheet.create({
  screen:    { flex: 1 },
  topBar:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4 },
  greeting:  { fontSize: 12, fontWeight: '600' },
  appName:   { fontSize: 24, fontWeight: '800', letterSpacing: -0.8 },
  eyeBtn:    { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },

  heroOuter: { padding: 16, paddingBottom: 0 },
  heroCard:  {
    borderRadius: 28, padding: 22, borderWidth: 0.5,
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.12, shadowRadius: 24, elevation: 8,
  },
  heroLbl:    { fontSize: 9, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 8 },
  heroAmount: { fontSize: 44, fontWeight: '800', letterSpacing: -2, lineHeight: 50, marginBottom: 14 },
  pillsRow:   { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill:       { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, borderWidth: 0.5 },
  pillTxt:    { fontSize: 12, fontWeight: '700' },

  content:       { padding: 16 },
  section:       { marginBottom: 16 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  sectionLbl:    { fontSize: 9, fontWeight: '700', letterSpacing: 1.4, textTransform: 'uppercase', marginBottom: 10 },
  row3:          { flexDirection: 'row', gap: 8 },
  row4:          { flexDirection: 'row', gap: 8 },

  navItem: {
    flex: 1, borderRadius: 18, paddingVertical: 14, paddingHorizontal: 8,
    alignItems: 'center', borderWidth: 0.5,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  navLbl: { fontSize: 10, fontWeight: '600' },

  emptyWrap:  { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyIllus: { fontSize: 64, marginBottom: 18, opacity: 0.8 },
  emptyTitle: { fontSize: 20, fontWeight: '800', marginBottom: 10, letterSpacing: -0.4 },
  emptySub:   { fontSize: 14, textAlign: 'center', lineHeight: 22, marginBottom: 28 },
  emptyCta:   { borderRadius: 999, paddingHorizontal: 28, paddingVertical: 14 },
  emptyCtaTxt:{ color: '#fff', fontSize: 15, fontWeight: '700' },
});
