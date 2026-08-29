import { Circle, Svg } from 'react-native-svg';
import { Platform, StyleSheet, Text, View, type ViewStyle } from 'react-native';

import { useAppTheme } from '@/hooks/useAppTheme';

type Props = {
  count: number;
  total?: number;
  size?: number;
  label?: string;
  compact?: boolean;
};

export function SharedProgressRing({ count, total = 11, size = 190, label = '今日共同完成', compact = false }: Props) {
  const { colors } = useAppTheme();
  const strokeWidth = compact ? 7 : 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(1, Math.max(0, count / total));
  const dash = progress * circumference;
  const percentage = Math.round(progress * 100);

  const center = (
    <View style={styles.center}>
      <Text style={[styles.count, { color: colors.ink, fontSize: compact ? 26 : 36 }]}>{count}<Text style={[styles.total, { color: colors.inkMuted }]}> / {total}</Text></Text>
      <Text style={[styles.label, { color: colors.inkMuted }]}>{label}</Text>
      {!compact ? <Text style={[styles.percent, { color: colors.accent }]}>{percentage}%</Text> : null}
    </View>
  );

  if (Platform.OS === 'web') {
    const webRingStyle = {
      width: size,
      height: size,
      borderRadius: size / 2,
      padding: strokeWidth,
      backgroundImage: `conic-gradient(${colors.accent} ${percentage}%, ${colors.line} ${percentage}% 100%)`,
    } as unknown as ViewStyle;

    return (
      <View style={[styles.wrapper, { width: size, height: size }]}>
        <View
          style={[
            styles.webRing,
            webRingStyle,
          ]}
        >
          <View style={[styles.webCutout, { borderRadius: size / 2, backgroundColor: colors.surfaceGreen }]}>{center}</View>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.wrapper, { width: size, height: size }]}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.line}
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.accent}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={[dash, circumference]}
          fill="transparent"
          rotation="-90"
          origin={size / 2 + ',' + size / 2}
        />
      </Svg>
      {center}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  webRing: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  webCutout: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  count: {
    fontWeight: '800',
    letterSpacing: -1,
  },
  total: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  percent: {
    fontSize: 12,
    fontWeight: '800',
    marginTop: 5,
  },
});
