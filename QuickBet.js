// QuickBet.js — Material 3 Expressive · Pixel flagship
// Draggable bottom sheet · Spring snap · M3 presets · Zero blur

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

// ─── CONSTANTS ───────────────────────────────────────────────────
const { height: SCREEN_H } = Dimensions.get('window');
const SHEET_MIN    = SCREEN_H * 0.44;
const SHEET_MAX    = SCREEN_H * 0.76;
const DISMISS_VEL  = 700;
const PRIMARY      = '#FF4B6A';
const PROFIT_COLOR = '#00BF6F';
const LOSS_COLOR   = '#FF4444';

const STAKE_PRESETS = [100, 200, 500, 1000, 2000];
const ODDS_PRESETS  = [1.5, 1.8, 2.0, 2.5, 3.0];

// ─── RESULT TOGGLE ───────────────────────────────────────────────
function ResultToggle({ value, onChange, colors, isDark }) {
  const tx = useSharedValue(value === 'Won' ? 0 : 1);

  useEffect(() => {
    tx.value = withSpring(value === 'Won' ? 0 : 1, { damping: 22, stiffness: 300 });
  }, [value]);

  const sliderStyle = useAnimatedStyle(() => ({
    transform: [{
      translateX: interpolate(tx.value, [0, 1], [3, 150], Extrapolation.CLAMP),
    }],
    backgroundColor: value === 'Won' ? PROFIT_COLOR : LOSS_COLOR,
    shadowColor:     value === 'Won' ? PROFIT_COLOR : LOSS_COLOR,
  }));

  return (
    <View style={[tg.wrap, {
      backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
    }]}>
      <Animated.View style={[tg.slider, sliderStyle]} />
      {['Won', 'Lost'].map(opt => (
        <Pressable
          key={opt}
          onPress={() => {
            onChange(opt);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }}
          style={tg.opt}
        >
          <Text style={[tg.txt, {
            color:      value === opt ? '#fff' : colors.textTertiary,
            fontWeight: value === opt ? '800' : '500',
          }]}>
            {opt === 'Won' ? '✓  Won' : '✕  Lost'}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}
const tg = StyleSheet.create({
  wrap:   { flexDirection: 'row', borderRadius: 16, height: 52,
            position: 'relative', overflow: 'hidden' },
  slider: { position: 'absolute', top: 3, bottom: 3, width: '49%',
            borderRadius: 13,
            shadowOffset: { width: 0, height: 3 },
            shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  opt:    { flex: 1, alignItems: 'center', justifyContent: 'center', zIndex: 1 },
  txt:    { fontSize: 14 },
});

// ─── PNL PREVIEW ─────────────────────────────────────────────────
function PnLPreview({ stake, odds, result, currSym, colors }) {
  const s = parseFloat(stake);
  const o = parseFloat(odds);
  if (!s || !o || o <= 1) return null;

  const pnl   = result === 'Won' ? s * (o - 1) : -s;
  const isPos = pnl >= 0;
  const c     = isPos ? PROFIT_COLOR : LOSS_COLOR;

  return (
    <View style={[pv.wrap, {
      backgroundColor: isPos ? 'rgba(0,191,111,0.08)' : 'rgba(255,68,68,0.08)',
      borderColor:     isPos ? 'rgba(0,191,111,0.22)' : 'rgba(255,68,68,0.22)',
    }]}>
      <View>
        <Text style={[pv.label, { color: c }]}>
          {result === 'Won' ? 'Potential Win' : 'You Lose'}
        </Text>
        <Text style={[pv.amount, { color: c }]}>
          {isPos ? '+' : ''}{formatMoney(pnl, currSym)}
        </Text>
      </View>
      {result === 'Won' && (
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={[pv.retLbl, { color: colors.textTertiary }]}>Returns</Text>
          <Text style={[pv.retAmt, { color: c }]}>
            {formatMoney(s + pnl, currSym)}
          </Text>
        </View>
      )}
    </View>
  );
}
const pv = StyleSheet.create({
  wrap:   { flexDirection: 'row', justifyContent: 'space-between',
            alignItems: 'center', borderRadius: 18,
            padding: 16, borderWidth: 1, marginVertical: 12 },
  label:  { fontSize: 11, fontWeight: '700', marginBottom: 3, opacity: 0.85 },
  amount: { fontSize: 30, fontWeight: '900', letterSpacing: -1 },
  retLbl: { fontSize: 10, fontWeight: '600', marginBottom: 3 },
  retAmt: { fontSize: 17, fontWeight: '800' },
});

// ─── PRESET PILL ─────────────────────────────────────────────────
function Preset({ label, active, onPress, colors }) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={animStyle}>
      <Pressable
        onPressIn={() => {
          scale.value = withSpring(0.92, { damping: 18, stiffness: 400 });
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }}
        onPressOut={() => {
          scale.value = withSpring(1, { damping: 18, stiffness: 400 });
        }}
        onPress={onPress}
        style={[pr.pill, {
          backgroundColor: active ? 'rgba(255,75,106,0.12)' : colors.surfaceVariant,
          borderColor:     active ? 'rgba(255,75,106,0.35)' : colors.border,
        }]}
      >
        <Text style={[pr.txt, {
          color:      active ? PRIMARY : colors.textSecondary,
          fontWeight: active ? '800' : '600',
        }]}>{label}</Text>
      </Pressable>
    </Animated.View>
  );
}
const pr = StyleSheet.create({
  pill: { paddingHorizontal: 16, paddingVertical: 9, borderRadius: 999, borderWidth: 1 },
  txt:  { fontSize: 13 },
});

// ─── MAIN SHEET ──────────────────────────────────────────────────
export default function QuickBet({ visible, onClose, onSave, currSym, suggestStake }) {
  currSym = currSym || '₹';
  const { colors, isDark } = useTheme();

  const [stake,  setStake]  = useState('');
  const [odds,   setOdds]   = useState('');
  const [result, setResult] = useState('Won');
  const stakeRef = useRef(null);

  const sheetY    = useSharedValue(SCREEN_H);
  const bgOpacity = useSharedValue(0);
  const btnScale  = useSharedValue(1);

  useEffect(() => {
    if (visible) {
      setStake(''); setOdds(''); setResult('Won');
      sheetY.value = withSpring(SCREEN_H - SHEET_MIN, {
        damping: 26, stiffness: 200, mass: 0.85,
      });
      bgOpacity.value = withTiming(1, { duration: 220 });
      setTimeout(() => stakeRef.current?.focus(), 400);
    } else {
      sheetY.value    = withTiming(SCREEN_H, { duration: 250 });
      bgOpacity.value = withTiming(0, { duration: 200 });
    }
  }, [visible]);

  const gestureHandler = useAnimatedGestureHandler({
    onStart: (_, ctx) => { ctx.startY = sheetY.value; },
    onActive: (e, ctx) => {
      const ny = ctx.startY + e.translationY;
      sheetY.value = Math.max(SCREEN_H - SHEET_MAX, Math.min(SCREEN_H - 60, ny));
    },
    onEnd: e => {
      if (sheetY.value > SCREEN_H - 120 || e.velocityY > DISMISS_VEL) {
        sheetY.value    = withTiming(SCREEN_H, { duration: 240 });
        bgOpacity.value = withTiming(0, { duration: 200 });
        runOnJS(onClose)();
      } else if (sheetY.value > SCREEN_H - (SHEET_MIN + SHEET_MAX) / 2) {
        sheetY.value = withSpring(SCREEN_H - SHEET_MIN, { damping: 26, stiffness: 200 });
      } else {
        sheetY.value = withSpring(SCREEN_H - SHEET_MAX, { damping: 26, stiffness: 200 });
      }
    },
  });

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: sheetY.value }],
  }));
  const bgStyle = useAnimatedStyle(() => ({
    opacity: bgOpacity.value,
  }));
  const btnStyle = useAnimatedStyle(() => ({
    transform: [{ scale: btnScale.value }],
  }));

  const canSave = stake && odds &&
    parseFloat(odds)  > 1  &&
    parseFloat(stake) > 0  &&
    !isNaN(parseFloat(stake));

  function handleSave() {
    if (!canSave) return;
    Keyboard.dismiss();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    btnScale.value = withSpring(0.93, { damping: 10 }, () => {
      btnScale.value = withSpring(1, { damping: 14 });
    });
    onSave({
      stake, odds, status: result,
      date:     new Date().toISOString().slice(0, 10),
      event:    'Quick Bet',
      bet:      'Quick entry',
      bookie:   '', sport:  '', notes: '',
      tags:     ['quick'], betType: 'Single',
    });
    onClose();
  }

  const close = () => { Keyboard.dismiss(); onClose(); };

  const sheetBg = isDark ? colors.surfaceVariant : '#FFFFFF';

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={close}>

      {/* Scrim */}
      <TouchableWithoutFeedback onPress={close}>
        <Animated.View style={[q.backdrop, bgStyle]} />
      </TouchableWithoutFeedback>

      {/* Bottom sheet */}
      <PanGestureHandler onGestureEvent={gestureHandler}>
        <Animated.View style={[q.sheet, { backgroundColor: sheetBg, borderTopColor: colors.border }, sheetStyle]}>

          {/* Handle */}
          <View style={[q.handle, { backgroundColor: colors.border }]} />

          {/* Header */}
          <View style={q.header}>
            <View style={[q.iconWrap, { backgroundColor: 'rgba(91,141,239,0.1)' }]}>
              <Text style={{ fontSize: 20 }}>⚡</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[q.title, { color: colors.textPrimary }]}>Quick Bet</Text>
              <Text style={[q.sub, { color: colors.textTertiary }]}>
                Drag up to expand · Swipe down to close
              </Text>
            </View>
            <Pressable
              onPress={close}
              style={[q.closeBtn, {
                backgroundColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)',
              }]}
            >
              <Text style={{ color: colors.textTertiary, fontSize: 15, fontWeight: '700' }}>✕</Text>
            </Pressable>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            bounces={false}
            contentContainerStyle={{ paddingBottom: Platform.OS === 'ios' ? 44 : 28 }}
          >

            {/* Result toggle */}
            <View style={{ marginBottom: 18 }}>
              <Text style={[q.fieldLabel, { color: colors.textTertiary }]}>Result</Text>
              <ResultToggle value={result} onChange={setResult} colors={colors} isDark={isDark} />
            </View>

            {/* Stake */}
            <View style={{ marginBottom: 18 }}>
              <Text style={[q.fieldLabel, { color: colors.textTertiary }]}>Stake ({currSym})</Text>
              <View style={[q.inputWrap, {
                backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                borderColor:     colors.border,
              }]}>
                <Text style={[q.prefix, { color: colors.textTertiary }]}>{currSym}</Text>
                <TextInput
                  ref={stakeRef}
                  style={[q.input, { color: colors.textPrimary }]}
                  value={stake}
                  onChangeText={setStake}
                  placeholder="0"
                  placeholderTextColor={colors.textTertiary}
                  keyboardType="decimal-pad"
                />
                {suggestStake && !stake && (
                  <Pressable
                    onPress={() => {
                      setStake(String(Math.round(suggestStake)));
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }}
                    style={[q.suggestChip, { backgroundColor: 'rgba(255,75,106,0.1)' }]}
                  >
                    <Text style={[q.suggestTxt, { color: PRIMARY }]}>2% ↗</Text>
                  </Pressable>
                )}
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 9 }}>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {STAKE_PRESETS.map(p => (
                    <Preset
                      key={p}
                      label={`${currSym}${p}`}
                      active={stake === String(p)}
                      onPress={() => setStake(String(p))}
                      colors={colors}
                    />
                  ))}
                </View>
              </ScrollView>
            </View>

            {/* Odds */}
            <View style={{ marginBottom: 6 }}>
              <Text style={[q.fieldLabel, { color: colors.textTertiary }]}>Odds</Text>
              <View style={[q.inputWrap, {
                backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                borderColor:     colors.border,
              }]}>
                <TextInput
                  style={[q.input, { color: colors.textPrimary }]}
                  value={odds}
                  onChangeText={setOdds}
                  placeholder="1.85"
                  placeholderTextColor={colors.textTertiary}
                  keyboardType="decimal-pad"
                />
                <Text style={[q.suffix, { color: colors.textTertiary }]}>×</Text>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 9 }}>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {ODDS_PRESETS.map(p => (
                    <Preset
                      key={p}
                      label={`${p}×`}
                      active={odds === String(p)}
                      onPress={() => setOdds(String(p))}
                      colors={colors}
                    />
                  ))}
                </View>
              </ScrollView>
            </View>

            {/* P&L preview */}
            <PnLPreview stake={stake} odds={odds} result={result} currSym={currSym} colors={colors} />

            {/* CTA */}
            <Animated.View style={[btnStyle, { marginTop: 6 }]}>
              <Pressable
                onPress={handleSave}
                onPressIn={() => {
                  if (canSave) btnScale.value = withSpring(0.96, { damping: 12 });
                }}
                onPressOut={() => {
                  btnScale.value = withSpring(1, { damping: 14 });
                }}
                disabled={!canSave}
                style={[q.cta, {
                  backgroundColor: canSave ? PRIMARY : colors.border,
                  shadowColor:     canSave ? PRIMARY : 'transparent',
                  opacity:         canSave ? 1 : 0.55,
                }]}
              >
                <Text style={q.ctaTxt}>⚡ Add Bet</Text>
              </Pressable>
            </Animated.View>

          </ScrollView>
        </Animated.View>
      </PanGestureHandler>
    </Modal>
  );
}

