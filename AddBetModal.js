// AddBetModal.js — Match selector, player input, auto-tags, 1-tap templates
import React, { useState, useEffect, useMemo } from 'react';
import {
  View, Text, ScrollView, Pressable, StyleSheet,
  KeyboardAvoidingView, Platform, Modal, SafeAreaView,
  TouchableWithoutFeedback, Keyboard, TextInput,
} from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, SlideInDown, SlideOutDown,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTheme } from './useTheme';
import { STATUSES, BET_TYPES, formatMoney, makeForm } from './calculations';
import {
  getMatchesForSport, getBetTypesForSport, getPlayersForSport,
  getTeamsForSport, autoTagBet,
} from './sportsData';

var STEPS = [
  { id:'event',   title:'Match & Bet',  emoji:'🎯' },
  { id:'stake',   title:'Stake & Odds', emoji:'💰' },
  { id:'details', title:'Details',      emoji:'📋' },
  { id:'notes',   title:'Notes & Tags', emoji:'📝' },
];

// Dropdown suggestions
function Dropdown({ query, items, onSelect, colors }) {
  if (!query || query.length < 1) return null;
  var q = query.toLowerCase();
  var hits = items.filter(function(i) {
    var l = typeof i === 'string' ? i : i.label;
    return l.toLowerCase().includes(q);
  }).slice(0, 6);
  if (!hits.length) return null;
  return (
    <View style={[dr.wrap, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      {hits.map(function(item, idx) {
        var label = typeof item === 'string' ? item : item.label;
        var desc  = typeof item === 'object' ? item.desc : null;
        return (
          <Pressable key={idx} onPress={() => onSelect(label)}
            style={({ pressed }) => [dr.row, { borderTopWidth: idx>0?0.5:0, borderTopColor: colors.border, backgroundColor: pressed?colors.surfaceVariant:'transparent' }]}>
            <Text style={[dr.lbl, { color: colors.textPrimary }]}>{label}</Text>
            {desc && <Text style={[dr.desc, { color: colors.textTertiary }]}>{desc}</Text>}
          </Pressable>
        );
      })}
    </View>
  );
}
var dr = StyleSheet.create({
  wrap:{ position:'absolute', top:'100%', left:0, right:0, zIndex:999, borderRadius:12, borderWidth:0.5, overflow:'hidden', elevation:8, shadowColor:'#000', shadowOffset:{width:0,height:4}, shadowOpacity:0.12, shadowRadius:12 },
  row: { paddingHorizontal:14, paddingVertical:10 },
  lbl: { fontSize:14, fontWeight:'600' },
  desc:{ fontSize:11, marginTop:1 },
});

// Input with live dropdown
function Field({ label, value, onChange, placeholder, suggestions, colors, keyboardType, multiline, error, hint, zIndex }) {
  var [focused, setFocused] = useState(false);
  return (
    <View style={{ marginBottom:14, zIndex: zIndex||1 }}>
      <Text style={[f.lbl, { color: focused?'#E50914':colors.textSecondary }]}>{label}</Text>
      <View style={[f.wrap, { backgroundColor:colors.surfaceVariant, borderColor: error?'#D93025':focused?'#E50914':colors.border }]}>
        <TextInput
          style={[f.input, { color:colors.textPrimary }, multiline&&f.multi]}
          value={value} onChangeText={onChange}
          placeholder={placeholder} placeholderTextColor={colors.textTertiary}
          keyboardType={keyboardType||'default'} multiline={multiline}
          numberOfLines={multiline?3:1}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 180)}
          autoCorrect={false}
        />
      </View>
      {error && <Text style={[f.sub, { color:'#D93025' }]}>{error}</Text>}
      {hint && !error && <Text style={[f.sub, { color:colors.textTertiary }]}>{hint}</Text>}
      {focused && suggestions && <Dropdown query={value} items={suggestions} onSelect={onChange} colors={colors} />}
    </View>
  );
}
var f = StyleSheet.create({
  lbl:  { fontSize:10, fontWeight:'700', textTransform:'uppercase', letterSpacing:0.8, marginBottom:7 },
  wrap: { borderRadius:12, borderWidth:1, paddingHorizontal:14, minHeight:50, justifyContent:'center' },
  input:{ fontSize:15, fontWeight:'500', paddingVertical:12 },
  multi:{ minHeight:80, textAlignVertical:'top', paddingTop:12 },
  sub:  { fontSize:11, marginTop:4, marginLeft:2 },
});

