import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert } from 'react-native';
import { store, subscribe, addParking, removeParking } from '@/lib/store';

export default function ParkingScreen() {
  const [_, setTick] = useState(0);
  useEffect(() => subscribe(() => setTick(t => t + 1)), []);

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

  const myCars = villa.parking.filter(p => p.ho === resident.ho);
  const residentCars = villa.parking.filter(p => p.type === 'resident');
  const visitorCars = villa.parking.filter(p => p.type === 'visitor');

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 100 }}>
      <View style={styles.header}>
        <Text style={styles.title}>주차</Text>
        <Text style={styles.headerSub}>{villa.name}</Text>
      </View>

      {/* My Cars */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>내 등록 차량</Text>
        {myCars.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyCardTitle}>등록된 차량이 없습니다</Text>
            <Text style={styles.emptyCardSub}>관리자에게 차량 등록을 요청하세요</Text>
          </View>
        ) : (
          myCars.map(car => (
            <View key={car.id} style={styles.carCard}>
              <View style={styles.carRow}>
                <Text style={styles.plateNumber}>{car.plate}</Text>
                <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                  <View style={[styles.typeBadge, car.type === 'visitor' ? styles.visitorBadge : styles.residentBadge]}>
                    <Text style={[styles.typeBadgeText, car.type === 'visitor' ? styles.visitorBadgeText : styles.residentBadgeText]}>
                      {car.type === 'visitor' ? '방문' : '입주민'}
                    </Text>
                  </View>
                  {car.type === 'visitor' && (
                    <TouchableOpacity onPress={() => {
                      Alert.alert('삭제', `${car.plate} 방문차량을 삭제하시겠습니까?`, [
                        { text: '취소' },
                        { text: '삭제', style: 'destructive', onPress: () => removeParking(villa!.id, car.id) },
                      ]);
                    }}>
                      <Text style={{ fontSize: 14, color: '#E74C3C' }}>삭제</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
              <View style={styles.carMeta}>
                <Text style={styles.carHo}>{car.ho}</Text>
                {car.memo ? <Text style={styles.carMemo}>{car.memo}</Text> : null}
              </View>
            </View>
          ))
        )}
      </View>

      {/* 방문차량 등록 */}
      <VisitorForm villaId={villa.id} ho={resident.ho} />

      {/* All Villa Cars */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>우리 빌라 등록 차량</Text>

        <Text style={styles.subSectionTitle}>입주민 차량 ({residentCars.length})</Text>
        {residentCars.length === 0 ? (
          <Text style={styles.noDataText}>등록된 입주민 차량이 없습니다</Text>
        ) : (
          residentCars.map(car => (
            <View key={car.id} style={styles.carCard}>
              <View style={styles.carRow}>
                <Text style={styles.plateNumber}>{car.plate}</Text>
                <View style={[styles.typeBadge, styles.residentBadge]}>
                  <Text style={[styles.typeBadgeText, styles.residentBadgeText]}>입주민</Text>
                </View>
              </View>
              <View style={styles.carMeta}>
                <Text style={styles.carHo}>{car.ho}</Text>
              </View>
            </View>
          ))
        )}

        <Text style={[styles.subSectionTitle, { marginTop: 16 }]}>방문 차량 ({visitorCars.length})</Text>
        {visitorCars.length === 0 ? (
          <Text style={styles.noDataText}>등록된 방문 차량이 없습니다</Text>
        ) : (
          visitorCars.map(car => (
            <View key={car.id} style={styles.carCard}>
              <View style={styles.carRow}>
                <Text style={styles.plateNumber}>{car.plate}</Text>
                <View style={[styles.typeBadge, styles.visitorBadge]}>
                  <Text style={[styles.typeBadgeText, styles.visitorBadgeText]}>방문</Text>
                </View>
              </View>
              <View style={styles.carMeta}>
                <Text style={styles.carHo}>{car.ho}</Text>
                {car.memo ? <Text style={styles.carMemo}>{car.memo}</Text> : null}
              </View>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

function VisitorForm({ villaId, ho }: { villaId: string; ho: string }) {
  const [plate, setPlate] = useState('');
  const [memo, setMemo] = useState('');

  function handleRegister() {
    if (!plate.trim()) { Alert.alert('알림', '차량번호를 입력하세요'); return; }
    addParking(villaId, ho, plate.trim(), 'visitor', memo.trim() || `${ho} 방문차량`);
    setPlate('');
    setMemo('');
    Alert.alert('등록 완료', '방문차량이 등록되었습니다');
  }

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>방문차량 등록</Text>
      <View style={styles.formCard}>
        <Text style={styles.formLabel}>차량번호 *</Text>
        <TextInput
          style={styles.formInput}
          placeholder="예: 12가 3456"
          placeholderTextColor="#9CA3AF"
          value={plate}
          onChangeText={setPlate}
        />
        <Text style={styles.formLabel}>메모 (선택)</Text>
        <TextInput
          style={styles.formInput}
          placeholder="예: 택배차량, 이사 등"
          placeholderTextColor="#9CA3AF"
          value={memo}
          onChangeText={setMemo}
        />
        <TouchableOpacity style={styles.registerBtn} onPress={handleRegister}>
          <Text style={styles.registerBtnText}>등록</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F6FA' },
  header: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 12 },
  title: { fontSize: 22, fontWeight: '900', color: '#1A1D26' },
  headerSub: { fontSize: 13, color: '#6B7280', marginTop: 2 },

  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontSize: 15, color: '#6B7280', fontWeight: '600' },

  section: { marginHorizontal: 16, marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#1A1D26', marginBottom: 12 },
  subSectionTitle: { fontSize: 13, fontWeight: '700', color: '#6B7280', marginBottom: 8 },

  noDataText: { fontSize: 13, color: '#9CA3AF', marginBottom: 8, marginLeft: 4 },

  carCard: {
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
  carRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  plateNumber: { fontSize: 18, fontWeight: '900', color: '#1A1D26', letterSpacing: 1 },
  carMeta: { flexDirection: 'row', gap: 8 },
  carHo: { fontSize: 13, fontWeight: '600', color: '#3454D1' },
  carMemo: { fontSize: 13, color: '#6B7280' },

  typeBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  residentBadge: { backgroundColor: '#E8EEFB' },
  visitorBadge: { backgroundColor: '#F39C1222' },
  typeBadgeText: { fontSize: 11, fontWeight: '700' },
  residentBadgeText: { color: '#3454D1' },
  visitorBadgeText: { color: '#F39C12' },

  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E8EBF0',
  },
  emptyCardTitle: { fontSize: 15, fontWeight: '700', color: '#1A1D26', marginBottom: 4 },
  emptyCardSub: { fontSize: 13, color: '#9CA3AF' },

  formCard: {
    backgroundColor: '#FFFFFF', borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: '#E8EBF0',
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  formLabel: { fontSize: 13, fontWeight: '700', color: '#374151', marginBottom: 6, marginTop: 8 },
  formInput: {
    backgroundColor: '#F0F2F6', borderWidth: 1, borderColor: '#E5E7EB',
    borderRadius: 10, padding: 13, fontSize: 15, color: '#1A1D26',
  },
  registerBtn: { backgroundColor: '#4A6CF7', borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 14 },
  registerBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
