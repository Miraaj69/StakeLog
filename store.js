// store.js — Zustand Global State (Babel-compatible)
import { create } from 'zustand';
import { getItem, setItem, KEYS } from './storage';
import { DEFAULT_BOOKIES, DEFAULT_SPORTS } from './calculations';

export function calcStats(bets, bankrollStart) {
  const wonBets  = bets.filter(b => b.status === 'Won');
  const lostBets = bets.filter(b => b.status === 'Lost');

  const totalPnL = bets.reduce((sum, b) => {
    if (b.status === 'Won')  return sum + parseFloat(b.stake) * (parseFloat(b.odds) - 1);
    if (b.status === 'Lost') return sum - parseFloat(b.stake);
    return sum;
  }, 0);

  const totalStake = bets
    .filter(b => b.status !== 'Void')
    .reduce((sum, b) => sum + parseFloat(b.stake || 0), 0);

  const wonCount  = wonBets.length;
  const lostCount = lostBets.length;
  const winRate   = wonCount + lostCount > 0
    ? ((wonCount / (wonCount + lostCount)) * 100).toFixed(0)
    : null;

  const roi = bankrollStart > 0
    ? ((totalPnL / bankrollStart) * 100).toFixed(1)
    : totalStake > 0
    ? ((totalPnL / totalStake) * 100).toFixed(1)
    : null;

  const currentBalance = parseFloat(bankrollStart || 0) + totalPnL;

  // Current streak
  const settled = [...bets]
    .filter(b => b.status === 'Won' || b.status === 'Lost')
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  var streak = { current: 0, type: null, best: 0 };
  if (settled.length > 0) {
    var cur  = 1;
    var type = settled[0].status;
    var best = 1;
    var tmp  = 1;
    for (var i = 1; i < settled.length; i++) {
      tmp = settled[i].status === settled[i - 1].status ? tmp + 1 : 1;
      if (tmp > best) best = tmp;
    }
    for (var j = 1; j < settled.length; j++) {
      if (settled[j].status === type) cur++;
      else break;
    }
    streak = { current: cur, type: type, best: best };
  }

  return { totalPnL, totalStake, wonCount, lostCount, winRate, roi, currentBalance, streak };
}

export const useStore = create(function(set, get) {
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
      var results = await Promise.all([
        getItem(KEYS.BETS, []),
        getItem(KEYS.BOOKIES, null),
        getItem(KEYS.SPORTS, null),
        getItem(KEYS.BANKROLL, 0),
        getItem(KEYS.TEMPLATES, []),
        getItem(KEYS.CURRENCY, 'INR'),
      ]);
      set({
        bets:         results[0],
        bookies:      results[1] || DEFAULT_BOOKIES,
        sports:       results[2] || DEFAULT_SPORTS,
        bankrollStart: results[3],
        templates:    results[4],
        currency:     results[5],
        loading:      false,
      });
    },

    addBet: async function(betData) {
      var newBet = Object.assign({}, betData, { id: Date.now() });
      var bets = [newBet].concat(get().bets);
      set({ bets: bets });
      await setItem(KEYS.BETS, bets);
      return newBet;
    },

    updateBet: async function(updatedBet) {
      var prev = get().bets.find(function(b) { return b.id === updatedBet.id; });
      var bets = get().bets.map(function(b) { return b.id === updatedBet.id ? updatedBet : b; });
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
      var newBet = Object.assign({}, bet, { id: Date.now(), status: 'Pending', date: new Date().toISOString().slice(0, 10) });
      var bets = [newBet].concat(get().bets);
      set({ bets: bets });
      await setItem(KEYS.BETS, bets);
    },

    bulkAction: async function(ids, action) {
      var bets;
      if (action === 'won')    bets = get().bets.map(function(b) { return ids.includes(b.id) ? Object.assign({}, b, { status: 'Won' })  : b; });
      if (action === 'lost')   bets = get().bets.map(function(b) { return ids.includes(b.id) ? Object.assign({}, b, { status: 'Lost' }) : b; });
      if (action === 'delete') bets = get().bets.filter(function(b) { return !ids.includes(b.id); });
      if (bets) { set({ bets: bets }); await setItem(KEYS.BETS, bets); }
    },

    undo: async function() {
      var stack = get().undoStack;
      if (!stack.length) return;
      var top  = stack[0];
      var rest = stack.slice(1);
      var bets;
      if (top.type === 'delete') {
        bets = [top.prev].concat(get().bets);
      } else {
        bets = get().bets.map(function(b) { return b.id === top.prev.id ? top.prev : b; });
      }
      set({ bets: bets, undoStack: rest });
      await setItem(KEYS.BETS, bets);
    },

    clearAllBets: async function() {
      set({ bets: [] });
      await setItem(KEYS.BETS, []);
    },

    saveBookies: async function(bookies) {
      set({ bookies: bookies });
      await setItem(KEYS.BOOKIES, bookies);
    },

    saveSports: async function(sports) {
      set({ sports: sports });
      await setItem(KEYS.SPORTS, sports);
    },

    saveBankroll: async function(amount) {
      set({ bankrollStart: amount });
      await setItem(KEYS.BANKROLL, amount);
    },

    setCurrency: async function(currency) {
      set({ currency: currency });
      await setItem(KEYS.CURRENCY, currency);
    },

    saveTemplate: async function(template) {
      var templates = [Object.assign({}, template, { id: Date.now() })].concat(get().templates);
      set({ templates: templates });
      await setItem(KEYS.TEMPLATES, templates);
    },

    deleteTemplate: async function(id) {
      var templates = get().templates.filter(function(t) { return t.id !== id; });
      set({ templates: templates });
      await setItem(KEYS.TEMPLATES, templates);
    },
  };
});

// Derived stats hook — always reactive
import { useMemo } from 'react';

export function useStats() {
  var bets          = useStore(function(s) { return s.bets; });
  var bankrollStart = useStore(function(s) { return s.bankrollStart; });
  return useMemo(function() {
    return calcStats(bets, bankrollStart);
  }, [bets, bankrollStart]);
}
