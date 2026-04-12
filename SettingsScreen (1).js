// SettingsScreen.js — Fully working version
import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Pressable,
  Alert, Share, Switch, TextInput, Modal, FlatList, TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTheme } from './useTheme';
import { useStore, useStats } from './store';
import { CURRENCIES, DEFAULT_BOOKIES, DEFAULT_SPORTS } from './calculations';
import { getItem, setItem, KEYS } from './storage';

// ── Reusable list-manager modal (replaces Alert.prompt on Android) ──
function ListManagerModal({ visible, onClose, title, items, onAdd, onDelete, colors }) {
  const [inputVal, setInputVal] = useState('');

  const handleAdd = () => {
    const val = inputVal.trim();
    if (!val) return;
    if (items.includes(val)) {
      Alert.alert('Already exists', `"${val}" is already in the list.`);
      return;
    }
    onAdd(val);
    setInputVal('');
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[lm.screen, { backgroundColor: colors.background }]}>
        <View style={[lm.header, { borderBottomColor: colors.border }]}>
          <Text style={[lm.title, { color: colors.textPrimary }]}>{title}</Text>
          <Pressable onPress={onClose} style={[lm.closeBtn, { backgroundColor: colors.surfaceVariant }]}>
            <Text style={{ color: colors.textSecondary, fontWeight: '700', fontSize: 15 }}>Done</Text>
          </Pressable>
        </View>

        {/* Add input */}
        <View style={[lm.addRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <TextInput
            style={[lm.input, { color: colors.textPrimary }]}
            value={inputVal}
            onChangeText={setInputVal}
            placeholder={`Add new ${title.toLowerCase().replace('manage ', '')}...`}
            placeholderTextColor={colors.textTertiary}
            onSubmitEditing={handleAdd}
            returnKeyType="done"
            autoFocus
          />
          <Pressable onPress={handleAdd} style={lm.addBtn}>
            <Text style={lm.addBtnTxt}>Add</Text>
          </Pressable>
        </View>

        {/* List */}
        <FlatList
          data={items}
          keyExtractor={(item) => item}
          contentContainerStyle={{ padding: 16 }}
          renderItem={({ item }) => (
            <View style={[lm.item, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[lm.itemTxt, { color: colors.textPrimary }]}>{item}</Text>
              <Pressable onPress={() => {
                Alert.alert('Remove', `Remove "${item}"?`, [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Remove', style: 'destructive', onPress: () => {
                    onDelete(item);
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }},
                ]);
              }} style={lm.deleteBtn}>
                <Text style={{ color: '#D93025', fontSize: 18 }}>✕</Text>
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
  screen: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 0.5 },
  title: { fontSize: 18, fontWeight: '700' },
  closeBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  addRow: { flexDirection: 'row', alignItems: 'center', margin: 16, borderRadius: 14, borderWidth: 0.5, paddingHorizontal: 14, height: 52 },
  input: { flex: 1, fontSize: 16, fontWeight: '500' },
  addBtn: { backgroundColor: '#E50914', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8 },
  addBtnTxt: { color: '#fff', fontWeight: '700', fontSize: 14 },
  item: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, padding: 14, marginBottom: 8, borderWidth: 0.5 },
  itemTxt: { flex: 1, fontSize: 15, fontWeight: '500' },
  deleteBtn: { padding: 4 },
});

