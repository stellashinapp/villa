import { View, Text, StyleSheet, ScrollView } from 'react-native';

type Notice = {
  id: string;
  title: string;
  body: string;
  date: string;
  isNew: boolean;
};

const NOTICES: Notice[] = [
  {
    id: '1',
    title: '4월 승강기 정기점검 안내',
    body: '4월 18일(토) 오전 9시~12시까지 승강기 정기점검이 진행됩니다.\n점검 시간 동안 승강기 이용이 제한되오니 양해 부탁드립니다.\n비상 시 계단을 이용해 주세요.',
    date: '2026.04.15',
    isNew: true,
  },
  {
    id: '2',
    title: '주차장 라인 재도색 공사 안내',
    body: '4월 20일(월)~21일(화) 이틀간 주차장 라인 재도색 공사가 진행됩니다.\n공사 기간 중 지하주차장 이용이 제한될 수 있으니 가급적 외부 주차를 부탁드립니다.',
    date: '2026.04.12',
    isNew: true,
  },
  {
    id: '3',
    title: '3월 관리비 납부 안내',
    body: '3월 관리비 고지서가 발행되었습니다.\n납부기한: 2026년 3월 25일까지\n국민은행 123-456-789012 (빌라톡관리비)',
    date: '2026.03.10',
    isNew: false,
  },
  {
    id: '4',
    title: '봄맞이 소독/방역 실시 안내',
    body: '3월 28일(토) 오전 10시부터 전 세대 및 공용부 소독/방역이 실시됩니다.\n소독 후 2시간 정도 환기를 부탁드립니다.',
    date: '2026.03.05',
    isNew: false,
  },
  {
    id: '5',
    title: '택배 보관함 이용 안내',
    body: '1층 택배 보관함이 설치되었습니다.\n비밀번호는 각 세대별 현관 비밀번호와 동일합니다.\n3일 이상 미수령 시 관리실로 이동됩니다.',
    date: '2026.02.20',
    isNew: false,
  },
];

export default function NoticesScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 100 }}>
      <View style={styles.header}>
        <Text style={styles.title}>공지</Text>
      </View>

      {NOTICES.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>📢</Text>
          <Text style={styles.emptyText}>공지사항이 없습니다</Text>
        </View>
      ) : (
        <View style={styles.list}>
          {NOTICES.map((notice) => (
            <View key={notice.id} style={styles.card}>
              <View style={styles.cardHeader}>
                {notice.isNew && (
                  <View style={styles.newBadge}>
                    <Text style={styles.newBadgeText}>NEW</Text>
                  </View>
                )}
                <Text style={styles.cardDate}>{notice.date}</Text>
              </View>
              <Text style={styles.cardTitle}>{notice.title}</Text>
              <Text style={styles.cardBody}>{notice.body}</Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F8' },
  header: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 12 },
  title: { fontSize: 22, fontWeight: '900', color: '#181A20' },

  list: { paddingHorizontal: 16 },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#EAEBEF',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 8 },
  newBadge: {
    backgroundColor: '#E5423A',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  newBadgeText: { color: '#FFFFFF', fontSize: 10, fontWeight: '800' },
  cardDate: { fontSize: 12, color: '#B8BBC2' },
  cardTitle: { fontSize: 15, fontWeight: '800', color: '#181A20', marginBottom: 8 },
  cardBody: { fontSize: 13, color: '#7C7F87', lineHeight: 20 },

  emptyContainer: { alignItems: 'center', paddingTop: 80 },
  emptyIcon: { fontSize: 40, marginBottom: 12 },
  emptyText: { fontSize: 15, color: '#B8BBC2', fontWeight: '600' },
});
