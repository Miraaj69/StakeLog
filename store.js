// store.js — Single source of truth + loss limit + smart stake
import { create } from 'zustand';
import { getItem, setItem, KEYS } from './storage';
import { DEFAULT_BOOKIES, DEFAULT_SPORTS } from './calculations';
import { useMemo } from 'react';

export function calcStats(bets, bankrollStart) {
  var won     = bets.filter(function(b) { return b.status==='Won'; });
  var lost    = bets.filter(function(b) { return b.status==='Lost'; });
  var pending = bets.filter(function(b) { return b.status==='Pending'; });

  var totalPnL = bets.reduce(function(s,b) {
    if (b.status==='Won')  return s + parseFloat(b.stake)*(parseFloat(b.odds)-1);
    if (b.status==='Lost') return s - parseFloat(b.stake);
    return s;
  }, 0);

  var totalStake = bets.filter(function(b) { return b.status!=='Void'; })
    .reduce(function(s,b) { return s+parseFloat(b.stake||0); }, 0);

  var wonCount     = won.length;
  var lostCount    = lost.length;
  var pendingCount = pending.length;
  var totalBets    = bets.length;
  var winRate      = wonCount+lostCount>0 ? ((wonCount/(wonCount+lostCount))*100).toFixed(0) : null;

  var roi = bankrollStart>0
    ? ((totalPnL/bankrollStart)*100).toFixed(1)
    : totalStake>0 ? ((totalPnL/totalStake)*100).toFixed(1) : null;

  var currentBalance = parseFloat(bankrollStart||0) + totalPnL;

  // 2% rule — auto-adjust if win rate low
  var suggestedStake = currentBalance > 0
    ? parseFloat(winRate||50)<40
      ? currentBalance*0.01  // reduce to 1% when win rate below 40%
      : currentBalance*0.02
    : null;

  // Session P&L
  var now = new Date();
  function pnlOf(list) { return list.reduce(function(s,b) {
    if (b.status==='Won') return s+parseFloat(b.stake)*(parseFloat(b.odds)-1);
    if (b.status==='Lost') return s-parseFloat(b.stake);
    return s;
  },0); }
  var todayBets = bets.filter(function(b) { return new Date(b.date).toDateString()===now.toDateString(); });
  var weekBets  = bets.filter(function(b) { return (now-new Date(b.date))/86400000<=7; });
  var monthBets = bets.filter(function(b) { var d=new Date(b.date); return d.getMonth()===now.getMonth()&&d.getFullYear()===now.getFullYear(); });
  var todayPnL  = pnlOf(todayBets);
  var weekPnL   = pnlOf(weekBets);
  var monthPnL  = pnlOf(monthBets);

  // Loss limit alert (₹1000 default)
  var lossLimitHit = false;

  // Streak
  var settled = bets.filter(function(b) { return b.status==='Won'||b.status==='Lost'; })
    .slice().sort(function(a,b) { return new Date(b.date)-new Date(a.date); });
  var streak = { current:0, type:null, best:0 };
  if (settled.length>0) {
    var cur=1,type=settled[0].status,best=1,tmp=1;
    for (var i=1;i<settled.length;i++) { tmp=settled[i].status===settled[i-1].status?tmp+1:1; if(tmp>best)best=tmp; }
    for (var j=1;j<settled.length;j++) { if(settled[j].status===type)cur++; else break; }
    streak={current:cur,type:type,best:best};
  }

  // Best/worst strategy
  var timeAnalysis = {};
  bets.forEach(function(b) {
    var h = new Date(b.date).getHours();
    var period = h<12?'Morning':h<18?'Afternoon':'Evening';
    if (!timeAnalysis[period]) timeAnalysis[period] = {pnl:0,count:0};
    timeAnalysis[period].pnl += b.status==='Won'?parseFloat(b.stake)*(parseFloat(b.odds)-1):b.status==='Lost'?-parseFloat(b.stake):0;
    timeAnalysis[period].count++;
  });

  return {
    totalPnL, totalStake, wonCount, lostCount, pendingCount, totalBets,
    winRate, roi, currentBalance, streak, suggestedStake,
    todayPnL, weekPnL, monthPnL, todayBets, lossLimitHit, timeAnalysis,
  };
}

