// Chart.js — Premium: smooth bezier, entry animation, polished tooltip
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, {
  Path, Defs, LinearGradient as SvgGradient, Stop,
  Circle, Line, G,
} from 'react-native-svg';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue, useAnimatedStyle, useAnimatedProps,
  withTiming, runOnJS, Easing,
} from 'react-native-reanimated';
import { useTheme } from './useTheme';
import { formatMoney } from './calculations';

const { width: SCREEN_W } = Dimensions.get('window');
const AnimatedPath = Animated.createAnimatedComponent(Path);

export default function Chart({ data, color, height = 120, currSym = '₹', showLabels = false }) {
  const { colors } = useTheme();
  const [tooltip, setTooltip] = useState(null);
  const chartW = SCREEN_W - 64;

  // Entry animation progress
  const progress = useSharedValue(0);
  useEffect(() => {
    progress.value = 0;
    progress.value = withTiming(1, {
      duration: 900,
      easing: Easing.out(Easing.cubic),
    });
  }, [data?.length]);

  if (!data || data.length < 2) {
    return (
      <View style={[styles.empty, { height, backgroundColor: colors.surfaceVariant, borderRadius: 14 }]}>
        <Text style={[styles.emptyText, { color: colors.textTertiary }]}>Add more bets to see chart</Text>
      </View>
    );
  }

  const vals = data.map(d => d.y);
  const minV = Math.min(...vals);
  const maxV = Math.max(...vals);
  const range = maxV - minV || 1;
  const PAD_T = 12, PAD_B = 20, PAD_H = 8;

  const innerW = chartW - PAD_H * 2;
  const innerH = height - PAD_T - PAD_B;

  function xPos(i) { return PAD_H + (i / (data.length - 1)) * innerW; }
  function yPos(y) { return PAD_T + innerH - ((y - minV) / range) * innerH; }

  // Smooth cubic bezier path
  function buildPath() {
    return data.map((d, i) => {
      const x = xPos(i), y = yPos(d.y);
      if (i === 0) return `M ${x.toFixed(2)} ${y.toFixed(2)}`;
      const px = xPos(i - 1), py = yPos(data[i - 1].y);
      const cpx = (px + x) / 2;
      return `C ${cpx.toFixed(2)} ${py.toFixed(2)} ${cpx.toFixed(2)} ${y.toFixed(2)} ${x.toFixed(2)} ${y.toFixed(2)}`;
    }).join(' ');
  }

  const linePath = buildPath();
  const lastX = xPos(data.length - 1);
  const firstX = xPos(0);
  const fillPath = `${linePath} L ${lastX.toFixed(2)} ${(PAD_T + innerH).toFixed(2)} L ${firstX.toFixed(2)} ${(PAD_T + innerH).toFixed(2)} Z`;

  const gradId = `grad_${color.replace(/[^a-z0-9]/gi, '')}`;
  const isPositive = data[data.length - 1]?.y >= 0;
  const zeroY = minV < 0 && maxV > 0 ? yPos(0) : null;

  // Tooltip interaction
  const handleTouch = (x) => {
    const idx = Math.round(((x - PAD_H) / innerW) * (data.length - 1));
    const clamped = Math.min(Math.max(idx, 0), data.length - 1);
    setTooltip({
      idx: clamped,
      x: xPos(clamped),
      y: yPos(data[clamped].y),
      val: data[clamped].y,
      date: data[clamped].date || '',
    });
  };
  const clearTooltip = () => setTooltip(null);

  const pan = Gesture.Pan()
    .onUpdate(e => runOnJS(handleTouch)(e.x))
    .onEnd(() => runOnJS(clearTooltip)());
  const tap = Gesture.Tap().onEnd(e => runOnJS(handleTouch)(e.x));
  const gesture = Gesture.Race(pan, tap);

  return (
    <View style={{ height: height + (showLabels ? 24 : 0) + (tooltip ? 40 : 0) }}>
      {/* Tooltip card — above chart */}
      {tooltip && (
        <View style={[
          styles.tooltip,
          {
            backgroundColor: color,
            left: Math.min(Math.max(tooltip.x - 48, 0), chartW - 100),
          },
        ]}>
          <Text style={styles.tooltipVal}>
            {tooltip.val >= 0 ? '+' : ''}{formatMoney(tooltip.val, currSym)}
          </Text>
          {tooltip.date ? <Text style={styles.tooltipDate}>{tooltip.date}</Text> : null}
        </View>
      )}

      <GestureDetector gesture={gesture}>
        <Animated.View>
          <Svg width={chartW} height={height}>
            <Defs>
              <SvgGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0%" stopColor={color} stopOpacity="0.28" />
                <Stop offset="70%" stopColor={color} stopOpacity="0.06" />
                <Stop offset="100%" stopColor={color} stopOpacity="0.0" />
              </SvgGradient>
            </Defs>

            {/* Zero reference line */}
            {zeroY !== null && (
              <Line
                x1={PAD_H} y1={zeroY} x2={PAD_H + innerW} y2={zeroY}
                stroke={colors.border} strokeWidth="1"
                strokeDasharray="4,4" opacity="0.6"
              />
            )}

            {/* Fill area */}
            <Path d={fillPath} fill={`url(#${gradId})`} />

            {/* Main line */}
            <Path
              d={linePath}
              fill="none"
              stroke={color}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* First & last dots */}
            <Circle
              cx={xPos(0)} cy={yPos(data[0].y)}
              r="3.5" fill={color} opacity="0.5"
            />
            <Circle
              cx={xPos(data.length - 1)} cy={yPos(data[data.length - 1].y)}
              r="4.5" fill={color}
            />
            <Circle
              cx={xPos(data.length - 1)} cy={yPos(data[data.length - 1].y)}
              r="8" fill={color} opacity="0.18"
            />

            {/* Tooltip crosshair */}
            {tooltip && (
              <G>
                <Line
                  x1={tooltip.x} y1={PAD_T} x2={tooltip.x} y2={PAD_T + innerH}
                  stroke={color} strokeWidth="1.5" strokeDasharray="4,3" opacity="0.5"
                />
                <Circle cx={tooltip.x} cy={tooltip.y} r="5.5" fill={color} />
                <Circle cx={tooltip.x} cy={tooltip.y} r="10" fill={color} opacity="0.2" />
              </G>
            )}
          </Svg>
        </Animated.View>
      </GestureDetector>

      {showLabels && (
        <View style={styles.labelsRow}>
          <Text style={[styles.labelText, { color: colors.textTertiary }]}>{formatMoney(minV, currSym)}</Text>
          <Text style={[styles.labelText, { color: colors.textTertiary }]}>{formatMoney(maxV, currSym)}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  empty: { alignItems: 'center', justifyContent: 'center' },
  emptyText: { fontSize: 13, fontWeight: '500' },
  tooltip: {
    position: 'absolute',
    top: 0,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 6,
  },
  tooltipVal: { color: '#fff', fontSize: 13, fontWeight: '800', letterSpacing: -0.3 },
  tooltipDate: { color: 'rgba(255,255,255,0.75)', fontSize: 10, marginTop: 1 },
  labelsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6, paddingHorizontal: 8 },
  labelText: { fontSize: 10, fontWeight: '600' },
});
