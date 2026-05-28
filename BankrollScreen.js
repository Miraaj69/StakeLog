// BankrollScreen.js — Material 3 Expressive · Pixel flagship
// Tonal hero surface · Animated balance · Spring inputs · Zero blur

import React, { useState, useMemo } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  Pressable, TextInput, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  FadeInDown, FadeIn,
  useSharedValue, useAnimatedStyle, withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTheme } from './useTheme';
import { useStore, useStats } from './store';
import Chart from './Chart';
import {
  formatMoney, calcBankrollSeries,
  calcPnLTimeSeries, getCurrencySymbol,
} from './calculations';

// ─── COLORS ──────────────────────────────────────────────────────
const C = {
  profit:  '#00BF6F',
  loss:    '#FF4444',
  primary: '#FF4B6A',
  blue:    '#5B8DEF',
  amber:   '#FFB347',
};

// ─── MINI STAT CARD ──────────────────────────────────────────────
function MiniStat({ label, value, color, bg, border, colors, isDark, delay }) {
  return (
    <Animated.View
      entering={FadeInDown.delay(delay).springify().damping(28)}
      style={[msc.card, {
        backgroundColor: bg   || (isDark ? colors.surfaceVariant : '#FFFFFF'),
        borderColor:     border || colors.border,
        shadowColor:     '#000',
        shadowOffset:    { width: 0, height: 2 },
        shadowOpacity:   0.06,
        shadowRadius:    8,
        elevation:       2,
      }]}
    >
      <Text style={[msc.lbl, { color: colors.textTertiary }]}>{label}</Text>
      <Text style={[msc.val, { color: color || colors.textPrimary }]}
        numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
    </Animated.View>
  );
}
const msc = StyleSheet.create({
  card: { flex: 1, borderRadius: 20, paddingVertical: 14,
          paddingHorizontal: 12, borderWidth: 1 },
  lbl:  { fontSize: 9, fontWeight: '700', textTransform: 'uppercase',
          letterSpacing: 1.2, marginBottom: 6 },
  val:  { fontSize: 18, fontWeight: '800', letterSpacing: -0.5 },
});

