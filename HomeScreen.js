// HomeScreen.js — fixed: glass hero, no red overload, unique sections
import React, { useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTheme } from './useTheme';
import { useStore, useStats } from './store';
import Chart from './Chart';
import { formatMoney, calcPnLTimeSeries, calcSmartInsights, calcSportStats, calcBookieStats, getCurrencySymbol } from './calculations';

function StreakBadge({ streak }) {
  if (!streak.type || streak.current < 2) return null;
  var isWin = streak.type === 'Won';
  return (
    <View style={[stk.wrap, { backgroundColor: isWin ? 'rgba(26,158,74,0.15)' : 'rgba(217,48,37,0.12)', borderColor: isWin ? 'rgba(26,158,74,0.3)' : 'rgba(217,48,37,0.25)' }]}>
      <Text style={stk.fire}>{isWin ? '🔥' : '❄️'}</Text>
      <Text style={[stk.txt, { color: isWin ? '#1A9E4A' : '#D93025' }]}>{streak.current} {isWin ? 'win' : 'loss'} streak</Text>
    </View>
  );
}
var stk = StyleSheet.create({
  wrap: { flexDirection:'row', alignItems:'center', gap:5, paddingHorizontal:12, paddingVertical:6, borderRadius:999, borderWidth:0.5 },
  fire: { fontSize:13 },
  txt:  { fontSize:12, fontWeight:'700' },
});

function InsightRow({ ins, idx }) {
  var { colors } = useTheme();
  var cfg = {
    positive: { bg:'rgba(26,158,74,0.08)',  border:'rgba(26,158,74,0.2)',  color:'#1A9E4A' },
    warning:  { bg:'rgba(224,123,0,0.08)', border:'rgba(224,123,0,0.2)', color:'#E07B00' },
    info:     { bg:'rgba(229,9,20,0.06)',  border:'rgba(229,9,20,0.15)', color:'#E50914' },
  }[ins.type] || { bg:colors.surfaceVariant, border:colors.border, color:colors.textSecondary };
  return (
    <Animated.View entering={FadeInDown.delay(300 + idx * 55).springify()}
      style={[ir.wrap, { backgroundColor:cfg.bg, borderColor:cfg.border }]}>
      <Text style={{ fontSize:17, flexShrink:0 }}>{ins.icon}</Text>
      <Text style={[ir.txt, { color:cfg.color }]}>{ins.text}</Text>
    </Animated.View>
  );
}
var ir = StyleSheet.create({
  wrap:{ flexDirection:'row', alignItems:'center', gap:10, borderRadius:14, padding:13, borderWidth:0.5 },
  txt: { flex:1, fontSize:13, fontWeight:'600', lineHeight:19 },
});

// Time-based performance card
function SessionCard({ label, value, color, colors }) {
  return (
    <View style={[ses.card, { backgroundColor:colors.surface, borderColor:colors.border }]}>
      <Text style={[ses.val, { color }]} numberOfLines={1} adjustsFontSizeToFit>{value}</Text>
      <Text style={[ses.lbl, { color:colors.textTertiary }]}>{label}</Text>
    </View>
  );
}
var ses = StyleSheet.create({
  card: { flex:1, borderRadius:16, padding:13, borderWidth:0.5 },
  val:  { fontSize:16, fontWeight:'800', letterSpacing:-0.4, marginBottom:3 },
  lbl:  { fontSize:9, fontWeight:'700', textTransform:'uppercase', letterSpacing:0.6 },
});

