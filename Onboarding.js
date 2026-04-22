// Onboarding.js — 5-screen premium onboarding
import React, { useState, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, Pressable, Dimensions,
  ScrollView, TextInput, Platform, KeyboardAvoidingView,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient as ExpoLinearGradient } from 'expo-linear-gradient';

// Safe wrapper — if native module fails, falls back to plain View
function LinearGradient({ colors: gColors, style, start, end, children }) {
  try {
    return <ExpoLinearGradient colors={gColors} style={style} start={start} end={end}>{children}</ExpoLinearGradient>;
  } catch(e) {
    var bg = (gColors && gColors[0]) || '#0f0f23';
    return <View style={[style, { backgroundColor: bg }]}>{children}</View>;
  }
}
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, withTiming,
  interpolate, FadeIn, FadeInDown, SlideInRight,
} from 'react-native-reanimated';
import Svg, { Path, Defs, LinearGradient as SvgGrad, Stop, Circle } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { useStore } from './store';
import { getItem, setItem, KEYS } from './storage';

var { width: SW, height: SH } = Dimensions.get('window');

// ── Mini animated line chart for screen 1 ────────────────────────
function AnimatedChart() {
  var points = [
    [0, 80], [40, 70], [80, 75], [120, 55], [160, 45], [200, 30], [240, 20], [280, 10],
  ];
  var w = SW - 80, h = 120;
  var scaleX = w / 280, scaleY = h / 90;

  var path = points.map(function(p, i) {
    var x = p[0] * scaleX, y = p[1] * scaleY;
    if (i === 0) return 'M ' + x + ' ' + y;
    var pp = points[i-1];
    var px = pp[0] * scaleX, py = pp[1] * scaleY;
    var cx1 = px + (x - px) / 3, cy1 = py;
    var cx2 = x - (x - px) / 3, cy2 = y;
    return 'C '+cx1+' '+cy1+' '+cx2+' '+cy2+' '+x+' '+y;
  }).join(' ');

  var fillPath = path + ' L ' + (280*scaleX) + ' ' + h + ' L 0 ' + h + ' Z';

  return (
    <Animated.View entering={FadeIn.delay(300).duration(700)} style={ch.wrap}>
      <Svg width={w} height={h}>
        <Defs>
          <SvgGrad id="g1" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#34D399" stopOpacity="0.35" />
            <Stop offset="100%" stopColor="#34D399" stopOpacity="0.02" />
          </SvgGrad>
        </Defs>
        <Path d={fillPath} fill="url(#g1)" />
        <Path d={path} fill="none" stroke="#34D399" strokeWidth="2.5" strokeLinecap="round" />
        {/* End dot */}
        <Circle cx={280*scaleX} cy={10*scaleY} r="5" fill="#34D399" />
      </Svg>
      <View style={ch.labels}>
        <Text style={ch.lbl}>Month 1</Text>
        <Text style={ch.lbl}>+₹12,400</Text>
      </View>
    </Animated.View>
  );
}
var ch = StyleSheet.create({
  wrap:   { alignItems:'center', marginTop:8, marginBottom:8 },
  labels: { flexDirection:'row', justifyContent:'space-between', width:SW-80, marginTop:6 },
  lbl:    { fontSize:11, color:'rgba(255,255,255,0.45)', fontWeight:'600' },
});

// ── Floating insight card ─────────────────────────────────────────
function InsightCard({ icon, text, sub, delay, dx }) {
  return (
    <Animated.View entering={FadeInDown.delay(delay).springify()} style={[ic.card, { marginLeft: dx||0 }]}>
      <Text style={ic.icon}>{icon}</Text>
      <View style={{ flex:1 }}>
        <Text style={ic.text}>{text}</Text>
        {sub ? <Text style={ic.sub}>{sub}</Text> : null}
      </View>
    </Animated.View>
  );
}
var ic = StyleSheet.create({
  card: { flexDirection:'row', alignItems:'center', gap:12, backgroundColor:'rgba(255,255,255,0.1)', borderRadius:18, padding:16, marginBottom:12, borderWidth:0.5, borderColor:'rgba(255,255,255,0.18)' },
  icon: { fontSize:22, width:36, textAlign:'center' },
  text: { fontSize:14, fontWeight:'700', color:'#fff', letterSpacing:-0.2 },
  sub:  { fontSize:11, color:'rgba(255,255,255,0.5)', marginTop:2 },
});

