// BankrollScreen.js — Premium v2: Blue hero, Kelly advisor, goal setting
import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTheme } from './useTheme';
import { useStore, useStats } from './store';
import Chart from './Chart';
import { formatMoney, calcBankrollSeries, calcPnLTimeSeries, getCurrencySymbol } from './calculations';

export default function BankrollScreen() {
  var { colors, isDark } = useTheme();
  var bets           = useStore(function(s) { return s.bets; });
  var bankrollStart  = useStore(function(s) { return s.bankrollStart; });
  var currency       = useStore(function(s) { return s.currency; });
  var monthlyGoal    = useStore(function(s) { return s.monthlyGoal; });
  var weeklyGoal     = useStore(function(s) { return s.weeklyGoal; });
  var saveBankroll   = useStore(function(s) { return s.saveBankroll; });
  var setMonthlyGoal = useStore(function(s) { return s.setMonthlyGoal; });
  var setWeeklyGoal  = useStore(function(s) { return s.setWeeklyGoal; });
  var stats          = useStats();
  var currSym        = getCurrencySymbol(currency);

  var [inputVal,    setInputVal]    = useState('');
  var [goalInput,   setGoalInput]   = useState('');
  var [wGoalInput,  setWGoalInput]  = useState('');
  var [riskPct,     setRiskPct]     = useState(2);

  var bankrollData = useMemo(function() { return calcBankrollSeries(bets, bankrollStart); }, [bets, bankrollStart]);
  var isProfit     = stats.totalPnL >= 0;
  var suggested    = stats.currentBalance > 0 ? stats.currentBalance * (riskPct / 100) : null;

  var handleSave = function() {
    var v = parseFloat(inputVal);
    if (!isNaN(v) && v >= 0) {
      saveBankroll(v);
      setInputVal('');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Saved ✓', 'Starting bankroll updated.');
    }
  };

  var handleGoalSave = function() {
    var mg = parseFloat(goalInput);
    var wg = parseFloat(wGoalInput);
    if (!isNaN(mg) && mg >= 0) setMonthlyGoal(mg);
    if (!isNaN(wg) && wg >= 0) setWeeklyGoal(wg);
    setGoalInput('');
    setWGoalInput('');
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert('Goals Set ✓', 'Your betting goals are updated.');
  };

  return (
    <SafeAreaView style={[s.screen, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[s.topBar, { borderBottomColor: colors.border }]}>
        <Text style={[s.title, { color: colors.textPrimary }]}>Bankroll</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>

        {/* ── Hero — Blue gradient ── */}
        <Animated.View entering={FadeInDown.delay(40).springify()} style={{ margin: 16 }}>
          <LinearGradient
            colors={isDark ? ['#0F1F3D', '#0A1628'] : ['#EFF6FF', '#DBEAFE']}
            style={[s.hero, { borderColor: isDark ? 'rgba(96,165,250,0.25)' : 'rgba(59,130,246,0.2)' }]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          >
            <Text style={[s.heroLabel, { color: isDark ? 'rgba(147,197,253,0.7)' : 'rgba(37,99,235,0.6)' }]}>CURRENT BALANCE</Text>
            <Text style={[s.heroAmount, { color: isDark ? '#60A5FA' : '#1D4ED8' }]}>
              {formatMoney(stats.currentBalance, currSym)}
            </Text>
            <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
              {stats.roi && (
                <View style={[s.heroPill, { backgroundColor: isDark ? 'rgba(96,165,250,0.12)' : 'rgba(59,130,246,0.10)', borderColor: isDark ? 'rgba(96,165,250,0.25)' : 'rgba(59,130,246,0.2)' }]}>
                  <Text style={[s.heroPillTxt, { color: isDark ? '#93C5FD' : '#1D4ED8' }]}>
                    {isProfit ? '↑' : '↓'} {isProfit ? '+' : ''}{stats.roi}% ROI
                  </Text>
                </View>
              )}
              <View style={[s.heroPill, { backgroundColor: isDark ? 'rgba(96,165,250,0.10)' : 'rgba(59,130,246,0.08)', borderColor: isDark ? 'rgba(96,165,250,0.2)' : 'rgba(59,130,246,0.15)' }]}>
                <Text style={[s.heroPillTxt, { color: isDark ? '#93C5FD' : '#1D4ED8' }]}>
                  Started {formatMoney(bankrollStart, currSym)}
                </Text>
              </View>
            </View>
            {bankrollData.length >= 2 && (
              <View style={{ marginTop: 14, opacity: 0.85 }}>
                <Chart data={bankrollData} color={isDark ? 'rgba(96,165,250,0.9)' : '#1D4ED8'} height={70} currSym={currSym} />
              </View>
            )}
          </LinearGradient>
        </Animated.View>

        {/* ── Stats row ── */}
        <Animated.View entering={FadeInDown.delay(80).springify()} style={{ flexDirection: 'row', gap: 8, marginHorizontal: 16, marginBottom: 12 }}>
          <View style={[s.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[s.statLbl, { color: colors.textTertiary }]}>STARTING</Text>
            <Text style={[s.statVal, { color: colors.textPrimary }]}>{formatMoney(bankrollStart, currSym)}</Text>
          </View>
          <View style={[s.statCard, { backgroundColor: isProfit ? (isDark ? 'rgba(74,222,128,0.08)' : '#F0FBF4') : (isDark ? 'rgba(248,113,113,0.08)' : '#FDF2F2'), borderColor: isProfit ? (isDark ? 'rgba(74,222,128,0.22)' : '#A7DFB9') : (isDark ? 'rgba(248,113,113,0.22)' : '#FCA5A5') }]}>
            <Text style={[s.statLbl, { color: isProfit ? '#4ADE80' : '#F87171' }]}>NET P&L</Text>
            <Text style={[s.statVal, { color: isProfit ? '#4ADE80' : '#F87171' }]}>
              {isProfit ? '+' : ''}{formatMoney(stats.totalPnL, currSym)}
            </Text>
          </View>
          <View style={[s.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[s.statLbl, { color: colors.textTertiary }]}>WIN RATE</Text>
            <Text style={[s.statVal, { color: '#7C6BFF' }]}>{stats.winRate || '—'}%</Text>
          </View>
        </Animated.View>

        {/* ── Kelly Stake Advisor ── */}
        <Animated.View entering={FadeInDown.delay(120).springify()}
          style={[s.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[s.cardTitle, { color: colors.textPrimary }]}>Kelly Stake Advisor</Text>
          <Text style={[s.cardSub, { color: colors.textTertiary }]}>Optimal stake based on your bankroll & risk tolerance</Text>

          {/* Risk % slider simulation */}
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 12, marginBottom: 16 }}>
            {[1, 2, 3, 4, 5].map(function(pct) {
              return (
                <Pressable key={pct} onPress={() => { setRiskPct(pct); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                  style={[s.riskBtn, {
                    backgroundColor: riskPct === pct ? '#7C6BFF' : (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'),
                    borderColor: riskPct === pct ? '#7C6BFF' : colors.border,
                    flex: 1,
                  }]}>
                  <Text style={[s.riskBtnTxt, { color: riskPct === pct ? '#fff' : colors.textTertiary }]}>{pct}%</Text>
                </Pressable>
              );
            })}
          </View>

          {suggested && (
            <View style={[s.suggestBox, { backgroundColor: isDark ? 'rgba(74,222,128,0.07)' : '#F0FBF4', borderColor: isDark ? 'rgba(74,222,128,0.22)' : '#A7DFB9' }]}>
              <Text style={[s.suggestLabel, { color: isDark ? 'rgba(74,222,128,0.7)' : '#15803D' }]}>SUGGESTED STAKE</Text>
              <Text style={[s.suggestVal, { color: '#4ADE80' }]}>{formatMoney(suggested, currSym)}</Text>
              <Text style={[s.suggestSub, { color: colors.textTertiary }]}>{riskPct}% of {formatMoney(stats.currentBalance, currSym)}</Text>
            </View>
          )}

          <Text style={[s.kellyTip, { color: colors.textTertiary }]}>
            {riskPct <= 1 ? '🐢 Conservative — safe for beginners' :
             riskPct <= 2 ? '⚖️ Balanced — recommended for most bettors' :
             riskPct <= 3 ? '🔥 Aggressive — only if win rate >55%' :
             '⚠️ Very high risk — experienced bettors only'}
          </Text>
        </Animated.View>

        {/* ── Goal System ── */}
        <Animated.View entering={FadeInDown.delay(160).springify()}
          style={[s.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[s.cardTitle, { color: colors.textPrimary }]}>Set Betting Goals 🎯</Text>
          <Text style={[s.cardSub, { color: colors.textTertiary }]}>Track progress towards your targets</Text>

          {/* Current goals */}
          {(monthlyGoal > 0 || weeklyGoal > 0) && (
            <View style={{ marginTop: 12, marginBottom: 16, gap: 10 }}>
              {monthlyGoal > 0 && (
                <View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                    <Text style={[s.goalName, { color: colors.textSecondary }]}>Monthly Goal</Text>
                    <Text style={[s.goalPct, { color: '#7C6BFF' }]}>{Math.round(Math.min(100, (stats.monthPnL / monthlyGoal) * 100))}%</Text>
                  </View>
                  <View style={[s.goalBarBg, { backgroundColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)' }]}>
                    <View style={[s.goalBarFill, { width: Math.min(100, Math.max(0, (stats.monthPnL / monthlyGoal) * 100)) + '%', backgroundColor: '#7C6BFF' }]} />
                  </View>
                  <Text style={[s.goalMeta, { color: colors.textTertiary }]}>
                    {formatMoney(stats.monthPnL, currSym)} / {formatMoney(monthlyGoal, currSym)}
                  </Text>
                </View>
              )}
              {weeklyGoal > 0 && (
                <View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                    <Text style={[s.goalName, { color: colors.textSecondary }]}>Weekly Goal</Text>
                    <Text style={[s.goalPct, { color: '#4ADE80' }]}>{Math.round(Math.min(100, (stats.weekPnL / weeklyGoal) * 100))}%</Text>
                  </View>
                  <View style={[s.goalBarBg, { backgroundColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)' }]}>
                    <View style={[s.goalBarFill, { width: Math.min(100, Math.max(0, (stats.weekPnL / weeklyGoal) * 100)) + '%', backgroundColor: '#4ADE80' }]} />
                  </View>
                  <Text style={[s.goalMeta, { color: colors.textTertiary }]}>
                    {formatMoney(stats.weekPnL, currSym)} / {formatMoney(weeklyGoal, currSym)}
                  </Text>
                </View>
              )}
            </View>
          )}

          <View style={{ gap: 10, marginTop: 12 }}>
            <View style={[s.inputRow, { borderColor: colors.border, backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : colors.surfaceVariant }]}>
              <Text style={[s.inputLabel, { color: colors.textTertiary }]}>Monthly</Text>
              <TextInput
                style={[s.inputField, { color: colors.textPrimary }]}
                value={goalInput} onChangeText={setGoalInput}
                placeholder={monthlyGoal > 0 ? String(monthlyGoal) : 'e.g. 5000'}
                placeholderTextColor={colors.textTertiary}
                keyboardType="numeric"
              />
              <Text style={[s.inputSym, { color: colors.textTertiary }]}>{currSym}</Text>
            </View>
            <View style={[s.inputRow, { borderColor: colors.border, backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : colors.surfaceVariant }]}>
              <Text style={[s.inputLabel, { color: colors.textTertiary }]}>Weekly</Text>
              <TextInput
                style={[s.inputField, { color: colors.textPrimary }]}
                value={wGoalInput} onChangeText={setWGoalInput}
                placeholder={weeklyGoal > 0 ? String(weeklyGoal) : 'e.g. 1000'}
                placeholderTextColor={colors.textTertiary}
                keyboardType="numeric"
              />
              <Text style={[s.inputSym, { color: colors.textTertiary }]}>{currSym}</Text>
            </View>
            <Pressable onPress={handleGoalSave} style={s.saveBtn}>
              <Text style={s.saveBtnTxt}>Save Goals</Text>
            </Pressable>
          </View>
        </Animated.View>

        {/* ── Update Bankroll ── */}
        <Animated.View entering={FadeInDown.delay(200).springify()}
          style={[s.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[s.cardTitle, { color: colors.textPrimary }]}>Update Starting Bankroll</Text>
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
            <View style={[s.inputRow, { flex: 1, borderColor: colors.border, backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : colors.surfaceVariant }]}>
              <Text style={[s.inputSym, { color: colors.textTertiary }]}>{currSym}</Text>
              <TextInput
                style={[s.inputField, { color: colors.textPrimary, flex: 1 }]}
                value={inputVal} onChangeText={setInputVal}
                placeholder="Enter amount"
                placeholderTextColor={colors.textTertiary}
                keyboardType="numeric"
              />
            </View>
            <Pressable onPress={handleSave} style={[s.saveBtn, { flex: 0, paddingHorizontal: 20 }]}>
              <Text style={s.saveBtnTxt}>Save</Text>
            </Pressable>
          </View>
        </Animated.View>

      </ScrollView>
    </SafeAreaView>
  );
}

var s = StyleSheet.create({
  screen: { flex: 1 },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 0.5 },
  title:  { fontSize: 24, fontWeight: '800', letterSpacing: -0.6 },

  hero:       { borderRadius: 28, padding: 22, borderWidth: 0.5, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.10, shadowRadius: 20, elevation: 6 },
  heroLabel:  { fontSize: 9, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 8 },
  heroAmount: { fontSize: 40, fontWeight: '800', letterSpacing: -1.5, marginBottom: 14 },
  heroPill:   { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 999, borderWidth: 0.5 },
  heroPillTxt:{ fontSize: 12, fontWeight: '700' },

  statCard: { flex: 1, borderRadius: 18, padding: 13, borderWidth: 0.5 },
  statLbl:  { fontSize: 9, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 5 },
  statVal:  { fontSize: 15, fontWeight: '800', letterSpacing: -0.4 },

  card:      { marginHorizontal: 16, marginBottom: 12, borderRadius: 22, padding: 18, borderWidth: 0.5 },
  cardTitle: { fontSize: 16, fontWeight: '700', marginBottom: 3 },
  cardSub:   { fontSize: 12, lineHeight: 17 },

  riskBtn:    { paddingVertical: 10, borderRadius: 12, borderWidth: 0.5, alignItems: 'center' },
  riskBtnTxt: { fontSize: 13, fontWeight: '700' },

  suggestBox:   { borderRadius: 16, padding: 16, borderWidth: 0.5, alignItems: 'center', marginBottom: 12 },
  suggestLabel: { fontSize: 9, fontWeight: '700', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 6 },
  suggestVal:   { fontSize: 32, fontWeight: '800', letterSpacing: -1 },
  suggestSub:   { fontSize: 11, marginTop: 4 },
  kellyTip:     { fontSize: 12, fontWeight: '600', textAlign: 'center', lineHeight: 18 },

  goalName:    { fontSize: 13, fontWeight: '700' },
  goalPct:     { fontSize: 13, fontWeight: '800' },
  goalBarBg:   { borderRadius: 999, height: 7, overflow: 'hidden', marginBottom: 4 },
  goalBarFill: { height: '100%', borderRadius: 999 },
  goalMeta:    { fontSize: 11, fontWeight: '600' },

  inputRow:   { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 14, borderWidth: 0.5, paddingHorizontal: 14, height: 50 },
  inputLabel: { fontSize: 12, fontWeight: '700', minWidth: 50 },
  inputField: { flex: 1, fontSize: 15, fontWeight: '600' },
  inputSym:   { fontSize: 16, fontWeight: '700' },
  saveBtn:    { backgroundColor: '#7C6BFF', borderRadius: 14, paddingVertical: 14, alignItems: 'center', justifyContent: 'center', shadowColor: '#7C6BFF', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 5 },
  saveBtnTxt: { color: '#fff', fontWeight: '700', fontSize: 14 },
});
