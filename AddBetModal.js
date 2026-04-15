// AddBetModal.js — with sports autocomplete + bet type suggestions
import React, { useState, useEffect, useMemo } from 'react';
import {
  View, Text, ScrollView, Pressable, StyleSheet,
  KeyboardAvoidingView, Platform, Modal, SafeAreaView,
  TouchableWithoutFeedback, Keyboard, TextInput, FlatList,
} from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, withTiming,
  SlideInDown, SlideOutDown,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTheme } from './useTheme';
import { STATUSES, BET_TYPES, formatMoney, makeForm } from './calculations';
import { getBetTypesForSport, getTeamsForSport, CRICKET_PLAYERS, FOOTBALL_PLAYERS, TENNIS_PLAYERS, CHESS_PLAYERS } from './sportsData';

var STEPS = [
  { id: 'event', title: 'Match & Event', emoji: '🎯' },
  { id: 'stake', title: 'Stake & Odds',  emoji: '💰' },
  { id: 'details', title: 'Details',    emoji: '📋' },
  { id: 'notes', title: 'Notes & Tags', emoji: '📝' },
];

// Smart search dropdown
function SearchDropdown({ query, items, onSelect, colors, maxItems }) {
  maxItems = maxItems || 5;
  if (!query || query.length < 1) return null;
  var lower = query.toLowerCase();
  var filtered = items.filter(function(i) {
    return (typeof i === 'string' ? i : i.label).toLowerCase().includes(lower);
  }).slice(0, maxItems);
  if (!filtered.length) return null;

  return (
    <View style={[dd.wrap, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      {filtered.map(function(item, idx) {
        var label = typeof item === 'string' ? item : item.label;
        var desc  = typeof item === 'string' ? null : item.desc;
        return (
          <Pressable key={idx} onPress={() => { onSelect(label); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
            style={({ pressed }) => [dd.item, { borderTopWidth: idx === 0 ? 0 : 0.5, borderTopColor: colors.border, backgroundColor: pressed ? colors.surfaceVariant : 'transparent' }]}>
            <Text style={[dd.itemTxt, { color: colors.textPrimary }]}>{label}</Text>
            {desc && <Text style={[dd.itemDesc, { color: colors.textTertiary }]}>{desc}</Text>}
          </Pressable>
        );
      })}
    </View>
  );
}
var dd = StyleSheet.create({
  wrap:    { position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 999, borderRadius: 12, borderWidth: 0.5, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 12, elevation: 8 },
  item:    { paddingHorizontal: 14, paddingVertical: 11 },
  itemTxt: { fontSize: 14, fontWeight: '600' },
  itemDesc:{ fontSize: 11, marginTop: 2 },
});

// Smart input with dropdown
function SmartInput({ label, value, onChangeText, placeholder, suggestions, colors, keyboardType, multiline, error, hint }) {
  var [focused, setFocused] = useState(false);
  keyboardType = keyboardType || 'default';

  return (
    <View style={{ marginBottom: 14, zIndex: focused ? 100 : 1 }}>
      <Text style={[si.label, { color: focused ? '#E50914' : colors.textSecondary }]}>{label}</Text>
      <View style={[si.inputWrap, { backgroundColor: colors.surfaceVariant, borderColor: error ? '#D93025' : focused ? '#E50914' : colors.border }]}>
        <TextInput
          style={[si.input, { color: colors.textPrimary }, multiline && si.multiline]}
          value={value} onChangeText={onChangeText}
          placeholder={placeholder} placeholderTextColor={colors.textTertiary}
          keyboardType={keyboardType} multiline={multiline}
          numberOfLines={multiline ? 3 : 1}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 150)}
          autoCorrect={false}
        />
      </View>
      {error && <Text style={[si.error, { color: '#D93025' }]}>{error}</Text>}
      {hint && !error && <Text style={[si.hint, { color: colors.textTertiary }]}>{hint}</Text>}
      {focused && suggestions && suggestions.length > 0 && (
        <SearchDropdown query={value} items={suggestions} onSelect={onChangeText} colors={colors} />
      )}
    </View>
  );
}
var si = StyleSheet.create({
  label:     { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 7 },
  inputWrap: { borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, minHeight: 50, justifyContent: 'center' },
  input:     { fontSize: 15, fontWeight: '500', paddingVertical: 12 },
  multiline: { minHeight: 80, textAlignVertical: 'top', paddingTop: 12 },
  error:     { fontSize: 11, marginTop: 4, marginLeft: 2 },
  hint:      { fontSize: 11, marginTop: 4, marginLeft: 2 },
});

// Chip selector
function ChipSelector({ label, options, value, onSelect, colors }) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={[si.label, { color: colors.textSecondary }]}>{label}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={{ flexDirection: 'row', gap: 8, paddingVertical: 4 }}>
          {options.map(function(opt) {
            var optLabel = typeof opt === 'string' ? opt : opt.label;
            var optDesc  = typeof opt === 'string' ? null : opt.desc;
            var active = value === optLabel;
            return (
              <Pressable key={optLabel} onPress={() => { onSelect(optLabel); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                style={[cs.chip, { backgroundColor: active ? '#FFE8E8' : colors.surfaceVariant, borderColor: active ? '#E50914' : colors.border }]}>
                <Text style={[cs.txt, { color: active ? '#E50914' : colors.textSecondary, fontWeight: active ? '700' : '500' }]}>{optLabel}</Text>
                {optDesc && active && <Text style={[cs.desc, { color: '#E50914' }]}>{optDesc}</Text>}
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}
var cs = StyleSheet.create({
  chip: { paddingHorizontal: 13, paddingVertical: 7, borderRadius: 999, borderWidth: 0.5 },
  txt:  { fontSize: 13 },
  desc: { fontSize: 10, marginTop: 2, opacity: 0.8 },
});

export default function AddBetModal({ visible, onClose, onSave, editBet, bookies, sports, templates, suggestStake, currSym }) {
  currSym = currSym || '₹';
  var { colors } = useTheme();
  var [step,     setStep]     = useState(0);
  var [form,     setForm]     = useState(makeForm(bookies, sports));
  var [errors,   setErrors]   = useState({});
  var [tagInput, setTagInput] = useState('');

  var progress = useSharedValue(0);

  useEffect(function() {
    if (visible) {
      setForm(editBet ? Object.assign({ tags: [], betType: 'Single' }, editBet) : makeForm(bookies, sports));
      setStep(0); setErrors({}); setTagInput('');
    }
  }, [visible, editBet]);

  useEffect(function() {
    progress.value = withSpring(step / (STEPS.length - 1), { damping: 20 });
  }, [step]);

  var progressStyle = useAnimatedStyle(function() {
    return { width: (progress.value * 100) + '%' };
  });

  function sf(key) {
    return function(val) {
      setForm(function(f) { return Object.assign({}, f, { [key]: val }); });
      if (errors[key]) setErrors(function(e) { return Object.assign({}, e, { [key]: null }); });
    };
  }

  function validateStep() {
    var e = {};
    if (step === 0 && !form.event.trim()) e.event = 'Required';
    if (step === 0 && !form.bet.trim())   e.bet   = 'Required';
    if (step === 1 && (!form.odds  || isNaN(form.odds)  || parseFloat(form.odds)  <= 1)) e.odds  = 'Enter valid odds (>1)';
    if (step === 1 && (!form.stake || isNaN(form.stake) || parseFloat(form.stake) <= 0)) e.stake = 'Enter valid amount';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function nextStep() {
    if (!validateStep()) { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error); return; }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (step < STEPS.length - 1) setStep(function(s) { return s + 1; });
    else handleSave();
  }

  function handleSave() {
    if (!validateStep()) return;
    onSave(form);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onClose();
  }

  function addTag() {
    var tag = tagInput.trim();
    if (tag && !(form.tags || []).includes(tag)) {
      sf('tags')([].concat(form.tags || [], [tag]));
      setTagInput('');
    }
  }

  // Smart suggestions based on selected sport
  var teamSuggestions = useMemo(function() { return getTeamsForSport(form.sport); }, [form.sport]);
  var betTypeSuggestions = useMemo(function() { return getBetTypesForSport(form.sport); }, [form.sport]);

  var potentialWin = form.stake && form.odds && parseFloat(form.odds) > 1
    ? parseFloat(form.stake) * (parseFloat(form.odds) - 1) : null;

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={m.overlay}>
          <Pressable style={m.backdrop} onPress={onClose} />
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={m.sheetWrap}>
            <Animated.View entering={SlideInDown.springify().damping(28)} exiting={SlideOutDown.duration(200)}
              style={[m.sheet, { backgroundColor: colors.surface }]}>
              <SafeAreaView>
                <View style={[m.handle, { backgroundColor: colors.border }]} />

                {/* Header */}
                <View style={m.header}>
                  <View style={[m.stepIcon, { backgroundColor: '#FFE8E8' }]}>
                    <Text style={{ fontSize: 18 }}>{STEPS[step].emoji}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[m.stepMeta, { color: colors.textTertiary }]}>Step {step + 1} of {STEPS.length}</Text>
                    <Text style={[m.title, { color: colors.textPrimary }]}>{editBet ? 'Edit Bet' : STEPS[step].title}</Text>
                  </View>
                  <Pressable onPress={onClose} style={[m.closeBtn, { backgroundColor: colors.surfaceVariant }]}>
                    <Text style={{ color: colors.textTertiary, fontSize: 16, fontWeight: '600' }}>✕</Text>
                  </Pressable>
                </View>

                {/* Progress */}
                <View style={[m.progTrack, { backgroundColor: colors.border }]}>
                  <Animated.View style={[m.progFill, progressStyle]} />
                </View>
                <View style={m.stepDots}>
                  {STEPS.map(function(_, i) {
                    return <View key={i} style={[m.dot, { backgroundColor: i <= step ? '#E50914' : colors.border, width: i === step ? 20 : 6 }]} />;
                  })}
                </View>

                {/* Templates */}
                {step === 0 && templates && templates.length > 0 && !editBet && (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
                    <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: 20 }}>
                      {templates.map(function(tp) {
                        return (
                          <Pressable key={tp.id} onPress={() => setForm(Object.assign(makeForm(bookies, sports), tp, { id: null, date: new Date().toISOString().slice(0, 10) }))}
                            style={[m.tplChip, { backgroundColor: '#FFE8E8', borderColor: 'rgba(229,9,20,0.25)' }]}>
                            <Text style={{ color: '#E50914', fontSize: 12, fontWeight: '700' }} numberOfLines={1}>{tp.event || 'Template'}</Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  </ScrollView>
                )}

                <ScrollView style={m.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

                  {/* ── STEP 0: Match & Event ── */}
                  {step === 0 && (
                    <View>
                      {/* Sport selector first */}
                      <ChipSelector label="Sport" options={sports || []} value={form.sport} onSelect={sf('sport')} colors={colors} />

                      {/* Bookie */}
                      <ChipSelector label="Bookie" options={bookies || []} value={form.bookie} onSelect={sf('bookie')} colors={colors} />

                      {/* Event with team autocomplete */}
                      <View style={{ zIndex: 20 }}>
                        <SmartInput
                          label="Event / Match"
                          value={form.event} onChangeText={sf('event')}
                          placeholder={teamSuggestions.length > 0 ? 'e.g. ' + teamSuggestions[0] + ' vs ' + teamSuggestions[1] : 'e.g. India vs Australia'}
                          suggestions={teamSuggestions}
                          colors={colors} error={errors.event}
                        />
                      </View>

                      {/* Bet with sport-specific bet type suggestions */}
                      <View style={{ zIndex: 10 }}>
                        <SmartInput
                          label="Your Bet"
                          value={form.bet} onChangeText={sf('bet')}
                          placeholder={betTypeSuggestions.length > 0 ? betTypeSuggestions[0].label : 'e.g. India to win'}
                          suggestions={betTypeSuggestions}
                          colors={colors} error={errors.bet}
                        />
                      </View>

                      {/* Show bet type chips if sport matched */}
                      {betTypeSuggestions.length > 0 && (
                        <View style={{ marginBottom: 14 }}>
                          <Text style={[si.label, { color: colors.textSecondary }]}>COMMON BET TYPES FOR {(form.sport || '').toUpperCase()}</Text>
                          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            <View style={{ flexDirection: 'row', gap: 8, paddingVertical: 4 }}>
                              {betTypeSuggestions.slice(0, 6).map(function(bt) {
                                return (
                                  <Pressable key={bt.label} onPress={() => sf('bet')(bt.label)}
                                    style={[cs.chip, { backgroundColor: form.bet === bt.label ? '#FFE8E8' : colors.surfaceVariant, borderColor: form.bet === bt.label ? '#E50914' : colors.border }]}>
                                    <Text style={[cs.txt, { color: form.bet === bt.label ? '#E50914' : colors.textSecondary }]}>{bt.label}</Text>
                                  </Pressable>
                                );
                              })}
                            </View>
                          </ScrollView>
                        </View>
                      )}
                    </View>
                  )}

                  {/* ── STEP 1: Stake & Odds ── */}
                  {step === 1 && (
                    <View>
                      <SmartInput
                        label={'Stake (' + currSym + ')'}
                        value={form.stake} onChangeText={sf('stake')}
                        keyboardType="decimal-pad" placeholder="e.g. 500"
                        colors={colors} error={errors.stake}
                        hint={suggestStake ? '💡 Suggested: ' + formatMoney(suggestStake, currSym) + ' (2% bankroll)' : null}
                      />
                      <SmartInput
                        label="Odds"
                        value={form.odds} onChangeText={sf('odds')}
                        keyboardType="decimal-pad" placeholder="e.g. 1.85"
                        colors={colors} error={errors.odds}
                      />
                      {potentialWin !== null && (
                        <View style={[m.potCard, { backgroundColor: '#E8F8EE', borderColor: '#A7DFB9' }]}>
                          <Text style={m.potLabel}>POTENTIAL WIN</Text>
                          <Text style={m.potAmount}>+{formatMoney(potentialWin, currSym)}</Text>
                          <Text style={m.potReturn}>Returns {formatMoney(potentialWin + parseFloat(form.stake), currSym)}</Text>
                        </View>
                      )}
                    </View>
                  )}

                  {/* ── STEP 2: Details ── */}
                  {step === 2 && (
                    <View>
                      <ChipSelector label="Bet Type" options={BET_TYPES} value={form.betType || 'Single'} onSelect={sf('betType')} colors={colors} />
                      <ChipSelector label="Status"   options={STATUSES}   value={form.status}              onSelect={sf('status')}  colors={colors} />
                      <SmartInput label="Date"       value={form.date}      onChangeText={sf('date')}      placeholder="YYYY-MM-DD" colors={colors} />
                      <SmartInput label="Match Time" value={form.matchTime || ''} onChangeText={sf('matchTime')} placeholder="HH:MM (optional)" colors={colors} />
                    </View>
                  )}

                  {/* ── STEP 3: Notes & Tags ── */}
                  {step === 3 && (
                    <View>
                      <SmartInput
                        label="Notes / Analysis"
                        value={form.notes} onChangeText={sf('notes')}
                        placeholder="Tipster source, reasoning..." multiline colors={colors}
                      />
                      <View>
                        <Text style={[si.label, { color: colors.textSecondary }]}>TAGS</Text>
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginBottom: 10 }}>
                          {(form.tags || []).map(function(tag) {
                            return (
                              <Pressable key={tag} onPress={() => sf('tags')((form.tags||[]).filter(function(x) { return x !== tag; }))}
                                style={[cs.chip, { backgroundColor: '#FFE8E8', borderColor: 'rgba(229,9,20,0.25)' }]}>
                                <Text style={[cs.txt, { color: '#E50914' }]}>#{tag} ×</Text>
                              </Pressable>
                            );
                          })}
                        </View>
                        <View style={{ flexDirection: 'row', gap: 8 }}>
                          <View style={{ flex: 1 }}>
                            <SmartInput
                              label="Add Tag" value={tagInput} onChangeText={setTagInput}
                              placeholder="e.g. iplbet" colors={colors}
                            />
                          </View>
                          <Pressable onPress={addTag} style={[m.addTagBtn, { backgroundColor: '#E50914' }]}>
                            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>＋</Text>
                          </Pressable>
                        </View>
                      </View>
                    </View>
                  )}

                  <View style={{ height: 24 }} />
                </ScrollView>

                {/* Footer */}
                <View style={[m.footer, { borderTopColor: colors.border }]}>
                  {step > 0 && (
                    <Pressable onPress={() => setStep(function(s) { return s - 1; })}
                      style={[m.backBtn, { borderColor: colors.border, backgroundColor: colors.surfaceVariant }]}>
                      <Text style={{ color: colors.textSecondary, fontSize: 14, fontWeight: '600' }}>← Back</Text>
                    </Pressable>
                  )}
                  <Pressable onPress={nextStep} style={[m.nextBtn, { flex: 1 }]}>
                    <Text style={m.nextTxt}>
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

var m = StyleSheet.create({
  overlay:   { flex: 1, justifyContent: 'flex-end' },
  backdrop:  { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.55)' },
  sheetWrap: { maxHeight: '94%' },
  sheet:     { borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: '100%' },
  handle:    { width: 36, height: 4, borderRadius: 2, alignSelf: 'center', marginTop: 10, marginBottom: 6 },
  header:    { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12, gap: 12 },
  stepIcon:  { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  stepMeta:  { fontSize: 10, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 2 },
  title:     { fontSize: 17, fontWeight: '700' },
  closeBtn:  { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  progTrack: { height: 2, marginHorizontal: 20, borderRadius: 2, overflow: 'hidden', marginBottom: 8 },
  progFill:  { height: '100%', borderRadius: 2, backgroundColor: '#E50914' },
  stepDots:  { flexDirection: 'row', gap: 5, paddingHorizontal: 20, marginBottom: 12 },
  dot:       { height: 6, borderRadius: 3, backgroundColor: '#E50914' },
  tplChip:   { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999, borderWidth: 0.5 },
  content:   { paddingHorizontal: 20 },
  potCard:   { borderRadius: 14, padding: 16, alignItems: 'center', borderWidth: 0.5, marginBottom: 14 },
  potLabel:  { fontSize: 10, fontWeight: '700', color: '#1A9E4A', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 },
  potAmount: { fontSize: 30, fontWeight: '800', color: '#1A9E4A', letterSpacing: -1, marginBottom: 2 },
  potReturn: { fontSize: 12, color: '#1A9E4A', opacity: 0.7 },
  addTagBtn: { width: 50, height: 50, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginTop: 23 },
  footer:    { flexDirection: 'row', gap: 10, padding: 20, borderTopWidth: 0.5 },
  backBtn:   { borderWidth: 0.5, borderRadius: 999, paddingVertical: 14, paddingHorizontal: 20, alignItems: 'center', justifyContent: 'center' },
  nextBtn:   { backgroundColor: '#E50914', borderRadius: 999, paddingVertical: 14, alignItems: 'center', justifyContent: 'center', shadowColor: '#E50914', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 6 },
  nextTxt:   { color: '#fff', fontSize: 15, fontWeight: '800', letterSpacing: 0.3 },
});
