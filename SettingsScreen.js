// screens/SettingsScreen.js
import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Alert, Share, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTheme } from './useTheme';
import { useStore, useStats } from './store';
import { CURRENCIES, DEFAULT_BOOKIES, DEFAULT_SPORTS, formatMoney } from './calculations';
import { getItem, setItem, KEYS } from './storage';
import { Spacing, Radius, Typography, Shadows } from './theme';

const THEME_OPTIONS = [
  { key: 'auto', icon: '🌗', label: 'Auto (System)' },
  { key: 'light', icon: '☀️', label: 'Light' },
  { key: 'dark', icon: '🌙', label: 'Dark' },
  { key: 'amoled', icon: '⚫', label: 'AMOLED' },
];

function SettingRow({ icon, label, desc, onPress, rightElement, danger }) {
  const { colors } = useTheme();
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: Spacing.md, opacity: pressed ? 0.7 : 1 }]}>
      <Text style={{ fontSize: 22, width: 32, textAlign: 'center' }}>{icon}</Text>
      <View style={{ flex: 1 }}>
        <Text style={{ ...Typography.body, fontWeight: '600', color: danger ? colors.loss : colors.textPrimary }}>{label}</Text>
        {desc && <Text style={{ ...Typography.caption, color: colors.textTertiary, marginTop: 2 }}>{desc}</Text>}
      </View>
      {rightElement || <Text style={{ color: colors.textTertiary, fontSize: 16 }}>›</Text>}
    </Pressable>
  );
}

function Section({ title, children, colors }) {
  return (
    <View style={{ marginBottom: Spacing.md }}>
      <Text style={{ ...Typography.micro, color: colors.textTertiary, textTransform: 'uppercase', letterSpacing: 1, paddingHorizontal: Spacing.md, marginBottom: 6 }}>{title}</Text>
      <View style={{ backgroundColor: colors.surface, borderRadius: Radius.xl, overflow: 'hidden', ...Shadows.sm }}>
        {children}
      </View>
    </View>
  );
}

function Divider({ colors }) {
  return <View style={{ height: 1, backgroundColor: colors.border, marginLeft: 56 }} />;
}

