// Heatmap.js — Material 3 Expressive · Tonal calendar cells
import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, FadeIn,
} from 'react-native-reanimated';
import { useTheme } from './useTheme';
import { formatMoney } from './calculations';

const DAYS   = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

// ─── CELL ────────────────────────────────────────────────────────
function Cell({ day, data, isToday, colors }) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const hasData = !!data;
  const isProfit = hasData && data.pnl > 0;
  const isLoss   = hasData && data.pnl < 0;

  // M3 tonal intensity — based on pnl magnitude
  const intensity = hasData
    ? Math.min(0.9, 0.25 + Math.abs(data.pnl) / 5000)
    : 0;

  const bg = isProfit
    ? `rgba(0,191,111,${intensity})`
    : isLoss
      ? `rgba(255,68,68,${intensity})`
      : colors.surfaceVariant;

  return (
    <View style={c.wrap}>
      <Animated.View style={animStyle}>
        <Pressable
          onPressIn={() => {
            if (hasData) scale.value = withSpring(0.85, { damping: 16, stiffness: 400 });
          }}
          onPressOut={() => {
            scale.value = withSpring(1, { damping: 16, stiffness: 400 });
          }}
          style={[
            c.cell,
            { backgroundColor: bg },
            isToday && {
              borderWidth:  2,
              borderColor:  '#FF4B6A',
              shadowColor:  '#FF4B6A',
              shadowOpacity: 0.35,
              shadowRadius:  4,
              shadowOffset: { width: 0, height: 0 },
            },
          ]}
        >
          <Text style={[
            c.num,
            { color: hasData ? colors.textPrimary : colors.textTertiary },
            isToday && { color: '#FF4B6A', fontWeight: '900' },
          ]}>
            {day}
          </Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}
const c = StyleSheet.create({
  wrap: { width: '14.28%', aspectRatio: 1, padding: 2,
          alignItems: 'center', justifyContent: 'center' },
  cell: { width: '100%', height: '100%', borderRadius: 8,
          alignItems: 'center', justifyContent: 'center' },
  num:  { fontSize: 10, fontWeight: '600' },
});

// ─── TOOLTIP ─────────────────────────────────────────────────────
function DayTooltip({ data, day, currSym, colors, isDark }) {
  if (!data) return null;
  const isProfit = data.pnl >= 0;
  const color    = isProfit ? '#00BF6F' : '#FF4444';

  return (
    <Animated.View
      entering={FadeIn.duration(200)}
      style={[tt.wrap, {
        backgroundColor: isDark ? colors.surfaceElevated || colors.surfaceVariant : '#FFFFFF',
        borderColor:     isProfit ? 'rgba(0,191,111,0.25)' : 'rgba(255,68,68,0.25)',
        shadowColor:     '#000',
        shadowOffset:    { width: 0, height: 4 },
        shadowOpacity:   0.12,
        shadowRadius:    12,
        elevation:       8,
      }]}
    >
      <Text style={[tt.day, { color: colors.textTertiary }]}>Day {day}</Text>
      <Text style={[tt.pnl, { color }]}>
        {isProfit ? '+' : ''}{formatMoney(data.pnl, currSym)}
      </Text>
      <Text style={[tt.bets, { color: colors.textTertiary }]}>
        {data.bets} bet{data.bets !== 1 ? 's' : ''}
      </Text>
    </Animated.View>
  );
}
const tt = StyleSheet.create({
  wrap: { borderRadius: 14, padding: 12, borderWidth: 1,
          alignItems: 'center', marginTop: 10, alignSelf: 'center' },
  day:  { fontSize: 10, fontWeight: '700', textTransform: 'uppercase',
          letterSpacing: 0.8, marginBottom: 4 },
  pnl:  { fontSize: 20, fontWeight: '900', letterSpacing: -0.5 },
  bets: { fontSize: 11, fontWeight: '600', marginTop: 3 },
});

// ─── MAIN COMPONENT ──────────────────────────────────────────────
export default function Heatmap({ dayData = {}, currSym = '₹' }) {
  const { colors, isDark } = useTheme();
  const [selected, setSelected] = useState(null);

  const now        = new Date();
  const year       = now.getFullYear();
  const month      = now.getMonth();
  const firstDay   = new Date(year, month, 1).getDay();
  const daysInMon  = new Date(year, month + 1, 0).getDate();

  // Build cells array — nulls for leading empty slots
  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMon; d++) cells.push(d);

  return (
    <View>
      {/* Month label */}
      <Text style={[h.monthLabel, { color: colors.textSecondary }]}>
        {MONTHS[month]} {year}
      </Text>

      {/* Day headers */}
      <View style={h.grid}>
        {DAYS.map((d, i) => (
          <View key={i} style={h.headerCell}>
            <Text style={[h.dayHeader, { color: colors.textTertiary }]}>{d}</Text>
          </View>
        ))}
      </View>

      {/* Calendar cells */}
      <View style={h.grid}>
        {cells.map((day, i) => {
          if (!day) return <View key={`e_${i}`} style={c.wrap} />;
          const isToday = day === now.getDate();
          return (
            <Pressable
              key={day}
              onPress={() => setSelected(selected === day ? null : day)}
            >
              <Cell
                day={day}
                data={dayData[day]}
                isToday={isToday}
                colors={colors}
              />
            </Pressable>
          );
        })}
      </View>

      {/* Tooltip for selected day */}
      {selected && (
        <DayTooltip
          data={dayData[selected]}
          day={selected}
          currSym={currSym}
          colors={colors}
          isDark={isDark}
        />
      )}

      {/* Legend */}
      <View style={h.legend}>
        {[
          { color: 'rgba(0,191,111,0.55)', label: 'Profit'  },
          { color: 'rgba(255,68,68,0.55)',  label: 'Loss'    },
          { color: colors.surfaceVariant,   label: 'No bet'  },
          { color: '#FF4B6A',               label: 'Today', border: true },
        ].map(item => (
          <View key={item.label} style={h.legendItem}>
            <View style={[
              h.legendDot,
              { backgroundColor: item.color },
              item.border && { borderWidth: 2, borderColor: '#FF4B6A' },
            ]} />
            <Text style={[h.legendText, { color: colors.textTertiary }]}>
              {item.label}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const h = StyleSheet.create({
  monthLabel:  { fontSize: 11, fontWeight: '800', textAlign: 'center',
                 marginBottom: 10, letterSpacing: 1.2, textTransform: 'uppercase' },
  grid:        { flexDirection: 'row', flexWrap: 'wrap' },
  headerCell:  { width: '14.28%', alignItems: 'center', paddingVertical: 4 },
  dayHeader:   { fontSize: 9, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  legend:      { flexDirection: 'row', justifyContent: 'center',
                 gap: 14, marginTop: 12, flexWrap: 'wrap' },
  legendItem:  { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot:   { width: 10, height: 10, borderRadius: 3 },
  legendText:  { fontSize: 10, fontWeight: '600' },
});
