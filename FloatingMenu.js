// FloatingMenu.js — Premium FAB: fixed stagger, smooth spring, zero jerk
import React, { useState, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, Pressable, Platform,
  TouchableWithoutFeedback, Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, withTiming,
  withDelay, interpolate, Extrapolation, runOnJS,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

const { width: SW } = Dimensions.get('window');

// ── Spring configs ────────────────────────────────────────────────
const OPEN_SPRING = { damping: 20, stiffness: 260, mass: 0.7 };
const CLOSE_SPRING = { damping: 24, stiffness: 300, mass: 0.7 };

// ── Backdrop ──────────────────────────────────────────────────────
function Backdrop({ visible, opacity, onPress }) {
  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));
  if (!visible) return null;
  return (
    <TouchableWithoutFeedback onPress={onPress}>
      <Animated.View
        style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 998 }, style]}
      />
    </TouchableWithoutFeedback>
  );
}

// ── Individual FAB item ───────────────────────────────────────────
function FabItem({ action, index, isOpen, progress, onPress }) {
  const pressScale = useSharedValue(1);
  const DISTANCES = [76, 148, 220, 292, 364];
  const dist = DISTANCES[index] || (index + 1) * 74;
  // Each item gets a unique staggered delay
  const OPEN_DELAY = index * 40;
  const CLOSE_DELAY = (4 - index) * 25;

  const itemStyle = useAnimatedStyle(() => {
    const p = progress.value;
    const translateY = interpolate(p, [0, 1], [0, -dist], Extrapolation.CLAMP);
    const scale = interpolate(p, [0, 0.6, 1], [0.4, 0.9, 1], Extrapolation.CLAMP);
    const opacity = interpolate(p, [0, 0.2, 0.6], [0, 0, 1], Extrapolation.CLAMP);
    return {
      transform: [
        { translateY: translateY * pressScale.value },
        { scale: scale * pressScale.value },
      ],
      opacity,
    };
  });

  const labelStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0.6, 1], [0, 1], Extrapolation.CLAMP),
    transform: [{ translateX: interpolate(progress.value, [0.6, 1], [8, 0], Extrapolation.CLAMP) }],
  }));

  function handlePressIn() {
    pressScale.value = withSpring(0.88, { damping: 14, stiffness: 400 });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }
  function handlePressOut() {
    pressScale.value = withSpring(1, { damping: 14, stiffness: 300 });
  }
  function handlePress() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress(action.id);
  }

  return (
    <Animated.View style={[st.itemWrap, itemStyle]} pointerEvents={isOpen ? 'auto' : 'none'}>
      {/* Label */}
      <Animated.View style={[st.labelWrap, labelStyle]}>
        <View style={st.labelPill}>
          <Text style={st.labelMain}>{action.label}</Text>
          {action.sub ? <Text style={st.labelSub}>{action.sub}</Text> : null}
        </View>
        <View style={st.labelArrow} />
      </Animated.View>

      {/* Circle button */}
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
        hitSlop={10}
      >
        <View style={[st.circle, { backgroundColor: action.bg, shadowColor: action.bg }]}>
          <Text style={[st.circleIcon, action.id === 'won' && { fontSize: 18 }]}>{action.icon}</Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

// ── Main FAB button ───────────────────────────────────────────────
function FabButton({ isOpen, onPress }) {
  const rotate = useSharedValue(0);
  const scale = useSharedValue(1);

  React.useEffect(() => {
    rotate.value = withSpring(isOpen ? 1 : 0, OPEN_SPRING);
    scale.value = withSpring(isOpen ? 0.88 : 1, OPEN_SPRING);
  }, [isOpen]);

  const fabStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${interpolate(rotate.value, [0, 1], [0, 45])}deg` },
      { scale: scale.value },
    ],
  }));

  function handlePressIn() {
    scale.value = withSpring(isOpen ? 0.82 : 0.88, { damping: 12, stiffness: 300 });
  }
  function handlePressOut() {
    scale.value = withSpring(isOpen ? 0.88 : 1, { damping: 14, stiffness: 300 });
  }

  return (
    <Pressable onPressIn={handlePressIn} onPressOut={handlePressOut} onPress={onPress} hitSlop={6}>
      <Animated.View style={[st.fab, fabStyle]}>
        <Text style={st.fabIcon}>＋</Text>
      </Animated.View>
    </Pressable>
  );
}

// ── Actions config ────────────────────────────────────────────────
const ALL_ACTIONS = [
  { id: 'add', icon: '＋', label: 'New Bet', sub: 'Log a bet', bg: '#E50914' },
  { id: 'quick', icon: '⚡', label: 'Quick Bet', sub: '2-sec entry', bg: '#7C3AED' },
  { id: 'won', icon: '✓', label: 'Mark Won', sub: 'Pending → Won', bg: '#00C853' },
  { id: 'lost', icon: '✕', label: 'Mark Lost', sub: 'Pending → Lost', bg: '#E53935' },
  { id: 'stats', icon: '📊', label: "Today's P&L", sub: 'Quick snapshot', bg: '#0A84FF' },
];

// ── Main export ───────────────────────────────────────────────────
export default function FloatingMenu({ onAction, hasPendingBets }) {
  const [open, setOpen] = useState(false);
  const [backdropVisible, setBV] = useState(false);
  const animating = useRef(false);

  const progress = useSharedValue(0);
  const bgOpacity = useSharedValue(0);

  const actions = ALL_ACTIONS.filter(a => {
    if ((a.id === 'won' || a.id === 'lost') && !hasPendingBets) return false;
    return true;
  });

  const openMenu = useCallback(() => {
    if (animating.current) return;
    animating.current = true;
    setBV(true);
    setOpen(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    progress.value = withSpring(1, OPEN_SPRING, () => { animating.current = false; });
    bgOpacity.value = withTiming(1, { duration: 220 });
  }, []);

  const closeMenu = useCallback(() => {
    if (animating.current) return;
    animating.current = true;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Close with slightly faster spring
    progress.value = withSpring(0, CLOSE_SPRING, () => {
      runOnJS(setOpen)(false);
      animating.current = false;
    });
    bgOpacity.value = withTiming(0, { duration: 200 }, () => {
      runOnJS(setBV)(false);
    });
  }, []);

  function toggle() { open ? closeMenu() : openMenu(); }

  function handleAction(id) {
    closeMenu();
    setTimeout(() => { if (onAction) onAction(id); }, 180);
  }

  return (
    <>
      <Backdrop visible={backdropVisible} opacity={bgOpacity} onPress={closeMenu} />

      <View style={st.container} pointerEvents="box-none">
        {actions.map((action, index) => (
          <FabItem
            key={action.id}
            action={action}
            index={index}
            isOpen={open}
            progress={progress}
            onPress={handleAction}
          />
        ))}
        <FabButton isOpen={open} onPress={toggle} />
      </View>
    </>
  );
}

const st = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 92 : 86,
    right: 20,
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
    elevation: 20,
    overflow: 'visible',
  },
  fab: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#E50914',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#E50914',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
    elevation: 14,
  },
  fabIcon: {
    fontSize: 28,
    color: '#fff',
    lineHeight: 32,
    fontWeight: '300',
  },
  itemWrap: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'visible',
  },
  labelWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    maxWidth: SW - 120,
    marginRight: 2,
  },
  labelPill: {
    backgroundColor: 'rgba(8,8,8,0.90)',
    borderRadius: 12,
    paddingHorizontal: 13,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  labelMain: { fontSize: 13, fontWeight: '700', color: '#fff', letterSpacing: -0.2 },
  labelSub: { fontSize: 10, color: 'rgba(255,255,255,0.5)', fontWeight: '500', marginTop: 1 },
  labelArrow: {
    width: 0, height: 0,
    borderTopWidth: 5, borderBottomWidth: 5, borderLeftWidth: 6,
    borderTopColor: 'transparent', borderBottomColor: 'transparent',
    borderLeftColor: 'rgba(8,8,8,0.90)',
    marginLeft: -1,
  },
  circle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 10,
  },
  circleIcon: { fontSize: 20, color: '#fff', fontWeight: '700' },
});