// ── Benefit card ──────────────────────────────────────────────────
function BenefitCard({ icon, title, desc, delay }) {
  return (
    <Animated.View entering={FadeInDown.delay(delay).springify()} style={bc.card}>
      <View style={bc.iconWrap}><Text style={bc.icon}>{icon}</Text></View>
      <Text style={bc.title}>{title}</Text>
      <Text style={bc.desc}>{desc}</Text>
    </Animated.View>
  );
}
var bc = StyleSheet.create({
  card:    { flex:1, backgroundColor:'rgba(255,255,255,0.09)', borderRadius:20, padding:16, alignItems:'center', borderWidth:0.5, borderColor:'rgba(255,255,255,0.15)' },
  iconWrap:{ width:48, height:48, borderRadius:16, backgroundColor:'rgba(255,255,255,0.12)', alignItems:'center', justifyContent:'center', marginBottom:10 },
  icon:    { fontSize:22 },
  title:   { fontSize:14, fontWeight:'800', color:'#fff', marginBottom:5, textAlign:'center' },
  desc:    { fontSize:11, color:'rgba(255,255,255,0.5)', textAlign:'center', lineHeight:16 },
});

// ── Sport chip ────────────────────────────────────────────────────
var SPORTS = ['🏏 Cricket','⚽ Football','🎾 Tennis','🏀 Basketball','🐴 Horse Racing','🤼 Kabaddi','🎯 Other'];

function SportChip({ label, selected, onPress }) {
  return (
    <Pressable onPress={onPress}
      style={[sp.chip, selected && sp.chipActive]}>
      <Text style={[sp.txt, selected && sp.txtActive]}>{label}</Text>
    </Pressable>
  );
}
var sp = StyleSheet.create({
  chip:       { paddingHorizontal:14, paddingVertical:9, borderRadius:999, borderWidth:1, borderColor:'rgba(255,255,255,0.2)', backgroundColor:'rgba(255,255,255,0.07)', marginBottom:8, marginRight:8 },
  chipActive: { backgroundColor:'rgba(255,255,255,0.22)', borderColor:'rgba(255,255,255,0.7)' },
  txt:        { fontSize:13, color:'rgba(255,255,255,0.6)', fontWeight:'600' },
  txtActive:  { color:'#fff', fontWeight:'800' },
});

// ── Pagination dots ───────────────────────────────────────────────
function Dots({ total, current }) {
  return (
    <View style={dt.row}>
      {Array.from({length:total}).map(function(_,i){
        var active = i === current;
        return (
          <View key={i} style={[dt.dot, active && dt.dotActive]} />
        );
      })}
    </View>
  );
}
var dt = StyleSheet.create({
  row:      { flexDirection:'row', gap:7, alignItems:'center' },
  dot:      { width:6, height:6, borderRadius:3, backgroundColor:'rgba(255,255,255,0.3)' },
  dotActive:{ width:22, height:6, borderRadius:3, backgroundColor:'#fff' },
});

