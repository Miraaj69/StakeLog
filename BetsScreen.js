// screens/BetsScreen.js
import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, Pressable, TextInput,
  ScrollView, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown, Layout } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTheme } from './useTheme';
import { useStore, useStats } from './store';
import BetCard from './BetCard';
import AddBetModal from './AddBetModal';
import {
  STATUSES, formatMoney, calcSuggestedStake, calcTotalPnL, getCurrencySymbol, makeForm,
} from './calculations';
import { Spacing, Radius, Typography, Shadows, Colors } from './theme';

const SORT_OPTIONS = [
  { label: 'Newest', key: 'date_desc' },
  { label: 'Oldest', key: 'date_asc' },
  { label: 'Stake ↓', key: 'stake_desc' },
  { label: 'P&L ↓', key: 'pnl_desc' },
  { label: 'Odds ↓', key: 'odds_desc' },
];

export default function BetsScreen() {
  const { colors } = useTheme();
  const bets = useStore(s => s.bets);
  const bookies = useStore(s => s.bookies);
  const sports = useStore(s => s.sports);
  const bankrollStart = useStore(s => s.bankrollStart);
  const templates = useStore(s => s.templates);
  const undoStack = useStore(s => s.undoStack);
  const addBet = useStore(s => s.addBet);
  const updateBet = useStore(s => s.updateBet);
  const deleteBet = useStore(s => s.deleteBet);
  const markStatus = useStore(s => s.markStatus);
  const duplicateBet = useStore(s => s.duplicateBet);
  const bulkAction = useStore(s => s.bulkAction);
  const undo = useStore(s => s.undo);
  const saveTemplate = useStore(s => s.saveTemplate);
  const stats = useStats();
  const [modalVisible, setModalVisible] = useState(false);
  const [editBet, setEditBet] = useState(null);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterBookie, setFilterBookie] = useState('All');
  const [sortBy, setSortBy] = useState('date_desc');
  const [dateRange, setDateRange] = useState('all');
  const [hidden, setHidden] = useState(false);
  const [bulkMode, setBulkMode] = useState(false);
  const [selected, setSelected] = useState(new Set());
  const [slipBet, setSlipBet] = useState(null);
  const [currency] = useState('INR');
  const currSym = getCurrencySymbol(currency);

  const suggestStake = useMemo(() => calcSuggestedStake(bankrollStart, stats.totalPnL), [bankrollStart, stats.totalPnL]);

  const filtered = useMemo(() => {
    const now = new Date();
    return bets.filter(b => {
      if (filterStatus !== 'All' && b.status !== filterStatus) return false;
      if (filterBookie !== 'All' && b.bookie !== filterBookie) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!b.event.toLowerCase().includes(q) && !b.bet.toLowerCase().includes(q) && !(b.tags || []).join(' ').toLowerCase().includes(q)) return false;
      }
      if (dateRange === 'today' && new Date(b.date).toDateString() !== now.toDateString()) return false;
      if (dateRange === 'week' && (now - new Date(b.date)) / 86400000 > 7) return false;
      if (dateRange === 'month') {
        const d = new Date(b.date);
        if (d.getMonth() !== now.getMonth() || d.getFullYear() !== now.getFullYear()) return false;
      }
      return true;
    }).sort((a, b) => {
      const pnlA = (a.status === 'Won' ? parseFloat(a.stake) * (parseFloat(a.odds) - 1) : a.status === 'Lost' ? -parseFloat(a.stake) : 0);
      const pnlB = (b.status === 'Won' ? parseFloat(b.stake) * (parseFloat(b.odds) - 1) : b.status === 'Lost' ? -parseFloat(b.stake) : 0);
      if (sortBy === 'date_desc') return new Date(b.date) - new Date(a.date);
      if (sortBy === 'date_asc') return new Date(a.date) - new Date(b.date);
      if (sortBy === 'stake_desc') return parseFloat(b.stake) - parseFloat(a.stake);
      if (sortBy === 'pnl_desc') return pnlB - pnlA;
      if (sortBy === 'odds_desc') return parseFloat(b.odds) - parseFloat(a.odds);
      return 0;
    });
  }, [bets, filterStatus, filterBookie, search, dateRange, sortBy]);

  const handleSave = useCallback(async (form) => {
    if (editBet) await updateBet({ ...form, id: editBet.id });
    else await addBet(form);
    setEditBet(null);
  }, [editBet, addBet, updateBet]);

  const handleEdit = (bet) => { setEditBet(bet); setModalVisible(true); };
  const handleWon = async (id) => { await markStatus(id, 'Won'); Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); };
  const handleLost = async (id) => { await markStatus(id, 'Lost'); };
  const toggleSelect = (id) => setSelected(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const handleBulkAction = async (action) => { await bulkAction(Array.from(selected), action); setSelected(new Set()); setBulkMode(false); };

  const s = styles(colors);

  const renderHeader = () => (
    <View>
      {/* Summary row */}
      {bets.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: Spacing.sm }}>
          <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: Spacing.md }}>
            {[
              { label: (stats.totalPnL >= 0 ? '+' : '') + (hidden ? `${currSym}••` : formatMoney(stats.totalPnL, currSym)), bg: stats.totalPnL >= 0 ? colors.profitContainer : colors.lossContainer, color: stats.totalPnL >= 0 ? colors.profit : colors.loss },
              { label: `${stats.wonCount}W ${stats.lostCount}L`, bg: colors.surfaceVariant, color: colors.textSecondary },
              { label: `${stats.winRate ?? '–'}% WR`, bg: colors.surfaceVariant, color: colors.textSecondary },
              ...(stats.streak.type && stats.streak.current >= 2 ? [{ label: `🔥 ${stats.streak.current}`, bg: stats.streak.type === 'Won' ? colors.profitContainer : colors.lossContainer, color: stats.streak.type === 'Won' ? colors.profit : colors.loss }] : []),
            ].map(c => (
              <View key={c.label} style={[s.summaryPill, { backgroundColor: c.bg }]}>
                <Text style={[s.summaryPillText, { color: c.color }]}>{c.label}</Text>
              </View>
            ))}
          </View>
        </ScrollView>
      )}

      {/* Search bar */}
      <View style={[s.searchBar, { backgroundColor: colors.surfaceVariant, borderColor: search ? colors.primary : colors.border }]}>
        <Text style={{ fontSize: 16 }}>🔍</Text>
        <TextInput
          style={[s.searchInput, { color: colors.textPrimary }]}
          value={search} onChangeText={setSearch}
          placeholder="Search events, bets, #tags..."
          placeholderTextColor={colors.textTertiary}
        />
        {search && <Pressable onPress={() => setSearch('')}><Text style={{ color: colors.textTertiary, fontSize: 18 }}>×</Text></Pressable>}
      </View>

      {/* Status filter chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.filterRow}>
        <View style={{ flexDirection: 'row', gap: 6, paddingHorizontal: Spacing.md }}>
          {['All', ...STATUSES].map(st => {
            const active = filterStatus === st;
            const chipColors = { Won: { bg: colors.profitContainer, color: colors.profit }, Lost: { bg: colors.lossContainer, color: colors.loss }, Pending: { bg: colors.pendingContainer, color: colors.pending }, Void: { bg: colors.voidContainer, color: colors.void } }[st];
            return (
              <Pressable key={st} onPress={() => setFilterStatus(st)}
                style={[s.filterChip, active ? { backgroundColor: chipColors?.bg || colors.primaryContainer, borderColor: chipColors?.color || colors.primary } : { backgroundColor: colors.surfaceVariant, borderColor: colors.border }]}>
                <Text style={[s.filterChipText, { color: active ? chipColors?.color || colors.primary : colors.textSecondary, fontWeight: active ? '700' : '500' }]}>{st}</Text>
              </Pressable>
            );
          })}
          <View style={s.filterDivider} />
          {['all', 'today', 'week', 'month'].map(dr => (
            <Pressable key={dr} onPress={() => setDateRange(dr)}
              style={[s.filterChip, dateRange === dr ? { backgroundColor: colors.primaryContainer, borderColor: colors.primary } : { backgroundColor: colors.surfaceVariant, borderColor: colors.border }]}>
              <Text style={[s.filterChipText, { color: dateRange === dr ? colors.primary : colors.textSecondary, fontWeight: dateRange === dr ? '700' : '500' }]}>{dr === 'all' ? 'All time' : dr.charAt(0).toUpperCase() + dr.slice(1)}</Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>

      {/* Sort row */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.filterRow}>
        <View style={{ flexDirection: 'row', gap: 6, paddingHorizontal: Spacing.md }}>
          {SORT_OPTIONS.map(opt => (
            <Pressable key={opt.key} onPress={() => setSortBy(opt.key)}
              style={[s.sortChip, sortBy === opt.key && { backgroundColor: colors.primary }]}>
              <Text style={[s.sortChipText, { color: sortBy === opt.key ? '#fff' : colors.textSecondary }]}>{opt.label}</Text>
            </Pressable>
          ))}
          <View style={s.filterDivider} />
          <Pressable onPress={() => { setBulkMode(b => !b); setSelected(new Set()); }}
            style={[s.sortChip, bulkMode && { backgroundColor: colors.primary }]}>
            <Text style={[s.sortChipText, { color: bulkMode ? '#fff' : colors.textSecondary }]}>☑ Bulk</Text>
          </Pressable>
          <Pressable onPress={() => setHidden(h => !h)} style={s.sortChip}>
            <Text style={[s.sortChipText, { color: colors.textSecondary }]}>{hidden ? '👁️' : '🙈'}</Text>
          </Pressable>
        </View>
      </ScrollView>

      {/* Bulk actions */}
      {bulkMode && selected.size > 0 && (
        <View style={[s.bulkBar, { backgroundColor: colors.primaryContainer }]}>
          <Text style={[s.bulkCount, { color: colors.primary }]}>{selected.size} selected</Text>
          <Pressable onPress={() => handleBulkAction('won')} style={[s.bulkBtn, { backgroundColor: colors.profitContainer }]}><Text style={{ color: colors.profit, fontWeight: '700', fontSize: 12 }}>✓ Won</Text></Pressable>
          <Pressable onPress={() => handleBulkAction('lost')} style={[s.bulkBtn, { backgroundColor: colors.lossContainer }]}><Text style={{ color: colors.loss, fontWeight: '700', fontSize: 12 }}>✕ Lost</Text></Pressable>
          <Pressable onPress={() => Alert.alert('Delete', `Delete ${selected.size} bets?`, [{ text: 'Cancel' }, { text: 'Delete', style: 'destructive', onPress: () => handleBulkAction('delete') }])}
            style={[s.bulkBtn, { backgroundColor: colors.lossContainer }]}><Text style={{ color: colors.loss, fontWeight: '700', fontSize: 12 }}>🗑 Del</Text></Pressable>
          <Pressable onPress={() => setSelected(new Set(filtered.map(b => b.id)))} style={s.bulkBtn}><Text style={{ color: colors.primary, fontWeight: '700', fontSize: 12 }}>All</Text></Pressable>
        </View>
      )}

      {/* Undo bar */}
      {undoStack.length > 0 && (
        <Pressable onPress={undo} style={[s.undoBar, { backgroundColor: colors.textPrimary }]}>
          <Text style={{ color: colors.background, fontWeight: '700', fontSize: 13 }}>↩ Undo last action</Text>
        </Pressable>
      )}
    </View>
  );

  return (
    <SafeAreaView style={[s.screen, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Top bar */}
      <View style={[s.topBar, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <Text style={[s.screenTitle, { color: colors.textPrimary }]}>My Bets</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Pressable onPress={() => { setEditBet(null); setModalVisible(true); }} style={[s.addBtnSmall, { backgroundColor: colors.primaryContainer }]}>
            <Text style={[{ color: colors.primary, fontWeight: '800', fontSize: 18 }]}>+</Text>
          </Pressable>
        </View>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={item => String(item.id)}
        renderItem={({ item, index }) => (
          <Animated.View entering={FadeInDown.delay(index * 40).springify()} layout={Layout.springify()}>
            <BetCard
              bet={item} hidden={hidden} currSym={currSym}
              onEdit={handleEdit} onDelete={deleteBet}
              onWon={handleWon} onLost={handleLost}
              onDuplicate={duplicateBet} onSlip={setSlipBet}
              bulkMode={bulkMode} selected={selected.has(item.id)} onSelect={toggleSelect}
            />
          </Animated.View>
        )}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={
          <View style={s.empty}>
            <Text style={s.emptyEmoji}>🎯</Text>
            <Text style={[s.emptyTitle, { color: colors.textPrimary }]}>{bets.length === 0 ? 'No bets yet' : 'No matches'}</Text>
            <Text style={[s.emptyDesc, { color: colors.textTertiary }]}>{bets.length === 0 ? 'Tap + to add your first bet' : 'Try adjusting your filters'}</Text>
          </View>
        }
        contentContainerStyle={s.listContent}
        showsVerticalScrollIndicator={false}
      />

      {/* FAB */}
      <Pressable onPress={() => { setEditBet(null); setModalVisible(true); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); }}
        style={[s.fab, { backgroundColor: colors.primary, ...Shadows.primary }]}>
        <Text style={s.fabText}>+ New Bet</Text>
      </Pressable>

      <AddBetModal
        visible={modalVisible}
        onClose={() => { setModalVisible(false); setEditBet(null); }}
        onSave={handleSave}
        editBet={editBet}
        bookies={bookies} sports={sports} templates={templates}
        suggestStake={suggestStake} currSym={currSym}
      />
    </SafeAreaView>
  );
}

const styles = (colors) => StyleSheet.create({
  screen: { flex: 1 },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderBottomWidth: 1 },
  screenTitle: { ...Typography.h2 },
  addBtnSmall: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  listContent: { paddingHorizontal: Spacing.md, paddingBottom: 100 },
  summaryPill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: Radius.full },
  summaryPillText: { ...Typography.label, fontWeight: '800' },
  searchBar: { flexDirection: 'row', alignItems: 'center', borderRadius: Radius.full, borderWidth: 1.5, paddingHorizontal: Spacing.md, gap: 8, marginHorizontal: Spacing.md, marginBottom: Spacing.sm, height: 44 },
  searchInput: { flex: 1, ...Typography.body },
  filterRow: { marginBottom: 6 },
  filterChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: Radius.full, borderWidth: 1.5 },
  filterChipText: { fontSize: 12 },
  sortChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: Radius.full, backgroundColor: colors.surfaceVariant },
  sortChipText: { fontSize: 11, fontWeight: '600' },
  filterDivider: { width: 1, backgroundColor: colors.border, marginVertical: 4 },
  bulkBar: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, marginHorizontal: Spacing.md, borderRadius: Radius.lg, marginBottom: Spacing.sm },
  bulkCount: { ...Typography.label, fontWeight: '800', flex: 1 },
  bulkBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: Radius.full, backgroundColor: colors.surfaceVariant },
  undoBar: { marginHorizontal: Spacing.md, borderRadius: Radius.lg, padding: Spacing.sm, alignItems: 'center', marginBottom: Spacing.sm },
  empty: { alignItems: 'center', paddingTop: 80, paddingHorizontal: Spacing.xl },
  emptyEmoji: { fontSize: 48, marginBottom: Spacing.md },
  emptyTitle: { ...Typography.h3, marginBottom: Spacing.sm },
  emptyDesc: { ...Typography.body, textAlign: 'center' },
  fab: { position: 'absolute', bottom: 24, right: Spacing.lg, borderRadius: Radius.full, paddingVertical: 14, paddingHorizontal: 24, flexDirection: 'row', alignItems: 'center', gap: 6 },
  fabText: { color: '#fff', ...Typography.label, fontWeight: '800' },
});
