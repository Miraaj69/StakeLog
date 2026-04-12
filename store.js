// store.js — Zustand Global State
import { create } from 'zustand';
import { getItem, setItem, KEYS } from './storage';
import { DEFAULT_BOOKIES, DEFAULT_SPORTS } from './calculations';

function calcStats(bets, bankrollStart) {
  const settled = bets.filter(b => b.status === 'Won' || b.status === 'Lost');
  const wonBets = bets.filter(b => b.status === 'Won');
  const lostBets = bets.filter(b => b.status === 'Lost');

  const totalPnL = bets.reduce((sum, b) => {
    if (b.status === 'Won') return sum + parseFloat(b.stake) * (parseFloat(b.odds) - 1);
    if (b.status === 'Lost') return sum - parseFloat(b.stake);
    return sum;
  }, 0);

  const totalStake = bets
    .filter(b => b.status !== 'Void')
    .reduce((sum, b) => sum + parseFloat(b.stake || 0), 0);

  const wonCount = wonBets.length;
  const lostCount = lostBets.length;
  const winRate = wonCount + lostCount > 0
    ? ((wonCount / (wonCount + lostCount)) * 100).toFixed(0)
    : null;

  const roi = bankrollStart > 0
    ? ((totalPnL / bankrollStart) * 100).toFixed(1)
    : totalStake > 0
    ? ((totalPnL / totalStake) * 100).toFixed(1)
    : null;

  const currentBalance = parseFloat(bankrollStart || 0) + totalPnL;

  // Streak
  const sortedSettled = [...settled].sort((a, b) => new Date(b.date) - new Date(a.date));
  let streak = { current: 0, type: null, best: 0 };
  if (sortedSettled.length > 0) {
    let cur = 1, type = sortedSettled[0].status, best = 1, tmp = 1;
    for (let i = 1; i < sortedSettled.length; i++) {
      tmp = sortedSettled[i].status === sortedSettled[i - 1].status ? tmp + 1 : 1;
      if (tmp > best) best = tmp;
    }
    for (let i = 1; i < sortedSettled.length; i++) {
      if (sortedSettled[i].status === type) cur++;
      else break;
    }
    streak = { current: cur, type, best };
  }

  return { totalPnL, totalStake, wonCount, lostCount, winRate, roi, currentBalance, streak };
}

export const useStore = create((set, get) => ({
  // State
  bets: [],
  bookies: DEFAULT_BOOKIES,
  sports: DEFAULT_SPORTS,
  bankrollStart: 0,
  templates: [],
  loading: true,
  undoStack: [],
  currency: 'INR',
  theme: 'auto',

  // Derived stats (computed on every change)
  get stats() {
    return calcStats(get().bets, get().bankrollStart);
  },

  // Init — load everything from storage
  init: async () => {
    const [bets, bookies, sports, bankroll, templates, currency, theme] = await Promise.all([
      getItem(KEYS.BETS, []),
      getItem(KEYS.BOOKIES, null),
      getItem(KEYS.SPORTS, null),
      getItem(KEYS.BANKROLL, 0),
      getItem(KEYS.TEMPLATES, []),
      getItem(KEYS.CURRENCY, 'INR'),
      getItem(KEYS.THEME, 'auto'),
    ]);
    set({
      bets,
      bookies: bookies || DEFAULT_BOOKIES,
      sports: sports || DEFAULT_SPORTS,
      bankrollStart: bankroll,
      templates,
      currency,
      theme,
      loading: false,
    });
  },

  // Bet actions
  addBet: async (betData) => {
    const newBet = { ...betData, id: Date.now() };
    const bets = [newBet, ...get().bets];
    set({ bets });
    await setItem(KEYS.BETS, bets);
    return newBet;
  },

  updateBet: async (updatedBet) => {
    const prev = get().bets.find(b => b.id === updatedBet.id);
    const bets = get().bets.map(b => b.id === updatedBet.id ? updatedBet : b);
    set({ bets, undoStack: [{ type: 'edit', prev }, ...get().undoStack.slice(0, 9)] });
    await setItem(KEYS.BETS, bets);
  },

  deleteBet: async (id) => {
    const prev = get().bets.find(b => b.id === id);
    const bets = get().bets.filter(b => b.id !== id);
    set({ bets, undoStack: [{ type: 'delete', prev }, ...get().undoStack.slice(0, 9)] });
    await setItem(KEYS.BETS, bets);
    return prev;
  },

  markStatus: async (id, status) => {
    const prev = get().bets.find(b => b.id === id);
    const bets = get().bets.map(b => b.id === id ? { ...b, status } : b);
    set({ bets, undoStack: [{ type: 'status', prev }, ...get().undoStack.slice(0, 9)] });
    await setItem(KEYS.BETS, bets);
  },

  duplicateBet: async (bet) => {
    const newBet = { ...bet, id: Date.now(), status: 'Pending', date: new Date().toISOString().slice(0, 10) };
    const bets = [newBet, ...get().bets];
    set({ bets });
    await setItem(KEYS.BETS, bets);
  },

  bulkAction: async (ids, action) => {
    let bets;
    if (action === 'won') bets = get().bets.map(b => ids.includes(b.id) ? { ...b, status: 'Won' } : b);
    else if (action === 'lost') bets = get().bets.map(b => ids.includes(b.id) ? { ...b, status: 'Lost' } : b);
    else if (action === 'delete') bets = get().bets.filter(b => !ids.includes(b.id));
    if (bets) { set({ bets }); await setItem(KEYS.BETS, bets); }
  },

  undo: async () => {
    const [top, ...rest] = get().undoStack;
    if (!top) return;
    let bets;
    if (top.type === 'delete') bets = [top.prev, ...get().bets];
    else bets = get().bets.map(b => b.id === top.prev.id ? top.prev : b);
    set({ bets, undoStack: rest });
    await setItem(KEYS.BETS, bets);
  },

  clearAllBets: async () => {
    set({ bets: [] });
    await setItem(KEYS.BETS, []);
  },

  // Settings actions
  saveBookies: async (bookies) => { set({ bookies }); await setItem(KEYS.BOOKIES, bookies); },
  saveSports: async (sports) => { set({ sports }); await setItem(KEYS.SPORTS, sports); },
  saveBankroll: async (amount) => {
    set({ bankrollStart: amount });
    await setItem(KEYS.BANKROLL, amount);
  },
  setCurrency: async (currency) => { set({ currency }); await setItem(KEYS.CURRENCY, currency); },
  setTheme: async (theme) => { set({ theme }); await setItem(KEYS.THEME, theme); },

  saveTemplate: async (template) => {
    const templates = [{ ...template, id: Date.now() }, ...get().templates];
    set({ templates });
    await setItem(KEYS.TEMPLATES, templates);
  },
  deleteTemplate: async (id) => {
    const templates = get().templates.filter(t => t.id !== id);
    set({ templates });
    await setItem(KEYS.TEMPLATES, templates);
  },
}));

// Helper hook for computed stats (always fresh)
export function useStats() {
  const bets = useStore(s => s.bets);
  const bankrollStart = useStore(s => s.bankrollStart);
  return calcStats(bets, bankrollStart);
}
