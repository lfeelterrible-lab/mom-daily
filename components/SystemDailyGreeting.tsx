import { Ionicons } from '@expo/vector-icons';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { getSystemDailyGreeting } from '@/constants/dailyGreetings';
import { useAppTheme } from '@/hooks/useAppTheme';

type Props = {
  date: string;
  hydrated: boolean;
  dismissedDate: string;
  onDismiss: (date: string) => void;
};

export function SystemDailyGreeting({ date, hydrated, dismissedDate, onDismiss }: Props) {
  const { colors } = useAppTheme();
  const greeting = getSystemDailyGreeting(date);
  const [visible, setVisible] = useState(false);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.94);

  const animateIn = () => {
    opacity.value = 0;
    scale.value = 0.94;
    opacity.value = withTiming(1, { duration: 220 });
    scale.value = withSpring(1, { damping: 18, stiffness: 220 });
    setVisible(true);
  };

  useEffect(() => {
    if (hydrated && dismissedDate !== date) animateIn();
  }, [date, dismissedDate, hydrated]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  const dismiss = () => {
    setVisible(false);
    onDismiss(date);
  };

  return (
    <>
      <View style={[styles.card, { backgroundColor: colors.surfaceGreen, borderColor: colors.line }]}>
        <View style={styles.cardHeader}>
          <View style={[styles.icon, { backgroundColor: colors.surface }]}>
            <Ionicons name="sparkles-outline" color={colors.accent} size={17} />
          </View>
          <View style={styles.headerCopy}>
            <Text style={[styles.eyebrow, { color: colors.accent }]}>TODAY'S NOTE</Text>
            <Text style={[styles.cardTitle, { color: colors.ink }]}>每日寄语</Text>
          </View>
          <Pressable
            onPress={animateIn}
            accessibilityRole="button"
            accessibilityLabel="再次查看每日寄语"
            style={({ pressed }) => [styles.revisit, { backgroundColor: colors.surface, opacity: pressed ? 0.72 : 1 }]}
          >
            <Ionicons name="arrow-redo-outline" color={colors.inkMuted} size={14} />
            <Text style={[styles.revisitText, { color: colors.inkMuted }]}>再看一遍</Text>
          </Pressable>
        </View>
        <Text style={[styles.title, { color: colors.ink }]}>{greeting.title}</Text>
        <Text style={[styles.content, { color: colors.inkMuted }]}>“{greeting.content}”</Text>
        <View style={styles.signatureRow}>
          <View style={[styles.signatureLine, { backgroundColor: colors.success }]} />
          <Text style={[styles.signature, { color: colors.inkSoft }]}>{greeting.signature}</Text>
        </View>
      </View>

      <Modal visible={visible} transparent animationType="fade" onRequestClose={dismiss}>
        <View style={styles.modalRoot}>
          <Pressable style={styles.backdrop} onPress={dismiss} accessibilityLabel="关闭每日寄语" />
          <Animated.View style={[styles.modalCard, { backgroundColor: colors.surface }, animatedStyle]}>
            <View style={[styles.modalGlow, { backgroundColor: colors.surfaceGreen }]} />
            <View style={styles.modalTop}>
              <View style={[styles.modalIcon, { backgroundColor: colors.accentSoft }]}>
                <Ionicons name="sparkles" color={colors.accent} size={20} />
              </View>
              <Text style={[styles.modalKicker, { color: colors.accent }]}>MOMDAILY · {date.replaceAll('-', '.')}</Text>
            </View>
            <Text style={[styles.modalTitle, { color: colors.ink }]}>{greeting.title}</Text>
            <Text style={[styles.modalContent, { color: colors.inkMuted }]}>“{greeting.content}”</Text>
            <View style={styles.modalFooter}>
              <Text style={[styles.modalSignature, { color: colors.inkSoft }]}>{greeting.signature}</Text>
              <Pressable
                onPress={dismiss}
                accessibilityRole="button"
                accessibilityLabel="收下今天的每日寄语"
                style={({ pressed }) => [styles.closeButton, { backgroundColor: colors.ink, opacity: pressed ? 0.78 : 1 }]}
              >
                <Text style={[styles.closeText, { color: colors.background }]}>收下这句寄语</Text>
                <Ionicons name="arrow-forward" color={colors.background} size={15} />
              </Pressable>
            </View>
          </Animated.View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: 21, padding: 15 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  icon: { width: 35, height: 35, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  headerCopy: { flex: 1, marginLeft: 10 },
  eyebrow: { fontSize: 9, fontWeight: '900', letterSpacing: 1.2 },
  cardTitle: { fontSize: 16, fontWeight: '900', marginTop: 2 },
  revisit: { minHeight: 27, borderRadius: 9, paddingHorizontal: 8, flexDirection: 'row', alignItems: 'center', gap: 4 },
  revisitText: { fontSize: 10, fontWeight: '800' },
  title: { fontSize: 18, lineHeight: 24, fontWeight: '900', letterSpacing: -0.2 },
  content: { fontSize: 13, lineHeight: 21, fontWeight: '600', marginTop: 7 },
  signatureRow: { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 14 },
  signatureLine: { width: 18, height: 2, borderRadius: 2 },
  signature: { fontSize: 10, fontWeight: '800' },
  modalRoot: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 22 },
  backdrop: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(15, 25, 20, 0.44)' },
  modalCard: { width: '100%', maxWidth: 390, borderRadius: 28, padding: 22, overflow: 'hidden' },
  modalGlow: { position: 'absolute', width: 180, height: 180, borderRadius: 90, top: -88, right: -42, opacity: 0.9 },
  modalTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  modalIcon: { width: 39, height: 39, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  modalKicker: { fontSize: 10, fontWeight: '900', letterSpacing: 1.2 },
  modalTitle: { fontSize: 27, lineHeight: 34, fontWeight: '900', letterSpacing: -0.6, marginTop: 25 },
  modalContent: { fontSize: 16, lineHeight: 27, fontWeight: '600', marginTop: 13 },
  modalFooter: { alignItems: 'flex-start', marginTop: 25, gap: 14 },
  modalSignature: { fontSize: 11, fontWeight: '800' },
  closeButton: { minHeight: 45, borderRadius: 15, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 7 },
  closeText: { fontSize: 12, fontWeight: '900' },
});
