// FloatingMenu.js — Premium Expandable FAB
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, Pressable, Modal,
  TouchableWithoutFeedback, Platform,
} from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring,
  withTiming, withDelay, interpolate, Extrapolation,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTheme } from './useTheme';

const SPRING = { damping: 18, stiffness: 280 };

const ACTIONS = [
  {
    id: 'add',
    icon: '＋',
    label: 'Add New Bet',
    sublabel: 'Log a bet',
    color: '#E50914',
    bg: '#fff',
    iconColor: '#E50914',
  },
  {
    id: 'won',
    icon: '✓',
    label: 'Mark as Won',
    sublabel: 'Update pending bet',
    color: '#1A9E4A',
    bg: '#1A9E4A',
    iconColor: '#fff',
  },
  {
    id: 'lost',
    icon: '✕',
    label: 'Mark as Lost',
    sublabel: 'Update pending bet',
    color: '#D93025',
    bg: '#D93025',
    iconColor: '#fff',
  },
  {
    id: 'quick',
    icon: '⚡',
    label: 'Quick Duplicate',
    sublabel: 'Repeat last bet',
    color: '#7C3AED',
    bg: '#7C3AED',
    iconColor: '#fff',
  },
  {
    id: 'stats',
    icon: '📊',
    label: 'Today\'s Summary',
    sublabel: 'View P&L snapshot',
    color: '#0284C7',
    bg: '#0284C7',
    iconColor: '#fff',
  },
];

function ActionItem({ action, index, open, onPress }) {
  const translateY = useSharedValue(0);
  const opacity    = useSharedValue(0);
  const scale      = useSharedValue(0.4);

  React.useEffect(() => {
    if (open) {
      const delay = index * 55;
      translateY.value = withDelay(delay, withSpring(-((index + 1) * 72), SPRING));
      opacity.value    = withDelay(delay, withTiming(1, { duration: 180 }));
      scale.value      = withDelay(delay, withSpring(1, SPRING));
    } else {
      translateY.value = withSpring(0, { damping: 20, stiffness: 300 });
      opacity.value    = withTiming(0, { duration: 120 });
      scale.value      = withSpring(0.4, { damping: 20 });
    }
  }, [open]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));

  const pressScale = useSharedValue(1);
  const pressStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pressScale.value }],
  }));

  return (
    <Animated.View style={[styles.actionWrap, animStyle]}>
      {/* Label pill */}
      <Animated.View style={[styles.labelPill, pressStyle]}>
        <View style={[styles.labelBubble, { shadowColor: action.color }]}>
          <Text style={styles.labelMain}>{action.label}</Text>
          <Text style={styles.labelSub}>{action.sublabel}</Text>
        </View>
        <View style={[styles.labelArrow, { borderLeftColor: '#fff' }]} />
      </Animated.View>

      {/* Icon button */}
      <Pressable
        onPressIn={() => { pressScale.value = withSpring(0.9, { damping: 12 }); }}
        onPressOut={() => { pressScale.value = withSpring(1, { damping: 12 }); }}
        onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); onPress(action.id); }}
      >
        <Animated.View style={[styles.actionBtn, { backgroundColor: action.bg, borderColor: action.color + '33', shadowColor: action.color }, pressStyle]}>
          <Text style={[styles.actionIcon, { color: action.iconColor }]}>{action.icon}</Text>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

export default function FloatingMenu({ onAction, hasPendingBets = false }) {
  const { colors, isDark } = useTheme();
  const [open, setOpen] = useState(false);

  const rotation  = useSharedValue(0);
  const fabScale  = useSharedValue(1);
  const bgOpacity = useSharedValue(0);

  const toggle = () => {
    const next = !open;
    setOpen(next);
    Haptics.impactAsync(next ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Light);
    rotation.value  = withSpring(next ? 1 : 0, SPRING);
    fabScale.value  = withSpring(next ? 0.88 : 1, SPRING);
    bgOpacity.value = withTiming(next ? 1 : 0, { duration: 250 });
  };

  const close = () => {
    if (!open) return;
    toggle();
  };

  const fabRotStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${interpolate(rotation.value, [0, 1], [0, 45], Extrapolation.CLAMP)}deg` },
      { scale: fabScale.value },
    ],
  }));

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: bgOpacity.value,
    pointerEvents: open ? 'auto' : 'none',
  }));

  const handleAction = (id) => {
    close();
    setTimeout(() => onAction && onAction(id), 180);
  };

  // Visible actions — filter won/lost if no pending bets
  const visibleActions = ACTIONS.filter(a => {
    if ((a.id === 'won' || a.id === 'lost') && !hasPendingBets) return false;
    return true;
  });

  return (
    <>
      {/* Backdrop */}
      {open && (
        <Pressable style={styles.backdrop} onPress={close}>
          <Animated.View style={[styles.backdropInner, overlayStyle]} />
        </Pressable>
      )}

      {/* FAB container */}
      <View style={styles.container} pointerEvents="box-none">
        {/* Action items */}
        {visibleActions.map((action, index) => (
          <ActionItem
            key={action.id}
            action={action}
            index={index}
            open={open}
            onPress={handleAction}
          />
        ))}

        {/* Main FAB */}
        <Pressable
          onPressIn={() => { fabScale.value = withSpring(0.93, { damping: 12 }); }}
          onPressOut={() => { fabScale.value = withSpring(open ? 0.88 : 1, { damping: 12 }); }}
          onPress={toggle}
          style={styles.fabPressable}
        >
          <Animated.View style={[styles.fab, fabRotStyle]}>
            {/* Pulse ring when closed */}
            {!open && (
              <PulseRing />
            )}
            <Text style={styles.fabIcon}>{open ? '✕' : '＋'}</Text>
          </Animated.View>
        </Pressable>
      </View>
    </>
  );
}

// Subtle pulse animation ring
function PulseRing() {
  const pulse = useSharedValue(1);

  React.useEffect(() => {
    const animate = () => {
      pulse.value = withTiming(1.35, { duration: 1000 }, () => {
        pulse.value = withTiming(1, { duration: 1000 }, animate);
      });
    };
    animate();
  }, []);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
    opacity: interpolate(pulse.value, [1, 1.35], [0.35, 0], Extrapolation.CLAMP),
  }));

  return (
    <Animated.View style={[styles.pulseRing, pulseStyle]} pointerEvents="none" />
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 98,
  },
  backdropInner: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  container: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 32 : 24,
    right: 20,
    alignItems: 'center',
    zIndex: 99,
  },
  fab: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: '#E50914',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#E50914',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
    elevation: 12,
  },
  fabPressable: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabIcon: {
    fontSize: 28,
    color: '#fff',
    fontWeight: '300',
    lineHeight: 32,
    marginTop: 2,
  },
  pulseRing: {
    position: 'absolute',
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: '#E50914',
  },
  actionWrap: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  labelPill: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  labelBubble: {
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 9,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  labelMain: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1A1A1A',
    letterSpacing: -0.2,
  },
  labelSub: {
    fontSize: 10,
    color: '#888',
    fontWeight: '500',
    marginTop: 1,
  },
  labelArrow: {
    width: 0,
    height: 0,
    borderTopWidth: 5,
    borderBottomWidth: 5,
    borderLeftWidth: 7,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderLeftColor: '#fff',
    marginLeft: -1,
  },
  actionBtn: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  actionIcon: {
    fontSize: 20,
    fontWeight: '700',
  },
});
