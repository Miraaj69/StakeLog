// FloatingMenu.js — iOS-level premium FAB with Reanimated v2
import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, Pressable, Platform,
  Animated as RNAnimated, TouchableWithoutFeedback, Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, withTiming,
  interpolate, Extrapolation,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

var SCREEN_H = Dimensions.get('window').height;

// Each action has its own component so hooks are at top level
function ActionItem({ action, index, total, open, onPress }) {
  var progress = useSharedValue(0);

  // Staggered animation
  useEffect(function() {
    if (open) {
      progress.value = withSpring(1, {
        damping: 14,
        stiffness: 120,
        mass: 0.8,
      });
    } else {
      progress.value = withSpring(0, {
        damping: 20,
        stiffness: 200,
      });
    }
  }, [open]);

  var itemStyle = useAnimatedStyle(function() {
    var dist = (index + 1) * 72;
    return {
      transform: [
        { translateY: interpolate(progress.value, [0, 1], [0, -dist], Extrapolation.CLAMP) },
        { scale: interpolate(progress.value, [0, 0.5, 1], [0.4, 0.85, 1], Extrapolation.CLAMP) },
      ],
      opacity: interpolate(progress.value, [0, 0.35, 1], [0, 0, 1], Extrapolation.CLAMP),
    };
  });

  var labelStyle = useAnimatedStyle(function() {
    return {
      opacity: interpolate(progress.value, [0.6, 1], [0, 1], Extrapolation.CLAMP),
      transform: [
        { translateX: interpolate(progress.value, [0.6, 1], [12, 0], Extrapolation.CLAMP) },
      ],
    };
  });

  var btnScale = useSharedValue(1);
  var btnStyle = useAnimatedStyle(function() {
    return { transform: [{ scale: btnScale.value }] };
  });

  return (
    <Animated.View
      style={[st.actionWrap, itemStyle]}
      pointerEvents={open ? 'auto' : 'none'}
    >
      {/* Label */}
      <Animated.View style={[st.labelWrap, labelStyle]}>
        <View style={st.labelPill}>
          <Text style={st.labelMain}>{action.label}</Text>
          <Text style={st.labelSub}>{action.sub}</Text>
        </View>
        <View style={st.labelArrow} />
      </Animated.View>

      {/* Button */}
      <Pressable
        onPressIn={function() {
          btnScale.value = withSpring(0.88, { damping: 12, stiffness: 300 });
        }}
        onPressOut={function() {
          btnScale.value = withSpring(1, { damping: 12, stiffness: 300 });
        }}
        onPress={function() {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          onPress(action.id);
        }}
      >
        <Animated.View style={[st.circle, { backgroundColor: action.bg, shadowColor: action.bg }, btnStyle]}>
          <Text style={st.circleIcon}>{action.icon}</Text>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

// Backdrop
function Backdrop({ open, onPress }) {
  var opacity = useSharedValue(0);

  useEffect(function() {
    opacity.value = withTiming(open ? 1 : 0, { duration: 200 });
  }, [open]);

  var style = useAnimatedStyle(function() {
    return { opacity: opacity.value };
  });

  if (!open) return null;
  return (
    <TouchableWithoutFeedback onPress={onPress}>
      <Animated.View style={[st.backdrop, style]} />
    </TouchableWithoutFeedback>
  );
}

var ACTIONS = [
  { id: 'add',   icon: '＋', label: 'New Bet',    sub: 'Log a bet',       bg: '#FF3B30' },
  { id: 'quick', icon: '⚡', label: 'Quick Bet',  sub: '2-sec entry',     bg: '#7C3AED' },
  { id: 'won',   icon: '✓',  label: 'Mark Won',   sub: 'Pending → Won',   bg: '#1A9E4A' },
  { id: 'lost',  icon: '✕',  label: 'Mark Lost',  sub: 'Pending → Lost',  bg: '#D93025' },
  { id: 'stats', icon: '📊', label: "Today's P&L", sub: 'Quick snapshot',  bg: '#0284C7' },
];

export default function FloatingMenu({ onAction, hasPendingBets, isProfit }) {
  var [open, setOpen] = useState(false);

  // Main FAB animations
  var rotate   = useSharedValue(0);
  var fabScale = useSharedValue(1);
  var pulseAnim = useRef(new RNAnimated.Value(1)).current;
  var pulseRef  = useRef(null);

  var actions = ACTIONS.filter(function(a) {
    if ((a.id === 'won' || a.id === 'lost') && !hasPendingBets) return false;
    return true;
  });

  var fabColor = isProfit ? '#1A9E4A' : '#FF3B30';

  // Pulse ring when closed
  useEffect(function() {
    if (!open) {
      pulseRef.current = RNAnimated.loop(
        RNAnimated.sequence([
          RNAnimated.timing(pulseAnim, { toValue: 1.28, duration: 1000, useNativeDriver: true }),
          RNAnimated.timing(pulseAnim, { toValue: 1,    duration: 1000, useNativeDriver: true }),
        ])
      );
      pulseRef.current.start();
    } else {
      if (pulseRef.current) pulseRef.current.stop();
      pulseAnim.setValue(1);
    }
    return function() { if (pulseRef.current) pulseRef.current.stop(); };
  }, [open]);

  function openMenu() {
    setOpen(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    rotate.value   = withSpring(1, { damping: 14, stiffness: 120 });
    fabScale.value = withSpring(0.92, { damping: 14, stiffness: 200 });
  }

  function closeMenu() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    rotate.value   = withSpring(0, { damping: 18, stiffness: 200 });
    fabScale.value = withSpring(1, { damping: 14, stiffness: 200 });
    setTimeout(function() { setOpen(false); }, 120);
  }

  function toggle() { open ? closeMenu() : openMenu(); }

  function handleAction(id) {
    closeMenu();
    setTimeout(function() { if (onAction) onAction(id); }, 220);
  }

  var fabAnimStyle = useAnimatedStyle(function() {
    return {
      transform: [
        { rotate: interpolate(rotate.value, [0, 1], [0, 45]) + 'deg' },
        { scale: fabScale.value },
      ],
    };
  });

  var pulseOpacity = pulseAnim.interpolate({
    inputRange: [1, 1.28], outputRange: [0.45, 0], extrapolate: 'clamp',
  });

  return (
    <>
      <Backdrop open={open} onPress={closeMenu} />

      {/* Outer wrapper — overflow visible for labels */}
      <View style={st.outerWrap} pointerEvents="box-none">
        {/* Action items */}
        {actions.map(function(action, index) {
          return (
            <ActionItem
              key={action.id}
              action={action}
              index={index}
              total={actions.length}
              open={open}
              onPress={handleAction}
            />
          );
        })}

        {/* Main FAB */}
        <Pressable
          onPressIn={function() {
            fabScale.value = withSpring(0.92, { damping: 12, stiffness: 300 });
          }}
          onPressOut={function() {
            fabScale.value = withSpring(open ? 0.92 : 1, { damping: 12, stiffness: 300 });
          }}
          onPress={toggle}
          style={st.fabPressable}
        >
          <Animated.View style={[st.fab, { backgroundColor: fabColor, shadowColor: fabColor }, fabAnimStyle]}>
            {/* Pulse ring */}
            {!open && (
              <RNAnimated.View
                pointerEvents="none"
                style={[st.pulse, { backgroundColor: fabColor, transform: [{ scale: pulseAnim }], opacity: pulseOpacity }]}
              />
            )}
            <Text style={st.fabIcon}>＋</Text>
          </Animated.View>
        </Pressable>
      </View>
    </>
  );
}

var st = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
    zIndex: 98,
  },
  outerWrap: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 90 : 85,
    right: 20,
    alignItems: 'center',
    zIndex: 999,
    elevation: 20,
    overflow: 'visible',
  },
  fabPressable: { alignItems: 'center', justifyContent: 'center' },
  fab: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 14,
  },
  fabIcon: { fontSize: 28, color: '#fff', lineHeight: 32, fontWeight: '300' },
  pulse: {
    position: 'absolute',
    width: 64, height: 64, borderRadius: 32,
  },
  actionWrap: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    overflow: 'visible',
  },
  labelWrap: { flexDirection: 'row', alignItems: 'center' },
  labelPill: {
    backgroundColor: 'rgba(12,12,12,0.9)',
    borderRadius: 12,
    paddingHorizontal: 13,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  labelMain: { fontSize: 13, fontWeight: '700', color: '#fff', letterSpacing: -0.2 },
  labelSub:  { fontSize: 10, color: 'rgba(255,255,255,0.6)', fontWeight: '500', marginTop: 1 },
  labelArrow: {
    width: 0, height: 0,
    borderTopWidth: 5, borderBottomWidth: 5, borderLeftWidth: 6,
    borderTopColor: 'transparent', borderBottomColor: 'transparent',
    borderLeftColor: 'rgba(12,12,12,0.9)',
    marginLeft: -1,
  },
  circle: {
    width: 52, height: 52, borderRadius: 26,
    alignItems: 'center', justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35, shadowRadius: 10, elevation: 10,
  },
  circleIcon: { fontSize: 20, color: '#fff', fontWeight: '700' },
});
