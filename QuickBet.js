// QuickBet.js — 2-second bet entry bottom sheet
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, Pressable, TextInput,
  Modal, TouchableWithoutFeedback, Keyboard,
  Platform, ScrollView, Animated as RNAnimated,
} from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, withTiming,
  interpolate, runOnJS,
} from 'react-native-reanimated';
import { PanGestureHandler, GestureHandlerRootView } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import { useTheme } from './useTheme';
import { formatMoney } from './calculations';

var STAKE_PRESETS = [100, 200, 500, 1000];
var ODDS_PRESETS  = [1.5, 1.8, 2.0, 2.5, 3.0];
var SHEET_HEIGHT  = 480;

// Animated toggle
function ResultToggle({ value, onChange, colors }) {
  var slideX = useSharedValue(value === 'Won' ? 0 : 1);

  useEffect(function() {
    slideX.value = withSpring(value === 'Won' ? 0 : 1, { damping: 18, stiffness: 200 });
  }, [value]);

  var sliderStyle = useAnimatedStyle(function() {
    return {
      transform: [{
        translateX: interpolate(slideX.value, [0, 1], [2, 130]),
      }],
      backgroundColor: value === 'Won' ? '#1A9E4A' : '#D93025',
    };
  });

  function tap(v) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onChange(v);
  }

  return (
    <View style={[tg.wrap, { backgroundColor: colors.surfaceVariant }]}>
      <Animated.View style={[tg.slider, sliderStyle]} />
      <Pressable onPress={() => tap('Won')}  style={tg.option}>
        <Text style={[tg.txt, { color: value === 'Won' ? '#fff' : colors.textTertiary, fontWeight: value==='Won'?'800':'500' }]}>✓  Won</Text>
      </Pressable>
      <Pressable onPress={() => tap('Lost')} style={tg.option}>
        <Text style={[tg.txt, { color: value === 'Lost' ? '#fff' : colors.textTertiary, fontWeight: value==='Lost'?'800':'500' }]}>✕  Lost</Text>
      </Pressable>
    </View>
  );
}
var tg = StyleSheet.create({
  wrap:   { flexDirection: 'row', borderRadius: 14, height: 46, position: 'relative', overflow: 'hidden' },
  slider: { position: 'absolute', top: 2, bottom: 2, width: '50%', borderRadius: 12 },
  option: { flex: 1, alignItems: 'center', justifyContent: 'center', zIndex: 1 },
  txt:    { fontSize: 14 },
});

// Live P&L preview
function PnLPreview({ stake, odds, result, currSym, colors }) {
  var s = parseFloat(stake);
  var o = parseFloat(odds);
  if (!s || !o || o <= 1) return null;

  var pnl = result === 'Won'
    ? s * (o - 1)
    : -s;
  var isPos = pnl > 0;

  // Number bounce animation
  var bounce = useSharedValue(0);
  useEffect(function() {
    bounce.value = withSpring(1, { damping: 8, stiffness: 300 }, function() {
      bounce.value = withSpring(0);
    });
  }, [pnl]);

  var bounceStyle = useAnimatedStyle(function() {
    return { transform: [{ scale: interpolate(bounce.value, [0, 1], [1, 1.08]) }] };
  });

  return (
    <Animated.View style={[pv.wrap, { backgroundColor: isPos?'#E8F8EE':'#FDECEA', borderColor: isPos?'#A7DFB9':'#F5B8B2' }, bounceStyle]}>
      <Text style={[pv.label, { color: isPos?'#1A9E4A':'#D93025' }]}>
        {result === 'Won' ? 'You will win' : 'You lost'}
      </Text>
      <Text style={[pv.amount, { color: isPos?'#1A9E4A':'#D93025' }]}>
        {isPos?'+':''}{formatMoney(pnl, currSym)}
      </Text>
      {result === 'Won' && (
        <Text style={[pv.returns, { color: '#1A9E4A' }]}>Returns {formatMoney(s + pnl, currSym)}</Text>
      )}
    </Animated.View>
  );
}
var pv = StyleSheet.create({
  wrap:    { borderRadius: 16, padding: 14, alignItems: 'center', borderWidth: 0.5, marginBottom: 16 },
  label:   { fontSize: 12, fontWeight: '600', marginBottom: 4, opacity: 0.8 },
  amount:  { fontSize: 28, fontWeight: '900', letterSpacing: -1 },
  returns: { fontSize: 11, marginTop: 2, opacity: 0.7 },
});

