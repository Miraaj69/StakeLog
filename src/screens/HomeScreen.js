// screens/HomeScreen.js — Premium Redesign
import React, { useMemo } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeInDown, FadeIn,
  useSharedValue, useAnimatedStyle, withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../hooks/useTheme';
import { useBets } from '../hooks/useBets';
import Chart from '../components/Chart';
import {
  formatMoney, calcPnLTimeSeries, calcSmartInsights,
  calcSportStats, calcBookieStats, calcSessionStats, getCurrencySymbol,
} from '../utils/calculations';
import { Spacing, Radius, Typography, Shadows } from '../utils/theme';

function PressableScale({ onPress, style, children }) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <Pressable
      onPressIn={() => { scale.value = withSpring(0.97, { damping: 15 }); }}
      onPressOut={() => { scale.value = withSpring(1, { damping: 15 }); }}
      onPress={onPress}>
      <Animated.View style={[animStyle, style]}>{children}</Animated.View>
    </Pressable>
  );
}

function SessionCard({ label, value, color, colors }) {
  return (
    <View style={[sessionStyles.card, { backgroundColor: colors.surfaceVariant, borderColor: colors.border }]}>
      <Text style={[sessionStyles.val, { color }]} numberOfLines={1} adjustsFontSizeToFit>{value}</Text>
      <Text style={[sessionStyles.lbl, { color: colors.textTertiary }]}>{label}</Text>
    </View>
  );
}
const sessionStyles = StyleSheet.create({
  card: { flex: 1, borderRadius: Radius.lg, padding: 14, borderWidth: 0.5, alignItems: 'flex-start' },
  val: { fontSize: 17, fontWeight: '700', letterSpacing: -0.5, marginBottom: 3 },
  lbl: { fontSize: 10, fontWeight: '600', letterSpacing: 0.6, textTransform: 'uppercase' },
});

function InsightRow({ insight, colors }) {
  const c = {
    positive: { bg: colors.profitContainer, border: colors.profitBorder, color: colors.profit },
    warning: { bg: colors.pendingContainer, border: colors.pendingBorder, color: colors.pending },
    info: { bg: colors.primaryContainer, border: colors.primaryBorder, color: colors.primary },
  }[insight.type] || { bg: colors.surfaceVariant, border: colors.border, color: colors.textSecondary };

  return (
    <View style={[insightStyles.row, { backgroundColor: c.bg, borderColor: c.border }]}>
      <View style={[insightStyles.iconWrap, { backgroundColor: c.border }]}>
        <Text style={{ fontSize: 14 }}>{insight.icon}</Text>
      </View>
      <Text style={[insightStyles.text, { color: colors.textPrimary }]}>{insight.text}</Text>
    </View>
  );
}
const insightStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: Radius.lg, padding: 12, borderWidth: 0.5 },
  iconWrap: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  text: { fontSize: 13, fontWeight: '500', flex: 1, lineHeight: 19 },
});

