// BetCard.js — Premium redesign: crisp hierarchy, smooth swipe, micro-animations
import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Alert, Animated as RNAnimated } from 'react-native';
import { PanGestureHandler } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue, useAnimatedStyle, useAnimatedGestureHandler,
  withSpring, withTiming, interpolate, Extrapolation, runOnJS,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTheme } from './useTheme';
import { formatMoney } from './calculations';

function calcPnL(bet) {
  if (bet.status === 'Won') return parseFloat(bet.stake) * (parseFloat(bet.odds) - 1);
  if (bet.status === 'Lost') return -parseFloat(bet.stake);
  return 0;
}

const STATUS_CFG = {
  Won: { accent: '#00C853', bg: 'rgba(0,200,83,0.08)', border: 'rgba(0,200,83,0.2)', color: '#00C853', label: 'Won' },
  Lost: { accent: '#E53935', bg: 'rgba(229,57,53,0.08)', border: 'rgba(229,57,53,0.2)', color: '#E53935', label: 'Lost' },
  Pending: { accent: '#FF6F00', bg: 'rgba(255,111,0,0.08)', border: 'rgba(255,111,0,0.2)', color: '#FF6F00', label: 'Pending' },
  Void: { accent: '#757575', bg: 'rgba(117,117,117,0.07)', border: 'rgba(117,117,117,0.18)', color: '#757575', label: 'Void' },
};

const SWIPE_THRESHOLD = 70;
const MAX_SWIPE = 105;