// Horizontal chip selector
function Chips({ label, options, value, onSelect, colors }) {
  return (
    <View style={{ marginBottom:14 }}>
      <Text style={[f.lbl, { color:colors.textSecondary }]}>{label}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={{ flexDirection:'row', gap:8, paddingVertical:4 }}>
          {options.map(function(opt) {
            var v = typeof opt==='string'?opt:opt.label;
            var active = value===v;
            return (
              <Pressable key={v} onPress={() => { onSelect(v); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                style={[ch.chip, { backgroundColor:active?'#FFE8E8':colors.surfaceVariant, borderColor:active?'#E50914':colors.border }]}>
                <Text style={[ch.txt, { color:active?'#E50914':colors.textSecondary, fontWeight:active?'700':'500' }]}>{v}</Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}
var ch = StyleSheet.create({
  chip:{ paddingHorizontal:13, paddingVertical:7, borderRadius:999, borderWidth:0.5 },
  txt: { fontSize:13 },
});

// Match quick-pick cards
function MatchPicker({ matches, onSelect, colors }) {
  if (!matches.length) return null;
  return (
    <View style={{ marginBottom:14 }}>
      <Text style={[f.lbl, { color:colors.textSecondary }]}>POPULAR MATCHES</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={{ flexDirection:'row', gap:10, paddingVertical:4 }}>
          {matches.slice(0,8).map(function(m) {
            return (
              <Pressable key={m.label} onPress={() => { onSelect(m.label); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                style={[mp.card, { backgroundColor:colors.surfaceVariant, borderColor:colors.border }]}>
                <Text style={[mp.lbl, { color:colors.textPrimary }]}>{m.label}</Text>
                <Text style={[mp.desc, { color:colors.textTertiary }]}>{m.desc}</Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}
var mp = StyleSheet.create({
  card:{ paddingHorizontal:14, paddingVertical:10, borderRadius:14, borderWidth:0.5, minWidth:140 },
  lbl: { fontSize:13, fontWeight:'700', marginBottom:2 },
  desc:{ fontSize:10 },
});

export default function AddBetModal({ visible, onClose, onSave, editBet, bookies, sports, templates, suggestStake, currSym }) {
  currSym = currSym||'₹';
  var { colors } = useTheme();
  var [step,     setStep]     = useState(0);
  var [form,     setForm]     = useState(makeForm(bookies, sports));
  var [errors,   setErrors]   = useState({});
  var [tagInput, setTagInput] = useState('');
  var progress = useSharedValue(0);

  useEffect(function() {
    if (visible) {
      setForm(editBet ? Object.assign({tags:[],betType:'Single'}, editBet) : makeForm(bookies, sports));
      setStep(0); setErrors({}); setTagInput('');
    }
  }, [visible, editBet]);

  useEffect(function() {
    progress.value = withSpring(step/(STEPS.length-1), { damping:20 });
  }, [step]);

  var progStyle = useAnimatedStyle(function() { return { width: (progress.value*100)+'%' }; });

  function sf(key) {
    return function(val) {
      setForm(function(prev) { return Object.assign({}, prev, { [key]: val }); });
      if (errors[key]) setErrors(function(e) { return Object.assign({}, e, { [key]:null }); });
    };
  }

  // Auto-fill stake when bet type selected
  function selectBetType(val) {
    sf('bet')(val);
    // Auto-tags
    var tags = autoTagBet(val);
    if (tags.length) {
      setForm(function(prev) {
        var existing = prev.tags||[];
        var merged = existing.concat(tags.filter(function(t) { return !existing.includes(t); }));
        return Object.assign({}, prev, { bet:val, tags:merged });
      });
    }
  }

  // Smart suggestions
  var matchSuggestions   = useMemo(function() { return getMatchesForSport(form.sport); },   [form.sport]);
  var betTypeSuggestions = useMemo(function() { return getBetTypesForSport(form.sport); }, [form.sport]);
  var playerSuggestions  = useMemo(function() { return getPlayersForSport(form.sport); },  [form.sport]);
  var teamSuggestions    = useMemo(function() { return getTeamsForSport(form.sport); },    [form.sport]);

  // Show player field when bet involves a player
  var showPlayerField = form.bet && (
    form.bet.toLowerCase().includes('player') ||
    form.bet.toLowerCase().includes('batsman') ||
    form.bet.toLowerCase().includes('bowler') ||
    form.bet.toLowerCase().includes('scorer') ||
    form.bet.toLowerCase().includes('goalscorer') ||
    form.bet.toLowerCase().includes('man of')
  );

  var potentialWin = form.stake && form.odds && parseFloat(form.odds)>1
    ? parseFloat(form.stake)*(parseFloat(form.odds)-1) : null;

  function validate() {
    var e = {};
    if (step===0 && !form.event.trim()) e.event='Required';
    if (step===0 && !form.bet.trim())   e.bet='Required';
    if (step===1 && (!form.odds||isNaN(form.odds)||parseFloat(form.odds)<=1)) e.odds='Enter valid odds (>1)';
    if (step===1 && (!form.stake||isNaN(form.stake)||parseFloat(form.stake)<=0)) e.stake='Enter valid amount';
    setErrors(e);
    return !Object.keys(e).length;
  }

  function next() {
    if (!validate()) { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error); return; }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (step < STEPS.length-1) setStep(function(s) { return s+1; });
    else { onSave(form); Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); onClose(); }
  }

  function addTag() {
    var tag = tagInput.trim();
    if (tag && !(form.tags||[]).includes(tag)) {
      sf('tags')((form.tags||[]).concat([tag]));
      setTagInput('');
    }
  }

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={m.overlay}>
          <Pressable style={m.backdrop} onPress={onClose} />
          <KeyboardAvoidingView behavior={Platform.OS==='ios'?'padding':'height'} style={m.kav}>
            <Animated.View entering={SlideInDown.springify().damping(28)} exiting={SlideOutDown.duration(200)}
              style={[m.sheet, { backgroundColor:colors.surface }]}>
              <SafeAreaView>
                <View style={[m.handle, { backgroundColor:colors.border }]} />

                {/* Header */}
                <View style={m.header}>
                  <View style={[m.stepIcon, { backgroundColor:'#FFE8E8' }]}>
                    <Text style={{ fontSize:18 }}>{STEPS[step].emoji}</Text>
                  </View>
                  <View style={{ flex:1 }}>
                    <Text style={[m.meta, { color:colors.textTertiary }]}>Step {step+1} of {STEPS.length}</Text>
                    <Text style={[m.title, { color:colors.textPrimary }]}>{editBet?'Edit Bet':STEPS[step].title}</Text>
                  </View>
                  <Pressable onPress={onClose} style={[m.closeBtn, { backgroundColor:colors.surfaceVariant }]}>
                    <Text style={{ color:colors.textTertiary, fontSize:16, fontWeight:'600' }}>✕</Text>
                  </Pressable>
                </View>

                {/* Progress */}
                <View style={[m.progTrack, { backgroundColor:colors.border }]}>
                  <Animated.View style={[m.progFill, progStyle]} />
                </View>
                <View style={m.dots}>
                  {STEPS.map(function(_,i) {
                    return <View key={i} style={[m.dot, { backgroundColor:i<=step?'#E50914':colors.border, width:i===step?20:6 }]} />;
                  })}
                </View>

                {/* Templates */}
                {step===0 && templates&&templates.length>0 && !editBet && (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom:8 }}>
                    <View style={{ flexDirection:'row', gap:8, paddingHorizontal:20 }}>
                      {templates.map(function(tp) {
                        return (
                          <Pressable key={tp.id} onPress={() => setForm(Object.assign(makeForm(bookies,sports),tp,{id:null,date:new Date().toISOString().slice(0,10)}))}
                            style={[m.tpl, { backgroundColor:'#FFE8E8', borderColor:'rgba(229,9,20,0.25)' }]}>
                            <Text style={{ color:'#E50914', fontSize:12, fontWeight:'700' }} numberOfLines={1}>{tp.event||'Template'}</Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  </ScrollView>
                )}

                <ScrollView style={m.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

                  {/* ── STEP 0: Match & Bet ── */}
                  {step===0 && (
                    <View>
                      <Chips label="SPORT"  options={sports||[]}  value={form.sport}  onSelect={sf('sport')}  colors={colors} />
                      <Chips label="BOOKIE" options={bookies||[]} value={form.bookie} onSelect={sf('bookie')} colors={colors} />

                      {/* Match picker cards */}
                      <MatchPicker matches={matchSuggestions} onSelect={sf('event')} colors={colors} />

                      {/* Event field with team autocomplete */}
                      <View style={{ zIndex:30 }}>
                        <Field label="EVENT / MATCH" value={form.event} onChange={sf('event')}
                          placeholder={matchSuggestions.length>0 ? matchSuggestions[0].label : 'e.g. India vs Australia'}
                          suggestions={teamSuggestions.map(function(t) { return t; })}
                          colors={colors} error={errors.event} zIndex={30} />
                      </View>

                      {/* Bet type chips */}
                      {betTypeSuggestions.length>0 && (
                        <View style={{ marginBottom:14 }}>
                          <Text style={[f.lbl, { color:colors.textSecondary }]}>COMMON BET TYPES</Text>
                          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            <View style={{ flexDirection:'row', gap:8, paddingVertical:4 }}>
                              {betTypeSuggestions.slice(0,8).map(function(bt) {
                                var active = form.bet===bt.label;
                                return (
                                  <Pressable key={bt.label} onPress={() => selectBetType(bt.label)}
                                    style={[ch.chip, { backgroundColor:active?'#FFE8E8':colors.surfaceVariant, borderColor:active?'#E50914':colors.border }]}>
                                    <Text style={[ch.txt, { color:active?'#E50914':colors.textSecondary, fontWeight:active?'700':'500' }]}>{bt.label}</Text>
                                  </Pressable>
                                );
                              })}
                            </View>
                          </ScrollView>
                        </View>
                      )}

                      {/* Bet field with autocomplete */}
                      <View style={{ zIndex:20 }}>
                        <Field label="YOUR BET" value={form.bet} onChange={selectBetType}
                          placeholder="e.g. Match Winner or type custom"
                          suggestions={betTypeSuggestions}
                          colors={colors} error={errors.bet} zIndex={20} />
                      </View>

                      {/* Player field — shown when bet involves a player */}
                      {showPlayerField && (
                        <View style={{ zIndex:10 }}>
                          <Field label="SELECT PLAYER" value={form.player||''} onChange={sf('player')}
                            placeholder="Search player name..."
                            suggestions={playerSuggestions}
                            colors={colors} zIndex={10} />
                        </View>
                      )}
                    </View>
                  )}

                  {/* ── STEP 1: Stake & Odds ── */}
                  {step===1 && (
                    <View>
                      <Field label={'STAKE ('+currSym+')'} value={form.stake} onChange={sf('stake')}
                        keyboardType="decimal-pad" placeholder="e.g. 500"
                        colors={colors} error={errors.stake}
                        hint={suggestStake ? '💡 Suggested: '+formatMoney(suggestStake,currSym)+' (2% bankroll)' : null} />
                      <Field label="ODDS" value={form.odds} onChange={sf('odds')}
                        keyboardType="decimal-pad" placeholder="e.g. 1.85"
                        colors={colors} error={errors.odds} />
                      {potentialWin!==null && (
                        <View style={[m.potCard, { backgroundColor:'#E8F8EE', borderColor:'#A7DFB9' }]}>
                          <Text style={m.potLbl}>POTENTIAL WIN</Text>
                          <Text style={m.potAmt}>+{formatMoney(potentialWin,currSym)}</Text>
                          <Text style={m.potRet}>Returns {formatMoney(potentialWin+parseFloat(form.stake),currSym)}</Text>
                        </View>
                      )}
                    </View>
                  )}

                  {/* ── STEP 2: Details ── */}
                  {step===2 && (
                    <View>
                      <Chips label="BET TYPE" options={BET_TYPES} value={form.betType||'Single'} onSelect={sf('betType')} colors={colors} />
                      <Chips label="STATUS"   options={STATUSES}   value={form.status}             onSelect={sf('status')}  colors={colors} />
                      <Field label="DATE"       value={form.date}       onChange={sf('date')}       placeholder="YYYY-MM-DD" colors={colors} />
                      <Field label="MATCH TIME" value={form.matchTime||''} onChange={sf('matchTime')} placeholder="HH:MM (optional)" colors={colors} />
                    </View>
                  )}

                  {/* ── STEP 3: Notes & Tags ── */}
                  {step===3 && (
                    <View>
                      <Field label="NOTES / ANALYSIS" value={form.notes} onChange={sf('notes')}
                        placeholder="Tipster source, strategy, reasoning..." multiline colors={colors} />

                      {/* Auto-tags hint */}
                      {(form.tags||[]).length>0 && (
                        <View style={[m.autoTagHint, { backgroundColor:'rgba(229,9,20,0.06)', borderColor:'rgba(229,9,20,0.15)' }]}>
                          <Text style={{ color:'#E50914', fontSize:11, fontWeight:'600' }}>⚡ Auto-tagged based on your bet type</Text>
                        </View>
                      )}

                      <View>
                        <Text style={[f.lbl, { color:colors.textSecondary }]}>TAGS</Text>
                        <View style={{ flexDirection:'row', flexWrap:'wrap', gap:7, marginBottom:10 }}>
                          {(form.tags||[]).map(function(tag) {
                            return (
                              <Pressable key={tag} onPress={() => sf('tags')((form.tags||[]).filter(function(x) { return x!==tag; }))}
                                style={[ch.chip, { backgroundColor:'#FFE8E8', borderColor:'rgba(229,9,20,0.25)' }]}>
                                <Text style={[ch.txt, { color:'#E50914' }]}>#{tag} ×</Text>
                              </Pressable>
                            );
                          })}
                        </View>
                        <View style={{ flexDirection:'row', gap:8 }}>
                          <View style={{ flex:1 }}>
                            <Field label="ADD TAG" value={tagInput} onChange={setTagInput} placeholder="e.g. iplbet" colors={colors} />
                          </View>
                          <Pressable onPress={addTag} style={[m.addTagBtn, { backgroundColor:'#E50914' }]}>
                            <Text style={{ color:'#fff', fontWeight:'700', fontSize:18 }}>＋</Text>
                          </Pressable>
                        </View>
                      </View>
                    </View>
                  )}

                  <View style={{ height:24 }} />
                </ScrollView>

                {/* Footer */}
                <View style={[m.footer, { borderTopColor:colors.border }]}>
                  {step>0 && (
                    <Pressable onPress={() => setStep(function(s) { return s-1; })}
                      style={[m.backBtn, { borderColor:colors.border, backgroundColor:colors.surfaceVariant }]}>
                      <Text style={{ color:colors.textSecondary, fontSize:14, fontWeight:'600' }}>← Back</Text>
                    </Pressable>
                  )}
                  <Pressable onPress={next} style={[m.nextBtn, { flex:1 }]}>
                    <Text style={m.nextTxt}>
                      {step===STEPS.length-1 ? (editBet?'Update Bet ✓':'Save Bet ✓') : 'Continue →'}
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
  overlay:  { flex:1, justifyContent:'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor:'rgba(0,0,0,0.55)' },
  kav:      { maxHeight:'94%' },
  sheet:    { borderTopLeftRadius:28, borderTopRightRadius:28, maxHeight:'100%' },
  handle:   { width:36, height:4, borderRadius:2, alignSelf:'center', marginTop:10, marginBottom:6 },
  header:   { flexDirection:'row', alignItems:'center', paddingHorizontal:20, paddingVertical:12, gap:12 },
  stepIcon: { width:44, height:44, borderRadius:14, alignItems:'center', justifyContent:'center', flexShrink:0 },
  meta:     { fontSize:10, fontWeight:'600', textTransform:'uppercase', letterSpacing:0.6, marginBottom:2 },
  title:    { fontSize:17, fontWeight:'700' },
  closeBtn: { width:34, height:34, borderRadius:17, alignItems:'center', justifyContent:'center' },
  progTrack:{ height:2, marginHorizontal:20, borderRadius:2, overflow:'hidden', marginBottom:8 },
  progFill: { height:'100%', borderRadius:2, backgroundColor:'#E50914' },
  dots:     { flexDirection:'row', gap:5, paddingHorizontal:20, marginBottom:12 },
  dot:      { height:6, borderRadius:3, backgroundColor:'#E50914' },
  tpl:      { paddingHorizontal:12, paddingVertical:7, borderRadius:999, borderWidth:0.5 },
  scroll:   { paddingHorizontal:20 },
  potCard:  { borderRadius:14, padding:16, alignItems:'center', borderWidth:0.5, marginBottom:14 },
  potLbl:   { fontSize:10, fontWeight:'700', color:'#1A9E4A', letterSpacing:1, textTransform:'uppercase', marginBottom:6 },
  potAmt:   { fontSize:30, fontWeight:'800', color:'#1A9E4A', letterSpacing:-1, marginBottom:2 },
  potRet:   { fontSize:12, color:'#1A9E4A', opacity:0.7 },
  autoTagHint:{ borderRadius:10, padding:10, marginBottom:10, borderWidth:0.5 },
  addTagBtn:{ width:50, height:50, borderRadius:14, alignItems:'center', justifyContent:'center', marginTop:23 },
  footer:   { flexDirection:'row', gap:10, padding:20, borderTopWidth:0.5 },
  backBtn:  { borderWidth:0.5, borderRadius:999, paddingVertical:14, paddingHorizontal:20, alignItems:'center', justifyContent:'center' },
  nextBtn:  { backgroundColor:'#E50914', borderRadius:999, paddingVertical:14, alignItems:'center', justifyContent:'center', shadowColor:'#E50914', shadowOffset:{width:0,height:4}, shadowOpacity:0.3, shadowRadius:10, elevation:6 },
  nextTxt:  { color:'#fff', fontSize:15, fontWeight:'800', letterSpacing:0.3 },
});
