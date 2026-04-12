// components/AddBetModal.js
import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, Pressable, StyleSheet, KeyboardAvoidingView,
  Platform, Modal, SafeAreaView, TouchableWithoutFeedback, Keyboard,
} from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming, FadeIn, SlideInDown, SlideOutDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTheme } from './useTheme';
import InputField from './InputField';
import { STATUSES, BET_TYPES, formatMoney, makeForm } from './calculations';
import { Spacing, Radius, Typography, Shadows } from './theme';

const STEPS = [
  { id: 'event', title: 'What are you betting on?', emoji: '🎯' },
  { id: 'stake', title: 'Stakes & Odds', emoji: '💰' },
  { id: 'details', title: 'Details', emoji: '📋' },
  { id: 'notes', title: 'Notes & Tags', emoji: '📝' },
];

export default function AddBetModal({ visible, onClose, onSave, editBet, bookies, sports, templates, suggestStake, currSym = '₹' }) {
  const { colors } = useTheme();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(makeForm(bookies, sports));
  const [errors, setErrors] = useState({});
  const [tagInput, setTagInput] = useState('');
  const progress = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      if (editBet) {
        setForm({ ...editBet, tags: editBet.tags || [], betType: editBet.betType || 'Single' });
      } else {
        setForm(makeForm(bookies, sports));
      }
      setStep(0);
      setErrors({});
      setTagInput('');
    }
  }, [visible, editBet]);

  useEffect(() => {
    progress.value = withSpring(step / (STEPS.length - 1));
  }, [step]);

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  const sf = (key) => (val) => {
    setForm(f => ({ ...f, [key]: val }));
    if (errors[key]) setErrors(e => ({ ...e, [key]: null }));
  };

  const validateStep = () => {
    const e = {};
    if (step === 0 && !form.event.trim()) e.event = 'Required';
    if (step === 0 && !form.bet.trim()) e.bet = 'Required';
    if (step === 1 && (!form.odds || isNaN(form.odds) || parseFloat(form.odds) <= 1)) e.odds = 'Enter valid odds (>1)';
    if (step === 1 && (!form.stake || isNaN(form.stake) || parseFloat(form.stake) <= 0)) e.stake = 'Enter valid amount';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const nextStep = () => {
    if (!validateStep()) { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error); return; }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (step < STEPS.length - 1) setStep(s => s + 1);
    else handleSave();
  };

  const handleSave = () => {
    if (!validateStep()) return;
    onSave(form);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onClose();
  };

  const addTag = () => {
    const tag = tagInput.trim();
    if (tag && !(form.tags || []).includes(tag)) {
      sf('tags')([...(form.tags || []), tag]);
      setTagInput('');
    }
  };

  const s = styles(colors);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={s.overlay}>
          <Pressable style={s.backdrop} onPress={onClose} />

          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={s.sheetWrapper}>
            <Animated.View entering={SlideInDown} exiting={SlideOutDown} style={s.sheet}>
              <SafeAreaView>
                {/* Handle */}
                <View style={s.handle} />

                {/* Header */}
                <View style={s.header}>
                  <Text style={[s.stepEmoji]}>{STEPS[step].emoji}</Text>
                  <Text style={[s.title, { color: colors.textPrimary }]}>{editBet ? 'Edit Bet' : STEPS[step].title}</Text>
                  <Text style={[s.stepCount, { color: colors.textTertiary }]}>{step + 1}/{STEPS.length}</Text>
                </View>

                {/* Progress bar */}
                <View style={[s.progressTrack, { backgroundColor: colors.border }]}>
                  <Animated.View style={[s.progressFill, { backgroundColor: colors.primary }, progressStyle]} />
                </View>

                {/* Templates (step 0 only) */}
                {step === 0 && templates.length > 0 && !editBet && (
                  <View style={s.templatesSection}>
                    <Text style={[s.sectionLabel, { color: colors.textTertiary }]}>QUICK TEMPLATES</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      <View style={{ flexDirection: 'row', gap: 8, paddingVertical: 4 }}>
                        {templates.map(tp => (
                          <Pressable key={tp.id} onPress={() => setForm({ ...makeForm(bookies, sports), ...tp, id: null, date: new Date().toISOString().slice(0, 10) })}
                            style={[s.templateChip, { backgroundColor: colors.primaryContainer }]}>
                            <Text style={[s.templateText, { color: colors.primary }]} numberOfLines={1}>{tp.event || 'Template'}</Text>
                          </Pressable>
                        ))}
                      </View>
                    </ScrollView>
                  </View>
                )}

                <ScrollView style={s.content} showsVerticalScrollIndicator={false}>
                  {/* Step 0: Event */}
                  {step === 0 && (
                    <View style={{ gap: Spacing.md }}>
                      <InputField t={colors} label="Event / Match" value={form.event} onChangeText={sf('event')} placeholder="e.g. India vs Australia" error={errors.event} />
                      <InputField label="Your Bet" value={form.bet} onChangeText={sf('bet')} placeholder="e.g. India to win" error={errors.bet} />
                      <InputField label="Bookie / Site" value={form.bookie} onChangeText={sf('bookie')} options={[...bookies, 'Other']} />
                      <InputField label="Sport" value={form.sport} onChangeText={sf('sport')} options={sports} />
                    </View>
                  )}

                  {/* Step 1: Stake & Odds */}
                  {step === 1 && (
                    <View style={{ gap: Spacing.md }}>
                      <InputField label={`Stake (${currSym})`} value={form.stake} onChangeText={sf('stake')} keyboardType="decimal-pad" placeholder="e.g. 500" error={errors.stake} hint={suggestStake ? `💡 Suggested: ${formatMoney(suggestStake, currSym)} (2% bankroll)` : null} />
                      <InputField label="Odds" value={form.odds} onChangeText={sf('odds')} keyboardType="decimal-pad" placeholder="e.g. 1.85" error={errors.odds} />
                      {form.stake && form.odds && parseFloat(form.odds) > 1 && (
                        <View style={[s.potentialWin, { backgroundColor: colors.profitContainer }]}>
                          <Text style={[s.potentialLabel, { color: colors.profit }]}>POTENTIAL WIN</Text>
                          <Text style={[s.potentialAmount, { color: colors.profit }]}>
                            {formatMoney(parseFloat(form.stake) * (parseFloat(form.odds) - 1), currSym)}
                          </Text>
                        </View>
                      )}
                    </View>
                  )}

                  {/* Step 2: Details */}
                  {step === 2 && (
                    <View style={{ gap: Spacing.md }}>
                      <InputField label="Bet Type" value={form.betType || 'Single'} onChangeText={sf('betType')} options={BET_TYPES} />
                      <InputField label="Status" value={form.status} onChangeText={sf('status')} options={STATUSES} />
                      <InputField label="Date" value={form.date} onChangeText={sf('date')} placeholder="YYYY-MM-DD" />
                      <InputField label="Match Time (optional)" value={form.matchTime || ''} onChangeText={sf('matchTime')} placeholder="HH:MM" />
                    </View>
                  )}

                  {/* Step 3: Notes & Tags */}
                  {step === 3 && (
                    <View style={{ gap: Spacing.md }}>
                      <InputField label="Notes / Analysis" value={form.notes} onChangeText={sf('notes')} placeholder="Tipster source, reasoning..." multiline />
                      <View>
                        <Text style={[s.sectionLabel, { color: colors.textTertiary, marginBottom: 8 }]}>TAGS</Text>
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                          {(form.tags || []).map(tag => (
                            <Pressable key={tag} onPress={() => sf('tags')((form.tags || []).filter(x => x !== tag))}
                              style={[s.tagChip, { backgroundColor: colors.primaryContainer }]}>
                              <Text style={[s.tagText, { color: colors.primary }]}>#{tag} ×</Text>
                            </Pressable>
                          ))}
                        </View>
                        <InputField label="Add Tag" value={tagInput} onChangeText={setTagInput} placeholder="e.g. iplbet (press +)" rightIcon="+" onRightIconPress={addTag} />
                      </View>
                    </View>
                  )}

                  <View style={{ height: 32 }} />
                </ScrollView>

                {/* Footer buttons */}
                <View style={s.footer}>
                  {step > 0 && (
                    <Pressable onPress={() => setStep(s => s - 1)} style={[s.backBtn, { borderColor: colors.border }]}>
                      <Text style={[s.backBtnText, { color: colors.textSecondary }]}>← Back</Text>
                    </Pressable>
                  )}
                  <Pressable onPress={nextStep} style={[s.nextBtn, { backgroundColor: colors.primary, flex: 1 }]}>
                    <Text style={s.nextBtnText}>
                      {step === STEPS.length - 1 ? (editBet ? 'Update Bet ✓' : 'Save Bet ✓') : 'Continue →'}
                    </Text>
                  </Pressable>
                </View>
              </SafeAreaView>
            </Animated.View>
          </KeyboardAvoidingView>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = (colors) => StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)' },
  sheetWrapper: { maxHeight: '92%' },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '100%',
    ...Shadows.lg,
  },
  handle: { width: 40, height: 4, backgroundColor: colors.border, borderRadius: 2, alignSelf: 'center', marginTop: 12, marginBottom: 8 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, gap: 10 },
  stepEmoji: { fontSize: 24 },
  title: { ...Typography.h3, flex: 1 },
  stepCount: { ...Typography.caption },
  progressTrack: { height: 3, marginHorizontal: Spacing.lg, borderRadius: 2, marginBottom: Spacing.md, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 2 },
  templatesSection: { paddingHorizontal: Spacing.lg, marginBottom: Spacing.sm },
  sectionLabel: { ...Typography.micro, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 },
  templateChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: Radius.full },
  templateText: { ...Typography.label, fontWeight: '700' },
  content: { paddingHorizontal: Spacing.lg },
  potentialWin: { borderRadius: Radius.lg, padding: Spacing.md, alignItems: 'center' },
  potentialLabel: { ...Typography.micro, textTransform: 'uppercase', marginBottom: 4 },
  potentialAmount: { fontSize: 28, fontWeight: '900', letterSpacing: -1 },
  tagChip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: Radius.full },
  tagText: { ...Typography.caption, fontWeight: '700' },
  footer: { flexDirection: 'row', gap: Spacing.sm, padding: Spacing.lg, paddingBottom: Spacing.lg },
  backBtn: { borderWidth: 1.5, borderRadius: Radius.full, paddingVertical: 14, paddingHorizontal: Spacing.lg, alignItems: 'center', justifyContent: 'center' },
  backBtnText: { ...Typography.label, fontWeight: '600' },
  nextBtn: { borderRadius: Radius.full, paddingVertical: 14, alignItems: 'center', justifyContent: 'center', ...Shadows.primary },
  nextBtnText: { color: '#fff', ...Typography.label, fontWeight: '800', letterSpacing: 0.5 },
});
