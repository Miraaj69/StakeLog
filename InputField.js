// components/InputField.js
import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable } from 'react-native';
import { useTheme } from './useTheme';
import { Spacing, Radius, Typography } from './theme';

export default function InputField({
  label, value, onChangeText, placeholder, keyboardType = 'default',
  multiline = false, options, error, hint, rightIcon, onRightIconPress,
}) {
  const { colors } = useTheme();
  const [focused, setFocused] = useState(false);
  const s = styles(colors, focused, !!error);

  if (options) {
    return (
      <View style={s.wrapper}>
        <Text style={s.label}>{label}</Text>
        <View style={s.pickerRow}>
          {options.map(opt => (
            <Pressable
              key={opt}
              onPress={() => onChangeText(opt)}
              style={[s.optionChip, value === opt && s.optionChipActive]}
            >
              <Text style={[s.optionText, value === opt && s.optionTextActive]} numberOfLines={1}>
                {opt}
              </Text>
            </Pressable>
          ))}
        </View>
        {error && <Text style={s.errorText}>{error}</Text>}
      </View>
    );
  }

  return (
    <View style={s.wrapper}>
      <Text style={s.label}>{label}</Text>
      <View style={[s.inputContainer, focused && s.inputFocused, !!error && s.inputError]}>
        <TextInput
          style={[s.input, multiline && s.inputMultiline]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textTertiary}
          keyboardType={keyboardType}
          multiline={multiline}
          numberOfLines={multiline ? 3 : 1}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          autoCorrect={false}
        />
        {rightIcon && (
          <Pressable onPress={onRightIconPress} style={s.rightIcon}>
            <Text style={{ fontSize: 16 }}>{rightIcon}</Text>
          </Pressable>
        )}
      </View>
      {error ? <Text style={s.errorText}>{error}</Text> : hint ? <Text style={s.hintText}>{hint}</Text> : null}
    </View>
  );
}

const styles = (colors, focused, hasError) => StyleSheet.create({
  wrapper: { marginBottom: Spacing.sm },
  label: {
    ...Typography.label,
    color: focused ? colors.primary : colors.textSecondary,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceVariant,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: hasError ? colors.loss : focused ? colors.primary : colors.border,
    paddingHorizontal: Spacing.md,
    minHeight: 52,
  },
  inputFocused: { borderColor: colors.primary, backgroundColor: colors.surface },
  inputError: { borderColor: colors.loss },
  input: {
    flex: 1,
    ...Typography.body,
    color: colors.textPrimary,
    paddingVertical: Spacing.sm,
  },
  inputMultiline: { minHeight: 80, textAlignVertical: 'top', paddingTop: Spacing.sm },
  rightIcon: { padding: Spacing.xs },
  errorText: { ...Typography.caption, color: colors.loss, marginTop: 4, marginLeft: 4 },
  hintText: { ...Typography.caption, color: colors.textTertiary, marginTop: 4, marginLeft: 4 },
  pickerRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  optionChip: {
    paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: Radius.full, borderWidth: 1.5,
    borderColor: colors.border, backgroundColor: colors.surfaceVariant,
    marginBottom: 4,
  },
  optionChipActive: { borderColor: colors.primary, backgroundColor: colors.primaryContainer },
  optionText: { ...Typography.bodySmall, color: colors.textSecondary, fontWeight: '600' },
  optionTextActive: { color: colors.primary, fontWeight: '700' },
});
