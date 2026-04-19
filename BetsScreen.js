// BetsScreen.js — Timeline feed with vertical line + dots
import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, SectionList, StyleSheet, Pressable,
  TextInput, ScrollView, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown, Layout } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTheme } from './useTheme';
import { useStore, useStats } from './store';
import BetCard from './BetCard';
import AddBetModal from './AddBetModal';
import QuickBet from './QuickBet';
import { formatMoney, getCurrencySymbol, makeForm } from './calculations';

var STATUSES    = ['All', 'Pending', 'Won', 'Lost', 'Void'];
var DATE_RANGES = [
  { key:'all',   label:'All time' },
  { key:'today', label:'Today'    },
  { key:'week',  label:'7 days'   },
  { key:'month', label:'Month'    },
];
var SORTS = [
  { key:'date_desc',  label:'Newest'  },
  { key:'date_asc',   label:'Oldest'  },
  { key:'stake_desc', label:'Stake ↓' },
  { key:'pnl_desc',   label:'P&L ↓'  },
];
var STATUS_COLORS = {
  Won:     { bg:'#E8F8EE', border:'#A7DFB9', text:'#1A9E4A' },
  Lost:    { bg:'#FDECEA', border:'#F5B8B2', text:'#D93025' },
  Pending: { bg:'#FFF8E7', border:'#FFD980', text:'#E07B00' },
  Void:    { bg:'#F5F5F5', border:'#DDD',    text:'#888'    },
  All:     { bg:'#FFE8E8', border:'#FF3B30', text:'#FF3B30' },
};

function formatDateLabel(d) {
  var now = new Date();
  if (new Date(d).toDateString() === now.toDateString()) return 'Today';
  if (new Date(d).toDateString() === new Date(now-86400000).toDateString()) return 'Yesterday';
  return new Date(d).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'});
}

// Timeline date header with vertical line
function DateHeader({ title, dayPnL, currSym, colors }) {
  var isPos = dayPnL >= 0;
  return (
    <View style={[dh.row, { backgroundColor: colors.background }]}>
      <View style={[dh.line, { backgroundColor: colors.border }]} />
      <View style={[dh.pill, { backgroundColor: colors.surfaceVariant, borderColor: colors.border }]}>
        <Text style={[dh.date, { color: colors.textSecondary }]}>{title}</Text>
        {dayPnL !== 0 && (
          <Text style={[dh.pnl, { color: isPos?'#1A9E4A':'#D93025' }]}>
            {isPos?'+':''}{formatMoney(dayPnL, currSym)}
          </Text>
        )}
      </View>
      <View style={[dh.line, { backgroundColor: colors.border }]} />
    </View>
  );
}
var dh = StyleSheet.create({
  row:  { flexDirection:'row', alignItems:'center', paddingVertical:10 },
  line: { flex:1, height:0.5 },
  pill: { flexDirection:'row', alignItems:'center', gap:8, paddingHorizontal:12, paddingVertical:5, borderRadius:999, borderWidth:0.5, marginHorizontal:10 },
  date: { fontSize:12, fontWeight:'700' },
  pnl:  { fontSize:12, fontWeight:'800' },
});

