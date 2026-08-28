import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, SafeAreaView, StyleSheet, Text, TextInput, View } from 'react-native';

import { AppMark } from '@/components/AppMark';
import { ensureSession } from '@/features/auth/auth';
import { createPair, getPairMembers, joinPair, type PairMember } from '@/features/pairing/pairing';
import { useAppTheme } from '@/hooks/useAppTheme';
import { isSupabaseConfigured } from '@/lib/supabase';
import { useMomDailyStore, type Actor } from '@/store/useMomDailyStore';

const pages = [
  {
    kicker: 'MOMDAILY / 01',
    title: '每天一点小事，\n我们一起坚持。',
    body: '不是为了完成更多，\n只是想把彼此放进今天。',
    icon: 'sparkle',
  },
  {
    kicker: 'MOMDAILY / 02',
    title: '11 件小事，\n组成我们的一天。',
    body: '从早饭到睡觉，\n每一项都留下一点共同的痕迹。',
    icon: 'link',
  },
  {
    kicker: 'MOMDAILY / 03',
    title: '一起完成，\n一起留下记录。',
    body: '先连接你们两个人，\n然后每天来这里碰个面。',
    icon: 'key',
  },
] as const;

export default function OnboardingScreen() {
  const { colors } = useAppTheme();
  const hasSeenOnboarding = useMomDailyStore((state) => state.hasSeenOnboarding);
  const demoMode = useMomDailyStore((state) => state.demoMode);
  const setHasSeenOnboarding = useMomDailyStore((state) => state.setHasSeenOnboarding);
  const setPairConnection = useMomDailyStore((state) => state.setPairConnection);
  const [page, setPage] = useState(0);
  const [setupMode, setSetupMode] = useState<'start' | 'join' | null>(null);
  const [inviteCode, setInviteCode] = useState('');
  const [setupError, setSetupError] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    if (hasSeenOnboarding) router.replace('/(tabs)');
  }, [hasSeenOnboarding]);

  if (hasSeenOnboarding) return null;

  const resetSetup = () => {
    setSetupMode(null);
    setInviteCode('');
    setSetupError('');
    setIsConnecting(false);
  };

  const chooseSetupMode = (mode: 'start' | 'join') => {
    setSetupError('');
    setSetupMode(mode);
  };

  const handleTopAction = () => {
    if (page < pages.length - 1) {
      setPage(pages.length - 1);
      resetSetup();
      return;
    }
    resetSetup();
  };

  const finish = async () => {
    const normalizedInviteCode = inviteCode.trim().replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    if (setupMode === 'join' && normalizedInviteCode.length !== 6) {
      setSetupError('请输入 6 位邀请码');
      return;
    }

    if (!demoMode && !isSupabaseConfigured) {
      setSetupError('云端服务还没有连接，请先完成 Supabase 配置');
      return;
    }

    if (setupMode && !demoMode && isSupabaseConfigured) {
      setSetupError('');
      setIsConnecting(true);
      const sessionResult = await ensureSession();
      const currentUserId = sessionResult.data.session?.user.id;
      if (sessionResult.error || !currentUserId) {
        setSetupError('暂时连接不上服务，请检查 Supabase Auth 设置');
        setIsConnecting(false);
        return;
      }

      const pairResult = setupMode === 'start' ? await createPair('我') : await joinPair(normalizedInviteCode, '妈妈');
      const pair = pairResult.data as { id?: string; invite_code?: string } | null;
      if (pairResult.error || !pair?.id) {
        setSetupError(pairResult.error?.message ?? '邀请码无效或家庭已经满员');
        setIsConnecting(false);
        return;
      }

      const membersResult = await getPairMembers(pair.id);
      if (membersResult.error) {
        setSetupError('家庭已创建，但暂时读取不到成员状态，请稍后重试');
        setIsConnecting(false);
        return;
      }
      const members = (membersResult.data ?? []) as PairMember[];
      const other = members.find((member) => member.id !== currentUserId);
      const current = members.find((member) => member.id === currentUserId);
      const activeActor: Actor = setupMode === 'start' ? 'me' : 'mom';
      setPairConnection({
        pairId: pair.id,
        inviteCode: pair.invite_code ?? normalizedInviteCode,
        displayNames: activeActor === 'me'
          ? { me: current?.display_name ?? '我', mom: other?.display_name ?? '妈妈' }
          : { me: other?.display_name ?? '我', mom: current?.display_name ?? '妈妈' },
        userIds: activeActor === 'me'
          ? { me: currentUserId, mom: other?.id ?? '' }
          : { me: other?.id ?? '', mom: currentUserId },
        memberCount: members.length,
        activeActor,
      });
      setIsConnecting(false);
    }

    setHasSeenOnboarding(true);
    router.replace('/(tabs)');
  };

  const pageData = pages[page];
  const iconName = pageData.icon === 'sparkle' ? 'sparkles-outline' : pageData.icon === 'link' ? 'link-outline' : 'key-outline';

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView style={styles.keyboard} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.container}>
        <View style={styles.top}>
          <AppMark size={43} showWordmark />
          <Pressable onPress={handleTopAction} accessibilityRole="button">
            <Text style={[styles.skip, { color: colors.inkMuted }]}>{page === pages.length - 1 ? '重新选择' : '去设置'}</Text>
          </Pressable>
        </View>

        <View style={styles.content}>
          <View style={[styles.iconStage, { backgroundColor: colors.surfaceGreen }]}>
            <View style={[styles.orbit, { borderColor: colors.line }]} />
            <Ionicons name={iconName} color={colors.accent} size={42} />
            <View style={[styles.miniDot, { backgroundColor: colors.sun }]} />
          </View>
          <Text style={[styles.kicker, { color: colors.accent }]}>{pageData.kicker}</Text>
          <Text style={[styles.title, { color: colors.ink }]}>{pageData.title}</Text>
          <Text style={[styles.body, { color: colors.inkMuted }]}>{pageData.body}</Text>

          {page === 2 ? (
            <View style={styles.setup}>
              {setupMode === null ? (
                <>
                  <Pressable onPress={() => chooseSetupMode('start')} style={[styles.setupButton, { backgroundColor: colors.ink }]}>
                    <Text style={[styles.setupButtonText, { color: colors.background }]}>我是发起人</Text>
                    <Ionicons name="chevron-forward" color={colors.background} size={18} />
                  </Pressable>
                  <Pressable onPress={() => chooseSetupMode('join')} style={[styles.setupButton, styles.outlineButton, { borderColor: colors.line }]}>
                    <Text style={[styles.setupButtonText, { color: colors.ink }]}>输入邀请码</Text>
                    <Ionicons name="key-outline" color={colors.accent} size={17} />
                  </Pressable>
                </>
              ) : setupMode === 'start' ? (
                <>
                  <View style={[styles.codeHint, { backgroundColor: colors.surface }]}>
                    <Text style={[styles.codeHintLabel, { color: colors.inkMuted }]}>你的家庭邀请码</Text>
                    <Text style={[styles.codeHintValue, { color: colors.ink }]}>创建后生成</Text>
                  </View>
                  {setupError ? <Text style={[styles.error, { color: colors.accent }]}>{setupError}</Text> : null}
                  <Pressable disabled={isConnecting} onPress={finish} style={[styles.setupButton, { backgroundColor: colors.ink, opacity: isConnecting ? 0.7 : 1 }]}>
                    <Text style={[styles.setupButtonText, { color: colors.background }]}>{isConnecting ? '连接中…' : '开始我们的日活'}</Text>
                    <Ionicons name="chevron-forward" color={colors.background} size={18} />
                  </Pressable>
                </>
              ) : (
                <>
                  <View style={styles.setupHeading}>
                    <Text style={[styles.setupHeadingText, { color: colors.ink }]}>连接妈妈的家庭</Text>
                    <Pressable onPress={resetSetup} accessibilityRole="button">
                      <Text style={[styles.changeMode, { color: colors.accent }]}>重新选择</Text>
                    </Pressable>
                  </View>
                  <TextInput
                    autoCapitalize="characters"
                    autoCorrect={false}
                    autoFocus
                    editable={!isConnecting}
                    maxLength={6}
                    onSubmitEditing={() => void finish()}
                    value={inviteCode}
                    onChangeText={(value) => {
                      setInviteCode(value.replace(/[^a-zA-Z0-9]/g, '').slice(0, 6).toUpperCase());
                      if (setupError) setSetupError('');
                    }}
                    placeholder="例如 MOM826"
                    placeholderTextColor={colors.inkSoft}
                    style={[styles.input, { color: colors.ink, backgroundColor: colors.surface, borderColor: colors.line }]}
                  />
                  <View style={styles.inputMeta}>
                    <Text style={[styles.inputHint, { color: colors.inkSoft }]}>{inviteCode.length}/6 位邀请码</Text>
                    {inviteCode ? (
                      <Pressable onPress={() => { setInviteCode(''); setSetupError(''); }} accessibilityRole="button">
                        <Text style={[styles.clearInput, { color: colors.accent }]}>清空重输</Text>
                      </Pressable>
                    ) : null}
                  </View>
                  {setupError ? <Text style={[styles.error, { color: colors.accent }]}>{setupError}</Text> : null}
                  <Pressable disabled={isConnecting} onPress={finish} style={[styles.setupButton, { backgroundColor: colors.ink, opacity: isConnecting ? 0.7 : 1 }]}>
                    <Text style={[styles.setupButtonText, { color: colors.background }]}>{isConnecting ? '连接中…' : '连接我和妈妈'}</Text>
                    <Ionicons name="chevron-forward" color={colors.background} size={18} />
                  </Pressable>
                </>
              )}
            </View>
          ) : (
            <Pressable
              onPress={() => setPage((value) => Math.min(2, value + 1))}
              style={({ pressed }) => [styles.nextButton, { backgroundColor: colors.accent, opacity: pressed ? 0.8 : 1 }]}
            >
              <Text style={styles.nextText}>下一页</Text>
              <Ionicons name="chevron-forward" color={colors.white} size={19} />
            </Pressable>
          )}
        </View>

          <View style={styles.bottom}>
          <View style={styles.dots}>
            {pages.map((_, index) => (
              <View key={index} style={[styles.dot, { backgroundColor: index === page ? colors.accent : colors.line, width: index === page ? 22 : 7 }]} />
            ))}
          </View>
          {page === 2 && setupMode !== null ? (
            <Pressable onPress={resetSetup}>
              <Text style={[styles.back, { color: colors.inkMuted }]}>返回选择</Text>
            </Pressable>
          ) : (
            <Text style={[styles.bottomNote, { color: colors.inkSoft }]}>只有你和妈妈看得到</Text>
          )}
        </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  keyboard: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 20,
    justifyContent: 'space-between',
  },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  skip: {
    fontSize: 13,
    fontWeight: '700',
  },
  content: {
    alignItems: 'center',
    paddingBottom: 18,
  },
  iconStage: {
    width: 104,
    height: 104,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginBottom: 29,
  },
  orbit: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 1,
    position: 'absolute',
  },
  miniDot: {
    position: 'absolute',
    width: 9,
    height: 9,
    borderRadius: 5,
    top: 21,
    right: 18,
  },
  kicker: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 13,
  },
  title: {
    textAlign: 'center',
    fontSize: 31,
    lineHeight: 42,
    fontWeight: '800',
    letterSpacing: -0.7,
  },
  body: {
    textAlign: 'center',
    fontSize: 15,
    lineHeight: 24,
    fontWeight: '600',
    marginTop: 16,
  },
  nextButton: {
    minWidth: 165,
    height: 52,
    borderRadius: 18,
    marginTop: 31,
    paddingHorizontal: 21,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  nextText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  setup: {
    width: '100%',
    gap: 10,
    marginTop: 27,
  },
  setupHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 3,
    marginBottom: 1,
  },
  setupHeadingText: {
    fontSize: 13,
    fontWeight: '900',
  },
  changeMode: {
    fontSize: 11,
    fontWeight: '800',
  },
  setupButton: {
    minHeight: 52,
    borderRadius: 18,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  outlineButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
  },
  setupButtonText: {
    fontSize: 14,
    fontWeight: '800',
  },
  codeHint: {
    minHeight: 72,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 3,
    marginBottom: 1,
  },
  codeHintLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
  codeHintValue: {
    fontSize: 23,
    fontWeight: '900',
    letterSpacing: 2,
  },
  input: {
    height: 52,
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 16,
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 2,
  },
  inputMeta: {
    minHeight: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    marginTop: -4,
  },
  inputHint: {
    fontSize: 10,
    fontWeight: '700',
  },
  clearInput: {
    fontSize: 10,
    fontWeight: '800',
  },
  error: { textAlign: 'center', fontSize: 11, fontWeight: '700', marginTop: -2 },
  bottom: {
    alignItems: 'center',
    gap: 15,
  },
  dots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    height: 7,
    borderRadius: 4,
  },
  bottomNote: {
    fontSize: 11,
    fontWeight: '700',
  },
  back: {
    fontSize: 12,
    fontWeight: '700',
  },
});
