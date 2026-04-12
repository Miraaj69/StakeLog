// components/BetCard.js — Premium Redesign
import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Alert } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, withTiming,
  runOnJS, useAnimatedGestureHandler, interpolate, Extrapolation,
} from 'react-native-reanimated';
import { PanGestureHandler } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../hooks/useTheme';
import { calcPnL, formatMoney } from '../utils/calculations';
import { Spacing, Radius, Typography, Shadows } from '../utils/theme';

const SWIPE_THRESHOLD = 80;
const MAX_SWIPE = 100;

const STATUS_CONFIG = {
  Won:     { icon: '✓', label: 'Won' },
  Lost:    { icon: '✕', label: 'Lost' },
  Pending: { icon: '·', label: 'Pending' },
  Void:    { icon: '—', label: 'Void' },
};

function StatusBadge({ status, colors }) {
  const c = {
    Won: { bg: colors.profitContainer, border: colors.profitBorder, color: colors.profit },
    Lost: { bg: colors.lossContainer, border: colors.lossBorder, color: colors.loss },
    Pending: { bg: colors.pendingContainer, border: colors.pendingBorder, color: colors.pending },
    Void: { bg: colors.voidContainer, border: colors.voidBorder, color: colors.void },
  }[status] || { bg: colors.surfaceVariant, border: colors.border, color: colors.textTertiary };
  const cfg = STATUS_CONFIG[status] || { icon: '?', label: status };
  return (
    <View style={[badgeS.wrap, { backgroundColor: c.bg, borderColor: c.border }]}>
      <Text style={[badgeS.icon, { color: c.color }]}>{cfg.icon}</Text>
      <Text style={[badgeS.text, { color: c.color }]}>{cfg.label}</Text>
    </View>
  );
}
const badgeS = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 9, paddingVertical: 4, borderRadius: Radius.full, borderWidth: 0.5 },
  icon: { fontSize: 10, fontWeight: '800' },
  text: { fontSize: 11, fontWeight: '700' },
});

