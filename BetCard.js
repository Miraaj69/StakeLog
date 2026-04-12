// BetCard.js — Premium redesign with proper swipe actions
import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Alert } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, withTiming,
  runOnJS, useAnimatedGestureHandler, interpolate, Extrapolation,
} from 'react-native-reanimated';
import { PanGestureHandler } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import { useTheme } from './useTheme';
import { formatMoney } from './calculations';

const SWIPE_THRESHOLD = 75;
const MAX_SWIPE = 110;

function calcPnL(bet) {
  if (bet.status === 'Won') return parseFloat(bet.stake) * (parseFloat(bet.odds) - 1);
  if (bet.status === 'Lost') return -parseFloat(bet.stake);
  return 0;
}

function StatusBadge({ status, colors }) {
  const cfg = {
    Won:     { bg: '#E8F8EE', color: '#1A9E4A', label: '✓  Won' },
    Lost:    { bg: '#FDECEA', color: '#D93025', label: '✕  Lost' },
    Pending: { bg: '#FFF8E7', color: '#E07B00', label: '◷  Pending' },
    Void:    { bg: '#F5F5F5', color: '#888',    label: '—  Void' },
  }[status] || { bg: '#F5F5F5', color: '#888', label: status };
  return (
    <View style={[bs.badge, { backgroundColor: cfg.bg }]}>
      <Text style={[bs.text, { color: cfg.color }]}>{cfg.label}</Text>
    </View>
  );
}
const bs = StyleSheet.create({
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  text: { fontSize: 11, fontWeight: '700', letterSpacing: 0.2 },
});

