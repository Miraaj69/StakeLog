// BankrollScreen.js — Premium redesign
import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTheme } from './useTheme';
import { useStore, useStats } from './store';
import Chart from './Chart';
import { formatMoney, calcBankrollSeries, calcPnLTimeSeries, getCurrencySymbol } from './calculations';

export default function BankrollScreen() {
  const { colors } = useTheme();
  const bets        = useStore(s => s.bets);
  const bankrollStart = useStore(s => s.bankrollStart);
  const currency    = useStore(s => s.currency);
  const saveBankroll = useStore(s => s.saveBankroll);
  const stats       = useStats();

  const [inputVal, setInputVal] = useState('');
  const currSym = getCurrencySymbol(currency);

  const bankrollData = useMemo(() => calcBankrollSeries(bets, bankrollStart), [bets, bankrollStart]);
  const pnlData      = useMemo(() => calcPnLTimeSeries(bets), [bets]);
  const positive     = stats.totalPnL >= 0;
  const suggestStake = stats.currentBalance > 0 ? stats.currentBalance * 0.02 : null;

  const handleSave = () => {
    const v = parseFloat(inputVal);
    if (!isNaN(v) && v >= 0) {
      saveBankroll(v);
      setInputVal('');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  return (
    <SafeAreaView style={[st.screen, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[st.topBar, { borderBottomColor: colors.border }]}>
        <Text style={[st.title, { color: colors.textPrimary }]}>Bankroll</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={st.content}>

        {/* ── Hero card ── */}
        <Animated.View entering={FadeInDown.delay(40).springify()}>
          <LinearGradient
            colors={positive ? ['#0F4C2A', '#1A7A40'] : ['#5C0A0A', '#9B1C1C']}
            style={st.hero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
            <Text style={st.heroLabel}>CURRENT BALANCE</Text>
            <Text style={st.heroAmount}>{formatMoney(stats.currentBalance, currSym)}</Text>
            <View style={st.heroPills}>
              {stats.roi && (
                <View style={st.heroPill}>
                  <Text style={st.heroPillTxt}>
                    {parseFloat(stats.roi) >= 0 ? '↑' : '↓'} {parseFloat(stats.roi) >= 0 ? '+' : ''}{stats.roi}% ROI
                  </Text>
                </View>
              )}
              <View style={st.heroPill}>
                <Text style={st.heroPillTxt}>Started {formatMoney(bankrollStart, currSym)}</Text>
              </View>
            </View>
            {bankrollData.length >= 2 && (
              <View style={{ marginTop: 14, opacity: 0.85 }}>
                <Chart data={bankrollData} color="rgba(255,255,255,0.85)" height={70} currSym={currSym} />
              </View>
            )}
          </LinearGradient>
        </Animated.View>

        {/* ── Stats row — 3 consistent cards ── */}
        <Animated.View entering={FadeInDown.delay(90).springify()} style={st.statsRow}>
          {/* Starting */}
          <View style={[st.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[st.statLbl, { color: colors.textTertiary }]}>STARTING</Text>
            <Text style={[st.statVal, { color: colors.textPrimary }]}>{formatMoney(bankrollStart, currSym)}</Text>
          </View>

          {/* Total P&L — highlighted */}
          <View style={[
            st.statCard,
            st.statCardCenter,
            { backgroundColor: positive ? '#E8F8EE' : '#FDECEA', borderColor: positive ? '#A7DFB9' : '#F5B8B2' },
          ]}>
            <Text style={[st.statLbl, { color: positive ? '#1A9E4A' : '#D93025' }]}>TOTAL P&L</Text>
            <Text style={[st.statValLg, { color: positive ? '#1A9E4A' : '#D93025' }]}>
              {stats.totalPnL >= 0 ? '+' : ''}{formatMoney(stats.totalPnL, currSym)}
            </Text>
            {stats.roi && (
              <Text style={[st.statSub, { color: positive ? '#1A9E4A' : '#D93025' }]}>
                {positive ? '↑' : '↓'} {stats.roi}%
              </Text>
            )}
          </View>

          {/* ROI */}
          <View style={[st.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[st.statLbl, { color: colors.textTertiary }]}>ROI</Text>
            <Text style={[st.statVal, { color: stats.roi && parseFloat(stats.roi) >= 0 ? '#1A9E4A' : '#D93025' }]}>
              {stats.roi ? `${parseFloat(stats.roi) >= 0 ? '+' : ''}${stats.roi}%` : '—'}
            </Text>
          </View>
        </Animated.View>

        {/* ── Set bankroll ── */}
        <Animated.View entering={FadeInDown.delay(140).springify()} style={[st.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={st.cardHeader}>
            <Text style={st.cardIcon}>💰</Text>
            <View>
              <Text style={[st.cardTitle, { color: colors.textPrimary }]}>Starting Bankroll</Text>
              <Text style={[st.cardDesc, { color: colors.textTertiary }]}>Track ROI and stake suggestions</Text>
            </View>
          </View>

          <Text style={[st.inputLabel, { color: colors.textSecondary }]}>AMOUNT ({currSym})</Text>
          <View style={[st.inputWrap, { backgroundColor: colors.surfaceVariant, borderColor: colors.border }]}>
            <Text style={[st.inputPrefix, { color: colors.textTertiary }]}>{currSym}</Text>
            <TextInput
              style={[st.input, { color: colors.textPrimary }]}
              value={inputVal}
              onChangeText={setInputVal}
              placeholder={bankrollStart > 0 ? String(bankrollStart) : '10000'}
              placeholderTextColor={colors.textTertiary}
              keyboardType="decimal-pad"
            />
          </View>

          {suggestStake && (
            <View style={st.hint}>
              <Text style={st.hintTxt}>💡 Suggested stake: {formatMoney(suggestStake, currSym)} per bet (2% rule)</Text>
            </View>
          )}

          <Pressable onPress={handleSave} style={st.saveBtn}>
            <Text style={st.saveBtnTxt}>Save Bankroll</Text>
          </Pressable>
        </Animated.View>

        {/* ── P&L Chart ── */}
        {pnlData.length >= 2 && (
          <Animated.View entering={FadeInDown.delay(190).springify()} style={[st.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[st.cardTitle, { color: colors.textPrimary }]}>📈 P&L Over Time</Text>
            <Text style={[st.cardDesc, { color: colors.textTertiary, marginBottom: 12 }]}>Drag to explore</Text>
            <Chart data={pnlData} color={positive ? '#1A9E4A' : '#D93025'} height={130} currSym={currSym} showLabels />
          </Animated.View>
        )}

        {/* ── Risk Management ── */}
        <Animated.View entering={FadeInDown.delay(230).springify()} style={[st.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[st.cardTitle, { color: colors.textPrimary }]}>🛡 Risk Management</Text>
          {[
            { icon: '💡', title: '2% Rule', desc: 'Never stake more than 2% of your bankroll on a single bet' },
            { icon: '📐', title: 'Kelly Criterion', desc: 'Adjust stake size based on your estimated edge' },
            { icon: '🛑', title: 'Stop Loss', desc: 'Set a daily/weekly loss limit and stick to it' },
          ].map((tip, i) => (
            <View key={tip.title} style={[st.tipRow, { borderTopColor: colors.border, borderTopWidth: i === 0 ? 0 : 0.5 }]}>
              <Text style={st.tipIcon}>{tip.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={[st.tipTitle, { color: colors.textPrimary }]}>{tip.title}</Text>
                <Text style={[st.tipDesc, { color: colors.textSecondary }]}>{tip.desc}</Text>
              </View>
            </View>
          ))}
        </Animated.View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  screen: { flex: 1 },
  topBar: { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 0.5 },
  title: { fontSize: 22, fontWeight: '700' },
  content: { padding: 16, gap: 14 },

  hero: { borderRadius: 24, padding: 22, shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.15, shadowRadius: 16, elevation: 8 },
  heroLabel: { fontSize: 10, color: 'rgba(255,255,255,0.6)', fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 6 },
  heroAmount: { fontSize: 40, fontWeight: '800', color: '#fff', letterSpacing: -1.5 },
  heroPills: { flexDirection: 'row', gap: 8, marginTop: 10, flexWrap: 'wrap' },
  heroPill: { backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 5 },
  heroPillTxt: { color: '#fff', fontSize: 12, fontWeight: '700' },

  statsRow: { flexDirection: 'row', gap: 10 },
  statCard: {
    flex: 1, borderRadius: 16, padding: 14, borderWidth: 0.5,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1,
  },
  statCardCenter: { flex: 1.2 },
  statLbl: { fontSize: 9, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 5 },
  statVal: { fontSize: 17, fontWeight: '800', letterSpacing: -0.5 },
  statValLg: { fontSize: 20, fontWeight: '900', letterSpacing: -0.8 },
  statSub: { fontSize: 11, fontWeight: '700', marginTop: 3 },

  card: { borderRadius: 20, padding: 16, borderWidth: 0.5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  cardIcon: { fontSize: 26 },
  cardTitle: { fontSize: 16, fontWeight: '700', marginBottom: 2 },
  cardDesc: { fontSize: 12, fontWeight: '500' },

  inputLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 8 },
  inputWrap: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, borderWidth: 0.5, paddingHorizontal: 14, height: 52, gap: 4 },
  inputPrefix: { fontSize: 18, fontWeight: '600' },
  input: { flex: 1, fontSize: 18, fontWeight: '700' },

  hint: { backgroundColor: '#EEF2FF', borderRadius: 10, padding: 10, marginTop: 10 },
  hintTxt: { fontSize: 12, color: '#4F46E5', fontWeight: '600' },

  saveBtn: { backgroundColor: '#E50914', borderRadius: 999, paddingVertical: 14, alignItems: 'center', marginTop: 14, shadowColor: '#E50914', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 5 },
  saveBtnTxt: { color: '#fff', fontSize: 15, fontWeight: '800' },

  tipRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-start', paddingVertical: 12 },
  tipIcon: { fontSize: 18, width: 28, textAlign: 'center', marginTop: 1 },
  tipTitle: { fontSize: 14, fontWeight: '700', marginBottom: 2 },
  tipDesc: { fontSize: 12, lineHeight: 18 },
});