// ── SCREEN CONTENT ────────────────────────────────────────────────
function Screen1() {
  return (
    <View style={sc.wrap}>
      <Animated.Text entering={FadeInDown.delay(100).springify()} style={sc.badge}>BETTING TRACKER</Animated.Text>
      <Animated.Text entering={FadeInDown.delay(160).springify()} style={sc.title}>Track. Improve.{'\n'}Win.</Animated.Text>
      <Animated.Text entering={FadeInDown.delay(220).springify()} style={sc.sub}>Stop guessing. Start tracking your bets like a pro and watch your ROI climb.</Animated.Text>
      <AnimatedChart />
      <Animated.View entering={FadeInDown.delay(400).springify()} style={sc.statsRow}>
        {[{n:'₹24K',l:'Tracked profit'},{n:'67%',l:'Avg win rate'},{n:'12×',l:'ROI improved'}].map(function(item){
          return (
            <View key={item.l} style={sc.statItem}>
              <Text style={sc.statNum}>{item.n}</Text>
              <Text style={sc.statLbl}>{item.l}</Text>
            </View>
          );
        })}
      </Animated.View>
    </View>
  );
}

function Screen2() {
  return (
    <View style={sc.wrap}>
      <Animated.Text entering={FadeInDown.delay(80).springify()} style={sc.badge}>FEATURES</Animated.Text>
      <Animated.Text entering={FadeInDown.delay(140).springify()} style={sc.title}>Everything you{'\n'}need to win</Animated.Text>
      <Animated.Text entering={FadeInDown.delay(200).springify()} style={sc.sub}>Pro bettors know their numbers. Now you will too.</Animated.Text>
      <View style={sc.benefitsRow}>
        <BenefitCard icon="📈" title="Track P&L" desc="Real-time profit & loss across all bookies" delay={260} />
        <BenefitCard icon="🎯" title="ROI Analysis" desc="Know exactly which bets make you money" delay={320} />
        <BenefitCard icon="💡" title="Smart Tips" desc="AI-powered insights from your data" delay={380} />
      </View>
      <View style={sc.benefitsRow}>
        <BenefitCard icon="🏏" title="All Sports" desc="Cricket, Football, Tennis & more" delay={440} />
        <BenefitCard icon="🔒" title="100% Private" desc="Your data stays on your device" delay={500} />
        <BenefitCard icon="⚡" title="Quick Entry" desc="Log a bet in 2 seconds" delay={560} />
      </View>
    </View>
  );
}

function Screen3() {
  return (
    <View style={sc.wrap}>
      <Animated.Text entering={FadeInDown.delay(80).springify()} style={sc.badge}>SMART INSIGHTS</Animated.Text>
      <Animated.Text entering={FadeInDown.delay(140).springify()} style={sc.title}>Your personal{'\n'}betting advisor</Animated.Text>
      <Animated.Text entering={FadeInDown.delay(200).springify()} style={sc.sub}>The app learns from your bets and gives you actionable insights.</Animated.Text>
      <View style={{ marginTop:20, width:'100%' }}>
        <InsightCard icon="⚠️" text="You lose more on high odds" sub="Bets above 3.0× have 28% win rate" delay={260} />
        <InsightCard icon="🏆" text="Cricket gives your best ROI" sub="+₹8,200 from 42 cricket bets" delay={360} dx={20} />
        <InsightCard icon="🔥" text="3-win streak right now!" sub="Keep the momentum going" delay={460} />
        <InsightCard icon="💡" text="Stake less on weekends" sub="You lose 70% of Sunday bets" delay={560} dx={20} />
      </View>
    </View>
  );
}

