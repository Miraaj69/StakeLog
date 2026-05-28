// SettingsScreen.js — Material 3 Expressive · Pixel flagship
// Tonal grouped sections · Spring toggles · M3 chips · Zero blur

import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Pressable,
  Alert, Share, Switch, TextInput, Modal, FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  FadeInDown, FadeIn,
  useSharedValue, useAnimatedStyle, withSpring, withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTheme } from './useTheme';
import { useStore, useStats } from './store';
import { CURRENCIES } from './calculations';
import { getItem, setItem, KEYS } from './storage';

// ─── COLORS ──────────────────────────────────────────────────────
const C = {
  primary: '#FF4B6A',
  profit:  '#00BF6F',
  loss:    '#FF4444',
  blue:    '#5B8DEF',
};

// ─── M3 TOGGLE ───────────────────────────────────────────────────
// Custom spring-animated toggle — replaces stock Switch
function M3Toggle({ value, onChange, color = C.primary }) {
  const translateX = useSharedValue(value ? 22 : 2);
  const bgOpacity  = useSharedValue(value ? 1 : 0);

  useEffect(() => {
    translateX.value = withSpring(value ? 22 : 2, { damping: 22, stiffness: 380 });
    bgOpacity.value  = withTiming(value ? 1 : 0, { duration: 200 });
  }, [value]);

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const trackStyle = useAnimatedStyle(() => ({
    backgroundColor: `rgba(${value ? '255,75,106' : '150,150,160'},${
      value ? 1 : 0.25
    })`,
  }));

  return (
    <Pressable
      onPress={() => {
        onChange(!value);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }}
      hitSlop={8}
    >
      <Animated.View style={[tog.track, trackStyle]}>
        <Animated.View style={[tog.thumb, thumbStyle]} />
      </Animated.View>
    </Pressable>
  );
}
const tog = StyleSheet.create({
  track: { width: 48, height: 28, borderRadius: 14,
           justifyContent: 'center' },
  thumb: { width: 22, height: 22, borderRadius: 11,
           backgroundColor: '#FFFFFF',
           shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
           shadowOpacity: 0.2, shadowRadius: 3, elevation: 3 },
});

