// QuickBet.js — Premium bottom sheet, drag-to-close, glassmorphism
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, Pressable, TextInput,
  Modal, TouchableWithoutFeedback, Keyboard,
  Platform, ScrollView, Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, withTiming,
  interpolate, runOnJS, useAnimatedGestureHandler, Extrapolation,
} from 'react-native-reanimated';
import { PanGestureHandler } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import { useTheme } from './useTheme';
import { formatMoney } from './calculations';

var { height: SCREEN_H } = Dimensions.get('window');
var SNAP_MIN = SCREEN_H * 0.38;  // 38% — compact snap
var SNAP_MAX = SCREEN_H * 0.72;  // 72% — expanded snap
var DISMISS_THRESHOLD = SCREEN_H * 0.82;

var STAKE_PRESETS = [100, 200, 500, 1000];
var ODDS_PRESETS  = [1.5, 1.8, 2.0, 2.5, 3.0];

// Animated Win/Loss toggle
function ResultToggle({ value, onChange, colors }) {
  var slide = useSharedValue(value === 'Won' ? 0 : 1);

  useEffect(function() {
    slide.value = withSpring(value === 'Won' ? 0 : 1, { damping: 18, stiffness: 220 });
  }, [value]);

  var sliderStyle = useAnimatedStyle(function() {
    return {
      transform: [{ translateX: interpolate(slide.value, [0, 1], [3, '50%'], Extrapolation.CLAMP) }],
      backgroundColor: value === 'Won' ? '#1A9E4A' : '#D93025',
    };
  });

  // Simpler: fixed translateX based on container width
  var sliderStyleFixed = useAnimatedStyle(function() {
    return {
      transform: [{ translateX: interpolate(slide.value, [0, 1], [3, 143], Extrapolation.CLAMP) }],
      backgroundColor: value === 'Won' ? '#1A9E4A' : '#D93025',
    };
  });

  return (
    <View style={[tg.wrap, { backgroundColor: colors.surfaceVariant }]}>
      <Animated.View style={[tg.slider, sliderStyleFixed]} />
      <Pressable onPress={() => { onChange('Won'); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }} style={tg.opt}>
        <Text style={[tg.txt, { color: value==='Won'?'#fff':colors.textTertiary, fontWeight: value==='Won'?'800':'500' }]}>✓  Won</Text>
      </Pressable>
      <Pressable onPress={() => { onChange('Lost'); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }} style={tg.opt}>
        <Text style={[tg.txt, { color: value==='Lost'?'#fff':colors.textTertiary, fontWeight: value==='Lost'?'800':'500' }]}>✕  Lost</Text>
      </Pressable>
    </View>
  );
}
var tg = StyleSheet.create({
  wrap:   { flexDirection:'row', borderRadius:14, height:48, position:'relative', overflow:'hidden' },
  slider: { position:'absolute', top:3, bottom:3, width:'49%', borderRadius:11 },
  opt:    { flex:1, alignItems:'center', justifyContent:'center', zIndex:1 },
  txt:    { fontSize:14 },
});

// Live P&L preview with bounce
function PnLPreview({ stake, odds, result, currSym, colors }) {
  var s = parseFloat(stake), o = parseFloat(odds);
  var bounce = useSharedValue(1);
  var prev = useRef(0);

  var pnl = (s && o && o > 1)
    ? (result === 'Won' ? s * (o - 1) : -s)
    : null;

  useEffect(function() {
    if (pnl !== null && pnl !== prev.current) {
      prev.current = pnl;
      bounce.value = withSpring(1.06, { damping: 8, stiffness: 400 }, function() {
        bounce.value = withSpring(1, { damping: 12 });
      });
    }
  }, [pnl]);

  var bounceStyle = useAnimatedStyle(function() {
    return { transform: [{ scale: bounce.value }] };
  });

  if (pnl === null) return null;
  var isPos = pnl >= 0;

  return (
    <Animated.View style={[pv.wrap, { backgroundColor: isPos?'rgba(26,158,74,0.1)':'rgba(217,48,37,0.1)', borderColor: isPos?'rgba(26,158,74,0.25)':'rgba(217,48,37,0.25)' }, bounceStyle]}>
      <Text style={[pv.lbl, { color: isPos?'#1A9E4A':'#D93025' }]}>
        {result==='Won' ? 'Potential win' : 'You lost'}
      </Text>
      <Text style={[pv.amt, { color: isPos?'#1A9E4A':'#D93025' }]}>
        {isPos?'+':''}{formatMoney(pnl, currSym)}
      </Text>
      {result==='Won' && s && o && (
        <Text style={[pv.ret, { color: '#1A9E4A' }]}>Returns {formatMoney(s + pnl, currSym)}</Text>
      )}
    </Animated.View>
  );
}
var pv = StyleSheet.create({
  wrap: { borderRadius:16, padding:14, alignItems:'center', borderWidth:0.5, marginVertical:12 },
  lbl:  { fontSize:11, fontWeight:'600', opacity:0.8, marginBottom:3 },
  amt:  { fontSize:30, fontWeight:'900', letterSpacing:-1 },
  ret:  { fontSize:11, marginTop:2, opacity:0.7 },
});