export default function HomeScreen({ navigation }) {
  const { colors, isDark } = useTheme();
  const { bets, bookies, sports, bankrollStart, stats, loading } = useBets();
  const [hidden, setHidden] = React.useState(false);
  const [currency] = React.useState('INR');
  const currSym = getCurrencySymbol(currency);

  const pnlData = useMemo(() => calcPnLTimeSeries(bets), [bets]);
  const sportStats = useMemo(() => calcSportStats(bets, sports), [bets, sports]);
  const bookieStats = useMemo(() => calcBookieStats(bets, bookies), [bets, bookies]);
  const session = useMemo(() => calcSessionStats(bets), [bets]);
  const insights = useMemo(() => calcSmartInsights(bets, sportStats, bookieStats, stats.streak, stats.winRate), [bets, sportStats, bookieStats, stats]);

  const pnlPositive = stats.totalPnL >= 0;
  const heroGradient = isDark
    ? (pnlPositive ? ['#0D1F14', '#0A1A10', '#0A0A0A'] : ['#1F0D0D', '#1A0A0A', '#0A0A0A'])
    : (pnlPositive ? ['#E8F5EF', '#FFFFFF'] : ['#FDF0EF', '#FFFFFF']);

  const s = styles(colors);

  if (loading) {
    return (
      <View style={[s.screen, { justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }]}>
        <Text style={{ color: colors.textTertiary, fontSize: 14 }}>Loading…</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={[s.screen, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* ── Hero ── */}
        <Animated.View entering={FadeIn.duration(400)}>
          <LinearGradient colors={heroGradient} style={s.heroCard} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}>

            {/* Top row: label + eye */}
            <View style={s.heroTopRow}>
              <View>
                <Text style={[s.heroLabel, { color: colors.textTertiary }]}>NET P&L · ALL TIME</Text>
              </View>
              <Pressable onPress={() => { setHidden(h => !h); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                style={[s.eyeBtn, { backgroundColor: colors.surfaceVariant, borderColor: colors.border }]}>
                <Text style={{ fontSize: 15 }}>{hidden ? '👁️' : '🙈'}</Text>
              </Pressable>
            </View>

            {/* Amount */}
            <Pressable onPress={() => setHidden(h => !h)}>
              <Text style={[s.heroAmount, { color: pnlPositive ? colors.profit : colors.loss }]} adjustsFontSizeToFit numberOfLines={1}>
                {hidden ? `${currSym}••••••` : (pnlPositive ? '+' : '') + formatMoney(stats.totalPnL, currSym)}
              </Text>
            </Pressable>

            {/* Pills */}
            <View style={s.heroPillRow}>
              {stats.roi && (
                <View style={[s.heroPill, { backgroundColor: pnlPositive ? colors.profitContainer : colors.lossContainer, borderColor: pnlPositive ? colors.profitBorder : colors.lossBorder }]}>
                  <View style={[s.pillDot, { backgroundColor: pnlPositive ? colors.profit : colors.loss }]} />
                  <Text style={[s.heroPillText, { color: pnlPositive ? colors.profit : colors.loss }]}>
                    {parseFloat(stats.roi) >= 0 ? '+' : ''}{stats.roi}% ROI
                  </Text>
                </View>
              )}
              {stats.winRate && (
                <View style={[s.heroPill, { backgroundColor: colors.surfaceVariant, borderColor: colors.border }]}>
                  <Text style={[s.heroPillText, { color: colors.textSecondary }]}>{stats.winRate}% Win Rate</Text>
                </View>
              )}
              {stats.streak.type && stats.streak.current >= 2 && (
                <View style={[s.heroPill, { backgroundColor: stats.streak.type === 'Won' ? colors.profitContainer : colors.lossContainer, borderColor: stats.streak.type === 'Won' ? colors.profitBorder : colors.lossBorder }]}>
                  <Text style={[s.heroPillText, { color: stats.streak.type === 'Won' ? colors.profit : colors.loss }]}>
                    🔥 {stats.streak.current} streak
                  </Text>
                </View>
              )}
            </View>

            {/* Chart */}
            {pnlData.length >= 2 && (
              <View style={s.heroChartWrap}>
                <Chart data={pnlData} color={pnlPositive ? colors.profit : colors.loss} height={64} currSym={currSym} />
              </View>
            )}
          </LinearGradient>
        </Animated.View>

        <View style={s.content}>

          {/* ── Session ── */}
          <Animated.View entering={FadeInDown.delay(80).springify()} style={s.section}>
            <Text style={[s.sectionLabel, { color: colors.textTertiary }]}>PERFORMANCE</Text>
            <View style={s.rowGap8}>
              {[
                { label: 'Today', v: session.todayPnL, sym: currSym },
                { label: 'This Week', v: session.weekPnL, sym: currSym },
                { label: 'This Month', v: session.monthPnL, sym: currSym },
              ].map(({ label, v, sym }) => (
                <SessionCard key={label} label={label} colors={colors}
                  value={hidden ? `${sym}••` : (v >= 0 ? '+' : '') + formatMoney(v, sym)}
                  color={v > 0 ? colors.profit : v < 0 ? colors.loss : colors.textTertiary} />
              ))}
            </View>
          </Animated.View>

          {/* ── Key stats ── */}
          <Animated.View entering={FadeInDown.delay(140).springify()} style={s.section}>
            <View style={s.rowGap8}>
              {[
                { label: 'Total Bets', value: bets.length, color: colors.textPrimary },
                { label: 'Won', value: stats.wonCount, color: colors.profit },
                { label: 'Lost', value: stats.lostCount, color: colors.loss },
              ].map(item => (
                <View key={item.label} style={[s.miniStatCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <Text style={[s.miniStatVal, { color: item.color }]}>{item.value}</Text>
                  <Text style={[s.miniStatLbl, { color: colors.textTertiary }]}>{item.label}</Text>
                </View>
              ))}
            </View>
          </Animated.View>

          {/* ── Insights ── */}
          {insights.length > 0 && (
            <Animated.View entering={FadeInDown.delay(200).springify()} style={s.section}>
              <View style={s.sectionHeader}>
                <Text style={[s.sectionLabel, { color: colors.textTertiary }]}>SMART INSIGHTS</Text>
                <Pressable onPress={() => navigation.navigate('Stats')}>
                  <Text style={[s.seeAll, { color: colors.primary }]}>See All →</Text>
                </Pressable>
              </View>
              <View style={{ gap: 7 }}>
                {insights.slice(0, 3).map((ins, i) => (
                  <Animated.View key={i} entering={FadeInDown.delay(240 + i * 50).springify()}>
                    <InsightRow insight={ins} colors={colors} />
                  </Animated.View>
                ))}
              </View>
            </Animated.View>
          )}

          {/* ── Quick Nav ── */}
          <Animated.View entering={FadeInDown.delay(280).springify()} style={[s.section, { marginBottom: 36 }]}>
            <View style={s.quickNav}>
              {[
                { icon: '📋', label: 'Bets', screen: 'Bets' },
                { icon: '📊', label: 'Analytics', screen: 'Stats' },
                { icon: '💰', label: 'Bankroll', screen: 'Bankroll' },
                { icon: '⚙️', label: 'Settings', screen: 'Settings' },
              ].map(item => (
                <PressableScale key={item.label} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); navigation.navigate(item.screen); }}>
                  <View style={[s.quickNavItem, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <Text style={s.quickNavIcon}>{item.icon}</Text>
                    <Text style={[s.quickNavLabel, { color: colors.textSecondary }]}>{item.label}</Text>
                  </View>
                </PressableScale>
              ))}
            </View>
          </Animated.View>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = (colors) => StyleSheet.create({
  screen: { flex: 1 },
  heroCard: {
    margin: Spacing.md,
    marginTop: 8,
    borderRadius: Radius.xxl,
    padding: Spacing.lg,
    borderWidth: 0.5,
    borderColor: colors.border,
    ...Shadows.md,
    overflow: 'hidden',
  },
  heroTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  heroLabel: { ...Typography.overline, letterSpacing: 1.2 },
  eyeBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', borderWidth: 0.5 },
  heroAmount: { fontSize: 44, fontWeight: '700', letterSpacing: -2, lineHeight: 50, marginBottom: 12 },
  heroPillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 14 },
  heroPill: { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: Radius.full, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 0.5 },
  pillDot: { width: 5, height: 5, borderRadius: 3 },
  heroPillText: { fontSize: 12, fontWeight: '600' },
  heroChartWrap: { marginTop: 4, opacity: 0.9 },
  content: { paddingHorizontal: Spacing.md },
  section: { marginBottom: Spacing.lg },
  sectionLabel: { ...Typography.overline, marginBottom: 10 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  seeAll: { ...Typography.caption, fontWeight: '700' },
  rowGap8: { flexDirection: 'row', gap: 8 },
  miniStatCard: {
    flex: 1,
    borderRadius: Radius.lg,
    padding: 14,
    borderWidth: 0.5,
    alignItems: 'flex-start',
    ...Shadows.xs,
  },
  miniStatVal: { fontSize: 22, fontWeight: '700', letterSpacing: -0.8, marginBottom: 3 },
  miniStatLbl: { fontSize: 10, fontWeight: '600', letterSpacing: 0.6, textTransform: 'uppercase' },
  quickNav: { flexDirection: 'row', gap: 8 },
  quickNavItem: { flex: 1, borderRadius: Radius.lg, paddingVertical: 14, paddingHorizontal: 8, alignItems: 'center', borderWidth: 0.5, ...Shadows.xs },
  quickNavIcon: { fontSize: 22, marginBottom: 5 },
  quickNavLabel: { ...Typography.caption, fontWeight: '600' },
});
