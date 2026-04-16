// App.js
import 'react-native-gesture-handler';
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, StatusBar, Platform, Alert } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView, PanGestureHandler } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedGestureHandler,
  withSpring,
  withTiming,
  runOnJS,
  FadeIn,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { registerRootComponent } from 'expo';
import { ThemeProvider, useTheme } from './useTheme';
import { useStore } from './store';
import { useStats } from './store';
import { getItem, setItem, KEYS, migrateIfNeeded } from './storage';
import HomeScreen from './HomeScreen';
import FloatingMenu from './FloatingMenu';
import AddBetModal from './AddBetModal';
import { ToastProvider } from './Toast';
import BetsScreen from './BetsScreen';
import StatsScreen from './StatsScreen';
import BankrollScreen from './BankrollScreen';
import SettingsScreen from './SettingsScreen';

Text.defaultProps = Text.defaultProps || {};
Text.defaultProps.allowFontScaling = false;

const Tab = createBottomTabNavigator();

// ── PIN Screen ────────────────────────────────────────────────
function PinScreen({ mode, savedPin, onSuccess, onSetPin }) {
  const { colors } = useTheme();
  const [digits, setDigits] = React.useState([]);
  const [err, setErr] = React.useState('');
  const shakeVal = useSharedValue(0);
  const shakeStyle = useAnimatedStyle(() => ({ transform: [{ translateX: shakeVal.value }] }));
  const keys = ['1','2','3','4','5','6','7','8','9','','0','⌫'];

  const press = (k) => {
    if (k === '') return;
    if (k === '⌫') { setDigits(d => d.slice(0, -1)); setErr(''); return; }
    if (digits.length >= 4) return;
    const next = [...digits, k];
    setDigits(next);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (next.length === 4) {
      const pin = next.join('');
      if (mode === 'set') { onSetPin(pin); setDigits([]); }
      else if (pin === savedPin) { onSuccess(); }
      else {
        setErr('Incorrect PIN');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        shakeVal.value = withSpring(10, { damping: 2, stiffness: 400 }, () => { shakeVal.value = withSpring(0); });
        setTimeout(() => { setDigits([]); setErr(''); }, 700);
      }
    }
  };

  return (
    <View style={[pinS.screen, { backgroundColor: colors.background }]}>
      <View style={[pinS.iconWrap, { backgroundColor: '#FFF0F0' }]}>
        <Text style={{ fontSize: 36 }}>🔐</Text>
      </View>
      <Text style={[pinS.title, { color: colors.textPrimary }]}>{mode === 'set' ? 'Create PIN' : 'Enter PIN'}</Text>
      <Text style={[pinS.sub, { color: colors.textTertiary }]}>{mode === 'set' ? 'Choose a 4-digit PIN to secure the app' : 'Enter your PIN to continue'}</Text>
      <Animated.View style={[pinS.dotsRow, shakeStyle]}>
        {[0,1,2,3].map(i => (
          <View key={i} style={[pinS.dot, { borderColor: digits.length > i ? '#E50914' : colors.border }, digits.length > i && { backgroundColor: '#E50914' }]} />
        ))}
      </Animated.View>
      {err ? <Text style={pinS.err}>{err}</Text> : <View style={{ height: 20 }} />}
      <View style={pinS.keypad}>
        {keys.map((k, i) => (
          <Pressable key={i} onPress={() => press(k)} disabled={k === ''}
            style={({ pressed }) => [pinS.key, { backgroundColor: k==='' ? 'transparent' : pressed ? '#FFE8E8' : colors.surface, borderColor: colors.border, borderWidth: k==='' ? 0 : 0.5, opacity: k==='' ? 0 : 1 }]}>
            <Text style={[pinS.keyTxt, { color: k==='⌫' ? '#E50914' : colors.textPrimary }]}>{k}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
const pinS = StyleSheet.create({
  screen: { flex:1, alignItems:'center', justifyContent:'center', padding:32 },
  iconWrap: { width:80, height:80, borderRadius:24, alignItems:'center', justifyContent:'center', marginBottom:24 },
  title: { fontSize:26, fontWeight:'700', marginBottom:8, letterSpacing:-0.5 },
  sub: { fontSize:14, textAlign:'center', marginBottom:44, lineHeight:21 },
  dotsRow: { flexDirection:'row', gap:16, marginBottom:8 },
  dot: { width:14, height:14, borderRadius:7, borderWidth:2 },
  err: { fontSize:13, fontWeight:'600', color:'#D93025', height:20 },
  keypad: { flexDirection:'row', flexWrap:'wrap', width:260, gap:12, marginTop:28, justifyContent:'center' },
  key: { width:76, height:76, borderRadius:38, alignItems:'center', justifyContent:'center' },
  keyTxt: { fontSize:22, fontWeight:'600' },
});

// ── Onboarding ────────────────────────────────────────────────
function OnboardingScreen({ onDone }) {
  const { colors } = useTheme();
  const [step, setStep] = React.useState(0);
  const steps = [
    { icon:'🎯', title:'Welcome to Stake Log', desc:'Track every bet across all bookies and sports in one beautiful app.' },
    { icon:'📊', title:'Smart Analytics', desc:'P&L charts, win rate, heatmaps, and insights from your actual data.' },
    { icon:'💡', title:'Pro Features', desc:'Bankroll tracker, templates, swipe gestures, tag analytics, and achievements.' },
    { icon:'🔒', title:'100% Private', desc:'PIN lock and hidden mode. Your data stays on device. No accounts needed.' },
  ];
  const s = steps[step];
  return (
    <View style={[onbS.screen, { backgroundColor: colors.background }]}>
      <Animated.View entering={FadeIn.duration(280)} key={step} style={onbS.content}>
        <View style={[onbS.iconWrap, { backgroundColor:'#FFF0F0' }]}>
          <Text style={onbS.icon}>{s.icon}</Text>
        </View>
        <Text style={[onbS.title, { color: colors.textPrimary }]}>{s.title}</Text>
        <Text style={[onbS.desc, { color: colors.textSecondary }]}>{s.desc}</Text>
      </Animated.View>
      <View style={onbS.bottom}>
        <View style={onbS.dotsRow}>
          {steps.map((_,i) => <View key={i} style={[onbS.dot, { backgroundColor: i===step ? '#E50914' : colors.border, width: i===step ? 22 : 7 }]} />)}
        </View>
        <Pressable onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); step < steps.length-1 ? setStep(s=>s+1) : onDone(); }}
          style={onbS.nextBtn}>
          <Text style={onbS.nextTxt}>{step < steps.length-1 ? 'Continue →' : "Let's Go 🚀"}</Text>
        </Pressable>
        {step > 0 && <Pressable onPress={() => setStep(s=>s-1)} style={onbS.backBtn}><Text style={[onbS.backTxt, { color: colors.textTertiary }]}>← Back</Text></Pressable>}
      </View>
    </View>
  );
}
const onbS = StyleSheet.create({
  screen: { flex:1, padding:32, justifyContent:'space-between' },
  content: { flex:1, alignItems:'center', justifyContent:'center' },
  iconWrap: { width:100, height:100, borderRadius:28, alignItems:'center', justifyContent:'center', marginBottom:32 },
  icon: { fontSize:52 },
  title: { fontSize:26, fontWeight:'700', textAlign:'center', marginBottom:14, letterSpacing:-0.5, lineHeight:32 },
  desc: { fontSize:16, textAlign:'center', lineHeight:26 },
  bottom: { gap:14 },
  dotsRow: { flexDirection:'row', gap:7, justifyContent:'center', marginBottom:4 },
  dot: { height:7, borderRadius:4 },
  nextBtn: { backgroundColor:'#E50914', borderRadius:999, paddingVertical:16, alignItems:'center', shadowColor:'#E50914', shadowOffset:{width:0,height:4}, shadowOpacity:0.3, shadowRadius:10, elevation:5 },
  nextTxt: { color:'#fff', fontSize:16, fontWeight:'700' },
  backBtn: { alignItems:'center', paddingVertical:10 },
  backTxt: { fontSize:14, fontWeight:'500' },
});

// ── Premium Tab Bar ───────────────────────────────────────────
const TABS = [
  { label:'Home',     emoji:'🏠' },
  { label:'Bets',     emoji:'📋' },
  { label:'Stats',    emoji:'📊' },
  { label:'Bankroll', emoji:'💰' },
  { label:'Settings', emoji:'⚙️' },
];

// Separate component so hooks are never called inside .map()
function TabItem({ route, idx, focused, navigation }) {
  const { colors } = useTheme();
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const onPress = () => {
    scale.value = withSpring(0.82, { damping: 12 }, () => { scale.value = withSpring(1, { damping: 14 }); });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (!focused) navigation.navigate(route.name);
  };
  return (
    <Pressable key={route.name} onPress={onPress} style={tabS.tab}>
      <Animated.View style={[tabS.inner, animStyle]}>
        <Text style={[tabS.emoji, { opacity: focused ? 1 : 0.55 }]}>{TABS[idx].emoji}</Text>
        <Text style={[tabS.label, {
          color: focused ? '#E50914' : '#9CA3AF',
          fontWeight: focused ? '700' : '500',
        }]}>
          {TABS[idx].label}
        </Text>
        {focused && <View style={tabS.indicator} />}
      </Animated.View>
    </Pressable>
  );
}

function CustomTabBar({ state, navigation }) {
  const { colors } = useTheme();
  return (
    <View style={[tabS.bar, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
      {state.routes.map((route, idx) => (
        <TabItem
          key={route.name}
          route={route}
          idx={idx}
          focused={state.index === idx}
          navigation={navigation}
        />
      ))}
    </View>
  );
}
const tabS = StyleSheet.create({
  bar: { flexDirection:'row', paddingTop:8, paddingBottom: Platform.OS==='ios' ? 24 : 10, borderTopWidth:0.5 },
  tab: { flex:1, alignItems:'center' },
  inner: { alignItems:'center', gap:2 },
  emoji: { fontSize:22 },
  label: { fontSize:10, letterSpacing:0.1 },
  indicator: { width:16, height:3, borderRadius:2, backgroundColor:'#E50914', marginTop:1 },
  activeGlow: {
    shadowColor: '#E50914',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
});

function GlobalFAB({ currentTab }) {
  const bets = useStore(s => s.bets);
  const bookies = useStore(s => s.bookies);
  const sports = useStore(s => s.sports);
  const templates = useStore(s => s.templates);
  const markStatus = useStore(s => s.markStatus);
  const duplicateBet = useStore(s => s.duplicateBet);
  const addBet = useStore(s => s.addBet);
  const [modalVisible, setModalVisible] = React.useState(false);
  const stats = useStats();

  if (currentTab === 'Settings') return null;

  const pendingBets = bets.filter(b => b.status === 'Pending');

  const handleAction = (id) => {
    if (id === 'add') {
      setModalVisible(true);
    } else if (id === 'won' || id === 'lost') {
      const status = id === 'won' ? 'Won' : 'Lost';
      if (pendingBets.length === 0) {
        Alert.alert('No Pending Bets', 'Add a pending bet first.');
      } else if (pendingBets.length === 1) {
        markStatus(pendingBets[0].id, status);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        Alert.alert('Mark as ' + status, 'Which bet?', [
          ...pendingBets.slice(0, 6).map(b => ({
            text: String(b.event || 'Bet').substring(0, 35),
            onPress: () => {
              markStatus(b.id, status);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            },
          })),
          { text: 'Cancel', style: 'cancel' },
        ]);
      }
    } else if (id === 'quick') {
      if (bets.length === 0) { Alert.alert('No Bets', 'Add a bet first.'); return; }
      duplicateBet(bets[0]);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Done ✓', 'Last bet duplicated as Pending.');
    } else if (id === 'stats') {
      const todayCount = bets.filter(function(b) { return new Date(b.date).toDateString() === new Date().toDateString(); });
      Alert.alert(
        "Today's P&L",
        todayCount.length === 0 ? 'No bets today yet.' :
          'Bets: ' + todayCount.length + '\n' +
          'Won: ' + todayCount.filter(function(b) { return b.status === 'Won'; }).length +
          '  Lost: ' + todayCount.filter(function(b) { return b.status === 'Lost'; }).length + '\n' +
          'P&L: ' + (stats.todayPnL >= 0 ? '+' : '') + '₹' + Math.abs(stats.todayPnL).toFixed(0),
        [{ text: 'OK' }]
      );
    }
  };

  return (
    <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, top: 0 }} pointerEvents="box-none">
      <FloatingMenu
        onAction={handleAction}
        hasPendingBets={pendingBets.length > 0}
      />
      <AddBetModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSave={async (form) => { await addBet(form); setModalVisible(false); }}
        editBet={null}
        bookies={bookies}
        sports={sports}
        templates={templates}
        suggestStake={null}
        currSym="₹"
      />
    </View>
  );
}

// Proper tab bar wrapper — hooks at top level
function TabBarWithFAB({ state, navigation, descriptors, setCurrentTab }) {
  const currentName = state.routes[state.index].name;
  React.useEffect(() => {
    setCurrentTab(currentName);
  }, [currentName]);
  return <CustomTabBar state={state} navigation={navigation} descriptors={descriptors} />;
}

function MainTabs() {
  const [currentTab, setCurrentTab] = React.useState('Home');

  return (
    <View style={{ flex: 1 }}>
      <Tab.Navigator
        tabBar={props => <TabBarWithFAB {...props} setCurrentTab={setCurrentTab} />}
        screenOptions={{ headerShown: false }}>
        <Tab.Screen name="Home" component={HomeScreen} />
        <Tab.Screen name="Bets" component={BetsScreen} />
        <Tab.Screen name="Stats" component={StatsScreen} />
        <Tab.Screen name="Bankroll" component={BankrollScreen} />
        <Tab.Screen name="Settings" component={SettingsScreen} />
      </Tab.Navigator>
      <GlobalFAB currentTab={currentTab} />
    </View>
  );
}

function AppContent() {
  const { colors, isDark } = useTheme();
  const init = useStore(s => s.init);
  const [onboarded, setOnboarded] = useState(null);
  const [pinEnabled, setPinEnabled] = useState(false);
  const [savedPin, setSavedPin] = useState('');
  const [pinUnlocked, setPinUnlocked] = useState(false);
  const [pinMode, setPinMode] = useState(null);

  useEffect(() => {
    migrateIfNeeded();
    init();
    Promise.all([
      getItem(KEYS.ONBOARDED, false),
      getItem(KEYS.PIN_ENABLED, false),
      getItem(KEYS.PIN, ''),
    ]).then(([ob, pe, p]) => { setOnboarded(ob); setPinEnabled(pe); setSavedPin(p); });
  }, []);

  if (onboarded === null) return <View style={{ flex:1, backgroundColor: colors.background }} />;
  if (!onboarded) return <OnboardingScreen onDone={async () => { await setItem(KEYS.ONBOARDED, true); setOnboarded(true); }} />;
  if (pinEnabled && savedPin && !pinUnlocked && pinMode !== 'set') return <PinScreen mode="enter" savedPin={savedPin} onSuccess={() => setPinUnlocked(true)} onSetPin={() => {}} />;
  if (pinMode === 'set') return (
    <PinScreen mode="set" savedPin="" onSuccess={() => {}} onSetPin={async (pin) => {
      await setItem(KEYS.PIN, pin); await setItem(KEYS.PIN_ENABLED, true);
      setSavedPin(pin); setPinEnabled(true); setPinUnlocked(true); setPinMode(null);
    }} />
  );

  return (
    <NavigationContainer>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />
      <MainTabs />
    </NavigationContainer>
  );
}

function App() {
  return (
    <GestureHandlerRootView style={{ flex:1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <ToastProvider>
            <AppContent />
          </ToastProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

export default App;
registerRootComponent(App);
