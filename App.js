// App.js — Fixed
import 'react-native-gesture-handler';
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, StatusBar, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring,
  FadeIn,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { ThemeProvider, useTheme } from './hooks/useTheme';
import { getItem, setItem, KEYS } from './utils/storage';
import HomeScreen from './screens/HomeScreen';
import BetsScreen from './screens/BetsScreen';
import StatsScreen from './screens/StatsScreen';
import BankrollScreen from './screens/BankrollScreen';
import SettingsScreen from './screens/SettingsScreen';
import { Radius, Shadows } from './utils/theme';

const Tab = createBottomTabNavigator();

// ── PIN Screen ────────────────────────────────────────────────
function PinScreen({ mode, savedPin, onSuccess, onSetPin }) {
  const { colors } = useTheme();
  const [digits, setDigits] = React.useState([]);
  const [err, setErr] = React.useState('');
  const shakeVal = useSharedValue(0);

  const shakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeVal.value }],
  }));

  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'];

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
        shakeVal.value = withSpring(10, { damping: 2, stiffness: 400 }, () => {
          shakeVal.value = withSpring(0);
        });
        setTimeout(() => { setDigits([]); setErr(''); }, 700);
      }
    }
  };

  return (
    <View style={[pinStyles.screen, { backgroundColor: colors.background }]}>
      <View style={[pinStyles.iconWrap, { backgroundColor: colors.primaryContainer, borderColor: colors.primaryBorder }]}>
        <Text style={{ fontSize: 36 }}>🔐</Text>
      </View>
      <Text style={[pinStyles.title, { color: colors.textPrimary }]}>
        {mode === 'set' ? 'Create PIN' : 'Enter PIN'}
      </Text>
      <Text style={[pinStyles.subtitle, { color: colors.textTertiary }]}>
        {mode === 'set' ? 'Choose a 4-digit PIN to secure the app' : 'Enter your PIN to continue'}
      </Text>

      <Animated.View style={[pinStyles.dotsRow, shakeStyle]}>
        {[0, 1, 2, 3].map(i => (
          <View key={i} style={[
            pinStyles.dot,
            { borderColor: digits.length > i ? colors.primary : colors.border },
            digits.length > i && { backgroundColor: colors.primary },
          ]} />
        ))}
      </Animated.View>

      {err
        ? <Text style={[pinStyles.err, { color: colors.loss }]}>{err}</Text>
        : <View style={{ height: 20 }} />}

      <View style={pinStyles.keypad}>
        {keys.map((k, i) => (
          <Pressable key={i} onPress={() => press(k)} disabled={k === ''}
            style={({ pressed }) => [
              pinStyles.key,
              {
                backgroundColor: k === '' ? 'transparent' : pressed ? colors.primaryContainer : colors.surface,
                borderColor: k === '' ? 'transparent' : colors.border,
                opacity: k === '' ? 0 : 1,
              },
            ]}>
            <Text style={[pinStyles.keyText, { color: k === '⌫' ? colors.primary : colors.textPrimary }]}>{k}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const pinStyles = StyleSheet.create({
  screen: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  iconWrap: { width: 80, height: 80, borderRadius: 24, alignItems: 'center', justifyContent: 'center', borderWidth: 0.5, marginBottom: 24 },
  title: { fontSize: 26, fontWeight: '700', marginBottom: 8, letterSpacing: -0.5 },
  subtitle: { fontSize: 14, textAlign: 'center', marginBottom: 44, lineHeight: 21 },
  dotsRow: { flexDirection: 'row', gap: 16, marginBottom: 8 },
  dot: { width: 14, height: 14, borderRadius: 7, borderWidth: 2 },
  err: { fontSize: 13, fontWeight: '600', height: 20 },
  keypad: { flexDirection: 'row', flexWrap: 'wrap', width: 260, gap: 12, marginTop: 28, justifyContent: 'center' },
  key: { width: 76, height: 76, borderRadius: 38, alignItems: 'center', justifyContent: 'center', borderWidth: 0.5 },
  keyText: { fontSize: 22, fontWeight: '600' },
});

// ── Onboarding ────────────────────────────────────────────────
function OnboardingScreen({ onDone }) {
  const { colors } = useTheme();
  const [step, setStep] = React.useState(0);

  const steps = [
    { icon: '🎯', title: 'Welcome to Stake Log', desc: 'Track every bet you place — across all bookies and sports — in one beautiful app.' },
    { icon: '📊', title: 'Smart Analytics', desc: 'P&L charts, win rate, heatmaps, and insights generated from your actual data.' },
    { icon: '💡', title: 'Pro Features', desc: 'Bankroll tracker, bet templates, swipe gestures, tag analytics, and achievements.' },
    { icon: '🔒', title: '100% Private', desc: 'PIN lock and hidden mode. Your data stays on your device. No accounts needed.' },
  ];

  const s = steps[step];

  return (
    <View style={[onbStyles.screen, { backgroundColor: colors.background }]}>
      <Animated.View entering={FadeIn.duration(300)} key={step} style={onbStyles.content}>
        <View style={[onbStyles.iconWrap, { backgroundColor: colors.primaryContainer, borderColor: colors.primaryBorder }]}>
          <Text style={onbStyles.icon}>{s.icon}</Text>
        </View>
        <Text style={[onbStyles.title, { color: colors.textPrimary }]}>{s.title}</Text>
        <Text style={[onbStyles.desc, { color: colors.textSecondary }]}>{s.desc}</Text>
      </Animated.View>

      <View style={onbStyles.bottom}>
        <View style={onbStyles.dotsRow}>
          {steps.map((_, i) => (
            <View key={i} style={[onbStyles.dot, {
              backgroundColor: i === step ? colors.primary : colors.border,
              width: i === step ? 22 : 7,
            }]} />
          ))}
        </View>

        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            step < steps.length - 1 ? setStep(s => s + 1) : onDone();
          }}
          style={[onbStyles.nextBtn, { backgroundColor: colors.primary, ...Shadows.primary }]}>
          <Text style={onbStyles.nextBtnText}>{step < steps.length - 1 ? 'Continue →' : "Let's Go 🚀"}</Text>
        </Pressable>

        {step > 0 && (
          <Pressable onPress={() => setStep(s => s - 1)} style={onbStyles.backBtn}>
            <Text style={[onbStyles.backText, { color: colors.textTertiary }]}>← Back</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const onbStyles = StyleSheet.create({
  screen: { flex: 1, padding: 32, justifyContent: 'space-between' },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  iconWrap: { width: 100, height: 100, borderRadius: 28, alignItems: 'center', justifyContent: 'center', marginBottom: 32, borderWidth: 0.5 },
  icon: { fontSize: 52 },
  title: { fontSize: 26, fontWeight: '700', textAlign: 'center', marginBottom: 14, letterSpacing: -0.5, lineHeight: 32 },
  desc: { fontSize: 16, textAlign: 'center', lineHeight: 26 },
  bottom: { gap: 14 },
  dotsRow: { flexDirection: 'row', gap: 7, justifyContent: 'center', marginBottom: 4 },
  dot: { height: 7, borderRadius: 4 },
  nextBtn: { borderRadius: Radius.full, paddingVertical: 16, alignItems: 'center' },
  nextBtnText: { color: '#fff', fontSize: 16, fontWeight: '700', letterSpacing: 0.2 },
  backBtn: { alignItems: 'center', paddingVertical: 10 },
  backText: { fontSize: 14, fontWeight: '500' },
});

// ── FIX: Tab item extracted as separate component so hooks are NOT inside .map() ──
const TABS = [
  { icon: '⌂', label: 'Home' },
  { icon: '≡', label: 'Bets' },
  { icon: '◎', label: 'Stats' },
  { icon: '◈', label: 'Bankroll' },
  { icon: '⊙', label: 'Settings' },
];

// Each tab item is its OWN component → hooks are valid here
function TabItem({ route, index, isFocused, onPress, colors }) {
  const scale = useSharedValue(1);                          // ✅ hook at top level of component

  const animStyle = useAnimatedStyle(() => ({              // ✅ hook at top level of component
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    scale.value = withSpring(0.85, { damping: 12 }, () => {
      scale.value = withSpring(1, { damping: 14 });
    });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  return (
    <Pressable onPress={handlePress} style={tabStyles.tab}>
      <Animated.View style={[tabStyles.tabInner, animStyle]}>
        <View style={[
          tabStyles.iconWrap,
          isFocused && { backgroundColor: colors.primaryContainer },
        ]}>
          <Text style={[tabStyles.icon, { color: isFocused ? colors.primary : colors.textQuaternary }]}>
            {TABS[index].icon}
          </Text>
        </View>
        <Text style={[
          tabStyles.label,
          { color: isFocused ? colors.primary : colors.textQuaternary, fontWeight: isFocused ? '700' : '500' },
        ]}>
          {TABS[index].label}
        </Text>
        {isFocused && <View style={[tabStyles.indicator, { backgroundColor: colors.primary }]} />}
      </Animated.View>
    </Pressable>
  );
}

function CustomTabBar({ state, navigation }) {
  const { colors } = useTheme();

  return (
    <View style={[
      tabStyles.bar,
      { backgroundColor: colors.surface, borderTopColor: colors.border, ...Shadows.lg },
    ]}>
      {state.routes.map((route, index) => (
        <TabItem
          key={route.name}
          route={route}
          index={index}
          isFocused={state.index === index}
          colors={colors}
          onPress={() => { if (state.index !== index) navigation.navigate(route.name); }}
        />
      ))}
    </View>
  );
}

const tabStyles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    paddingTop: 8,
    paddingBottom: Platform.OS === 'ios' ? 24 : 10,
    borderTopWidth: 0.5,
  },
  tab: { flex: 1, alignItems: 'center' },
  tabInner: { alignItems: 'center', gap: 3 },
  iconWrap: { width: 40, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  icon: { fontSize: 18 },
  label: { fontSize: 10, letterSpacing: 0.2 },
  indicator: { width: 4, height: 4, borderRadius: 2, marginTop: 1 },
});

function MainTabs() {
  return (
    <Tab.Navigator
      tabBar={props => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}>
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Bets" component={BetsScreen} />
      <Tab.Screen name="Stats" component={StatsScreen} />
      <Tab.Screen name="Bankroll" component={BankrollScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

function AppContent() {
  const { colors, isDark } = useTheme();
  const [onboarded, setOnboarded] = useState(null);
  const [pinEnabled, setPinEnabled] = useState(false);
  const [savedPin, setSavedPin] = useState('');
  const [pinUnlocked, setPinUnlocked] = useState(false);
  const [pinMode, setPinMode] = useState(null);

  useEffect(() => {
    Promise.all([
      getItem(KEYS.ONBOARDED, false),
      getItem(KEYS.PIN_ENABLED, false),
      getItem(KEYS.PIN, ''),
    ]).then(([ob, pe, p]) => {
      setOnboarded(ob);
      setPinEnabled(pe);
      setSavedPin(p);
    });
  }, []);

  if (onboarded === null) {
    return <View style={{ flex: 1, backgroundColor: colors.background }} />;
  }

  if (!onboarded) {
    return (
      <OnboardingScreen onDone={async () => {
        await setItem(KEYS.ONBOARDED, true);
        setOnboarded(true);
      }} />
    );
  }

  if (pinEnabled && savedPin && !pinUnlocked && pinMode !== 'set') {
    return <PinScreen mode="enter" savedPin={savedPin} onSuccess={() => setPinUnlocked(true)} onSetPin={() => {}} />;
  }

  if (pinMode === 'set') {
    return (
      <PinScreen mode="set" savedPin="" onSuccess={() => {}} onSetPin={async (pin) => {
        await setItem(KEYS.PIN, pin);
        await setItem(KEYS.PIN_ENABLED, true);
        setSavedPin(pin);
        setPinEnabled(true);
        setPinUnlocked(true);
        setPinMode(null);
      }} />
    );
  }

  return (
    <NavigationContainer>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />
      <MainTabs />
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <AppContent />
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
