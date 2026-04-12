// screens/StatsScreen.js
import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTheme } from './useTheme';
import { useStore, useStats } from './store';
import Chart from './Chart';
import Heatmap from './Heatmap';
import StatsCard from './StatsCard';
import {
  formatMoney, calcPnLTimeSeries, calcSportStats, calcBookieStats,
  calcOddsBreakdown, calcTagStats, calcSmartInsights, calcPnLByDay,
  getCurrencySymbol, ACHIEVEMENTS,
} from './calculations';
import { Spacing, Radius, Typography, Shadows } from './theme';

const TABS = ['Overview', 'Insights', 'Odds', 'Heatmap', 'Tags', '🏆 Badges'];

export default function StatsScreen() {
  const { colors } = useTheme();
  const bets = useStore(s => s.bets);
  const bookies = useStore(s => s.bookies);
  const sports = useStore(s => s.sports);
  const stats = useStats();
  const [activeTab, setActiveTab] = useState('Overview');
  const [hidden] = useState(false);
  const [currency] = useState('INR');
  const currSym = getCurrencySymbol(currency);

  const pnlData = useMemo(() => calcPnLTimeSeries(bets), [bets]);
  const sportStats = useMemo(() => calcSportStats(bets, sports), [bets, sports]);
  const bookieStats = useMemo(() => calcBookieStats(bets, bookies), [bets, bookies]);
  const oddsBreakdown = useMemo(() => calcOddsBreakdown(bets), [bets]);
  const tagStats = useMemo(() => calcTagStats(bets), [bets]);
  const insights = useMemo(() => calcSmartInsights(bets, sportStats, bookieStats, stats.streak, stats.winRate), [bets, sportStats, bookieStats, stats]);
  const dayData = useMemo(() => calcPnLByDay(bets), [bets]);
  const unlockedAchievements = useMemo(() => new Set(ACHIEVEMENTS.filter(a => a.check(bets, stats.streak, stats.totalPnL, stats.winRate)).map(a => a.id)), [bets, stats]);

  const s = styles(colors);

  if (bets.length === 0) {
    return (
      <SafeAreaView style={[s.screen, { backgroundColor: colors.background }]}>
        <View style={s.empty}>
          <Text style={s.emptyEmoji}>📊</Text>
          <Text style={[s.emptyTitle, { color: colors.textPrimary }]}>No data yet</Text>
          <Text style={[s.emptyDesc, { color: colors.textTertiary }]}>Add some bets to see your analytics</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[s.screen, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[s.topBar, { borderBottomColor: colors.border }]}>
        <Text style={[s.screenTitle, { color: colors.textPrimary }]}>Analytics</Text>
      </View>

      {/* Tab bar */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.tabRow}>
        <View style={{ flexDirection: 'row', gap: 6, paddingHorizontal: Spacing.md }}>
          {TABS.map(tab => (
            <Pressable key={tab} onPress={() => setActiveTab(tab)}
              style={[s.tab, activeTab === tab ? { backgroundColor: colors.primary } : { backgroundColor: colors.surfaceVariant }]}>
              <Text style={[s.tabText, { color: activeTab === tab ? '#fff' : colors.textSecondary, fontWeight: activeTab === tab ? '700' : '500' }]}>{tab}</Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.content}>

        {/* OVERVIEW */}
        {activeTab === 'Overview' && (
          <View style={{ gap: Spacing.md }}>
            <View style={s.statsGrid}>
              {[
                { icon: '📈', label: 'Net P&L', value: hidden ? `${currSym}••••` : (stats.totalPnL >= 0 ? '+' : '') + formatMoney(stats.totalPnL, currSym), color: stats.totalPnL >= 0 ? colors.profit : colors.loss, bgColor: stats.totalPnL >= 0 ? colors.profitContainer : colors.lossContainer },
                { icon: '💰', label: 'Total Staked', value: hidden ? `${currSym}••••` : formatMoney(stats.totalStake, currSym), bgColor: colors.surface },
                { icon: '🎯', label: 'Win Rate', value: stats.winRate ? `${stats.winRate}%` : '—', bgColor: colors.surface },
                { icon: '🔥', label: 'Best Streak', value: stats.streak.best > 0 ? `${stats.streak.best} ${stats.streak.type || ''}s` : '—', bgColor: colors.surface },
              ].map((s2, i) => (
                <Animated.View key={s2.label} entering={FadeInDown.delay(i * 60).springify()} style={{ flex: 1 }}>
                  <StatsCard {...s2} size="md" />
                </Animated.View>
              ))}
            </View>

            {/* P&L Chart */}
            <Animated.View entering={FadeInDown.delay(100).springify()} style={[s.card, { backgroundColor: colors.surface }]}>
              <Text style={[s.cardTitle, { color: colors.textPrimary }]}>📈 Cumulative P&L</Text>
              <Text style={[s.cardSubtitle, { color: colors.textTertiary }]}>Tap & drag to explore</Text>
              <Chart data={pnlData} color={stats.totalPnL >= 0 ? colors.profit : colors.loss} height={120} currSym={currSym} showLabels />
            </Animated.View>

            {/* Outcome breakdown */}
            <Animated.View entering={FadeInDown.delay(150).springify()} style={[s.card, { backgroundColor: colors.surface }]}>
              <Text style={[s.cardTitle, { color: colors.textPrimary }]}>Outcome Breakdown</Text>
              {[{ status: 'Won', icon: '✓', color: colors.profit, container: colors.profitContainer }, { status: 'Lost', icon: '✕', color: colors.loss, container: colors.lossContainer }, { status: 'Pending', icon: '⏳', color: colors.pending, container: colors.pendingContainer }, { status: 'Void', icon: '⊘', color: colors.void, container: colors.voidContainer }].map(item => {
                const count = bets.filter(b => b.status === item.status).length;
                const pct = bets.length > 0 ? (count / bets.length) * 100 : 0;
                return (
                  <View key={item.status} style={{ marginBottom: 14 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 }}>
                      <Text style={[s.breakdownLabel, { color: colors.textSecondary }]}>{item.icon} {item.status}</Text>
                      <Text style={[s.breakdownCount, { color: item.color }]}>{count} bets</Text>
                    </View>
                    <View style={[s.progressTrack, { backgroundColor: colors.surfaceVariant }]}>
                      <View style={[s.progressFill, { width: `${pct}%`, backgroundColor: item.container, borderColor: item.color + '44' }]} />
                    </View>
                  </View>
                );
              })}
            </Animated.View>

            {/* Sport stats */}
            {sportStats.length > 0 && (
              <Animated.View entering={FadeInDown.delay(200).springify()} style={[s.card, { backgroundColor: colors.surface }]}>
                <Text style={[s.cardTitle, { color: colors.textPrimary }]}>🏅 By Sport</Text>
                {sportStats.map((sp, i) => (
                  <View key={sp.name} style={[s.listRow, i < sportStats.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
                    <View>
                      <Text style={[s.listName, { color: colors.textPrimary }]}>{sp.name}</Text>
                      <Text style={[s.listSub, { color: colors.textTertiary }]}>{sp.won}W / {sp.lost}L · {sp.bets.length} bets · {sp.won + sp.lost > 0 ? Math.round(sp.won / (sp.won + sp.lost) * 100) : 0}% WR</Text>
                    </View>
                    <Text style={[s.listPnl, { color: sp.pnl >= 0 ? colors.profit : colors.loss }]}>{sp.pnl >= 0 ? '+' : ''}{hidden ? '••' : formatMoney(sp.pnl, currSym)}</Text>
                  </View>
                ))}
              </Animated.View>
            )}

            {/* Bookie stats */}
            {bookieStats.length > 0 && (
              <Animated.View entering={FadeInDown.delay(250).springify()} style={[s.card, { backgroundColor: colors.surface }]}>
                <Text style={[s.cardTitle, { color: colors.textPrimary }]}>🏢 By Bookie</Text>
                {bookieStats.map((bk, i) => (
                  <View key={bk.name} style={[s.listRow, i < bookieStats.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
                    <View>
                      <Text style={[s.listName, { color: colors.textPrimary }]}>{bk.name}</Text>
                      <Text style={[s.listSub, { color: colors.textTertiary }]}>{bk.bets.length} bets · {bk.won} won</Text>
                    </View>
                    <Text style={[s.listPnl, { color: bk.pnl >= 0 ? colors.profit : colors.loss }]}>{bk.pnl >= 0 ? '+' : ''}{hidden ? '••' : formatMoney(bk.pnl, currSym)}</Text>
                  </View>
                ))}
              </Animated.View>
            )}
          </View>
        )}

        {/* INSIGHTS */}
        {activeTab === 'Insights' && (
          <View style={{ gap: 10 }}>
            <Text style={[s.tabDesc, { color: colors.textTertiary }]}>AI-like insights generated from your betting patterns</Text>
            {insights.map((ins, i) => {
              const c = { positive: { bg: colors.profitContainer, color: colors.profit }, warning: { bg: colors.pendingContainer, color: colors.pending }, info: { bg: colors.primaryContainer, color: colors.primary } }[ins.type];
              return (
                <Animated.View key={i} entering={FadeInDown.delay(i * 80).springify()} style={[s.insightCard, { backgroundColor: c.bg }]}>
                  <Text style={s.insightIcon}>{ins.icon}</Text>
                  <Text style={[s.insightText, { color: c.color }]}>{ins.text}</Text>
                </Animated.View>
              );
            })}
          </View>
        )}

        {/* ODDS */}
        {activeTab === 'Odds' && (
          <Animated.View entering={FadeInDown.springify()} style={[s.card, { backgroundColor: colors.surface }]}>
            <Text style={[s.cardTitle, { color: colors.textPrimary }]}>Win Rate by Odds Range</Text>
            <Text style={[s.cardSubtitle, { color: colors.textTertiary }]}>Pill = number of bets in range</Text>
            {oddsBreakdown.map(r => (
              <View key={r.label} style={s.oddsRow}>
                <Text style={[s.oddsLabel, { color: colors.textSecondary }]}>{r.label}</Text>
                <View style={[s.oddsTrack, { backgroundColor: colors.surfaceVariant }]}>
                  <View style={[s.oddsFill, { width: `${r.winRate}%`, backgroundColor: r.winRate >= 55 ? colors.profit : r.winRate >= 40 ? colors.pending : colors.loss }]} />
                </View>
                <Text style={[s.oddsWR, { color: r.winRate >= 55 ? colors.profit : r.winRate >= 40 ? colors.pending : colors.loss }]}>{r.winRate}%</Text>
                <View style={[s.oddsBadge, { backgroundColor: r.winRate >= 55 ? colors.profitContainer : r.winRate >= 40 ? colors.pendingContainer : colors.lossContainer }]}>
                  <Text style={[s.oddsBadgeText, { color: r.winRate >= 55 ? colors.profit : r.winRate >= 40 ? colors.pending : colors.loss }]}>{r.count}</Text>
                </View>
              </View>
            ))}
          </Animated.View>
        )}

        {/* HEATMAP */}
        {activeTab === 'Heatmap' && (
          <Animated.View entering={FadeInDown.springify()} style={[s.card, { backgroundColor: colors.surface }]}>
            <Text style={[s.cardTitle, { color: colors.textPrimary }]}>📅 Monthly P&L Heatmap</Text>
            <Heatmap dayData={dayData} currSym={currSym} />
          </Animated.View>
        )}

        {/* TAGS */}
        {activeTab === 'Tags' && (
          <View>
            {tagStats.length === 0 ? (
              <View style={s.empty}>
                <Text style={s.emptyEmoji}>🏷️</Text>
                <Text style={[s.emptyTitle, { color: colors.textPrimary }]}>No tags yet</Text>
                <Text style={[s.emptyDesc, { color: colors.textTertiary }]}>Add #tags to bets for tag analytics</Text>
              </View>
            ) : (
              <Animated.View entering={FadeInDown.springify()} style={[s.card, { backgroundColor: colors.surface }]}>
                <Text style={[s.cardTitle, { color: colors.textPrimary }]}>Tag Performance</Text>
                {tagStats.map((td, i) => (
                  <View key={td.tag} style={[s.listRow, i < tagStats.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
                    <View>
                      <View style={[s.tagBadge, { backgroundColor: colors.primaryContainer }]}>
                        <Text style={[s.tagBadgeText, { color: colors.primary }]}>#{td.tag}</Text>
                      </View>
                      <Text style={[s.listSub, { color: colors.textTertiary, marginTop: 3 }]}>{td.won}W/{td.lost}L · {td.count} bets</Text>
                    </View>
                    <Text style={[s.listPnl, { color: td.pnl >= 0 ? colors.profit : colors.loss }]}>{td.pnl >= 0 ? '+' : ''}{formatMoney(td.pnl, currSym)}</Text>
                  </View>
                ))}
              </Animated.View>
            )}
          </View>
        )}

        {/* BADGES */}
        {activeTab === '🏆 Badges' && (
          <View>
            <Text style={[s.tabDesc, { color: colors.textTertiary }]}>{unlockedAchievements.size}/{ACHIEVEMENTS.length} unlocked</Text>
            <View style={s.badgesGrid}>
              {ACHIEVEMENTS.map((a, i) => {
                const done = unlockedAchievements.has(a.id);
                return (
                  <Animated.View key={a.id} entering={FadeInDown.delay(i * 50).springify()}
                    style={[s.badge, { backgroundColor: done ? colors.primaryContainer : colors.surfaceVariant, opacity: done ? 1 : 0.45 }]}>
                    <Text style={{ fontSize: 30, marginBottom: 6, ...(done ? {} : { filter: 'grayscale(1)' }) }}>{a.icon}</Text>
                    <Text style={[s.badgeTitle, { color: done ? colors.primary : colors.textSecondary }]}>{a.title}</Text>
                    <Text style={[s.badgeDesc, { color: done ? colors.primary : colors.textTertiary }]}>{a.desc}</Text>
                    {done && <Text style={[s.badgeUnlocked, { color: colors.primary }]}>✓ UNLOCKED</Text>}
                  </Animated.View>
                );
              })}
            </View>
          </View>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = (colors) => StyleSheet.create({
  screen: { flex: 1 },
  topBar: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderBottomWidth: 1 },
  screenTitle: { ...Typography.h2 },
  tabRow: { paddingVertical: Spacing.sm },
  tab: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: Radius.full },
  tabText: { fontSize: 12 },
  content: { padding: Spacing.md },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  card: { borderRadius: Radius.xl, padding: Spacing.md, ...Shadows.sm, marginBottom: 0 },
  cardTitle: { ...Typography.h4, marginBottom: 4 },
  cardSubtitle: { ...Typography.caption, marginBottom: Spacing.md },
  tabDesc: { ...Typography.bodySmall, marginBottom: Spacing.md, fontStyle: 'italic' },
  breakdownLabel: { ...Typography.bodySmall, fontWeight: '600' },
  breakdownCount: { ...Typography.bodySmall, fontWeight: '800' },
  progressTrack: { height: 7, borderRadius: 6, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 6, borderWidth: 1 },
  listRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10 },
  listName: { ...Typography.body, fontWeight: '700' },
  listSub: { ...Typography.caption, marginTop: 2 },
  listPnl: { fontSize: 15, fontWeight: '900' },
  insightCard: { flexDirection: 'row', borderRadius: Radius.lg, padding: Spacing.md, gap: 10, alignItems: 'flex-start' },
  insightIcon: { fontSize: 20, flexShrink: 0 },
  insightText: { ...Typography.body, fontWeight: '600', lineHeight: 22, flex: 1 },
  oddsRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  oddsLabel: { width: 60, ...Typography.caption, fontWeight: '700' },
  oddsTrack: { flex: 1, height: 8, borderRadius: 6, overflow: 'hidden' },
  oddsFill: { height: '100%', borderRadius: 6 },
  oddsWR: { width: 32, ...Typography.caption, fontWeight: '800', textAlign: 'right' },
  oddsBadge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: Radius.full },
  oddsBadgeText: { fontSize: 10, fontWeight: '700' },
  tagBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radius.full, alignSelf: 'flex-start' },
  tagBadgeText: { ...Typography.caption, fontWeight: '700' },
  badgesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  badge: { width: '47%', borderRadius: Radius.xl, padding: Spacing.md, alignItems: 'center' },
  badgeTitle: { ...Typography.label, fontWeight: '800', textAlign: 'center', marginBottom: 2 },
  badgeDesc: { ...Typography.caption, textAlign: 'center' },
  badgeUnlocked: { fontSize: 9, fontWeight: '700', marginTop: 4, letterSpacing: 1 },
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyEmoji: { fontSize: 48, marginBottom: Spacing.md },
  emptyTitle: { ...Typography.h3, marginBottom: Spacing.sm },
  emptyDesc: { ...Typography.body, textAlign: 'center' },
});
