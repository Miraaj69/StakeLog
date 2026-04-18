// BetCard.js — Premium v2: Indigo accent, green/red semantic only, swipe gestures
import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Alert } from 'react-native';
import { PanGestureHandler } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue, useAnimatedStyle, useAnimatedGestureHandler,
  withSpring, withTiming, interpolate, Extrapolation, runOnJS,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTheme } from './useTheme';
import { formatMoney } from './calculations';

function calcPnL(bet) {
  if (bet.status === 'Won')  return parseFloat(bet.stake) * (parseFloat(bet.odds) - 1);
  if (bet.status === 'Lost') return -parseFloat(bet.stake);
  return 0;
}

var STATUS_CFG = {
  Won:     { dot: '#4ADE80', label: '✓  Won',     badgeBg: 'rgba(74,222,128,0.10)',  badgeBorder: 'rgba(74,222,128,0.25)',  badgeText: '#4ADE80' },
  Lost:    { dot: '#F87171', label: '✕  Lost',    badgeBg: 'rgba(248,113,113,0.10)', badgeBorder: 'rgba(248,113,113,0.25)', badgeText: '#F87171' },
  Pending: { dot: '#FCD34D', label: '◷  Pending', badgeBg: 'rgba(252,211,77,0.12)',  badgeBorder: 'rgba(252,211,77,0.28)',  badgeText: '#F59E0B' },
  Void:    { dot: '#6B7280', label: '—  Void',    badgeBg: 'rgba(107,114,128,0.10)', badgeBorder: 'rgba(107,114,128,0.20)', badgeText: '#6B7280' },
};

var SWIPE_THRESHOLD = 72;
var MAX_SWIPE = 105;

