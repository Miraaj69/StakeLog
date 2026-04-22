// QuickBet.js — Premium bottom sheet: fixed snapping, keyboard-safe, clean UX
import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, Pressable, TextInput,
  Modal, TouchableWithoutFeedback, Keyboard,
  Platform, ScrollView, Dimensions, KeyboardAvoidingView,
} from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, withTiming,
  interpolate, runOnJS, useAnimatedGestureHandler, Extrapolation,
} from 'react-native-reanimated';
import { PanGestureHandler } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import { useTheme } from './useTheme';
import { formatMoney } from './calculations';

const { height: SCREEN_H } = Dimensions.get('window');
const SHEET_MIN = SCREEN_H * 0.42;
const SHEET_MAX = SCREEN_H * 0.74;
const DISMISS_VEL = 700;

const STAKE_PRESETS = [100, 200, 500, 1000];
const ODDS_PRESETS = [1.5, 1.8, 2.0, 2.5, 3.0];

// ── Win/Loss toggle ───────────────────────────────────────────────
function ResultToggle({ value, onChange, colors }) {
  const translateX = useSharedValue(value === 'Won' ? 0 : 1);
  useEffect(() => {
    translateX.value = withSpring(value === 'Won' ? 0 : 1, { damping: 20, stiffness: 240 });
  }, [value]);

  const sliderStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: interpolate(translateX.value, [0, 1], [3, 140], Extrapolation.CLAMP) }],
    backgroundColor: value === 'Won' ? '#00C853' : '#E53935',
  }));

  return (
    <View style={[tg.wrap, { backgroundColor: colors.surfaceVariant }]}>
      <Animated.View style={[tg.slider, sliderStyle]} />
      <Pressable onPress={() => { onChange('Won'); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }} style={tg.opt}>
        <Text style={[tg.txt, { color: value === 'Won' ? '#fff' : colors.textTertiary, fontWeight: value === 'Won' ? '800' : '500' }]}>✓  Won</Text>
      </Pressable>
      <Pressable onPress={() => { onChange('Lost'); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }} style={tg.opt}>
        <Text style={[tg.txt, { color: value === 'Lost' ? '#fff' : colors.textTertiary, fontWeight: value === 'Lost' ? '800' : '500' }]}>✕  Lost</Text>
      </Pressable>
    </View>
  );
}
const tg = StyleSheet.create({
  wrap: { flexDirection: 'row', borderRadius: 14, height: 50, position: 'relative', overflow: 'hidden' },
  slider: { position: 'absolute', top: 3, bottom: 3, width: '49%', borderRadius: 11 },
  opt: { flex: 1, alignItems: 'center', justifyContent: 'center', zIndex: 1 },
  txt: { fontSize: 14, fontWeight: '600' },
});

// ── P&L preview ───────────────────────────────────────────────────
function PnLPreview({ stake, odds, result, currSym, colors }) {
  const s = parseFloat(stake), o = parseFloat(odds);
  if (!s || !o || o <= 1) return null;
  const pnl = result === 'Won' ? s * (o - 1) : -s;
  const isPos = pnl >= 0;
  return (
    <View style={[pv.wrap, {
      backgroundColor: isPos ? 'rgba(0,200,83,0.08)' : 'rgba(229,57,53,0.08)',
      borderColor: isPos ? 'rgba(0,200,83,0.2)' : 'rgba(229,57,53,0.2)',
    }]}>
      <View>
        <Text style={[pv.label, { color: isPos ? '#00C853' : '#E53935' }]}>
          {result === 'Won' ? 'Potential win' : 'You lose'}
        </Text>
        <Text style={[pv.amount, { color: isPos ? '#00C853' : '#E53935' }]}>
          {isPos ? '+' : ''}{formatMoney(pnl, currSym)}
        </Text>
      </View>
      {result === 'Won' && (
        <View>
          <Text style={[pv.returnLabel, { color: colors.textTertiary }]}>Returns</Text>
          <Text style={[pv.returnAmount, { color: '#00C853' }]}>{formatMoney(s + pnl, currSym)}</Text>
        </View>
      )}
    </View>
  );
}
const pv = StyleSheet.create({
  wrap: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderRadius: 16, padding: 16, borderWidth: 0.5, marginVertical: 10 },
  label: { fontSize: 11, fontWeight: '600', marginBottom: 2, opacity: 0.8 },
  amount: { fontSize: 28, fontWeight: '900', letterSpacing: -1 },
  returnLabel: { fontSize: 10, fontWeight: '600', textAlign: 'right', marginBottom: 2 },
  returnAmount: { fontSize: 16, fontWeight: '800' },
});

