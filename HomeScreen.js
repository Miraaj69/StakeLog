// HomeScreen.js
import React, { useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeIn, useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTheme } from './useTheme';
import { useBets } from './useBets';
import Chart from './Chart';
import {
  formatMoney, calcPnLTimeSeries, calcSmartInsights,
  calcSportStats, calcBookieStats, calcSessionStats, getCurrencySymbol,
} from './calculations';
import { Spacing, Radius, Typography, Shadows } from './theme';

function PressableScale({ onPress, style, children }) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <Pressable
      onPressIn={() => { scale.value = withSpring(0.96, { damping: 15 }); }}
      onPressOut={() => { scale.value = withSpring(1, { damping: 15 }); }}
      onPress={onPress}>
      <Animated.View style={[animStyle, style]}>{children}</Animated.View>
    </Pressable>
  );
}

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
        {/* Hero */}
        <Animated.View entering={FadeIn.duration(400)}>
          <LinearGradient colors={heroGradient} style={s.heroCard} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}>
            <View style={s.heroTopRow}>
              <Text style={[s.heroLabel, { color: colors.textTertiary }]}>NET P&L · ALL TIME</Text>
              <Pressable onPress={() => { setHidden(h => !h); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                style={[s.eyeBtn, { backgroundColor: colors.surfaceVariant, borderColor: colors.border }]}>
                <Text style={{ fontSize: 15 }}>{hidden ? '👁️' : '🙈'}</Text>
              </Pressable>
            </View>

            <Text style={[s.heroAmount, { color: pnlPositive ? colors.profit : colors.loss }]} adjustsFontSizeToFit numberOfLines={1}>
              {hidden ? `${currSym}••••••` : (pnlPositive ? '+' : '') + formatMoney(stats.totalPnL, currSym)}
            </Text>

            <View style={s.heroPillRow}>
              {stats.roi && (
                <View style={[s.heroPill, { backgroundColor: pnlPositive ? colors.profitContainer : colors.lossContainer, borderColor: pnlPositive ? colors.profitBorder : colors.lossBorder }]}>
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

            {pnlData.length >= 2 && (
              <View style={{ marginTop: 4, opacity: 0.9 }}>
                <Chart data={pnlData} color={pnlPositive ? colors.profit : colors.loss} height={64} currSym={currSym} />
              </View>
            )}
          </LinearGradient>
        </Animated.View>

        <View style={s.content}>
          {/* Session */}
          <Animated.View entering={FadeInDown.delay(80).springify()} style={s.section}>
            <Text style={[s.sectionLabel, { color: colors.textTertiary }]}>PERFORMANCE</Text>
            <View style={s.row}>
              {[
                { label: 'Today', v: session.todayPnL },
                { label: 'This Week', v: session.weekPnL },
                { label: 'This Month', v: session.monthPnL },
              ].map(({ label, v }) => (
                <View key={label} style={[s.sessionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <Text style={[s.sessionVal, { color: v > 0 ? colors.profit : v < 0 ? colors.loss : colors.textTertiary }]}>
                    {hidden ? `${currSym}••` : (v >= 0 ? '+' : '') + formatMoney(v, currSym)}
                  </Text>
                  <Text style={[s.sessionLbl, { color: colors.textTertiary }]}>{label}</Text>
                </View>
              ))}
            </View>
          </Animated.View>

          {/* Key stats */}
          <Animated.View entering={FadeInDown.delay(130).springify()} style={s.section}>
            <View style={s.row}>
              {[
                { label: 'Total Bets', value: bets.length, color: colors.textPrimary },
                { label: 'Won', value: stats.wonCount, color: colors.profit },
                { label: 'Lost', value: stats.lostCount, color: colors.loss },
              ].map(item => (
                <View key={item.label} style={[s.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <Text style={[s.statVal, { color: item.color }]}>{item.value}</Text>
                  <Text style={[s.statLbl, { color: colors.textTertiary }]}>{item.label}</Text>
                </View>
              ))}
            </View>
          </Animated.View>

          {/* Insights */}
          {insights.length > 0 && (
            <Animated.View entering={FadeInDown.delay(180).springify()} style={s.section}>
              <View style={s.sectionHeader}>
                <Text style={[s.sectionLabel, { color: colors.textTertiary }]}>SMART INSIGHTS</Text>
                <Pressable onPress={() => navigation.navigate('Stats')}>
                  <Text style={[s.seeAll, { color: colors.primary }]}>See All →</Text>
                </Pressable>
              </View>
              <View style={{ gap: 7 }}>
                {insights.slice(0, 3).map((ins, i) => {
                  const c = {
                    positive: { bg: colors.profitContainer, border: colors.profitBorder, color: colors.profit },
                    warning: { bg: colors.pendingContainer, border: colors.pendingBorder, color: colors.pending },
                    info: { bg: colors.primaryContainer, border: colors.primaryBorder, color: colors.primary },
                  }[ins.type] || { bg: colors.surfaceVariant, border: colors.border, color: colors.textSecondary };
                  return (
                    <Animated.View key={i} entering={FadeInDown.delay(220 + i * 50).springify()}
                      style={[s.insightCard, { backgroundColor: c.bg, borderColor: c.border }]}>
                      <Text style={{ fontSize: 16, flexShrink: 0 }}>{ins.icon}</Text>
                      <Text style={[s.insightText, { color: colors.textPrimary }]}>{ins.text}</Text>
                    </Animated.View>
                  );
                })}
              </View>
            </Animated.View>
          )}

          {/* Quick Nav */}
          <Animated.View entering={FadeInDown.delay(240).springify()} style={[s.section, { marginBottom: 36 }]}>
            <View style={s.row}>
              {[
                { icon: '📋', label: 'Bets', screen: 'Bets' },
                { icon: '📊', label: 'Analytics', screen: 'Stats' },
                { icon: '💰', label: 'Bankroll', screen: 'Bankroll' },
                { icon: '⚙️', label: 'Settings', screen: 'Settings' },
              ].map(item => (
                <PressableScale key={item.label} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); navigation.navigate(item.screen); }}
                  style={[s.navItem, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <Text style={{ fontSize: 22, marginBottom: 5 }}>{item.icon}</Text>
                  <Text style={[s.navLabel, { color: colors.textSecondary }]}>{item.label}</Text>
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
  heroCard: { margin: 16, marginTop: 8, borderRadius: 24, padding: 20, borderWidth: 0.5, borderColor: colors.border },
  heroTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  heroLabel: { fontSize: 10, fontWeight: '600', letterSpacing: 1.2, textTransform: 'uppercase' },
  eyeBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', borderWidth: 0.5 },
  heroAmount: { fontSize: 44, fontWeight: '700', letterSpacing: -2, lineHeight: 50, marginBottom: 12 },
  heroPillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 14 },
  heroPill: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 0.5 },
  heroPillText: { fontSize: 12, fontWeight: '600' },
  content: { paddingHorizontal: 16 },
  section: { marginBottom: 20 },
  sectionLabel: { fontSize: 10, fontWeight: '600', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 10 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  seeAll: { fontSize: 11, fontWeight: '700' },
  row: { flexDirection: 'row', gap: 8 },
  sessionCard: { flex: 1, borderRadius: 16, padding: 13, borderWidth: 0.5 },
  sessionVal: { fontSize: 16, fontWeight: '700', letterSpacing: -0.5, marginBottom: 3 },
  sessionLbl: { fontSize: 10, fontWeight: '600', letterSpacing: 0.6, textTransform: 'uppercase' },
  statCard: { flex: 1, borderRadius: 16, padding: 13, borderWidth: 0.5 },
  statVal: { fontSize: 22, fontWeight: '700', letterSpacing: -0.8, marginBottom: 3 },
  statLbl: { fontSize: 10, fontWeight: '600', letterSpacing: 0.6, textTransform: 'uppercase' },
  insightCard: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 14, padding: 12, borderWidth: 0.5 },
  insightText: { fontSize: 13, fontWeight: '500', flex: 1, lineHeight: 19 },
  navItem: { flex: 1, borderRadius: 16, paddingVertical: 14, paddingHorizontal: 8, alignItems: 'center', borderWidth: 0.5 },
  navLabel: { fontSize: 11, fontWeight: '600' },
});