export default function BetCard({ bet, onEdit, onDelete, onWon, onLost, onDuplicate, hidden, currSym, bulkMode, selected, onSelect }) {
  currSym = currSym || '₹';
  const { colors, isDark } = useTheme();
  const [expanded, setExpanded] = useState(false);
  const pressScale = useState(new RNAnimated.Value(1))[0];

  const pnl = calcPnL(bet);
  const isPending = bet.status === 'Pending';
  const cfg = STATUS_CFG[bet.status] || STATUS_CFG.Void;

  const tx = useSharedValue(0);
  const cardOp = useSharedValue(1);

  const gesture = useAnimatedGestureHandler({
    onStart: (_, ctx) => { ctx.sx = tx.value; },
    onActive: (e, ctx) => {
      const nx = ctx.sx + e.translationX;
      if (nx < 0) tx.value = Math.max(nx, -MAX_SWIPE);
      else if (isPending) tx.value = Math.min(nx, MAX_SWIPE);
    },
    onEnd: () => {
      if (tx.value < -SWIPE_THRESHOLD) {
        runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Medium);
        cardOp.value = withTiming(0, { duration: 180 });
        tx.value = withTiming(-MAX_SWIPE, { duration: 160 });
        runOnJS(onDelete)(bet.id);
      } else if (tx.value > SWIPE_THRESHOLD && isPending) {
        runOnJS(Haptics.notificationAsync)(Haptics.NotificationFeedbackType.Success);
        runOnJS(onWon)(bet.id);
        tx.value = withSpring(0, { damping: 20 });
      } else {
        tx.value = withSpring(0, { damping: 20, stiffness: 220 });
      }
    },
  });

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: tx.value }],
    opacity: cardOp.value,
  }));

  const rightReveal = useAnimatedStyle(() => ({
    opacity: interpolate(tx.value, [-MAX_SWIPE, -28], [1, 0], Extrapolation.CLAMP),
    transform: [{ scale: interpolate(tx.value, [-MAX_SWIPE, -28], [1, 0.8], Extrapolation.CLAMP) }],
  }));

  const leftReveal = useAnimatedStyle(() => ({
    opacity: interpolate(tx.value, [28, MAX_SWIPE], [0, 1], Extrapolation.CLAMP),
    transform: [{ scale: interpolate(tx.value, [28, MAX_SWIPE], [0.8, 1], Extrapolation.CLAMP) }],
  }));

  function onPressIn() { RNAnimated.spring(pressScale, { toValue: 0.97, useNativeDriver: true, damping: 16 }).start(); }
  function onPressOut() { RNAnimated.spring(pressScale, { toValue: 1, useNativeDriver: true, damping: 14 }).start(); }

  const potentialWin = isPending && parseFloat(bet.stake) && parseFloat(bet.odds) > 1
    ? parseFloat(bet.stake) * (parseFloat(bet.odds) - 1)
    : null;

  return (
    <View style={st.wrap}>
      {/* Swipe backgrounds */}
      <Animated.View style={[st.swipeBg, st.swipeRight, rightReveal]}>
        <Text style={{ fontSize: 22 }}>🗑</Text>
        <Text style={st.swipeLabel}>Delete</Text>
      </Animated.View>
      {isPending && (
        <Animated.View style={[st.swipeBg, st.swipeLeft, leftReveal]}>
          <Text style={{ fontSize: 22 }}>✓</Text>
          <Text style={st.swipeLabel}>Won</Text>
        </Animated.View>
      )}

      <PanGestureHandler onGestureEvent={gesture} activeOffsetX={[-12, 12]}>
        <Animated.View style={cardStyle}>
          <RNAnimated.View style={{ transform: [{ scale: pressScale }] }}>
            <Pressable
              onPressIn={onPressIn}
              onPressOut={onPressOut}
              onPress={() => setExpanded(e => !e)}
              style={[st.card, {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              }]}
            >
              {/* Left accent bar */}
              <View style={[st.accent, { backgroundColor: cfg.accent }]} />

              <View style={st.body}>
                {/* Row 1: Event name + Status badge */}
                <View style={st.r1}>
                  <View style={st.titleGroup}>
                    {bulkMode && (
                      <Pressable
                        onPress={() => onSelect(bet.id)}
                        style={[st.checkbox, {
                          borderColor: selected ? '#E50914' : colors.border,
                          backgroundColor: selected ? '#E50914' : 'transparent',
                        }]}
                      >
                        {selected && <Text style={{ color: '#fff', fontSize: 8, fontWeight: '900' }}>✓</Text>}
                      </Pressable>
                    )}
                    <View style={{ flex: 1 }}>
                      <Text style={[st.event, { color: colors.textPrimary }]} numberOfLines={1}>{bet.event}</Text>
                      <Text style={[st.betDesc, { color: colors.textTertiary }]} numberOfLines={1}>↳ {bet.bet}</Text>
                    </View>
                  </View>
                  <View style={[st.statusBadge, { backgroundColor: cfg.bg, borderColor: cfg.border }]}>
                    <View style={[st.statusDot, { backgroundColor: cfg.accent }]} />
                    <Text style={[st.statusTxt, { color: cfg.color }]}>{cfg.label}</Text>
                  </View>
                </View>

                {/* Row 2: Numbers strip */}
                <View style={[st.numStrip, { backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)', borderColor: colors.border }]}>
                  <View style={st.numCell}>
                    <Text style={[st.numLbl, { color: colors.textTertiary }]}>Stake</Text>
                    <Text style={[st.numVal, { color: colors.textPrimary }]}>
                      {hidden ? '••••' : formatMoney(parseFloat(bet.stake || 0), currSym)}
                    </Text>
                  </View>
                  <View style={[st.numDiv, { backgroundColor: colors.border }]} />
                  <View style={st.numCell}>
                    <Text style={[st.numLbl, { color: colors.textTertiary }]}>Odds</Text>
                    <Text style={[st.numVal, { color: colors.textPrimary }]}>{parseFloat(bet.odds || 0).toFixed(2)}×</Text>
                  </View>
                  <View style={[st.numDiv, { backgroundColor: colors.border }]} />
                  <View style={st.numCell}>
                    {isPending ? (
                      <>
                        <Text style={[st.numLbl, { color: colors.textTertiary }]}>To Win</Text>
                        <Text style={[st.numValAccent, { color: '#00C853' }]}>
                          {hidden ? '••' : formatMoney(parseFloat(bet.stake || 0) * (parseFloat(bet.odds || 1) - 1), currSym)}
                        </Text>
                      </>
                    ) : (
                      <>
                        <Text style={[st.numLbl, { color: colors.textTertiary }]}>P&L</Text>
                        <Text style={[st.numValAccent, { color: pnl >= 0 ? '#00C853' : '#E53935' }]}>
                          {hidden ? '••' : (pnl >= 0 ? '+' : '') + formatMoney(pnl, currSym)}
                        </Text>
                      </>
                    )}
                  </View>
                </View>

                {/* Row 3: Meta tags */}
                <View style={st.metaRow}>
                  {[bet.bookie, bet.sport, bet.date].filter(Boolean).map(tag => (
                    <View key={tag} style={[st.metaTag, { backgroundColor: colors.surfaceVariant }]}>
                      <Text style={[st.metaTagTxt, { color: colors.textTertiary }]}>{tag}</Text>
                    </View>
                  ))}
                  {(bet.tags || []).map(tag => (
                    <View key={tag} style={[st.metaTag, { backgroundColor: 'rgba(229,9,20,0.07)' }]}>
                      <Text style={[st.metaTagTxt, { color: '#E50914' }]}>#{tag}</Text>
                    </View>
                  ))}
                </View>

                {/* Expanded notes */}
                {expanded && bet.notes ? (
                  <View style={[st.notesBox, { borderTopColor: colors.border }]}>
                    <Text style={[st.notesTxt, { color: colors.textSecondary }]}>📝 {bet.notes}</Text>
                  </View>
                ) : null}

                {/* Action row */}
                {!bulkMode && (
                  <View style={st.actions}>
                    {isPending && (
                      <>
                        <Pressable
                          onPress={() => { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); onWon(bet.id); }}
                          style={[st.actionBtn, { backgroundColor: 'rgba(0,200,83,0.1)', flex: 1 }]}
                        >
                          <Text style={{ color: '#00C853', fontWeight: '700', fontSize: 13 }}>✓  Won</Text>
                        </Pressable>
                        <Pressable
                          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); onLost(bet.id); }}
                          style={[st.actionBtn, { backgroundColor: 'rgba(229,57,53,0.1)', flex: 1 }]}
                        >
                          <Text style={{ color: '#E53935', fontWeight: '700', fontSize: 13 }}>✕  Lost</Text>
                        </Pressable>
                      </>
                    )}
                    <Pressable
                      onPress={() => onEdit(bet)}
                      style={[st.iconBtn, { backgroundColor: colors.surfaceVariant }]}
                    >
                      <Text style={{ fontSize: 13 }}>✏️</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => onDuplicate(bet)}
                      style={[st.iconBtn, { backgroundColor: colors.surfaceVariant }]}
                    >
                      <Text style={{ fontSize: 13 }}>⎘</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => Alert.alert('Delete Bet', 'This cannot be undone.', [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Delete', style: 'destructive', onPress: () => onDelete(bet.id) },
                      ])}
                      style={[st.iconBtn, { backgroundColor: 'rgba(229,57,53,0.09)' }]}
                    >
                      <Text style={{ fontSize: 13, color: '#E53935' }}>🗑</Text>
                    </Pressable>
                  </View>
                )}
              </View>
            </Pressable>
          </RNAnimated.View>
        </Animated.View>
      </PanGestureHandler>
    </View>
  );
}