// ─── STYLES ──────────────────────────────────────────────────────
const q = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.52)',
  },
  sheet: {
    position: 'absolute', left: 0, right: 0, bottom: 0, top: 0,
    borderTopLeftRadius: 32, borderTopRightRadius: 32,
    paddingHorizontal: 20, borderTopWidth: 1,
    shadowColor: '#000', shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12, shadowRadius: 20, elevation: 20,
  },
  handle:   { width: 36, height: 4, borderRadius: 2,
              alignSelf: 'center', marginTop: 10, marginBottom: 6 },
  header:   { flexDirection: 'row', alignItems: 'center',
              paddingVertical: 14, gap: 12 },
  iconWrap: { width: 44, height: 44, borderRadius: 14,
              alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  title:    { fontSize: 19, fontWeight: '800', letterSpacing: -0.4 },
  sub:      { fontSize: 11, fontWeight: '500', marginTop: 2 },
  closeBtn: { width: 34, height: 34, borderRadius: 12,
              alignItems: 'center', justifyContent: 'center' },

  fieldLabel: { fontSize: 9, fontWeight: '700', textTransform: 'uppercase',
                letterSpacing: 1.2, marginBottom: 9 },

  inputWrap: { flexDirection: 'row', alignItems: 'center',
               borderRadius: 18, paddingHorizontal: 16,
               height: 66, gap: 8, borderWidth: 1 },
  prefix:    { fontSize: 22, fontWeight: '600' },
  suffix:    { fontSize: 20, fontWeight: '600' },
  input:     { flex: 1, fontSize: 30, fontWeight: '700', letterSpacing: -0.5 },

  suggestChip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
  suggestTxt:  { fontSize: 11, fontWeight: '800' },

  cta: {
    borderRadius: 999, height: 58,
    alignItems: 'center', justifyContent: 'center',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.32, shadowRadius: 14, elevation: 8,
  },
  ctaTxt: { color: '#fff', fontSize: 16, fontWeight: '800', letterSpacing: 0.3 },
});
