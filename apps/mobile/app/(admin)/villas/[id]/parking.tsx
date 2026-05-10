import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useState, useEffect } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { router } from 'expo-router';
import { store, subscribe, addParking, removeParking } from '@/lib/store';

const C = {
  bg: '#F5F6FA',
  card: '#FFFFFF',
  border: '#E8EBF0',
  inputBg: '#F0F2F6',
  inputBorder: '#E5E7EB',
  pri: '#4263E8',
  text: '#1A1D26',
  sub: '#6B7280',
  muted: '#9CA3AF',
  ok: '#4CAF50',
  warn: '#F39C12',
  err: '#E74C3C',
};

export default function VillaParkingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [_, setTick] = useState(0);
  useEffect(() => subscribe(() => setTick(t => t + 1)), []);

  const villa = store.villas.find(v => v.id === id);

  const [ho, setHo] = useState('');
  const [plate, setPlate] = useState('');
  const [type, setType] = useState<'resident' | 'visitor'>('resident');
  const [memo, setMemo] = useState('');

  if (!villa) {
    return (
      <View style={[s.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: C.sub, fontSize: 16 }}>빌라를 찾을 수 없습니다</Text>
      </View>
    );
  }

  const residents = villa.parking.filter(p => p.type === 'resident');
  const visitors = villa.parking.filter(p => p.type === 'visitor');

  const handleRegister = () => {
    const trimHo = ho.trim();
    const trimPlate = plate.trim();
    if (!trimHo) { Alert.alert('오류', '호수를 입력하세요'); return; }
    if (!trimPlate) { Alert.alert('오류', '차량번호를 입력하세요'); return; }
    addParking(id!, trimHo, trimPlate, type, memo.trim() || undefined);
    setHo('');
    setPlate('');
    setMemo('');
    Alert.alert('완료', '차량이 등록되었습니다.');
  };

  const handleRemove = (parkingId: string, plateNum: string) => {
    Alert.alert('차량 삭제', `"${plateNum}" 차량을 삭제하시겠습니까?`, [
      { text: '취소', style: 'cancel' },
      { text: '삭제', style: 'destructive', onPress: () => { removeParking(id!, parkingId); Alert.alert('삭제 완료', `"${plateNum}" 차량이 삭제되었습니다`); } },
    ]);
  };

  return (
    <ScrollView style={s.container} contentContainerStyle={{ paddingBottom: 40 }}>
      {/* 요약 카드 */}
      <View style={s.summaryRow}>
        {[
          { label: '전체 등록', value: villa.parking.length, color: C.text },
          { label: '입주민', value: residents.length, color: C.ok },
          { label: '방문차량', value: visitors.length, color: C.warn },
        ].map((item, i) => (
          <View key={i} style={s.summaryCard}>
            <Text style={[s.summaryValue, { color: item.color }]}>{item.value}</Text>
            <Text style={s.summaryLabel}>{item.label}</Text>
          </View>
        ))}
      </View>

      {/* 등록 폼 */}
      <View style={[s.card, { borderWidth: 2, borderStyle: 'dashed' }]}>
        <Text style={s.formTitle}>차량 등록</Text>

        {/* 유형 선택 */}
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 10 }}>
          <TouchableOpacity
            style={[s.typeBtn, type === 'resident' && s.typeBtnActive]}
            onPress={() => setType('resident')}
          >
            <Text style={[s.typeBtnText, type === 'resident' && s.typeBtnTextActive]}>입주민</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.typeBtn, type === 'visitor' && s.typeBtnActive]}
            onPress={() => setType('visitor')}
          >
            <Text style={[s.typeBtnText, type === 'visitor' && s.typeBtnTextActive]}>방문차량</Text>
          </TouchableOpacity>
        </View>

        <View style={s.formRow}>
          <TextInput style={[s.input, { flex: 1 }]} placeholder="호수 (예: 101호)" placeholderTextColor={C.muted} value={ho} onChangeText={setHo} />
          <TextInput style={[s.input, { flex: 1 }]} placeholder="차량번호 (예: 12가 3456)" placeholderTextColor={C.muted} value={plate} onChangeText={setPlate} />
        </View>
        <View style={s.formRow}>
          <TextInput style={[s.input, { flex: 1 }]} placeholder="메모 (선택)" placeholderTextColor={C.muted} value={memo} onChangeText={setMemo} />
        </View>
        <TouchableOpacity style={s.registerBtn} onPress={handleRegister}>
          <Text style={s.registerBtnText}>등록</Text>
        </TouchableOpacity>
      </View>

      {/* 차량 목록 */}
      <Text style={s.sectionTitle}>등록된 차량</Text>
      {villa.parking.length === 0 && (
        <View style={s.empty}>
          <Text style={s.emptyText}>등록된 차량이 없습니다</Text>
        </View>
      )}
      {villa.parking.map(p => (
        <View key={p.id} style={s.card}>
          <View style={s.parkingRow}>
            <View style={[s.parkingIcon, { backgroundColor: p.type === 'visitor' ? 'rgba(243,156,18,0.08)' : 'rgba(52,84,209,0.08)' }]}>
              <Text style={{ fontSize: 18 }}>🚗</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.plateText}>{p.plate}</Text>
              <Text style={s.parkingMeta}>{p.ho}{p.memo ? ` · ${p.memo}` : ''}</Text>
            </View>
            <View style={[s.typeBadge, { backgroundColor: p.type === 'visitor' ? 'rgba(243,156,18,0.08)' : 'rgba(52,84,209,0.08)' }]}>
              <Text style={[s.typeBadgeText, { color: p.type === 'visitor' ? C.warn : C.pri }]}>
                {p.type === 'visitor' ? '방문차량' : '입주민'}
              </Text>
            </View>
            <TouchableOpacity style={s.removeBtn} onPress={() => handleRemove(p.id, p.plate)}>
              <Text style={s.removeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg, padding: 20, paddingTop: 10 },
  summaryRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  summaryCard: {
    flex: 1, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 14, padding: 14, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  summaryValue: { fontSize: 22, fontWeight: '900' },
  summaryLabel: { fontSize: 11, color: C.sub, marginTop: 2 },
  card: {
    backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 14, padding: 16, marginBottom: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  formTitle: { fontSize: 14, fontWeight: '700', color: C.text, marginBottom: 10 },
  formRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  input: { backgroundColor: C.inputBg, borderWidth: 1, borderColor: C.inputBorder, borderRadius: 10, padding: 10, fontSize: 13, color: C.text },
  typeBtn: { flex: 1, backgroundColor: C.inputBg, borderWidth: 1, borderColor: C.inputBorder, borderRadius: 10, paddingVertical: 8, alignItems: 'center' },
  typeBtnActive: { backgroundColor: C.pri, borderColor: C.pri },
  typeBtnText: { color: C.muted, fontSize: 13, fontWeight: '600' },
  typeBtnTextActive: { color: '#FFFFFF' },
  registerBtn: { backgroundColor: C.pri, borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  registerBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: C.sub, marginTop: 8, marginBottom: 10 },
  parkingRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  parkingIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  plateText: { fontSize: 15, fontWeight: '800', color: C.text },
  parkingMeta: { fontSize: 12, color: C.sub, marginTop: 2 },
  typeBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
  typeBadgeText: { fontSize: 11, fontWeight: '600' },
  removeBtn: { width: 28, height: 28, borderRadius: 8, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center', marginLeft: 4 },
  removeBtnText: { color: C.err, fontSize: 14 },
  empty: { alignItems: 'center', padding: 30 },
  emptyText: { color: C.muted, fontSize: 14 },
});
