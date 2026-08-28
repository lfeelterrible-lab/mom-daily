import { Link, Stack } from 'expo-router';
import { Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';

import { useAppTheme } from '@/hooks/useAppTheme';

export default function NotFoundScreen() {
  const { colors } = useAppTheme();

  return (
    <>
      <Stack.Screen options={{ title: '日活' }} />
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
        <View style={styles.container}>
          <Text style={styles.emoji}>🌙</Text>
          <Text style={[styles.title, { color: colors.ink }]}>这页还没准备好</Text>
          <Text style={[styles.copy, { color: colors.inkMuted }]}>回到今天，继续和妈妈完成小事吧。</Text>
          <Link href="/" asChild>
            <Pressable style={[styles.link, { backgroundColor: colors.accent }]}>
              <Text style={styles.linkText}>回到首页</Text>
            </Pressable>
          </Link>
        </View>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  emoji: { fontSize: 42, marginBottom: 16 },
  title: { fontSize: 22, fontWeight: '900' },
  copy: { fontSize: 13, fontWeight: '600', marginTop: 8 },
  link: {
    marginTop: 22,
    height: 46,
    minWidth: 125,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  linkText: { fontSize: 13, color: '#FFFFFF', fontWeight: '800' },
});
