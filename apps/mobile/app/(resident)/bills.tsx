import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { store, subscribe } from '@/lib/store';
import { supabase } from '@/lib/supabase';

function fmt(n: number) {
  return n.toLocaleString('ko-KR');
}

const ITEM_COLORS = ['#4263E8', '#2ECC71', '#F39C12', '#EC4899', '#E74C3C', '#6B7280', '#6366F1', '#06B6D4'];

export default function BillsScreen() {
  const [_, setTick] = useState(0);
  useEffect(() => subscribe(() => setTick(t => t + 1)), []);
  const insets = useSafeAreaInsets();

  const villa = store.villas.find(v => v.id === store.loggedVillaId);
  const resident = store.loggedResident;

  if (!villa || !resident) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>빌라 정보를 불러올 수 없습니다</Text>
        </View>
      </View>
    );
  }

  // Current month = latest published
  const currentMonth = villa.billMonths.find(m => m.status === 'published');
  const previousMonths = villa.billMonths.filter(m => m.id !== currentMonth?.id);

  const total = currentMonth ? currentMonth.items.reduce((s, i) => s + i.amount, 0) : 0;
  const perUnit = currentMonth ? Math.round(total / villa.totalUnits) : 0;
  const isPaid = currentMonth ? !!currentMonth.paid[resident.ho] : false;

  // 수선충당금 누적 (published + closed 모든 월에서 항목명에 '수선충당금'/'수선'/'장기수선' 포함)
  const reservePerUnit = villa.billMonths
    .filter(m => m.status !== 'draft')
    .reduce((sum, m) => {
      const reserveItems = m.items.filter(i =>
        i.name.includes('수선충당금') || i.name.includes('장기수선') || /수선/.test(i.name),
      );
      const reserveTotal = reserveItems.reduce((s, i) => s + i.amount, 0);
      return sum + (villa.totalUnits > 0 ? Math.round(reserveTotal / villa.totalUnits) : 0);
    }, 0);
  const reserveMonths = villa.billMonths.filter(m =>
    m.status !== 'draft' && m.items.some(i => /수선/.test(i.name)),
  ).length;

  const METHOD_KO: Record<string, string> = {
    bank_transfer: '계좌이체',
    toss: '토스결제',
    card: '카드',
    cash: '현금',
  };
  const fmtPaidMeta = (m: { paidInfo?: Record<string, { method?: string; paidAt?: string }> }, ho: string) => {
    const info = m.paidInfo?.[ho];
    if (!info) return null;
    const methodLabel = info.method ? (METHOD_KO[info.method] ?? info.method) : null;
    const dateLabel = info.paidAt
      ? new Date(info.paidAt).toLocaleDateString('ko-KR', { year: '2-digit', month: '2-digit', day: '2-digit' })
      : null;
    return [dateLabel, methodLabel].filter(Boolean).join(' · ');
  };

  async function requestBankTransfer(billMonthId: string, ho: string, amount: number) {
    try {
      const { data: unitRow } = await supabase
        .from('units')
        .select('id')
        .eq('villa_id', villa!.id)
        .eq('ho_number', ho)
        .maybeSingle();
      if (!unitRow) {
        Alert.alert('실패', '세대 정보를 찾을 수 없습니다');
        return;
      }
      // Find or create payment row with method='bank_transfer_pending', is_paid=false
      const { data: existing } = await supabase
        .from('payments')
        .select('id, is_paid')
        .eq('bill_month_id', billMonthId)
        .eq('unit_id', unitRow.id)
        .maybeSingle();
      if (existing) {
        if (existing.is_paid) {
          Alert.alert('알림', '이미 납부 완료되었습니다');
          return;
        }
        await supabase
          .from('payments')
          .update({ method: 'bank_transfer_pending' })
          .eq('id', existing.id);
      } else {
        await supabase.from('payments').insert({
          bill_month_id: billMonthId,
          unit_id: unitRow.id,
          is_paid: false,
          method: 'bank_transfer_pending',
          amount, // admin will adjust when approving
        });
      }
      Alert.alert('요청 완료', '관리자 확인 후 납부 처리됩니다.');
    } catch (e) {
      Alert.alert('실패', e instanceof Error ? e.message : '다시 시도해주세요');
    }
  }

  function handlePay() {
    if (!currentMonth) return;
    Alert.alert('납부 방법', `${currentMonth.label} 관리비 ${perUnit.toLocaleString()}원`, [
      { text: '취소', style: 'cancel' },
      {
        text: '계좌이체 (관리자 확인 필요)',
        onPress: () => {
          requestBankTransfer(currentMonth.id, resident!.ho, perUnit);
        },
      },
      {
        text: '토스로 결제',
        onPress: () => {
          router.push({
            pathname: '/payment/checkout',
            params: {
              amount: String(perUnit),
              orderId: `bill_${villa!.id}_${currentMonth.id}_${resident!.ho}_${Date.now()}`,
              orderName: `${currentMonth.label} 관리비 (${villa!.name} ${resident!.ho})`,
              customerName: resident!.name ?? '입주민',
            },
          });
        },
      },
    ]);
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 100 }}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View>
            <Text style={styles.headerTitle}>관리비</Text>
            <Text style={styles.headerSub}>{villa.name} {resident.ho}</Text>
          </View>
          <TouchableOpacity
            style={{ backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 }}
            onPress={() => { store.loggedResident = null; store.loggedVillaId = null; router.replace('/'); }}
          >
            <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: '600' }}>로그아웃</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Hero Card */}
      {currentMonth && (
        <View style={styles.heroCard}>
          <View style={styles.heroGradient}>
            <Text style={styles.heroLabel}>{currentMonth.label} 관리비</Text>
            <Text style={styles.heroAmount}>{fmt(perUnit)}원</Text>
            <Text style={styles.heroSub}>총 {fmt(total)}원 / {villa.totalUnits}세대</Text>
            <View style={[styles.badge, isPaid ? styles.badgePaid : styles.badgeUnpaid]}>
              <Text style={[styles.badgeText, isPaid ? styles.badgePaidText : styles.badgeUnpaidText]}>
                {isPaid ? '납부완료' : '미납'}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Pay Button */}
      {currentMonth && !isPaid && (
        <TouchableOpacity style={styles.payButton} onPress={handlePay} activeOpacity={0.8}>
          <Text style={styles.payButtonText}>납부하기</Text>
        </TouchableOpacity>
      )}

      {/* Account Info */}
      <View style={styles.accountCard}>
        <Text style={styles.accountLabel}>납부 계좌</Text>
        <Text style={styles.accountNumber}>{villa.account}</Text>
      </View>

      {/* 수선충당금 누적 */}
      {reservePerUnit > 0 && (
        <View style={styles.reserveCard}>
          <View>
            <Text style={styles.reserveLabel}>수선충당금 누적</Text>
            <Text style={styles.reserveSub}>{reserveMonths}개월간 적립 · 세대당</Text>
          </View>
          <Text style={styles.reserveAmount}>{fmt(reservePerUnit)}원</Text>
        </View>
      )}

      {/* Bill Items */}
      {currentMonth && currentMonth.items.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>항목별 내역</Text>
          {currentMonth.items.map((item, idx) => {
            const pct = total > 0 ? (item.amount / total) * 100 : 0;
            const color = ITEM_COLORS[idx % ITEM_COLORS.length];
            return (
              <View key={idx} style={styles.itemCard}>
                <View style={styles.itemRow}>
                  <Text style={styles.itemLabel}>{item.name}</Text>
                  <Text style={styles.itemAmount}>{fmt(item.amount)}원</Text>
                </View>
                <View style={styles.progressBg}>
                  <View style={[styles.progressBar, { width: `${pct}%`, backgroundColor: color }]} />
                </View>
                <Text style={styles.itemPct}>{pct.toFixed(1)}%</Text>
              </View>
            );
          })}
        </View>
      )}

      {/* Previous Months */}
      {previousMonths.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>이전 관리비</Text>
          {previousMonths.map(m => {
            const mTotal = m.items.reduce((s, i) => s + i.amount, 0);
            const mPerUnit = Math.round(mTotal / villa.totalUnits);
            const mPaid = !!m.paid[resident.ho];
            const meta = mPaid ? fmtPaidMeta(m, resident.ho) : null;
            return (
              <View key={m.id} style={styles.prevCard}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.prevMonth}>{m.label}</Text>
                  <Text style={styles.prevAmount}>{fmt(mPerUnit)}원</Text>
                  {meta && <Text style={styles.prevMeta}>{meta}</Text>}
                </View>
                <View style={[styles.badge, mPaid ? styles.badgePaid : styles.badgeUnpaid]}>
                  <Text style={[styles.badgeText, mPaid ? styles.badgePaidText : styles.badgeUnpaidText]}>
                    {mPaid ? '납부완료' : '미납'}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F6FA' },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  headerTitle: { fontSize: 22, fontWeight: '900', color: '#1A1D26' },
  headerSub: { fontSize: 13, color: '#6B7280', marginTop: 2 },

  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontSize: 15, color: '#6B7280', fontWeight: '600' },

  heroCard: { marginHorizontal: 16, borderRadius: 16, overflow: 'hidden', marginBottom: 12 },
  heroGradient: {
    backgroundColor: '#1B2A4A',
    padding: 24,
    alignItems: 'center',
  },
  heroLabel: { color: '#ffffffcc', fontSize: 14, marginBottom: 4 },
  heroAmount: { color: '#FFFFFF', fontSize: 34, fontWeight: '900', marginBottom: 4 },
  heroSub: { color: '#ffffff99', fontSize: 13, marginBottom: 12 },

  badge: { paddingHorizontal: 14, paddingVertical: 5, borderRadius: 20 },
  badgePaid: { backgroundColor: '#2ECC7122' },
  badgeUnpaid: { backgroundColor: '#E74C3C22' },
  badgeText: { fontSize: 13, fontWeight: '700' },
  badgePaidText: { color: '#2ECC71' },
  badgeUnpaidText: { color: '#E74C3C' },

  payButton: {
    marginHorizontal: 16,
    backgroundColor: '#4263E8',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    marginBottom: 12,
  },
  payButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },

  accountCard: {
    marginHorizontal: 16,
    backgroundColor: '#E8EEFB',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  accountLabel: { color: '#4263E8', fontSize: 13, fontWeight: '700' },
  accountNumber: { color: '#1A1D26', fontSize: 15, fontWeight: '800' },

  section: { marginHorizontal: 16, marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#1A1D26', marginBottom: 12 },

  itemCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E8EBF0',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  itemLabel: { fontSize: 14, fontWeight: '600', color: '#1A1D26' },
  itemAmount: { fontSize: 14, fontWeight: '800', color: '#1A1D26' },
  progressBg: {
    height: 8,
    backgroundColor: '#F5F6FA',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressBar: { height: 8, borderRadius: 4 },
  itemPct: { fontSize: 11, color: '#6B7280', textAlign: 'right' },

  prevCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E8EBF0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  prevMonth: { fontSize: 14, fontWeight: '600', color: '#1A1D26', marginBottom: 2 },
  prevAmount: { fontSize: 13, color: '#6B7280' },
  prevMeta: { fontSize: 11, color: '#9CA3AF', marginTop: 4 },

  reserveCard: {
    marginHorizontal: 16,
    backgroundColor: '#FFF7ED',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#FED7AA',
  },
  reserveLabel: { color: '#C2410C', fontSize: 13, fontWeight: '700' },
  reserveSub: { color: '#9A3412', fontSize: 11, marginTop: 2 },
  reserveAmount: { color: '#9A3412', fontSize: 16, fontWeight: '900' },
});
