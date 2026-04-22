// HomeScreen.js — Phase 2: Premium hero, animated numbers, glassmorphism
import React, { useMemo, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Pressable,
  Animated as RNAnimated, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient as ExpoLinearGradient } from 'expo-linear-gradient';
function LinearGradient(props) {
  try { return <ExpoLinearGradient {...props} />; }
  catch(e) { return <View style={[props.style, { backgroundColor: (props.colors && props.colors[0]) || 'transparent' }]}>{props.children}</View>; }
}
import * as Animated from 'react-native-reanimated';
import { FadeInDown, FadeIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTheme } from './useTheme';
import { useStore, useStats } from './store';
import Chart from './Chart';
import {
  formatMoney, calcPnLTimeSeries, calcSmartInsights,
  calcSportStats, calcBookieStats, getCurrencySymbol,
} from './calculations';

var { width: SW } = Dimensions.get('window');

// Animated counting number
function CountUp({ target, duration, style, prefix, suffix }) {
  var anim = useRef(new RNAnimated.Value(0)).current;
  var prev = useRef(0);

  useEffect(function() {
    if (prev.current === target) return;
    prev.current = target;
    anim.setValue(0);
    RNAnimated.timing(anim, {
      toValue: 1,
      duration: duration || 800,
      useNativeDriver: false,
    }).start();
  }, [target]);

  return (
    <RNAnimated.Text style={style}>
      {anim.interpolate
        ? undefined
        : (prefix||'') + formatMoney(target, '') + (suffix||'')}
    </RNAnimated.Text>
  );
}

// Streak badge
function StreakBadge({ streak }) {
  if (!streak.type || streak.current < 2) return null;
  var win = streak.type === 'Won';
  return (
    <View style={[sb.wrap, { backgroundColor: win ? 'rgba(26,158,74,0.15)' : 'rgba(217,48,37,0.12)', borderColor: win ? 'rgba(26,158,74,0.3)' : 'rgba(217,48,37,0.25)' }]}>
      <Text style={sb.fire}>{win ? '🔥' : '❄️'}</Text>
      <Text style={[sb.txt, { color: win ? '#1A9E4A' : '#D93025' }]}>{streak.current} {win ? 'win' : 'loss'} streak</Text>
    </View>
  );
}
var sb = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, borderWidth: 0.5 },
  fire: { fontSize: 13 },
  txt:  { fontSize: 12, fontWeight: '700' },
});

// Insight row
function InsightRow({ ins, idx, colors }) {
  var cfgMap = {
    positive: { bg: 'rgba(26,158,74,0.08)',  border: 'rgba(26,158,74,0.2)',  color: '#1A9E4A' },
    warning:  { bg: 'rgba(224,123,0,0.08)', border: 'rgba(224,123,0,0.2)', color: '#E07B00' },
    info:     { bg: 'rgba(229,9,20,0.06)',  border: 'rgba(229,9,20,0.15)', color: '#E50914' },
  };
  var cfg = cfgMap[ins.type] || { bg: colors.surfaceVariant, border: colors.border, color: colors.textSecondary };
  return (
    <Animated.default.View entering={FadeInDown.delay(300 + idx * 55).springify()}
      style={[ir.wrap, { backgroundColor: cfg.bg, borderColor: cfg.border }]}>
      <Text style={{ fontSize: 17 }}>{ins.icon}</Text>
      <Text style={[ir.txt, { color: cfg.color }]}>{ins.text}</Text>
    </Animated.default.View>
  );
}
var ir = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 14, padding: 13, borderWidth: 0.5 },
  txt:  { flex: 1, fontSize: 13, fontWeight: '600', lineHeight: 19 },
});

// Loss limit warning
function LossLimitAlert({ stats, colors }) {
  if (!stats.lossLimitHit) return null;
  return (
    <View style={[ll.wrap, { backgroundColor: 'rgba(217,48,37,0.1)', borderColor: 'rgba(217,48,37,0.3)' }]}>
      <Text style={{ fontSize: 18 }}>🛑</Text>
      <Text style={[ll.txt, { color: '#D93025' }]}>Daily loss limit reached! Take a break.</Text>
    </View>
  );
}
var ll = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 14, padding: 13, borderWidth: 0.5, marginBottom: 14 },
  txt:  { flex: 1, fontSize: 13, fontWeight: '700' },
});

