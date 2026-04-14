// BetsScreen.js — clean layout, useStats for all data
import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, Pressable,
  TextInput, ScrollView, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown, Layout } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTheme } from './useTheme';
import { useStore, useStats } from './store';
import BetCard from './BetCard';
import AddBetModal from './AddBetModal';
import { formatMoney, getCurrencySymbol, makeForm } from './calculations';

var STATUSES   = ['All', 'Pending', 'Won', 'Lost', 'Void'];
var DATE_RANGES = [
  { key: 'all',   label: 'All time' },
  { key: 'today', label: 'Today' },
  { key: 'week',  label: '7 days' },
  { key: 'month', label: 'Month' },
];
var SORTS = [
  { key: 'date_desc',  label: 'Newest' },
  { key: 'date_asc',   label: 'Oldest' },
  { key: 'stake_desc', label: 'Stake ↓' },
  { key: 'pnl_desc',   label: 'P&L ↓' },
];

function StatusChip({ label, active, color, onPress }) {
  var { colors } = useTheme();
  var chipColors = {
    Won:     { bg: '#E8F8EE', border: '#A7DFB9', text: '#1A9E4A' },
    Lost:    { bg: '#FDECEA', border: '#F5B8B2', text: '#D93025' },
    Pending: { bg: '#FFF8E7', border: '#FFD980', text: '#E07B00' },
    Void:    { bg: '#F5F5F5', border: '#DDD',    text: '#888' },
    All:     { bg: colors.primaryContainer, border: colors.primary, text: colors.primary },
  }[label] || { bg: colors.surfaceVariant, border: colors.border, text: colors.textSecondary };

  return (
    <Pressable onPress={onPress}
      style={[chip.wrap, {
        backgroundColor: active ? chipColors.bg : colors.surfaceVariant,
        borderColor: active ? chipColors.border : colors.border,
      }]}>
      <Text style={[chip.txt, { color: active ? chipColors.text : colors.textTertiary, fontWeight: active ? '700' : '500' }]}>
        {label}
      </Text>
    </Pressable>
  );
}
var chip = StyleSheet.create({
  wrap: { paddingHorizontal: 13, paddingVertical: 6, borderRadius: 999, borderWidth: 0.5 },
  txt:  { fontSize: 12 },
});

