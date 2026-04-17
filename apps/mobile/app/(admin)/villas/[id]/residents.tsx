import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';

const MOCK_UNITS = [
  { ho: '101호', name: '김민수', phone: '010-1234-5678' },
  { ho: '102호', name: '이서희', phone: '010-2345-6789' },
  { ho: '201호', name: '박준영', phone: '010-3456-7890' },
  { ho: '202호', name: '최수연', phone: '010-4567-8901' },
  { ho: '301호', name: '', phone: '' },
  { ho: '302호', name: '강하준', phone: '010-6789-0123' },
  { ho: '401호', name: '', phone: '' },
  { ho: '402호', name: '윤서영', phone: '010-8901-2345' },
];

export default function VillaResidentsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const registered = MOCK_UNITS.filter(u => u.name).length;

  return (
    <ScrollView style={s.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <Text style={s.summary}>{MOCK_UNITS.length}세대 · 등록 {registered} / 미등록 {MOCK_UNITS.length - registered}</Text>

      {MOCK_UNITS.map((u, i) => (
        <View key={i} style={s.card}>
          <View style={s.row}>
            <View style={[s.hoCircle, { backgroundColor: u.name ? 'rgba(30,176,106,0.15)' : 'rgba(255,255,255,0.06)' }]}>
              <Text style={[s.hoText, { color: u.name ? '#1EB06A' : '#8893A7' }]}>{u.ho.replace('호', '')}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.hoLabel}>{u.ho}</Text>
              {u.name ? (
                <Text style={s.resInfo}>{u.name} · {u.phone}</Text>
              ) : (
                <Text style={[s.resInfo, { color: '#FF6434' }]}>미등록</Text>
              )}
            </View>
            <TouchableOpacity style={s.editBtn} onPress={() => setEditingIdx(editingIdx === i ? null : i)}>
              <Text style={s.editBtnText}>{u.name ? '수정' : '등록'}</Text>
            </TouchableOpacity>
          </View>

          {editingIdx === i && (
            <View style={s.editArea}>
              <View style={s.editRow}>
                <TextInput style={[s.input, { flex: 1 }]} placeholder="이름" placeholderTextColor="#5A6A82" defaultValue={u.name} />
                <TextInput style={[s.input, { flex: 1 }]} placeholder="전화번호" placeholderTextColor="#5A6A82" defaultValue={u.phone} keyboardType="phone-pad" />
              </View>
              <View style={s.editRow}>
                <TouchableOpacity style={s.saveBtn}><Text style={s.saveBtnText}>저장</Text></TouchableOpacity>
                <TouchableOpacity style={s.cancelBtn} onPress={() => setEditingIdx(null)}><Text style={s.cancelBtnText}>취소</Text></TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      ))}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F1B33', padding: 20, paddingTop: 10 },
  summary: { fontSize: 13, color: '#8893A7', marginBottom: 14 },
  card: { backgroundColor: '#182744', borderWidth: 1, borderColor: '#243555', borderRadius: 14, padding: 14, marginBottom: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  hoCircle: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  hoText: { fontSize: 14, fontWeight: '800' },
  hoLabel: { fontSize: 15, fontWeight: '800', color: '#fff' },
  resInfo: { fontSize: 12, color: '#8893A7', marginTop: 2 },
  editBtn: { backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: '#243555', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6 },
  editBtnText: { fontSize: 11, color: '#8893A7', fontWeight: '600' },
  editArea: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#243555' },
  editRow: { flexDirection: 'row', gap: 6, marginBottom: 8 },
  input: { backgroundColor: '#1A2D4D', borderWidth: 1, borderColor: '#243555', borderRadius: 10, padding: 10, fontSize: 13, color: '#E0E4EA' },
  saveBtn: { backgroundColor: '#3B5BDB', borderRadius: 10, paddingHorizontal: 16, paddingVertical: 8 },
  saveBtnText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  cancelBtn: { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#243555', borderRadius: 10, paddingHorizontal: 16, paddingVertical: 8 },
  cancelBtnText: { color: '#8893A7', fontSize: 12, fontWeight: '600' },
});
