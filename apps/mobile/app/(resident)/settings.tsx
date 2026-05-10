import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { store, subscribe, residentLogout } from '@/lib/store';

const C = {
  bg: '#F5F6FA',
  card: '#FFFFFF',
  border: '#E8EBF0',
  pri: '#4263E8',
  text: '#0F2242',
  sub: '#6B7280',
  muted: '#9CA3AF',
  err: '#E74C3C',
};

export default function ResidentSettingsScreen() {
  const [_, setTick] = useState(0);
  useEffect(() => subscribe(() => setTick(t => t + 1)), []);
  const insets = useSafeAreaInsets();

  const resident = store.loggedResident;
  const villa = store.villas.find(v => v.id === store.loggedVillaId);

  function handleLogout() {
    Alert.alert('로그아웃', '로그아웃 하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      {
        text: '로그아웃',
        style: 'destructive',
        onPress: () => {
          residentLogout();
          router.replace('/');
        },
      },
    ]);
  }

  return (
    <ScrollView style={s.container} contentContainerStyle={{ paddingBottom: 120 }}>
      <View style={[s.header, { paddingTop: insets.top + 12 }]}>
        <Text style={s.headerLabel}>RESIDENT</Text>
        <Text style={s.headerTitle}>설정</Text>
      </View>

      {/* ====== 내 정보 ====== */}
      <Text style={s.sectionTitle}>내 정보</Text>
      <View style={s.card}>
        <View style={s.infoRow}>
          <Text style={s.infoLabel}>이름</Text>
          <Text style={s.infoValue}>{resident?.name ?? '-'}</Text>
        </View>
        <View style={s.divider} />
        <View style={s.infoRow}>
          <Text style={s.infoLabel}>전화번호</Text>
          <Text style={s.infoValue}>{resident?.phone ?? '-'}</Text>
        </View>
        <View style={s.divider} />
        <View style={s.infoRow}>
          <Text style={s.infoLabel}>빌라</Text>
          <Text style={s.infoValue}>{resident?.villaName ?? villa?.name ?? '-'}</Text>
        </View>
        <View style={s.divider} />
        <View style={s.infoRow}>
          <Text style={s.infoLabel}>호실</Text>
          <Text style={s.infoValue}>{resident?.ho ?? '-'}</Text>
        </View>
      </View>

      {/* ====== 관리비 입금 계좌 ====== */}
      {villa?.account ? (
        <>
          <Text style={s.sectionTitle}>관리비 입금 계좌</Text>
          <View style={s.card}>
            <Text style={s.accountText}>{villa.account}</Text>
          </View>
        </>
      ) : null}

      {/* ====== 약관 및 정책 ====== */}
      <Text style={s.sectionTitle}>약관 및 정책</Text>
      <View style={s.card}>
        <TouchableOpacity
          style={s.legalRow}
          onPress={() => router.push('/legal/terms')}
          activeOpacity={0.7}
        >
          <Text style={s.legalLabel}>이용약관</Text>
          <Text style={s.legalChevron}>›</Text>
        </TouchableOpacity>
        <View style={s.divider} />
        <TouchableOpacity
          style={s.legalRow}
          onPress={() => router.push('/legal/privacy')}
          activeOpacity={0.7}
        >
          <Text style={s.legalLabel}>개인정보 처리방침</Text>
          <Text style={s.legalChevron}>›</Text>
        </TouchableOpacity>
      </View>

      {/* ====== 앱 정보 ====== */}
      <Text style={s.sectionTitle}>앱 정보</Text>
      <View style={s.card}>
        <View style={s.infoRow}>
          <Text style={s.infoLabel}>앱 버전</Text>
          <Text style={s.infoValue}>v1.0.0</Text>
        </View>
        <View style={s.divider} />
        <View style={s.infoRow}>
          <Text style={s.infoLabel}>고객센터</Text>
          <Text style={[s.infoValue, { color: C.pri }]}>villatolk@andnew.kr</Text>
        </View>
      </View>

      {/* ====== 로그아웃 ====== */}
      <TouchableOpacity style={s.logoutBtn} onPress={handleLogout} activeOpacity={0.85}>
        <Text style={s.logoutText}>로그아웃</Text>
      </TouchableOpacity>

      <Text style={s.footer}>ANDNEW 2026</Text>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  header: { paddingHorizontal: 20, paddingBottom: 12 },
  headerLabel: { fontSize: 11, color: C.pri, fontWeight: '700', letterSpacing: 2, marginBottom: 6 },
  headerTitle: { fontSize: 22, fontWeight: '900', color: C.text },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: C.sub,
    marginTop: 20,
    marginBottom: 10,
    paddingHorizontal: 20,
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 14,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  infoLabel: { fontSize: 13, color: C.sub },
  infoValue: { fontSize: 13, fontWeight: '600', color: C.text },
  divider: { height: 1, backgroundColor: C.border, marginVertical: 6 },
  accountText: { fontSize: 14, fontWeight: '600', color: C.text },
  legalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  legalLabel: { fontSize: 14, fontWeight: '600', color: C.text },
  legalChevron: { fontSize: 20, color: C.muted, fontWeight: '400' },
  logoutBtn: {
    marginHorizontal: 20,
    marginTop: 20,
    backgroundColor: 'rgba(231,76,60,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(231,76,60,0.12)',
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
  },
  logoutText: { color: C.err, fontSize: 15, fontWeight: '700' },
  footer: { textAlign: 'center', marginTop: 20, fontSize: 11, color: C.muted },
});
