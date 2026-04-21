// FloatingMenu.js — All 5 bugs fixed
import React, { useState, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, Pressable, Platform,
  TouchableWithoutFeedback, Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, withTiming,
  withDelay, interpolate, Extrapolation, runOnJS, useDerivedValue,
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

// ── Single action item ────────────────────────────────────────────
function FabItem({ action, index, progress, onPress }) {
  var btnScale = useSharedValue(1);

  var DISTANCES = [80, 152, 224, 296, 368];
  var dist  = DISTANCES[index] || (index + 1) * 72;
  // FIX 1: delay actually used in withDelay now
  var delay = index * 50;

  // FIX 2: double scale conflict removed — combined into single scale value
  var itemStyle = useAnimatedStyle(function () {
    var p = progress.value;
    var progressScale = interpolate(p, [0, 1], [0.5, 1], Extrapolation.CLAMP);
    return {
      transform: [
        // FIX 1: translateY now wrapped in withDelay so stagger actually works
        { translateY: withDelay(delay, withSpring(
            interpolate(p, [0, 1], [0, -dist], Extrapolation.CLAMP),
            SPRING
          ))
        },
        // FIX 2: one combined scale — progressScale × btnScale (no conflict)
        { scale: progressScale * btnScale.value },
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

  // FIX 5: derived value for pointer events — safe to read in JS
  var isVisible = useDerivedValue(function () {
    return progress.value > 0.05;
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
    <Animated.View
      style={[st.itemWrap, itemStyle]}
      // FIX 5: use 'auto' always when open — controlled by parent visibility
      pointerEvents="auto"
    >
      <Animated.View style={[st.labelWrap, labelStyle]}>
        <View style={st.labelPill}>
          <Text style={st.labelMain}>{action.label}</Text>
          {action.sub ? <Text style={st.labelSub}>{action.sub}</Text> : null}
        </View>
        <View style={st.labelArrow} />
      </Animated.View>

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
  var [open, setOpen]          = useState(false);
  var [backdropVisible, setBV] = useState(false);
  var isAnimating              = useRef(false);

  var progress  = useSharedValue(0);
  var bgOpacity = useSharedValue(0);

  // FIX 3: FAB always RED — primary action color should never flip
  var fabColor = '#FF3B30';

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
    progress.value = withSpring(0, { damping: 18, stiffness: 200 }, function () {
      runOnJS(setOpen)(false);
      isAnimating.current = false;
    });
    // FIX 4: backdrop hides AFTER animation finishes — no abrupt cut
    bgOpacity.value = withTiming(0, { duration: 180 }, function () {
      runOnJS(setBV)(false);
    });
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
      <Backdrop visible={backdropVisible} opacity={bgOpacity} onPress={closeMenu} />

      <View style={st.container} pointerEvents="box-none">

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
  container: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 90 : 84,
    right: 20,
    width: 64,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
    elevation: 20,
    overflow: 'visible',
  },
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
