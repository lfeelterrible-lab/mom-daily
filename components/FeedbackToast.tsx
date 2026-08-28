import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { useAppTheme } from '@/hooks/useAppTheme';

type Props = {
  message: string;
  offline?: boolean;
};

export function FeedbackToast({ message, offline = false }: Props) {
  const { colors } = useAppTheme();
  return (
    <View style={[styles.container, { backgroundColor: colors.ink }]}>
      {offline ? <Ionicons name="cloud-offline-outline" color={colors.sun} size={16} /> : message.includes('提醒') ? <Ionicons name="information-circle-outline" color={colors.sun} size={16} /> : <Ionicons name="checkmark-circle" color={colors.success} size={16} />}
      <Text style={[styles.text, { color: colors.white }]}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 18,
    right: 18,
    bottom: 90,
    borderRadius: 15,
    minHeight: 44,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    zIndex: 10,
  },
  text: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
  },
});
