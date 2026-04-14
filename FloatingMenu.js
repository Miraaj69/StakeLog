// FloatingMenu.js — Reanimated-safe, no recursive callbacks
import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, Pressable, Alert,
  Platform, Animated as RNAnimated, TouchableWithoutFeedback,
} from 'react-native';
import * as Haptics from 'expo-haptics';

// Uses React Native's built-in Animated (NOT Reanimated) — crash-safe on all devices

const ACTIONS = [
  { id: 'add',   icon: '＋', label: 'Add New Bet',     sub: 'Log a bet',          bg: '#E50914', shadow: '#E50914' },
  { id: 'won',   icon: '✓',  label: 'Mark as Won',     sub: 'Update pending bet', bg: '#1A9E4A', shadow: '#1A9E4A' },
  { id: 'lost',  icon: '✕',  label: 'Mark as Lost',    sub: 'Update pending bet', bg: '#D93025', shadow: '#D93025' },
  { id: 'quick', icon: '⚡', label: 'Quick Duplicate', sub: 'Repeat last bet',    bg: '#7C3AED', shadow: '#7C3AED' },
  { id: 'stats', icon: '📊', label: "Today's P&L",     sub: 'View quick summary', bg: '#0284C7', shadow: '#0284C7' },
];

export default function FloatingMenu({ onAction, hasPendingBets }) {
  const [open, setOpen] = useState(false);

  // Single animated value for the whole menu state (0=closed, 1=open)
  const menuAnim = useRef(new RNAnimated.Value(0)).current;
  // FAB rotation
  const rotateAnim = useRef(new RNAnimated.Value(0)).current;
  // Backdrop opacity
  const backdropAnim = useRef(new RNAnimated.Value(0)).current;
  // Pulse
  const pulseAnim = useRef(new RNAnimated.Value(1)).current;
  const pulseLoop = useRef(null);

  // Visible actions
  const actions = ACTIONS.filter(a => {
    if ((a.id === 'won' || a.id === 'lost') && !hasPendingBets) return false;
    return true;
  });

  // Start pulse when closed
  useEffect(() => {
    if (!open) {
      pulseLoop.current = RNAnimated.loop(
        RNAnimated.sequence([
          RNAnimated.timing(pulseAnim, { toValue: 1.35, duration: 1000, useNativeDriver: true }),
          RNAnimated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
        ])
      );
      pulseLoop.current.start();
    } else {
      if (pulseLoop.current) pulseLoop.current.stop();
      pulseAnim.setValue(1);
    }
    return () => { if (pulseLoop.current) pulseLoop.current.stop(); };
  }, [open]);

  const openMenu = () => {
    setOpen(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    RNAnimated.parallel([
      RNAnimated.spring(menuAnim, { toValue: 1, useNativeDriver: true, damping: 18, stiffness: 260 }),
      RNAnimated.spring(rotateAnim, { toValue: 1, useNativeDriver: true, damping: 18, stiffness: 260 }),
      RNAnimated.timing(backdropAnim, { toValue: 1, duration: 220, useNativeDriver: true }),
    ]).start();
  };

  const closeMenu = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    RNAnimated.parallel([
      RNAnimated.spring(menuAnim, { toValue: 0, useNativeDriver: true, damping: 22, stiffness: 300 }),
      RNAnimated.spring(rotateAnim, { toValue: 0, useNativeDriver: true, damping: 22, stiffness: 300 }),
      RNAnimated.timing(backdropAnim, { toValue: 0, duration: 180, useNativeDriver: true }),
    ]).start(() => setOpen(false));
  };

  const toggle = () => { open ? closeMenu() : openMenu(); };

  const handleAction = (id) => {
    closeMenu();
    setTimeout(() => { if (onAction) onAction(id); }, 200);
  };

  // FAB icon rotation
  const rotate = rotateAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '45deg'] });

  // Pulse opacity
  const pulseOpacity = pulseAnim.interpolate({ inputRange: [1, 1.35], outputRange: [0.45, 0] });

  return (
    <>
      {/* Backdrop */}
      {open && (
        <TouchableWithoutFeedback onPress={closeMenu}>
          <RNAnimated.View
            style={[st.backdrop, { opacity: backdropAnim }]}
            pointerEvents={open ? 'auto' : 'none'}
          />
        </TouchableWithoutFeedback>
      )}

      <View style={st.container} pointerEvents="box-none">

        {/* Action items — staggered */}
        {actions.map((action, index) => {
          const itemAnim = menuAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [0, -((index + 1) * 68)],
          });
          const itemOpacity = menuAnim.interpolate({
            inputRange: [Math.max(0, 1 - (index + 1) * 0.25), 1],
            outputRange: [0, 1],
            extrapolate: 'clamp',
          });
          const itemScale = menuAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [0.5, 1],
            extrapolate: 'clamp',
          });

          return (
            <RNAnimated.View
              key={action.id}
              pointerEvents={open ? 'auto' : 'none'}
              style={[
                st.itemWrap,
                {
                  transform: [{ translateY: itemAnim }, { scale: itemScale }],
                  opacity: itemOpacity,
                },
              ]}
            >
              {/* Label */}
              <View style={st.labelRow}>
                <View style={[st.labelBox, { shadowColor: action.shadow }]}>
                  <Text style={st.labelMain}>{action.label}</Text>
                  <Text style={st.labelSub}>{action.sub}</Text>
                </View>
                <View style={st.arrow} />
              </View>

              {/* Circle */}
              <Pressable
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); handleAction(action.id); }}
                style={({ pressed }) => [
                  st.circle,
                  { backgroundColor: action.bg, shadowColor: action.shadow, opacity: pressed ? 0.85 : 1 },
                ]}
              >
                <Text style={st.circleIcon}>{action.icon}</Text>
              </Pressable>
            </RNAnimated.View>
          );
        })}

        {/* Main FAB */}
        <Pressable onPress={toggle} style={({ pressed }) => [{ opacity: pressed ? 0.92 : 1 }]}>
          <RNAnimated.View style={[st.fab, { transform: [{ rotate }] }]}>
            {/* Pulse ring — only when closed */}
            {!open && (
              <RNAnimated.View
                style={[
                  st.pulseRing,
                  { transform: [{ scale: pulseAnim }], opacity: pulseOpacity },
                ]}
                pointerEvents="none"
              />
            )}
            <Text style={st.fabIcon}>＋</Text>
          </RNAnimated.View>
        </Pressable>

      </View>
    </>
  );
}

