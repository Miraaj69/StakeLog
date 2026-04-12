// useBets.js
import { useState, useEffect, useCallback, useMemo } from 'react';
import { getItem, setItem, KEYS } from './storage';
import {
  calcPnL, calcTotalPnL, calcTotalStake, calcWinRate, calcStreak,
  calcROI, DEFAULT_BOOKIES, DEFAULT_SPORTS,
} from './calculations';

export function useBets() {
  const [bets, setBets] = useState([]);
  const [bookies, setBookies] = useState(DEFAULT_BOOKIES);
  const [sports, setSports] = useState(DEFAULT_SPORTS);
  const [bankrollStart, setBankrollStart] = useState(0);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [undoStack, setUndoStack] = useState([]);

  useEffect(() => {
    (async () => {
      const [savedBets, savedBookies, savedSports, savedBankroll, savedTemplates] = await Promise.all([
        getItem(KEYS.BETS, []),
        getItem(KEYS.BOOKIES, null),
        getItem(KEYS.SPORTS, null),
        getItem(KEYS.BANKROLL, 0),
        getItem(KEYS.TEMPLATES, []),
      ]);
      setBets(savedBets);
      setBookies(savedBookies || DEFAULT_BOOKIES);
      setSports(savedSports || DEFAULT_SPORTS);
      setBankrollStart(savedBankroll);
      setTemplates(savedTemplates);
      setLoading(false);
    })();
  }, []);

  const persistBets = useCallback(async (newBets) => {
    setBets(newBets);
    await setItem(KEYS.BETS, newBets);
  }, []);

  const addBet = useCallback(async (betData) => {
    const newBet = { ...betData, id: Date.now() };
    await persistBets([newBet, ...bets]);
    return newBet;
  }, [bets, persistBets]);

  const updateBet = useCallback(async (updatedBet) => {
    setUndoStack(u => [{ type: 'edit', prev: bets.find(b => b.id === updatedBet.id) }, ...u.slice(0, 9)]);
    await persistBets(bets.map(b => b.id === updatedBet.id ? updatedBet : b));
  }, [bets, persistBets]);

  const deleteBet = useCallback(async (id) => {
    const prev = bets.find(b => b.id === id);
    setUndoStack(u => [{ type: 'delete', prev }, ...u.slice(0, 9)]);
    await persistBets(bets.filter(b => b.id !== id));
    return prev;
  }, [bets, persistBets]);

  const markStatus = useCallback(async (id, status) => {
    const prev = bets.find(b => b.id === id);
    setUndoStack(u => [{ type: 'status', prev }, ...u.slice(0, 9)]);
    await persistBets(bets.map(b => b.id === id ? { ...b, status } : b));
    return prev;
  }, [bets, persistBets]);

  const duplicateBet = useCallback(async (bet) => {
    const newBet = { ...bet, id: Date.now(), status: 'Pending', date: new Date().toISOString().slice(0, 10) };
    await persistBets([newBet, ...bets]);
  }, [bets, persistBets]);

  const bulkAction = useCallback(async (ids, action) => {
    let newBets;
    if (action === 'won') newBets = bets.map(b => ids.includes(b.id) ? { ...b, status: 'Won' } : b);
    else if (action === 'lost') newBets = bets.map(b => ids.includes(b.id) ? { ...b, status: 'Lost' } : b);
    else if (action === 'delete') newBets = bets.filter(b => !ids.includes(b.id));
    if (newBets) await persistBets(newBets);
  }, [bets, persistBets]);

  const undo = useCallback(async () => {
    if (!undoStack.length) return;
    const top = undoStack[0];
    if (top.type === 'delete') await persistBets([top.prev, ...bets]);
    else if (top.type === 'status' || top.type === 'edit')
      await persistBets(bets.map(b => b.id === top.prev.id ? top.prev : b));
    setUndoStack(u => u.slice(1));
  }, [bets, undoStack, persistBets]);

  const clearAllBets = useCallback(async () => { await persistBets([]); }, [persistBets]);

  const saveBookies = useCallback(async (newBookies) => { setBookies(newBookies); await setItem(KEYS.BOOKIES, newBookies); }, []);
  const saveSports = useCallback(async (newSports) => { setSports(newSports); await setItem(KEYS.SPORTS, newSports); }, []);
  const saveBankroll = useCallback(async (amount) => { setBankrollStart(amount); await setItem(KEYS.BANKROLL, amount); }, []);

  const saveTemplate = useCallback(async (template) => {
    const newTemplates = [{ ...template, id: Date.now() }, ...templates];
    setTemplates(newTemplates);
    await setItem(KEYS.TEMPLATES, newTemplates);
  }, [templates]);

  const deleteTemplate = useCallback(async (id) => {
    const newTemplates = templates.filter(t => t.id !== id);
    setTemplates(newTemplates);
    await setItem(KEYS.TEMPLATES, newTemplates);
  }, [templates]);

  const stats = useMemo(() => {
    const totalPnL = calcTotalPnL(bets);
    const totalStake = calcTotalStake(bets);
    const wonCount = bets.filter(b => b.status === 'Won').length;
    const lostCount = bets.filter(b => b.status === 'Lost').length;
    const winRate = calcWinRate(bets);
    const streak = calcStreak(bets);
    const roi = calcROI(bets, bankrollStart);
    const currentBalance = parseFloat(bankrollStart || 0) + totalPnL;
    return { totalPnL, totalStake, wonCount, lostCount, winRate, streak, roi, currentBalance };
  }, [bets, bankrollStart]);

  return {
    bets, bookies, sports, bankrollStart, templates, loading, undoStack, stats,
    addBet, updateBet, deleteBet, markStatus, duplicateBet,
    bulkAction, undo, clearAllBets,
    saveBookies, saveSports, saveBankroll, saveTemplate, deleteTemplate,
  };
}
