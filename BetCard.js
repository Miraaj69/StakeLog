// BetCard.js — Material 3 Expressive · Pixel flagship
// Tonal surfaces · Spring swipe · Expandable detail · Zero blur

import React, { useState } from 'react';
import {
  View, Text, StyleSheet, Pressable, Alert,
  Animated as RNAnimated,
} from 'react-native';
import { PanGestureHandler } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue, useAnimatedStyle, useAnimatedGestureHandler,
  withSpring, withTiming, interpolate, Extrapolation, runOnJS,
  FadeIn,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTheme } from './useTheme';
import { formatMoney } from './calculations';

// ─── HELPERS ─────────────────────────────────────────────────────
function calcPnL(bet) {
  if (bet.status === 'Won')  return parseFloat(bet.stake) * (parseFloat(bet.odds) - 1);
  if (bet.status === 'Lost') return -parseFloat(bet.stake);
  return 0;
}

// ─── M3 STATUS TOKENS ────────────────────────────────────────────
const STATUS_CFG = {
  Won: {
    accent: '#00BF6F',
    bg:     'rgba(0,191,111,0.09)',
    border: 'rgba(0,191,111,0.22)',
    color:  '#00BF6F',
    label:  'Won',
    dot:    true,
  },
  Lost: {
    accent: '#FF4444',
    bg:     'rgba(255,68,68,0.09)',
    border: 'rgba(255,68,68,0.22)',
    color:  '#FF4444',
    label:  'Lost',
    dot:    false,
  },
  Pending: {
    accent: '#FFB347',
    bg:     'rgba(255,179,71,0.09)',
    border: 'rgba(255,179,71,0.22)',
    color:  '#FFB347',
    label:  'Pending',
    dot:    true,   // pulse dot
  },
  Void: {
    accent: '#8A8AA0',
    bg:     'rgba(138,138,160,0.08)',
    border: 'rgba(138,138,160,0.18)',
    color:  '#8A8AA0',
    label:  'Void',
    dot:    false,
  },
};

const SWIPE_THRESHOLD = 68;
const MAX_SWIPE       = 100;

// ─── STATUS CHIP ─────────────────────────────────────────────────
function StatusChip({ status, cfg }) {
  return (
    <View style={[sc.wrap, { backgroundColor: cfg.bg, borderColor: cfg.border }]}>
      <View style={[sc.dot, {
        backgroundColor: cfg.accent,
        // Pending gets a glow ring
        shadowColor:   cfg.dot ? cfg.accent : 'transparent',
        shadowOpacity: cfg.dot ? 0.6 : 0,
        shadowRadius:  4,
        shadowOffset:  { width: 0, height: 0 },
      }]} />
      <Text style={[sc.txt, { color: cfg.color }]}>{cfg.label}</Text>
    </View>
  );
}
const sc = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', gap: 5,
          paddingHorizontal: 10, paddingVertical: 5,
          borderRadius: 999, borderWidth: 1, flexShrink: 0 },
  dot:  { width: 6, height: 6, borderRadius: 3 },
  txt:  { fontSize: 11, fontWeight: '700' },
});

// ─── NUMBER CELL ─────────────────────────────────────────────────
function NumCell({ label, value, valueColor, colors }) {
  return (
    <View style={nc.cell}>
      <Text style={[nc.lbl, { color: colors.textTertiary }]}>{label}</Text>
      <Text style={[nc.val, { color: valueColor || colors.textPrimary }]}
        numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
    </View>
  );
}
const nc = StyleSheet.create({
  cell: { flex: 1, alignItems: 'center', paddingVertical: 10 },
  lbl:  { fontSize: 9, fontWeight: '700', textTransform: 'uppercase',
          letterSpacing: 0.8, marginBottom: 3 },
  val:  { fontSize: 14, fontWeight: '800', letterSpacing: -0.3 },
});

// ─── ACTION BUTTON ───────────────────────────────────────────────
function ActionBtn({ label, color, bg, onPress, flex }) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    flex: flex || undefined,
  }));
  return (
    <Animated.View style={animStyle}>
      <Pressable
        onPressIn={() => {
          scale.value = withSpring(0.93, { damping: 18, stiffness: 400 });
        }}
        onPressOut={() => {
          scale.value = withSpring(1, { damping: 18, stiffness: 400 });
        }}
        onPress={onPress}
        style={[ab.btn, { backgroundColor: bg }]}
      >
        <Text style={[ab.txt, { color }]}>{label}</Text>
      </Pressable>
    </Animated.View>
  );
}
const ab = StyleSheet.create({
  btn: { borderRadius: 14, paddingVertical: 9, paddingHorizontal: 10,
         alignItems: 'center', justifyContent: 'center' },
  txt: { fontWeight: '700', fontSize: 13 },
});

