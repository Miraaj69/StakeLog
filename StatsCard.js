// StatsCard.js — M3 Expressive · Tonal surface · Spring press
import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring,
} from 'react-native-reanimated';
import { useTheme } from './useTheme';

export default function StatsCard({
  icon, label, value, subValue, color,
  bgColor, onPress, size = 'md',
}) {
  const { colors, isDark } = useTheme();
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const isLg = size === 'lg';

  return (
    <Animated.View style={animStyle}>
      <Pressable
        onPressIn={() => {
          if (onPress) scale.value = withSpring(0.95, { damping: 20, stiffness: 400 });
        }}
        onPressOut={() => {
          scale.value = withSpring(1, { damping: 20, stiffness: 400 });
        }}
        onPress={onPress}
        style={[
          sc.card,
          {
            backgroundColor: bgColor
              || (isDark ? colors.surfaceVariant : '#FFFFFF'),
            borderColor: colors.border,
            paddingVertical:   isLg ? 18 : 14,
            paddingHorizontal: isLg ? 16 : 12,
          },
        ]}
      >
        {icon ? (
          <Text style={[sc.icon, { fontSize: isLg ? 22 : 18 }]}>{icon}</Text>
        ) : null}

        <Text style={[
          sc.value,
          {
            color:    color || colors.textPrimary,
            fontSize: isLg ? 26 : 18,
          },
        ]} numberOfLines={1} adjustsFontSizeToFit>
          {value}
        </Text>

        <Text style={[sc.label, { color: colors.textTertiary }]} numberOfLines={1}>
          {label}
        </Text>

        {subValue ? (
          <Text style={[sc.sub, { color: color || colors.textSecondary }]}>
            {subValue}
          </Text>
        ) : null}
      </Pressable>
    </Animated.View>
  );
}

const sc = StyleSheet.create({
  card: {
    flex: 1, borderRadius: 20, borderWidth: 1,
    alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  icon:  { marginBottom: 6 },
  value: { fontWeight: '800', letterSpacing: -0.5, textAlign: 'center' },
  label: { fontSize: 9, fontWeight: '700', textTransform: 'uppercase',
           letterSpacing: 0.8, marginTop: 4, textAlign: 'center' },
  sub:   { fontSize: 11, fontWeight: '600', marginTop: 3 },
});