export default function QuickBet({ visible, onClose, onSave, currSym, suggestStake }) {
  currSym = currSym || '₹';
  var { colors, isDark } = useTheme();
  var [stake,  setStake]  = useState('');
  var [odds,   setOdds]   = useState('');
  var [result, setResult] = useState('Won');
  var stakeRef = useRef(null);

  // Sheet Y position — starts off-screen, snaps to SNAP_MIN on open
  var sheetY   = useSharedValue(SCREEN_H);
  var btnScale = useSharedValue(1);
  var bgOpacity = useSharedValue(0);

  useEffect(function() {
    if (visible) {
      setStake(''); setOdds(''); setResult('Won');
      sheetY.value = withSpring(SCREEN_H - SNAP_MIN, { damping: 22, stiffness: 180, mass: 0.9 });
      bgOpacity.value = withTiming(1, { duration: 200 });
      setTimeout(function() { if (stakeRef.current) stakeRef.current.focus(); }, 350);
    } else {
      sheetY.value = withTiming(SCREEN_H, { duration: 240 });
      bgOpacity.value = withTiming(0, { duration: 200 });
    }
  }, [visible]);

  // Drag gesture
  var gestureHandler = useAnimatedGestureHandler({
    onStart: function(_, ctx) { ctx.startY = sheetY.value; },
    onActive: function(e, ctx) {
      var ny = ctx.startY + e.translationY;
      sheetY.value = Math.max(SCREEN_H - SNAP_MAX, Math.min(SCREEN_H, ny));
    },
    onEnd: function(e) {
      if (sheetY.value > SCREEN_H - 100 || e.velocityY > 800) {
        // Dismiss
        sheetY.value = withTiming(SCREEN_H, { duration: 220 });
        bgOpacity.value = withTiming(0, { duration: 200 });
        runOnJS(onClose)();
      } else if (sheetY.value > SCREEN_H - (SNAP_MIN + SNAP_MAX) / 2) {
        // Snap to min
        sheetY.value = withSpring(SCREEN_H - SNAP_MIN, { damping: 22, stiffness: 180 });
      } else {
        // Snap to max
        sheetY.value = withSpring(SCREEN_H - SNAP_MAX, { damping: 22, stiffness: 180 });
      }
    },
  });

  var sheetStyle = useAnimatedStyle(function() {
    return { transform: [{ translateY: sheetY.value }] };
  });
  var bgStyle = useAnimatedStyle(function() {
    return { opacity: bgOpacity.value };
  });
  var btnAnimStyle = useAnimatedStyle(function() {
    return { transform: [{ scale: btnScale.value }] };
  });

  var canSave = stake && odds && parseFloat(odds) > 1 && parseFloat(stake) > 0;

  function handleSave() {
    if (!canSave) return;
    Keyboard.dismiss();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    btnScale.value = withSpring(0.94, { damping: 10 }, function() {
      btnScale.value = withSpring(1, { damping: 12 });
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

  // Glass background color
  var sheetBg = isDark ? 'rgba(18,18,18,0.97)' : 'rgba(255,255,255,0.98)';

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={close}>
      {/* Dim backdrop */}
      <TouchableWithoutFeedback onPress={close}>
        <Animated.View style={[qb.backdrop, bgStyle]} />
      </TouchableWithoutFeedback>

      {/* Draggable sheet */}
      <PanGestureHandler onGestureEvent={gestureHandler}>
        <Animated.View style={[qb.sheet, { backgroundColor: sheetBg }, sheetStyle]}>
          {/* Handle bar */}
          <View style={[qb.handle, { backgroundColor: colors.border }]} />

          {/* Header */}
          <View style={qb.header}>
            <View>
              <Text style={[qb.title, { color: colors.textPrimary }]}>⚡ Quick Bet</Text>
              <Text style={[qb.sub, { color: colors.textTertiary }]}>Drag up for more</Text>
            </View>
            <Pressable onPress={close} style={[qb.closeBtn, { backgroundColor: colors.surfaceVariant }]}>
              <Text style={{ color: colors.textTertiary, fontSize: 16, fontWeight: '600' }}>✕</Text>
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" bounces={false}>

            {/* Result toggle */}
            <View style={{ marginBottom: 16 }}>
              <Text style={[qb.fieldLbl, { color: colors.textSecondary }]}>RESULT</Text>
              <ResultToggle value={result} onChange={setResult} colors={colors} />
            </View>

            {/* Stake */}
            <View style={{ marginBottom: 16 }}>
              <Text style={[qb.fieldLbl, { color: colors.textSecondary }]}>STAKE ({currSym})</Text>
              <View style={[qb.inputWrap, { backgroundColor: colors.surfaceVariant }]}>
                <Text style={[qb.prefix, { color: colors.textTertiary }]}>{currSym}</Text>
                <TextInput ref={stakeRef}
                  style={[qb.input, { color: colors.textPrimary }]}
                  value={stake} onChangeText={setStake}
                  placeholder="0" placeholderTextColor={colors.textTertiary}
                  keyboardType="decimal-pad"
                />
                {suggestStake && !stake && (
                  <Pressable onPress={() => setStake(String(Math.round(suggestStake)))}
                    style={qb.hintChip}>
                    <Text style={qb.hintTxt}>2% ↗</Text>
                  </Pressable>
                )}
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {STAKE_PRESETS.map(function(p) {
                    var active = stake === String(p);
                    return (
                      <Pressable key={p} onPress={() => { setStake(String(p)); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                        style={[qb.preset, { backgroundColor: active?'#FF3B30':colors.surfaceVariant, borderColor: active?'#FF3B30':colors.border }]}>
                        <Text style={[qb.presetTxt, { color: active?'#fff':colors.textSecondary }]}>{currSym}{p}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              </ScrollView>
            </View>

            {/* Odds */}
            <View style={{ marginBottom: 8 }}>
              <Text style={[qb.fieldLbl, { color: colors.textSecondary }]}>ODDS</Text>
              <View style={[qb.inputWrap, { backgroundColor: colors.surfaceVariant }]}>
                <TextInput
                  style={[qb.input, { color: colors.textPrimary }]}
                  value={odds} onChangeText={setOdds}
                  placeholder="e.g. 1.85" placeholderTextColor={colors.textTertiary}
                  keyboardType="decimal-pad"
                />
                <Text style={[qb.prefix, { color: colors.textTertiary }]}>×</Text>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {ODDS_PRESETS.map(function(p) {
                    var active = odds === String(p);
                    return (
                      <Pressable key={p} onPress={() => { setOdds(String(p)); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                        style={[qb.preset, { backgroundColor: active?'#FF3B30':colors.surfaceVariant, borderColor: active?'#FF3B30':colors.border }]}>
                        <Text style={[qb.presetTxt, { color: active?'#fff':colors.textSecondary }]}>{p}×</Text>
                      </Pressable>
                    );
                  })}
                </View>
              </ScrollView>
            </View>

            {/* P&L preview */}
            <PnLPreview stake={stake} odds={odds} result={result} currSym={currSym} colors={colors} />

            {/* CTA */}
            <Animated.View style={btnAnimStyle}>
              <Pressable
                onPress={handleSave}
                onPressIn={function() { if (canSave) btnScale.value = withSpring(0.96, { damping: 10 }); }}
                onPressOut={function() { btnScale.value = withSpring(1, { damping: 12 }); }}
                style={[qb.cta, { backgroundColor: canSave ? '#FF3B30' : colors.border }]}
                disabled={!canSave}
              >
                <Text style={[qb.ctaTxt, { opacity: canSave ? 1 : 0.5 }]}>⚡ Add Bet</Text>
              </Pressable>
            </Animated.View>

            <View style={{ height: Platform.OS === 'ios' ? 36 : 20 }} />
          </ScrollView>
        </Animated.View>
      </PanGestureHandler>
    </Modal>
  );
}

var qb = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet:    { position:'absolute', left:0, right:0, bottom:0, top:0, borderTopLeftRadius:28, borderTopRightRadius:28, paddingHorizontal:20 },
  handle:   { width:40, height:4, borderRadius:2, alignSelf:'center', marginTop:10, marginBottom:2 },
  header:   { flexDirection:'row', justifyContent:'space-between', alignItems:'center', paddingVertical:14 },
  title:    { fontSize:20, fontWeight:'800', letterSpacing:-0.5 },
  sub:      { fontSize:11, fontWeight:'500', marginTop:2 },
  closeBtn: { width:34, height:34, borderRadius:17, alignItems:'center', justifyContent:'center' },
  fieldLbl: { fontSize:10, fontWeight:'700', textTransform:'uppercase', letterSpacing:0.8, marginBottom:8 },
  inputWrap:{ flexDirection:'row', alignItems:'center', borderRadius:16, paddingHorizontal:16, height:60, gap:8 },
  prefix:   { fontSize:20, fontWeight:'600' },
  input:    { flex:1, fontSize:24, fontWeight:'700', letterSpacing:-0.5 },
  hintChip: { backgroundColor:'rgba(255,59,48,0.12)', paddingHorizontal:10, paddingVertical:5, borderRadius:8 },
  hintTxt:  { color:'#FF3B30', fontSize:11, fontWeight:'700' },
  preset:   { paddingHorizontal:16, paddingVertical:9, borderRadius:999, borderWidth:0.5 },
  presetTxt:{ fontSize:13, fontWeight:'700' },
  cta:      { borderRadius:999, height:56, alignItems:'center', justifyContent:'center', shadowColor:'#FF3B30', shadowOffset:{width:0,height:5}, shadowOpacity:0.35, shadowRadius:14, elevation:8 },
  ctaTxt:   { color:'#fff', fontSize:16, fontWeight:'800', letterSpacing:0.3 },
});