// ─── SETTING ROW ─────────────────────────────────────────────────
function SettingRow({ icon, label, desc, onPress, right, danger, colors, iconBg }) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={animStyle}>
      <Pressable
        onPressIn={() => {
          if (onPress) scale.value = withSpring(0.98, { damping: 22, stiffness: 400 });
        }}
        onPressOut={() => {
          scale.value = withSpring(1, { damping: 22, stiffness: 400 });
        }}
        onPress={onPress}
        style={sr.row}
      >
        <View style={[sr.iconWrap, {
          backgroundColor: iconBg
            || (danger ? 'rgba(255,68,68,0.1)' : 'rgba(255,255,255,0.06)'),
        }]}>
          <Text style={{ fontSize: 17 }}>{icon}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[sr.label, {
            color: danger ? C.loss : colors.textPrimary,
          }]}>{label}</Text>
          {desc ? (
            <Text style={[sr.desc, { color: colors.textTertiary }]}>{desc}</Text>
          ) : null}
        </View>
        {right !== undefined
          ? right
          : onPress
            ? <Text style={{ color: colors.textTertiary, fontSize: 20, fontWeight: '300' }}>›</Text>
            : null}
      </Pressable>
    </Animated.View>
  );
}
const sr = StyleSheet.create({
  row:     { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14 },
  iconWrap:{ width: 38, height: 38, borderRadius: 12,
             alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  label:   { fontSize: 15, fontWeight: '600' },
  desc:    { fontSize: 12, marginTop: 2, lineHeight: 17 },
});

// ─── SECTION CARD ────────────────────────────────────────────────
function Section({ title, children, colors, isDark, delay = 0 }) {
  return (
    <Animated.View
      entering={FadeInDown.delay(delay).springify().damping(28)}
      style={{ marginBottom: 16 }}
    >
      <Text style={[sec.label, { color: colors.textTertiary }]}>{title}</Text>
      <View style={[sec.card, {
        backgroundColor: isDark ? colors.surfaceVariant : '#FFFFFF',
        borderColor:     colors.border,
        shadowColor:     '#000',
        shadowOffset:    { width: 0, height: 2 },
        shadowOpacity:   0.06,
        shadowRadius:    10,
        elevation:       2,
      }]}>
        {React.Children.map(children, (child, i) => (
          <>
            {i > 0 && <View style={[sec.divider, { backgroundColor: colors.border, marginLeft: 66 }]} />}
            {child}
          </>
        ))}
      </View>
    </Animated.View>
  );
}
const sec = StyleSheet.create({
  label:   { fontSize: 10, fontWeight: '700', textTransform: 'uppercase',
             letterSpacing: 1.3, marginBottom: 10, paddingHorizontal: 4 },
  card:    { borderRadius: 24, overflow: 'hidden', borderWidth: 1 },
  divider: { height: 0.5 },
});

// ─── LIST MANAGER MODAL ──────────────────────────────────────────
function ListManagerModal({ visible, onClose, title, items, onAdd, onDelete, colors, isDark }) {
  const [input, setInput] = useState('');

  const handleAdd = () => {
    const val = input.trim();
    if (!val) return;
    if (items.includes(val)) {
      Alert.alert('Already exists', `"${val}" is already in the list.`);
      return;
    }
    onAdd(val);
    setInput('');
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  return (
    <Modal
      visible={visible} animationType="slide"
      presentationStyle="pageSheet" onRequestClose={onClose}
    >
      <View style={[lm.screen, { backgroundColor: colors.background }]}>
        <View style={[lm.header, { borderBottomColor: colors.border }]}>
          <Text style={[lm.title, { color: colors.textPrimary }]}>{title}</Text>
          <Pressable
            onPress={onClose}
            style={[lm.doneBtn, { backgroundColor: isDark ? colors.surfaceVariant : colors.surfaceVariant }]}
          >
            <Text style={{ color: C.primary, fontWeight: '800', fontSize: 15 }}>Done</Text>
          </Pressable>
        </View>

        {/* Add input */}
        <View style={[lm.addRow, {
          backgroundColor: isDark ? colors.surfaceVariant : '#F6F6FA',
          borderColor: colors.border,
        }]}>
          <TextInput
            style={[lm.input, { color: colors.textPrimary }]}
            value={input}
            onChangeText={setInput}
            placeholder={`Add new ${title.toLowerCase().replace('manage ', '')}…`}
            placeholderTextColor={colors.textTertiary}
            onSubmitEditing={handleAdd}
            returnKeyType="done"
            autoFocus
          />
          <Pressable onPress={handleAdd} style={lm.addBtn}>
            <Text style={lm.addBtnTxt}>Add</Text>
          </Pressable>
        </View>

        <FlatList
          data={items}
          keyExtractor={item => item}
          contentContainerStyle={{ padding: 16 }}
          renderItem={({ item }) => (
            <View style={[lm.item, {
              backgroundColor: isDark ? colors.surfaceVariant : '#FFFFFF',
              borderColor: colors.border,
            }]}>
              <Text style={[lm.itemTxt, { color: colors.textPrimary }]}>{item}</Text>
              <Pressable
                onPress={() => Alert.alert('Remove', `Remove "${item}"?`, [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Remove', style: 'destructive', onPress: () => {
                    onDelete(item);
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }},
                ])}
                style={lm.delBtn}
              >
                <Text style={{ color: C.loss, fontSize: 17 }}>✕</Text>
              </Pressable>
            </View>
          )}
          ListEmptyComponent={
            <Text style={{ color: colors.textTertiary, textAlign: 'center', marginTop: 40, fontSize: 14 }}>
              No items yet. Add one above!
            </Text>
          }
        />
      </View>
    </Modal>
  );
}
const lm = StyleSheet.create({
  screen:  { flex: 1 },
  header:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
             padding: 16, borderBottomWidth: 0.5 },
  title:   { fontSize: 18, fontWeight: '800' },
  doneBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  addRow:  { flexDirection: 'row', alignItems: 'center', margin: 16,
             borderRadius: 16, borderWidth: 1, paddingHorizontal: 14, height: 54 },
  input:   { flex: 1, fontSize: 16, fontWeight: '500' },
  addBtn:  { backgroundColor: C.primary, borderRadius: 14,
             paddingHorizontal: 18, paddingVertical: 9 },
  addBtnTxt:{ color: '#fff', fontWeight: '700', fontSize: 14 },
  item:    { flexDirection: 'row', alignItems: 'center', borderRadius: 16,
             padding: 14, marginBottom: 9, borderWidth: 1 },
  itemTxt: { flex: 1, fontSize: 15, fontWeight: '500' },
  delBtn:  { padding: 4 },
});

