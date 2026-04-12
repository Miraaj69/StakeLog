// utils/calculations.js

export const DEFAULT_BOOKIES = ['Bet365', 'Betway', 'Dream11', 'MPL', '1xBet', 'Parimatch'];
export const DEFAULT_SPORTS = ['🏏 Cricket', '⚽ Football', '🎾 Tennis', '🏀 Basketball', '🐴 Horse Racing', '🤼 Kabaddi', '🎯 Other'];
export const STATUSES = ['Pending', 'Won', 'Lost', 'Void'];
export const BET_TYPES = ['Single', 'Parlay', 'System', 'Live', 'Pre-match'];
export const CURRENCIES = [
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
];

export function calcPnL(bet) {
  if (bet.status === 'Won') return parseFloat(bet.stake) * (parseFloat(bet.odds) - 1);
  if (bet.status === 'Lost') return -parseFloat(bet.stake);
  return 0;
}

export function calcTotalPnL(bets) {
  return bets.reduce((s, b) => s + calcPnL(b), 0);
}

export function calcTotalStake(bets) {
  return bets.filter(b => b.status !== 'Void').reduce((s, b) => s + parseFloat(b.stake || 0), 0);
}

export function calcWinRate(bets) {
  const won = bets.filter(b => b.status === 'Won').length;
  const lost = bets.filter(b => b.status === 'Lost').length;
  if (won + lost === 0) return null;
  return ((won / (won + lost)) * 100).toFixed(0);
}

export function calcStreak(bets) {
  const settled = [...bets]
    .filter(b => b.status === 'Won' || b.status === 'Lost')
    .sort((a, b) => new Date(b.date) - new Date(a.date));
  if (!settled.length) return { current: 0, type: null, best: 0 };
  let cur = 1, type = settled[0].status, best = 1, tmp = 1;
  for (let i = 1; i < settled.length; i++) {
    if (settled[i].status === settled[i - 1].status) tmp++;
    else tmp = 1;
    if (tmp > best) best = tmp;
  }
  for (let i = 1; i < settled.length; i++) {
    if (settled[i].status === type) cur++;
    else break;
  }
  return { current: cur, type, best };
}

export function calcROI(bets, bankrollStart) {
  if (!bankrollStart) return null;
  const pnl = calcTotalPnL(bets);
  return ((pnl / bankrollStart) * 100).toFixed(1);
}

export function calcSuggestedStake(bankrollStart, totalPnL) {
  const balance = parseFloat(bankrollStart || 0) + totalPnL;
  return balance > 0 ? balance * 0.02 : null;
}

export function calcPnLByDay(bets) {
  const now = new Date();
  const year = now.getFullYear(), month = now.getMonth();
  const dayMap = {};
  bets.forEach(b => {
    const d = new Date(b.date);
    if (d.getMonth() === month && d.getFullYear() === year) {
      const k = d.getDate();
      if (!dayMap[k]) dayMap[k] = { pnl: 0, count: 0 };
      dayMap[k].pnl += calcPnL(b);
      dayMap[k].count++;
    }
  });
  return dayMap;
}

export function calcPnLTimeSeries(bets) {
  let cum = 0;
  return [...bets]
    .filter(b => b.status !== 'Pending' && b.status !== 'Void')
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .map((b, i) => { cum += calcPnL(b); return { x: i + 1, y: cum, date: b.date }; });
}

export function calcBankrollSeries(bets, bankrollStart) {
  let bal = parseFloat(bankrollStart || 0);
  const pts = [{ x: 0, y: bal, date: 'Start' }];
  [...bets]
    .filter(b => b.status !== 'Pending' && b.status !== 'Void')
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .forEach((b, i) => { bal += calcPnL(b); pts.push({ x: i + 1, y: bal, date: b.date }); });
  return pts;
}

export function calcSportStats(bets, sports) {
  return sports.map(sp => ({
    name: sp,
    bets: bets.filter(b => b.sport === sp),
    won: bets.filter(b => b.sport === sp && b.status === 'Won').length,
    lost: bets.filter(b => b.sport === sp && b.status === 'Lost').length,
    pnl: bets.filter(b => b.sport === sp).reduce((s, b) => s + calcPnL(b), 0),
  })).filter(s => s.bets.length > 0).sort((a, b) => b.pnl - a.pnl);
}

export function calcBookieStats(bets, bookies) {
  return [...bookies, 'Other'].map(bk => ({
    name: bk,
    bets: bets.filter(b => b.bookie === bk),
    won: bets.filter(b => b.bookie === bk && b.status === 'Won').length,
    pnl: bets.filter(b => b.bookie === bk).reduce((s, b) => s + calcPnL(b), 0),
  })).filter(b => b.bets.length > 0).sort((a, b) => b.pnl - a.pnl);
}

export function calcTagStats(bets) {
  const map = {};
  bets.forEach(b => (b.tags || []).forEach(tag => {
    if (!map[tag]) map[tag] = { tag, pnl: 0, count: 0, won: 0, lost: 0 };
    map[tag].pnl += calcPnL(b);
    map[tag].count++;
    if (b.status === 'Won') map[tag].won++;
    if (b.status === 'Lost') map[tag].lost++;
  }));
  return Object.values(map).sort((a, b) => b.pnl - a.pnl);
}

