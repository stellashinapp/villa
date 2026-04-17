import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity } from 'react-native';
import { useState } from 'react';

const MOCK_PARKING = [
  { id: 1, ho: '101호', plate: '12가 3456', type: 'resident' as const },
  { id: 2, ho: '201호', plate: '34나 7890', type: 'resident' as const },
  { id: 3, ho: '방문', plate: '56다 1234', type: 'visitor' as const, memo: '102호 손님', until: '18:00' },
];

export default function VillaParkingScreen() {
  const [plate, setPlate] = useState('');
  const residents = MOCK_PARKING.filter(p => p.type === 'resident');
  const visitors = MOCK_PARKING.filter(p => p.type === 'visitor');

  return (
    <ScrollView style={s.container} contentContainerStyle={{ paddingBottom: 40 }}>
      {/* 요약 카드 */}
      <View style={s.summaryRow}>
        {[
          { icon: '🚗', value: MOCK_PARKING.length, label: '전체 등록', color: '#fff' },
          { icon: '🏠', value: residents.length, label: '입주민', color: '#1EB06A' },
          { icon: '👤', value: visitors.length, label: '방문차량', color: '#F0A722' },
        ].map((item, i) => (
          <View key={i} style={s.summaryCard}>
            <Text style={{ fontSize: 24, marginBottom: 4 }}>{item.icon}</Text>
            <Text style={[s.summaryValue, { color: item.color }]}>{item.value}</Text>
            <Text style={s.summaryLabel}>{item.label}</Text>
          </View>
        ))}
      </View>

      {/* 등록 폼 */}
      <View style={[s.card, { borderWidth: 2, borderStyle: 'dashed' }]}>
        <Text style={s.formTitle}>🚗 차량 등록</Text>
        <View style={s.formRow}>
          <TextInput style={[s.input, { flex: 1 }]} placeholder="차량번호 (예: 12가 3456)" placeholderTextColor="#5A6A82" value={plate} onChangeText={setPlate} />
        </View>
        <View style={s.formRow}>
          <TextInput style={[s.input, { flex: 1 }]} placeholder="메모 (선택)" placeholderTextColor="#5A6A82" />
        </View>
        <TouchableOpacity style={s.registerBtn}>
          <Text style={s.registerBtnText}>등록</Text>
        </TouchableOpacity>
      </View>

      {/* 차량 목록 */}
      <Text style={s.sectionTitle}>등록된 차량</Text>
      {MOCK_PARKING.map(p => (
        <View key={p.id} style={s.card}>
          <View style={s.parkingRow}>
            <View style={[s.parkingIcon, { backgroundColor: p.type === 'visitor' ? 'rgba(240,167,34,0.15)' : 'rgba(59,91,219,0.15)' }]}>
              <Text style={{ fontSize: 18 }}>🚗</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.plateText}>{p.plate}</Text>
              <Text style={s.parkingMeta}>{p.ho}{p.memo ? ` · ${p.memo}` : ''}{p.until ? ` · ~${p.until}` : ''}</Text>
            </View>
            <View style={[s.typeBadge, { backgroundColor: p.type === 'visitor' ? 'rgba(240,167,34,0.15)' : 'rgba(59,91,219,0.15)' }]}>
              <Text style={[s.typeBadgeText, { color: p.type === 'visitor' ? '#F0A722' : '#3B5BDB' }]}>
                {p.type === 'visitor' ? '방문차량' : '입주민'}
              </Text>
            </View>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F1B33', padding: 20, paddingTop: 10 },
  summaryRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  summaryCard: { flex: 1, backgroundColor: '#182744', borderWidth: 1, borderColor: '#243555', borderRadius: 14, padding: 14, alignItems: 'center' },
  summaryValue: { fontSize: 22, fontWeight: '900' },
  summaryLabel: { fontSize: 11, color: '#8893A7', marginTop: 2 },
  card: { backgroundColor: '#182744', borderWidth: 1, borderColor: '#243555', borderRadius: 14, padding: 16, marginBottom: 8 },
  formTitle: { fontSize: 14, fontWeight: '700', color: '#fff', marginBottom: 10 },
  formRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  input: { backgroundColor: '#1A2D4D', borderWidth: 1, borderColor: '#243555', borderRadius: 10, padding: 10, fontSize: 13, color: '#E0E4EA' },
  registerBtn: { backgroundColor: '#3B5BDB', borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  registerBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#8893A7', marginTop: 8, marginBottom: 10 },
  parkingRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  parkingIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  plateText: { fontSize: 15, fontWeight: '800', color: '#fff' },
  parkingMeta: { fontSize: 12, color: '#8893A7', marginTop: 2 },
  typeBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
  typeBadgeText: { fontSize: 11, fontWeight: '600' },
});
