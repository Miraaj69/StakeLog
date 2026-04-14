// HomeScreen.js — Premium hero card, glass UI, animated numbers
import React, { useMemo, useRef } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Pressable,
  Animated as RNAnimated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTheme } from './useTheme';
import { useStore, useStats } from './store';
import Chart from './Chart';
import { formatMoney, calcPnLTimeSeries, calcSmartInsights, calcSportStats, calcBookieStats, getCurrencySymbol } from './calculations';

// Animated number counter
function AnimatedNumber({ value, style, prefix, suffix }) {
  prefix = prefix || '';
  suffix = suffix || '';
  return <Text style={style}>{prefix}{value}{suffix}</Text>;
}

// Streak fire display
function StreakBadge({ streak, colors }) {
  if (!streak.type || streak.current < 2) return null;
  var isWin = streak.type === 'Won';
  return (
    <View style={[sb.wrap, { backgroundColor: isWin ? 'rgba(26,158,74,0.15)' : 'rgba(217,48,37,0.15)' }]}>
      <Text style={sb.fire}>{isWin ? '🔥' : '❄️'}</Text>
      <Text style={[sb.txt, { color: isWin ? '#1A9E4A' : '#D93025' }]}>
        {streak.current} {isWin ? 'win' : 'loss'} streak
      </Text>
    </View>
  );
}
var sb = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999 },
  fire: { fontSize: 14 },
  txt:  { fontSize: 12, fontWeight: '700' },
});

// Insight card
function InsightCard({ insight, colors, index }) {
  var cfg = {
    positive: { bg: 'rgba(26,158,74,0.1)',  border: 'rgba(26,158,74,0.25)',  color: '#1A9E4A' },
    warning:  { bg: 'rgba(224,123,0,0.1)',  border: 'rgba(224,123,0,0.25)', color: '#E07B00' },
    info:     { bg: 'rgba(229,9,20,0.08)',  border: 'rgba(229,9,20,0.2)',   color: '#E50914' },
  }[insight.type] || { bg: 'rgba(0,0,0,0.04)', border: 'rgba(0,0,0,0.08)', color: '#666' };

  return (
    <Animated.View entering={FadeInDown.delay(300 + index * 60).springify()}
      style={[ic.wrap, { backgroundColor: cfg.bg, borderColor: cfg.border }]}>
      <Text style={ic.icon}>{insight.icon}</Text>
      <Text style={[ic.text, { color: cfg.color }]}>{insight.text}</Text>
    </Animated.View>
  );
}
var ic = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 14, padding: 13, borderWidth: 0.5 },
  icon: { fontSize: 18, flexShrink: 0 },
  text: { flex: 1, fontSize: 13, fontWeight: '600', lineHeight: 19 },
});

