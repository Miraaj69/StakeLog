// components/Chart.js
import React, { useState } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Path, Defs, LinearGradient as SvgGradient, Stop, Circle, Line } from 'react-native-svg';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedStyle, runOnJS } from 'react-native-reanimated';
import { useTheme } from './useTheme';
import { formatMoney } from './calculations';
import { Typography, Spacing } from './theme';

const { width: SCREEN_W } = Dimensions.get('window');

export default function Chart({ data, color, height = 120, currSym = '₹', showLabels = false }) {
  const { colors } = useTheme();
  const [tooltip, setTooltip] = useState(null);
  const chartW = SCREEN_W - 64;

  if (!data || data.length < 2) {
    return (
      <View style={[styles.empty, { height }]}>
        <Text style={[styles.emptyText, { color: colors.textTertiary }]}>Not enough data yet</Text>
      </View>
    );
  }

  const vals = data.map(d => d.y);
  const minV = Math.min(...vals);
  const maxV = Math.max(...vals);
  const range = maxV - minV || 1;
  const PAD = 16;

  const pts = data.map((d, i) => ({
    x: (i / (data.length - 1)) * chartW,
    y: height - ((d.y - minV) / range) * (height - PAD * 2) - PAD,
    val: d.y,
    label: d.date || '',
  }));

  const pathD = `M ${pts.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' L ')}`;
  const fillD = `${pathD} L ${pts[pts.length - 1].x},${height} L 0,${height} Z`;

  const gradId = `grad_${color.replace('#', '')}`;

  const handleTouch = (x) => {
    const idx = Math.round((x / chartW) * (pts.length - 1));
    const clamped = Math.min(Math.max(idx, 0), pts.length - 1);
    setTooltip(pts[clamped]);
  };

  const pan = Gesture.Pan()
    .onUpdate(e => runOnJS(handleTouch)(e.x))
    .onEnd(() => runOnJS(setTooltip)(null));

  const tap = Gesture.Tap()
    .onEnd(e => runOnJS(handleTouch)(e.x));

  const gesture = Gesture.Race(pan, tap);

  return (
    <View style={{ height: height + 30 }}>
      {tooltip && (
        <View style={[styles.tooltip, { backgroundColor: color, left: Math.min(Math.max(tooltip.x - 40, 0), chartW - 80) }]}>
          <Text style={styles.tooltipText}>{tooltip.val >= 0 ? '+' : ''}{formatMoney(tooltip.val, currSym)}</Text>
          {tooltip.label ? <Text style={styles.tooltipDate}>{tooltip.label}</Text> : null}
        </View>
      )}
      <GestureDetector gesture={gesture}>
        <Animated.View>
          <Svg width={chartW} height={height}>
            <Defs>
              <SvgGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0%" stopColor={color} stopOpacity="0.35" />
                <Stop offset="100%" stopColor={color} stopOpacity="0.02" />
              </SvgGradient>
            </Defs>
            <Path d={fillD} fill={`url(#${gradId})`} />
            <Path d={pathD} fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
            {tooltip && (
              <>
                <Line x1={tooltip.x} y1={0} x2={tooltip.x} y2={height} stroke={color} strokeWidth={1} strokeDasharray="4 3" opacity={0.5} />
                <Circle cx={tooltip.x} cy={tooltip.y} r={5} fill={color} stroke="white" strokeWidth={2} />
              </>
            )}
          </Svg>
        </Animated.View>
      </GestureDetector>

      {showLabels && (
        <View style={styles.labelsRow}>
          <Text style={[styles.labelText, { color: colors.textTertiary }]}>
            {formatMoney(minV, currSym)}
          </Text>
          <Text style={[styles.labelText, { color: colors.textTertiary }]}>
            {formatMoney(maxV, currSym)}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: { ...Typography.bodySmall },
  tooltip: {
    position: 'absolute',
    top: 0,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    zIndex: 10,
  },
  tooltipText: { color: '#fff', fontSize: 12, fontWeight: '800' },
  tooltipDate: { color: 'rgba(255,255,255,0.8)', fontSize: 10 },
  labelsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4, paddingHorizontal: 2 },
  labelText: { ...Typography.caption },
});
