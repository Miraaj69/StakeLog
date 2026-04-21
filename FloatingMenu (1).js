// FloatingMenu.js — Bug-free premium FAB
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

var { width: SW } = Dimensions.get('window');
var SPRING = { damping: 12, stiffness: 120, mass: 0.8 };

// ── Backdrop ─────────────────────────────────────────────────────
function Backdrop({ visible, opacity, onPress }) {
  var style = useAnimatedStyle(function () {
    return { opacity: opacity.value };
  });
  if (!visible) return null;
  return (
    <TouchableWithoutFeedback onPress={onPress}>
      <Animated.View
        style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(0,0,0,0.45)', zIndex: 998 }, style]}
      />
    </TouchableWithoutFeedback>
  );
}

// ── Single action item — hooks at top level ───────────────────────
function FabItem({ action, index, progress, onPress }) {
  // Each item's own scale — no shared state
  var btnScale = useSharedValue(1);

  var DISTANCES = [80, 152, 224, 296, 368]; // enough room for 5 items
  var dist = DISTANCES[index] || (index + 1) * 72;
  var delay = index * 50;

  var itemStyle = useAnimatedStyle(function () {
    var p = progress.value;
    return {
      transform: [
        { translateY: interpolate(p, [0, 1], [0, -dist], Extrapolation.CLAMP) },
        { scale:      interpolate(p, [0, 1], [0.5, 1],   Extrapolation.CLAMP) },
        { scale:      btnScale.value },
      ],
      opacity: interpolate(p, [0, 0.3, 1], [0, 0, 1], Extrapolation.CLAMP),
    };
  });

  // Label slides from right
  var labelStyle = useAnimatedStyle(function () {
    return {
      opacity:   interpolate(progress.value, [0.55, 1], [0, 1], Extrapolation.CLAMP),
      transform: [
        { translateX: interpolate(progress.value, [0.55, 1], [10, 0], Extrapolation.CLAMP) },
      ],
    };
  });

  function handlePressIn() {
    btnScale.value = withSpring(0.88, { damping: 14, stiffness: 300 });
  }
  function handlePressOut() {
    btnScale.value = withSpring(1, { damping: 14, stiffness: 300 });
  }
  function handlePress() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress(action.id);
  }

  return (
    // KEY: overflow visible, absolute position from FAB center
    <Animated.View
      style={[st.itemWrap, itemStyle]}
      pointerEvents={progress.value > 0.05 ? 'auto' : 'none'}
    >
      {/* Label — to the left of button */}
      <Animated.View style={[st.labelWrap, labelStyle]}>
        <View style={st.labelPill}>
          <Text style={st.labelMain}>{action.label}</Text>
          {action.sub ? <Text style={st.labelSub}>{action.sub}</Text> : null}
        </View>
        <View style={st.labelArrow} />
      </Animated.View>

      {/* Circle */}
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
        hitSlop={8}
      >
        <View style={[st.circle, { backgroundColor: action.bg, shadowColor: action.bg }]}>
          <Text style={st.circleIcon}>{action.icon}</Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

// ── FAB button ────────────────────────────────────────────────────
function FabButton({ isOpen, color, onPress, isAnimating }) {
  var rotate   = useSharedValue(0);
  var fabScale = useSharedValue(1);

  // Sync rotation with open state
  React.useEffect(function () {
    rotate.value   = withSpring(isOpen ? 1 : 0, SPRING);
    fabScale.value = withSpring(isOpen ? 0.9 : 1, SPRING);
  }, [isOpen]);

  var fabStyle = useAnimatedStyle(function () {
    return {
      transform: [
        { rotate: interpolate(rotate.value, [0, 1], [0, 45]) + 'deg' },
        { scale:  fabScale.value },
      ],
    };
  });

  function handlePressIn() {
    if (!isAnimating) fabScale.value = withSpring(0.88, { damping: 12, stiffness: 300 });
  }
  function handlePressOut() {
    fabScale.value = withSpring(isOpen ? 0.9 : 1, { damping: 12, stiffness: 300 });
  }

  return (
    <Pressable onPressIn={handlePressIn} onPressOut={handlePressOut} onPress={onPress} hitSlop={6}>
      <Animated.View style={[st.fab, { backgroundColor: color, shadowColor: color }, fabStyle]}>
        <Text style={st.fabIcon}>＋</Text>
      </Animated.View>
    </Pressable>
  );
}

// ── Actions config ────────────────────────────────────────────────
var ALL_ACTIONS = [
  { id: 'add',   icon: '＋', label: 'New Bet',    sub: 'Log a bet',       bg: '#FF3B30' },
  { id: 'quick', icon: '⚡', label: 'Quick Bet',  sub: '2-sec entry',     bg: '#7C3AED' },
  { id: 'won',   icon: '✓',  label: 'Mark Won',   sub: 'Pending → Won',   bg: '#1A9E4A' },
  { id: 'lost',  icon: '✕',  label: 'Mark Lost',  sub: 'Pending → Lost',  bg: '#D93025' },
  { id: 'stats', icon: '📊', label: "Today's P&L", sub: 'Quick snapshot', bg: '#0284C7' },
];

// ── Main export ───────────────────────────────────────────────────
export default function FloatingMenu({ onAction, hasPendingBets, isProfit }) {
  var [open, setOpen]           = useState(false);
  var [backdropVisible, setBV]  = useState(false);
  var isAnimating               = useRef(false);

  var progress    = useSharedValue(0);
  var bgOpacity   = useSharedValue(0);
  var fabColor    = isProfit ? '#1A9E4A' : '#FF3B30';

  var actions = ALL_ACTIONS.filter(function (a) {
    if ((a.id === 'won' || a.id === 'lost') && !hasPendingBets) return false;
    return true;
  });

  var openMenu = useCallback(function () {
    if (isAnimating.current) return;
    isAnimating.current = true;
    setBV(true);
    setOpen(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    progress.value  = withSpring(1, SPRING, function () { isAnimating.current = false; });
    bgOpacity.value = withTiming(1, { duration: 200 });
  }, []);

  var closeMenu = useCallback(function () {
    if (isAnimating.current) return;
    isAnimating.current = true;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    progress.value  = withSpring(0, { damping: 18, stiffness: 200 }, function () {
      runOnJS(setOpen)(false);
      runOnJS(setBV)(false);
      isAnimating.current = false;
    });
    bgOpacity.value = withTiming(0, { duration: 180 });
  }, []);

  function toggle() {
    open ? closeMenu() : openMenu();
  }

  function handleAction(id) {
    closeMenu();
    setTimeout(function () { if (onAction) onAction(id); }, 200);
  }

  return (
    <>
      {/* Backdrop — rendered outside container so it covers everything */}
      <Backdrop visible={backdropVisible} opacity={bgOpacity} onPress={closeMenu} />

      {/* FAB container
          KEY FIXES:
          - overflow: 'visible' (items not clipped)
          - zIndex: 999 (above all content)
          - items positioned absolute from this container's bottom-right
      */}
      <View style={st.container} pointerEvents="box-none">

        {/* Action items — absolute stacked above FAB */}
        {actions.map(function (action, index) {
          return (
            <FabItem
              key={action.id}
              action={action}
              index={index}
              progress={progress}
              onPress={handleAction}
            />
          );
        })}

        {/* Main FAB */}
        <FabButton
          isOpen={open}
          color={fabColor}
          onPress={toggle}
          isAnimating={isAnimating.current}
        />
      </View>
    </>
  );
}

var st = StyleSheet.create({
  // Container anchored bottom-right — overflow visible is critical
  container: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 90 : 84,
    right: 20,
    width: 64,    // matches FAB width
    height: 64,   // matches FAB height
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
    elevation: 20,
    overflow: 'visible',   // ← CRITICAL: items must not be clipped
  },

  // FAB
  fab: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 18,
    elevation: 16,
  },
  fabIcon: {
    fontSize: 28,
    color: '#fff',
    lineHeight: 32,
    fontWeight: '300',
  },

  // Each action item — absolute over FAB, right-aligned to FAB
  itemWrap: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'visible',   // ← labels never clip
  },

  // Label
  labelWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    // Stop label going off left edge
    maxWidth: SW - 120,
  },
  labelPill: {
    backgroundColor: 'rgba(10,10,10,0.88)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 7,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
  },
  labelMain: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: -0.2,
  },
  labelSub: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.55)',
    fontWeight: '500',
    marginTop: 1,
  },
  labelArrow: {
    width: 0, height: 0,
    borderTopWidth: 5,
    borderBottomWidth: 5,
    borderLeftWidth: 6,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderLeftColor: 'rgba(10,10,10,0.88)',
    marginLeft: -1,
  },

  // Action circle
  circle: {
    width: 52,
    height: 52,
    borderRadius: 26,
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
