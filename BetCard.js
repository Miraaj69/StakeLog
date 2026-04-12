// components/BetCard.js
import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, Alert } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, withTiming,
  runOnJS, useAnimatedGestureHandler, interpolate, Extrapolation,
} from 'react-native-reanimated';
import { PanGestureHandler } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import { useTheme } from './useTheme';
import { calcPnL, formatMoney } from './calculations';
import { Spacing, Radius, Typography, Shadows } from './theme';

const SWIPE_THRESHOLD = 80;
const MAX_SWIPE = 100;

function StatusBadge({ status, colors }) {
  const config = {
    Won: { bg: colors.profitContainer, color: colors.profit, icon: '✓' },
    Lost: { bg: colors.lossContainer, color: colors.loss, icon: '✕' },
    Pending: { bg: colors.pendingContainer, color: colors.pending, icon: '⏳' },
    Void: { bg: colors.voidContainer, color: colors.void, icon: '⊘' },
  }[status] || { bg: colors.surfaceVariant, color: colors.textSecondary, icon: '?' };

  return (
    <View style={[badgeStyles.badge, { backgroundColor: config.bg }]}>
      <Text style={[badgeStyles.icon, { color: config.color }]}>{config.icon}</Text>
      <Text style={[badgeStyles.text, { color: config.color }]}>{status}</Text>
    </View>
  );
}

const badgeStyles = StyleSheet.create({
  badge: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  icon: { fontSize: 9, fontWeight: '900' },
  text: { fontSize: 11, fontWeight: '700' },
});

