// AddBetModal.js — Material 3 Expressive · Pixel flagship
// Tonal bottom sheet · Spring step indicator · M3 chips · Zero blur

import React, { useState, useEffect, useMemo } from 'react';
import {
  View, Text, ScrollView, Pressable, StyleSheet,
  KeyboardAvoidingView, Platform, Modal,
  TouchableWithoutFeedback, Keyboard, TextInput,
  SafeAreaView,
} from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring,
  SlideInDown, SlideOutDown, withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTheme } from './useTheme';
import { STATUSES, BET_TYPES, formatMoney, makeForm } from './calculations';
import {
  getMatchesForSport, getBetTypesForSport,
  getPlayersForSport, getTeamsForSport, autoTagBet,
} from './sportsData';

// ─── CONSTANTS ───────────────────────────────────────────────────
const PRIMARY = '#FF4B6A';

const STEPS = [
  { id: 'event',   title: 'Match & Bet',  emoji: '🎯' },
  { id: 'stake',   title: 'Stake & Odds', emoji: '💰' },
  { id: 'details', title: 'Details',      emoji: '📋' },
  { id: 'notes',   title: 'Notes & Tags', emoji: '📝' },
];

// ─── DROPDOWN ────────────────────────────────────────────────────
function Dropdown({ query, items, onSelect, colors, isDark }) {
  if (!query || query.length < 1) return null;
  const q    = query.toLowerCase();
  const hits = items.filter(i => {
    const l = typeof i === 'string' ? i : i.label;
    return l.toLowerCase().includes(q);
  }).slice(0, 6);
  if (!hits.length) return null;

  return (
    <View style={[dd.wrap, {
      backgroundColor: isDark ? colors.surfaceElevated || colors.surfaceVariant : '#FFFFFF',
      borderColor:     colors.border,
      shadowColor:     '#000',
      shadowOffset:    { width: 0, height: 6 },
      shadowOpacity:   0.14,
      shadowRadius:    14,
      elevation:       10,
    }]}>
      {hits.map((item, idx) => {
        const label = typeof item === 'string' ? item : item.label;
        const desc  = typeof item === 'object'  ? item.desc  : null;
        return (
          <Pressable
            key={idx}
            onPress={() => onSelect(label)}
            style={({ pressed }) => [
              dd.row,
              {
                borderTopWidth: idx > 0 ? 0.5 : 0,
                borderTopColor: colors.border,
                backgroundColor: pressed ? colors.surfaceVariant : 'transparent',
              },
            ]}
          >
            <Text style={[dd.lbl, { color: colors.textPrimary }]}>{label}</Text>
            {desc && <Text style={[dd.desc, { color: colors.textTertiary }]}>{desc}</Text>}
          </Pressable>
        );
      })}
    </View>
  );
}
const dd = StyleSheet.create({
  wrap: { position: 'absolute', top: '100%', left: 0, right: 0,
          zIndex: 999, borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  row:  { paddingHorizontal: 14, paddingVertical: 11 },
  lbl:  { fontSize: 14, fontWeight: '600' },
  desc: { fontSize: 11, marginTop: 2 },
});

// ─── FIELD ───────────────────────────────────────────────────────
function Field({ label, value, onChange, placeholder, suggestions,
  colors, isDark, keyboardType, multiline, error, hint, zIndex }) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={{ marginBottom: 14, zIndex: zIndex || 1 }}>
      <Text style={[fi.lbl, {
        color: error ? '#FF4444' : focused ? PRIMARY : colors.textTertiary,
      }]}>{label}</Text>
      <View style={[fi.wrap, {
        backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
        borderColor:     error ? '#FF4444' : focused ? PRIMARY : colors.border,
        borderWidth:     focused || error ? 1.5 : 1,
        shadowColor:     focused ? PRIMARY : 'transparent',
        shadowOpacity:   focused ? 0.14 : 0,
        shadowRadius:    6,
        shadowOffset:    { width: 0, height: 0 },
      }]}>
        <TextInput
          style={[fi.input, { color: colors.textPrimary }, multiline && fi.multi]}
          value={value}
          onChangeText={onChange}
          placeholder={placeholder}
          placeholderTextColor={colors.textTertiary}
          keyboardType={keyboardType || 'default'}
          multiline={multiline}
          numberOfLines={multiline ? 3 : 1}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 180)}
          autoCorrect={false}
        />
      </View>
      {error && <Text style={[fi.sub, { color: '#FF4444' }]}>{error}</Text>}
      {hint && !error && <Text style={[fi.sub, { color: colors.textTertiary }]}>{hint}</Text>}
      {focused && suggestions && (
        <Dropdown query={value} items={suggestions} onSelect={onChange} colors={colors} isDark={isDark} />
      )}
    </View>
  );
}
const fi = StyleSheet.create({
  lbl:   { fontSize: 10, fontWeight: '700', textTransform: 'uppercase',
           letterSpacing: 1.1, marginBottom: 8 },
  wrap:  { borderRadius: 14, borderWidth: 1, paddingHorizontal: 14,
           minHeight: 50, justifyContent: 'center' },
  input: { fontSize: 15, fontWeight: '500', paddingVertical: 12 },
  multi: { minHeight: 80, textAlignVertical: 'top', paddingTop: 12 },
  sub:   { fontSize: 11, marginTop: 5, marginLeft: 2 },
});

