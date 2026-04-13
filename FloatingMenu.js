// FloatingMenu.js — Fixed, no hooks in loops
import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, Pressable, Alert, Platform,
} from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring,
  withTiming, withDelay, interpolate, Extrapolation,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

const SPRING_CFG = { damping: 18, stiffness: 260 };

const ACTIONS = [
  { id: 'add',   icon: '＋', label: 'Add New Bet',      sub: 'Log a bet',           bg: '#E50914', shadow: '#E50914' },
  { id: 'won',   icon: '✓',  label: 'Mark as Won',      sub: 'Update pending bet',  bg: '#1A9E4A', shadow: '#1A9E4A' },
  { id: 'lost',  icon: '✕',  label: 'Mark as Lost',     sub: 'Update pending bet',  bg: '#D93025', shadow: '#D93025' },
  { id: 'quick', icon: '⚡', label: 'Quick Duplicate',  sub: 'Repeat last bet',     bg: '#7C3AED', shadow: '#7C3AED' },
  { id: 'stats', icon: '📊', label: "Today's Summary",  sub: 'View P&L snapshot',   bg: '#0284C7', shadow: '#0284C7' },
];

// Each action item — hooks at top level only
function ActionItem({ action, index, open, onPress, total }) {
  const ty      = useSharedValue(0);
  const opacity = useSharedValue(0);
  const scale   = useSharedValue(0.5);
  const btnScale = useSharedValue(1);

  useEffect(() => {
    if (open) {
      const delay = (total - 1 - index) * 50;
      ty.value      = withDelay(delay, withSpring(-((index + 1) * 68), SPRING_CFG));
      opacity.value = withDelay(delay, withTiming(1, { duration: 160 }));
      scale.value   = withDelay(delay, withSpring(1, SPRING_CFG));
    } else {
      ty.value      = withSpring(0, { damping: 22, stiffness: 320 });
      opacity.value = withTiming(0, { duration: 100 });
      scale.value   = withSpring(0.5, { damping: 22 });
    }
  }, [open]);

  const wrapStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: ty.value }, { scale: scale.value }],
    opacity: opacity.value,
  }));

  const btnStyle = useAnimatedStyle(() => ({
    transform: [{ scale: btnScale.value }],
  }));

  return (
    <Animated.View style={[st.itemWrap, wrapStyle]} pointerEvents={open ? 'auto' : 'none'}>
      {/* Label */}
      <View style={st.labelRow}>
        <View style={st.labelBox}>
          <Text style={st.labelMain}>{action.label}</Text>
          <Text style={st.labelSub}>{action.sub}</Text>
        </View>
        <View style={st.arrow} />
      </View>

      {/* Circle button */}
      <Pressable
        onPressIn={() => { btnScale.value = withSpring(0.88, { damping: 12 }); }}
        onPressOut={() => { btnScale.value = withSpring(1, { damping: 12 }); }}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          onPress(action.id);
        }}
      >
        <Animated.View style={[st.actionCircle, { backgroundColor: action.bg, shadowColor: action.shadow }, btnStyle]}>
          <Text style={st.actionIcon}>{action.icon}</Text>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

// Pulse ring — separate component, hooks at top
function PulseRing() {
  const pulse = useSharedValue(1);

  useEffect(() => {
    let cancelled = false;
    function animate() {
      if (cancelled) return;
      pulse.value = withTiming(1.4, { duration: 1100 }, (done) => {
        if (done && !cancelled) {
          pulse.value = withTiming(1, { duration: 1100 }, (done2) => {
            if (done2 && !cancelled) animate();
          });
        }
      });
    }
    animate();
    return () => { cancelled = true; };
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
    opacity: interpolate(pulse.value, [1, 1.4], [0.4, 0], Extrapolation.CLAMP),
  }));

  return <Animated.View style={[st.pulseRing, style]} pointerEvents="none" />;
}

export default function FloatingMenu({ onAction, hasPendingBets }) {
  const [open, setOpen] = useState(false);

  const rotation  = useSharedValue(0);
  const fabScale  = useSharedValue(1);
  const bgOpacity = useSharedValue(0);

  const visibleActions = ACTIONS.filter(a => {
    if ((a.id === 'won' || a.id === 'lost') && !hasPendingBets) return false;
    return true;
  });

  const toggle = () => {
    const next = !open;
    setOpen(next);
    Haptics.impactAsync(next ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Light);
    rotation.value  = withSpring(next ? 1 : 0, SPRING_CFG);
    fabScale.value  = withSpring(next ? 0.9 : 1, SPRING_CFG);
    bgOpacity.value = withTiming(next ? 1 : 0, { duration: 220 });
  };

  const close = () => { if (open) toggle(); };

  const handleAction = (id) => {
    close();
    setTimeout(() => { if (onAction) onAction(id); }, 160);
  };

  const fabAnimStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: interpolate(rotation.value, [0, 1], [0, 45], Extrapolation.CLAMP) + 'deg' },
      { scale: fabScale.value },
    ],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: bgOpacity.value,
  }));

  return (
    <>
      {/* Dim backdrop */}
      {open && (
        <Pressable onPress={close} style={st.backdropPress}>
          <Animated.View style={[st.backdrop, backdropStyle]} />
        </Pressable>
      )}

      <View style={st.container} pointerEvents="box-none">
        {/* Action items — rendered top-level, not in map with hooks */}
        {visibleActions.map((action, index) => (
          <ActionItem
            key={action.id}
            action={action}
            index={index}
            open={open}
            onPress={handleAction}
            total={visibleActions.length}
          />
        ))}

        {/* Main FAB */}
        <Pressable
          onPressIn={() => { fabScale.value = withSpring(0.92, { damping: 12 }); }}
          onPressOut={() => { fabScale.value = withSpring(open ? 0.9 : 1, { damping: 12 }); }}
          onPress={toggle}
        >
          <Animated.View style={[st.fab, fabAnimStyle]}>
            {!open && <PulseRing />}
            <Text style={st.fabIcon}>{open ? '✕' : '＋'}</Text>
          </Animated.View>
        </Pressable>
      </View>
    </>
  );
}

const st = StyleSheet.create({
  backdropPress: { ...StyleSheet.absoluteFillObject, zIndex: 98 },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  container: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 30 : 20,
    right: 20,
    alignItems: 'center',
    zIndex: 99,
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
    shadowRadius: 14,
    elevation: 12,
  },
  fabIcon: { fontSize: 26, color: '#fff', fontWeight: '300', lineHeight: 30 },
  pulseRing: {
    position: 'absolute',
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: '#E50914',
  },
  itemWrap: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  labelRow: { flexDirection: 'row', alignItems: 'center' },
  labelBox: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 13,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 5,
  },
  labelMain: { fontSize: 13, fontWeight: '700', color: '#111', letterSpacing: -0.2 },
  labelSub:  { fontSize: 10, color: '#888', fontWeight: '500', marginTop: 1 },
  arrow: {
    width: 0, height: 0,
    borderTopWidth: 5, borderBottomWidth: 5, borderLeftWidth: 6,
    borderTopColor: 'transparent', borderBottomColor: 'transparent',
    borderLeftColor: '#fff',
    marginLeft: -1,
  },
  actionCircle: {
    width: 48, height: 48, borderRadius: 24,
    alignItems: 'center', justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 8,
  },
  actionIcon: { fontSize: 19, color: '#fff', fontWeight: '700' },
});
