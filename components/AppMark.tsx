import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { useAppTheme } from '@/hooks/useAppTheme';

type Props = {
  size?: number;
  showWordmark?: boolean;
};

export function AppMark({ size = 44, showWordmark = false }: Props) {
  const { colors } = useAppTheme();
  const dotSize = Math.max(8, size * 0.18);

  return (
    <View style={styles.row}>
      <View
        accessible
        accessibilityLabel="日活图标"
        style={[
          styles.mark,
          {
            width: size,
            height: size,
            borderRadius: size * 0.32,
            backgroundColor: colors.surfaceGreen,
          },
        ]}
      >
        <View
          style={[
            styles.personDot,
            {
              width: dotSize,
              height: dotSize,
              borderRadius: dotSize / 2,
              left: size * 0.2,
              top: size * 0.27,
              backgroundColor: colors.ink,
            },
          ]}
        />
        <View
          style={[
            styles.personDot,
            {
              width: dotSize,
              height: dotSize,
              borderRadius: dotSize / 2,
              left: size * 0.47,
              top: size * 0.18,
              backgroundColor: colors.accent,
            },
          ]}
        />
        <Ionicons name="flame" color={colors.sun} size={size * 0.46} style={styles.flame} />
        <View style={[styles.check, { backgroundColor: colors.success, borderColor: colors.background, width: size * 0.34, height: size * 0.34, borderRadius: size * 0.17 }]}>
          <Ionicons name="checkmark" color={colors.white} size={size * 0.2} />
        </View>
      </View>
      {showWordmark ? (
        <View style={styles.wordmark}>
          <Text style={[styles.wordmarkTitle, { color: colors.ink }]}>日活</Text>
          <Text style={[styles.wordmarkSubtitle, { color: colors.inkMuted }]}>我和妈妈</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  mark: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  personDot: {
    position: 'absolute',
  },
  flame: {
    position: 'absolute',
    right: 2,
    bottom: 5,
  },
  check: {
    position: 'absolute',
    right: -3,
    bottom: -3,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },
  wordmark: {
    gap: 1,
  },
  wordmarkTitle: {
    fontSize: 19,
    fontWeight: '800',
    letterSpacing: 1,
  },
  wordmarkSubtitle: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.4,
  },
});
