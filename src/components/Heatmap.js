// components/Heatmap.js
import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { Typography, Spacing } from '../utils/theme';

const DAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function Heatmap({ dayData, currSym = '₹' }) {
  const { colors } = useTheme();
  const now = new Date();
  const year = now.getFullYear(), month = now.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  function getCellBg(d) {
    const data = dayData[d];
    if (!data) return colors.surfaceVariant;
    const intensity = Math.min(0.9, 0.3 + Math.abs(data.pnl) / 3000);
    if (data.pnl > 0) return `rgba(0, 200, 83, ${intensity})`;
    if (data.pnl < 0) return `rgba(229, 9, 20, ${intensity})`;
    return colors.border;
  }

  return (
    <View>
      <Text style={[styles.monthLabel, { color: colors.textSecondary }]}>
        {MONTHS[month]} {year}
      </Text>

      {/* Day headers */}
      <View style={styles.grid}>
        {DAYS.map((d, i) => (
          <View key={i} style={styles.cell}>
            <Text style={[styles.dayHeader, { color: colors.textTertiary }]}>{d}</Text>
          </View>
        ))}
      </View>

      {/* Calendar cells */}
      <View style={styles.grid}>
        {cells.map((d, i) => {
          if (!d) return <View key={i} style={styles.cell} />;
          const data = dayData[d];
          const isToday = d === now.getDate();
          return (
            <View key={i} style={styles.cell}>
              <View style={[
                styles.dayCell,
                { backgroundColor: getCellBg(d) },
                isToday && { borderWidth: 2, borderColor: colors.primary },
              ]}>
                <Text style={[
                  styles.dayNum,
                  { color: data ? colors.textPrimary : colors.textTertiary },
                  isToday && { fontWeight: '900', color: colors.primary },
                ]}>
                  {d}
                </Text>
              </View>
            </View>
          );
        })}
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        {[{ color: 'rgba(0,200,83,0.6)', label: 'Profit' }, { color: 'rgba(229,9,20,0.6)', label: 'Loss' }, { color: colors.surfaceVariant, label: 'No bet' }].map(item => (
          <View key={item.label} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: item.color }]} />
            <Text style={[styles.legendText, { color: colors.textTertiary }]}>{item.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  monthLabel: { ...Typography.label, textAlign: 'center', marginBottom: Spacing.sm, textTransform: 'uppercase' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: '14.28%', aspectRatio: 1, padding: 2, alignItems: 'center', justifyContent: 'center' },
  dayHeader: { ...Typography.micro, textTransform: 'uppercase' },
  dayCell: { width: '100%', height: '100%', borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  dayNum: { ...Typography.micro, fontWeight: '600' },
  legend: { flexDirection: 'row', justifyContent: 'center', gap: 16, marginTop: Spacing.sm },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 10, height: 10, borderRadius: 3 },
  legendText: { ...Typography.caption },
});