export default function BetsScreen() {
  var { colors } = useTheme();
  var bets          = useStore(function(s) { return s.bets; });
  var bookies       = useStore(function(s) { return s.bookies; });
  var sports        = useStore(function(s) { return s.sports; });
  var bankrollStart = useStore(function(s) { return s.bankrollStart; });
  var templates     = useStore(function(s) { return s.templates; });
  var currency      = useStore(function(s) { return s.currency; });
  var undoStack     = useStore(function(s) { return s.undoStack; });
  var addBet        = useStore(function(s) { return s.addBet; });
  var updateBet     = useStore(function(s) { return s.updateBet; });
  var deleteBet     = useStore(function(s) { return s.deleteBet; });
  var markStatus    = useStore(function(s) { return s.markStatus; });
  var duplicateBet  = useStore(function(s) { return s.duplicateBet; });
  var bulkAction    = useStore(function(s) { return s.bulkAction; });
  var undo          = useStore(function(s) { return s.undo; });
  var stats         = useStats(); // ← single source of truth

  var currSym = getCurrencySymbol(currency);

  var [modalVisible, setModalVisible] = useState(false);
  var [editBet,      setEditBet]      = useState(null);
  var [search,       setSearch]       = useState('');
  var [filterStatus, setFilterStatus] = useState('All');
  var [dateRange,    setDateRange]    = useState('all');
  var [sortBy,       setSortBy]       = useState('date_desc');
  var [showFilters,  setShowFilters]  = useState(false); // collapsible
  var [bulkMode,     setBulkMode]     = useState(false);
  var [selected,     setSelected]     = useState(new Set());

  var filtered = useMemo(function() {
    var now = new Date();
    return bets.filter(function(b) {
      if (filterStatus !== 'All' && b.status !== filterStatus) return false;
      if (search) {
        var q = search.toLowerCase();
        if (!b.event.toLowerCase().includes(q) &&
            !b.bet.toLowerCase().includes(q) &&
            !(b.tags || []).join(' ').toLowerCase().includes(q)) return false;
      }
      if (dateRange === 'today' && new Date(b.date).toDateString() !== now.toDateString()) return false;
      if (dateRange === 'week'  && (now - new Date(b.date)) / 86400000 > 7) return false;
      if (dateRange === 'month') {
        var d = new Date(b.date);
        if (d.getMonth() !== now.getMonth() || d.getFullYear() !== now.getFullYear()) return false;
      }
      return true;
    }).sort(function(a, b) {
      if (sortBy === 'date_desc')  return new Date(b.date) - new Date(a.date);
      if (sortBy === 'date_asc')   return new Date(a.date) - new Date(b.date);
      if (sortBy === 'stake_desc') return parseFloat(b.stake) - parseFloat(a.stake);
      if (sortBy === 'pnl_desc') {
        var pa = a.status === 'Won' ? parseFloat(a.stake)*(parseFloat(a.odds)-1) : a.status === 'Lost' ? -parseFloat(a.stake) : 0;
        var pb = b.status === 'Won' ? parseFloat(b.stake)*(parseFloat(b.odds)-1) : b.status === 'Lost' ? -parseFloat(b.stake) : 0;
        return pb - pa;
      }
      return 0;
    });
  }, [bets, filterStatus, search, dateRange, sortBy]);

  var handleSave = useCallback(async function(form) {
    if (editBet) await updateBet(Object.assign({}, form, { id: editBet.id }));
    else await addBet(form);
    setEditBet(null);
  }, [editBet, addBet, updateBet]);

  var handleWon  = async function(id) { await markStatus(id, 'Won');  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); };
  var handleLost = async function(id) { await markStatus(id, 'Lost'); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); };
  var toggleSelect = function(id) { setSelected(function(s) { var n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; }); };
  var handleBulk = async function(action) { await bulkAction(Array.from(selected), action); setSelected(new Set()); setBulkMode(false); };

  var pnlColor = stats.totalPnL >= 0 ? '#1A9E4A' : '#D93025';

  return (
    <SafeAreaView style={[s.screen, { backgroundColor: colors.background }]} edges={['top']}>

      {/* ── Top bar ── */}
      <View style={[s.topBar, { borderBottomColor: colors.border }]}>
        <Text style={[s.title, { color: colors.textPrimary }]}>My Bets</Text>
        <Pressable onPress={() => { setEditBet(null); setModalVisible(true); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); }}
          style={[s.addBtn, { backgroundColor: '#FFE8E8' }]}>
          <Text style={{ color: '#E50914', fontSize: 22, lineHeight: 26, fontWeight: '300' }}>＋</Text>
        </Pressable>
      </View>

      {/* ── Summary cards row — uses useStats ── */}
      {bets.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.summaryScroll} contentContainerStyle={s.summaryContent}>
          {[
            { label: 'Net P&L',   value: (stats.totalPnL >= 0 ? '+' : '') + formatMoney(stats.totalPnL, currSym), color: pnlColor, bg: stats.totalPnL >= 0 ? '#E8F8EE' : '#FDECEA', border: stats.totalPnL >= 0 ? '#A7DFB9' : '#F5B8B2' },
            { label: 'Win Rate',  value: stats.winRate ? stats.winRate + '%' : '—', color: colors.textPrimary, bg: colors.surface, border: colors.border },
            { label: 'Won',       value: String(stats.wonCount),  color: '#1A9E4A', bg: '#E8F8EE', border: '#A7DFB9' },
            { label: 'Lost',      value: String(stats.lostCount), color: '#D93025', bg: '#FDECEA', border: '#F5B8B2' },
            { label: 'Pending',   value: String(stats.pendingCount), color: '#E07B00', bg: '#FFF8E7', border: '#FFD980' },
          ].map(function(item) {
            return (
              <View key={item.label} style={[s.summaryCard, { backgroundColor: item.bg, borderColor: item.border }]}>
                <Text style={[s.summaryVal, { color: item.color }]}>{item.value}</Text>
                <Text style={[s.summaryLbl, { color: item.color, opacity: 0.7 }]}>{item.label}</Text>
              </View>
            );
          })}
        </ScrollView>
      )}

      {/* ── Search bar ── */}
      <View style={[s.searchWrap, { backgroundColor: colors.surfaceVariant, borderColor: search ? '#E50914' : colors.border }]}>
        <Text style={{ fontSize: 15, color: colors.textTertiary }}>🔍</Text>
        <TextInput
          style={[s.searchInput, { color: colors.textPrimary }]}
          value={search} onChangeText={setSearch}
          placeholder="Search events, bets, #tags..."
          placeholderTextColor={colors.textTertiary}
        />
        {search
          ? <Pressable onPress={() => setSearch('')}><Text style={{ color: colors.textTertiary, fontSize: 18, paddingHorizontal: 4 }}>×</Text></Pressable>
          : null}
        <Pressable onPress={() => setShowFilters(function(v) { return !v; })}
          style={[s.filterToggle, { backgroundColor: showFilters ? '#E50914' : colors.surface, borderColor: showFilters ? '#E50914' : colors.border }]}>
          <Text style={{ fontSize: 12, color: showFilters ? '#fff' : colors.textSecondary, fontWeight: '700' }}>
            {showFilters ? '▲ Less' : '▼ Filter'}
          </Text>
        </Pressable>
      </View>

      {/* ── Collapsible filters ── */}
      {showFilters && (
        <View style={[s.filtersBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {/* Status */}
          <Text style={[s.filterLabel, { color: colors.textTertiary }]}>STATUS</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
            <View style={s.chipRow}>
              {STATUSES.map(function(st) {
                return <StatusChip key={st} label={st} active={filterStatus === st} onPress={() => setFilterStatus(st)} />;
              })}
            </View>
          </ScrollView>

          {/* Date range */}
          <Text style={[s.filterLabel, { color: colors.textTertiary }]}>DATE RANGE</Text>
          <View style={s.chipRow}>
            {DATE_RANGES.map(function(dr) {
              var active = dateRange === dr.key;
              return (
                <Pressable key={dr.key} onPress={() => setDateRange(dr.key)}
                  style={[chip.wrap, { backgroundColor: active ? '#FFE8E8' : colors.surfaceVariant, borderColor: active ? '#E50914' : colors.border }]}>
                  <Text style={[chip.txt, { color: active ? '#E50914' : colors.textTertiary, fontWeight: active ? '700' : '500' }]}>{dr.label}</Text>
                </Pressable>
              );
            })}
          </View>

          {/* Sort */}
          <Text style={[s.filterLabel, { color: colors.textTertiary, marginTop: 10 }]}>SORT BY</Text>
          <View style={s.chipRow}>
            {SORTS.map(function(so) {
              var active = sortBy === so.key;
              return (
                <Pressable key={so.key} onPress={() => setSortBy(so.key)}
                  style={[chip.wrap, { backgroundColor: active ? '#E50914' : colors.surfaceVariant, borderColor: active ? '#E50914' : colors.border }]}>
                  <Text style={[chip.txt, { color: active ? '#fff' : colors.textTertiary, fontWeight: active ? '700' : '500' }]}>{so.label}</Text>
                </Pressable>
              );
            })}
            <Pressable onPress={() => { setBulkMode(function(v) { return !v; }); setSelected(new Set()); }}
              style={[chip.wrap, { backgroundColor: bulkMode ? '#E50914' : colors.surfaceVariant, borderColor: bulkMode ? '#E50914' : colors.border }]}>
              <Text style={[chip.txt, { color: bulkMode ? '#fff' : colors.textTertiary, fontWeight: bulkMode ? '700' : '500' }]}>☑ Bulk</Text>
            </Pressable>
          </View>
        </View>
      )}

      {/* ── Bulk action bar ── */}
      {bulkMode && selected.size > 0 && (
        <View style={[s.bulkBar, { backgroundColor: '#FFE8E8', borderColor: '#F5B8B2' }]}>
          <Text style={{ color: '#E50914', fontWeight: '700', flex: 1, fontSize: 13 }}>{selected.size} selected</Text>
          <Pressable onPress={() => handleBulk('won')}  style={[s.bulkBtn, { backgroundColor: '#E8F8EE' }]}><Text style={{ color: '#1A9E4A', fontWeight: '700', fontSize: 12 }}>✓ Won</Text></Pressable>
          <Pressable onPress={() => handleBulk('lost')} style={[s.bulkBtn, { backgroundColor: '#FDECEA' }]}><Text style={{ color: '#D93025', fontWeight: '700', fontSize: 12 }}>✕ Lost</Text></Pressable>
          <Pressable onPress={() => Alert.alert('Delete ' + selected.size + ' bets?', '', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Delete', style: 'destructive', onPress: () => handleBulk('delete') },
          ])} style={[s.bulkBtn, { backgroundColor: '#FDECEA' }]}><Text style={{ color: '#D93025', fontWeight: '700', fontSize: 12 }}>🗑</Text></Pressable>
        </View>
      )}

      {/* ── Undo bar ── */}
      {undoStack.length > 0 && (
        <Pressable onPress={undo} style={[s.undoBar, { backgroundColor: colors.textPrimary }]}>
          <Text style={{ color: colors.background, fontWeight: '700', fontSize: 13 }}>↩ Undo last action</Text>
        </Pressable>
      )}

      {/* ── Bet list ── */}
      <FlatList
        data={filtered}
        keyExtractor={function(item) { return String(item.id); }}
        renderItem={function(ref) {
          var item = ref.item; var index = ref.index;
          return (
            <Animated.View entering={FadeInDown.delay(Math.min(index * 40, 300)).springify()} layout={Layout.springify()}>
              <BetCard
                bet={item} hidden={false} currSym={currSym}
                onEdit={function(b) { setEditBet(b); setModalVisible(true); }}
                onDelete={deleteBet}
                onWon={handleWon}
                onLost={handleLost}
                onDuplicate={duplicateBet}
                onSlip={function() {}}
                bulkMode={bulkMode}
                selected={selected.has(item.id)}
                onSelect={toggleSelect}
              />
            </Animated.View>
          );
        }}
        contentContainerStyle={[s.list, filtered.length === 0 && { flex: 1 }]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={s.empty}>
            <Text style={s.emptyEmoji}>{bets.length === 0 ? '🎯' : '🔍'}</Text>
            <Text style={[s.emptyTitle, { color: colors.textPrimary }]}>
              {bets.length === 0 ? 'No bets yet' : 'No results'}
            </Text>
            <Text style={[s.emptySub, { color: colors.textTertiary }]}>
              {bets.length === 0 ? 'Tap ＋ to log your first bet' : 'Try changing filters'}
            </Text>
            {bets.length === 0 && (
              <Pressable onPress={() => { setEditBet(null); setModalVisible(true); }}
                style={s.emptyBtn}>
                <Text style={s.emptyBtnTxt}>＋ Add First Bet</Text>
              </Pressable>
            )}
          </View>
        }
      />

      <AddBetModal
        visible={modalVisible}
        onClose={() => { setModalVisible(false); setEditBet(null); }}
        onSave={handleSave}
        editBet={editBet}
        bookies={bookies} sports={sports} templates={templates}
        suggestStake={stats.suggestedStake}
        currSym={currSym}
      />
    </SafeAreaView>
  );
}

