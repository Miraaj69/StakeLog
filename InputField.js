// InputField.js — Material 3 Expressive · Tonal input surface
import React, { useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, Pressable,
} from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, withTiming,
} from 'react-native-reanimated';
import { useTheme } from './useTheme';

export default function InputField({
  label, value, onChangeText, placeholder,
  keyboardType = 'default', multiline = false,
  options, error, hint, rightIcon, onRightIconPress,
}) {
  const { colors, isDark } = useTheme();
  const [focused, setFocused] = useState(false);

  // Option picker mode
  if (options) {
    return (
      <View style={s.wrapper}>
        {label ? <Text style={[s.label, { color: colors.textTertiary }]}>{label}</Text> : null}
        <View style={s.pickerRow}>
          {options.map(opt => {
            const active = value === opt;
            return (
              <Pressable
                key={opt}
                onPress={() => onChangeText(opt)}
                style={[s.chip, {
                  backgroundColor: active
                    ? 'rgba(255,75,106,0.1)'
                    : isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                  borderColor: active
                    ? 'rgba(255,75,106,0.3)'
                    : colors.border,
                }]}
              >
                <Text style={[s.chipTxt, {
                  color:      active ? '#FF4B6A' : colors.textSecondary,
                  fontWeight: active ? '800' : '500',
                }]}>{opt}</Text>
              </Pressable>
            );
          })}
        </View>
        {error ? <Text style={[s.error, { color: '#FF4444' }]}>{error}</Text> : null}
        {hint  ? <Text style={[s.hint,  { color: colors.textTertiary }]}>{hint}</Text> : null}
      </View>
    );
  }

  // Text input mode
  return (
    <View style={s.wrapper}>
      {label ? <Text style={[s.label, { color: focused ? '#FF4B6A' : colors.textTertiary }]}>{label}</Text> : null}
      <View style={[s.inputWrap, {
        backgroundColor: isDark
          ? 'rgba(255,255,255,0.05)'
          : 'rgba(0,0,0,0.03)',
        borderColor:   error ? '#FF4444' : focused ? '#FF4B6A' : colors.border,
        borderWidth:   focused || error ? 1.5 : 1,
        shadowColor:   focused ? '#FF4B6A' : 'transparent',
        shadowOpacity: focused ? 0.15 : 0,
        shadowRadius:  6,
        shadowOffset:  { width: 0, height: 0 },
      }]}>
        <TextInput
          style={[s.input, {
            color:            colors.textPrimary,
            minHeight:        multiline ? 80 : undefined,
            textAlignVertical:multiline ? 'top' : undefined,
          }]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textTertiary}
          keyboardType={keyboardType}
          multiline={multiline}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
        {rightIcon && (
          <Pressable onPress={onRightIconPress} hitSlop={8} style={s.rightIcon}>
            <Text style={{ fontSize: 18 }}>{rightIcon}</Text>
          </Pressable>
        )}
      </View>
      {error ? <Text style={[s.error, { color: '#FF4444' }]}>{error}</Text> : null}
      {hint  ? <Text style={[s.hint,  { color: colors.textTertiary }]}>{hint}</Text> : null}
    </View>
  );
}

const s = StyleSheet.create({
  wrapper:   { marginBottom: 14 },
  label:     { fontSize: 10, fontWeight: '700', textTransform: 'uppercase',
               letterSpacing: 1.1, marginBottom: 8 },
  inputWrap: { flexDirection: 'row', alignItems: 'center',
               borderRadius: 16, paddingHorizontal: 14 },
  input:     { flex: 1, fontSize: 15, fontWeight: '500',
               paddingVertical: 13 },
  rightIcon: { paddingLeft: 8 },
  error:     { fontSize: 11, fontWeight: '600', marginTop: 5 },
  hint:      { fontSize: 11, marginTop: 5, lineHeight: 16 },
  pickerRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip:      { paddingHorizontal: 14, paddingVertical: 8,
               borderRadius: 999, borderWidth: 1 },
  chipTxt:   { fontSize: 13 },
});
