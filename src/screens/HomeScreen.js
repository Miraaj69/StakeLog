// screens/HomeScreen.js
import React, { useMemo } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Pressable, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useTheme } from '../hooks/useTheme';
import { useBets } from '../hooks/useBets';
import StatsCard from '../components/StatsCard';
import Chart from '../components/Chart';
import {
  formatMoney, calcPnLTimeSeries, calcSmartInsights,
  calcSportStats, calcBookieStats, calcSessionStats, getCurrencySymbol,
} from '../utils/calculations';
import { Spacing, Radius, Typography, Shadows } from '../utils/theme';

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

  const s = styles(colors);
  const pnlPositive = stats.totalPnL >= 0;

  if (loading) return <View style={[s.screen, { justifyContent: 'center', alignItems: 'center' }]}><Text style={{ color: colors.textSecondary }}>Loading...</Text></View>;

  return (
    <SafeAreaView style={[s.screen, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Hero Card */}
        <Animated.View entering={FadeInDown.delay(50).springify()}>
          <LinearGradient
            colors={pnlPositive ? ['#1B5E20', '#2E7D32', '#388E3C'] : ['#7F0000', '#B71C1C', '#C62828']}
            style={s.heroCard}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>

            <View style={s.heroHeader}>
              <View>
                <Text style={s.heroLabel}>NET P&L</Text>
                <Pressable onPress={() => setHidden(h => !h)}>
                  <Text style={s.heroAmount} adjustsFontSizeToFit numberOfLines={1}>
                    {hidden ? `${currSym} ••••••` : (stats.totalPnL >= 0 ? '+' : '') + formatMoney(stats.totalPnL, currSym)}
                  </Text>
                </Pressable>
              </View>
              <Pressable onPress={() => setHidden(h => !h)} style={s.eyeBtn}>
                <Text style={{ fontSize: 20 }}>{hidden ? '👁️' : '🙈'}</Text>
              </Pressable>
            </View>

            <View style={s.heroPills}>
              {stats.roi && (
                <View style={s.heroPill}>
                  <Text style={s.heroPillText}>{parseFloat(stats.roi) >= 0 ? '+' : ''}{stats.roi}% ROI</Text>
                </View>
              )}
              {stats.winRate && (
                <View style={s.heroPill}>
                  <Text style={s.heroPillText}>{stats.winRate}% Win Rate</Text>
                </View>
              )}
              {stats.streak.type && stats.streak.current >= 2 && (
                <View style={[s.heroPill, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                  <Text style={s.heroPillText}>🔥 {stats.streak.current} {stats.streak.type}</Text>
                </View>
              )}
            </View>

            {/* Mini chart in hero */}
            {pnlData.length >= 2 && (
              <View style={s.heroChart}>
                <Chart data={pnlData} color="rgba(255,255,255,0.8)" height={60} currSym={currSym} />
              </View>
            )}
          </LinearGradient>
        </Animated.View>

        <View style={s.content}>
          {/* Session stats */}
          <Animated.View entering={FadeInDown.delay(100).springify()} style={s.section}>
            <Text style={[s.sectionTitle, { color: colors.textSecondary }]}>PERFORMANCE</Text>
            <View style={s.statsGrid}>
              {[
                { label: 'Today', value: hidden ? '••' : (session.todayPnL >= 0 ? '+' : '') + formatMoney(session.todayPnL, currSym), color: session.todayPnL >= 0 ? colors.profit : session.todayPnL < 0 ? colors.loss : colors.textSecondary },
                { label: 'This Week', value: hidden ? '••' : (session.weekPnL >= 0 ? '+' : '') + formatMoney(session.weekPnL, currSym), color: session.weekPnL >= 0 ? colors.profit : session.weekPnL < 0 ? colors.loss : colors.textSecondary },
                { label: 'This Month', value: hidden ? '••' : (session.monthPnL >= 0 ? '+' : '') + formatMoney(session.monthPnL, currSym), color: session.monthPnL >= 0 ? colors.profit : session.monthPnL < 0 ? colors.loss : colors.textSecondary },
              ].map((item, i) => (
                <Animated.View key={item.label} entering={FadeInDown.delay(150 + i * 50).springify()} style={{ flex: 1 }}>
                  <StatsCard label={item.label} value={item.value} color={item.color} bgColor={colors.surface} />
                </Animated.View>
              ))}
            </View>
          </Animated.View>

          {/* Key stats */}
          <Animated.View entering={FadeInDown.delay(200).springify()} style={s.section}>
            <View style={s.statsGrid}>
              <StatsCard icon="🎯" label="Total Bets" value={bets.length} bgColor={colors.surface} />
              <StatsCard icon="✓" label="Won" value={stats.wonCount} color={colors.profit} bgColor={colors.profitContainer} />
              <StatsCard icon="✕" label="Lost" value={stats.lostCount} color={colors.loss} bgColor={colors.lossContainer} />
            </View>
          </Animated.View>

          {/* Smart Insights */}
          {insights.length > 0 && (
            <Animated.View entering={FadeInDown.delay(250).springify()} style={s.section}>
              <View style={s.sectionHeader}>
                <Text style={[s.sectionTitle, { color: colors.textSecondary }]}>SMART INSIGHTS</Text>
                <Pressable onPress={() => navigation.navigate('Stats')}>
                  <Text style={[s.seeAll, { color: colors.primary }]}>See All →</Text>
                </Pressable>
              </View>
              <View style={{ gap: 8 }}>
                {insights.slice(0, 3).map((ins, i) => {
                  const insColors = {
                    positive: { bg: colors.profitContainer, color: colors.profit },
                    warning: { bg: colors.pendingContainer, color: colors.pending },
                    info: { bg: colors.primaryContainer, color: colors.primary },
                  }[ins.type];
                  return (
                    <Animated.View key={i} entering={FadeInDown.delay(300 + i * 60).springify()}
                      style={[s.insightCard, { backgroundColor: insColors.bg }]}>
                      <Text style={s.insightIcon}>{ins.icon}</Text>
                      <Text style={[s.insightText, { color: insColors.color }]}>{ins.text}</Text>
                    </Animated.View>
                  );
                })}
              </View>
            </Animated.View>
          )}

          {/* Quick navigate */}
          <Animated.View entering={FadeInDown.delay(350).springify()} style={[s.section, { marginBottom: 32 }]}>
            <View style={s.quickNav}>
              {[
                { icon: '📋', label: 'All Bets', screen: 'Bets' },
                { icon: '📊', label: 'Analytics', screen: 'Stats' },
                { icon: '💰', label: 'Bankroll', screen: 'Bankroll' },
                { icon: '⚙️', label: 'Settings', screen: 'Settings' },
              ].map(item => (
                <Pressable key={item.label} onPress={() => navigation.navigate(item.screen)} style={[s.quickNavItem, { backgroundColor: colors.surface }]}>
                  <Text style={s.quickNavIcon}>{item.icon}</Text>
                  <Text style={[s.quickNavLabel, { color: colors.textSecondary }]}>{item.label}</Text>
                </Pressable>
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
  heroCard: { margin: Spacing.md, borderRadius: Radius.xxl, padding: Spacing.lg, paddingTop: Spacing.lg, ...Shadows.lg },
  heroHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Spacing.md },
  heroLabel: { fontSize: 11, color: 'rgba(255,255,255,0.7)', fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 4 },
  heroAmount: { fontSize: 40, fontWeight: '900', color: '#fff', letterSpacing: -2 },
  eyeBtn: { padding: 8, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 20 },
  heroPills: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: Spacing.md },
  heroPill: { backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: Radius.full, paddingHorizontal: 12, paddingVertical: 5 },
  heroPillText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  heroChart: { marginTop: 8, opacity: 0.9 },
  content: { paddingHorizontal: Spacing.md },
  section: { marginBottom: Spacing.lg },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  sectionTitle: { ...Typography.micro, textTransform: 'uppercase', letterSpacing: 1 },
  seeAll: { ...Typography.caption, fontWeight: '700' },
  statsGrid: { flexDirection: 'row', gap: Spacing.sm },
  insightCard: { flexDirection: 'row', borderRadius: Radius.lg, padding: Spacing.md, gap: 10, alignItems: 'flex-start' },
  insightIcon: { fontSize: 18, flexShrink: 0 },
  insightText: { ...Typography.bodySmall, fontWeight: '600', lineHeight: 20, flex: 1 },
  quickNav: { flexDirection: 'row', gap: Spacing.sm },
  quickNavItem: { flex: 1, borderRadius: Radius.lg, padding: Spacing.md, alignItems: 'center', ...Shadows.sm },
  quickNavIcon: { fontSize: 24, marginBottom: 4 },
  quickNavLabel: { ...Typography.caption, fontWeight: '600' },
});