// ─── ICON BUTTON ─────────────────────────────────────────────────
function IconBtn({ emoji, bg, onPress }) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  return (
    <Animated.View style={animStyle}>
      <Pressable
        onPressIn={() => {
          scale.value = withSpring(0.88, { damping: 16, stiffness: 420 });
        }}
        onPressOut={() => {
          scale.value = withSpring(1, { damping: 16, stiffness: 420 });
        }}
        onPress={onPress}
        style={[ib.btn, { backgroundColor: bg }]}
      >
        <Text style={{ fontSize: 14 }}>{emoji}</Text>
      </Pressable>
    </Animated.View>
  );
}
const ib = StyleSheet.create({
  btn: { width: 36, height: 36, borderRadius: 13,
         alignItems: 'center', justifyContent: 'center' },
});

// ─── MAIN COMPONENT ──────────────────────────────────────────────
export default function BetCard({
  bet, onEdit, onDelete, onWon, onLost, onDuplicate,
  hidden, currSym, bulkMode, selected, onSelect,
}) {
  currSym = currSym || '₹';
  const { colors, isDark } = useTheme();
  const [expanded, setExpanded] = useState(false);

  const pnl       = calcPnL(bet);
  const isPending = bet.status === 'Pending';
  const cfg       = STATUS_CFG[bet.status] || STATUS_CFG.Void;

  // ── Swipe ─────────────────────────────────────────────────────
  const tx     = useSharedValue(0);
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
        // Delete
        runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Heavy);
        cardOp.value = withTiming(0, { duration: 200 });
        tx.value     = withTiming(-MAX_SWIPE, { duration: 160 });
        runOnJS(onDelete)(bet.id);
      } else if (tx.value > SWIPE_THRESHOLD && isPending) {
        // Won
        runOnJS(Haptics.notificationAsync)(Haptics.NotificationFeedbackType.Success);
        runOnJS(onWon)(bet.id);
        tx.value = withSpring(0, { damping: 24, stiffness: 300 });
      } else {
        tx.value = withSpring(0, { damping: 24, stiffness: 300 });
      }
    },
  });

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: tx.value }],
    opacity:   cardOp.value,
  }));

  const rightRevealStyle = useAnimatedStyle(() => ({
    opacity:   interpolate(tx.value, [-MAX_SWIPE, -28], [1, 0], Extrapolation.CLAMP),
    transform: [{
      scale: interpolate(tx.value, [-MAX_SWIPE, -28], [1, 0.75], Extrapolation.CLAMP),
    }],
  }));

  const leftRevealStyle = useAnimatedStyle(() => ({
    opacity:   interpolate(tx.value, [28, MAX_SWIPE], [0, 1], Extrapolation.CLAMP),
    transform: [{
      scale: interpolate(tx.value, [28, MAX_SWIPE], [0.75, 1], Extrapolation.CLAMP),
    }],
  }));

  // ── Press scale ───────────────────────────────────────────────
  const pressScale = useSharedValue(1);
  const pressStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pressScale.value }],
  }));

  // ── Numbers ───────────────────────────────────────────────────
  const stake    = parseFloat(bet.stake || 0);
  const odds     = parseFloat(bet.odds  || 1);
  const toWin    = stake * (odds - 1);
  const pnlColor = pnl >= 0
    ? (isDark ? '#00D97A' : '#00BF6F')
    : (isDark ? '#FF5555' : '#FF4444');

  // ── Expanded detail row values ────────────────────────────────
  const potential = stake * odds;

  return (
    <View style={st.wrap}>

      {/* ── Swipe reveal — delete (right bg) ── */}
      <Animated.View style={[st.swipeBg, st.swipeBgRight, rightRevealStyle]}>
        <Text style={{ fontSize: 24 }}>🗑</Text>
        <Text style={st.swipeLbl}>Delete</Text>
      </Animated.View>

      {/* ── Swipe reveal — won (left bg) ── */}
      {isPending && (
        <Animated.View style={[st.swipeBg, st.swipeBgLeft, leftRevealStyle]}>
          <Text style={{ fontSize: 24 }}>✓</Text>
          <Text style={st.swipeLbl}>Won</Text>
        </Animated.View>
      )}

      {/* ── Card ── */}
      <PanGestureHandler onGestureEvent={gesture} activeOffsetX={[-10, 10]}>
        <Animated.View style={cardStyle}>
          <Animated.View style={pressStyle}>
            <Pressable
              onPressIn={() => {
                pressScale.value = withSpring(0.975, { damping: 20, stiffness: 400 });
              }}
              onPressOut={() => {
                pressScale.value = withSpring(1, { damping: 20, stiffness: 400 });
              }}
              onPress={() => setExpanded(e => !e)}
              style={[
                st.card,
                {
                  backgroundColor: isDark ? colors.surfaceVariant : '#FFFFFF',
                  borderColor:     colors.border,
                },
              ]}
            >
              {/* Left accent bar */}
              <View style={[st.accentBar, { backgroundColor: cfg.accent }]} />

              <View style={st.body}>

                {/* ── Row 1: Title + Status ── */}
                <View style={st.r1}>
                  <View style={st.titleGroup}>
                    {bulkMode && (
                      <Pressable
                        onPress={() => onSelect(bet.id)}
                        style={[st.checkbox, {
                          borderColor:     selected ? '#FF4B6A' : colors.border,
                          backgroundColor: selected ? '#FF4B6A' : 'transparent',
                        }]}
                      >
                        {selected && (
                          <Text style={{ color: '#fff', fontSize: 9, fontWeight: '900' }}>✓</Text>
                        )}
                      </Pressable>
                    )}
                    <View style={{ flex: 1 }}>
                      <Text
                        style={[st.event, { color: colors.textPrimary }]}
                        numberOfLines={1}
                      >
                        {bet.event}
                      </Text>
                      <Text
                        style={[st.betDesc, { color: colors.textTertiary }]}
                        numberOfLines={1}
                      >
                        ↳ {bet.bet}
                      </Text>
                    </View>
                  </View>
                  <StatusChip status={bet.status} cfg={cfg} />
                </View>

                {/* ── Row 2: Numbers strip ── */}
                <View style={[
                  st.numStrip,
                  {
                    backgroundColor: isDark
                      ? 'rgba(255,255,255,0.04)'
                      : 'rgba(0,0,0,0.025)',
                    borderColor: colors.border,
                  },
                ]}>
                  <NumCell
                    label="Stake"
                    value={hidden ? '••••' : formatMoney(stake, currSym)}
                    colors={colors}
                  />
                  <View style={[st.numDiv, { backgroundColor: colors.border }]} />
                  <NumCell
                    label="Odds"
                    value={`${odds.toFixed(2)}×`}
                    colors={colors}
                  />
                  <View style={[st.numDiv, { backgroundColor: colors.border }]} />
                  {isPending ? (
                    <NumCell
                      label="To Win"
                      value={hidden ? '••' : formatMoney(toWin, currSym)}
                      valueColor={isDark ? '#00D97A' : '#00BF6F'}
                      colors={colors}
                    />
                  ) : (
                    <NumCell
                      label="P&L"
                      value={hidden ? '••' : `${pnl >= 0 ? '+' : ''}${formatMoney(pnl, currSym)}`}
                      valueColor={pnlColor}
                      colors={colors}
                    />
                  )}
                </View>

                {/* ── Row 3: Meta tags ── */}
                <View style={st.metaRow}>
                  {[bet.bookie, bet.sport, bet.date]
                    .filter(Boolean)
                    .map(tag => (
                      <View
                        key={tag}
                        style={[st.metaTag, {
                          backgroundColor: isDark
                            ? 'rgba(255,255,255,0.06)'
                            : 'rgba(0,0,0,0.04)',
                        }]}
                      >
                        <Text style={[st.metaTxt, { color: colors.textTertiary }]}>
                          {tag}
                        </Text>
                      </View>
                    ))}
                  {(bet.tags || []).map(tag => (
                    <View
                      key={tag}
                      style={[st.metaTag, {
                        backgroundColor: 'rgba(255,75,106,0.08)',
                      }]}
                    >
                      <Text style={[st.metaTxt, { color: '#FF4B6A' }]}>#{tag}</Text>
                    </View>
                  ))}
                </View>

                {/* ── Expanded detail ── */}
                {expanded && (
                  <Animated.View
                    entering={FadeIn.duration(220)}
                    style={[st.expandedSection, { borderTopColor: colors.border }]}
                  >
                    {/* Detail row */}
                    <View style={[st.detailStrip, {
                      backgroundColor: isDark
                        ? 'rgba(255,255,255,0.03)'
                        : 'rgba(0,0,0,0.02)',
                      borderColor: colors.border,
                    }]}>
                      {[
                        { l: 'Potential', v: hidden ? '••' : formatMoney(potential, currSym) },
                        { l: 'Return',    v: `${((odds - 1) * 100).toFixed(0)}%` },
                        { l: 'Net',       v: hidden ? '••' : (bet.status !== 'Pending' ? (pnl >= 0 ? '+' : '') + formatMoney(pnl, currSym) : '—') },
                      ].map((d, i, arr) => (
                        <React.Fragment key={d.l}>
                          <View style={st.detailCell}>
                            <Text style={[st.detailLbl, { color: colors.textTertiary }]}>{d.l}</Text>
                            <Text style={[st.detailVal, { color: colors.textPrimary }]}>{d.v}</Text>
                          </View>
                          {i < arr.length - 1 && (
                            <View style={[st.numDiv, { backgroundColor: colors.border }]} />
                          )}
                        </React.Fragment>
                      ))}
                    </View>

                    {/* Notes */}
                    {bet.notes ? (
                      <View style={[st.notesBox, {
                        backgroundColor: isDark
                          ? 'rgba(255,255,255,0.03)'
                          : 'rgba(0,0,0,0.02)',
                        borderColor: colors.border,
                      }]}>
                        <Text style={[st.notesTxt, { color: colors.textSecondary }]}>
                          📝  {bet.notes}
                        </Text>
                      </View>
                    ) : null}
                  </Animated.View>
                )}

                {/* ── Action row ── */}
                {!bulkMode && (
                  <View style={st.actions}>
                    {isPending && (
                      <>
                        <ActionBtn
                          label="✓  Won"
                          color="#00BF6F"
                          bg="rgba(0,191,111,0.1)"
                          flex={1}
                          onPress={() => {
                            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                            onWon(bet.id);
                          }}
                        />
                        <ActionBtn
                          label="✕  Lost"
                          color="#FF4444"
                          bg="rgba(255,68,68,0.1)"
                          flex={1}
                          onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                            onLost(bet.id);
                          }}
                        />
                      </>
                    )}
                    <IconBtn
                      emoji="✏️"
                      bg={isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.04)'}
                      onPress={() => onEdit(bet)}
                    />
                    <IconBtn
                      emoji="⎘"
                      bg={isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.04)'}
                      onPress={() => onDuplicate(bet)}
                    />
                    <IconBtn
                      emoji="🗑"
                      bg="rgba(255,68,68,0.09)"
                      onPress={() => Alert.alert(
                        'Delete Bet',
                        'This action cannot be undone.',
                        [
                          { text: 'Cancel', style: 'cancel' },
                          {
                            text: 'Delete',
                            style: 'destructive',
                            onPress: () => onDelete(bet.id),
                          },
                        ]
                      )}
                    />
                  </View>
                )}

              </View>
            </Pressable>
          </Animated.View>
        </Animated.View>
      </PanGestureHandler>
    </View>
  );
}

