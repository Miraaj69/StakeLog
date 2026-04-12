// components/StatsCard.js
import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../hooks/useTheme';
import { Spacing, Radius, Typography, Shadows } from '../utils/theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function StatsCard({ icon, label, value, subValue, color, bgColor, onPress, gradient, size = 'md' }) {
  const { colors } = useTheme();
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const handlePressIn = () => { scale.value = withSpring(0.96, { damping: 15 }); };
  const handlePressOut = () => { scale.value = withSpring(1, { damping: 15 }); };

  const s = styles(colors, size);

  const content = (
    <View style={s.content}>
      {icon && <Text style={s.icon}>{icon}</Text>}
      <Text style={[s.value, { color: color || colors.textPrimary }]} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      <Text style={s.label}>{label}</Text>
      {subValue && <Text style={[s.subValue, { color: color || colors.textTertiary }]}>{subValue}</Text>}
    </View>
  );

  const card = gradient ? (
    <LinearGradient colors={gradient} style={s.card} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
      {content}
    </LinearGradient>
  ) : (
    <View style={[s.card, { backgroundColor: bgColor || colors.surfaceVariant }]}>
      {content}
    </View>
  );

  if (!onPress) return <Animated.View style={[animStyle, s.wrapper]}>{card}</Animated.View>;

  return (
    <AnimatedPressable style={[animStyle, s.wrapper]} onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut}>
      {card}
    </AnimatedPressable>
  );
}

const styles = (colors, size) => StyleSheet.create({
  wrapper: { flex: 1 },
  card: {
    borderRadius: size === 'lg' ? Radius.xxl : Radius.xl,
    padding: size === 'lg' ? Spacing.lg : Spacing.md,
    minHeight: size === 'lg' ? 120 : 90,
    justifyContent: 'space-between',
    ...Shadows.md,
  },
  content: { flex: 1, justifyContent: 'space-between' },
  icon: { fontSize: size === 'lg' ? 28 : 22, marginBottom: 6 },
  value: {
    fontSize: size === 'lg' ? 26 : 20,
    fontWeight: '900',
    letterSpacing: -0.5,
    marginBottom: 2,
  },
  label: {
    ...Typography.micro,
    color: colors.textTertiary,
    textTransform: 'uppercase',
  },
  subValue: { ...Typography.caption, marginTop: 2 },
});
