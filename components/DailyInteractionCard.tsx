import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { defaultHabits } from '@/constants/habits';
import { formatRelativeTime } from '@/lib/date';
import { useAppTheme } from '@/hooks/useAppTheme';
import type { Actor, Nudge, Reaction } from '@/store/useMomDailyStore';

type Props = {
  date: string;
  nudges: Nudge[];
  reactions: Reaction[];
  activeActor: Actor;
  displayNames: { me: string; mom: string };
};

type InteractionItem =
  | { id: string; kind: 'nudge'; from: Actor; habitId: string; createdAt: string }
  | { id: string; kind: 'reaction'; from: Actor; habitId: string; emoji: string; createdAt: string };

export function DailyInteractionCard({ date, nudges, reactions, activeActor, displayNames }: Props) {
  const { colors } = useAppTheme();
  const items = useMemo<InteractionItem[]>(() => [
    ...nudges
      .filter((item) => item.date === date && item.to === activeActor)
      .map((item) => ({ id: item.id, kind: 'nudge' as const, from: item.from, habitId: item.habitId, createdAt: item.createdAt })),
    ...reactions
      .filter((item) => item.date === date && item.to === activeActor)
      .map((item) => ({ id: item.id, kind: 'reaction' as const, from: item.from, habitId: item.habitId, emoji: item.emoji, createdAt: item.createdAt })),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5), [activeActor, date, nudges, reactions]);

  if (items.length === 0) return null;

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.line }]}>
      <View style={styles.header}>
        <View style={[styles.icon, { backgroundColor: colors.accentSoft }]}>
          <Ionicons name="heart-outline" color={colors.accent} size={18} />
        </View>
        <View style={styles.headerCopy}>
          <Text style={[styles.title, { color: colors.ink }]}>今日互动</Text>
          <Text style={[styles.subtitle, { color: colors.inkMuted }]}>不在线时发来的，也会留在这里</Text>
        </View>
      </View>

      <View style={[styles.list, { borderTopColor: colors.line }]}>
        {items.map((item) => {
          const sender = item.from === 'mom' ? displayNames.mom : displayNames.me;
          const habitName = defaultHabits.find((habit) => habit.id === item.habitId)?.name ?? '这件小事';
          return (
            <View key={item.id} style={styles.row}>
              <Text style={styles.rowEmoji}>{item.kind === 'reaction' ? item.emoji : '🔔'}</Text>
              <Text style={[styles.rowText, { color: colors.ink }]} numberOfLines={2}>
                {item.kind === 'reaction' ? sender + ' 给你发来了 ' + item.emoji : sender + ' 提醒你完成「' + habitName + '」'}
              </Text>
              <Text style={[styles.time, { color: colors.inkMuted }]}>{formatRelativeTime(item.createdAt)}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: 21, padding: 14 },
  header: { flexDirection: 'row', alignItems: 'center' },
  icon: { width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  headerCopy: { marginLeft: 10, gap: 3 },
  title: { fontSize: 14, fontWeight: '900' },
  subtitle: { fontSize: 10, fontWeight: '600' },
  list: { borderTopWidth: 1, marginTop: 12, paddingTop: 3 },
  row: { minHeight: 35, flexDirection: 'row', alignItems: 'center', gap: 7 },
  rowEmoji: { width: 22, textAlign: 'center', fontSize: 16 },
  rowText: { flex: 1, fontSize: 11, lineHeight: 16, fontWeight: '700' },
  time: { fontSize: 10, fontWeight: '600', marginLeft: 4 },
});