export default function BetCard({ bet, onEdit, onDelete, onWon, onLost, onDuplicate, onSlip, hidden, currSym = '₹', bulkMode, selected, onSelect }) {
  const { colors } = useTheme();
  const [expanded, setExpanded] = useState(false);
  const translateX = useSharedValue(0);
  const cardOpacity = useSharedValue(1);

  const pnl = calcPnL(bet);
  const sc = { Won: colors.profit, Lost: colors.loss, Pending: colors.pending, Void: colors.void }[bet.status] || colors.textSecondary;

  // Countdown for pending bets
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
    onEnd: (e) => {
      if (translateX.value < -SWIPE_THRESHOLD) {
        runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Medium);
        runOnJS(onDelete)(bet.id);
        cardOpacity.value = withTiming(0, { duration: 200 });
        translateX.value = withSpring(-MAX_SWIPE);
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
      {/* Swipe backgrounds */}
      <Animated.View style={[s.swipeBgRight, rightBgStyle]}>
        <Text style={s.swipeIcon}>🗑</Text>
      </Animated.View>
      <Animated.View style={[s.swipeBgLeft, leftBgStyle]}>
        <Text style={s.swipeIcon}>✓</Text>
      </Animated.View>

      <PanGestureHandler onGestureEvent={gestureHandler} activeOffsetX={[-10, 10]}>
        <Animated.View style={[s.card, cardStyle]}>
          {/* Top color strip */}
          <View style={[s.strip, { backgroundColor: sc + '44' }]} />

          <View style={s.body}>
            {/* Header row */}
            <View style={s.headerRow}>
              <View style={s.headerLeft}>
                {bulkMode && (
                  <Pressable onPress={() => onSelect(bet.id)} style={[s.checkbox, selected && { backgroundColor: colors.primary, borderColor: colors.primary }]}>
                    {selected && <Text style={{ color: '#fff', fontSize: 10, fontWeight: '900' }}>✓</Text>}
                  </Pressable>
                )}
                <View style={{ flex: 1 }}>
                  <Text style={s.eventText} numberOfLines={2}>{bet.event}</Text>
                  <Text style={s.betText} numberOfLines={1}>↳ {bet.bet}</Text>
                </View>
              </View>
              <View style={s.headerRight}>
                <StatusBadge status={bet.status} colors={colors} />
                {countdown && (
                  <View style={[s.countdownBadge, { backgroundColor: countdown === '⚠️ Overdue' ? colors.lossContainer : colors.primaryContainer }]}>
                    <Text style={[s.countdownText, { color: countdown === '⚠️ Overdue' ? colors.loss : colors.primary }]}>{countdown}</Text>
                  </View>
                )}
              </View>
            </View>

            {/* Tags row */}
            <View style={s.tagsRow}>
              {[bet.bookie, bet.sport, bet.date].map(tag => (
                <View key={tag} style={[s.tag, { backgroundColor: colors.surfaceVariant }]}>
                  <Text style={[s.tagText, { color: colors.textSecondary }]}>{tag}</Text>
                </View>
              ))}
              {bet.betType && bet.betType !== 'Single' && (
                <View style={[s.tag, { backgroundColor: colors.primaryContainer }]}>
                  <Text style={[s.tagText, { color: colors.primary }]}>{bet.betType}</Text>
                </View>
              )}
              {(bet.tags || []).map(tag => (
                <View key={tag} style={[s.tag, { backgroundColor: colors.primaryContainer }]}>
                  <Text style={[s.tagText, { color: colors.primary }]}>#{tag}</Text>
                </View>
              ))}
            </View>

            {/* Numbers row */}
            <View style={[s.numbersRow, { backgroundColor: colors.surfaceVariant }]}>
              <View style={s.numberItem}>
                <Text style={[s.numberLabel, { color: colors.textTertiary }]}>STAKE</Text>
                <Text style={[s.numberValue, { color: colors.textPrimary }]}>
                  {hidden ? `${currSym}••••` : formatMoney(parseFloat(bet.stake || 0), currSym)}
                </Text>
              </View>
              <View style={s.numberDivider} />
              <View style={s.numberItem}>
                <Text style={[s.numberLabel, { color: colors.textTertiary }]}>ODDS</Text>
                <Text style={[s.numberValue, { color: colors.textPrimary }]}>{bet.odds}×</Text>
              </View>
              {bet.status === 'Pending' && (
                <>
                  <View style={s.numberDivider} />
                  <View style={s.numberItem}>
                    <Text style={[s.numberLabel, { color: colors.textTertiary }]}>TO WIN</Text>
                    <Text style={[s.numberValue, { color: colors.profit }]}>
                      {hidden ? `${currSym}••` : formatMoney(parseFloat(bet.stake || 0) * (parseFloat(bet.odds || 1) - 1), currSym)}
                    </Text>
                  </View>
                </>
              )}
              {(bet.status === 'Won' || bet.status === 'Lost') && (
                <>
                  <View style={s.numberDivider} />
                  <View style={[s.numberItem, { alignItems: 'flex-end' }]}>
                    <Text style={[s.numberLabel, { color: colors.textTertiary }]}>P&L</Text>
                    <Text style={[s.pnlValue, { color: pnl >= 0 ? colors.profit : colors.loss }]}>
                      {hidden ? '••••' : (pnl >= 0 ? '+' : '') + formatMoney(pnl, currSym)}
                    </Text>
                  </View>
                </>
              )}
            </View>

            {/* Expanded section */}
            {expanded && (
              <View style={[s.expanded, { borderTopColor: colors.border }]}>
                {bet.notes ? <Text style={[s.notes, { color: colors.textSecondary }]}>📝 {bet.notes}</Text> : null}
                <View style={s.expandedStats}>
                  <Text style={[s.expandedStat, { color: colors.textTertiary }]}>
                    EV: <Text style={{ color: colors.textPrimary, fontWeight: '700' }}>
                      {formatMoney((parseFloat(bet.odds || 1) - 1) * parseFloat(bet.stake || 0) * 0.5 - parseFloat(bet.stake || 0) * 0.5, currSym)}
                    </Text>
                  </Text>
                  {bet.betType && (
                    <Text style={[s.expandedStat, { color: colors.textTertiary }]}>
                      Type: <Text style={{ color: colors.textPrimary, fontWeight: '700' }}>{bet.betType}</Text>
                    </Text>
                  )}
                </View>
              </View>
            )}

            {/* Action buttons */}
            {!bulkMode && (
              <View style={s.actions}>
                {bet.status === 'Pending' && (
                  <>
                    <Pressable onPress={() => { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); onWon(bet.id); }} style={[s.actionBtn, { backgroundColor: colors.profitContainer, flex: 1 }]}>
                      <Text style={[s.actionBtnText, { color: colors.profit }]}>✓ Won</Text>
                    </Pressable>
                    <Pressable onPress={() => onLost(bet.id)} style={[s.actionBtn, { backgroundColor: colors.lossContainer, flex: 1 }]}>
                      <Text style={[s.actionBtnText, { color: colors.loss }]}>✕ Lost</Text>
                    </Pressable>
                  </>
                )}
                <Pressable onPress={() => setExpanded(e => !e)} style={[s.iconBtn, { backgroundColor: colors.surfaceVariant }]}>
                  <Text style={{ fontSize: 12 }}>{expanded ? '▲' : '▼'}</Text>
                </Pressable>
                <Pressable onPress={() => onEdit(bet)} style={[s.iconBtn, { backgroundColor: colors.surfaceVariant }]}>
                  <Text style={{ fontSize: 14 }}>✏️</Text>
                </Pressable>
                <Pressable onPress={() => onDuplicate(bet)} style={[s.iconBtn, { backgroundColor: colors.surfaceVariant }]}>
                  <Text style={{ fontSize: 14 }}>⎘</Text>
                </Pressable>
                <Pressable onPress={() => onSlip(bet)} style={[s.iconBtn, { backgroundColor: colors.surfaceVariant }]}>
                  <Text style={{ fontSize: 14 }}>📋</Text>
                </Pressable>
                <Pressable onPress={() => Alert.alert('Delete Bet', 'Sure?', [{ text: 'Cancel' }, { text: 'Delete', style: 'destructive', onPress: () => onDelete(bet.id) }])}
                  style={[s.iconBtn, { backgroundColor: colors.lossContainer }]}>
                  <Text style={{ fontSize: 14, color: colors.loss }}>🗑</Text>
                </Pressable>
              </View>
            )}
          </View>
        </Animated.View>
      </PanGestureHandler>
    </View>
  );
}

