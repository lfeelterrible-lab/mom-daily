import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { formatRelativeTime } from '@/lib/date';
import { useAppTheme } from '@/hooks/useAppTheme';
import type { Actor, QuickMessage } from '@/store/useMomDailyStore';

type Props = {
  date: string;
  messages: QuickMessage[];
  activeActor: Actor;
  displayNames: { me: string; mom: string };
  pairConnected: boolean;
  isOnline: boolean;
  onSend: (content: string) => void;
};

const quickOptions = ['吃饭了吗？', '等你一起打卡', '记得休息', '我先去忙啦', '晚安，明天见'];

export function QuickMessageCard({ date, messages, activeActor, displayNames, pairConnected, isOnline, onSend }: Props) {
  const { colors } = useAppTheme();
  const [draft, setDraft] = useState('');
  const todayMessages = useMemo(
    () => messages.filter((message) => message.date === date).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()).slice(-8),
    [date, messages],
  );

  const send = (content = draft) => {
    const next = content.trim().slice(0, 40);
    if (!next || !pairConnected) return;
    onSend(next);
    setDraft('');
  };

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.line }]}>
      <View style={styles.header}>
        <View style={[styles.icon, { backgroundColor: colors.accentSoft }]}>
          <Ionicons name="chatbubbles-outline" color={colors.accent} size={18} />
        </View>
        <View style={styles.headerCopy}>
          <Text style={[styles.title, { color: colors.ink }]}>通讯信息</Text>
          <Text style={[styles.subtitle, { color: colors.inkMuted }]}>发一句短消息，马上留在这里</Text>
        </View>
        <View style={[styles.livePill, { backgroundColor: colors.surfaceMuted }]}>
          <View style={[styles.liveDot, { backgroundColor: pairConnected && isOnline ? colors.success : colors.inkSoft }]} />
          <Text style={[styles.liveText, { color: colors.inkMuted }]}>{pairConnected && isOnline ? '实时同步' : '云端记录'}</Text>
        </View>
      </View>

      {todayMessages.length > 0 ? (
        <View style={styles.messageList}>
          {todayMessages.map((message) => {
            const own = message.from === activeActor;
            const sender = message.from === 'mom' ? displayNames.mom : displayNames.me;
            return (
              <View key={message.id} style={[styles.messageRow, own ? styles.messageRowOwn : null]}>
                <View style={[styles.messageBubble, { backgroundColor: own ? colors.accentSoft : colors.surfaceMuted }]}>
                  <View style={styles.messageMeta}>
                    <Text style={[styles.sender, { color: own ? colors.accent : colors.inkMuted }]}>{sender}</Text>
                    <Text style={[styles.time, { color: colors.inkSoft }]}>{formatRelativeTime(message.createdAt)}</Text>
                  </View>
                  <Text style={[styles.messageText, { color: colors.ink }]}>{message.content}</Text>
                </View>
              </View>
            );
          })}
        </View>
      ) : (
        <View style={[styles.empty, { backgroundColor: colors.surfaceMuted }]}>
          <Ionicons name="chatbubble-ellipses-outline" color={colors.inkSoft} size={16} />
          <Text style={[styles.emptyText, { color: colors.inkMuted }]}>还没有通讯记录，选一句发给对方吧</Text>
        </View>
      )}

      {pairConnected ? (
        <>
          <Text style={[styles.quickLabel, { color: colors.inkMuted }]}>快捷消息</Text>
          <View style={styles.options}>
            {quickOptions.map((option) => (
              <Pressable
                key={option}
                onPress={() => send(option)}
                accessibilityRole="button"
                accessibilityLabel={'发送快捷消息' + option}
                style={({ pressed }) => [styles.option, { backgroundColor: colors.surfaceGreen, opacity: pressed ? 0.7 : 1 }]}
              >
                <Text style={[styles.optionText, { color: colors.ink }]}>{option}</Text>
              </Pressable>
            ))}
          </View>
          <View style={styles.inputRow}>
            <TextInput
              value={draft}
              onChangeText={setDraft}
              onSubmitEditing={() => send()}
              placeholder="输入一条简短消息…"
              placeholderTextColor={colors.inkSoft}
              maxLength={40}
              returnKeyType="send"
              accessibilityLabel="输入快捷消息"
              style={[styles.input, { color: colors.ink, backgroundColor: colors.background, borderColor: colors.line }]}
            />
            <Pressable
              onPress={() => send()}
              disabled={!draft.trim()}
              accessibilityRole="button"
              accessibilityLabel="发送快捷消息"
              style={({ pressed }) => [styles.sendButton, { backgroundColor: colors.ink, opacity: !draft.trim() ? 0.3 : pressed ? 0.7 : 1 }]}
            >
              <Ionicons name="arrow-up" color={colors.white} size={17} />
            </Pressable>
          </View>
          <Text style={[styles.footerHint, { color: colors.inkSoft }]}>{isOnline ? '消息会同步到对方手机' : '当前离线，联网后会自动发送'} · {draft.length}/40</Text>
        </>
      ) : (
        <View style={[styles.locked, { backgroundColor: colors.surfaceMuted }]}>
          <Ionicons name="lock-closed-outline" color={colors.inkMuted} size={14} />
          <Text style={[styles.lockedText, { color: colors.inkMuted }]}>完成双人绑定后，就可以发送快捷消息</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: 21, padding: 15 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 13 },
  icon: { width: 35, height: 35, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  headerCopy: { flex: 1, marginLeft: 10, gap: 2 },
  title: { fontSize: 16, fontWeight: '900' },
  subtitle: { fontSize: 11, fontWeight: '600' },
  livePill: { minHeight: 23, borderRadius: 8, paddingHorizontal: 7, flexDirection: 'row', alignItems: 'center', gap: 4 },
  liveDot: { width: 5, height: 5, borderRadius: 3 },
  liveText: { fontSize: 9, fontWeight: '800' },
  messageList: { gap: 7 },
  messageRow: { flexDirection: 'row', justifyContent: 'flex-start' },
  messageRowOwn: { justifyContent: 'flex-end' },
  messageBubble: { maxWidth: '86%', borderRadius: 14, paddingHorizontal: 11, paddingVertical: 8 },
  messageMeta: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 3 },
  sender: { fontSize: 10, fontWeight: '900' },
  time: { fontSize: 9, fontWeight: '600' },
  messageText: { fontSize: 12, lineHeight: 17, fontWeight: '700' },
  empty: { minHeight: 42, borderRadius: 13, paddingHorizontal: 11, flexDirection: 'row', alignItems: 'center', gap: 7 },
  emptyText: { fontSize: 11, fontWeight: '700' },
  quickLabel: { fontSize: 10, fontWeight: '800', marginTop: 14, marginBottom: 7 },
  options: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  option: { minHeight: 31, borderRadius: 10, justifyContent: 'center', paddingHorizontal: 9 },
  optionText: { fontSize: 10, fontWeight: '800' },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 10 },
  input: { flex: 1, minHeight: 39, borderWidth: 1, borderRadius: 12, paddingHorizontal: 11, fontSize: 12, fontWeight: '600' },
  sendButton: { width: 39, height: 39, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  footerHint: { fontSize: 9, fontWeight: '600', marginTop: 7 },
  locked: { minHeight: 42, borderRadius: 13, paddingHorizontal: 11, flexDirection: 'row', alignItems: 'center', gap: 7 },
  lockedText: { flex: 1, fontSize: 11, fontWeight: '700' },
});
