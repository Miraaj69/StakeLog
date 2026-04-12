// App.js
import 'react-native-gesture-handler';
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, StatusBar, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, withTiming,
  FadeIn, SlideInDown,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { ThemeProvider, useTheme } from './hooks/useTheme';
import { useBets } from './hooks/useBets';
import { getItem, setItem, KEYS } from './utils/storage';
import HomeScreen from './screens/HomeScreen';
import BetsScreen from './screens/BetsScreen';
import StatsScreen from './screens/StatsScreen';
import BankrollScreen from './screens/BankrollScreen';
import SettingsScreen from './screens/SettingsScreen';
import { Spacing, Radius, Typography, Shadows } from './utils/theme';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// ── PIN Screen ────────────────────────────────────────────────────
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
        setErr('Wrong PIN');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        shakeVal.value = withSpring(8, { damping: 2, stiffness: 300 }, () => {
          shakeVal.value = withSpring(0);
        });
        setTimeout(() => { setDigits([]); setErr(''); }, 600);
      }
    }
  };

  return (
    <View style={[pinStyles.screen, { backgroundColor: colors.background }]}>
      <Text style={pinStyles.emoji}>🔐</Text>
      <Text style={[pinStyles.title, { color: colors.textPrimary }]}>
        {mode === 'set' ? 'Set PIN' : 'Enter PIN'}
      </Text>
      <Text style={[pinStyles.subtitle, { color: colors.textSecondary }]}>
        {mode === 'set' ? 'Choose a 4-digit PIN to secure your app' : 'Enter your PIN to continue'}
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

      {err ? <Text style={[pinStyles.err, { color: colors.loss }]}>{err}</Text> : <View style={{ height: 20 }} />}

      <View style={pinStyles.keypad}>
        {keys.map((k, i) => (
          <Pressable key={i} onPress={() => press(k)} disabled={k === ''}
            style={({ pressed }) => [
              pinStyles.key,
              { backgroundColor: k === '' ? 'transparent' : pressed ? colors.primaryContainer : colors.surface, opacity: k === '' ? 0 : 1 },
              ...Shadows.sm,
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
  emoji: { fontSize: 56, marginBottom: 20 },
  title: { fontSize: 26, fontWeight: '800', marginBottom: 8, letterSpacing: -0.5 },
  subtitle: { fontSize: 15, textAlign: 'center', marginBottom: 40, lineHeight: 22 },
  dotsRow: { flexDirection: 'row', gap: 20, marginBottom: 8 },
  dot: { width: 16, height: 16, borderRadius: 8, borderWidth: 2 },
  err: { fontSize: 14, fontWeight: '600', height: 20 },
  keypad: { flexDirection: 'row', flexWrap: 'wrap', width: 280, gap: 14, marginTop: 24, justifyContent: 'center' },
  key: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center' },
  keyText: { fontSize: 24, fontWeight: '700' },
});

// ── Onboarding ─────────────────────────────────────────────────────
function OnboardingScreen({ onDone }) {
  const { colors } = useTheme();
  const [step, setStep] = React.useState(0);
  const progress = useSharedValue(0);

  const steps = [
    { icon: '🎯', title: 'Welcome to Stake Log', desc: 'Track every bet you place across all bookies and sports in one beautiful app.' },
    { icon: '📊', title: 'Smart Analytics', desc: 'P&L charts, win rate, heatmaps, and AI-like insights generated from your data.' },
    { icon: '💡', title: 'Pro Features', desc: 'Bankroll tracker, bet templates, swipe gestures, tag analytics and achievements.' },
    { icon: '🔒', title: '100% Private', desc: 'PIN lock, hidden mode — your data stays on your device. No accounts needed.' },
  ];

  React.useEffect(() => {
    progress.value = withSpring(step / (steps.length - 1));
  }, [step]);

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  const s = steps[step];

  return (
    <View style={[onbStyles.screen, { backgroundColor: colors.background }]}>
      <Animated.View entering={FadeIn} key={step} style={onbStyles.content}>
        <Text style={onbStyles.icon}>{s.icon}</Text>
        <Text style={[onbStyles.title, { color: colors.textPrimary }]}>{s.title}</Text>
        <Text style={[onbStyles.desc, { color: colors.textSecondary }]}>{s.desc}</Text>
      </Animated.View>

      <View style={onbStyles.bottom}>
        <View style={[onbStyles.progressTrack, { backgroundColor: colors.border }]}>
          <Animated.View style={[onbStyles.progressFill, { backgroundColor: colors.primary }, progressStyle]} />
        </View>

        <View style={onbStyles.dotsRow}>
          {steps.map((_, i) => (
            <View key={i} style={[onbStyles.dot, { backgroundColor: i === step ? colors.primary : colors.border, width: i === step ? 24 : 8 }]} />
          ))}
        </View>

        <Pressable onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); step < steps.length - 1 ? setStep(s => s + 1) : onDone(); }}
          style={[onbStyles.nextBtn, { backgroundColor: colors.primary, ...Shadows.primary }]}>
          <Text style={onbStyles.nextBtnText}>{step < steps.length - 1 ? 'Continue →' : "Let's Go 🚀"}</Text>
        </Pressable>

        {step > 0 && (
          <Pressable onPress={() => setStep(s => s - 1)} style={onbStyles.backBtn}>
            <Text style={[onbStyles.backText, { color: colors.textSecondary }]}>← Back</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const onbStyles = StyleSheet.create({
  screen: { flex: 1, padding: 32, justifyContent: 'space-between' },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  icon: { fontSize: 80, marginBottom: 32 },
  title: { fontSize: 28, fontWeight: '900', textAlign: 'center', marginBottom: 16, letterSpacing: -0.5, lineHeight: 34 },
  desc: { fontSize: 16, textAlign: 'center', lineHeight: 26 },
  bottom: { gap: 16 },
  progressTrack: { height: 4, borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 2 },
  dotsRow: { flexDirection: 'row', gap: 8, justifyContent: 'center' },
  dot: { height: 8, borderRadius: 4 },
  nextBtn: { borderRadius: 30, paddingVertical: 16, alignItems: 'center' },
  nextBtnText: { color: '#fff', fontSize: 16, fontWeight: '800', letterSpacing: 0.3 },
  backBtn: { alignItems: 'center', paddingVertical: 8 },
  backText: { fontSize: 15 },
});

// ── Custom Tab Bar ─────────────────────────────────────────────────
function CustomTabBar({ state, descriptors, navigation }) {
  const { colors } = useTheme();

  const tabs = [
    { icon: '🏠', label: 'Home' },
    { icon: '📋', label: 'Bets' },
    { icon: '📊', label: 'Stats' },
    { icon: '💰', label: 'Bankroll' },
    { icon: '⚙️', label: 'Settings' },
  ];

  return (
    <View style={[tabStyles.bar, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
      {state.routes.map((route, index) => {
        const isFocused = state.index === index;
        const scale = useSharedValue(1);

        const animStyle = useAnimatedStyle(() => ({
          transform: [{ scale: scale.value }],
        }));

        const onPress = () => {
          scale.value = withSpring(0.88, { damping: 10 }, () => { scale.value = withSpring(1); });
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          if (!isFocused) navigation.navigate(route.name);
        };

        return (
          <Pressable key={route.name} onPress={onPress} style={tabStyles.tab}>
            <Animated.View style={[tabStyles.tabInner, animStyle]}>
              <View style={[tabStyles.iconContainer, isFocused && { backgroundColor: colors.primaryContainer }]}>
                <Text style={tabStyles.icon}>{tabs[index].icon}</Text>
              </View>
              <Text style={[tabStyles.label, { color: isFocused ? colors.primary : colors.textTertiary, fontWeight: isFocused ? '700' : '500' }]}>
                {tabs[index].label}
              </Text>
            </Animated.View>
          </Pressable>
        );
      })}
    </View>
  );
}

const tabStyles = StyleSheet.create({
  bar: { flexDirection: 'row', paddingTop: 8, paddingBottom: Platform.OS === 'ios' ? 24 : 12, borderTopWidth: 1 },
  tab: { flex: 1, alignItems: 'center' },
  tabInner: { alignItems: 'center', gap: 3 },
  iconContainer: { width: 44, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  icon: { fontSize: 18 },
  label: { fontSize: 10 },
});

// ── Main Tab Navigator ─────────────────────────────────────────────
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

// ── App Root ───────────────────────────────────────────────────────
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
    return (
      <PinScreen mode="enter" savedPin={savedPin} onSuccess={() => setPinUnlocked(true)} onSetPin={() => {}} />
    );
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