export default function HomeScreen({ navigation }) {
  var { colors, isDark } = useTheme();
  var bets          = useStore(function(s) { return s.bets; });
  var bookies       = useStore(function(s) { return s.bookies; });
  var sports        = useStore(function(s) { return s.sports; });
  var currency      = useStore(function(s) { return s.currency; });
  var loading       = useStore(function(s) { return s.loading; });
  var stats         = useStats();
  var [hidden, setHidden] = React.useState(false);
  var currSym = getCurrencySymbol(currency);

  var pnlData    = useMemo(function() { return calcPnLTimeSeries(bets); }, [bets]);
  var sportStats = useMemo(function() { return calcSportStats(bets, sports); }, [bets, sports]);
  var bookieStats = useMemo(function() { return calcBookieStats(bets, bookies); }, [bets, bookies]);
  var insights   = useMemo(function() { return calcSmartInsights(bets, sportStats, bookieStats, stats.streak, stats.winRate); }, [bets, sportStats, bookieStats, stats]);

  var isProfit = stats.totalPnL >= 0;

  // Hero gradient — subtle, not aggressive
  var heroGrad = isDark
    ? (isProfit
        ? ['#0A0A0A', '#0D1F14', '#0A0A0A']
        : ['#0A0A0A', '#1F0D0D', '#0A0A0A'])
    : (isProfit
        ? ['#F0FDF4', '#DCFCE7', '#F0FDF4']
        : ['#FFF5F5', '#FEE2E2', '#FFF5F5']);

  if (loading) return <View style={[s.screen, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}><Text style={{ color: colors.textTertiary }}>Loading…</Text></View>;

  return (
    <SafeAreaView style={[s.screen, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* ── Hero Card ── */}
        <Animated.View entering={FadeIn.duration(400)} style={s.heroOuter}>
          <LinearGradient colors={heroGrad} style={[s.heroCard, { borderColor: isProfit ? 'rgba(26,158,74,0.15)' : 'rgba(217,48,37,0.12)' }]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>

            {/* Top row */}
            <View style={s.heroTop}>
              <View>
                <Text style={[s.heroLabel, { color: colors.textTertiary }]}>NET P&L — ALL TIME</Text>
                <Pressable onPress={() => { setHidden(function(h) { return !h; }); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}>
                  <Text style={[s.heroAmount, { color: isProfit ? '#1A9E4A' : '#D93025' }]} adjustsFontSizeToFit numberOfLines={1}>
                    {hidden ? currSym + '••••••' : (isProfit ? '+' : '') + formatMoney(stats.totalPnL, currSym)}
                  </Text>
                </Pressable>
              </View>
              <Pressable onPress={() => { setHidden(function(h) { return !h; }); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                style={[s.eyeBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' }]}>
                <Text style={{ fontSize: 18 }}>{hidden ? '👁️' : '🙈'}</Text>
              </Pressable>
            </View>

            {/* Pills row */}
            <View style={s.pillsRow}>
              {stats.roi && (
                <View style={[s.pill, { backgroundColor: isProfit ? 'rgba(26,158,74,0.12)' : 'rgba(217,48,37,0.1)', borderColor: isProfit ? 'rgba(26,158,74,0.25)' : 'rgba(217,48,37,0.2)' }]}>
                  <Text style={[s.pillTxt, { color: isProfit ? '#1A9E4A' : '#D93025' }]}>
                    {isProfit ? '↑' : '↓'} {isProfit ? '+' : ''}{stats.roi}% ROI
                  </Text>
                </View>
              )}
              {stats.winRate && (
                <View style={[s.pill, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', borderColor: colors.border }]}>
                  <Text style={[s.pillTxt, { color: colors.textSecondary }]}>{stats.winRate}% WR</Text>
                </View>
              )}
              <StreakBadge streak={stats.streak} colors={colors} />
            </View>

            {/* Mini chart */}
            {pnlData.length >= 2 && (
              <View style={{ marginTop: 12, opacity: 0.85 }}>
                <Chart data={pnlData} color={isProfit ? '#1A9E4A' : '#D93025'} height={60} currSym={currSym} />
              </View>
            )}
          </LinearGradient>
        </Animated.View>

        <View style={s.content}>

          {/* ── Session grid ── */}
          <Animated.View entering={FadeInDown.delay(80).springify()} style={s.section}>
            <Text style={[s.sectionLbl, { color: colors.textTertiary }]}>PERFORMANCE</Text>
            <View style={s.row3}>
              {[
                { label: 'Today',  value: hidden ? '••' : (stats.todayPnL >= 0 ? '+' : '') + formatMoney(stats.todayPnL, currSym),  color: stats.todayPnL > 0 ? '#1A9E4A' : stats.todayPnL < 0 ? '#D93025' : colors.textTertiary },
                { label: 'Week',   value: hidden ? '••' : (stats.weekPnL  >= 0 ? '+' : '') + formatMoney(stats.weekPnL,  currSym),  color: stats.weekPnL  > 0 ? '#1A9E4A' : stats.weekPnL  < 0 ? '#D93025' : colors.textTertiary },
                { label: 'Month',  value: hidden ? '••' : (stats.monthPnL >= 0 ? '+' : '') + formatMoney(stats.monthPnL, currSym),  color: stats.monthPnL > 0 ? '#1A9E4A' : stats.monthPnL < 0 ? '#D93025' : colors.textTertiary },
              ].map(function(item) {
                return (
                  <View key={item.label} style={[s.sessionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <Text style={[s.sessionVal, { color: item.color }]}>{item.value}</Text>
                    <Text style={[s.sessionLbl, { color: colors.textTertiary }]}>{item.label}</Text>
                  </View>
                );
              })}
            </View>
          </Animated.View>

          {/* ── Key stats ── */}
          <Animated.View entering={FadeInDown.delay(130).springify()} style={s.section}>
            <View style={s.row3}>
              {[
                { label: 'Total',   value: String(stats.totalBets),    color: colors.textPrimary, bg: colors.surface,   border: colors.border },
                { label: 'Won',     value: String(stats.wonCount),     color: '#1A9E4A', bg: '#E8F8EE', border: '#A7DFB9' },
                { label: 'Lost',    value: String(stats.lostCount),    color: '#D93025', bg: '#FDECEA', border: '#F5B8B2' },
              ].map(function(item) {
                return (
                  <View key={item.label} style={[s.statCard, { backgroundColor: item.bg, borderColor: item.border }]}>
                    <Text style={[s.statVal, { color: item.color }]}>{item.value}</Text>
                    <Text style={[s.statLbl, { color: item.color, opacity: 0.65 }]}>{item.label}</Text>
                  </View>
                );
              })}
            </View>
          </Animated.View>

          {/* ── Smart Insights ── */}
          {insights.length > 0 && (
            <Animated.View entering={FadeInDown.delay(180).springify()} style={s.section}>
              <View style={s.sectionHeaderRow}>
                <Text style={[s.sectionLbl, { color: colors.textTertiary }]}>SMART INSIGHTS</Text>
                <Pressable onPress={() => navigation.navigate('Stats')}>
                  <Text style={{ color: '#E50914', fontSize: 12, fontWeight: '700' }}>See All →</Text>
                </Pressable>
              </View>
              <View style={{ gap: 8 }}>
                {insights.slice(0, 3).map(function(ins, i) {
                  return <InsightCard key={i} insight={ins} colors={colors} index={i} />;
                })}
              </View>
            </Animated.View>
          )}

          {/* ── Quick nav ── */}
          <Animated.View entering={FadeInDown.delay(240).springify()} style={[s.section, { marginBottom: 100 }]}>
            <View style={s.row4}>
              {[
                { icon: '📋', label: 'Bets',     screen: 'Bets'     },
                { icon: '📊', label: 'Analytics', screen: 'Stats'    },
                { icon: '💰', label: 'Bankroll',  screen: 'Bankroll' },
                { icon: '⚙️', label: 'Settings',  screen: 'Settings' },
              ].map(function(item) {
                return (
                  <Pressable key={item.label}
                    onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); navigation.navigate(item.screen); }}
                    style={({ pressed }) => [s.navItem, { backgroundColor: colors.surface, borderColor: colors.border, opacity: pressed ? 0.75 : 1 }]}>
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
  screen: { flex: 1 },
  heroOuter: { padding: 16, paddingBottom: 0 },
  heroCard: {
    borderRadius: 24, padding: 20, borderWidth: 1,
    shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.08, shadowRadius: 20, elevation: 6,
  },
  heroTop:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  heroLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 6 },
  heroAmount:{ fontSize: 42, fontWeight: '800', letterSpacing: -2, lineHeight: 46 },
  eyeBtn:    { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  pillsRow:  { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill:      { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 11, paddingVertical: 5, borderRadius: 999, borderWidth: 0.5 },
  pillTxt:   { fontSize: 12, fontWeight: '700' },
  content:   { padding: 16 },
  section:   { marginBottom: 20 },
  sectionLbl:{ fontSize: 10, fontWeight: '700', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 10 },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  row3: { flexDirection: 'row', gap: 8 },
  row4: { flexDirection: 'row', gap: 8 },
  sessionCard: { flex: 1, borderRadius: 16, padding: 13, borderWidth: 0.5, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  sessionVal: { fontSize: 16, fontWeight: '800', letterSpacing: -0.5, marginBottom: 3 },
  sessionLbl: { fontSize: 9, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6 },
  statCard:  { flex: 1, borderRadius: 16, padding: 13, borderWidth: 0.5 },
  statVal:   { fontSize: 24, fontWeight: '800', letterSpacing: -0.8, marginBottom: 3 },
  statLbl:   { fontSize: 9, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6 },
  navItem:   { flex: 1, borderRadius: 16, paddingVertical: 14, paddingHorizontal: 8, alignItems: 'center', borderWidth: 0.5, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  navLbl:    { fontSize: 11, fontWeight: '600' },
});
