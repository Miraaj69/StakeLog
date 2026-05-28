// StatsScreen.js — Material 3 Expressive · Pixel flagship
// Tonal surfaces · Animated charts · Spring tabs · Zero blur

import React, { useState, useMemo, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Pressable, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, {
  Path, Defs, LinearGradient as SvgGradient, Stop,
  Circle, G, Line, Text as SvgText, Rect,
} from 'react-native-svg';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, withTiming,
  interpolate, FadeInDown, FadeIn,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTheme } from './useTheme';
import { useStore, useStats } from './store';
import {
  formatMoney, getCurrencySymbol, calcPnLTimeSeries,
  calcSportStats, calcBookieStats, calcOddsBreakdown,
  calcTagStats, calcSmartInsights, ACHIEVEMENTS,
} from './calculations';

const { width: SW } = Dimensions.get('window');
const CHART_W = SW - 32;
const CHART_H = 200;
const TABS = ['Overview', 'Insights', 'Sports', 'Bookies', 'Odds', 'Tags', 'Badges'];
const TIME_FILTERS = ['7D', '30D', 'ALL'];

// ─── COLORS ──────────────────────────────────────────────────────
const C = {
  profit:  '#00BF6F',
  loss:    '#FF4444',
  pending: '#FFB347',
  primary: '#FF4B6A',
  blue:    '#5B8DEF',
};

// ─── LINE CHART ──────────────────────────────────────────────────
function LineChart({ data, color, currSym, colors, isDark }) {
  const [tooltip, setTooltip] = useState(null);
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(1, { duration: 900 });
  }, [data.length]);

  if (!data || data.length < 2) {
    return (
      <View style={[lc.empty, { backgroundColor: colors.surfaceVariant }]}>
        <Text style={{ color: colors.textTertiary, fontSize: 13 }}>
          Add more bets to see chart
        </Text>
      </View>
    );
  }

  const minY = Math.min(...data.map(d => d.y));
  const maxY = Math.max(...data.map(d => d.y));
  const rangeY = maxY - minY || 1;
  const pad = { t: 16, b: 28, l: 8, r: 8 };
  const w = CHART_W - pad.l - pad.r;
  const h = CHART_H - pad.t - pad.b;

  const xPos = i => pad.l + (i / (data.length - 1)) * w;
  const yPos = y => pad.t + h - ((y - minY) / rangeY) * h;

  const linePath = data.map((d, i) => {
    const x = xPos(i), y = yPos(d.y);
    if (i === 0) return `M ${x} ${y}`;
    const px = xPos(i - 1), py = yPos(data[i - 1].y);
    const cx1 = px + (x - px) / 3;
    const cx2 = x - (x - px) / 3;
    return `C ${cx1} ${py} ${cx2} ${y} ${x} ${y}`;
  }).join(' ');

  const fillPath = `${linePath} L ${xPos(data.length - 1)} ${pad.t + h} L ${xPos(0)} ${pad.t + h} Z`;

  const handleTouch = e => {
    const x = e.nativeEvent.locationX - pad.l;
    let idx = Math.round((x / w) * (data.length - 1));
    idx = Math.max(0, Math.min(data.length - 1, idx));
    setTooltip({ idx, x: xPos(idx), y: yPos(data[idx].y), d: data[idx] });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const gridColor = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)';
  const gradId = `g_${color.replace('#', '')}`;

  return (
    <View>
      <Svg width={CHART_W} height={CHART_H} onPress={handleTouch}>
        <Defs>
          <SvgGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%"   stopColor={color} stopOpacity="0.28" />
            <Stop offset="100%" stopColor={color} stopOpacity="0.00" />
          </SvgGradient>
        </Defs>

        {/* Zero line */}
        {minY < 0 && maxY > 0 && (
          <Line
            x1={pad.l} y1={yPos(0)} x2={pad.l + w} y2={yPos(0)}
            stroke={gridColor} strokeWidth="1" strokeDasharray="4,4"
          />
        )}

        {/* Fill */}
        <Path d={fillPath} fill={`url(#${gradId})`} />

        {/* Line */}
        <Path
          d={linePath} fill="none"
          stroke={color} strokeWidth="2.5"
          strokeLinecap="round" strokeLinejoin="round"
        />

        {/* End dot */}
        <Circle
          cx={xPos(data.length - 1)}
          cy={yPos(data[data.length - 1].y)}
          r="5" fill={color}
        />
        <Circle
          cx={xPos(data.length - 1)}
          cy={yPos(data[data.length - 1].y)}
          r="10" fill={color} fillOpacity="0.15"
        />

        {/* Tooltip crosshair */}
        {tooltip && (
          <G>
            <Line
              x1={tooltip.x} y1={pad.t}
              x2={tooltip.x} y2={pad.t + h}
              stroke={color} strokeWidth="1"
              strokeDasharray="3,3" strokeOpacity="0.5"
            />
            <Circle cx={tooltip.x} cy={tooltip.y} r="5" fill={color} />
            <Circle cx={tooltip.x} cy={tooltip.y} r="10" fill={color} fillOpacity="0.2" />
          </G>
        )}

        {/* Y labels */}
        <SvgText x={pad.l} y={pad.t + 8}    fontSize="9" fill={colors.textTertiary}>{formatMoney(maxY, '')}</SvgText>
        <SvgText x={pad.l} y={pad.t + h - 2} fontSize="9" fill={colors.textTertiary}>{formatMoney(minY, '')}</SvgText>
      </Svg>

      {tooltip && (
        <View style={[lc.tooltip, {
          backgroundColor: isDark ? colors.surfaceElevated : '#FFF',
          borderColor: color,
          left: Math.min(tooltip.x - 50, CHART_W - 130),
        }]}>
          <Text style={[lc.ttDate, { color: colors.textTertiary }]}>{tooltip.d.date}</Text>
          <Text style={[lc.ttVal, { color }]}>
            {tooltip.d.y >= 0 ? '+' : ''}{formatMoney(tooltip.d.y, '')}
          </Text>
        </View>
      )}
    </View>
  );
}
const lc = StyleSheet.create({
  empty:   { height: CHART_H, borderRadius: 16,
             alignItems: 'center', justifyContent: 'center' },
  tooltip: { position: 'absolute', top: 8, borderRadius: 14,
             padding: 10, borderWidth: 1, minWidth: 120,
             shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
             shadowOpacity: 0.12, shadowRadius: 10, elevation: 6 },
  ttDate:  { fontSize: 10, fontWeight: '600', marginBottom: 3 },
  ttVal:   { fontSize: 18, fontWeight: '900', letterSpacing: -0.5 },
});

