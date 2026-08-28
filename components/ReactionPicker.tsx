import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { useAppTheme } from '@/hooks/useAppTheme';

const options = ['❤️', '👍', '👏', '😘', '🔥'];

type Props = {
  visible: boolean;
  habitName?: string;
  onClose: () => void;
  onSelect: (emoji: string) => void;
};

export function ReactionPicker({ visible, habitName, onClose, onSelect }: Props) {
  const { colors } = useAppTheme();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={[styles.sheet, { backgroundColor: colors.surface }]} onPress={(event) => event.stopPropagation()}>
          <View style={[styles.handle, { backgroundColor: colors.line }]} />
          <Text style={[styles.kicker, { color: colors.inkMuted }]}>给对方一个小回应</Text>
          <Text style={[styles.title, { color: colors.ink }]}>{habitName ?? '这件小事'} 完成啦</Text>
          <View style={styles.options}>
            {options.map((emoji) => (
              <Pressable
                key={emoji}
                accessibilityLabel={'发送' + emoji}
                onPress={() => onSelect(emoji)}
                style={({ pressed }) => [
                  styles.option,
                  { backgroundColor: colors.surfaceMuted, transform: [{ scale: pressed ? 0.92 : 1 }] },
                ]}
              >
                <Text style={styles.emoji}>{emoji}</Text>
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(12, 22, 16, 0.34)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 10,
    paddingBottom: 38,
    alignItems: 'center',
  },
  handle: {
    width: 42,
    height: 4,
    borderRadius: 3,
    marginBottom: 20,
  },
  kicker: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    marginTop: 6,
  },
  options: {
    flexDirection: 'row',
    gap: 11,
    marginTop: 24,
  },
  option: {
    width: 48,
    height: 48,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 24,
  },
});