const st = StyleSheet.create({
  wrap: { marginBottom: 10, position: 'relative' },

  // Swipe reveal layers
  swipeBg: {
    position: 'absolute', top: 0, bottom: 0,
    width: 90, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
  },
  swipeRight: { right: 0, backgroundColor: '#E53935' },
  swipeLeft: { left: 0, backgroundColor: '#00C853' },
  swipeLabel: { fontSize: 10, color: '#fff', fontWeight: '700', marginTop: 3 },

  // Card
  card: {
    borderRadius: 22, flexDirection: 'row', overflow: 'hidden',
    borderWidth: 0.5,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 12, elevation: 3,
  },
  accent: { width: 3.5, flexShrink: 0 },
  body: { flex: 1, padding: 14 },

  // R1
  r1: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, marginBottom: 11 },
  titleGroup: { flex: 1, flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  checkbox: { width: 20, height: 20, borderRadius: 6, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', marginTop: 2, flexShrink: 0 },
  event: { fontSize: 14, fontWeight: '700', letterSpacing: -0.2, lineHeight: 20, marginBottom: 3 },
  betDesc: { fontSize: 11, fontWeight: '500', lineHeight: 16 },

  // Status
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 9, paddingVertical: 5, borderRadius: 999, borderWidth: 0.5, flexShrink: 0 },
  statusDot: { width: 5, height: 5, borderRadius: 2.5 },
  statusTxt: { fontSize: 11, fontWeight: '700' },

  // Numbers
  numStrip: { flexDirection: 'row', borderRadius: 12, borderWidth: 0.5, overflow: 'hidden', marginBottom: 10 },
  numCell: { flex: 1, paddingVertical: 9, alignItems: 'center' },
  numDiv: { width: 0.5 },
  numLbl: { fontSize: 9, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 3 },
  numVal: { fontSize: 13, fontWeight: '700', letterSpacing: -0.2 },
  numValAccent: { fontSize: 15, fontWeight: '800', letterSpacing: -0.4 },

  // Meta tags
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginBottom: 10 },
  metaTag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  metaTagTxt: { fontSize: 10, fontWeight: '600' },

  // Notes
  notesBox: { borderTopWidth: 0.5, paddingTop: 10, marginBottom: 8 },
  notesTxt: { fontSize: 12, lineHeight: 18, fontStyle: 'italic' },

  // Actions
  actions: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  actionBtn: { borderRadius: 999, paddingVertical: 8, alignItems: 'center', justifyContent: 'center' },
  iconBtn: { width: 34, height: 34, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
});
