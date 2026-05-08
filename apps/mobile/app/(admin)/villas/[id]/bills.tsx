// TODO: Add UI to approve pending bank-transfer payments (payments.method='bank_transfer_pending')
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useState, useEffect } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { router } from 'expo-router';
// LinearGradient replaced with View for web compatibility
import {
  store, subscribe,
  createBillMonth, addBillItem, removeBillItem,
  publishBill, confirmPayment, copyBillItemsFromPrevious, closeBillMonth,
} from '@/lib/store';

const C = {
  bg: '#F5F6FA',
  card: '#FFFFFF',
  border: '#E8EBF0',
  inputBg: '#F0F2F6',
  inputBorder: '#E5E7EB',
  pri: '#3454D1',
  text: '#1A1D26',
  sub: '#6B7280',
  muted: '#9CA3AF',
  ok: '#4CAF50',
  warn: '#F39C12',
  err: '#E74C3C',
  accent: '#FF6B35',
};

const fmt = (n: number) => n.toLocaleString('ko-KR');

export default function VillaBillsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [_, setTick] = useState(0);
  useEffect(() => subscribe(() => setTick(t => t + 1)), []);

  const villa = store.villas.find(v => v.id === id);

  const [newItemName, setNewItemName] = useState('');
  const [newItemAmount, setNewItemAmount] = useState('');
  const [newMonthYM, setNewMonthYM] = useState('');
  const [newMonthLabel, setNewMonthLabel] = useState('');

  if (!villa) {
    return (
      <View style={[s.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: C.sub, fontSize: 16 }}>빌라를 찾을 수 없습니다</Text>
      </View>
    );
  }

  // Latest month by yearMonth
  const sortedMonths = [...villa.billMonths].sort((a, b) => b.yearMonth.localeCompare(a.yearMonth));
  const currentMonth = sortedMonths.length > 0 ? sortedMonths[0] : null;

  const items = currentMonth?.items ?? [];
  const total = items.reduce((s, i) => s + i.amount, 0);
  const unitCount = villa.units.length;
  const perUnit = unitCount > 0 ? Math.round(total / unitCount) : 0;

  const paidCount = villa.units.filter(u => currentMonth?.paid[u.ho]).length;
  const unpaidCount = unitCount - paidCount;

  const handleAddItem = () => {
    if (!currentMonth) return;
    const name = newItemName.trim();
    const amount = parseInt(newItemAmount, 10);
    if (!name) { Alert.alert('오류', '항목명을 입력하세요'); return; }
    if (!amount || amount <= 0) { Alert.alert('오류', '유효한 금액을 입력하세요'); return; }
    addBillItem(id!, currentMonth.id, name, amount);
    setNewItemName('');
    setNewItemAmount('');
    Alert.alert('추가 완료', `"${name}" ${amount.toLocaleString()}원이 추가되었습니다`);
  };

  const handleRemoveItem = (idx: number) => {
    if (!currentMonth) return;
    Alert.alert('항목 삭제', `"${items[idx].name}" 항목을 삭제하시겠습니까?`, [
      { text: '취소', style: 'cancel' },
      { text: '삭제', style: 'destructive', onPress: () => { removeBillItem(id!, currentMonth.id, idx); Alert.alert('삭제 완료', `"${items[idx].name}" 항목이 삭제되었습니다`); } },
    ]);
  };

  const handlePublish = () => {
    if (!currentMonth) return;
    if (currentMonth.status === 'published') {
      Alert.alert('알림', '이미 고지된 관리비입니다.');
      return;
    }
    if (items.length === 0) {
      Alert.alert('오류', '관리비 항목을 먼저 추가하세요.');
      return;
    }
    Alert.alert('관리비 고지', `${currentMonth.label} 관리비를 고지하시겠습니까?\n세대별 ${fmt(perUnit)}원`, [
      { text: '취소', style: 'cancel' },
      { text: '발송', onPress: () => {
        publishBill(id!, currentMonth.id);
        const allHo = villa!.units.filter(u => u.name).map(u => u.ho).join(', ');
        Alert.alert('고지 발송 완료', `${currentMonth.label} 관리비 고지가 발송되었습니다.\n\n대상: ${allHo}\n세대별: ${fmt(perUnit)}원`);
      }},
    ]);
  };

  const handleClose = () => {
    if (!currentMonth) return;
    if (currentMonth.status !== 'published') {
      Alert.alert('알림', '고지된 월만 마감할 수 있습니다.');
      return;
    }
    if (unpaidCount > 0) {
      Alert.alert(
        '미납자 있음',
        `${currentMonth.label}에 ${unpaidCount}세대 미납이 남아있습니다.\n그래도 마감하시겠습니까?\n\n마감 후에도 미납자는 누적 미납 통계에 그대로 남습니다.`,
        [
          { text: '취소', style: 'cancel' },
          { text: '마감', style: 'destructive', onPress: () => {
            closeBillMonth(id!, currentMonth.id);
            Alert.alert('마감 완료', `${currentMonth.label} 관리비가 마감 처리되었습니다.`);
          }},
        ],
      );
      return;
    }
    Alert.alert('관리비 마감', `${currentMonth.label} 관리비를 마감하시겠습니까?`, [
      { text: '취소', style: 'cancel' },
      { text: '마감', onPress: () => {
        closeBillMonth(id!, currentMonth.id);
        Alert.alert('마감 완료', `${currentMonth.label} 관리비가 마감 처리되었습니다.`);
      }},
    ]);
  };

  const handleConfirmPayment = (ho: string) => {
    if (!currentMonth) return;
    Alert.alert('납부 확인', `${ho} 납부를 확인하시겠습니까?`, [
      { text: '취소', style: 'cancel' },
      { text: '확인', onPress: () => { confirmPayment(id!, currentMonth.id, ho); Alert.alert('납부 확인', `${ho} 납부가 확인되었습니다`); } },
    ]);
  };

  const handleCreateMonth = () => {
    const ym = newMonthYM.trim();
    const label = newMonthLabel.trim();
    if (!ym || !/^\d{4}-\d{2}$/.test(ym)) {
      Alert.alert('오류', 'YYYY-MM 형식으로 입력하세요 (예: 2026-04)');
      return;
    }
    if (!label) { Alert.alert('오류', '표시 이름을 입력하세요 (예: 2026년 4월)'); return; }
    createBillMonth(id!, ym, label);
    setNewMonthYM('');
    setNewMonthLabel('');
  };

  // No months at all: show create form
  if (!currentMonth) {
    return (
      <ScrollView style={s.container} contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={[s.card, { borderWidth: 2, borderStyle: 'dashed', marginTop: 16, marginHorizontal: 20 }]}>
          <Text style={s.formTitle}>새 월 추가</Text>
          <TextInput style={[s.input, { marginBottom: 8 }]} placeholder="연월 (예: 2026-04)" placeholderTextColor={C.muted} value={newMonthYM} onChangeText={setNewMonthYM} />
          <TextInput style={[s.input, { marginBottom: 8 }]} placeholder="표시 이름 (예: 2026년 4월)" placeholderTextColor={C.muted} value={newMonthLabel} onChangeText={setNewMonthLabel} />
          <TouchableOpacity style={s.addBtn} onPress={handleCreateMonth}>
            <Text style={s.addBtnText}>새 월 추가</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={s.container} contentContainerStyle={{ paddingBottom: 40 }}>
      {/* 요약 카드 - NAVY GRADIENT */}
      <View style={s.summaryCardWrap}>
        <View style={s.summaryCard}>
          <Text style={s.summaryLabel}>{currentMonth.label} 총 관리비</Text>
          <Text style={s.summaryAmount}>{fmt(total)}<Text style={s.summaryWon}>원</Text></Text>
          <Text style={s.summaryMeta}>세대별 {fmt(perUnit)}원 · {unitCount}세대</Text>
          <View style={s.badgeRow}>
            <View style={[s.badge, { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
              <Text style={[s.badgeText, { color: '#FFFFFF' }]}>납부 {paidCount}</Text>
            </View>
            {unpaidCount > 0 && (
              <View style={[s.badge, { backgroundColor: 'rgba(231,76,60,0.25)' }]}>
                <Text style={[s.badgeText, { color: '#FFFFFF' }]}>미납 {unpaidCount}</Text>
              </View>
            )}
            <View style={[s.badge, { backgroundColor: currentMonth.status === 'published' ? 'rgba(255,255,255,0.15)' : 'rgba(243,156,18,0.25)' }]}>
              <Text style={[s.badgeText, { color: '#FFFFFF' }]}>
                {currentMonth.status === 'draft' ? '작성중' : currentMonth.status === 'published' ? '고지완료' : '마감'}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* 새 월 추가 */}
      <View style={[s.card, { borderWidth: 2, borderStyle: 'dashed', marginBottom: 16, marginHorizontal: 20 }]}>
        <Text style={s.formTitle}>새 월 추가</Text>
        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
          <TextInput style={[s.input, { flex: 1 }]} placeholder="연월 (2026-04)" placeholderTextColor={C.muted} value={newMonthYM} onChangeText={setNewMonthYM} />
          <TextInput style={[s.input, { flex: 1 }]} placeholder="이름 (2026년 4월)" placeholderTextColor={C.muted} value={newMonthLabel} onChangeText={setNewMonthLabel} />
          <TouchableOpacity style={s.addBtn} onPress={handleCreateMonth}>
            <Text style={s.addBtnText}>추가</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 관리비 항목 */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 8 }}>
        <Text style={[s.sectionTitle, { marginBottom: 0, paddingHorizontal: 0 }]}>관리비 항목</Text>
        {items.length === 0 && (
          <TouchableOpacity
            style={{ backgroundColor: '#E8EEFB', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 }}
            onPress={() => {
              Alert.alert('전월 항목 복사', '직전 월의 항목과 금액을 그대로 복사합니다.', [
                { text: '취소', style: 'cancel' },
                { text: '복사', onPress: () => {
                  const n = copyBillItemsFromPrevious(id!, currentMonth.id);
                  if (n > 0) Alert.alert('복사 완료', `${n}개 항목을 가져왔습니다. 금액은 필요 시 수정하세요.`);
                  else Alert.alert('알림', '복사할 이전 월 항목이 없습니다.');
                }},
              ]);
            }}
          >
            <Text style={{ color: C.pri, fontSize: 11, fontWeight: '700' }}>↻ 전월 항목 복사</Text>
          </TouchableOpacity>
        )}
      </View>
      {items.map((item, i) => (
        <View key={i} style={s.card}>
          <View style={s.itemRow}>
            <Text style={s.itemName}>{item.name}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={s.itemAmount}>{fmt(item.amount)}원</Text>
              <TouchableOpacity style={s.deleteBtn} onPress={() => handleRemoveItem(i)}>
                <Text style={s.deleteBtnText}>✕</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      ))}

      {/* 항목 추가 */}
      <View style={[s.card, { borderWidth: 2, borderStyle: 'dashed' }]}>
        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
          <TextInput style={[s.input, { flex: 1 }]} placeholder="항목명" placeholderTextColor={C.muted} value={newItemName} onChangeText={setNewItemName} />
          <TextInput style={[s.input, { flex: 1 }]} placeholder="금액" placeholderTextColor={C.muted} keyboardType="number-pad" value={newItemAmount} onChangeText={setNewItemAmount} />
          <TouchableOpacity style={s.addBtn} onPress={handleAddItem}>
            <Text style={s.addBtnText}>추가</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 납부 현황 */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 20, marginBottom: 8, paddingHorizontal: 20 }}>
        <Text style={[s.sectionTitle, { marginBottom: 0, paddingHorizontal: 0 }]}>납부 현황</Text>
      </View>

      {villa.units.map((u, i) => {
        const isPaid = !!currentMonth.paid[u.ho];
        return (
          <View key={i} style={s.card}>
            <View style={s.unitRow}>
              <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
                <Text style={s.unitHo}>{u.ho}</Text>
                <Text style={s.unitName}>{u.name || '미등록'}</Text>
              </View>
              <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
                {isPaid ? (
                  <View style={[s.badge, { backgroundColor: 'rgba(76,175,80,0.08)' }]}>
                    <Text style={[s.badgeText, { color: C.ok }]}>납부완료</Text>
                  </View>
                ) : (
                  <>
                    <View style={[s.badge, { backgroundColor: 'rgba(231,76,60,0.08)' }]}>
                      <Text style={[s.badgeText, { color: C.err }]}>미납</Text>
                    </View>
                    <TouchableOpacity style={s.confirmBtn} onPress={() => handleConfirmPayment(u.ho)}>
                      <Text style={s.confirmBtnText}>납부 확인</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </View>
          </View>
        );
      })}

      {/* 고지/마감 버튼 */}
      {currentMonth.status === 'draft' && (
        <TouchableOpacity style={s.publishBtn} onPress={handlePublish}>
          <Text style={s.publishBtnText}>관리비 고지 발송</Text>
        </TouchableOpacity>
      )}
      {currentMonth.status === 'published' && (
        <TouchableOpacity style={[s.publishBtn, { backgroundColor: C.sub }]} onPress={handleClose}>
          <Text style={s.publishBtnText}>이번 월 마감</Text>
        </TouchableOpacity>
      )}
      {currentMonth.status === 'closed' && (
        <View style={[s.publishBtn, { backgroundColor: '#E5E7EB' }]}>
          <Text style={[s.publishBtnText, { color: C.sub }]}>마감됨</Text>
        </View>
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg, paddingTop: 10 },
  summaryCardWrap: { paddingHorizontal: 20, marginBottom: 16 },
  summaryCard: { borderRadius: 16, padding: 24, alignItems: 'center' },
  summaryLabel: { fontSize: 12, color: 'rgba(255,255,255,0.7)', fontWeight: '600' },
  summaryAmount: { fontSize: 32, fontWeight: '900', color: '#FFFFFF', marginVertical: 8 },
  summaryWon: { fontSize: 15 },
  summaryMeta: { fontSize: 13, color: 'rgba(255,255,255,0.7)' },
  badgeRow: { flexDirection: 'row', gap: 8, marginTop: 14 },
  badge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: C.sub, marginBottom: 8, paddingHorizontal: 20 },
  card: {
    backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 14, padding: 12, marginBottom: 8, marginHorizontal: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  formTitle: { fontSize: 14, fontWeight: '700', color: C.text, marginBottom: 10 },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  itemName: { fontSize: 14, fontWeight: '700', color: C.text },
  itemAmount: { fontSize: 14, fontWeight: '800', color: C.text },
  deleteBtn: { width: 28, height: 28, borderRadius: 8, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
  deleteBtnText: { color: C.muted, fontSize: 14 },
  input: { backgroundColor: C.inputBg, borderWidth: 1, borderColor: C.inputBorder, borderRadius: 10, padding: 10, fontSize: 13, color: C.text },
  addBtn: { backgroundColor: C.pri, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10 },
  addBtnText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  unitRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  unitHo: { fontSize: 14, fontWeight: '700', color: C.text },
  unitName: { fontSize: 12, color: C.sub },
  confirmBtn: { backgroundColor: C.pri, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  confirmBtnText: { color: '#FFFFFF', fontSize: 11, fontWeight: '700' },
  publishBtn: { backgroundColor: C.accent, borderRadius: 14, paddingVertical: 15, alignItems: 'center', marginTop: 16, marginHorizontal: 20 },
  publishBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
});
