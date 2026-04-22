// BetsScreen.js — Premium timeline feed: polished sections, clean filters
import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, SectionList, StyleSheet, Pressable,
  TextInput, ScrollView, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown, Layout } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTheme } from './useTheme';
import { useStore, useStats } from './store';
import BetCard from './BetCard';
import AddBetModal from './AddBetModal';
import QuickBet from './QuickBet';
import { formatMoney, getCurrencySymbol, makeForm } from './calculations';

const STATUSES = ['All', 'Pending', 'Won', 'Lost', 'Void'];
const DATE_RANGES = [
  { key: 'all', label: 'All time' },
  { key: 'today', label: 'Today' },
  { key: 'week', label: '7 days' },
  { key: 'month', label: 'Month' },
];
const SORTS = [
  { key: 'date_desc', label: 'Newest' },
  { key: 'date_asc', label: 'Oldest' },
  { key: 'stake_desc', label: 'Stake ↓' },
  { key: 'pnl_desc', label: 'P&L ↓' },
];

const STATUS_COLORS = {
  Won: { bg: 'rgba(0,200,83,0.08)', border: 'rgba(0,200,83,0.2)', text: '#00C853' },
  Lost: { bg: 'rgba(229,57,53,0.08)', border: 'rgba(229,57,53,0.2)', text: '#E53935' },
  Pending: { bg: 'rgba(255,111,0,0.08)', border: 'rgba(255,111,0,0.2)', text: '#FF6F00' },
  Void: { bg: 'rgba(117,117,117,0.07)', border: 'rgba(117,117,117,0.18)', text: '#757575' },
  All: { bg: 'rgba(229,9,20,0.08)', border: 'rgba(229,9,20,0.2)', text: '#E50914' },
};

function formatDateLabel(d) {
  const now = new Date();
  if (new Date(d).toDateString() === now.toDateString()) return 'Today';
  if (new Date(d).toDateString() === new Date(now - 86400000).toDateString()) return 'Yesterday';
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ── Premium date section header ───────────────────────────────────
function DateHeader({ title, dayPnL, currSym, colors }) {
  const isPos = dayPnL >= 0;
  const hasResult = dayPnL !== 0;
  return (
    <View style={[dh.row, { backgroundColor: colors.background }]}>
      <View style={[dh.line, { backgroundColor: colors.border }]} />
      <View style={[dh.pill, { backgroundColor: colors.surfaceVariant, borderColor: colors.border }]}>
        <Text style={[dh.date, { color: colors.textSecondary }]}>{title}</Text>
        {hasResult && (
          <View style={[dh.pnlBadge, {
            backgroundColor: isPos ? 'rgba(0,200,83,0.1)' : 'rgba(229,57,53,0.08)',
          }]}>
            <Text style={[dh.pnl, { color: isPos ? '#00C853' : '#E53935' }]}>
              {isPos ? '+' : ''}{formatMoney(dayPnL, currSym)}
            </Text>
          </View>
        )}
      </View>
      <View style={[dh.line, { backgroundColor: colors.border }]} />
    </View>
  );
}
const dh = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  line: { flex: 1, height: 0.5 },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 999, borderWidth: 0.5, marginHorizontal: 12 },
  date: { fontSize: 11, fontWeight: '700' },
  pnlBadge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 999 },
  pnl: { fontSize: 11, fontWeight: '800' },
});

// ── Summary pill ──────────────────────────────────────────────────
function SummaryPill({ item }) {
  return (
    <View style={[sp.pill, { backgroundColor: item.bg, borderColor: item.border }]}>
      <Text style={[sp.value, { color: item.color }]} numberOfLines={1} adjustsFontSizeToFit>{item.value}</Text>
      <Text style={[sp.label, { color: item.color, opacity: 0.6 }]}>{item.label}</Text>
    </View>
  );
}
const sp = StyleSheet.create({
  pill: { borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10, borderWidth: 0.5, alignItems: 'center', minWidth: 72 },
  value: { fontSize: 16, fontWeight: '800', letterSpacing: -0.4 },
  label: { fontSize: 9, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 2 },
});

