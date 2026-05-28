// Chart.js — Material 3 Expressive · Smooth bezier · Spring entry · M3 tooltip
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, {
  Path, Defs, LinearGradient as SvgGradient, Stop,
  Circle, Line, G,
} from 'react-native-svg';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue, useAnimatedProps,
  withTiming, runOnJS, Easing, FadeIn,
} from 'react-native-reanimated';
import { useTheme } from './useTheme';
import { formatMoney } from './calculations';

const { width: SCREEN_W } = Dimensions.get('window');
const AnimatedPath = Animated.createAnimatedComponent(Path);

export default function Chart({
  data, color, height = 120,
  currSym = '₹', showLabels = false,
}) {
  const { colors, isDark } = useTheme();
  const [tooltip,  setTooltip]  = useState(null);
  const chartW  = SCREEN_W - 64;
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = 0;
    progress.value = withTiming(1, {
      duration: 950,
      easing: Easing.out(Easing.cubic),
    });
  }, [data?.length]);

  if (!data || data.length < 2) {
    return (
      <View style={[
        s.empty,
        {
          height,
          backgroundColor: isDark
            ? 'rgba(255,255,255,0.04)'
            : 'rgba(0,0,0,0.03)',
          borderRadius: 16,
        },
      ]}>
        <Text style={[s.emptyTxt, { color: colors.textTertiary }]}>
          Add more bets to see chart
        </Text>
      </View>
    );
  }

  const vals  = data.map(d => d.y);
  const minV  = Math.min(...vals);
  const maxV  = Math.max(...vals);
  const range = maxV - minV || 1;

  const PAD_T = 14, PAD_B = 22, PAD_H = 8;
  const innerW = chartW - PAD_H * 2;
  const innerH = height - PAD_T - PAD_B;

  const xPos = i  => PAD_H + (i / (data.length - 1)) * innerW;
  const yPos = yv => PAD_T + innerH - ((yv - minV) / range) * innerH;

  // Smooth cubic bezier
  const linePath = data.map((d, i) => {
    const x = xPos(i), y = yPos(d.y);
    if (i === 0) return `M ${x.toFixed(2)} ${y.toFixed(2)}`;
    const px  = xPos(i - 1), py = yPos(data[i - 1].y);
    const cpx = (px + x) / 2;
    return `C ${cpx.toFixed(2)} ${py.toFixed(2)} ${cpx.toFixed(2)} ${y.toFixed(2)} ${x.toFixed(2)} ${y.toFixed(2)}`;
  }).join(' ');

  const lastX    = xPos(data.length - 1);
  const firstX   = xPos(0);
  const fillPath = `${linePath} L ${lastX.toFixed(2)} ${(PAD_T + innerH).toFixed(2)} L ${firstX.toFixed(2)} ${(PAD_T + innerH).toFixed(2)} Z`;
  const zeroY    = minV < 0 && maxV > 0 ? yPos(0) : null;
  const gradId   = `grad_${color.replace(/[^a-z0-9]/gi, '')}`;

  // Touch handlers
  const handleTouch = x => {
    const idx     = Math.round(((x - PAD_H) / innerW) * (data.length - 1));
    const clamped = Math.min(Math.max(idx, 0), data.length - 1);
    setTooltip({
      idx:  clamped,
      x:    xPos(clamped),
      y:    yPos(data[clamped].y),
      val:  data[clamped].y,
      date: data[clamped].date || '',
    });
  };
  const clearTooltip = () => setTooltip(null);

  const pan = Gesture.Pan()
    .onUpdate(e => runOnJS(handleTouch)(e.x))
    .onEnd(() => runOnJS(clearTooltip)());
  const tap     = Gesture.Tap().onEnd(e => runOnJS(handleTouch)(e.x));
  const gesture = Gesture.Race(pan, tap);

  const isPos = tooltip ? tooltip.val >= 0 : data[data.length - 1]?.y >= 0;
  const tooltipBg = isDark
    ? colors.surfaceElevated || colors.surfaceContainerHigh || '#1F1F2E'
    : '#FFFFFF';

  return (
    <View style={{ height: height + (showLabels ? 28 : 0) + (tooltip ? 52 : 0) }}>

      {/* ── M3 Tooltip card ── */}
      {tooltip && (
        <Animated.View
          entering={FadeIn.duration(160)}
          style={[
            s.tooltip,
            {
              backgroundColor: tooltipBg,
              borderColor:     isPos ? 'rgba(0,191,111,0.3)' : 'rgba(255,68,68,0.3)',
              left: Math.min(Math.max(tooltip.x - 52, 0), chartW - 110),
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: isDark ? 0.3 : 0.1,
              shadowRadius: 12,
              elevation: 8,
            },
          ]}
        >
          {tooltip.date
            ? <Text style={[s.ttDate, { color: colors.textTertiary }]}>{tooltip.date}</Text>
            : null}
          <Text style={[s.ttVal, {
            color: isPos ? '#00BF6F' : '#FF4444',
          }]}>
            {tooltip.val >= 0 ? '+' : ''}{formatMoney(tooltip.val, currSym)}
          </Text>
        </Animated.View>
      )}

      {/* ── SVG Chart ── */}
      <GestureDetector gesture={gesture}>
        <Animated.View>
          <Svg width={chartW} height={height}>
            <Defs>
              <SvgGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0%"   stopColor={color} stopOpacity="0.30" />
                <Stop offset="65%"  stopColor={color} stopOpacity="0.07" />
                <Stop offset="100%" stopColor={color} stopOpacity="0.00" />
              </SvgGradient>
            </Defs>

            {/* Zero reference line */}
            {zeroY !== null && (
              <Line
                x1={PAD_H}        y1={zeroY}
                x2={PAD_H + innerW} y2={zeroY}
                stroke={colors.border}
                strokeWidth="1"
                strokeDasharray="4,4"
                opacity="0.6"
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

            {/* First dot */}
            <Circle
              cx={xPos(0)} cy={yPos(data[0].y)}
              r="3.5" fill={color} opacity="0.45"
            />

            {/* Last dot — glowing */}
            <Circle
              cx={xPos(data.length - 1)}
              cy={yPos(data[data.length - 1].y)}
              r="9" fill={color} opacity="0.16"
            />
            <Circle
              cx={xPos(data.length - 1)}
              cy={yPos(data[data.length - 1].y)}
              r="4.5" fill={color}
            />

            {/* Tooltip crosshair */}
            {tooltip && (
              <G>
                <Line
                  x1={tooltip.x} y1={PAD_T}
                  x2={tooltip.x} y2={PAD_T + innerH}
                  stroke={color}
                  strokeWidth="1.5"
                  strokeDasharray="4,3"
                  opacity="0.5"
                />
                <Circle cx={tooltip.x} cy={tooltip.y} r="11" fill={color} opacity="0.15" />
                <Circle cx={tooltip.x} cy={tooltip.y} r="5.5" fill={color} />
              </G>
            )}
          </Svg>
        </Animated.View>
      </GestureDetector>

      {/* Min/Max labels */}
      {showLabels && (
        <View style={s.labelsRow}>
          <Text style={[s.labelTxt, { color: colors.textTertiary }]}>
            {formatMoney(minV, currSym)}
          </Text>
          <Text style={[s.labelTxt, { color: colors.textTertiary }]}>
            {formatMoney(maxV, currSym)}
          </Text>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  empty:     { alignItems: 'center', justifyContent: 'center' },
  emptyTxt:  { fontSize: 13, fontWeight: '500' },

  // M3 tooltip — tonal surface, no blur
  tooltip: {
    position:        'absolute',
    top:             0,
    borderRadius:    16,
    paddingHorizontal: 14,
    paddingVertical:   9,
    zIndex:          20,
    borderWidth:     1,
    alignItems:      'center',
    minWidth:        100,
  },
  ttDate:    { fontSize: 10, fontWeight: '700', marginBottom: 2 },
  ttVal:     { fontSize: 15, fontWeight: '900', letterSpacing: -0.4 },

  labelsRow: { flexDirection: 'row', justifyContent: 'space-between',
               marginTop: 6, paddingHorizontal: 8 },
  labelTxt:  { fontSize: 10, fontWeight: '600' },
});