// Count-based stat card
function CountCard({ label, value, color, bg, border }) {
  return (
    <View style={[cnt.card, { backgroundColor:bg, borderColor:border }]}>
      <Text style={[cnt.val, { color }]} numberOfLines={1} adjustsFontSizeToFit>{value}</Text>
      <Text style={[cnt.lbl, { color, opacity:0.65 }]}>{label}</Text>
    </View>
  );
}
var cnt = StyleSheet.create({
  card: { flex:1, borderRadius:16, padding:13, borderWidth:0.5 },
  val:  { fontSize:24, fontWeight:'800', letterSpacing:-0.8, marginBottom:3 },
  lbl:  { fontSize:9, fontWeight:'700', textTransform:'uppercase', letterSpacing:0.6 },
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

  // Hero: neutral dark gradient — ONLY the number is colored
  var heroColors = isDark
    ? ['#141414', '#1A1A1A', '#141414']
    : ['#F8F8FA', '#FFFFFF', '#F8F8FA'];

  if (loading) return <View style={[s.screen, { backgroundColor:colors.background, justifyContent:'center', alignItems:'center' }]}><Text style={{ color:colors.textTertiary }}>Loading…</Text></View>;

  return (
    <SafeAreaView style={[s.screen, { backgroundColor:colors.background }]} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* ── HERO — glassmorphism, number only colored ── */}
        <Animated.View entering={FadeIn.duration(350)} style={s.heroOuter}>
          <LinearGradient colors={heroColors} style={[s.heroCard, { borderColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)' }]}
            start={{ x:0, y:0 }} end={{ x:1, y:1 }}>

            {/* Label + eye */}
            <View style={s.heroTop}>
              <Text style={[s.heroLbl, { color:colors.textTertiary }]}>NET P&L — ALL TIME</Text>
              <Pressable onPress={() => { setHidden(function(h) { return !h; }); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                style={[s.eyeBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' }]}>
                <Text style={{ fontSize:18 }}>{hidden ? '👁️' : '🙈'}</Text>
              </Pressable>
            </View>

            {/* AMOUNT — only this is profit/loss colored */}
            <Text style={[s.heroAmount, { color: isProfit ? '#1A9E4A' : '#D93025' }]} adjustsFontSizeToFit numberOfLines={1}>
              {hidden ? currSym+'••••••' : (isProfit?'+':'') + formatMoney(stats.totalPnL, currSym)}
            </Text>

            {/* Pills — ROI + WR + Streak */}
            <View style={s.pillsRow}>
              {stats.roi && (
                <View style={[s.pill, { backgroundColor: isProfit ? 'rgba(26,158,74,0.12)' : 'rgba(217,48,37,0.1)', borderColor: isProfit ? 'rgba(26,158,74,0.25)' : 'rgba(217,48,37,0.2)' }]}>
                  <Text style={[s.pillTxt, { color: isProfit ? '#1A9E4A' : '#D93025' }]}>{isProfit?'↑':'↓'} {isProfit?'+':''}{stats.roi}% ROI</Text>
                </View>
              )}
              {stats.winRate && (
                <View style={[s.pill, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', borderColor:colors.border }]}>
                  <Text style={[s.pillTxt, { color:colors.textSecondary }]}>{stats.winRate}% WR</Text>
                </View>
              )}
              <StreakBadge streak={stats.streak} />
            </View>

            {/* Chart inside hero */}
            {pnlData.length >= 2 && (
              <View style={{ marginTop:14, opacity:0.8 }}>
                <Chart data={pnlData} color={isProfit ? '#1A9E4A' : '#D93025'} height={58} currSym={currSym} />
              </View>
            )}
          </LinearGradient>
        </Animated.View>

        <View style={s.content}>

          {/* ── SECTION 1: Time-based P&L (unique purpose) ── */}
          <Animated.View entering={FadeInDown.delay(80).springify()} style={s.section}>
            <Text style={[s.sectionLbl, { color:colors.textTertiary }]}>PERFORMANCE</Text>
            <View style={s.row3}>
              <SessionCard label="Today" colors={colors}
                value={hidden ? '••' : (stats.todayPnL>=0?'+':'')+formatMoney(stats.todayPnL,currSym)}
                color={stats.todayPnL>0?'#1A9E4A':stats.todayPnL<0?'#D93025':colors.textTertiary} />
              <SessionCard label="Week" colors={colors}
                value={hidden ? '••' : (stats.weekPnL>=0?'+':'')+formatMoney(stats.weekPnL,currSym)}
                color={stats.weekPnL>0?'#1A9E4A':stats.weekPnL<0?'#D93025':colors.textTertiary} />
              <SessionCard label="Month" colors={colors}
                value={hidden ? '••' : (stats.monthPnL>=0?'+':'')+formatMoney(stats.monthPnL,currSym)}
                color={stats.monthPnL>0?'#1A9E4A':stats.monthPnL<0?'#D93025':colors.textTertiary} />
            </View>
          </Animated.View>

          {/* ── SECTION 2: Count-based stats (unique purpose) ── */}
          <Animated.View entering={FadeInDown.delay(130).springify()} style={s.section}>
            <View style={s.row3}>
              <CountCard label="Total"   value={String(stats.totalBets)}    color={colors.textPrimary} bg={colors.surface}   border={colors.border} />
              <CountCard label="Won"     value={String(stats.wonCount)}     color="#1A9E4A" bg="#E8F8EE" border="#A7DFB9" />
              <CountCard label="Lost"    value={String(stats.lostCount)}    color="#D93025" bg="#FDECEA" border="#F5B8B2" />
            </View>
          </Animated.View>

          {/* ── SECTION 3: Insights ── */}
          {insights.length > 0 && (
            <Animated.View entering={FadeInDown.delay(180).springify()} style={s.section}>
              <View style={s.sectionHeader}>
                <Text style={[s.sectionLbl, { color:colors.textTertiary }]}>SMART INSIGHTS</Text>
                <Pressable onPress={() => navigation.navigate('Stats')}>
                  <Text style={{ color:'#E50914', fontSize:12, fontWeight:'700' }}>See All →</Text>
                </Pressable>
              </View>
              <View style={{ gap:8 }}>
                {insights.slice(0, 3).map(function(ins, i) { return <InsightRow key={i} ins={ins} idx={i} />; })}
              </View>
            </Animated.View>
          )}

          {/* ── SECTION 4: Quick Nav ── */}
          <Animated.View entering={FadeInDown.delay(240).springify()} style={[s.section, { marginBottom:100 }]}>
            <View style={s.row4}>
              {[
                { icon:'📋', label:'Bets',      screen:'Bets'     },
                { icon:'📊', label:'Analytics', screen:'Stats'    },
                { icon:'💰', label:'Bankroll',  screen:'Bankroll' },
                { icon:'⚙️', label:'Settings',  screen:'Settings' },
              ].map(function(item) {
                return (
                  <Pressable key={item.label}
                    onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); navigation.navigate(item.screen); }}
                    style={({ pressed }) => [s.navItem, { backgroundColor:colors.surface, borderColor:colors.border, opacity: pressed ? 0.75 : 1 }]}>
                    <Text style={{ fontSize:22, marginBottom:5 }}>{item.icon}</Text>
                    <Text style={[s.navLbl, { color:colors.textSecondary }]}>{item.label}</Text>
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
  screen:   { flex:1 },
  heroOuter:{ padding:16, paddingBottom:0 },
  heroCard: {
    borderRadius:24, padding:20, borderWidth:1,
    shadowColor:'#000', shadowOffset:{ width:0, height:8 }, shadowOpacity:0.12, shadowRadius:24, elevation:8,
  },
  heroTop:    { flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:8 },
  heroLbl:    { fontSize:10, fontWeight:'700', letterSpacing:1.2, textTransform:'uppercase' },
  heroAmount: { fontSize:42, fontWeight:'800', letterSpacing:-2, lineHeight:48, marginBottom:12 },
  eyeBtn:     { width:38, height:38, borderRadius:19, alignItems:'center', justifyContent:'center' },
  pillsRow:   { flexDirection:'row', flexWrap:'wrap', gap:8 },
  pill:       { flexDirection:'row', alignItems:'center', paddingHorizontal:11, paddingVertical:5, borderRadius:999, borderWidth:0.5 },
  pillTxt:    { fontSize:12, fontWeight:'700' },
  content:    { padding:16 },
  section:    { marginBottom:20 },
  sectionLbl: { fontSize:10, fontWeight:'700', letterSpacing:1.2, textTransform:'uppercase', marginBottom:10 },
  sectionHeader: { flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:10 },
  row3: { flexDirection:'row', gap:8 },
  row4: { flexDirection:'row', gap:8 },
  navItem: { flex:1, borderRadius:16, paddingVertical:14, paddingHorizontal:8, alignItems:'center', borderWidth:0.5, shadowColor:'#000', shadowOffset:{width:0,height:1}, shadowOpacity:0.04, shadowRadius:4, elevation:1 },
  navLbl:  { fontSize:11, fontWeight:'600' },
});
