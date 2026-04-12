// screens/BankrollScreen.js
import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTheme } from './useTheme';
import { useBets } from './useBets';
import Chart from './Chart';
import InputField from './InputField';
import { formatMoney, calcBankrollSeries, calcPnLTimeSeries, getCurrencySymbol } from './calculations';
import { Spacing, Radius, Typography, Shadows } from './theme';

export default function BankrollScreen() {
  const { colors } = useTheme();
  const { bets, bankrollStart, stats, saveBankroll } = useBets();
  const [currency] = useState('INR');
  const [hidden] = useState(false);
  const [editing, setEditing] = useState(false);
  const [inputVal, setInputVal] = useState('');
  const currSym = getCurrencySymbol(currency);

  const bankrollData = useMemo(() => calcBankrollSeries(bets, bankrollStart), [bets, bankrollStart]);
  const pnlData = useMemo(() => calcPnLTimeSeries(bets), [bets]);
  const roi = useMemo(() => bankrollStart > 0 ? ((stats.totalPnL / bankrollStart) * 100).toFixed(1) : null, [stats.totalPnL, bankrollStart]);
  const positive = stats.currentBalance >= (bankrollStart || 0);
  const suggestStake = stats.currentBalance > 0 ? stats.currentBalance * 0.02 : null;

  const s = styles(colors);

  return (
    <SafeAreaView style={[s.screen, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[s.topBar, { borderBottomColor: colors.border }]}>
        <Text style={[s.screenTitle, { color: colors.textPrimary }]}>Bankroll</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.content}>

        {/* Hero balance card */}
        <Animated.View entering={FadeInDown.delay(50).springify()}>
          <LinearGradient
            colors={positive ? ['#1B5E20', '#2E7D32'] : ['#7F0000', '#B71C1C']}
            style={s.heroCard} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
            <Text style={s.heroLabel}>CURRENT BALANCE</Text>
            <Text style={s.heroAmount}>
              {hidden ? `${currSym} ••••••` : formatMoney(stats.currentBalance, currSym)}
            </Text>
            <View style={s.heroPills}>
              {roi && <View style={s.heroPill}><Text style={s.heroPillText}>{parseFloat(roi) >= 0 ? '+' : ''}{roi}% ROI</Text></View>}
              <View style={s.heroPill}><Text style={s.heroPillText}>Started: {formatMoney(bankrollStart, currSym)}</Text></View>
            </View>
            {bankrollData.length >= 2 && (
              <View style={{ marginTop: 12, opacity: 0.9 }}>
                <Chart data={bankrollData} color="rgba(255,255,255,0.8)" height={70} currSym={currSym} />
              </View>
            )}
          </LinearGradient>
        </Animated.View>

        {/* Stats grid */}
        <Animated.View entering={FadeInDown.delay(100).springify()} style={s.statsGrid}>
          {[
            { label: 'Starting', value: hidden ? `${currSym}••••` : formatMoney(bankrollStart, currSym), bg: colors.surfaceVariant, color: colors.textSecondary },
            { label: 'Total P&L', value: hidden ? `${currSym}••••` : (stats.totalPnL >= 0 ? '+' : '') + formatMoney(stats.totalPnL, currSym), bg: stats.totalPnL >= 0 ? colors.profitContainer : colors.lossContainer, color: stats.totalPnL >= 0 ? colors.profit : colors.loss },
            { label: 'ROI', value: roi ? `${parseFloat(roi) >= 0 ? '+' : ''}${roi}%` : '—', bg: colors.surface, color: roi && parseFloat(roi) >= 0 ? colors.profit : colors.loss },
          ].map((item, i) => (
            <View key={item.label} style={[s.statCard, { backgroundColor: item.bg }]}>
              <Text style={[s.statValue, { color: item.color }]}>{item.value}</Text>
              <Text style={[s.statLabel, { color: item.color, opacity: 0.75 }]}>{item.label}</Text>
            </View>
          ))}
        </Animated.View>

        {/* Set bankroll */}
        <Animated.View entering={FadeInDown.delay(150).springify()} style={[s.card, { backgroundColor: colors.surface }]}>
          <Text style={[s.cardTitle, { color: colors.textPrimary }]}>💰 Starting Bankroll</Text>
          <Text style={[s.cardDesc, { color: colors.textTertiary }]}>Set your initial bankroll to track ROI accurately</Text>
          <InputField
            label={`Amount (${currSym})`}
            value={inputVal || String(bankrollStart || '')}
            onChangeText={setInputVal}
            keyboardType="decimal-pad"
            placeholder="e.g. 10000"
          />
          {suggestStake && (
            <View style={[s.suggestionBadge, { backgroundColor: colors.primaryContainer }]}>
              <Text style={[s.suggestionText, { color: colors.primary }]}>
                💡 Suggested stake per bet: {formatMoney(suggestStake, currSym)} (2% rule)
              </Text>
            </View>
          )}
          <Pressable onPress={() => { const v = parseFloat(inputVal); if (!isNaN(v) && v >= 0) { saveBankroll(v); setInputVal(''); } }}
            style={[s.saveBtn, { backgroundColor: colors.primary }]}>
            <Text style={s.saveBtnText}>Save Bankroll</Text>
          </Pressable>
        </Animated.View>

        {/* P&L chart */}
        {pnlData.length >= 2 && (
          <Animated.View entering={FadeInDown.delay(200).springify()} style={[s.card, { backgroundColor: colors.surface }]}>
            <Text style={[s.cardTitle, { color: colors.textPrimary }]}>📈 P&L Over Time</Text>
            <Text style={[s.cardDesc, { color: colors.textTertiary }]}>Tap & drag to explore values</Text>
            <Chart data={pnlData} color={stats.totalPnL >= 0 ? colors.profit : colors.loss} height={130} currSym={currSym} showLabels />
          </Animated.View>
        )}

        {/* Risk management tips */}
        <Animated.View entering={FadeInDown.delay(250).springify()} style={[s.card, { backgroundColor: colors.surface }]}>
          <Text style={[s.cardTitle, { color: colors.textPrimary }]}>🛡️ Risk Management</Text>
          {[
            { title: '2% Rule', desc: 'Never stake more than 2% of your bankroll on a single bet', icon: '💡' },
            { title: 'Kelly Criterion', desc: 'Adjust stake size based on your estimated edge', icon: '📐' },
            { title: 'Stop Loss', desc: 'Set a daily/weekly loss limit and stick to it', icon: '🛑' },
          ].map(tip => (
            <View key={tip.title} style={[s.tipRow, { borderLeftColor: colors.primary }]}>
              <Text style={s.tipIcon}>{tip.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={[s.tipTitle, { color: colors.textPrimary }]}>{tip.title}</Text>
                <Text style={[s.tipDesc, { color: colors.textSecondary }]}>{tip.desc}</Text>
              </View>
            </View>
          ))}
        </Animated.View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = (colors) => StyleSheet.create({
  screen: { flex: 1 },
  topBar: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderBottomWidth: 1 },
  screenTitle: { ...Typography.h2 },
  content: { padding: Spacing.md, gap: Spacing.md },
  heroCard: { borderRadius: Radius.xxl, padding: Spacing.lg, ...Shadows.lg },
  heroLabel: { fontSize: 11, color: 'rgba(255,255,255,0.7)', fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 6 },
  heroAmount: { fontSize: 38, fontWeight: '900', color: '#fff', letterSpacing: -1.5 },
  heroPills: { flexDirection: 'row', gap: 8, marginTop: 10 },
  heroPill: { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: Radius.full, paddingHorizontal: 10, paddingVertical: 4 },
  heroPillText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  statsGrid: { flexDirection: 'row', gap: Spacing.sm },
  statCard: { flex: 1, borderRadius: Radius.xl, padding: Spacing.md, ...Shadows.sm },
  statValue: { fontSize: 18, fontWeight: '900', letterSpacing: -0.5 },
  statLabel: { ...Typography.micro, textTransform: 'uppercase', marginTop: 3 },
  card: { borderRadius: Radius.xl, padding: Spacing.md, ...Shadows.sm },
  cardTitle: { ...Typography.h4, marginBottom: 4 },
  cardDesc: { ...Typography.caption, marginBottom: Spacing.md },
  suggestionBadge: { borderRadius: Radius.md, padding: Spacing.sm, marginTop: Spacing.sm },
  suggestionText: { ...Typography.caption, fontWeight: '600' },
  saveBtn: { borderRadius: Radius.full, paddingVertical: 13, alignItems: 'center', marginTop: Spacing.md, ...Shadows.primary },
  saveBtnText: { color: '#fff', ...Typography.label, fontWeight: '800' },
  tipRow: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'flex-start', paddingVertical: Spacing.sm, borderLeftWidth: 3, paddingLeft: Spacing.sm, marginBottom: Spacing.sm },
  tipIcon: { fontSize: 18, flexShrink: 0 },
  tipTitle: { ...Typography.label, fontWeight: '700', marginBottom: 2 },
  tipDesc: { ...Typography.caption, lineHeight: 17 },
});