// ─── DONUT CHART ─────────────────────────────────────────────────
function DonutChart({ wonCount, lostCount, pendingCount, colors }) {
  const total = wonCount + lostCount + pendingCount;
  if (total === 0) return null;

  const R = 52, cx = 70, cy = 70, sw = 18;
  const circ = 2 * Math.PI * R;
  const wonPct  = wonCount  / total;
  const lostPct = lostCount / total;
  const pendPct = pendingCount / total;

  const wonDash  = circ * wonPct;
  const lostDash = circ * lostPct;
  const wr = wonCount + lostCount > 0
    ? Math.round(wonCount / (wonCount + lostCount) * 100)
    : 0;

  return (
    <View style={do2.wrap}>
      <Svg width={140} height={140}>
        <Circle cx={cx} cy={cy} r={R} fill="none"
          stroke={colors.border} strokeWidth={sw} />
        {wonCount > 0 && (
          <Circle cx={cx} cy={cy} r={R} fill="none"
            stroke={C.profit} strokeWidth={sw}
            strokeDasharray={circ}
            strokeDashoffset={0}
            strokeLinecap="butt"
            transform={`rotate(-90 ${cx} ${cy})`}
          />
        )}
        {lostCount > 0 && (
          <Circle cx={cx} cy={cy} r={R} fill="none"
            stroke={C.loss} strokeWidth={sw}
            strokeDasharray={circ}
            strokeDashoffset={-(circ - wonDash)}
            strokeLinecap="butt"
            transform={`rotate(-90 ${cx} ${cy})`}
          />
        )}
        {pendingCount > 0 && (
          <Circle cx={cx} cy={cy} r={R} fill="none"
            stroke={C.pending} strokeWidth={sw}
            strokeDasharray={circ}
            strokeDashoffset={-(circ - wonDash - lostDash)}
            strokeLinecap="butt"
            transform={`rotate(-90 ${cx} ${cy})`}
          />
        )}
        <SvgText x={cx} y={cy - 6}  textAnchor="middle"
          fontSize="22" fontWeight="900" fill={colors.textPrimary}>
          {wr}%
        </SvgText>
        <SvgText x={cx} y={cy + 11} textAnchor="middle"
          fontSize="9" fontWeight="700" fill={colors.textTertiary}
          letterSpacing="1">
          WIN RATE
        </SvgText>
      </Svg>
      <View style={do2.legend}>
        {[
          { color: C.profit,  label: 'Won',     count: wonCount     },
          { color: C.loss,    label: 'Lost',     count: lostCount    },
          { color: C.pending, label: 'Pending',  count: pendingCount },
        ].filter(i => i.count > 0).map(item => (
          <View key={item.label} style={do2.row}>
            <View style={[do2.dot, { backgroundColor: item.color }]} />
            <Text style={[do2.lbl, { color: colors.textSecondary }]}>{item.label}</Text>
            <Text style={[do2.count, { color: item.color }]}>{item.count}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}
const do2 = StyleSheet.create({
  wrap:  { flexDirection: 'row', alignItems: 'center', gap: 20 },
  legend:{ gap: 12 },
  row:   { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot:   { width: 10, height: 10, borderRadius: 5 },
  lbl:   { fontSize: 13, fontWeight: '500', flex: 1 },
  count: { fontSize: 15, fontWeight: '800' },
});

// ─── TIME FILTER PILL ────────────────────────────────────────────
function TimeFilterPill({ value, onChange, colors }) {
  return (
    <View style={[tfp.wrap, { backgroundColor: colors.surfaceVariant, borderColor: colors.border }]}>
      {TIME_FILTERS.map(f => {
        const active = value === f;
        return (
          <Pressable
            key={f}
            onPress={() => {
              onChange(f);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
            style={[tfp.btn, active && { backgroundColor: C.primary }]}
          >
            <Text style={[tfp.txt, {
              color:      active ? '#fff' : colors.textTertiary,
              fontWeight: active ? '800' : '500',
            }]}>{f}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}
const tfp = StyleSheet.create({
  wrap: { flexDirection: 'row', borderRadius: 14, borderWidth: 1,
          overflow: 'hidden', height: 38 },
  btn:  { flex: 1, alignItems: 'center', justifyContent: 'center',
          borderRadius: 12, margin: 3 },
  txt:  { fontSize: 12 },
});

// ─── STAT CARD ───────────────────────────────────────────────────
function StatCard({ icon, value, label, color, bg, border, colors, delay = 0 }) {
  return (
    <Animated.View
      entering={FadeInDown.delay(delay).springify().damping(28)}
      style={[scc.card, {
        backgroundColor: bg   || colors.surfaceVariant,
        borderColor:     border || colors.border,
      }]}
    >
      {icon ? <Text style={scc.icon}>{icon}</Text> : null}
      <Text style={[scc.val, { color: color || colors.textPrimary }]}
        numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      <Text style={[scc.lbl, { color: colors.textTertiary }]} numberOfLines={1}>
        {label}
      </Text>
    </Animated.View>
  );
}
const scc = StyleSheet.create({
  card: { flex: 1, borderRadius: 20, paddingVertical: 14, paddingHorizontal: 8,
          alignItems: 'center', borderWidth: 1, overflow: 'hidden' },
  icon: { fontSize: 18, marginBottom: 5 },
  val:  { fontSize: 13, fontWeight: '900', letterSpacing: -0.2,
          textAlign: 'center', width: '100%' },
  lbl:  { fontSize: 9, fontWeight: '700', textTransform: 'uppercase',
          letterSpacing: 0.5, marginTop: 3,
          textAlign: 'center', width: '100%' },
});

// ─── SECTION LABEL ───────────────────────────────────────────────
function SectionLabel({ text, colors }) {
  return (
    <Text style={[sl.txt, { color: colors.textTertiary }]}>{text}</Text>
  );
}
const sl = StyleSheet.create({
  txt: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase',
         letterSpacing: 1.3, marginBottom: 10 },
});

// ─── ANIMATED BAR ────────────────────────────────────────────────
function AnimBar({ pct, color, delay = 0 }) {
  const width = useSharedValue(0);
  useEffect(() => {
    setTimeout(() => {
      width.value = withTiming(pct, { duration: 800 });
    }, delay);
  }, [pct]);
  const barStyle = useAnimatedStyle(() => ({
    width: `${width.value}%`,
  }));
  return (
    <View style={ab2.track}>
      <Animated.View style={[ab2.fill, { backgroundColor: color }, barStyle]} />
    </View>
  );
}
const ab2 = StyleSheet.create({
  track: { flex: 1, height: 7, borderRadius: 6,
           backgroundColor: 'rgba(255,255,255,0.06)', overflow: 'hidden' },
  fill:  { height: '100%', borderRadius: 6 },
});

// ─── SURFACE CARD ────────────────────────────────────────────────
function Card({ children, colors, isDark, style }) {
  return (
    <View style={[card.wrap, {
      backgroundColor: isDark ? colors.surfaceVariant : '#FFFFFF',
      borderColor:     colors.border,
    }, style]}>
      {children}
    </View>
  );
}
const card = StyleSheet.create({
  wrap: { borderRadius: 24, padding: 18, borderWidth: 1,
          shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.06, shadowRadius: 10, elevation: 2 },
});

// ─── MAIN SCREEN ─────────────────────────────────────────────────
export default function StatsScreen() {
  const { colors, isDark } = useTheme();
  const bets     = useStore(s => s.bets);
  const bookies  = useStore(s => s.bookies);
  const sports   = useStore(s => s.sports);
  const currency = useStore(s => s.currency);
  const stats    = useStats();
  const currSym  = getCurrencySymbol(currency);

  const [activeTab,  setActiveTab]  = useState('Overview');
  const [timeFilter, setTimeFilter] = useState('ALL');

  const filteredBets = useMemo(() => {
    const now = new Date();
    if (timeFilter === 'ALL') return bets;
    const days = timeFilter === '7D' ? 7 : 30;
    return bets.filter(b => (now - new Date(b.date)) / 86400000 <= days);
  }, [bets, timeFilter]);

  const pnlData     = useMemo(() => calcPnLTimeSeries(filteredBets), [filteredBets]);
  const sportStats  = useMemo(() => calcSportStats(filteredBets, sports), [filteredBets, sports]);
  const bookieStats = useMemo(() => calcBookieStats(filteredBets, bookies), [filteredBets, bookies]);
  const oddsBreak   = useMemo(() => calcOddsBreakdown(filteredBets), [filteredBets]);
  const tagStats    = useMemo(() => calcTagStats(filteredBets), [filteredBets]);
  const insights    = useMemo(() =>
    calcSmartInsights(filteredBets, sportStats, bookieStats, stats.streak, stats.winRate),
    [filteredBets, sportStats, bookieStats, stats]
  );
  const unlocked = useMemo(() =>
    new Set(
      ACHIEVEMENTS
        .filter(a => a.check(bets, stats.streak, stats.totalPnL, stats.winRate))
        .map(a => a.id)
    ), [bets, stats]
  );

  const fStats = useMemo(() => {
    const won  = filteredBets.filter(b => b.status === 'Won');
    const lost = filteredBets.filter(b => b.status === 'Lost');
    const pnl  = filteredBets.reduce((s, b) => {
      if (b.status === 'Won')  return s + parseFloat(b.stake) * (parseFloat(b.odds) - 1);
      if (b.status === 'Lost') return s - parseFloat(b.stake);
      return s;
    }, 0);
    const stake = filteredBets
      .filter(b => b.status !== 'Void')
      .reduce((s, b) => s + parseFloat(b.stake || 0), 0);
    const wr  = won.length + lost.length > 0
      ? ((won.length / (won.length + lost.length)) * 100).toFixed(0)
      : null;
    const roi = stake > 0 ? ((pnl / stake) * 100).toFixed(1) : null;
    return {
      pnl, stake, roi, winRate: wr,
      wonCount:     won.length,
      lostCount:    lost.length,
      totalBets:    filteredBets.length,
      pendingCount: filteredBets.filter(b => b.status === 'Pending').length,
    };
  }, [filteredBets]);

  const isProfit   = fStats.pnl >= 0;
  const chartColor = isProfit ? C.profit : C.loss;

  if (bets.length === 0) {
    return (
      <SafeAreaView style={[s.screen, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={[s.topBar, { borderBottomColor: colors.border }]}>
          <Text style={[s.pageTitle, { color: colors.textPrimary }]}>Analytics</Text>
        </View>
        <View style={s.empty}>
          <Text style={{ fontSize: 52, marginBottom: 14 }}>📊</Text>
          <Text style={[s.emptyTitle, { color: colors.textPrimary }]}>No data yet</Text>
          <Text style={[s.emptySub, { color: colors.textTertiary }]}>
            Track bets to unlock analytics
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[s.screen, { backgroundColor: colors.background }]} edges={['top']}>

      {/* ── Header ── */}
      <View style={[s.topBar, { borderBottomColor: colors.border }]}>
        <View>
          <Text style={[s.pageTitle, { color: colors.textPrimary }]}>Analytics</Text>
          <Text style={[s.pageSub, { color: colors.textTertiary }]}>
            {fStats.totalBets} bets · {timeFilter === 'ALL' ? 'All time' : `Last ${timeFilter}`}
          </Text>
        </View>
        <TimeFilterPill value={timeFilter} onChange={setTimeFilter} colors={colors} />
      </View>

      {/* ── Tab bar ── */}
      <ScrollView
        horizontal showsHorizontalScrollIndicator={false}
        style={s.tabScroll} contentContainerStyle={s.tabRow}
      >
        {TABS.map(tab => {
          const active = activeTab === tab;
          return (
            <Pressable
              key={tab}
              onPress={() => {
                setActiveTab(tab);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
              style={[s.tab, {
                backgroundColor: active ? 'rgba(255,75,106,0.1)' : colors.surfaceVariant,
                borderColor:     active ? 'rgba(255,75,106,0.3)' : colors.border,
              }]}
            >
              <Text style={[s.tabTxt, {
                color:      active ? C.primary : colors.textTertiary,
                fontWeight: active ? '800' : '500',
              }]}>
                {tab}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.content}
      >

        {/* ── OVERVIEW ── */}
        {activeTab === 'Overview' && (
          <View style={{ gap: 14 }}>

            {/* Stat row */}
            <View style={s.statRow}>
              <StatCard
                icon="📈" label="Net P&L"
                value={(isProfit ? '+' : '') + formatMoney(fStats.pnl, currSym)}
                color={isProfit ? C.profit : C.loss}
                bg={isProfit ? 'rgba(0,191,111,0.09)' : 'rgba(255,68,68,0.08)'}
                border={isProfit ? 'rgba(0,191,111,0.22)' : 'rgba(255,68,68,0.2)'}
                colors={colors} delay={0}
              />
              <StatCard
                icon="🎯" label="Win Rate"
                value={fStats.winRate ? `${fStats.winRate}%` : '—'}
                colors={colors} delay={40}
              />
              <StatCard
                icon="💰" label="Staked"
                value={formatMoney(fStats.stake, currSym)}
                colors={colors} delay={80}
              />
              <StatCard
                icon="📊" label="ROI"
                value={fStats.roi
                  ? `${parseFloat(fStats.roi) >= 0 ? '+' : ''}${fStats.roi}%`
                  : '—'}
                color={fStats.roi && parseFloat(fStats.roi) >= 0 ? C.profit : C.loss}
                colors={colors} delay={120}
              />
            </View>

            {/* P&L Chart */}
            <Animated.View entering={FadeInDown.delay(80).springify()}>
              <Card colors={colors} isDark={isDark}>
                <Text style={[s.cardTitle, { color: colors.textPrimary }]}>
                  Cumulative P&L
                </Text>
                <Text style={[s.cardSub, { color: colors.textTertiary }]}>
                  Tap chart to inspect values
                </Text>
                <View style={{ marginTop: 8 }}>
                  <LineChart
                    data={pnlData} color={chartColor}
                    currSym={currSym} colors={colors} isDark={isDark}
                  />
                </View>
              </Card>
            </Animated.View>

            {/* Outcome breakdown */}
            <Animated.View entering={FadeInDown.delay(120).springify()}>
              <Card colors={colors} isDark={isDark}>
                <Text style={[s.cardTitle, { color: colors.textPrimary }]}>
                  Outcome Breakdown
                </Text>
                <View style={{ marginTop: 14, marginBottom: 16 }}>
                  <DonutChart
                    wonCount={fStats.wonCount}
                    lostCount={fStats.lostCount}
                    pendingCount={fStats.pendingCount}
                    colors={colors}
                  />
                </View>
                {[
                  { label: 'Won',     count: fStats.wonCount,     color: C.profit  },
                  { label: 'Lost',    count: fStats.lostCount,    color: C.loss    },
                  { label: 'Pending', count: fStats.pendingCount, color: C.pending },
                ].map(item => {
                  const pct = fStats.totalBets > 0
                    ? Math.round(item.count / fStats.totalBets * 100)
                    : 0;
                  return (
                    <View key={item.label} style={{ marginBottom: 10 }}>
                      <View style={s.barLabelRow}>
                        <Text style={[s.barLabel, { color: colors.textSecondary }]}>{item.label}</Text>
                        <Text style={[s.barCount, { color: item.color }]}>
                          {item.count} · {pct}%
                        </Text>
                      </View>
                      <AnimBar pct={pct} color={item.color} delay={200} />
                    </View>
                  );
                })}
              </Card>
            </Animated.View>
          </View>
        )}

        {/* ── INSIGHTS ── */}
        {activeTab === 'Insights' && (
          <View style={{ gap: 9 }}>
            <Text style={[s.tabDesc, { color: colors.textTertiary }]}>
              Patterns from your betting history
            </Text>
            {insights.map((ins, i) => {
              const cfgMap = {
                positive: { bg: 'rgba(0,191,111,0.08)', border: 'rgba(0,191,111,0.2)', color: C.profit },
                warning:  { bg: 'rgba(255,179,71,0.08)', border: 'rgba(255,179,71,0.2)', color: C.pending },
                info:     { bg: 'rgba(255,75,106,0.07)', border: 'rgba(255,75,106,0.18)', color: C.primary },
              };
              const cfg = cfgMap[ins.type] || {
                bg: colors.surfaceVariant, border: colors.border,
                color: colors.textSecondary,
              };
              return (
                <Animated.View
                  key={i}
                  entering={FadeInDown.delay(i * 55).springify().damping(28)}
                  style={[s.insightCard, {
                    backgroundColor: cfg.bg,
                    borderColor:     cfg.border,
                  }]}
                >
                  <View style={[s.insightIcon, { backgroundColor: `${cfg.color}18` }]}>
                    <Text style={{ fontSize: 17 }}>{ins.icon}</Text>
                  </View>
                  <Text style={[s.insightTxt, { color: cfg.color }]}>{ins.text}</Text>
                </Animated.View>
              );
            })}
          </View>
        )}

        {/* ── SPORTS ── */}
        {activeTab === 'Sports' && (
          <View style={{ gap: 10 }}>
            <Text style={[s.tabDesc, { color: colors.textTertiary }]}>
              Performance by sport
            </Text>
            {sportStats.map((sp, i) => {
              const wr  = sp.won + sp.lost > 0
                ? Math.round(sp.won / (sp.won + sp.lost) * 100) : 0;
              const pos = sp.pnl >= 0;
              return (
                <Animated.View
                  key={sp.name}
                  entering={FadeInDown.delay(i * 50).springify().damping(28)}
                >
                  <Card colors={colors} isDark={isDark} style={{ padding: 14 }}>
                    <View style={s.bkRow}>
                      <View style={[s.bkIcon, {
                        backgroundColor: pos
                          ? 'rgba(0,191,111,0.12)'
                          : 'rgba(255,68,68,0.1)',
                      }]}>
                        <Text style={{ fontSize: 18 }}>
                          {sp.name.includes('Cricket') ? '🏏'
                           : sp.name.includes('Football') ? '⚽'
                           : sp.name.includes('Tennis') ? '🎾'
                           : sp.name.includes('Basketball') ? '🏀'
                           : sp.name.includes('Formula') ? '🏎️'
                           : '🎯'}
                        </Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[s.bkName, { color: colors.textPrimary }]}>{sp.name}</Text>
                        <Text style={[s.bkMeta, { color: colors.textTertiary }]}>
                          {sp.bets.length} bets · {wr}% WR · {sp.won}W / {sp.lost}L
                        </Text>
                      </View>
                      <Text style={[s.bkPnl, { color: pos ? C.profit : C.loss }]}>
                        {pos ? '+' : ''}{formatMoney(sp.pnl, currSym)}
                      </Text>
                    </View>
                  </Card>
                </Animated.View>
              );
            })}
          </View>
        )}

        {/* ── BOOKIES ── */}
        {activeTab === 'Bookies' && (
          <View style={{ gap: 10 }}>
            <Text style={[s.tabDesc, { color: colors.textTertiary }]}>
              Performance by bookmaker
            </Text>
            {bookieStats.map((bk, i) => {
              const pos = bk.pnl >= 0;
              return (
                <Animated.View
                  key={bk.name}
                  entering={FadeInDown.delay(i * 50).springify().damping(28)}
                >
                  <Card colors={colors} isDark={isDark} style={{ padding: 14 }}>
                    <View style={s.bkRow}>
                      <View style={[s.bkInitial, {
                        backgroundColor: pos
                          ? 'rgba(0,191,111,0.12)'
                          : 'rgba(255,68,68,0.1)',
                      }]}>
                        <Text style={[s.bkInitialTxt, {
                          color: pos ? C.profit : C.loss,
                        }]}>
                          {bk.name[0]}
                        </Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[s.bkName, { color: colors.textPrimary }]}>{bk.name}</Text>
                        <Text style={[s.bkMeta, { color: colors.textTertiary }]}>
                          {bk.bets.length} bets · {bk.won}W / {bk.lost}L
                        </Text>
                      </View>
                      <Text style={[s.bkPnl, { color: pos ? C.profit : C.loss }]}>
                        {pos ? '+' : ''}{formatMoney(bk.pnl, currSym)}
                      </Text>
                    </View>
                  </Card>
                </Animated.View>
              );
            })}
          </View>
        )}

        {/* ── ODDS ── */}
        {activeTab === 'Odds' && (
          <Animated.View entering={FadeInDown.springify()}>
            <Card colors={colors} isDark={isDark}>
              <Text style={[s.cardTitle, { color: colors.textPrimary }]}>
                Win Rate by Odds Range
              </Text>
              {oddsBreak.length === 0 ? (
                <Text style={[s.tabDesc, { color: colors.textTertiary, marginTop: 8 }]}>
                  No settled bets yet
                </Text>
              ) : oddsBreak.map(r => {
                const c = r.winRate >= 55 ? C.profit
                        : r.winRate >= 40 ? C.pending
                        : C.loss;
                return (
                  <View key={r.label} style={s.oddsRow}>
                    <Text style={[s.oddsLbl, { color: colors.textSecondary }]}>{r.label}</Text>
                    <AnimBar pct={r.winRate} color={c} />
                    <Text style={[s.oddsWR, { color: c }]}>{r.winRate}%</Text>
                    <View style={[s.oddsBadge, { backgroundColor: `${c}22` }]}>
                      <Text style={[s.oddsBadgeTxt, { color: c }]}>{r.count}</Text>
                    </View>
                  </View>
                );
              })}
            </Card>
          </Animated.View>
        )}

        {/* ── TAGS ── */}
        {activeTab === 'Tags' && (
          <Animated.View entering={FadeInDown.springify()}>
            {tagStats.length === 0 ? (
              <View style={s.empty}>
                <Text style={{ fontSize: 44, marginBottom: 12 }}>🏷️</Text>
                <Text style={[s.emptyTitle, { color: colors.textPrimary }]}>No tags yet</Text>
                <Text style={[s.emptySub, { color: colors.textTertiary }]}>
                  Add #tags to your bets
                </Text>
              </View>
            ) : (
              <Card colors={colors} isDark={isDark}>
                <Text style={[s.cardTitle, { color: colors.textPrimary }]}>
                  Tag Performance
                </Text>
                {tagStats.map((td, i) => (
                  <View
                    key={td.tag}
                    style={[s.tagRow,
                      i < tagStats.length - 1 && {
                        borderBottomWidth: 1, borderBottomColor: colors.border,
                      },
                    ]}
                  >
                    <View>
                      <View style={[s.tagBadge, { backgroundColor: 'rgba(255,75,106,0.09)' }]}>
                        <Text style={{ color: C.primary, fontSize: 11, fontWeight: '700' }}>
                          #{td.tag}
                        </Text>
                      </View>
                      <Text style={[s.tagMeta, { color: colors.textTertiary }]}>
                        {td.won}W / {td.lost}L · {td.count} bets
                      </Text>
                    </View>
                    <Text style={[s.tagPnl, {
                      color: td.pnl >= 0 ? C.profit : C.loss,
                    }]}>
                      {td.pnl >= 0 ? '+' : ''}{formatMoney(td.pnl, currSym)}
                    </Text>
                  </View>
                ))}
              </Card>
            )}
          </Animated.View>
        )}

        {/* ── BADGES ── */}
        {activeTab === 'Badges' && (
          <View>
            <Text style={[s.tabDesc, { color: colors.textTertiary, marginBottom: 14 }]}>
              {unlocked.size}/{ACHIEVEMENTS.length} unlocked
            </Text>
            <View style={s.badgesGrid}>
              {ACHIEVEMENTS.map((a, i) => {
                const done = unlocked.has(a.id);
                return (
                  <Animated.View
                    key={a.id}
                    entering={FadeInDown.delay(i * 45).springify()}
                    style={[s.badge, {
                      backgroundColor: done
                        ? 'rgba(255,75,106,0.08)'
                        : colors.surfaceVariant,
                      borderColor: done
                        ? 'rgba(255,75,106,0.22)'
                        : colors.border,
                      opacity: done ? 1 : 0.4,
                    }]}
                  >
                    <Text style={{ fontSize: 30, marginBottom: 8 }}>{a.icon}</Text>
                    <Text style={[s.badgeTitle, {
                      color: done ? C.primary : colors.textSecondary,
                    }]}>{a.title}</Text>
                    <Text style={[s.badgeDesc, {
                      color: done ? C.primary : colors.textTertiary,
                    }]}>{a.desc}</Text>
                    {done && (
                      <View style={[s.unlockedBadge, { backgroundColor: 'rgba(255,75,106,0.12)' }]}>
                        <Text style={[s.unlockedTxt, { color: C.primary }]}>✓ UNLOCKED</Text>
                      </View>
                    )}
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

// ─── STYLES ──────────────────────────────────────────────────────
const s = StyleSheet.create({
  screen:    { flex: 1 },
  topBar:    { flexDirection: 'row', justifyContent: 'space-between',
               alignItems: 'center', paddingHorizontal: 16,
               paddingTop: 12, paddingBottom: 14, borderBottomWidth: 0.5 },
  pageTitle: { fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
  pageSub:   { fontSize: 11, fontWeight: '600', marginTop: 2 },

  // Tabs
  tabScroll: { flexGrow: 0 },
  tabRow:    { paddingLeft: 16, paddingRight: 8,
               paddingVertical: 10, flexDirection: 'row', gap: 8 },
  tab:       { paddingHorizontal: 18, paddingVertical: 8,
               borderRadius: 999, borderWidth: 1 },
  tabTxt:    { fontSize: 12 },

  content:   { padding: 16, gap: 0 },
  statRow:   { flexDirection: 'row', gap: 8, marginBottom: 14 },

  cardTitle: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  cardSub:   { fontSize: 12, marginBottom: 4 },
  tabDesc:   { fontSize: 13, fontStyle: 'italic', marginBottom: 10 },

  // Bars
  barLabelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  barLabel:    { fontSize: 13, fontWeight: '600' },
  barCount:    { fontSize: 13, fontWeight: '800' },

  // Insights
  insightCard: { flexDirection: 'row', alignItems: 'center', gap: 12,
                 borderRadius: 18, padding: 14, borderWidth: 1 },
  insightIcon: { width: 38, height: 38, borderRadius: 13,
                 alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  insightTxt:  { flex: 1, fontSize: 13, fontWeight: '600', lineHeight: 19 },

  // Sports / Bookies
  bkRow:     { flexDirection: 'row', alignItems: 'center', gap: 12 },
  bkIcon:    { width: 44, height: 44, borderRadius: 14,
               alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  bkInitial: { width: 44, height: 44, borderRadius: 14,
               alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  bkInitialTxt: { fontSize: 18, fontWeight: '900' },
  bkName:    { fontSize: 14, fontWeight: '700', marginBottom: 3 },
  bkMeta:    { fontSize: 11, fontWeight: '500' },
  bkPnl:     { fontSize: 15, fontWeight: '900', letterSpacing: -0.4 },

  // Odds
  oddsRow:    { flexDirection: 'row', alignItems: 'center', gap: 8,
                marginBottom: 12, marginTop: 12 },
  oddsLbl:    { width: 60, fontSize: 11, fontWeight: '700' },
  oddsWR:     { width: 34, fontSize: 11, fontWeight: '800', textAlign: 'right' },
  oddsBadge:  { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 999 },
  oddsBadgeTxt:{ fontSize: 10, fontWeight: '700' },

  // Tags
  tagRow:    { flexDirection: 'row', justifyContent: 'space-between',
               alignItems: 'center', paddingVertical: 12 },
  tagBadge:  { paddingHorizontal: 10, paddingVertical: 4,
               borderRadius: 999, alignSelf: 'flex-start' },
  tagMeta:   { fontSize: 11, marginTop: 4 },
  tagPnl:    { fontSize: 15, fontWeight: '900' },

  // Badges
  badgesGrid:   { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  badge:        { width: '47%', borderRadius: 22, padding: 16,
                  alignItems: 'center', borderWidth: 1 },
  badgeTitle:   { fontSize: 13, fontWeight: '800', textAlign: 'center', marginBottom: 3 },
  badgeDesc:    { fontSize: 11, textAlign: 'center', lineHeight: 16 },
  unlockedBadge:{ marginTop: 8, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 999 },
  unlockedTxt:  { fontSize: 9, fontWeight: '900', letterSpacing: 1 },

  // Empty
  empty:      { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80 },
  emptyTitle: { fontSize: 20, fontWeight: '800', marginBottom: 6 },
  emptySub:   { fontSize: 14, textAlign: 'center' },
});
