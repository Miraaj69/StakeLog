// calculations.js — fixed formatMoney to show real values
export var DEFAULT_BOOKIES = ['Bet365', 'Betway', 'Dream11', 'MPL', '1xBet', 'Parimatch'];
export var DEFAULT_SPORTS  = ['🏏 Cricket', '⚽ Football', '🎾 Tennis', '🏀 Basketball', '🐴 Horse Racing', '🤼 Kabaddi', '🎯 Other'];
export var STATUSES   = ['Pending', 'Won', 'Lost', 'Void'];
export var BET_TYPES  = ['Single', 'Parlay', 'System', 'Live', 'Pre-match'];
export var CURRENCIES = [
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
];

// ── FIXED: Show real values, no rounding ──
export function formatMoney(n, sym) {
  sym = sym || '₹';
  if (n === null || n === undefined || isNaN(n)) return sym + '0';
  var abs = Math.abs(n);
  var sign = n < 0 ? '-' : '';
  // Use toLocaleString for proper Indian number formatting
  var formatted = abs.toLocaleString('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
  return sign + sym + formatted;
}

// Compact version for summary pills only (not card values)
export function formatMoneyCompact(n, sym) {
  sym = sym || '₹';
  if (n === null || n === undefined || isNaN(n)) return sym + '0';
  var abs = Math.abs(n);
  var sign = n < 0 ? '-' : '';
  var f;
  if (abs >= 10000000)      f = (abs / 10000000).toFixed(1) + 'Cr';
  else if (abs >= 100000)   f = (abs / 100000).toFixed(1) + 'L';
  else if (abs >= 1000)     f = (abs / 1000).toFixed(1) + 'K';
  else                      f = Math.round(abs).toString();
  return sign + sym + f;
}

export function getCurrencySymbol(code) {
  var found = CURRENCIES.find(function(c) { return c.code === code; });
  return found ? found.symbol : '₹';
}

export function calcPnL(bet) {
  if (bet.status === 'Won')  return parseFloat(bet.stake) * (parseFloat(bet.odds) - 1);
  if (bet.status === 'Lost') return -parseFloat(bet.stake);
  return 0;
}

export function calcTotalPnL(bets) {
  return bets.reduce(function(s, b) { return s + calcPnL(b); }, 0);
}

export function calcTotalStake(bets) {
  return bets
    .filter(function(b) { return b.status !== 'Void'; })
    .reduce(function(s, b) { return s + parseFloat(b.stake || 0); }, 0);
}

export function calcWinRate(bets) {
  var won  = bets.filter(function(b) { return b.status === 'Won'; }).length;
  var lost = bets.filter(function(b) { return b.status === 'Lost'; }).length;
  if (won + lost === 0) return null;
  return ((won / (won + lost)) * 100).toFixed(0);
}

export function calcStreak(bets) {
  var settled = bets
    .filter(function(b) { return b.status === 'Won' || b.status === 'Lost'; })
    .slice().sort(function(a, b) { return new Date(b.date) - new Date(a.date); });
  if (!settled.length) return { current: 0, type: null, best: 0 };
  var cur = 1, type = settled[0].status, best = 1, tmp = 1;
  for (var i = 1; i < settled.length; i++) {
    tmp = settled[i].status === settled[i-1].status ? tmp + 1 : 1;
    if (tmp > best) best = tmp;
  }
  for (var j = 1; j < settled.length; j++) {
    if (settled[j].status === type) cur++;
    else break;
  }
  return { current: cur, type: type, best: best };
}

export function calcROI(bets, bankrollStart) {
  if (!bankrollStart) return null;
  return ((calcTotalPnL(bets) / bankrollStart) * 100).toFixed(1);
}

export function calcSuggestedStake(bankrollStart, totalPnL) {
  var balance = parseFloat(bankrollStart || 0) + totalPnL;
  return balance > 0 ? balance * 0.02 : null;
}

export function calcPnLByDay(bets) {
  var now = new Date();
  var year = now.getFullYear(), month = now.getMonth();
  var map = {};
  bets.forEach(function(b) {
    var d = new Date(b.date);
    if (d.getMonth() === month && d.getFullYear() === year) {
      var k = d.getDate();
      if (!map[k]) map[k] = { pnl: 0, count: 0 };
      map[k].pnl += calcPnL(b);
      map[k].count++;
    }
  });
  return map;
}

export function calcPnLTimeSeries(bets) {
  var cum = 0;
  return bets
    .filter(function(b) { return b.status !== 'Pending' && b.status !== 'Void'; })
    .slice().sort(function(a, b) { return new Date(a.date) - new Date(b.date); })
    .map(function(b, i) { cum += calcPnL(b); return { x: i + 1, y: cum, date: b.date }; });
}

export function calcBankrollSeries(bets, bankrollStart) {
  var bal = parseFloat(bankrollStart || 0);
  var pts = [{ x: 0, y: bal, date: 'Start' }];
  bets
    .filter(function(b) { return b.status !== 'Pending' && b.status !== 'Void'; })
    .slice().sort(function(a, b) { return new Date(a.date) - new Date(b.date); })
    .forEach(function(b, i) { bal += calcPnL(b); pts.push({ x: i + 1, y: bal, date: b.date }); });
  return pts;
}

export function calcSportStats(bets, sports) {
  return sports.map(function(sp) {
    var sb = bets.filter(function(b) { return b.sport === sp; });
    return {
      name: sp,
      bets: sb,
      won:  bets.filter(function(b) { return b.sport === sp && b.status === 'Won'; }).length,
      lost: bets.filter(function(b) { return b.sport === sp && b.status === 'Lost'; }).length,
      pnl:  sb.reduce(function(s, b) { return s + calcPnL(b); }, 0),
    };
  }).filter(function(s) { return s.bets.length > 0; }).sort(function(a, b) { return b.pnl - a.pnl; });
}

export function calcBookieStats(bets, bookies) {
  return bookies.concat(['Other']).map(function(bk) {
    var bb = bets.filter(function(b) { return b.bookie === bk; });
    return {
      name: bk,
      bets: bb,
      won:  bets.filter(function(b) { return b.bookie === bk && b.status === 'Won'; }).length,
      pnl:  bb.reduce(function(s, b) { return s + calcPnL(b); }, 0),
    };
  }).filter(function(b) { return b.bets.length > 0; }).sort(function(a, b) { return b.pnl - a.pnl; });
}

export function calcTagStats(bets) {
  var map = {};
  bets.forEach(function(b) {
    (b.tags || []).forEach(function(tag) {
      if (!map[tag]) map[tag] = { tag: tag, pnl: 0, count: 0, won: 0, lost: 0 };
      map[tag].pnl += calcPnL(b);
      map[tag].count++;
      if (b.status === 'Won')  map[tag].won++;
      if (b.status === 'Lost') map[tag].lost++;
    });
  });
  return Object.values(map).sort(function(a, b) { return b.pnl - a.pnl; });
}

export function calcOddsBreakdown(bets) {
  var ranges = [
    { label: '1.1–1.5', min: 1.1, max: 1.5 },
    { label: '1.5–2.0', min: 1.5, max: 2.0 },
    { label: '2.0–3.0', min: 2.0, max: 3.0 },
    { label: '3.0–5.0', min: 3.0, max: 5.0 },
    { label: '5.0+',    min: 5.0, max: 999  },
  ];
  var settled = bets.filter(function(b) { return b.status === 'Won' || b.status === 'Lost'; });
  return ranges.map(function(r) {
    var rb = settled.filter(function(b) { var o = parseFloat(b.odds); return o >= r.min && o < r.max; });
    if (!rb.length) return null;
    return { label: r.label, count: rb.length, winRate: Math.round(rb.filter(function(b) { return b.status === 'Won'; }).length / rb.length * 100) };
  }).filter(Boolean);
}

export function calcSessionStats(bets) {
  var now = new Date();
  function pnlOf(list) { return list.reduce(function(s, b) { return s + calcPnL(b); }, 0); }
  return {
    todayPnL: pnlOf(bets.filter(function(b) { return new Date(b.date).toDateString() === now.toDateString(); })),
    weekPnL:  pnlOf(bets.filter(function(b) { return (now - new Date(b.date)) / 86400000 <= 7; })),
    monthPnL: pnlOf(bets.filter(function(b) { var d = new Date(b.date); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear(); })),
  };
}

export function calcSmartInsights(bets, sportStats, bookieStats, streak, winRate) {
  var settled = bets.filter(function(b) { return b.status === 'Won' || b.status === 'Lost'; });
  if (settled.length < 3) return [{ icon: '💡', text: 'Add more bets to unlock smart insights!', type: 'info' }];
  var list = [];
  var best = sportStats.filter(function(s) { return s.won + s.lost >= 2; })[0];
  if (best && best.pnl > 0) list.push({ icon: '🏆', text: best.name + ' is your best sport', type: 'positive' });
  var worst = sportStats.filter(function(s) { return s.won + s.lost >= 2; }).slice().sort(function(a, b) { return a.pnl - b.pnl; })[0];
  if (worst && worst.pnl < 0) list.push({ icon: '⚠️', text: 'Avoid ' + worst.name + ' — losses here', type: 'warning' });
  var bestBook = bookieStats[0];
  if (bestBook && bestBook.pnl > 0) list.push({ icon: '🏢', text: bestBook.name + ' is your best bookie', type: 'positive' });
  if (streak && streak.type === 'Lost' && streak.current >= 3) list.push({ icon: '🛑', text: streak.current + '-loss streak — take a break', type: 'warning' });
  if (streak && streak.type === 'Won'  && streak.current >= 4) list.push({ icon: '🔥', text: streak.current + '-win streak! Stay disciplined', type: 'positive' });
  if (parseFloat(winRate || 0) > 60) list.push({ icon: '💎', text: winRate + '% win rate — elite bettor!', type: 'positive' });
  return list.slice(0, 5);
}

export function makeForm(bookies, sports) {
  return {
    id: null,
    date: new Date().toISOString().slice(0, 10),
    bookie: (bookies && bookies[0]) || '',
    sport:  (sports  && sports[0])  || '',
    event: '', bet: '', odds: '', stake: '',
    status: 'Pending', notes: '', matchTime: '',
    tags: [], betType: 'Single',
  };
}

export var ACHIEVEMENTS = [
  { id: 'first_bet', icon: '🎯', title: 'First Blood',    desc: 'Placed your first bet',  check: function(b) { return b.length >= 1; } },
  { id: 'first_win', icon: '🏆', title: 'Winner!',        desc: 'Won your first bet',     check: function(b) { return b.some(function(x) { return x.status === 'Won'; }); } },
  { id: 'streak3',   icon: '🔥', title: 'Hot Hand',       desc: '3-win streak',           check: function(b, s) { return s.best >= 3; } },
  { id: 'streak5',   icon: '🔥🔥', title: 'On Fire',      desc: '5-win streak',           check: function(b, s) { return s.best >= 5; } },
  { id: 'profit10k', icon: '💰', title: 'Sharp Bettor',   desc: '10K+ profit',            check: function(b, s, p) { return p >= 10000; } },
  { id: 'bets10',    icon: '📋', title: 'Regular',        desc: '10 bets placed',         check: function(b) { return b.length >= 10; } },
  { id: 'bets50',    icon: '📊', title: 'Veteran',        desc: '50 bets placed',         check: function(b) { return b.length >= 50; } },
  { id: 'wr60',      icon: '🎖️', title: 'Profitable',    desc: '60%+ win rate',          check: function(b, s, p, wr) { return parseFloat(wr || 0) >= 60; } },
];
