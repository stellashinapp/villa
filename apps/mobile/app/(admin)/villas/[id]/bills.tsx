import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity } from 'react-native';
import { useState } from 'react';

const MOCK_ITEMS = [
  { name: '공용전기', amount: 189000 },
  { name: '상하수도', amount: 234000 },
  { name: '건물보험', amount: 124000 },
  { name: '청소용역', amount: 200000 },
  { name: '소독/방역', amount: 80000 },
  { name: '수선충당금', amount: 50000 },
];

const MOCK_UNITS = [
  { ho: '101호', name: '김민수', paid: false },
  { ho: '102호', name: '이서희', paid: true },
  { ho: '201호', name: '박준영', paid: false },
  { ho: '202호', name: '최수연', paid: true },
  { ho: '301호', name: '정다은', paid: false },
  { ho: '302호', name: '강하준', paid: true },
  { ho: '401호', name: '오지훈', paid: false },
  { ho: '402호', name: '윤서영', paid: true },
];

const fmt = (n: number) => n.toLocaleString('ko-KR');

export default function VillaBillsScreen() {
  const [newItemName, setNewItemName] = useState('');
  const [newItemAmount, setNewItemAmount] = useState('');

  const total = MOCK_ITEMS.reduce((s, i) => s + i.amount, 0);
  const perUnit = Math.round(total / MOCK_UNITS.length);
  const paidCount = MOCK_UNITS.filter(u => u.paid).length;
  const unpaidCount = MOCK_UNITS.length - paidCount;

  return (
    <ScrollView style={s.container} contentContainerStyle={{ paddingBottom: 40 }}>
      {/* 요약 카드 */}
      <View style={s.summaryCard}>
        <Text style={s.summaryLabel}>2026년 3월 총 관리비</Text>
        <Text style={s.summaryAmount}>{fmt(total)}<Text style={s.summaryWon}>원</Text></Text>
        <Text style={s.summaryMeta}>세대별 {fmt(perUnit)}원 · {MOCK_UNITS.length}세대</Text>
        <View style={s.badgeRow}>
          <View style={[s.badge, { backgroundColor: 'rgba(30,176,106,0.15)' }]}>
            <Text style={[s.badgeText, { color: '#1EB06A' }]}>납부 {paidCount}</Text>
          </View>
          {unpaidCount > 0 && (
            <View style={[s.badge, { backgroundColor: 'rgba(229,66,58,0.15)' }]}>
              <Text style={[s.badgeText, { color: '#E5423A' }]}>미납 {unpaidCount}</Text>
            </View>
          )}
        </View>
      </View>

      {/* 관리비 항목 */}
      <Text style={s.sectionTitle}>관리비 항목</Text>
      {MOCK_ITEMS.map((item, i) => (
        <View key={i} style={s.card}>
          <View style={s.itemRow}>
            <Text style={s.itemName}>{item.name}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={s.itemAmount}>{fmt(item.amount)}원</Text>
              <TouchableOpacity style={s.deleteBtn}>
                <Text style={s.deleteBtnText}>✕</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      ))}

      {/* 항목 추가 */}
      <View style={[s.card, { borderWidth: 2, borderStyle: 'dashed' }]}>
        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
          <TextInput style={[s.input, { flex: 1 }]} placeholder="항목명" placeholderTextColor="#5A6A82" value={newItemName} onChangeText={setNewItemName} />
          <TextInput style={[s.input, { flex: 1 }]} placeholder="금액" placeholderTextColor="#5A6A82" keyboardType="number-pad" value={newItemAmount} onChangeText={setNewItemAmount} />
          <TouchableOpacity style={s.addBtn}>
            <Text style={s.addBtnText}>추가</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 납부 현황 */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 20, marginBottom: 8 }}>
        <Text style={s.sectionTitle}>납부 현황</Text>
        {unpaidCount > 0 && (
          <TouchableOpacity style={s.pushAllBtn}>
            <Text style={s.pushAllBtnText}>📲 미납 전체 알림</Text>
          </TouchableOpacity>
        )}
      </View>

      {MOCK_UNITS.map((u, i) => (
        <View key={i} style={s.card}>
          <View style={s.unitRow}>
            <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
              <Text style={s.unitHo}>{u.ho}</Text>
              <Text style={s.unitName}>{u.name || '미등록'}</Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
              {u.paid ? (
                <View style={[s.badge, { backgroundColor: 'rgba(30,176,106,0.15)' }]}>
                  <Text style={[s.badgeText, { color: '#1EB06A' }]}>납부완료</Text>
                </View>
              ) : (
                <>
                  <View style={[s.badge, { backgroundColor: 'rgba(229,66,58,0.15)' }]}>
                    <Text style={[s.badgeText, { color: '#E5423A' }]}>미납</Text>
                  </View>
                  <TouchableOpacity style={s.pushBtn}>
                    <Text style={s.pushBtnText}>📲</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        </View>
      ))}

      {/* 고지 발송 버튼 */}
      <TouchableOpacity style={s.publishBtn}>
        <Text style={s.publishBtnText}>📤 관리비 고지 발송</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F1B33', padding: 20, paddingTop: 10 },
  summaryCard: { backgroundColor: '#1E3264', borderRadius: 16, padding: 24, alignItems: 'center', marginBottom: 16 },
  summaryLabel: { fontSize: 12, color: 'rgba(255,255,255,0.5)', fontWeight: '600' },
  summaryAmount: { fontSize: 32, fontWeight: '900', color: '#fff', marginVertical: 8 },
  summaryWon: { fontSize: 15 },
  summaryMeta: { fontSize: 13, color: 'rgba(255,255,255,0.4)' },
  badgeRow: { flexDirection: 'row', gap: 8, marginTop: 14 },
  badge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#8893A7', marginBottom: 8 },
  card: { backgroundColor: '#182744', borderWidth: 1, borderColor: '#243555', borderRadius: 14, padding: 12, marginBottom: 8 },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  itemName: { fontSize: 14, fontWeight: '700', color: '#E0E4EA' },
  itemAmount: { fontSize: 14, fontWeight: '800', color: '#fff' },
  deleteBtn: { width: 28, height: 28, borderRadius: 8, borderWidth: 1, borderColor: '#243555', alignItems: 'center', justifyContent: 'center' },
  deleteBtnText: { color: '#8893A7', fontSize: 14 },
  input: { backgroundColor: '#1A2D4D', borderWidth: 1, borderColor: '#243555', borderRadius: 10, padding: 10, fontSize: 13, color: '#E0E4EA' },
  addBtn: { backgroundColor: '#3B5BDB', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10 },
  addBtnText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  unitRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  unitHo: { fontSize: 14, fontWeight: '700', color: '#E0E4EA' },
  unitName: { fontSize: 12, color: '#8893A7' },
  pushBtn: { backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: '#243555', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  pushBtnText: { fontSize: 11 },
  pushAllBtn: { backgroundColor: '#FF6434', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6 },
  pushAllBtnText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  publishBtn: { backgroundColor: '#FF6434', borderRadius: 14, paddingVertical: 15, alignItems: 'center', marginTop: 16 },
  publishBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
