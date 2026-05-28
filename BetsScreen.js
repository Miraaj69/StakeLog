// BetsScreen.js — Material 3 Expressive · Pixel flagship
// Tonal surfaces · Spring chips · Clean date sections · Zero blur

import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, SectionList, StyleSheet, Pressable,
  TextInput, ScrollView, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  FadeInDown, FadeIn, Layout,
  useSharedValue, useAnimatedStyle, withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTheme } from './useTheme';
import { useStore, useStats } from './store';
import BetCard from './BetCard';
import AddBetModal from './AddBetModal';
import QuickBet from './QuickBet';
import { formatMoney, getCurrencySymbol } from './calculations';

// ─── CONSTANTS ───────────────────────────────────────────────────
const STATUSES   = ['All', 'Pending', 'Won', 'Lost', 'Void'];
const DATE_RANGES = [
  { key: 'all',   label: 'All time' },
  { key: 'today', label: 'Today'    },
  { key: 'week',  label: '7 days'   },
  { key: 'month', label: 'Month'    },
];
const SORTS = [
  { key: 'date_desc',  label: 'Newest'   },
  { key: 'date_asc',   label: 'Oldest'   },
  { key: 'stake_desc', label: 'Stake ↓'  },
  { key: 'pnl_desc',   label: 'P&L ↓'   },
];

// M3 status semantic colors
const STATUS_CFG = {
  Won:     { bg: 'rgba(0,191,111,0.09)',  border: 'rgba(0,191,111,0.22)',  text: '#00BF6F' },
  Lost:    { bg: 'rgba(255,68,68,0.09)',  border: 'rgba(255,68,68,0.22)',  text: '#FF4444' },
  Pending: { bg: 'rgba(255,179,71,0.09)', border: 'rgba(255,179,71,0.22)', text: '#FFB347' },
  Void:    { bg: 'rgba(138,138,160,0.08)',border: 'rgba(138,138,160,0.18)',text: '#8A8AA0' },
  All:     { bg: 'rgba(255,75,106,0.09)', border: 'rgba(255,75,106,0.22)', text: '#FF4B6A' },
};