// ── PIN Setup Modal ──
function PinSetupModal({ visible, onClose, onSave, colors }) {
  const [digits, setDigits] = useState([]);
  const [stage, setStage] = useState('enter'); // 'enter' | 'confirm'
  const [firstPin, setFirstPin] = useState('');
  const [error, setError] = useState('');

  const reset = () => { setDigits([]); setStage('enter'); setFirstPin(''); setError(''); };

  const handleClose = () => { reset(); onClose(); };

  const press = (k) => {
    if (k === '⌫') { setDigits(d => d.slice(0, -1)); setError(''); return; }
    if (digits.length >= 4) return;
    const next = [...digits, k];
    setDigits(next);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (next.length === 4) {
      const pin = next.join('');
      if (stage === 'enter') {
        setFirstPin(pin);
        setStage('confirm');
        setDigits([]);
      } else {
        if (pin === firstPin) {
          onSave(pin);
          reset();
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } else {
          setError('PINs do not match. Try again.');
          setDigits([]);
          setStage('enter');
          setFirstPin('');
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
          <Text style={[pm.subtitle, { color: colors.textTertiary }]}>
            {stage === 'enter' ? 'Choose a 4-digit PIN' : 'Confirm your PIN'}
          </Text>

          <View style={pm.dotsRow}>
            {[0,1,2,3].map(i => (
              <View key={i} style={[pm.dot, {
                borderColor: digits.length > i ? '#E50914' : colors.border,
                backgroundColor: digits.length > i ? '#E50914' : 'transparent',
              }]} />
            ))}
          </View>

          {error ? <Text style={pm.error}>{error}</Text> : <View style={{ height: 20 }} />}

          <View style={pm.keypad}>
            {keys.map((k, i) => (
              <Pressable key={i} onPress={() => k && press(k)} disabled={!k}
                style={({ pressed }) => [
                  pm.key,
                  { backgroundColor: !k ? 'transparent' : pressed ? '#FFE8E8' : colors.surface, borderColor: colors.border, borderWidth: !k ? 0 : 0.5, opacity: !k ? 0 : 1 }
                ]}>
                <Text style={[pm.keyTxt, { color: k === '⌫' ? '#E50914' : colors.textPrimary }]}>{k}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const pm = StyleSheet.create({
  screen: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 0.5 },
  title: { fontSize: 18, fontWeight: '700' },
  closeBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  body: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  subtitle: { fontSize: 16, marginBottom: 40, textAlign: 'center' },
  dotsRow: { flexDirection: 'row', gap: 18, marginBottom: 12 },
  dot: { width: 16, height: 16, borderRadius: 8, borderWidth: 2 },
  error: { fontSize: 13, color: '#D93025', fontWeight: '600', height: 20, marginBottom: 8 },
  keypad: { flexDirection: 'row', flexWrap: 'wrap', width: 260, gap: 14, marginTop: 24, justifyContent: 'center' },
  key: { width: 76, height: 76, borderRadius: 38, alignItems: 'center', justifyContent: 'center' },
  keyTxt: { fontSize: 24, fontWeight: '600' },
});

// ── Helpers ──
function SettingRow({ icon, label, desc, onPress, rightElement, danger, colors }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [sr.row, { opacity: pressed ? 0.7 : 1 }]}>
      <Text style={sr.icon}>{icon}</Text>
      <View style={{ flex: 1 }}>
        <Text style={[sr.label, { color: danger ? '#D93025' : colors.textPrimary }]}>{label}</Text>
        {desc && <Text style={[sr.desc, { color: colors.textTertiary }]}>{desc}</Text>}
      </View>
      {rightElement !== undefined ? rightElement : <Text style={{ color: colors.textTertiary, fontSize: 18 }}>›</Text>}
    </Pressable>
  );
}
const sr = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16 },
  icon: { fontSize: 22, width: 32, textAlign: 'center' },
  label: { fontSize: 15, fontWeight: '600' },
  desc: { fontSize: 12, marginTop: 2 },
});

function Section({ title, children, colors }) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={[sec.title, { color: colors.textTertiary }]}>{title}</Text>
      <View style={[sec.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        {children}
      </View>
    </View>
  );
}
const sec = StyleSheet.create({
  title: { fontSize: 10, fontWeight: '700', letterSpacing: 1.2, textTransform: 'uppercase', paddingHorizontal: 16, marginBottom: 8 },
  card: { borderRadius: 20, overflow: 'hidden', borderWidth: 0.5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
});

function Divider({ colors }) {
  return <View style={{ height: 0.5, backgroundColor: colors.border, marginLeft: 60 }} />;
}

const THEME_OPTIONS = [
  { key: 'auto',   icon: '🌗', label: 'Auto (System)' },
  { key: 'light',  icon: '☀️', label: 'Light' },
  { key: 'dark',   icon: '🌙', label: 'Dark' },
  { key: 'amoled', icon: '⚫', label: 'AMOLED Black' },
];

// ── Main Screen ──
export default function SettingsScreen() {
  const { colors, themeKey, setTheme } = useTheme();
  const bets           = useStore(s => s.bets);
  const bookies        = useStore(s => s.bookies);
  const sports         = useStore(s => s.sports);
  const templates      = useStore(s => s.templates);
  const currency       = useStore(s => s.currency);
  const saveBookies    = useStore(s => s.saveBookies);
  const saveSports     = useStore(s => s.saveSports);
  const clearAllBets   = useStore(s => s.clearAllBets);
  const deleteTemplate = useStore(s => s.deleteTemplate);
  const setCurrency    = useStore(s => s.setCurrency);
  const stats          = useStats();

  const [pinEnabled, setPinEnabled]   = useState(false);
  const [savedPin, setSavedPin]       = useState('');
  const [hiddenMode, setHiddenMode]   = useState(false);
  const [showBookies, setShowBookies] = useState(false);
  const [showSports, setShowSports]   = useState(false);
  const [showPinSetup, setShowPinSetup] = useState(false);

  useEffect(() => {
    Promise.all([
      getItem(KEYS.PIN_ENABLED, false),
      getItem(KEYS.PIN, ''),
      getItem(KEYS.HIDDEN_MODE || 'sl_hidden', false),
    ]).then(([pe, p, hm]) => {
      setPinEnabled(pe);
      setSavedPin(p);
      setHiddenMode(hm);
    });
  }, []);

  const handlePinToggle = async (val) => {
    if (val) {
      setShowPinSetup(true);
    } else {
      Alert.alert('Disable PIN?', 'Your app will no longer be PIN protected.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Disable', style: 'destructive', onPress: async () => {
          setPinEnabled(false);
          setSavedPin('');
          await setItem(KEYS.PIN_ENABLED, false);
          await setItem(KEYS.PIN, '');
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }},
      ]);
    }
  };

  const handlePinSave = async (pin) => {
    setSavedPin(pin);
    setPinEnabled(true);
    setShowPinSetup(false);
    await setItem(KEYS.PIN, pin);
    await setItem(KEYS.PIN_ENABLED, true);
    Alert.alert('PIN Set ✓', 'Your app is now PIN protected.');
  };

  const handleHiddenToggle = async (val) => {
    setHiddenMode(val);
    await setItem('sl_hidden', val);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const exportCSV = async () => {
    if (bets.length === 0) { Alert.alert('No Data', 'Add some bets first.'); return; }
    const header = ['Date','Event','Bet','Bookie','Sport','Type','Odds','Stake','Status','P&L','Tags','Notes'];
    const rows = bets.map(b => {
      const pnl = b.status === 'Won' ? parseFloat(b.stake) * (parseFloat(b.odds) - 1)
                : b.status === 'Lost' ? -parseFloat(b.stake) : 0;
      return [b.date, b.event, b.bet, b.bookie, b.sport, b.betType||'Single', b.odds, b.stake, b.status, pnl.toFixed(2), (b.tags||[]).join(';'), b.notes||''];
    });
    const csv = [header, ...rows].map(r => r.map(v => `"${String(v||'').replace(/"/g,'""')}"`).join(',')).join('\n');
    await Share.share({ message: csv, title: 'StakeLog_Export.csv' });
  };

  const exportJSON = async () => {
    if (bets.length === 0) { Alert.alert('No Data', 'Add some bets first.'); return; }
    const data = JSON.stringify({ exportDate: new Date().toISOString(), bets, bookies, sports, currency }, null, 2);
    await Share.share({ message: data, title: 'StakeLog_Backup.json' });
  };

  const handleClearAll = () => {
    if (bets.length === 0) { Alert.alert('Nothing to delete', 'No bets found.'); return; }
    Alert.alert(
      'Clear All Bets',
      `This will permanently delete all ${bets.length} bets. This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete All', style: 'destructive', onPress: async () => {
          await clearAllBets();
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          Alert.alert('Done', 'All bets deleted.');
        }},
      ]
    );
  };

  return (
    <SafeAreaView style={[s.screen, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Modals */}
      <ListManagerModal
        visible={showBookies}
        onClose={() => setShowBookies(false)}
        title="Manage Bookies"
        items={bookies}
        onAdd={(name) => saveBookies([...bookies, name])}
        onDelete={(name) => saveBookies(bookies.filter(b => b !== name))}
        colors={colors}
      />
      <ListManagerModal
        visible={showSports}
        onClose={() => setShowSports(false)}
        title="Manage Sports"
        items={sports}
        onAdd={(name) => saveSports([...sports, name])}
        onDelete={(name) => saveSports(sports.filter(sp => sp !== name))}
        colors={colors}
      />
      <PinSetupModal
        visible={showPinSetup}
        onClose={() => { setShowPinSetup(false); }}
        onSave={handlePinSave}
        colors={colors}
      />

      <View style={[s.topBar, { borderBottomColor: colors.border }]}>
        <Text style={[s.title, { color: colors.textPrimary }]}>Settings</Text>
        <Text style={[s.sub, { color: colors.textTertiary }]}>{bets.length} bets</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, paddingBottom: 48 }}>

        {/* ── Appearance ── */}
        <Animated.View entering={FadeInDown.delay(40).springify()}>
          <Section title="Appearance" colors={colors}>
            {THEME_OPTIONS.map((opt, i) => (
              <React.Fragment key={opt.key}>
                <SettingRow
                  icon={opt.icon} label={opt.label} colors={colors}
                  onPress={() => { setTheme(opt.key); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                  rightElement={themeKey === opt.key
                    ? <View style={s.checkCircle}><Text style={{ color: '#fff', fontSize: 12, fontWeight: '900' }}>✓</Text></View>
                    : <View style={{ width: 24 }} />}
                />
                {i < THEME_OPTIONS.length - 1 && <Divider colors={colors} />}
              </React.Fragment>
            ))}
          </Section>
        </Animated.View>

        {/* ── Currency ── */}
        <Animated.View entering={FadeInDown.delay(80).springify()}>
          <Section title="Currency" colors={colors}>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, padding: 14 }}>
              {CURRENCIES.map(c => (
                <Pressable key={c.code}
                  onPress={() => { setCurrency(c.code); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                  style={[s.chip, currency === c.code
                    ? { backgroundColor: '#FFE8E8', borderColor: '#E50914' }
                    : { backgroundColor: colors.surfaceVariant, borderColor: colors.border }]}>
                  <Text style={[s.chipTxt, { color: currency === c.code ? '#E50914' : colors.textSecondary }]}>
                    {c.symbol} {c.code}
                  </Text>
                </Pressable>
              ))}
            </View>
          </Section>
        </Animated.View>

        {/* ── Bookies & Sports ── */}
        <Animated.View entering={FadeInDown.delay(120).springify()}>
          <Section title="Bookies & Sports" colors={colors}>
            <SettingRow
              icon="🏢" label="Manage Bookies" colors={colors}
              desc={`${bookies.length} configured — tap to add/remove`}
              onPress={() => { setShowBookies(true); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
            />
            <Divider colors={colors} />
            <SettingRow
              icon="🏅" label="Manage Sports" colors={colors}
              desc={`${sports.length} configured — tap to add/remove`}
              onPress={() => { setShowSports(true); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
            />
          </Section>
        </Animated.View>

        {/* ── Security ── */}
        <Animated.View entering={FadeInDown.delay(160).springify()}>
          <Section title="Security" colors={colors}>
            <SettingRow
              icon="🔒" label="PIN Lock" colors={colors}
              desc={pinEnabled ? '✓ App is PIN protected' : 'Tap to set a 4-digit PIN'}
              rightElement={
                <Switch
                  value={pinEnabled}
                  onValueChange={handlePinToggle}
                  trackColor={{ false: colors.border, true: '#E50914' }}
                  thumbColor="#fff"
                />
              }
            />
            <Divider colors={colors} />
            <SettingRow
              icon="🙈" label="Hidden Mode" colors={colors}
              desc={hiddenMode ? '✓ Amounts are hidden' : 'Hide all amounts for privacy'}
              rightElement={
                <Switch
                  value={hiddenMode}
                  onValueChange={handleHiddenToggle}
                  trackColor={{ false: colors.border, true: '#E50914' }}
                  thumbColor="#fff"
                />
              }
            />
          </Section>
        </Animated.View>

        {/* ── Templates ── */}
        {templates.length > 0 && (
          <Animated.View entering={FadeInDown.delay(200).springify()}>
            <Section title={`Templates (${templates.length})`} colors={colors}>
              {templates.map((tp, i) => (
                <React.Fragment key={tp.id}>
                  <SettingRow
                    icon="📌" label={tp.event || 'Unnamed'} colors={colors}
                    desc={`${tp.bookie} · ${tp.sport}`}
                    onPress={() => Alert.alert('Delete Template', tp.event || 'This template', [
                      { text: 'Cancel', style: 'cancel' },
                      { text: 'Delete', style: 'destructive', onPress: () => deleteTemplate(tp.id) },
                    ])}
                    rightElement={<Text style={{ color: '#D93025', fontSize: 18 }}>🗑</Text>}
                  />
                  {i < templates.length - 1 && <Divider colors={colors} />}
                </React.Fragment>
              ))}
            </Section>
          </Animated.View>
        )}

        {/* ── Data Export ── */}
        <Animated.View entering={FadeInDown.delay(240).springify()}>
          <Section title="Data" colors={colors}>
            <SettingRow icon="📊" label="Export as CSV" colors={colors} desc="Share to Excel, Sheets, or Files" onPress={exportCSV} />
            <Divider colors={colors} />
            <SettingRow icon="💾" label="Backup as JSON" colors={colors} desc="Full data backup" onPress={exportJSON} />
          </Section>
        </Animated.View>

        {/* ── Stats Summary ── */}
        <Animated.View entering={FadeInDown.delay(280).springify()}>
          <View style={[s.summaryCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[s.summaryTitle, { color: colors.textPrimary }]}>Your Stats</Text>
            <View style={s.summaryGrid}>
              {[
                { label: 'Total Bets', value: bets.length, color: colors.textPrimary },
                { label: 'Won',        value: stats.wonCount,  color: '#1A9E4A' },
                { label: 'Lost',       value: stats.lostCount, color: '#D93025' },
                { label: 'Win Rate',   value: stats.winRate ? `${stats.winRate}%` : '—', color: colors.textPrimary },
              ].map(item => (
                <View key={item.label} style={s.summaryItem}>
                  <Text style={[s.summaryVal, { color: item.color }]}>{item.value}</Text>
                  <Text style={[s.summaryLbl, { color: colors.textTertiary }]}>{item.label}</Text>
                </View>
              ))}
            </View>
          </View>
        </Animated.View>

        {/* ── Danger ── */}
        <Animated.View entering={FadeInDown.delay(320).springify()}>
          <Section title="Danger Zone" colors={colors}>
            <SettingRow
              icon="🗑" label="Clear All Bets" colors={colors}
              desc="Permanently delete all betting data"
              onPress={handleClearAll} danger
            />
          </Section>
        </Animated.View>

        <View style={s.appInfo}>
          <Text style={[s.appName, { color: colors.textTertiary }]}>Stake Log v1.0.0</Text>
          <Text style={[s.appVer, { color: colors.textTertiary }]}>Your private betting tracker 🎯</Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1 },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 0.5 },
  title: { fontSize: 22, fontWeight: '700' },
  sub: { fontSize: 12, fontWeight: '500' },
  checkCircle: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#E50914', alignItems: 'center', justifyContent: 'center' },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, borderWidth: 1 },
  chipTxt: { fontSize: 13, fontWeight: '700' },
  summaryCard: { borderRadius: 20, padding: 16, marginBottom: 14, borderWidth: 0.5 },
  summaryTitle: { fontSize: 16, fontWeight: '700', marginBottom: 16 },
  summaryGrid: { flexDirection: 'row', justifyContent: 'space-around' },
  summaryItem: { alignItems: 'center' },
  summaryVal: { fontSize: 24, fontWeight: '800', letterSpacing: -0.5 },
  summaryLbl: { fontSize: 11, marginTop: 4, fontWeight: '500' },
  appInfo: { alignItems: 'center', paddingVertical: 32 },
  appName: { fontSize: 13, fontWeight: '700' },
  appVer: { fontSize: 12, marginTop: 4 },
});