function Screen4({ bankroll, setBankroll, selectedSports, toggleSport }) {
  return (
    <KeyboardAvoidingView behavior={Platform.OS==='ios'?'padding':'height'} style={{flex:1}}>
      <View style={sc.wrap}>
        <Animated.Text entering={FadeInDown.delay(80).springify()} style={sc.badge}>QUICK SETUP</Animated.Text>
        <Animated.Text entering={FadeInDown.delay(140).springify()} style={sc.title}>Let's set you up{'\n'}for success</Animated.Text>
        <Animated.Text entering={FadeInDown.delay(200).springify()} style={sc.sub}>Optional — you can change these anytime in Settings.</Animated.Text>

        <Animated.View entering={FadeInDown.delay(260).springify()} style={s4.inputCard}>
          <Text style={s4.inputLabel}>STARTING BANKROLL (₹)</Text>
          <View style={s4.inputRow}>
            <Text style={s4.prefix}>₹</Text>
            <TextInput
              style={s4.input}
              value={bankroll}
              onChangeText={setBankroll}
              placeholder="e.g. 10000"
              placeholderTextColor="rgba(255,255,255,0.25)"
              keyboardType="decimal-pad"
              returnKeyType="done"
            />
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(340).springify()} style={{ width:'100%' }}>
          <Text style={s4.sportsLabel}>YOUR FAVOURITE SPORTS</Text>
          <View style={s4.sportsWrap}>
            {SPORTS.map(function(sp) {
              return (
                <SportChip key={sp} label={sp} selected={selectedSports.includes(sp)} onPress={() => toggleSport(sp)} />
              );
            })}
          </View>
        </Animated.View>
      </View>
    </KeyboardAvoidingView>
  );
}
var s4 = StyleSheet.create({
  inputCard:   { width:'100%', backgroundColor:'rgba(255,255,255,0.1)', borderRadius:20, padding:18, marginBottom:20, borderWidth:0.5, borderColor:'rgba(255,255,255,0.18)' },
  inputLabel:  { fontSize:10, fontWeight:'700', color:'rgba(255,255,255,0.45)', letterSpacing:1.2, marginBottom:10 },
  inputRow:    { flexDirection:'row', alignItems:'center', gap:8 },
  prefix:      { fontSize:24, fontWeight:'700', color:'rgba(255,255,255,0.7)' },
  input:       { flex:1, fontSize:28, fontWeight:'800', color:'#fff', letterSpacing:-1 },
  sportsLabel: { fontSize:10, fontWeight:'700', color:'rgba(255,255,255,0.45)', letterSpacing:1.2, marginBottom:12 },
  sportsWrap:  { flexDirection:'row', flexWrap:'wrap' },
});

function Screen5({ onStart }) {
  return (
    <View style={[sc.wrap, {alignItems:'center', justifyContent:'center'}]}>
      <Animated.View entering={FadeIn.delay(100).duration(600)} style={s5.iconWrap}>
        <Text style={{fontSize:64}}>🎯</Text>
      </Animated.View>
      <Animated.Text entering={FadeInDown.delay(200).springify()} style={[sc.title,{textAlign:'center'}]}>You're all set!{'\n'}Let's go 🚀</Animated.Text>
      <Animated.Text entering={FadeInDown.delay(300).springify()} style={[sc.sub,{textAlign:'center',marginBottom:32}]}>
        Start logging bets and discover what actually makes you money.
      </Animated.Text>

      <Animated.View entering={FadeInDown.delay(380).springify()} style={s5.statCard}>
        <Text style={s5.statIcon}>📊</Text>
        <View>
          <Text style={s5.statTxt}>Users who track bets</Text>
          <Text style={s5.statHighlight}>improve ROI by 30%</Text>
          <Text style={s5.statSub}>Compared to non-trackers</Text>
        </View>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(460).springify()} style={{width:'100%',gap:10}}>
        <Pressable onPress={onStart} style={({ pressed }) => [s5.startBtn, pressed && {opacity:0.88}]}>
          <Text style={s5.startTxt}>Start Tracking →</Text>
        </Pressable>
        <Text style={s5.fine}>Free · Private · No account needed</Text>
      </Animated.View>
    </View>
  );
}
var s5 = StyleSheet.create({
  iconWrap:      { width:110, height:110, borderRadius:32, backgroundColor:'rgba(255,255,255,0.12)', alignItems:'center', justifyContent:'center', marginBottom:24, borderWidth:0.5, borderColor:'rgba(255,255,255,0.2)' },
  statCard:      { flexDirection:'row', alignItems:'center', gap:14, backgroundColor:'rgba(255,255,255,0.1)', borderRadius:20, padding:18, marginBottom:28, width:'100%', borderWidth:0.5, borderColor:'rgba(255,255,255,0.18)' },
  statIcon:      { fontSize:30 },
  statTxt:       { fontSize:12, color:'rgba(255,255,255,0.55)', fontWeight:'600' },
  statHighlight: { fontSize:18, fontWeight:'900', color:'#34D399', letterSpacing:-0.5, marginVertical:2 },
  statSub:       { fontSize:11, color:'rgba(255,255,255,0.4)' },
  startBtn:      { backgroundColor:'#fff', borderRadius:999, height:56, alignItems:'center', justifyContent:'center', shadowColor:'#fff', shadowOffset:{width:0,height:6}, shadowOpacity:0.2, shadowRadius:14, elevation:8 },
  startTxt:      { color:'#1a1a1a', fontSize:17, fontWeight:'900', letterSpacing:-0.3 },
  fine:          { textAlign:'center', color:'rgba(255,255,255,0.35)', fontSize:12, fontWeight:'500' },
});