// ─── STYLES ──────────────────────────────────────────────────────
const st = StyleSheet.create({
  wrap: { marginBottom: 10, position: 'relative' },

  // Swipe backgrounds
  swipeBg: {
    position: 'absolute', top: 0, bottom: 0,
    width: 88, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
  },
  swipeBgRight: { right: 0, backgroundColor: '#FF4444' },
  swipeBgLeft:  { left: 0,  backgroundColor: '#00BF6F' },
  swipeLbl: {
    fontSize: 10, color: '#fff',
    fontWeight: '800', marginTop: 4, letterSpacing: 0.3,
  },

  // Card shell
  card: {
    borderRadius: 22, flexDirection: 'row',
    overflow: 'hidden', borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 3,
  },
  accentBar: { width: 3, flexShrink: 0 },
  body:      { flex: 1, padding: 14 },

  // Row 1
  r1:         { flexDirection: 'row', justifyContent: 'space-between',
                alignItems: 'flex-start', gap: 10, marginBottom: 12 },
  titleGroup: { flex: 1, flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  checkbox:   { width: 20, height: 20, borderRadius: 7, borderWidth: 1.5,
                alignItems: 'center', justifyContent: 'center',
                marginTop: 2, flexShrink: 0 },
  event:   { fontSize: 14, fontWeight: '700', letterSpacing: -0.2, lineHeight: 20, marginBottom: 3 },
  betDesc: { fontSize: 11, fontWeight: '500', lineHeight: 16 },

  // Numbers strip
  numStrip: { flexDirection: 'row', borderRadius: 14, borderWidth: 1,
              overflow: 'hidden', marginBottom: 10 },
  numDiv:   { width: 1 },

  // Meta tags
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginBottom: 10 },
  metaTag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  metaTxt: { fontSize: 10, fontWeight: '600' },

  // Expanded
  expandedSection: { borderTopWidth: 1, paddingTop: 10, marginBottom: 6 },
  detailStrip: { flexDirection: 'row', borderRadius: 12, borderWidth: 1,
                 overflow: 'hidden', marginBottom: 8 },
  detailCell: { flex: 1, alignItems: 'center', paddingVertical: 9 },
  detailLbl:  { fontSize: 9, fontWeight: '700', textTransform: 'uppercase',
                letterSpacing: 0.8, marginBottom: 3 },
  detailVal:  { fontSize: 13, fontWeight: '700', letterSpacing: -0.2 },
  notesBox:   { borderRadius: 12, borderWidth: 1, padding: 10, marginBottom: 6 },
  notesTxt:   { fontSize: 12, lineHeight: 18, fontStyle: 'italic' },

  // Actions
  actions: { flexDirection: 'row', gap: 7, alignItems: 'center' },
});
