// FloatingMenu.js — Premium radial FAB, Reanimated-safe
import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, Pressable, Platform,
  Animated as RNAnimated, TouchableWithoutFeedback,
} from 'react-native';
import * as Haptics from 'expo-haptics';

// Radial positions — arc going upward along right edge
// Each action: { id, icon, label, sublabel, bg, tx (translateX), ty (translateY) }
function buildActions(hasPendingBets, isProfit) {
  var base = [
    {
      id: 'add',
      icon: '＋',
      label: 'New Bet',
      sublabel: 'Log a bet',
      bg: '#E50914',
      tx: -10,   // slight left
      ty: -72,   // stack upward
    },
    {
      id: 'won',
      icon: '✓',
      label: 'Mark Won',
      sublabel: 'Pending bet won',
      bg: '#1A9E4A',
      tx: 0,
      ty: -144,
    },
    {
      id: 'lost',
      icon: '✕',
      label: 'Mark Lost',
      sublabel: 'Pending bet lost',
      bg: '#D93025',
      tx: 0,
      ty: -216,
    },
    {
      id: 'stats',
      icon: '📊',
      label: "Today's P&L",
      sublabel: 'Quick snapshot',
      bg: '#0284C7',
      tx: 0,
      ty: -288,
    },
  ];

  // Filter won/lost if no pending
  if (!hasPendingBets) {
    base = base.filter(function(a) { return a.id !== 'won' && a.id !== 'lost'; });
    // Recompute ty for remaining items
    base.forEach(function(a, i) { a.ty = -(i + 1) * 72; });
  }

  return base;
}

// Single action button — all hooks at top level
function ActionBtn({ action, progress, onPress, isProfit }) {
  var btnScale = useRef(new RNAnimated.Value(1)).current;

  var translateX = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, action.tx],
    extrapolate: 'clamp',
  });
  var translateY = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, action.ty],
    extrapolate: 'clamp',
  });
  var scale = progress.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.3, 0.7, 1],
    extrapolate: 'clamp',
  });
  var opacity = progress.interpolate({
    inputRange: [0, 0.4, 1],
    outputRange: [0, 0, 1],
    extrapolate: 'clamp',
  });

  // Label slides in from right
  var labelOpacity = progress.interpolate({
    inputRange: [0, 0.6, 1],
    outputRange: [0, 0, 1],
    extrapolate: 'clamp',
  });

  return (
    <RNAnimated.View
      pointerEvents="box-none"
      style={[
        st.actionWrap,
        {
          transform: [
            { translateX: translateX },
            { translateY: translateY },
            { scale: scale },
          ],
          opacity: opacity,
        },
      ]}
    >
      {/* Label pill — left of button */}
      <RNAnimated.View style={[st.labelWrap, { opacity: labelOpacity }]}>
        <View style={st.labelPill}>
          <Text style={st.labelMain}>{action.label}</Text>
          <Text style={st.labelSub}>{action.sublabel}</Text>
        </View>
        <View style={st.labelArrow} />
      </RNAnimated.View>

      {/* Circle button */}
      <Pressable
        onPressIn={() => {
          btnScale.setValue(0.88);
        }}
        onPressOut={() => {
          RNAnimated.spring(btnScale, { toValue: 1, useNativeDriver: true, damping: 14, stiffness: 250 }).start();
        }}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          onPress(action.id);
        }}
      >
        <RNAnimated.View
          style={[
            st.circle,
            {
              backgroundColor: action.bg,
              shadowColor: action.bg,
              transform: [{ scale: btnScale }],
            },
          ]}
        >
          <Text style={st.circleIcon}>{action.icon}</Text>
        </RNAnimated.View>
      </Pressable>
    </RNAnimated.View>
  );
}