export var useStore = create(function(set, get) {
  return {
    bets:[], bookies:DEFAULT_BOOKIES, sports:DEFAULT_SPORTS,
    bankrollStart:0, templates:[], loading:true, undoStack:[], currency:'INR',
    lossLimit: 1000, // daily loss limit in currency units

    init: async function() {
      var r = await Promise.all([
        getItem(KEYS.BETS,[]), getItem(KEYS.BOOKIES,null), getItem(KEYS.SPORTS,null),
        getItem(KEYS.BANKROLL,0), getItem(KEYS.TEMPLATES,[]), getItem(KEYS.CURRENCY,'INR'),
        getItem('sl_loss_limit',1000),
      ]);
      set({ bets:r[0], bookies:r[1]||DEFAULT_BOOKIES, sports:r[2]||DEFAULT_SPORTS,
            bankrollStart:r[3], templates:r[4], currency:r[5], lossLimit:r[6], loading:false });
    },

    addBet: async function(betData) {
      var nb = Object.assign({},betData,{id:Date.now()});
      var bets = [nb].concat(get().bets);
      set({bets:bets}); await setItem(KEYS.BETS,bets); return nb;
    },
    updateBet: async function(u) {
      var prev = get().bets.find(function(b){return b.id===u.id;});
      var bets = get().bets.map(function(b){return b.id===u.id?u:b;});
      set({bets:bets,undoStack:[{type:'edit',prev:prev}].concat(get().undoStack.slice(0,9))});
      await setItem(KEYS.BETS,bets);
    },
    deleteBet: async function(id) {
      var prev = get().bets.find(function(b){return b.id===id;});
      var bets = get().bets.filter(function(b){return b.id!==id;});
      set({bets:bets,undoStack:[{type:'delete',prev:prev}].concat(get().undoStack.slice(0,9))});
      await setItem(KEYS.BETS,bets); return prev;
    },
    markStatus: async function(id,status) {
      var prev = get().bets.find(function(b){return b.id===id;});
      var bets = get().bets.map(function(b){return b.id===id?Object.assign({},b,{status:status}):b;});
      set({bets:bets,undoStack:[{type:'status',prev:prev}].concat(get().undoStack.slice(0,9))});
      await setItem(KEYS.BETS,bets);
    },
    duplicateBet: async function(bet) {
      var nb = Object.assign({},bet,{id:Date.now(),status:'Pending',date:new Date().toISOString().slice(0,10)});
      var bets = [nb].concat(get().bets); set({bets:bets}); await setItem(KEYS.BETS,bets);
    },
    bulkAction: async function(ids,action) {
      var bets;
      if (action==='won')    bets=get().bets.map(function(b){return ids.includes(b.id)?Object.assign({},b,{status:'Won'}):b;});
      if (action==='lost')   bets=get().bets.map(function(b){return ids.includes(b.id)?Object.assign({},b,{status:'Lost'}):b;});
      if (action==='delete') bets=get().bets.filter(function(b){return !ids.includes(b.id);});
      if (bets){set({bets:bets});await setItem(KEYS.BETS,bets);}
    },
    undo: async function() {
      var stack=get().undoStack; if(!stack.length)return;
      var top=stack[0],rest=stack.slice(1);
      var bets=top.type==='delete'?[top.prev].concat(get().bets):get().bets.map(function(b){return b.id===top.prev.id?top.prev:b;});
      set({bets:bets,undoStack:rest}); await setItem(KEYS.BETS,bets);
    },
    clearAllBets: async function() { set({bets:[]}); await setItem(KEYS.BETS,[]); },
    saveBookies:  async function(v) { set({bookies:v});       await setItem(KEYS.BOOKIES,v);    },
    saveSports:   async function(v) { set({sports:v});        await setItem(KEYS.SPORTS,v);     },
    saveBankroll: async function(v) { set({bankrollStart:v}); await setItem(KEYS.BANKROLL,v);   },
    setCurrency:  async function(v) { set({currency:v});      await setItem(KEYS.CURRENCY,v);   },
    setLossLimit: async function(v) { set({lossLimit:v});     await setItem('sl_loss_limit',v); },
    saveTemplate: async function(t) {
      var ts=[Object.assign({},t,{id:Date.now()})].concat(get().templates);
      set({templates:ts}); await setItem(KEYS.TEMPLATES,ts);
    },
    deleteTemplate: async function(id) {
      var ts=get().templates.filter(function(t){return t.id!==id;});
      set({templates:ts}); await setItem(KEYS.TEMPLATES,ts);
    },
  };
});

export function useStats() {
  var bets          = useStore(function(s){return s.bets;});
  var bankrollStart = useStore(function(s){return s.bankrollStart;});
  var lossLimit     = useStore(function(s){return s.lossLimit;});
  return useMemo(function() {
    var s = calcStats(bets, bankrollStart);
    // Check daily loss limit
    s.lossLimitHit = lossLimit > 0 && s.todayPnL < -Math.abs(lossLimit);
    return s;
  }, [bets, bankrollStart, lossLimit]);
}
