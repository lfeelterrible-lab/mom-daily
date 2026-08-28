import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { defaultHabits } from '@/constants/habits';
import { getCurrentSharedStreak, getDaySummary, getLongestSharedStreak, getSharedDays, getTotalSharedCompletions, getWeekSharedPercent } from '@/features/streak/streak';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useLocalDate } from '@/hooks/useLocalDate';
import { formatMonth, getWeekDates, weekdayShort } from '@/lib/date';
import { useMomDailyStore } from '@/store/useMomDailyStore';

export default function StatsScreen() {
  const { colors } = useAppTheme();
  const date = useLocalDate();
  const completions = useMomDailyStore((state) => state.completions);
  const current = useMemo(() => getCurrentSharedStreak(completions, date), [completions, date]);
  const longest = useMemo(() => getLongestSharedStreak(completions), [completions]);
  const totalShared = useMemo(() => getTotalSharedCompletions(completions), [completions]);
  const sharedDays = useMemo(() => getSharedDays(completions), [completions]);
  const weekDates = useMemo(() => getWeekDates(date), [date]);
  const weekPercent = useMemo(() => getWeekSharedPercent(completions, weekDates), [completions, weekDates]);
  const weekCounts = weekDates.map((day) => getDaySummary(completions, day).sharedCount);
  const maxCount = Math.max(defaultHabits.length, ...weekCounts);

  return (
    <SafeAreaView edges={['top']} style={[styles.safe, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={[styles.scroll, { width: '100%', maxWidth: 540, alignSelf: 'center' }]} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <Text style={[styles.kicker, { color: colors.accent }]}>OUR RECORD</Text>
            <Text style={[styles.title, { color: colors.ink }]}>我们的记录</Text>
            <Text style={[styles.subtitle, { color: colors.inkMuted }]}>一点一点，已经走了很远。</Text>
          </View>
          <View style={[styles.iconBox, { backgroundColor: colors.sunSoft }]}>
            <Ionicons name="bar-chart-outline" color={colors.ink} size={22} />
          </View>
        </View>

        <View style={[styles.recordHero, { backgroundColor: colors.ink }]}>
          <View style={styles.heroCopy}>
            <View style={styles.heroLabelRow}>
              <Ionicons name="flame" color={colors.sun} size={17} />
              <Text style={[styles.heroKicker, { color: colors.surfaceGreen }]}>SHARED STREAK</Text>
            </View>
            <Text style={[styles.heroNumber, { color: colors.white }]}>{current}<Text style={styles.heroUnit}> 天</Text></Text>
            <Text style={[styles.heroText, { color: colors.inkSoft }]}>当前连续共同打卡</Text>
          </View>
          <View style={[styles.heroRing, { borderColor: colors.accent }]}>
            <Text style={[styles.heroRingNumber, { color: colors.white }]}>{weekPercent}%</Text>
            <Text style={[styles.heroRingLabel, { color: colors.inkSoft }]}>本周</Text>
          </View>
        </View>

        <View style={styles.statGrid}>
          <MetricCard icon={<Ionicons name="trophy-outline" color={colors.sun} size={18} />} label="最长记录" value={longest + ' 天'} colors={colors} />
          <MetricCard icon={<Ionicons name="heart-outline" color={colors.accent} size={18} />} label="共同完成" value={totalShared.toLocaleString() + ' 次'} colors={colors} />
          <MetricCard icon={<Ionicons name="checkmark-circle-outline" color={colors.success} size={18} />} label="一起打卡" value={sharedDays + ' 天'} colors={colors} />
          <MetricCard icon={<Ionicons name="bar-chart-outline" color={colors.lavender} size={18} />} label="本月记录" value={formatMonth(date).slice(5) + '持续'} colors={colors} />
        </View>

        <View style={[styles.chartCard, { backgroundColor: colors.surface, borderColor: colors.line }]}>
          <View style={styles.cardTop}>
            <View>
              <Text style={[styles.cardTitle, { color: colors.ink }]}>这一周</Text>
              <Text style={[styles.cardSubtitle, { color: colors.inkMuted }]}>每天共同完成了多少项</Text>
            </View>
            <Text style={[styles.cardMetric, { color: colors.accent }]}>{weekPercent}%</Text>
          </View>
          <View style={styles.chart}>
            {weekCounts.map((count, index) => (
              <View key={weekDates[index]} style={styles.barColumn}>
                <Text style={[styles.barValue, { color: count === 11 ? colors.success : colors.inkSoft }]}>{count}</Text>
                <View style={[styles.barTrack, { backgroundColor: colors.surfaceMuted }]}>
                  <View style={[styles.bar, { height: Math.max(5, (count / maxCount) * 112), backgroundColor: count === 11 ? colors.success : colors.accent }]} />
                </View>
                <Text style={[styles.barLabel, { color: colors.inkMuted }]}>{weekdayShort(weekDates[index]).replace('周', '周')}</Text>
              </View>
            ))}
          </View>
          <View style={[styles.chartFoot, { borderTopColor: colors.line }]}>
            <View style={[styles.chartLegendDot, { backgroundColor: colors.success }]} />
            <Text style={[styles.chartLegend, { color: colors.inkMuted }]}>全部完成</Text>
            <View style={[styles.chartLegendDot, { backgroundColor: colors.accent, marginLeft: 11 }]} />
            <Text style={[styles.chartLegend, { color: colors.inkMuted }]}>进行中</Text>
          </View>
        </View>

        <View style={[styles.insight, { backgroundColor: colors.surfaceGreen }]}>
          <View style={[styles.insightIcon, { backgroundColor: colors.surface }]}>
            <Ionicons name="heart-outline" color={colors.accent} size={19} />
          </View>
          <View style={styles.insightCopy}>
            <Text style={[styles.insightTitle, { color: colors.ink }]}>你们的默契正在变长</Text>
            <Text style={[styles.insightText, { color: colors.inkMuted }]}>已经一起完成 {totalShared.toLocaleString()} 件小事。下一站，30 天。</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function MetricCard({ icon, label, value, colors }: { icon: React.ReactNode; label: string; value: string; colors: ReturnType<typeof useAppTheme>['colors'] }) {
  return (
    <View style={[styles.metricCard, { backgroundColor: colors.surface, borderColor: colors.line }]}>
      <View style={styles.metricIcon}>{icon}</View>
      <Text style={[styles.metricLabel, { color: colors.inkMuted }]}>{label}</Text>
      <Text style={[styles.metricValue, { color: colors.ink }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { paddingHorizontal: 18, paddingTop: 14, paddingBottom: 36 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 21 },
  kicker: { fontSize: 10, fontWeight: '900', letterSpacing: 1.4 },
  title: { fontSize: 29, lineHeight: 35, fontWeight: '900', letterSpacing: -0.8, marginTop: 4 },
  subtitle: { fontSize: 13, fontWeight: '600', marginTop: 2 },
  iconBox: { width: 48, height: 48, borderRadius: 17, justifyContent: 'center', alignItems: 'center' },
  recordHero: { minHeight: 150, borderRadius: 24, padding: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', overflow: 'hidden' },
  heroCopy: { gap: 2 },
  heroLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  heroKicker: { fontSize: 10, fontWeight: '900', letterSpacing: 1.2 },
  heroNumber: { fontSize: 47, lineHeight: 53, fontWeight: '900', letterSpacing: -2 },
  heroUnit: { fontSize: 16, letterSpacing: 0, fontWeight: '800' },
  heroText: { fontSize: 12, fontWeight: '700' },
  heroRing: { width: 80, height: 80, borderRadius: 40, borderWidth: 5, alignItems: 'center', justifyContent: 'center' },
  heroRingNumber: { fontSize: 18, fontWeight: '900' },
  heroRingLabel: { fontSize: 10, fontWeight: '700', marginTop: 1 },
  statGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 13 },
  metricCard: { width: '48.4%', minHeight: 102, borderRadius: 18, borderWidth: 1, padding: 13 },
  metricIcon: { height: 23 },
  metricLabel: { fontSize: 11, fontWeight: '700', marginTop: 6 },
  metricValue: { fontSize: 16, fontWeight: '900', marginTop: 3 },
  chartCard: { borderRadius: 22, borderWidth: 1, marginTop: 13, padding: 16 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardTitle: { fontSize: 17, fontWeight: '900' },
  cardSubtitle: { fontSize: 11, fontWeight: '600', marginTop: 3 },
  cardMetric: { fontSize: 20, fontWeight: '900' },
  chart: { height: 169, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 14 },
  barColumn: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', gap: 5 },
  barValue: { fontSize: 10, fontWeight: '800' },
  barTrack: { height: 112, width: 13, borderRadius: 8, justifyContent: 'flex-end', overflow: 'hidden' },
  bar: { width: '100%', borderRadius: 8 },
  barLabel: { fontSize: 10, fontWeight: '700' },
  chartFoot: { borderTopWidth: 1, flexDirection: 'row', alignItems: 'center', paddingTop: 11, marginTop: 10 },
  chartLegendDot: { width: 7, height: 7, borderRadius: 4, marginRight: 5 },
  chartLegend: { fontSize: 10, fontWeight: '700' },
  insight: { borderRadius: 20, padding: 14, flexDirection: 'row', alignItems: 'center', marginTop: 13 },
  insightIcon: { width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  insightCopy: { flex: 1, marginLeft: 11, gap: 4 },
  insightTitle: { fontSize: 14, fontWeight: '900' },
  insightText: { fontSize: 11, lineHeight: 16, fontWeight: '600' },
});