export default function QuickBet({ visible, onClose, onSave, currSym, suggestStake }) {
  currSym = currSym || '₹';
  var { colors } = useTheme();
  var [stake,  setStake]  = useState('');
  var [odds,   setOdds]   = useState('');
  var [result, setResult] = useState('Won');
  var stakeRef = useRef(null);

  // Sheet slide animation
  var sheetY = useSharedValue(SHEET_HEIGHT);
  var btnScale = useSharedValue(1);

  useEffect(function() {
    if (visible) {
      setStake(''); setOdds(''); setResult('Won');
      sheetY.value = withSpring(0, { damping: 20, stiffness: 200, mass: 0.8 });
      setTimeout(function() { if (stakeRef.current) stakeRef.current.focus(); }, 400);
    } else {
      sheetY.value = withTiming(SHEET_HEIGHT, { duration: 220 });
    }
  }, [visible]);

  var sheetStyle = useAnimatedStyle(function() {
    return { transform: [{ translateY: sheetY.value }] };
  });

  var btnAnimStyle = useAnimatedStyle(function() {
    return { transform: [{ scale: btnScale.value }] };
  });

  var canSave = stake && odds && parseFloat(odds) > 1 && parseFloat(stake) > 0;

  function handleSave() {
    if (!canSave) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    btnScale.value = withSpring(0.94, { damping: 12 }, function() {
      btnScale.value = withSpring(1);
    });
    onSave({
      stake: stake,
      odds:  odds,
      status: result,
      date:  new Date().toISOString().slice(0, 10),
      event: 'Quick Bet',
      bet:   'Quick entry',
      bookie: '',
      sport:  '',
      notes:  '',
      tags:   ['quick'],
      betType:'Single',
    });
    onClose();
  }

  function close() {
    Keyboard.dismiss();
    onClose();
  }

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={close}>
      <TouchableWithoutFeedback onPress={close}>
        <View style={qb.overlay}>
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <Animated.View style={[qb.sheet, { backgroundColor: colors.surface }, sheetStyle]}>
              {/* Handle */}
              <View style={[qb.handle, { backgroundColor: colors.border }]} />

              {/* Title */}
              <View style={qb.header}>
                <View>
                  <Text style={[qb.title, { color: colors.textPrimary }]}>⚡ Quick Bet</Text>
                  <Text style={[qb.sub, { color: colors.textTertiary }]}>2-second entry</Text>
                </View>
                <Pressable onPress={close} style={[qb.closeBtn, { backgroundColor: colors.surfaceVariant }]}>
                  <Text style={{ color: colors.textTertiary, fontSize: 16, fontWeight: '600' }}>✕</Text>
                </Pressable>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

                {/* Result toggle */}
                <View style={{ marginBottom: 16 }}>
                  <Text style={[qb.fieldLabel, { color: colors.textSecondary }]}>RESULT</Text>
                  <ResultToggle value={result} onChange={setResult} colors={colors} />
                </View>

                {/* Stake input */}
                <View style={{ marginBottom: 16 }}>
                  <Text style={[qb.fieldLabel, { color: colors.textSecondary }]}>STAKE ({currSym})</Text>
                  <View style={[qb.inputWrap, { backgroundColor: colors.surfaceVariant, borderColor: stake?'#FF3B30':colors.border }]}>
                    <Text style={[qb.inputPrefix, { color: colors.textTertiary }]}>{currSym}</Text>
                    <TextInput
                      ref={stakeRef}
                      style={[qb.input, { color: colors.textPrimary }]}
                      value={stake} onChangeText={setStake}
                      placeholder="0" placeholderTextColor={colors.textTertiary}
                      keyboardType="decimal-pad"
                    />
                    {suggestStake && !stake && (
                      <Pressable onPress={() => setStake(String(Math.round(suggestStake)))}
                        style={[qb.hintBtn, { backgroundColor: 'rgba(255,59,48,0.1)' }]}>
                        <Text style={{ color: '#FF3B30', fontSize: 11, fontWeight: '700' }}>2% rule</Text>
                      </Pressable>
                    )}
                  </View>
                  {/* Stake presets */}
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
                    <View style={qb.presets}>
                      {STAKE_PRESETS.map(function(p) {
                        return (
                          <Pressable key={p} onPress={() => { setStake(String(p)); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                            style={[qb.preset, { backgroundColor: stake===String(p)?'#FF3B30':colors.surfaceVariant, borderColor: stake===String(p)?'#FF3B30':colors.border }]}>
                            <Text style={[qb.presetTxt, { color: stake===String(p)?'#fff':colors.textSecondary }]}>{currSym}{p}</Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  </ScrollView>
                </View>

                {/* Odds input */}
                <View style={{ marginBottom: 16 }}>
                  <Text style={[qb.fieldLabel, { color: colors.textSecondary }]}>ODDS</Text>
                  <View style={[qb.inputWrap, { backgroundColor: colors.surfaceVariant, borderColor: odds?'#FF3B30':colors.border }]}>
                    <TextInput
                      style={[qb.input, { color: colors.textPrimary }]}
                      value={odds} onChangeText={setOdds}
                      placeholder="e.g. 1.85" placeholderTextColor={colors.textTertiary}
                      keyboardType="decimal-pad"
                    />
                    <Text style={[qb.inputSuffix, { color: colors.textTertiary }]}>×</Text>
                  </View>
                  {/* Odds presets */}
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
                    <View style={qb.presets}>
                      {ODDS_PRESETS.map(function(p) {
                        return (
                          <Pressable key={p} onPress={() => { setOdds(String(p)); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                            style={[qb.preset, { backgroundColor: odds===String(p)?'#FF3B30':colors.surfaceVariant, borderColor: odds===String(p)?'#FF3B30':colors.border }]}>
                            <Text style={[qb.presetTxt, { color: odds===String(p)?'#fff':colors.textSecondary }]}>{p}×</Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  </ScrollView>
                </View>

                {/* Live P&L preview */}
                <PnLPreview stake={stake} odds={odds} result={result} currSym={currSym} colors={colors} />

                {/* CTA */}
                <Animated.View style={btnAnimStyle}>
                  <Pressable
                    onPress={handleSave}
                    onPressIn={function() { if (canSave) btnScale.value = withSpring(0.96, { damping: 12 }); }}
                    onPressOut={function() { btnScale.value = withSpring(1, { damping: 12 }); }}
                    style={[qb.saveBtn, { backgroundColor: canSave?'#FF3B30':'#ccc', opacity: canSave?1:0.5 }]}
                    disabled={!canSave}
                  >
                    <Text style={qb.saveTxt}>⚡ Add Bet</Text>
                  </Pressable>
                </Animated.View>

                <View style={{ height: Platform.OS === 'ios' ? 32 : 16 }} />
              </ScrollView>
            </Animated.View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

var qb = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet:   { borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 20, paddingBottom: 8, maxHeight: '85%' },
  handle:  { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginTop: 10, marginBottom: 4 },
  header:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14 },
  title:   { fontSize: 20, fontWeight: '800', letterSpacing: -0.5 },
  sub:     { fontSize: 12, fontWeight: '500', marginTop: 2 },
  closeBtn:{ width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  fieldLabel: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 },
  inputWrap: { flexDirection: 'row', alignItems: 'center', borderRadius: 14, borderWidth: 1, paddingHorizontal: 16, height: 56, gap: 6 },
  inputPrefix: { fontSize: 20, fontWeight: '600' },
  inputSuffix: { fontSize: 18, fontWeight: '600' },
  input:   { flex: 1, fontSize: 22, fontWeight: '700', letterSpacing: -0.5 },
  hintBtn: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  presets: { flexDirection: 'row', gap: 8 },
  preset:  { paddingHorizontal: 16, paddingVertical: 9, borderRadius: 999, borderWidth: 0.5 },
  presetTxt: { fontSize: 13, fontWeight: '700' },
  saveBtn: { borderRadius: 999, height: 54, alignItems: 'center', justifyContent: 'center', marginBottom: 8, shadowColor: '#FF3B30', shadowOffset:{width:0,height:4}, shadowOpacity:0.35, shadowRadius:12, elevation:8 },
  saveTxt: { color: '#fff', fontSize: 16, fontWeight: '800', letterSpacing: 0.3 },
});