function formatDateLabel(d) {
  const now = new Date();
  if (new Date(d).toDateString() === now.toDateString())
    return 'Today';
  if (new Date(d).toDateString() === new Date(now - 86400000).toDateString())
    return 'Yesterday';
  return new Date(d).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

// ─── DATE SECTION HEADER ─────────────────────────────────────────
function DateHeader({ title, dayPnL, currSym, colors }) {
  const isPos  = dayPnL > 0;
  const hasRes = dayPnL !== 0;
  return (
    <View style={[dh.row, { backgroundColor: colors.background }]}>
      <View style={[dh.line, { backgroundColor: colors.border }]} />
      <View style={[dh.pill, {
        backgroundColor: colors.surfaceVariant,
        borderColor:     colors.border,
      }]}>
        <Text style={[dh.date, { color: colors.textSecondary }]}>{title}</Text>
        {hasRes && (
          <View style={[dh.badge, {
            backgroundColor: isPos
              ? 'rgba(0,191,111,0.1)'
              : 'rgba(255,68,68,0.09)',
          }]}>
            <Text style={[dh.badgeTxt, {
              color: isPos ? '#00BF6F' : '#FF4444',
            }]}>
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
  row:      { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  line:     { flex: 1, height: 0.5 },
  pill:     { flexDirection: 'row', alignItems: 'center', gap: 7,
              paddingHorizontal: 14, paddingVertical: 6, borderRadius: 999,
              borderWidth: 0.5, marginHorizontal: 12 },
  date:     { fontSize: 11, fontWeight: '700' },
  badge:    { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999 },
  badgeTxt: { fontSize: 11, fontWeight: '800' },
});

// ─── SUMMARY PILL ────────────────────────────────────────────────
function SummaryPill({ item }) {
  return (
    <View style={[sp.pill, {
      backgroundColor: item.bg,
      borderColor:     item.border,
    }]}>
      <Text style={[sp.value, { color: item.color }]} adjustsFontSizeToFit numberOfLines={1}>
        {item.value}
      </Text>
      <Text style={[sp.label, { color: item.color }]}>{item.label}</Text>
    </View>
  );
}
const sp = StyleSheet.create({
  pill:  { borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10,
           borderWidth: 1, alignItems: 'center', minWidth: 72 },
  value: { fontSize: 16, fontWeight: '800', letterSpacing: -0.4 },
  label: { fontSize: 9, fontWeight: '700', textTransform: 'uppercase',
           letterSpacing: 0.8, marginTop: 2, opacity: 0.6 },
});

// ─── FILTER CHIP ─────────────────────────────────────────────────
function Chip({ label, active, onPress, activeBg, activeBorder, activeColor, colors }) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  return (
    <Animated.View style={animStyle}>
      <Pressable
        onPressIn={() => {
          scale.value = withSpring(0.93, { damping: 20, stiffness: 400 });
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }}
        onPressOut={() => {
          scale.value = withSpring(1, { damping: 20, stiffness: 400 });
        }}
        onPress={onPress}
        style={[ch.chip, {
          backgroundColor: active
            ? (activeBg   || 'rgba(255,75,106,0.1)')
            : colors.surfaceVariant,
          borderColor: active
            ? (activeBorder || 'rgba(255,75,106,0.3)')
            : colors.border,
        }]}
      >
        <Text style={[ch.txt, {
          color: active
            ? (activeColor || '#FF4B6A')
            : colors.textTertiary,
          fontWeight: active ? '700' : '500',
        }]}>
          {label}
        </Text>
      </Pressable>
    </Animated.View>
  );
}
const ch = StyleSheet.create({
  chip: { paddingHorizontal: 15, paddingVertical: 7,
          borderRadius: 999, borderWidth: 1 },
  txt:  { fontSize: 12 },
});

// ─── SEARCH BAR ──────────────────────────────────────────────────
function SearchBar({ value, onChange, focused, onFocus, onBlur, showFilters, onToggleFilters, colors }) {
  return (
    <View style={[sb.wrap, {
      backgroundColor: colors.surfaceVariant,
      borderColor:     focused ? '#FF4B6A' : colors.border,
      shadowColor:     focused ? '#FF4B6A' : 'transparent',
      shadowOpacity:   focused ? 0.18 : 0,
      shadowRadius:    8,
      shadowOffset:    { width: 0, height: 0 },
      elevation:       focused ? 0 : 0,
    }]}>
      <Text style={{ fontSize: 15, opacity: 0.45 }}>🔍</Text>
      <TextInput
        style={[sb.input, { color: colors.textPrimary }]}
        value={value}
        onChangeText={onChange}
        onFocus={onFocus}
        onBlur={onBlur}
        placeholder="Search events, bets, tags…"
        placeholderTextColor={colors.textTertiary}
      />
      {value ? (
        <Pressable onPress={() => onChange('')} hitSlop={8}>
          <Text style={{ color: colors.textTertiary, fontSize: 18, fontWeight: '300' }}>×</Text>
        </Pressable>
      ) : null}
      <Pressable
        onPress={() => {
          onToggleFilters();
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }}
        style={[sb.filterBtn, {
          backgroundColor: showFilters ? '#FF4B6A' : colors.surfaceContainer || colors.surface,
          borderColor:     showFilters ? '#FF4B6A' : colors.border,
        }]}
      >
        <Text style={[sb.filterTxt, { color: showFilters ? '#fff' : colors.textSecondary }]}>
          {showFilters ? '✕' : '⊞'} Filter
        </Text>
      </Pressable>
    </View>
  );
}
const sb = StyleSheet.create({
  wrap:      { flexDirection: 'row', alignItems: 'center',
               marginHorizontal: 16, marginBottom: 10,
               borderRadius: 16, borderWidth: 1,
               paddingHorizontal: 14, height: 48, gap: 10 },
  input:     { flex: 1, fontSize: 14, fontWeight: '500' },
  filterBtn: { paddingHorizontal: 11, paddingVertical: 6,
               borderRadius: 12, borderWidth: 1 },
  filterTxt: { fontSize: 11, fontWeight: '700' },
});

// ─── FILTER PANEL ────────────────────────────────────────────────
function FilterPanel({ filterStatus, setFilterStatus, dateRange, setDateRange,
  sortBy, setSortBy, bulkMode, setBulkMode, setSelected, colors }) {

  const FLbl = ({ t }) => (
    <Text style={[fp.lbl, { color: colors.textTertiary }]}>{t}</Text>
  );

  return (
    <Animated.View
      entering={FadeInDown.duration(280).springify().damping(28)}
      style={[fp.panel, {
        backgroundColor: colors.surfaceVariant,
        borderColor:     colors.border,
      }]}
    >
      <FLbl t="Status" />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
        <View style={fp.row}>
          {STATUSES.map(st => {
            const cfg = STATUS_CFG[st] || STATUS_CFG.Void;
            return (
              <Chip
                key={st} label={st}
                active={filterStatus === st}
                onPress={() => setFilterStatus(st)}
                activeBg={cfg.bg} activeBorder={cfg.border} activeColor={cfg.text}
                colors={colors}
              />
            );
          })}
        </View>
      </ScrollView>

      <FLbl t="Date range" />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
        <View style={fp.row}>
          {DATE_RANGES.map(dr => (
            <Chip key={dr.key} label={dr.label}
              active={dateRange === dr.key}
              onPress={() => setDateRange(dr.key)}
              colors={colors}
            />
          ))}
        </View>
      </ScrollView>

      <FLbl t="Sort by" />
      <View style={fp.row}>
        {SORTS.map(so => {
          const active = sortBy === so.key;
          return (
            <Chip key={so.key} label={so.label}
              active={active}
              onPress={() => setSortBy(so.key)}
              activeBg="rgba(255,75,106,0.1)"
              activeBorder="rgba(255,75,106,0.3)"
              activeColor="#FF4B6A"
              colors={colors}
            />
          );
        })}
        <Chip
          label="☑ Bulk"
          active={bulkMode}
          onPress={() => { setBulkMode(v => !v); setSelected(new Set()); }}
          activeBg="rgba(255,75,106,0.1)"
          activeBorder="rgba(255,75,106,0.3)"
          activeColor="#FF4B6A"
          colors={colors}
        />
      </View>
    </Animated.View>
  );
}
const fp = StyleSheet.create({
  panel: { marginHorizontal: 16, marginBottom: 10, borderRadius: 22,
           borderWidth: 1, padding: 16 },
  lbl:   { fontSize: 9, fontWeight: '700', textTransform: 'uppercase',
           letterSpacing: 1.3, marginBottom: 10 },
  row:   { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
});

// ─── MAIN SCREEN ─────────────────────────────────────────────────
export default function BetsScreen() {
  const { colors, isDark } = useTheme();
  const bets         = useStore(s => s.bets);
  const bookies      = useStore(s => s.bookies);
  const sports       = useStore(s => s.sports);
  const templates    = useStore(s => s.templates);
  const currency     = useStore(s => s.currency);
  const undoStack    = useStore(s => s.undoStack);
  const addBet       = useStore(s => s.addBet);
  const updateBet    = useStore(s => s.updateBet);
  const deleteBet    = useStore(s => s.deleteBet);
  const markStatus   = useStore(s => s.markStatus);
  const duplicateBet = useStore(s => s.duplicateBet);
  const bulkAction   = useStore(s => s.bulkAction);
  const undo         = useStore(s => s.undo);
  const stats        = useStats();
  const currSym      = getCurrencySymbol(currency);

  const [modal,       setModal]       = useState(false);
  const [quickBet,    setQuickBet]    = useState(false);
  const [editBet,     setEditBet]     = useState(null);
  const [search,      setSearch]      = useState('');
  const [searchFocus, setSearchFocus] = useState(false);
  const [filterStatus,setFilterStatus]= useState('All');
  const [dateRange,   setDateRange]   = useState('all');
  const [sortBy,      setSortBy]      = useState('date_desc');
  const [showFilters, setShowFilters] = useState(false);
  const [bulkMode,    setBulkMode]    = useState(false);
  const [selected,    setSelected]    = useState(new Set());

  // ── Filter + sort ───────────────────────────────────────────
  const filtered = useMemo(() => {
    const now = new Date();
    return bets.filter(b => {
      if (filterStatus !== 'All' && b.status !== filterStatus) return false;
      if (search) {
        const q = search.toLowerCase();
        if (
          !b.event.toLowerCase().includes(q) &&
          !b.bet.toLowerCase().includes(q) &&
          !(b.tags || []).join(' ').toLowerCase().includes(q)
        ) return false;
      }
      if (dateRange === 'today' &&
        new Date(b.date).toDateString() !== now.toDateString()) return false;
      if (dateRange === 'week' &&
        (now - new Date(b.date)) / 86400000 > 7) return false;
      if (dateRange === 'month') {
        const d = new Date(b.date);
        if (d.getMonth() !== now.getMonth() ||
          d.getFullYear() !== now.getFullYear()) return false;
      }
      return true;
    }).sort((a, b2) => {
      if (sortBy === 'date_desc')  return new Date(b2.date) - new Date(a.date);
      if (sortBy === 'date_asc')   return new Date(a.date) - new Date(b2.date);
      if (sortBy === 'stake_desc') return parseFloat(b2.stake) - parseFloat(a.stake);
      if (sortBy === 'pnl_desc') {
        const pa = a.status === 'Won'  ? parseFloat(a.stake) * (parseFloat(a.odds) - 1)
                 : a.status === 'Lost' ? -parseFloat(a.stake) : 0;
        const pb = b2.status === 'Won'  ? parseFloat(b2.stake) * (parseFloat(b2.odds) - 1)
                 : b2.status === 'Lost' ? -parseFloat(b2.stake) : 0;
        return pb - pa;
      }
      return 0;
    });
  }, [bets, filterStatus, search, dateRange, sortBy]);

  // ── Date sections ────────────────────────────────────────────
  const sections = useMemo(() => {
    const groups = {}, order = [];
    filtered.forEach(bet => {
      const dk = bet.date || 'Unknown';
      if (!groups[dk]) { groups[dk] = []; order.push(dk); }
      groups[dk].push(bet);
    });
    return order.map(dk => {
      const day = groups[dk];
      const pnl = day.reduce((acc, b) => {
        if (b.status === 'Won')  return acc + parseFloat(b.stake) * (parseFloat(b.odds) - 1);
        if (b.status === 'Lost') return acc - parseFloat(b.stake);
        return acc;
      }, 0);
      return { title: dk, displayTitle: formatDateLabel(dk), dayPnL: pnl, data: day };
    });
  }, [filtered]);

  const handleSave = useCallback(async (form) => {
    if (editBet) await updateBet({ ...form, id: editBet.id });
    else await addBet(form);
    setEditBet(null);
  }, [editBet, addBet, updateBet]);

  const handleWon  = (id) => { markStatus(id, 'Won');  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); };
  const handleLost = (id) => { markStatus(id, 'Lost'); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); };
  const toggleSel  = (id) => setSelected(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const handleBulk = (action) => { bulkAction(Array.from(selected), action); setSelected(new Set()); setBulkMode(false); };

  const isPos = stats.totalPnL >= 0;
  const summaryItems = [
    {
      key: 'pnl', label: 'P&L',
      value: (isPos ? '+' : '') + formatMoney(stats.totalPnL, currSym),
      color: isPos ? '#00BF6F' : '#FF4444',
      bg: isPos ? 'rgba(0,191,111,0.09)' : 'rgba(255,68,68,0.08)',
      border: isPos ? 'rgba(0,191,111,0.22)' : 'rgba(255,68,68,0.2)',
    },
    {
      key: 'wr', label: 'Win Rate',
      value: stats.winRate ? `${stats.winRate}%` : '—',
      color: colors.textPrimary,
      bg: colors.surfaceVariant, border: colors.border,
    },
    {
      key: 'won', label: 'Won',
      value: String(stats.wonCount),
      color: '#00BF6F',
      bg: 'rgba(0,191,111,0.09)', border: 'rgba(0,191,111,0.22)',
    },
    {
      key: 'lost', label: 'Lost',
      value: String(stats.lostCount),
      color: '#FF4444',
      bg: 'rgba(255,68,68,0.08)', border: 'rgba(255,68,68,0.2)',
    },
    {
      key: 'pend', label: 'Pending',
      value: String(stats.pendingCount),
      color: '#FFB347',
      bg: 'rgba(255,179,71,0.09)', border: 'rgba(255,179,71,0.22)',
    },
  ];

  return (
    <SafeAreaView style={[s.screen, { backgroundColor: colors.background }]} edges={['top']}>

      {/* ── Header ── */}
      <View style={[s.topBar, { borderBottomColor: colors.border }]}>
        <View>
          <Text style={[s.title, { color: colors.textPrimary }]}>My Bets</Text>
          <Text style={[s.sub, { color: colors.textTertiary }]}>
            {stats.totalBets} bets · {stats.winRate ?? '—'}% win rate
          </Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {/* Quick add */}
          <Pressable
            onPress={() => {
              setQuickBet(true);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            }}
            style={[s.hBtn, { backgroundColor: 'rgba(91,141,239,0.12)' }]}
          >
            <Text style={{ color: '#5B8DEF', fontSize: 15 }}>⚡</Text>
          </Pressable>
          {/* Add bet */}
          <Pressable
            onPress={() => {
              setEditBet(null);
              setModal(true);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            }}
            style={[s.hBtn, { backgroundColor: 'rgba(255,75,106,0.12)' }]}
          >
            <Text style={{ color: '#FF4B6A', fontSize: 21, lineHeight: 26 }}>＋</Text>
          </Pressable>
        </View>
      </View>

      {/* ── Summary strip ── */}
      {bets.length > 0 && (
        <ScrollView
          horizontal showsHorizontalScrollIndicator={false}
          style={s.summaryScroll}
          contentContainerStyle={s.summaryContent}
        >
          {summaryItems.map(item => <SummaryPill key={item.key} item={item} />)}
        </ScrollView>
      )}

      {/* ── Search ── */}
      <SearchBar
        value={search} onChange={setSearch}
        focused={searchFocus}
        onFocus={() => setSearchFocus(true)}
        onBlur={() => setSearchFocus(false)}
        showFilters={showFilters}
        onToggleFilters={() => setShowFilters(v => !v)}
        colors={colors}
      />

      {/* ── Filter panel ── */}
      {showFilters && (
        <FilterPanel
          filterStatus={filterStatus} setFilterStatus={setFilterStatus}
          dateRange={dateRange}       setDateRange={setDateRange}
          sortBy={sortBy}             setSortBy={setSortBy}
          bulkMode={bulkMode}         setBulkMode={setBulkMode}
          setSelected={setSelected}   colors={colors}
        />
      )}

      {/* ── Bulk action bar ── */}
      {bulkMode && selected.size > 0 && (
        <Animated.View
          entering={FadeIn.duration(220)}
          style={[s.bulkBar, {
            backgroundColor: 'rgba(255,75,106,0.07)',
            borderColor:     'rgba(255,75,106,0.2)',
          }]}
        >
          <Text style={[s.bulkCount, { color: '#FF4B6A' }]}>
            {selected.size} selected
          </Text>
          <Pressable onPress={() => handleBulk('won')} style={[s.bulkBtn, { backgroundColor: 'rgba(0,191,111,0.1)' }]}>
            <Text style={{ color: '#00BF6F', fontWeight: '700', fontSize: 12 }}>✓ Won</Text>
          </Pressable>
          <Pressable onPress={() => handleBulk('lost')} style={[s.bulkBtn, { backgroundColor: 'rgba(255,68,68,0.1)' }]}>
            <Text style={{ color: '#FF4444', fontWeight: '700', fontSize: 12 }}>✕ Lost</Text>
          </Pressable>
          <Pressable
            onPress={() => Alert.alert('Delete?', `Remove ${selected.size} bets?`, [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Delete', style: 'destructive', onPress: () => handleBulk('delete') },
            ])}
            style={[s.bulkBtn, { backgroundColor: 'rgba(255,68,68,0.1)' }]}
          >
            <Text style={{ color: '#FF4444', fontWeight: '700', fontSize: 12 }}>🗑</Text>
          </Pressable>
        </Animated.View>
      )}

      {/* ── Undo bar ── */}
      {undoStack.length > 0 && (
        <Pressable onPress={undo} style={[s.undoBar, { backgroundColor: colors.textPrimary }]}>
          <Text style={{ color: colors.background, fontWeight: '700', fontSize: 13 }}>
            ↩ Undo last action
          </Text>
        </Pressable>
      )}

      {/* ── Bet list ── */}
      <SectionList
        sections={sections}
        keyExtractor={item => String(item.id)}
        renderSectionHeader={({ section }) => (
          <DateHeader
            title={section.displayTitle}
            dayPnL={section.dayPnL}
            currSym={currSym}
            colors={colors}
          />
        )}
        renderItem={({ item, index }) => (
          <Animated.View
            entering={FadeInDown.delay(Math.min(index * 30, 180)).springify().damping(26)}
            layout={Layout.springify()}
          >
            <BetCard
              bet={item} hidden={false} currSym={currSym}
              onEdit={b => { setEditBet(b); setModal(true); }}
              onDelete={deleteBet}
              onWon={handleWon} onLost={handleLost}
              onDuplicate={duplicateBet} onSlip={() => {}}
              bulkMode={bulkMode}
              selected={selected.has(item.id)}
              onSelect={toggleSel}
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
              {bets.length === 0
                ? 'Tap ＋ to log your first bet'
                : 'Try adjusting your filters'}
            </Text>
            {bets.length === 0 && (
              <Pressable
                onPress={() => { setEditBet(null); setModal(true); }}
                style={s.emptyBtn}
              >
                <Text style={s.emptyBtnTxt}>＋ Add First Bet</Text>
              </Pressable>
            )}
          </View>
        }
      />

      {/* ── Modals ── */}
      <AddBetModal
        visible={modal}
        onClose={() => { setModal(false); setEditBet(null); }}
        onSave={handleSave}
        editBet={editBet}
        bookies={bookies} sports={sports} templates={templates}
        suggestStake={stats.suggestedStake} currSym={currSym}
      />
      <QuickBet
        visible={quickBet}
        onClose={() => setQuickBet(false)}
        onSave={addBet}
        currSym={currSym}
        suggestStake={stats.suggestedStake}
      />
    </SafeAreaView>
  );
}

// ─── STYLES ──────────────────────────────────────────────────────
const s = StyleSheet.create({
  screen: { flex: 1 },

  // Header
  topBar: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingHorizontal: 16,
    paddingTop: 12, paddingBottom: 14,
    borderBottomWidth: 0.5,
  },
  title:  { fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
  sub:    { fontSize: 11, fontWeight: '600', marginTop: 2, letterSpacing: 0.1 },
  hBtn:   { width: 40, height: 40, borderRadius: 14,
            alignItems: 'center', justifyContent: 'center' },

  // Summary
  summaryScroll:   { flexGrow: 0 },
  summaryContent:  { paddingHorizontal: 16, paddingVertical: 12,
                     gap: 8, flexDirection: 'row', alignItems: 'center' },

  // Bulk
  bulkBar:   { flexDirection: 'row', alignItems: 'center', gap: 8,
               marginHorizontal: 16, borderRadius: 16, padding: 12,
               marginBottom: 8, borderWidth: 1 },
  bulkCount: { flex: 1, fontWeight: '700', fontSize: 13 },
  bulkBtn:   { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999 },

  // Undo
  undoBar: { marginHorizontal: 16, borderRadius: 14, padding: 11,
             alignItems: 'center', marginBottom: 8 },

  // List
  list:  { paddingHorizontal: 16, paddingBottom: 140, paddingTop: 4 },

  // Empty
  empty:      { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60 },
  emptyEmoji: { fontSize: 52, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: '800', marginBottom: 6, letterSpacing: -0.3 },
  emptySub:   { fontSize: 14, textAlign: 'center', lineHeight: 21 },
  emptyBtn:   {
    marginTop: 22,
    backgroundColor: '#FF4B6A',
    borderRadius: 999,
    paddingHorizontal: 28,
    paddingVertical: 14,
    shadowColor: '#FF4B6A',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  emptyBtnTxt: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
