// StatsScreen.js — Premium v2: Calendar heatmap, badges, sport bars, profit curve, gamification
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

var W = Dimensions.get('window').width;
var TABS = ['Overview', 'Sports', 'Calendar', 'Insights', 'Badges'];

// ── Stat Square ────────────────────────────────────────────────
function StatSq({ icon, value, label, color, bg, border, colors }) {
  return (
    <View style={[sq.card, { backgroundColor: bg || colors.surface, borderColor: border || colors.border }]}>
      {icon ? <Text style={sq.icon}>{icon}</Text> : null}
      <Text style={[sq.val, { color: color || colors.textPrimary }]} numberOfLines={1} adjustsFontSizeToFit>{value}</Text>
      <Text style={[sq.lbl, { color: colors.textTertiary }]} numberOfLines={1}>{label}</Text>
    </View>
  );
}
var sq = StyleSheet.create({
  card: { width: '23%', aspectRatio: 1, borderRadius: 18, alignItems: 'center', justifyContent: 'center', paddingVertical: 10, paddingHorizontal: 4, borderWidth: 0.5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  icon: { fontSize: 15, marginBottom: 3 },
  val:  { fontSize: 13, fontWeight: '800', letterSpacing: -0.2, textAlign: 'center', width: '100%' },
  lbl:  { fontSize: 8,  fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.3, marginTop: 2, textAlign: 'center', width: '100%' },
});

// ── Calendar Heatmap ───────────────────────────────────────────
function CalendarView({ bets, colors, isDark }) {
  var now    = new Date();
  var year   = now.getFullYear();
  var month  = now.getMonth();
  var days   = new Date(year, month + 1, 0).getDate();
  var startDow = new Date(year, month, 1).getDay(); // 0=Sun
  var adjusted = (startDow === 0) ? 6 : startDow - 1; // Mon=0

  var pnlMap = useMemo(function() { return calcPnLByDay(bets); }, [bets]);

  var monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  var dayLabels  = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];

  var cells = [];
  for (var i = 0; i < adjusted; i++) cells.push({ day: null });
  for (var d = 1; d <= days; d++) {
    var pnlInfo = pnlMap[d];
    cells.push({ day: d, pnl: pnlInfo ? pnlInfo.pnl : null, count: pnlInfo ? pnlInfo.count : 0 });
  }

  function cellStyle(cell) {
    if (!cell.day) return {};
    if (cell.pnl === null) return { backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)' };
    if (cell.pnl > 0)  return { backgroundColor: isDark ? 'rgba(74,222,128,0.18)' : 'rgba(74,222,128,0.15)' };
    if (cell.pnl < 0)  return { backgroundColor: isDark ? 'rgba(248,113,113,0.18)' : 'rgba(248,113,113,0.12)' };
    return { backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)' };
  }
  function cellTextColor(cell) {
    if (!cell.day) return 'transparent';
    if (cell.day === now.getDate()) return '#7C6BFF';
    if (cell.pnl === null) return isDark ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.18)';
    if (cell.pnl > 0) return '#4ADE80';
    if (cell.pnl < 0) return '#F87171';
    return colors.textTertiary;
  }

  return (
    <View style={[cal.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Text style={[cal.month, { color: colors.textPrimary }]}>{monthNames[month]} {year}</Text>
      <View style={cal.dayLabels}>
        {dayLabels.map(function(l) {
          return <Text key={l} style={[cal.dayLbl, { color: colors.textTertiary }]}>{l}</Text>;
        })}
      </View>
      <View style={cal.grid}>
        {cells.map(function(cell, idx) {
          return (
            <View key={idx} style={[cal.cell, cellStyle(cell),
              cell.day === now.getDate() && { borderWidth: 1.5, borderColor: '#7C6BFF' }
            ]}>
              <Text style={[cal.cellTxt, { color: cellTextColor(cell) }]}>
                {cell.day || ''}
              </Text>
            </View>
          );
        })}
      </View>
      <View style={cal.legend}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
          <View style={[cal.dot, { backgroundColor: 'rgba(74,222,128,0.5)' }]} />
          <Text style={[cal.legTxt, { color: colors.textTertiary }]}>Profit</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
          <View style={[cal.dot, { backgroundColor: 'rgba(248,113,113,0.5)' }]} />
          <Text style={[cal.legTxt, { color: colors.textTertiary }]}>Loss</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
          <View style={[cal.dot, { backgroundColor: '#7C6BFF' }]} />
          <Text style={[cal.legTxt, { color: colors.textTertiary }]}>Today</Text>
        </View>
      </View>
    </View>
  );
}
var cal = StyleSheet.create({
  card:      { borderRadius: 24, padding: 18, borderWidth: 0.5, marginBottom: 16 },
  month:     { fontSize: 14, fontWeight: '700', marginBottom: 14 },
  dayLabels: { flexDirection: 'row', marginBottom: 6 },
  dayLbl:    { flex: 1, fontSize: 8, fontWeight: '700', textAlign: 'center', textTransform: 'uppercase', letterSpacing: 0.3 },
  grid:      { flexDirection: 'row', flexWrap: 'wrap' },
  cell:      { width: '14.28%', aspectRatio: 1, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  cellTxt:   { fontSize: 11, fontWeight: '700' },
  legend:    { flexDirection: 'row', gap: 16, marginTop: 10, justifyContent: 'center' },
  dot:       { width: 8, height: 8, borderRadius: 4 },
  legTxt:    { fontSize: 10, fontWeight: '600' },
});

// ── Sport Row ──────────────────────────────────────────────────
function SportRow({ sport, maxPnl, colors, isDark, currSym }) {
  var pct = maxPnl > 0 ? Math.min(100, Math.abs(sport.pnl) / maxPnl * 100) : 0;
  var isPos = sport.pnl >= 0;
  var wr = sport.won + sport.lost > 0 ? Math.round(sport.won / (sport.won + sport.lost) * 100) : 0;
  return (
    <View style={[sr.row, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Text style={sr.icon}>{sport.name.substring(0, 2)}</Text>
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
          <Text style={[sr.name, { color: colors.textPrimary }]}>{sport.name.substring(2).trim()}</Text>
          <Text style={[sr.pnl, { color: isPos ? '#4ADE80' : '#F87171' }]}>
            {isPos ? '+' : ''}{formatMoney(sport.pnl, currSym)}
          </Text>
        </View>
        <View style={[sr.barBg, { backgroundColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)' }]}>
          <View style={[sr.barFill, { width: pct + '%', backgroundColor: isPos ? '#4ADE80' : '#F87171' }]} />
        </View>
        <Text style={[sr.meta, { color: colors.textTertiary }]}>{sport.bets.length} bets • {wr}% WR</Text>
      </View>
    </View>
  );
}
var sr = StyleSheet.create({
  row:    { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 18, padding: 14, borderWidth: 0.5, marginBottom: 8 },
  icon:   { fontSize: 22, width: 28, textAlign: 'center' },
  name:   { fontSize: 14, fontWeight: '700' },
  pnl:    { fontSize: 14, fontWeight: '800', letterSpacing: -0.3 },
  barBg:  { borderRadius: 999, height: 6, overflow: 'hidden', marginBottom: 4 },
  barFill:{ height: '100%', borderRadius: 999 },
  meta:   { fontSize: 10, fontWeight: '600' },
});

// ── Badge Card ─────────────────────────────────────────────────
function BadgeCard({ ach, unlocked, colors, isDark }) {
  return (
    <View style={[bg.card, {
      backgroundColor: unlocked
        ? (isDark ? 'rgba(124,107,255,0.10)' : '#F5F3FF')
        : colors.surface,
      borderColor: unlocked
        ? (isDark ? 'rgba(124,107,255,0.28)' : '#C4B5FD')
        : colors.border,
      opacity: unlocked ? 1 : 0.45,
    }]}>
      <Text style={bg.icon}>{ach.icon}</Text>
      <Text style={[bg.title, { color: unlocked ? (isDark ? '#A89DFF' : '#5B21B6') : colors.textTertiary }]}>{ach.title}</Text>
      <Text style={[bg.desc, { color: colors.textTertiary }]}>{ach.desc}</Text>
      {unlocked && (
        <View style={[bg.unlockBadge, { backgroundColor: 'rgba(74,222,128,0.15)' }]}>
          <Text style={bg.unlockTxt}>✓ Unlocked</Text>
        </View>
      )}
    </View>
  );
}
var bg = StyleSheet.create({
  card:        { borderRadius: 20, padding: 16, borderWidth: 0.5, alignItems: 'center', gap: 4, width: (W - 48) / 2 },
  icon:        { fontSize: 30, marginBottom: 4 },
  title:       { fontSize: 13, fontWeight: '800', textAlign: 'center' },
  desc:        { fontSize: 11, fontWeight: '500', textAlign: 'center', lineHeight: 15 },
  unlockBadge: { marginTop: 6, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3 },
  unlockTxt:   { fontSize: 10, fontWeight: '700', color: '#4ADE80' },
});

// ── Main Screen ───────────────────────────────────────────────
export default function StatsScreen() {
  var { colors, isDark } = useTheme();
  var bets     = useStore(function(s) { return s.bets; });
  var bookies  = useStore(function(s) { return s.bookies; });
  var sports   = useStore(function(s) { return s.sports; });
  var currency = useStore(function(s) { return s.currency; });
  var stats    = useStats();
  var currSym  = getCurrencySymbol(currency);

  var [activeTab,  setActiveTab]  = useState('Overview');
  var [dateFilter, setDateFilter] = useState('30D');

  var pnlData     = useMemo(function() { return calcPnLTimeSeries(bets); }, [bets]);
  var sportStats  = useMemo(function() { return calcSportStats(bets, sports); }, [bets, sports]);
  var bookieStats = useMemo(function() { return calcBookieStats(bets, bookies); }, [bets, bookies]);
  var oddsBreakdown = useMemo(function() { return calcOddsBreakdown(bets); }, [bets]);
  var tagStats    = useMemo(function() { return calcTagStats(bets); }, [bets]);
  var insights    = useMemo(function() { return calcSmartInsights(bets, sportStats, bookieStats, stats.streak, stats.winRate); }, [bets, sportStats, bookieStats, stats]);
  var unlocked    = useMemo(function() {
    return new Set(ACHIEVEMENTS.filter(function(a) { return a.check(bets, stats.streak, stats.totalPnL, stats.winRate); }).map(function(a) { return a.id; }));
  }, [bets, stats]);

  var isProfit = stats.totalPnL >= 0;
  var maxSportPnl = sportStats.reduce(function(m, s) { return Math.max(m, Math.abs(s.pnl)); }, 0);

  // Empty state
  if (bets.length === 0) {
    return (
      <SafeAreaView style={[s.screen, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={[s.topBar, { borderBottomColor: colors.border }]}>
          <Text style={[s.pageTitle, { color: colors.textPrimary }]}>Analytics</Text>
        </View>
        <View style={s.emptyWrap}>
          <Text style={s.emptyIllus}>📊</Text>
          <Text style={[s.emptyTitle, { color: colors.textPrimary }]}>No data yet</Text>
          <Text style={[s.emptySub, { color: colors.textTertiary }]}>Start logging bets to unlock powerful analytics, charts, and insights</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[s.screen, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[s.topBar, { borderBottomColor: colors.border }]}>
        <Text style={[s.pageTitle, { color: colors.textPrimary }]}>Analytics</Text>
        <View style={{ flexDirection: 'row', gap: 6 }}>
          {['7D', '30D', 'All'].map(function(f) {
            return (
              <Pressable key={f} onPress={() => setDateFilter(f)}
                style={[s.dateBtn, {
                  backgroundColor: dateFilter === f ? '#7C6BFF' : colors.surface,
                  borderColor: dateFilter === f ? '#7C6BFF' : colors.border,
                }]}>
                <Text style={[s.dateBtnTxt, { color: dateFilter === f ? '#fff' : colors.textTertiary }]}>{f}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Tab bar */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.tabScroll}>
        <View style={{ flexDirection: 'row', gap: 7, padding: 12, paddingBottom: 8 }}>
          {TABS.map(function(tab) {
            var active = activeTab === tab;
            return (
              <Pressable key={tab} onPress={() => setActiveTab(tab)}
                style={[s.tab, {
                  backgroundColor: active ? '#7C6BFF' : colors.surface,
                  borderColor: active ? '#7C6BFF' : colors.border,
                }]}>
                <Text style={[s.tabTxt, { color: active ? '#fff' : colors.textTertiary }]}>{tab}</Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, paddingBottom: 120 }}>

        {/* ── OVERVIEW TAB ── */}
        {activeTab === 'Overview' && (
          <>
            {/* Profit curve chart */}
            {pnlData.length >= 2 && (
              <Animated.View entering={FadeInDown.delay(40).springify()}
                style={[s.chartCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[s.chartTitle, { color: colors.textPrimary }]}>Profit Curve</Text>
                <Text style={[s.chartSub, { color: colors.textTertiary }]}>Cumulative P&L over time</Text>
                <Chart data={pnlData} color={isProfit ? '#4ADE80' : '#F87171'} height={130} currSym={currSym} />
              </Animated.View>
            )}

            {/* Stat grid */}
            <Animated.View entering={FadeInDown.delay(80).springify()} style={s.statGrid}>
              <StatSq icon="🎯" value={stats.winRate ? stats.winRate + '%' : '—'} label="Win Rate" color="#7C6BFF" bg={isDark ? 'rgba(124,107,255,0.08)' : '#F5F3FF'} border={isDark ? 'rgba(124,107,255,0.22)' : '#C4B5FD'} colors={colors} />
              <StatSq icon="📈" value={(isProfit ? '+' : '') + stats.roi + '%'} label="ROI" color={isProfit ? '#4ADE80' : '#F87171'} bg={isProfit ? (isDark ? 'rgba(74,222,128,0.08)' : '#F0FBF4') : (isDark ? 'rgba(248,113,113,0.08)' : '#FDF2F2')} border={isProfit ? (isDark ? 'rgba(74,222,128,0.22)' : '#A7DFB9') : (isDark ? 'rgba(248,113,113,0.22)' : '#FCA5A5')} colors={colors} />
              <StatSq icon="💸" value={formatMoney(stats.totalStake, currSym)} label="Staked" color={colors.textPrimary} colors={colors} />
              <StatSq icon="⚡" value={stats.streak.best + 'W'} label="Best Streak" color="#FCD34D" bg={isDark ? 'rgba(252,211,77,0.08)' : '#FFFBEB'} border={isDark ? 'rgba(252,211,77,0.22)' : '#FDE68A'} colors={colors} />
            </Animated.View>

            {/* Odds breakdown */}
            {oddsBreakdown.length > 0 && (
              <Animated.View entering={FadeInDown.delay(120).springify()}
                style={[s.sectionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[s.sectionTitle, { color: colors.textPrimary }]}>Win Rate by Odds</Text>
                {oddsBreakdown.map(function(od) {
                  return (
                    <View key={od.label} style={{ marginBottom: 10 }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                        <Text style={[s.oddsLabel, { color: colors.textSecondary }]}>{od.label}</Text>
                        <Text style={[s.oddsWr, { color: od.winRate >= 50 ? '#4ADE80' : '#F87171' }]}>{od.winRate}% ({od.count} bets)</Text>
                      </View>
                      <View style={[s.oddsBarBg, { backgroundColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)' }]}>
                        <View style={[s.oddsBarFill, { width: od.winRate + '%', backgroundColor: od.winRate >= 50 ? '#4ADE80' : '#F87171' }]} />
                      </View>
                    </View>
                  );
                })}
              </Animated.View>
            )}

            {/* Bookie breakdown */}
            {bookieStats.length > 0 && (
              <Animated.View entering={FadeInDown.delay(160).springify()}
                style={[s.sectionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[s.sectionTitle, { color: colors.textPrimary }]}>Best Bookmakers</Text>
                {bookieStats.slice(0, 5).map(function(bk) {
                  return (
                    <View key={bk.name} style={[s.bookieRow, { borderTopColor: colors.border }]}>
                      <Text style={[s.bookieName, { color: colors.textPrimary }]}>{bk.name}</Text>
                      <Text style={[s.bookieBets, { color: colors.textTertiary }]}>{bk.bets.length} bets</Text>
                      <Text style={[s.bookiePnl, { color: bk.pnl >= 0 ? '#4ADE80' : '#F87171' }]}>
                        {bk.pnl >= 0 ? '+' : ''}{formatMoney(bk.pnl, currSym)}
                      </Text>
                    </View>
                  );
                })}
              </Animated.View>
            )}
          </>
        )}

        {/* ── SPORTS TAB ── */}
        {activeTab === 'Sports' && (
          <Animated.View entering={FadeInDown.delay(40).springify()}>
            {sportStats.length === 0 ? (
              <View style={s.tabEmpty}>
                <Text style={[s.tabEmptyTxt, { color: colors.textTertiary }]}>No sport data yet</Text>
              </View>
            ) : sportStats.map(function(sp) {
              return <SportRow key={sp.name} sport={sp} maxPnl={maxSportPnl} colors={colors} isDark={isDark} currSym={currSym} />;
            })}
          </Animated.View>
        )}

        {/* ── CALENDAR TAB ── */}
        {activeTab === 'Calendar' && (
          <Animated.View entering={FadeInDown.delay(40).springify()}>
            <CalendarView bets={bets} colors={colors} isDark={isDark} />
          </Animated.View>
        )}

        {/* ── INSIGHTS TAB ── */}
        {activeTab === 'Insights' && (
          <Animated.View entering={FadeInDown.delay(40).springify()}>
            {insights.map(function(ins, idx) {
              var cfg = {
                positive: { bg: 'rgba(74,222,128,0.07)',  border: 'rgba(74,222,128,0.22)',  color: '#4ADE80' },
                warning:  { bg: 'rgba(252,211,77,0.07)',  border: 'rgba(252,211,77,0.22)',  color: '#FCD34D' },
                info:     { bg: 'rgba(124,107,255,0.07)', border: 'rgba(124,107,255,0.22)', color: '#A89DFF' },
              }[ins.type] || { bg: colors.surface, border: colors.border, color: colors.textSecondary };
              return (
                <View key={idx} style={[s.insightCard, { backgroundColor: cfg.bg, borderColor: cfg.border }]}>
                  <Text style={{ fontSize: 22 }}>{ins.icon}</Text>
                  <Text style={[s.insightTxt, { color: cfg.color }]}>{ins.text}</Text>
                </View>
              );
            })}
            {tagStats.length > 0 && (
              <View style={[s.sectionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[s.sectionTitle, { color: colors.textPrimary }]}>Performance by Tag</Text>
                {tagStats.map(function(tg) {
                  return (
                    <View key={tg.tag} style={[s.bookieRow, { borderTopColor: colors.border }]}>
                      <Text style={[s.bookieName, { color: '#A89DFF' }]}>#{tg.tag}</Text>
                      <Text style={[s.bookieBets, { color: colors.textTertiary }]}>{tg.count} bets</Text>
                      <Text style={[s.bookiePnl, { color: tg.pnl >= 0 ? '#4ADE80' : '#F87171' }]}>
                        {tg.pnl >= 0 ? '+' : ''}{formatMoney(tg.pnl, currSym)}
                      </Text>
                    </View>
                  );
                })}
              </View>
            )}
          </Animated.View>
        )}

        {/* ── BADGES TAB ── */}
        {activeTab === 'Badges' && (
          <Animated.View entering={FadeInDown.delay(40).springify()}>
            {/* XP progress */}
            <View style={[s.xpCard, { backgroundColor: isDark ? '#1A1228' : '#F5F3FF', borderColor: isDark ? 'rgba(168,157,255,0.2)' : 'rgba(124,107,255,0.2)' }]}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <Text style={[s.xpLevel, { color: '#A89DFF' }]}>Level {stats.xpLevel} — {stats.levelName}</Text>
                <Text style={[s.xpTotal, { color: '#7C6BFF' }]}>{stats.xp} XP</Text>
              </View>
              <Text style={[s.xpTitle, { color: colors.textPrimary }]}>{stats.xpToNext} XP to Level {stats.xpLevel + 1}</Text>
              <View style={[s.xpBarBg, { backgroundColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)', marginTop: 12 }]}>
                <View style={[s.xpBarFill, { width: ((stats.xp % 500) / 500 * 100) + '%' }]} />
              </View>
            </View>
            {/* Badges grid */}
            <View style={s.badgesGrid}>
              {ACHIEVEMENTS.map(function(ach) {
                return <BadgeCard key={ach.id} ach={ach} unlocked={unlocked.has(ach.id)} colors={colors} isDark={isDark} />;
              })}
            </View>
          </Animated.View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

var s = StyleSheet.create({
  screen:    { flex: 1 },
  topBar:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 0.5 },
  pageTitle: { fontSize: 24, fontWeight: '800', letterSpacing: -0.6 },
  dateBtn:   { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, borderWidth: 0.5 },
  dateBtnTxt:{ fontSize: 11, fontWeight: '700' },

  tabScroll: { flexGrow: 0 },
  tab:       { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 999, borderWidth: 0.5 },
  tabTxt:    { fontSize: 13, fontWeight: '700' },

  chartCard: { borderRadius: 24, padding: 18, borderWidth: 0.5, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  chartTitle:{ fontSize: 14, fontWeight: '700', marginBottom: 3 },
  chartSub:  { fontSize: 11, marginBottom: 14 },

  statGrid:  { flexDirection: 'row', gap: 8, justifyContent: 'space-between', marginBottom: 16 },

  sectionCard: { borderRadius: 22, padding: 18, borderWidth: 0.5, marginBottom: 16 },
  sectionTitle:{ fontSize: 15, fontWeight: '700', marginBottom: 14 },

  oddsLabel:  { fontSize: 12, fontWeight: '600' },
  oddsWr:     { fontSize: 12, fontWeight: '700' },
  oddsBarBg:  { borderRadius: 4, height: 6, overflow: 'hidden' },
  oddsBarFill:{ height: '100%', borderRadius: 4 },

  bookieRow:  { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 10, borderTopWidth: 0.5 },
  bookieName: { flex: 1, fontSize: 13, fontWeight: '700' },
  bookieBets: { fontSize: 11, fontWeight: '600' },
  bookiePnl:  { fontSize: 13, fontWeight: '800', minWidth: 60, textAlign: 'right' },

  insightCard:{ flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 16, padding: 14, borderWidth: 0.5, marginBottom: 8 },
  insightTxt: { flex: 1, fontSize: 13, fontWeight: '600', lineHeight: 19 },

  xpCard:    { borderRadius: 22, padding: 18, borderWidth: 0.5, marginBottom: 16 },
  xpLevel:   { fontSize: 10, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' },
  xpTotal:   { fontSize: 14, fontWeight: '800', letterSpacing: -0.3 },
  xpTitle:   { fontSize: 15, fontWeight: '700', marginTop: 2 },
  xpBarBg:   { borderRadius: 999, height: 8, overflow: 'hidden' },
  xpBarFill: { height: '100%', borderRadius: 999, backgroundColor: '#7C6BFF' },

  badgesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },

  tabEmpty:  { paddingVertical: 60, alignItems: 'center' },
  tabEmptyTxt:{ fontSize: 14, fontWeight: '600' },

  emptyWrap:  { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyIllus: { fontSize: 64, marginBottom: 18, opacity: 0.75 },
  emptyTitle: { fontSize: 20, fontWeight: '800', marginBottom: 10, letterSpacing: -0.4 },
  emptySub:   { fontSize: 14, textAlign: 'center', lineHeight: 22 },
});