// Common text styles
var sc = StyleSheet.create({
  wrap:        { flex:1, paddingHorizontal:24, paddingTop:8, paddingBottom:16 },
  badge:       { fontSize:10, fontWeight:'800', color:'rgba(255,255,255,0.45)', letterSpacing:2, textTransform:'uppercase', marginBottom:10 },
  title:       { fontSize:36, fontWeight:'900', color:'#fff', lineHeight:42, letterSpacing:-1.2, marginBottom:12 },
  sub:         { fontSize:15, color:'rgba(255,255,255,0.55)', lineHeight:22, fontWeight:'500', marginBottom:20 },
  benefitsRow: { flexDirection:'row', gap:10, marginBottom:10, width:'100%' },
  statsRow:    { flexDirection:'row', gap:0, width:'100%', marginTop:8 },
  statItem:    { flex:1, alignItems:'center' },
  statNum:     { fontSize:22, fontWeight:'900', color:'#34D399', letterSpacing:-0.5 },
  statLbl:     { fontSize:10, color:'rgba(255,255,255,0.45)', fontWeight:'600', marginTop:2, textAlign:'center' },
});

// ── GRADIENT BACKGROUNDS per screen ──────────────────────────────
var GRADIENTS = [
  ['#0f0f23', '#1a1a40', '#0d2318'],  // Screen 1 — dark blue/green
  ['#0f0f23', '#1a1040', '#0a0a1f'],  // Screen 2 — deep purple
  ['#0d1a0f', '#0f2318', '#0a0f1a'],  // Screen 3 — forest/teal
  ['#1a0f23', '#0f0f23', '#0a1a2f'],  // Screen 4 — purple/blue
  ['#0a1f0a', '#0f230f', '#0d1a1a'],  // Screen 5 — deep green
];