export default function QuickBet({ visible, onClose, onSave, currSym, suggestStake }) {
  currSym = currSym || '₹';
  const { colors, isDark } = useTheme();
  const [stake, setStake] = useState('');
  const [odds, setOdds] = useState('');
  const [result, setResult] = useState('Won');
  const stakeRef = useRef(null);

  // Sheet Y: starts below screen, animates up on open
  const sheetY = useSharedValue(SCREEN_H);
  const bgOpacity = useSharedValue(0);
  const btnScale = useSharedValue(1);

  useEffect(() => {
    if (visible) {
      setStake(''); setOdds(''); setResult('Won');
      sheetY.value = withSpring(SCREEN_H - SHEET_MIN, {
        damping: 26, stiffness: 200, mass: 0.85,
      });
      bgOpacity.value = withTiming(1, { duration: 220 });
      setTimeout(() => { stakeRef.current?.focus(); }, 380);
    } else {
      sheetY.value = withTiming(SCREEN_H, { duration: 260 });
      bgOpacity.value = withTiming(0, { duration: 200 });
    }
  }, [visible]);

  const gestureHandler = useAnimatedGestureHandler({
    onStart: (_, ctx) => { ctx.startY = sheetY.value; },
    onActive: (e, ctx) => {
      const ny = ctx.startY + e.translationY;
      sheetY.value = Math.max(SCREEN_H - SHEET_MAX, Math.min(SCREEN_H - 60, ny));
    },
    onEnd: (e) => {
      const currentSheetTop = sheetY.value;
      // Dismiss if dragged far down or fast flick
      if (currentSheetTop > SCREEN_H - 120 || e.velocityY > DISMISS_VEL) {
        sheetY.value = withTiming(SCREEN_H, { duration: 240 });
        bgOpacity.value = withTiming(0, { duration: 200 });
        runOnJS(onClose)();
      } else if (currentSheetTop > SCREEN_H - (SHEET_MIN + SHEET_MAX) / 2) {
        // Snap to min
        sheetY.value = withSpring(SCREEN_H - SHEET_MIN, { damping: 26, stiffness: 200 });
      } else {
        // Snap to max
        sheetY.value = withSpring(SCREEN_H - SHEET_MAX, { damping: 26, stiffness: 200 });
      }
    },
  });

  const sheetStyle = useAnimatedStyle(() => ({ transform: [{ translateY: sheetY.value }] }));
  const bgStyle = useAnimatedStyle(() => ({ opacity: bgOpacity.value }));
  const btnStyle = useAnimatedStyle(() => ({ transform: [{ scale: btnScale.value }] }));

  const canSave = stake && odds && parseFloat(odds) > 1 && parseFloat(stake) > 0;

  function handleSave() {
    if (!canSave) return;
    Keyboard.dismiss();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    btnScale.value = withSpring(0.93, { damping: 10 }, () => {
      btnScale.value = withSpring(1, { damping: 14 });
    });
    onSave({
      stake, odds, status: result,
      date: new Date().toISOString().slice(0, 10),
      event: 'Quick Bet', bet: 'Quick entry',
      bookie: '', sport: '', notes: '',
      tags: ['quick'], betType: 'Single',
    });
    onClose();
  }

  function close() { Keyboard.dismiss(); onClose(); }

  const sheetBg = isDark ? 'rgba(16,16,18,0.98)' : 'rgba(255,255,255,0.99)';

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={close}>
      {/* Backdrop */}
      <TouchableWithoutFeedback onPress={close}>
        <Animated.View style={[qb.backdrop, bgStyle]} />
      </TouchableWithoutFeedback>

      {/* Bottom sheet */}
      <PanGestureHandler onGestureEvent={gestureHandler}>
        <Animated.View style={[qb.sheet, { backgroundColor: sheetBg }, sheetStyle]}>
          {/* Handle */}
          <View style={[qb.handle, { backgroundColor: colors.border }]} />

          {/* Header */}
          <View style={qb.header}>
            <View>
              <Text style={[qb.title, { color: colors.textPrimary }]}>⚡ Quick Bet</Text>
              <Text style={[qb.subtitle, { color: colors.textTertiary }]}>Drag up to expand</Text>
            </View>
            <Pressable onPress={close} style={[qb.closeBtn, { backgroundColor: colors.surfaceVariant }]}>
              <Text style={{ color: colors.textSecondary, fontSize: 15, fontWeight: '700' }}>✕</Text>
            </Pressable>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            bounces={false}
            contentContainerStyle={{ paddingBottom: Platform.OS === 'ios' ? 40 : 24 }}
          >
            {/* Result toggle */}
            <View style={{ marginBottom: 16 }}>
              <Text style={[qb.fieldLabel, { color: colors.textTertiary }]}>Result</Text>
              <ResultToggle value={result} onChange={setResult} colors={colors} />
            </View>

            {/* Stake */}
            <View style={{ marginBottom: 16 }}>
              <Text style={[qb.fieldLabel, { color: colors.textTertiary }]}>Stake ({currSym})</Text>
              <View style={[qb.inputWrap, { backgroundColor: colors.surfaceVariant }]}>
                <Text style={[qb.prefix, { color: colors.textTertiary }]}>{currSym}</Text>
                <TextInput
                  ref={stakeRef}
                  style={[qb.input, { color: colors.textPrimary }]}
                  value={stake} onChangeText={setStake}
                  placeholder="0" placeholderTextColor={colors.textTertiary}
                  keyboardType="decimal-pad"
                />
                {suggestStake && !stake && (
                  <Pressable onPress={() => setStake(String(Math.round(suggestStake)))} style={qb.suggestChip}>
                    <Text style={qb.suggestTxt}>2% ↗</Text>
                  </Pressable>
                )}
              </View>
              {/* Stake presets */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {STAKE_PRESETS.map(p => {
                    const active = stake === String(p);
                    return (
                      <Pressable key={p}
                        onPress={() => { setStake(String(p)); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                        style={[qb.preset, { backgroundColor: active ? '#E50914' : colors.surfaceVariant, borderColor: active ? '#E50914' : colors.border }]}
                      >
                        <Text style={[qb.presetTxt, { color: active ? '#fff' : colors.textSecondary }]}>{currSym}{p}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              </ScrollView>
            </View>

            {/* Odds */}
            <View style={{ marginBottom: 8 }}>
              <Text style={[qb.fieldLabel, { color: colors.textTertiary }]}>Odds</Text>
              <View style={[qb.inputWrap, { backgroundColor: colors.surfaceVariant }]}>
                <TextInput
                  style={[qb.input, { color: colors.textPrimary }]}
                  value={odds} onChangeText={setOdds}
                  placeholder="1.85" placeholderTextColor={colors.textTertiary}
                  keyboardType="decimal-pad"
                />
                <Text style={[qb.prefix, { color: colors.textTertiary }]}>×</Text>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {ODDS_PRESETS.map(p => {
                    const active = odds === String(p);
                    return (
                      <Pressable key={p}
                        onPress={() => { setOdds(String(p)); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                        style={[qb.preset, { backgroundColor: active ? '#E50914' : colors.surfaceVariant, borderColor: active ? '#E50914' : colors.border }]}
                      >
                        <Text style={[qb.presetTxt, { color: active ? '#fff' : colors.textSecondary }]}>{p}×</Text>
                      </Pressable>
                    );
                  })}
                </View>
              </ScrollView>
            </View>

            {/* P&L preview */}
            <PnLPreview stake={stake} odds={odds} result={result} currSym={currSym} colors={colors} />

            {/* CTA */}
            <Animated.View style={btnStyle}>
              <Pressable
                onPress={handleSave}
                onPressIn={() => { if (canSave) btnScale.value = withSpring(0.96, { damping: 10 }); }}
                onPressOut={() => { btnScale.value = withSpring(1, { damping: 14 }); }}
                disabled={!canSave}
                style={[qb.cta, {
                  backgroundColor: canSave ? '#E50914' : colors.border,
                  shadowColor: canSave ? '#E50914' : 'transparent',
                }]}
              >
                <Text style={[qb.ctaTxt, { opacity: canSave ? 1 : 0.5 }]}>⚡ Add Bet</Text>
              </Pressable>
            </Animated.View>
          </ScrollView>
        </Animated.View>
      </PanGestureHandler>
    </Modal>
  );
}

const qb = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet: {
    position: 'absolute', left: 0, right: 0, bottom: 0, top: 0,
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingHorizontal: 20,
  },
  handle: { width: 36, height: 4, borderRadius: 2, alignSelf: 'center', marginTop: 10, marginBottom: 4 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14 },
  title: { fontSize: 20, fontWeight: '800', letterSpacing: -0.5 },
  subtitle: { fontSize: 11, fontWeight: '500', marginTop: 2 },
  closeBtn: { width: 34, height: 34, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  fieldLabel: { fontSize: 9, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
  inputWrap: { flexDirection: 'row', alignItems: 'center', borderRadius: 16, paddingHorizontal: 16, height: 62, gap: 8 },
  prefix: { fontSize: 20, fontWeight: '600' },
  input: { flex: 1, fontSize: 28, fontWeight: '700', letterSpacing: -0.5 },
  suggestChip: { backgroundColor: 'rgba(229,9,20,0.1)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  suggestTxt: { color: '#E50914', fontSize: 11, fontWeight: '700' },
  preset: { paddingHorizontal: 16, paddingVertical: 9, borderRadius: 999, borderWidth: 0.5 },
  presetTxt: { fontSize: 13, fontWeight: '700' },
  cta: {
    borderRadius: 999, height: 56, alignItems: 'center', justifyContent: 'center',
    shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.35, shadowRadius: 14, elevation: 8,
  },
  ctaTxt: { color: '#fff', fontSize: 16, fontWeight: '800', letterSpacing: 0.3 },
});
