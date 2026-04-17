import { View, Text, StyleSheet, ScrollView } from 'react-native';

type Car = {
  plate: string;
  ho: string;
  type: 'resident' | 'visitor';
  owner?: string;
};

const MY_CARS: Car[] = [
  { plate: '12가 3456', ho: '301호', type: 'resident', owner: '김민수' },
];

const RESIDENT_CARS: Car[] = [
  { plate: '12가 3456', ho: '301호', type: 'resident', owner: '김민수' },
  { plate: '34나 7890', ho: '201호', type: 'resident', owner: '이영희' },
  { plate: '56다 1234', ho: '402호', type: 'resident', owner: '박준혁' },
  { plate: '78라 5678', ho: '102호', type: 'resident', owner: '최수진' },
  { plate: '90마 9012', ho: '502호', type: 'resident', owner: '정대현' },
];

const VISITOR_CARS: Car[] = [
  { plate: '11바 2222', ho: '301호', type: 'visitor', owner: '방문객' },
  { plate: '22사 3333', ho: '201호', type: 'visitor', owner: '택배차량' },
];

function CarCard({ car }: { car: Car }) {
  const isVisitor = car.type === 'visitor';
  return (
    <View style={styles.carCard}>
      <View style={styles.carRow}>
        <Text style={styles.plateNumber}>{car.plate}</Text>
        <View style={[styles.typeBadge, isVisitor ? styles.visitorBadge : styles.residentBadge]}>
          <Text
            style={[
              styles.typeBadgeText,
              isVisitor ? styles.visitorBadgeText : styles.residentBadgeText,
            ]}
          >
            {isVisitor ? '방문' : '입주민'}
          </Text>
        </View>
      </View>
      <View style={styles.carMeta}>
        <Text style={styles.carHo}>{car.ho}</Text>
        {car.owner ? <Text style={styles.carOwner}>{car.owner}</Text> : null}
      </View>
    </View>
  );
}

export default function ParkingScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 100 }}>
      <View style={styles.header}>
        <Text style={styles.title}>주차</Text>
      </View>

      {/* My Cars */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🚗 내 등록 차량</Text>
        {MY_CARS.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>등록된 차량이 없습니다</Text>
            <Text style={styles.emptySubText}>관리자에게 차량 등록을 요청하세요</Text>
          </View>
        ) : (
          MY_CARS.map((car) => <CarCard key={car.plate} car={car} />)
        )}
      </View>

      {/* Building Cars */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🏠 우리 빌라 등록 차량</Text>

        <Text style={styles.subSectionTitle}>입주민 차량 ({RESIDENT_CARS.length})</Text>
        {RESIDENT_CARS.map((car) => (
          <CarCard key={car.plate} car={car} />
        ))}

        <Text style={[styles.subSectionTitle, { marginTop: 16 }]}>
          방문 차량 ({VISITOR_CARS.length})
        </Text>
        {VISITOR_CARS.map((car) => (
          <CarCard key={car.plate} car={car} />
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F8' },
  header: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 12 },
  title: { fontSize: 22, fontWeight: '900', color: '#181A20' },

  section: { marginHorizontal: 16, marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#181A20', marginBottom: 12 },
  subSectionTitle: { fontSize: 13, fontWeight: '700', color: '#7C7F87', marginBottom: 8 },

  carCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#EAEBEF',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  carRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  plateNumber: { fontSize: 18, fontWeight: '900', color: '#181A20', letterSpacing: 1 },
  carMeta: { flexDirection: 'row', gap: 8 },
  carHo: { fontSize: 13, fontWeight: '600', color: '#3B5BDB' },
  carOwner: { fontSize: 13, color: '#7C7F87' },

  typeBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  residentBadge: { backgroundColor: '#E8EEFB' },
  visitorBadge: { backgroundColor: '#F0A72222' },
  typeBadgeText: { fontSize: 11, fontWeight: '700' },
  residentBadgeText: { color: '#3B5BDB' },
  visitorBadgeText: { color: '#F0A722' },

  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EAEBEF',
  },
  emptyText: { fontSize: 15, fontWeight: '700', color: '#181A20', marginBottom: 4 },
  emptySubText: { fontSize: 13, color: '#B8BBC2' },
});