const styles = (colors) => StyleSheet.create({
  container: { marginBottom: Spacing.sm, position: 'relative' },
  swipeBgRight: { position: 'absolute', inset: 0, right: 0, backgroundColor: colors.lossContainer, borderRadius: Radius.xl, alignItems: 'flex-end', justifyContent: 'center', paddingRight: 20 },
  swipeBgLeft: { position: 'absolute', inset: 0, left: 0, backgroundColor: colors.profitContainer, borderRadius: Radius.xl, alignItems: 'flex-start', justifyContent: 'center', paddingLeft: 20 },
  swipeIcon: { fontSize: 24 },
  card: { backgroundColor: colors.surface, borderRadius: Radius.xl, overflow: 'hidden', ...Shadows.md },
  strip: { height: 4 },
  body: { padding: Spacing.md },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 10 },
  headerLeft: { flex: 1, flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  headerRight: { alignItems: 'flex-end', gap: 4 },
  checkbox: { width: 20, height: 20, borderRadius: 6, borderWidth: 2, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  eventText: { ...Typography.h4, color: colors.textPrimary, lineHeight: 20 },
  betText: { ...Typography.bodySmall, color: colors.textSecondary, marginTop: 2 },
  countdownBadge: { borderRadius: Radius.full, paddingHorizontal: 7, paddingVertical: 2 },
  countdownText: { fontSize: 10, fontWeight: '700' },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginBottom: 10 },
  tag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: Radius.full },
  tagText: { fontSize: 10, fontWeight: '700' },
  numbersRow: { flexDirection: 'row', borderRadius: Radius.md, padding: Spacing.sm, alignItems: 'center', marginBottom: 10 },
  numberItem: { flex: 1, alignItems: 'center' },
  numberDivider: { width: 1, height: 28, backgroundColor: colors.border },
  numberLabel: { ...Typography.micro, textTransform: 'uppercase', marginBottom: 2 },
  numberValue: { ...Typography.h4 },
  pnlValue: { fontSize: 18, fontWeight: '900', letterSpacing: -0.5 },
  expanded: { borderTopWidth: 1, paddingTop: 10, marginTop: 2, marginBottom: 6 },
  notes: { ...Typography.bodySmall, marginBottom: 6, fontStyle: 'italic' },
  expandedStats: { flexDirection: 'row', gap: 16 },
  expandedStat: { ...Typography.caption },
  actions: { flexDirection: 'row', gap: 6, alignItems: 'center', flexWrap: 'wrap' },
  actionBtn: { borderRadius: Radius.full, paddingVertical: 8, alignItems: 'center', minWidth: 70 },
  actionBtnText: { ...Typography.label, fontWeight: '700' },
  iconBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
});
