import { StyleSheet, Text, View } from 'react-native';

import { useAppTheme } from '@/hooks/useAppTheme';

type Props = {
  meLabel?: string;
  momLabel?: string;
  meOnline: boolean;
  momOnline: boolean;
};

export function PairPresenceBar({ meLabel = '我', momLabel = '妈妈', meOnline, momOnline }: Props) {
  const { colors } = useAppTheme();
  const statusLabel = meLabel + (meOnline ? '在线' : '离线') + '，' + momLabel + (momOnline ? '在线' : '离线');

  return (
    <View style={styles.row} accessible accessibilityLabel={statusLabel}>
      <PresenceItem label={meLabel} online={meOnline} />
      <PresenceItem label={momLabel} online={momOnline} />
    </View>
  );

  function PresenceItem({ label, online }: { label: string; online: boolean }) {
    return (
      <View style={[styles.item, { backgroundColor: colors.surface }]}>
        <View style={[styles.dot, { backgroundColor: online ? colors.success : colors.inkSoft }]} />
        <Text style={[styles.text, { color: colors.inkMuted }]}>{label} · {online ? '在线' : '离线'}</Text>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginTop: 3 },
  item: { minHeight: 22, borderRadius: 8, paddingHorizontal: 7, flexDirection: 'row', alignItems: 'center', gap: 4 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  text: { fontSize: 10, fontWeight: '800' },
});
