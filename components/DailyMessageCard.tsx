import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { useAppTheme } from '@/hooks/useAppTheme';
import type { Actor, DailyMessage } from '@/store/useMomDailyStore';

type Props = {
  messages: Partial<Record<Actor, DailyMessage>>;
  activeActor: Actor;
  displayNames: { me: string; mom: string };
  onSave: (content: string) => void;
  readOnly?: boolean;
};

const avatarFor = (actor: Actor) => (actor === 'me' ? '👦' : '👩');

export function DailyMessageCard({ messages, activeActor, displayNames, onSave, readOnly = false }: Props) {
  const { colors } = useAppTheme();
  const [editing, setEditing] = useState(false);
  const ownMessage = messages[activeActor];
  const otherActor: Actor = activeActor === 'me' ? 'mom' : 'me';
  const otherMessage = messages[otherActor];
  const [draft, setDraft] = useState(ownMessage?.content ?? '');

  useEffect(() => {
    if (!editing) setDraft(ownMessage?.content ?? '');
  }, [activeActor, editing, ownMessage?.content]);

  const cancelEditing = () => {
    setDraft(ownMessage?.content ?? '');
    setEditing(false);
  };

  const save = () => {
    const next = draft.trim();
    if (!next && !ownMessage) return;
    onSave(next);
    setEditing(false);
  };

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.line }]}>
      <View style={styles.header}>
        <View style={[styles.icon, { backgroundColor: colors.lavenderSoft }]}>
          <Ionicons name="chatbubble-ellipses-outline" color={colors.lavender} size={17} />
        </View>
        <View style={styles.headerCopy}>
          <Text style={[styles.title, { color: colors.ink }]}>每日寄语</Text>
          <Text style={[styles.subtitle, { color: colors.inkMuted }]}>{readOnly ? '当天留下的两句话' : '今天，留一句给对方'}</Text>
        </View>
        <View style={[styles.livePill, { backgroundColor: colors.surfaceMuted }]}>
          <View style={[styles.liveDot, { backgroundColor: readOnly ? colors.inkSoft : colors.success }]} />
          <Text style={[styles.liveText, { color: colors.inkMuted }]}>{readOnly ? '历史记录' : '实时同步'}</Text>
        </View>
      </View>

      <MessageLine
        actor={activeActor}
        label={displayNames[activeActor]}
        message={ownMessage?.content}
        editable={!readOnly}
        editing={!readOnly && editing}
        draft={draft}
        onChangeDraft={setDraft}
        onEdit={() => { if (!readOnly) setEditing(true); }}
        onCancel={cancelEditing}
        onSave={() => { if (!readOnly) save(); }}
        onClear={() => {
          if (readOnly) return;
          onSave('');
          setDraft('');
          setEditing(false);
        }}
        emptyText={readOnly ? '当天还没有留下寄语' : '今天想留一句话吗？'}
      />

      <View style={[styles.divider, { backgroundColor: colors.line }]} />

      <MessageLine
        actor={otherActor}
        label={displayNames[otherActor]}
        message={otherMessage?.content}
        editable={false}
        editing={false}
        draft=""
        onChangeDraft={() => undefined}
        onEdit={() => undefined}
        onCancel={() => undefined}
        onSave={() => undefined}
        onClear={() => undefined}
        emptyText="当天还没有留下寄语"
      />
    </View>
  );
}

type MessageLineProps = {
  actor: Actor;
  label: string;
  message?: string;
  editable: boolean;
  editing: boolean;
  draft: string;
  onChangeDraft: (value: string) => void;
  onEdit: () => void;
  onCancel: () => void;
  onSave: () => void;
  onClear: () => void;
  emptyText: string;
};