export default function BetCard({
  bet, onEdit, onDelete, onWon, onLost, onDuplicate,
  hidden, currSym = '₹', bulkMode, selected, onSelect,
}) {
  const { colors } = useTheme();
  const [expanded, setExpanded] = useState(false);
  const translateX = useSharedValue(0);
  const cardOpacity = useSharedValue(1);
  const cardScale = useSharedValue(1);

  const pnl = calcPnL(bet);
  const isPending = bet.status === 'Pending';

  const leftColor  = '#1A9E4A'; // won — swipe right
  const rightColor = '#D93025'; // delete — swipe left

  const gestureHandler = useAnimatedGestureHandler({
    onStart: (_, ctx) => { ctx.startX = translateX.value; },
    onActive: (e, ctx) => {
      const nx = ctx.startX + e.translationX;
      if (nx < 0) translateX.value = Math.max(nx, -MAX_SWIPE);
      else if (isPending) translateX.value = Math.min(nx, MAX_SWIPE);
    },
    onEnd: () => {
      if (translateX.value < -SWIPE_THRESHOLD) {
        runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Medium);
        cardOpacity.value = withTiming(0, { duration: 220 });
        cardScale.value = withTiming(0.92, { duration: 220 });
        translateX.value = withTiming(-MAX_SWIPE, { duration: 180 });
        runOnJS(onDelete)(bet.id);
      } else if (translateX.value > SWIPE_THRESHOLD && isPending) {
        runOnJS(Haptics.notificationAsync)(Haptics.NotificationFeedbackType.Success);
        runOnJS(onWon)(bet.id);
        translateX.value = withSpring(0, { damping: 18 });
      } else {
        translateX.value = withSpring(0, { damping: 18 });
      }
    },
  });

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }, { scale: cardScale.value }],
    opacity: cardOpacity.value,
  }));

  // Swipe background reveal
  const rightReveal = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [-MAX_SWIPE, -30], [1, 0], Extrapolation.CLAMP),
    transform: [{ scale: interpolate(translateX.value, [-MAX_SWIPE, -30], [1, 0.85], Extrapolation.CLAMP) }],
  }));
  const leftReveal = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [30, MAX_SWIPE], [0, 1], Extrapolation.CLAMP),
    transform: [{ scale: interpolate(translateX.value, [30, MAX_SWIPE], [0.85, 1], Extrapolation.CLAMP) }],
  }));

  const statusBarColor = {
    Won: '#1A9E4A', Lost: '#D93025', Pending: '#E07B00', Void: '#BDBDBD',
  }[bet.status] || '#BDBDBD';

  return (
    <View style={s.wrap}>
      {/* ── Swipe BG: Delete (right bg, swipe left) ── */}
      <Animated.View style={[s.swipeBg, s.swipeBgRight, { backgroundColor: rightColor }, rightReveal]}>
        <Text style={s.swipeEmoji}>🗑</Text>
        <Text style={s.swipeLabel}>Delete</Text>
      </Animated.View>

      {/* ── Swipe BG: Won (left bg, swipe right) ── */}
      {isPending && (
        <Animated.View style={[s.swipeBg, s.swipeBgLeft, { backgroundColor: leftColor }, leftReveal]}>
          <Text style={s.swipeEmoji}>✓</Text>
          <Text style={s.swipeLabel}>Won</Text>
        </Animated.View>
      )}

      <PanGestureHandler onGestureEvent={gestureHandler} activeOffsetX={[-10, 10]}>
        <Animated.View style={[s.card, { backgroundColor: colors.surface }, cardStyle]}>
          {/* Status color bar on left */}
          <View style={[s.colorBar, { backgroundColor: statusBarColor }]} />

          <View style={s.body}>
            {/* Row 1: Event + Status */}
            <View style={s.row1}>
              <View style={s.eventWrap}>
                {bulkMode && (
                  <Pressable onPress={() => onSelect(bet.id)}
                    style={[s.checkbox, { borderColor: selected ? colors.primary : '#D1D5DB', backgroundColor: selected ? colors.primary : 'transparent' }]}>
                    {selected && <Text style={{ color: '#fff', fontSize: 9, fontWeight: '900' }}>✓</Text>}
                  </Pressable>
                )}
                <View style={{ flex: 1 }}>
                  <Text style={[s.event, { color: colors.textPrimary }]} numberOfLines={1}>{bet.event}</Text>
                  <Text style={[s.betName, { color: colors.textTertiary }]} numberOfLines={1}>↳ {bet.bet}</Text>
                </View>
              </View>
              <StatusBadge status={bet.status} colors={colors} />
            </View>

            {/* Row 2: Tags */}
            <View style={s.tagsRow}>
              {[bet.bookie, bet.sport, bet.date].filter(Boolean).map(t => (
                <View key={t} style={[s.tag, { backgroundColor: colors.surfaceVariant }]}>
                  <Text style={[s.tagTxt, { color: colors.textTertiary }]}>{t}</Text>
                </View>
              ))}
              {(bet.tags || []).map(tag => (
                <View key={tag} style={[s.tag, { backgroundColor: '#EEF2FF' }]}>
                  <Text style={[s.tagTxt, { color: '#4F46E5' }]}>#{tag}</Text>
                </View>
              ))}
            </View>

            {/* Row 3: Numbers */}
            <View style={[s.numRow, { backgroundColor: colors.surfaceVariant, borderColor: colors.border }]}>
              <View style={s.numItem}>
                <Text style={[s.numLbl, { color: colors.textTertiary }]}>STAKE</Text>
                <Text style={[s.numVal, { color: colors.textPrimary }]}>
                  {hidden ? '••••' : formatMoney(parseFloat(bet.stake || 0), currSym)}
                </Text>
              </View>
              <View style={[s.numDiv, { backgroundColor: colors.border }]} />
              <View style={s.numItem}>
                <Text style={[s.numLbl, { color: colors.textTertiary }]}>ODDS</Text>
                <Text style={[s.numVal, { color: colors.textPrimary }]}>{parseFloat(bet.odds || 0).toFixed(2)}×</Text>
              </View>
              <View style={[s.numDiv, { backgroundColor: colors.border }]} />
              <View style={s.numItem}>
                {isPending ? (
                  <>
                    <Text style={[s.numLbl, { color: colors.textTertiary }]}>TO WIN</Text>
                    <Text style={[s.numVal, { color: '#1A9E4A' }]}>
                      {hidden ? '••••' : formatMoney(parseFloat(bet.stake || 0) * (parseFloat(bet.odds || 1) - 1), currSym)}
                    </Text>
                  </>
                ) : (
                  <>
                    <Text style={[s.numLbl, { color: colors.textTertiary }]}>P&L</Text>
                    <Text style={[s.pnl, { color: pnl >= 0 ? '#1A9E4A' : '#D93025' }]}>
                      {hidden ? '••••' : (pnl >= 0 ? '+' : '') + formatMoney(pnl, currSym)}
                    </Text>
                  </>
                )}
              </View>
            </View>

            {/* Expanded notes */}
            {expanded && bet.notes ? (
              <View style={[s.notes, { borderTopColor: colors.border }]}>
                <Text style={[s.notesTxt, { color: colors.textSecondary }]}>📝 {bet.notes}</Text>
              </View>
            ) : null}

            {/* Row 4: Actions */}
            {!bulkMode && (
              <View style={s.actions}>
                {isPending && (
                  <>
                    <Pressable
                      onPress={() => { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); onWon(bet.id); }}
                      style={[s.actionBtn, { backgroundColor: '#E8F8EE', flex: 1 }]}>
                      <Text style={[s.actionTxt, { color: '#1A9E4A' }]}>✓  Won</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onLost(bet.id); }}
                      style={[s.actionBtn, { backgroundColor: '#FDECEA', flex: 1 }]}>
                      <Text style={[s.actionTxt, { color: '#D93025' }]}>✕  Lost</Text>
                    </Pressable>
                  </>
                )}
                <Pressable onPress={() => setExpanded(e => !e)} style={[s.iconBtn, { backgroundColor: colors.surfaceVariant }]}>
                  <Text style={{ fontSize: 11, color: colors.textTertiary }}>{expanded ? '▲' : '▼'}</Text>
                </Pressable>
                <Pressable onPress={() => onEdit(bet)} style={[s.iconBtn, { backgroundColor: colors.surfaceVariant }]}>
                  <Text style={{ fontSize: 14 }}>✏️</Text>
                </Pressable>
                <Pressable onPress={() => onDuplicate(bet)} style={[s.iconBtn, { backgroundColor: colors.surfaceVariant }]}>
                  <Text style={{ fontSize: 14 }}>⎘</Text>
                </Pressable>
                <Pressable
                  onPress={() => Alert.alert('Delete Bet', 'This cannot be undone.', [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Delete', style: 'destructive', onPress: () => onDelete(bet.id) },
                  ])}
                  style={[s.iconBtn, { backgroundColor: '#FDECEA' }]}>
                  <Text style={{ fontSize: 14, color: '#D93025' }}>🗑</Text>
                </Pressable>
              </View>
            )}
          </View>
        </Animated.View>
      </PanGestureHandler>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { marginBottom: 10, position: 'relative' },
  swipeBg: {
    position: 'absolute', top: 0, bottom: 0,
    borderRadius: 20, alignItems: 'center', justifyContent: 'center',
    flexDirection: 'column', gap: 3,
    width: 90,
  },
  swipeBgRight: { right: 0 },
  swipeBgLeft: { left: 0 },
  swipeEmoji: { fontSize: 22, color: '#fff' },
  swipeLabel: { fontSize: 11, color: '#fff', fontWeight: '700', letterSpacing: 0.3 },
  card: {
    borderRadius: 20,
    flexDirection: 'row',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  colorBar: { width: 4, flexShrink: 0 },
  body: { flex: 1, padding: 14 },
  row1: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 10 },
  eventWrap: { flex: 1, flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  checkbox: { width: 20, height: 20, borderRadius: 6, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  event: { fontSize: 14, fontWeight: '700', letterSpacing: -0.2, lineHeight: 20, marginBottom: 2 },
  betName: { fontSize: 12, fontWeight: '500', lineHeight: 17 },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginBottom: 10 },
  tag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  tagTxt: { fontSize: 10, fontWeight: '600' },
  numRow: { flexDirection: 'row', borderRadius: 12, borderWidth: 0.5, overflow: 'hidden', marginBottom: 10 },
  numItem: { flex: 1, paddingVertical: 10, alignItems: 'center' },
  numDiv: { width: 0.5 },
  numLbl: { fontSize: 9, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 3 },
  numVal: { fontSize: 14, fontWeight: '700', letterSpacing: -0.3 },
  pnl: { fontSize: 16, fontWeight: '800', letterSpacing: -0.5 },
  notes: { borderTopWidth: 0.5, paddingTop: 10, marginBottom: 6 },
  notesTxt: { fontSize: 12, lineHeight: 18, fontStyle: 'italic' },
  actions: { flexDirection: 'row', gap: 7, alignItems: 'center' },
  actionBtn: { borderRadius: 999, paddingVertical: 8, alignItems: 'center', justifyContent: 'center' },
  actionTxt: { fontSize: 12, fontWeight: '700' },
  iconBtn: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
});