export default function BetCard({ bet, onEdit, onDelete, onWon, onLost, onDuplicate, hidden, currSym, bulkMode, selected, onSelect }) {
  currSym = currSym || '₹';
  var { colors, isDark } = useTheme();
  var [expanded, setExpanded] = useState(false);
  var pnl       = calcPnL(bet);
  var isPending = bet.status === 'Pending';
  var cfg       = STATUS_CFG[bet.status] || STATUS_CFG.Void;

  var tx      = useSharedValue(0);
  var cardOp  = useSharedValue(1);

  var gesture = useAnimatedGestureHandler({
    onStart: function(_, ctx) { ctx.sx = tx.value; },
    onActive: function(e, ctx) {
      var nx = ctx.sx + e.translationX;
      if (nx < 0) tx.value = Math.max(nx, -MAX_SWIPE);
      else if (isPending) tx.value = Math.min(nx, MAX_SWIPE);
    },
    onEnd: function() {
      if (tx.value < -SWIPE_THRESHOLD) {
        runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Medium);
        cardOp.value = withTiming(0, { duration: 200 });
        tx.value = withTiming(-MAX_SWIPE, { duration: 180 });
        runOnJS(onDelete)(bet.id);
      } else if (tx.value > SWIPE_THRESHOLD && isPending) {
        runOnJS(Haptics.notificationAsync)(Haptics.NotificationFeedbackType.Success);
        runOnJS(onWon)(bet.id);
        tx.value = withSpring(0, { damping: 18 });
      } else {
        tx.value = withSpring(0, { damping: 18 });
      }
    },
  });

  var cardStyle   = useAnimatedStyle(function() { return { transform: [{ translateX: tx.value }], opacity: cardOp.value }; });
  var rightReveal = useAnimatedStyle(function() { return { opacity: interpolate(tx.value, [-MAX_SWIPE, -20], [1, 0], Extrapolation.CLAMP) }; });
  var leftReveal  = useAnimatedStyle(function() { return { opacity: interpolate(tx.value, [20, MAX_SWIPE], [0, 1], Extrapolation.CLAMP) }; });

  return (
    <View style={st.wrap}>
      {/* Swipe bg — delete */}
      <Animated.View style={[st.swipeBg, st.swipeBgRight, rightReveal]}>
        <Text style={st.swipeIcon}>🗑</Text>
        <Text style={st.swipeLbl}>Delete</Text>
      </Animated.View>
      {isPending && (
        <Animated.View style={[st.swipeBg, st.swipeBgLeft, leftReveal]}>
          <Text style={st.swipeIcon}>✓</Text>
          <Text style={st.swipeLbl}>Won</Text>
        </Animated.View>
      )}

      <PanGestureHandler onGestureEvent={gesture} activeOffsetX={[-10, 10]}>
        <Animated.View style={[st.card, {
          backgroundColor: colors.surface,
          borderColor: colors.border,
        }, cardStyle]}>
          {/* Left accent bar — status colored */}
          <View style={[st.accentBar, { backgroundColor: cfg.dot }]} />

          <View style={st.body}>
            {/* Row 1: Event + Status */}
            <View style={st.row1}>
              <View style={st.titleWrap}>
                {bulkMode && (
                  <Pressable onPress={() => onSelect(bet.id)}
                    style={[st.checkbox, {
                      borderColor: selected ? '#7C6BFF' : colors.border,
                      backgroundColor: selected ? '#7C6BFF' : 'transparent',
                    }]}>
                    {selected && <Text style={{ color: '#fff', fontSize: 9, fontWeight: '900' }}>✓</Text>}
                  </Pressable>
                )}
                <View style={{ flex: 1 }}>
                  <Text style={[st.event, { color: colors.textPrimary }]} numberOfLines={2}>{bet.event}</Text>
                  <Text style={[st.betDesc, { color: colors.textTertiary }]} numberOfLines={1}>↳ {bet.bet}</Text>
                </View>
              </View>
              <View style={[st.statusBadge, { backgroundColor: cfg.badgeBg, borderColor: cfg.badgeBorder }]}>
                <Text style={[st.statusTxt, { color: cfg.badgeText }]}>{cfg.label}</Text>
              </View>
            </View>

            {/* Row 2: Numbers */}
            <View style={[st.numRow, { backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)', borderColor: colors.border }]}>
              <View style={st.numItem}>
                <Text style={[st.numLbl, { color: colors.textTertiary }]}>STAKE</Text>
                <Text style={[st.numVal, { color: colors.textPrimary }]}>
                  {hidden ? '••••' : formatMoney(parseFloat(bet.stake || 0), currSym)}
                </Text>
              </View>
              <View style={[st.numDiv, { backgroundColor: colors.border }]} />
              <View style={st.numItem}>
                <Text style={[st.numLbl, { color: colors.textTertiary }]}>ODDS</Text>
                <Text style={[st.numVal, { color: colors.textPrimary }]}>{parseFloat(bet.odds || 0).toFixed(2)}×</Text>
              </View>
              <View style={[st.numDiv, { backgroundColor: colors.border }]} />
              <View style={st.numItem}>
                {isPending ? (
                  <>
                    <Text style={[st.numLbl, { color: colors.textTertiary }]}>TO WIN</Text>
                    <Text style={[st.pnl, { color: '#4ADE80' }]}>
                      {hidden ? '••' : formatMoney(parseFloat(bet.stake || 0) * (parseFloat(bet.odds || 1) - 1), currSym)}
                    </Text>
                  </>
                ) : (
                  <>
                    <Text style={[st.numLbl, { color: colors.textTertiary }]}>P&L</Text>
                    <Text style={[st.pnl, { color: pnl >= 0 ? '#4ADE80' : '#F87171' }]}>
                      {hidden ? '••' : (pnl >= 0 ? '+' : '') + formatMoney(pnl, currSym)}
                    </Text>
                  </>
                )}
              </View>
            </View>

            {/* Row 3: Meta tags */}
            <View style={st.metaRow}>
              {[bet.bookie, bet.sport, bet.date].filter(Boolean).map(function(t) {
                return (
                  <View key={t} style={[st.metaTag, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)' }]}>
                    <Text style={[st.metaTxt, { color: colors.textTertiary }]}>{t}</Text>
                  </View>
                );
              })}
              {(bet.tags || []).map(function(tag) {
                return (
                  <View key={tag} style={[st.metaTag, { backgroundColor: 'rgba(124,107,255,0.08)' }]}>
                    <Text style={[st.metaTxt, { color: '#A89DFF' }]}>#{tag}</Text>
                  </View>
                );
              })}
              {bet.betType && bet.betType !== 'Single' && (
                <View style={[st.metaTag, { backgroundColor: 'rgba(252,211,77,0.10)' }]}>
                  <Text style={[st.metaTxt, { color: '#F59E0B' }]}>{bet.betType}</Text>
                </View>
              )}
            </View>

            {/* Expanded notes */}
            {expanded && bet.notes ? (
              <View style={[st.notes, { borderTopColor: colors.border }]}>
                <Text style={[st.notesTxt, { color: colors.textSecondary }]}>📝 {bet.notes}</Text>
              </View>
            ) : null}

            {/* Actions */}
            {!bulkMode && (
              <View style={st.actions}>
                {isPending && (
                  <>
                    <Pressable
                      onPress={() => { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); onWon(bet.id); }}
                      style={[st.actionBtn, { backgroundColor: 'rgba(74,222,128,0.12)', borderColor: 'rgba(74,222,128,0.25)', borderWidth: 0.5, flex: 1 }]}
                    >
                      <Text style={{ color: '#4ADE80', fontWeight: '700', fontSize: 13 }}>✓  Won</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); onLost(bet.id); }}
                      style={[st.actionBtn, { backgroundColor: 'rgba(248,113,113,0.10)', borderColor: 'rgba(248,113,113,0.22)', borderWidth: 0.5, flex: 1 }]}
                    >
                      <Text style={{ color: '#F87171', fontWeight: '700', fontSize: 13 }}>✕  Lost</Text>
                    </Pressable>
                  </>
                )}
                <Pressable onPress={() => setExpanded(function(e) { return !e; })} style={[st.iconBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.04)' }]}>
                  <Text style={{ fontSize: 10, color: colors.textTertiary }}>{expanded ? '▲' : '▼'}</Text>
                </Pressable>
                <Pressable onPress={() => onEdit(bet)} style={[st.iconBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.04)' }]}>
                  <Text style={{ fontSize: 13 }}>✏️</Text>
                </Pressable>
                <Pressable onPress={() => onDuplicate(bet)} style={[st.iconBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.04)' }]}>
                  <Text style={{ fontSize: 13 }}>⎘</Text>
                </Pressable>
                <Pressable
                  onPress={() => Alert.alert('Delete Bet', 'This cannot be undone.', [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Delete', style: 'destructive', onPress: () => onDelete(bet.id) },
                  ])}
                  style={[st.iconBtn, { backgroundColor: 'rgba(248,113,113,0.10)' }]}
                >
                  <Text style={{ fontSize: 13, color: '#F87171' }}>🗑</Text>
                </Pressable>
              </View>
            )}
          </View>
        </Animated.View>
      </PanGestureHandler>
    </View>
  );
}

var st = StyleSheet.create({
  wrap:        { marginBottom: 10, position: 'relative' },
  swipeBg:     { position: 'absolute', top: 0, bottom: 0, width: 90, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  swipeBgRight:{ right: 0, backgroundColor: '#EF4444' },
  swipeBgLeft: { left: 0,  backgroundColor: '#22C55E' },
  swipeIcon:   { fontSize: 20, color: '#fff', fontWeight: '700' },
  swipeLbl:    { fontSize: 10, color: '#fff', fontWeight: '700', marginTop: 2 },

  card: {
    borderRadius: 22, flexDirection: 'row', overflow: 'hidden', borderWidth: 0.5,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 10, elevation: 3,
  },
  accentBar: { width: 4, flexShrink: 0 },
  body:      { flex: 1, padding: 14 },

  row1:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, marginBottom: 12 },
  titleWrap: { flex: 1, flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  checkbox:  { width: 20, height: 20, borderRadius: 6, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', marginTop: 2, flexShrink: 0 },
  event:     { fontSize: 15, fontWeight: '700', letterSpacing: -0.3, lineHeight: 21, marginBottom: 3 },
  betDesc:   { fontSize: 12, fontWeight: '500', lineHeight: 17 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, borderWidth: 0.5, flexShrink: 0 },
  statusTxt:   { fontSize: 11, fontWeight: '700' },

  numRow:  { flexDirection: 'row', borderRadius: 12, borderWidth: 0.5, overflow: 'hidden', marginBottom: 10 },
  numItem: { flex: 1, paddingVertical: 10, alignItems: 'center' },
  numDiv:  { width: 0.5 },
  numLbl:  { fontSize: 9, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 3 },
  numVal:  { fontSize: 14, fontWeight: '700', letterSpacing: -0.3 },
  pnl:     { fontSize: 16, fontWeight: '900', letterSpacing: -0.5 },

  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginBottom: 10 },
  metaTag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 7 },
  metaTxt: { fontSize: 10, fontWeight: '600' },

  notes:    { borderTopWidth: 0.5, paddingTop: 10, marginBottom: 6 },
  notesTxt: { fontSize: 12, lineHeight: 18, fontStyle: 'italic' },

  actions:   { flexDirection: 'row', gap: 7, alignItems: 'center' },
  actionBtn: { borderRadius: 999, paddingVertical: 9, alignItems: 'center', justifyContent: 'center' },
  iconBtn:   { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
});