export function calcOddsBreakdown(bets) {
  const ranges = [
    { label: '1.1–1.5', min: 1.1, max: 1.5 },
    { label: '1.5–2.0', min: 1.5, max: 2.0 },
    { label: '2.0–3.0', min: 2.0, max: 3.0 },
    { label: '3.0–5.0', min: 3.0, max: 5.0 },
    { label: '5.0+', min: 5.0, max: 999 },
  ];
  const settled = bets.filter(b => b.status === 'Won' || b.status === 'Lost');
  return ranges.map(r => {
    const rb = settled.filter(b => { const o = parseFloat(b.odds); return o >= r.min && o < r.max; });
    if (!rb.length) return null;
    const wr = Math.round(rb.filter(b => b.status === 'Won').length / rb.length * 100);
    return { ...r, count: rb.length, winRate: wr };
  }).filter(Boolean);
}

export function calcSessionStats(bets) {
  const now = new Date();
  const todayPnL = bets
    .filter(b => new Date(b.date).toDateString() === now.toDateString())
    .reduce((s, b) => s + calcPnL(b), 0);
  const weekPnL = bets
    .filter(b => (now - new Date(b.date)) / 86400000 <= 7)
    .reduce((s, b) => s + calcPnL(b), 0);
  const monthPnL = bets
    .filter(b => {
      const d = new Date(b.date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    })
    .reduce((s, b) => s + calcPnL(b), 0);
  return { todayPnL, weekPnL, monthPnL };
}

export function calcSmartInsights(bets, sportStats, bookieStats, streak, winRate) {
  const list = [];
  const settled = bets.filter(b => b.status === 'Won' || b.status === 'Lost');
  if (settled.length < 3) return [{ icon: '💡', text: 'Add more bets to unlock smart insights!', type: 'info' }];

  const bestSport = sportStats.filter(s => s.won + s.lost >= 2)[0];
  if (bestSport && bestSport.pnl > 0)
    list.push({ icon: '🏆', text: `${bestSport.name} is your best sport`, type: 'positive' });

  const worstSport = [...sportStats].sort((a, b) => a.pnl - b.pnl).filter(s => s.won + s.lost >= 2)[0];
  if (worstSport && worstSport.pnl < 0)
    list.push({ icon: '⚠️', text: `Avoid ${worstSport.name} — losses here`, type: 'warning' });

  const highOdds = settled.filter(b => parseFloat(b.odds) > 3);
  if (highOdds.length >= 3) {
    const wr = highOdds.filter(b => b.status === 'Won').length / highOdds.length * 100;
    if (wr < 30) list.push({ icon: '📉', text: `High odds (>3x) only ${wr.toFixed(0)}% win rate`, type: 'warning' });
  }

  const bestBook = bookieStats[0];
  if (bestBook && bestBook.pnl > 0)
    list.push({ icon: '🏢', text: `${bestBook.name} is your best bookie`, type: 'positive' });

  if (streak.type === 'Lost' && streak.current >= 3)
    list.push({ icon: '🛑', text: `${streak.current}-loss streak — take a break`, type: 'warning' });
  if (streak.type === 'Won' && streak.current >= 4)
    list.push({ icon: '🔥', text: `${streak.current}-win streak! Stay disciplined`, type: 'positive' });
  if (parseFloat(winRate || 0) > 60)
    list.push({ icon: '💎', text: `${winRate}% win rate — elite bettor!`, type: 'positive' });

  return list.slice(0, 5);
}

export function formatMoney(n, sym = '₹') {
  const abs = Math.abs(n || 0);
  let f;
  if (abs >= 10000000) f = sym + (abs / 10000000).toFixed(1) + 'Cr';
  else if (abs >= 100000) f = sym + (abs / 100000).toFixed(1) + 'L';
  else if (abs >= 1000) f = sym + (abs / 1000).toFixed(1) + 'K';
  else f = sym + Math.round(abs);
  return (n < 0 ? '-' : '') + f;
}

export function getCurrencySymbol(code) {
  return CURRENCIES.find(c => c.code === code)?.symbol || '₹';
}

export function makeForm(bookies, sports) {
  return {
    id: null,
    date: new Date().toISOString().slice(0, 10),
    bookie: bookies[0] || '',
    sport: sports[0] || '',
    event: '',
    bet: '',
    odds: '',
    stake: '',
    status: 'Pending',
    notes: '',
    matchTime: '',
    tags: [],
    betType: 'Single',
  };
}

export const ACHIEVEMENTS = [
  { id: 'first_bet', icon: '🎯', title: 'First Blood', desc: 'Placed your first bet', check: (b) => b.length >= 1 },
  { id: 'first_win', icon: '🏆', title: 'Winner!', desc: 'Won your first bet', check: (b) => b.some(x => x.status === 'Won') },
  { id: 'streak3', icon: '🔥', title: 'Hot Hand', desc: '3-win streak', check: (b, s) => s.best >= 3 },
  { id: 'streak5', icon: '🔥🔥', title: 'On Fire', desc: '5-win streak', check: (b, s) => s.best >= 5 },
  { id: 'profit10k', icon: '💰', title: 'Sharp Bettor', desc: '10K+ profit', check: (b, s, p) => p >= 10000 },
  { id: 'bets10', icon: '📋', title: 'Regular', desc: '10 bets placed', check: (b) => b.length >= 10 },
  { id: 'bets50', icon: '📊', title: 'Veteran', desc: '50 bets placed', check: (b) => b.length >= 50 },
  { id: 'wr60', icon: '🎖️', title: 'Profitable', desc: '60%+ win rate', check: (b, s, p, wr) => parseFloat(wr || 0) >= 60 },
];
