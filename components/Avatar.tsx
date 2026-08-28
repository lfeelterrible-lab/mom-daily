import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import type { Actor } from '@/store/useMomDailyStore';
import { useAppTheme } from '@/hooks/useAppTheme';

type Props = {
  actor: Actor;
  size?: number;
  showStatus?: boolean;
  status?: 'online' | 'waiting';
};

const avatarContent: Record<Actor, { emoji: string; name: string }> = {
  me: { emoji: '👦', name: '我' },
  mom: { emoji: '👩', name: '妈妈' },
};

export function Avatar({ actor, size = 42, showStatus = false, status = 'online' }: Props) {
  const { colors } = useAppTheme();
  const content = avatarContent[actor];

  return (
    <View style={{ width: size + 8, height: size + 8 }}>
      <View
        accessible
        accessibilityLabel={content.name + '头像'}
        style={[
          styles.avatar,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: actor === 'me' ? colors.surfaceGreen : colors.sunSoft,
            borderColor: colors.white,
          },
        ]}
      >
        <Text style={{ fontSize: size * 0.46 }}>{content.emoji}</Text>
      </View>
      {showStatus ? (
        <View
          style={[
            styles.status,
            {
              backgroundColor: status === 'online' ? colors.success : colors.sun,
              borderColor: colors.surface,
            },
          ]}
        >
          {status === 'online' ? <Ionicons name="checkmark" color={colors.white} size={9} /> : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
  },
  status: {
    position: 'absolute',
    right: 4,
    bottom: 4,
    width: 14,
    height: 14,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
});
