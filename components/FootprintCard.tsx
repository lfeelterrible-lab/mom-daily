import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { footprintProvinces, type FootprintCity, type FootprintProvince } from '@/constants/footprints';
import { useAppTheme } from '@/hooks/useAppTheme';
import type { Footprint } from '@/store/useMomDailyStore';

type Props = {
  footprints: Footprint[];
  pairConnected: boolean;
  isOnline: boolean;
  onToggleCity: (province: FootprintProvince, city: FootprintCity) => void;
};

export function FootprintCard({ footprints, pairConnected, isOnline, onToggleCity }: Props) {
  const { colors } = useAppTheme();
  const [selectedProvince, setSelectedProvince] = useState<FootprintProvince | null>(null);
  const visitedKeys = useMemo(() => new Set(footprints.map((item) => item.provinceCode + ':' + item.cityCode)), [footprints]);
  const visitedProvinceCount = footprintProvinces.filter((item) => item.cities.some((city) => visitedKeys.has(item.code + ':' + city.code))).length;
  const visitedCityCount = footprints.length;

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.line }]}>
      <View style={styles.header}>
        <View style={[styles.icon, { backgroundColor: colors.sunSoft }]}>
          <Ionicons name="map-outline" color={colors.sun} size={19} />
        </View>
        <View style={styles.headerCopy}>
          <Text style={[styles.title, { color: colors.ink }]}>我们的足迹</Text>
          <Text style={[styles.subtitle, { color: colors.inkMuted }]}>一起走过的地方，慢慢记下来</Text>
        </View>
        <View style={[styles.count, { backgroundColor: colors.surfaceGreen }]}>
          <Text style={[styles.countNumber, { color: colors.success }]}>{visitedProvinceCount}</Text>
          <Text style={[styles.countLabel, { color: colors.inkMuted }]}>省 · {visitedCityCount} 城</Text>
        </View>
      </View>

      {!pairConnected ? (
        <View style={[styles.locked, { backgroundColor: colors.surfaceMuted }]}>
          <Ionicons name="lock-closed-outline" color={colors.inkMuted} size={15} />
          <Text style={[styles.lockedText, { color: colors.inkMuted }]}>完成双人绑定后，就可以一起记录足迹</Text>
        </View>
      ) : (
        <View style={[styles.provinceGrid, { borderTopColor: colors.line }]}>
          {footprintProvinces.map((province) => {
            const visitedCount = province.cities.filter((city) => visitedKeys.has(province.code + ':' + city.code)).length;
            const visited = visitedCount > 0;
            return (
              <Pressable
                key={province.code}
                onPress={() => setSelectedProvince(province)}
                accessibilityRole="button"
                accessibilityLabel={'打开' + province.name + '足迹'}
                style={({ pressed }) => [
                  styles.province,
                  { backgroundColor: visited ? colors.successSoft : colors.surfaceMuted, borderColor: visited ? colors.success + '66' : 'transparent', opacity: pressed ? 0.7 : 1 },
                ]}
              >
                <Text style={[styles.provinceName, { color: colors.ink }]} numberOfLines={1}>{province.name.replace('自治区', '').replace('特别行政区', '')}</Text>
                <Text style={[styles.provinceCount, { color: visited ? colors.success : colors.inkMuted }]}>{visited ? visitedCount + '/' + province.cities.length : '点开记录'}</Text>
              </Pressable>
            );
          })}
        </View>
      )}

      <Text style={[styles.note, { color: colors.inkMuted }]}>{pairConnected ? (isOnline ? '点击省份，选择我们一起去过的城市 · 已同步给对方' : '当前离线，记录会先保存在本机，联网后自动同步') : '省份和城市记录只属于你们两个人'}</Text>

      <Modal visible={Boolean(selectedProvince)} transparent animationType="slide" onRequestClose={() => setSelectedProvince(null)}>
        <Pressable style={styles.backdrop} onPress={() => setSelectedProvince(null)}>
          <Pressable style={[styles.sheet, { backgroundColor: colors.surface }]} onPress={(event) => event.stopPropagation()}>
            <View style={[styles.handle, { backgroundColor: colors.line }]} />
            <View style={styles.sheetHeader}>
              <View>
                <Text style={[styles.sheetKicker, { color: colors.inkMuted }]}>我们的足迹</Text>
                <Text style={[styles.sheetTitle, { color: colors.ink }]}>{selectedProvince?.name}</Text>
              </View>
              <Pressable onPress={() => setSelectedProvince(null)} accessibilityRole="button" accessibilityLabel="关闭城市列表" style={[styles.closeButton, { backgroundColor: colors.surfaceMuted }]}>
                <Ionicons name="close" color={colors.inkMuted} size={18} />
              </Pressable>
            </View>
            <Text style={[styles.sheetHint, { color: colors.inkMuted }]}>点一下城市，记录或取消“我们一起去过”</Text>
            <ScrollView contentContainerStyle={styles.cityGrid} showsVerticalScrollIndicator={false}>
              {selectedProvince?.cities.map((city) => {
                const selected = selectedProvince ? visitedKeys.has(selectedProvince.code + ':' + city.code) : false;
                return (
                  <Pressable
                    key={city.code}
                    onPress={() => selectedProvince && onToggleCity(selectedProvince, city)}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: selected }}
                    style={({ pressed }) => [styles.city, { backgroundColor: selected ? colors.successSoft : colors.surfaceMuted, borderColor: selected ? colors.success : colors.line, opacity: pressed ? 0.72 : 1 }]}
                  >
                    <Text style={[styles.cityName, { color: selected ? colors.success : colors.ink }]}>{city.name}</Text>
                    <Ionicons name={selected ? 'checkmark-circle' : 'add-circle-outline'} color={selected ? colors.success : colors.inkSoft} size={17} />
                  </Pressable>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: 21, padding: 14, marginTop: 13 },
  header: { flexDirection: 'row', alignItems: 'center' },
  icon: { width: 39, height: 39, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  headerCopy: { flex: 1, marginLeft: 10, gap: 3 },
  title: { fontSize: 14, fontWeight: '900' },
  subtitle: { fontSize: 10, fontWeight: '600' },
  count: { alignItems: 'flex-end', borderRadius: 11, paddingHorizontal: 9, paddingVertical: 6 },
  countNumber: { fontSize: 17, lineHeight: 19, fontWeight: '900' },
  countLabel: { fontSize: 9, fontWeight: '700' },
  locked: { minHeight: 44, borderRadius: 13, marginTop: 13, paddingHorizontal: 11, flexDirection: 'row', alignItems: 'center', gap: 7 },
  lockedText: { flex: 1, fontSize: 11, fontWeight: '700' },
  provinceGrid: { borderTopWidth: 1, marginTop: 13, paddingTop: 11, flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  province: { width: '31.8%', minHeight: 48, borderWidth: 1, borderRadius: 13, paddingHorizontal: 8, paddingVertical: 7, justifyContent: 'center' },
  provinceName: { fontSize: 11, fontWeight: '800' },
  provinceCount: { fontSize: 9, fontWeight: '700', marginTop: 3 },
  note: { fontSize: 10, lineHeight: 15, fontWeight: '600', marginTop: 11 },
  backdrop: { flex: 1, backgroundColor: 'rgba(12, 22, 16, 0.38)', justifyContent: 'flex-end' },
  sheet: { maxHeight: '82%', borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 20, paddingTop: 10, paddingBottom: 32 },
  handle: { width: 42, height: 4, borderRadius: 3, alignSelf: 'center', marginBottom: 18 },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sheetKicker: { fontSize: 11, fontWeight: '700', letterSpacing: 0.4 },
  sheetTitle: { fontSize: 24, fontWeight: '900', marginTop: 3 },
  closeButton: { width: 34, height: 34, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  sheetHint: { fontSize: 11, fontWeight: '600', marginTop: 7, marginBottom: 15 },
  cityGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 9, paddingBottom: 10 },
  city: { minHeight: 44, width: '47.5%', borderWidth: 1, borderRadius: 14, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cityName: { fontSize: 12, fontWeight: '800' },
});
