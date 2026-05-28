// Skeleton.js — M3 Expressive shimmer placeholders · Zero blur
import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated as RNAnimated } from 'react-native';
import { useTheme } from './useTheme';

function ShimmerBox({ width, height, borderRadius = 14, style }) {
  const { colors, isDark } = useTheme();
  const anim = useRef(new RNAnimated.Value(0)).current;

  useEffect(() => {
    const loop = RNAnimated.loop(
      RNAnimated.sequence([
        RNAnimated.timing(anim, { toValue: 1, duration: 850, useNativeDriver: false }),
        RNAnimated.timing(anim, { toValue: 0, duration: 850, useNativeDriver: false }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  const bg = anim.interpolate({
    inputRange:  [0, 1],
    outputRange: isDark
      ? ['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.12)']
      : ['rgba(0,0,0,0.05)',       'rgba(0,0,0,0.11)'],
  });

  return (
    <RNAnimated.View style={[
      { width, height, borderRadius, backgroundColor: bg },
      style,
    ]} />
  );
}

// ── Bet card skeleton ─────────────────────────────────────────────
export function BetCardSkeleton() {
  const { colors, isDark } = useTheme();
  return (
    <View style={[sk.card, {
      backgroundColor: isDark ? colors.surfaceVariant : '#FFFFFF',
      borderColor:     colors.border,
    }]}>
      <View style={sk.row}>
        <ShimmerBox width={40} height={40} borderRadius={12} />
        <View style={{ flex: 1, gap: 8 }}>
          <ShimmerBox width="70%" height={13} borderRadius={8} />
          <ShimmerBox width="45%" height={11} borderRadius={7} />
        </View>
        <ShimmerBox width={52} height={22} borderRadius={999} />
      </View>
      <View style={[sk.strip, { backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.025)' }]}>
        <ShimmerBox width="28%" height={32} borderRadius={0} />
        <ShimmerBox width="28%" height={32} borderRadius={0} />
        <ShimmerBox width="28%" height={32} borderRadius={0} />
      </View>
    </View>
  );
}

// ── Hero card skeleton ────────────────────────────────────────────
export function HeroSkeleton() {
  const { colors, isDark } = useTheme();
  return (
    <View style={[sk.hero, {
      backgroundColor: isDark ? colors.surfaceVariant : '#FFFFFF',
      borderColor:     colors.border,
    }]}>
      <ShimmerBox width={120} height={10} borderRadius={6} style={{ marginBottom: 12 }} />
      <ShimmerBox width="60%" height={46} borderRadius={12} style={{ marginBottom: 14 }} />
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <ShimmerBox width={90} height={24} borderRadius={999} />
        <ShimmerBox width={70} height={24} borderRadius={999} />
        <ShimmerBox width={60} height={24} borderRadius={999} />
      </View>
    </View>
  );
}

// ── Metric tile skeleton ──────────────────────────────────────────
export function MetricSkeleton({ count = 3 }) {
  return (
    <View style={{ flexDirection: 'row', gap: 10 }}>
      {Array.from({ length: count }).map((_, i) => (
        <View key={i} style={{ flex: 1 }}>
          <ShimmerBox width="100%" height={72} borderRadius={22} />
        </View>
      ))}
    </View>
  );
}

// ── Full home skeleton ────────────────────────────────────────────
export function HomeSkeleton() {
  return (
    <View style={sk.screen}>
      <HeroSkeleton />
      <View style={{ height: 16 }} />
      <MetricSkeleton count={3} />
      <View style={{ height: 14 }} />
      <MetricSkeleton count={4} />
      <View style={{ height: 14 }} />
      {[0, 1, 2].map(i => (
        <View key={i} style={{ marginBottom: 10 }}>
          <BetCardSkeleton />
        </View>
      ))}
    </View>
  );
}

export default ShimmerBox;

const sk = StyleSheet.create({
  screen: { padding: 16 },
  hero:   { borderRadius: 28, padding: 22, borderWidth: 1, marginBottom: 0 },
  card:   { borderRadius: 22, padding: 14, borderWidth: 1, marginBottom: 10,
            shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  row:    { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  strip:  { flexDirection: 'row', borderRadius: 14, overflow: 'hidden',
            height: 44, justifyContent: 'space-around', alignItems: 'center' },
});
