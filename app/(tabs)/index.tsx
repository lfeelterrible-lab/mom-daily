import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DailyHabitCard } from '@/components/DailyHabitCard';
import { DailyInteractionCard } from '@/components/DailyInteractionCard';
import { DailyMessageCard } from '@/components/DailyMessageCard';
import { PairPresenceBar } from '@/components/PairPresenceBar';
import { ReactionPicker } from '@/components/ReactionPicker';
import { SharedProgressRing } from '@/components/SharedProgressRing';
import { StreakBadge } from '@/components/StreakBadge';
import { defaultHabits, type Habit } from '@/constants/habits';
import { getCompletion, getCurrentSharedStreak, getDaySummary, getLongestSharedStreak } from '@/features/streak/streak';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useLocalDate } from '@/hooks/useLocalDate';
import { formatChineseDate, getGreeting, weekdayLong } from '@/lib/date';
import { useMomDailyStore, type Actor } from '@/store/useMomDailyStore';

const pulseHaptic = () => {
  if (Platform.OS !== 'web') {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }
};

export default function TodayScreen() {
  const { colors } = useAppTheme();
  const { width } = useWindowDimensions();
  const date = useLocalDate();
  const completions = useMomDailyStore((state) => state.completions);
  const dailyMessages = useMomDailyStore((state) => state.dailyMessages);
  const activeActor = useMomDailyStore((state) => state.activeActor);
  const demoMode = useMomDailyStore((state) => state.demoMode);
  const displayNames = useMomDailyStore((state) => state.displayNames);
  const pairPresence = useMomDailyStore((state) => state.pairPresence);
  const isOnline = useMomDailyStore((state) => state.isOnline);
  const nudges = useMomDailyStore((state) => state.nudges);
  const reactions = useMomDailyStore((state) => state.reactions);
  const toggleCompletion = useMomDailyStore((state) => state.toggleCompletion);
  const sendNudge = useMomDailyStore((state) => state.sendNudge);
  const addReaction = useMomDailyStore((state) => state.addReaction);
  const saveDailyMessage = useMomDailyStore((state) => state.saveDailyMessage);
  const [reactionHabit, setReactionHabit] = useState<Habit | null>(null);

  const summary = useMemo(() => getDaySummary(completions, date), [completions, date]);
  const currentStreak = useMemo(() => getCurrentSharedStreak(completions, date), [completions, date]);
  const longestStreak = useMemo(() => getLongestSharedStreak(completions), [completions]);
  const hasIncomingInteractions = useMemo(
    () => nudges.some((item) => item.date === date && item.to === activeActor) || reactions.some((item) => item.date === date && item.to === activeActor),
    [activeActor, date, nudges, reactions],
  );

  const ringSize = Math.min(188, Math.max(164, width - 210));
  const contentWidth = Math.min(540, Math.max(0, width - 36));

  const handleToggle = (habitId: string, actor: Actor) => {
    pulseHaptic();
    toggleCompletion(habitId, actor);
  };

  return (
    <SafeAreaView edges={['top']} style={[styles.safe, { backgroundColor: colors.background }]}>
      <View style={styles.screen}>
        <ScrollView
          contentContainerStyle={[styles.scroll, { width: contentWidth, alignSelf: 'center' }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <View style={styles.headerCopy}>
              <Text style={[styles.date, { color: colors.inkMuted }]}>{formatChineseDate(date)} · {weekdayLong(date)}</Text>
              <Text style={[styles.greeting, { color: colors.ink }]}>{getGreeting()}</Text>
              <Text style={[styles.subtitle, { color: colors.inkMuted }]}>今天也一起生活吧</Text>
            </View>
            <View style={[styles.headerMark, { backgroundColor: colors.surfaceGreen }]}>
              <View style={[styles.logoDot, { backgroundColor: colors.accent }]} />
              <View style={[styles.logoDot, { backgroundColor: colors.sun }]} />
              <Text style={[styles.logoText, { color: colors.ink }]}>日活</Text>
            </View>
          </View>

          <View style={[styles.hero, { backgroundColor: colors.surfaceGreen }]}>
            <View style={styles.heroTop}>
              <View>
                <Text style={[styles.eyebrow, { color: colors.inkMuted }]}>OUR DAILY RITUAL</Text>
                <Text style={[styles.heroTitle, { color: colors.ink }]}>两个人，一件一件来。</Text>
              </View>
              <View style={[styles.syncPill, { backgroundColor: colors.surface }]}>
                {isOnline ? <Ionicons name="wifi" color={colors.success} size={13} /> : <Ionicons name="cloud-offline-outline" color={colors.sun} size={13} />}
                <Text style={[styles.syncText, { color: colors.inkMuted }]}>{isOnline ? '同步中' : '离线'}</Text>
              </View>
            </View>

            <View style={styles.ringRow}>
              <SharedProgressRing count={summary.sharedCount} size={ringSize} />
              <View style={styles.pairSide}>
                <View style={styles.pairFaces}>
                  <View style={[styles.avatarOverlap, { backgroundColor: colors.surfaceGreen }]}><Text style={styles.avatarEmoji}>👦</Text></View>
                  <View style={[styles.avatarOverlap, styles.momAvatar, { backgroundColor: colors.sunSoft }]}><Text style={styles.avatarEmoji}>👩</Text></View>
                </View>
                <Text style={[styles.pairTitle, { color: colors.ink }]}>{displayNames.me} + {displayNames.mom}</Text>
                <PairPresenceBar meLabel={displayNames.me} momLabel={displayNames.mom} meOnline={pairPresence.me} momOnline={pairPresence.mom} />
                <Text style={[styles.pairCopy, { color: colors.inkMuted }]}>今天的小事，正在变成我们的记录。</Text>
                <View style={[styles.sharedChip, { backgroundColor: colors.accentSoft }]}>
                  <Ionicons name="sparkles-outline" color={colors.accent} size={13} />
                  <Text style={[styles.sharedChipText, { color: colors.accent }]}>{summary.sharedCount === 11 ? '今天也一起完成啦' : '共同完成 ' + summary.sharedCount + ' / 11'}</Text>
                </View>
              </View>
            </View>

            <View style={[styles.peopleProgress, { borderTopColor: colors.line }]}>
              <PersonProgress label="我" count={summary.meCount} total={11} color={colors.ink} barColor={colors.ink} />
              <View style={[styles.progressDivider, { backgroundColor: colors.line }]} />
              <PersonProgress label="妈妈" count={summary.momCount} total={11} color={colors.accent} barColor={colors.accent} />
            </View>
          </View>

          <View style={styles.streakSpacing}>
            <StreakBadge current={currentStreak} longest={longestStreak} />
          </View>

          <View style={styles.messageSpacing}>
            <DailyMessageCard
              messages={dailyMessages[date] ?? {}}
              activeActor={activeActor}
              displayNames={displayNames}
              onSave={saveDailyMessage}
            />
          </View>

          {hasIncomingInteractions ? (
            <View style={styles.messageSpacing}>
              <DailyInteractionCard
                date={date}
                nudges={nudges}
                reactions={reactions}
                activeActor={activeActor}
                displayNames={displayNames}
              />
            </View>
          ) : null}

          <View style={styles.listHeader}>
            <View>
              <Text style={[styles.sectionTitle, { color: colors.ink }]}>今天的 11 件小事</Text>
              <Text style={[styles.sectionSub, { color: colors.inkMuted }]}>各自完成，才能算作我们完成</Text>
            </View>
            <View style={[styles.countPill, { backgroundColor: colors.surfaceMuted }]}>
              <Text style={[styles.countNumber, { color: colors.accent }]}>{summary.sharedCount}</Text>
              <Text style={[styles.countTotal, { color: colors.inkMuted }]}>/11</Text>
            </View>
          </View>

          <View style={styles.timeline}>
            {defaultHabits.map((habit, index) => {
              const previous = defaultHabits[index - 1];
              const showCategory = index === 0 || previous.category !== habit.category;
              return (
                <View key={habit.id}>
                  {showCategory ? (
                    <View style={styles.categoryRow}>
                      <Text style={[styles.category, { color: colors.inkMuted }]}>{habit.category}</Text>
                      <View style={[styles.categoryLine, { backgroundColor: colors.line }]} />
                    </View>
                  ) : null}
                  <View style={styles.timelineRow}>
                    <View style={styles.rail}>
                      <View style={[styles.railDot, { backgroundColor: summary.sharedCount > index ? colors.success : colors.line }]} />
                      {index < defaultHabits.length - 1 ? <View style={[styles.railLine, { backgroundColor: colors.line }]} /> : null}
                    </View>
                    <View style={styles.cardWrap}>
                      <DailyHabitCard
                        habit={habit}
                        completion={getCompletion(completions, date, habit.id)}
                        activeActor={activeActor}
                        demoMode={demoMode}
                        onToggle={(actor) => handleToggle(habit.id, actor)}
                        onNudge={() => sendNudge(habit.id)}
                        onReact={() => setReactionHabit(habit)}
                      />
                    </View>
                  </View>
                </View>
              );
            })}
          </View>

          <View style={[styles.footerNote, { backgroundColor: colors.surfaceMuted }]}>
            <Ionicons name="calendar-outline" color={colors.inkMuted} size={16} />
            <Text style={[styles.footerText, { color: colors.inkMuted }]}>所有任务都可随时完成，不需要按时间顺序；建议时间只作轻轻提醒。</Text>
          </View>
        </ScrollView>
        <ReactionPicker
          visible={Boolean(reactionHabit)}
          habitName={reactionHabit?.name}
          onClose={() => setReactionHabit(null)}
          onSelect={(emoji) => {
            if (reactionHabit) addReaction(reactionHabit.id, emoji);
            setReactionHabit(null);
          }}
        />
      </View>
    </SafeAreaView>
  );
}

function PersonProgress({ label, count, total, color, barColor }: { label: string; count: number; total: number; color: string; barColor: string }) {
  const { colors } = useAppTheme();
  return (
    <View style={styles.personProgress}>
      <View style={styles.personProgressTop}>
        <Text style={[styles.personLabel, { color }]}>{label}今天</Text>
        <Text style={[styles.personCount, { color: colors.ink }]}>{count} <Text style={{ color: colors.inkMuted, fontWeight: '600' }}>/ {total}</Text></Text>
      </View>
      <View style={[styles.barTrack, { backgroundColor: colors.line }]}>
        <View style={[styles.barFill, { backgroundColor: barColor, width: ((count / total) * 100 + '%') as any }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  screen: { flex: 1 },
  scroll: { paddingHorizontal: 18, paddingTop: 12, paddingBottom: 34 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  headerCopy: { gap: 2 },
  date: { fontSize: 11, fontWeight: '700', letterSpacing: 0.1 },
  greeting: { fontSize: 30, lineHeight: 36, fontWeight: '900', letterSpacing: -0.8, marginTop: 4 },
  subtitle: { fontSize: 13, fontWeight: '600', marginTop: 1 },
  headerMark: { width: 50, height: 50, borderRadius: 18, justifyContent: 'center', alignItems: 'center', position: 'relative' },
  logoDot: { position: 'absolute', width: 7, height: 7, borderRadius: 4, top: 10 },
  logoText: { fontSize: 16, fontWeight: '900', letterSpacing: 0.4, marginTop: 5 },
  hero: { borderRadius: 27, padding: 18, overflow: 'hidden' },
  heroTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  eyebrow: { fontSize: 10, fontWeight: '900', letterSpacing: 1.2 },
  heroTitle: { fontSize: 19, fontWeight: '900', letterSpacing: -0.2, marginTop: 5 },
  syncPill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 9, height: 27, borderRadius: 999 },
  syncText: { fontSize: 10, fontWeight: '800' },
  ringRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 14 },
  pairSide: { flex: 1, gap: 5, minWidth: 108 },
  pairFaces: { flexDirection: 'row', alignItems: 'center', height: 35 },
  avatarOverlap: { width: 33, height: 33, borderRadius: 17, borderWidth: 2, borderColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center' },
  momAvatar: { marginLeft: -9 },
  avatarEmoji: { fontSize: 18 },
  pairTitle: { fontSize: 17, fontWeight: '900' },
  pairCopy: { fontSize: 11, lineHeight: 16, fontWeight: '600', maxWidth: 135 },
  sharedChip: { flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start', paddingHorizontal: 8, minHeight: 26, borderRadius: 9, marginTop: 4 },
  sharedChipText: { fontSize: 10, fontWeight: '800' },
  peopleProgress: { borderTopWidth: 1, flexDirection: 'row', paddingTop: 13, alignItems: 'center' },
  personProgress: { flex: 1, gap: 7 },
  personProgressTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  personLabel: { fontSize: 11, fontWeight: '800' },
  personCount: { fontSize: 12, fontWeight: '900' },
  barTrack: { height: 6, borderRadius: 6, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 6 },
  progressDivider: { width: 1, height: 30, marginHorizontal: 13 },
  streakSpacing: { marginTop: 13, marginBottom: 13 },
  messageSpacing: { marginBottom: 25 },
  listHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  sectionTitle: { fontSize: 19, fontWeight: '900', letterSpacing: -0.2 },
  sectionSub: { fontSize: 11, fontWeight: '600', marginTop: 4 },
  countPill: { height: 38, minWidth: 54, borderRadius: 13, flexDirection: 'row', alignItems: 'baseline', justifyContent: 'center', paddingHorizontal: 9 },
  countNumber: { fontSize: 19, fontWeight: '900' },
  countTotal: { fontSize: 11, fontWeight: '800' },
  timeline: { paddingBottom: 4 },
  categoryRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 9, marginTop: 2, paddingLeft: 2 },
  category: { fontSize: 11, fontWeight: '900', letterSpacing: 0.7 },
  categoryLine: { flex: 1, height: 1 },
  timelineRow: { flexDirection: 'row', alignItems: 'stretch' },
  rail: { width: 19, alignItems: 'center', position: 'relative' },
  railDot: { width: 7, height: 7, borderRadius: 4, marginTop: 22 },
  railLine: { position: 'absolute', width: 1, top: 29, bottom: 0 },
  cardWrap: { flex: 1 },
  footerNote: { minHeight: 44, borderRadius: 15, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  footerText: { fontSize: 11, fontWeight: '700' },
});