// ── MAIN COMPONENT ────────────────────────────────────────────────
export default function Onboarding({ onComplete }) {
  var [current, setCurrent]         = useState(0);
  var [bankroll, setBankroll]       = useState('');
  var [selectedSports, setSelected] = useState([]);
  var scrollRef                     = useRef(null);
  var saveBankroll                  = useStore(function(s) { return s.saveBankroll; });
  var saveSports                    = useStore(function(s) { return s.saveSports; });
  var TOTAL = 5;

  function goTo(idx) {
    if (idx < 0 || idx >= TOTAL) return;
    scrollRef.current && scrollRef.current.scrollTo({ x: idx * SW, animated: true });
    setCurrent(idx);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }

  function toggleSport(sp) {
    setSelected(function(prev) {
      return prev.includes(sp) ? prev.filter(function(s) { return s !== sp; }) : prev.concat([sp]);
    });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }

  async function finish() {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    // Save setup data
    if (bankroll && parseFloat(bankroll) > 0) {
      await saveBankroll(parseFloat(bankroll));
    }
    if (selectedSports.length > 0) {
      await saveSports(selectedSports);
    }
    await setItem(KEYS.ONBOARDED, true);
    onComplete();
  }

  function handleScroll(e) {
    var idx = Math.round(e.nativeEvent.contentOffset.x / SW);
    if (idx !== current) setCurrent(idx);
  }

  var isLast = current === TOTAL - 1;

  return (
    <View style={ob.root}>
      <StatusBar barStyle="light-content" />

      {/* Gradient background — changes per screen */}
      <LinearGradient
        colors={GRADIENTS[current]}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
      />

      {/* Top bar */}
      <SafeAreaView style={ob.topBar} edges={['top']}>
        <View style={ob.topRow}>
          <Text style={ob.logo}>Stake Log</Text>
          {current < TOTAL - 1 && (
            <Pressable onPress={finish} style={ob.skipBtn}>
              <Text style={ob.skipTxt}>Skip</Text>
            </Pressable>
          )}
        </View>
      </SafeAreaView>

      {/* Scrollable screens */}
      <ScrollView
        ref={scrollRef}
        horizontal pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        scrollEventThrottle={16}
        bounces={false}
        style={{ flex:1 }}
        contentContainerStyle={{ width: SW * TOTAL }}
      >
        {[0,1,2,3,4].map(function(idx) {
          return (
            <View key={idx} style={{ width:SW, flex:1 }}>
              {idx===0 && <Screen1 />}
              {idx===1 && <Screen2 />}
              {idx===2 && <Screen3 />}
              {idx===3 && <Screen4 bankroll={bankroll} setBankroll={setBankroll} selectedSports={selectedSports} toggleSport={toggleSport} />}
              {idx===4 && <Screen5 onStart={finish} />}
            </View>
          );
        })}
      </ScrollView>

      {/* Bottom bar */}
      <SafeAreaView style={ob.bottomBar} edges={['bottom']}>
        <View style={ob.bottomRow}>
          <Pressable onPress={() => goTo(current - 1)} style={[ob.navBtn, { opacity: current===0?0.3:1 }]}>
            <Text style={ob.navBtnTxt}>←</Text>
          </Pressable>

          <Dots total={TOTAL} current={current} />

          {isLast ? (
            <View style={{ width:44 }} />
          ) : (
            <Pressable onPress={() => goTo(current + 1)} style={ob.nextBtn}>
              <Text style={ob.nextTxt}>Next →</Text>
            </Pressable>
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}

var ob = StyleSheet.create({
  root:      { flex:1 },
  topBar:    { paddingHorizontal:20 },
  topRow:    { flexDirection:'row', justifyContent:'space-between', alignItems:'center', paddingVertical:12 },
  logo:      { fontSize:18, fontWeight:'900', color:'#fff', letterSpacing:-0.5 },
  skipBtn:   { backgroundColor:'rgba(255,255,255,0.12)', paddingHorizontal:14, paddingVertical:7, borderRadius:999 },
  skipTxt:   { color:'rgba(255,255,255,0.7)', fontSize:13, fontWeight:'700' },
  bottomBar: { paddingHorizontal:20 },
  bottomRow: { flexDirection:'row', justifyContent:'space-between', alignItems:'center', paddingVertical:16 },
  navBtn:    { width:44, height:44, borderRadius:22, backgroundColor:'rgba(255,255,255,0.1)', alignItems:'center', justifyContent:'center' },
  navBtnTxt: { color:'#fff', fontSize:18, fontWeight:'600' },
  nextBtn:   { backgroundColor:'rgba(255,255,255,0.18)', paddingHorizontal:18, paddingVertical:11, borderRadius:999 },
  nextTxt:   { color:'#fff', fontSize:13, fontWeight:'800' },
});