export default function BetsScreen() {
  var { colors } = useTheme();
  var bets         = useStore(function(s){return s.bets;});
  var bookies      = useStore(function(s){return s.bookies;});
  var sports       = useStore(function(s){return s.sports;});
  var templates    = useStore(function(s){return s.templates;});
  var currency     = useStore(function(s){return s.currency;});
  var undoStack    = useStore(function(s){return s.undoStack;});
  var addBet       = useStore(function(s){return s.addBet;});
  var updateBet    = useStore(function(s){return s.updateBet;});
  var deleteBet    = useStore(function(s){return s.deleteBet;});
  var markStatus   = useStore(function(s){return s.markStatus;});
  var duplicateBet = useStore(function(s){return s.duplicateBet;});
  var bulkAction   = useStore(function(s){return s.bulkAction;});
  var undo         = useStore(function(s){return s.undo;});
  var stats        = useStats();
  var currSym      = getCurrencySymbol(currency);

  var [modal,       setModal]       = useState(false);
  var [quickBet,    setQuickBet]    = useState(false);
  var [editBet,     setEditBet]     = useState(null);
  var [search,      setSearch]      = useState('');
  var [filterStatus,setFilterStatus]= useState('All');
  var [dateRange,   setDateRange]   = useState('all');
  var [sortBy,      setSortBy]      = useState('date_desc');
  var [showFilters, setShowFilters] = useState(false);
  var [bulkMode,    setBulkMode]    = useState(false);
  var [selected,    setSelected]    = useState(new Set());

  var filtered = useMemo(function() {
    var now = new Date();
    return bets.filter(function(b) {
      if (filterStatus!=='All' && b.status!==filterStatus) return false;
      if (search) { var q=search.toLowerCase(); if (!b.event.toLowerCase().includes(q)&&!b.bet.toLowerCase().includes(q)&&!(b.tags||[]).join(' ').toLowerCase().includes(q)) return false; }
      if (dateRange==='today' && new Date(b.date).toDateString()!==now.toDateString()) return false;
      if (dateRange==='week'  && (now-new Date(b.date))/86400000>7) return false;
      if (dateRange==='month') { var d=new Date(b.date); if (d.getMonth()!==now.getMonth()||d.getFullYear()!==now.getFullYear()) return false; }
      return true;
    }).sort(function(a,b) {
      if (sortBy==='date_desc') return new Date(b.date)-new Date(a.date);
      if (sortBy==='date_asc')  return new Date(a.date)-new Date(b.date);
      if (sortBy==='stake_desc') return parseFloat(b.stake)-parseFloat(a.stake);
      if (sortBy==='pnl_desc') {
        var pa=a.status==='Won'?parseFloat(a.stake)*(parseFloat(a.odds)-1):a.status==='Lost'?-parseFloat(a.stake):0;
        var pb=b.status==='Won'?parseFloat(b.stake)*(parseFloat(b.odds)-1):b.status==='Lost'?-parseFloat(b.stake):0;
        return pb-pa;
      }
      return 0;
    });
  }, [bets,filterStatus,search,dateRange,sortBy]);

  var sections = useMemo(function() {
    var groups={}, order=[];
    filtered.forEach(function(bet) {
      var dk=bet.date||'Unknown';
      if (!groups[dk]){groups[dk]=[];order.push(dk);}
      groups[dk].push(bet);
    });
    return order.map(function(dk) {
      var day=groups[dk];
      var pnl=day.reduce(function(s,b){
        if(b.status==='Won') return s+parseFloat(b.stake)*(parseFloat(b.odds)-1);
        if(b.status==='Lost') return s-parseFloat(b.stake);
        return s;
      },0);
      return {title:dk,displayTitle:formatDateLabel(dk),dayPnL:pnl,data:day};
    });
  }, [filtered]);

  var handleSave = useCallback(async function(form) {
    if (editBet) await updateBet(Object.assign({},form,{id:editBet.id}));
    else await addBet(form);
    setEditBet(null);
  },[editBet,addBet,updateBet]);

  var handleWon  = function(id){markStatus(id,'Won'); Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);};
  var handleLost = function(id){markStatus(id,'Lost');Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);};
  var toggleSel  = function(id){setSelected(function(s){var n=new Set(s);n.has(id)?n.delete(id):n.add(id);return n;});};
  var handleBulk = function(action){bulkAction(Array.from(selected),action);setSelected(new Set());setBulkMode(false);};

  var isPos = stats.totalPnL >= 0;
  var summaryItems = [
    {key:'pnl',  label:'P&L',     value:(isPos?'+':'')+formatMoney(stats.totalPnL,currSym), color:isPos?'#1A9E4A':'#D93025', bg:isPos?'#E8F8EE':'#FDECEA', border:isPos?'#A7DFB9':'#F5B8B2'},
    {key:'wr',   label:'WIN RATE',value:stats.winRate?stats.winRate+'%':'—',               color:colors.textPrimary,bg:colors.surface,border:colors.border},
    {key:'won',  label:'WON',     value:String(stats.wonCount),  color:'#1A9E4A',bg:'#E8F8EE',border:'#A7DFB9'},
    {key:'lost', label:'LOST',    value:String(stats.lostCount), color:'#D93025',bg:'#FDECEA',border:'#F5B8B2'},
    {key:'pend', label:'PENDING', value:String(stats.pendingCount),color:'#E07B00',bg:'#FFF8E7',border:'#FFD980'},
  ];

  return (
    <SafeAreaView style={[s.screen,{backgroundColor:colors.background}]} edges={['top']}>
      <View style={[s.topBar,{borderBottomColor:colors.border}]}>
        <Text style={[s.title,{color:colors.textPrimary}]}>My Bets</Text>
        <View style={{flexDirection:'row',gap:8}}>
          <Pressable onPress={()=>{setQuickBet(true);Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);}}
            style={[s.addBtn,{backgroundColor:'rgba(124,58,237,0.12)'}]}>
            <Text style={{color:'#7C3AED',fontSize:16,fontWeight:'700'}}>⚡</Text>
          </Pressable>
          <Pressable onPress={()=>{setEditBet(null);setModal(true);Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);}}
            style={[s.addBtn,{backgroundColor:'#FFE8E8'}]}>
            <Text style={{color:'#FF3B30',fontSize:22,lineHeight:26}}>＋</Text>
          </Pressable>
        </View>
      </View>

      {bets.length>0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.summaryScroll} contentContainerStyle={s.summaryRow}>
          {summaryItems.map(function(item){
            return (
              <View key={item.key} style={[s.summaryPill,{backgroundColor:item.bg,borderColor:item.border}]}>
                <Text style={[s.summaryVal,{color:item.color}]} numberOfLines={1} adjustsFontSizeToFit>{item.value}</Text>
                <Text style={[s.summaryLbl,{color:item.color}]}>{item.label}</Text>
              </View>
            );
          })}
        </ScrollView>
      )}

      <View style={[s.searchRow,{backgroundColor:colors.surfaceVariant,borderColor:search?'#FF3B30':colors.border}]}>
        <Text style={{fontSize:15,color:colors.textTertiary}}>🔍</Text>
        <TextInput style={[s.searchInput,{color:colors.textPrimary}]} value={search} onChangeText={setSearch}
          placeholder="Search events, bets, #tags..." placeholderTextColor={colors.textTertiary} />
        {search?<Pressable onPress={()=>setSearch('')}><Text style={{color:colors.textTertiary,fontSize:20}}>×</Text></Pressable>:null}
        <Pressable onPress={()=>{setShowFilters(function(v){return !v;});Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);}}
          style={[s.filterBtn,{backgroundColor:showFilters?'#FF3B30':colors.surface,borderColor:showFilters?'#FF3B30':colors.border}]}>
          <Text style={{fontSize:12,color:showFilters?'#fff':colors.textSecondary,fontWeight:'700'}}>{showFilters?'▲ Close':'▼ Filter'}</Text>
        </Pressable>
      </View>

      {showFilters && (
        <View style={[s.filterPanel,{backgroundColor:colors.surface,borderColor:colors.border}]}>
          <Text style={[s.fLbl,{color:colors.textTertiary}]}>STATUS</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginBottom:12}}>
            <View style={s.chipRow}>
              {STATUSES.map(function(st){
                var active=filterStatus===st; var cc=STATUS_COLORS[st]||{bg:'#F5F5F5',border:'#DDD',text:'#888'};
                return (
                  <Pressable key={st} onPress={()=>setFilterStatus(st)}
                    style={[s.chip,{backgroundColor:active?cc.bg:colors.surfaceVariant,borderColor:active?cc.border:colors.border}]}>
                    <Text style={[s.chipTxt,{color:active?cc.text:colors.textTertiary,fontWeight:active?'700':'500'}]}>{st}</Text>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>
          <Text style={[s.fLbl,{color:colors.textTertiary}]}>DATE</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginBottom:12}}>
            <View style={s.chipRow}>
              {DATE_RANGES.map(function(dr){
                var active=dateRange===dr.key;
                return (
                  <Pressable key={dr.key} onPress={()=>setDateRange(dr.key)}
                    style={[s.chip,{backgroundColor:active?'#FFE8E8':colors.surfaceVariant,borderColor:active?'#FF3B30':colors.border}]}>
                    <Text style={[s.chipTxt,{color:active?'#FF3B30':colors.textTertiary,fontWeight:active?'700':'500'}]}>{dr.label}</Text>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>
          <Text style={[s.fLbl,{color:colors.textTertiary}]}>SORT</Text>
          <View style={s.chipRow}>
            {SORTS.map(function(so){
              var active=sortBy===so.key;
              return (
                <Pressable key={so.key} onPress={()=>setSortBy(so.key)}
                  style={[s.chip,{backgroundColor:active?'#FF3B30':colors.surfaceVariant,borderColor:active?'#FF3B30':colors.border}]}>
                  <Text style={[s.chipTxt,{color:active?'#fff':colors.textTertiary,fontWeight:active?'700':'500'}]}>{so.label}</Text>
                </Pressable>
              );
            })}
            <Pressable onPress={()=>{setBulkMode(function(v){return !v;});setSelected(new Set());}}
              style={[s.chip,{backgroundColor:bulkMode?'#FF3B30':colors.surfaceVariant,borderColor:bulkMode?'#FF3B30':colors.border}]}>
              <Text style={[s.chipTxt,{color:bulkMode?'#fff':colors.textTertiary,fontWeight:bulkMode?'700':'500'}]}>☑ Bulk</Text>
            </Pressable>
          </View>
        </View>
      )}

      {bulkMode && selected.size>0 && (
        <View style={[s.bulkBar,{backgroundColor:'#FFE8E8',borderColor:'#F5B8B2'}]}>
          <Text style={{color:'#FF3B30',fontWeight:'700',flex:1,fontSize:13}}>{selected.size} selected</Text>
          <Pressable onPress={()=>handleBulk('won')}  style={[s.bulkBtn,{backgroundColor:'#E8F8EE'}]}><Text style={{color:'#1A9E4A',fontWeight:'700',fontSize:12}}>✓ Won</Text></Pressable>
          <Pressable onPress={()=>handleBulk('lost')} style={[s.bulkBtn,{backgroundColor:'#FDECEA'}]}><Text style={{color:'#D93025',fontWeight:'700',fontSize:12}}>✕ Lost</Text></Pressable>
          <Pressable onPress={()=>Alert.alert('Delete?','',[{text:'Cancel',style:'cancel'},{text:'Delete',style:'destructive',onPress:()=>handleBulk('delete')}])}
            style={[s.bulkBtn,{backgroundColor:'#FDECEA'}]}><Text style={{color:'#D93025',fontWeight:'700',fontSize:12}}>🗑</Text></Pressable>
        </View>
      )}

      {undoStack.length>0 && (
        <Pressable onPress={undo} style={[s.undoBar,{backgroundColor:colors.textPrimary}]}>
          <Text style={{color:colors.background,fontWeight:'700',fontSize:13}}>↩ Undo last action</Text>
        </Pressable>
      )}

      <SectionList
        sections={sections}
        keyExtractor={function(item){return String(item.id);}}
        renderSectionHeader={function(ref){
          var sec=ref.section;
          return <DateHeader title={sec.displayTitle} dayPnL={sec.dayPnL} currSym={currSym} colors={colors} />;
        }}
        renderItem={function(ref){
          var item=ref.item; var index=ref.index;
          return (
            <Animated.View entering={FadeInDown.delay(Math.min(index*35,250)).springify()} layout={Layout.springify()}>
              <BetCard bet={item} hidden={false} currSym={currSym}
                onEdit={function(b){setEditBet(b);setModal(true);}}
                onDelete={deleteBet} onWon={handleWon} onLost={handleLost}
                onDuplicate={duplicateBet} onSlip={function(){}}
                bulkMode={bulkMode} selected={selected.has(item.id)} onSelect={toggleSel} />
            </Animated.View>
          );
        }}
        contentContainerStyle={[s.list,sections.length===0&&{flex:1}]}
        showsVerticalScrollIndicator={false}
        stickySectionHeadersEnabled={false}
        ListEmptyComponent={
          <View style={s.empty}>
            <Text style={s.emptyEmoji}>{bets.length===0?'🎯':'🔍'}</Text>
            <Text style={[s.emptyTitle,{color:colors.textPrimary}]}>{bets.length===0?'No bets yet':'No results'}</Text>
            <Text style={[s.emptySub,{color:colors.textTertiary}]}>{bets.length===0?'Tap ＋ to log your first bet':'Try changing filters'}</Text>
            {bets.length===0 && (
              <Pressable onPress={()=>{setEditBet(null);setModal(true);}} style={s.emptyBtn}>
                <Text style={s.emptyBtnTxt}>＋ Add First Bet</Text>
              </Pressable>
            )}
          </View>
        }
      />

      <AddBetModal visible={modal} onClose={()=>{setModal(false);setEditBet(null);}}
        onSave={handleSave} editBet={editBet}
        bookies={bookies} sports={sports} templates={templates}
        suggestStake={stats.suggestedStake} currSym={currSym} />

      <QuickBet visible={quickBet} onClose={()=>setQuickBet(false)}
        onSave={addBet} currSym={currSym} suggestStake={stats.suggestedStake} />
    </SafeAreaView>
  );
}

var s = StyleSheet.create({
  screen: {flex:1},
  topBar: {flexDirection:'row',justifyContent:'space-between',alignItems:'center',paddingHorizontal:16,paddingVertical:12,borderBottomWidth:0.5},
  title:  {fontSize:22,fontWeight:'700'},
  addBtn: {width:38,height:38,borderRadius:19,alignItems:'center',justifyContent:'center'},
  summaryScroll:{flexGrow:0,maxHeight:70},
  summaryRow:{paddingHorizontal:16,paddingVertical:8,gap:8,flexDirection:'row',alignItems:'center'},
  summaryPill:{borderRadius:14,paddingHorizontal:12,paddingVertical:9,borderWidth:0.5,alignItems:'center',minWidth:70,maxWidth:110},
  summaryVal:{fontSize:15,fontWeight:'800',letterSpacing:-0.3},
  summaryLbl:{fontSize:9,fontWeight:'700',textTransform:'uppercase',letterSpacing:0.4,marginTop:2,opacity:0.65},
  searchRow:{flexDirection:'row',alignItems:'center',marginHorizontal:16,marginBottom:8,borderRadius:14,borderWidth:0.5,paddingHorizontal:12,height:46,gap:8},
  searchInput:{flex:1,fontSize:14,fontWeight:'500'},
  filterBtn:{paddingHorizontal:10,paddingVertical:6,borderRadius:10,borderWidth:0.5},
  filterPanel:{marginHorizontal:16,marginBottom:8,borderRadius:16,borderWidth:0.5,padding:14},
  fLbl:{fontSize:9,fontWeight:'700',letterSpacing:1,textTransform:'uppercase',marginBottom:8},
  chipRow:{flexDirection:'row',gap:7,flexWrap:'wrap'},
  chip:{paddingHorizontal:13,paddingVertical:6,borderRadius:999,borderWidth:0.5},
  chipTxt:{fontSize:12},
  bulkBar:{flexDirection:'row',alignItems:'center',gap:8,marginHorizontal:16,borderRadius:12,padding:10,marginBottom:6,borderWidth:0.5},
  bulkBtn:{paddingHorizontal:14,paddingVertical:7,borderRadius:999},
  undoBar:{marginHorizontal:16,borderRadius:12,padding:10,alignItems:'center',marginBottom:6},
  list:{paddingHorizontal:16,paddingBottom:140,paddingTop:4},
  empty:{flex:1,alignItems:'center',justifyContent:'center',paddingTop:60},
  emptyEmoji:{fontSize:48,marginBottom:14},
  emptyTitle:{fontSize:20,fontWeight:'700',marginBottom:6},
  emptySub:{fontSize:14,textAlign:'center',lineHeight:21},
  emptyBtn:{marginTop:20,backgroundColor:'#FF3B30',borderRadius:999,paddingHorizontal:24,paddingVertical:13,shadowColor:'#FF3B30',shadowOffset:{width:0,height:4},shadowOpacity:0.3,shadowRadius:10,elevation:5},
  emptyBtnTxt:{color:'#fff',fontWeight:'700',fontSize:15},
});