function MessageLine({ actor, label, message, editable, editing, draft, onChangeDraft, onEdit, onCancel, onSave, onClear, emptyText }: MessageLineProps) {
  const { colors } = useAppTheme();

  return (
    <View style={styles.line}>
      <View style={[styles.avatar, { backgroundColor: actor === 'me' ? colors.surfaceGreen : colors.sunSoft }]}>
        <Text style={styles.avatarEmoji}>{avatarFor(actor)}</Text>
      </View>
      <View style={styles.messageArea}>
        <View style={styles.nameRow}>
          <Text style={[styles.name, { color: colors.ink }]}>{label}</Text>
          {editable ? <Text style={[styles.ownLabel, { color: colors.inkMuted }]}>我的寄语</Text> : null}
        </View>

        {editing ? (
          <>
            <TextInput
              value={draft}
              onChangeText={onChangeDraft}
              placeholder="写一句想对 TA 说的话…"
              placeholderTextColor={colors.inkSoft}
              maxLength={80}
              multiline
              autoFocus
              textAlignVertical="top"
              accessibilityLabel="输入今日寄语"
              style={[styles.input, { color: colors.ink, borderColor: colors.line, backgroundColor: colors.background }]}
            />
            <View style={styles.editorFooter}>
              <Text style={[styles.counter, { color: colors.inkSoft }]}>{draft.length}/80</Text>
              <View style={styles.editorActions}>
                {message ? (
                  <Pressable onPress={onClear} hitSlop={8} accessibilityRole="button">
                    <Text style={[styles.clearText, { color: colors.accent }]}>清空</Text>
                  </Pressable>
                ) : null}
                <Pressable onPress={onCancel} hitSlop={8} accessibilityRole="button">
                  <Text style={[styles.cancelText, { color: colors.inkMuted }]}>取消</Text>
                </Pressable>
                <Pressable
                  disabled={!draft.trim() && !message}
                  onPress={onSave}
                  accessibilityRole="button"
                  style={({ pressed }) => [
                    styles.saveButton,
                    { backgroundColor: colors.ink, opacity: !draft.trim() && !message ? 0.35 : pressed ? 0.76 : 1 },
                  ]}
                >
                  <Text style={[styles.saveText, { color: colors.white }]}>保存</Text>
                </Pressable>
              </View>
            </View>
          </>
        ) : (
          <View style={styles.readRow}>
            <Text style={[styles.message, { color: message ? colors.ink : colors.inkMuted }]} numberOfLines={3}>
              {message ? '“' + message + '”' : emptyText}
            </Text>
            {editable ? (
              <Pressable
                onPress={onEdit}
                accessibilityRole="button"
                accessibilityLabel={message ? '编辑今日寄语' : '写今日寄语'}
                style={({ pressed }) => [styles.editButton, { backgroundColor: colors.lavenderSoft, opacity: pressed ? 0.72 : 1 }]}
              >
                <Ionicons name={message ? 'pencil-outline' : 'add'} color={colors.lavender} size={14} />
                <Text style={[styles.editText, { color: colors.lavender }]}>{message ? '编辑' : '写一句'}</Text>
              </Pressable>
            ) : null}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: 21, padding: 15 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  icon: { width: 35, height: 35, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  headerCopy: { flex: 1, marginLeft: 10 },
  title: { fontSize: 16, fontWeight: '900' },
  subtitle: { fontSize: 11, fontWeight: '600', marginTop: 2 },
  livePill: { minHeight: 23, borderRadius: 8, paddingHorizontal: 7, flexDirection: 'row', alignItems: 'center', gap: 4 },
  liveDot: { width: 5, height: 5, borderRadius: 3 },
  liveText: { fontSize: 9, fontWeight: '800' },
  line: { flexDirection: 'row', alignItems: 'flex-start' },
  avatar: { width: 31, height: 31, borderRadius: 11, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  avatarEmoji: { fontSize: 17 },
  messageArea: { flex: 1, marginLeft: 9, minWidth: 0 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  name: { fontSize: 12, fontWeight: '900' },
  ownLabel: { fontSize: 10, fontWeight: '700' },
  readRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  message: { flex: 1, fontSize: 13, lineHeight: 19, fontWeight: '600' },
  editButton: { minHeight: 29, borderRadius: 9, paddingHorizontal: 8, flexDirection: 'row', alignItems: 'center', gap: 3 },
  editText: { fontSize: 10, fontWeight: '900' },
  divider: { height: 1, marginVertical: 13, marginLeft: 40 },
  input: { minHeight: 70, maxHeight: 118, borderWidth: 1, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 9, fontSize: 13, lineHeight: 19, fontWeight: '600' },
  editorFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
  counter: { fontSize: 10, fontWeight: '700' },
  editorActions: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  clearText: { fontSize: 11, fontWeight: '800' },
  cancelText: { fontSize: 11, fontWeight: '800' },
  saveButton: { minHeight: 29, paddingHorizontal: 10, borderRadius: 9, justifyContent: 'center' },
  saveText: { fontSize: 11, fontWeight: '900' },
});