// ─── RISK TIP ROW ────────────────────────────────────────────────
function RiskTip({ icon, title, desc, color, bg, borderColor, colors, delay }) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View
      entering={FadeInDown.delay(delay).springify().damping(28)}
      style={animStyle}
    >
      <Pressable
        onPressIn={() => {
          scale.value = withSpring(0.97, { damping: 20, stiffness: 400 });
        }}
        onPressOut={() => {
          scale.value = withSpring(1, { damping: 20, stiffness: 400 });
        }}
        style={[rt.wrap, { backgroundColor: bg, borderColor }]}
      >
        <View style={[rt.iconWrap, { backgroundColor: `${color}18` }]}>
          <Text style={{ fontSize: 18 }}>{icon}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[rt.title, { color }]}>{title}</Text>
          <Text style={[rt.desc, { color: colors.textSecondary }]}>{desc}</Text>
        </View>
        <Text style={[rt.arrow, { color, opacity: 0.4 }]}>›</Text>
      </Pressable>
    </Animated.View>
  );
}
const rt = StyleSheet.create({
  wrap:     { flexDirection: 'row', alignItems: 'center', gap: 14,
              borderRadius: 18, padding: 14, borderWidth: 1 },
  iconWrap: { width: 40, height: 40, borderRadius: 13,
              alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  title:    { fontSize: 14, fontWeight: '700', marginBottom: 3 },
  desc:     { fontSize: 12, lineHeight: 18 },
  arrow:    { fontSize: 22, fontWeight: '300' },
});

// ─── MAIN SCREEN ─────────────────────────────────────────────────
export default function BankrollScreen() {
  const { colors, isDark } = useTheme();
  const bets          = useStore(s => s.bets);
  const bankrollStart = useStore(s => s.bankrollStart);
  const currency      = useStore(s => s.currency);
  const saveBankroll  = useStore(s => s.saveBankroll);
  const stats         = useStats();

  const [inputVal,    setInputVal]    = useState('');
  const [inputFocus,  setInputFocus]  = useState(false);
  const [saved,       setSaved]       = useState(false);
  const currSym = getCurrencySymbol(currency);

  const bankrollData = useMemo(
    () => calcBankrollSeries(bets, bankrollStart),
    [bets, bankrollStart]
  );
  const pnlData = useMemo(
    () => calcPnLTimeSeries(bets),
    [bets]
  );

  const isProfit    = stats.totalPnL >= 0;
  const chartColor  = isProfit ? C.profit : C.loss;
  const suggestStake = stats.currentBalance > 0
    ? stats.currentBalance * 0.02
    : null;

  const handleSave = () => {
    const v = parseFloat(inputVal);
    if (!isNaN(v) && v > 0) {
      saveBankroll(v);
      setInputVal('');
      setSaved(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  // Growth %
  const growth = bankrollStart > 0
    ? (((stats.currentBalance - bankrollStart) / bankrollStart) * 100).toFixed(1)
    : null;

  return (
    <SafeAreaView
      style={[s.screen, { backgroundColor: colors.background }]}
      edges={['top']}
    >
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* ── Header ── */}
      <View style={[s.topBar, { borderBottomColor: colors.border }]}>
        <View>
          <Text style={[s.title, { color: colors.textPrimary }]}>Bankroll</Text>
          <Text style={[s.sub, { color: colors.textTertiary }]}>
            Track funds & risk management
          </Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.content}
      >

        {/* ── HERO SURFACE ── */}
        <Animated.View
          entering={FadeIn.duration(400).springify()}
          style={[
            s.hero,
            {
              backgroundColor: isDark ? colors.surfaceVariant : '#FFFFFF',
              borderColor:     colors.border,
            },
          ]}
        >
          {/* Ambient tonal top strip */}
          <View style={[s.ambientStrip, {
            backgroundColor: isProfit
              ? (isDark ? 'rgba(0,191,111,0.1)' : 'rgba(0,191,111,0.06)')
              : (isDark ? 'rgba(255,68,68,0.1)'  : 'rgba(255,68,68,0.05)'),
          }]} />

          <Text style={[s.heroEyebrow, { color: colors.textTertiary }]}>
            Current Balance
          </Text>
          <Text style={[s.heroAmount, { color: isProfit ? C.profit : C.loss }]}>
            {formatMoney(stats.currentBalance, currSym)}
          </Text>

          {/* Pills */}
          <View style={s.pillRow}>
            {growth != null && (
              <View style={[s.pill, {
                backgroundColor: isProfit
                  ? 'rgba(0,191,111,0.1)'
                  : 'rgba(255,68,68,0.09)',
                borderColor: isProfit
                  ? 'rgba(0,191,111,0.22)'
                  : 'rgba(255,68,68,0.2)',
              }]}>
                <Text style={[s.pillTxt, { color: isProfit ? C.profit : C.loss }]}>
                  {isProfit ? '↑' : '↓'} {growth}% growth
                </Text>
              </View>
            )}
            <View style={[s.pill, {
              backgroundColor: isDark
                ? 'rgba(255,255,255,0.06)'
                : 'rgba(0,0,0,0.04)',
              borderColor: colors.border,
            }]}>
              <Text style={[s.pillTxt, { color: colors.textSecondary }]}>
                Started {formatMoney(bankrollStart, currSym)}
              </Text>
            </View>
            {stats.roi && (
              <View style={[s.pill, {
                backgroundColor: 'rgba(91,141,239,0.1)',
                borderColor:     'rgba(91,141,239,0.2)',
              }]}>
                <Text style={[s.pillTxt, { color: C.blue }]}>
                  {parseFloat(stats.roi) >= 0 ? '+' : ''}{stats.roi}% ROI
                </Text>
              </View>
            )}
          </View>

          {/* Bankroll chart */}
          {bankrollData.length >= 2 && (
            <View style={{ marginTop: 16 }}>
              <Chart
                data={bankrollData}
                color={chartColor}
                height={72}
                currSym={currSym}
              />
            </View>
          )}
        </Animated.View>

        {/* ── STAT TILES ── */}
        <View style={s.statsRow}>
          <MiniStat
            label="Starting"
            value={formatMoney(bankrollStart, currSym)}
            colors={colors} isDark={isDark} delay={80}
          />
          <MiniStat
            label="Total P&L"
            value={(isProfit ? '+' : '') + formatMoney(stats.totalPnL, currSym)}
            color={isProfit ? C.profit : C.loss}
            bg={isProfit
              ? (isDark ? 'rgba(0,191,111,0.09)' : 'rgba(0,191,111,0.07)')
              : (isDark ? 'rgba(255,68,68,0.09)'  : 'rgba(255,68,68,0.06)')}
            border={isProfit ? 'rgba(0,191,111,0.22)' : 'rgba(255,68,68,0.2)'}
            colors={colors} isDark={isDark} delay={110}
          />
          <MiniStat
            label="2% Stake"
            value={suggestStake
              ? formatMoney(suggestStake, currSym)
              : '—'}
            color={C.amber}
            bg={isDark ? 'rgba(255,179,71,0.09)' : 'rgba(255,179,71,0.07)'}
            border="rgba(255,179,71,0.22)"
            colors={colors} isDark={isDark} delay={140}
          />
        </View>

        {/* ── SET BANKROLL CARD ── */}
        <Animated.View
          entering={FadeInDown.delay(160).springify().damping(28)}
          style={[s.card, {
            backgroundColor: isDark ? colors.surfaceVariant : '#FFFFFF',
            borderColor:     colors.border,
          }]}
        >
          <View style={s.cardHead}>
            <View style={[s.cardIconWrap, { backgroundColor: 'rgba(255,75,106,0.1)' }]}>
              <Text style={{ fontSize: 20 }}>💰</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[s.cardTitle, { color: colors.textPrimary }]}>
                Starting Bankroll
              </Text>
              <Text style={[s.cardSub, { color: colors.textTertiary }]}>
                Used to calculate ROI & stake sizing
              </Text>
            </View>
          </View>

          {/* Input */}
          <Text style={[s.inputLabel, { color: colors.textTertiary }]}>
            Amount ({currSym})
          </Text>
          <View style={[s.inputWrap, {
            backgroundColor: isDark
              ? colors.surfaceContainer || colors.surface
              : colors.surfaceVariant,
            borderColor: inputFocus ? C.primary : colors.border,
            shadowColor:   inputFocus ? C.primary : 'transparent',
            shadowOpacity: inputFocus ? 0.2 : 0,
            shadowRadius:  8,
            shadowOffset:  { width: 0, height: 0 },
          }]}>
            <Text style={[s.inputPrefix, { color: colors.textTertiary }]}>
              {currSym}
            </Text>
            <TextInput
              style={[s.input, { color: colors.textPrimary }]}
              value={inputVal}
              onChangeText={setInputVal}
              onFocus={() => setInputFocus(true)}
              onBlur={() => setInputFocus(false)}
              placeholder={bankrollStart > 0
                ? String(bankrollStart)
                : '10000'}
              placeholderTextColor={colors.textTertiary}
              keyboardType="decimal-pad"
            />
          </View>

          {/* 2% hint */}
          {suggestStake && (
            <View style={[s.hint, {
              backgroundColor: isDark
                ? 'rgba(255,179,71,0.08)'
                : 'rgba(255,179,71,0.07)',
              borderColor: 'rgba(255,179,71,0.2)',
            }]}>
              <Text style={{ fontSize: 13 }}>💡</Text>
              <Text style={[s.hintTxt, { color: C.amber }]}>
                Suggested stake per bet (2% rule): {formatMoney(suggestStake, currSym)}
              </Text>
            </View>
          )}

          {/* Save button */}
          <Pressable
            onPress={handleSave}
            style={[s.saveBtn, {
              backgroundColor: saved ? C.profit : C.primary,
              shadowColor:     saved ? C.profit : C.primary,
            }]}
          >
            <Text style={s.saveBtnTxt}>
              {saved ? '✓ Saved!' : 'Save Bankroll'}
            </Text>
          </Pressable>
        </Animated.View>

        {/* ── P&L CHART CARD ── */}
        {pnlData.length >= 2 && (
          <Animated.View
            entering={FadeInDown.delay(200).springify().damping(28)}
            style={[s.card, {
              backgroundColor: isDark ? colors.surfaceVariant : '#FFFFFF',
              borderColor:     colors.border,
            }]}
          >
            <Text style={[s.cardTitle, { color: colors.textPrimary }]}>
              P&L Over Time
            </Text>
            <Text style={[s.cardSub, { color: colors.textTertiary, marginBottom: 12 }]}>
              Drag to explore
            </Text>
            <Chart
              data={pnlData}
              color={chartColor}
              height={130}
              currSym={currSym}
              showLabels
            />
          </Animated.View>
        )}

        {/* ── RISK MANAGEMENT ── */}
        <Animated.View
          entering={FadeInDown.delay(240).springify().damping(28)}
        >
          <Text style={[s.sectionLabel, { color: colors.textTertiary }]}>
            Risk Management
          </Text>
          <View style={{ gap: 9 }}>
            <RiskTip
              icon="💡"
              title="2% Rule"
              desc="Never stake more than 2% of bankroll on a single bet"
              color={C.amber}
              bg={isDark ? 'rgba(255,179,71,0.08)' : 'rgba(255,179,71,0.06)'}
              borderColor="rgba(255,179,71,0.2)"
              colors={colors} delay={260}
            />
            <RiskTip
              icon="📐"
              title="Kelly Criterion"
              desc="Adjust stake size based on your estimated edge over the bookmaker"
              color={C.blue}
              bg={isDark ? 'rgba(91,141,239,0.08)' : 'rgba(91,141,239,0.06)'}
              borderColor="rgba(91,141,239,0.2)"
              colors={colors} delay={295}
            />
            <RiskTip
              icon="🛑"
              title="Stop Loss"
              desc="Set a daily and weekly loss limit — discipline beats luck"
              color={C.loss}
              bg={isDark ? 'rgba(255,68,68,0.08)' : 'rgba(255,68,68,0.05)'}
              borderColor="rgba(255,68,68,0.18)"
              colors={colors} delay={330}
            />
            <RiskTip
              icon="📊"
              title="Track Everything"
              desc="Accurate records reveal patterns you can't see in your head"
              color={C.profit}
              bg={isDark ? 'rgba(0,191,111,0.08)' : 'rgba(0,191,111,0.05)'}
              borderColor="rgba(0,191,111,0.18)"
              colors={colors} delay={365}
            />
          </View>
        </Animated.View>

        <View style={{ height: 120 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── STYLES ──────────────────────────────────────────────────────
const s = StyleSheet.create({
  screen:  { flex: 1 },
  topBar:  { paddingHorizontal: 16, paddingTop: 12,
             paddingBottom: 14, borderBottomWidth: 0.5 },
  title:   { fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
  sub:     { fontSize: 11, fontWeight: '600', marginTop: 2 },
  content: { padding: 16, gap: 14 },

  // Hero
  hero: {
    borderRadius: 28, padding: 22, borderWidth: 1,
    overflow: 'hidden', position: 'relative',
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08, shadowRadius: 14, elevation: 4,
  },
  ambientStrip: {
    position: 'absolute', top: 0, left: 0, right: 0, height: 90,
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
  },
  heroEyebrow: {
    fontSize: 10, fontWeight: '700',
    letterSpacing: 1.4, textTransform: 'uppercase', marginBottom: 6,
  },
  heroAmount: {
    fontSize: 44, fontWeight: '800',
    letterSpacing: -2, lineHeight: 50, marginBottom: 14,
  },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  pill:    { paddingHorizontal: 11, paddingVertical: 5,
             borderRadius: 999, borderWidth: 1 },
  pillTxt: { fontSize: 11, fontWeight: '700' },

  // Stats row
  statsRow: { flexDirection: 'row', gap: 10 },

  // Card
  card: {
    borderRadius: 24, padding: 18, borderWidth: 1,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 10, elevation: 2,
  },
  cardHead:    { flexDirection: 'row', alignItems: 'center',
                 gap: 12, marginBottom: 16 },
  cardIconWrap:{ width: 44, height: 44, borderRadius: 14,
                 alignItems: 'center', justifyContent: 'center' },
  cardTitle:   { fontSize: 16, fontWeight: '700', marginBottom: 2 },
  cardSub:     { fontSize: 12, fontWeight: '500' },

  // Input
  inputLabel: { fontSize: 9, fontWeight: '700', textTransform: 'uppercase',
                letterSpacing: 1.2, marginBottom: 10 },
  inputWrap:  { flexDirection: 'row', alignItems: 'center',
                borderRadius: 16, borderWidth: 1,
                paddingHorizontal: 16, height: 56, gap: 6 },
  inputPrefix:{ fontSize: 20, fontWeight: '600' },
  input:      { flex: 1, fontSize: 20, fontWeight: '700' },

  // Hint
  hint:    { flexDirection: 'row', alignItems: 'center', gap: 8,
             borderRadius: 14, padding: 12, marginTop: 12, borderWidth: 1 },
  hintTxt: { flex: 1, fontSize: 12, fontWeight: '600', lineHeight: 17 },

  // Save button
  saveBtn: {
    borderRadius: 999, paddingVertical: 15,
    alignItems: 'center', marginTop: 16,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3, shadowRadius: 12, elevation: 6,
  },
  saveBtnTxt: { color: '#fff', fontSize: 15, fontWeight: '800' },

  // Section label
  sectionLabel: {
    fontSize: 10, fontWeight: '700', textTransform: 'uppercase',
    letterSpacing: 1.3, marginBottom: 10,
  },
});