export default function HomeScreen({ navigation }) {
  var { colors, isDark } = useTheme();
  var bets      = useStore(function(s) { return s.bets; });
  var bookies   = useStore(function(s) { return s.bookies; });
  var sports    = useStore(function(s) { return s.sports; });
  var currency  = useStore(function(s) { return s.currency; });
  var loading   = useStore(function(s) { return s.loading; });
  var stats     = useStats();
  var [hidden, setHidden] = React.useState(false);
  var currSym   = getCurrencySymbol(currency);

  var pnlData    = useMemo(function() { return calcPnLTimeSeries(bets); }, [bets]);
  var sportStats = useMemo(function() { return calcSportStats(bets, sports); }, [bets, sports]);
  var bookieStats = useMemo(function() { return calcBookieStats(bets, bookies); }, [bets, bookies]);
  var insights   = useMemo(function() { return calcSmartInsights(bets, sportStats, bookieStats, stats.streak, stats.winRate); }, [bets, sportStats, bookieStats, stats]);

  var isProfit = stats.totalPnL >= 0;
  var heroGrad = isDark
    ? ['#111111', '#181818', '#111111']
    : ['#F4F4F8', '#FFFFFF', '#F4F4F8'];

  if (loading) return <View style={{ flex: 1, backgroundColor: colors.background }} />;

  return (
    <SafeAreaView style={[s.screen, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>

        {/* ── Loss limit alert ── */}
        <View style={{ paddingHorizontal: 16, paddingTop: 8 }}>
          <LossLimitAlert stats={stats} colors={colors} />
        </View>

        {/* ── HERO CARD ── */}
        <Animated.default.View entering={FadeIn.duration(350)} style={s.heroOuter}>
          <LinearGradient colors={heroGrad} style={[s.heroCard, {
            borderColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)',
          }]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>

            <View style={s.heroTopRow}>
              <Text style={[s.heroLbl, { color: colors.textTertiary }]}>NET P&L — ALL TIME</Text>
              <Pressable onPress={() => { setHidden(function(h) { return !h; }); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                style={[s.eyeBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' }]}>
                <Text style={{ fontSize: 18 }}>{hidden ? '👁️' : '🙈'}</Text>
              </Pressable>
            </View>

            {/* BIG animated P&L number */}
            <Pressable onPress={() => setHidden(function(h) { return !h; })}>
              <Text style={[s.heroAmount, { color: isProfit ? '#1A9E4A' : '#D93025' }]} adjustsFontSizeToFit numberOfLines={1}>
                {hidden ? currSym + '••••••' : (isProfit ? '+' : '') + formatMoney(stats.totalPnL, currSym)}
              </Text>
            </Pressable>

            {/* Pills */}
            <View style={s.pillsRow}>
              {stats.roi && (
                <View style={[s.pill, { backgroundColor: isProfit ? 'rgba(26,158,74,0.12)' : 'rgba(217,48,37,0.1)', borderColor: isProfit ? 'rgba(26,158,74,0.25)' : 'rgba(217,48,37,0.2)' }]}>
                  <Text style={[s.pillTxt, { color: isProfit ? '#1A9E4A' : '#D93025' }]}>{isProfit ? '↑' : '↓'} {isProfit ? '+' : ''}{stats.roi}% ROI</Text>
                </View>
              )}
              {stats.winRate && (
                <View style={[s.pill, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', borderColor: colors.border }]}>
                  <Text style={[s.pillTxt, { color: colors.textSecondary }]}>{stats.winRate}% WR</Text>
                </View>
              )}
              <StreakBadge streak={stats.streak} />
            </View>

            {/* Mini chart */}
            {pnlData.length >= 2 && (
              <View style={{ marginTop: 14, opacity: 0.8 }}>
                <Chart data={pnlData} color={isProfit ? '#1A9E4A' : '#D93025'} height={58} currSym={currSym} />
              </View>
            )}
          </LinearGradient>
        </Animated.default.View>

        <View style={s.content}>

          {/* ── SECTION 1: Time-based ── */}
          <Animated.default.View entering={FadeInDown.delay(80).springify()} style={s.section}>
            <Text style={[s.sLbl, { color: colors.textTertiary }]}>PERFORMANCE</Text>
            <View style={s.row3}>
              {[
                { label: 'Today', v: stats.todayPnL },
                { label: 'Week',  v: stats.weekPnL  },
                { label: 'Month', v: stats.monthPnL },
              ].map(function(item) {
                var c = item.v > 0 ? '#1A9E4A' : item.v < 0 ? '#D93025' : colors.textTertiary;
                return (
                  <View key={item.label} style={[s.perfCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <Text style={[s.perfVal, { color: c }]} numberOfLines={1} adjustsFontSizeToFit>
                      {hidden ? '••' : (item.v >= 0 ? '+' : '') + formatMoney(item.v, currSym)}
                    </Text>
                    <Text style={[s.perfLbl, { color: colors.textTertiary }]}>{item.label}</Text>
                  </View>
                );
              })}
            </View>
          </Animated.default.View>

          {/* ── SECTION 2: Counts ── */}
          <Animated.default.View entering={FadeInDown.delay(130).springify()} style={s.section}>
            <View style={s.row3}>
              {[
                { label: 'Total',   v: stats.totalBets, color: colors.textPrimary, bg: colors.surface,   border: colors.border },
                { label: 'Won',     v: stats.wonCount,  color: '#1A9E4A', bg: '#E8F8EE', border: '#A7DFB9' },
                { label: 'Lost',    v: stats.lostCount, color: '#D93025', bg: '#FDECEA', border: '#F5B8B2' },
              ].map(function(item) {
                return (
                  <View key={item.label} style={[s.cntCard, { backgroundColor: item.bg, borderColor: item.border }]}>
                    <Text style={[s.cntVal, { color: item.color }]} adjustsFontSizeToFit numberOfLines={1}>{item.v}</Text>
                    <Text style={[s.cntLbl, { color: item.color, opacity: 0.65 }]}>{item.label}</Text>
                  </View>
                );
              })}
            </View>
          </Animated.default.View>

          {/* ── SECTION 3: Insights ── */}
          {insights.length > 0 && (
            <Animated.default.View entering={FadeInDown.delay(180).springify()} style={s.section}>
              <View style={s.rowBetween}>
                <Text style={[s.sLbl, { color: colors.textTertiary }]}>SMART INSIGHTS</Text>
                <Pressable onPress={() => navigation.navigate('Stats')}>
                  <Text style={{ color: '#E50914', fontSize: 12, fontWeight: '700' }}>See All →</Text>
                </Pressable>
              </View>
              <View style={{ gap: 8 }}>
                {insights.slice(0, 3).map(function(ins, i) {
                  return <InsightRow key={i} ins={ins} idx={i} colors={colors} />;
                })}
              </View>
            </Animated.default.View>
          )}

          {/* ── SECTION 4: Quick Nav ── */}
          <Animated.default.View entering={FadeInDown.delay(240).springify()} style={s.section}>
            <View style={s.row4}>
              {[
                { icon: '📋', label: 'Bets',      screen: 'Bets'     },
                { icon: '📊', label: 'Analytics', screen: 'Stats'    },
                { icon: '💰', label: 'Bankroll',  screen: 'Bankroll' },
                { icon: '⚙️', label: 'Settings',  screen: 'Settings' },
              ].map(function(item) {
                return (
                  <Pressable key={item.label}
                    onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); navigation.navigate(item.screen); }}
                    style={({ pressed }) => [s.navItem, { backgroundColor: colors.surface, borderColor: colors.border, transform: [{ scale: pressed ? 0.95 : 1 }] }]}>
                    <Text style={{ fontSize: 22, marginBottom: 5 }}>{item.icon}</Text>
                    <Text style={[s.navLbl, { color: colors.textSecondary }]}>{item.label}</Text>
                  </Pressable>
                );
              })}
            </View>
          </Animated.default.View>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

var s = StyleSheet.create({
  screen:    { flex: 1 },
  heroOuter: { padding: 16, paddingBottom: 0 },
  heroCard:  { borderRadius: 24, padding: 20, borderWidth: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.1, shadowRadius: 24, elevation: 8 },
  heroTopRow:{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  heroLbl:   { fontSize: 10, fontWeight: '700', letterSpacing: 1.2, textTransform: 'uppercase' },
  heroAmount:{ fontSize: 44, fontWeight: '800', letterSpacing: -2, lineHeight: 50, marginBottom: 12 },
  eyeBtn:    { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  pillsRow:  { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill:      { paddingHorizontal: 11, paddingVertical: 5, borderRadius: 999, borderWidth: 0.5 },
  pillTxt:   { fontSize: 12, fontWeight: '700' },
  content:   { padding: 16 },
  section:   { marginBottom: 20 },
  sLbl:      { fontSize: 10, fontWeight: '700', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 10 },
  rowBetween:{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  row3:      { flexDirection: 'row', gap: 8 },
  row4:      { flexDirection: 'row', gap: 8 },
  perfCard:  { flex: 1, borderRadius: 16, padding: 13, borderWidth: 0.5 },
  perfVal:   { fontSize: 15, fontWeight: '800', letterSpacing: -0.4, marginBottom: 3 },
  perfLbl:   { fontSize: 9, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6 },
  cntCard:   { flex: 1, borderRadius: 16, padding: 13, borderWidth: 0.5 },
  cntVal:    { fontSize: 26, fontWeight: '800', letterSpacing: -0.8, marginBottom: 3 },
  cntLbl:    { fontSize: 9, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6 },
  navItem:   { flex: 1, borderRadius: 16, paddingVertical: 14, paddingHorizontal: 8, alignItems: 'center', borderWidth: 0.5 },
  navLbl:    { fontSize: 11, fontWeight: '600' },
});