// ─── CHIPS ───────────────────────────────────────────────────────
function Chips({ label, options, value, onSelect, colors }) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={[fi.lbl, { color: colors.textTertiary }]}>{label}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={{ flexDirection: 'row', gap: 8, paddingVertical: 4 }}>
          {options.map(opt => {
            const v      = typeof opt === 'string' ? opt : opt.label;
            const active = value === v;
            return (
              <Pressable
                key={v}
                onPress={() => {
                  onSelect(v);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
                style={[ch.chip, {
                  backgroundColor: active ? 'rgba(255,75,106,0.1)' : colors.surfaceVariant,
                  borderColor:     active ? 'rgba(255,75,106,0.3)' : colors.border,
                  transform:       [{ scale: active ? 1.03 : 1 }],
                }]}
              >
                <Text style={[ch.txt, {
                  color:      active ? PRIMARY : colors.textSecondary,
                  fontWeight: active ? '800' : '500',
                }]}>{v}</Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}
const ch = StyleSheet.create({
  chip: { paddingHorizontal: 14, paddingVertical: 8,
          borderRadius: 999, borderWidth: 1 },
  txt:  { fontSize: 13 },
});

// ─── MATCH PICKER ────────────────────────────────────────────────
function MatchPicker({ matches, onSelect, colors, isDark }) {
  if (!matches.length) return null;
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={[fi.lbl, { color: colors.textTertiary }]}>Popular Matches</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={{ flexDirection: 'row', gap: 10, paddingVertical: 4 }}>
          {matches.slice(0, 8).map(m => (
            <Pressable
              key={m.label}
              onPress={() => {
                onSelect(m.label);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
              style={[mc.card, {
                backgroundColor: isDark ? colors.surfaceVariant : '#FFFFFF',
                borderColor:     colors.border,
              }]}
            >
              <Text style={[mc.lbl, { color: colors.textPrimary }]}>{m.label}</Text>
              <Text style={[mc.desc, { color: colors.textTertiary }]}>{m.desc}</Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
const mc = StyleSheet.create({
  card: { paddingHorizontal: 14, paddingVertical: 10,
          borderRadius: 16, borderWidth: 1, minWidth: 140,
          shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  lbl:  { fontSize: 13, fontWeight: '700', marginBottom: 3 },
  desc: { fontSize: 10 },
});

// ─── STEP PROGRESS ───────────────────────────────────────────────
function StepProgress({ step, total, colors }) {
  return (
    <View style={{ paddingHorizontal: 20, marginBottom: 14 }}>
      {/* Bar */}
      <View style={[sp.track, { backgroundColor: colors.border }]}>
        <Animated.View style={[sp.fill, {
          width: `${((step + 1) / total) * 100}%`,
          backgroundColor: PRIMARY,
        }]} />
      </View>
      {/* Dots */}
      <View style={sp.dots}>
        {STEPS.map((s, i) => {
          const done   = i < step;
          const active = i === step;
          return (
            <View key={i} style={[sp.dot, {
              width:           active ? 22 : 7,
              height:          7,
              backgroundColor: active || done ? PRIMARY : colors.border,
              shadowColor:     active ? PRIMARY : 'transparent',
              shadowOpacity:   active ? 0.4 : 0,
              shadowRadius:    4,
            }]} />
          );
        })}
      </View>
    </View>
  );
}
const sp = StyleSheet.create({
  track: { height: 2.5, borderRadius: 2, overflow: 'hidden', marginBottom: 10 },
  fill:  { height: '100%', borderRadius: 2 },
  dots:  { flexDirection: 'row', gap: 6, alignItems: 'center' },
  dot:   { borderRadius: 4 },
});

// ─── POTENTIAL WIN CARD ──────────────────────────────────────────
function PotCard({ stake, odds, currSym }) {
  const win  = parseFloat(stake) * (parseFloat(odds) - 1);
  const ret  = parseFloat(stake) * parseFloat(odds);
  return (
    <View style={[pw.card, {
      backgroundColor: 'rgba(0,191,111,0.08)',
      borderColor:     'rgba(0,191,111,0.22)',
    }]}>
      <Text style={pw.eyebrow}>Potential Win</Text>
      <Text style={pw.amount}>+{formatMoney(win, currSym)}</Text>
      <Text style={pw.returns}>Returns {formatMoney(ret, currSym)}</Text>
    </View>
  );
}
const pw = StyleSheet.create({
  card:    { borderRadius: 18, padding: 16, alignItems: 'center',
             borderWidth: 1, marginBottom: 14 },
  eyebrow: { fontSize: 9, fontWeight: '800', color: '#00BF6F',
             textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 6 },
  amount:  { fontSize: 32, fontWeight: '900', color: '#00BF6F',
             letterSpacing: -1, marginBottom: 3 },
  returns: { fontSize: 12, color: '#00BF6F', opacity: 0.7 },
});

// ─── MAIN MODAL ──────────────────────────────────────────────────
export default function AddBetModal({
  visible, onClose, onSave, editBet,
  bookies, sports, templates, suggestStake, currSym,
}) {
  currSym = currSym || '₹';
  const { colors, isDark } = useTheme();
  const [step,     setStep]     = useState(0);
  const [form,     setForm]     = useState(makeForm(bookies, sports));
  const [errors,   setErrors]   = useState({});
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    if (visible) {
      setForm(editBet
        ? { tags: [], betType: 'Single', ...editBet }
        : makeForm(bookies, sports));
      setStep(0);
      setErrors({});
      setTagInput('');
    }
  }, [visible, editBet]);

  const sf = key => val => {
    setForm(prev => ({ ...prev, [key]: val }));
    if (errors[key]) setErrors(e => ({ ...e, [key]: null }));
  };

  const selectBetType = val => {
    sf('bet')(val);
    const tags = autoTagBet(val);
    if (tags.length) {
      setForm(prev => {
        const existing = prev.tags || [];
        return {
          ...prev,
          bet:  val,
          tags: [...existing, ...tags.filter(t => !existing.includes(t))],
        };
      });
    }
  };

  const matchSuggestions   = useMemo(() => getMatchesForSport(form.sport),   [form.sport]);
  const betTypeSuggestions = useMemo(() => getBetTypesForSport(form.sport), [form.sport]);
  const playerSuggestions  = useMemo(() => getPlayersForSport(form.sport),  [form.sport]);
  const teamSuggestions    = useMemo(() => getTeamsForSport(form.sport),    [form.sport]);

  const showPlayerField = form.bet && (
    form.bet.toLowerCase().includes('player')    ||
    form.bet.toLowerCase().includes('batsman')   ||
    form.bet.toLowerCase().includes('bowler')    ||
    form.bet.toLowerCase().includes('scorer')    ||
    form.bet.toLowerCase().includes('goalscorer')||
    form.bet.toLowerCase().includes('man of')
  );

  const hasPotential = form.stake && form.odds &&
    parseFloat(form.odds) > 1 &&
    !isNaN(form.stake) && parseFloat(form.stake) > 0;

  function validate() {
    const e = {};
    if (step === 0 && !form.event.trim()) e.event = 'Required';
    if (step === 0 && !form.bet.trim())   e.bet   = 'Required';
    if (step === 1 && (!form.odds  || isNaN(form.odds)  || parseFloat(form.odds)  <= 1)) e.odds  = 'Enter valid odds (> 1)';
    if (step === 1 && (!form.stake || isNaN(form.stake) || parseFloat(form.stake) <= 0)) e.stake = 'Enter valid amount';
    setErrors(e);
    return !Object.keys(e).length;
  }

  function next() {
    if (!validate()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (step < STEPS.length - 1) setStep(s => s + 1);
    else {
      onSave(form);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onClose();
    }
  }

  function addTag() {
    const tag = tagInput.trim();
    if (tag && !(form.tags || []).includes(tag)) {
      sf('tags')([...(form.tags || []), tag]);
      setTagInput('');
    }
  }

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={m.overlay}>

          {/* Scrim */}
          <Pressable style={m.backdrop} onPress={onClose} />

          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={m.kav}
          >
            <Animated.View
              entering={SlideInDown.springify().damping(28).stiffness(300)}
              exiting={SlideOutDown.duration(220)}
              style={[m.sheet, {
                backgroundColor: isDark ? colors.surfaceVariant : '#FFFFFF',
                borderTopColor:  colors.border,
              }]}
            >
              <SafeAreaView>

                {/* Drag handle */}
                <View style={[m.handle, { backgroundColor: colors.border }]} />

                {/* ── Header ── */}
                <View style={m.header}>
                  <View style={[m.stepIcon, { backgroundColor: 'rgba(255,75,106,0.1)' }]}>
                    <Text style={{ fontSize: 20 }}>{STEPS[step].emoji}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[m.meta, { color: colors.textTertiary }]}>
                      Step {step + 1} of {STEPS.length}
                    </Text>
                    <Text style={[m.title, { color: colors.textPrimary }]}>
                      {editBet ? 'Edit Bet' : STEPS[step].title}
                    </Text>
                  </View>
                  <Pressable
                    onPress={onClose}
                    style={[m.closeBtn, { backgroundColor: colors.surfaceContainer || colors.surface }]}
                  >
                    <Text style={{ color: colors.textTertiary, fontSize: 16, fontWeight: '600' }}>✕</Text>
                  </Pressable>
                </View>

                {/* ── Step progress ── */}
                <StepProgress step={step} total={STEPS.length} colors={colors} />

                {/* ── Templates ── */}
                {step === 0 && templates && templates.length > 0 && !editBet && (
                  <ScrollView
                    horizontal showsHorizontalScrollIndicator={false}
                    style={{ marginBottom: 10 }}
                  >
                    <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: 20 }}>
                      {templates.map(tp => (
                        <Pressable
                          key={tp.id}
                          onPress={() => setForm({
                            ...makeForm(bookies, sports),
                            ...tp,
                            id: null,
                            date: new Date().toISOString().slice(0, 10),
                          })}
                          style={[m.tpl, {
                            backgroundColor: 'rgba(255,75,106,0.09)',
                            borderColor:     'rgba(255,75,106,0.22)',
                          }]}
                        >
                          <Text style={{ color: PRIMARY, fontSize: 12, fontWeight: '700' }} numberOfLines={1}>
                            📌 {tp.event || 'Template'}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  </ScrollView>
                )}

                {/* ── Form content ── */}
                <ScrollView
                  style={m.scroll}
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                >

                  {/* STEP 0 — Match & Bet */}
                  {step === 0 && (
                    <View>
                      <Chips label="Sport"  options={sports  || []} value={form.sport}  onSelect={sf('sport')}  colors={colors} />
                      <Chips label="Bookie" options={bookies || []} value={form.bookie} onSelect={sf('bookie')} colors={colors} />
                      <MatchPicker matches={matchSuggestions} onSelect={sf('event')} colors={colors} isDark={isDark} />
                      <View style={{ zIndex: 30 }}>
                        <Field
                          label="Event / Match" value={form.event} onChange={sf('event')}
                          placeholder={matchSuggestions.length > 0 ? matchSuggestions[0].label : 'e.g. India vs Australia'}
                          suggestions={teamSuggestions}
                          colors={colors} isDark={isDark}
                          error={errors.event} zIndex={30}
                        />
                      </View>
                      {betTypeSuggestions.length > 0 && (
                        <View style={{ marginBottom: 14 }}>
                          <Text style={[fi.lbl, { color: colors.textTertiary }]}>Common Bet Types</Text>
                          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            <View style={{ flexDirection: 'row', gap: 8, paddingVertical: 4 }}>
                              {betTypeSuggestions.slice(0, 8).map(bt => {
                                const active = form.bet === bt.label;
                                return (
                                  <Pressable
                                    key={bt.label}
                                    onPress={() => selectBetType(bt.label)}
                                    style={[ch.chip, {
                                      backgroundColor: active ? 'rgba(255,75,106,0.1)' : colors.surfaceVariant,
                                      borderColor:     active ? 'rgba(255,75,106,0.3)' : colors.border,
                                    }]}
                                  >
                                    <Text style={[ch.txt, {
                                      color:      active ? PRIMARY : colors.textSecondary,
                                      fontWeight: active ? '800' : '500',
                                    }]}>{bt.label}</Text>
                                  </Pressable>
                                );
                              })}
                            </View>
                          </ScrollView>
                        </View>
                      )}
                      <View style={{ zIndex: 20 }}>
                        <Field
                          label="Your Bet" value={form.bet} onChange={selectBetType}
                          placeholder="e.g. Match Winner or type custom"
                          suggestions={betTypeSuggestions}
                          colors={colors} isDark={isDark}
                          error={errors.bet} zIndex={20}
                        />
                      </View>
                      {showPlayerField && (
                        <View style={{ zIndex: 10 }}>
                          <Field
                            label="Select Player" value={form.player || ''} onChange={sf('player')}
                            placeholder="Search player name..."
                            suggestions={playerSuggestions}
                            colors={colors} isDark={isDark} zIndex={10}
                          />
                        </View>
                      )}
                    </View>
                  )}

                  {/* STEP 1 — Stake & Odds */}
                  {step === 1 && (
                    <View>
                      <Field
                        label={`Stake (${currSym})`} value={form.stake} onChange={sf('stake')}
                        keyboardType="decimal-pad" placeholder="e.g. 500"
                        colors={colors} isDark={isDark} error={errors.stake}
                        hint={suggestStake
                          ? `💡 Suggested: ${formatMoney(suggestStake, currSym)} (2% bankroll)`
                          : null}
                      />
                      <Field
                        label="Odds" value={form.odds} onChange={sf('odds')}
                        keyboardType="decimal-pad" placeholder="e.g. 1.85"
                        colors={colors} isDark={isDark} error={errors.odds}
                      />
                      {hasPotential && (
                        <PotCard stake={form.stake} odds={form.odds} currSym={currSym} />
                      )}
                    </View>
                  )}

                  {/* STEP 2 — Details */}
                  {step === 2 && (
                    <View>
                      <Chips label="Bet Type" options={BET_TYPES} value={form.betType || 'Single'} onSelect={sf('betType')} colors={colors} />
                      <Chips label="Status"   options={STATUSES}   value={form.status}              onSelect={sf('status')}  colors={colors} />
                      <Field label="Date"       value={form.date}          onChange={sf('date')}       placeholder="YYYY-MM-DD" colors={colors} isDark={isDark} />
                      <Field label="Match Time" value={form.matchTime || ''} onChange={sf('matchTime')} placeholder="HH:MM (optional)" colors={colors} isDark={isDark} />
                    </View>
                  )}

                  {/* STEP 3 — Notes & Tags */}
                  {step === 3 && (
                    <View>
                      <Field
                        label="Notes / Analysis" value={form.notes} onChange={sf('notes')}
                        placeholder="Tipster source, strategy, reasoning..."
                        multiline colors={colors} isDark={isDark}
                      />
                      {(form.tags || []).length > 0 && (
                        <View style={[m.autoTagHint, {
                          backgroundColor: 'rgba(255,75,106,0.07)',
                          borderColor:     'rgba(255,75,106,0.18)',
                        }]}>
                          <Text style={{ color: PRIMARY, fontSize: 11, fontWeight: '700' }}>
                            ⚡ Auto-tagged from bet type
                          </Text>
                        </View>
                      )}
                      <View>
                        <Text style={[fi.lbl, { color: colors.textTertiary }]}>Tags</Text>
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginBottom: 12 }}>
                          {(form.tags || []).map(tag => (
                            <Pressable
                              key={tag}
                              onPress={() => sf('tags')((form.tags || []).filter(x => x !== tag))}
                              style={[ch.chip, {
                                backgroundColor: 'rgba(255,75,106,0.09)',
                                borderColor:     'rgba(255,75,106,0.22)',
                              }]}
                            >
                              <Text style={[ch.txt, { color: PRIMARY }]}>#{tag} ×</Text>
                            </Pressable>
                          ))}
                        </View>
                        <View style={{ flexDirection: 'row', gap: 10 }}>
                          <View style={{ flex: 1 }}>
                            <Field
                              label="Add Tag" value={tagInput} onChange={setTagInput}
                              placeholder="e.g. iplbet" colors={colors} isDark={isDark}
                            />
                          </View>
                          <Pressable onPress={addTag} style={m.addTagBtn}>
                            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 20 }}>＋</Text>
                          </Pressable>
                        </View>
                      </View>
                    </View>
                  )}

                  <View style={{ height: 20 }} />
                </ScrollView>

                {/* ── Footer ── */}
                <View style={[m.footer, { borderTopColor: colors.border }]}>
                  {step > 0 && (
                    <Pressable
                      onPress={() => setStep(s => s - 1)}
                      style={[m.backBtn, {
                        borderColor:     colors.border,
                        backgroundColor: isDark
                          ? 'rgba(255,255,255,0.06)'
                          : 'rgba(0,0,0,0.04)',
                      }]}
                    >
                      <Text style={{ color: colors.textSecondary, fontSize: 14, fontWeight: '700' }}>
                        ← Back
                      </Text>
                    </Pressable>
                  )}
                  <Pressable onPress={next} style={m.nextBtn}>
                    <Text style={m.nextTxt}>
                      {step === STEPS.length - 1
                        ? (editBet ? 'Update Bet ✓' : 'Save Bet ✓')
                        : 'Continue →'}
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

// ─── STYLES ──────────────────────────────────────────────────────
const m = StyleSheet.create({
  overlay:  { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.52)' },
  kav:      { maxHeight: '94%' },
  sheet:    { borderTopLeftRadius: 32, borderTopRightRadius: 32,
              maxHeight: '100%', borderTopWidth: 1 },
  handle:   { width: 36, height: 4, borderRadius: 2,
              alignSelf: 'center', marginTop: 10, marginBottom: 6 },
  header:   { flexDirection: 'row', alignItems: 'center',
              paddingHorizontal: 20, paddingVertical: 12, gap: 12 },
  stepIcon: { width: 46, height: 46, borderRadius: 15,
              alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  meta:     { fontSize: 10, fontWeight: '700', textTransform: 'uppercase',
              letterSpacing: 0.8, marginBottom: 2 },
  title:    { fontSize: 18, fontWeight: '800', letterSpacing: -0.3 },
  closeBtn: { width: 36, height: 36, borderRadius: 18,
              alignItems: 'center', justifyContent: 'center' },
  tpl:      { paddingHorizontal: 13, paddingVertical: 8, borderRadius: 999, borderWidth: 1 },
  scroll:   { paddingHorizontal: 20 },
  autoTagHint: { borderRadius: 12, padding: 11, marginBottom: 12, borderWidth: 1 },
  addTagBtn:   {
    width: 50, height: 50, borderRadius: 15,
    backgroundColor: PRIMARY,
    alignItems: 'center', justifyContent: 'center',
    marginTop: 23,
    shadowColor: PRIMARY,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 10,
    elevation: 5,
  },
  footer:  { flexDirection: 'row', gap: 10, padding: 20, borderTopWidth: 0.5 },
  backBtn: { borderWidth: 1, borderRadius: 999,
             paddingVertical: 14, paddingHorizontal: 20,
             alignItems: 'center', justifyContent: 'center' },
  nextBtn: {
    flex: 1, backgroundColor: PRIMARY, borderRadius: 999,
    paddingVertical: 15, alignItems: 'center', justifyContent: 'center',
    shadowColor: PRIMARY, shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.32, shadowRadius: 12, elevation: 7,
  },
  nextTxt: { color: '#fff', fontSize: 15, fontWeight: '800', letterSpacing: 0.2 },
});