export default function BetCard({ bet, onEdit, onDelete, onWon, onLost, onDuplicate, onSlip, hidden, currSym = '₹', bulkMode, selected, onSelect }) {
  const { colors } = useTheme();
  const [expanded, setExpanded] = useState(false);
  const translateX = useSharedValue(0);
  const cardOpacity = useSharedValue(1);

  const pnl = calcPnL(bet);
  const statusColor = { Won: colors.profit, Lost: colors.loss, Pending: colors.pending, Void: colors.void }[bet.status] || colors.textTertiary;

  const countdown = React.useMemo(() => {
    if (bet.status !== 'Pending' || !bet.matchTime) return null;
    const diff = new Date(`${bet.date}T${bet.matchTime}`) - new Date();
    if (diff <= 0) return '⚠️ Overdue';
    const h = Math.floor(diff / 3600000), m = Math.floor((diff % 3600000) / 60000);
    return h > 24 ? `${Math.floor(h / 24)}d ${h % 24}h` : h > 0 ? `${h}h ${m}m` : `${m}m`;
  }, [bet]);

  const gestureHandler = useAnimatedGestureHandler({
    onStart: (_, ctx) => { ctx.startX = translateX.value; },
    onActive: (e, ctx) => {
      const newX = ctx.startX + e.translationX;
      if (newX < 0) translateX.value = Math.max(newX, -MAX_SWIPE);
      else if (bet.status === 'Pending') translateX.value = Math.min(newX, MAX_SWIPE);
    },
    onEnd: () => {
      if (translateX.value < -SWIPE_THRESHOLD) {
        runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Medium);
        runOnJS(onDelete)(bet.id);
        cardOpacity.value = withTiming(0, { duration: 180 });
      } else if (translateX.value > SWIPE_THRESHOLD && bet.status === 'Pending') {
        runOnJS(Haptics.notificationAsync)(Haptics.NotificationFeedbackType.Success);
        runOnJS(onWon)(bet.id);
        translateX.value = withSpring(0);
      } else {
        translateX.value = withSpring(0);
      }
    },
  });

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
    opacity: cardOpacity.value,
  }));
  const rightBgStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [-MAX_SWIPE, -20], [1, 0], Extrapolation.CLAMP),
  }));
  const leftBgStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [20, MAX_SWIPE], [0, 1], Extrapolation.CLAMP),
  }));

  const s = styles(colors);

  return (
    <View style={s.container}>
      <Animated.View style={[s.swipeBgRight, rightBgStyle]}>
        <Text style={s.swipeLabel}>Delete</Text>
        <Text style={s.swipeIcon}>🗑</Text>
      </Animated.View>
      <Animated.View style={[s.swipeBgLeft, leftBgStyle]}>
        <Text style={s.swipeIcon}>✓</Text>
        <Text style={s.swipeLabel}>Won</Text>
      </Animated.View>

      <PanGestureHandler onGestureEvent={gestureHandler} activeOffsetX={[-12, 12]}>
        <Animated.View style={[s.card, cardStyle]}>
          {/* Left accent bar */}
          <View style={[s.accentBar, { backgroundColor: statusColor }]} />

          <View style={s.body}>
            {/* Header */}
            <View style={s.headerRow}>
              <View style={s.headerLeft}>
                {bulkMode && (
                  <Pressable onPress={() => onSelect(bet.id)}
                    style={[s.checkbox, { borderColor: selected ? colors.primary : colors.border, backgroundColor: selected ? colors.primary : 'transparent' }]}>
                    {selected && <Text style={{ color: '#fff', fontSize: 10, fontWeight: '900' }}>✓</Text>}
                  </Pressable>
                )}
                <View style={{ flex: 1 }}>
                  <Text style={[s.eventText, { color: colors.textPrimary }]} numberOfLines={2}>{bet.event}</Text>
                  <Text style={[s.betLabel, { color: colors.textTertiary }]} numberOfLines={1}>↳ {bet.bet}</Text>
                </View>
              </View>
              <View style={{ alignItems: 'flex-end', gap: 5, flexShrink: 0 }}>
                <StatusBadge status={bet.status} colors={colors} />
                {countdown && (
                  <View style={[s.countdownBadge, { backgroundColor: countdown.includes('Overdue') ? colors.lossContainer : colors.pendingContainer, borderColor: countdown.includes('Overdue') ? colors.lossBorder : colors.pendingBorder }]}>
                    <Text style={[s.countdownText, { color: countdown.includes('Overdue') ? colors.loss : colors.pending }]}>{countdown}</Text>
                  </View>
                )}
              </View>
            </View>

            {/* Tags */}
            <View style={s.tagsRow}>
              {[bet.bookie, bet.sport, bet.date].filter(Boolean).map(t => (
                <View key={t} style={[s.tag, { backgroundColor: colors.surfaceVariant, borderColor: colors.border }]}>
                  <Text style={[s.tagText, { color: colors.textTertiary }]}>{t}</Text>
                </View>
              ))}
              {bet.betType && bet.betType !== 'Single' && (
                <View style={[s.tag, { backgroundColor: colors.primaryContainer, borderColor: colors.primaryBorder }]}>
                  <Text style={[s.tagText, { color: colors.primary }]}>{bet.betType}</Text>
                </View>
              )}
              {(bet.tags || []).map(tag => (
                <View key={tag} style={[s.tag, { backgroundColor: colors.primaryContainer, borderColor: colors.primaryBorder }]}>
                  <Text style={[s.tagText, { color: colors.primary }]}>#{tag}</Text>
                </View>
              ))}
            </View>

            {/* Numbers row */}
            <View style={[s.numsRow, { backgroundColor: colors.surfaceVariant, borderColor: colors.border }]}>
              <View style={s.numItem}>
                <Text style={[s.numLabel, { color: colors.textTertiary }]}>STAKE</Text>
                <Text style={[s.numVal, { color: colors.textPrimary }]}>
                  {hidden ? `${currSym}••••` : formatMoney(parseFloat(bet.stake || 0), currSym)}
                </Text>
              </View>
              <View style={[s.numDivider, { backgroundColor: colors.border }]} />
              <View style={s.numItem}>
                <Text style={[s.numLabel, { color: colors.textTertiary }]}>ODDS</Text>
                <Text style={[s.numVal, { color: colors.textPrimary }]}>{bet.odds}×</Text>
              </View>
              {bet.status === 'Pending' && (
                <>
                  <View style={[s.numDivider, { backgroundColor: colors.border }]} />
                  <View style={s.numItem}>
                    <Text style={[s.numLabel, { color: colors.textTertiary }]}>TO WIN</Text>
                    <Text style={[s.numVal, { color: colors.profit }]}>
                      {hidden ? `${currSym}••` : formatMoney(parseFloat(bet.stake || 0) * (parseFloat(bet.odds || 1) - 1), currSym)}
                    </Text>
                  </View>
                </>
              )}
              {(bet.status === 'Won' || bet.status === 'Lost') && (
                <>
                  <View style={[s.numDivider, { backgroundColor: colors.border }]} />
                  <View style={[s.numItem, { alignItems: 'flex-end' }]}>
                    <Text style={[s.numLabel, { color: colors.textTertiary }]}>P&L</Text>
                    <Text style={[s.pnlVal, { color: pnl >= 0 ? colors.profit : colors.loss }]}>
                      {hidden ? '••••' : (pnl >= 0 ? '+' : '') + formatMoney(pnl, currSym)}
                    </Text>
                  </View>
                </>
              )}
            </View>

            {/* Expanded */}
            {expanded && bet.notes ? (
              <View style={[s.expandedSection, { borderTopColor: colors.border }]}>
                <Text style={[s.notesText, { color: colors.textSecondary }]}>📝 {bet.notes}</Text>
              </View>
            ) : null}

            {/* Actions */}
            {!bulkMode && (
              <View style={s.actions}>
                {bet.status === 'Pending' && (
                  <>
                    <Pressable onPress={() => { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); onWon(bet.id); }}
                      style={[s.actionBtn, { backgroundColor: colors.profitContainer, borderColor: colors.profitBorder }]}>
                      <Text style={[s.actionBtnText, { color: colors.profit }]}>✓ Won</Text>
                    </Pressable>
                    <Pressable onPress={() => onLost(bet.id)}
                      style={[s.actionBtn, { backgroundColor: colors.lossContainer, borderColor: colors.lossBorder }]}>
                      <Text style={[s.actionBtnText, { color: colors.loss }]}>✕ Lost</Text>
                    </Pressable>
                  </>
                )}
                <View style={s.iconActions}>
                  {bet.notes && (
                    <Pressable onPress={() => setExpanded(e => !e)} style={[s.iconBtn, { backgroundColor: colors.surfaceVariant, borderColor: colors.border }]}>
                      <Text style={{ fontSize: 12, color: colors.textTertiary }}>{expanded ? '▲' : '▼'}</Text>
                    </Pressable>
                  )}
                  <Pressable onPress={() => onEdit(bet)} style={[s.iconBtn, { backgroundColor: colors.surfaceVariant, borderColor: colors.border }]}>
                    <Text style={{ fontSize: 14 }}>✏️</Text>
                  </Pressable>
                  <Pressable onPress={() => onDuplicate(bet)} style={[s.iconBtn, { backgroundColor: colors.surfaceVariant, borderColor: colors.border }]}>
                    <Text style={{ fontSize: 14 }}>⎘</Text>
                  </Pressable>
                  <Pressable onPress={() => Alert.alert('Delete Bet', 'Are you sure?', [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Delete', style: 'destructive', onPress: () => onDelete(bet.id) },
                  ])} style={[s.iconBtn, { backgroundColor: colors.lossContainer, borderColor: colors.lossBorder }]}>
                    <Text style={{ fontSize: 14, color: colors.loss }}>🗑</Text>
                  </Pressable>
                </View>
              </View>
            )}
          </View>
        </Animated.View>
      </PanGestureHandler>
    </View>
  );
}