export default function FloatingMenu({ onAction, hasPendingBets, isProfit, totalPnL }) {
  var [open, setOpen] = useState(false);
  var progress   = useRef(new RNAnimated.Value(0)).current;
  var fabRotate  = useRef(new RNAnimated.Value(0)).current;
  var fabScale   = useRef(new RNAnimated.Value(1)).current;
  var bgOpacity  = useRef(new RNAnimated.Value(0)).current;
  var pulseAnim  = useRef(new RNAnimated.Value(1)).current;
  var pulseLoop  = useRef(null);

  var actions = buildActions(hasPendingBets, isProfit);

  // FAB color — green glow if profit, red if loss
  var fabBg    = '#7C6BFF';
  var fabGlow  = '#7C6BFF';

  // Pulse when closed
  useEffect(function() {
    if (!open) {
      pulseLoop.current = RNAnimated.loop(
        RNAnimated.sequence([
          RNAnimated.timing(pulseAnim, { toValue: 1.28, duration: 900, useNativeDriver: true }),
          RNAnimated.timing(pulseAnim, { toValue: 1,    duration: 900, useNativeDriver: true }),
        ])
      );
      pulseLoop.current.start();
    } else {
      if (pulseLoop.current) pulseLoop.current.stop();
      pulseAnim.setValue(1);
    }
    return function() { if (pulseLoop.current) pulseLoop.current.stop(); };
  }, [open]);

  function openMenu() {
    setOpen(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    RNAnimated.parallel([
      RNAnimated.spring(progress,  { toValue: 1, useNativeDriver: false, damping: 14, stiffness: 120 }),
      RNAnimated.spring(fabRotate, { toValue: 1, useNativeDriver: true,  damping: 14, stiffness: 120 }),
      RNAnimated.spring(fabScale,  { toValue: 0.9, useNativeDriver: true, damping: 14 }),
      RNAnimated.timing(bgOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();
  }

  function closeMenu() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    RNAnimated.parallel([
      RNAnimated.spring(progress,  { toValue: 0, useNativeDriver: false, damping: 20, stiffness: 200 }),
      RNAnimated.spring(fabRotate, { toValue: 0, useNativeDriver: true,  damping: 20, stiffness: 200 }),
      RNAnimated.spring(fabScale,  { toValue: 1, useNativeDriver: true,  damping: 14 }),
      RNAnimated.timing(bgOpacity, { toValue: 0, duration: 160, useNativeDriver: true }),
    ]).start(function() { setOpen(false); });
  }

  function toggle() { open ? closeMenu() : openMenu(); }

  function handleAction(id) {
    closeMenu();
    setTimeout(function() { if (onAction) onAction(id); }, 200);
  }

  var rotate = fabRotate.interpolate({
    inputRange: [0, 1], outputRange: ['0deg', '45deg'],
  });
  var pulseOpacity = pulseAnim.interpolate({
    inputRange: [1, 1.28], outputRange: [0.45, 0], extrapolate: 'clamp',
  });

  return (
    <>
      {/* Dim backdrop */}
      {open && (
        <TouchableWithoutFeedback onPress={closeMenu}>
          <RNAnimated.View style={[st.backdrop, { opacity: bgOpacity }]} />
        </TouchableWithoutFeedback>
      )}

      {/* FAB container — bottom-right anchor */}
      <View style={st.container} pointerEvents="box-none">

        {/* Action buttons — rendered as siblings so hooks work */}
        {actions.map(function(action) {
          return (
            <ActionBtn
              key={action.id}
              action={action}
              progress={progress}
              onPress={handleAction}
              isProfit={isProfit}
            />
          );
        })}

        {/* Main FAB */}
        <Pressable
          onPressIn={function() {
            RNAnimated.spring(fabScale, { toValue: 0.92, useNativeDriver: true, damping: 12 }).start();
          }}
          onPressOut={function() {
            RNAnimated.spring(fabScale, { toValue: open ? 0.9 : 1, useNativeDriver: true, damping: 12 }).start();
          }}
          onPress={toggle}
        >
          <RNAnimated.View
            style={[
              st.fab,
              {
                backgroundColor: '#7C6BFF',
                shadowColor: fabGlow,
                transform: [{ rotate: rotate }, { scale: fabScale }],
              },
            ]}
          >
            {/* Pulse ring */}
            {!open && (
              <RNAnimated.View
                pointerEvents="none"
                style={[
                  st.pulse,
                  {
                    backgroundColor: '#7C6BFF',
                    transform: [{ scale: pulseAnim }],
                    opacity: pulseOpacity,
                  },
                ]}
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
    backgroundColor: 'rgba(0,0,0,0.45)',
    zIndex: 98,
  },
  container: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 96 : 88,
    right: 20,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 99,
  },

  // Main FAB
  fab: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 14,
  },
  fabIcon: {
    fontSize: 26,
    color: '#fff',
    lineHeight: 30,
    fontWeight: '300',
  },
  pulse: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
  },

  // Action item wrapper — absolutely positioned over FAB
  actionWrap: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  // Label
  labelWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  labelPill: {
    backgroundColor: 'rgba(15,15,15,0.88)',
    borderRadius: 12,
    paddingHorizontal: 13,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  labelMain: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: -0.2,
  },
  labelSub: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '500',
    marginTop: 1,
  },
  labelArrow: {
    width: 0,
    height: 0,
    borderTopWidth: 5,
    borderBottomWidth: 5,
    borderLeftWidth: 6,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderLeftColor: 'rgba(15,15,15,0.88)',
    marginLeft: -1,
  },

  // Action circle
  circle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 10,
  },
  circleIcon: {
    fontSize: 20,
    color: '#fff',
    fontWeight: '700',
  },
});
