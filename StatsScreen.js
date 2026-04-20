// StatsScreen.js — TradingView-level analytics dashboard
import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Pressable,
  Dimensions, Animated as RNAnimated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, {
  Path, Defs, LinearGradient as SvgGradient, Stop,
  Circle, G, Text as SvgText, Line, Rect,
} from 'react-native-svg';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, withTiming,
  interpolate, FadeInDown,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTheme } from './useTheme';
import { useStore, useStats } from './store';
import {
  formatMoney, getCurrencySymbol, calcPnLTimeSeries,
  calcSportStats, calcBookieStats, calcOddsBreakdown,
  calcTagStats, calcSmartInsights, ACHIEVEMENTS,
} from './calculations';

var { width: SW } = Dimensions.get('window');
var CHART_W = SW - 32;
var CHART_H = 200;
var TABS = ['Overview', 'Insights', 'Odds', 'Heatmap', 'Tags', 'Badges'];
var TIME_FILTERS = ['7D', '30D', 'ALL'];

// ─── Smooth line chart with gradient fill + tooltip ───────────────
function LineChart({ data, color, currSym, colors }) {
  var [tooltip, setTooltip] = useState(null);
  var progress = useSharedValue(0);

  useEffect(function() {
    progress.value = withTiming(1, { duration: 900 });
  }, [data.length]);

  if (!data || data.length < 2) {
    return (
      <View style={[lc.empty, { backgroundColor: colors.surfaceVariant }]}>
        <Text style={{ color: colors.textTertiary, fontSize: 13 }}>Add more bets to see chart</Text>
      </View>
    );
  }

  var minY = Math.min(...data.map(function(d) { return d.y; }));
  var maxY = Math.max(...data.map(function(d) { return d.y; }));
  var rangeY = maxY - minY || 1;
  var pad = { t: 16, b: 28, l: 8, r: 8 };
  var w = CHART_W - pad.l - pad.r;
  var h = CHART_H - pad.t - pad.b;

  function xPos(i) { return pad.l + (i / (data.length - 1)) * w; }
  function yPos(y) { return pad.t + h - ((y - minY) / rangeY) * h; }

  // Smooth cubic bezier path
  var linePath = data.map(function(d, i) {
    var x = xPos(i), y = yPos(d.y);
    if (i === 0) return 'M ' + x + ' ' + y;
    var px = xPos(i - 1), py = yPos(data[i - 1].y);
    var cx1 = px + (x - px) / 3, cy1 = py;
    var cx2 = x - (x - px) / 3, cy2 = y;
    return 'C ' + cx1 + ' ' + cy1 + ' ' + cx2 + ' ' + cy2 + ' ' + x + ' ' + y;
  }).join(' ');

  var fillPath = linePath + ' L ' + xPos(data.length-1) + ' ' + (pad.t+h) + ' L ' + xPos(0) + ' ' + (pad.t+h) + ' Z';

  var isProfit = data[data.length-1].y >= 0;
  var lineColor = isProfit ? '#1A9E4A' : '#D93025';

  function handleTouch(e) {
    var x = e.nativeEvent.locationX - pad.l;
    var idx = Math.round((x / w) * (data.length - 1));
    idx = Math.max(0, Math.min(data.length - 1, idx));
    setTooltip({ idx: idx, x: xPos(idx), y: yPos(data[idx].y), d: data[idx] });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }

  return (
    <View>
      <Svg width={CHART_W} height={CHART_H} onPress={handleTouch}>
        <Defs>
          <SvgGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor={lineColor} stopOpacity="0.22" />
            <Stop offset="100%" stopColor={lineColor} stopOpacity="0.0" />
          </SvgGradient>
        </Defs>

        {/* Zero line */}
        {minY < 0 && maxY > 0 && (
          <Line
            x1={pad.l} y1={yPos(0)} x2={pad.l + w} y2={yPos(0)}
            stroke={colors.border} strokeWidth="1" strokeDasharray="4,4"
          />
        )}

        {/* Gradient fill */}
        <Path d={fillPath} fill="url(#chartFill)" />

        {/* Main line */}
        <Path d={linePath} fill="none" stroke={lineColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

        {/* Tooltip */}
        {tooltip && (
          <G>
            <Line x1={tooltip.x} y1={pad.t} x2={tooltip.x} y2={pad.t + h} stroke={lineColor} strokeWidth="1" strokeDasharray="3,3" strokeOpacity="0.6" />
            <Circle cx={tooltip.x} cy={tooltip.y} r="5" fill={lineColor} />
            <Circle cx={tooltip.x} cy={tooltip.y} r="8" fill={lineColor} fillOpacity="0.2" />
          </G>
        )}

        {/* Y axis labels */}
        <SvgText x={pad.l} y={pad.t + 8} fontSize="9" fill={colors.textTertiary} textAnchor="start">{formatMoney(maxY, currSym)}</SvgText>
        <SvgText x={pad.l} y={pad.t + h} fontSize="9" fill={colors.textTertiary} textAnchor="start">{formatMoney(minY, currSym)}</SvgText>
      </Svg>

      {/* Tooltip card */}
      {tooltip && (
        <View style={[lc.tooltip, { backgroundColor: colors.surface, borderColor: lineColor, left: Math.min(tooltip.x - 50, CHART_W - 120) }]}>
          <Text style={[lc.ttDate, { color: colors.textTertiary }]}>{tooltip.d.date}</Text>
          <Text style={[lc.ttVal, { color: lineColor }]}>
            {tooltip.d.y >= 0 ? '+' : ''}{formatMoney(tooltip.d.y, currSym)}
          </Text>
        </View>
      )}
    </View>
  );
}
var lc = StyleSheet.create({
  empty: { height: CHART_H, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  tooltip: { position:'absolute', top:8, borderRadius:12, padding:10, borderWidth:1, minWidth:110, shadowColor:'#000', shadowOffset:{width:0,height:4}, shadowOpacity:0.12, shadowRadius:8, elevation:6 },
  ttDate: { fontSize:10, fontWeight:'600', marginBottom:3 },
  ttVal:  { fontSize:16, fontWeight:'900', letterSpacing:-0.5 },
});

// ─── Donut chart ──────────────────────────────────────────────────
function DonutChart({ wonCount, lostCount, pendingCount, colors }) {
  var total = wonCount + lostCount + pendingCount;
  if (total === 0) return null;

  var R = 52, cx = 70, cy = 70, strokeW = 18;
  var circum = 2 * Math.PI * R;

  var wonPct  = wonCount  / total;
  var lostPct = lostCount / total;

  var wonDash  = circum * wonPct;
  var lostDash = circum * lostPct;
  var pendDash = circum * (pendingCount / total);

  var wonOffset  = 0;
  var lostOffset = -(circum - wonDash);
  var pendOffset = -(circum - wonDash - lostDash);

  var winRate = wonCount + lostCount > 0 ? Math.round(wonCount / (wonCount + lostCount) * 100) : 0;

  return (
    <View style={dc.wrap}>
      <Svg width={140} height={140}>
        {/* Background */}
        <Circle cx={cx} cy={cy} r={R} fill="none" stroke={colors.border} strokeWidth={strokeW} />
        {/* Won */}
        {wonCount > 0 && (
          <Circle cx={cx} cy={cy} r={R} fill="none" stroke="#1A9E4A" strokeWidth={strokeW}
            strokeDasharray={circum} strokeDashoffset={wonOffset}
            strokeLinecap="round" transform={`rotate(-90 ${cx} ${cy})`} />
        )}
        {/* Lost */}
        {lostCount > 0 && (
          <Circle cx={cx} cy={cy} r={R} fill="none" stroke="#D93025" strokeWidth={strokeW}
            strokeDasharray={circum} strokeDashoffset={lostOffset}
            strokeLinecap="round" transform={`rotate(-90 ${cx} ${cy})`} />
        )}
        {/* Pending */}
        {pendingCount > 0 && (
          <Circle cx={cx} cy={cy} r={R} fill="none" stroke="#E07B00" strokeWidth={strokeW}
            strokeDasharray={circum} strokeDashoffset={pendOffset}
            strokeLinecap="round" transform={`rotate(-90 ${cx} ${cy})`} />
        )}
        {/* Center text */}
        <SvgText x={cx} y={cy - 6} textAnchor="middle" fontSize="20" fontWeight="900" fill={colors.textPrimary}>{winRate}%</SvgText>
        <SvgText x={cx} y={cy + 10} textAnchor="middle" fontSize="9" fill={colors.textTertiary}>WIN RATE</SvgText>
      </Svg>
      <View style={dc.legend}>
        {[
          { color:'#1A9E4A', label:'Won',     count: wonCount     },
          { color:'#D93025', label:'Lost',    count: lostCount    },
          { color:'#E07B00', label:'Pending', count: pendingCount },
        ].map(function(item) {
          if (!item.count) return null;
          return (
            <View key={item.label} style={dc.legendRow}>
              <View style={[dc.dot, { backgroundColor: item.color }]} />
              <Text style={[dc.legendLbl, { color: colors.textSecondary }]}>{item.label}</Text>
              <Text style={[dc.legendVal, { color: item.color }]}>{item.count}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}
var dc = StyleSheet.create({
  wrap:      { flexDirection:'row', alignItems:'center', gap:16 },
  legend:    { gap:10 },
  legendRow: { flexDirection:'row', alignItems:'center', gap:8 },
  dot:       { width:10, height:10, borderRadius:5 },
  legendLbl: { fontSize:13, fontWeight:'500', flex:1 },
  legendVal: { fontSize:14, fontWeight:'800' },
});

// ─── Stat card (equal size) ────────────────────────────────────────
function StatCard({ icon, value, label, color, bg, border, colors }) {
  return (
    <View style={[sc.card, { backgroundColor: bg||colors.surface, borderColor: border||colors.border }]}>
      {icon ? <Text style={sc.icon}>{icon}</Text> : null}
      <Text style={[sc.val, { color: color||colors.textPrimary }]} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      <Text style={[sc.lbl, { color: colors.textTertiary }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}
var sc = StyleSheet.create({
  card: { width:'23%', aspectRatio:1, borderRadius:18, alignItems:'center', justifyContent:'center', paddingVertical:12, paddingHorizontal:6, borderWidth:0.5, overflow:'hidden' },
  icon: { fontSize:16, marginBottom:3 },
  val:  { fontSize:13, fontWeight:'900', letterSpacing:-0.2, textAlign:'center', width:'100%' },
  lbl:  { fontSize:9, fontWeight:'600', textTransform:'uppercase', letterSpacing:0.3, marginTop:2, textAlign:'center', width:'100%' },
});

// ─── Time filter ──────────────────────────────────────────────────
function TimeFilter({ value, onChange, colors }) {
  var slideX = useSharedValue(TIME_FILTERS.indexOf(value));

  useEffect(function() {
    slideX.value = withSpring(TIME_FILTERS.indexOf(value), { damping: 18, stiffness: 200 });
  }, [value]);

  var sliderStyle = useAnimatedStyle(function() {
    return { transform: [{ translateX: interpolate(slideX.value, [0, 1, 2], [2, 78, 154]) }] };
  });

  return (
    <View style={[tf.wrap, { backgroundColor: colors.surfaceVariant }]}>
      <Animated.View style={[tf.slider, { backgroundColor: '#FF3B30' }, sliderStyle]} />
      {TIME_FILTERS.map(function(f) {
        var active = value === f;
        return (
          <Pressable key={f} onPress={() => { onChange(f); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }} style={tf.btn}>
            <Text style={[tf.txt, { color: active?'#fff':colors.textTertiary, fontWeight: active?'800':'500' }]}>{f}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}
var tf = StyleSheet.create({
  wrap:   { flexDirection:'row', borderRadius:14, height:40, position:'relative', overflow:'hidden' },
  slider: { position:'absolute', top:3, bottom:3, width:72, borderRadius:11 },
  btn:    { flex:1, alignItems:'center', justifyContent:'center', zIndex:1 },
  txt:    { fontSize:13 },
});

// ─── Main screen ──────────────────────────────────────────────────
export default function StatsScreen() {
  var { colors } = useTheme();
  var bets     = useStore(function(s){return s.bets;});
  var bookies  = useStore(function(s){return s.bookies;});
  var sports   = useStore(function(s){return s.sports;});
  var currency = useStore(function(s){return s.currency;});
  var stats    = useStats();
  var currSym  = getCurrencySymbol(currency);

  var [activeTab,  setActiveTab]  = useState('Overview');
  var [timeFilter, setTimeFilter] = useState('ALL');

  // Filter data by time
  var filteredBets = useMemo(function() {
    var now = new Date();
    if (timeFilter === 'ALL') return bets;
    var days = timeFilter === '7D' ? 7 : 30;
    return bets.filter(function(b) { return (now - new Date(b.date)) / 86400000 <= days; });
  }, [bets, timeFilter]);

  var pnlData      = useMemo(function(){return calcPnLTimeSeries(filteredBets);}, [filteredBets]);
  var sportStats   = useMemo(function(){return calcSportStats(filteredBets, sports);}, [filteredBets, sports]);
  var bookieStats  = useMemo(function(){return calcBookieStats(filteredBets, bookies);}, [filteredBets, bookies]);
  var oddsBreak    = useMemo(function(){return calcOddsBreakdown(filteredBets);}, [filteredBets]);
  var tagStats     = useMemo(function(){return calcTagStats(filteredBets);}, [filteredBets]);
  var insights     = useMemo(function(){return calcSmartInsights(filteredBets,sportStats,bookieStats,stats.streak,stats.winRate);}, [filteredBets,sportStats,bookieStats,stats]);
  var unlocked     = useMemo(function(){
    return new Set(ACHIEVEMENTS.filter(function(a){return a.check(bets,stats.streak,stats.totalPnL,stats.winRate);}).map(function(a){return a.id;}));
  }, [bets, stats]);

  // Filtered stats
  var fStats = useMemo(function() {
    var won  = filteredBets.filter(function(b){return b.status==='Won';});
    var lost = filteredBets.filter(function(b){return b.status==='Lost';});
    var pnl  = filteredBets.reduce(function(s,b){
      if(b.status==='Won') return s+parseFloat(b.stake)*(parseFloat(b.odds)-1);
      if(b.status==='Lost') return s-parseFloat(b.stake);
      return s;
    },0);
    var stake = filteredBets.filter(function(b){return b.status!=='Void';}).reduce(function(s,b){return s+parseFloat(b.stake||0);},0);
    var wr = won.length+lost.length>0 ? ((won.length/(won.length+lost.length))*100).toFixed(0) : null;
    var roi = stake>0 ? ((pnl/stake)*100).toFixed(1) : null;
    return { pnl, stake, wonCount:won.length, lostCount:lost.length, totalBets:filteredBets.length, winRate:wr, roi,
      pendingCount: filteredBets.filter(function(b){return b.status==='Pending';}).length };
  }, [filteredBets]);

  var isProfit = fStats.pnl >= 0;

  if (bets.length === 0) {
    return (
      <SafeAreaView style={[s.screen,{backgroundColor:colors.background}]} edges={['top']}>
        <View style={[s.topBar,{borderBottomColor:colors.border}]}>
          <Text style={[s.pageTitle,{color:colors.textPrimary}]}>Analytics</Text>
        </View>
        <View style={s.empty}>
          <Text style={{fontSize:52,marginBottom:14}}>📊</Text>
          <Text style={[s.emptyTitle,{color:colors.textPrimary}]}>No data yet</Text>
          <Text style={[s.emptySub,{color:colors.textTertiary}]}>Track bets to unlock analytics</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[s.screen,{backgroundColor:colors.background}]} edges={['top']}>
      {/* Header */}
      <View style={[s.topBar,{borderBottomColor:colors.border}]}>
        <Text style={[s.pageTitle,{color:colors.textPrimary}]}>Analytics</Text>
        <TimeFilter value={timeFilter} onChange={setTimeFilter} colors={colors} />
      </View>

      {/* Tab bar */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.tabScroll} contentContainerStyle={s.tabRow}>
        {TABS.map(function(tab) {
          var active = activeTab === tab;
          return (
            <Pressable key={tab} onPress={()=>setActiveTab(tab)}
              style={[s.tab, { backgroundColor:active?'#FF3B30':colors.surfaceVariant, borderColor:active?'#FF3B30':colors.border }]}>
              <Text style={[s.tabTxt, { color:active?'#fff':'#9CA3AF', fontWeight:active?'700':'500' }]} numberOfLines={1} adjustsFontSizeToFit>{tab}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.content}>

        {/* ── OVERVIEW ── */}
        {activeTab==='Overview' && (
          <View style={{gap:14}}>
            {/* 4 equal stat cards */}
            <Animated.View entering={FadeInDown.delay(40).springify()}>
              <View style={s.cardRow}>
                <StatCard icon="📈" label="Net P&L" value={(isProfit?'+':'')+formatMoney(fStats.pnl,currSym)} color={isProfit?'#1A9E4A':'#D93025'} bg={isProfit?'#E8F8EE':'#FDECEA'} border={isProfit?'#A7DFB9':'#F5B8B2'} colors={colors} />
                <StatCard icon="🎯" label="Win Rate" value={fStats.winRate?fStats.winRate+'%':'—'} colors={colors} />
                <StatCard icon="💰" label="Staked"   value={formatMoney(fStats.stake,currSym)} colors={colors} />
                <StatCard icon="📊" label="ROI"      value={fStats.roi?(parseFloat(fStats.roi)>=0?'+':'')+fStats.roi+'%':'—'} color={fStats.roi&&parseFloat(fStats.roi)>=0?'#1A9E4A':'#D93025'} colors={colors} />
              </View>
            </Animated.View>

            {/* P&L Chart */}
            <Animated.View entering={FadeInDown.delay(80).springify()} style={[s.card,{backgroundColor:colors.surface,borderColor:colors.border}]}>
              <Text style={[s.cardTitle,{color:colors.textPrimary}]}>📈 Cumulative P&L</Text>
              <Text style={[s.cardSub,{color:colors.textTertiary}]}>Tap chart to see values</Text>
              <LineChart data={pnlData} color={isProfit?'#1A9E4A':'#D93025'} currSym={currSym} colors={colors} />
            </Animated.View>

            {/* Donut + outcome */}
            <Animated.View entering={FadeInDown.delay(120).springify()} style={[s.card,{backgroundColor:colors.surface,borderColor:colors.border}]}>
              <Text style={[s.cardTitle,{color:colors.textPrimary}]}>Outcome Breakdown</Text>
              <View style={{marginTop:14}}>
                <DonutChart wonCount={fStats.wonCount} lostCount={fStats.lostCount} pendingCount={fStats.pendingCount} colors={colors} />
              </View>
              <View style={{marginTop:16}}>
                {[
                  {label:'Won',     count:fStats.wonCount,     color:'#1A9E4A', pct: fStats.totalBets>0?Math.round(fStats.wonCount/fStats.totalBets*100):0},
                  {label:'Lost',    count:fStats.lostCount,    color:'#D93025', pct: fStats.totalBets>0?Math.round(fStats.lostCount/fStats.totalBets*100):0},
                  {label:'Pending', count:fStats.pendingCount, color:'#E07B00', pct: fStats.totalBets>0?Math.round(fStats.pendingCount/fStats.totalBets*100):0},
                ].map(function(item) {
                  return (
                    <View key={item.label} style={{marginBottom:10}}>
                      <View style={{flexDirection:'row',justifyContent:'space-between',marginBottom:5}}>
                        <Text style={[s.breakLbl,{color:colors.textSecondary}]}>{item.label}</Text>
                        <Text style={[s.breakCount,{color:item.color}]}>{item.count} bets · {item.pct}%</Text>
                      </View>
                      <View style={[s.barTrack,{backgroundColor:colors.surfaceVariant}]}>
                        <View style={[s.barFill,{width:item.pct+'%',backgroundColor:item.color+'33',borderColor:item.color,borderWidth:0.5}]} />
                      </View>
                    </View>
                  );
                })}
              </View>
            </Animated.View>

            {/* Sport breakdown — horizontal cards */}
            {sportStats.length>0 && (
              <Animated.View entering={FadeInDown.delay(160).springify()}>
                <Text style={[s.sectionLbl,{color:colors.textTertiary}]}>BY SPORT</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={{flexDirection:'row',gap:10,paddingVertical:4}}>
                    {sportStats.map(function(sp) {
                      var wr = sp.won+sp.lost>0?Math.round(sp.won/(sp.won+sp.lost)*100):0;
                      var pos = sp.pnl>=0;
                      return (
                        <View key={sp.name} style={[s.breakCard,{backgroundColor:colors.surface,borderColor:colors.border}]}>
                          <Text style={[s.breakCardTitle,{color:colors.textPrimary}]} numberOfLines={1}>{sp.name}</Text>
                          <Text style={[s.breakCardPnl,{color:pos?'#1A9E4A':'#D93025'}]}>{pos?'+':''}{formatMoney(sp.pnl,currSym)}</Text>
                          <Text style={[s.breakCardSub,{color:colors.textTertiary}]}>WR {wr}% · {sp.bets.length} bets</Text>
                        </View>
                      );
                    })}
                  </View>
                </ScrollView>
              </Animated.View>
            )}

            {/* Bookie breakdown */}
            {bookieStats.length>0 && (
              <Animated.View entering={FadeInDown.delay(200).springify()}>
                <Text style={[s.sectionLbl,{color:colors.textTertiary}]}>BY BOOKIE</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={{flexDirection:'row',gap:10,paddingVertical:4}}>
                    {bookieStats.map(function(bk) {
                      var pos = bk.pnl>=0;
                      return (
                        <View key={bk.name} style={[s.breakCard,{backgroundColor:colors.surface,borderColor:colors.border}]}>
                          <Text style={[s.breakCardTitle,{color:colors.textPrimary}]} numberOfLines={1}>{bk.name}</Text>
                          <Text style={[s.breakCardPnl,{color:pos?'#1A9E4A':'#D93025'}]}>{pos?'+':''}{formatMoney(bk.pnl,currSym)}</Text>
                          <Text style={[s.breakCardSub,{color:colors.textTertiary}]}>{bk.bets.length} bets · {bk.won}W</Text>
                        </View>
                      );
                    })}
                  </View>
                </ScrollView>
              </Animated.View>
            )}
          </View>
        )}

        {/* ── INSIGHTS ── */}
        {activeTab==='Insights' && (
          <View style={{gap:10}}>
            <Text style={[s.tabDesc,{color:colors.textTertiary}]}>From your betting patterns</Text>
            {insights.map(function(ins,i){
              var cfgMap={positive:{bg:'rgba(26,158,74,0.08)',border:'rgba(26,158,74,0.2)',color:'#1A9E4A'},warning:{bg:'rgba(224,123,0,0.08)',border:'rgba(224,123,0,0.2)',color:'#E07B00'},info:{bg:'rgba(255,59,48,0.06)',border:'rgba(255,59,48,0.15)',color:'#FF3B30'}};
              var cfg=cfgMap[ins.type]||{bg:colors.surfaceVariant,border:colors.border,color:colors.textSecondary};
              return (
                <Animated.View key={i} entering={FadeInDown.delay(i*60).springify()} style={[s.insightCard,{backgroundColor:cfg.bg,borderColor:cfg.border}]}>
                  <Text style={{fontSize:18}}>{ins.icon}</Text>
                  <Text style={[s.insightTxt,{color:cfg.color}]}>{ins.text}</Text>
                </Animated.View>
              );
            })}
          </View>
        )}

        {/* ── ODDS ── */}
        {activeTab==='Odds' && (
          <Animated.View entering={FadeInDown.springify()} style={[s.card,{backgroundColor:colors.surface,borderColor:colors.border}]}>
            <Text style={[s.cardTitle,{color:colors.textPrimary}]}>Win Rate by Odds Range</Text>
            {oddsBreak.length===0 ? <Text style={[s.tabDesc,{color:colors.textTertiary,marginTop:8}]}>No settled bets yet</Text> :
              oddsBreak.map(function(r){
                var c=r.winRate>=55?'#1A9E4A':r.winRate>=40?'#E07B00':'#D93025';
                return (
                  <View key={r.label} style={s.oddsRow}>
                    <Text style={[s.oddsLbl,{color:colors.textSecondary}]}>{r.label}</Text>
                    <View style={[s.oddsTrack,{backgroundColor:colors.surfaceVariant}]}>
                      <View style={[s.oddsFill,{width:r.winRate+'%',backgroundColor:c}]} />
                    </View>
                    <Text style={[s.oddsWR,{color:c}]}>{r.winRate}%</Text>
                    <View style={[s.oddsBadge,{backgroundColor:c+'22'}]}>
                      <Text style={[s.oddsBadgeTxt,{color:c}]}>{r.count}</Text>
                    </View>
                  </View>
                );
              })
            }
          </Animated.View>
        )}

        {/* ── TAGS ── */}
        {activeTab==='Tags' && (
          <Animated.View entering={FadeInDown.springify()}>
            {tagStats.length===0 ? (
              <View style={s.empty}>
                <Text style={{fontSize:40,marginBottom:12}}>🏷️</Text>
                <Text style={[s.emptyTitle,{color:colors.textPrimary}]}>No tags yet</Text>
                <Text style={[s.emptySub,{color:colors.textTertiary}]}>Add #tags to bets for analytics</Text>
              </View>
            ) : (
              <View style={[s.card,{backgroundColor:colors.surface,borderColor:colors.border}]}>
                <Text style={[s.cardTitle,{color:colors.textPrimary}]}>Tag Performance</Text>
                {tagStats.map(function(td,i){
                  return (
                    <View key={td.tag} style={[s.listRow,i<tagStats.length-1&&{borderBottomWidth:0.5,borderBottomColor:colors.border}]}>
                      <View>
                        <View style={[s.tagBadge,{backgroundColor:'rgba(255,59,48,0.08)'}]}>
                          <Text style={{color:'#FF3B30',fontSize:11,fontWeight:'700'}}>#{td.tag}</Text>
                        </View>
                        <Text style={[s.listSub,{color:colors.textTertiary,marginTop:3}]}>{td.won}W/{td.lost}L · {td.count} bets</Text>
                      </View>
                      <Text style={[s.listPnl,{color:td.pnl>=0?'#1A9E4A':'#D93025'}]}>{td.pnl>=0?'+':''}{formatMoney(td.pnl,currSym)}</Text>
                    </View>
                  );
                })}
              </View>
            )}
          </Animated.View>
        )}

        {/* ── HEATMAP ── */}
        {activeTab==='Heatmap' && (
          <Animated.View entering={FadeInDown.springify()} style={[s.card,{backgroundColor:colors.surface,borderColor:colors.border}]}>
            <Text style={[s.cardTitle,{color:colors.textPrimary}]}>📅 Monthly Activity</Text>
            <Text style={[s.tabDesc,{color:colors.textTertiary,marginTop:4}]}>Bets per day this month</Text>
            <View style={{marginTop:12}}>
              {(function(){
                var now=new Date(), daysInMonth=new Date(now.getFullYear(),now.getMonth()+1,0).getDate();
                var rows=[], row=[];
                for(var d=1;d<=daysInMonth;d++){
                  var dayBets=filteredBets.filter(function(b){var bd=new Date(b.date);return bd.getDate()===d&&bd.getMonth()===now.getMonth();});
                  var dayPnl=dayBets.reduce(function(sum,b){return sum+(b.status==='Won'?parseFloat(b.stake)*(parseFloat(b.odds)-1):b.status==='Lost'?-parseFloat(b.stake):0);},0);
                  row.push({d:d,count:dayBets.length,pnl:dayPnl});
                  if(d%7===0||d===daysInMonth){rows.push(row);row=[];}
                }
                return rows.map(function(r,ri){
                  return (
                    <View key={ri} style={{flexDirection:'row',gap:5,marginBottom:5}}>
                      {r.map(function(cell){
                        var bg=cell.count===0?colors.surfaceVariant:cell.pnl>=0?'rgba(26,158,74,'+Math.min(0.15+cell.count*0.1,0.6)+')':'rgba(217,48,37,'+Math.min(0.15+cell.count*0.1,0.6)+')';
                        return (
                          <View key={cell.d} style={[s.heatCell,{backgroundColor:bg}]}>
                            <Text style={[s.heatDay,{color:cell.count>0?colors.textPrimary:colors.textTertiary}]}>{cell.d}</Text>
                          </View>
                        );
                      })}
                    </View>
                  );
                });
              })()}
            </View>
          </Animated.View>
        )}

        {/* ── BADGES ── */}
        {activeTab==='Badges' && (
          <View>
            <Text style={[s.tabDesc,{color:colors.textTertiary}]}>{unlocked.size}/{ACHIEVEMENTS.length} unlocked</Text>
            <View style={s.badgesGrid}>
              {ACHIEVEMENTS.map(function(a,i){
                var done=unlocked.has(a.id);
                return (
                  <Animated.View key={a.id} entering={FadeInDown.delay(i*50).springify()}
                    style={[s.badge,{backgroundColor:done?'rgba(255,59,48,0.08)':colors.surfaceVariant,borderColor:done?'rgba(255,59,48,0.2)':colors.border,opacity:done?1:0.42}]}>
                    <Text style={{fontSize:28,marginBottom:6}}>{a.icon}</Text>
                    <Text style={[s.badgeTitle,{color:done?'#FF3B30':colors.textSecondary}]}>{a.title}</Text>
                    <Text style={[s.badgeDesc,{color:done?'#FF3B30':colors.textTertiary}]}>{a.desc}</Text>
                    {done&&<Text style={s.badgeCheck}>✓ UNLOCKED</Text>}
                  </Animated.View>
                );
              })}
            </View>
          </View>
        )}

        <View style={{height:100}} />
      </ScrollView>
    </SafeAreaView>
  );
}

var s = StyleSheet.create({
  screen:    {flex:1},
  topBar:    {flexDirection:'row',justifyContent:'space-between',alignItems:'center',paddingHorizontal:16,paddingVertical:12,borderBottomWidth:0.5},
  pageTitle: {fontSize:22,fontWeight:'700'},
  tabScroll: {flexGrow:0,maxHeight:54},
  tabRow:    {paddingLeft:16,paddingRight:8,paddingVertical:8,flexDirection:'row',alignItems:'center'},
  tab:       {paddingHorizontal:18,paddingVertical:9,borderRadius:20,marginRight:8,borderWidth:0.5},
  tabTxt:    {fontSize:13,fontWeight:'600',flexShrink:1},
  content:   {padding:16},
  cardRow:   {flexDirection:'row',justifyContent:'space-between'},
  card:      {borderRadius:20,padding:16,borderWidth:0.5,shadowColor:'#000',shadowOffset:{width:0,height:2},shadowOpacity:0.05,shadowRadius:8,elevation:2},
  cardTitle: {fontSize:16,fontWeight:'700',marginBottom:4,color:'#fff'},
  cardSub:   {fontSize:12,marginBottom:12},
  sectionLbl:{fontSize:10,fontWeight:'700',letterSpacing:1.2,textTransform:'uppercase',marginBottom:8},
  breakLbl:  {fontSize:13,fontWeight:'600'},
  breakCount:{fontSize:13,fontWeight:'800'},
  barTrack:  {height:7,borderRadius:6,overflow:'hidden',flex:1,marginHorizontal:10},
  barFill:   {height:'100%',borderRadius:6},
  breakCard: {borderRadius:16,padding:14,borderWidth:0.5,minWidth:130},
  breakCardTitle:{fontSize:13,fontWeight:'700',marginBottom:4},
  breakCardPnl:  {fontSize:17,fontWeight:'900',letterSpacing:-0.5,marginBottom:2},
  breakCardSub:  {fontSize:10,fontWeight:'600'},
  tabDesc:   {fontSize:13,fontStyle:'italic',marginBottom:14},
  insightCard:{flexDirection:'row',alignItems:'center',gap:10,borderRadius:14,padding:13,borderWidth:0.5},
  insightTxt: {flex:1,fontSize:13,fontWeight:'600',lineHeight:19},
  oddsRow:   {flexDirection:'row',alignItems:'center',gap:8,marginBottom:12,marginTop:8},
  oddsLbl:   {width:58,fontSize:11,fontWeight:'700'},
  oddsWR:    {width:32,fontSize:11,fontWeight:'800',textAlign:'right'},
  oddsBadge: {paddingHorizontal:7,paddingVertical:2,borderRadius:999},
  oddsBadgeTxt:{fontSize:10,fontWeight:'700'},
  oddsTrack: {flex:1,height:8,borderRadius:6,overflow:'hidden'},
  oddsFill:  {height:'100%',borderRadius:6},
  listRow:   {flexDirection:'row',justifyContent:'space-between',alignItems:'center',paddingVertical:10},
  listSub:   {fontSize:11},
  listPnl:   {fontSize:15,fontWeight:'900'},
  tagBadge:  {paddingHorizontal:10,paddingVertical:4,borderRadius:999,alignSelf:'flex-start'},
  heatCell:  {width:38,height:38,borderRadius:8,alignItems:'center',justifyContent:'center'},
  heatDay:   {fontSize:11,fontWeight:'600'},
  badgesGrid:{flexDirection:'row',flexWrap:'wrap',gap:10,marginTop:8},
  badge:     {width:'47%',borderRadius:20,padding:16,alignItems:'center',borderWidth:0.5},
  badgeTitle:{fontSize:13,fontWeight:'800',textAlign:'center',marginBottom:2},
  badgeDesc: {fontSize:11,textAlign:'center'},
  badgeCheck:{fontSize:9,fontWeight:'800',marginTop:4,color:'#FF3B30',letterSpacing:1},
  empty:     {flex:1,alignItems:'center',justifyContent:'center',paddingTop:80},
  emptyTitle:{fontSize:20,fontWeight:'700',marginBottom:6},
  emptySub:  {fontSize:14,textAlign:'center'},
});