const styles = (colors) => StyleSheet.create({
  container: { marginBottom: 10, position: 'relative' },
  swipeBgRight: {
    position: 'absolute', inset: 0,
    backgroundColor: colors.lossContainer,
    borderRadius: Radius.xl, borderWidth: 0.5, borderColor: colors.lossBorder,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end',
    paddingHorizontal: 20, gap: 6,
  },
  swipeBgLeft: {
    position: 'absolute', inset: 0,
    backgroundColor: colors.profitContainer,
    borderRadius: Radius.xl, borderWidth: 0.5, borderColor: colors.profitBorder,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start',
    paddingHorizontal: 20, gap: 6,
  },
  swipeIcon: { fontSize: 20 },
  swipeLabel: { fontSize: 12, fontWeight: '700', color: colors.textSecondary },
  card: {
    backgroundColor: colors.surface,
    borderRadius: Radius.xl,
    borderWidth: 0.5,
    borderColor: colors.border,
    flexDirection: 'row',
    overflow: 'hidden',
    ...Shadows.sm,
  },
  accentBar: { width: 3, flexShrink: 0 },
  body: { flex: 1, padding: Spacing.md },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, marginBottom: 10 },
  headerLeft: { flex: 1, flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  checkbox: { width: 20, height: 20, borderRadius: 6, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', marginTop: 1, flexShrink: 0 },
  eventText: { fontSize: 14, fontWeight: '600', lineHeight: 20, letterSpacing: -0.2, marginBottom: 2 },
  betLabel: { fontSize: 12, fontWeight: '500', lineHeight: 17 },
  countdownBadge: { borderRadius: Radius.full, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 0.5 },
  countdownText: { fontSize: 10, fontWeight: '700' },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginBottom: 10 },
  tag: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: Radius.xs, borderWidth: 0.5 },
  tagText: { fontSize: 10, fontWeight: '600', letterSpacing: 0.2 },
  numsRow: {
    flexDirection: 'row',
    borderRadius: Radius.md,
    borderWidth: 0.5,
    overflow: 'hidden',
    marginBottom: 10,
  },
  numItem: { flex: 1, padding: 10, alignItems: 'center' },
  numDivider: { width: 0.5 },
  numLabel: { fontSize: 9, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 3 },
  numVal: { fontSize: 14, fontWeight: '700', letterSpacing: -0.3 },
  pnlVal: { fontSize: 16, fontWeight: '800', letterSpacing: -0.5 },
  expandedSection: { borderTopWidth: 0.5, paddingTop: 10, marginTop: 2, marginBottom: 6 },
  notesText: { fontSize: 12, lineHeight: 18, fontStyle: 'italic' },
  actions: { flexDirection: 'row', gap: 6, alignItems: 'center', flexWrap: 'wrap' },
  actionBtn: { borderRadius: Radius.full, paddingVertical: 7, paddingHorizontal: 14, borderWidth: 0.5 },
  actionBtnText: { fontSize: 12, fontWeight: '700' },
  iconActions: { flexDirection: 'row', gap: 6, marginLeft: 'auto' },
  iconBtn: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', borderWidth: 0.5 },
});