export default function BetsScreen() {
  const { colors, isDark } = useTheme();
  const bets = useStore(s => s.bets);
  const bookies = useStore(s => s.bookies);
  const sports = useStore(s => s.sports);
  const templates = useStore(s => s.templates);
  const currency = useStore(s => s.currency);
  const undoStack = useStore(s => s.undoStack);
  const addBet = useStore(s => s.addBet);
  const updateBet = useStore(s => s.updateBet);
  const deleteBet = useStore(s => s.deleteBet);
  const markStatus = useStore(s => s.markStatus);
  const duplicateBet = useStore(s => s.duplicateBet);
  const bulkAction = useStore(s => s.bulkAction);
  const undo = useStore(s => s.undo);
  const stats = useStats();
  const currSym = getCurrencySymbol(currency);

  const [modal, setModal] = useState(false);
  const [quickBet, setQuickBet] = useState(false);
  const [editBet, setEditBet] = useState(null);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [dateRange, setDateRange] = useState('all');
  const [sortBy, setSortBy] = useState('date_desc');
  const [showFilters, setShowFilters] = useState(false);
  const [bulkMode, setBulkMode] = useState(false);
  const [selected, setSelected] = useState(new Set());

  const filtered = useMemo(() => {
    const now = new Date();
    return bets.filter(b => {
      if (filterStatus !== 'All' && b.status !== filterStatus) return false;
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
      if (sortBy === 'date_desc') return new Date(b.date) - new Date(a.date);
      if (sortBy === 'date_asc') return new Date(a.date) - new Date(b.date);
      if (sortBy === 'stake_desc') return parseFloat(b.stake) - parseFloat(a.stake);
      if (sortBy === 'pnl_desc') {
        const pa = a.status === 'Won' ? parseFloat(a.stake) * (parseFloat(a.odds) - 1) : a.status === 'Lost' ? -parseFloat(a.stake) : 0;
        const pb = b.status === 'Won' ? parseFloat(b.stake) * (parseFloat(b.odds) - 1) : b.status === 'Lost' ? -parseFloat(b.stake) : 0;
        return pb - pa;
      }
      return 0;
    });
  }, [bets, filterStatus, search, dateRange, sortBy]);

  const sections = useMemo(() => {
    const groups = {}, order = [];
    filtered.forEach(bet => {
      const dk = bet.date || 'Unknown';
      if (!groups[dk]) { groups[dk] = []; order.push(dk); }
      groups[dk].push(bet);
    });
    return order.map(dk => {
      const day = groups[dk];
      const pnl = day.reduce((s, b) => {
        if (b.status === 'Won') return s + parseFloat(b.stake) * (parseFloat(b.odds) - 1);
        if (b.status === 'Lost') return s - parseFloat(b.stake);
        return s;
      }, 0);
      return { title: dk, displayTitle: formatDateLabel(dk), dayPnL: pnl, data: day };
    });
  }, [filtered]);

  const handleSave = useCallback(async (form) => {
    if (editBet) await updateBet({ ...form, id: editBet.id });
    else await addBet(form);
    setEditBet(null);
  }, [editBet, addBet, updateBet]);

  const handleWon = (id) => { markStatus(id, 'Won'); Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); };
  const handleLost = (id) => { markStatus(id, 'Lost'); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); };
  const toggleSel = (id) => setSelected(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const handleBulk = (action) => { bulkAction(Array.from(selected), action); setSelected(new Set()); setBulkMode(false); };

  const isPos = stats.totalPnL >= 0;
  const summaryItems = [
    { key: 'pnl', label: 'P&L', value: (isPos ? '+' : '') + formatMoney(stats.totalPnL, currSym), color: isPos ? '#00C853' : '#E53935', bg: isPos ? 'rgba(0,200,83,0.08)' : 'rgba(229,57,53,0.08)', border: isPos ? 'rgba(0,200,83,0.2)' : 'rgba(229,57,53,0.2)' },
    { key: 'wr', label: 'Win Rate', value: stats.winRate ? stats.winRate + '%' : '—', color: colors.textPrimary, bg: colors.surface, border: colors.border },
    { key: 'won', label: 'Won', value: String(stats.wonCount), color: '#00C853', bg: 'rgba(0,200,83,0.08)', border: 'rgba(0,200,83,0.2)' },
    { key: 'lost', label: 'Lost', value: String(stats.lostCount), color: '#E53935', bg: 'rgba(229,57,53,0.08)', border: 'rgba(229,57,53,0.2)' },
    { key: 'pend', label: 'Pending', value: String(stats.pendingCount), color: '#FF6F00', bg: 'rgba(255,111,0,0.08)', border: 'rgba(255,111,0,0.2)' },
  ];

  return (
    <SafeAreaView style={[s.screen, { backgroundColor: colors.background }]} edges={['top']}>

      {/* ── Header ── */}
      <View style={[s.topBar, { borderBottomColor: colors.border }]}>
        <Text style={[s.title, { color: colors.textPrimary }]}>My Bets</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Pressable
            onPress={() => { setQuickBet(true); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); }}
            style={[s.headerBtn, { backgroundColor: 'rgba(124,58,237,0.1)' }]}
          >
            <Text style={{ color: '#7C3AED', fontSize: 15 }}>⚡</Text>
          </Pressable>
          <Pressable
            onPress={() => { setEditBet(null); setModal(true); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); }}
            style={[s.headerBtn, { backgroundColor: 'rgba(229,9,20,0.1)' }]}
          >
            <Text style={{ color: '#E50914', fontSize: 20, lineHeight: 24 }}>＋</Text>
          </Pressable>
        </View>
      </View>

      {/* ── Summary strip ── */}
      {bets.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.summaryScroll} contentContainerStyle={s.summaryContent}>
          {summaryItems.map(item => <SummaryPill key={item.key} item={item} />)}
        </ScrollView>
      )}

      {/* ── Search bar ── */}
      <View style={[s.searchRow, {
        backgroundColor: colors.surfaceVariant,
        borderColor: search ? '#E50914' : colors.border,
      }]}>
        <Text style={{ fontSize: 14, color: colors.textTertiary }}>🔍</Text>
        <TextInput
          style={[s.searchInput, { color: colors.textPrimary }]}
          value={search}
          onChangeText={setSearch}
          placeholder="Search events, bets, tags…"
          placeholderTextColor={colors.textTertiary}
        />
        {search ? (
          <Pressable onPress={() => setSearch('')} hitSlop={8}>
            <Text style={{ color: colors.textTertiary, fontSize: 18, fontWeight: '300' }}>×</Text>
          </Pressable>
        ) : null}
        <Pressable
          onPress={() => { setShowFilters(v => !v); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
          style={[s.filterToggle, {
            backgroundColor: showFilters ? '#E50914' : colors.surface,
            borderColor: showFilters ? '#E50914' : colors.border,
          }]}
        >
          <Text style={{ fontSize: 11, color: showFilters ? '#fff' : colors.textSecondary, fontWeight: '700' }}>
            {showFilters ? '▲' : '▼'} Filter
          </Text>
        </Pressable>
      </View>

      {/* ── Filter panel ── */}
      {showFilters && (
        <View style={[s.filterPanel, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {/* Status chips */}
          <Text style={[s.filterLbl, { color: colors.textTertiary }]}>Status</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
            <View style={s.chipRow}>
              {STATUSES.map(st => {
                const active = filterStatus === st;
                const cc = STATUS_COLORS[st] || STATUS_COLORS.Void;
                return (
                  <Pressable key={st} onPress={() => setFilterStatus(st)}
                    style={[s.chip, { backgroundColor: active ? cc.bg : colors.surfaceVariant, borderColor: active ? cc.border : colors.border }]}>
                    <Text style={[s.chipTxt, { color: active ? cc.text : colors.textTertiary, fontWeight: active ? '700' : '500' }]}>{st}</Text>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>

          {/* Date chips */}
          <Text style={[s.filterLbl, { color: colors.textTertiary }]}>Date range</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
            <View style={s.chipRow}>
              {DATE_RANGES.map(dr => {
                const active = dateRange === dr.key;
                return (
                  <Pressable key={dr.key} onPress={() => setDateRange(dr.key)}
                    style={[s.chip, { backgroundColor: active ? 'rgba(229,9,20,0.08)' : colors.surfaceVariant, borderColor: active ? '#E50914' : colors.border }]}>
                    <Text style={[s.chipTxt, { color: active ? '#E50914' : colors.textTertiary, fontWeight: active ? '700' : '500' }]}>{dr.label}</Text>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>

          {/* Sort + Bulk */}
          <Text style={[s.filterLbl, { color: colors.textTertiary }]}>Sort by</Text>
          <View style={s.chipRow}>
            {SORTS.map(so => {
              const active = sortBy === so.key;
              return (
                <Pressable key={so.key} onPress={() => setSortBy(so.key)}
                  style={[s.chip, { backgroundColor: active ? '#E50914' : colors.surfaceVariant, borderColor: active ? '#E50914' : colors.border }]}>
                  <Text style={[s.chipTxt, { color: active ? '#fff' : colors.textTertiary, fontWeight: active ? '700' : '500' }]}>{so.label}</Text>
                </Pressable>
              );
            })}
            <Pressable onPress={() => { setBulkMode(v => !v); setSelected(new Set()); }}
              style={[s.chip, { backgroundColor: bulkMode ? '#E50914' : colors.surfaceVariant, borderColor: bulkMode ? '#E50914' : colors.border }]}>
              <Text style={[s.chipTxt, { color: bulkMode ? '#fff' : colors.textTertiary, fontWeight: bulkMode ? '700' : '500' }]}>☑ Bulk</Text>
            </Pressable>
          </View>
        </View>
      )}

      {/* ── Bulk action bar ── */}
      {bulkMode && selected.size > 0 && (
        <View style={[s.bulkBar, { backgroundColor: 'rgba(229,9,20,0.07)', borderColor: 'rgba(229,9,20,0.2)' }]}>
          <Text style={{ color: '#E50914', fontWeight: '700', flex: 1, fontSize: 13 }}>{selected.size} selected</Text>
          <Pressable onPress={() => handleBulk('won')} style={[s.bulkBtn, { backgroundColor: 'rgba(0,200,83,0.1)' }]}>
            <Text style={{ color: '#00C853', fontWeight: '700', fontSize: 12 }}>✓ Won</Text>
          </Pressable>
          <Pressable onPress={() => handleBulk('lost')} style={[s.bulkBtn, { backgroundColor: 'rgba(229,57,53,0.1)' }]}>
            <Text style={{ color: '#E53935', fontWeight: '700', fontSize: 12 }}>✕ Lost</Text>
          </Pressable>
          <Pressable
            onPress={() => Alert.alert('Delete?', '', [{ text: 'Cancel', style: 'cancel' }, { text: 'Delete', style: 'destructive', onPress: () => handleBulk('delete') }])}
            style={[s.bulkBtn, { backgroundColor: 'rgba(229,57,53,0.1)' }]}
          >
            <Text style={{ color: '#E53935', fontWeight: '700', fontSize: 12 }}>🗑</Text>
          </Pressable>
        </View>
      )}

      {/* ── Undo bar ── */}
      {undoStack.length > 0 && (
        <Pressable onPress={undo} style={[s.undoBar, { backgroundColor: colors.textPrimary }]}>
          <Text style={{ color: colors.background, fontWeight: '700', fontSize: 13 }}>↩ Undo last action</Text>
        </Pressable>
      )}

      {/* ── Bet list ── */}
      <SectionList
        sections={sections}
        keyExtractor={item => String(item.id)}
        renderSectionHeader={({ section }) => (
          <DateHeader title={section.displayTitle} dayPnL={section.dayPnL} currSym={currSym} colors={colors} />
        )}
        renderItem={({ item, index }) => (
          <Animated.View entering={FadeInDown.delay(Math.min(index * 35, 200)).springify().damping(22)} layout={Layout.springify()}>
            <BetCard
              bet={item} hidden={false} currSym={currSym}
              onEdit={b => { setEditBet(b); setModal(true); }}
              onDelete={deleteBet} onWon={handleWon} onLost={handleLost}
              onDuplicate={duplicateBet} onSlip={() => {}}
              bulkMode={bulkMode} selected={selected.has(item.id)} onSelect={toggleSel}
            />
          </Animated.View>
        )}
        contentContainerStyle={[s.list, sections.length === 0 && { flex: 1 }]}
        showsVerticalScrollIndicator={false}
        stickySectionHeadersEnabled={false}
        ListEmptyComponent={
          <View style={s.empty}>
            <Text style={s.emptyEmoji}>{bets.length === 0 ? '🎯' : '🔍'}</Text>
            <Text style={[s.emptyTitle, { color: colors.textPrimary }]}>
              {bets.length === 0 ? 'No bets yet' : 'No results'}
            </Text>
            <Text style={[s.emptySub, { color: colors.textTertiary }]}>
              {bets.length === 0 ? 'Tap ＋ to log your first bet' : 'Try different filters'}
            </Text>
            {bets.length === 0 && (
              <Pressable onPress={() => { setEditBet(null); setModal(true); }} style={s.emptyBtn}>
                <Text style={s.emptyBtnTxt}>＋ Add First Bet</Text>
              </Pressable>
            )}
          </View>
        }
      />

      <AddBetModal
        visible={modal} onClose={() => { setModal(false); setEditBet(null); }}
        onSave={handleSave} editBet={editBet}
        bookies={bookies} sports={sports} templates={templates}
        suggestStake={stats.suggestedStake} currSym={currSym}
      />

      <QuickBet
        visible={quickBet} onClose={() => setQuickBet(false)}
        onSave={addBet} currSym={currSym} suggestStake={stats.suggestedStake}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1 },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 13, borderBottomWidth: 0.5 },
  title: { fontSize: 22, fontWeight: '700', letterSpacing: -0.5 },
  headerBtn: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  summaryScroll: { flexGrow: 0, maxHeight: 72 },
  summaryContent: { paddingHorizontal: 16, paddingVertical: 10, gap: 8, flexDirection: 'row', alignItems: 'center' },
  searchRow: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginBottom: 8, borderRadius: 14, borderWidth: 0.5, paddingHorizontal: 12, height: 46, gap: 8 },
  searchInput: { flex: 1, fontSize: 14, fontWeight: '500' },
  filterToggle: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, borderWidth: 0.5 },
  filterPanel: { marginHorizontal: 16, marginBottom: 8, borderRadius: 18, borderWidth: 0.5, padding: 14 },
  filterLbl: { fontSize: 9, fontWeight: '700', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 8 },
  chipRow: { flexDirection: 'row', gap: 7, flexWrap: 'wrap' },
  chip: { paddingHorizontal: 13, paddingVertical: 6, borderRadius: 999, borderWidth: 0.5 },
  chipTxt: { fontSize: 12, fontWeight: '500' },
  bulkBar: { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 16, borderRadius: 12, padding: 10, marginBottom: 6, borderWidth: 0.5 },
  bulkBtn: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 999 },
  undoBar: { marginHorizontal: 16, borderRadius: 12, padding: 10, alignItems: 'center', marginBottom: 6 },
  list: { paddingHorizontal: 16, paddingBottom: 140, paddingTop: 4 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60 },
  emptyEmoji: { fontSize: 48, marginBottom: 14 },
  emptyTitle: { fontSize: 20, fontWeight: '700', marginBottom: 6 },
  emptySub: { fontSize: 14, textAlign: 'center', lineHeight: 21 },
  emptyBtn: {
    marginTop: 20, backgroundColor: '#E50914', borderRadius: 999,
    paddingHorizontal: 24, paddingVertical: 13,
    shadowColor: '#E50914', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 10, elevation: 5,
  },
  emptyBtnTxt: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
