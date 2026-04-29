import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useState, useEffect } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { router } from 'expo-router';
import { store, subscribe, registerResident } from '@/lib/store';

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
  accent: '#FF6B35',
};

export default function VillaResidentsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [_, setTick] = useState(0);
  useEffect(() => subscribe(() => setTick(t => t + 1)), []);

  const villa = store.villas.find(v => v.id === id);

  const [editingHo, setEditingHo] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');

  if (!villa) {
    return (
      <View style={[s.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: C.sub, fontSize: 16 }}>빌라를 찾을 수 없습니다</Text>
      </View>
    );
  }

  const registered = villa.units.filter(u => u.name).length;

  const startEditing = (ho: string, name: string, phone: string) => {
    setEditingHo(ho);
    setEditName(name);
    setEditPhone(phone);
  };

  const handleSave = (ho: string) => {
    const name = editName.trim();
    const phone = editPhone.trim();
    if (!name) {
      Alert.alert('오류', '이름을 입력하세요');
      return;
    }
    if (!phone) {
      Alert.alert('오류', '전화번호를 입력하세요');
      return;
    }
    registerResident(id!, ho, name, phone);
    setEditingHo(null);
    Alert.alert('완료', `${ho} 입주민 정보가 저장되었습니다.`);
  };

  return (
    <ScrollView style={s.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <Text style={s.summary}>{villa.units.length}세대 · 등록 {registered} / 미등록 {villa.units.length - registered}</Text>

      {villa.units.map((u) => (
        <View key={u.ho} style={s.card}>
          <View style={s.row}>
            <View style={[s.hoCircle, { backgroundColor: u.name ? 'rgba(76,175,80,0.08)' : '#F0F2F6' }]}>
              <Text style={[s.hoText, { color: u.name ? C.ok : C.muted }]}>{u.ho.replace('호', '')}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.hoLabel}>{u.ho}</Text>
              {u.name ? (
                <Text style={s.resInfo}>{u.name} · {u.phone}</Text>
              ) : (
                <Text style={[s.resInfo, { color: C.accent }]}>미등록</Text>
              )}
            </View>
            <TouchableOpacity
              style={s.editBtn}
              onPress={() => editingHo === u.ho ? setEditingHo(null) : startEditing(u.ho, u.name, u.phone)}
            >
              <Text style={s.editBtnText}>{u.name ? '수정' : '등록'}</Text>
            </TouchableOpacity>
          </View>

          {editingHo === u.ho && (
            <View style={s.editArea}>
              <View style={s.editRow}>
                <TextInput
                  style={[s.input, { flex: 1 }]}
                  placeholder="이름"
                  placeholderTextColor={C.muted}
                  value={editName}
                  onChangeText={setEditName}
                />
                <TextInput
                  style={[s.input, { flex: 1 }]}
                  placeholder="전화번호"
                  placeholderTextColor={C.muted}
                  value={editPhone}
                  onChangeText={setEditPhone}
                  keyboardType="phone-pad"
                />
              </View>
              <View style={s.editRow}>
                <TouchableOpacity style={s.saveBtn} onPress={() => handleSave(u.ho)}>
                  <Text style={s.saveBtnText}>저장</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.cancelBtn} onPress={() => setEditingHo(null)}>
                  <Text style={s.cancelBtnText}>취소</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      ))}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg, padding: 20, paddingTop: 10 },
  summary: { fontSize: 13, color: C.sub, marginBottom: 14 },
  card: {
    backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 14, padding: 14, marginBottom: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  hoCircle: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  hoText: { fontSize: 14, fontWeight: '800' },
  hoLabel: { fontSize: 15, fontWeight: '800', color: C.text },
  resInfo: { fontSize: 12, color: C.sub, marginTop: 2 },
  editBtn: { backgroundColor: '#F0F2F6', borderWidth: 1, borderColor: C.border, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6 },
  editBtnText: { fontSize: 11, color: C.sub, fontWeight: '600' },
  editArea: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: C.border },
  editRow: { flexDirection: 'row', gap: 6, marginBottom: 8 },
  input: { backgroundColor: C.inputBg, borderWidth: 1, borderColor: C.inputBorder, borderRadius: 10, padding: 10, fontSize: 13, color: C.text },
  saveBtn: { backgroundColor: C.pri, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 8 },
  saveBtnText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  cancelBtn: { backgroundColor: 'transparent', borderWidth: 1, borderColor: C.border, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 8 },
  cancelBtnText: { color: C.sub, fontSize: 12, fontWeight: '600' },
});
