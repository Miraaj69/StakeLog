// Skeleton.js — Shimmer loading placeholders
import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated as RNAnimated } from 'react-native';
import { useTheme } from './useTheme';

function ShimmerBox({ width, height, borderRadius, style }) {
  var { colors, isDark } = useTheme();
  var anim = useRef(new RNAnimated.Value(0)).current;

  useEffect(function() {
    var loop = RNAnimated.loop(
      RNAnimated.sequence([
        RNAnimated.timing(anim, { toValue: 1, duration: 900, useNativeDriver: false }),
        RNAnimated.timing(anim, { toValue: 0, duration: 900, useNativeDriver: false }),
      ])
    );
    loop.start();
    return function() { loop.stop(); };
  }, []);

  var bg = anim.interpolate({
    inputRange: [0, 1],
    outputRange: isDark
      ? ['rgba(255,255,255,0.04)', 'rgba(255,255,255,0.10)']
      : ['rgba(0,0,0,0.05)',       'rgba(0,0,0,0.12)'],
  });

  return (
    <RNAnimated.View style={[{
      width: width || '100%',
      height: height || 16,
      borderRadius: borderRadius || 8,
      backgroundColor: bg,
    }, style]} />
  );
}

export function BetCardSkeleton() {
  var { colors } = useTheme();
  return (
    <View style={[sk.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={[sk.accent, { backgroundColor: colors.border }]} />
      <View style={sk.body}>
        <View style={sk.row}>
          <View style={{ flex: 1, gap: 6 }}>
            <ShimmerBox height={16} width="70%" />
            <ShimmerBox height={11} width="45%" />
          </View>
          <ShimmerBox width={72} height={26} borderRadius={999} />
        </View>
        <ShimmerBox height={52} borderRadius={12} style={{ marginBottom: 10 }} />
        <View style={{ flexDirection: 'row', gap: 6 }}>
          <ShimmerBox width={60} height={22} borderRadius={7} />
          <ShimmerBox width={70} height={22} borderRadius={7} />
          <ShimmerBox width={80} height={22} borderRadius={7} />
        </View>
      </View>
    </View>
  );
}

export function HomeScreenSkeleton() {
  var { colors } = useTheme();
  return (
    <View style={{ padding: 16, gap: 14 }}>
      {/* Hero */}
      <ShimmerBox height={180} borderRadius={24} />
      {/* Session row */}
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <ShimmerBox height={72} borderRadius={16} style={{ flex: 1 }} />
        <ShimmerBox height={72} borderRadius={16} style={{ flex: 1 }} />
        <ShimmerBox height={72} borderRadius={16} style={{ flex: 1 }} />
      </View>
      {/* Count row */}
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <ShimmerBox height={72} borderRadius={16} style={{ flex: 1 }} />
        <ShimmerBox height={72} borderRadius={16} style={{ flex: 1 }} />
        <ShimmerBox height={72} borderRadius={16} style={{ flex: 1 }} />
      </View>
      {/* Insights */}
      <ShimmerBox height={56} borderRadius={14} />
      <ShimmerBox height={56} borderRadius={14} />
    </View>
  );
}

var sk = StyleSheet.create({
  card:   { flexDirection: 'row', borderRadius: 20, overflow: 'hidden', borderWidth: 0.5, marginBottom: 8 },
  accent: { width: 4 },
  body:   { flex: 1, padding: 14, gap: 10 },
  row:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 },
});
