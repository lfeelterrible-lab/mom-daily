import { Ionicons } from '@expo/vector-icons';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withSpring, withTiming } from 'react-native-reanimated';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useEffect } from 'react';

import type { Habit } from '@/constants/habits';
import { useAppTheme } from '@/hooks/useAppTheme';
import type { Actor, DailyCompletion } from '@/store/useMomDailyStore';
import { Avatar } from '@/components/Avatar';

type Props = {
  habit: Habit;
  completion: DailyCompletion;
  activeActor: Actor;
  demoMode: boolean;
  onToggle: (actor: Actor) => void;
  onNudge: () => void;
  onReact: () => void;
};

function CompletionButton({ actor, completed, canEdit, onPress }: { actor: Actor; completed: boolean; canEdit: boolean; onPress: () => void }) {
  const { colors } = useAppTheme();
  const scale = useSharedValue(completed ? 1 : 0.94);

  useEffect(() => {
    scale.value = withSpring(completed ? 1 : 0.94, { damping: 14, stiffness: 240 });
  }, [completed, scale]);

  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        disabled={!canEdit}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={'标记' + (actor === 'me' ? '我' : '妈妈') + (completed ? '未完成' : '完成')}
        style={({ pressed }) => [
          styles.completionButton,
          {
            backgroundColor: completed ? colors.success : colors.surfaceMuted,
            borderColor: completed ? colors.success : colors.line,
            opacity: canEdit ? (pressed ? 0.78 : 1) : 0.58,
          },
        ]}
      >
        {completed ? <Ionicons name="checkmark" color={colors.white} size={18} /> : <View style={[styles.emptyDot, { backgroundColor: colors.inkSoft }]} />}
      </Pressable>
    </Animated.View>
  );
}

export function DailyHabitCard({ habit, completion, activeActor, demoMode, onToggle, onNudge, onReact }: Props) {
  const { colors } = useAppTheme();
  const shared = completion.me && completion.mom;
  const someoneCompleted = completion.me || completion.mom;
  const spark = useSharedValue(0);

  useEffect(() => {
    if (shared) {
      spark.value = withSequence(withTiming(1, { duration: 160 }), withTiming(0, { duration: 540 }));
    }
  }, [shared, spark]);

  const sparkStyle = useAnimatedStyle(() => ({
    opacity: spark.value,
    transform: [{ translateY: -16 * spark.value }, { scale: 0.82 + spark.value * 0.55 }],
  }));

  const canEditMe = demoMode || activeActor === 'me';
  const canEditMom = demoMode || activeActor === 'mom';
  const waitingFor = completion.me && !completion.mom ? '妈妈' : !completion.me && completion.mom ? '我' : '';

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: shared ? colors.successSoft : colors.surface,
          borderColor: shared ? colors.success + '55' : colors.line,
        },
      ]}
    >
      <View style={styles.cardTop}>
        <View style={[styles.icon, { backgroundColor: shared ? colors.white : colors.surfaceMuted }]}>
          <Text style={styles.emoji}>{habit.emoji}</Text>
        </View>
        <View style={styles.titleBlock}>
          <Text style={[styles.habitName, { color: colors.ink }]}>{habit.name}</Text>
          <View style={styles.timeRow}>
            <Ionicons name="time-outline" color={colors.inkMuted} size={12} />
            <Text style={[styles.time, { color: colors.inkMuted }]}>建议时间 · {habit.defaultTime}</Text>
          </View>
        </View>
        <View style={styles.statusWrap}>
          {shared ? <Ionicons name="sparkles-outline" color={colors.sun} size={19} /> : <Ionicons name="chevron-forward" color={colors.inkSoft} size={18} />}
          <Animated.Text style={[styles.spark, sparkStyle]}>✦</Animated.Text>
        </View>
      </View>

      <View style={[styles.peopleRow, { borderTopColor: colors.line }]}>
        <View style={[styles.person, { opacity: canEditMe ? 1 : 0.62 }]}>
          <Avatar actor="me" size={29} />
          <Text style={[styles.personName, { color: colors.ink }]}>我</Text>
          <CompletionButton actor="me" completed={completion.me} canEdit={canEditMe} onPress={() => onToggle('me')} />
        </View>
        <View style={[styles.connector, { backgroundColor: shared ? colors.success : colors.line }]} />
        <View style={[styles.person, { opacity: canEditMom ? 1 : 0.62 }]}>
          <Avatar actor="mom" size={29} />
          <Text style={[styles.personName, { color: colors.ink }]}>妈妈</Text>
          <CompletionButton actor="mom" completed={completion.mom} canEdit={canEditMom} onPress={() => onToggle('mom')} />
        </View>
      </View>

      <View style={styles.statusRow}>
        <Text style={[styles.statusText, { color: shared ? colors.success : colors.inkMuted }]}>
          {shared ? '今天共同完成 · +1' : someoneCompleted ? '等' + waitingFor + '完成' : '随时可以完成'}
        </Text>
        {shared ? (
          <Pressable onPress={onReact} accessibilityRole="button" style={({ pressed }) => [styles.action, { opacity: pressed ? 0.65 : 1 }]}>
            <Ionicons name="chatbubble-ellipses-outline" color={colors.accent} size={14} />
            <Text style={[styles.actionText, { color: colors.accent }]}>回应</Text>
          </Pressable>
        ) : completion.me && !completion.mom && activeActor === 'me' ? (
          <Pressable onPress={onNudge} accessibilityRole="button" style={({ pressed }) => [styles.action, { opacity: pressed ? 0.65 : 1 }]}>
            <Ionicons name="notifications-outline" color={colors.accent} size={14} />
            <Text style={[styles.actionText, { color: colors.accent }]}>提醒妈妈</Text>
          </Pressable>
        ) : completion.mom && !completion.me && activeActor === 'mom' ? (
          <Pressable onPress={onNudge} accessibilityRole="button" style={({ pressed }) => [styles.action, { opacity: pressed ? 0.65 : 1 }]}>
            <Ionicons name="notifications-outline" color={colors.accent} size={14} />
            <Text style={[styles.actionText, { color: colors.accent }]}>提醒我</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 21,
    padding: 15,
    marginBottom: 12,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 43,
  },
  icon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 22,
  },
  titleBlock: {
    flex: 1,
    marginLeft: 11,
    gap: 3,
  },
  habitName: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.1,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  time: {
    fontSize: 11,
    fontWeight: '600',
  },
  statusWrap: {
    width: 26,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  spark: {
    position: 'absolute',
    color: '#E4B84F',
    fontSize: 16,
    top: -8,
  },
  peopleRow: {
    borderTopWidth: 1,
    marginTop: 14,
    paddingTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  person: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  personName: {
    fontSize: 12,
    fontWeight: '800',
    minWidth: 27,
  },
  connector: {
    width: 16,
    height: 2,
    borderRadius: 2,
    marginHorizontal: 4,
  },
  completionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 'auto',
  },
  emptyDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 24,
    marginTop: 10,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 5,
    paddingLeft: 8,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '800',
  },
});
