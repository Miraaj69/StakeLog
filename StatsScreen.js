// StatsScreen.js — Fixed: equal cards, proper tabs, useStats
import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTheme } from './useTheme';
import { useStore, useStats } from './store';
import Chart from './Chart';
import Heatmap from './Heatmap';
import {
  formatMoney, calcPnLTimeSeries, calcSportStats, calcBookieStats,
  calcOddsBreakdown, calcTagStats, calcSmartInsights, calcPnLByDay,
  getCurrencySymbol, ACHIEVEMENTS,
} from './calculations';

var SCREEN_W = Dimensions.get('window').width;
var TABS = ['Overview', 'Insights', 'Odds', 'Heatmap', 'Tags', 'Badges'];

// Equal-size stat card
function StatCard({ icon, value, label, color, bg, border, colors }) {
  return (
    <View style={[sc.card, { backgroundColor: bg || colors.surface, borderColor: border || colors.border }]}>
      {icon ? <Text style={sc.icon}>{icon}</Text> : null}
      <Text style={[sc.value, { color: color || colors.textPrimary }]} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      <Text style={[sc.label, { color: colors.textTertiary }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}
var sc = StyleSheet.create({
  card: {
    width: '23%',
    aspectRatio: 1,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 6,
    borderWidth: 0.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  icon:  { fontSize: 18, marginBottom: 4 },
  value: { fontSize: 15, fontWeight: '800', letterSpacing: -0.3, textAlign: 'center' },
  label: { fontSize: 10, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.4, marginTop: 3, textAlign: 'center' },
});

export default function StatsScreen() {
  var { colors } = useTheme();
  var bets    = useStore(function(s) { return s.bets; });
  var bookies = useStore(function(s) { return s.bookies; });
  var sports  = useStore(function(s) { return s.sports; });
  var currency = useStore(function(s) { return s.currency; });
  var stats   = useStats();
  var currSym = getCurrencySymbol(currency);

  var [activeTab, setActiveTab] = useState('Overview');

  var pnlData      = useMemo(function() { return calcPnLTimeSeries(bets); }, [bets]);
  var sportStats   = useMemo(function() { return calcSportStats(bets, sports); }, [bets, sports]);
  var bookieStats  = useMemo(function() { return calcBookieStats(bets, bookies); }, [bets, bookies]);
  var oddsBreakdown = useMemo(function() { return calcOddsBreakdown(bets); }, [bets]);
  var tagStats     = useMemo(function() { return calcTagStats(bets); }, [bets]);
  var insights     = useMemo(function() { return calcSmartInsights(bets, sportStats, bookieStats, stats.streak, stats.winRate); }, [bets, sportStats, bookieStats, stats]);
  var dayData      = useMemo(function() { return calcPnLByDay(bets); }, [bets]);
  var unlocked     = useMemo(function() {
    return new Set(ACHIEVEMENTS.filter(function(a) { return a.check(bets, stats.streak, stats.totalPnL, stats.winRate); }).map(function(a) { return a.id; }));
  }, [bets, stats]);

  var isProfit = stats.totalPnL >= 0;

  if (bets.length === 0) {
    return (
      <SafeAreaView style={[s.screen, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={[s.topBar, { borderBottomColor: colors.border }]}>
          <Text style={[s.pageTitle, { color: colors.textPrimary }]}>Analytics</Text>
        </View>
        <View style={s.empty}>
          <Text style={{ fontSize: 48, marginBottom: 14 }}>📊</Text>
          <Text style={[s.emptyTitle, { color: colors.textPrimary }]}>No data yet</Text>
          <Text style={[s.emptySub, { color: colors.textTertiary }]}>Add some bets to see analytics</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[s.screen, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[s.topBar, { borderBottomColor: colors.border }]}>
        <Text style={[s.pageTitle, { color: colors.textPrimary }]}>Analytics</Text>
      </View>

      {/* Tab bar — horizontal scroll, no cut-off */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.tabScroll} contentContainerStyle={s.tabRow}>
        {TABS.map(function(tab) {
          var active = activeTab === tab;
          return (
            <Pressable key={tab} onPress={() => setActiveTab(tab)}
              style={[s.tab, { backgroundColor: active ? '#E50914' : colors.surfaceVariant, borderColor: active ? '#E50914' : colors.border }]}>
              <Text style={[s.tabTxt, { color: active ? '#fff' : '#9CA3AF', fontWeight: active ? '700' : '500' }]}>{tab}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.content}>

        {/* ── OVERVIEW ── */}
        {activeTab === 'Overview' && (
          <View style={{ gap: 14 }}>
            {/* Equal 4-card grid — 23% width, aspect 1:1 */}
            <Animated.View entering={FadeInDown.delay(40).springify()}>
              <View style={s.cardRow}>
                <StatCard icon="📈" label="Net P&L"       value={(isProfit?'+':'')+formatMoney(stats.totalPnL, currSym)} color={isProfit?'#1A9E4A':'#D93025'} bg={isProfit?'#E8F8EE':'#FDECEA'} border={isProfit?'#A7DFB9':'#F5B8B2'} colors={colors} />
                <StatCard icon="💰" label="Staked"        value={formatMoney(stats.totalStake, currSym)}     colors={colors} />
                <StatCard icon="🎯" label="Win Rate"      value={stats.winRate ? stats.winRate+'%' : '—'}    colors={colors} />
                <StatCard icon="🔥" label="Best Streak"  value={stats.streak.best > 0 ? stats.streak.best+'×' : '—'} colors={colors} />
              </View>
            </Animated.View>

            {/* P&L Chart */}
            <Animated.View entering={FadeInDown.delay(80).springify()} style={[s.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[s.cardTitle, { color: colors.textPrimary }]}>📈 Cumulative P&L</Text>
              <Text style={[s.cardSub, { color: colors.textTertiary }]}>Drag to explore</Text>
              <Chart data={pnlData} color={isProfit ? '#1A9E4A' : '#D93025'} height={120} currSym={currSym} showLabels />
            </Animated.View>

            {/* Outcome breakdown */}
            <Animated.View entering={FadeInDown.delay(120).springify()} style={[s.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[s.cardTitle, { color: colors.textPrimary }]}>Outcome Breakdown</Text>
              {[
                { status: 'Won',     icon: '✓', color: '#1A9E4A', bg: '#E8F8EE', count: stats.wonCount     },
                { status: 'Lost',    icon: '✕', color: '#D93025', bg: '#FDECEA', count: stats.lostCount    },
                { status: 'Pending', icon: '◷', color: '#E07B00', bg: '#FFF8E7', count: stats.pendingCount },
                { status: 'Void',    icon: '—', color: '#888',    bg: '#F5F5F5', count: bets.filter(function(b) { return b.status==='Void'; }).length },
              ].map(function(item) {
                var pct = bets.length > 0 ? (item.count / bets.length * 100) : 0;
                return (
                  <View key={item.status} style={{ marginBottom: 12 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 }}>
                      <Text style={[s.breakLbl, { color: colors.textSecondary }]}>{item.icon} {item.status}</Text>
                      <Text style={[s.breakCount, { color: item.color }]}>{item.count} bets</Text>
                    </View>
                    <View style={[s.barTrack, { backgroundColor: colors.surfaceVariant }]}>
                      <View style={[s.barFill, { width: pct+'%', backgroundColor: item.bg, borderColor: item.color+'44', borderWidth: 1 }]} />
                    </View>
                  </View>
                );
              })}
            </Animated.View>

            {/* Sport stats */}
            {sportStats.length > 0 && (
              <Animated.View entering={FadeInDown.delay(160).springify()} style={[s.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[s.cardTitle, { color: colors.textPrimary }]}>🏅 By Sport</Text>
                {sportStats.map(function(sp, i) {
                  return (
                    <View key={sp.name} style={[s.listRow, i < sportStats.length-1 && { borderBottomWidth: 0.5, borderBottomColor: colors.border }]}>
                      <View style={{ flex: 1 }}>
                        <Text style={[s.listName, { color: colors.textPrimary }]}>{sp.name}</Text>
                        <Text style={[s.listSub, { color: colors.textTertiary }]}>{sp.won}W / {sp.lost}L · {sp.bets.length} bets</Text>
                      </View>
                      <Text style={[s.listPnl, { color: sp.pnl >= 0 ? '#1A9E4A' : '#D93025' }]}>
                        {sp.pnl >= 0 ? '+' : ''}{formatMoney(sp.pnl, currSym)}
                      </Text>
                    </View>
                  );
                })}
              </Animated.View>
            )}

            {/* Bookie stats */}
            {bookieStats.length > 0 && (
              <Animated.View entering={FadeInDown.delay(200).springify()} style={[s.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[s.cardTitle, { color: colors.textPrimary }]}>🏢 By Bookie</Text>
                {bookieStats.map(function(bk, i) {
                  return (
                    <View key={bk.name} style={[s.listRow, i < bookieStats.length-1 && { borderBottomWidth: 0.5, borderBottomColor: colors.border }]}>
                      <View style={{ flex: 1 }}>
                        <Text style={[s.listName, { color: colors.textPrimary }]}>{bk.name}</Text>
                        <Text style={[s.listSub, { color: colors.textTertiary }]}>{bk.bets.length} bets · {bk.won} won</Text>
                      </View>
                      <Text style={[s.listPnl, { color: bk.pnl >= 0 ? '#1A9E4A' : '#D93025' }]}>
                        {bk.pnl >= 0 ? '+' : ''}{formatMoney(bk.pnl, currSym)}
                      </Text>
                    </View>
                  );
                })}
              </Animated.View>
            )}
          </View>
        )}

        {/* ── INSIGHTS ── */}
        {activeTab === 'Insights' && (
          <View style={{ gap: 10 }}>
            <Text style={[s.tabDesc, { color: colors.textTertiary }]}>Generated from your betting patterns</Text>
            {insights.map(function(ins, i) {
              var cfg = {
                positive: { bg: 'rgba(26,158,74,0.1)',  border: 'rgba(26,158,74,0.25)',  color: '#1A9E4A' },
                warning:  { bg: 'rgba(224,123,0,0.1)', border: 'rgba(224,123,0,0.25)',  color: '#E07B00' },
                info:     { bg: 'rgba(229,9,20,0.08)', border: 'rgba(229,9,20,0.2)',    color: '#E50914' },
              }[ins.type] || { bg: colors.surfaceVariant, border: colors.border, color: colors.textSecondary };
              return (
                <Animated.View key={i} entering={FadeInDown.delay(i * 70).springify()}
                  style={[s.insightCard, { backgroundColor: cfg.bg, borderColor: cfg.border }]}>
                  <Text style={{ fontSize: 20, flexShrink: 0 }}>{ins.icon}</Text>
                  <Text style={[s.insightTxt, { color: cfg.color }]}>{ins.text}</Text>
                </Animated.View>
              );
            })}
          </View>
        )}

        {/* ── ODDS ── */}
        {activeTab === 'Odds' && (
          <Animated.View entering={FadeInDown.springify()} style={[s.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[s.cardTitle, { color: colors.textPrimary }]}>Win Rate by Odds Range</Text>
            {oddsBreakdown.map(function(r) {
              var c = r.winRate >= 55 ? '#1A9E4A' : r.winRate >= 40 ? '#E07B00' : '#D93025';
              return (
                <View key={r.label} style={s.oddsRow}>
                  <Text style={[s.oddsLbl, { color: colors.textSecondary }]}>{r.label}</Text>
                  <View style={[s.oddsTrack, { backgroundColor: colors.surfaceVariant }]}>
                    <View style={[s.oddsFill, { width: r.winRate+'%', backgroundColor: c }]} />
                  </View>
                  <Text style={[s.oddsWR, { color: c }]}>{r.winRate}%</Text>
                  <View style={[s.oddsBadge, { backgroundColor: c+'22' }]}>
                    <Text style={[s.oddsBadgeTxt, { color: c }]}>{r.count}</Text>
                  </View>
                </View>
              );
            })}
          </Animated.View>
        )}

        {/* ── HEATMAP ── */}
        {activeTab === 'Heatmap' && (
          <Animated.View entering={FadeInDown.springify()} style={[s.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[s.cardTitle, { color: colors.textPrimary }]}>📅 Monthly Heatmap</Text>
            <Heatmap dayData={dayData} currSym={currSym} />
          </Animated.View>
        )}

        {/* ── TAGS ── */}
        {activeTab === 'Tags' && (
          <View>
            {tagStats.length === 0 ? (
              <View style={s.empty}>
                <Text style={{ fontSize: 40, marginBottom: 12 }}>🏷️</Text>
                <Text style={[s.emptyTitle, { color: colors.textPrimary }]}>No tags yet</Text>
                <Text style={[s.emptySub, { color: colors.textTertiary }]}>Add #tags to bets for analytics</Text>
              </View>
            ) : (
              <Animated.View entering={FadeInDown.springify()} style={[s.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[s.cardTitle, { color: colors.textPrimary }]}>Tag Performance</Text>
                {tagStats.map(function(td, i) {
                  return (
                    <View key={td.tag} style={[s.listRow, i < tagStats.length-1 && { borderBottomWidth: 0.5, borderBottomColor: colors.border }]}>
                      <View>
                        <View style={[s.tagBadge, { backgroundColor: 'rgba(229,9,20,0.08)' }]}>
                          <Text style={{ color: '#E50914', fontSize: 11, fontWeight: '700' }}>#{td.tag}</Text>
                        </View>
                        <Text style={[s.listSub, { color: colors.textTertiary, marginTop: 3 }]}>{td.won}W/{td.lost}L · {td.count} bets</Text>
                      </View>
                      <Text style={[s.listPnl, { color: td.pnl >= 0 ? '#1A9E4A' : '#D93025' }]}>
                        {td.pnl >= 0 ? '+' : ''}{formatMoney(td.pnl, currSym)}
                      </Text>
                    </View>
                  );
                })}
              </Animated.View>
            )}
          </View>
        )}

        {/* ── BADGES ── */}
        {activeTab === 'Badges' && (
          <View>
            <Text style={[s.tabDesc, { color: colors.textTertiary }]}>{unlocked.size}/{ACHIEVEMENTS.length} unlocked</Text>
            <View style={s.badgesGrid}>
              {ACHIEVEMENTS.map(function(a, i) {
                var done = unlocked.has(a.id);
                return (
                  <Animated.View key={a.id} entering={FadeInDown.delay(i * 50).springify()}
                    style={[s.badge, { backgroundColor: done ? 'rgba(229,9,20,0.08)' : colors.surfaceVariant, borderColor: done ? 'rgba(229,9,20,0.2)' : colors.border, opacity: done ? 1 : 0.4 }]}>
                    <Text style={{ fontSize: 28, marginBottom: 6 }}>{a.icon}</Text>
                    <Text style={[s.badgeTitle, { color: done ? '#E50914' : colors.textSecondary }]}>{a.title}</Text>
                    <Text style={[s.badgeDesc,  { color: done ? '#E50914' : colors.textTertiary }]}>{a.desc}</Text>
                    {done && <Text style={s.badgeCheck}>✓ UNLOCKED</Text>}
                  </Animated.View>
                );
              })}
            </View>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

var s = StyleSheet.create({
  screen:    { flex: 1 },
  topBar:    { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 0.5 },
  pageTitle: { fontSize: 22, fontWeight: '700' },

  tabScroll: { flexGrow: 0, maxHeight: 52 },
  tabRow:    { paddingHorizontal: 16, paddingVertical: 8, gap: 8, flexDirection: 'row', alignItems: 'center' },
  tab:       { paddingHorizontal: 16, paddingVertical: 7, borderRadius: 999, borderWidth: 0.5 },
  tabTxt:    { fontSize: 13 },

  content:   { padding: 16 },

  // Equal 4-card row
  cardRow:   { flexDirection: 'row', justifyContent: 'space-between' },

  card:      { borderRadius: 20, padding: 16, borderWidth: 0.5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  cardTitle: { fontSize: 16, fontWeight: '700', marginBottom: 4, color: '#fff' },
  cardSub:   { fontSize: 12, marginBottom: 14 },

  tabDesc:   { fontSize: 13, fontStyle: 'italic', marginBottom: 14 },

  breakLbl:   { fontSize: 13, fontWeight: '600' },
  breakCount: { fontSize: 13, fontWeight: '800' },
  barTrack:   { height: 7, borderRadius: 6, overflow: 'hidden' },
  barFill:    { height: '100%', borderRadius: 6 },

  listRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10 },
  listName:  { fontSize: 14, fontWeight: '700' },
  listSub:   { fontSize: 11, marginTop: 2 },
  listPnl:   { fontSize: 15, fontWeight: '900' },

  insightCard: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 14, padding: 13, borderWidth: 0.5 },
  insightTxt:  { flex: 1, fontSize: 13, fontWeight: '600', lineHeight: 19 },

  oddsRow:     { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  oddsLbl:     { width: 58, fontSize: 11, fontWeight: '700' },
  oddsTrack:   { flex: 1, height: 8, borderRadius: 6, overflow: 'hidden' },
  oddsFill:    { height: '100%', borderRadius: 6 },
  oddsWR:      { width: 32, fontSize: 11, fontWeight: '800', textAlign: 'right' },
  oddsBadge:   { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 999 },
  oddsBadgeTxt:{ fontSize: 10, fontWeight: '700' },

  tagBadge:  { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, alignSelf: 'flex-start' },

  badgesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  badge:      { width: '47%', borderRadius: 20, padding: 16, alignItems: 'center', borderWidth: 0.5 },
  badgeTitle: { fontSize: 13, fontWeight: '800', textAlign: 'center', marginBottom: 2 },
  badgeDesc:  { fontSize: 11, textAlign: 'center' },
  badgeCheck: { fontSize: 9, fontWeight: '800', marginTop: 4, color: '#E50914', letterSpacing: 1 },

  empty:      { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80 },
  emptyTitle: { fontSize: 20, fontWeight: '700', marginBottom: 6 },
  emptySub:   { fontSize: 14, textAlign: 'center' },
});
