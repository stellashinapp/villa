import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useState, useEffect } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { store, subscribe, addParking, removeParking } from '@/lib/store';
import VillaSectionHeader from '@/components/VillaSectionHeader';
import { confirmAction } from '@/lib/confirm';
import { showToast } from '@/lib/toast';

const C = {
  bg: '#F5F6FA',
  card: '#FFFFFF',
  border: '#E8EBF0',
  inputBg: '#F0F2F6',
  inputBorder: '#E5E7EB',
  pri: '#4263E8',
  priL: '#E8EEFB',
  text: '#1A1D26',
  sub: '#6B7280',
  muted: '#9CA3AF',
  ok: '#4CAF50',
  okL: 'rgba(76,175,80,0.10)',
  err: '#E74C3C',
  errL: 'rgba(231,76,60,0.08)',
};

export default function VillaParkingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [_, setTick] = useState(0);
  useEffect(() => subscribe(() => setTick(t => t + 1)), []);

  const villa = store.villas.find(v => v.id === id);

  // 호실별 입력 중인 차량번호 (편집 모드)
  const [editing, setEditing] = useState<Record<string, string>>({});
  const [pendingHo, setPendingHo] = useState<string | null>(null); // 새로 등록 중인 호실

  if (!villa) {
    return (
      <View style={[s.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: C.sub, fontSize: 16 }}>빌라를 찾을 수 없습니다</Text>
      </View>
    );
  }

  // 호실별 입주민 차량 목록 (방문차량 제외)
  const carsByHo: Record<string, Array<{ id: string; plate: string }>> = {};
  villa.parking
    .filter(p => p.type === 'resident')
    .forEach(p => {
      (carsByHo[p.ho] = carsByHo[p.ho] ?? []).push({ id: p.id, plate: p.plate });
    });

  const totalUnits = villa.units.length;
  const withCar = villa.units.filter(u => (carsByHo[u.ho] ?? []).length > 0).length;
  const withoutCar = totalUnits - withCar;

  function startAdd(ho: string) {
    setPendingHo(ho);
    setEditing(prev => ({ ...prev, [ho]: '' }));
  }

  function cancelAdd(ho: string) {
    setPendingHo(null);
    setEditing(prev => {
      const next = { ...prev };
      delete next[ho];
      return next;
    });
  }

  function saveCar(ho: string) {
    const plate = (editing[ho] ?? '').trim();
    if (!plate) {
      showToast('차량번호를 입력해주세요', 'warn');
      return;
    }
    addParking(id!, ho, plate, 'resident');
    showToast(`${ho} 차량 등록 완료`, 'success');
    setPendingHo(null);
    setEditing(prev => {
      const next = { ...prev };
      delete next[ho];
      return next;
    });
  }

  async function handleRemoveCar(carId: string, plate: string, ho: string) {
    const ok = await confirmAction({
      title: '차량 삭제',
      message: `${ho} ${plate} 차량을 삭제하시겠습니까?`,
      confirmText: '삭제',
      destructive: true,
    });
    if (!ok) return;
    removeParking(id!, carId);
    showToast(`${plate} 삭제 완료`, 'success');
  }

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <VillaSectionHeader villaName={villa.name} section="주차" />
      <ScrollView style={s.container} contentContainerStyle={{ paddingTop: 16, paddingBottom: 40 }}>
        {/* 요약 */}
        <View style={s.summaryRow}>
          <View style={s.summaryCard}>
            <Text style={[s.summaryValue, { color: C.text }]}>{totalUnits}</Text>
            <Text style={s.summaryLabel}>총 세대</Text>
          </View>
          <View style={s.summaryCard}>
            <Text style={[s.summaryValue, { color: C.ok }]}>{withCar}</Text>
            <Text style={s.summaryLabel}>차량 등록</Text>
          </View>
          <View style={s.summaryCard}>
            <Text style={[s.summaryValue, { color: C.muted }]}>{withoutCar}</Text>
            <Text style={s.summaryLabel}>미등록</Text>
          </View>
        </View>

        {/* 호실별 차량 */}
        <Text style={s.sectionTitle}>호실별 차량</Text>
        {villa.units.map(unit => {
          const cars = carsByHo[unit.ho] ?? [];
          const isEditing = pendingHo === unit.ho;
          const hasCar = cars.length > 0;
          return (
            <View key={unit.ho} style={s.unitCard}>
              <View style={s.unitHeader}>
                <View style={[s.hoCircle, { backgroundColor: hasCar ? C.okL : C.inputBg }]}>
                  <Text style={[s.hoCircleText, { color: hasCar ? C.ok : C.muted }]}>
                    {unit.ho.replace('호', '')}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.hoLabel}>{unit.ho}</Text>
                  <Text style={s.resName}>{unit.name || '미등록'}</Text>
                </View>
                {!isEditing && (
                  hasCar ? (
                    <View style={[s.statusBadge, { backgroundColor: C.okL }]}>
                      <Text style={[s.statusBadgeText, { color: C.ok }]}>차량 {cars.length}대</Text>
                    </View>
                  ) : (
                    <View style={[s.statusBadge, { backgroundColor: C.inputBg }]}>
                      <Text style={[s.statusBadgeText, { color: C.muted }]}>차량 없음</Text>
                    </View>
                  )
                )}
              </View>

              {/* 등록된 차량 목록 */}
              {hasCar && (
                <View style={s.carsList}>
                  {cars.map(c => (
                    <View key={c.id} style={s.carRow}>
                      <Text style={s.carIcon}>🚗</Text>
                      <Text style={s.carPlate}>{c.plate}</Text>
                      <TouchableOpacity
                        style={s.removeBtn}
                        onPress={() => handleRemoveCar(c.id, c.plate, unit.ho)}
                      >
                        <Text style={s.removeBtnText}>삭제</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}

              {/* 차량 추가 입력란 */}
              {isEditing ? (
                <View style={s.editRow}>
                  <TextInput
                    style={s.input}
                    placeholder="차량번호 (예: 12가 3456)"
                    placeholderTextColor={C.muted}
                    value={editing[unit.ho] ?? ''}
                    onChangeText={t => setEditing(prev => ({ ...prev, [unit.ho]: t }))}
                    autoFocus
                  />
                  <TouchableOpacity style={s.saveBtn} onPress={() => saveCar(unit.ho)}>
                    <Text style={s.saveBtnText}>저장</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={s.cancelBtn} onPress={() => cancelAdd(unit.ho)}>
                    <Text style={s.cancelBtnText}>취소</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity style={s.addBtn} onPress={() => startAdd(unit.ho)}>
                  <Text style={s.addBtnText}>+ 차량 추가</Text>
                </TouchableOpacity>
              )}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg, paddingHorizontal: 20 },
  summaryRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  summaryCard: {
    flex: 1, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 14, padding: 14, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  summaryValue: { fontSize: 22, fontWeight: '900' },
  summaryLabel: { fontSize: 11, color: C.sub, marginTop: 2 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: C.sub, marginBottom: 10 },

  unitCard: {
    backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 14, padding: 14, marginBottom: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  unitHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  hoCircle: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  hoCircleText: { fontSize: 13, fontWeight: '800' },
  hoLabel: { fontSize: 15, fontWeight: '800', color: C.text },
  resName: { fontSize: 12, color: C.sub, marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusBadgeText: { fontSize: 11, fontWeight: '700' },

  carsList: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: C.border,
    gap: 8,
  },
  carRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: C.priL,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  carIcon: { fontSize: 16 },
  carPlate: { flex: 1, fontSize: 14, fontWeight: '700', color: C.text },
  removeBtn: {
    backgroundColor: C.errL,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  removeBtnText: { fontSize: 11, color: C.err, fontWeight: '700' },

  editRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  input: {
    flex: 1,
    backgroundColor: C.inputBg,
    borderWidth: 1,
    borderColor: C.inputBorder,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: C.text,
  },
  saveBtn: { backgroundColor: C.pri, borderRadius: 10, paddingHorizontal: 14, justifyContent: 'center' },
  saveBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  cancelBtn: {
    borderWidth: 1, borderColor: C.border, borderRadius: 10, paddingHorizontal: 12, justifyContent: 'center',
  },
  cancelBtnText: { color: C.sub, fontSize: 13, fontWeight: '600' },

  addBtn: {
    marginTop: 12,
    paddingTop: 12,
    paddingBottom: 4,
    borderTopWidth: 1,
    borderTopColor: C.border,
    alignItems: 'center',
  },
  addBtnText: { color: C.pri, fontSize: 13, fontWeight: '700' },
});
