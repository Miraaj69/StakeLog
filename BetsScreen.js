// BetsScreen.js — Premium v2: Indigo filters, empty state illustration, premium cards
import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, Pressable, TextInput, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown, Layout } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTheme } from './useTheme';
import { useStore, useStats } from './store';
import BetCard from './BetCard';
import AddBetModal from './AddBetModal';
import { formatMoney, getCurrencySymbol, makeForm } from './calculations';

var STATUSES    = ['All', 'Pending', 'Won', 'Lost', 'Void'];
var DATE_RANGES = [
  { key: 'all',   label: 'All time' },
  { key: 'today', label: 'Today'    },
  { key: 'week',  label: '7 days'   },
  { key: 'month', label: 'Month'    },
];
var SORTS = [
  { key: 'date_desc',  label: 'Newest'  },
  { key: 'date_asc',   label: 'Oldest'  },
  { key: 'stake_desc', label: 'Stake ↓' },
  { key: 'pnl_desc',   label: 'P&L ↓'  },
];

export default function BetsScreen() {
  var { colors, isDark } = useTheme();
  var bets         = useStore(function(s) { return s.bets; });
  var bookies      = useStore(function(s) { return s.bookies; });
  var sports       = useStore(function(s) { return s.sports; });
  var templates    = useStore(function(s) { return s.templates; });
  var currency     = useStore(function(s) { return s.currency; });
  var undoStack    = useStore(function(s) { return s.undoStack; });
  var addBet       = useStore(function(s) { return s.addBet; });
  var updateBet    = useStore(function(s) { return s.updateBet; });
  var deleteBet    = useStore(function(s) { return s.deleteBet; });
  var markStatus   = useStore(function(s) { return s.markStatus; });
  var duplicateBet = useStore(function(s) { return s.duplicateBet; });
  var bulkAction   = useStore(function(s) { return s.bulkAction; });
  var undo         = useStore(function(s) { return s.undo; });
  var stats        = useStats();
  var currSym      = getCurrencySymbol(currency);

  var [modalVisible, setModalVisible] = useState(false);
  var [editBet,      setEditBet]      = useState(null);
  var [search,       setSearch]       = useState('');
  var [filterStatus, setFilterStatus] = useState('All');
  var [dateRange,    setDateRange]    = useState('all');
  var [sortBy,       setSortBy]       = useState('date_desc');
  var [showFilters,  setShowFilters]  = useState(false);
  var [bulkMode,     setBulkMode]     = useState(false);
  var [selected,     setSelected]     = useState(new Set());

  var filtered = useMemo(function() {
    var now = new Date();
    return bets.filter(function(b) {
      if (filterStatus !== 'All' && b.status !== filterStatus) return false;
      if (search) {
        var q = search.toLowerCase();
        if (!b.event.toLowerCase().includes(q) && !b.bet.toLowerCase().includes(q) && !(b.tags || []).join(' ').toLowerCase().includes(q)) return false;
      }
      if (dateRange === 'today' && new Date(b.date).toDateString() !== now.toDateString()) return false;
      if (dateRange === 'week'  && (now - new Date(b.date)) / 86400000 > 7) return false;
      if (dateRange === 'month') { var d = new Date(b.date); if (d.getMonth() !== now.getMonth() || d.getFullYear() !== now.getFullYear()) return false; }
      return true;
    }).sort(function(a, b) {
      if (sortBy === 'date_desc')  return new Date(b.date) - new Date(a.date);
      if (sortBy === 'date_asc')   return new Date(a.date) - new Date(b.date);
      if (sortBy === 'stake_desc') return parseFloat(b.stake) - parseFloat(a.stake);
      if (sortBy === 'pnl_desc') {
        var pa = a.status === 'Won' ? parseFloat(a.stake) * (parseFloat(a.odds) - 1) : a.status === 'Lost' ? -parseFloat(a.stake) : 0;
        var pb = b.status === 'Won' ? parseFloat(b.stake) * (parseFloat(b.odds) - 1) : b.status === 'Lost' ? -parseFloat(b.stake) : 0;
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

  var handleWon  = function(id) { markStatus(id, 'Won');  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); };
  var handleLost = function(id) { markStatus(id, 'Lost'); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); };
  var toggleSelect = function(id) { setSelected(function(s) { var n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; }); };
  var handleBulk   = function(action) { bulkAction(Array.from(selected), action); setSelected(new Set()); setBulkMode(false); };

  var isProfit = stats.totalPnL >= 0;
  var summaryItems = [
    { key: 'pnl',     label: 'NET P&L',  value: (isProfit ? '+' : '') + formatMoney(stats.totalPnL, currSym), color: isProfit ? '#4ADE80' : '#F87171', bg: isProfit ? (isDark ? 'rgba(74,222,128,0.08)' : '#F0FBF4') : (isDark ? 'rgba(248,113,113,0.08)' : '#FDF2F2'), border: isProfit ? (isDark ? 'rgba(74,222,128,0.22)' : '#A7DFB9') : (isDark ? 'rgba(248,113,113,0.22)' : '#FCA5A5') },
    { key: 'wr',      label: 'WIN RATE', value: stats.winRate ? stats.winRate + '%' : '—',                     color: '#7C6BFF',           bg: isDark ? 'rgba(124,107,255,0.10)' : '#F5F3FF', border: isDark ? 'rgba(124,107,255,0.25)' : '#C4B5FD' },
    { key: 'won',     label: 'WON',      value: String(stats.wonCount),                                        color: '#4ADE80',           bg: isDark ? 'rgba(74,222,128,0.08)' : '#F0FBF4',  border: isDark ? 'rgba(74,222,128,0.22)' : '#A7DFB9' },
    { key: 'lost',    label: 'LOST',     value: String(stats.lostCount),                                       color: '#F87171',           bg: isDark ? 'rgba(248,113,113,0.08)' : '#FDF2F2', border: isDark ? 'rgba(248,113,113,0.22)' : '#FCA5A5' },
    { key: 'pending', label: 'PENDING',  value: String(stats.pendingCount),                                    color: '#F59E0B',           bg: isDark ? 'rgba(252,211,77,0.10)' : '#FFFBEB',  border: isDark ? 'rgba(252,211,77,0.25)' : '#FDE68A' },
  ];

  return (
    <SafeAreaView style={[s.screen, { backgroundColor: colors.background }]} edges={['top']}>

      {/* Top bar */}
      <View style={[s.topBar, { borderBottomColor: colors.border }]}>
        <Text style={[s.title, { color: colors.textPrimary }]}>My Bets</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Pressable
            onPress={() => { setShowFilters(function(v) { return !v; }); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
            style={[s.iconBtn, {
              backgroundColor: showFilters ? 'rgba(124,107,255,0.15)' : colors.surface,
              borderColor: showFilters ? 'rgba(124,107,255,0.3)' : colors.border,
            }]}
          >
            <Text style={{ fontSize: 16 }}>⚙️</Text>
          </Pressable>
          <Pressable
            onPress={() => { setEditBet(null); setModalVisible(true); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); }}
            style={[s.addBtn, { backgroundColor: '#7C6BFF' }]}
          >
            <Text style={{ color: '#fff', fontSize: 22, lineHeight: 26 }}>＋</Text>
          </Pressable>
        </View>
      </View>

      {/* Summary pills */}
      {bets.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.summaryRow} style={s.summaryScroll}>
          {summaryItems.map(function(item) {
            return (
              <View key={item.key} style={[s.summaryPill, { backgroundColor: item.bg, borderColor: item.border }]}>
                <Text style={[s.summaryVal, { color: item.color }]} numberOfLines={1} adjustsFontSizeToFit>{item.value}</Text>
                <Text style={[s.summaryLbl, { color: item.color, opacity: 0.7 }]}>{item.label}</Text>
              </View>
            );
          })}
        </ScrollView>
      )}

      {/* Search bar */}
      <View style={[s.searchRow, { backgroundColor: colors.surfaceVariant, borderColor: search ? '#7C6BFF' : colors.border }]}>
        <Text style={{ fontSize: 15, color: colors.textTertiary }}>🔍</Text>
        <TextInput
          style={[s.searchInput, { color: colors.textPrimary }]}
          value={search} onChangeText={setSearch}
          placeholder="Search events, bets, #tags..."
          placeholderTextColor={colors.textTertiary}
        />
        {search ? (
          <Pressable onPress={() => setSearch('')}>
            <Text style={{ color: colors.textTertiary, fontSize: 20 }}>×</Text>
          </Pressable>
        ) : null}
      </View>

      {/* Status filter chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 4 }}>
        <View style={{ flexDirection: 'row', gap: 7, paddingHorizontal: 16, paddingBottom: 8 }}>
          {STATUSES.map(function(st) {
            var active = filterStatus === st;
            return (
              <Pressable key={st} onPress={() => setFilterStatus(st)}
                style={[s.filterChip, {
                  backgroundColor: active ? '#7C6BFF' : colors.surface,
                  borderColor: active ? '#7C6BFF' : colors.border,
                }]}>
                <Text style={[s.filterChipTxt, { color: active ? '#fff' : colors.textTertiary }]}>{st}</Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      {/* Filter panel */}
      {showFilters && (
        <View style={[s.filterPanel, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[s.filterLabel, { color: colors.textTertiary }]}>DATE</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
            <View style={{ flexDirection: 'row', gap: 7 }}>
              {DATE_RANGES.map(function(dr) {
                var active = dateRange === dr.key;
                return (
                  <Pressable key={dr.key} onPress={() => setDateRange(dr.key)}
                    style={[s.filterChip, { backgroundColor: active ? 'rgba(124,107,255,0.15)' : colors.surfaceVariant, borderColor: active ? '#7C6BFF' : colors.border }]}>
                    <Text style={[s.filterChipTxt, { color: active ? '#7C6BFF' : colors.textTertiary }]}>{dr.label}</Text>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>
          <Text style={[s.filterLabel, { color: colors.textTertiary }]}>SORT</Text>
          <View style={{ flexDirection: 'row', gap: 7, flexWrap: 'wrap' }}>
            {SORTS.map(function(so) {
              var active = sortBy === so.key;
              return (
                <Pressable key={so.key} onPress={() => setSortBy(so.key)}
                  style={[s.filterChip, { backgroundColor: active ? '#7C6BFF' : colors.surfaceVariant, borderColor: active ? '#7C6BFF' : colors.border }]}>
                  <Text style={[s.filterChipTxt, { color: active ? '#fff' : colors.textTertiary }]}>{so.label}</Text>
                </Pressable>
              );
            })}
            <Pressable onPress={() => { setBulkMode(function(v) { return !v; }); setSelected(new Set()); }}
              style={[s.filterChip, { backgroundColor: bulkMode ? '#7C6BFF' : colors.surfaceVariant, borderColor: bulkMode ? '#7C6BFF' : colors.border }]}>
              <Text style={[s.filterChipTxt, { color: bulkMode ? '#fff' : colors.textTertiary }]}>☑ Bulk</Text>
            </Pressable>
          </View>
        </View>
      )}

      {/* Bulk bar */}
      {bulkMode && selected.size > 0 && (
        <View style={[s.bulkBar, { backgroundColor: 'rgba(124,107,255,0.10)', borderColor: 'rgba(124,107,255,0.25)' }]}>
          <Text style={{ color: '#7C6BFF', fontWeight: '700', flex: 1, fontSize: 13 }}>{selected.size} selected</Text>
          <Pressable onPress={() => handleBulk('won')}  style={[s.bulkBtn, { backgroundColor: 'rgba(74,222,128,0.12)' }]}><Text style={{ color: '#4ADE80', fontWeight: '700', fontSize: 12 }}>✓ Won</Text></Pressable>
          <Pressable onPress={() => handleBulk('lost')} style={[s.bulkBtn, { backgroundColor: 'rgba(248,113,113,0.10)' }]}><Text style={{ color: '#F87171', fontWeight: '700', fontSize: 12 }}>✕ Lost</Text></Pressable>
          <Pressable onPress={() => Alert.alert('Delete ' + selected.size + ' bets?', '', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Delete', style: 'destructive', onPress: () => handleBulk('delete') },
          ])} style={[s.bulkBtn, { backgroundColor: 'rgba(248,113,113,0.10)' }]}>
            <Text style={{ color: '#F87171', fontWeight: '700', fontSize: 12 }}>🗑</Text>
          </Pressable>
        </View>
      )}

      {/* Undo bar */}
      {undoStack.length > 0 && (
        <Pressable onPress={undo} style={[s.undoBar, { backgroundColor: '#7C6BFF' }]}>
          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>↩ Undo last action</Text>
        </Pressable>
      )}

      {/* Bet list */}
      <FlatList
        data={filtered}
        keyExtractor={function(item) { return String(item.id); }}
        renderItem={function(ref) {
          return (
            <Animated.View entering={FadeInDown.delay(Math.min(ref.index * 40, 300)).springify()} layout={Layout.springify()}>
              <BetCard
                bet={ref.item} hidden={false} currSym={currSym}
                onEdit={function(b) { setEditBet(b); setModalVisible(true); }}
                onDelete={deleteBet} onWon={handleWon} onLost={handleLost}
                onDuplicate={duplicateBet} onSlip={function() {}}
                bulkMode={bulkMode} selected={selected.has(ref.item.id)} onSelect={toggleSelect}
              />
            </Animated.View>
          );
        }}
        contentContainerStyle={[s.list, filtered.length === 0 && { flex: 1 }]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={s.empty}>
            <Text style={s.emptyIllus}>{bets.length === 0 ? '🎯' : '🔍'}</Text>
            <Text style={[s.emptyTitle, { color: colors.textPrimary }]}>
              {bets.length === 0 ? 'No bets yet' : 'No results found'}
            </Text>
            <Text style={[s.emptySub, { color: colors.textTertiary }]}>
              {bets.length === 0
                ? 'Tap + to log your first bet and start tracking your performance'
                : 'Try adjusting your search or filters'}
            </Text>
            {bets.length === 0 && (
              <Pressable
                onPress={() => { setEditBet(null); setModalVisible(true); }}
                style={[s.emptyCta, { backgroundColor: '#7C6BFF' }]}
              >
                <Text style={s.emptyCtaTxt}>+ Add First Bet</Text>
              </Pressable>
            )}
          </View>
        }
      />

      <AddBetModal
        visible={modalVisible}
        onClose={() => { setModalVisible(false); setEditBet(null); }}
        onSave={handleSave} editBet={editBet}
        bookies={bookies} sports={sports} templates={templates}
        suggestStake={stats.suggestedStake} currSym={currSym}
      />
    </SafeAreaView>
  );
}

var s = StyleSheet.create({
  screen: { flex: 1 },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 0.5 },
  title:  { fontSize: 24, fontWeight: '800', letterSpacing: -0.6 },
  iconBtn:{ width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', borderWidth: 0.5 },
  addBtn: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },

  summaryScroll:  { flexGrow: 0, maxHeight: 72 },
  summaryRow:     { paddingHorizontal: 16, paddingVertical: 10, gap: 8, flexDirection: 'row', alignItems: 'center' },
  summaryPill:    { borderRadius: 14, paddingHorizontal: 12, paddingVertical: 9, borderWidth: 0.5, alignItems: 'center', minWidth: 72 },
  summaryVal:     { fontSize: 15, fontWeight: '800', letterSpacing: -0.3 },
  summaryLbl:     { fontSize: 9,  fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.4, marginTop: 2 },

  searchRow:   { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginBottom: 8, borderRadius: 14, borderWidth: 0.5, paddingHorizontal: 12, height: 46, gap: 8 },
  searchInput: { flex: 1, fontSize: 14, fontWeight: '500' },

  filterChip:    { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 999, borderWidth: 0.5 },
  filterChipTxt: { fontSize: 12, fontWeight: '700' },

  filterPanel: { marginHorizontal: 16, marginBottom: 8, borderRadius: 18, borderWidth: 0.5, padding: 14 },
  filterLabel: { fontSize: 9, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 },

  bulkBar: { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 16, borderRadius: 14, padding: 10, marginBottom: 6, borderWidth: 0.5 },
  bulkBtn: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 999 },
  undoBar: { marginHorizontal: 16, borderRadius: 14, padding: 11, alignItems: 'center', marginBottom: 6 },

  list:       { paddingHorizontal: 16, paddingBottom: 120, paddingTop: 4 },
  empty:      { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyIllus: { fontSize: 64, marginBottom: 18, opacity: 0.75 },
  emptyTitle: { fontSize: 20, fontWeight: '800', marginBottom: 10, letterSpacing: -0.4 },
  emptySub:   { fontSize: 14, textAlign: 'center', lineHeight: 22, marginBottom: 28 },
  emptyCta:   { borderRadius: 999, paddingHorizontal: 28, paddingVertical: 14, shadowColor: '#7C6BFF', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 12, elevation: 6 },
  emptyCtaTxt:{ color: '#fff', fontWeight: '700', fontSize: 15 },
});