const st = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 98,
  },
  container: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 30 : 22,
    right: 20,
    alignItems: 'center',
    zIndex: 99,
  },
  fab: {
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: '#E50914',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#E50914',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45, shadowRadius: 14,
    elevation: 12,
  },
  fabIcon: { fontSize: 26, color: '#fff', lineHeight: 30 },
  pulseRing: {
    position: 'absolute',
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: '#E50914',
  },
  itemWrap: {
    position: 'absolute', bottom: 0, right: 0,
    flexDirection: 'row', alignItems: 'center', gap: 10,
  },
  labelRow: { flexDirection: 'row', alignItems: 'center' },
  labelBox: {
    backgroundColor: '#fff', borderRadius: 12,
    paddingHorizontal: 13, paddingVertical: 8,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15, shadowRadius: 8, elevation: 5,
  },
  labelMain: { fontSize: 13, fontWeight: '700', color: '#111', letterSpacing: -0.2 },
  labelSub:  { fontSize: 10, color: '#888', fontWeight: '500', marginTop: 1 },
  arrow: {
    width: 0, height: 0,
    borderTopWidth: 5, borderBottomWidth: 5, borderLeftWidth: 6,
    borderTopColor: 'transparent', borderBottomColor: 'transparent',
    borderLeftColor: '#fff', marginLeft: -1,
  },
  circle: {
    width: 48, height: 48, borderRadius: 24,
    alignItems: 'center', justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 8,
  },
  circleIcon: { fontSize: 19, color: '#fff', fontWeight: '700' },
});
