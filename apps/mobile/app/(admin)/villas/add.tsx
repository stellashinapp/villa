import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { store, subscribe } from '@/lib/store';

const C = {
  bg: '#F5F6FA',
  card: '#FFFFFF',
  border: '#E8EBF0',
  pri: '#4263E8',
  priL: '#E8EEFB',
  text: '#1A1D26',
  sub: '#6B7280',
  muted: '#9CA3AF',
  ok: '#4CAF50',
  okL: 'rgba(76,175,80,0.08)',
  warn: '#F39C12',
  warnL: 'rgba(243,156,18,0.08)',
};

const fmt = (n: number) => n.toLocaleString('ko-KR') + '원';

const PLAN_TABLE = [
  { label: '소형', maxUnits: 8, price: 30000 },
  { label: '중형', maxUnits: 15, price: 50000 },
  { label: '대형', maxUnits: 999, price: 70000 },
];

function getPlan(units: number) {
  if (units <= 8) return { plan: '소형', price: 30000 };
  if (units <= 15) return { plan: '중형', price: 50000 };
  return { plan: '대형', price: 70000 };
}

export default function AddVillaStep1Screen() {
  const [_, setTick] = useState(0);
  useEffect(() => subscribe(() => setTick(t => t + 1)), []);
  const insets = useSafeAreaInsets();

  const villas = store.villas;
  const currentTotal = villas.reduce((s, v) => s + v.price, 0);
  const villaCount = villas.length;

  // 볼륨 할인 — 빌라 추가 후 기준
  const newCount = villaCount + 1;
  const discRate =
    newCount >= 20 ? 0.4 : newCount >= 10 ? 0.3 : newCount >= 5 ? 0.2 : 0;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 60 }}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>{'<  돌아가기'}</Text>
        </TouchableOpacity>
        <Text style={styles.title}>새 빌라 추가</Text>
        <Text style={styles.subtitle}>비용 안내</Text>
      </View>

      {/* Current subscription overview */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>현재 구독 현황</Text>
        <View style={styles.card}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>관리 중인 빌라</Text>
            <Text style={styles.infoValue}>{villaCount}개</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>현재 월 비용</Text>
            <Text style={[styles.infoValue, { color: C.pri }]}>{fmt(currentTotal)}</Text>
          </View>
        </View>

        {villas.length > 0 && (
          <View style={[styles.card, { marginTop: 8 }]}>
            {villas.map((v, i) => (
              <View key={v.id} style={[styles.infoRow, i > 0 && { borderTopWidth: 1, borderTopColor: C.border, paddingTop: 8, marginTop: 4 }]}>
                <View>
                  <Text style={styles.villaItemName}>{v.name}</Text>
                  <Text style={styles.villaItemMeta}>{v.totalUnits}세대 · {v.plan}</Text>
                </View>
                <Text style={styles.villaItemPrice}>{fmt(v.price)}</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* New villa cost estimate */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>새 빌라 추가 시 예상 비용</Text>
        <View style={styles.card}>
          <Text style={styles.planGuide}>
            세대 수에 따라 플랜이 자동 결정됩니다
          </Text>
          <View style={styles.planTable}>
            {PLAN_TABLE.map(p => (
              <View key={p.label} style={styles.planRow}>
                <View style={[styles.planBadge, { backgroundColor: C.priL }]}>
                  <Text style={[styles.planBadgeText, { color: C.pri }]}>{p.label}</Text>
                </View>
                <Text style={styles.planUnits}>
                  {p.label === '대형' ? '16세대 이상' : `~${p.maxUnits}세대`}
                </Text>
                <Text style={styles.planPrice}>{fmt(p.price)}/월</Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      {/* 안내문구 — 세대수에 따라 비용이 달라짐 */}
      <View style={styles.section}>
        <View style={{
          backgroundColor: 'rgba(52,84,209,0.13)',
          borderRadius: 12,
          paddingVertical: 14,
          paddingHorizontal: 16,
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6, gap: 8 }}>
            <View style={{
              width: 18, height: 18, borderRadius: 9,
              backgroundColor: C.pri,
              alignItems: 'center', justifyContent: 'center',
            }}>
              <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '900', lineHeight: 14 }}>!</Text>
            </View>
            <Text style={{ fontSize: 13, fontWeight: '700', color: C.pri }}>
              비용 안내
            </Text>
          </View>
          <Text style={{ fontSize: 13, color: C.text, lineHeight: 20 }}>
            등록하실 빌라의 <Text style={{ fontWeight: '800' }}>세대수에 따라 플랜이 자동 결정</Text>되며{'\n'}
            그에 따라 월 이용료가 달라집니다.
          </Text>
          {discRate > 0 && (
            <Text style={{ fontSize: 12, color: C.pri, fontWeight: '700', marginTop: 8 }}>
              현재 빌라 보유 수 기준 볼륨 할인 {Math.round(discRate * 100)}% 적용 가능
            </Text>
          )}
        </View>
      </View>

      {/* CTA */}
      <View style={{ paddingHorizontal: 20, marginTop: 10 }}>
        <TouchableOpacity
          style={styles.ctaBtn}
          onPress={() => router.push('/(admin)/villas/add-form')}
        >
          <Text style={styles.ctaBtnText}>확인, 빌라 등록하기</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.cancelBtn} onPress={() => router.back()}>
          <Text style={styles.cancelBtnText}>취소</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  header: { paddingHorizontal: 20, paddingBottom: 12 },
  backBtn: { marginBottom: 16 },
  backBtnText: { fontSize: 14, color: C.pri, fontWeight: '600' },
  title: { fontSize: 22, fontWeight: '900', color: C.text },
  subtitle: { fontSize: 13, color: C.sub, marginTop: 4 },

  section: { paddingHorizontal: 20, marginTop: 20 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: C.sub,
    marginBottom: 10,
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 14,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  infoLabel: { fontSize: 13, color: C.sub },
  infoValue: { fontSize: 14, fontWeight: '700', color: C.text },

  villaItemName: { fontSize: 14, fontWeight: '700', color: C.text },
  villaItemMeta: { fontSize: 11, color: C.sub, marginTop: 2 },
  villaItemPrice: { fontSize: 14, fontWeight: '700', color: C.text },

  planGuide: { fontSize: 12, color: C.sub, marginBottom: 12 },
  planTable: { gap: 10 },
  planRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  planBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    width: 50,
    alignItems: 'center',
  },
  planBadgeText: { fontSize: 12, fontWeight: '700' },
  planUnits: { flex: 1, fontSize: 13, color: C.sub },
  planPrice: { fontSize: 14, fontWeight: '700', color: C.text },

  discBanner: {
    backgroundColor: C.okL,
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
  },
  discText: { fontSize: 12, color: C.ok, fontWeight: '600' },

  ctaBtn: {
    backgroundColor: C.pri,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 10,
  },
  ctaBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  cancelBtn: { paddingVertical: 12, alignItems: 'center' },
  cancelBtnText: { color: C.sub, fontSize: 14 },
});
