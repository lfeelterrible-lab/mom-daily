import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar } from '@/components/Avatar';
import { FeedbackToast } from '@/components/FeedbackToast';
import { AppMark } from '@/components/AppMark';
import { defaultHabits } from '@/constants/habits';
import { useAppTheme } from '@/hooks/useAppTheme';
import { usePair } from '@/hooks/usePair';
import { isSupabaseConfigured } from '@/lib/supabase';
import { useMomDailyStore, type Actor } from '@/store/useMomDailyStore';

export default function FamilyScreen() {
  const { colors, isDark } = useAppTheme();
  const { inviteCode, displayNames } = usePair();
  const demoMode = useMomDailyStore((state) => state.demoMode);
  const activeActor = useMomDailyStore((state) => state.activeActor);
  const setActiveActor = useMomDailyStore((state) => state.setActiveActor);
  const setDemoMode = useMomDailyStore((state) => state.setDemoMode);
  const themeMode = useMomDailyStore((state) => state.themeMode);
  const setThemeMode = useMomDailyStore((state) => state.setThemeMode);
  const notificationSettings = useMomDailyStore((state) => state.notificationSettings);
  const setNotification = useMomDailyStore((state) => state.setNotification);
  const isOnline = useMomDailyStore((state) => state.isOnline);
  const setOnline = useMomDailyStore((state) => state.setOnline);
  const pendingSync = useMomDailyStore((state) => state.pendingSync);
  const resetDemo = useMomDailyStore((state) => state.resetDemo);
  const lastEvent = useMomDailyStore((state) => state.lastEvent);
  const clearEvent = useMomDailyStore((state) => state.clearEvent);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!lastEvent) return;
    const timeout = setTimeout(clearEvent, 4200);
    return () => clearTimeout(timeout);
  }, [clearEvent, lastEvent]);

  const copyInvite = async () => {
    await Clipboard.setStringAsync(inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  return (
    <SafeAreaView edges={['top']} style={[styles.safe, { backgroundColor: colors.background }]}>
      <View style={styles.screen}>
        <ScrollView contentContainerStyle={[styles.scroll, { width: '100%', maxWidth: 540, alignSelf: 'center' }]} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <View>
              <Text style={[styles.kicker, { color: colors.accent }]}>OUR LITTLE HOME</Text>
              <Text style={[styles.title, { color: colors.ink }]}>我们</Text>
              <Text style={[styles.subtitle, { color: colors.inkMuted }]}>只属于你和妈妈的空间。</Text>
            </View>
            <AppMark size={43} />
          </View>

          <View style={[styles.pairCard, { backgroundColor: colors.ink }]}>
            <View style={styles.pairTop}>
              <View>
                <Text style={[styles.pairKicker, { color: colors.surfaceGreen }]}>FAMILY PAIR</Text>
                <Text style={[styles.pairTitle, { color: colors.white }]}>我们连接成功啦</Text>
              </View>
              <View style={[styles.connectedPill, { backgroundColor: colors.success }]}>
                <Ionicons name="checkmark" color={colors.white} size={12} />
                <Text style={styles.connectedText}>已连接</Text>
              </View>
            </View>
            <View style={styles.pairPeople}>
              <View style={styles.pairPerson}>
                <Avatar actor="me" size={57} showStatus />
                <Text style={[styles.pairName, { color: colors.white }]}>{displayNames.me}</Text>
              </View>
              <View style={styles.connection}>
                <View style={[styles.connectionLine, { backgroundColor: colors.accent }]} />
                <Ionicons name="link-outline" color={colors.sun} size={19} />
                <View style={[styles.connectionLine, { backgroundColor: colors.accent }]} />
              </View>
              <View style={styles.pairPerson}>
                <Avatar actor="mom" size={57} showStatus />
                <Text style={[styles.pairName, { color: colors.white }]}>{displayNames.mom}</Text>
              </View>
            </View>
            <View style={[styles.pairFoot, { borderTopColor: colors.line + '55' }]}>
              <Text style={[styles.pairFootText, { color: colors.inkSoft }]}>邀请码</Text>
              <Text style={[styles.pairCode, { color: colors.white }]}>{inviteCode}</Text>
              <Pressable onPress={copyInvite} accessibilityRole="button" style={[styles.copyButton, { backgroundColor: colors.surface }]}>
                {copied ? <Ionicons name="checkmark" color={colors.success} size={14} /> : <Ionicons name="copy-outline" color={colors.ink} size={14} />}
                <Text style={[styles.copyText, { color: colors.ink }]}>{copied ? '已复制' : '复制'}</Text>
              </Pressable>
            </View>
          </View>

          <View style={[styles.shareCard, { backgroundColor: colors.surfaceGreen }]}>
            <View style={[styles.shareIcon, { backgroundColor: colors.surface }]}>
              <Ionicons name="share-social-outline" color={colors.accent} size={19} />
            </View>
            <View style={styles.shareCopy}>
              <Text style={[styles.shareTitle, { color: colors.ink }]}>邀请妈妈一起开始</Text>
              <Text style={[styles.shareText, { color: colors.inkMuted }]}>把邀请码发给妈妈，绑定后就能实时看到彼此的完成状态。</Text>
            </View>
            <Ionicons name="chevron-forward" color={colors.inkMuted} size={17} />
          </View>

          {demoMode ? (
            <View style={[styles.demoCard, { backgroundColor: colors.surface, borderColor: colors.line }]}>
              <View style={styles.sectionTop}>
                <View>
                  <Text style={[styles.sectionTitle, { color: colors.ink }]}>开发演示面板</Text>
                  <Text style={[styles.sectionSubtitle, { color: colors.inkMuted }]}>用两个虚拟身份测试共同打卡</Text>
                </View>
                <View style={[styles.demoTag, { backgroundColor: colors.sunSoft }]}>
                  <Text style={[styles.demoTagText, { color: colors.sun }]}>DEV</Text>
                </View>
              </View>
              <View style={styles.identityRow}>
                {(['me', 'mom'] as Actor[]).map((actor) => (
                  <Pressable
                    key={actor}
                    onPress={() => setActiveActor(actor)}
                    style={[styles.identityButton, { backgroundColor: activeActor === actor ? colors.ink : colors.surfaceMuted }]}
                  >
                    <Text style={styles.identityEmoji}>{actor === 'me' ? '👦' : '👩'}</Text>
                    <Text style={[styles.identityText, { color: activeActor === actor ? colors.white : colors.inkMuted }]}>{actor === 'me' ? '我' : '妈妈'}</Text>
                    {activeActor === actor ? <Ionicons name="checkmark" color={colors.success} size={15} /> : null}
                  </Pressable>
                ))}
              </View>
              <View style={[styles.demoFoot, { borderTopColor: colors.line }]}>
                <View style={styles.demoFootText}>
                  <Text style={[styles.demoCurrent, { color: colors.ink }]}>当前模拟身份：{activeActor === 'me' ? '我' : '妈妈'}</Text>
                  <Text style={[styles.demoHint, { color: colors.inkMuted }]}>点击今天页的任意头像即可打卡</Text>
                </View>
                <Switch
                  value={demoMode}
                  onValueChange={setDemoMode}
                  trackColor={{ false: colors.line, true: colors.successSoft }}
                  thumbColor={demoMode ? colors.success : colors.inkSoft}
                />
              </View>
            </View>
          ) : null}

          <View style={styles.sectionLabel}>
            <Text style={[styles.sectionTitle, { color: colors.ink }]}>提醒与同步</Text>
            <Text style={[styles.sectionSubtitle, { color: colors.inkMuted }]}>温柔提醒，不打扰彼此</Text>
          </View>
          <View style={[styles.settingsCard, { backgroundColor: colors.surface, borderColor: colors.line }]}>
            <SettingRow icon={<Ionicons name="notifications-outline" color={colors.accent} size={18} />} title="每日提醒" subtitle="在合适的时间提醒我们" colors={colors}>
              <Switch value={notificationSettings.enabled} onValueChange={(value) => setNotification('enabled', value)} trackColor={{ false: colors.line, true: colors.successSoft }} thumbColor={notificationSettings.enabled ? colors.success : colors.inkSoft} />
            </SettingRow>
            <SettingRow icon={<Ionicons name="sunny-outline" color={colors.sun} size={18} />} title="早晨提醒" subtitle="08:30 轻轻开始今天" colors={colors}>
              <Switch value={notificationSettings.morningReminder} onValueChange={(value) => setNotification('morningReminder', value)} trackColor={{ false: colors.line, true: colors.successSoft }} thumbColor={notificationSettings.morningReminder ? colors.success : colors.inkSoft} />
            </SettingRow>
            <SettingRow icon={<Ionicons name="moon-outline" color={colors.lavender} size={18} />} title="晚间提醒" subtitle="21:30 看看还有什么小事" colors={colors}>
              <Switch value={notificationSettings.eveningReminder} onValueChange={(value) => setNotification('eveningReminder', value)} trackColor={{ false: colors.line, true: colors.successSoft }} thumbColor={notificationSettings.eveningReminder ? colors.success : colors.inkSoft} />
            </SettingRow>
            <SettingRow icon={isOnline ? <Ionicons name="wifi" color={colors.success} size={18} /> : <Ionicons name="cloud-offline-outline" color={colors.sun} size={18} />} title="实时同步" subtitle={isOnline ? '妈妈完成后会立即出现在这里' : '离线记录会在恢复网络后同步'} colors={colors} last>
              <Switch value={isOnline} onValueChange={setOnline} trackColor={{ false: colors.line, true: colors.successSoft }} thumbColor={isOnline ? colors.success : colors.inkSoft} />
            </SettingRow>
          </View>

          <View style={styles.sectionLabel}>
            <Text style={[styles.sectionTitle, { color: colors.ink }]}>日活设置</Text>
            <Text style={[styles.sectionSubtitle, { color: colors.inkMuted }]}>11 件固定的小事</Text>
          </View>
          <View style={[styles.habitsCard, { backgroundColor: colors.surface, borderColor: colors.line }]}>
            {defaultHabits.map((habit, index) => (
              <View key={habit.id} style={[styles.habitSetting, index === defaultHabits.length - 1 ? styles.lastHabit : null, { borderBottomColor: colors.line }]}>
                <View style={[styles.habitSettingIcon, { backgroundColor: colors.surfaceMuted }]}><Text style={styles.habitEmoji}>{habit.emoji}</Text></View>
                <View style={styles.habitSettingCopy}>
                  <Text style={[styles.habitSettingName, { color: colors.ink }]}>{habit.name}</Text>
                  <Text style={[styles.habitSettingTime, { color: colors.inkMuted }]}>{habit.category} · {habit.defaultTime}</Text>
                </View>
                <Text style={[styles.order, { color: colors.inkSoft }]}>{String(index + 1).padStart(2, '0')}</Text>
              </View>
            ))}
          </View>

          <View style={[styles.utilityCard, { backgroundColor: colors.surfaceMuted }]}>
            <View style={styles.utilityRow}>
              <View style={styles.utilityCopy}>
                <Text style={[styles.utilityTitle, { color: colors.ink }]}>外观</Text>
                <Text style={[styles.utilityText, { color: colors.inkMuted }]}>选择更适合今晚的颜色</Text>
              </View>
              <View style={[styles.themeSwitch, { backgroundColor: colors.surface }]}>
                <Pressable onPress={() => setThemeMode('light')} style={[styles.themeOption, { backgroundColor: themeMode === 'light' ? colors.surfaceGreen : 'transparent' }]}>
                  <Ionicons name="sunny-outline" color={themeMode === 'light' ? colors.ink : colors.inkSoft} size={14} />
                  <Text style={[styles.themeText, { color: themeMode === 'light' ? colors.ink : colors.inkSoft }]}>浅色</Text>
                </Pressable>
                <Pressable onPress={() => setThemeMode('dark')} style={[styles.themeOption, { backgroundColor: themeMode === 'dark' ? colors.surfaceGreen : 'transparent' }]}>
                  <Ionicons name="moon-outline" color={themeMode === 'dark' ? colors.ink : colors.inkSoft} size={14} />
                  <Text style={[styles.themeText, { color: themeMode === 'dark' ? colors.ink : colors.inkSoft }]}>深色</Text>
                </Pressable>
              </View>
            </View>
            <View style={[styles.utilityRow, { borderTopColor: colors.line }]}>
              <View style={[styles.statusIcon, { backgroundColor: isOnline ? colors.successSoft : colors.sunSoft }]}>
                {isOnline ? <Ionicons name="refresh-outline" color={colors.success} size={16} /> : <Ionicons name="cloud-offline-outline" color={colors.sun} size={16} />}
              </View>
              <View style={styles.utilityCopy}>
                <Text style={[styles.utilityTitle, { color: colors.ink }]}>{isOnline ? '同步正常' : '当前离线'}</Text>
                <Text style={[styles.utilityText, { color: colors.inkMuted }]}>{pendingSync.length > 0 ? pendingSync.length + ' 条记录等待同步' : '本地操作会立即生效'}</Text>
              </View>
            </View>
          </View>

          {demoMode ? (
            <Pressable onPress={resetDemo} style={({ pressed }) => [styles.resetButton, { borderColor: colors.line, opacity: pressed ? 0.65 : 1 }]}>
              <Ionicons name="refresh-outline" color={colors.inkMuted} size={15} />
              <Text style={[styles.resetText, { color: colors.inkMuted }]}>恢复 Demo 示例</Text>
            </Pressable>
          ) : null}

          <View style={styles.backendNote}>
            <Ionicons name={isSupabaseConfigured ? 'cloud-done-outline' : 'server-outline'} color={isSupabaseConfigured ? colors.success : colors.inkSoft} size={15} />
            <Text style={[styles.backendText, { color: colors.inkMuted }]}>
              {isSupabaseConfigured ? 'Supabase 已连接 · 私密同步已开启' : '演示数据保存在本机 · 配置 Supabase 后可跨设备同步'}
            </Text>
          </View>

          <View style={styles.privacy}>
            <Ionicons name="shield-checkmark-outline" color={colors.success} size={17} />
            <View style={styles.privacyCopy}>
              <Text style={[styles.privacyTitle, { color: colors.ink }]}>这是一个私人空间</Text>
              <Text style={[styles.privacyText, { color: colors.inkMuted }]}>只有配对的两个账号可以看到日活记录。{isSupabaseConfigured ? '已连接 Supabase。' : 'Demo Mode 未连接云端。'}</Text>
            </View>
            <Ionicons name="lock-closed-outline" color={colors.inkSoft} size={15} />
          </View>
        </ScrollView>
        {lastEvent ? <FeedbackToast message={lastEvent.message} offline={!isOnline} /> : null}
      </View>
    </SafeAreaView>
  );
}

function SettingRow({ icon, title, subtitle, colors, children, last = false }: { icon: React.ReactNode; title: string; subtitle: string; colors: ReturnType<typeof useAppTheme>['colors']; children: React.ReactNode; last?: boolean }) {
  return (
    <View style={[styles.settingRow, last ? styles.lastSetting : null, { borderBottomColor: colors.line }]}>
      <View style={[styles.settingIcon, { backgroundColor: colors.surfaceMuted }]}>{icon}</View>
      <View style={styles.settingCopy}>
        <Text style={[styles.settingTitle, { color: colors.ink }]}>{title}</Text>
        <Text style={[styles.settingSubtitle, { color: colors.inkMuted }]}>{subtitle}</Text>
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  screen: { flex: 1 },
  scroll: { paddingHorizontal: 18, paddingTop: 14, paddingBottom: 40 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 21 },
  kicker: { fontSize: 10, fontWeight: '900', letterSpacing: 1.4 },
  title: { fontSize: 30, lineHeight: 36, fontWeight: '900', letterSpacing: -0.8, marginTop: 4 },
  subtitle: { fontSize: 13, fontWeight: '600', marginTop: 2 },
  pairCard: { borderRadius: 24, padding: 18, overflow: 'hidden' },
  pairTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  pairKicker: { fontSize: 10, fontWeight: '900', letterSpacing: 1.3 },
  pairTitle: { fontSize: 20, fontWeight: '900', marginTop: 6 },
  connectedPill: { minHeight: 26, borderRadius: 9, flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8 },
  connectedText: { color: '#FFFFFF', fontSize: 10, fontWeight: '800' },
  pairPeople: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 22 },
  pairPerson: { alignItems: 'center', gap: 5 },
  pairName: { fontSize: 12, fontWeight: '800' },
  connection: { flexDirection: 'row', alignItems: 'center', gap: 5, marginHorizontal: 12, marginBottom: 20 },
  connectionLine: { width: 25, height: 1 },
  pairFoot: { borderTopWidth: 1, marginTop: 20, paddingTop: 12, flexDirection: 'row', alignItems: 'center' },
  pairFootText: { fontSize: 11, fontWeight: '700' },
  pairCode: { fontSize: 17, fontWeight: '900', letterSpacing: 1.8, marginLeft: 10 },
  copyButton: { marginLeft: 'auto', height: 29, borderRadius: 10, paddingHorizontal: 9, flexDirection: 'row', alignItems: 'center', gap: 4 },
  copyText: { fontSize: 10, fontWeight: '800' },
  shareCard: { minHeight: 70, borderRadius: 19, padding: 13, flexDirection: 'row', alignItems: 'center', marginTop: 13 },
  shareIcon: { width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  shareCopy: { flex: 1, marginLeft: 11, gap: 3 },
  shareTitle: { fontSize: 13, fontWeight: '900' },
  shareText: { fontSize: 10, lineHeight: 15, fontWeight: '600' },
  demoCard: { borderWidth: 1, borderRadius: 21, padding: 15, marginTop: 13 },
  sectionTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  sectionTitle: { fontSize: 17, fontWeight: '900' },
  sectionSubtitle: { fontSize: 11, fontWeight: '600', marginTop: 3 },
  demoTag: { borderRadius: 8, paddingHorizontal: 7, height: 23, justifyContent: 'center' },
  demoTagText: { fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  identityRow: { flexDirection: 'row', gap: 9, marginTop: 14 },
  identityButton: { flex: 1, height: 44, borderRadius: 13, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  identityEmoji: { fontSize: 17 },
  identityText: { fontSize: 12, fontWeight: '800' },
  demoFoot: { borderTopWidth: 1, marginTop: 13, paddingTop: 12, flexDirection: 'row', alignItems: 'center' },
  demoFootText: { flex: 1, gap: 3 },
  demoCurrent: { fontSize: 11, fontWeight: '800' },
  demoHint: { fontSize: 10, fontWeight: '600' },
  sectionLabel: { marginTop: 27, marginBottom: 11 },
  settingsCard: { borderRadius: 21, borderWidth: 1, paddingHorizontal: 14, paddingTop: 3, paddingBottom: 3 },
  settingRow: { minHeight: 64, borderBottomWidth: 1, flexDirection: 'row', alignItems: 'center' },
  lastSetting: { borderBottomWidth: 0 },
  settingIcon: { width: 34, height: 34, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  settingCopy: { flex: 1, marginLeft: 10, gap: 3 },
  settingTitle: { fontSize: 13, fontWeight: '800' },
  settingSubtitle: { fontSize: 10, fontWeight: '600' },
  habitsCard: { borderRadius: 21, borderWidth: 1, paddingHorizontal: 14, paddingTop: 2, paddingBottom: 2 },
  habitSetting: { minHeight: 51, borderBottomWidth: 1, flexDirection: 'row', alignItems: 'center' },
  lastHabit: { borderBottomWidth: 0 },
  habitSettingIcon: { width: 30, height: 30, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  habitEmoji: { fontSize: 16 },
  habitSettingCopy: { flex: 1, marginLeft: 10, gap: 3 },
  habitSettingName: { fontSize: 12, fontWeight: '800' },
  habitSettingTime: { fontSize: 9, fontWeight: '600' },
  order: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  utilityCard: { borderRadius: 20, marginTop: 13, paddingHorizontal: 14 },
  utilityRow: { minHeight: 65, flexDirection: 'row', alignItems: 'center' },
  utilityCopy: { flex: 1, gap: 3, marginLeft: 10 },
  utilityTitle: { fontSize: 12, fontWeight: '800' },
  utilityText: { fontSize: 10, fontWeight: '600' },
  themeSwitch: { height: 34, borderRadius: 11, padding: 3, flexDirection: 'row', gap: 2 },
  themeOption: { height: 28, borderRadius: 8, flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8 },
  themeText: { fontSize: 10, fontWeight: '800' },
  statusIcon: { width: 34, height: 34, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  resetButton: { height: 42, borderRadius: 14, borderWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 15 },
  resetText: { fontSize: 11, fontWeight: '800' },
  privacy: { flexDirection: 'row', alignItems: 'flex-start', marginTop: 22, paddingHorizontal: 4 },
  privacyCopy: { flex: 1, marginLeft: 8, gap: 3 },
  privacyTitle: { fontSize: 11, fontWeight: '800' },
  privacyText: { fontSize: 10, lineHeight: 15, fontWeight: '600' },
  backendNote: { flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 4, marginTop: 14 },
  backendText: { flex: 1, fontSize: 10, lineHeight: 15, fontWeight: '600' },
});
