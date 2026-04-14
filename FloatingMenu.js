// FloatingMenu.js — 4 actions, RN Animated (no Reanimated crash)
import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, Pressable, Platform,
  Animated as RNAnimated, TouchableWithoutFeedback,
} from 'react-native';
import * as Haptics from 'expo-haptics';

// 4 focused actions only
var ACTIONS = [
  { id: 'add',   icon: '＋', label: 'Add New Bet',  sub: 'Log a bet',         bg: '#E50914' },
  { id: 'won',   icon: '✓',  label: 'Mark as Won',  sub: 'Pending bet won',   bg: '#1A9E4A' },
  { id: 'lost',  icon: '✕',  label: 'Mark as Lost', sub: 'Pending bet lost',  bg: '#D93025' },
  { id: 'stats', icon: '📊', label: "Today's P&L",  sub: 'Quick snapshot',    bg: '#0284C7' },
];

export default function FloatingMenu({ onAction, hasPendingBets }) {
  var [open, setOpen] = useState(false);
  var menuAnim    = useRef(new RNAnimated.Value(0)).current;
  var rotateAnim  = useRef(new RNAnimated.Value(0)).current;
  var bgAnim      = useRef(new RNAnimated.Value(0)).current;
  var pulseAnim   = useRef(new RNAnimated.Value(1)).current;
  var pulseRef    = useRef(null);

  var actions = ACTIONS.filter(function(a) {
    if ((a.id === 'won' || a.id === 'lost') && !hasPendingBets) return false;
    return true;
  });

  useEffect(function() {
    if (!open) {
      pulseRef.current = RNAnimated.loop(
        RNAnimated.sequence([
          RNAnimated.timing(pulseAnim, { toValue: 1.3, duration: 1000, useNativeDriver: true }),
          RNAnimated.timing(pulseAnim, { toValue: 1,   duration: 1000, useNativeDriver: true }),
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
    RNAnimated.parallel([
      RNAnimated.spring(menuAnim,   { toValue: 1, useNativeDriver: true, damping: 18, stiffness: 260 }),
      RNAnimated.spring(rotateAnim, { toValue: 1, useNativeDriver: true, damping: 18, stiffness: 260 }),
      RNAnimated.timing(bgAnim,     { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();
  }

  function closeMenu() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    RNAnimated.parallel([
      RNAnimated.spring(menuAnim,   { toValue: 0, useNativeDriver: true, damping: 22, stiffness: 300 }),
      RNAnimated.spring(rotateAnim, { toValue: 0, useNativeDriver: true, damping: 22, stiffness: 300 }),
      RNAnimated.timing(bgAnim,     { toValue: 0, duration: 160, useNativeDriver: true }),
    ]).start(function() { setOpen(false); });
  }

  function toggle() { open ? closeMenu() : openMenu(); }

  function handleAction(id) {
    closeMenu();
    setTimeout(function() { if (onAction) onAction(id); }, 180);
  }

  var rotate = rotateAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '45deg'] });
  var pulseOpacity = pulseAnim.interpolate({ inputRange: [1, 1.3], outputRange: [0.4, 0], extrapolate: 'clamp' });

  return (
    <>
      {open && (
        <TouchableWithoutFeedback onPress={closeMenu}>
          <RNAnimated.View style={[st.backdrop, { opacity: bgAnim }]} />
        </TouchableWithoutFeedback>
      )}

      <View style={st.wrap} pointerEvents="box-none">

        {actions.map(function(action, idx) {
          var ty = menuAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [0, -((idx + 1) * 70)],
          });
          var sc = menuAnim.interpolate({
            inputRange: [0, 1], outputRange: [0.4, 1], extrapolate: 'clamp',
          });
          var op = menuAnim.interpolate({
            inputRange: [0, 0.5, 1], outputRange: [0, 0, 1], extrapolate: 'clamp',
          });

          return (
            <RNAnimated.View
              key={action.id}
              pointerEvents={open ? 'auto' : 'none'}
              style={[st.item, { transform: [{ translateY: ty }, { scale: sc }], opacity: op }]}
            >
              <View style={st.lblRow}>
                <View style={st.lbl}>
                  <Text style={st.lblMain}>{action.label}</Text>
                  <Text style={st.lblSub}>{action.sub}</Text>
                </View>
                <View style={st.arrow} />
              </View>
              <Pressable
                onPress={function() { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); handleAction(action.id); }}
                style={function(p) { return [st.circle, { backgroundColor: action.bg, shadowColor: action.bg, opacity: p.pressed ? 0.82 : 1 }]; }}
              >
                <Text style={st.circleIcon}>{action.icon}</Text>
              </Pressable>
            </RNAnimated.View>
          );
        })}

        <Pressable onPress={toggle} style={function(p) { return { opacity: p.pressed ? 0.9 : 1 }; }}>
          <RNAnimated.View style={[st.fab, { transform: [{ rotate: rotate }] }]}>
            {!open && (
              <RNAnimated.View
                pointerEvents="none"
                style={[st.pulse, { transform: [{ scale: pulseAnim }], opacity: pulseOpacity }]}
              />
            )}
            <Text style={st.fabIcon}>＋</Text>
          </RNAnimated.View>
        </Pressable>

      </View>
    </>
  );
}

var st = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.48)',
    zIndex: 98,
  },
  wrap: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 92 : 82,
    right: 20,
    alignItems: 'center',
    zIndex: 99,
  },
  fab: {
    width: 58, height: 58, borderRadius: 29,
    backgroundColor: '#E50914',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#E50914',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.42, shadowRadius: 14, elevation: 12,
  },
  fabIcon: { fontSize: 25, color: '#fff', lineHeight: 29 },
  pulse: {
    position: 'absolute',
    width: 58, height: 58, borderRadius: 29,
    backgroundColor: '#E50914',
  },
  item: {
    position: 'absolute', bottom: 0, right: 0,
    flexDirection: 'row', alignItems: 'center', gap: 10,
  },
  lblRow: { flexDirection: 'row', alignItems: 'center' },
  lbl: {
    backgroundColor: '#fff', borderRadius: 12,
    paddingHorizontal: 13, paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12, shadowRadius: 8, elevation: 5,
  },
  lblMain: { fontSize: 13, fontWeight: '700', color: '#111', letterSpacing: -0.2 },
  lblSub:  { fontSize: 10, color: '#888', fontWeight: '500', marginTop: 1 },
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
