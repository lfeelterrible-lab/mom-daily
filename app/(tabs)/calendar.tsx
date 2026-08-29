import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SharedProgressRing } from '@/components/SharedProgressRing';
import { DailyMessageCard } from '@/components/DailyMessageCard';
import { defaultHabits } from '@/constants/habits';
import { getCompletion, getCompletionLevel, getDaySummary } from '@/features/streak/streak';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useLocalDate } from '@/hooks/useLocalDate';
import { addLocalDays, addLocalMonths, endOfLocalMonth, formatChineseDate, formatMonth, getWeekDates, weekdayLong } from '@/lib/date';
import { useMomDailyStore } from '@/store/useMomDailyStore';

const weekdays = ['一', '二', '三', '四', '五', '六', '日'];

export default function CalendarScreen() {
  const { colors } = useAppTheme();
  const today = useLocalDate();
  const completions = useMomDailyStore((state) => state.completions);
  const dailyMessages = useMomDailyStore((state) => state.dailyMessages);
  const activeActor = useMomDailyStore((state) => state.activeActor);
  const displayNames = useMomDailyStore((state) => state.displayNames);
  const [selectedDate, setSelectedDate] = useState(today);
  const currentYear = today.slice(0, 4);
  const calendarStartMonth = currentYear + '-01-01';
  const calendarEndMonth = addLocalMonths(calendarStartMonth, 23);
  const [visibleMonth, setVisibleMonth] = useState(today.slice(0, 7) + '-01');
  const monthStart = visibleMonth;
  const monthEnd = endOfLocalMonth(visibleMonth);
  const gridStart = getWeekDates(monthStart)[0];
  const gridEnd = getWeekDates(monthEnd)[6];
  const weeks = useMemo(
    () => {
      const result: string[][] = [];
      let cursor = gridStart;
      while (cursor <= gridEnd) {
        result.push(Array.from({ length: 7 }, (_, dayIndex) => addLocalDays(cursor, dayIndex)));
        cursor = addLocalDays(cursor, 7);
      }
      return result;
    },
    [gridEnd, gridStart],
  );
  const selectedSummary = getDaySummary(completions, selectedDate);
  const contentWidth = 540;
  const canGoPrevious = visibleMonth > calendarStartMonth;
  const canGoNext = visibleMonth < calendarEndMonth;
  const changeMonth = (amount: number) => {
    const nextMonth = addLocalMonths(visibleMonth, amount);
    if (nextMonth < calendarStartMonth || nextMonth > calendarEndMonth) return;
    setVisibleMonth(nextMonth);
    setSelectedDate(nextMonth);
  };
  const goToToday = () => {
    setVisibleMonth(today.slice(0, 7) + '-01');
    setSelectedDate(today);
  };

  return (
    <SafeAreaView edges={['top']} style={[styles.safe, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={[styles.scroll, { width: '100%', maxWidth: contentWidth, alignSelf: 'center' }]} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <Text style={[styles.kicker, { color: colors.accent }]}>OUR MEMORY</Text>
            <Text style={[styles.title, { color: colors.ink }]}>日历</Text>
            <Text style={[styles.subtitle, { color: colors.inkMuted }]}>把每天留下来。</Text>
          </View>
          <View style={[styles.iconBox, { backgroundColor: colors.surfaceGreen }]}>
            <Ionicons name="calendar-outline" color={colors.ink} size={22} />
          </View>
        </View>

        <View style={[styles.calendarCard, { backgroundColor: colors.surface, borderColor: colors.line }]}>
          <View style={styles.cardHeader}>
            <View>
              <Text style={[styles.month, { color: colors.ink }]}>{formatMonth(visibleMonth)}</Text>
              <Text style={[styles.range, { color: colors.inkMuted }]}>查看 {calendarStartMonth.slice(0, 4)}—{calendarEndMonth.slice(0, 4)} 年的共同记录</Text>
            </View>
            <View style={styles.monthControls}>
              <Pressable
                onPress={() => changeMonth(-1)}
                disabled={!canGoPrevious}
                accessibilityRole="button"
                accessibilityLabel="上一个月"
                style={[styles.monthButton, { backgroundColor: colors.surfaceMuted, opacity: canGoPrevious ? 1 : 0.4 }]}
              >
                <Ionicons name="chevron-back" color={colors.ink} size={16} />
              </Pressable>
              <View style={[styles.yearPill, { backgroundColor: colors.surfaceMuted }]}>
                <Text style={[styles.yearPillText, { color: colors.inkMuted }]}>{calendarStartMonth.slice(0, 4)}—{calendarEndMonth.slice(0, 4)}</Text>
              </View>
              <Pressable
                onPress={() => changeMonth(1)}
                disabled={!canGoNext}
                accessibilityRole="button"
                accessibilityLabel="下一个月"
                style={[styles.monthButton, { backgroundColor: colors.surfaceMuted, opacity: canGoNext ? 1 : 0.4 }]}
              >
                <Ionicons name="chevron-forward" color={colors.ink} size={16} />
              </Pressable>
            </View>
          </View>
          <View style={styles.gridHeader}>
            <View style={styles.weekLabelSpacer} />
            <View style={styles.gridColumns}>
              {weeks.map((_, index) => (
                <Text key={index} style={[styles.columnLabel, { color: colors.inkSoft }]}>{index % 2 === 0 ? '' : '·'}</Text>
              ))}
            </View>
          </View>
          <View style={styles.grid}>
            <View style={styles.weekdayLabels}>
              {weekdays.map((day) => <Text key={day} style={[styles.weekday, { color: colors.inkSoft }]}>{day}</Text>)}
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.gridColumns}>
              {weeks.map((week, weekIndex) => (
                <View key={weekIndex} style={styles.weekColumn}>
                  {week.map((date) => {
                    const level = getCompletionLevel(completions, date);
                    const selected = selectedDate === date;
                    const inVisibleMonth = date.slice(0, 7) === visibleMonth.slice(0, 7);
                    return (
                      <Pressable
                        key={date}
                        onPress={() => setSelectedDate(date)}
                        accessibilityRole="button"
                        accessibilityLabel={formatChineseDate(date) + '，共同完成 ' + getDaySummary(completions, date).sharedCount + ' 项'}
                        style={[
                          styles.cell,
                          {
                            backgroundColor: level === 2 ? colors.success : level === 1 ? colors.successSoft : colors.surfaceMuted,
                            borderColor: selected ? colors.accent : 'transparent',
                            borderWidth: selected ? 2 : 1,
                            opacity: inVisibleMonth ? 1 : 0.28,
                          },
                        ]}
                      />
                    );
                  })}
                </View>
              ))}
            </ScrollView>
          </View>
          <View style={[styles.legend, { borderTopColor: colors.line }]}>
            <Text style={[styles.legendLabel, { color: colors.inkMuted }]}>少</Text>
            <View style={[styles.legendCell, { backgroundColor: colors.surfaceMuted }]} />
            <View style={[styles.legendCell, { backgroundColor: colors.successSoft }]} />
            <View style={[styles.legendCell, { backgroundColor: colors.success }]} />
            <Text style={[styles.legendLabel, { color: colors.inkMuted }]}>全</Text>
            <View style={styles.legendSpacer} />
            <Text style={[styles.legendLabel, { color: colors.inkSoft }]}>点击查看当天</Text>
          </View>
        </View>

        <View style={styles.detailHeading}>
          <View>
            <Text style={[styles.detailKicker, { color: colors.accent }]}>DAY NOTE</Text>
            <Text style={[styles.detailTitle, { color: colors.ink }]}>{selectedDate === today ? '今天' : formatChineseDate(selectedDate)}</Text>
            <Text style={[styles.detailSubtitle, { color: colors.inkMuted }]}>{weekdayLong(selectedDate)}</Text>
          </View>
          <Pressable onPress={goToToday} disabled={selectedDate === today} style={[styles.todayButton, { backgroundColor: selectedDate === today ? colors.surfaceMuted : colors.accent }]}>
            <Text style={[styles.todayButtonText, { color: selectedDate === today ? colors.inkSoft : colors.white }]}>回到今天</Text>
          </Pressable>
        </View>

        <View style={[styles.summaryCard, { backgroundColor: colors.surfaceGreen }]}>
          <SharedProgressRing count={selectedSummary.sharedCount} size={94} compact label="共同完成" />
          <View style={styles.summaryCopy}>
            <Text style={[styles.summaryBig, { color: colors.ink }]}>{selectedSummary.sharedCount} / 11</Text>
            <Text style={[styles.summaryText, { color: colors.inkMuted }]}>
              {selectedSummary.isFullComplete ? '这一天完整地属于你们。' : selectedSummary.sharedCount === 0 ? '这一天还没有记录。' : '每一项，都是一起生活的证据。'}
            </Text>
            <View style={styles.actorCounts}>
              <Text style={[styles.actorCount, { color: colors.ink }]}>我 {selectedSummary.meCount}</Text>
              <View style={[styles.dotDivider, { backgroundColor: colors.inkSoft }]} />
              <Text style={[styles.actorCount, { color: colors.accent }]}>妈妈 {selectedSummary.momCount}</Text>
            </View>
          </View>
          {selectedSummary.isFullComplete ? <Ionicons name="sparkles-outline" color={colors.sun} size={20} style={styles.summarySparkle} /> : null}
        </View>

        <View style={styles.messageHistory}>
          <DailyMessageCard
            messages={dailyMessages[selectedDate] ?? {}}
            activeActor={activeActor}
            displayNames={displayNames}
            readOnly
            onSave={() => undefined}
          />
        </View>

        <View style={[styles.detailCard, { backgroundColor: colors.surface, borderColor: colors.line }]}>
          {defaultHabits.map((habit, index) => {
            const completion = getCompletion(completions, selectedDate, habit.id);
            return (
              <View key={habit.id} style={[styles.detailRow, index === defaultHabits.length - 1 ? styles.lastDetailRow : null, { borderBottomColor: colors.line }]}>
                <View style={[styles.detailEmoji, { backgroundColor: colors.surfaceMuted }]}><Text style={styles.emoji}>{habit.emoji}</Text></View>
                <Text style={[styles.detailHabitName, { color: colors.ink }]}>{habit.name}</Text>
                <View style={styles.statusPair}>
                  <View style={[styles.statusMark, { backgroundColor: completion.me ? colors.successSoft : colors.surfaceMuted }]}>
                    {completion.me ? <Ionicons name="checkmark" color={colors.success} size={13} /> : <Ionicons name="ellipse-outline" color={colors.inkSoft} size={11} />}
                  </View>
                  <View style={[styles.statusMark, { backgroundColor: completion.mom ? colors.successSoft : colors.surfaceMuted }]}>
                    {completion.mom ? <Ionicons name="checkmark" color={colors.success} size={13} /> : <Ionicons name="ellipse-outline" color={colors.inkSoft} size={11} />}
                  </View>
                </View>
              </View>
            );
          })}
          <View style={styles.statusLegend}>
            <Text style={[styles.statusLegendText, { color: colors.inkMuted }]}>我</Text>
            <Text style={[styles.statusLegendText, { color: colors.inkMuted }]}>妈妈</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { paddingHorizontal: 18, paddingTop: 14, paddingBottom: 36 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 21 },
  kicker: { fontSize: 10, fontWeight: '900', letterSpacing: 1.4 },
  title: { fontSize: 30, lineHeight: 36, fontWeight: '900', letterSpacing: -0.8, marginTop: 4 },
  subtitle: { fontSize: 13, fontWeight: '600', marginTop: 2 },
  iconBox: { width: 48, height: 48, borderRadius: 17, justifyContent: 'center', alignItems: 'center' },
  calendarCard: { borderRadius: 22, borderWidth: 1, padding: 16 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  month: { fontSize: 17, fontWeight: '900' },
  range: { fontSize: 11, fontWeight: '600', marginTop: 3 },
  yearPill: { height: 28, borderRadius: 10, paddingHorizontal: 10, justifyContent: 'center' },
  yearPillText: { fontSize: 11, fontWeight: '800' },
  monthControls: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  monthButton: { width: 28, height: 28, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  gridHeader: { flexDirection: 'row', marginTop: 20 },
  weekLabelSpacer: { width: 18 },
  gridColumns: { flexDirection: 'row', gap: 6 },
  columnLabel: { width: 16, textAlign: 'center', fontSize: 11, lineHeight: 12 },
  grid: { flexDirection: 'row', marginTop: 3 },
  weekdayLabels: { width: 18, justifyContent: 'space-between', paddingVertical: 1 },
  weekday: { height: 16, lineHeight: 16, fontSize: 9, fontWeight: '800' },
  weekColumn: { width: 16, gap: 6 },
  cell: { width: 16, height: 16, borderRadius: 5 },
  legend: { borderTopWidth: 1, marginTop: 17, paddingTop: 13, flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendLabel: { fontSize: 9, fontWeight: '700' },
  legendCell: { width: 13, height: 13, borderRadius: 4 },
  legendSpacer: { flex: 1 },
  detailHeading: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 28, marginBottom: 13 },
  detailKicker: { fontSize: 10, fontWeight: '900', letterSpacing: 1.4 },
  detailTitle: { fontSize: 21, fontWeight: '900', marginTop: 4 },
  detailSubtitle: { fontSize: 11, fontWeight: '700', marginTop: 2 },
  todayButton: { height: 32, borderRadius: 11, paddingHorizontal: 11, justifyContent: 'center' },
  todayButtonText: { fontSize: 11, fontWeight: '800' },
  summaryCard: { borderRadius: 22, padding: 15, flexDirection: 'row', alignItems: 'center', position: 'relative', overflow: 'hidden' },
  summaryCopy: { flex: 1, marginLeft: 12, gap: 4 },
  summaryBig: { fontSize: 22, fontWeight: '900', letterSpacing: -0.4 },
  summaryText: { fontSize: 11, lineHeight: 16, fontWeight: '600', maxWidth: 180 },
  actorCounts: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 },
  actorCount: { fontSize: 11, fontWeight: '800' },
  dotDivider: { width: 3, height: 3, borderRadius: 2 },
  summarySparkle: { position: 'absolute', right: 17, top: 17 },
  messageHistory: { marginTop: 13 },
  detailCard: { marginTop: 13, borderRadius: 21, borderWidth: 1, paddingHorizontal: 14, paddingTop: 3, paddingBottom: 12 },
  detailRow: { minHeight: 47, borderBottomWidth: 1, flexDirection: 'row', alignItems: 'center' },
  lastDetailRow: { borderBottomWidth: 0 },
  detailEmoji: { width: 29, height: 29, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  emoji: { fontSize: 16 },
  detailHabitName: { flex: 1, marginLeft: 10, fontSize: 13, fontWeight: '800' },
  statusPair: { flexDirection: 'row', gap: 7 },
  statusMark: { width: 25, height: 25, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  statusLegend: { flexDirection: 'row', justifyContent: 'flex-end', gap: 17, paddingRight: 3, marginTop: 7 },
  statusLegendText: { fontSize: 9, fontWeight: '700' },
});
