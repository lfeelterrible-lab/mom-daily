import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { useAppTheme } from '@/hooks/useAppTheme';

type Props = {
  current: number;
  longest?: number;
  compact?: boolean;
};

export function StreakBadge({ current, longest, compact = false }: Props) {
  const { colors } = useAppTheme();
  const flameColor = current >= 100 ? colors.lavender : current >= 30 ? colors.accent : colors.sun;

  if (compact) {
    return (
      <View style={[styles.compact, { backgroundColor: colors.surface }]}>
        <Ionicons name="flame" color={flameColor} size={16} />
        <Text style={[styles.compactText, { color: colors.ink }]}>{current}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.line }]}>
      <View style={[styles.iconBox, { backgroundColor: colors.accentSoft }]}>
        <Ionicons name="flame" color={flameColor} size={22} />
      </View>
      <View style={styles.copy}>
        <Text style={[styles.eyebrow, { color: colors.inkMuted }]}>连续共同打卡</Text>
        <Text style={[styles.number, { color: colors.ink }]}>{current}<Text style={[styles.unit, { color: colors.inkMuted }]}> 天</Text></Text>
      </View>
      {longest !== undefined ? (
        <View style={[styles.longest, { borderLeftColor: colors.line }]}>
          <Text style={[styles.eyebrow, { color: colors.inkMuted }]}>最长记录</Text>
          <Text style={[styles.longestNumber, { color: colors.ink }]}>{longest} 天</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: 70,
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 11,
  },
  iconBox: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    flex: 1,
    gap: 1,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  number: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  unit: {
    fontSize: 12,
    fontWeight: '700',
  },
  longest: {
    borderLeftWidth: 1,
    paddingLeft: 14,
    minWidth: 74,
    gap: 2,
  },
  longestNumber: {
    fontSize: 14,
    fontWeight: '800',
  },
  compact: {
    borderRadius: 999,
    minWidth: 58,
    height: 34,
    paddingHorizontal: 11,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  compactText: {
    fontSize: 14,
    fontWeight: '800',
  },
});
