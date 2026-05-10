import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { store, subscribe } from '@/lib/store';
import Icon, { type IconName } from '@/components/Icon';

const C = {
  bg: '#F5F6FA', card: '#FFFFFF', border: '#E8EBF0',
  pri: '#4263E8', priL: '#E8EEFB',
  text: '#1A1D26', sub: '#6B7280', muted: '#9CA3AF',
  ok: '#4CAF50', err: '#E74C3C', accent: '#FF6B35',
};

const TABS: Array<{ id: string; icon: IconName; label: string }> = [
  { id: 'bills', icon: 'bills', label: '관리비' },
  { id: 'residents', icon: 'residents', label: '입주민' },
  { id: 'parking', icon: 'parking', label: '주차' },
  { id: 'notices', icon: 'notice', label: '공지' },
  { id: 'messages', icon: 'message', label: '메시지' },
];

export default function VillaDetailScreen() {
  const [_, setTick] = useState(0);
  useEffect(() => subscribe(() => setTick(t => t + 1)), []);
  const insets = useSafeAreaInsets();

  const { id } = useLocalSearchParams<{ id: string }>();
  const villa = store.villas.find(v => v.id === id);

  if (!villa) {
    return (
      <View style={[s.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: C.sub, fontSize: 14 }}>빌라를 찾을 수 없습니다</Text>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <Text style={s.backBtnText}>← 돌아가기</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const pub = villa.billMonths.find(b => b.status === 'published');
  const unpaid = pub ? villa.units.filter(u => u.name && !pub.paid[u.ho]).length : 0;
  const unreadMsg = villa.messages.filter(m => !m.read).length;
  const registered = villa.units.filter(u => u.name).length;

  return (
    <ScrollView style={s.container} contentContainerStyle={{ paddingBottom: 40 }}>
      {/* 헤더 */}
      <View style={[s.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={s.backLink}>← 빌라 목록</Text>
        </TouchableOpacity>
        <Text style={s.villaName}>{villa.name}</Text>
        <Text style={s.villaAddr}>{villa.address}</Text>
      </View>

      {/* 요약 카드 */}
      <View style={s.summaryRow}>
        <View style={s.summaryCard}>
          <Text style={s.summaryValue}>{villa.totalUnits}</Text>
          <Text style={s.summaryLabel}>세대</Text>
        </View>
        <View style={s.summaryCard}>
          <Text style={s.summaryValue}>{registered}</Text>
          <Text style={s.summaryLabel}>입주민</Text>
        </View>
        <View style={s.summaryCard}>
          <Text style={[s.summaryValue, unpaid > 0 && { color: C.accent }]}>{unpaid}</Text>
          <Text style={s.summaryLabel}>미납</Text>
        </View>
        <View style={s.summaryCard}>
          <Text style={[s.summaryValue, unreadMsg > 0 && { color: C.accent }]}>{unreadMsg}</Text>
          <Text style={s.summaryLabel}>메시지</Text>
        </View>
      </View>

      {/* 빌라 정보 */}
      <View style={s.infoCard}>
        <View style={s.infoRow}><Text style={s.infoLabel}>플랜</Text><Text style={s.infoValue}>{villa.plan} ({villa.price.toLocaleString()}원/월)</Text></View>
        <View style={s.infoRow}><Text style={s.infoLabel}>계좌</Text><Text style={s.infoValue}>{villa.account || '-'}</Text></View>
        <View style={s.infoRow}><Text style={s.infoLabel}>층당 세대</Text><Text style={s.infoValue}>{villa.unitsPerFloor}세대</Text></View>
      </View>

      {/* 5개 탭 버튼 */}
      <Text style={s.sectionTitle}>관리 메뉴</Text>
      <View style={s.tabGrid}>
        {TABS.map(tab => {
          let badge = '';
          if (tab.id === 'messages' && unreadMsg > 0) badge = String(unreadMsg);
          if (tab.id === 'bills' && unpaid > 0) badge = `미납${unpaid}`;
          if (tab.id === 'residents') badge = `${registered}/${villa.totalUnits}`;

          return (
            <TouchableOpacity
              key={tab.id}
              style={s.tabCard}
              activeOpacity={0.7}
              onPress={() => router.push(`/(admin)/villas/${id}/${tab.id}`)}
            >
              <View style={s.tabIconWrap}>
                <Icon name={tab.icon} size={26} color={C.pri} />
              </View>
              <Text style={s.tabLabel}>{tab.label}</Text>
              {badge ? (
                <View style={[s.tabBadge, tab.id === 'bills' && unpaid > 0 ? { backgroundColor: 'rgba(231,76,60,0.08)' } : {}]}>
                  <Text style={[s.tabBadgeText, tab.id === 'bills' && unpaid > 0 ? { color: C.err } : {}]}>{badge}</Text>
                </View>
              ) : null}
            </TouchableOpacity>
          );
        })}
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  header: { paddingHorizontal: 20, paddingBottom: 16 },
  backLink: { fontSize: 14, color: C.pri, fontWeight: '600', marginBottom: 12 },
  villaName: { fontSize: 24, fontWeight: '900', color: C.text },
  villaAddr: { fontSize: 13, color: C.sub, marginTop: 4 },
  backBtn: { marginTop: 16, padding: 12 },
  backBtnText: { color: C.pri, fontSize: 14, fontWeight: '600' },
  summaryRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 20, marginBottom: 16 },
  summaryCard: {
    flex: 1, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 12, padding: 14, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  summaryValue: { fontSize: 20, fontWeight: '900', color: C.text },
  summaryLabel: { fontSize: 11, color: C.sub, marginTop: 2 },
  infoCard: {
    marginHorizontal: 20, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 14, padding: 16, marginBottom: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  infoLabel: { fontSize: 13, color: C.sub },
  infoValue: { fontSize: 13, fontWeight: '600', color: C.text },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: C.sub, paddingHorizontal: 20, marginBottom: 12 },
  tabGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingHorizontal: 20 },
  tabCard: {
    width: '47%', backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 14, padding: 20, alignItems: 'center', position: 'relative',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  tabIconWrap: {
    width: 48, height: 48, borderRadius: 14, backgroundColor: C.priL,
    alignItems: 'center', justifyContent: 'center', marginBottom: 10,
  },
  tabLabel: { fontSize: 14, fontWeight: '700', color: C.text },
  tabBadge: { position: 'absolute', top: 8, right: 8, backgroundColor: C.priL, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  tabBadgeText: { fontSize: 10, fontWeight: '700', color: C.pri },
});
