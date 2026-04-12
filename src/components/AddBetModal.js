// components/AddBetModal.js — Premium Redesign
import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, Pressable, StyleSheet, KeyboardAvoidingView,
  Platform, Modal, SafeAreaView, TouchableWithoutFeedback, Keyboard,
} from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, withTiming,
  SlideInDown, SlideOutDown,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../hooks/useTheme';
import InputField from './InputField';
import { STATUSES, BET_TYPES, formatMoney, makeForm } from '../utils/calculations';
import { Spacing, Radius, Typography, Shadows } from '../utils/theme';

const STEPS = [
  { id: 'event', title: 'What are you betting on?', emoji: '🎯' },
  { id: 'stake', title: 'Stake & Odds', emoji: '💰' },
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
      setForm(editBet ? { ...editBet, tags: editBet.tags || [], betType: editBet.betType || 'Single' } : makeForm(bookies, sports));
      setStep(0); setErrors({}); setTagInput('');
    }
  }, [visible, editBet]);

  useEffect(() => {
    progress.value = withSpring(step / (STEPS.length - 1), { damping: 20 });
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

  const potentialWin = form.stake && form.odds && parseFloat(form.odds) > 1
    ? parseFloat(form.stake) * (parseFloat(form.odds) - 1)
    : null;

  const s = styles(colors);

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={s.overlay}>
          <Pressable style={s.backdrop} onPress={onClose} />
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={s.sheetWrapper}>
            <Animated.View entering={SlideInDown.springify().damping(28)} exiting={SlideOutDown.duration(220)} style={[s.sheet, { backgroundColor: colors.surface }]}>
              <SafeAreaView>
                <View style={[s.handle, { backgroundColor: colors.border }]} />

                {/* Header */}
                <View style={s.header}>
                  <View style={[s.stepEmojiWrap, { backgroundColor: colors.primaryContainer, borderColor: colors.primaryBorder }]}>
                    <Text style={{ fontSize: 18 }}>{STEPS[step].emoji}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[s.stepMeta, { color: colors.textTertiary }]}>Step {step + 1} of {STEPS.length}</Text>
                    <Text style={[s.title, { color: colors.textPrimary }]}>{editBet ? 'Edit Bet' : STEPS[step].title}</Text>
                  </View>
                  <Pressable onPress={onClose} style={[s.closeBtn, { backgroundColor: colors.surfaceVariant, borderColor: colors.border }]}>
                    <Text style={{ color: colors.textTertiary, fontSize: 16, fontWeight: '600' }}>✕</Text>
                  </Pressable>
                </View>

                {/* Progress */}
                <View style={[s.progressTrack, { backgroundColor: colors.border }]}>
                  <Animated.View style={[s.progressFill, { backgroundColor: colors.primary }, progressStyle]} />
                </View>

                {/* Step dots */}
                <View style={s.stepDots}>
                  {STEPS.map((_, i) => (
                    <View key={i} style={[
                      s.stepDot,
                      { backgroundColor: i <= step ? colors.primary : colors.border, width: i === step ? 20 : 6 },
                    ]} />
                  ))}
                </View>

                {/* Templates */}
                {step === 0 && templates.length > 0 && !editBet && (
                  <View style={s.templatesRow}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      <View style={{ flexDirection: 'row', gap: 7, paddingHorizontal: Spacing.lg }}>
                        {templates.map(tp => (
                          <Pressable key={tp.id}
                            onPress={() => setForm({ ...makeForm(bookies, sports), ...tp, id: null, date: new Date().toISOString().slice(0, 10) })}
                            style={[s.templateChip, { backgroundColor: colors.primaryContainer, borderColor: colors.primaryBorder }]}>
                            <Text style={[s.templateText, { color: colors.primary }]} numberOfLines={1}>{tp.event || 'Template'}</Text>
                          </Pressable>
                        ))}
                      </View>
                    </ScrollView>
                  </View>
                )}

                <ScrollView style={s.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                  {/* Step 0 */}
                  {step === 0 && (
                    <View style={{ gap: Spacing.md }}>
                      <InputField label="Event / Match" value={form.event} onChangeText={sf('event')} placeholder="e.g. India vs Australia" error={errors.event} />
                      <InputField label="Your Bet" value={form.bet} onChangeText={sf('bet')} placeholder="e.g. India to win" error={errors.bet} />
                      <InputField label="Bookie" value={form.bookie} onChangeText={sf('bookie')} options={[...bookies, 'Other']} />
                      <InputField label="Sport" value={form.sport} onChangeText={sf('sport')} options={sports} />
                    </View>
                  )}

                  {/* Step 1 */}
                  {step === 1 && (
                    <View style={{ gap: Spacing.md }}>
                      <InputField label={`Stake (${currSym})`} value={form.stake} onChangeText={sf('stake')} keyboardType="decimal-pad" placeholder="e.g. 500" error={errors.stake}
                        hint={suggestStake ? `💡 Suggested: ${formatMoney(suggestStake, currSym)} (2% rule)` : null} />
                      <InputField label="Odds" value={form.odds} onChangeText={sf('odds')} keyboardType="decimal-pad" placeholder="e.g. 1.85" error={errors.odds} />
                      {potentialWin !== null && (
                        <View style={[s.potentialCard, { backgroundColor: colors.profitContainer, borderColor: colors.profitBorder }]}>
                          <Text style={[s.potentialLabel, { color: colors.profit }]}>POTENTIAL WIN</Text>
                          <Text style={[s.potentialAmount, { color: colors.profit }]}>
                            +{formatMoney(potentialWin, currSym)}
                          </Text>
                          <Text style={[s.potentialSub, { color: colors.profit }]}>
                            Returns {formatMoney(potentialWin + parseFloat(form.stake), currSym)}
                          </Text>
                        </View>
                      )}
                    </View>
                  )}

                  {/* Step 2 */}
                  {step === 2 && (
                    <View style={{ gap: Spacing.md }}>
                      <InputField label="Bet Type" value={form.betType || 'Single'} onChangeText={sf('betType')} options={BET_TYPES} />
                      <InputField label="Status" value={form.status} onChangeText={sf('status')} options={STATUSES} />
                      <InputField label="Date" value={form.date} onChangeText={sf('date')} placeholder="YYYY-MM-DD" />
                      <InputField label="Match Time (optional)" value={form.matchTime || ''} onChangeText={sf('matchTime')} placeholder="HH:MM" />
                    </View>
                  )}

                  {/* Step 3 */}
                  {step === 3 && (
                    <View style={{ gap: Spacing.md }}>
                      <InputField label="Notes / Analysis" value={form.notes} onChangeText={sf('notes')} placeholder="Tipster source, reasoning..." multiline />
                      <View>
                        <Text style={[s.tagsLabel, { color: colors.textTertiary }]}>TAGS</Text>
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                          {(form.tags || []).map(tag => (
                            <Pressable key={tag} onPress={() => sf('tags')((form.tags || []).filter(x => x !== tag))}
                              style={[s.tagChip, { backgroundColor: colors.primaryContainer, borderColor: colors.primaryBorder }]}>
                              <Text style={[s.tagChipText, { color: colors.primary }]}>#{tag} ×</Text>
                            </Pressable>
                          ))}
                        </View>
                        <InputField label="Add Tag" value={tagInput} onChangeText={setTagInput} placeholder="e.g. iplbet" rightIcon="＋" onRightIconPress={addTag} />
                      </View>
                    </View>
                  )}

                  <View style={{ height: 24 }} />
                </ScrollView>

                {/* Footer */}
                <View style={[s.footer, { borderTopColor: colors.border }]}>
                  {step > 0 && (
                    <Pressable onPress={() => setStep(s => s - 1)} style={[s.backBtn, { borderColor: colors.border, backgroundColor: colors.surfaceVariant }]}>
                      <Text style={[s.backBtnText, { color: colors.textSecondary }]}>← Back</Text>
                    </Pressable>
                  )}
                  <Pressable onPress={nextStep} style={[s.nextBtn, { backgroundColor: colors.primary, flex: 1, ...Shadows.primary }]}>
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
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)' },
  sheetWrapper: { maxHeight: '94%' },
  sheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: '100%', borderTopWidth: 0.5, borderColor: colors.border },
  handle: { width: 36, height: 4, borderRadius: 2, alignSelf: 'center', marginTop: 10, marginBottom: 6 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.lg, paddingVertical: 12, gap: 12 },
  stepEmojiWrap: { width: 44, height: 44, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center', borderWidth: 0.5, flexShrink: 0 },
  stepMeta: { ...Typography.overline, marginBottom: 2 },
  title: { ...Typography.h4 },
  closeBtn: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', borderWidth: 0.5 },
  progressTrack: { height: 2, marginHorizontal: Spacing.lg, borderRadius: 2, overflow: 'hidden', marginBottom: 8 },
  progressFill: { height: '100%', borderRadius: 2 },
  stepDots: { flexDirection: 'row', gap: 5, paddingHorizontal: Spacing.lg, marginBottom: 12 },
  stepDot: { height: 6, borderRadius: 3, backgroundColor: colors.primary },
  templatesRow: { marginBottom: 10 },
  templateChip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: Radius.full, borderWidth: 0.5 },
  templateText: { fontSize: 12, fontWeight: '700' },
  content: { paddingHorizontal: Spacing.lg },
  potentialCard: { borderRadius: Radius.lg, padding: Spacing.md, alignItems: 'center', borderWidth: 0.5 },
  potentialLabel: { ...Typography.overline, marginBottom: 6 },
  potentialAmount: { fontSize: 32, fontWeight: '800', letterSpacing: -1.5, marginBottom: 2 },
  potentialSub: { fontSize: 12, fontWeight: '500', opacity: 0.7 },
  tagsLabel: { ...Typography.overline, marginBottom: 8 },
  tagChip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: Radius.full, borderWidth: 0.5 },
  tagChipText: { fontSize: 12, fontWeight: '700' },
  footer: { flexDirection: 'row', gap: 10, padding: Spacing.lg, borderTopWidth: 0.5 },
  backBtn: { borderWidth: 0.5, borderRadius: Radius.full, paddingVertical: 14, paddingHorizontal: 20, alignItems: 'center', justifyContent: 'center' },
  backBtnText: { fontSize: 14, fontWeight: '600' },
  nextBtn: { borderRadius: Radius.full, paddingVertical: 14, alignItems: 'center', justifyContent: 'center' },
  nextBtnText: { color: '#fff', fontSize: 14, fontWeight: '700', letterSpacing: 0.3 },
});
