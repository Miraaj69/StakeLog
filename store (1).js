// store.js — Single Source of Truth
import { create } from 'zustand';
import { getItem, setItem, KEYS } from './storage';
import { DEFAULT_BOOKIES, DEFAULT_SPORTS } from './calculations';
import { useMemo } from 'react';

// ── Pure stats calculator — ONE place, used everywhere ──
export function calcStats(bets, bankrollStart) {
  var won   = bets.filter(function(b) { return b.status === 'Won'; });
  var lost  = bets.filter(function(b) { return b.status === 'Lost'; });
  var pending = bets.filter(function(b) { return b.status === 'Pending'; });

  var totalPnL = bets.reduce(function(sum, b) {
    if (b.status === 'Won')  return sum + parseFloat(b.stake) * (parseFloat(b.odds) - 1);
    if (b.status === 'Lost') return sum - parseFloat(b.stake);
    return sum;
  }, 0);

  var totalStake = bets
    .filter(function(b) { return b.status !== 'Void'; })
    .reduce(function(sum, b) { return sum + parseFloat(b.stake || 0); }, 0);

  var wonCount     = won.length;
  var lostCount    = lost.length;
  var pendingCount = pending.length;
  var totalBets    = bets.length;

  var winRate = wonCount + lostCount > 0
    ? ((wonCount / (wonCount + lostCount)) * 100).toFixed(0)
    : null;

  var roi = bankrollStart > 0
    ? ((totalPnL / bankrollStart) * 100).toFixed(1)
    : totalStake > 0
    ? ((totalPnL / totalStake) * 100).toFixed(1)
    : null;

  var currentBalance = parseFloat(bankrollStart || 0) + totalPnL;

  // Today / Week / Month P&L
  var now = new Date();
  var todayStr = now.toDateString();
  var todayPnL = bets.filter(function(b) {
    return new Date(b.date).toDateString() === todayStr;
  }).reduce(function(s, b) {
    if (b.status === 'Won')  return s + parseFloat(b.stake) * (parseFloat(b.odds) - 1);
    if (b.status === 'Lost') return s - parseFloat(b.stake);
    return s;
  }, 0);

  var weekPnL = bets.filter(function(b) {
    return (now - new Date(b.date)) / 86400000 <= 7;
  }).reduce(function(s, b) {
    if (b.status === 'Won')  return s + parseFloat(b.stake) * (parseFloat(b.odds) - 1);
    if (b.status === 'Lost') return s - parseFloat(b.stake);
    return s;
  }, 0);

  var monthPnL = bets.filter(function(b) {
    var d = new Date(b.date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).reduce(function(s, b) {
    if (b.status === 'Won')  return s + parseFloat(b.stake) * (parseFloat(b.odds) - 1);
    if (b.status === 'Lost') return s - parseFloat(b.stake);
    return s;
  }, 0);

  // Streak
  var settled = bets
    .filter(function(b) { return b.status === 'Won' || b.status === 'Lost'; })
    .slice().sort(function(a, b) { return new Date(b.date) - new Date(a.date); });

  var streak = { current: 0, type: null, best: 0 };
  if (settled.length > 0) {
    var cur = 1, type = settled[0].status, best = 1, tmp = 1;
    for (var i = 1; i < settled.length; i++) {
      tmp = settled[i].status === settled[i-1].status ? tmp + 1 : 1;
      if (tmp > best) best = tmp;
    }
    for (var j = 1; j < settled.length; j++) {
      if (settled[j].status === type) cur++;
      else break;
    }
    streak = { current: cur, type: type, best: best };
  }

  // Suggested stake (2% rule)
  var suggestedStake = currentBalance > 0 ? currentBalance * 0.02 : null;

  return {
    totalPnL, totalStake, wonCount, lostCount, pendingCount, totalBets,
    winRate, roi, currentBalance, streak,
    todayPnL, weekPnL, monthPnL,
    suggestedStake,
  };
}

// ── Zustand store ──
export var useStore = create(function(set, get) {
  return {
    bets: [],
    bookies: DEFAULT_BOOKIES,
    sports: DEFAULT_SPORTS,
    bankrollStart: 0,
    templates: [],
    loading: true,
    undoStack: [],
    currency: 'INR',

    init: async function() {
      var r = await Promise.all([
        getItem(KEYS.BETS, []),
        getItem(KEYS.BOOKIES, null),
        getItem(KEYS.SPORTS, null),
        getItem(KEYS.BANKROLL, 0),
        getItem(KEYS.TEMPLATES, []),
        getItem(KEYS.CURRENCY, 'INR'),
      ]);
      set({
        bets: r[0], bookies: r[1] || DEFAULT_BOOKIES,
        sports: r[2] || DEFAULT_SPORTS, bankrollStart: r[3],
        templates: r[4], currency: r[5], loading: false,
      });
    },

    addBet: async function(betData) {
      var newBet = Object.assign({}, betData, { id: Date.now() });
      var bets = [newBet].concat(get().bets);
      set({ bets: bets });
      await setItem(KEYS.BETS, bets);
      return newBet;
    },

    updateBet: async function(updated) {
      var prev = get().bets.find(function(b) { return b.id === updated.id; });
      var bets = get().bets.map(function(b) { return b.id === updated.id ? updated : b; });
      set({ bets: bets, undoStack: [{ type: 'edit', prev: prev }].concat(get().undoStack.slice(0, 9)) });
      await setItem(KEYS.BETS, bets);
    },

    deleteBet: async function(id) {
      var prev = get().bets.find(function(b) { return b.id === id; });
      var bets = get().bets.filter(function(b) { return b.id !== id; });
      set({ bets: bets, undoStack: [{ type: 'delete', prev: prev }].concat(get().undoStack.slice(0, 9)) });
      await setItem(KEYS.BETS, bets);
      return prev;
    },

    markStatus: async function(id, status) {
      var prev = get().bets.find(function(b) { return b.id === id; });
      var bets = get().bets.map(function(b) { return b.id === id ? Object.assign({}, b, { status: status }) : b; });
      set({ bets: bets, undoStack: [{ type: 'status', prev: prev }].concat(get().undoStack.slice(0, 9)) });
      await setItem(KEYS.BETS, bets);
    },

    duplicateBet: async function(bet) {
      var nb = Object.assign({}, bet, { id: Date.now(), status: 'Pending', date: new Date().toISOString().slice(0, 10) });
      var bets = [nb].concat(get().bets);
      set({ bets: bets });
      await setItem(KEYS.BETS, bets);
    },

    bulkAction: async function(ids, action) {
      var bets;
      if (action === 'won')    bets = get().bets.map(function(b) { return ids.includes(b.id) ? Object.assign({}, b, { status: 'Won'  }) : b; });
      if (action === 'lost')   bets = get().bets.map(function(b) { return ids.includes(b.id) ? Object.assign({}, b, { status: 'Lost' }) : b; });
      if (action === 'delete') bets = get().bets.filter(function(b) { return !ids.includes(b.id); });
      if (bets) { set({ bets: bets }); await setItem(KEYS.BETS, bets); }
    },

    undo: async function() {
      var stack = get().undoStack;
      if (!stack.length) return;
      var top = stack[0]; var rest = stack.slice(1);
      var bets = top.type === 'delete'
        ? [top.prev].concat(get().bets)
        : get().bets.map(function(b) { return b.id === top.prev.id ? top.prev : b; });
      set({ bets: bets, undoStack: rest });
      await setItem(KEYS.BETS, bets);
    },

    clearAllBets: async function() { set({ bets: [] }); await setItem(KEYS.BETS, []); },

    saveBookies:  async function(v) { set({ bookies: v });        await setItem(KEYS.BOOKIES,   v); },
    saveSports:   async function(v) { set({ sports: v });         await setItem(KEYS.SPORTS,    v); },
    saveBankroll: async function(v) { set({ bankrollStart: v });  await setItem(KEYS.BANKROLL,  v); },
    setCurrency:  async function(v) { set({ currency: v });       await setItem(KEYS.CURRENCY,  v); },

    saveTemplate: async function(t) {
      var ts = [Object.assign({}, t, { id: Date.now() })].concat(get().templates);
      set({ templates: ts }); await setItem(KEYS.TEMPLATES, ts);
    },
    deleteTemplate: async function(id) {
      var ts = get().templates.filter(function(t) { return t.id !== id; });
      set({ templates: ts }); await setItem(KEYS.TEMPLATES, ts);
    },
  };
});

// ── Single hook — use this EVERYWHERE ──
export function useStats() {
  var bets          = useStore(function(s) { return s.bets; });
  var bankrollStart = useStore(function(s) { return s.bankrollStart; });
  return useMemo(function() {
    return calcStats(bets, bankrollStart);
  }, [bets, bankrollStart]);
}