// ─── PIN SETUP MODAL ─────────────────────────────────────────────
function PinSetupModal({ visible, onClose, onSave, colors, isDark }) {
  const [digits, setDigits] = useState([]);
  const [stage,  setStage]  = useState('enter');
  const [first,  setFirst]  = useState('');
  const [error,  setError]  = useState('');

  const reset = () => { setDigits([]); setStage('enter'); setFirst(''); setError(''); };
  const handleClose = () => { reset(); onClose(); };

  const press = k => {
    if (k === '⌫') { setDigits(d => d.slice(0, -1)); setError(''); return; }
    if (digits.length >= 4) return;
    const next = [...digits, k];
    setDigits(next);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (next.length === 4) {
      const pin = next.join('');
      if (stage === 'enter') {
        setFirst(pin); setStage('confirm'); setDigits([]);
      } else {
        if (pin === first) {
          onSave(pin); reset();
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } else {
          setError('PINs do not match — try again');
          setDigits([]); setStage('enter'); setFirst('');
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
      }
    }
  };

  const keys = ['1','2','3','4','5','6','7','8','9','','0','⌫'];

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={handleClose}>
      <View style={[pm.screen, { backgroundColor: colors.background }]}>
        <View style={[pm.header, { borderBottomColor: colors.border }]}>
          <Text style={[pm.title, { color: colors.textPrimary }]}>Set PIN Lock</Text>
          <Pressable onPress={handleClose} style={[pm.closeBtn, { backgroundColor: colors.surfaceVariant }]}>
            <Text style={{ color: colors.textSecondary, fontWeight: '700' }}>Cancel</Text>
          </Pressable>
        </View>
        <View style={pm.body}>
          <Text style={[pm.sub, { color: colors.textTertiary }]}>
            {stage === 'enter' ? 'Choose a 4-digit PIN' : 'Confirm your PIN'}
          </Text>
          <View style={pm.dotsRow}>
            {[0,1,2,3].map(i => (
              <View key={i} style={[pm.dot, {
                backgroundColor: digits.length > i ? C.primary : 'transparent',
                borderColor:     digits.length > i ? C.primary : colors.border,
              }]} />
            ))}
          </View>
          {error
            ? <Text style={pm.error}>{error}</Text>
            : <View style={{ height: 22 }} />}
          <View style={pm.keypad}>
            {keys.map((k, i) => (
              <Pressable
                key={i} onPress={() => k && press(k)} disabled={!k}
                style={[pm.key, {
                  backgroundColor: !k ? 'transparent'
                    : k === '⌫' ? 'rgba(255,68,68,0.1)'
                    : isDark ? colors.surfaceVariant : '#FFFFFF',
                  borderColor:  k ? colors.border : 'transparent',
                  borderWidth:  k ? 1 : 0,
                  opacity:      !k ? 0 : 1,
                }]}
              >
                <Text style={[pm.keyTxt, {
                  color: k === '⌫' ? C.loss : colors.textPrimary,
                }]}>{k}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
}
const pm = StyleSheet.create({
  screen:  { flex: 1 },
  header:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
             padding: 16, borderBottomWidth: 0.5 },
  title:   { fontSize: 18, fontWeight: '800' },
  closeBtn:{ paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  body:    { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  sub:     { fontSize: 16, marginBottom: 40, textAlign: 'center' },
  dotsRow: { flexDirection: 'row', gap: 18, marginBottom: 10 },
  dot:     { width: 18, height: 18, borderRadius: 9, borderWidth: 2 },
  error:   { fontSize: 13, color: C.loss, fontWeight: '600', height: 22, marginBottom: 8 },
  keypad:  { flexDirection: 'row', flexWrap: 'wrap', width: 272,
             gap: 16, marginTop: 24, justifyContent: 'center' },
  key:     { width: 78, height: 78, borderRadius: 39,
             alignItems: 'center', justifyContent: 'center' },
  keyTxt:  { fontSize: 26, fontWeight: '600' },
});

// ─── THEME OPTIONS ───────────────────────────────────────────────
const THEME_OPTIONS = [
  { key: 'auto',   icon: '🌗', label: 'Auto (System)',  iconBg: 'rgba(255,255,255,0.06)' },
  { key: 'light',  icon: '☀️', label: 'Light',          iconBg: 'rgba(255,220,80,0.12)'  },
  { key: 'dark',   icon: '🌙', label: 'Dark',           iconBg: 'rgba(100,100,200,0.1)'  },
  { key: 'amoled', icon: '⚫', label: 'AMOLED Black',   iconBg: 'rgba(255,255,255,0.04)' },
];

// ─── MAIN SCREEN ─────────────────────────────────────────────────
export default function SettingsScreen() {
  const { colors, isDark, themeKey, setTheme } = useTheme();
  const bets          = useStore(s => s.bets);
  const bookies       = useStore(s => s.bookies);
  const sports        = useStore(s => s.sports);
  const templates     = useStore(s => s.templates);
  const currency      = useStore(s => s.currency);
  const saveBookies   = useStore(s => s.saveBookies);
  const saveSports    = useStore(s => s.saveSports);
  const clearAllBets  = useStore(s => s.clearAllBets);
  const deleteTemplate= useStore(s => s.deleteTemplate);
  const setCurrency   = useStore(s => s.setCurrency);
  const stats         = useStats();

  const [pinEnabled,   setPinEnabled]   = useState(false);
  const [hiddenMode,   setHiddenMode]   = useState(false);
  const [showBookies,  setShowBookies]  = useState(false);
  const [showSports,   setShowSports]   = useState(false);
  const [showPinSetup, setShowPinSetup] = useState(false);

  useEffect(() => {
    Promise.all([
      getItem(KEYS.PIN_ENABLED, false),
      getItem(KEYS.HIDDEN_MODE, false),
    ]).then(([pe, hm]) => {
      setPinEnabled(pe);
      setHiddenMode(hm);
    });
  }, []);

  const handlePinToggle = async val => {
    if (val) {
      setShowPinSetup(true);
    } else {
      Alert.alert('Disable PIN?', 'App will no longer be PIN protected.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Disable', style: 'destructive', onPress: async () => {
          setPinEnabled(false);
          await setItem(KEYS.PIN_ENABLED, false);
          await setItem(KEYS.PIN, '');
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }},
      ]);
    }
  };

  const handlePinSave = async pin => {
    setPinEnabled(true);
    setShowPinSetup(false);
    await setItem(KEYS.PIN, pin);
    await setItem(KEYS.PIN_ENABLED, true);
    Alert.alert('PIN Set ✓', 'App is now PIN protected.');
  };

  const handleHiddenToggle = async val => {
    setHiddenMode(val);
    await setItem(KEYS.HIDDEN_MODE, val);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const exportCSV = async () => {
    if (!bets.length) { Alert.alert('No Data', 'Add some bets first.'); return; }
    const header = ['Date','Event','Bet','Bookie','Sport','Odds','Stake','Status','P&L','Tags','Notes'];
    const rows   = bets.map(b => {
      const pnl = b.status === 'Won'  ? parseFloat(b.stake) * (parseFloat(b.odds) - 1)
                : b.status === 'Lost' ? -parseFloat(b.stake) : 0;
      return [b.date, b.event, b.bet, b.bookie, b.sport, b.odds, b.stake,
              b.status, pnl.toFixed(2), (b.tags || []).join(';'), b.notes || ''];
    });
    const csv = [header, ...rows]
      .map(r => r.map(v => `"${String(v || '').replace(/"/g, '""')}"`).join(','))
      .join('\n');
    await Share.share({ message: csv, title: 'StakeLog_Export.csv' });
  };

  const exportJSON = async () => {
    if (!bets.length) { Alert.alert('No Data', 'Add some bets first.'); return; }
    const data = JSON.stringify({ exportDate: new Date().toISOString(), bets, bookies, sports, currency }, null, 2);
    await Share.share({ message: data, title: 'StakeLog_Backup.json' });
  };

  const handleClearAll = () => {
    if (!bets.length) { Alert.alert('Nothing to delete'); return; }
    Alert.alert(
      'Clear All Bets',
      `Permanently delete all ${bets.length} bets? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete All', style: 'destructive', onPress: async () => {
          await clearAllBets();
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }},
      ]
    );
  };

  return (
    <SafeAreaView style={[s.screen, { backgroundColor: colors.background }]} edges={['top']}>

      {/* Modals */}
      <ListManagerModal
        visible={showBookies} onClose={() => setShowBookies(false)}
        title="Manage Bookies" items={bookies}
        onAdd={name => saveBookies([...bookies, name])}
        onDelete={name => saveBookies(bookies.filter(b => b !== name))}
        colors={colors} isDark={isDark}
      />
      <ListManagerModal
        visible={showSports} onClose={() => setShowSports(false)}
        title="Manage Sports" items={sports}
        onAdd={name => saveSports([...sports, name])}
        onDelete={name => saveSports(sports.filter(sp => sp !== name))}
        colors={colors} isDark={isDark}
      />
      <PinSetupModal
        visible={showPinSetup}
        onClose={() => setShowPinSetup(false)}
        onSave={handlePinSave}
        colors={colors} isDark={isDark}
      />

      {/* ── Header ── */}
      <View style={[s.topBar, { borderBottomColor: colors.border }]}>
        <View>
          <Text style={[s.title, { color: colors.textPrimary }]}>Settings</Text>
          <Text style={[s.sub, { color: colors.textTertiary }]}>
            {bets.length} bets tracked
          </Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.content}
      >

        {/* ── YOUR STATS ── */}
        <Animated.View entering={FadeInDown.delay(0).springify().damping(28)}>
          <View style={[s.statsCard, {
            backgroundColor: isDark ? colors.surfaceVariant : '#FFFFFF',
            borderColor: colors.border,
          }]}>
            <Text style={[s.statsTitle, { color: colors.textPrimary }]}>Your Stats</Text>
            <View style={s.statsGrid}>
              {[
                { l: 'Total',    v: bets.length,                               c: colors.textPrimary },
                { l: 'Won',      v: stats.wonCount,                            c: C.profit },
                { l: 'Lost',     v: stats.lostCount,                           c: C.loss },
                { l: 'Win Rate', v: stats.winRate ? `${stats.winRate}%` : '—', c: colors.textPrimary },
              ].map(item => (
                <View key={item.l} style={s.statsItem}>
                  <Text style={[s.statsVal, { color: item.c }]}>{item.v}</Text>
                  <Text style={[s.statsLbl, { color: colors.textTertiary }]}>{item.l}</Text>
                </View>
              ))}
            </View>
          </View>
        </Animated.View>

        {/* ── APPEARANCE ── */}
        <Section title="Appearance" colors={colors} isDark={isDark} delay={50}>
          {THEME_OPTIONS.map(opt => (
            <SettingRow
              key={opt.key}
              icon={opt.icon} label={opt.label}
              iconBg={opt.iconBg} colors={colors}
              onPress={() => {
                setTheme(opt.key);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
              right={
                themeKey === opt.key ? (
                  <View style={[s.check, { backgroundColor: C.primary }]}>
                    <Text style={{ color: '#fff', fontSize: 11, fontWeight: '900' }}>✓</Text>
                  </View>
                ) : (
                  <View style={{ width: 26 }} />
                )
              }
            />
          ))}
        </Section>

        {/* ── CURRENCY ── */}
        <Section title="Currency" colors={colors} isDark={isDark} delay={90}>
          <View style={s.chipGrid}>
            {CURRENCIES.map(c => {
              const active = currency === c.code;
              return (
                <Pressable
                  key={c.code}
                  onPress={() => {
                    setCurrency(c.code);
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
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
                    color: active ? C.primary : colors.textSecondary,
                    fontWeight: active ? '800' : '600',
                  }]}>
                    {c.symbol} {c.code}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Section>

        {/* ── BOOKIES & SPORTS ── */}
        <Section title="Bookies & Sports" colors={colors} isDark={isDark} delay={130}>
          <SettingRow
            icon="🏢" label="Manage Bookies"
            desc={`${bookies.length} configured`}
            iconBg="rgba(91,141,239,0.1)"
            colors={colors}
            onPress={() => {
              setShowBookies(true);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
          />
          <SettingRow
            icon="🏅" label="Manage Sports"
            desc={`${sports.length} configured`}
            iconBg="rgba(255,179,71,0.1)"
            colors={colors}
            onPress={() => {
              setShowSports(true);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
          />
        </Section>

        {/* ── SECURITY ── */}
        <Section title="Security & Privacy" colors={colors} isDark={isDark} delay={170}>
          <SettingRow
            icon="🔒" label="PIN Lock"
            desc={pinEnabled ? '✓ App is PIN protected' : 'Set a 4-digit PIN'}
            iconBg="rgba(91,141,239,0.1)"
            colors={colors}
            right={<M3Toggle value={pinEnabled} onChange={handlePinToggle} />}
          />
          <SettingRow
            icon="🙈" label="Hidden Mode"
            desc={hiddenMode ? '✓ Amounts hidden' : 'Hide amounts for privacy'}
            iconBg="rgba(138,138,160,0.1)"
            colors={colors}
            right={<M3Toggle value={hiddenMode} onChange={handleHiddenToggle} />}
          />
        </Section>

        {/* ── TEMPLATES ── */}
        {templates.length > 0 && (
          <Section title={`Templates (${templates.length})`} colors={colors} isDark={isDark} delay={210}>
            {templates.map(tp => (
              <SettingRow
                key={tp.id}
                icon="📌" label={tp.event || 'Unnamed'}
                desc={`${tp.bookie} · ${tp.sport}`}
                iconBg="rgba(255,75,106,0.1)"
                colors={colors}
                onPress={() => Alert.alert('Delete Template', tp.event || 'This template', [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Delete', style: 'destructive', onPress: () => deleteTemplate(tp.id) },
                ])}
                right={<Text style={{ color: C.loss, fontSize: 17 }}>🗑</Text>}
              />
            ))}
          </Section>
        )}

        {/* ── DATA ── */}
        <Section title="Data & Export" colors={colors} isDark={isDark} delay={250}>
          <SettingRow
            icon="📊" label="Export as CSV"
            desc="Share to Excel, Sheets, or Files"
            iconBg="rgba(0,191,111,0.1)"
            colors={colors}
            onPress={exportCSV}
          />
          <SettingRow
            icon="💾" label="Backup as JSON"
            desc="Full data backup"
            iconBg="rgba(91,141,239,0.1)"
            colors={colors}
            onPress={exportJSON}
          />
        </Section>

        {/* ── DANGER ZONE ── */}
        <Section title="Danger Zone" colors={colors} isDark={isDark} delay={290}>
          <SettingRow
            icon="🗑" label="Clear All Bets"
            desc={`Permanently delete all ${bets.length} bets`}
            colors={colors}
            onPress={handleClearAll}
            danger
          />
        </Section>

        {/* ── APP INFO ── */}
        <View style={s.appInfo}>
          <View style={[s.appBadge, { backgroundColor: isDark ? colors.surfaceVariant : '#F0F0F8' }]}>
            <Text style={{ fontSize: 22, marginBottom: 6 }}>🎯</Text>
            <Text style={[s.appName, { color: colors.textPrimary }]}>StakeLog</Text>
            <Text style={[s.appVer, { color: colors.textTertiary }]}>
              v2.0 · Material Expressive
            </Text>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

// ─── STYLES ──────────────────────────────────────────────────────
const s = StyleSheet.create({
  screen:  { flex: 1 },
  topBar:  { flexDirection: 'row', justifyContent: 'space-between',
             alignItems: 'center', paddingHorizontal: 16,
             paddingTop: 12, paddingBottom: 14, borderBottomWidth: 0.5 },
  title:   { fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
  sub:     { fontSize: 11, fontWeight: '600', marginTop: 2 },
  content: { padding: 16, paddingBottom: 120 },

  // Stats card
  statsCard:  { borderRadius: 24, padding: 18, marginBottom: 16,
                borderWidth: 1, shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.06, shadowRadius: 10, elevation: 2 },
  statsTitle: { fontSize: 14, fontWeight: '700', marginBottom: 16 },
  statsGrid:  { flexDirection: 'row', justifyContent: 'space-around' },
  statsItem:  { alignItems: 'center' },
  statsVal:   { fontSize: 26, fontWeight: '800', letterSpacing: -0.5 },
  statsLbl:   { fontSize: 11, marginTop: 4, fontWeight: '600' },

  // Checkmark
  check: { width: 26, height: 26, borderRadius: 13,
           alignItems: 'center', justifyContent: 'center' },

  // Currency chips
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, padding: 14 },
  chip:     { paddingHorizontal: 14, paddingVertical: 8,
              borderRadius: 999, borderWidth: 1 },
  chipTxt:  { fontSize: 13 },

  // App info
  appInfo:  { alignItems: 'center', paddingVertical: 24 },
  appBadge: { alignItems: 'center', paddingVertical: 20, paddingHorizontal: 32,
              borderRadius: 24 },
  appName:  { fontSize: 15, fontWeight: '800', letterSpacing: -0.3 },
  appVer:   { fontSize: 12, marginTop: 4, fontWeight: '500' },
});