export default function SettingsScreen() {
  const { colors, themeKey, setTheme } = useTheme();
  const bets = useStore(s => s.bets);
  const bookies = useStore(s => s.bookies);
  const sports = useStore(s => s.sports);
  const templates = useStore(s => s.templates);
  const saveBookies = useStore(s => s.saveBookies);
  const saveSports = useStore(s => s.saveSports);
  const clearAllBets = useStore(s => s.clearAllBets);
  const deleteTemplate = useStore(s => s.deleteTemplate);
  const stats = useStats();
  const [currency, setCurrencyState] = useState('INR');
  const [pinEnabled, setPinEnabled] = useState(false);
  const [savedPin, setSavedPin] = useState('');

  React.useEffect(() => {
    Promise.all([getItem(KEYS.CURRENCY, 'INR'), getItem(KEYS.PIN_ENABLED, false), getItem(KEYS.PIN, '')]).then(([c, pe, p]) => {
      setCurrencyState(c); setPinEnabled(pe); setSavedPin(p);
    });
  }, []);

  const exportCSV = async () => {
    const rows = [
      ['Date', 'Event', 'Bet', 'Bookie', 'Sport', 'Type', 'Odds', 'Stake', 'Status', 'P&L', 'Tags', 'Notes'],
      ...bets.map(b => {
        const pnl = b.status === 'Won' ? parseFloat(b.stake) * (parseFloat(b.odds) - 1) : b.status === 'Lost' ? -parseFloat(b.stake) : 0;
        return [b.date, b.event, b.bet, b.bookie, b.sport, b.betType || 'Single', b.odds, b.stake, b.status, pnl.toFixed(2), (b.tags || []).join(';'), b.notes || ''];
      }),
    ];
    const csv = rows.map(r => r.map(v => `"${String(v || '').replace(/"/g, '""')}"`).join(',')).join('\n');
    await Share.share({ message: csv, title: 'Stake Log Export' });
  };

  const exportJSON = async () => {
    const data = JSON.stringify({ bets, bookies, sports, currency }, null, 2);
    await Share.share({ message: data, title: 'Stake Log Backup' });
  };

  const handleClearAll = () => {
    Alert.alert('Clear All Bets', 'This will permanently delete all your bets. This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete All', style: 'destructive', onPress: clearAllBets },
    ]);
  };

  const s = styles(colors);

  return (
    <SafeAreaView style={[s.screen, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[s.topBar, { borderBottomColor: colors.border }]}>
        <Text style={[s.screenTitle, { color: colors.textPrimary }]}>Settings</Text>
        <Text style={[s.betsCount, { color: colors.textTertiary }]}>{bets.length} bets</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: Spacing.md, paddingBottom: 40 }}>

        {/* Theme */}
        <Animated.View entering={FadeInDown.delay(50).springify()}>
          <Section title="Appearance" colors={colors}>
            {THEME_OPTIONS.map((opt, i) => (
              <React.Fragment key={opt.key}>
                <SettingRow
                  icon={opt.icon} label={opt.label}
                  onPress={() => setTheme(opt.key)}
                  rightElement={themeKey === opt.key ? <Text style={{ color: colors.primary, fontWeight: '800', fontSize: 16 }}>✓</Text> : null}
                />
                {i < THEME_OPTIONS.length - 1 && <Divider colors={colors} />}
              </React.Fragment>
            ))}
          </Section>
        </Animated.View>

        {/* Currency */}
        <Animated.View entering={FadeInDown.delay(100).springify()}>
          <Section title="Currency" colors={colors}>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, padding: Spacing.md }}>
              {CURRENCIES.map(c => (
                <Pressable key={c.code} onPress={async () => { setCurrencyState(c.code); await setItem(KEYS.CURRENCY, c.code); }}
                  style={[s.currencyChip, currency === c.code ? { backgroundColor: colors.primaryContainer, borderColor: colors.primary } : { backgroundColor: colors.surfaceVariant, borderColor: colors.border }]}>
                  <Text style={[s.currencyText, { color: currency === c.code ? colors.primary : colors.textSecondary }]}>{c.symbol} {c.code}</Text>
                </Pressable>
              ))}
            </View>
          </Section>
        </Animated.View>

        {/* Bookies */}
        <Animated.View entering={FadeInDown.delay(150).springify()}>
          <Section title="Bookies & Sports" colors={colors}>
            <SettingRow icon="🏢" label="Manage Bookies" desc={`${bookies.length} bookies configured`}
              onPress={() => Alert.prompt('Add Bookie', 'Enter bookie name', (name) => { if (name?.trim()) saveBookies([...bookies, name.trim()]); })} />
            <Divider colors={colors} />
            <SettingRow icon="🏅" label="Manage Sports" desc={`${sports.length} sports configured`}
              onPress={() => Alert.prompt('Add Sport', 'Enter sport name', (name) => { if (name?.trim()) saveSports([...sports, name.trim()]); })} />
          </Section>
        </Animated.View>

        {/* Templates */}
        {templates.length > 0 && (
          <Animated.View entering={FadeInDown.delay(200).springify()}>
            <Section title={`Templates (${templates.length})`} colors={colors}>
              {templates.map((tp, i) => (
                <React.Fragment key={tp.id}>
                  <SettingRow
                    icon="📌" label={tp.event || 'Unnamed template'}
                    desc={`${tp.bookie} · ${tp.sport}`}
                    onPress={() => Alert.alert('Delete template?', tp.event, [{ text: 'Cancel' }, { text: 'Delete', style: 'destructive', onPress: () => deleteTemplate(tp.id) }])}
                    rightElement={<Text style={{ color: colors.loss }}>🗑</Text>}
                  />
                  {i < templates.length - 1 && <Divider colors={colors} />}
                </React.Fragment>
              ))}
            </Section>
          </Animated.View>
        )}

        {/* Security */}
        <Animated.View entering={FadeInDown.delay(250).springify()}>
          <Section title="Security" colors={colors}>
            <SettingRow icon="🔒" label="PIN Lock" desc={pinEnabled ? 'App locks when closed' : 'Protect your data with a PIN'}
              rightElement={<Switch value={pinEnabled} onValueChange={async (v) => { setPinEnabled(v); await setItem(KEYS.PIN_ENABLED, v); if (!v) { setSavedPin(''); await setItem(KEYS.PIN, ''); } }} trackColor={{ false: colors.border, true: colors.primary }} thumbColor="#fff" />} />
            <Divider colors={colors} />
            <SettingRow icon="🙈" label="Hidden Mode" desc="Blur all amounts for privacy" onPress={() => {}} />
          </Section>
        </Animated.View>

        {/* Export */}
        <Animated.View entering={FadeInDown.delay(300).springify()}>
          <Section title="Data" colors={colors}>
            <SettingRow icon="📊" label="Export as CSV" desc="Open in Excel or Sheets" onPress={exportCSV} />
            <Divider colors={colors} />
            <SettingRow icon="💾" label="Backup as JSON" desc="Full data backup" onPress={exportJSON} />
          </Section>
        </Animated.View>

        {/* Stats summary */}
        <Animated.View entering={FadeInDown.delay(350).springify()} style={[s.summaryCard, { backgroundColor: colors.surface }]}>
          <Text style={[s.summaryTitle, { color: colors.textPrimary }]}>Your Stats Summary</Text>
          <View style={s.summaryGrid}>
            {[
              { label: 'Total Bets', value: bets.length },
              { label: 'Won', value: stats.wonCount },
              { label: 'Lost', value: stats.lostCount },
              { label: 'Win Rate', value: stats.winRate ? `${stats.winRate}%` : '—' },
            ].map(item => (
              <View key={item.label} style={s.summaryItem}>
                <Text style={[s.summaryValue, { color: colors.textPrimary }]}>{item.value}</Text>
                <Text style={[s.summaryLabel, { color: colors.textTertiary }]}>{item.label}</Text>
              </View>
            ))}
          </View>
        </Animated.View>

        {/* Danger */}
        <Animated.View entering={FadeInDown.delay(400).springify()}>
          <Section title="Danger Zone" colors={colors}>
            <SettingRow icon="🗑" label="Clear All Bets" desc="Permanently delete all betting data" onPress={handleClearAll} danger />
          </Section>
        </Animated.View>

        {/* App info */}
        <View style={s.appInfo}>
          <Text style={[s.appName, { color: colors.textTertiary }]}>Stake Log v1.0.0</Text>
          <Text style={[s.appDesc, { color: colors.textTertiary }]}>Your private betting tracker</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = (colors) => StyleSheet.create({
  screen: { flex: 1 },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderBottomWidth: 1 },
  screenTitle: { ...Typography.h2 },
  betsCount: { ...Typography.caption },
  currencyChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: Radius.full, borderWidth: 1.5 },
  currencyText: { ...Typography.label, fontWeight: '700' },
  summaryCard: { borderRadius: Radius.xl, padding: Spacing.md, marginBottom: Spacing.md, ...Shadows.sm },
  summaryTitle: { ...Typography.h4, marginBottom: Spacing.md },
  summaryGrid: { flexDirection: 'row', justifyContent: 'space-around' },
  summaryItem: { alignItems: 'center' },
  summaryValue: { ...Typography.h2, fontWeight: '900' },
  summaryLabel: { ...Typography.caption, marginTop: 3 },
  appInfo: { alignItems: 'center', paddingVertical: Spacing.xl },
  appName: { ...Typography.label, fontWeight: '700' },
  appDesc: { ...Typography.caption, marginTop: 4 },
});