var s = StyleSheet.create({
  screen:   { flex: 1 },
  topBar:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 0.5 },
  title:    { fontSize: 22, fontWeight: '700' },
  addBtn:   { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },

  summaryScroll:   { maxHeight: 78, flexGrow: 0 },
  summaryContent:  { paddingHorizontal: 16, paddingVertical: 10, gap: 8, flexDirection: 'row' },
  summaryCard:     { borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10, borderWidth: 0.5, alignItems: 'center', minWidth: 70 },
  summaryVal:      { fontSize: 17, fontWeight: '800', letterSpacing: -0.5 },
  summaryLbl:      { fontSize: 9,  fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 2 },

  searchWrap:   { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginVertical: 8, borderRadius: 14, borderWidth: 0.5, paddingHorizontal: 12, height: 46, gap: 8 },
  searchInput:  { flex: 1, fontSize: 14, fontWeight: '500' },
  filterToggle: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, borderWidth: 0.5 },

  filtersBox:  { marginHorizontal: 16, marginBottom: 8, borderRadius: 16, borderWidth: 0.5, padding: 14 },
  filterLabel: { fontSize: 9, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 },
  chipRow:     { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },

  bulkBar:  { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 16, borderRadius: 12, padding: 10, marginBottom: 6, borderWidth: 0.5 },
  bulkBtn:  { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 999 },

  undoBar: { marginHorizontal: 16, borderRadius: 12, padding: 10, alignItems: 'center', marginBottom: 6 },

  list:  { paddingHorizontal: 16, paddingBottom: 120, paddingTop: 4 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60 },
  emptyEmoji: { fontSize: 48, marginBottom: 14 },
  emptyTitle: { fontSize: 20, fontWeight: '700', marginBottom: 6 },
  emptySub:   { fontSize: 14, textAlign: 'center', lineHeight: 21 },
  emptyBtn:   { marginTop: 20, backgroundColor: '#E50914', borderRadius: 999, paddingHorizontal: 24, paddingVertical: 13, shadowColor: '#E50914', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 5 },
  emptyBtnTxt: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
